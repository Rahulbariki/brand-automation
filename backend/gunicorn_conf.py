import multiprocessing
import os

# Gunicorn config variables
port = os.getenv("PORT", "8000")
bind = f"0.0.0.0:{port}"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
