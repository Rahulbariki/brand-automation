# BizForge Architecture

## Overview
BizForge is a modular SaaS platform built with a Python FastAPI backend and a static HTML/JS frontend. It leverages Supabase for data persistence and authentication, and external AI APIs (Groq, Hugging Face) for generative features.

## High-Level Architecture

                 ┌──────────────────────┐
                 │     Frontend (UI)    │
                 │  Static on Vercel    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   FastAPI Backend    │
                 │  Serverless (Vercel) │
                 └──────────┬───────────┘
                            │
      ┌───────────────┬───────────────┬──────────────┐
      ▼               ▼               ▼              ▼
  Supabase DB       Groq API      HF Granite      Stripe
  (Users + Data)   (Text Gen)     (Brand AI)     (Billing)

## Components

### Frontend
- **Technology**: Plain HTML5, CSS3, Vanilla JavaScript (ES6+ module support).
- **Hosting**: Vercel Static Hosting.
- **Authentication**: JWT stored in default local storage (secure cookies recommended for prod). Supabase Auth client for OAuth.

### Backend
- **Technology**: Python 3.10+, FastAPI.
- **Hosting**: Vercel Serverless Functions (Python Runtime).
- **Database ORM**: SQLAlchemy (Async support recommended for high scale, currently Sync with connection pooling).

### Database (Supabase PostgreSQL)
- **Users Table**: Stores profile, subscription tier, and auth provider info.
- **Generated Content Table**: Stores all AI outputs (brand names, logos, copy).
- **Security**: Row Level Security (RLS) enabled to isolate user data.

### External Services
- **Groq API**: High-speed LLM inference (Llama 3, Mixtral).
- **Hugging Face Inference API**: Image generation (SDXL/Flux) and specialized models (IBM Granite).
- **Stripe**: Subscription billing and webhook event processing.

## Security Controls
- **Authentication**: OAuth2 with JWT (HTTP Bearer).
- **Authorization**: Role-Based Access Control (RBAC) for Admin routes; Subscription Tier checks for Premium features.
- **Data Isolation**: RLS policies on Supabase.
- **Secrets Management**: Environment variables (Vercel/dotenv).
