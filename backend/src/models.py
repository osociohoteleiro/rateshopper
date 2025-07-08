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
    concorrentes = db.relationship('Concorrente', foreign_keys='Concorrente.hotel_id', backref='hotel_principal', lazy=True, cascade='all, delete-orphan')
    
    def get_concorrentes(self):
        """Retorna lista de hotéis concorrentes"""
        concorrentes_ids = db.session.query(Concorrente.concorrente_id).filter_by(hotel_id=self.id).all()
        if concorrentes_ids:
            ids = [c[0] for c in concorrentes_ids]
            return Hotel.query.filter(Hotel.id.in_(ids)).all()
        return []
    
    def add_concorrente(self, concorrente_id):
        """Adiciona um concorrente"""
        if concorrente_id == self.id:
            return False, "Hotel não pode ser concorrente de si mesmo"
        
        existing = Concorrente.query.filter_by(hotel_id=self.id, concorrente_id=concorrente_id).first()
        if existing:
            return False, "Concorrente já cadastrado"
        
        concorrente = Concorrente(hotel_id=self.id, concorrente_id=concorrente_id)
        db.session.add(concorrente)
        return True, "Concorrente adicionado com sucesso"
    
    def remove_concorrente(self, concorrente_id):
        """Remove um concorrente"""
        concorrente = Concorrente.query.filter_by(hotel_id=self.id, concorrente_id=concorrente_id).first()
        if concorrente:
            db.session.delete(concorrente)
            return True, "Concorrente removido com sucesso"
        return False, "Concorrente não encontrado"
    
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
            'total_concorrentes': len(self.get_concorrentes())
        }
    
    def to_dict_with_concorrentes(self):
        data = self.to_dict()
        data['concorrentes'] = [c.to_dict() for c in self.get_concorrentes()]
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

class Tarifa(db.Model):
    __tablename__ = 'tarifas'
    
    id = db.Column(db.Integer, primary_key=True)
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)
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
    hotel_id = db.Column(db.Integer, db.ForeignKey('hoteis.id'), nullable=False)
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

