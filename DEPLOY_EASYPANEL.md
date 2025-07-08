# 🚀 Deploy do Rate Shopper no EasyPanel

Este documento contém instruções completas para fazer o deploy da aplicação Rate Shopper no EasyPanel.

## 📋 Pré-requisitos

### ✅ Requisitos do Sistema
- **VPS com EasyPanel** instalado e configurado
- **Banco de dados MariaDB** funcionando (já configurado)
- **Repositório Git** com o código da aplicação
- **Domínio** (opcional, mas recomendado)

### ✅ Credenciais Necessárias
- Acesso ao painel EasyPanel
- Credenciais do banco de dados:
  - Host: `osh-apps_mariaddb-rateshopper`
  - Porta: `3306`
  - Usuário: `rateshopper`
  - Senha: `OSH4040()Xx!..nn`
  - Database: `rateshopper`

## 🔧 Configuração do Banco de Dados

### 1. Verificar Tabelas
Antes do deploy, certifique-se de que as tabelas estão criadas no banco:

```sql
-- Verificar se as tabelas existem
SHOW TABLES;

-- Deve mostrar:
-- hoteis
-- tarifas
-- planilhas_importadas
-- concorrentes
```

### 2. Verificar Permissões
Confirme que o usuário `rateshopper` tem permissões adequadas:

```sql
-- Verificar usuários
SELECT User, Host FROM mysql.user WHERE User = 'rateshopper';

-- Verificar permissões
SHOW GRANTS FOR 'rateshopper'@'%';
```

## 📦 Preparação do Repositório

### 1. Estrutura de Arquivos
Certifique-se de que o repositório contém:

```
rate_shopper_nodejs/
├── package.json                 # Configurações principais
├── Dockerfile                   # Container Docker
├── .dockerignore               # Arquivos ignorados no build
├── easypanel.yml               # Configuração EasyPanel
├── backend/
│   ├── package.json            # Dependências backend
│   ├── server_production.js    # Servidor de produção
│   ├── database.js             # Configuração do banco
│   └── ...
├── frontend/
│   ├── package.json            # Dependências frontend
│   ├── src/                    # Código fonte React
│   └── ...
└── uploads/                    # Diretório para uploads (criado automaticamente)
```

### 2. Commit e Push
```bash
# Fazer commit das alterações
git add .
git commit -m "Configuração para deploy no EasyPanel"
git push origin main
```

## 🚀 Deploy no EasyPanel

### Passo 1: Criar Nova Aplicação

1. **Acessar EasyPanel**
   - Faça login no seu painel EasyPanel
   - Vá para a seção "Apps"

2. **Criar Nova App**
   - Clique em "Create App"
   - Escolha "From Git Repository"

3. **Configurar Repositório**
   - **Repository URL**: `https://github.com/osociohoteleiro/rateshopper.git`
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`

### Passo 2: Configurar Aplicação

#### **Configurações Básicas**
- **App Name**: `rate-shopper`
- **Description**: `Sistema Rate Shopper - Análise comparativa de tarifas hoteleiras`
- **Port**: `3001`

#### **Variáveis de Ambiente**
Configure as seguintes variáveis de ambiente:

```env
NODE_ENV=production
PORT=3001
DB_HOST=osh-apps_mariaddb-rateshopper
DB_PORT=3306
DB_USER=rateshopper
DB_PASSWORD=OSH4040()Xx!..nn
DB_NAME=rateshopper
```

#### **Recursos**
- **Memory**: `512Mi` (mínimo recomendado)
- **CPU**: `500m` (mínimo recomendado)

#### **Volumes**
Criar volume para uploads:
- **Name**: `uploads`
- **Mount Path**: `/app/uploads`
- **Size**: `1Gi`

### Passo 3: Configurar Domínio (Opcional)

1. **Adicionar Domínio**
   - Vá para "Domains"
   - Clique em "Add Domain"
   - Digite seu domínio (ex: `rateshopper.seudominio.com.br`)

2. **Configurar SSL**
   - Ative "SSL Certificate"
   - Escolha "Let's Encrypt" (gratuito)

### Passo 4: Deploy

1. **Iniciar Deploy**
   - Clique em "Deploy"
   - Aguarde o build do Docker

2. **Monitorar Logs**
   - Vá para "Logs" para acompanhar o processo
   - Procure por mensagens como:
     ```
     ✅ Banco de dados inicializado com sucesso
     🚀 Servidor Rate Shopper rodando na porta 3001
     ```

## 🔍 Verificação Pós-Deploy

### 1. Health Check
Teste o endpoint de status:
```bash
curl https://seu-dominio.com/api/status
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-07-08T...",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Teste de Funcionalidades

