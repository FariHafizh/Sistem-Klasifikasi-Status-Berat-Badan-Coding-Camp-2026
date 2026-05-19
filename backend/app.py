from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db_setup import db, User, PredictionHistory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from google import genai

app = Flask(__name__)

#Konfigurasi API Key untuk Genai
client = genai.Client(api_key="AIzaSyDqUHVECVjgkbOveWIMmB6hJfvx16UvHkg")

# KONFIGURASI DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://cc_admin:cc123@localhost:5432/capstone_cc'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Kunci rahasia untuk tiap user
app.config['JWT_SECRET_KEY'] = 'nutricheck-super-rahasia-2026' 
jwt = JWTManager(app) # Inisialisasi mesin JWT

db.init_app(app)

# BAGIAN INI HANYA UNTUK BIKIN TABEL
with app.app_context():
    db.create_all()

# BAGIAN ROUTE LOGIN DAN REGISTER
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Username, email, dan password diperlukan'}), 400

    # Hanya cek email, karena username sekarang boleh sama
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
    current_user_id = get_jwt_identity()
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

    # validasi data input
    if None in (age, gender_num, height, weight, ch2o, favc_num, faf, scc_num, family_history_num, caec_num):
        return jsonify({'message': 'Semua field wajib diisi'}), 400    

    try:
        height = float(height)
        weight = float(weight)
        ch2o = float(ch2o)
        
        # Konversi BMI  (Tinggi cm  ke m)
        height_m = height / 100
        bmi = weight / (height_m ** 2)
        
        # Konversi Water  Intake  per Kg
        water_intake_per_kg = ch2o / weight
        
    except (ValueError, TypeError, ZeroDivisionError):
        return jsonify({'message': 'Terjadi kesalahan format angka atau pembagian dengan nol'}), 400

    # 9 fitur yang diminta tim ML
    features_for_model = [
        bmi, 
        favc_num, 
        water_intake_per_kg, 
        gender_num, 
        age, 
        faf, 
        scc_num, 
        family_history_num, 
        caec_num
    ]
    # DISINI NANTI PANGGIL MODELNYA
    # Logika klasifikasi sementara
    if bmi < 18.5:
        status = "Underweight"
    elif 18.5 <= bmi < 24.9:
        status = "Ideal"
    elif 25 <= bmi < 29.9:
        status = "Overweight"
    else:
        status = "Obesity"

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
            'bmi': round(bmi, 2)
        }
    }), 201


# Endpoint history
@app.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()

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
    current_user_id = get_jwt_identity()
    
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
            'status_kesehatan': latest_prediction.status_kesehatan,
            'tanggal_tes_terakhir': latest_prediction.created_at.strftime("%Y-%m-%d")
        }
    }), 200
    
@app.route('/recomendation', methods=['GET'])
@jwt_required()
def get_recomendation():
    current_user_id = get_jwt_identity()

    # Ambil riwayat prediksi terbaru pengguna
    latest_prediction = PredictionHistory.query.filter_by(user_id=current_user_id).order_by(PredictionHistory.created_at.desc()).first()

    # Kalau user ke rekomendasi tapi belum tes
    if not latest_prediction:
        return jsonify({'message': 'Tidak ada data prediksi untuk memberikan rekomendasi.'}), 404

    # PROMPT GEMINI MENGGUNAKAN DATA USER
    prompt = f"""
    Kamu adalah seorang ahli gizi dan pelatih kebugaran profesional. Tolong berikan rekomendasi kesehatan singkat , praktis, dan ramah untuk pengguna dengan profil medis berikut:
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
    
    Berikan rekomendasi berupa:
    1. Pola makan harian yang disarankan (termasuk contoh menu makanan yang sesuai dengan kondisi dan profil pengguna, serta preferensi umum orang Indonesia).
    2. Aktivitas fisik/olahraga yang aman, cocok, dan sesuai dengan kondisi dan profil pengguna, serta preferensi umum orang Indonesia.
    3. Anjuran asupan air.
    
    Tuliskan jawaban langsung pada poin-poin di atas tanpa basa-basi berlebih dan secara ringkas dengan bahasa yang mudah dipahami. 
    Jadi ada 3 bagian yaitu makanan harian, aktivitas/olahraga, dan anjuran asupan air. Jangan buat bagian lain selain 3 bagian itu. 
    Buat singkat dalam bentuk poin,secara rapi, dan hindari menyampaikan ulang informasi yang sudah ada di data profil pengguna, cukup fokus ke rekomendasi praktisnya saja.
    Karena nanti rekomendasi ini akan dimasukkan ke plan harian pengguna.
    Jika salah satu dari 3 bagian itu menggunakan suatu metode, gunakan metode terbaru yang paling update dan efektif.
    
    Berikan catatan: Rekomendasi ini bersifat umum dan tidak menggantikan konsultasi dengan profesional kesehatan secara langsung. 
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
        
        # Kirimkan ke frontend
        return jsonify({
            'message': 'Rekomendasi berhasil dibuat!',
            'rekomendasi': rekomendasi_teks,
            'has_data': True
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Terjadi kesalahan, coba lagi nanti: {str(e)}'}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
    