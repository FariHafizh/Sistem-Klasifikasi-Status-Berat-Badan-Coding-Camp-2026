# Backend (Flask)
Backend ini menangani autentikasi, prediksi status berat badan, penyimpanan riwayat, dan rekomendasi berbasis AI.

## Endpoint utama
- POST /register
- POST /login
- POST /predict (JWT wajib)
- GET /history (JWT wajib)
- GET /dashboard (JWT wajib)
- GET /recommendation (JWT wajib, butuh GENAI_API_KEY)

## Environment variables
Lihat contoh di .env.example. Minimal untuk jalan:
- DATABASE_URL
- JWT_SECRET_KEY

Lainnya:
- CORS_ORIGINS (contoh: https://your-vercel-app.vercel.app,http://localhost:5173)
- GENAI_API_KEY (untuk rekomendasi)
- MODEL_TYPE (dnn atau ml)
- MODEL_DIR (default ke ../Artficial Intelligence)
- DNN_MODEL_FILE (default model_dnn_obesitas.keras)
- AUTO_CREATE_TABLES (0 gunakan migration, 1 auto create)

## Menjalankan backend (DNN + ML)
Gunakan Python 3.12 agar TensorFlow tersedia.

```powershell
cd backend
py -3.12 -m venv .venv312
. .venv312\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Migration DB (disarankan)
Jika folder migrations sudah ada, cukup:

```powershell
cd backend
. .venv312\Scripts\Activate.ps1
$env:FLASK_APP = "app.py"
flask db migrate -m "update"
flask db upgrade
```

Catatan: AUTO_CREATE_TABLES sebaiknya 0 pada deploy.
