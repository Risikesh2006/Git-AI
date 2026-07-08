"""
Git AI - ML Training Pipeline
Trains a Random Forest model to predict project priority scores.

Usage:
    python train.py

Output:
    ../models/priority_model.pkl
    ../models/scaler.pkl
    ../models/encoder.pkl
    ../models/feature_cols.json
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from feature_engineering import prepare_for_training

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'training_data.csv')


def train_model():
    print("🤖 Git AI - Priority Model Training")
    print("=" * 50)

    # Prepare data
    print("\n📊 Loading and engineering features...")
    X, y, scaler, le, feature_cols = prepare_for_training(DATA_PATH)

    if y is None:
        raise ValueError("No 'priority' column found in training data!")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n📈 Training set: {len(X_train)} samples")
    print(f"📊 Test set: {len(X_test)} samples")

    # Train Random Forest
    print("\n🌲 Training Random Forest Regressor...")
    rf_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)

    # Evaluate
    rf_pred = rf_model.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_pred)
    rf_r2 = r2_score(y_test, rf_pred)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))

    print(f"\n📊 Random Forest Results:")
    print(f"   MAE:  {rf_mae:.2f}")
    print(f"   RMSE: {rf_rmse:.2f}")
    print(f"   R²:   {rf_r2:.3f}")

    # Cross-validation
    cv_scores = cross_val_score(rf_model, X, y, cv=min(5, len(X)), scoring='r2')
    print(f"   CV R² (mean ± std): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Feature importance
    print("\n🔍 Top Feature Importances:")
    importances = pd.Series(rf_model.feature_importances_, index=feature_cols)
    top_features = importances.sort_values(ascending=False).head(8)
    for feat, imp in top_features.items():
        bar = '█' * int(imp * 50)
        print(f"   {feat:25s}: {bar} ({imp:.3f})")

    # Also try Gradient Boosting for comparison
    print("\n🚀 Training Gradient Boosting Regressor for comparison...")
    gb_model = GradientBoostingRegressor(
        n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
    )
    gb_model.fit(X_train, y_train)
    gb_pred = gb_model.predict(X_test)
    gb_mae = mean_absolute_error(y_test, gb_pred)
    gb_r2 = r2_score(y_test, gb_pred)
    print(f"   GB MAE: {gb_mae:.2f}, R²: {gb_r2:.3f}")

    # Choose best model
    best_model = rf_model if rf_r2 >= gb_r2 else gb_model
    best_name = "Random Forest" if rf_r2 >= gb_r2 else "Gradient Boosting"
    print(f"\n🏆 Best model: {best_name}")

    # Save models
    os.makedirs(MODELS_DIR, exist_ok=True)

    with open(os.path.join(MODELS_DIR, 'priority_model.pkl'), 'wb') as f:
        pickle.dump(best_model, f)

    with open(os.path.join(MODELS_DIR, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)

    with open(os.path.join(MODELS_DIR, 'encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)

    with open(os.path.join(MODELS_DIR, 'feature_cols.json'), 'w') as f:
        json.dump(feature_cols, f)

    # Save metrics
    metrics = {
        'model_type': best_name,
        'mae': float(rf_mae if best_name == "Random Forest" else gb_mae),
        'rmse': float(rf_rmse),
        'r2': float(rf_r2 if best_name == "Random Forest" else gb_r2),
        'cv_r2_mean': float(cv_scores.mean()),
        'cv_r2_std': float(cv_scores.std()),
        'training_samples': len(X_train),
        'feature_count': len(feature_cols),
        'features': feature_cols
    }
    with open(os.path.join(MODELS_DIR, 'model_metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n✅ Models saved to: {MODELS_DIR}")
    print(f"   - priority_model.pkl")
    print(f"   - scaler.pkl")
    print(f"   - encoder.pkl")
    print(f"   - feature_cols.json")
    print(f"   - model_metrics.json")

    return best_model, metrics


if __name__ == '__main__':
    model, metrics = train_model()
    print(f"\n🎯 Training complete! Model R² = {metrics['r2']:.3f}")
