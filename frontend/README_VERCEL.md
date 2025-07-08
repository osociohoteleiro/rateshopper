# Deploy do Rate Shopper na Vercel

## Pré-requisitos
1. Conta na Vercel (https://vercel.com)
2. Repositório Git com o código do frontend

## Passos para Deploy

### 1. Preparar o Repositório
```bash
# Inicializar git se não existir
git init

# Adicionar arquivos
git add .
git commit -m "Preparar para deploy na Vercel"

# Conectar com repositório remoto (GitHub, GitLab, etc.)
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

### 2. Configurar na Vercel
1. Acesse https://vercel.com e faça login
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Variáveis de Ambiente
Na configuração do projeto na Vercel, adicione:
- `VITE_API_URL`: https://mzhyi8cq8gpl.manus.space

### 4. Deploy
- O deploy será automático após conectar o repositório
- Cada push para a branch main fará um novo deploy

## Estrutura de Arquivos Importantes
- `vercel.json`: Configuração da Vercel
- `.env`: Variáveis de ambiente locais
- `vite.config.js`: Configuração do Vite
- `src/config/api.js`: Configuração da API

## URLs
- **Backend**: https://mzhyi8cq8gpl.manus.space
- **Frontend**: Será gerado pela Vercel após deploy

## Troubleshooting
- Verifique se todas as dependências estão no package.json
- Confirme se o build local funciona: `npm run build`
- Verifique os logs de build na Vercel em caso de erro

