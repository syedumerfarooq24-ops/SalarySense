FROM python:3.11-slim

WORKDIR /app

# System deps for scikit-learn / numpy wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train a default model at build time if one isn't already present,
# so the container is runnable out of the box. Skips cleanly if
# salary_model.pkl was copied in from the build context.
RUN [ -f salary_model.pkl ] || python train_model.py

ENV APP_ENV=production
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
