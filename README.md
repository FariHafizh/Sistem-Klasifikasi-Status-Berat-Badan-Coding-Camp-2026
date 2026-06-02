# Sistem Klasifikasi Status Berat Badan
demo: https://sistem-klasifikasi-status-berat-bad.vercel.app/

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=python,flask,react,vite,postgres" />
</p>

Aplikasi web untuk memprediksi status berat badan berdasarkan input kesehatan, menyimpan riwayat, dan memberi rekomendasi action plan.

## Fitur utama
- Registrasi dan login (JWT)
- Prediksi status berat badan (DNN + ML)
- Dashboard ringkas hasil terbaru
- Riwayat prediksi dan grafik progres
- Rekomendasi AI (dengan Gemini 3.1)

## Teknologi
- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Migrate
- Model: TensorFlow (DNN), scikit-learn (ML)
- Database: PostgreSQL (Neon)

## Struktur folder
- frontend/           aplikasi React
- backend/            API Flask dan DB
- Artficial Intelligence/  artefak model (scaler, metadata, model)
- datascience/        dataset dan notebook

## Menjalankan lokal
### Backend
1) Siapkan .env di backend/ (lihat .env.example)
2) Bisa pakai .venv (gunakan python 3.10-3.12)
3) Jalankan:

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

## Deploy 
- Frontend (Vercel): set VITE_API_URL
- Backend (Railway): set di .env di folder backend

## Catatan
- Model dibaca dari folder models (isinya sama dengan yang ada di Artificial Intellegence)
- Kalo lokal tidak perlu set api deploymentnya
