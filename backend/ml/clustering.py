"""
Clustering demo using the Iris dataset (unsupervised).
Trains: KMeans, Agglomerative Clustering, DBSCAN
Returns step-by-step logs, per-model metrics, and 2D PCA scatter data.
"""

import time
import numpy as np
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import (
    silhouette_score,
    calinski_harabasz_score,
    davies_bouldin_score,
)


def run_clustering():
    logs = []

    def log(msg):
        logs.append(msg)

    # 1. Load dataset
    log("📂 Loading Iris dataset (unsupervised mode)...")
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    true_labels = iris.target  # We'll use these only for comparison, not training

    log(f"✅ Loaded {len(df)} samples with {len(iris.feature_names)} features")
    log(f"📋 Features: {', '.join(iris.feature_names)}")
    log("🔒 Labels hidden — treating as unsupervised problem")

    # 2. Scale features
    log("⚙️  Scaling features with StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df)

    # 3. PCA for visualization
    log("🔬 Reducing to 2D with PCA for visualization...")
    pca = PCA(n_components=2, random_state=42)
    X_2d = pca.fit_transform(X_scaled)
    explained = pca.explained_variance_ratio_
    log(f"   Explained variance: PC1={explained[0]:.2%}, PC2={explained[1]:.2%} (Total: {sum(explained):.2%})")

    # 4. Train clustering models
    models = {
        "KMeans (k=3)": KMeans(n_clusters=3, random_state=42, n_init=10),
        "KMeans (k=4)": KMeans(n_clusters=4, random_state=42, n_init=10),
        "Agglomerative (k=3)": AgglomerativeClustering(n_clusters=3),
        "DBSCAN (eps=0.8)": DBSCAN(eps=0.8, min_samples=5),
    }

    results = []
    best_model_labels = None
    best_sil = -1.0
    best_name = ""

    for name, model in models.items():
        log(f"🏋️  Training {name}...")
        start = time.time()

        if hasattr(model, "predict"):
            labels = model.fit_predict(X_scaled)
        else:
            labels = model.fit_predict(X_scaled)

        train_time = time.time() - start

        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_noise = list(labels).count(-1)

        if n_clusters < 2:
            log(f"   ⚠️  {name}: Only {n_clusters} cluster found — skipping metrics")
            results.append({
                "model": name,
                "n_clusters": n_clusters,
                "n_noise": n_noise,
                "silhouette": None,
                "calinski_harabasz": None,
                "davies_bouldin": None,
                "train_time": round(train_time, 3),
            })
            continue

        sil = silhouette_score(X_scaled, labels)
        ch = calinski_harabasz_score(X_scaled, labels)
        db = davies_bouldin_score(X_scaled, labels)

        results.append({
            "model": name,
            "n_clusters": n_clusters,
            "n_noise": n_noise,
            "silhouette": round(sil, 4),
            "calinski_harabasz": round(ch, 2),
            "davies_bouldin": round(db, 4),
            "train_time": round(train_time, 3),
        })

        log(f"   ✅ {name}: {n_clusters} clusters | Silhouette={sil:.4f} | CH={ch:.1f} ({train_time:.3f}s)")

        if sil > best_sil:
            best_sil = sil
            best_model_labels = labels
            best_name = name

    log(f"🏆 Best model: {best_name} (Silhouette={best_sil:.4f})")

    # 5. Chart data — 2D PCA scatter with cluster labels
    chart_data = [
        {
            "x": round(float(X_2d[i, 0]), 3),
            "y": round(float(X_2d[i, 1]), 3),
            "cluster": int(best_model_labels[i]),
            "true_label": iris.target_names[true_labels[i]],
        }
        for i in range(len(X_2d))
    ]

    # 6. True labels scatter for comparison
    true_chart_data = [
        {
            "x": round(float(X_2d[i, 0]), 3),
            "y": round(float(X_2d[i, 1]), 3),
            "cluster": int(true_labels[i]),
            "label": iris.target_names[true_labels[i]],
        }
        for i in range(len(X_2d))
    ]

    log("📊 Training complete! Results ready.")

    return {
        "dataset": {
            "name": "Iris (Unsupervised)",
            "samples": len(df),
            "features": len(iris.feature_names),
            "description": "Clustering applied to Iris dataset without using labels. PCA used for 2D visualization.",
        },
        "logs": logs,
        "metrics": results,
        "best_model": best_name,
        "chart_data": chart_data,
        "true_chart_data": true_chart_data,
        "pca_variance": {
            "pc1": round(float(explained[0]), 4),
            "pc2": round(float(explained[1]), 4),
        },
    }
