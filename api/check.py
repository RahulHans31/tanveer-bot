import os
import json
import re
import time
import datetime
import requests
from dotenv import load_dotenv

# === Load environment variables from Vercel ===
load_dotenv()

AMAZON_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AMAZON_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AMAZON_PARTNER_TAG = os.getenv("AMAZON_PARTNER_TAG")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8518415832:AAFqVHXno4oa3YMaH8E-UI5ps7T_HPg_7VY")
AUTH_SECRET = os.getenv("AUTH_SECRET", "Rh@310803")

# === Markdown Escaper (for Telegram) ===
def escape_markdown(text):
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', text)

# === Telegram Sender ===
def send_telegram_message(message):
    chat_ids = [
        1301703380, 7500224400, 7570729917, 798436912, 6878100797, 849850934,
        1476695901, 1438419270, 667911343, 574316265, 5871190519, 939758815,
        6272441906, 5756316614, 1221629915, 5339576661, 766044262, 1642837409,
        978243265, 5869017768, 1257253967, 995543877, 820803336, 8196689182,
        1813686494, 5312984739, 1639167211, 871796135, 691495606, 6644657779,
        837532484, 1460192633, 6137007196, 1794830835
    ]

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    message = escape_markdown(message)
    print(f"[info] Sending message to {len(chat_ids)} users...")

    for chat_id in chat_ids:
        payload = {
            "chat_id": str(chat_id),  # ✅ Telegram expects string
            "text": message,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True
        }
        try:
            resp = requests.post(url, json=payload, timeout=5)
            if not resp.ok:
                print(f"⚠️ Failed for {chat_id}: {resp.text}")
            else:
                print(f"✅ Sent to {chat_id}")
            time.sleep(0.25)  # avoid flood limit
        except Exception as e:
            print(f"❌ Error sending to {chat_id}: {e}")

# === Amazon Stock Checker ===
def check_amazon(product):
    try:
        endpoint = "https://webservices.amazon.in/paapi5/getitems"
        payload = {
            "ItemIds": [product["asin"]],
            "Resources": ["Offers.Listings.Availability.Message"],
            "PartnerTag": AMAZON_PARTNER_TAG,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.in"
        }
        headers = {"Content-Type": "application/json", "Accept": "application/json"}

        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        data = response.json()

        if "Errors" in data:
            print(f"[info] Amazon API Error: {data}")
            return None  # Don't retry

        availability = (
            data.get("ItemsResult", {})
                .get("Items", [{}])[0]
                .get("Offers", {})
                .get("Listings", [{}])[0]
                .get("Availability", {})
                .get("Message", "")
        )

        if "In Stock" in availability:
            link_to_send = product.get("affiliateLink", product["url"])
            return f'🛒 *Amazon In Stock*\n[{product["name"]}]({link_to_send})'
    except Exception as e:
        print(f"[error] Amazon check failed: {e}")
    return None

# === Croma Stock Checker ===
def check_croma(product):
    try:
        pincode = product.get("pincode", "132103")
        url = f"https://api.croma.com/productdetails/v1/pincode/{pincode}/sku/{product['sku']}"
        res = requests.get(url, timeout=10)
        data = res.json()

        promise_line = (
            data.get("promise", {})
                .get("suggestedOption", {})
                .get("option", {})
                .get("promiseLines", {})
                .get("promiseLine", [])
        )

        if isinstance(promise_line, list) and promise_line:
            line = promise_line[0]
            available_qty = line.get("availableQty", "0")
            delivery_option = line.get("deliveryOption", "N")

            if available_qty != "0" and delivery_option.upper() == "Y":
                link_to_send = product.get("affiliateLink", product["url"])
                return f'✅ *In Stock at Croma ({pincode})*\n[{product["name"]}]({link_to_send})'
    except Exception as e:
        print(f"[error] Croma check failed: {e}")
    return None

# === Vercel Handler ===
def handler(request):
    """Vercel serverless entrypoint (/api/check)"""
    try:
        query = request.get("query", {})
        secret = query.get("secret")

        if secret != AUTH_SECRET:
            return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

        print("[info] Starting stock check...")

        # 🔹 Replace this with your database fetch later
        products = [
            {
                "name": "iPhone 17 Pro Max",
                "url": "https://www.amazon.in/dp/B0D123EXAMPLE",
                "asin": "B0D123EXAMPLE",
                "source": "amazon",
                "affiliateLink": "https://amzn.to/3iphone17"
            },
            {
                "name": "Sony WH-1000XM5 Headphones",
                "url": "https://www.croma.com/sony-wh-1000xm5/p/123456",
                "sku": "123456",
                "source": "croma",
                "affiliateLink": "https://croma.cc/aff-link"
            }
        ]

        in_stock = []
        for product in products:
            if product["source"] == "amazon":
                result = check_amazon(product)
            elif product["source"] == "croma":
                result = check_croma(product)
            else:
                result = None

            if result:
                in_stock.append(result)

        if in_stock:
            print(f"[info] Found {len(in_stock)} items in stock. Sending Telegram message.")
            message = "🔥 *Stock Alert!*\n\n" + "\n\n".join(in_stock)
            send_telegram_message(message)
        else:
            print("[info] No products currently in stock.")

        return {"statusCode": 200, "body": json.dumps({"message": "Stock check complete."})}

    except Exception as e:
        print(f"[fatal] {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
