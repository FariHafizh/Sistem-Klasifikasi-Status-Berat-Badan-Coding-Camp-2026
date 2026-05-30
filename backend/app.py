import os
from datetime import datetime
from pathlib import Path

try:
    from dotenv import load_dotenv  # type: ignore

    # Load backend/.env if present (dev convenience)
    load_dotenv()
except Exception:
    # python-dotenv is optional; env vars can still be provided by the shell.
    pass

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from db_setup import db, User, PredictionHistory, Recommendation
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from google import genai
from flask_cors import CORS
from flask_migrate import Migrate
from inference import get_inference

app = Flask(__name__)

def _get_cors_origins() -> list[str]:
    raw = (os.getenv("CORS_ORIGINS") or "").strip()
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


CORS(
    app,
    resources={r"/*": {"origins": _get_cors_origins()}},
    allow_headers=["Content-Type", "Authorization"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# Konfigurasi API Key untuk GenAI
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
client = genai.Client(api_key=GENAI_API_KEY) if GENAI_API_KEY else None

# KONFIGURASI DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://cc_admin:cc123@localhost:5432/capstone_cc'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Kunci rahasia untuk tiap user
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fit-app-rahasia-2026')
jwt = JWTManager(app) # Inisialisasi mesin JWT

db.init_app(app)
migrate = Migrate(app, db)

# BAGIAN INI HANYA UNTUK BIKIN TABEL (dev/local). Pada deploy, sebaiknya pakai migrate.
# Default: OFF. Set AUTO_CREATE_TABLES=1 untuk mengaktifkan.
if os.getenv("AUTO_CREATE_TABLES", "0") == "1":
    with app.app_context():
        db.create_all()

# BAGIAN ROUTE LOGIN DAN REGISTER
@app.route('/', methods=['GET'])
def ui_root():
    if not FRONTEND_DIR.exists():
        return jsonify({'message': 'Frontend folder not found.'}), 404
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/app/', defaults={'requested_path': ''}, methods=['GET'])
@app.route('/app/<path:requested_path>', methods=['GET'])
def ui_app(requested_path: str):
    if not FRONTEND_DIR.exists():
        return jsonify({'message': 'Frontend folder not found.'}), 404

    requested_path = (requested_path or '').lstrip('/')

    if requested_path == '' or requested_path.endswith('/'):
        requested_path = (requested_path.rstrip('/') + '/index').lstrip('/')

    if '.' not in Path(requested_path).name:
        requested_path = f"{requested_path}.html"

    return send_from_directory(FRONTEND_DIR, requested_path)


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Username, email, dan password harus diisi'}), 400

    # Cek email apakah udah terdaftar atau belum
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email sudah digunakan'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User berhasil didaftarkan'}), 201


@app.route('/login', methods=['POST'])
def login():    
    data = request.get_json()
    # User login pakai email, bukan username
    email = data.get('email') 
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email dan password diperlukan'}), 400

    # Sistem mencari berdasarkan email
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Login berhasil',
            'username': user.username, # Kita bisa kembalikan nama usernya untuk ditampilkan di web
            'access_token': access_token
        }), 200
    else:
        return jsonify({'message': 'Email atau password salah'}), 401     
    
