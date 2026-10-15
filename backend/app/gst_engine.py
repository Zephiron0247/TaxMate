import ollama
import re

# Comprehensive GST / ITC rules mapping based on the Indian CGST Act 2017
GST_RULES_TABLE = {
    "raw_materials": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Raw materials and production inputs used for business are fully eligible for Input Tax Credit."
    },
    "goods_for_resale": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Stock bought for resale in ordinary course of business is eligible for full ITC."
    },
    "capital_goods": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Machinery and capital equipment used for business operations are eligible for ITC."
    },
    "office_supplies": {
        "rate": 12.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Office stationery, paper, and printing supplies qualify for Input Tax Credit."
    },
    "electronics_computers": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Computers, software, and electronic devices used for shop operations are eligible for ITC."
    },
    "freight_transport": {
        "rate": 5.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Transport and freight charges incurred for goods movement are eligible for ITC."
    },
    "rent_services": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "Commercial rent paid for shop premises is eligible for ITC with a valid GST invoice."
    },
    "professional_services": {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "CA fees, legal expenses, and consultancy services qualify for full ITC."
    },
    "vehicle_maintenance": {
        "rate": 18.0,
        "eligible": False,
        "status": "Blocked under Sec 17(5)(a)",
        "section": "Sec 17(5)(a)",
        "rule_desc": "ITC is blocked under Section 17(5)(a) for passenger motor vehicles and their repair or servicing."
    },
    "food_beverages": {
        "rate": 5.0,
        "eligible": False,
        "status": "Blocked under Sec 17(5)(b)(i)",
        "section": "Sec 17(5)(b)(i)",
        "rule_desc": "ITC is blocked under Section 17(5)(b)(i) for food, beverages, snacks, and catering expenses."
    },
    "personal_expenses": {
        "rate": 18.0,
        "eligible": False,
        "status": "Blocked under Sec 17(5)(g)",
        "section": "Sec 17(5)(g)",
        "rule_desc": "ITC is blocked under Section 17(5)(g) for items or services purchased for personal consumption."
    },
    "free_samples_gifts": {
        "rate": 18.0,
        "eligible": False,
        "status": "Blocked under Sec 17(5)(h)",
        "section": "Sec 17(5)(h)",
        "rule_desc": "ITC is blocked under Section 17(5)(h) for goods written off, stolen, or distributed as free samples."
    }
}

def normalize_category(cat_str: str) -> str:
    if not cat_str:
        return "general_business"
    s = cat_str.lower().strip()
    if any(k in s for k in ["raw", "input", "material"]):
        return "raw_materials"
    if any(k in s for k in ["resale", "stock", "inventory", "goods"]):
        return "goods_for_resale"
    if any(k in s for k in ["machinery", "equipment", "capital", "asset"]):
        return "capital_goods"
    if any(k in s for k in ["office", "stationery", "paper", "print"]):
        return "office_supplies"
    if any(k in s for k in ["electronic", "computer", "laptop", "software", "it"]):
        return "electronics_computers"
    if any(k in s for k in ["freight", "transport", "courier", "shipping", "logistics"]):
        return "freight_transport"
    if any(k in s for k in ["rent", "lease", "premise"]):
        return "rent_services"
    if any(k in s for k in ["professional", "ca", "legal", "audit", "consultant"]):
        return "professional_services"
    if any(k in s for k in ["vehicle", "car", "bike", "repair", "service", "fuel", "petrol", "diesel"]):
        return "vehicle_maintenance"
    if any(k in s for k in ["food", "beverage", "tea", "coffee", "lunch", "snack", "catering", "restaurant"]):
        return "food_beverages"
    if any(k in s for k in ["personal", "home", "family"]):
        return "personal_expenses"
    if any(k in s for k in ["sample", "gift", "donation", "promo"]):
        return "free_samples_gifts"
    return "general_business"

def calculate_gst_itc(category: str, amount: float = 0.0, vendor: str = "", description: str = "") -> dict:
    cat_key = normalize_category(category)
    rule = GST_RULES_TABLE.get(cat_key, {
        "rate": 18.0,
        "eligible": True,
        "status": "Eligible",
        "section": "Sec 16(1)",
        "rule_desc": "General business expense. Eligible for ITC if supported by a valid tax invoice."
    })

    gst_rate = rule["rate"]
    itc_eligible = rule["eligible"]
    itc_status = rule["status"]
    rule_desc = rule["rule_desc"]

    # Use llama3.2:3b ONLY to phrase explanation in plain language for shopkeepers
    explanation = rule_desc
    try:
        prompt = (
            f"Translate this technical GST tax rule into 1 short, plain-language sentence for a small Indian shopkeeper.\n"
            f"Rule: {rule_desc}\n"
            f"Category: {category or cat_key}\n"
            f"Eligible: {itc_eligible}\n"
            f"Respond ONLY with the plain English explanation sentence, no jargon."
        )
        response = ollama.chat(
            model="llama3.2:3b",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2}
        )
        model_text = response.get("message", {}).get("content", "").strip()
        if model_text and len(model_text) > 10:
            explanation = model_text
    except Exception as e:
        # Fallback cleanly to standard rule_desc if LLM call is unavailable
        explanation = rule_desc

    return {
        "gst_rate": gst_rate,
        "itc_eligible": itc_eligible,
        "itc_status": itc_status,
        "explanation": explanation,
        "category_normalized": cat_key
    }
