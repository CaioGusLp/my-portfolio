/* Banco de modelo — premiatta.com (site institucional + painel admin)
   Migrações em MySQL, na ordem em que o banco foi criado. Dados fictícios. */
window.PROJECT_DB = {
  slug: 'premiatta-site',
  steps: [
    {
      id: '001',
      titulo: 'Usuários do painel admin',
      descricao: 'Antes de qualquer página, o login do admin.html. Senha guardada só como hash (password_hash do PHP).',
      sql: `CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '002',
      titulo: 'Catálogo: espécies e produtos',
      descricao: 'A página produtos lê daqui. Cada produto pertence a uma espécie (cães, gatos, pássaros) e tem um slug para a URL limpa.',
      sql: `CREATE TABLE especies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  especie_id INT NOT NULL,
  nome VARCHAR(160) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  linha VARCHAR(60),
  fase_vida ENUM('filhote','adulto','senior') NOT NULL,
  peso_kg DECIMAL(6,2) NOT NULL,
  descricao TEXT,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  ordem INT NOT NULL DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (especie_id) REFERENCES especies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '003',
      titulo: 'Imagens dos produtos e downloads',
      descricao: 'Fotos em WebP por produto e os arquivos da página downloads (catálogos e fichas técnicas em PDF).',
      sql: `CREATE TABLE produto_imagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  arquivo VARCHAR(255) NOT NULL,
  alt VARCHAR(200) NOT NULL,
  principal TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(160) NOT NULL,
  tipo ENUM('catalogo','ficha_tecnica','tabela') NOT NULL,
  arquivo VARCHAR(255) NOT NULL,
  publico TINYINT(1) NOT NULL DEFAULT 1,
  baixados INT NOT NULL DEFAULT 0,
  publicado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '004',
      titulo: 'Formulário de contato',
      descricao: 'O POST da página contato cai no api.php e vira uma linha aqui. O admin muda o status conforme responde.',
      sql: `CREATE TABLE contatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  telefone VARCHAR(30),
  cidade VARCHAR(80),
  uf CHAR(2),
  perfil ENUM('tutor','lojista','distribuidor','outro') NOT NULL DEFAULT 'tutor',
  mensagem TEXT NOT NULL,
  status ENUM('novo','respondido','arquivado') NOT NULL DEFAULT 'novo',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '005',
      titulo: 'Textos editáveis pelo admin',
      descricao: 'Títulos e textos das páginas ficam numa tabela chave/valor, então o marketing troca um texto sem mexer no HTML.',
      sql: `CREATE TABLE conteudos (
  chave VARCHAR(100) PRIMARY KEY,
  pagina ENUM('home','sobre','produtos','downloads','contato') NOT NULL,
  valor TEXT NOT NULL,
  atualizado_por INT,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (atualizado_por) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '006',
      titulo: 'Índices e log do painel',
      descricao: 'Índices para as buscas que o site mais faz e um registro de quem alterou o quê no painel.',
      sql: `CREATE INDEX idx_produtos_especie ON produtos (especie_id, ativo, ordem);
CREATE INDEX idx_contatos_status ON contatos (status, criado_em);

CREATE TABLE admin_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  acao VARCHAR(40) NOT NULL,
  tabela VARCHAR(40) NOT NULL,
  registro_id VARCHAR(100),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '007',
      titulo: 'Dados de exemplo',
      descricao: 'Linhas fictícias para você consultar no console abaixo.',
      sql: `INSERT INTO admins (nome, email, senha_hash) VALUES
  ('Caio Lopes', 'caio@premiatta.example', '$2y$10$hashdeexemplo'),
  ('Marketing', 'marketing@premiatta.example', '$2y$10$hashdeexemplo');

INSERT INTO especies (nome, slug) VALUES
  ('Cães', 'caes'), ('Gatos', 'gatos'), ('Pássaros', 'passaros');

INSERT INTO produtos (especie_id, nome, slug, linha, fase_vida, peso_kg, ordem) VALUES
  (1, 'Classic Cães Adultos Carne', 'classic-caes-adultos-carne', 'Classic', 'adulto', 15.00, 1),
  (1, 'Classic Cães Filhotes', 'classic-caes-filhotes', 'Classic', 'filhote', 10.10, 2),
  (1, 'Premium Cães Sênior', 'premium-caes-senior', 'Premium', 'senior', 10.10, 3),
  (2, 'Classic Gatos Adultos Peixe', 'classic-gatos-adultos-peixe', 'Classic', 'adulto', 10.10, 1),
  (2, 'Premium Gatos Castrados', 'premium-gatos-castrados', 'Premium', 'adulto', 3.00, 2),
  (3, 'Mistura Calopsita', 'mistura-calopsita', 'Aves', 'adulto', 0.50, 1);

INSERT INTO produto_imagens (produto_id, arquivo, alt, principal) VALUES
  (1, 'classic-caes-adultos.webp', 'Pacote Classic Cães Adultos 15 kg', 1),
  (4, 'classic-gatos-adultos.webp', 'Pacote Classic Gatos Adultos', 1);

INSERT INTO downloads (titulo, tipo, arquivo, baixados) VALUES
  ('Catálogo de produtos', 'catalogo', 'catalogo.pdf', 412),
  ('Ficha técnica Classic Cães', 'ficha_tecnica', 'ficha-classic-caes.pdf', 97),
  ('Ficha técnica Classic Gatos', 'ficha_tecnica', 'ficha-classic-gatos.pdf', 63);

INSERT INTO contatos (nome, email, cidade, uf, perfil, mensagem, status) VALUES
  ('Ana Ribeiro', 'ana@exemplo.example', 'Campinas', 'SP', 'lojista', 'Quero revender a linha Classic.', 'respondido'),
  ('Bruno Teixeira', 'bruno@exemplo.example', 'Mogi Mirim', 'SP', 'tutor', 'Qual a ração indicada para filhote de porte grande?', 'novo'),
  ('Pet Center Aurora', 'compras@aurora.example', 'Pouso Alegre', 'MG', 'distribuidor', 'Pedido de tabela para distribuidor.', 'novo');

INSERT INTO conteudos (chave, pagina, valor, atualizado_por) VALUES
  ('home.titulo', 'home', 'Nutrição premium para cães e gatos', 1),
  ('sobre.historia', 'sobre', 'Texto da história da empresa.', 2),
  ('contato.horario', 'contato', 'Atendimento de segunda a sexta.', 2);

INSERT INTO admin_log (admin_id, acao, tabela, registro_id) VALUES
  (2, 'update', 'conteudos', 'home.titulo'),
  (1, 'insert', 'produtos', '6'),
  (1, 'update', 'contatos', '1');`
    }
  ],
  exemplos: [
    { rotulo: 'Produtos por espécie', sql: `SELECT e.nome AS especie, COUNT(p.id) AS produtos
FROM especies e LEFT JOIN produtos p ON p.especie_id = e.id AND p.ativo = 1
GROUP BY e.id ORDER BY produtos DESC;` },
    { rotulo: 'Contatos sem resposta', sql: `SELECT nome, cidade, uf, perfil, mensagem
FROM contatos WHERE status = 'novo' ORDER BY criado_em;` },
    { rotulo: 'Downloads mais baixados', sql: `SELECT titulo, tipo, baixados FROM downloads ORDER BY baixados DESC;` },
    { rotulo: 'Quem mexeu no painel', sql: `SELECT a.nome, l.acao, l.tabela, l.registro_id
FROM admin_log l JOIN admins a ON a.id = l.admin_id;` }
  ]
};