#### **Frontend**
- Acesse `https://seu-dominio.com`
- Verifique se a página carrega corretamente
- Teste navegação entre páginas

#### **API de Hotéis**
```bash
curl https://seu-dominio.com/api/hoteis
```

#### **Upload de Planilhas**
- Acesse a página de Upload
- Teste upload de uma planilha Excel
- Verifique se as tarifas são importadas

#### **Análise Comparativa**
- Acesse a página de Comparativos
- Selecione um hotel e período
- Verifique se tabela e gráfico são gerados

## 🛠️ Troubleshooting

### Problema: Erro de Conexão com Banco
**Sintomas:**
- Status API mostra `"database": "memory_fallback"`
- Logs mostram erro de conexão

**Soluções:**
1. Verificar se o banco está rodando
2. Confirmar credenciais nas variáveis de ambiente
3. Testar conectividade de rede

### Problema: Build Falha
**Sintomas:**
- Deploy falha durante build
- Erro de dependências

**Soluções:**
1. Verificar se `package.json` está correto
2. Limpar cache do Docker
3. Verificar logs de build

### Problema: Upload de Arquivos Falha
**Sintomas:**
- Erro ao fazer upload de planilhas
- Diretório não encontrado

**Soluções:**
1. Verificar se volume está montado
2. Confirmar permissões de escrita
3. Verificar tamanho do arquivo (máx 10MB)

### Problema: Frontend Não Carrega
**Sintomas:**
- Página em branco
- Erro 404 em assets

**Soluções:**
1. Verificar se build do frontend foi executado
2. Confirmar se arquivos estão em `/app/frontend/dist`
3. Verificar configuração de rotas

## 📊 Monitoramento

### Logs da Aplicação
```bash
# No EasyPanel, vá para "Logs" da aplicação
# Ou use CLI se disponível:
easypanel logs rate-shopper --follow
```

### Métricas de Performance
- **CPU Usage**: Monitorar uso de CPU
- **Memory Usage**: Verificar consumo de memória
- **Response Time**: Tempo de resposta das APIs
- **Error Rate**: Taxa de erros

### Backup
- **Banco de Dados**: Configure backup automático do MariaDB
- **Uploads**: Backup do volume de uploads
- **Código**: Manter repositório Git atualizado

## 🔄 Atualizações

### Deploy Automático
O EasyPanel pode ser configurado para deploy automático:

1. **Webhook do GitHub**
   - Configure webhook no repositório
   - Aponte para endpoint do EasyPanel
   - Deploy automático a cada push

2. **Deploy Manual**
   ```bash
   # No EasyPanel
   # Vá para a aplicação
   # Clique em "Redeploy"
   ```

### Rollback
Em caso de problemas:

1. **Via EasyPanel**
   - Vá para "Deployments"
   - Selecione versão anterior
   - Clique em "Rollback"

2. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   ```

## 📞 Suporte

### Logs Importantes
- **Aplicação**: `/app/logs/` (se configurado)
- **EasyPanel**: Interface web > Logs
- **Banco de Dados**: Logs do MariaDB

### Comandos Úteis
```bash
# Verificar status da aplicação
curl https://seu-dominio.com/api/status

# Testar conectividade do banco
mysql -h osh-apps_mariaddb-rateshopper -u rateshopper -p rateshopper

# Verificar espaço em disco
df -h

# Verificar processos
ps aux | grep node
```

---

## ✅ Checklist de Deploy

- [ ] Banco de dados configurado e funcionando
- [ ] Tabelas criadas no banco
- [ ] Permissões de usuário configuradas
- [ ] Repositório Git atualizado
- [ ] Aplicação criada no EasyPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Volume para uploads criado
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando
- [ ] Frontend carregando
- [ ] APIs respondendo
- [ ] Upload de planilhas funcionando
- [ ] Análise comparativa funcionando
- [ ] Domínio configurado (se aplicável)
- [ ] SSL ativado (se aplicável)
- [ ] Monitoramento configurado

**🎉 Parabéns! Sua aplicação Rate Shopper está rodando no EasyPanel!**

