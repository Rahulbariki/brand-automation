# Production Security Checklist

## 🔐 Authentication
- [x] **Password Hashing**: Bcrypt is implemented in `backend/app/utils/hashing.py`.
- [x] **JWT Secrets**: Ensure `JWT_SECRET` in `.env` is at least 32 characters long and random.
- [ ] **Token Expiry**: Current expiry is set to 12 hours. Consider using short-lived access tokens (15min) + refresh tokens for higher security.

## 🌐 API Security
- [x] **CORS**: Configured in `main.py` to allow all origins `["*"]`. **Restrict this to your Vercel domain** in production using `frontend/*.html` or specific domain.
- [x] **HTTPS**: Vercel handles HTTPS automatically.
- [x] **Input Validation**: Pydantic schemas are used for all request bodies.

## 🗄 Database Security
- [x] **Connection Pooling**: SQLAlchemy engine is configured with pooling.
- [ ] **Row Level Security (RLS)**: Enable RLS on Supabase dashboard to restrict access at the database layer as a second line of defense.
- [x] **SQL Injection**: SQLAlchemy ORM handles parameter escaping automatically.

## 🔑 Environment Security
- [ ] **.env**: Ensure `.env` is in `.gitignore` (Checked: It is).
- [ ] **API Keys**: Rotate Groq and Supabase keys every 90 days.

## 🚀 Deployment
- [ ] **Debug Mode**: Ensure `uvicorn` is NOT run with `--reload` in production.
- [ ] **Logs**: Review Vercel logs for any exposed sensitive info.
