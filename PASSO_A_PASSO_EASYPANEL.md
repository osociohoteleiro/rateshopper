# 🚀 Passo a Passo: Deploy Rate Shopper no EasyPanel via GitHub

## 📋 Situação Atual
✅ **Aplicativo criado** no EasyPanel: `osh-apps / ratehopper`  
✅ **Código preparado** no GitHub: `https://github.com/osociohoteleiro/rateshopper`  
✅ **Banco de dados** funcionando com tabelas criadas  

---

## 🎯 PASSO 1: Configurar Fonte GitHub

### 1.1 Clique na aba "Github"
Na tela que você mostrou, clique na aba **"Github"** (segunda opção).

### 1.2 Conectar Repositório
Você verá campos para configurar:

**Repository URL:**
```
https://github.com/osociohoteleiro/rateshopper
```

**Branch:**
```
master
```

**Build Path:** (deixe vazio ou use)
```
.
```

---

## 🎯 PASSO 2: Configurar Build

### 2.1 Tipo de Build
- Selecione: **"Dockerfile"**
- O EasyPanel detectará automaticamente o `Dockerfile` na raiz do projeto

### 2.2 Configurações de Build
- **Context:** `.` (ponto - diretório raiz)
- **Dockerfile:** `Dockerfile` (nome do arquivo)

---

## 🎯 PASSO 3: Configurar Variáveis de Ambiente

Clique em **"Environment Variables"** ou **"Variáveis de Ambiente"** e adicione:

```env
NODE_ENV=production
PORT=3001
DB_HOST=osh-apps_mariaddb-rateshopper
DB_PORT=3306
DB_USER=rateshopper
DB_PASSWORD=OSH4040()Xx!..nn
DB_NAME=rateshopper
```

### Como Adicionar Cada Variável:
1. **Nome:** `NODE_ENV` → **Valor:** `production`
2. **Nome:** `PORT` → **Valor:** `3001`
3. **Nome:** `DB_HOST` → **Valor:** `osh-apps_mariaddb-rateshopper`
4. **Nome:** `DB_PORT` → **Valor:** `3306`
5. **Nome:** `DB_USER` → **Valor:** `rateshopper`
6. **Nome:** `DB_PASSWORD` → **Valor:** `OSH4040()Xx!..nn`
7. **Nome:** `DB_NAME` → **Valor:** `rateshopper`

---

## 🎯 PASSO 4: Configurar Recursos

### 4.1 Recursos Básicos
- **CPU:** `500m` (meio core)
- **Memória:** `512Mi` (512 megabytes)

### 4.2 Porta da Aplicação
- **Port:** `3001`

---

## 🎯 PASSO 5: Configurar Volume para Uploads

### 5.1 Adicionar Volume
1. Procure por **"Volumes"** ou **"Armazenamento"**
2. Clique em **"Add Volume"** ou **"Adicionar Volume"**

### 5.2 Configurações do Volume
- **Nome:** `uploads`
- **Mount Path:** `/app/uploads`
- **Tamanho:** `1Gi` (1 gigabyte)
- **Tipo:** `Persistent Volume`

---

## 🎯 PASSO 6: Configurar Domínio (Opcional)

