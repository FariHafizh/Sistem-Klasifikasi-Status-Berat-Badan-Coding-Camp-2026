# Sistem Klasifikasi Status Berat Badan

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=python,flask,react,vite,postgres,git" />
</p>
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1-black?logo=flask)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.19-FF6F00?logo=tensorflow)

Aplikasi web untuk memprediksi status berat badan berdasarkan input kesehatan, menyimpan riwayat, dan memberi rekomendasi action plan.

## Fitur utama
- Registrasi dan login (JWT)
- Prediksi status berat badan (DNN + ML fallback)
- Dashboard ringkas hasil terbaru
- Riwayat prediksi dan grafik progres
- Rekomendasi AI (opsional dengan GENAI_API_KEY)

## Teknologi
- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Migrate
- Model: TensorFlow (DNN), scikit-learn (ML)
- Database: PostgreSQL (Neon/Render)

## Struktur folder
- frontend/           aplikasi React
- backend/            API Flask dan DB
- Artficial Intelligence/  artefak model (scaler, metadata, model)
- datascience/        dataset dan notebook

## Menjalankan lokal
### Backend
1) Siapkan .env di backend/ (lihat .env.example)
2) Jalankan:

```powershell
cd backend
py -3.12 -m venv .venv312
. .venv312\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Frontend berjalan di http://localhost:5173 dan backend di http://localhost:5000.

## Migration DB
Gunakan Alembic (AUTO_CREATE_TABLES=0):

```powershell
cd backend
. .venv312\Scripts\Activate.ps1
$env:FLASK_APP = "app.py"
flask db migrate -m "update"
flask db upgrade
```

## Deploy (Vercel + Render + Neon)
- Backend (Render): set env DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGINS, MODEL_TYPE=dnn, DNN_MODEL_FILE, GENAI_API_KEY (opsional), AUTO_CREATE_TABLES=0
- Frontend (Vercel): set VITE_API_URL ke URL backend Render

## Catatan
- Model default membaca artefak dari folder Artficial Intelligence.
