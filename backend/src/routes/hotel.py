from flask import Blueprint, request, jsonify
from src.models import db, Hotel, Concorrente, Tarifa
from datetime import datetime
import re

hotel_bp = Blueprint('hotel', __name__)

@hotel_bp.route('/hoteis', methods=['GET'])
def listar_hoteis():
    """Lista todos os hotéis cadastrados"""
    try:
        hoteis = Hotel.query.filter_by(ativo=True).order_by(Hotel.nome).all()
        return jsonify({
            'success': True,
            'hoteis': [hotel.to_dict() for hotel in hoteis]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis', methods=['POST'])
def criar_hotel():
    """Cria um novo hotel"""
    try:
        data = request.get_json()
        
        # Validações
        if not data.get('nome'):
            return jsonify({'success': False, 'error': 'Nome é obrigatório'}), 400
        
        # Verificar se já existe hotel com mesmo nome
        hotel_existente = Hotel.query.filter_by(nome=data['nome'], ativo=True).first()
        if hotel_existente:
            return jsonify({'success': False, 'error': 'Já existe um hotel com este nome'}), 400
        
        # Validar URL da Booking se fornecida
        booking_url = data.get('booking_url', '').strip()
        if booking_url and not _validar_booking_url(booking_url):
            return jsonify({'success': False, 'error': 'URL da Booking.com inválida'}), 400
        
        # Validar categoria se fornecida
        categoria = data.get('categoria')
        if categoria is not None and (not isinstance(categoria, int) or categoria < 1 or categoria > 5):
            return jsonify({'success': False, 'error': 'Categoria deve ser um número entre 1 e 5'}), 400
        
        # Criar hotel
        hotel = Hotel(
            nome=data['nome'].strip(),
            booking_url=booking_url if booking_url else None,
            categoria=categoria,
            localizacao=data.get('localizacao', '').strip() if data.get('localizacao') else None
        )
        
        db.session.add(hotel)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Hotel criado com sucesso',
            'hotel': hotel.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>', methods=['GET'])
def obter_hotel(hotel_id):
    """Obtém detalhes de um hotel específico"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        return jsonify({
            'success': True,
            'hotel': hotel.to_dict_with_concorrentes()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>', methods=['PUT'])
def atualizar_hotel(hotel_id):
    """Atualiza um hotel existente"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        data = request.get_json()
        
        # Validações
        if 'nome' in data:
            if not data['nome'].strip():
                return jsonify({'success': False, 'error': 'Nome é obrigatório'}), 400
            
            # Verificar se já existe outro hotel com mesmo nome
            hotel_existente = Hotel.query.filter(
                Hotel.nome == data['nome'].strip(),
                Hotel.id != hotel_id,
                Hotel.ativo == True
            ).first()
            if hotel_existente:
                return jsonify({'success': False, 'error': 'Já existe outro hotel com este nome'}), 400
            
            hotel.nome = data['nome'].strip()
        
        if 'booking_url' in data:
            booking_url = data['booking_url'].strip() if data['booking_url'] else ''
            if booking_url and not _validar_booking_url(booking_url):
                return jsonify({'success': False, 'error': 'URL da Booking.com inválida'}), 400
            hotel.booking_url = booking_url if booking_url else None
        
        if 'categoria' in data:
            categoria = data['categoria']
            if categoria is not None and (not isinstance(categoria, int) or categoria < 1 or categoria > 5):
                return jsonify({'success': False, 'error': 'Categoria deve ser um número entre 1 e 5'}), 400
            hotel.categoria = categoria
        
        if 'localizacao' in data:
            hotel.localizacao = data['localizacao'].strip() if data['localizacao'] else None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Hotel atualizado com sucesso',
            'hotel': hotel.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>', methods=['DELETE'])
def excluir_hotel(hotel_id):
    """Exclui um hotel (soft delete)"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        # Verificar se há tarifas associadas
        total_tarifas = Tarifa.query.filter_by(hotel_id=hotel_id).count()
        if total_tarifas > 0:
            return jsonify({
                'success': False, 
                'error': f'Não é possível excluir hotel com {total_tarifas} tarifas associadas'
            }), 400
        
        # Soft delete
        hotel.ativo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Hotel excluído com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>/concorrentes', methods=['GET'])
def listar_concorrentes(hotel_id):
    """Lista concorrentes de um hotel"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        concorrentes = Concorrente.query.filter_by(hotel_id=hotel_id).all()
        
        return jsonify({
            'success': True,
            'hotel': hotel.to_dict(),
            'concorrentes': [c.to_dict() for c in concorrentes]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>/concorrentes', methods=['POST'])
def adicionar_concorrente(hotel_id):
    """Adiciona um concorrente a um hotel"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        data = request.get_json()
        concorrente_id = data.get('concorrente_id')
        
        if not concorrente_id:
            return jsonify({'success': False, 'error': 'ID do concorrente é obrigatório'}), 400
        
        if concorrente_id == hotel_id:
            return jsonify({'success': False, 'error': 'Hotel não pode ser concorrente de si mesmo'}), 400
        
        concorrente = Hotel.query.filter_by(id=concorrente_id, ativo=True).first()
        if not concorrente:
            return jsonify({'success': False, 'error': 'Concorrente não encontrado'}), 404
        
        # Verificar se já é concorrente
        relacao_existente = Concorrente.query.filter_by(
            hotel_id=hotel_id, 
            concorrente_id=concorrente_id
        ).first()
        
        if relacao_existente:
            return jsonify({'success': False, 'error': 'Este hotel já é um concorrente'}), 400
        
        # Verificar limite de concorrentes (máximo 10)
        total_concorrentes = len(hotel.concorrentes)
        if total_concorrentes >= 10:
            return jsonify({'success': False, 'error': 'Máximo de 10 concorrentes por hotel'}), 400
        
        # Criar relação bidirecional
        relacao1 = Concorrente(hotel_id=hotel_id, concorrente_id=concorrente_id)
        relacao2 = Concorrente(hotel_id=concorrente_id, concorrente_id=hotel_id)
        
        db.session.add(relacao1)
        db.session.add(relacao2)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{concorrente.nome} adicionado como concorrente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@hotel_bp.route('/hoteis/<int:hotel_id>/concorrentes/<int:concorrente_id>', methods=['DELETE'])
def remover_concorrente(hotel_id, concorrente_id):
    """Remove um concorrente de um hotel"""
    try:
        # Remover relação bidirecional
        relacao1 = Concorrente.query.filter_by(hotel_id=hotel_id, concorrente_id=concorrente_id).first()
        relacao2 = Concorrente.query.filter_by(hotel_id=concorrente_id, concorrente_id=hotel_id).first()
        
        if not relacao1:
            return jsonify({'success': False, 'error': 'Relação de concorrência não encontrada'}), 404
        
        if relacao1:
            db.session.delete(relacao1)
        if relacao2:
            db.session.delete(relacao2)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Concorrente removido com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

def _validar_booking_url(url):
    """Valida se a URL é da Booking.com"""
    if not url:
        return True  # URL vazia é válida
    
    # Padrão básico para URLs da Booking.com
    pattern = r'^https?://(www\.)?booking\.com/hotel/.+'
    return bool(re.match(pattern, url, re.IGNORECASE))

