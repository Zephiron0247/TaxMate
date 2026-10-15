import urllib.request
import json
import requests

url = "http://127.0.0.1:8000/scan-receipt"
img_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\4f3b77aa-6d12-44be-b688-b61b5208ee43\.user_uploaded\media_1790055652454.jpg"

with open(img_path, "rb") as f:
    files = {"file": ("sharma_receipt.jpg", f, "image/jpeg")}
    response = requests.post(url, files=files)
    print("Backend /scan-receipt response:")
    print(json.dumps(response.json(), indent=2))