@app.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Ambil semua data dari frontend
    age = data.get('age')
    gender_num = data.get('gender_num')
    height = data.get('height')
    weight = data.get('weight')
    ch2o = data.get('ch2o')
    favc_num = data.get('favc_num')
    faf = data.get('faf')
    scc_num = data.get('scc_num')
    family_history_num = data.get('family_history_num')
    caec_num = data.get('caec_num')
    replace_latest = bool(data.get('replace_latest'))
    use_latest_profile = bool(data.get('use_latest_profile'))

    def invalid_input():
        return jsonify({'message': 'input yang anda masukkan tidak valid'}), 400

    if use_latest_profile and (age is None or gender_num is None):
        latest_prediction = (
            PredictionHistory.query.filter_by(user_id=current_user_id)
            .order_by(PredictionHistory.created_at.desc())
            .first()
        )
        if not latest_prediction:
            return jsonify({
                'message': 'Data profil belum tersedia, lakukan prediksi pertama.'
            }), 400
        if age is None:
            age = latest_prediction.age
        if gender_num is None:
            gender_num = latest_prediction.gender_num

    # validasi data input
    if None in (age, gender_num, height, weight, ch2o, favc_num, faf, scc_num, family_history_num, caec_num):
        return jsonify({'message': 'Semua field wajib diisi'}), 400    

    try:
        age = int(age)
        gender_num = int(gender_num)
        height = float(height)
        weight = float(weight)
        ch2o = float(ch2o)
        if age < 12 or age > 100:
            return invalid_input()
        if height < 50 or height > 250:
            return invalid_input()
        if weight < 10 or weight > 350:
            return invalid_input()
        if ch2o not in (1.0, 2.0, 3.0):
            return invalid_input()
        
        # Konversi BMI  (Tinggi cm  ke m)
        height_m = height / 100
        bmi = weight / (height_m ** 2)
        
        # Konversi Water  Intake  per Kg
        water_intake_per_kg = ch2o / weight
        
    except (ValueError, TypeError, ZeroDivisionError):
        return invalid_input()

    # Payload fitur sesuai metadata model (Artficial Intelligence/dnn_metadata.json)
    features_for_model = {
        "Age": int(age),
        "BMI": float(bmi),
        "Water_Intake_Per_Kg": float(water_intake_per_kg),
        "FAF": float(faf),
        "Gender_Num": int(gender_num),
        "family_history_with_overweight_Num": int(family_history_num),
        "CAEC_Num": int(caec_num),
        "FAVC_Num": int(favc_num),
        "SCC_Num": int(scc_num),
    }

    try:
        inference = get_inference()
        model_result = inference.predict(features_for_model)
        status = model_result.get("prediction", "Unknown")
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Gagal memproses model: {str(e)}'}), 500

    # Jika update progress di bulan yang sama, hapus data terbaru dulu.
    if replace_latest:
        latest_prediction = (
            PredictionHistory.query.filter_by(user_id=current_user_id)
            .order_by(PredictionHistory.created_at.desc())
            .first()
        )
        if latest_prediction and latest_prediction.created_at:
            now = datetime.utcnow()
            if (
                latest_prediction.created_at.year == now.year
                and latest_prediction.created_at.month == now.month
            ):
                Recommendation.query.filter_by(
                    prediction_history_id=latest_prediction.id
                ).delete()
                db.session.delete(latest_prediction)
                db.session.flush()

    # Simpan data mentah ke database
    new_history = PredictionHistory(
        user_id=current_user_id,
        age=age,
        gender_num=gender_num,
        height=height,
        weight=weight,
        bmi=bmi,
        favc_num=favc_num,
        ch2o=ch2o,
        faf=faf,
        scc_num=scc_num,
        family_history_num=family_history_num,
        caec_num=caec_num,
        status_kesehatan=status
    )

    db.session.add(new_history)
    db.session.commit()

    # Kembalikan respon ke Frontend
    return jsonify({
        'message': 'Prediksi berhasil dilakukan dan disimpan!',
        'hasil_prediksi': {
            'status_kesehatan': status,
            'bmi': round(bmi, 2),
            'model_used': model_result.get("model_used", "DNN"),
            'probabilities': model_result.get("probabilities", {})
        }
    }), 201


