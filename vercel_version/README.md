# 🏨 Rate Shopper - Versão Vercel

Sistema de comparação de tarifas hoteleiras otimizado para deploy na **Vercel** com banco de dados **SQLite**.

## ✨ Características

### 🎯 **Zero Configuração**
- ❌ **Sem banco externo** necessário
- ❌ **Sem variáveis de ambiente** complexas
- ❌ **Sem dependências** externas
- ✅ **Funciona imediatamente** após deploy

### 🚀 **Tecnologias**
- **Node.js** + Express.js
- **SQLite** (banco local)
- **Vercel** (serverless functions)
- **Multer** (upload de arquivos)
- **XLSX** (processamento de planilhas)

### 📊 **Funcionalidades**
- ✅ **Gestão de hotéis** (CRUD completo)
- ✅ **Upload de planilhas** Excel/CSV
- ✅ **Análise comparativa** de tarifas
- ✅ **Dados de exemplo** pré-carregados
- ✅ **API REST** completa
- ✅ **Interface web** para testes

## 🚀 Deploy na Vercel

### **Método 1: Via GitHub (Recomendado)**

1. **Faça fork** ou clone este repositório
2. **Acesse** [vercel.com](https://vercel.com)
3. **Clique** em "New Project"
4. **Conecte** seu repositório GitHub
5. **Selecione** a pasta `vercel_version`
6. **Clique** em "Deploy"

### **Método 2: Via Vercel CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
cd vercel_version
vercel

# Seguir instruções no terminal
```

### **Método 3: Via Drag & Drop**

1. **Compacte** a pasta `vercel_version`
2. **Acesse** [vercel.com/new](https://vercel.com/new)
3. **Arraste** o arquivo ZIP
4. **Aguarde** o deploy

## 📋 Estrutura do Projeto

```
vercel_version/
├── api/
│   └── index.js          # Função serverless principal
├── public/
│   └── index.html        # Interface web de testes
├── package.json          # Dependências
├── vercel.json          # Configuração da Vercel
└── README.md            # Este arquivo
```

## 🔗 Endpoints da API

### **Status do Sistema**
```http
GET /api/status
```

### **Gestão de Hotéis**
```http
GET /api/hoteis           # Listar hotéis
POST /api/hotels          # Criar hotel
```

### **Upload de Planilhas**
```http
POST /api/upload          # Upload de planilha Excel/CSV
GET /api/planilhas        # Listar planilhas importadas
```

### **Análise Comparativa**
```http
GET /api/analise/comparativo?data_inicio=2025-01-01&data_fim=2025-01-31
```

## 📊 Dados de Exemplo

O sistema já vem com dados pré-carregados:

- **5 Hotéis** cadastrados
- **150+ Tarifas** para 30 dias
- **Dados realistas** para demonstração

### **Hotéis de Exemplo:**
1. Hotel Copacabana Palace (Rio de Janeiro)
2. Hotel Fasano São Paulo (São Paulo)
3. Pousada Maravilha (Fernando de Noronha)
4. Hotel Santa Teresa (Rio de Janeiro)
5. Unique Garden Hotel (São Paulo)

## 🧪 Como Testar

### **1. Acesse a Interface Web**
Após o deploy, acesse a URL da Vercel para ver a interface de testes.

### **2. Teste os Endpoints**
Use a interface web ou ferramentas como Postman/Insomnia.

### **3. Upload de Planilhas**
Formato esperado da planilha Excel/CSV:

| Data       | Preco | TipoQuarto |
|------------|-------|------------|
| 2025-01-01 | 250.00| Standard   |
| 2025-01-02 | 275.50| Standard   |

## 🔧 Configurações Avançadas

### **Limites da Vercel (Plano Gratuito)**
- **Execução**: 10 segundos por função
- **Memória**: 1024 MB
- **Bandwidth**: 100 GB/mês
- **Invocações**: 100.000/mês

### **Otimizações Aplicadas**
- ✅ **Cold start** otimizado
- ✅ **Banco SQLite** em `/tmp`
- ✅ **Inicialização lazy** do banco
- ✅ **Cleanup automático** de uploads

## 🚨 Limitações

### **Banco de Dados**
- **SQLite** é reinicializado a cada deploy
- **Dados** são perdidos entre deploys
- **Adequado** apenas para testes/demos

### **Uploads**
- **Arquivos** são salvos em `/tmp`
- **Limpeza automática** após processamento
- **Limite** de 10MB por arquivo

## 💡 Dicas de Uso

### **Para Produção**
Se quiser usar em produção:
1. **Migre** para banco externo (PostgreSQL/MySQL)
2. **Configure** storage persistente
3. **Implemente** autenticação
4. **Adicione** validações extras

### **Para Desenvolvimento**
```bash
# Instalar dependências
npm install

# Executar localmente
npm run dev

# Ou usar Vercel Dev
vercel dev
```

## 📞 Suporte

### **Problemas Comuns**

#### **Deploy Falha**
- Verifique se está na pasta `vercel_version`
- Confirme se `package.json` está presente
- Verifique logs no dashboard da Vercel

#### **API Não Responde**
- Aguarde alguns segundos (cold start)
- Verifique se a função está ativa
- Consulte logs da Vercel

#### **Upload Não Funciona**
- Verifique formato da planilha
- Confirme limite de 10MB
- Use Excel (.xlsx) ou CSV

## 🎯 Próximos Passos

Após testar esta versão:
1. **Avalie** as funcionalidades
2. **Teste** com dados reais
3. **Considere** migração para produção
4. **Implemente** melhorias necessárias

---

**🚀 Sistema pronto para uso! Deploy na Vercel em menos de 5 minutos!**

