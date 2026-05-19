from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load model dan scaler yang sudah disimpan
model  = joblib.load('model_obesitas.pkl')
scaler = joblib.load('scaler_obesitas.pkl')

# Urutan fitur harus sama persis dengan saat training
FEATURE_COLS    = [
    'Age', 'BMI', 'Water_Intake_Per_Kg', 'FAF',
    'Gender_Num', 'family_history_with_overweight_Num',
    'CAEC_Num', 'FAVC_Num', 'SCC_Num'
]
COLS_TO_SCALE   = ['Age', 'BMI', 'Water_Intake_Per_Kg']

LABEL_MAP = {
    0: 'Underweight',
    1: 'Normal',
    2: 'Overweight',
    3: 'Obese'
}


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status'  : 'OK',
        'message' : 'Obesity Classification API',
        'endpoints': {
            'predict' : 'POST /predict',
            'health'  : 'GET  /health'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'sehat'})


@app.route('/predict', methods=['POST'])
def predict():
    """
    Body JSON yang diharapkan:
    {
        "Age"                               : 25,
        "BMI"                               : 23.5,
        "Water_Intake_Per_Kg"               : 0.035,
        "FAF"                               : 2,
        "Gender_Num"                        : 1,
        "family_history_with_overweight_Num": 1,
        "CAEC_Num"                          : 1,
        "FAVC_Num"                          : 1,
        "SCC_Num"                           : 0
    }

    Keterangan Gender_Num: 0 = Male, 1 = Female
    Keterangan CAEC_Num  : 0=no, 1=Sometimes, 2=Frequently, 3=Always
    """
    try:
        data = request.get_json(force=True)

        # Validasi semua fitur tersedia
        missing = [f for f in FEATURE_COLS if f not in data]
        if missing:
            return jsonify({'error': f'Fitur berikut tidak ditemukan: {missing}'}), 400

        # Buat DataFrame dari input
        df_input = pd.DataFrame([data])[FEATURE_COLS]

        # Scale hanya kolom kontinu
        df_input[COLS_TO_SCALE] = scaler.transform(df_input[COLS_TO_SCALE])

        # Prediksi
        pred_num   = model.predict(df_input)[0]
        pred_label = LABEL_MAP.get(int(pred_num), 'Unknown')

        # Probabilitas (jika model mendukung)
        proba_dict = {}
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(df_input)[0]
            proba_dict = {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)}

        return jsonify({
            'prediction'   : pred_label,
            'prediction_id': int(pred_num),
            'probabilities': proba_dict
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)