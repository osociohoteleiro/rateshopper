from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Hotel(db.Model):
    __tablename__ = 'hoteis'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    booking_url = db.Column(db.String(500), nullable=True)
    categoria = db.Column(db.Integer, nullable=True)  # 1-5 estrelas
    localizacao = db.Column(db.String(200), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    tarifas = db.relationship('Tarifa', backref='hotel', lazy=True, cascade='all, delete-orphan')
    importacoes = db.relationship('ImportacaoLog', backref='hotel', lazy=True, cascade='all, delete-orphan')
    
    # Relacionamento de concorrentes (many-to-many)
    concorrentes = db.relationship(
        'Hotel',
        secondary='concorrentes',
        primaryjoin='Hotel.id == Concorrente.hotel_id',
        secondaryjoin='Hotel.id == Concorrente.concorrente_id',
        backref='competidores',
        lazy=True
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'booking_url': self.booking_url,
            'categoria': self.categoria,
            'localizacao': self.localizacao,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'total_tarifas': len(self.tarifas),
            'total_concorrentes': len(self.concorrentes)
        }
    
    def to_dict_with_concorrentes(self):
        data = self.to_dict()
        data['concorrentes'] = [c.to_dict() for c in self.concorrentes]
        return data

class Concorrente(db.Model):
    __tablename__ = 'concorrentes'
    
    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)
    concorrente_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Constraint para evitar duplicatas e auto-referência
    __table_args__ = (
        db.UniqueConstraint('hotel_id', 'concorrente_id', name='unique_concorrente'),
        db.CheckConstraint('hotel_id != concorrente_id', name='no_self_reference')
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'hotel_id': self.hotel_id,
            'concorrente_id': self.concorrente_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

