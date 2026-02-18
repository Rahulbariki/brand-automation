# Production Deployment Checklist & Hardening Guide

## 1. Authentication & Security
- [ ] **Rotate JWT Secret**: Ensure `JWT_SECRET` is strong and rotated periodically.
- [ ] **Short Token Expiry**: Set `ACCESS_TOKEN_EXPIRE_HOURS` to a short duration (e.g., 15-60 mins).
- [ ] **Secure Cookies**: Use `HttpOnly` and `Secure` flags for storing tokens if using cookies (currently using localStorage for simplicity, consider switching for high security).
- [ ] **CORS**: Restrict `allow_origins` in `main.py` to your actual frontend domain (e.g., `https://your-app.vercel.app`).
- [ ] **Supabase RLS**: Apply the SQL policies in `supabase_rls.sql` to your Supabase project.

## 2. API Protection
- [ ] **Rate Limiting**: Implement `SlowAPI` or Vercel Edge Middleware rate limiting.
- [ ] **Input Validation**: Verified (Pydantic schemas are in place).
- [ ] **Disable Docs**: In `main.py`, set `docs_url=None` and `redoc_url=None` based on environment (e.g., `if os.getenv("ENV") == "production"`).

## 3. Billing (Stripe)
- [ ] **Webhooks**: Ensure `STRIPE_WEBHOOK_SECRET` is set and verified in `stripe_routes.py`.
- [ ] **Idempotency**: Handle duplicate webhook events (Stripe sends them occasionally).
- [ ] **Customer Sync**: Ensure `stripe_customer_id` is stored on creation.

## 4. Database
- [ ] **Connection Pooling**: SQLAlchemy `pool_size` and `pool_recycle` are configured in `database.py`.
- [ ] **Indexes**: `email` and foreign keys are indexed.
- [ ] **Backups**: Enable daily backups in Supabase.

## 5. Deployment (Vercel)
- [ ] **Environment Variables**: Set all keys in Vercel Project Settings (`Supabase`, `Stripe`, `Groq`, `HF`).
- [ ] **Logging**: Remove `print()` debugging statements; use `logging` module with appropriate levels.
- [ ] **Monitoring**: Connect Sentry or LogRocket for error tracking.

## 6. Architecture
See `ARCHITECTURE.md` for the updated diagram.
