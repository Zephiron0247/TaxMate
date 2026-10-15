from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import json
from typing import Optional, List, Dict, Any

from app.database import (
    init_db, 
    insert_transaction, 
    get_all_transactions, 
    get_transaction_by_id, 
    update_transaction,
    get_connection
)
from app.ocr import extract_receipt_data
from app.gst_engine import calculate_gst_itc
from app.anomaly import detect_anomalies
from app.reports import generate_gst_summary
from app.documents import create_new_document, get_documents_list, get_document_details

app = FastAPI(title="TaxMate API", description="Local-first Financial Assistant & Receipt Ledger for Small Indian Retailers")

# Add FastAPI CORSMiddleware allowing requests from Next.js dev server (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RECEIPTS_DIR = Path(__file__).parent.parent / "receipts"
RECEIPTS_DIR.mkdir(exist_ok=True)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"status": "ok", "app": "TaxMate Local AI Financial Assistant", "version": "1.0.0"}

@app.post("/scan-receipt")
async def scan_receipt(file: UploadFile = File(...), auto_save: bool = Query(False)):
    """
    Confidence-gated receipt extraction.
    Saves file, runs local Qwen3-VL OCR, evaluates GST rules engine.
    Returns extracted details for user review before final database insertion.
    """
    save_path = RECEIPTS_DIR / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    extracted = extract_receipt_data(str(save_path))

    if extracted.get("status") == "needs_manual_review" or "error" in extracted:
        return {
            "status": "needs_manual_review",
            "message": "Receipt read incomplete or needs manual verification",
            "details": extracted,
            "extracted_data": extracted.get("data", {})
        }
    
    data = extracted.get("data", {})
    vendor = data.get("vendor", "Unknown Merchant")
    amount = float(data.get("amount", 0.0))
    date_str = data.get("date", "")
    category = data.get("category", "General Business")

    # Evaluate GST and ITC rules engine
    gst_res = calculate_gst_itc(category=category, amount=amount, vendor=vendor)

    transaction_id = None
    if auto_save:
        transaction_id = insert_transaction(
            vendor=vendor,
            amount=amount,
            date=date_str,
            category=category,
            gst_rate=gst_res["gst_rate"],
            itc_eligible=1 if gst_res["itc_eligible"] else 0,
            itc_status=gst_res["itc_status"],
            itc_explanation=gst_res["explanation"],
            confidence_status="verified",
            items_json=json.dumps(data.get("items", []))
        )

    return {
        "status": "success",
        "transaction_id": transaction_id,
        "data": {
            "vendor": vendor,
            "amount": amount,
            "date": date_str,
            "category": category,
            "gst_rate": gst_res["gst_rate"],
            "itc_eligible": gst_res["itc_eligible"],
            "itc_status": gst_res["itc_status"],
            "itc_explanation": gst_res["explanation"],
            "items": data.get("items", [])
        }
    }

@app.get("/transactions")
def list_transactions():
    """
    Retrieves all stored transactions with GST metadata and anomaly status.
    """
    txs = get_all_transactions()
    
    # Check if transaction count >= 30 for IsolationForest anomaly check
    if len(txs) >= 30:
        anom_res = detect_anomalies(txs)
        anom_map = {a["transaction_id"]: a for a in anom_res.get("anomalies", [])}
        for tx in txs:
            if tx["id"] in anom_map:
                info = anom_map[tx["id"]]
                tx["is_anomaly"] = 1 if info["is_anomaly"] else 0
                tx["anomaly_score"] = info["anomaly_score"]
                tx["anomaly_reason"] = info["explanation"]
    return {"transactions": txs, "total_count": len(txs)}

