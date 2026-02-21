import os
import json
import logging
import pandas as pd
from typing import Callable
from ml.detect import detect_problem_type

logger = logging.getLogger(__name__)


class RedisProgressLogger:
    """Wraps a publish function so PyCaret's logs can be intercepted and streamed."""

    def __init__(self, publish_fn: Callable[[dict], None]):
        self.publish_fn = publish_fn

    def log(self, msg: str, level: str = "INFO"):
        self.publish_fn({"type": "LOG", "level": level, "message": msg})


def run_automl(
    file_path: str,
    target_col: str,
    publish_fn: Callable[[dict], None],
) -> dict:
    """
    Core AutoML function.
    1. Load data & detect problem type.
    2. Run PyCaret setup (handles imputation + encoding automatically).
    3. Compare top 3 models.
    4. Extract metrics, feature importance, confusion matrix.
    Returns a serialisable results dict.
    """
    publish_fn({"type": "LOG", "message": "📂 Loading dataset..."})
    df = pd.read_csv(file_path)
    publish_fn({"type": "LOG", "message": f"✅ Loaded {len(df):,} rows × {len(df.columns)} columns."})

    # Detect problem type
    problem_type = detect_problem_type(df[target_col])
    publish_fn({"type": "LOG", "message": f"🔍 Detected problem type: {problem_type.upper()}"})

    if problem_type == "classification":
        return _run_classification(df, target_col, publish_fn)
    else:
        return _run_regression(df, target_col, publish_fn)


def _run_classification(df: pd.DataFrame, target_col: str, publish_fn: Callable) -> dict:
    from pycaret.classification import (
        setup, compare_models, pull, get_config,
        predict_model, plot_model
    )
    import numpy as np

    publish_fn({"type": "LOG", "message": "⚙️  Setting up PyCaret (classification)..."})
    publish_fn({"type": "LOG", "message": "🔧 Handling missing values & encoding..."})

    setup(
        data=df,
        target=target_col,
        imputation_type="simple",
        session_id=42,
        verbose=False,
        html=False,
    )

    publish_fn({"type": "LOG", "message": "🏋️  Comparing models (top 3)..."})
    top_models = compare_models(n_select=3, verbose=False)
    results_df = pull()

    # Best model is the first
    best_model = top_models[0] if isinstance(top_models, list) else top_models
    best_name = type(best_model).__name__

    publish_fn({"type": "LOG", "message": f"🏆 Best model: {best_name}"})

    # Metrics from compare_models result (first row)
    first_row = results_df.iloc[0]
    accuracy = float(first_row.get("Accuracy", 0))
    f1 = float(first_row.get("F1", 0))
    auc = float(first_row.get("AUC", 0)) if "AUC" in first_row else None

    publish_fn({"type": "LOG", "message": f"📊 Accuracy: {accuracy:.4f} | F1: {f1:.4f}"})

    # Feature importance
    feature_importance = _get_feature_importance(best_model, get_config("X_train"))

    # Confusion matrix
    confusion_matrix_data = _get_confusion_matrix(best_model, get_config("X_test"), get_config("y_test"))

    return {
        "problem_type": "classification",
        "metrics": {
            "problem_type": "classification",
            "accuracy": accuracy,
            "f1_score": f1,
            "auc": auc,
        },
        "feature_importance": feature_importance,
        "confusion_matrix": confusion_matrix_data,
        "best_model_name": best_name,
    }


def _run_regression(df: pd.DataFrame, target_col: str, publish_fn: Callable) -> dict:
    from pycaret.regression import (
        setup, compare_models, pull, get_config,
    )

    publish_fn({"type": "LOG", "message": "⚙️  Setting up PyCaret (regression)..."})
    publish_fn({"type": "LOG", "message": "🔧 Handling missing values & encoding..."})

    setup(
        data=df,
        target=target_col,
        imputation_type="simple",
        session_id=42,
        verbose=False,
        html=False,
    )

    publish_fn({"type": "LOG", "message": "🏋️  Comparing models (top 3)..."})
    top_models = compare_models(n_select=3, verbose=False)
    results_df = pull()

    best_model = top_models[0] if isinstance(top_models, list) else top_models
    best_name = type(best_model).__name__

    publish_fn({"type": "LOG", "message": f"🏆 Best model: {best_name}"})

    first_row = results_df.iloc[0]
    rmse = abs(float(first_row.get("RMSE", 0)))
    r2 = float(first_row.get("R2", 0))
    mae = abs(float(first_row.get("MAE", 0)))

    publish_fn({"type": "LOG", "message": f"📊 RMSE: {rmse:.4f} | R²: {r2:.4f} | MAE: {mae:.4f}"})

    feature_importance = _get_feature_importance(best_model, get_config("X_train"))

    return {
        "problem_type": "regression",
        "metrics": {
            "problem_type": "regression",
            "rmse": rmse,
            "r2": r2,
            "mae": mae,
        },
        "feature_importance": feature_importance,
        "confusion_matrix": None,
        "best_model_name": best_name,
    }


def _get_feature_importance(model, X_train: pd.DataFrame) -> list[dict]:
    """Extract feature importance from a fitted model safely."""
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = abs(model.coef_).flatten()
        else:
            return []

        cols = X_train.columns.tolist()
        pairs = sorted(
            zip(cols, importances), key=lambda x: x[1], reverse=True
        )
        return [{"feature": f, "importance": round(float(i), 6)} for f, i in pairs[:20]]
    except Exception:
        return []


def _get_confusion_matrix(model, X_test: pd.DataFrame, y_test) -> dict | None:
    """Compute confusion matrix for classification tasks."""
    try:
        from sklearn.metrics import confusion_matrix
        import numpy as np

        preds = model.predict(X_test)
        labels = sorted(list(map(str, set(y_test.tolist()))))
        cm = confusion_matrix(y_test, preds, labels=list(set(y_test.tolist())))
        return {
            "labels": labels,
            "matrix": cm.tolist(),
        }
    except Exception:
        return None
