"""
Train a small Random Forest on the UCI Maternal Health Risk dataset and export it
as JSON so the browser can run it OFFLINE (no server needed).

Usage (from backend-fastapi/ml/):
    python train_maternal_model.py maternal_health_risk.csv

Outputs (in ./out/):
    maternal_model.json   -> copy to frontend-modern/src/engine/maternal_model.json
    metrics.json          -> honest metrics for your paper/slides
    maternal_model.joblib -> optional, for server-side use
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score, recall_score)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

FEATURES = ["age", "sbp", "dbp", "bs", "temp_f", "hr"]
LABELS = ["low risk", "mid risk", "high risk"]  # fixed order -> index 0,1,2

# accepted spellings of the columns in the UCI / Kaggle CSV
ALIASES = {
    "age": ["age"],
    "sbp": ["systolicbp", "systolic_bp", "systolic bp", "sbp"],
    "dbp": ["diastolicbp", "diastolic_bp", "diastolic bp", "dbp"],
    "bs": ["bs", "bloodsugar", "blood_sugar", "blood sugar"],
    "temp_f": ["bodytemp", "body_temp", "body temp", "temperature"],
    "hr": ["heartrate", "heart_rate", "heart rate", "hr"],
    "label": ["risklevel", "risk_level", "risk level", "risk"],
}


def load(path):
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    rename = {}
    for target, names in ALIASES.items():
        found = next((c for c in df.columns if c in names), None)
        if found is None:
            raise SystemExit(f"Column for '{target}' not found. Columns are: {list(df.columns)}")
        rename[found] = target
    df = df.rename(columns=rename)[FEATURES + ["label"]]
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    bad = set(df["label"]) - set(LABELS)
    if bad:
        raise SystemExit(f"Unexpected label values: {bad}")
    df["y"] = df["label"].map({l: i for i, l in enumerate(LABELS)})
    return df


def export_forest(rf):
    trees = []
    for est in rf.estimators_:
        t = est.tree_
        value = t.value[:, 0, :]
        value = value / value.sum(axis=1, keepdims=True)  # class probabilities per node
        trees.append({
            "left": t.children_left.tolist(),
            "right": t.children_right.tolist(),
            "feature": t.feature.tolist(),
            "threshold": [float(x) for x in t.threshold],  # full precision: sklearn compares in float32
            "value": [[round(float(p), 4) for p in row] for row in value],
        })
    return trees


def main(csv_path):
    out = Path("out")
    out.mkdir(exist_ok=True)
    df = load(csv_path)
    
    before = len(df)
    df = df[df["hr"] >= 30].reset_index(drop=True)
    print("Rows removed for impossible heart rate (<30 bpm):", before - len(df))

    print("Rows:", len(df))
    print("Value ranges (CHECK UNITS: temp should be Fahrenheit, bs mmol/L):")
    print(df[FEATURES].describe().loc[["min", "max"]].round(1).to_string())

    n_dup = int(df.duplicated().sum())
    df_clean = df.drop_duplicates().reset_index(drop=True)
    print(f"Duplicate rows removed: {n_dup} -> {len(df_clean)} unique rows")
    print("Class counts:", df_clean["label"].value_counts().to_dict())

    X = df_clean[FEATURES].values
    y = df_clean["y"].values

    # split AFTER dropping duplicates so test rows are never seen in training
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42)

    def make():
        return RandomForestClassifier(
            n_estimators=40, max_depth=7, min_samples_leaf=3,
            class_weight="balanced", random_state=42)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_acc = cross_val_score(make(), X, y, cv=cv, scoring="accuracy")
    cv_f1 = cross_val_score(make(), X, y, cv=cv, scoring="f1_macro")

    rf = make().fit(X_tr, y_tr)
    pred = rf.predict(X_te)
    acc = accuracy_score(y_te, pred)
    f1 = f1_score(y_te, pred, average="macro")
    # if high risk doesn't exist in split, default to 0
    rec_high = recall_score(y_te, pred, labels=[2], average=None)[0] if 2 in y_te else 0.0
    cm = confusion_matrix(y_te, pred, labels=[0, 1, 2])

    print("\n5-fold CV accuracy: %.3f +/- %.3f" % (cv_acc.mean(), cv_acc.std()))
    print("5-fold CV macro-F1: %.3f +/- %.3f" % (cv_f1.mean(), cv_f1.std()))
    print("Hold-out accuracy: %.3f | macro-F1: %.3f | HIGH-risk recall: %.3f" % (acc, f1, rec_high))
    print(classification_report(y_te, pred, labels=[0,1,2], target_names=LABELS, digits=3, zero_division=0))
    print("Confusion matrix (rows=true, cols=pred; low/mid/high):\n", cm)

    # final model for shipping: retrain on ALL unique rows
    final = make().fit(X, y)
    importances = dict(zip(FEATURES, [round(float(v), 4) for v in final.feature_importances_]))
    print("Feature importances:", importances)

    model_json = {
        "features": FEATURES,
        "labels": LABELS,
        "n_trees": len(final.estimators_),
        "trees": export_forest(final),
        "importances": importances,
    }
    (out / "maternal_model.json").write_text(json.dumps(model_json, separators=(",", ":")))
    joblib.dump(final, out / "maternal_model.joblib")

    metrics = {
        "dataset": "UCI Maternal Health Risk",
        "rows_raw": int(len(df)), "rows_unique": int(len(df_clean)),
        "duplicates_removed": n_dup,
        "cv5_accuracy_mean": round(float(cv_acc.mean()), 4),
        "cv5_accuracy_std": round(float(cv_acc.std()), 4),
        "cv5_macro_f1_mean": round(float(cv_f1.mean()), 4),
        "holdout_accuracy": round(float(acc), 4),
        "holdout_macro_f1": round(float(f1), 4),
        "holdout_high_risk_recall": round(float(rec_high), 4),
        "confusion_matrix_low_mid_high": cm.tolist(),
        "feature_importances": importances,
        "note": "Vitals-only model. Danger signs and Hb are handled by rules. Not clinically validated.",
    }
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print("\nSaved: out/maternal_model.json, out/metrics.json, out/maternal_model.joblib")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python train_maternal_model.py maternal_health_risk.csv")
    main(sys.argv[1])
