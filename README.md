# Rate Shopper - Sistema de Análise de Tarifas

Sistema de análise comparativa de tarifas hoteleiras desenvolvido para O Sócio Hoteleiro.

## 🏨 Sobre o Projeto

O Rate Shopper é uma ferramenta que permite aos hoteleiros:
- Cadastrar e gerenciar hotéis
- Importar tarifas via planilhas Excel
- Comparar preços com concorrentes
- Visualizar análises comparativas com gráficos e tabelas coloridas
- Acompanhar estatísticas de mercado

## 🌿 Branches Disponíveis

Este repositório contém diferentes versões do sistema para facilitar a navegação entre estados funcionais:

### 📌 `main` (Branch Principal)
- **Versão**: Node.js/React (Estado atual)
- **Status**: Em desenvolvimento/correção
- **Descrição**: Versão mais recente com todas as funcionalidades implementadas

### ✅ `backup-funcionando-pre-login` (RECOMENDADA)
- **Versão**: Node.js/React (Estado funcional)
- **Status**: ✅ **FUNCIONANDO**
- **Descrição**: Estado funcional antes da implementação do sistema de login
- **Funcionalidades confirmadas**:
  - Dashboard com estatísticas ✅
  - Cadastro de hotéis ✅
  - Upload de tarifas ✅
  - Tabela comparativa com cores ✅
  - Gestão de concorrentes ✅
  - Logo O Sócio Hoteleiro ✅

### 📚 `flask-original` (Referência)
- **Versão**: Flask/Python (Sistema original)
- **Status**: Referência histórica
- **Descrição**: Sistema original em Flask que funcionava antes da migração para Node.js

## 🚀 Como Usar uma Branch Específica

Para usar a versão funcional recomendada:

```bash
git clone https://github.com/osociohoteleiro/rateshopper.git
cd rateshopper
git checkout backup-funcionando-pre-login
```

## 🛠️ Tecnologias

### Backend
- **Node.js** com Express
- **SQLite** como banco de dados
- **Sequelize** como ORM
- **Multer** para upload de arquivos

### Frontend
- **React** com Vite
- **TailwindCSS** para estilização
- **Lucide React** para ícones
- **Recharts** para gráficos

## 📁 Estrutura do Projeto

```
rate_shopper_nodejs/
├── backend/
│   ├── src/
│   │   ├── models/          # Modelos do banco de dados
│   │   ├── routes/          # Rotas da API
│   │   └── config/          # Configurações
│   ├── server.js            # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   └── App.jsx         # Componente principal
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Como Executar

### Versão Recomendada (backup-funcionando-pre-login)

1. **Clone e mude para a branch funcional**:
```bash
git clone https://github.com/osociohoteleiro/rateshopper.git
cd rateshopper
git checkout backup-funcionando-pre-login
```

2. **Backend**:
```bash
cd backend
npm install
node server.js
```

3. **Frontend** (em outro terminal):
```bash
cd frontend
npm install
npm run build
```

O servidor backend serve automaticamente os arquivos do frontend buildado na porta 3000.

## 📊 Funcionalidades

### ✅ Implementadas (Branch: backup-funcionando-pre-login)
- Dashboard com estatísticas
- Cadastro e gestão de hotéis
- Upload de planilhas de tarifas
- Sistema de concorrentes
- Tabela comparativa com cores:
  - 🟢 Verde: Concorrente mais caro
  - 🟠 Laranja: Concorrente até 10% mais barato
  - 🔴 Vermelho: Concorrente mais de 10% mais barato
- Gráfico de evolução de preços

### 🔄 Em Desenvolvimento (Branch: main)
- Sistema de autenticação de usuários
- Relatórios exportáveis
- Notificações de mudanças de preços
- API para integração externa

## 🎯 Estratégia de Branches

Este repositório utiliza uma estratégia de múltiplas branches para:
- **Preservar estados funcionais** do sistema
- **Facilitar rollback** para versões estáveis
- **Permitir desenvolvimento incremental** sem quebrar funcionalidades
- **Manter histórico** de diferentes implementações

## 🎨 Layout

O sistema utiliza o logotipo "O Sócio Hoteleiro" e mantém uma interface limpa e profissional com:
- Navegação por abas
- Cards informativos no dashboard
- Tabelas responsivas
- Gráficos interativos

## 🔧 Solução de Problemas

Se encontrar problemas:

1. **Primeiro, tente a branch funcional**:
   ```bash
   git checkout backup-funcionando-pre-login
   ```

2. **Verifique se as dependências estão instaladas**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Reconstrua o frontend**:
   ```bash
   cd frontend && npm run build
   ```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através do GitHub Issues.

---

**Desenvolvido para O Sócio Hoteleiro** 🏨

