from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db_setup import db, User 
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)

# KONFIGURASI DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://cc_admin:cc123@localhost:5432/capstone_cc'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Kunci rahasia ini digunakan untuk "stempel" tiket agar tidak bisa dipalsukan
app.config['JWT_SECRET_KEY'] = 'nutricheck-super-rahasia-2026' 
jwt = JWTManager(app) # Inisialisasi mesin JWT

db.init_app(app)

# BAGIAN INI HANYA UNTUK BIKIN TABEL
with app.app_context():
    db.create_all()

# BAGIAN ROUTE (TARUH DI LUAR / SEJAJAR DENGAN APP)
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
    
#Endpoint Percobaan JWT
@app.route('/dashboard-test', methods=['GET'])
@jwt_required() # Harus ada token untuk masuk.
def dashboard_test():
    # Mengambil ID user dari token yang sedang dipakai
    current_user_id = get_jwt_identity()
    
    # Mencari siapa nama user pemilik ID tersebut di database
    user = User.query.get(current_user_id)
    
    return jsonify({
        'message': f'Akses ditolak untuk umum. Tapi selamat datang, {user.username}!',
        'user_id': current_user_id,
        'info': 'Ini adalah data rahasia dari halaman dashboard.'
    }), 200
        
if __name__ == '__main__':
    app.run(debug=True)