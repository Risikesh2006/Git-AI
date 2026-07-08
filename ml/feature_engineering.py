import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer
import json


FEATURE_COLUMNS = [
    'days_idle',
    'total_commits',
    'num_files',
    'open_issues',
    'test_files',
    'documentation_score',
    'stars',
    'forks',
    'recent_commits_30d',
    'repo_size_kb',
    'project_age_days',
    'language_encoded',
    'commit_frequency',      # commits per day of age
    'test_ratio',            # test files / total files
    'engagement_score',      # stars + forks * 2
    'activity_score'         # recent_commits - days_idle/30
]

def load_and_clean(filepath: str) -> pd.DataFrame:
    """Load CSV and apply basic cleaning."""
    df = pd.read_csv(filepath)
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Handle missing values
    imputer = SimpleImputer(strategy='median')
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    df[numeric_cols] = imputer.fit_transform(df[numeric_cols])

    return df


def encode_language(df: pd.DataFrame) -> tuple[pd.DataFrame, LabelEncoder]:
    """Encode programming language as numeric."""
    le = LabelEncoder()
    if 'language' in df.columns:
        df['language_encoded'] = le.fit_transform(df['language'].fillna('Unknown'))
    else:
        df['language_encoded'] = 0
        le = None
    return df, le


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create derived features from raw metrics."""
    df = df.copy()

    # Avoid division by zero
    age = df.get('project_age_days', pd.Series([1] * len(df))).clip(lower=1)
    files = df.get('num_files', pd.Series([1] * len(df))).clip(lower=1)

    df['commit_frequency'] = df.get('total_commits', 0) / age
    df['test_ratio'] = df.get('test_files', 0) / files
    df['engagement_score'] = df.get('stars', 0) + df.get('forks', 0) * 2
    df['activity_score'] = (
        df.get('recent_commits_30d', 0) -
        df.get('days_idle', 0).fillna(0) / 30
    )

    return df


def normalize_features(df: pd.DataFrame, feature_cols: list, scaler=None) -> tuple[pd.DataFrame, MinMaxScaler]:
    """Normalize features to 0-1 range."""
    available_cols = [c for c in feature_cols if c in df.columns]

    if scaler is None:
        scaler = MinMaxScaler()
        df[available_cols] = scaler.fit_transform(df[available_cols])
    else:
        df[available_cols] = scaler.transform(df[available_cols])

    return df, scaler


def prepare_for_training(filepath: str) -> tuple:
    """Full pipeline for training data preparation."""
    df = load_and_clean(filepath)
    df, le = encode_language(df)
    df = engineer_features(df)

    available_features = [f for f in FEATURE_COLUMNS if f in df.columns]
    X = df[available_features].copy()
    y = df['priority'].values if 'priority' in df.columns else None

    X, scaler = normalize_features(X, available_features)

    print(f"[Feature Engineering] Prepared {len(df)} samples with {len(available_features)} features")
    print(f"[Features] {available_features}")
    if y is not None:
        print(f"[Target] Priority range: {y.min():.0f} - {y.max():.0f}, mean: {y.mean():.1f}")

    return X, y, scaler, le, available_features


def prepare_for_prediction(repo_metrics: dict, scaler: MinMaxScaler, le: LabelEncoder, feature_cols: list) -> np.ndarray:
    """Prepare a single repository for prediction."""
    # Build dataframe row
    row = {
        'days_idle': repo_metrics.get('days_since_last_commit', 0),
        'total_commits': repo_metrics.get('total_commits', 0),
        'num_files': repo_metrics.get('num_files', 0),
        'open_issues': repo_metrics.get('open_issues', 0),
        'test_files': repo_metrics.get('test_files', 0),
        'documentation_score': repo_metrics.get('documentation_score', 0),
        'stars': repo_metrics.get('stars', 0),
        'forks': repo_metrics.get('forks', 0),
        'recent_commits_30d': repo_metrics.get('recent_commits_30d', 0),
        'repo_size_kb': repo_metrics.get('repo_size_kb', 0),
        'project_age_days': repo_metrics.get('project_age_days', 1),
        'language': repo_metrics.get('language', 'Unknown')
    }

    df = pd.DataFrame([row])

    # Encode language
    if le is not None:
        try:
            df['language_encoded'] = le.transform([df['language'].iloc[0]])
        except ValueError:
            df['language_encoded'] = 0
    else:
        df['language_encoded'] = 0

    df = engineer_features(df)

    available_cols = [c for c in feature_cols if c in df.columns]
    df_features = df[available_cols].fillna(0)
    df_features, _ = normalize_features(df_features, available_cols, scaler)

    return df_features.values


if __name__ == '__main__':
    import os
    filepath = os.path.join(os.path.dirname(__file__), 'dataset', 'training_data.csv')
    X, y, scaler, le, features = prepare_for_training(filepath)
    print(f"\n✅ Feature engineering complete!")
    print(f"   X shape: {X.shape}")
    print(f"   y shape: {y.shape if y is not None else 'None'}")
