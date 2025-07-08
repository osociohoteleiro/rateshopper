from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
imporfrom flask import Blueprint, request, jsonify
from src.models import db, Tarifa, ImportacaoLog, Hotelifa_bp = Blueprint('tarifa', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_brazilian_date(date_str):
    """Converte data no formato brasileiro DD/MM/AAAA para objeto date"""
    try:
        if pd.isna(date_str) or date_str == '':
            return None
        
        # Se já é um objeto datetime, extrair apenas a data
        if isinstance(date_str, datetime):
            return date_str.date()
        
        # Se é string, fazer parse
        date_str = str(date_str).strip()
        return datetime.strptime(date_str, '%d/%m/%Y').date()
    except:
        return None

def parse_brazilian_price(price_str):
    """Converte preço no formato brasileiro (vírgula decimal) para float"""
    try:
        if pd.isna(price_str) or price_str == '':
            return None
        
        # Se já é número, retornar
        if isinstance(price_str, (int, float)):
            return float(price_str)
        
        # Se é string, fazer parse
        price_str = str(price_str).strip()
        # Substituir vírgula por ponto
        price_str = price_str.replace(',', '.')
        return float(price_str)
    except:
        return None

@tarifa_bp.route('/upload', methods=['POST'])
def upload_planilha():
    """Upload e processamento de planilha de tarifas"""
    try:
        # Verificar se hotel foi selecionado
        hotel_id = request.form.get('hotel_id')
        if not hotel_id:
            return jsonify({'success': False, 'error': 'Seleção de hotel é obrigatória'}), 400
        
        # Verificar se hotel existe
        hotel = Hotel.query.filter_by(id=hotel_id, ativo=True).first()
        if not hotel:
            return jsonify({'success': False, 'error': 'Hotel não encontrado'}), 404
        
        # Verificar se arquivo foi enviado
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Formato de arquivo não suportado. Use .xlsx ou .xls'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Criar log de importação
        importacao = ImportacaoLog(
            hotel_id=hotel_id,
            arquivo_nome=filename,
            status='processando'
        )
        db.session.add(importacao)
        db.session.commit()
        
        try:
            # Processar planilha
            resultado = processar_planilha_tarifas(filepath, hotel_id, importacao.id)
            
            # Atualizar log de importação
            importacao.total_registros = resultado['total_registros']
            importacao.registros_validos = resultado['registros_validos']
            importacao.registros_erro = resultado['registros_erro']
            importacao.status = 'concluido' if resultado['registros_erro'] == 0 else 'concluido_com_erros'
            importacao.detalhes_erro = '\n'.join(resultado['erros']) if resultado['erros'] else None
            
            db.session.commit()
            
            # Remover arquivo temporário
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': 'Planilha processada com sucesso',
                'hotel': hotel.nome,
                'resultado': resultado,
                'importacao_id': importacao.id
            })
            
        except Exception as e:
            importacao.status = 'erro'
            importacao.detalhes_erro = str(e)
            db.session.commit()
            
            # Remover arquivo temporário
            if os.path.exists(filepath):
                os.remove(filepath)
            
            raise e
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

