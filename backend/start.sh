#!/bin/bash

# Wait for database if needed (add wait-for-it.sh logic here if critical)
# In production, usually the orchestrator handles restarts

# Run Migrations (if using alembic, which we should add later)
# alembic upgrade head

# Start Gunicorn
exec gunicorn -k uvicorn.workers.UvicornWorker -c backend/gunicorn_conf.py backend.app.main:app
