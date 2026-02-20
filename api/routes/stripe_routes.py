import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, STRIPE_PRO_PRICE_ID, STRIPE_ENTERPRISE_PRICE_ID
from dependencies import get_current_user

router = APIRouter()

# Initialize Stripe
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

PRICING_PLANS = {
    "pro": STRIPE_PRO_PRICE_ID,
    "enterprise": STRIPE_ENTERPRISE_PRICE_ID
}

@router.post("/create-checkout-session")
async def create_checkout_session(
    plan: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
        
    price_id = PRICING_PLANS.get(plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/dashboard?success=true",
            cancel_url=f"{FRONTEND_URL}/dashboard?canceled=true",
            metadata={
                "user_id": current_user.id,
                "supabase_id": current_user.supabase_id,
                "plan": plan
            }
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")

    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await handle_checkout_completed(session, db)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await handle_subscription_deleted(subscription, db)

    return {"status": "success"}

async def handle_checkout_completed(session, db: Session):
    user_id = session.get("client_reference_id")
    if not user_id:
        return
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user:
        user.stripe_customer_id = session.get("customer")
        user.stripe_subscription_id = session.get("subscription")
        plan = session.get("metadata", {}).get("plan", "pro")
        user.subscription_plan = plan
        db.commit()

async def handle_subscription_deleted(subscription, db: Session):
    customer_id = subscription.get("customer")
    if not customer_id:
        return
        
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if user:
        user.subscription_plan = "free"
        user.stripe_subscription_id = None
        db.commit()
