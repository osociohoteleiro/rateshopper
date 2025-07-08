# Rate Shopper - Sistema de Análise de Tarifas

Sistema de análise comparativa de tarifas hoteleiras desenvolvido para O Sócio Hoteleiro.

## 🏨 Sobre o Projeto

O Rate Shopper é uma ferramenta que permite aos hoteleiros:
- Cadastrar e gerenciar hotéis
- Importar tarifas via planilhas Excel
- Comparar preços com concorrentes
- Visualizar análises comparativas com gráficos e tabelas coloridas
- Acompanhar estatísticas de mercado

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

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

O servidor backend serve automaticamente os arquivos do frontend buildado.

## 📊 Funcionalidades

### ✅ Implementadas
- Dashboard com estatísticas
- Cadastro e gestão de hotéis
- Upload de planilhas de tarifas
- Sistema de concorrentes
- Tabela comparativa com cores:
  - 🟢 Verde: Concorrente mais caro
  - 🟠 Laranja: Concorrente até 10% mais barato
  - 🔴 Vermelho: Concorrente mais de 10% mais barato
- Gráfico de evolução de preços

### 🔄 Em Desenvolvimento
- Sistema de autenticação de usuários
- Relatórios exportáveis
- Notificações de mudanças de preços
- API para integração externa

## 📝 Histórico de Versões

Este repositório contém diferentes commits representando os estados de desenvolvimento:
- Cada commit representa um ponto específico do desenvolvimento
- Permite voltar a versões anteriores funcionais
- Facilita identificação de problemas introduzidos

## 🎨 Layout

O sistema utiliza o logotipo "O Sócio Hoteleiro" e mantém uma interface limpa e profissional com:
- Navegação por abas
- Cards informativos no dashboard
- Tabelas responsivas
- Gráficos interativos

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através do GitHub Issues.

---

**Desenvolvido para O Sócio Hoteleiro** 🏨

