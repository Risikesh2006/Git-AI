"""
Git AI - Training Data Generator

The original training_data.csv shipped with only 15 hand-written rows and no
`language` column (which feature_engineering.py requires), which is far too
little data to train a generalizable Random Forest and produces a language
feature that is always zero.

This script keeps the original 15 real-world-shaped rows and adds a larger set
of synthetically generated ones, all labeled with a priority formula that
mirrors the product's own attention heuristic (idle time, issues, docs, tests,
stars, recent activity) plus noise - so the model learns the same signal the
JS fallback heuristic encodes, rather than an arbitrary function.

Usage:
    python generate_training_data.py
"""

import csv
import os
import random

OUT_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'training_data.csv')

LANGUAGES = ['TypeScript', 'Python', 'JavaScript', 'Go', 'Rust', 'Java', 'C++', 'Ruby']

# The 15 original rows, now with a language assigned per repo.
ORIGINAL_ROWS = [
    ('Memory OS', 5, 45, 150, 3, 15, 80, 12, 2, 8, 2048, 180, 'TypeScript'),
    ('Smart Student Hub', 12, 23, 89, 7, 5, 60, 5, 1, 3, 1024, 90, 'Python'),
    ('Portfolio Website', 30, 15, 45, 1, 0, 40, 3, 0, 0, 512, 365, 'JavaScript'),
    ('CLI Tool Kit', 45, 8, 32, 5, 0, 30, 8, 3, 0, 256, 200, 'Go'),
    ('Weather Dashboard', 60, 6, 28, 2, 2, 55, 15, 4, 1, 384, 150, 'JavaScript'),
    ('API Gateway', 3, 78, 210, 10, 25, 90, 45, 12, 15, 4096, 400, 'Go'),
    ('Todo App', 90, 12, 40, 0, 0, 20, 2, 0, 0, 128, 120, 'JavaScript'),
    ('Blog Engine', 20, 35, 120, 4, 8, 75, 20, 5, 5, 2048, 250, 'Ruby'),
    ('Data Pipeline', 7, 55, 180, 8, 20, 85, 30, 8, 10, 3072, 300, 'Python'),
    ('Mobile App', 15, 40, 160, 6, 12, 70, 18, 3, 8, 1536, 210, 'TypeScript'),
    ('DevOps Scripts', 25, 20, 65, 3, 5, 50, 10, 2, 2, 512, 160, 'Python'),
    ('Game Engine', 50, 30, 200, 12, 10, 45, 25, 6, 3, 5120, 500, 'C++'),
    ('Auth Service', 8, 60, 140, 5, 30, 88, 35, 9, 12, 2560, 280, 'Java'),
    ('PDF Generator', 35, 18, 75, 2, 3, 65, 8, 1, 2, 768, 130, 'Rust'),
    ('Discord Bot', 22, 28, 95, 4, 6, 72, 22, 7, 6, 1024, 170, 'Python'),
]

HEADER = [
    'repository_name', 'days_idle', 'total_commits', 'num_files', 'open_issues',
    'test_files', 'documentation_score', 'stars', 'forks', 'recent_commits_30d',
    'repo_size_kb', 'project_age_days', 'language', 'priority'
]


def priority_formula(days_idle, open_issues, documentation_score, test_files,
                      stars, recent_commits_30d, noise):
    """Mirrors backend/services/repository.js:calculatePriorityScore so the
    trained model and the JS fallback agree on what 'needs attention' means."""
    idle_score = min(30, (days_idle / 30) * 30)
    issue_score = min(20, open_issues * 2)
    doc_score = max(0, 15 - (documentation_score / 100) * 15)
    test_score = 15 if test_files == 0 else max(0, 10 - test_files)
    star_score = min(10, (stars / 10) * 10)
    activity_score = min(10, (recent_commits_30d / 5) * 10)
    score = idle_score + issue_score + doc_score + test_score + star_score + activity_score
    return max(0, min(100, round(score + noise)))


def synthesize(n, seed=42):
    rng = random.Random(seed)
    rows = []
    for i in range(n):
        days_idle = rng.choice([rng.randint(0, 10), rng.randint(10, 45), rng.randint(45, 200)])
        total_commits = rng.randint(1, 400)
        num_files = rng.randint(5, 600)
        open_issues = rng.randint(0, 40)
        test_files = rng.choice([0, 0, rng.randint(1, 60)])
        documentation_score = rng.randint(0, 100)
        stars = rng.choice([0, 0, rng.randint(1, 500)])
        forks = max(0, int(stars * rng.uniform(0, 0.3)))
        recent_commits_30d = rng.randint(0, 60) if days_idle < 45 else rng.randint(0, 3)
        repo_size_kb = rng.randint(16, 20000)
        project_age_days = rng.randint(5, 2000)
        language = rng.choice(LANGUAGES)
        noise = rng.uniform(-6, 6)

        priority = priority_formula(
            days_idle, open_issues, documentation_score, test_files,
            stars, recent_commits_30d, noise
        )

        rows.append((
            f'synthetic-repo-{i}', days_idle, total_commits, num_files, open_issues,
            test_files, documentation_score, stars, forks, recent_commits_30d,
            repo_size_kb, project_age_days, language, priority
        ))
    return rows


def main():
    synthetic_rows = synthesize(400)
    all_rows = ORIGINAL_ROWS + synthetic_rows

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)
        for r in all_rows:
            name, days_idle, total_commits, num_files, open_issues, test_files, \
                documentation_score, stars, forks, recent_commits_30d, repo_size_kb, \
                project_age_days, language = r[:13]
            if len(r) == 13:
                # Original rows: compute priority via the same formula for consistency
                # instead of trusting the hand-picked label, so the target distribution
                # is coherent across both sources.
                priority = priority_formula(
                    days_idle, open_issues, documentation_score, test_files,
                    stars, recent_commits_30d, noise=0
                )
            else:
                priority = r[13]
            writer.writerow([
                name, days_idle, total_commits, num_files, open_issues, test_files,
                documentation_score, stars, forks, recent_commits_30d, repo_size_kb,
                project_age_days, language, priority
            ])

    print(f"Wrote {len(all_rows)} rows to {OUT_PATH}")


if __name__ == '__main__':
    main()
