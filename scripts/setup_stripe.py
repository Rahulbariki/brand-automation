import stripe
import os
from dotenv import load_dotenv

# Path to .env
DOTENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(DOTENV_PATH)

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

if not STRIPE_SECRET_KEY:
    print("Error: STRIPE_SECRET_KEY not found in .env")
    exit(1)

stripe.api_key = STRIPE_SECRET_KEY

def create_products():
    print("Creating Stripe Products...")
    
    # 1. Pro Plan
    try:
        pro_product = stripe.Product.create(
            name="Pro Plan",
            description="Pro membership for BizForge"
        )
        pro_price = stripe.Price.create(
            product=pro_product.id,
            unit_amount=100, # 1 INR in paise (assuming INR)
            currency="inr",
            recurring={"interval": "month"},
        )
        print(f"Pro Plan Created: {pro_product.id} / Price ID: {pro_price.id}")
    except Exception as e:
        print(f"Error creating Pro Plan: {e}")
        pro_price = None

    # 2. Enterprise Plan
    try:
        ent_product = stripe.Product.create(
            name="Enterprise Plan",
            description="Enterprise membership for BizForge"
        )
        ent_price = stripe.Price.create(
            product=ent_product.id,
            unit_amount=500, # 5 INR in paise
            currency="inr",
            recurring={"interval": "month"},
        )
        print(f"Enterprise Plan Created: {ent_product.id} / Price ID: {ent_price.id}")
    except Exception as e:
        print(f"Error creating Enterprise Plan: {e}")
        ent_price = None

    return pro_price, ent_price

if __name__ == "__main__":
    pro_p, ent_p = create_products()
    if pro_p and ent_p:
        print("\nAdd these to your .env file:")
        print(f"STRIPE_PRO_PRICE_ID={pro_p.id}")
        print(f"STRIPE_ENTERPRISE_PRICE_ID={ent_p.id}")
