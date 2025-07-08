from flask import Blueprint, request, jsonify
from src.models import db, Tarifa
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta

analise_bp = Blueprint('analise', __name__)

@analise_bp.route('/benchmarking', methods=['GET'])
def benchmarking():
    """Análise de benchmarking de tarifas"""
    try:
        # Parâmetros de filtro
        hotel_foco = request.args.get('hotel_foco')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        tipo_quarto = request.args.get('tipo_quarto')
        canal = request.args.get('canal')
        localizacao = request.args.get('localizacao')
        
        if not hotel_foco:
            return jsonify({'error': 'Hotel foco é obrigatório para benchmarking'}), 400
        
        # Construir query base
        query = Tarifa.query
        
        # Aplicar filtros
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data >= data_inicio_obj)
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data <= data_fim_obj)
        if tipo_quarto:
            query = query.filter(Tarifa.tipo_quarto.ilike(f'%{tipo_quarto}%'))
        if canal:
            query = query.filter(Tarifa.canal.ilike(f'%{canal}%'))
        if localizacao:
            query = query.filter(Tarifa.localizacao.ilike(f'%{localizacao}%'))
        
        # Obter dados do hotel foco
        tarifas_foco = query.filter(Tarifa.hotel.ilike(f'%{hotel_foco}%')).all()
        
        if not tarifas_foco:
            return jsonify({'error': 'Nenhuma tarifa encontrada para o hotel foco'}), 404
        
        # Obter dados dos concorrentes (outros hotéis)
        tarifas_concorrentes = query.filter(~Tarifa.hotel.ilike(f'%{hotel_foco}%')).all()
        
        # Converter para listas para análise
        dados_foco = [{
            'hotel': t.hotel,
            'data': t.data,
            'tipo_quarto': t.tipo_quarto,
            'tarifa': t.tarifa,
            'canal': t.canal,
            'localizacao': t.localizacao
        } for t in tarifas_foco]
        
        dados_concorrentes = [{
            'hotel': t.hotel,
            'data': t.data,
            'tipo_quarto': t.tipo_quarto,
            'tarifa': t.tarifa,
            'canal': t.canal,
            'localizacao': t.localizacao
        } for t in tarifas_concorrentes]
        
        # Análise de posicionamento
        resultado = {
            'hotel_foco': hotel_foco,
            'periodo': {
                'inicio': data_inicio,
                'fim': data_fim
            },
            'resumo_foco': {
                'total_tarifas': len(df_foco),
                'tarifa_media': float(df_foco['tarifa'].mean()) if not df_foco.empty else 0,
                'tarifa_min': float(df_foco['tarifa'].min()) if not df_foco.empty else 0,
                'tarifa_max': float(df_foco['tarifa'].max()) if not df_foco.empty else 0
            },
            'comparacao_mercado': {},
            'ranking_por_tipo': {},
            'oportunidades': []
        }
        
        if not df_concorrentes.empty:
            # Comparação com mercado
            resultado['resumo_mercado'] = {
                'total_hoteis': df_concorrentes['hotel'].nunique(),
                'total_tarifas': len(df_concorrentes),
                'tarifa_media': float(df_concorrentes['tarifa'].mean()),
                'tarifa_min': float(df_concorrentes['tarifa'].min()),
                'tarifa_max': float(df_concorrentes['tarifa'].max())
            }
            
            # Posicionamento vs mercado
            tarifa_media_foco = df_foco['tarifa'].mean()
            tarifa_media_mercado = df_concorrentes['tarifa'].mean()
            
            resultado['comparacao_mercado'] = {
                'diferenca_percentual': float(((tarifa_media_foco - tarifa_media_mercado) / tarifa_media_mercado) * 100),
                'posicionamento': 'acima' if tarifa_media_foco > tarifa_media_mercado else 'abaixo',
                'gap_valor': float(tarifa_media_foco - tarifa_media_mercado)
            }
            
            # Ranking por tipo de quarto
            for tipo in df_foco['tipo_quarto'].unique():
                tarifas_tipo_foco = df_foco[df_foco['tipo_quarto'] == tipo]['tarifa'].mean()
                tarifas_tipo_mercado = df_concorrentes[df_concorrentes['tipo_quarto'] == tipo]['tarifa']
                
                if not tarifas_tipo_mercado.empty:
                    ranking_position = (tarifas_tipo_mercado < tarifas_tipo_foco).sum() + 1
                    total_hoteis_tipo = tarifas_tipo_mercado.nunique() + 1
                    
                    resultado['ranking_por_tipo'][tipo] = {
                        'posicao': int(ranking_position),
                        'total_hoteis': int(total_hoteis_tipo),
                        'tarifa_media_foco': float(tarifas_tipo_foco),
                        'tarifa_media_mercado': float(tarifas_tipo_mercado.mean()),
                        'percentil': float((ranking_position / total_hoteis_tipo) * 100)
                    }
            
            # Identificar oportunidades
            for tipo in df_foco['tipo_quarto'].unique():
                tarifas_tipo_foco = df_foco[df_foco['tipo_quarto'] == tipo]['tarifa'].mean()
                tarifas_tipo_mercado = df_concorrentes[df_concorrentes['tipo_quarto'] == tipo]['tarifa']
                
                if not tarifas_tipo_mercado.empty:
                    tarifa_media_mercado = tarifas_tipo_mercado.mean()
                    diferenca_percentual = ((tarifas_tipo_foco - tarifa_media_mercado) / tarifa_media_mercado) * 100
                    
                    if diferenca_percentual < -10:
                        resultado['oportunidades'].append({
                            'tipo': 'aumento_preco',
                            'categoria': tipo,
                            'descricao': f'Oportunidade de aumentar preço em {abs(diferenca_percentual):.1f}%',
                            'valor_sugerido': float(tarifa_media_mercado),
                            'valor_atual': float(tarifas_tipo_foco)
                        })
                    elif diferenca_percentual > 15:
                        resultado['oportunidades'].append({
                            'tipo': 'reducao_preco',
                            'categoria': tipo,
                            'descricao': f'Preço {diferenca_percentual:.1f}% acima do mercado',
                            'valor_sugerido': float(tarifa_media_mercado),
                            'valor_atual': float(tarifas_tipo_foco)
                        })
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Erro na análise de benchmarking: {str(e)}'}), 500

