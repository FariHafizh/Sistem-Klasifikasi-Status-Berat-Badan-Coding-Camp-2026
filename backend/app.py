from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db_setup import db, User 

app = Flask(__name__)

# KONFIGURASI DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://cc_admin:cc123@localhost:5432/capstone_cc'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# BAGIAN INI HANYA UNTUK BIKIN TABEL
with app.app_context():
    db.create_all()

# BAGIAN ROUTE (TARUH DI LUAR / SEJAJAR DENGAN APP)
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username dan password diperlukan'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username sudah digunakan'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit() # Simpan ke PostgreSQL

    return jsonify({'message': 'User berhasil didaftarkan'}), 201

@app.route('/login', methods=['POST'])
def login():    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username dan password diperlukan'}), 400

    user = User.query.filter_by(username=username).first()
    
    # Werkzeug mengecek apakah password yang diinput COCOK dengan hash di DB
    if user and check_password_hash(user.password, password):
        return jsonify({'message': 'Login berhasil'}), 200
    else:
        return jsonify({'message': 'Username atau password salah'}), 401     
        
if __name__ == '__main__':
    app.run(debug=True)