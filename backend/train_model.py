"""
SalarySense AI - Model Training Script

Trains a scikit-learn regression pipeline to predict employee salary from
the feature set defined in app/ml/predictor.FEATURE_COLUMNS, and saves the
result to salary_model.pkl as a bundle:

    {"model": <fitted sklearn Pipeline>, "metadata": {...}}

so that app/ml/predictor.load_model() can pick up both the estimator and
its performance metrics in one file.

Usage:
    python train_model.py                 # uses bundled synthetic dataset
    python train_model.py --data path.csv # trains on a real CSV instead

If no --data is provided, a synthetic-but-realistic dataset is generated
so the pipeline is runnable out of the box before real data exists.
"""
import argparse
import logging
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("salarysense.train")

FEATURE_COLUMNS = [
    "age",
    "gender",
    "education",
    "experience",
    "department",
    "job_title",
    "company_size",
    "employment_type",
    "remote_work",
    "city",
]
NUMERIC_FEATURES = ["age", "experience"]
CATEGORICAL_FEATURES = [c for c in FEATURE_COLUMNS if c not in NUMERIC_FEATURES]
TARGET_COLUMN = "salary"

MODEL_PATH = os.getenv("MODEL_PATH", "salary_model.pkl")
RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# Synthetic Data Generation
# ---------------------------------------------------------------------------

def generate_synthetic_dataset(n_rows: int = 3000, seed: int = RANDOM_STATE) -> pd.DataFrame:
    """
    Generates a synthetic-but-plausible employee salary dataset matching
    the prediction_history schema, with a salary target driven by a
    reasonable underlying formula plus noise. Used only when no real
    --data CSV is supplied.
    """
    rng = np.random.default_rng(seed)

    genders = ["Male", "Female", "Other"]
    educations = ["High School", "Bachelors", "Masters", "PhD"]
    education_bonus = {"High School": 0, "Bachelors": 12000, "Masters": 22000, "PhD": 32000}
    departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Product", "Design"]
    department_bonus = {
        "Engineering": 15000, "Product": 12000, "Finance": 10000, "Sales": 8000,
        "Marketing": 5000, "Operations": 4000, "Design": 6000, "HR": 2000,
    }
    job_titles = [
        "Junior Engineer", "Software Engineer", "Senior Engineer", "Engineering Manager",
        "Analyst", "Senior Analyst", "Manager", "Director", "VP", "Associate", "Specialist",
    ]
    title_bonus = {
        "Junior Engineer": -8000, "Software Engineer": 0, "Senior Engineer": 20000,
        "Engineering Manager": 40000, "Analyst": -5000, "Senior Analyst": 8000,
        "Manager": 25000, "Director": 55000, "VP": 90000, "Associate": -6000, "Specialist": 3000,
    }
    company_sizes = ["Startup", "Small", "Medium", "Large", "Enterprise"]
    company_size_bonus = {"Startup": -5000, "Small": 0, "Medium": 5000, "Large": 12000, "Enterprise": 20000}
    employment_types = ["Full-time", "Part-time", "Contract"]
    employment_type_bonus = {"Full-time": 0, "Part-time": -20000, "Contract": -5000}
    remote_options = ["Remote", "Hybrid", "On-site"]
    remote_bonus = {"Remote": 2000, "Hybrid": 0, "On-site": -1000}
    cities = ["Karachi", "Lahore", "Islamabad", "New York", "London", "Berlin", "Toronto", "Singapore"]
    city_bonus = {
        "Karachi": -10000, "Lahore": -11000, "Islamabad": -9000, "New York": 35000,
        "London": 25000, "Berlin": 15000, "Toronto": 18000, "Singapore": 22000,
    }

    ages = rng.integers(21, 63, size=n_rows)
    experience = np.clip(ages - rng.integers(20, 24, size=n_rows), 0, None).astype(float)
    experience += rng.normal(0, 1.0, size=n_rows)
    experience = np.clip(experience, 0, 40).round(1)

    gender = rng.choice(genders, size=n_rows)
    education = rng.choice(educations, size=n_rows, p=[0.15, 0.45, 0.30, 0.10])
    department = rng.choice(departments, size=n_rows)
    job_title = rng.choice(job_titles, size=n_rows)
    company_size = rng.choice(company_sizes, size=n_rows)
    employment_type = rng.choice(employment_types, size=n_rows, p=[0.8, 0.1, 0.1])
    remote_work = rng.choice(remote_options, size=n_rows)
    city = rng.choice(cities, size=n_rows)

    base_salary = 35000
    salary = (
        base_salary
        + experience * 2200
        + np.array([education_bonus[e] for e in education])
        + np.array([department_bonus[d] for d in department])
        + np.array([title_bonus[t] for t in job_title])
        + np.array([company_size_bonus[c] for c in company_size])
        + np.array([employment_type_bonus[e] for e in employment_type])
        + np.array([remote_bonus[r] for r in remote_work])
        + np.array([city_bonus[c] for c in city])
        + rng.normal(0, 6000, size=n_rows)
    )
    salary = np.clip(salary, 18000, None).round(2)

    return pd.DataFrame({
        "age": ages,
        "gender": gender,
        "education": education,
        "experience": experience,
        "department": department,
        "job_title": job_title,
        "company_size": company_size,
        "employment_type": employment_type,
        "remote_work": remote_work,
        "city": city,
        "salary": salary,
    })


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """Builds the preprocessing + model pipeline."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])


def train(df: pd.DataFrame) -> dict:
    """
    Trains the pipeline on the given DataFrame (must contain
    FEATURE_COLUMNS + TARGET_COLUMN), evaluates it on a held-out split,
    and returns a bundle dict ready to be saved with joblib.
    """
    missing = set(FEATURE_COLUMNS + [TARGET_COLUMN]) - set(df.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )

    pipeline = build_pipeline()
    logger.info("Training RandomForestRegressor on %d rows...", len(X_train))
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    logger.info("Evaluation -> R2: %.4f | MAE: %.2f | MSE: %.2f | RMSE: %.2f", r2, mae, mse, rmse)

    metadata = {
        "algorithm": "RandomForestRegressor",
        "r2_score": round(r2, 4),
        "dataset_size": int(len(df)),
        "features": FEATURE_COLUMNS,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "mae": round(mae, 2),
        "mse": round(mse, 2),
        "rmse": round(rmse, 2),
    }

    return {"model": pipeline, "metadata": metadata}


def main():
    parser = argparse.ArgumentParser(description="Train the SalarySense AI salary prediction model.")
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to a CSV file with columns matching FEATURE_COLUMNS + 'salary'. "
             "If omitted, a synthetic dataset is generated.",
    )
    parser.add_argument(
        "--rows",
        type=int,
        default=3000,
        help="Number of rows to generate if using the synthetic dataset (default: 3000).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=MODEL_PATH,
        help=f"Output path for the trained model bundle (default: {MODEL_PATH}).",
    )
    args = parser.parse_args()

    if args.data:
        logger.info("Loading dataset from '%s'...", args.data)
        df = pd.read_csv(args.data)
    else:
        logger.info("No --data provided. Generating synthetic dataset (%d rows)...", args.rows)
        df = generate_synthetic_dataset(n_rows=args.rows)

    bundle = train(df)

    joblib.dump(bundle, args.output)
    logger.info("Model bundle saved to '%s'.", args.output)
    logger.info("Metadata: %s", bundle["metadata"])


if __name__ == "__main__":
    main()
