# SalarySense AI — Backend

FastAPI backend for the SalarySense AI Employee Salary Prediction Dashboard.
Serves ML-powered salary predictions, prediction history, aggregated analytics,
and model metadata to the React frontend.

## Tech Stack

- **Framework:** FastAPI + Uvicorn
- **Validation:** Pydantic v2
- **Database:** Supabase (PostgreSQL via `supabase-py`)
- **ML:** Pandas, NumPy, Scikit-learn (RandomForestRegressor), Joblib
- **Config:** `python-dotenv`

## Project Structure

```
backend/
├── app/
│   ├── database/
│   │   └── supabase.py       # Supabase client init with graceful fallback
│   ├── ml/
│   │   └── predictor.py      # Model loading + inference
│   ├── routers/
│   │   ├── predict.py        # POST /predict
│   │   ├── history.py        # GET /history
│   │   ├── analytics.py      # GET /analytics
│   │   └── model.py          # GET /model-info, POST /train
│   ├── schemas/
│   │   └── salary.py         # Pydantic request/response models
│   ├── services/
│   │   └── salary_service.py # Business logic tying ML + DB together
│   └── main.py                # FastAPI app, CORS, health check
├── train_model.py             # Training script (synthetic or CSV data)
├── salary_model.pkl           # Trained model bundle (generated, not committed)
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

1. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in `SUPABASE_URL` and `SUPABASE_KEY` from your Supabase project settings.
   The app runs without these — Supabase-backed endpoints (`/history`, `/analytics`,
   prediction logging) fall back to safe empty/zeroed responses instead of erroring.

3. **Create the Supabase table** (if using Supabase):
   ```sql
   create table prediction_history (
     id text primary key,
     age int,
     gender text,
     education text,
     experience float,
     department text,
     job_title text,
     company_size text,
     employment_type text,
     remote_work text,
     city text,
     predicted_salary float,
     created_at timestamptz default now()
   );
   ```

4. **Train the model** (generates `salary_model.pkl`):
   ```bash
   python train_model.py
   ```
   By default this trains on a generated synthetic dataset (3,000 rows). To train
   on real data instead:
   ```bash
   python train_model.py --data path/to/your_data.csv --rows 5000
   ```
   The CSV must contain columns: `age, gender, education, experience, department,
   job_title, company_size, employment_type, remote_work, city, salary`.

   You can also retrain at runtime via `POST /train` (see below) without restarting
   the server — it hot-reloads the new model into the running process.

5. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   API available at `http://127.0.0.1:8000`. Interactive docs at
   `http://127.0.0.1:8000/docs`.

## Running Tests

```bash
pip install pytest httpx
pytest
```

The suite (`tests/test_api.py`) covers all 6 endpoints, including:
- Happy paths (mocked model / mocked Supabase responses)
- Graceful-fallback behavior when Supabase is unavailable or throws
- Validation errors (missing/unexpected fields on `/predict`, out-of-range `/history` params)
- `/train`'s success and failure paths
- CORS header presence

No live Supabase or trained model is required to run the tests — the model
and database layers are mocked so the suite runs fast and deterministically.

## Running with Docker

```bash
docker build -t salarysense-backend .
docker run -p 8000:8000 --env-file .env salarysense-backend
```

The image trains a default synthetic model at build time if `salary_model.pkl`
isn't already present in the build context, so the container is runnable
out of the box even without a pre-trained model.

## API Endpoints

| Method | Path          | Description                                                        |
|--------|---------------|----------------------------------------------------------------------|
| GET    | `/`           | Health check — API status, version, model load status               |
| POST   | `/predict`    | Runs inference on employee attributes, logs to Supabase, returns prediction |
| GET    | `/history`    | Paginated prediction history (`limit`, `offset`, optional `search`)  |
| GET    | `/analytics`  | Aggregated metrics across stored predictions                         |
| GET    | `/model-info` | Current model algorithm, metrics, and feature list                   |
| POST   | `/train`      | Retrains the model and hot-reloads it into the running server        |

## Error-Handling Philosophy

- **Supabase failures never produce a 500.** Every DB-backed endpoint
  (`/history`, `/analytics`, prediction logging) catches exceptions internally
  and returns safe fallback data (empty lists / zeroed metrics), preventing
  the frontend's TanStack Query from entering infinite retry loops.
- **`/predict` returns 503** (not 500) when no model is loaded — this is an
  expected "service temporarily unavailable" state, distinguishable from a
  genuine bug.
- **`/train` returns 500** on genuine training failures (bad data, disk
  errors) since those indicate something actually went wrong.

## Notes

- `salary_model.pkl` is a `joblib`-serialized dict: `{"model": <sklearn Pipeline>, "metadata": {...}}`.
  It is git-ignored by convention — regenerate it with `train_model.py` or via `POST /train`.
- CORS is restricted to `localhost:5173`, `127.0.0.1:5173`, `localhost:8080`,
  `127.0.0.1:8080` (Vite dev server defaults). Update `app/main.py` if deploying
  to a different origin.
