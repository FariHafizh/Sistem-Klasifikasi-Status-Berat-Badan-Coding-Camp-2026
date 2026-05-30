from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Mendefinisikan Tabel User untuk Login/Register
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    histories= db.relationship('PredictionHistory', backref='owner', lazy=True)
    recommendations = db.relationship('Recommendation', backref='owner', lazy=True)
    
# Tabel baru buat nampung data dari prediksi
class PredictionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # data input dari dari user saat ngisi form prediksi
    age = db.Column(db.Integer, nullable=False)
    gender_num = db.Column(db.Integer, nullable=False) # 0 untuk perempuan, 1 untuk laki-laki
    height = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    favc_num = db.Column(db.Integer, nullable=False) # 0 untuk tidak sering makan tinggi kalori, 1 untuk suka makan tinggi kalori
    ch2o = db.Column(db.Float, nullable=False) # jumlah gelas air minum per hari
    faf = db.Column(db.Float, nullable=False) # frekuensi aktivitas fisik per minggu
    scc_num = db.Column(db.Integer, nullable=False) # 0 untuk tidak monitoring konsumsi kalori, 1 untuk monitoring konsumsi kalori 
    family_history_num = db.Column(db.Integer, nullable=False) # 0 untuk tidak punya riwayat keluarga dengan overweight, 1 untuk punya riwayat keluarga dengan overweight
    caec_num = db.Column(db.Integer, nullable=False) # 0 untuk tidak ngemil antara waktu makan, 1 untuk ngemil antara waktu makan
    
    # data output
    status_kesehatan = db.Column(db.String(50), nullable=False)
    confidence_score = db.Column(db.Float, nullable=True)
    
    #catat waktu
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Recommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    prediction_history_id = db.Column(
        db.Integer,
        db.ForeignKey('prediction_history.id'),
        nullable=False,
        unique=True,
    )

    content_text = db.Column(db.Text, nullable=False)
    gen_model = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)