### 6.1 Domínio Personalizado
Se você quiser um domínio personalizado:
1. Vá para **"Domains"** ou **"Domínios"**
2. Adicione: `rateshopper.seudominio.com.br`
3. Ative **SSL Certificate** (Let's Encrypt)

### 6.2 Domínio Padrão
O EasyPanel criará automaticamente:
```
https://ratehopper.d32pnk.easypanel.host
```

---

## 🎯 PASSO 7: Executar Deploy

### 7.1 Revisar Configurações
Antes de fazer deploy, confirme:
- ✅ **Repositório:** `https://github.com/osociohoteleiro/rateshopper`
- ✅ **Branch:** `master`
- ✅ **Build Type:** `Dockerfile`
- ✅ **Variáveis de ambiente:** 7 variáveis configuradas
- ✅ **Porta:** `3001`
- ✅ **Volume:** `/app/uploads` configurado

### 7.2 Iniciar Deploy
1. Clique em **"Deploy"** ou **"Implantar"**
2. Aguarde o processo de build (pode levar 2-5 minutos)

---

## 🎯 PASSO 8: Monitorar Deploy

### 8.1 Acompanhar Logs
Durante o deploy, você verá logs como:
```
Building Docker image...
Installing dependencies...
Building frontend...
Starting application...
```

### 8.2 Logs de Sucesso
Procure por estas mensagens nos logs:
```
✅ Banco de dados inicializado com sucesso
🚀 Servidor Rate Shopper rodando na porta 3001
📊 Banco de dados: Conectado
```

---

## 🎯 PASSO 9: Verificar Funcionamento

### 9.1 Testar Health Check
Acesse no navegador:
```
https://seu-dominio.easypanel.host/api/status
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

### 9.2 Testar Frontend
Acesse:
```
https://seu-dominio.easypanel.host
```

Deve carregar a página principal do Rate Shopper.

### 9.3 Testar APIs
```
https://seu-dominio.easypanel.host/api/hoteis
```

Deve retornar lista de hotéis cadastrados.

---

## 🎯 PASSO 10: Testar Funcionalidades

### 10.1 Cadastro de Hotéis
1. Acesse a página **"Hotéis"**
2. Teste criar um novo hotel
3. Verifique se aparece na lista

### 10.2 Upload de Planilhas
1. Acesse a página **"Upload"**
2. Faça upload de uma planilha Excel
3. Verifique se as tarifas são importadas

### 10.3 Análise Comparativa
1. Acesse a página **"Comparativo"**
2. Selecione um hotel e período
3. Verifique se tabela e gráfico são gerados

---

## 🚨 Troubleshooting

### Problema: Build Falha
**Se o build falhar:**
1. Verifique os logs de build
2. Confirme se o repositório está acessível
3. Verifique se o `Dockerfile` está na raiz

### Problema: Aplicação Não Inicia
**Se a aplicação não iniciar:**
1. Verifique as variáveis de ambiente
2. Confirme se a porta 3001 está configurada
3. Verifique logs da aplicação

### Problema: Banco Não Conecta
**Se mostrar "memory_fallback":**
1. Verifique credenciais do banco
2. Confirme se o banco está rodando
3. Teste conectividade de rede

### Problema: Upload Não Funciona
**Se upload de planilhas falhar:**
1. Verifique se o volume está montado
2. Confirme permissões de escrita
3. Verifique tamanho do arquivo (máx 10MB)

---

## ✅ Checklist Final

Após o deploy, confirme:

- [ ] **Health check** retorna `"status": "ok"`
- [ ] **Database status** mostra `"connected"`
- [ ] **Frontend** carrega corretamente
- [ ] **API de hotéis** responde
- [ ] **Cadastro de hotéis** funciona
- [ ] **Upload de planilhas** funciona
- [ ] **Listagem de planilhas** funciona
- [ ] **Exclusão de planilhas** funciona
- [ ] **Análise comparativa** funciona
- [ ] **Tabela comparativa** exibe dados
- [ ] **Gráfico de evolução** funciona
- [ ] **SSL** está ativo (se configurado)

---

## 🎉 Sucesso!

Se todos os itens do checklist estão ✅, sua aplicação Rate Shopper está funcionando perfeitamente no EasyPanel!

**URL da aplicação:** `https://ratehopper.d32pnk.easypanel.host`

---

## 📞 Próximos Passos

### Deploy Automático
Para deploys futuros automáticos:
1. Configure webhook no GitHub
2. A cada push na branch `master`
3. EasyPanel fará redeploy automaticamente

### Monitoramento
- Monitore logs regularmente
- Verifique métricas de CPU/memória
- Configure alertas se necessário

### Backup
- Configure backup do banco de dados
- Mantenha repositório Git atualizado
- Documente mudanças importantes

