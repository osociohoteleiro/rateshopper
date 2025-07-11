# 🚀 Guia de Deploy na Vercel - Rate Shopper SQLite

## ✅ Versão Criada com Sucesso!

A versão SQLite do Rate Shopper foi criada e enviada para o GitHub. Agora você pode fazer deploy na Vercel em menos de 5 minutos!

## 📦 O que Foi Criado

### 🎯 **Pasta: `vercel_version/`**
```
vercel_version/
├── api/
│   └── index.js          # API serverless completa
├── public/
│   └── index.html        # Interface web de testes
├── package.json          # Dependências otimizadas
├── vercel.json          # Configuração da Vercel
├── .gitignore           # Arquivos ignorados
└── README.md            # Documentação completa
```

### ✨ **Características:**
- ✅ **SQLite local** (sem banco externo)
- ✅ **Zero configuração** necessária
- ✅ **Dados de exemplo** pré-carregados
- ✅ **Interface web** para testes
- ✅ **API REST** completa
- ✅ **Otimizado** para Vercel serverless

## 🚀 Deploy na Vercel - Passo a Passo

### **MÉTODO 1: Via GitHub (Recomendado)**

#### **Passo 1: Acessar Vercel**
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"New Project"**

#### **Passo 2: Conectar Repositório**
1. Procure por **"osociohoteleiro/rateshopper"**
2. Clique em **"Import"**

#### **Passo 3: Configurar Deploy**
1. **Framework Preset**: Deixe "Other"
2. **Root Directory**: Selecione **"vercel_version"**
3. **Build Command**: Deixe vazio
4. **Output Directory**: Deixe vazio
5. **Install Command**: `npm install`

#### **Passo 4: Deploy**
1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. ✅ **Pronto!** Sua URL estará disponível

### **MÉTODO 2: Via Vercel CLI**

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Navegar para pasta
cd vercel_version

# 3. Fazer login
vercel login

# 4. Deploy
vercel

# 5. Seguir instruções no terminal
```

### **MÉTODO 3: Via Drag & Drop**

1. **Baixe** o repositório como ZIP
2. **Extraia** apenas a pasta `vercel_version`
3. **Compacte** a pasta `vercel_version`
4. **Acesse** [vercel.com/new](https://vercel.com/new)
5. **Arraste** o arquivo ZIP
6. **Aguarde** o deploy

## 🧪 Como Testar Após Deploy

### **1. Acessar Interface Web**
```
https://seu-projeto.vercel.app/
```

### **2. Testar API**
```
https://seu-projeto.vercel.app/api/status
https://seu-projeto.vercel.app/api/hoteis
https://seu-projeto.vercel.app/api/planilhas
```

### **3. Upload de Planilhas**
Use a interface web ou Postman:
```
POST https://seu-projeto.vercel.app/api/upload
```

## 📊 Funcionalidades Disponíveis

### ✅ **Gestão de Hotéis**
- Listar hotéis cadastrados
- Criar novos hotéis
- Dados de exemplo inclusos

### ✅ **Upload de Planilhas**
- Suporte Excel (.xlsx) e CSV
- Processamento automático
- Validação de dados

### ✅ **Análise Comparativa**
- Comparação entre hotéis
- Filtros por data
- Relatórios detalhados

### ✅ **Interface Web**
- Testes interativos
- Documentação da API
- Exemplos de uso

## 🎯 Dados de Exemplo Inclusos

### **5 Hotéis Cadastrados:**
1. **Hotel Copacabana Palace** (Rio de Janeiro)
2. **Hotel Fasano São Paulo** (São Paulo)
3. **Pousada Maravilha** (Fernando de Noronha)
4. **Hotel Santa Teresa** (Rio de Janeiro)
5. **Unique Garden Hotel** (São Paulo)

### **150+ Tarifas:**
- **Período**: Próximos 30 dias
- **Variação**: Preços realistas
- **Tipos**: Standard rooms
- **Dados**: Prontos para análise

## 🔧 Configurações da Vercel

### **Limites do Plano Gratuito:**
- ✅ **Execução**: 10 segundos por função
- ✅ **Memória**: 1024 MB
- ✅ **Bandwidth**: 100 GB/mês
- ✅ **Invocações**: 100.000/mês
- ✅ **Projetos**: Ilimitados

### **Otimizações Aplicadas:**
- ✅ **Cold start** otimizado
- ✅ **Banco SQLite** em `/tmp`
- ✅ **Inicialização lazy**
- ✅ **Cleanup automático**

## 🚨 Limitações Importantes

### **Banco de Dados:**
- ⚠️ **SQLite** é reinicializado a cada deploy
- ⚠️ **Dados** são perdidos entre deploys
- ✅ **Adequado** para testes e demos

### **Uploads:**
- ⚠️ **Arquivos** salvos em `/tmp` (temporário)
- ⚠️ **Limpeza** automática após processamento
- ✅ **Limite** de 10MB por arquivo

## 💡 Dicas de Uso

### **Para Benchmarks:**
1. ✅ **Use dados de exemplo** para testes iniciais
2. ✅ **Faça upload** de planilhas reais
3. ✅ **Teste análises** comparativas
4. ✅ **Monitore performance** da API

### **Para Demonstrações:**
1. ✅ **Mostre interface web** para clientes
2. ✅ **Explique funcionalidades** via API
3. ✅ **Demonstre uploads** de planilhas
4. ✅ **Apresente relatórios** gerados

## 🔗 Links Úteis

### **Repositório:**
```
https://github.com/osociohoteleiro/rateshopper
```

### **Pasta da Versão Vercel:**
```
https://github.com/osociohoteleiro/rateshopper/tree/master/vercel_version
```

### **Documentação Vercel:**
```
https://vercel.com/docs
```

## 📞 Troubleshooting

### **Deploy Falha:**
1. ✅ Verifique se selecionou pasta `vercel_version`
2. ✅ Confirme se `package.json` está presente
3. ✅ Consulte logs no dashboard da Vercel

### **API Não Responde:**
1. ✅ Aguarde alguns segundos (cold start)
2. ✅ Verifique se função está ativa
3. ✅ Teste endpoint `/api/status`

### **Upload Não Funciona:**
1. ✅ Verifique formato da planilha
2. ✅ Confirme limite de 10MB
3. ✅ Use Excel (.xlsx) ou CSV

## 🎉 Próximos Passos

### **Após Deploy Bem-Sucedido:**
1. ✅ **Teste** todas as funcionalidades
2. ✅ **Faça upload** de planilhas reais
3. ✅ **Execute** análises comparativas
4. ✅ **Avalie** performance para seus benchmarks

### **Para Produção (Futuro):**
1. 🔄 **Migre** para banco externo
2. 🔄 **Configure** storage persistente
3. 🔄 **Implemente** autenticação
4. 🔄 **Adicione** validações extras

---

## 🚀 **RESUMO: Deploy em 3 Passos**

1. **Acesse** [vercel.com](https://vercel.com)
2. **Importe** repositório `osociohoteleiro/rateshopper`
3. **Selecione** pasta `vercel_version` e clique Deploy

**✅ Em menos de 5 minutos você terá o Rate Shopper funcionando na Vercel!**

