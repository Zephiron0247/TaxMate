import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import IsolationForest
import shap

def extract_features(transactions):
    """
    Transforms raw transaction records into numeric feature vectors for IsolationForest.
    Features:
    1. amount: numeric transaction amount
    2. category_code: ordinal hash of category string
    3. day_of_week: day of week index (0=Monday, 6=Sunday)
    4. vendor_freq: proportion of total transactions from this vendor
    5. amount_vs_cat_avg: ratio of transaction amount to category average amount
    """
    if not transactions:
        return np.empty((0, 5)), []

    df = pd.DataFrame(transactions)
    
    # 1. Amount
    amounts = df["amount"].astype(float).fillna(0.0).values

    # 2. Category code
    cats = df["category"].fillna("other").astype(str).tolist()
    unique_cats = {cat: idx for idx, cat in enumerate(set(cats))}
    cat_codes = np.array([unique_cats[c] for c in cats], dtype=float)

    # 3. Day of week
    days = []
    for d_str in df["date"].fillna(""):
        try:
            dt = datetime.strptime(str(d_str)[:10], "%Y-%m-%d")
            days.append(dt.weekday())
        except Exception:
            days.append(0)
    day_codes = np.array(days, dtype=float)

    # 4. Vendor frequency
    vendor_counts = df["vendor"].fillna("Unknown").value_counts().to_dict()
    total_txs = len(df)
    vendor_freqs = np.array([vendor_counts.get(v, 1) / total_txs for v in df["vendor"].fillna("Unknown")], dtype=float)

    # 5. Ratio vs Category Average Amount
    cat_avg = df.groupby("category")["amount"].transform("mean").fillna(df["amount"].mean()).values
    cat_avg = np.where(cat_avg <= 0, 1.0, cat_avg)
    amount_ratios = amounts / cat_avg

    X = np.column_stack([amounts, cat_codes, day_codes, vendor_freqs, amount_ratios])
    feature_names = ["Amount", "Category Code", "Day of Week", "Vendor Frequency", "Amount Ratio vs Cat Avg"]
    
    return X, feature_names

def detect_anomalies(transactions):
    """
    Fits IsolationForest on transaction history and computes SHAP explanations for flagged items.
    Requires at least 30 transactions to prevent false flags.
    """
    total_tx = len(transactions)
    if total_tx < 30:
        return {
            "status": "insufficient_data",
            "count": total_tx,
            "required": 30,
            "message": f"Still learning your patterns ({total_tx}/30 transactions recorded)",
            "anomalies": []
        }

    X, feature_names = extract_features(transactions)
    
    # Fit IsolationForest dynamically on the user's data
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    iso_forest.fit(X)

    predictions = iso_forest.predict(X)  # -1 for anomaly, 1 for normal
    scores = iso_forest.decision_function(X) # lower/negative = more anomalous

    # Compute SHAP feature attributions
    explainer_shap = None
    shap_vals = None
    try:
        explainer_shap = shap.TreeExplainer(iso_forest)
        shap_res = explainer_shap(X)
        shap_vals = shap_res.values if hasattr(shap_res, "values") else shap_res
    except Exception as e:
        shap_vals = None

    anomalies_list = []
    
    for idx, tx in enumerate(transactions):
        is_anomaly = bool(predictions[idx] == -1)
        score = float(scores[idx])

        explanation_reasons = []
        if is_anomaly:
            row_features = X[idx]
            amt = row_features[0]
            v_freq = row_features[3]
            ratio = row_features[4]
            day_idx = int(row_features[2])

            # Use SHAP values if available to prioritize explanations
            if shap_vals is not None and len(shap_vals) > idx:
                tx_shap = np.abs(shap_vals[idx])
                top_feature_indices = np.argsort(tx_shap)[::-1]
                
                for f_idx in top_feature_indices[:2]:
                    fname = feature_names[f_idx]
                    if fname == "Amount Ratio vs Cat Avg" and ratio > 1.5:
                        explanation_reasons.append(f"Amount ₹{amt:,.2f} is {ratio:.1f}x higher than category average")
                    elif fname == "Vendor Frequency" and v_freq < 0.1:
                        explanation_reasons.append(f"Rare purchase from vendor '{tx.get('vendor', 'Unknown')}'")
                    elif fname == "Amount" and amt > 25000:
                        explanation_reasons.append(f"High single-transaction amount (₹{amt:,.2f})")
                    elif fname == "Day of Week" and day_idx in [5, 6]:
                        explanation_reasons.append("Unusual weekend purchase")
            
            # Fallback heuristic explanation if SHAP didn't populate specific reason
            if not explanation_reasons:
                if ratio > 1.5:
                    explanation_reasons.append(f"Amount ₹{amt:,.2f} is {ratio:.1f}x category average")
                if v_freq < 0.1:
                    explanation_reasons.append(f"Unusual vendor frequency ({tx.get('vendor')})")

        reason_str = " | ".join(explanation_reasons) if explanation_reasons else ("Isolated pattern deviation" if is_anomaly else "Normal pattern")

        anomalies_list.append({
            "transaction_id": tx.get("id"),
            "vendor": tx.get("vendor"),
            "amount": tx.get("amount"),
            "category": tx.get("category"),
            "is_anomaly": is_anomaly,
            "anomaly_score": round(score, 4),
            "explanation": reason_str
        })

    flagged_count = sum(1 for a in anomalies_list if a["is_anomaly"])

    return {
        "status": "success",
        "count": total_tx,
        "flagged_count": flagged_count,
        "anomalies": anomalies_list
    }
