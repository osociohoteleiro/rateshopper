# Rate Shopper - Reconstrução Node.js + React

## Objetivo
Reconstruir completamente o sistema Rate Shopper utilizando:
- **Backend**: Node.js com Express
- **Frontend**: React com Vite
- **Banco de Dados**: SQLite (inicial)
- **Layout**: Manter o design atual (bonito e amigável)

## Funcionalidades Existentes a Manter

### 1. Dashboard Principal
- Estatísticas gerais (total de tarifas, hotéis, concorrentes)
- Últimas tarifas importadas
- Botão de atualização
- Cards informativos

### 2. Gestão de Hotéis
- Cadastro de hotéis com URL da Booking.com
- Listagem de hotéis
- Edição de informações
- Gestão de concorrentes

### 3. Upload de Planilhas
- Upload de arquivos Excel (.xlsx, .xls)
- Seleção de hotel para associação
- Download de modelo de planilha
- Processamento de dados (Data Check-in, Data Check-out, Preço)

### 4. Dashboard Comparativo
- Seleção de hotel foco
- Definição de período de análise
- Comparação entre concorrentes

### 5. Outras Funcionalidades
- Benchmarking
- Tendências
- Canais de distribuição

## Arquitetura Técnica

### Backend (Node.js + Express)
```
rate_shopper_backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── config.js
│   ├── models/
│   │   ├── Hotel.js
│   │   ├── Tarifa.js
│   │   └── ImportacaoLog.js
│   ├── routes/
│   │   ├── hotels.js
│   │   ├── tarifas.js
│   │   ├── upload.js
│   │   └── estatisticas.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── excelService.js
│   │   └── dataService.js
│   └── app.js
├── uploads/
├── package.json
└── server.js
```

### Frontend (React + Vite)
```
rate_shopper_frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── Dashboard.jsx
│   │   ├── HotelManagement.jsx
│   │   ├── UploadComponent.jsx
│   │   └── ComparativeDashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

### Banco de Dados SQLite
```sql
-- Tabela de Hotéis
CREATE TABLE hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    url_booking TEXT,
    localizacao VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Concorrentes (relacionamento many-to-many)
CREATE TABLE hotel_concorrentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_id INTEGER,
    concorrente_id INTEGER,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id),
    FOREIGN KEY (concorrente_id) REFERENCES hotels(id)
);

-- Tabela de Tarifas
CREATE TABLE tarifas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_id INTEGER,
    data_checkin DATE,
    data_checkout DATE,
    preco DECIMAL(10,2),
    moeda VARCHAR(3) DEFAULT 'BRL',
    canal VARCHAR(100),
    tipo_quarto VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- Tabela de Logs de Importação
CREATE TABLE importacao_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_id INTEGER,
    arquivo_nome VARCHAR(255),
    total_registros INTEGER,
    registros_sucesso INTEGER,
    registros_erro INTEGER,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```

## Stack Tecnológica

### Backend
- **Node.js** (v20+)
- **Express.js** (framework web)
- **SQLite3** (banco de dados)
- **Sequelize** (ORM)
- **Multer** (upload de arquivos)
- **XLSX** (processamento de Excel)
- **CORS** (cross-origin requests)
- **Helmet** (segurança)

### Frontend
- **React** (v18+)
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **Lucide React** (ícones)
- **Axios** (requisições HTTP)
- **React Hook Form** (formulários)

## APIs REST a Implementar

### Estatísticas
- `GET /api/estatisticas` - Dados do dashboard

### Hotéis
- `GET /api/hotels` - Listar hotéis
- `POST /api/hotels` - Criar hotel
- `PUT /api/hotels/:id` - Atualizar hotel
- `DELETE /api/hotels/:id` - Deletar hotel
- `GET /api/hotels/:id/concorrentes` - Listar concorrentes
- `POST /api/hotels/:id/concorrentes` - Adicionar concorrente

### Tarifas
- `GET /api/tarifas` - Listar tarifas (com paginação)
- `POST /api/tarifas/upload` - Upload de planilha
- `GET /api/tarifas/modelo` - Download modelo Excel

### Análises
- `GET /api/analise/comparativo` - Dados comparativos
- `GET /api/analise/benchmarking` - Dados de benchmarking

## Cronograma de Implementação

1. **Fase 1**: Setup inicial e estrutura de pastas
2. **Fase 2**: Backend básico com Express e SQLite
3. **Fase 3**: Modelos e migrações do banco
4. **Fase 4**: APIs REST completas
5. **Fase 5**: Frontend React com Vite
6. **Fase 6**: Componentes e layout (mantendo design atual)
7. **Fase 7**: Integração e testes
8. **Fase 8**: Deploy e otimizações

## Considerações Especiais

### Migração de Dados
- Manter compatibilidade com dados existentes
- Script de migração se necessário

### Performance
- Paginação nas listagens
- Índices no banco de dados
- Cache quando apropriado

### Segurança
- Validação de inputs
- Sanitização de uploads
- Rate limiting

### Responsividade
- Manter design responsivo atual
- Suporte mobile e desktop

