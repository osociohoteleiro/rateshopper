from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import pandas as pd
import os
from datetime import datetime
from src.models.tarifa import db, Tarifa, ImportacaoLog
import tempfile

tarifa_bp = Blueprint('tarifa', __name__)

ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
MOEDAS_VALIDAS = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'PEN', 'COP']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validar_linha(row, linha_num):
    """Valida uma linha da planilha e retorna erros se houver"""
    erros = []
    
    # Campos obrigatórios
    if pd.isna(row.get('Hotel')) or str(row.get('Hotel')).strip() == '':
        erros.append(f"Linha {linha_num}: Hotel é obrigatório")
    
    if pd.isna(row.get('Data')):
        erros.append(f"Linha {linha_num}: Data é obrigatória")
    else:
        try:
            if isinstance(row['Data'], str):
                datetime.strptime(row['Data'], '%d/%m/%Y')
        except:
            erros.append(f"Linha {linha_num}: Data deve estar no formato DD/MM/AAAA")
    
    if pd.isna(row.get('Tipo_Quarto')) or str(row.get('Tipo_Quarto')).strip() == '':
        erros.append(f"Linha {linha_num}: Tipo_Quarto é obrigatório")
    
    if pd.isna(row.get('Tarifa')):
        erros.append(f"Linha {linha_num}: Tarifa é obrigatória")
    else:
        try:
            tarifa = float(row['Tarifa'])
            if tarifa <= 0:
                erros.append(f"Linha {linha_num}: Tarifa deve ser maior que zero")
        except:
            erros.append(f"Linha {linha_num}: Tarifa deve ser um número válido")
    
    if pd.isna(row.get('Moeda')) or str(row.get('Moeda')).strip() == '':
        erros.append(f"Linha {linha_num}: Moeda é obrigatória")
    elif str(row.get('Moeda')).upper() not in MOEDAS_VALIDAS:
        erros.append(f"Linha {linha_num}: Moeda deve ser uma das seguintes: {', '.join(MOEDAS_VALIDAS)}")
    
    if pd.isna(row.get('Canal')) or str(row.get('Canal')).strip() == '':
        erros.append(f"Linha {linha_num}: Canal é obrigatório")
    
    # Validações opcionais
    if not pd.isna(row.get('Categoria')):
        try:
            categoria = int(row['Categoria'])
            if categoria < 1 or categoria > 5:
                erros.append(f"Linha {linha_num}: Categoria deve estar entre 1 e 5")
        except:
            erros.append(f"Linha {linha_num}: Categoria deve ser um número inteiro")
    
    if not pd.isna(row.get('Ocupacao')):
        try:
            ocupacao = float(row['Ocupacao'])
            if ocupacao < 0 or ocupacao > 100:
                erros.append(f"Linha {linha_num}: Ocupação deve estar entre 0 e 100")
        except:
            erros.append(f"Linha {linha_num}: Ocupação deve ser um número válido")
    
    return erros

