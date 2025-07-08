-- =====================================================
-- RATE SHOPPER - SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- =====================================================
-- Execute este script no phpMyAdmin para criar toda a estrutura
-- Data: 2025-07-08
-- Versão: 1.0

-- Usar o banco de dados rateshopper
USE rateshopper;

-- =====================================================
-- 1. CRIAÇÃO DAS TABELAS
-- =====================================================

-- Tabela de hotéis
CREATE TABLE IF NOT EXISTS hoteis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    url_booking TEXT,
    localizacao VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de planilhas importadas
CREATE TABLE IF NOT EXISTS planilhas_importadas (
    id VARCHAR(50) PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    hotel_id INT NOT NULL,
    hotel_nome VARCHAR(255),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    arquivo_salvo VARCHAR(255),
    quantidade_tarifas INT DEFAULT 0,
    FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tarifas
CREATE TABLE IF NOT EXISTS tarifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    planilha_id VARCHAR(50),
    data DATE NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    tipo_quarto VARCHAR(100) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
    FOREIGN KEY (planilha_id) REFERENCES planilhas_importadas(id) ON DELETE CASCADE,
    INDEX idx_hotel_data (hotel_id, data),
    INDEX idx_planilha (planilha_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de concorrentes
CREATE TABLE IF NOT EXISTS concorrentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    concorrente_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hoteis(id) ON DELETE CASCADE,
    FOREIGN KEY (concorrente_id) REFERENCES hoteis(id) ON DELETE CASCADE,
    UNIQUE KEY unique_concorrente (hotel_id, concorrente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. INSERÇÃO DOS DADOS INICIAIS
-- =====================================================

-- Inserir hotéis iniciais
INSERT IGNORE INTO hoteis (id, nome, url_booking, localizacao, ativo) VALUES
(1, 'Eco Encanto Pousada', 'https://www.booking.com/hotel/br/eco-encanto-pousada.html', 'Ubatuba', TRUE),
(2, 'Pousada Vila Da Lagoa', 'https://www.booking.com/hotel/br/pousada-vila-da-lagoa.html', 'Ubatuba', TRUE),
(3, 'Chalés Mirante da Lagoinha', 'https://www.booking.com/hotel/br/chales-mirante-lagoinha.html', 'Ubatuba', TRUE),
(4, 'Pousada Ilha da Vitória', 'https://www.booking.com/hotel/br/pousada-ilha-vitoria.html', 'Ubatuba', TRUE);

-- Inserir relacionamentos de concorrentes
INSERT IGNORE INTO concorrentes (hotel_id, concorrente_id) VALUES
(1, 2), -- Eco Encanto Pousada -> Pousada Vila Da Lagoa
(1, 3); -- Eco Encanto Pousada -> Chalés Mirante da Lagoinha

-- =====================================================
-- 3. VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Verificar hotéis criados
SELECT 'HOTÉIS CRIADOS:' as info;
SELECT id, nome, localizacao, ativo FROM hoteis ORDER BY id;

-- Verificar concorrentes configurados
SELECT 'CONCORRENTES CONFIGURADOS:' as info;
SELECT 
    h1.nome as hotel,
    h2.nome as concorrente
FROM concorrentes c
JOIN hoteis h1 ON c.hotel_id = h1.id
JOIN hoteis h2 ON c.concorrente_id = h2.id
ORDER BY h1.nome;

-- Verificar estrutura das tabelas
SELECT 'TABELAS CRIADAS:' as info;
SHOW TABLES;

-- Contar registros em cada tabela
SELECT 'RESUMO DOS DADOS:' as info;
SELECT 
    'hoteis' as tabela,
    COUNT(*) as total_registros
FROM hoteis
UNION ALL
SELECT 
    'tarifas' as tabela,
    COUNT(*) as total_registros
FROM tarifas
UNION ALL
SELECT 
    'planilhas_importadas' as tabela,
    COUNT(*) as total_registros
FROM planilhas_importadas
UNION ALL
SELECT 
    'concorrentes' as tabela,
    COUNT(*) as total_registros
FROM concorrentes;

-- =====================================================
-- 4. CONFIGURAÇÕES ADICIONAIS (OPCIONAL)
-- =====================================================

-- Definir AUTO_INCREMENT para começar do próximo ID disponível
ALTER TABLE hoteis AUTO_INCREMENT = 5;
ALTER TABLE tarifas AUTO_INCREMENT = 1;
ALTER TABLE concorrentes AUTO_INCREMENT = 1;

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================
-- 
-- ✅ Tabelas criadas:
--    - hoteis (4 registros)
--    - tarifas (vazia, pronta para receber dados)
--    - planilhas_importadas (vazia, pronta para receber dados)
--    - concorrentes (2 relacionamentos)
--
-- ✅ Relacionamentos configurados:
--    - Eco Encanto Pousada compete com Vila Da Lagoa e Chalés Mirante
--
-- ✅ Índices criados para performance:
--    - idx_hotel_data na tabela tarifas
--    - idx_planilha na tabela tarifas
--
-- ✅ Chaves estrangeiras configuradas para integridade
--
-- 🚀 O banco está pronto para receber dados do Rate Shopper!
-- =====================================================

