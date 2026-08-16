"""
Git AI - ML Priority Scoring Microservice

Wraps ml/predict.py behind a small HTTP API so the Node backend never needs a
Python runtime. Deployed as its own container; the backend falls back to a
plain JS heuristic (backend/services/repository.js) if this is unreachable.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 5001
"""

import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))

app = FastAPI(title="Git AI Priority Scoring Service", version="1.0")

_model_cache = None


class RepoMetrics(BaseModel):
    repository_name: str = "Unknown"
    days_since_last_commit: int = 0
    total_commits: int = 0
    num_files: int = 0
    open_issues: int = 0
    test_files: int = 0
    documentation_score: int = 0
    stars: int = 0
    forks: int = 0
    recent_commits_30d: int = 0
    repo_size_kb: int = 0
    project_age_days: int = 1
    language: str = "Unknown"


def get_model():
    global _model_cache
    if _model_cache is None:
        from predict import load_model
        _model_cache = load_model()
    return _model_cache


@app.get("/health")
def health():
    try:
        get_model()
        return {"status": "ok", "model_loaded": True}
    except FileNotFoundError:
        return {"status": "degraded", "model_loaded": False, "message": "Run 'python train.py' in ml/ first"}


@app.post("/predict")
def predict(metrics: RepoMetrics):
    try:
        from predict import predict_priority
    except ImportError as e:
        raise HTTPException(status_code=500, detail=f"predict module unavailable: {e}")

    try:
        result = predict_priority(metrics.model_dump())
        return result
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run 'python train.py' in the ml/ directory."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
