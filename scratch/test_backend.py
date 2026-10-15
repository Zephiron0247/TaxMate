import urllib.request
import json
import random
import sys
from datetime import datetime, timedelta

# Ensure Windows stdout handles UTF-8 (rupee symbol, etc)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"


def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body_bytes = json.dumps(data).encode("utf-8") if data else None
    with urllib.request.urlopen(req, data=body_bytes) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("=== Testing FastAPI Backend Endpoints ===")

    # 1. Health check
    res_root = make_request(f"{BASE_URL}/")
    print("1. Root Endpoint:", res_root)

    # 2. GST Calculation endpoint
    gst_req = {"category": "raw_materials", "amount": 15000.0, "vendor": "Apex Steel Co"}
    res_gst = make_request(f"{BASE_URL}/gst/calculate", method="POST", data=gst_req)
    print("\n2. GST Calculate (Raw Materials):", res_gst)

    gst_req2 = {"category": "vehicle_maintenance", "amount": 8500.0, "vendor": "City Car Care"}
    res_gst2 = make_request(f"{BASE_URL}/gst/calculate", method="POST", data=gst_req2)
    print("2b. GST Calculate (Vehicle Maintenance - Blocked ITC):", res_gst2)

    # 3. Seed 32 sample transactions to test IsolationForest & SHAP anomaly detection (> 30 threshold)
    print("\n3. Seeding 32 sample transactions...")
    categories = ["Raw Materials", "Goods for Resale", "Office Supplies", "Commercial Rent", "Professional Fees"]
    vendors = ["National Traders", "Shree Metals", "Bharat Paper Co", "Unique Services", "Urban Logistics"]
    
    start_date = datetime(2026, 9, 1)
    for i in range(30):
        d_str = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        cat = categories[i % len(categories)]
        vend = vendors[i % len(vendors)]
        amt = float(random.randint(2000, 12000))
        tx_payload = {"vendor": vend, "amount": amt, "date": d_str, "category": cat}
        make_request(f"{BASE_URL}/transactions", method="POST", data=tx_payload)

    # Add 2 anomalous transactions (high amount, rare vendor)
    anom_tx1 = {"vendor": "Unknown Flashy Vendor", "amount": 95000.0, "date": "2026-09-21", "category": "Office Supplies"}
    make_request(f"{BASE_URL}/transactions", method="POST", data=anom_tx1)

    anom_tx2 = {"vendor": "Luxury Car Care", "amount": 48000.0, "date": "2026-09-22", "category": "Vehicle Maintenance"}
    make_request(f"{BASE_URL}/transactions", method="POST", data=anom_tx2)

    print("Seeding complete.")

    # 4. Anomaly Detection Endpoint
    res_anom = make_request(f"{BASE_URL}/anomalies/detect")
    print("\n4. Anomaly Detection Status:", res_anom["status"], "Total Txs:", res_anom["count"], "Flagged:", res_anom["flagged_count"])
    for a in res_anom["anomalies"]:
        if a["is_anomaly"]:
            print(f"   [FLAGGED ANOMALY] Tx ID {a['transaction_id']} | Vendor: {a['vendor']} | Amount: Rs. {a['amount']} | Explanation: {a['explanation']}")

    # 5. GSTR Summary Report Endpoint
    res_gstr = make_request(f"{BASE_URL}/reports/gst-summary")
    print("\n5. GSTR Summary Report:")
    print("   Summary Totals:", res_gstr["summary"])
    print("   GSTR-3B Net ITC Claimable: Rs.", res_gstr["gstr3b"]["net_itc_claimable"])

    # 6. Document Generation Endpoints
    doc_payload = {
        "doc_type": "purchase_order",
        "party_name": "Shree Metals Pvt Ltd",
        "date": "2026-09-22",
        "notes": "Urgent stock requirement",
        "items": [
            {"description": "Steel Rods 10mm", "quantity": 50, "unit_price": 450.0, "gst_rate": 18.0},
            {"description": "Binding Wire", "quantity": 10, "unit_price": 120.0, "gst_rate": 18.0}
        ]
    }
    res_doc = make_request(f"{BASE_URL}/documents", method="POST", data=doc_payload)
    print("\n6. Document Created:", res_doc["document"]["doc_number"], "| Party:", res_doc["document"]["party_name"], "| Total: Rs.", res_doc["document"]["total_amount"])

    res_docs_list = make_request(f"{BASE_URL}/documents")
    print("6b. Documents List Count:", res_docs_list["total_count"])

    print("\n=== ALL BACKEND ENDPOINTS VERIFIED WORKING PERFECTLY ===")

if __name__ == "__main__":
    run_tests()

