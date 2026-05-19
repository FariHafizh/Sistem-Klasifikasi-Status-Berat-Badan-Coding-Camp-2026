
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify

# ── Konstanta ─────────────────────────────────────────────────────────
COLS_TO_SCALE   = ["Age", "BMI", "Water_Intake_Per_Kg"]
FEATURE_ORDER   = ["Age", "BMI", "Water_Intake_Per_Kg", "FAF",
                   "family_history_with_overweight_Num",
                   "CAEC_Num", "FAVC_Num", "SCC_Num"]
CLASS_NAMES     = ["Underweight", "Normal", "Overweight", "Obesity"]

# Mapping untuk input mentah dari user
CAEC_MAP  = {"no": 0, "Sometimes": 1, "Frequently": 2, "Always": 3}
BINARY_MAP = {"no": 0, "yes": 1}

# ── Load scaler & model ───────────────────────────────────────────────
scaler = joblib.load("scaler_obesitas.pkl")
model  = joblib.load("model_obesitas_best.pkl")

app = Flask(__name__)

# ── Helper: preprocess raw input ──────────────────────────────────────
def preprocess(data: dict) -> pd.DataFrame:
    """
    Menerima input mentah dari user, menghitung fitur turunan,
    melakukan encoding, dan mengembalikan DataFrame siap prediksi.
    """
    # Hitung BMI dan Water Intake Per Kg dari Height/Weight/CH2O
    height = float(data["Height"])
    weight = float(data["Weight"])
    ch2o   = float(data["CH2O"])

    bmi                 = weight / (height ** 2)
    water_intake_per_kg = ch2o / weight

    row = {
        "Age"                                : float(data["Age"]),
        "BMI"                                : bmi,
        "Water_Intake_Per_Kg"                : water_intake_per_kg,
        "FAF"                                : float(data["FAF"]),
        "family_history_with_overweight_Num" : BINARY_MAP.get(str(data["family_history_with_overweight"]).strip().lower(), 0),
        "CAEC_Num"                           : CAEC_MAP.get(str(data["CAEC"]).strip(), 1),
        "FAVC_Num"                           : BINARY_MAP.get(str(data["FAVC"]).strip().lower(), 0),
        "SCC_Num"                            : BINARY_MAP.get(str(data["SCC"]).strip().lower(), 0),
    }

    df_input = pd.DataFrame([row])[FEATURE_ORDER]

    # Scale kolom kontinu
    df_input[COLS_TO_SCALE] = scaler.transform(df_input[COLS_TO_SCALE])

    return df_input


# ── Endpoint: Health Check ────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status" : "ok",
        "model"  : type(model).__name__,
        "scaler" : type(scaler).__name__,
        "classes": CLASS_NAMES
    })


# ── Endpoint: Predict ─────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if data is None:
            return jsonify({"error": "Request body harus berupa JSON"}), 400

        # Validasi field wajib
        required = ["Age", "Height", "Weight", "CH2O", "FAF",
                    "family_history_with_overweight", "CAEC", "FAVC", "SCC"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Field berikut wajib diisi: {missing}"}), 400

        # Preprocess
        df_input = preprocess(data)

        # Prediksi
        pred_idx   = int(model.predict(df_input)[0])
        pred_label = CLASS_NAMES[pred_idx]

        # Probabilitas (jika model support)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(df_input)[0]
            probabilities = {cls: round(float(p), 4) for cls, p in zip(CLASS_NAMES, proba)}
        else:
            probabilities = None

        response = {
            "predicted_class" : pred_label,
            "class_index"     : pred_idx,
            "probabilities"   : probabilities,
            "input_processed" : {
                "BMI"                : round(float(data["Weight"]) / (float(data["Height"]) ** 2), 2),
                "Water_Intake_Per_Kg": round(float(data["CH2O"]) / float(data["Weight"]), 4),
            }
        }

        return jsonify(response)

    except KeyError as e:
        return jsonify({"error": f"Field tidak valid: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