def processar_planilha_tarifas(filepath, hotel_id, importacao_id):
    """Processa planilha de tarifas no formato de 3 colunas"""
    try:
        # Ler planilha sem header (3 colunas: check-in, check-out, preço)
        df = pd.read_excel(filepath, header=None)
        
        # Verificar se tem exatamente 3 colunas
        if len(df.columns) != 3:
            raise ValueError(f'Planilha deve ter exatamente 3 colunas. Encontradas: {len(df.columns)}')
        
        # Renomear colunas para facilitar processamento
        df.columns = ['data_checkin', 'data_checkout', 'preco']
        
        total_registros = len(df)
        registros_validos = 0
        registros_erro = 0
        erros = []
        
        for index, row in df.iterrows():
            try:
                # Parse das datas
                data_checkin = parse_brazilian_date(row['data_checkin'])
                data_checkout = parse_brazilian_date(row['data_checkout'])
                preco = parse_brazilian_price(row['preco'])
                
                # Validações
                if not data_checkin:
                    erros.append(f'Linha {index + 1}: Data check-in inválida')
                    registros_erro += 1
                    continue
                
                if not data_checkout:
                    erros.append(f'Linha {index + 1}: Data check-out inválida')
                    registros_erro += 1
                    continue
                
                if preco is None or preco <= 0:
                    erros.append(f'Linha {index + 1}: Preço inválido')
                    registros_erro += 1
                    continue
                
                if data_checkout < data_checkin:
                    erros.append(f'Linha {index + 1}: Data check-out deve ser >= check-in')
                    registros_erro += 1
                    continue
                
                # Verificar se já existe tarifa para este hotel e período
                tarifa_existente = Tarifa.query.filter_by(
                    hotel_id=hotel_id,
                    data_checkin=data_checkin,
                    data_checkout=data_checkout
                ).first()
                
                if tarifa_existente:
                    # Atualizar tarifa existente
                    tarifa_existente.preco = preco
                    tarifa_existente.importacao_id = importacao_id
                else:
                    # Criar nova tarifa
                    tarifa = Tarifa(
                        hotel_id=hotel_id,
                        data_checkin=data_checkin,
                        data_checkout=data_checkout,
                        preco=preco,
                        moeda='BRL',
                        importacao_id=importacao_id
                    )
                    db.session.add(tarifa)
                
                registros_validos += 1
                
            except Exception as e:
                erros.append(f'Linha {index + 1}: {str(e)}')
                registros_erro += 1
        
        # Salvar todas as tarifas
        db.session.commit()
        
        return {
            'total_registros': total_registros,
            'registros_validos': registros_validos,
            'registros_erro': registros_erro,
            'erros': erros[:50]  # Limitar a 50 erros para não sobrecarregar
        }
        
    except Exception as e:
        db.session.rollback()
        raise e

@tarifa_bp.route('/tarifas', methods=['GET'])
def listar_tarifas():
    """Lista tarifas com filtros opcionais"""
    try:
        hotel_id = request.args.get('hotel_id')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        query = Tarifa.query
        
        # Filtro por hotel
        if hotel_id:
            query = query.filter_by(hotel_id=hotel_id)
        
        # Filtro por período
        if data_inicio:
            data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            query = query.filter(Tarifa.data_checkin >= data_inicio_obj)
        
        if data_fim:
            data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d').date()
            query = query.filter(Tarifa.data_checkin <= data_fim_obj)
        
        # Ordenar por data
        query = query.order_by(Tarifa.data_checkin.desc())
        
        # Paginação
        tarifas_paginadas = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'tarifas': [tarifa.to_dict() for tarifa in tarifas_paginadas.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': tarifas_paginadas.total,
                'pages': tarifas_paginadas.pages
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tarifa_bp.route('/estatisticas', methods=['GET'])
def obter_estatisticas():
    """Obtém estatísticas gerais do sistema"""
    try:
        total_hoteis = Hotel.query.filter_by(ativo=True).count()
        total_tarifas = Tarifa.query.count()
        total_concorrentes = db.session.query(
            db.func.count(db.distinct(db.text('hotel_id')))
        ).select_from(db.text('concorrentes')).scalar() or 0
        
        # Última importação
        ultima_importacao = ImportacaoLog.query.order_by(ImportacaoLog.created_at.desc()).first()
        
        return jsonify({
            'total_hoteis': total_hoteis,
            'total_tarifas': total_tarifas,
            'total_concorrentes': total_concorrentes,
            'ultima_importacao': ultima_importacao.to_dict() if ultima_importacao else None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tarifa_bp.route('/importacoes', methods=['GET'])
def listar_importacoes():
    """Lista histórico de importações"""
    try:
        hotel_id = request.args.get('hotel_id')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = ImportacaoLog.query
        
        if hotel_id:
            query = query.filter_by(hotel_id=hotel_id)
        
        query = query.order_by(ImportacaoLog.created_at.desc())
        
        importacoes_paginadas = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'importacoes': [imp.to_dict() for imp in importacoes_paginadas.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': importacoes_paginadas.total,
                'pages': importacoes_paginadas.pages
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

