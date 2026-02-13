# BizForge - AI Branding SaaS

BizForge is an AI-powered branding automation platform that helps startups generate brand names, logos, marketing content, and strategies in seconds.

## 🚀 Features

-   **AI Brand Name Generator** (Groq / LLaMA-3)
-   **Logo Studio** (Stable Diffusion XL)
-   **Marketing Content** (Groq)
-   **Sentiment Analysis** (Groq)
-   **AI Strategy Chat** (IBM Granite / Groq)
-   **Role-Based Auth** (User, Admin, Superadmin)
-   **Subscription System** (Stripe)
-   **Admin Dashboard** (Analytics, User Management)

## 🛠️ Tech Stack

-   **Backend**: FastAPI, SQLAlchemy, PostgreSQL
-   **Frontend**: Vanilla HTML/CSS/JS (Lightweight, High Performance)
-   **AI**: Groq API, Hugging Face Inference API
-   **Payments**: Stripe
-   **Deployment**: Docker, Gunicorn

## 📂 Project Structure

```
bizforge/
├── backend/
│   ├── app/
│   │   ├── main.py       # Entry point
│   │   ├── auth.py       # Authentication (JWT)
│   │   ├── admin.py      # Admin Controller
│   │   ├── payments.py   # Stripe Controller
│   │   ├── models.py     # Database Models
│   │   └── ...
│   └── requirements.txt
├── frontend/
│   ├── index.html        # Landing Page
│   ├── dashboard.html    # App Dashboard
│   ├── admin.html        # Admin Panel
│   └── assets/
├── Dockerfile            # Production Build
├── docker-compose.yml    # Local Orchestration
└── .env                  # Environment Variables
```

## ⚡ Quick Start

### Local Development (Windows)

1.  **Setup Virtual Environment**:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r backend/requirements.txt
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL=sqlite:///./bizforge.db
    SECRET_KEY=your_secret_key
    GROQ_API_KEY=your_groq_key
    HF_API_KEY=your_huggingface_key
    STRIPE_SECRET_KEY=your_stripe_secret
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook
    ```

3.  **Run the Server**:
    ```bash
    uvicorn backend.app.main:app --reload
    ```

4.  **Visit**: `http://localhost:8000`

### 🐳 Docker Deployment

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    This will start the FastAPI backend on port 8000 and a PostgreSQL database on port 5432.

## 💳 Stripe Setup

1.  Create a product in Stripe Dashboard.
2.  Get the Price ID (e.g., `price_123...`).
3.  Update `PRICING_PLANS` in `backend/app/payments.py`.
4.  Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`.
5.  Use `stripe listen` CLI to forward webhooks to `http://localhost:8000/api/payments/webhook` for local testing.

## 🛡️ Admin Access

1.  Sign up a new user.
2.  Manually update the user role in the database:
    ```sql
    UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
    ```
3.  Access `/admin.html`.