@analise_bp.route('/tendencias', methods=['GET'])
def tendencias():
    """Análise de tendências de preços ao longo do tempo"""
    try:
        hotel = request.args.get('hotel')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        tipo_quarto = request.args.get('tipo_quarto')
        
        # Query base
        query = Tarifa.query
        
        if hotel:
            query = query.filter(Tarifa.hotel.ilike(f'%{hotel}%'))
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data >= data_inicio_obj)
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data <= data_fim_obj)
        if tipo_quarto:
            query = query.filter(Tarifa.tipo_quarto.ilike(f'%{tipo_quarto}%'))
        
        # Agrupar por data e calcular médias
        tarifas = query.all()
        
        if not tarifas:
            return jsonify({'error': 'Nenhuma tarifa encontrada para os filtros especificados'}), 404
        
        # Converter para DataFrame
        df = pd.DataFrame([{
            'data': t.data,
            'tarifa': t.tarifa,
            'hotel': t.hotel,
            'tipo_quarto': t.tipo_quarto
        } for t in tarifas])
        
        # Agrupar por data
        tendencia_diaria = df.groupby('data')['tarifa'].agg(['mean', 'min', 'max', 'count']).reset_index()
        tendencia_diaria['data'] = tendencia_diaria['data'].dt.strftime('%d/%m/%Y')
        
        # Agrupar por mês
        df['mes'] = pd.to_datetime(df['data']).dt.to_period('M')
        tendencia_mensal = df.groupby('mes')['tarifa'].agg(['mean', 'min', 'max', 'count']).reset_index()
        tendencia_mensal['mes'] = tendencia_mensal['mes'].astype(str)
        
        # Calcular variação percentual
        if len(tendencia_diaria) > 1:
            primeira_tarifa = tendencia_diaria.iloc[0]['mean']
            ultima_tarifa = tendencia_diaria.iloc[-1]['mean']
            variacao_percentual = ((ultima_tarifa - primeira_tarifa) / primeira_tarifa) * 100
        else:
            variacao_percentual = 0
        
        resultado = {
            'resumo': {
                'total_registros': len(df),
                'periodo_inicio': tendencia_diaria.iloc[0]['data'] if not tendencia_diaria.empty else None,
                'periodo_fim': tendencia_diaria.iloc[-1]['data'] if not tendencia_diaria.empty else None,
                'variacao_percentual': float(variacao_percentual),
                'tarifa_media_periodo': float(df['tarifa'].mean())
            },
            'tendencia_diaria': tendencia_diaria.to_dict('records'),
            'tendencia_mensal': tendencia_mensal.to_dict('records')
        }
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Erro na análise de tendências: {str(e)}'}), 500

