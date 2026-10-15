from collections import defaultdict
from datetime import datetime

def generate_gst_summary(transactions, month=None, year=None):
    """
    Aggregates transactions into GSTR-1 and GSTR-3B structured summary reports for CA filing review.
    """
    filtered_txs = []
    for tx in transactions:
        tx_date = str(tx.get("date") or "")
        if not tx_date:
            filtered_txs.append(tx)
            continue
            
        try:
            dt = datetime.strptime(tx_date[:10], "%Y-%m-%d")
            if month and dt.month != int(month):
                continue
            if year and dt.year != int(year):
                continue
            filtered_txs.append(tx)
        except Exception:
            filtered_txs.append(tx)

    total_gross_amount = 0.0
    total_taxable_value = 0.0
    total_gst_amount = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    
    total_eligible_itc = 0.0
    total_blocked_itc = 0.0

    category_summary = defaultdict(lambda: {
        "count": 0,
        "taxable_value": 0.0,
        "gst_rate": 18.0,
        "total_gst": 0.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "itc_eligible": True
    })

    b2b_invoices = []

    for tx in filtered_txs:
        gross = float(tx.get("amount") or 0.0)
        rate = float(tx.get("gst_rate") or 18.0)
        
        # Calculate taxable value assuming inclusive or exclusive rate
        taxable = gross / (1 + (rate / 100.0))
        gst = gross - taxable
        cgst = gst / 2.0
        sgst = gst / 2.0

        is_eligible = bool(tx.get("itc_eligible", 1))

        total_gross_amount += gross
        total_taxable_value += taxable
        total_gst_amount += gst
        total_cgst += cgst
        total_sgst += sgst

        if is_eligible:
            total_eligible_itc += gst
        else:
            total_blocked_itc += gst

        cat = tx.get("category") or "General Supplies"
        category_summary[cat]["count"] += 1
        category_summary[cat]["taxable_value"] += taxable
        category_summary[cat]["gst_rate"] = rate
        category_summary[cat]["total_gst"] += gst
        category_summary[cat]["cgst"] += cgst
        category_summary[cat]["sgst"] += sgst
        category_summary[cat]["itc_eligible"] = is_eligible

        b2b_invoices.append({
            "id": tx.get("id"),
            "vendor": tx.get("vendor"),
            "date": tx.get("date"),
            "category": cat,
            "invoice_value": round(gross, 2),
            "taxable_value": round(taxable, 2),
            "gst_rate": rate,
            "gst_amount": round(gst, 2),
            "itc_eligible": is_eligible,
            "itc_status": tx.get("itc_status", "Eligible" if is_eligible else "Blocked")
        })

    # Prepare GSTR-1 Section
    gstr1_categories = []
    for cat_name, data in category_summary.items():
        gstr1_categories.append({
            "category": cat_name,
            "count": data["count"],
            "taxable_value": round(data["taxable_value"], 2),
            "gst_rate": data["gst_rate"],
            "total_gst": round(data["total_gst"], 2),
            "cgst": round(data["cgst"], 2),
            "sgst": round(data["sgst"], 2),
            "itc_eligible": data["itc_eligible"]
        })

    # Prepare GSTR-3B Table 4 Breakdown
    gstr3b_table_4a = {
        "title": "4(A) Input Tax Credit Available (B2B Inward Supplies)",
        "taxable_value": round(total_taxable_value, 2),
        "cgst": round(total_cgst, 2),
        "sgst": round(total_sgst, 2),
        "total_itc": round(total_gst_amount, 2)
    }

    gstr3b_table_4d = {
        "title": "4(D) Ineligible ITC under Section 17(5)",
        "total_blocked_itc": round(total_blocked_itc, 2),
        "reasons": ["Motor Vehicles (Sec 17(5)(a))", "Food & Beverages (Sec 17(5)(b)(i))", "Personal Consumption (Sec 17(5)(g))"]
    }

    net_itc_available = total_eligible_itc

    return {
        "period": f"{month or 'All'}/{year or 'All'}",
        "summary": {
            "total_transactions": len(filtered_txs),
            "total_gross_spend": round(total_gross_amount, 2),
            "total_taxable_value": round(total_taxable_value, 2),
            "total_gst_paid": round(total_gst_amount, 2),
            "total_cgst": round(total_cgst, 2),
            "total_sgst": round(total_sgst, 2),
            "eligible_itc": round(total_eligible_itc, 2),
            "blocked_itc": round(total_blocked_itc, 2),
            "net_itc_claimable": round(net_itc_available, 2)
        },
        "gstr1": {
            "title": "GSTR-1 Inward Purchase Summary (By Category)",
            "categories": gstr1_categories,
            "invoices": b2b_invoices
        },
        "gstr3b": {
            "title": "GSTR-3B Table 4 ITC Summary",
            "table_4a_available": gstr3b_table_4a,
            "table_4d_ineligible": gstr3b_table_4d,
            "net_itc_claimable": round(net_itc_available, 2)
        }
    }
