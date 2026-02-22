import os
import subprocess
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found in .env")
    exit(1)

print("Removing old DATABASE_URL from Vercel...")
subprocess.run("npx vercel env rm DATABASE_URL production preview development -y", shell=True)

print(f"Adding new DATABASE_URL to Vercel (production, preview, development)...")
# Note: we pass the URL directly to stdin
process = subprocess.Popen(
    "npx vercel env add DATABASE_URL production preview development",
    shell=True,
    stdin=subprocess.PIPE,
    text=True
)
process.communicate(input=db_url)

if process.returncode == 0:
    print("Successfully updated Vercel environment variables!")
else:
    print("Failed to add Vercel environment variables")
