import sys
import json
from pathlib import Path

sys.path.insert(0, r"d:\Projects\TaxMate\backend")
from app.ocr import extract_receipt_data


img_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\4f3b77aa-6d12-44be-b688-b61b5208ee43\.user_uploaded\media_1790055652454.jpg"

print("=== Testing OCR on Sharma Super Mart Receipt ===")
result = extract_receipt_data(img_path)
print("OCR Result:", json.dumps(result, indent=2))
