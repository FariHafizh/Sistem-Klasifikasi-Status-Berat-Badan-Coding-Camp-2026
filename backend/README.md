# Backend (Flask)

Backend ini menangani:
- Auth (register/login) dengan JWT
- Penyimpanan riwayat prediksi ke database
- Endpoint prediksi yang memanggil model dari folder **Artficial Intelligence**

## Endpoint utama
- `POST /register`
- `POST /login`
- `POST /predict` (JWT required)
- `GET /history` (JWT required)
- `GET /dashboard` (JWT required)
- `GET /recommendation` (JWT required, butuh `GENAI_API_KEY`)

## Environment Variables
Lihat contoh di `.env.example`.

Untuk dev/demo, kamu bisa copy file contoh menjadi `.env` di folder `backend/`.
Backend akan otomatis membaca `.env` saat startup (via `python-dotenv`) jika package terpasang.

Minimal untuk jalan:
- `DATABASE_URL`
- `JWT_SECRET_KEY`

CORS:
- `CORS_ORIGINS` (comma-separated). Contoh: `https://your-vercel-app.vercel.app,http://localhost:5173`

Opsional:
- `GENAI_API_KEY` (tanpa ini, `/recommendation` akan balas 503)

Model:
- `MODEL_TYPE` = `dnn` atau `ml`
- `MODEL_DIR` (default menunjuk ke `../Artficial Intelligence`)
- `DNN_MODEL_FILE` (default `model_dnn_obesitas.keras`)

## Jalankan backend (DNN + ML)
Gunakan Python 3.12 agar TensorFlow tersedia.

Catatan: pastikan Python 3.12 benar-benar terpasang. Cek dengan:

```powershell
py -3.12 -c "import sys; print(sys.version)"
```

Jika muncul error path tidak ditemukan, install ulang Python 3.12 (python.org) atau perbaiki Python Launcher terlebih dulu.

```powershell
cd backend
py -3.12 -m venv .venv312
. .venv312\Scripts\Activate.ps1
pip install -r requirements.txt

# Pastikan env var
# $env:MODEL_TYPE = 'dnn'
# $env:DNN_MODEL_FILE = 'model_dnn_obesitas.keras'
python app.py
```

Jika `MODEL_TYPE=dnn` tapi TensorFlow tidak bisa di-load, backend otomatis fallback ke ML.

## Migration DB (disarankan)
Secara default `AUTO_CREATE_TABLES` dimatikan. Gunakan migration:

```powershell
cd backend
. .venv312\Scripts\Activate.ps1

# Pertama kali (buat revision)
flask db init
flask db migrate -m "init"
flask db upgrade
```

Jika folder `migrations/` sudah ada, cukup:

```powershell
flask db migrate -m "update"
flask db upgrade
```

## Catatan DB
Default masih `localhost` di kode, tapi untuk demo online (history tersimpan) pakai Postgres free-tier (Supabase/Neon) dan set `DATABASE_URL`.
