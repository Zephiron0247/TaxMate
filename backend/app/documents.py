import json
from datetime import datetime
from app.database import insert_document, get_all_documents, get_document_by_id

DOC_TYPE_PREFIXES = {
    "quotation": "QT",
    "purchase_order": "PO",
    "delivery_challan": "DC",
    "credit_note": "CN",
    "debit_note": "DN",
    "proforma_invoice": "PI"
}

def generate_doc_number(doc_type: str) -> str:
    prefix = DOC_TYPE_PREFIXES.get(doc_type.lower(), "DOC")
    year_str = datetime.now().strftime("%Y")
    timestamp_suffix = datetime.now().strftime("%m%d%H%M%S")[-4:]
    return f"{prefix}-{year_str}-{timestamp_suffix}"

def create_new_document(doc_type: str, party_name: str, date: str, items: list, notes: str = None, doc_number: str = None) -> dict:
    if not doc_number:
        doc_number = generate_doc_number(doc_type)

    total_amount = 0.0
    processed_items = []
    
    for item in items:
        qty = float(item.get("quantity", 1))
        unit_price = float(item.get("unit_price", 0.0))
        gst_rate = float(item.get("gst_rate", 18.0))
        
        line_subtotal = qty * unit_price
        line_tax = line_subtotal * (gst_rate / 100.0)
        line_total = line_subtotal + line_tax

        total_amount += line_total
        processed_items.append({
            "description": item.get("description", "Item"),
            "quantity": qty,
            "unit_price": unit_price,
            "gst_rate": gst_rate,
            "line_subtotal": round(line_subtotal, 2),
            "line_tax": round(line_tax, 2),
            "line_total": round(line_total, 2)
        })

    items_json_str = json.dumps(processed_items)
    
    doc_id = insert_document(
        doc_type=doc_type,
        doc_number=doc_number,
        party_name=party_name,
        date=date or datetime.now().strftime("%Y-%m-%d"),
        total_amount=round(total_amount, 2),
        status="Issued",
        notes=notes,
        items_json=items_json_str
    )

    return {
        "id": doc_id,
        "doc_type": doc_type,
        "doc_number": doc_number,
        "party_name": party_name,
        "date": date,
        "total_amount": round(total_amount, 2),
        "status": "Issued",
        "notes": notes,
        "items": processed_items
    }

def get_documents_list():
    docs = get_all_documents()
    res = []
    for d in docs:
        d_dict = dict(d)
        if d_dict.get("items_json"):
            try:
                d_dict["items"] = json.loads(d_dict["items_json"])
            except Exception:
                d_dict["items"] = []
        else:
            d_dict["items"] = []
        res.append(d_dict)
    return res

def get_document_details(doc_id: int):
    doc = get_document_by_id(doc_id)
    if not doc:
        return None
    d_dict = dict(doc)
    if d_dict.get("items_json"):
        try:
            d_dict["items"] = json.loads(d_dict["items_json"])
        except Exception:
            d_dict["items"] = []
    else:
        d_dict["items"] = []
    return d_dict
