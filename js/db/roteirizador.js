/* Banco de modelo — Roteirizador Premiatta (logística)
   Migrações em MySQL para guardar importações e o histórico de rotas. Dados fictícios. */
window.PROJECT_DB = {
  slug: 'roteirizador',
  steps: [
    {
      id: '001',
      titulo: 'Importações do relatório Ti9',
      descricao: 'Cada planilha importada vira um registro, com o nome do arquivo e quantas linhas foram lidas.',
      sql: `CREATE TABLE importacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arquivo VARCHAR(200) NOT NULL,
  linhas_lidas INT NOT NULL,
  importado_por VARCHAR(80),
  importado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '002',
      titulo: 'Pedidos pendentes de faturamento',
      descricao: 'As colunas que o dashboard usa: filial, número, cliente, cidade, região, vendedor, data de entrada, peso e valor.',
      sql: `CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  importacao_id INT NOT NULL,
  filial VARCHAR(5) NOT NULL,
  numero VARCHAR(12) NOT NULL,
  pedido_cliente VARCHAR(40),
  cod_cliente VARCHAR(20),
  cliente VARCHAR(160) NOT NULL,
  endereco VARCHAR(200),
  cidade VARCHAR(80) NOT NULL,
  uf CHAR(2) NOT NULL,
  regiao VARCHAR(40),
  vendedor VARCHAR(80),
  data_entrada DATE,
  peso_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  volumes INT NOT NULL DEFAULT 0,
  observacao VARCHAR(255),
  UNIQUE (filial, numero),
  FOREIGN KEY (importacao_id) REFERENCES importacoes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '003',
      titulo: 'Pedido 100 + 777 mesclado',
      descricao: 'Bonificação da filial 777 com o mesmo cliente, cidade e peso do pedido da 100 vira filho dele e sai na mesma carga.',
      sql: `ALTER TABLE pedidos
  ADD COLUMN pedido_pai_id INT,
  ADD CONSTRAINT fk_pedido_pai FOREIGN KEY (pedido_pai_id) REFERENCES pedidos(id);
CREATE INDEX idx_pedidos_cidade ON pedidos (uf, cidade);`
    },
    {
      id: '004',
      titulo: 'Rotas e paradas',
      descricao: 'Uma rota tem nome, data de saída, origem e retorno. As paradas guardam a ordem que o logístico arrastou no mapa.',
      sql: `CREATE TABLE rotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  data_saida DATE,
  origem VARCHAR(200) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  distancia_km DECIMAL(8,1),
  duracao_min INT,
  observacao VARCHAR(255),
  criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rota_paradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rota_id INT NOT NULL,
  ordem INT NOT NULL,
  rotulo VARCHAR(200) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  manual TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '005',
      titulo: 'Pedidos em cada rota',
      descricao: 'Ligação entre pedido e rota. Pedido que entrou numa rota sai das pendências; excluir a rota devolve o pedido.',
      sql: `CREATE TABLE rota_pedidos (
  rota_id INT NOT NULL,
  pedido_id INT NOT NULL,
  parada_id INT,
  PRIMARY KEY (rota_id, pedido_id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (parada_id) REFERENCES rota_paradas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '006',
      titulo: 'Dados de exemplo',
      descricao: 'Uma importação, pedidos de cidades do interior e uma rota fechada para você consultar no console abaixo.',
      sql: `INSERT INTO importacoes (arquivo, linhas_lidas, importado_por) VALUES
  ('pendentes_ti9_0911.xlsx', 7, 'logistica');

INSERT INTO pedidos (importacao_id, filial, numero, pedido_cliente, cod_cliente, cliente, cidade, uf, regiao, vendedor, data_entrada, peso_kg, valor, volumes, observacao) VALUES
  (1, '100', '0033327', 'LOTE 43', '10432', 'Agropecuária Vale Verde', 'Morungaba', 'SP', 'CAMPINAS', 'RAFAEL', '2026-11-03', 289.37, 2690.40, 21, NULL),
  (1, '777', '0033333', 'LOTE 43', '10432', 'Agropecuária Vale Verde', 'Morungaba', 'SP', 'CAMPINAS', 'RAFAEL', '2026-11-03', 15.23, 141.60, 1, 'Bonificação campanha Classic'),
  (1, '100', '0033340', '-', '10519', 'Pet Shop Bom Amigo', 'Itatiba', 'SP', 'CAMPINAS', 'RAFAEL', '2026-11-04', 120.00, 1104.00, 8, NULL),
  (1, '100', '0033352', '-', '10077', 'Distribuidora Rio Pardo', 'Casa Branca', 'SP', 'MOGIANA', 'JULIANA', '2026-11-05', 652.00, 5921.00, 50, 'Entregar até 14h'),
  (1, '100', '0033361', '-', '10601', 'Casa do Criador', 'Santa Bárbara d''Oeste', 'SP', 'PIRACICABA', 'JULIANA', '2026-11-05', 210.50, 1887.30, 14, NULL),
  (1, '100', '0033370', '-', '10644', 'Agro Serra Azul', 'Pouso Alegre', 'MG', 'SUL DE MINAS', 'MARCOS', '2026-11-06', 404.00, 3550.00, 30, NULL),
  (1, '100', '0033375', '-', '10650', 'Pet Center Aurora', 'Pouso Alegre', 'MG', 'SUL DE MINAS', 'MARCOS', '2026-11-06', 98.20, 912.00, 7, NULL);

UPDATE pedidos SET pedido_pai_id = 1 WHERE numero = '0033333';

INSERT INTO rotas (nome, data_saida, origem, destino, distancia_km, duracao_min, observacao) VALUES
  ('ROTA CAMPINAS 11/11', '2026-11-11', 'Mogi Guaçu - SP', 'Mogi Guaçu - SP', 214.6, 247, 'Faturar até as 14h');

INSERT INTO rota_paradas (rota_id, ordem, rotulo, endereco) VALUES
  (1, 1, 'Pet Shop Bom Amigo', 'Centro, Itatiba - SP'),
  (1, 2, 'Agropecuária Vale Verde', 'Centro, Morungaba - SP');

INSERT INTO rota_pedidos (rota_id, pedido_id, parada_id) VALUES
  (1, 3, 1), (1, 1, 2), (1, 2, 2);`
    }
  ],
  exemplos: [
    { rotulo: 'Pendências por cidade', sql: `SELECT p.cidade, p.uf, COUNT(*) AS pedidos,
       SUM(p.peso_kg) AS peso_kg, SUM(p.valor) AS valor
FROM pedidos p
WHERE p.id NOT IN (SELECT pedido_id FROM rota_pedidos)
GROUP BY p.uf, p.cidade ORDER BY peso_kg DESC;` },
    { rotulo: 'Pedidos mesclados 100 + 777', sql: `SELECT pai.numero AS pedido_100, filho.numero AS bonificacao_777,
       pai.cliente, pai.peso_kg + filho.peso_kg AS peso_total
FROM pedidos filho JOIN pedidos pai ON pai.id = filho.pedido_pai_id;` },
    { rotulo: 'Romaneio da rota', sql: `SELECT rp.ordem, rp.rotulo, p.numero, p.data_entrada, p.peso_kg, p.volumes
FROM rota_pedidos r
JOIN rota_paradas rp ON rp.id = r.parada_id
JOIN pedidos p ON p.id = r.pedido_id
WHERE r.rota_id = 1 ORDER BY rp.ordem;` },
    { rotulo: 'Peso por região', sql: `SELECT regiao, SUM(peso_kg) AS peso_kg FROM pedidos GROUP BY regiao ORDER BY peso_kg DESC;` }
  ]
};
