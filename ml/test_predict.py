"""
Regression test for the trained priority model. Not a training-accuracy test —
just a guard against silent breakage from a scikit-learn/pandas version bump
(e.g. a pickle that no longer loads, or predict() erroring on a fixed input).

Run: python -m pytest test_predict.py -v
Requires a trained model in ../models/ (run train.py first).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import pytest
from predict import predict_priority

SAMPLE_REPO = {
    "repository_name": "test-repo",
    "days_since_last_commit": 5,
    "total_commits": 45,
    "num_files": 150,
    "open_issues": 3,
    "test_files": 15,
    "documentation_score": 80,
    "stars": 12,
    "forks": 2,
    "recent_commits_30d": 8,
    "repo_size_kb": 2048,
    "project_age_days": 180,
    "language": "TypeScript",
}


def test_predict_returns_score_in_valid_range():
    result = predict_priority(SAMPLE_REPO)
    assert 0 <= result["priority_score"] <= 100


def test_predict_returns_expected_shape():
    result = predict_priority(SAMPLE_REPO)
    assert "priority_score" in result
    assert "priority_level" in result
    assert "insights" in result
    assert isinstance(result["insights"], list)


def test_stale_repo_scores_higher_than_active_repo():
    stale = dict(SAMPLE_REPO, days_since_last_commit=400, recent_commits_30d=0, open_issues=25)
    active = dict(SAMPLE_REPO, days_since_last_commit=1, recent_commits_30d=15, open_issues=0)

    stale_result = predict_priority(stale)
    active_result = predict_priority(active)

    assert stale_result["priority_score"] > active_result["priority_score"]


def test_handles_unknown_language_gracefully():
    result = predict_priority(dict(SAMPLE_REPO, language="Brainfuck"))
    assert 0 <= result["priority_score"] <= 100


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
