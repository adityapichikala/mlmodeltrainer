"""
Regression demo using California Housing dataset.
Trains: Linear Regression, Decision Tree, Random Forest, SVR
Returns step-by-step logs, per-model metrics, and chart data.
"""

import time
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


def run_regression():
    logs = []

    def log(msg):
        logs.append(msg)

    # 1. Load dataset
    log("📂 Loading California Housing dataset...")
    housing = fetch_california_housing()
    df = pd.DataFrame(housing.data, columns=housing.feature_names)
    df["target"] = housing.target

    log(f"✅ Loaded {len(df):,} samples with {len(housing.feature_names)} features")
    log(f"📋 Features: {', '.join(housing.feature_names)}")
    log(f"🎯 Target: Median house value (in $100k)")

    # 2. Split data
    log("✂️  Splitting data into 80% train / 20% test...")
    X = df[housing.feature_names]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    log(f"   Train: {len(X_train):,} samples | Test: {len(X_test):,} samples")

    # 3. Scale features
    log("⚙️  Scaling features with StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train models
    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    }

    results = []
    best_model = None
    best_r2 = -float("inf")
    best_name = ""

    for name, model in models.items():
        log(f"🏋️  Training {name}...")
        start = time.time()
        model.fit(X_train_scaled, y_train)
        train_time = time.time() - start

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        results.append({
            "model": name,
            "r2": round(r2, 4),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "train_time": round(train_time, 3),
        })

        log(f"   ✅ {name}: R²={r2:.4f} | RMSE={rmse:.4f} | MAE={mae:.4f} ({train_time:.3f}s)")

        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_name = name

    log(f"🏆 Best model: {best_name} (R²={best_r2:.4f})")

    # 5. Chart data — predicted vs actual for best model
    y_pred_best = best_model.predict(X_test_scaled)
    sample_idx = np.random.RandomState(42).choice(len(y_test), size=min(200, len(y_test)), replace=False)
    chart_data = [
        {"actual": round(float(y_test.iloc[i]), 3), "predicted": round(float(y_pred_best[i]), 3)}
        for i in sample_idx
    ]

    # 6. Feature importance from best model
    feature_importance = _get_feature_importance(best_model, housing.feature_names)

    log("📊 Training complete! Results ready.")

    return {
        "dataset": {
            "name": "California Housing",
            "samples": len(df),
            "features": len(housing.feature_names),
            "description": housing.DESCR[:300],
        },
        "logs": logs,
        "metrics": results,
        "best_model": best_name,
        "chart_data": chart_data,
        "feature_importance": feature_importance,
    }


def _get_feature_importance(model, feature_names):
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_).flatten()
        else:
            return []

        pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        return [{"feature": f, "importance": round(float(v), 4)} for f, v in pairs]
    except Exception:
        return []
