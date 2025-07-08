from flask import Blueprint, request, jsonify
from src.models import db, Hotel, Tarifa, Concorrente
from datetime import datetime, date, timedelta
from sqlalchemy import and_, or_

comparativo_bp = Blueprint('comparativo', __name__)

@comparativo_bp.route('/comparativo/<int:hotel_id>', methods=['GET'])
def obter_comparativo_hotel(hotel_id):
    """Obtém dados comparativos de um hotel com seus concorrentes"""
    try:
        # Verificar se hotel existe
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        # Parâmetros de filtro
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        # Definir período padrão (próximos 30 dias)
        if not data_inicio:
            data_inicio = date.today()
        else:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        
        if not data_fim:
            data_fim = data_inicio + timedelta(days=30)
        else:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        
        # Validar período
        if data_fim < data_inicio:
            return jsonify({'success': False, 'error': 'Data fim deve ser >= data início'}), 400
        
        if (data_fim - data_inicio).days > 365:
            return jsonify({'success': False, 'error': 'Período máximo de 1 ano'}), 400
        
        # Obter concorrentes
        concorrentes_rel = Concorrente.query.filter_by(hotel_id=hotel_id).all()
        concorrentes = [Hotel.query.get(c.concorrente_id) for c in concorrentes_rel]
        
        # IDs de todos os hotéis (hotel + concorrentes)
        hotel_ids = [hotel.id] + [c.id for c in concorrentes]
        
        # Buscar tarifas do período para todos os hotéis
        tarifas = Tarifa.query.filter(
            and_(
                Tarifa.hotel_id.in_(hotel_ids),
                Tarifa.data_checkin >= data_inicio,
                Tarifa.data_checkin <= data_fim
            )
        ).order_by(Tarifa.data_checkin).all()
        
        # Organizar dados por hotel e data
        dados_por_hotel = {}
        for tarifa in tarifas:
            hotel_tarifa = Hotel.query.get(tarifa.hotel_id)
            if hotel_tarifa.id not in dados_por_hotel:
                dados_por_hotel[hotel_tarifa.id] = {
                    'hotel': hotel_tarifa.to_dict(),
                    'tarifas': {}
                }
            
            data_str = tarifa.data_checkin.isoformat()
            dados_por_hotel[hotel_tarifa.id]['tarifas'][data_str] = {
                'preco': tarifa.preco,
                'data_checkout': tarifa.data_checkout.isoformat(),
                'moeda': tarifa.moeda
            }
        
        # Gerar análise comparativa
        analise = gerar_analise_comparativa(hotel_id, dados_por_hotel, data_inicio, data_fim)
        
        return jsonify({
            'success': True,
            'hotel_foco': hotel.to_dict(),
            'periodo': {
                'data_inicio': data_inicio.isoformat(),
                'data_fim': data_fim.isoformat()
            },
            'dados_por_hotel': dados_por_hotel,
            'analise': analise
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@comparativo_bp.route('/comparativo/<int:hotel_id>/timeline', methods=['GET'])
def obter_timeline_comparativo(hotel_id):
    """Obtém timeline de preços para comparação visual"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        if not data_inicio or not data_fim:
            return jsonify({'success': False, 'error': 'Período é obrigatório'}), 400
        
        data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        
        # Obter concorrentes
        concorrentes = hotel.concorrentes.filter_by(ativo=True).all()
        hotel_ids = [hotel.id] + [c.id for c in concorrentes]
        
        # Buscar tarifas
        tarifas = Tarifa.query.filter(
            and_(
                Tarifa.hotel_id.in_(hotel_ids),
                Tarifa.data_checkin >= data_inicio,
                Tarifa.data_checkin <= data_fim
            )
        ).order_by(Tarifa.data_checkin).all()
        
        # Organizar timeline
        timeline = {}
        current_date = data_inicio
        
        while current_date <= data_fim:
            date_str = current_date.isoformat()
            timeline[date_str] = {}
            
            # Buscar tarifas para esta data
            tarifas_data = [t for t in tarifas if t.data_checkin == current_date]
            
            for tarifa in tarifas_data:
                hotel_tarifa = Hotel.query.get(tarifa.hotel_id)
                timeline[date_str][hotel_tarifa.nome] = {
                    'preco': tarifa.preco,
                    'hotel_id': hotel_tarifa.id,
                    'is_foco': hotel_tarifa.id == hotel_id
                }
            
            current_date += timedelta(days=1)
        
        return jsonify({
            'success': True,
            'timeline': timeline,
            'hoteis': [{'id': h.id, 'nome': h.nome, 'is_foco': h.id == hotel_id} 
                      for h in [hotel] + concorrentes]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@comparativo_bp.route('/comparativo/<int:hotel_id>/oportunidades', methods=['GET'])
def obter_oportunidades(hotel_id):
    """Identifica oportunidades de pricing"""
    try:
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        if not data_inicio or not data_fim:
            # Usar próximos 30 dias como padrão
            data_inicio = date.today()
            data_fim = data_inicio + timedelta(days=30)
        else:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        
        # Obter dados comparativos
        concorrentes = hotel.concorrentes.filter_by(ativo=True).all()
        hotel_ids = [hotel.id] + [c.id for c in concorrentes]
        
        tarifas = Tarifa.query.filter(
            and_(
                Tarifa.hotel_id.in_(hotel_ids),
                Tarifa.data_checkin >= data_inicio,
                Tarifa.data_checkin <= data_fim
            )
        ).all()
        
        # Analisar oportunidades
        oportunidades = []
        
        # Agrupar por data
        tarifas_por_data = {}
        for tarifa in tarifas:
            data_str = tarifa.data_checkin.isoformat()
            if data_str not in tarifas_por_data:
                tarifas_por_data[data_str] = []
            tarifas_por_data[data_str].append(tarifa)
        
        for data_str, tarifas_data in tarifas_por_data.items():
            # Separar tarifa do hotel foco e dos concorrentes
            tarifa_hotel = None
            tarifas_concorrentes = []
            
            for tarifa in tarifas_data:
                if tarifa.hotel_id == hotel_id:
                    tarifa_hotel = tarifa
                else:
                    tarifas_concorrentes.append(tarifa)
            
            if tarifa_hotel and tarifas_concorrentes:
                # Calcular estatísticas dos concorrentes
                precos_concorrentes = [t.preco for t in tarifas_concorrentes]
                preco_min = min(precos_concorrentes)
                preco_max = max(precos_concorrentes)
                preco_medio = sum(precos_concorrentes) / len(precos_concorrentes)
                
                # Identificar oportunidades
                diferenca_min = tarifa_hotel.preco - preco_min
                diferenca_max = tarifa_hotel.preco - preco_max
                diferenca_media = tarifa_hotel.preco - preco_medio
                
                tipo_oportunidade = None
                descricao = None
                
                if tarifa_hotel.preco < preco_min:
                    tipo_oportunidade = 'aumentar_preco'
                    descricao = f'Preço abaixo do mínimo da concorrência. Potencial aumento de R$ {abs(diferenca_min):.2f}'
                elif tarifa_hotel.preco > preco_max:
                    tipo_oportunidade = 'reduzir_preco'
                    descricao = f'Preço acima do máximo da concorrência. Considerar redução de R$ {diferenca_max:.2f}'
                elif diferenca_media > preco_medio * 0.1:  # 10% acima da média
                    tipo_oportunidade = 'revisar_preco'
                    descricao = f'Preço {(diferenca_media/preco_medio)*100:.1f}% acima da média da concorrência'
                
                if tipo_oportunidade:
                    oportunidades.append({
                        'data': data_str,
                        'tipo': tipo_oportunidade,
                        'descricao': descricao,
                        'preco_atual': tarifa_hotel.preco,
                        'preco_min_concorrencia': preco_min,
                        'preco_max_concorrencia': preco_max,
                        'preco_medio_concorrencia': preco_medio,
                        'diferenca_media': diferenca_media,
                        'total_concorrentes': len(tarifas_concorrentes)
                    })
        
        # Ordenar por data
        oportunidades.sort(key=lambda x: x['data'])
        
        return jsonify({
            'success': True,
            'hotel': hotel.to_dict(),
            'periodo': {
                'data_inicio': data_inicio.isoformat(),
                'data_fim': data_fim.isoformat()
            },
            'total_oportunidades': len(oportunidades),
            'oportunidades': oportunidades
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def gerar_analise_comparativa(hotel_id, dados_por_hotel, data_inicio, data_fim):
    """Gera análise comparativa dos dados"""
    try:
        if hotel_id not in dados_por_hotel:
            return {'erro': 'Hotel foco não possui dados no período'}
        
        hotel_foco = dados_por_hotel[hotel_id]
        concorrentes = {k: v for k, v in dados_por_hotel.items() if k != hotel_id}
        
        if not concorrentes:
            return {'erro': 'Nenhum concorrente com dados no período'}
        
        # Calcular estatísticas
        precos_hotel = [t['preco'] for t in hotel_foco['tarifas'].values()]
        
        if not precos_hotel:
            return {'erro': 'Hotel foco não possui tarifas no período'}
        
        # Estatísticas do hotel foco
        stats_hotel = {
            'preco_min': min(precos_hotel),
            'preco_max': max(precos_hotel),
            'preco_medio': sum(precos_hotel) / len(precos_hotel),
            'total_dias': len(precos_hotel)
        }
        
        # Estatísticas dos concorrentes
        todos_precos_concorrentes = []
        stats_concorrentes = {}
        
        for conc_id, conc_data in concorrentes.items():
            precos_conc = [t['preco'] for t in conc_data['tarifas'].values()]
            if precos_conc:
                todos_precos_concorrentes.extend(precos_conc)
                stats_concorrentes[conc_id] = {
                    'nome': conc_data['hotel']['nome'],
                    'preco_min': min(precos_conc),
                    'preco_max': max(precos_conc),
                    'preco_medio': sum(precos_conc) / len(precos_conc),
                    'total_dias': len(precos_conc)
                }
        
        if not todos_precos_concorrentes:
            return {'erro': 'Concorrentes não possuem dados no período'}
        
        # Estatísticas gerais da concorrência
        stats_concorrencia = {
            'preco_min': min(todos_precos_concorrentes),
            'preco_max': max(todos_precos_concorrentes),
            'preco_medio': sum(todos_precos_concorrentes) / len(todos_precos_concorrentes)
        }
        
        # Posicionamento
        posicionamento = 'medio'
        if stats_hotel['preco_medio'] < stats_concorrencia['preco_medio'] * 0.9:
            posicionamento = 'baixo'
        elif stats_hotel['preco_medio'] > stats_concorrencia['preco_medio'] * 1.1:
            posicionamento = 'alto'
        
        return {
            'hotel_foco': stats_hotel,
            'concorrencia': stats_concorrencia,
            'concorrentes': stats_concorrentes,
            'posicionamento': posicionamento,
            'diferenca_media': stats_hotel['preco_medio'] - stats_concorrencia['preco_medio'],
            'percentual_diferenca': ((stats_hotel['preco_medio'] - stats_concorrencia['preco_medio']) / stats_concorrencia['preco_medio']) * 100
        }
        
    except Exception as e:
        return {'erro': str(e)}

