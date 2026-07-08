"""
Git AI - Priority Prediction Service
Load trained model and predict priority score for a repository.

Usage:
    python predict.py --repo '{"days_since_last_commit": 5, "total_commits": 45, ...}'
    python predict.py --api   # Run as FastAPI service on port 5001
"""

import os
import sys
import json
import pickle
import argparse
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
ML_DIR = os.path.dirname(__file__)


def load_model():
    """Load trained model, scaler, encoder, and feature columns."""
    model_path = os.path.join(MODELS_DIR, 'priority_model.pkl')
    scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    encoder_path = os.path.join(MODELS_DIR, 'encoder.pkl')
    features_path = os.path.join(MODELS_DIR, 'feature_cols.json')

    if not all(os.path.exists(p) for p in [model_path, scaler_path, features_path]):
        raise FileNotFoundError(
            "Model files not found. Run 'python train.py' first.\n"
            f"Expected: {model_path}"
        )

    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    with open(features_path) as f:
        feature_cols = json.load(f)

    le = None
    if os.path.exists(encoder_path):
        with open(encoder_path, 'rb') as f:
            le = pickle.load(f)

    return model, scaler, le, feature_cols


def predict_priority(repo_metrics: dict) -> dict:
    """Predict priority score for a repository."""
    sys.path.insert(0, ML_DIR)
    from feature_engineering import prepare_for_prediction

    model, scaler, le, feature_cols = load_model()
    X = prepare_for_prediction(repo_metrics, scaler, le, feature_cols)

    score = float(model.predict(X)[0])
    score = max(0, min(100, round(score)))

    # Generate insights
    insights = []
    if repo_metrics.get('days_since_last_commit', 0) > 30:
        insights.append(f"Repository idle for {repo_metrics['days_since_last_commit']} days")
    if repo_metrics.get('open_issues', 0) > 5:
        insights.append(f"{repo_metrics['open_issues']} open issues need attention")
    if repo_metrics.get('test_files', 0) == 0:
        insights.append("No test files detected - consider adding tests")
    if repo_metrics.get('documentation_score', 100) < 50:
        insights.append("Documentation score is low - improve README")
    if repo_metrics.get('stars', 0) > 10:
        insights.append(f"Popular repo with {repo_metrics['stars']} stars")

    # Priority label
    if score >= 85:
        priority_level = "critical"
        color = "red"
    elif score >= 70:
        priority_level = "high"
        color = "orange"
    elif score >= 50:
        priority_level = "medium"
        color = "yellow"
    else:
        priority_level = "low"
        color = "green"

    return {
        'repository_name': repo_metrics.get('repository_name', 'Unknown'),
        'priority_score': score,
        'priority_level': priority_level,
        'color': color,
        'insights': insights,
        'model_version': '1.0'
    }


def predict_batch(repos: list) -> list:
    """Predict priority scores for multiple repositories."""
    results = []
    for repo in repos:
        try:
            result = predict_priority(repo)
            results.append(result)
        except Exception as e:
            results.append({
                'repository_name': repo.get('repository_name', 'Unknown'),
                'priority_score': 50,
                'error': str(e)
            })

    # Sort by priority score
    results.sort(key=lambda x: x.get('priority_score', 0), reverse=True)
    return results


def run_api_server():
    """Run as a FastAPI prediction service."""
    try:
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware
        import uvicorn
        from pydantic import BaseModel
        from typing import Optional

        app = FastAPI(title="Git AI Priority Predictor", version="1.0.0")

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"]
        )

        class RepoMetrics(BaseModel):
            repository_name: Optional[str] = "Unknown"
            days_since_last_commit: Optional[float] = 0
            total_commits: Optional[int] = 0
            num_files: Optional[int] = 0
            open_issues: Optional[int] = 0
            test_files: Optional[int] = 0
            documentation_score: Optional[float] = 50
            stars: Optional[int] = 0
            forks: Optional[int] = 0
            recent_commits_30d: Optional[int] = 0
            repo_size_kb: Optional[int] = 0
            project_age_days: Optional[int] = 1
            language: Optional[str] = "Unknown"

        @app.get("/health")
        def health():
            return {"status": "ok", "service": "priority-predictor"}

        @app.post("/predict")
        def predict(repo: RepoMetrics):
            return predict_priority(repo.dict())

        @app.post("/predict/batch")
        def predict_batch_endpoint(repos: list[RepoMetrics]):
            return predict_batch([r.dict() for r in repos])

        print("🚀 Starting Priority Prediction API on port 5001...")
        uvicorn.run(app, host="0.0.0.0", port=5001)

    except ImportError:
        print("FastAPI/uvicorn not installed. Run: pip install fastapi uvicorn")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Git AI Priority Predictor')
    parser.add_argument('--repo', type=str, help='Repository metrics as JSON string')
    parser.add_argument('--api', action='store_true', help='Run as API server')
    args = parser.parse_args()

    if args.api:
        run_api_server()
    elif args.repo:
        metrics = json.loads(args.repo)
        result = predict_priority(metrics)
        print(json.dumps(result, indent=2))
    else:
        # Demo prediction
        demo = {
            'repository_name': 'Memory OS',
            'days_since_last_commit': 5,
            'total_commits': 45,
            'num_files': 150,
            'open_issues': 3,
            'test_files': 15,
            'documentation_score': 80,
            'stars': 12,
            'forks': 2,
            'recent_commits_30d': 8,
            'repo_size_kb': 2048,
            'project_age_days': 180,
            'language': 'Python'
        }
        print("Demo prediction:")
        result = predict_priority(demo)
        print(json.dumps(result, indent=2))
