from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
import json
import os

app = Flask(__name__)

# ─── LOAD ARTEFAK ────────────────────────────────────────────────────

# Scaler (wajib ada)
scaler = joblib.load('scaler_obesitas.pkl')

# Load metadata DNN
with open('dnn_metadata.json', 'r') as f:
    dnn_meta = json.load(f)

# Pilih model berdasarkan metadata
API_MODEL_TYPE = dnn_meta.get('api_model_type', 'ml')

if API_MODEL_TYPE == 'dnn':
    import tensorflow as tf
    dnn_model = tf.keras.models.load_model('model_dnn_obesitas.keras')
    ml_model  = None
    print("[API] Menggunakan model: DNN (TensorFlow)")
else:
    ml_model  = joblib.load('model_obesitas.pkl')
    dnn_model = None
    print("[API] Menggunakan model: ML Klasik")

# Konfigurasi fitur
FEATURE_COLS  = dnn_meta['input_features']
COLS_TO_SCALE = dnn_meta['cols_to_scale']
LABEL_MAP     = {int(k): v for k, v in dnn_meta['label_map'].items()}

# ─── HELPER ──────────────────────────────────────────────────────────

def preprocess(data: dict) -> pd.DataFrame:
    """Validasi, buat DataFrame, dan scale fitur kontinu."""
    missing = [f for f in FEATURE_COLS if f not in data]
    if missing:
        raise ValueError(f"Fitur tidak ditemukan: {missing}")
    df_in = pd.DataFrame([data])[FEATURE_COLS]
    df_in[COLS_TO_SCALE] = scaler.transform(df_in[COLS_TO_SCALE])
    return df_in


def predict_ml(df_in: pd.DataFrame) -> dict:
    pred_num   = int(ml_model.predict(df_in)[0])
    pred_label = LABEL_MAP.get(pred_num, 'Unknown')
    proba_dict = {}
    if hasattr(ml_model, 'predict_proba'):
        proba = ml_model.predict_proba(df_in)[0]
        proba_dict = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)}
    return {'prediction': pred_label, 'prediction_id': pred_num,
            'probabilities': proba_dict, 'model_used': 'ML'}


def predict_dnn(df_in: pd.DataFrame) -> dict:
    proba = dnn_model.predict(df_in.values, verbose=0)[0]
    pred_num   = int(np.argmax(proba))
    pred_label = LABEL_MAP.get(pred_num, 'Unknown')
    proba_dict = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)}
    return {'prediction': pred_label, 'prediction_id': pred_num,
            'probabilities': proba_dict, 'model_used': 'DNN'}

# ─── ENDPOINTS ───────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status'      : 'OK',
        'message'     : 'Obesity Classification API',
        'model_active': API_MODEL_TYPE.upper(),
        'endpoints'   : {
            'predict'     : 'POST /predict',
            'predict_ml'  : 'POST /predict/ml  (paksa ML model)',
            'predict_dnn' : 'POST /predict/dnn (paksa DNN model)',
            'health'      : 'GET  /health',
            'features'    : 'GET  /features'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'sehat', 'model_active': API_MODEL_TYPE})


@app.route('/features', methods=['GET'])
def features():
    return jsonify({
        'features'     : FEATURE_COLS,
        'cols_to_scale': COLS_TO_SCALE,
        'label_map'    : LABEL_MAP,
        'description'  : {
            'Age'                               : 'Usia (tahun)',
            'BMI'                               : 'Body Mass Index (kg/m2)',
            'Water_Intake_Per_Kg'               : 'Asupan air per kg berat badan',
            'FAF'                               : 'Frekuensi aktivitas fisik (0-3)',
            'Gender_Num'                        : '0=Male, 1=Female',
            'family_history_with_overweight_Num': '0=Tidak, 1=Ya',
            'CAEC_Num'                          : '0=no, 1=Sometimes, 2=Frequently, 3=Always',
            'FAVC_Num'                          : '0=no, 1=yes (konsumsi makanan tinggi kalori)',
            'SCC_Num'                           : '0=no, 1=yes (monitoring kalori)'
        }
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Prediksi dengan model aktif (default dari metadata)."""
    try:
        data   = request.get_json(force=True)
        df_in  = preprocess(data)
        result = predict_dnn(df_in) if API_MODEL_TYPE == 'dnn' else predict_ml(df_in)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict/ml', methods=['POST'])
def predict_ml_endpoint():
    """Paksa prediksi dengan ML model."""
    if ml_model is None:
        # Lazy-load ML model
        import joblib as jl
        _ml = jl.load('model_obesitas.pkl')
    else:
        _ml = ml_model
    try:
        data  = request.get_json(force=True)
        df_in = preprocess(data)
        pred_num   = int(_ml.predict(df_in)[0])
        pred_label = LABEL_MAP.get(pred_num, 'Unknown')
        proba_dict = {}
        if hasattr(_ml, 'predict_proba'):
            proba = _ml.predict_proba(df_in)[0]
            proba_dict = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)}
        return jsonify({'prediction': pred_label, 'prediction_id': pred_num,
                        'probabilities': proba_dict, 'model_used': 'ML'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict/dnn', methods=['POST'])
def predict_dnn_endpoint():
    """Paksa prediksi dengan DNN (TensorFlow)."""
    if dnn_model is None:
        import tensorflow as tf
        _dnn = tf.keras.models.load_model('model_dnn_obesitas.keras')
    else:
        _dnn = dnn_model
    try:
        data  = request.get_json(force=True)
        df_in = preprocess(data)
        proba = _dnn.predict(df_in.values, verbose=0)[0]
        pred_num   = int(np.argmax(proba))
        pred_label = LABEL_MAP.get(pred_num, 'Unknown')
        proba_dict = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)}
        return jsonify({'prediction': pred_label, 'prediction_id': pred_num,
                        'probabilities': proba_dict, 'model_used': 'DNN'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)