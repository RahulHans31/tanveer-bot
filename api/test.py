import requests

TOKEN = "8518415832:AAFqVHXno4oa3YMaH8E-UI5ps7T_HPg_7VY"
CHAT_ID = 7992845749  # your personal chat ID

r = requests.post(
    f"https://api.telegram.org/bot{TOKEN}/sendMessage",
    json={"chat_id": CHAT_ID, "text": "🚀 Test message from Stock Tracker!"}
)
print(r.json())
