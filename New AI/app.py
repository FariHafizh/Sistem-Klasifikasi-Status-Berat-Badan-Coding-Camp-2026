"""
Flask API — Sistem Klasifikasi Obesitas
Model : best_model_obesitas.pkl  (pilih otomatis dari training)
Scaler: scaler_obesitas.pkl      (QuantileTransformer)

Fitur input (9 fitur):
  Kontinyu  (di-scale) : Age, BMI, Water_Intake_Per_Kg
  Diskrit/Biner (raw)  : FAF, Gender_Num, family_history_with_overweight_Num,
                         CAEC_Num, FAVC_Num, SCC_Num
"""

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# ── Load artefak ────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model  = joblib.load(os.path.join(BASE_DIR, "best_model_obesitas.pkl"))
    scaler = joblib.load(os.path.join(BASE_DIR, "scaler_obesitas.pkl"))
    print("✅ Model dan Scaler berhasil di-load.")
except FileNotFoundError as e:
    raise RuntimeError(
        "File model/scaler tidak ditemukan. "
        "Jalankan notebook dulu sampai sel Modeling selesai."
    ) from e

# ── Konfigurasi fitur ────────────────────────────────────────────────────────
FEATURES_SCALED   = ["Age", "BMI", "Water_Intake_Per_Kg"]          # di-scale
FEATURES_UNSCALED = [                                                # raw
    "FAF", "Gender_Num",
    "family_history_with_overweight_Num",
    "CAEC_Num", "FAVC_Num", "SCC_Num"
]
ALL_FEATURES = FEATURES_SCALED + FEATURES_UNSCALED  # urutan harus konsisten

LABEL_MAP = {0: "Underweight", 1: "Normal", 2: "Overweight", 3: "Obesity"}


# ── Helper ───────────────────────────────────────────────────────────────────
def validate_and_parse(data: dict):
    """Validasi semua field ada dan bisa dikonversi ke float."""
    missing = [f for f in ALL_FEATURES if f not in data]
    if missing:
        return None, f"Field berikut wajib ada: {missing}"

    try:
        values = {f: float(data[f]) for f in ALL_FEATURES}
    except (TypeError, ValueError) as exc:
        return None, f"Nilai tidak valid: {exc}"

    return values, None


def build_input_array(values: dict) -> np.ndarray:
    """Susun array, scale kolom kontinu, biarkan yang lain."""
    # Kolom yang di-scale
    cont_vals = np.array([[values[f] for f in FEATURES_SCALED]])
    cont_scaled = scaler.transform(cont_vals)[0]

    # Kolom diskrit/biner (urutan sama dengan ALL_FEATURES)
    disc_vals = np.array([values[f] for f in FEATURES_UNSCALED])

    # Gabungkan: scaled dulu, lalu diskrit
    return np.concatenate([cont_scaled, disc_vals]).reshape(1, -1)


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "API Klasifikasi Obesitas",
        "endpoints": {
            "POST /predict"         : "Prediksi satu data",
            "POST /predict_batch"   : "Prediksi banyak data sekaligus",
            "GET  /features"        : "Lihat daftar & penjelasan fitur",
            "GET  /health"          : "Cek status API"
        }
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status"      : "ok",
        "model_type"  : type(model).__name__,
        "scaler_type" : type(scaler).__name__,
        "n_features"  : len(ALL_FEATURES),
        "features"    : ALL_FEATURES
    })


@app.route("/features", methods=["GET"])
def features():
    return jsonify({
        "total_fitur": len(ALL_FEATURES),
        "keterangan": {
            "Age"                              : "Usia (tahun, kontinu)",
            "BMI"                              : "Body Mass Index = Weight/(Height^2)",
            "Water_Intake_Per_Kg"              : "CH2O / Weight (liter per kg)",
            "FAF"                              : "Frekuensi Aktivitas Fisik (0-3, diskrit)",
            "Gender_Num"                       : "Jenis kelamin: 0=Male, 1=Female",
            "family_history_with_overweight_Num": "Riwayat keluarga obesitas: 0=no, 1=yes",
            "CAEC_Num"                         : "Konsumsi makan di luar: no=0, Sometimes=1, Frequently=2, Always=3",
            "FAVC_Num"                         : "Konsumsi makanan berkalori tinggi: 0=no, 1=yes",
            "SCC_Num"                          : "Pantau kalori harian: 0=no, 1=yes"
        },
        "output_label": LABEL_MAP
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Body JSON contoh:
    {
        "Age": 25,
        "BMI": 27.5,
        "Water_Intake_Per_Kg": 0.03,
        "FAF": 2,
        "Gender_Num": 1,
        "family_history_with_overweight_Num": 1,
        "CAEC_Num": 1,
        "FAVC_Num": 1,
        "SCC_Num": 0
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Body JSON kosong atau tidak valid."}), 400

    values, err = validate_and_parse(data)
    if err:
        return jsonify({"error": err}), 422

    X = build_input_array(values)

    pred_class = int(model.predict(X)[0])
    pred_label = LABEL_MAP[pred_class]

    # Probabilitas (kalau model support)
    proba = None
    if hasattr(model, "predict_proba"):
        proba_arr = model.predict_proba(X)[0]
        proba = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba_arr)}

    return jsonify({
        "prediction"   : pred_label,
        "class_num"    : pred_class,
        "probabilities": proba,
        "input_received": values
    })


@app.route("/predict_batch", methods=["POST"])
def predict_batch():
    """
    Body JSON: list of objects, tiap object punya 9 fitur di atas.
    [
        {"Age": 25, "BMI": 27.5, ...},
        {"Age": 35, "BMI": 31.0, ...}
    ]
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, list):
        return jsonify({"error": "Body harus berupa JSON array."}), 400

    results = []
    for i, row in enumerate(data):
        values, err = validate_and_parse(row)
        if err:
            results.append({"index": i, "error": err})
            continue

        X = build_input_array(values)
        pred_class = int(model.predict(X)[0])
        pred_label = LABEL_MAP[pred_class]

        proba = None
        if hasattr(model, "predict_proba"):
            proba_arr = model.predict_proba(X)[0]
            proba = {LABEL_MAP[j]: round(float(p), 4) for j, p in enumerate(proba_arr)}

        results.append({
            "index"        : i,
            "prediction"   : pred_label,
            "class_num"    : pred_class,
            "probabilities": proba
        })

    return jsonify({"total": len(data), "results": results})


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