@tarifa_bp.route('/upload', methods=['POST'])
def upload_planilha():
    """Upload e processamento de planilha de tarifas"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo de arquivo não permitido. Use .xlsx ou .xls'}), 400
        
        # Criar log de importação
        log = ImportacaoLog(
            nome_arquivo=secure_filename(file.filename),
            status='processando'
        )
        db.session.add(log)
        db.session.commit()
        
        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            file.save(tmp_file.name)
            
            try:
                # Ler planilha
                df = pd.read_excel(tmp_file.name)
                
                # Verificar se tem dados
                if df.empty:
                    log.status = 'erro'
                    log.mensagem_erro = 'Planilha está vazia'
                    db.session.commit()
                    return jsonify({'error': 'Planilha está vazia'}), 400
                
                log.total_registros = len(df)
                
                # Validar e processar dados
                registros_validos = 0
                registros_erro = 0
                erros_detalhados = []
                
                for index, row in df.iterrows():
                    linha_num = index + 2  # +2 porque o pandas começa em 0 e temos cabeçalho
                    erros_linha = validar_linha(row, linha_num)
                    
                    if erros_linha:
                        registros_erro += 1
                        erros_detalhados.extend(erros_linha)
                    else:
                        try:
                            # Converter data
                            if isinstance(row['Data'], str):
                                data_obj = datetime.strptime(row['Data'], '%d/%m/%Y').date()
                            else:
                                data_obj = row['Data'].date() if hasattr(row['Data'], 'date') else row['Data']
                            
                            # Criar registro de tarifa
                            tarifa = Tarifa(
                                hotel=str(row['Hotel']).strip(),
                                data=data_obj,
                                tipo_quarto=str(row['Tipo_Quarto']).strip(),
                                tarifa=float(row['Tarifa']),
                                moeda=str(row['Moeda']).upper().strip(),
                                canal=str(row['Canal']).strip(),
                                localizacao=str(row.get('Localizacao', '')).strip() if not pd.isna(row.get('Localizacao')) else None,
                                categoria=int(row['Categoria']) if not pd.isna(row.get('Categoria')) else None,
                                ocupacao=float(row['Ocupacao']) if not pd.isna(row.get('Ocupacao')) else None,
                                disponibilidade=int(row['Disponibilidade']) if not pd.isna(row.get('Disponibilidade')) else None,
                                observacoes=str(row.get('Observacoes', '')).strip() if not pd.isna(row.get('Observacoes')) else None
                            )
                            
                            db.session.add(tarifa)
                            registros_validos += 1
                            
                        except Exception as e:
                            registros_erro += 1
                            erros_detalhados.append(f"Linha {linha_num}: Erro ao processar - {str(e)}")
                
                # Atualizar log
                log.registros_validos = registros_validos
                log.registros_erro = registros_erro
                
                if registros_validos > 0:
                    db.session.commit()
                    log.status = 'sucesso' if registros_erro == 0 else 'sucesso_com_erros'
                else:
                    db.session.rollback()
                    log.status = 'erro'
                    log.mensagem_erro = 'Nenhum registro válido encontrado'
                
                db.session.commit()
                
                return jsonify({
                    'message': 'Processamento concluído',
                    'log_id': log.id,
                    'total_registros': log.total_registros,
                    'registros_validos': registros_validos,
                    'registros_erro': registros_erro,
                    'erros': erros_detalhados[:50]  # Limitar a 50 erros para não sobrecarregar
                })
                
            finally:
                # Remover arquivo temporário
                os.unlink(tmp_file.name)
                
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@tarifa_bp.route('/tarifas', methods=['GET'])
def listar_tarifas():
    """Lista tarifas com filtros opcionais"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Filtros
        hotel = request.args.get('hotel')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        canal = request.args.get('canal')
        tipo_quarto = request.args.get('tipo_quarto')
        
        query = Tarifa.query
        
        if hotel:
            query = query.filter(Tarifa.hotel.ilike(f'%{hotel}%'))
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data >= data_inicio_obj)
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%d/%m/%Y').date()
            query = query.filter(Tarifa.data <= data_fim_obj)
        if canal:
            query = query.filter(Tarifa.canal.ilike(f'%{canal}%'))
        if tipo_quarto:
            query = query.filter(Tarifa.tipo_quarto.ilike(f'%{tipo_quarto}%'))
        
        # Ordenar por data mais recente
        query = query.order_by(Tarifa.data.desc(), Tarifa.hotel)
        
        # Paginação
        tarifas = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'tarifas': [tarifa.to_dict() for tarifa in tarifas.items],
            'total': tarifas.total,
            'pages': tarifas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao listar tarifas: {str(e)}'}), 500

@tarifa_bp.route('/logs', methods=['GET'])
def listar_logs():
    """Lista logs de importação"""
    try:
        logs = ImportacaoLog.query.order_by(ImportacaoLog.data_importacao.desc()).limit(20).all()
        return jsonify([log.to_dict() for log in logs])
    except Exception as e:
        return jsonify({'error': f'Erro ao listar logs: {str(e)}'}), 500

@tarifa_bp.route('/estatisticas', methods=['GET'])
def estatisticas():
    """Retorna estatísticas básicas dos dados"""
    try:
        total_tarifas = Tarifa.query.count()
        total_hoteis = db.session.query(Tarifa.hotel).distinct().count()
        total_canais = db.session.query(Tarifa.canal).distinct().count()
        
        # Última importação
        ultimo_log = ImportacaoLog.query.order_by(ImportacaoLog.data_importacao.desc()).first()
        
        return jsonify({
            'total_tarifas': total_tarifas,
            'total_hoteis': total_hoteis,
            'total_canais': total_canais,
            'ultima_importacao': ultimo_log.to_dict() if ultimo_log else None
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro ao obter estatísticas: {str(e)}'}), 500

