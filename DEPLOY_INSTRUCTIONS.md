# 🚀 Instruções de Implantação - Rate Shopper

## 📋 Pré-requisitos

- Acesso ao ambiente OSH
- Banco de dados MariaDB configurado
- Node.js instalado no servidor

## 🔧 Passos para Implantação

### 1. Clonar o Repositório
```bash
git clone https://github.com/osociohoteleiro/rateshopper.git
cd rateshopper
```

### 2. Instalar Dependências
```bash
cd backend
npm install
```

### 3. Configurar Banco de Dados
```bash
# Executar script de implantação do banco
node deploy_database.js
```

**Este script irá:**
- ✅ Conectar ao banco MariaDB
- ✅ Criar todas as tabelas necessárias
- ✅ Inserir dados iniciais (hotéis e concorrentes)
- ✅ Verificar a estrutura final

### 4. Iniciar o Servidor
```bash
# Usar o servidor com integração de banco
node server_with_db.js
```

### 5. Verificar Status
```bash
curl http://localhost:3001/api/status
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-07-08T..."
}
```

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas:

1. **hoteis**
   - `id` (INT, PRIMARY KEY)
   - `nome` (VARCHAR(255))
   - `url_booking` (TEXT)
   - `localizacao` (VARCHAR(255))
   - `ativo` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **tarifas**
   - `id` (INT, PRIMARY KEY)
   - `hotel_id` (INT, FK)
   - `planilha_id` (VARCHAR(50), FK)
   - `data` (DATE)
   - `preco` (DECIMAL(10,2))
   - `tipo_quarto` (VARCHAR(100))
   - `created_at` (TIMESTAMP)

3. **planilhas_importadas**
   - `id` (VARCHAR(50), PRIMARY KEY)
   - `nome_arquivo` (VARCHAR(255))
   - `hotel_id` (INT, FK)
   - `hotel_nome` (VARCHAR(255))
   - `data_importacao` (TIMESTAMP)
   - `arquivo_salvo` (VARCHAR(255))
   - `quantidade_tarifas` (INT)

4. **concorrentes**
   - `id` (INT, PRIMARY KEY)
   - `hotel_id` (INT, FK)
   - `concorrente_id` (INT, FK)
   - `created_at` (TIMESTAMP)

## 🔄 Dados Iniciais

### Hotéis:
- Eco Encanto Pousada
- Pousada Vila Da Lagoa
- Chalés Mirante da Lagoinha
- Pousada Ilha da Vitória

### Concorrentes:
- Eco Encanto Pousada → Pousada Vila Da Lagoa
- Eco Encanto Pousada → Chalés Mirante da Lagoinha

## 🧪 Testes Pós-Implantação

### 1. Verificar Conexão
```bash
curl http://localhost:3001/api/status
```

### 2. Listar Hotéis
```bash
curl http://localhost:3001/api/hoteis
```

### 3. Testar Upload de Planilha
- Acesse: `http://localhost:3001/upload`
- Faça upload de uma planilha Excel
- Verifique se as tarifas foram importadas

### 4. Testar Comparativo
- Acesse: `http://localhost:3001/comparative`
- Selecione um hotel e período
- Verifique se a tabela e gráfico aparecem

## 🔧 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verificar se o banco está rodando
systemctl status mariadb

# Verificar conectividade
mysql -h osh-apps_mariaddb-rateshopper -u rateshopper -p
```

### Tabelas Não Criadas
```bash
# Re-executar script de implantação
node deploy_database.js
```

### Servidor Não Inicia
```bash
# Verificar logs
tail -f server_db.log

# Verificar porta
netstat -tuln | grep 3001
```

## 📝 Arquivos Importantes

- `server_with_db.js` - Servidor principal com banco
- `database.js` - Configuração do banco
- `deploy_database.js` - Script de implantação
- `server_db.log` - Logs do servidor

## ✅ Checklist de Implantação

- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Script de banco executado
- [ ] Tabelas criadas no phpMyAdmin
- [ ] Servidor iniciado
- [ ] Status API retorna "connected"
- [ ] Upload de planilhas funcionando
- [ ] Comparativo funcionando
- [ ] Dados persistindo no banco

## 🆘 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Verificar conexão com banco
3. Verificar se todas as tabelas existem
4. Testar APIs individualmente