@app.post("/transactions")
def create_transaction(payload: Dict[str, Any] = Body(...)):
    """
    Manually creates a new transaction and runs GST / ITC rules calculation.
    """
    vendor = payload.get("vendor", "Unknown")
    amount = float(payload.get("amount", 0.0))
    date_str = payload.get("date", "")
    category = payload.get("category", "General Business")

    # GST Rules calculation
    gst_res = calculate_gst_itc(category=category, amount=amount, vendor=vendor)

    tx_id = insert_transaction(
        vendor=vendor,
        amount=amount,
        date=date_str,
        category=category,
        gst_rate=payload.get("gst_rate", gst_res["gst_rate"]),
        itc_eligible=1 if payload.get("itc_eligible", gst_res["itc_eligible"]) else 0,
        itc_status=payload.get("itc_status", gst_res["itc_status"]),
        itc_explanation=payload.get("itc_explanation", gst_res["explanation"]),
        confidence_status=payload.get("confidence_status", "verified"),
        items_json=json.dumps(payload.get("items", []))
    )

    created_tx = get_transaction_by_id(tx_id)
    return {"status": "success", "transaction": created_tx}

@app.patch("/transactions/{tx_id}")
def update_tx(tx_id: int, updates: Dict[str, Any] = Body(...)):
    """
    Updates fields of an existing transaction (e.g. after manual review edit).
    """
    tx = get_transaction_by_id(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # If category changed, re-calculate GST rules if requested
    if "category" in updates and "gst_rate" not in updates:
        gst_res = calculate_gst_itc(category=updates["category"], amount=updates.get("amount", tx["amount"]))
        updates["gst_rate"] = gst_res["gst_rate"]
        updates["itc_eligible"] = 1 if gst_res["itc_eligible"] else 0
        updates["itc_status"] = gst_res["itc_status"]
        updates["itc_explanation"] = gst_res["explanation"]

    update_transaction(tx_id, updates)
    updated_tx = get_transaction_by_id(tx_id)
    return {"status": "success", "transaction": updated_tx}

@app.post("/gst/calculate")
def gst_calculate(payload: Dict[str, Any] = Body(...)):
    """
    Calculates GST rate and ITC eligibility based on Indian CGST statutory rules table.
    Uses Llama3.2:3b ONLY to phrase explanation in plain language.
    """
    category = payload.get("category", "")
    amount = float(payload.get("amount", 0.0))
    vendor = payload.get("vendor", "")
    description = payload.get("description", "")

    result = calculate_gst_itc(category=category, amount=amount, vendor=vendor, description=description)
    return result

@app.get("/anomalies/detect")
def anomaly_detect():
    """
    Fit IsolationForest at request time on stored transaction history.
    Uses SHAP to explain WHY each flagged transaction was isolated.
    Requires minimum 30 transactions.
    """
    txs = get_all_transactions()
    return detect_anomalies(txs)

@app.get("/reports/gst-summary")
def gst_summary_report(month: Optional[int] = Query(None), year: Optional[int] = Query(None)):
    """
    Aggregates stored transactions into GSTR-1 and GSTR-3B structured summary reports for CA filing review.
    """
    txs = get_all_transactions()
    return generate_gst_summary(txs, month=month, year=year)

@app.post("/documents")
def create_doc(payload: Dict[str, Any] = Body(...)):
    """
    Creates a new document record (Quotation, Purchase Order, Delivery Challan, Note, Invoice).
    """
    doc_type = payload.get("doc_type", "quotation")
    party_name = payload.get("party_name", "Valued Customer")
    date_str = payload.get("date", "")
    items = payload.get("items", [])
    notes = payload.get("notes")
    doc_number = payload.get("doc_number")

    doc = create_new_document(
        doc_type=doc_type,
        party_name=party_name,
        date=date_str,
        items=items,
        notes=notes,
        doc_number=doc_number
    )
    return {"status": "success", "document": doc}

@app.get("/documents")
def list_docs():
    """
    Lists all generated documents.
    """
    docs = get_documents_list()
    return {"documents": docs, "total_count": len(docs)}

@app.get("/documents/{doc_id}")
def get_doc(doc_id: int):
    """
    Retrieves details for a single document.
    """
    doc = get_document_details(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc