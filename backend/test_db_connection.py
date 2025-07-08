#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models import db, Hotel, Concorrente, Tarifa, ImportacaoLog
from flask import Flask
from sqlalchemy import text

# Configurar Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://mariadb:OSH40400Xxl..n@ep.osociohoteleiro.com.br:3306/osh-ia'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def test_connection():
    """Testa a conexão com o banco de dados"""
    try:
        with app.app_context():
            # Testar conexão
            with db.engine.connect() as connection:
                result = connection.execute(text('SELECT 1'))
                print("✅ Conexão com banco de dados estabelecida com sucesso!")
            
            # Listar tabelas existentes
            with db.engine.connect() as connection:
                result = connection.execute(text("SHOW TABLES"))
                existing_tables = [row[0] for row in result]
                print(f"📋 Tabelas existentes no banco: {existing_tables}")
            
            # Criar tabelas do Rate Shopper se não existirem
            print("🔧 Criando tabelas do Rate Shopper...")
            db.create_all()
            print("✅ Tabelas criadas/verificadas com sucesso!")
            
            # Verificar tabelas após criação
            with db.engine.connect() as connection:
                result = connection.execute(text("SHOW TABLES"))
                all_tables = [row[0] for row in result]
                print(f"📋 Todas as tabelas no banco: {all_tables}")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro ao conectar com banco de dados: {e}")
        return False

if __name__ == "__main__":
    test_connection()

