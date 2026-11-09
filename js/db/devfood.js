/* DevFood DB — projeto de banco de dados (fictício) de uma plataforma de delivery.
   Escrito em SQL que roda direto no SQLite do navegador. Nenhum dado é real. */
window.PROJECT_DB = {
  slug: 'devfood',
  steps: [
    {
      id: '001',
      titulo: 'Clientes e endereços',
      descricao: 'E-mail único validado por CHECK e um índice parcial que garante só um endereço principal por cliente.',
      sql: `CREATE TABLE clientes (
  id        INTEGER PRIMARY KEY,
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE CHECK (email LIKE '%_@_%._%'),
  telefone  TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE enderecos (
  id         INTEGER PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  apelido    TEXT NOT NULL DEFAULT 'Casa',
  rua        TEXT NOT NULL,
  numero     TEXT NOT NULL,
  bairro     TEXT NOT NULL,
  cidade     TEXT NOT NULL,
  uf         TEXT NOT NULL CHECK (length(uf) = 2),
  principal  INTEGER NOT NULL DEFAULT 0 CHECK (principal IN (0, 1))
);

-- índice parcial: no máximo um endereço principal por cliente
CREATE UNIQUE INDEX ux_endereco_principal
  ON enderecos (cliente_id) WHERE principal = 1;`
    },
    {
      id: '002',
      titulo: 'Restaurantes e cardápio',
      descricao: 'Produto liga só na categoria, e a categoria no restaurante: nada repetido (3ª forma normal).',
      sql: `CREATE TABLE restaurantes (
  id           INTEGER PRIMARY KEY,
  nome         TEXT NOT NULL UNIQUE,
  bairro       TEXT NOT NULL,
  taxa_entrega NUMERIC NOT NULL DEFAULT 0 CHECK (taxa_entrega >= 0),
  preparo_min  INTEGER NOT NULL CHECK (preparo_min BETWEEN 5 AND 120),
  ativo        INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE categorias (
  id             INTEGER PRIMARY KEY,
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  ordem          INTEGER NOT NULL DEFAULT 0,
  UNIQUE (restaurante_id, nome)
);

CREATE TABLE produtos (
  id           INTEGER PRIMARY KEY,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  nome         TEXT NOT NULL,
  preco        NUMERIC NOT NULL CHECK (preco > 0),
  ativo        INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);`
    },
    {
      id: '003',
      titulo: 'Cupons, pedidos e itens',
      descricao: 'O total do pedido é uma coluna gerada (subtotal − desconto + taxa), então nunca fica fora de sincronia.',
      sql: `CREATE TABLE cupons (
  id         INTEGER PRIMARY KEY,
  codigo     TEXT NOT NULL UNIQUE COLLATE NOCASE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('percentual', 'valor')),
  valor      NUMERIC NOT NULL CHECK (valor > 0),
  valido_ate TEXT NOT NULL,
  usos_max   INTEGER,
  usos       INTEGER NOT NULL DEFAULT 0,
  CHECK (tipo <> 'percentual' OR valor <= 50)
);

CREATE TABLE pedidos (
  id             INTEGER PRIMARY KEY,
  cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id),
  endereco_id    INTEGER NOT NULL REFERENCES enderecos(id),
  cupom_id       INTEGER REFERENCES cupons(id),
  status         TEXT NOT NULL DEFAULT 'criado' CHECK (status IN
                 ('criado','confirmado','em_preparo','saiu_entrega','entregue','cancelado')),
  subtotal       NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  desconto       NUMERIC NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  taxa_entrega   NUMERIC NOT NULL DEFAULT 0,
  total          NUMERIC GENERATED ALWAYS AS
                 (round(subtotal - desconto + taxa_entrega, 2)) STORED,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pedido_itens (
  id         INTEGER PRIMARY KEY,
  pedido_id  INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 50),
  preco_unit NUMERIC NOT NULL CHECK (preco_unit > 0),
  UNIQUE (pedido_id, produto_id)
);`
    },
    {
      id: '004',
      titulo: 'Pagamento, entrega e avaliação',
      descricao: 'Um pagamento e uma entrega por pedido (UNIQUE), entrega nunca termina antes de sair, nota de 1 a 5.',
      sql: `CREATE TABLE entregadores (
  id      INTEGER PRIMARY KEY,
  nome    TEXT NOT NULL,
  veiculo TEXT NOT NULL CHECK (veiculo IN ('moto', 'bike', 'carro')),
  ativo   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE pagamentos (
  id        INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id),
  metodo    TEXT NOT NULL CHECK (metodo IN ('pix', 'cartao', 'dinheiro')),
  status    TEXT NOT NULL DEFAULT 'pendente'
            CHECK (status IN ('pendente', 'aprovado', 'recusado', 'estornado')),
  valor     NUMERIC NOT NULL CHECK (valor >= 0),
  pago_em   TEXT
);

CREATE TABLE entregas (
  id            INTEGER PRIMARY KEY,
  pedido_id     INTEGER NOT NULL UNIQUE REFERENCES pedidos(id),
  entregador_id INTEGER NOT NULL REFERENCES entregadores(id),
  saiu_em       TEXT NOT NULL,
  entregue_em   TEXT,
  CHECK (entregue_em IS NULL OR entregue_em >= saiu_em)
);

CREATE TABLE avaliacoes (
  pedido_id  INTEGER PRIMARY KEY REFERENCES pedidos(id),
  nota       INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  criado_em  TEXT NOT NULL
);`
    },
    {
      id: '005',
      titulo: 'Triggers: regras dentro do banco',
      descricao: 'Subtotal somado sozinho, status finalizado travado, histórico de status e de preço e contagem de uso do cupom.',
      sql: `CREATE TABLE pedido_status_log (
  id          INTEGER PRIMARY KEY,
  pedido_id   INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_de   TEXT,
  status_para TEXT NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE precos_historico (
  id           INTEGER PRIMARY KEY,
  produto_id   INTEGER NOT NULL REFERENCES produtos(id),
  preco_antigo NUMERIC NOT NULL,
  preco_novo   NUMERIC NOT NULL,
  alterado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- cada item inserido soma no subtotal do pedido
CREATE TRIGGER trg_item_soma AFTER INSERT ON pedido_itens
BEGIN
  UPDATE pedidos
     SET subtotal = round(subtotal + NEW.quantidade * NEW.preco_unit, 2)
   WHERE id = NEW.pedido_id;
END;

-- pedido entregue ou cancelado não volta atrás
CREATE TRIGGER trg_status_travado BEFORE UPDATE OF status ON pedidos
WHEN OLD.status IN ('entregue', 'cancelado') AND NEW.status <> OLD.status
BEGIN
  SELECT RAISE(ABORT, 'Pedido finalizado não muda de status');
END;

-- toda troca de status fica registrada
CREATE TRIGGER trg_status_log AFTER UPDATE OF status ON pedidos
WHEN NEW.status <> OLD.status
BEGIN
  INSERT INTO pedido_status_log (pedido_id, status_de, status_para)
  VALUES (NEW.id, OLD.status, NEW.status);
END;

CREATE TRIGGER trg_preco_historico AFTER UPDATE OF preco ON produtos
WHEN NEW.preco <> OLD.preco
BEGIN
  INSERT INTO precos_historico (produto_id, preco_antigo, preco_novo)
  VALUES (NEW.id, OLD.preco, NEW.preco);
END;

CREATE TRIGGER trg_cupom_uso AFTER INSERT ON pedidos
WHEN NEW.cupom_id IS NOT NULL
BEGIN
  UPDATE cupons SET usos = usos + 1 WHERE id = NEW.cupom_id;
END;`
    },
    {
      id: '006',
      titulo: 'Índices e views',
      descricao: 'Índices compostos para as telas mais usadas e duas views que o painel consulta direto.',
      sql: `CREATE INDEX ix_pedidos_cliente_data ON pedidos (cliente_id, criado_em);
CREATE INDEX ix_pedidos_rest_status  ON pedidos (restaurante_id, status);
CREATE INDEX ix_itens_produto        ON pedido_itens (produto_id);
CREATE INDEX ix_entregas_entregador  ON entregas (entregador_id);
CREATE INDEX ix_status_log_pedido    ON pedido_status_log (pedido_id);

CREATE VIEW vw_pedidos AS
SELECT p.id, c.nome AS cliente, r.nome AS restaurante, e.bairro,
       p.status, p.subtotal, p.desconto, p.total, p.criado_em
  FROM pedidos p
  JOIN clientes c     ON c.id = p.cliente_id
  JOIN restaurantes r ON r.id = p.restaurante_id
  JOIN enderecos e    ON e.id = p.endereco_id;

CREATE VIEW vw_desempenho_restaurante AS
SELECT r.nome AS restaurante,
       COUNT(p.id)              AS pedidos_entregues,
       round(SUM(p.total), 2)   AS faturamento,
       round(AVG(p.total), 2)   AS ticket_medio,
       round(AVG(a.nota), 2)    AS nota_media
  FROM restaurantes r
  LEFT JOIN pedidos p    ON p.restaurante_id = r.id AND p.status = 'entregue'
  LEFT JOIN avaliacoes a ON a.pedido_id = p.id
 GROUP BY r.id;`
    },
    {
      id: '007',
      titulo: 'Cadastros base',
      descricao: '20 clientes, 6 restaurantes com cardápio, cupons e entregadores. Nomes e endereços inventados.',
      sql: `INSERT INTO clientes (nome, email, telefone) VALUES
  ('Ana Ribeiro','ana.ribeiro@email.example','(19) 90000-0101'),
  ('Bruno Teixeira','bruno.t@email.example','(19) 90000-0102'),
  ('Carla Mendes','carla.mendes@email.example',NULL),
  ('Diego Martins','diego.m@email.example','(19) 90000-0104'),
  ('Eduarda Lima','duda.lima@email.example','(19) 90000-0105'),
  ('Felipe Rocha','felipe.rocha@email.example',NULL),
  ('Gabriela Nunes','gabi.nunes@email.example','(19) 90000-0107'),
  ('Henrique Alves','henrique.a@email.example','(19) 90000-0108'),
  ('Isabela Costa','isa.costa@email.example','(19) 90000-0109'),
  ('João Pedro Silva','jp.silva@email.example',NULL),
  ('Larissa Moura','larissa.m@email.example','(19) 90000-0111'),
  ('Marcos Vieira','marcos.v@email.example','(19) 90000-0112'),
  ('Natália Prado','nati.prado@email.example','(19) 90000-0113'),
  ('Otávio Freitas','otavio.f@email.example',NULL),
  ('Paula Andrade','paula.andrade@email.example','(19) 90000-0115'),
  ('Rafael Souza','rafa.souza@email.example','(19) 90000-0116'),
  ('Sabrina Duarte','sabrina.d@email.example','(19) 90000-0117'),
  ('Thiago Barros','thiago.b@email.example',NULL),
  ('Vanessa Pires','vanessa.p@email.example','(19) 90000-0119'),
  ('William Campos','will.campos@email.example','(19) 90000-0120');

-- um endereço principal por cliente, gerado a partir do id
INSERT INTO enderecos (cliente_id, apelido, rua, numero, bairro, cidade, uf, principal)
SELECT id, 'Casa',
       'Rua ' || CASE id % 5 WHEN 0 THEN 'das Acácias' WHEN 1 THEN 'dos Ipês'
                             WHEN 2 THEN 'Sete de Setembro' WHEN 3 THEN 'da Paz'
                             ELSE 'Primavera' END,
       CAST(40 + id * 37 AS TEXT),
       CASE id % 8 WHEN 0 THEN 'Cambuí' WHEN 1 THEN 'Taquaral' WHEN 2 THEN 'Barão Geraldo'
                   WHEN 3 THEN 'Centro' WHEN 4 THEN 'Guanabara' WHEN 5 THEN 'Castelo'
                   WHEN 6 THEN 'Nova Campinas' ELSE 'Botafogo' END,
       'Campinas', 'SP', 1
  FROM clientes;

INSERT INTO enderecos (cliente_id, apelido, rua, numero, bairro, cidade, uf, principal) VALUES
  (1, 'Trabalho', 'Av. Norte-Sul', '1200', 'Cambuí', 'Campinas', 'SP', 0),
  (4, 'Trabalho', 'Rua Coronel Silva', '88', 'Centro', 'Campinas', 'SP', 0);

INSERT INTO restaurantes (nome, bairro, taxa_entrega, preparo_min) VALUES
  ('Forno da Vila', 'Cambuí', 6.90, 30),
  ('Kaze Sushi', 'Taquaral', 8.50, 35),
  ('Brasa 61 Burger', 'Barão Geraldo', 5.90, 20),
  ('Cantina Nonna Lia', 'Centro', 7.40, 25),
  ('Verde Bowl', 'Guanabara', 4.90, 15),
  ('Taco Loco', 'Castelo', 6.20, 20);

INSERT INTO categorias (restaurante_id, nome, ordem) VALUES
  (1,'Pizzas',1),(1,'Bebidas',2),
  (2,'Combinados',1),(2,'Temakis',2),
  (3,'Burgers',1),(3,'Porções',2),
  (4,'Massas',1),(4,'Sobremesas',2),
  (5,'Bowls',1),(5,'Sucos',2),
  (6,'Tacos',1),(6,'Burritos',2);

INSERT INTO produtos (categoria_id, nome, preco) VALUES
  (1,'Margherita',54.90),(1,'Calabresa',52.90),(1,'Quatro queijos',61.90),(2,'Refrigerante 2 L',14.90),
  (3,'Combinado 20 peças',79.90),(3,'Combinado salmão 30 peças',112.00),(4,'Temaki salmão',32.90),(4,'Temaki skin',26.90),
  (5,'Smash duplo',36.90),(5,'Bacon cheddar',39.90),(5,'Veggie',34.50),(6,'Batata rústica',22.00),
  (7,'Lasanha bolonhesa',48.90),(7,'Nhoque ao sugo',42.00),(8,'Tiramisù',19.90),
  (9,'Bowl frango teriyaki',37.90),(9,'Bowl falafel',35.90),(10,'Suco verde 500 ml',13.50),
  (11,'Taco carnitas',18.90),(11,'Taco al pastor',19.90),(12,'Burrito de carne',34.90),(12,'Burrito vegano',31.90);

INSERT INTO cupons (codigo, tipo, valor, valido_ate, usos_max) VALUES
  ('BEMVINDO10', 'percentual', 10, '2026-12-31', NULL),
  ('FRETE5', 'valor', 5, '2026-12-31', 500),
  ('SEXTOU15', 'percentual', 15, '2026-11-30', 200);

INSERT INTO entregadores (nome, veiculo) VALUES
  ('Caíque Moreira','moto'),('Lívia Santos','moto'),('Renan Dias','bike'),
  ('Priscila Gomes','moto'),('Tadeu Lopes','carro'),('Yasmin Faria','bike');`
    },
    {
      id: '008',
      titulo: '360 pedidos gerados com SQL',
      descricao: 'Uma CTE recursiva cria 60 dias de pedidos no almoço e no jantar; os itens disparam o trigger do subtotal.',
      sql: `INSERT INTO pedidos (id, cliente_id, restaurante_id, endereco_id, cupom_id, taxa_entrega, criado_em)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 360
)
SELECT n,
       (n * 7) % 20 + 1,
       (n * 5) % 6 + 1,
       (SELECT id FROM enderecos WHERE cliente_id = (n * 7) % 20 + 1 AND principal = 1),
       CASE WHEN n % 9 = 0 THEN 1 WHEN n % 13 = 0 THEN 2 WHEN n % 31 = 0 THEN 3 END,
       (SELECT taxa_entrega FROM restaurantes WHERE id = (n * 5) % 6 + 1),
       datetime('2026-09-01',
                '+' || ((n * 7) % 61) || ' days',
                '+' || (CASE n % 2 WHEN 0 THEN 11 ELSE 18 END + (n * 7) % 3) || ' hours',
                '+' || ((n * 17) % 60) || ' minutes')
  FROM seq;

-- de 1 a 3 itens por pedido, sempre do cardápio do próprio restaurante
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unit)
SELECT p.id, pr.id, 1 + (p.id + pr.id) % 2, pr.preco
  FROM pedidos p
  JOIN categorias c ON c.restaurante_id = p.restaurante_id
  JOIN produtos pr  ON pr.categoria_id = c.id
 WHERE (p.id + pr.id * 3) % 4 < 2;

INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unit)
SELECT p.id, pr.id, 1, pr.preco
  FROM pedidos p
  JOIN produtos pr ON pr.id = (
       SELECT pr2.id FROM produtos pr2
         JOIN categorias c ON c.id = pr2.categoria_id
        WHERE c.restaurante_id = p.restaurante_id
        ORDER BY (pr2.id * p.id) % 7, pr2.id LIMIT 1)
 WHERE NOT EXISTS (SELECT 1 FROM pedido_itens i WHERE i.pedido_id = p.id);

-- desconto calculado pelo tipo do cupom
UPDATE pedidos
   SET desconto = round(
       CASE (SELECT tipo FROM cupons WHERE id = pedidos.cupom_id)
         WHEN 'percentual' THEN subtotal * (SELECT valor FROM cupons WHERE id = pedidos.cupom_id) / 100.0
         ELSE min(subtotal, (SELECT valor FROM cupons WHERE id = pedidos.cupom_id))
       END, 2)
 WHERE cupom_id IS NOT NULL;`
    },
    {
      id: '009',
      titulo: 'Ciclo de vida do pedido',
      descricao: 'Status avançam (e o trigger registra cada troca), pagamentos, entregas, avaliações e um reajuste de preço.',
      sql: `UPDATE pedidos SET status = 'cancelado'    WHERE id % 25 = 0;
UPDATE pedidos SET status = 'confirmado'   WHERE status = 'criado';
UPDATE pedidos SET status = 'em_preparo'   WHERE status = 'confirmado' AND id <= 357;
UPDATE pedidos SET status = 'saiu_entrega' WHERE status = 'em_preparo' AND id <= 352;
UPDATE pedidos SET status = 'entregue'     WHERE status = 'saiu_entrega' AND id <= 346;

INSERT INTO pagamentos (pedido_id, metodo, status, valor, pago_em)
SELECT id,
       CASE id % 3 WHEN 0 THEN 'pix' WHEN 1 THEN 'cartao' ELSE 'dinheiro' END,
       CASE status WHEN 'cancelado' THEN 'estornado' ELSE 'aprovado' END,
       total, criado_em
  FROM pedidos;

INSERT INTO entregas (pedido_id, entregador_id, saiu_em, entregue_em)
SELECT p.id, p.id % 6 + 1,
       datetime(p.criado_em, '+' || r.preparo_min || ' minutes'),
       CASE WHEN p.status = 'entregue'
            THEN datetime(p.criado_em, '+' || (r.preparo_min + 12 + (p.id * 7) % 25) || ' minutes') END
  FROM pedidos p JOIN restaurantes r ON r.id = p.restaurante_id
 WHERE p.status IN ('saiu_entrega', 'entregue');

INSERT INTO avaliacoes (pedido_id, nota, comentario, criado_em)
SELECT p.id,
       CASE WHEN p.id % 17 = 0 THEN 2 WHEN p.id % 29 = 0 THEN 1 ELSE 3 + (p.id / 6 + p.id) % 3 END,
       CASE WHEN p.id % 17 = 0 THEN 'Chegou frio.'
            WHEN p.id % 29 = 0 THEN 'Atrasou bastante.'
            WHEN (p.id / 6 + p.id) % 3 = 2 THEN 'Chegou rápido e quente.' END,
       datetime(e.entregue_em, '+30 minutes')
  FROM pedidos p JOIN entregas e ON e.pedido_id = p.id
 WHERE p.status = 'entregue' AND p.id % 4 <> 0;

-- reajuste de preço: o trigger guarda o valor antigo
UPDATE produtos SET preco = round(preco * 1.08, 2) WHERE id IN (1, 9, 13);`
    }
  ],
  exemplos: [
    { rotulo: 'Desempenho por restaurante', sql: `SELECT * FROM vw_desempenho_restaurante
ORDER BY faturamento DESC;` },
    { rotulo: 'Faturamento diário + acumulado', sql: `WITH dia AS (
  SELECT date(criado_em) AS dia, COUNT(*) AS pedidos, round(SUM(total), 2) AS faturamento
    FROM pedidos WHERE status = 'entregue'
   GROUP BY 1
)
SELECT dia, pedidos, faturamento,
       round(SUM(faturamento) OVER (ORDER BY dia), 2) AS acumulado,
       round(AVG(faturamento) OVER (ORDER BY dia ROWS 6 PRECEDING), 2) AS media_7_dias
  FROM dia
 ORDER BY dia DESC
 LIMIT 14;` },
    { rotulo: 'Top 3 produtos por restaurante', sql: `WITH vendas AS (
  SELECT r.nome AS restaurante, pr.nome AS produto, SUM(i.quantidade) AS unidades
    FROM pedido_itens i
    JOIN pedidos p      ON p.id = i.pedido_id AND p.status = 'entregue'
    JOIN produtos pr    ON pr.id = i.produto_id
    JOIN categorias c   ON c.id = pr.categoria_id
    JOIN restaurantes r ON r.id = c.restaurante_id
   GROUP BY r.id, pr.id
)
SELECT restaurante, posicao, produto, unidades
  FROM (SELECT *, RANK() OVER (PARTITION BY restaurante ORDER BY unidades DESC) AS posicao
          FROM vendas)
 WHERE posicao <= 3
 ORDER BY restaurante, posicao;` },
    { rotulo: 'Clientes por valor (quartis)', sql: `SELECT c.nome,
       COUNT(p.id) AS pedidos,
       round(SUM(p.total), 2) AS gasto,
       MAX(date(p.criado_em)) AS ultimo_pedido,
       NTILE(4) OVER (ORDER BY SUM(p.total) DESC) AS quartil
  FROM clientes c
  JOIN pedidos p ON p.cliente_id = c.id AND p.status = 'entregue'
 GROUP BY c.id
 ORDER BY gasto DESC;` },
    { rotulo: 'Tempo de entrega por entregador', sql: `SELECT en.nome, en.veiculo,
       COUNT(*) AS entregas,
       round(AVG((julianday(e.entregue_em) - julianday(e.saiu_em)) * 1440), 1) AS minutos_media,
       round(MAX((julianday(e.entregue_em) - julianday(e.saiu_em)) * 1440), 0) AS pior_caso
  FROM entregas e
  JOIN entregadores en ON en.id = e.entregador_id
 WHERE e.entregue_em IS NOT NULL
 GROUP BY en.id
 ORDER BY minutos_media;` },
    { rotulo: 'Horário de pico', sql: `SELECT strftime('%H', criado_em) || 'h' AS hora,
       COUNT(*) AS pedidos,
       round(AVG(total), 2) AS ticket_medio
  FROM pedidos
 GROUP BY 1
 ORDER BY 1;` },
    { rotulo: 'Trilha de status (trigger)', sql: `SELECT l.pedido_id, l.status_de, l.status_para, p.status AS status_atual
  FROM pedido_status_log l
  JOIN pedidos p ON p.id = l.pedido_id
 WHERE l.pedido_id IN (10, 25, 355)
 ORDER BY l.pedido_id, l.id;` },
    { rotulo: 'Uso dos cupons', sql: `SELECT cu.codigo, cu.tipo, cu.valor, cu.usos,
       round(SUM(p.desconto), 2) AS desconto_concedido
  FROM cupons cu
  LEFT JOIN pedidos p ON p.cupom_id = cu.id
 GROUP BY cu.id;` },
    { rotulo: 'Histórico de preços', sql: `SELECT pr.nome, h.preco_antigo, h.preco_novo,
       round((h.preco_novo - h.preco_antigo) / h.preco_antigo * 100, 1) AS reajuste_pct
  FROM precos_historico h JOIN produtos pr ON pr.id = h.produto_id;` },
    { rotulo: 'Plano de execução (índice)', sql: `EXPLAIN QUERY PLAN
SELECT id, total, criado_em
  FROM pedidos
 WHERE cliente_id = 5
 ORDER BY criado_em DESC;` }
  ]
};
