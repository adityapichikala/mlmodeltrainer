from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.regression import run_regression
from ml.classification import run_classification
from ml.clustering import run_clustering

app = FastAPI(
    title="ML Model Trainer — Sklearn Showcase",
    description="Demonstrates Regression, Classification, and Clustering using sklearn datasets.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/regression/train")
def train_regression():
    """Train regression models on California Housing dataset."""
    return run_regression()


@app.get("/api/classification/train")
def train_classification():
    """Train classification models on Iris dataset."""
    return run_classification()


@app.get("/api/clustering/train")
def train_clustering():
    """Train clustering models on Iris dataset (unsupervised)."""
    return run_clustering()
