/* Banco de modelo — Premiatta Connect (portal de pedidos B2B)
   Migrações em MySQL, na ordem em que o banco foi criado. Dados fictícios. */
window.PROJECT_DB = {
  slug: 'premiatta-connect',
  steps: [
    {
      id: '001',
      titulo: 'Usuários e perfis de acesso',
      descricao: 'Cada login tem um perfil: cliente, distribuidor, vendedor ou admin. O perfil decide o que a pessoa vê no portal.',
      sql: `CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('cliente','distribuidor','vendedor','admin') NOT NULL,
  cod_cliente_erp VARCHAR(20),
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '002',
      titulo: 'Produtos com código do ERP',
      descricao: 'O código de cada produto é o mesmo do Ti9, para o pedido chegar no ERP sem tradução.',
      sql: `CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cod_erp VARCHAR(20) NOT NULL UNIQUE,
  descricao VARCHAR(160) NOT NULL,
  embalagem_kg DECIMAL(6,2) NOT NULL,
  unidades_fardo INT NOT NULL DEFAULT 1,
  ativo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '003',
      titulo: 'Uma tabela de preço por usuário',
      descricao: 'O coração do simulador: cada usuário aponta para uma tabela, e cada tabela tem o seu preço por produto.',
      sql: `CREATE TABLE tabelas_preco (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  validade_inicio DATE NOT NULL,
  validade_fim DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tabela_preco_itens (
  tabela_id INT NOT NULL,
  produto_id INT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (tabela_id, produto_id),
  FOREIGN KEY (tabela_id) REFERENCES tabelas_preco(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE usuarios
  ADD COLUMN tabela_preco_id INT,
  ADD CONSTRAINT fk_usuario_tabela FOREIGN KEY (tabela_preco_id) REFERENCES tabelas_preco(id);`
    },
    {
      id: '004',
      titulo: 'Pedidos e itens',
      descricao: 'O simulador salva o pedido como rascunho. O preço fica gravado no item, então uma tabela nova não muda pedido antigo.',
      sql: `CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  vendedor_id INT,
  status ENUM('rascunho','enviado','aceito_erp','faturado','cancelado') NOT NULL DEFAULT 'rascunho',
  cond_pagamento VARCHAR(40),
  observacao VARCHAR(255),
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  peso_total_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  enviado_em DATETIME,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pedido_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  preco_unit DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '005',
      titulo: 'Integração com o ERP Ti9',
      descricao: 'Número do pedido devolvido pela API AFV do Ti9 e um log de cada chamada, para saber o que foi enviado e o que voltou.',
      sql: `ALTER TABLE pedidos ADD COLUMN erp_numero VARCHAR(20);

CREATE TABLE erp_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  operacao ENUM('enviar','consultar_status') NOT NULL,
  http_status INT,
  resposta JSON,
  sucesso TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '006',
      titulo: 'Índices das telas mais usadas',
      descricao: 'Meus pedidos, pedidos por vendedor e a fila de envio ao ERP.',
      sql: `CREATE INDEX idx_pedidos_usuario ON pedidos (usuario_id, criado_em);
CREATE INDEX idx_pedidos_vendedor ON pedidos (vendedor_id, status);
CREATE INDEX idx_sync_pedido ON erp_sync_log (pedido_id, criado_em);`
    },
    {
      id: '007',
      titulo: 'Dados de exemplo',
      descricao: 'Clientes, tabelas e pedidos fictícios para você consultar no console abaixo.',
      sql: `INSERT INTO tabelas_preco (nome, validade_inicio) VALUES
  ('Distribuidor SP', '2026-10-01'),
  ('Varejo interior', '2026-10-01');

INSERT INTO usuarios (nome, email, senha_hash, perfil, cod_cliente_erp, tabela_preco_id) VALUES
  ('Admin Comercial', 'admin@connect.example', '$2y$10$hash', 'admin', NULL, NULL),
  ('Rafael Souza', 'rafael@connect.example', '$2y$10$hash', 'vendedor', NULL, NULL),
  ('Agropecuária Vale Verde', 'compras@valeverde.example', '$2y$10$hash', 'cliente', '10432', 2),
  ('Distribuidora Rio Pardo', 'pedidos@riopardo.example', '$2y$10$hash', 'distribuidor', '10077', 1),
  ('Pet Shop Bom Amigo', 'loja@bomamigo.example', '$2y$10$hash', 'cliente', '10519', 2);

INSERT INTO produtos (cod_erp, descricao, embalagem_kg, unidades_fardo) VALUES
  ('CL-CA15', 'Classic Cães Adultos 15 kg', 15.00, 1),
  ('CL-CF10', 'Classic Cães Filhotes 10,1 kg', 10.10, 1),
  ('CL-GA10', 'Classic Gatos Adultos 10,1 kg', 10.10, 1),
  ('PR-GC03', 'Premium Gatos Castrados 3 kg', 3.00, 4);

INSERT INTO tabela_preco_itens (tabela_id, produto_id, preco) VALUES
  (1, 1, 118.40), (1, 2, 96.70), (1, 3, 104.90), (1, 4, 41.30),
  (2, 1, 131.90), (2, 2, 108.50), (2, 3, 117.20), (2, 4, 46.80);

INSERT INTO pedidos (usuario_id, vendedor_id, status, cond_pagamento, total, peso_total_kg, erp_numero) VALUES
  (3, 2, 'faturado', '28 dias', 2637.60, 270.90, '0033298'),
  (4, 2, 'aceito_erp', '28/56 dias', 5486.00, 652.00, '0033305'),
  (5, 2, 'rascunho', 'À vista', 748.80, 48.00, NULL);

INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unit) VALUES
  (1, 1, 12, 131.90), (1, 3, 9, 117.20),
  (2, 1, 30, 118.40), (2, 2, 20, 96.70),
  (3, 4, 16, 46.80);

INSERT INTO erp_sync_log (pedido_id, operacao, http_status, resposta, sucesso) VALUES
  (1, 'enviar', 200, '{"numero":"0033298"}', 1),
  (1, 'consultar_status', 200, '{"situacao":"faturado"}', 1),
  (2, 'enviar', 500, '{"erro":"timeout"}', 0),
  (2, 'enviar', 200, '{"numero":"0033305"}', 1);`
    }
  ],
  exemplos: [
    { rotulo: 'Preço que cada cliente vê', sql: `SELECT u.nome, t.nome AS tabela, p.descricao, i.preco
FROM usuarios u
JOIN tabelas_preco t ON t.id = u.tabela_preco_id
JOIN tabela_preco_itens i ON i.tabela_id = t.id
JOIN produtos p ON p.id = i.produto_id
WHERE u.perfil IN ('cliente','distribuidor')
ORDER BY u.nome, p.descricao;` },
    { rotulo: 'Pedidos por vendedor', sql: `SELECT v.nome AS vendedor, COUNT(*) AS pedidos, SUM(pd.total) AS total
FROM pedidos pd JOIN usuarios v ON v.id = pd.vendedor_id
GROUP BY v.id;` },
    { rotulo: 'Falhas na integração', sql: `SELECT pedido_id, operacao, http_status, resposta, criado_em
FROM erp_sync_log WHERE sucesso = 0;` },
    { rotulo: 'Itens de um pedido', sql: `SELECT p.cod_erp, p.descricao, i.quantidade, i.preco_unit,
       i.quantidade * i.preco_unit AS subtotal
FROM pedido_itens i JOIN produtos p ON p.id = i.produto_id
WHERE i.pedido_id = 1;` }
  ]
};
