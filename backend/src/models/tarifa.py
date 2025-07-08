from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Tarifa(db.Model):
    __tablename__ = 'tarifas'
    
    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)  # NOVO
    data_checkin = db.Column(db.Date, nullable=False)
    data_checkout = db.Column(db.Date, nullable=False)
    preco = db.Column(db.Float, nullable=False)
    moeda = db.Column(db.String(3), default='BRL')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    importacao_id = db.Column(db.Integer, db.ForeignKey('importacao_logs.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'hotel_id': self.hotel_id,
            'data_checkin': self.data_checkin.isoformat() if self.data_checkin else None,
            'data_checkout': self.data_checkout.isoformat() if self.data_checkout else None,
            'preco': self.preco,
            'moeda': self.moeda,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'importacao_id': self.importacao_id
        }

class ImportacaoLog(db.Model):
    __tablename__ = 'importacao_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)  # NOVO
    arquivo_nome = db.Column(db.String(255), nullable=False)
    total_registros = db.Column(db.Integer, default=0)
    registros_validos = db.Column(db.Integer, default=0)
    registros_erro = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='processando')
    detalhes_erro = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com tarifas
    tarifas = db.relationship('Tarifa', backref='importacao', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'hotel_id': self.hotel_id,
            'arquivo_nome': self.arquivo_nome,
            'total_registros': self.total_registros,
            'registros_validos': self.registros_validos,
            'registros_erro': self.registros_erro,
            'status': self.status,
            'detalhes_erro': self.detalhes_erro,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }