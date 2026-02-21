import pandas as pd
import numpy as np


def detect_problem_type(series: pd.Series) -> str:
    """
    Auto-detect whether a target column should trigger classification or regression.

    Rules:
    - If dtype is object/string/bool → classification
    - If dtype is numeric AND unique values <= 20 → classification
    - Otherwise → regression
    """
    dtype = series.dtype

    if dtype == object or dtype.name == "category" or dtype == bool:
        return "classification"

    if np.issubdtype(dtype, np.integer):
        n_unique = series.nunique()
        if n_unique <= 20:
            return "classification"
        return "regression"

    if np.issubdtype(dtype, np.floating):
        return "regression"

    return "classification"
