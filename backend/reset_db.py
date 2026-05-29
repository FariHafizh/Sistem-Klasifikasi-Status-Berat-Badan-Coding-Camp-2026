from app import app
from db_setup import db

with app.app_context():
    db.drop_all()  
    db.create_all()
    print("Database dibersihkan.")