# Endpoint history
@app.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = int(get_jwt_identity())

    user_histories = PredictionHistory.query.filter_by(user_id=current_user_id).order_by(PredictionHistory.created_at.desc()).all()

    if not user_histories:
        return jsonify({'message': 'Belum ada riwayat prediksi', 'data': []}), 200

    history_list = []
    for history in user_histories:
        history_list.append({
            'id': history.id,
            'age': history.age,
            'gender_num': 'Laki-laki' if history.gender_num == 1 else 'Perempuan',
            'height': history.height,
            'weight': history.weight,
            'favc_num': 'Sering makan tinggi kalori' if history.favc_num == 1 else 'Tidak sering makan tinggi kalori',
            'ch2o': history.ch2o,
            'bmi': history.bmi,
            'faf': history.faf,
            'scc_num': 'Monitoring konsumsi kalori' if history.scc_num == 1 else 'Tidak monitoring konsumsi kalori',
            'family_history_num': 'Memiliki riwayat keluarga dengan overweight' if history.family_history_num == 1 else 'Tidak memiliki riwayat keluarga dengan overweight',
            'caec_num': history.caec_num,
            'status_kesehatan': history.status_kesehatan,
            'tanggal': history.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify({
        'message': 'Berhasil mengambil riwayat prediksi',
        'data': history_list
    }), 200

#Endpoint untuk dashboard
@app.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    current_user_id = int(get_jwt_identity())
    
    # .first() mengambil SATU data saja (yang paling atas/terbaru)
    latest_prediction = PredictionHistory.query.filter_by(user_id=current_user_id).order_by(PredictionHistory.created_at.desc()).first()
    
    # Ambil nama user untuk kalimat sapaan
    user = User.query.get(current_user_id)

    if not latest_prediction:
        return jsonify({
            'message': f'Halo {user.username}, Anda belum melakukan tes kesehatan.',
            'has_data': False
        }), 200

    return jsonify({
        'message': f'Selamat datang, {user.username}!',
        'has_data': True,
        'data_terbaru': {
            'weight': latest_prediction.weight,
            'bmi': round(float(latest_prediction.bmi), 2),
            'status_kesehatan': latest_prediction.status_kesehatan,
            'tanggal_tes_terakhir': latest_prediction.created_at.strftime("%Y-%m-%d")
        }
    }), 200
    
@app.route('/recommendation', methods=['GET'])
@jwt_required()
def get_recommendation():
    current_user_id = int(get_jwt_identity())

    cache_only = (request.args.get('cache_only') or '').strip().lower() in ('1', 'true', 'yes')
    force_generate = (request.args.get('force_generate') or '').strip().lower() in (
        '1',
        'true',
        'yes',
    )

    if client is None:
        return jsonify({'message': 'Fitur rekomendasi belum dikonfigurasi (GENAI_API_KEY belum di-set).'}), 503

    # Ambil riwayat prediksi terbaru pengguna
    latest_prediction = PredictionHistory.query.filter_by(user_id=current_user_id).order_by(PredictionHistory.created_at.desc()).first()

    # Kalau user ke rekomendasi tapi belum tes
    if not latest_prediction:
        return jsonify({'message': 'Tidak ada data prediksi untuk memberikan rekomendasi.'}), 404

    # Jika rekomendasi untuk prediksi terbaru sudah ada, pakai cache DB.
    existing = Recommendation.query.filter_by(prediction_history_id=latest_prediction.id).first()
    if existing and not force_generate:
        return jsonify({
            'message': 'Rekomendasi berhasil diambil (cache).',
            'rekomendasi': existing.content_text,
            'has_data': True,
            'cached': True,
        }), 200

    if cache_only and not force_generate:
        return jsonify({
            'message': 'Belum ada rekomendasi tersimpan. Klik "Minta Rekomendasi" untuk membuatnya.',
            'has_data': True,
            'cached': False,
            'rekomendasi': None,
        }), 200

    if existing and force_generate:
        db.session.delete(existing)
        db.session.flush()

    # PROMPT GEMINI MENGGUNAKAN DATA USER
    prompt = f"""
    Kamu adalah seorang ahli gizi dan pelatih kebugaran profesional. Berikan rekomendasi kesehatan singkat, praktis, dan ramah untuk pengguna dengan profil medis berikut:
    - username: {User.query.get(current_user_id).username}
    - Umur: {latest_prediction.age} tahun
    - Jenis Kelamin: {'Laki-laki' if latest_prediction.gender_num == 1 else 'Perempuan'}
    - Tinggi Badan: {latest_prediction.height} cm
    - Berat Badan: {latest_prediction.weight} kg
    - BMI: {latest_prediction.bmi}
    - Water Intake per Kg: {latest_prediction.ch2o / latest_prediction.weight:.2f} gelas/kg
    - Status Kesehatan: {latest_prediction.status_kesehatan}
    - Frekuensi Aktivitas Fisik per Minggu: {latest_prediction.faf}
    - Kebiasaan Makan Tinggi Kalori: {'Sering' if latest_prediction.favc_num == 1 else 'Tidak Sering'}
    - Monitoring Konsumsi Kalori: {'Ya' if latest_prediction.scc_num == 1 else 'Tidak'}
    - Riwayat Keluarga dengan Overweight: {'Ya' if latest_prediction.family_history_num == 1 else 'Tidak'}
    - Kebiasaan Ngemil antara Waktu Makan: {'Ya' if latest_prediction.caec_num == 1 else 'Tidak'}
    
    Formatkan output secara konsisten dengan 3 bagian berikut saja:

    Pola Makan Harian 
    (Kalau dia underweight, tambahkan makan sore, dan cemilan di antara sarapan dan makan siang, kalau normal, overweight, dan obese biarkan default)
    Metode: Metode hanya ada 2 yaitu Surplus Kalori dan Defisit Kalori. Kalau underweight metodenya "Fokus surplus kalori", kalau normal "Diet seimbang dengan kalori sesuai kebutuhan", kalau overweight "Fokus defisit kalori", kalau obese "Fokus defisit kalori")
    Sarapan: <1 kalimat>
    Makan Siang: <1 kalimat>
    Makan Malam: <1 kalimat>
    (Untuk makanan jangan boros kata, cukup sebutkan makanannya. Opsional dengan porsi. Jangan tambah kata kata lain selain itu)
    Tips: <1/2 kalimat> 
    

    Olahraga per Minggu
    (Untuk jadwal mingguan, gunakan hanya sedikit kata saja, jenis dan durasi/repetisi, sesuaikan dengan metodenya)
    (kalau hari istirahat cukup tulis "Istirahat")
    Metode: Metode hanya ada 2 yaitu Strength Training dan Cardio. Kalau underweight metodenya "Fokus latihan beban", kalau normal "Kombinasi latihan beban dan kardio", kalau overweight "Fokus kardio", kalau obese "Fokus kardio")
    Jadwal Mingguan:
    Senin: <1 kalimat>
    Selasa: <1 kalimat>
    Rabu: <1 kalimat>
    Kamis: <1 kalimat>
    Jumat: <1 kalimat>
    Sabtu: <1 kalimat>
    Minggu: <1 kalimat>
    (Oalahraga atau latihannya tolong jangan gunakan istilah seperti olahraga kompetisi/olimpiade atau menggunakan olahraga yang susah dilakukan untuk orang awam, gunakan olahraga yang umumnya dilakukan oleh orang awam)
    Tips: <1/2 kalimat>

    Asupan Air Harian
    (Jangan gunakan kata hingga, sampai, atau kata serupa. Cukup sebutkan jumlah gelas air yang direkomendasikan per hari)
    Target: <1 kalimat> Gunakan template kalimat "x Gelas per hari"
    

    Aturan format:
    - Jangan gunakan markdown, bullet, atau penomoran.
    - Metode dan tips tidak boleh kosong.
    - Gunakan kalimat yang jelas tapi jangan bertele-tele, to the point.
    - Jangan gunakan tanda * atau **.
    - Gunakan "Label: isi" persis seperti format di atas.
    - Hindari menyampaikan ulang data profil pengguna; fokus ke rekomendasi praktis.
    - Gunakan preferensi orang Indonesia baik dalam pola makan ataupun olahraga.
    """
    try:
        # Panggil model
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config={"max_output_tokens": 800}
        )
        
        # Ambil teks rekomendasi dari respon
        rekomendasi_teks = response.text.strip()

        rec = Recommendation(
            user_id=current_user_id,
            prediction_history_id=latest_prediction.id,
            content_text=rekomendasi_teks,
            gen_model="gemini-3.1-flash-lite",
        )
        db.session.add(rec)
        db.session.commit()
        
        # Kirimkan ke frontend
        return jsonify({
            'message': 'Rekomendasi berhasil dibuat!',
            'rekomendasi': rekomendasi_teks,
            'has_data': True,
            'cached': False
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Terjadi kesalahan, coba lagi nanti: {str(e)}'}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
    