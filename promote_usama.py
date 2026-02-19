import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials")
    exit(1)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Search by partial name match since email wasn't provided
search_term = "Usama" 
print(f"Searching for user with name like '{search_term}'...")

search_url = f"{SUPABASE_URL}/rest/v1/users?fullname=ilike.%{search_term}%"
r = requests.get(search_url, headers=headers)

if r.status_code != 200:
    print(f"❌ Search failed: {r.text}")
    exit(1)

users = r.json()
if not users:
    print(f"❌ User '{search_term}' not found. Please provide the exact email address.")
    exit(1)

if len(users) > 1:
    print(f"⚠️ Multiple users found for '{search_term}':")
    for u in users:
        print(f" - ID: {u['id']}, Name: {u['fullname']}, Email: {u['email']}")
    print("Please specify the exact email to be safe.")
    exit(1)

target_user = users[0]
print(f"Found User: {target_user['fullname']} ({target_user['email']})")

update_url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{target_user['id']}"
payload = {
    "subscription_plan": "pro",
    "is_active": True
}

r = requests.patch(update_url, headers=headers, json=payload)

if r.status_code in [200, 204]:
    print(f"✅ SUCCESS: {target_user['fullname']} is now on PRO plan.")
else:
    print(f"❌ Update failed: {r.text}")
