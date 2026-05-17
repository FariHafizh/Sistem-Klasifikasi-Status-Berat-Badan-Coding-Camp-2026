
import numpy as np
import tensorflow as tf
from tensorflow import keras
from flask import Flask, request, jsonify

CLASS_NAMES  = ["Gizi Buruk", "Gizi Kurang", "Gizi Baik", "Gizi Lebih", "Obesitas"]
FEATURE_COLS = ["umur_bulan", "berat_badan_kg", "tinggi_badan_cm",
                "jenis_kelamin", "lingkar_lengan", "lingkar_kepala"]

app   = Flask(__name__)
_model = None

def get_model():
    global _model
    if _model is None:
        from model_classes import NutritionNormalizationLayer, FocalLoss
        _model = keras.models.load_model(
            "saved_model/nutrition_classifier.keras",
            custom_objects={"NutritionNormalizationLayer": NutritionNormalizationLayer,
                            "FocalLoss": FocalLoss}
        )
    return _model

@app.route("/")
def index():
    return jsonify({"service": "Klasifikasi Gizi Anak", "status": "running"})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    try:
        features = np.array([[data[k] for k in FEATURE_COLS]], dtype=np.float32)
        proba    = get_model().predict(features, verbose=0)[0]
        kelas_id = int(np.argmax(proba))
        return jsonify({
            "status_gizi" : CLASS_NAMES[kelas_id],
            "kelas_id"    : kelas_id,
            "confidence"  : round(float(proba[kelas_id]), 4),
            "probabilitas": {c: round(float(p), 4) for c, p in zip(CLASS_NAMES, proba)},
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 422

if __name__ == "__main__":
    app.run(port=5000)
