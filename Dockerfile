# Dockerfile para Rate Shopper - EasyPanel
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependências do backend
WORKDIR /app/backend
RUN npm ci --only=production

# Instalar dependências do frontend
WORKDIR /app/frontend
RUN npm ci --only=production

# Voltar para diretório raiz
WORKDIR /app

# Copiar código fonte
COPY . .

# Build do frontend
WORKDIR /app/frontend
RUN npm run build

# Voltar para diretório raiz
WORKDIR /app

# Criar diretório para uploads
RUN mkdir -p uploads

# Expor porta
EXPOSE 3001

# Comando para iniciar aplicação
CMD ["node", "backend/server_production.js"]