@analise_bp.route('/canais', methods=['GET'])
def analise_canais():
    """Análise de performance por canal de distribuição"""
    try:
        hotel = request.args.get('hotel')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = Tarifa.query
        
        if hotel:
            query = query.filter(Tarifa.hotel.ilike(f'%{hotel}%'))
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data >= data_inicio_obj)
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data <= data_fim_obj)
        
        tarifas = query.all()
        
        if not tarifas:
            return jsonify({'error': 'Nenhuma tarifa encontrada'}), 404
        
        # Converter para DataFrame
        df = pd.DataFrame([{
            'canal': t.canal,
            'tarifa': t.tarifa,
            'hotel': t.hotel
        } for t in tarifas])
        
        # Análise por canal
        analise_por_canal = df.groupby('canal').agg({
            'tarifa': ['mean', 'min', 'max', 'count'],
            'hotel': 'nunique'
        }).round(2)
        
        # Flatten column names
        analise_por_canal.columns = ['tarifa_media', 'tarifa_min', 'tarifa_max', 'total_tarifas', 'total_hoteis']
        analise_por_canal = analise_por_canal.reset_index()
        
        # Calcular share de cada canal
        total_tarifas = len(df)
        analise_por_canal['share_percentual'] = (analise_por_canal['total_tarifas'] / total_tarifas * 100).round(1)
        
        # Identificar canal mais caro e mais barato
        canal_mais_caro = analise_por_canal.loc[analise_por_canal['tarifa_media'].idxmax()]
        canal_mais_barato = analise_por_canal.loc[analise_por_canal['tarifa_media'].idxmin()]
        
        resultado = {
            'resumo': {
                'total_canais': len(analise_por_canal),
                'canal_mais_caro': {
                    'nome': canal_mais_caro['canal'],
                    'tarifa_media': float(canal_mais_caro['tarifa_media'])
                },
                'canal_mais_barato': {
                    'nome': canal_mais_barato['canal'],
                    'tarifa_media': float(canal_mais_barato['tarifa_media'])
                },
                'diferenca_percentual': float(((canal_mais_caro['tarifa_media'] - canal_mais_barato['tarifa_media']) / canal_mais_barato['tarifa_media']) * 100)
            },
            'analise_detalhada': analise_por_canal.to_dict('records')
        }
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Erro na análise de canais: {str(e)}'}), 500

@analise_bp.route('/ranking', methods=['GET'])
def ranking_hoteis():
    """Ranking de hotéis por tarifa média"""
    try:
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        tipo_quarto = request.args.get('tipo_quarto')
        canal = request.args.get('canal')
        localizacao = request.args.get('localizacao')
        
        query = Tarifa.query
        
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data >= data_inicio_obj)
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data <= data_fim_obj)
        if tipo_quarto:
            query = query.filter(Tarifa.tipo_quarto.ilike(f'%{tipo_quarto}%'))
        if canal:
            query = query.filter(Tarifa.canal.ilike(f'%{canal}%'))
        if localizacao:
            query = query.filter(Tarifa.localizacao.ilike(f'%{localizacao}%'))
        
        tarifas = query.all()
        
        if not tarifas:
            return jsonify({'error': 'Nenhuma tarifa encontrada'}), 404
        
        # Converter para DataFrame
        df = pd.DataFrame([{
            'hotel': t.hotel,
            'tarifa': t.tarifa,
            'localizacao': t.localizacao,
            'categoria': t.categoria
        } for t in tarifas])
        
        # Ranking por hotel
        ranking = df.groupby('hotel').agg({
            'tarifa': ['mean', 'min', 'max', 'count'],
            'localizacao': 'first',
            'categoria': 'first'
        }).round(2)
        
        # Flatten column names
        ranking.columns = ['tarifa_media', 'tarifa_min', 'tarifa_max', 'total_tarifas', 'localizacao', 'categoria']
        ranking = ranking.reset_index()
        
        # Ordenar por tarifa média (decrescente)
        ranking = ranking.sort_values('tarifa_media', ascending=False)
        ranking['posicao'] = range(1, len(ranking) + 1)
        
        # Calcular percentis
        ranking['percentil'] = ranking['tarifa_media'].rank(pct=True) * 100
        
        resultado = {
            'total_hoteis': len(ranking),
            'tarifa_media_geral': float(df['tarifa'].mean()),
            'ranking': ranking.to_dict('records')
        }
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Erro no ranking de hotéis: {str(e)}'}), 500

