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
    
# Tabel baru buat nampung data dari prediksi
class PredictionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # data input dari form prediksi
    age = db.Column(db.Integer, nullable=False)
    heigt = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    water_intake = db.Column(db.Float, nullable=False)
    
    # data output
    status_kesehatan = db.Column(db.String(50), nullable=False)
    
    #catat waktu
    created_at = db.Column(db.DateTime, default=datetime.utcnow)