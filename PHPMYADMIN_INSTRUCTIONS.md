# 🗄️ Instruções para Execução no phpMyAdmin

## 📋 Passo a Passo

### 1. Acessar o phpMyAdmin
- Acesse: `osh-apps-mariaddb-rateshopper-phpmyadmin.d32pnk.easypanel.host`
- Faça login com as credenciais do banco

### 2. Selecionar o Banco de Dados
- Clique em **"rateshopper"** na lista de bancos à esquerda
- Se não existir, crie o banco primeiro

### 3. Executar o Script SQL
- Clique na aba **"SQL"** no topo da página
- Copie todo o conteúdo do arquivo `database_setup.sql`
- Cole no campo de texto do phpMyAdmin
- Clique em **"Executar"** (ou "Go")

### 4. Verificar Resultados
Após a execução, você deve ver:

#### ✅ **Tabelas Criadas**:
- `hoteis` (4 registros)
- `tarifas` (vazia)
- `planilhas_importadas` (vazia)
- `concorrentes` (2 registros)

#### ✅ **Dados Inseridos**:
- **Hotéis**: Eco Encanto, Vila Da Lagoa, Chalés Mirante, Ilha da Vitória
- **Concorrentes**: Eco Encanto compete com Vila Da Lagoa e Chalés Mirante

#### ✅ **Estrutura Verificada**:
- Chaves estrangeiras configuradas
- Índices criados para performance
- Relacionamentos estabelecidos

## 🔍 Verificações Pós-Execução

### 1. Verificar Tabelas
```sql
SHOW TABLES;
```

### 2. Verificar Hotéis
```sql
SELECT * FROM hoteis;
```

### 3. Verificar Concorrentes
```sql
SELECT 
    h1.nome as hotel,
    h2.nome as concorrente
FROM concorrentes c
JOIN hoteis h1 ON c.hotel_id = h1.id
JOIN hoteis h2 ON c.concorrente_id = h2.id;
```

### 4. Verificar Estrutura
```sql
DESCRIBE hoteis;
DESCRIBE tarifas;
```

## 🚨 Possíveis Erros e Soluções

### Erro: "Table already exists"
- **Causa**: Tabelas já existem
- **Solução**: Normal, o script usa `IF NOT EXISTS`

### Erro: "Duplicate entry"
- **Causa**: Dados já inseridos
- **Solução**: Normal, o script usa `INSERT IGNORE`

### Erro: "Foreign key constraint"
- **Causa**: Problema com relacionamentos
- **Solução**: Execute as tabelas na ordem correta (hotéis primeiro)

### Erro: "Access denied"
- **Causa**: Permissões insuficientes
- **Solução**: Verifique se está usando o usuário correto

## ✅ Checklist de Sucesso

- [ ] Script executado sem erros
- [ ] 4 tabelas criadas
- [ ] 4 hotéis inseridos
- [ ] 2 relacionamentos de concorrentes
- [ ] Estrutura verificada
- [ ] Dados consultados com sucesso

## 🔄 Próximos Passos

Após executar o script:

1. **Iniciar o servidor** com banco de dados:
   ```bash
   node server_with_db.js
   ```

2. **Verificar conexão**:
   ```bash
   curl http://localhost:3001/api/status
   ```

3. **Testar funcionalidades**:
   - Upload de planilhas
   - Cadastro de hotéis
   - Análise comparativa

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro no phpMyAdmin
2. Confirme que está no banco correto
3. Verifique permissões do usuário
4. Execute as queries de verificação

