/* Banco de modelo — Ordem de Serviço digital (manutenção BPF)
   Migrações em MySQL, na ordem em que o banco foi criado. Dados fictícios. */
window.PROJECT_DB = {
  slug: 'ordem-servico',
  steps: [
    {
      id: '001',
      titulo: 'Usuários com aprovação',
      descricao: 'Quem se cadastra fica pendente até o admin aprovar e definir o papel: solicitante, manutenção ou verificador.',
      sql: `CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('solicitante','manutencao','verificador','admin') NOT NULL DEFAULT 'solicitante',
  aprovado TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '002',
      titulo: 'Setores e equipamentos',
      descricao: 'A mesma TAG da placa do equipamento, para a OS dizer exatamente qual máquina parou.',
      sql: `CREATE TABLE setores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  area_limpa TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE equipamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  setor_id INT NOT NULL,
  contato_produto TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (setor_id) REFERENCES setores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '003',
      titulo: 'A ordem de serviço',
      descricao: 'Os campos da antiga planilha de Excel, agora com status: aberta, em execução, aguardando verificação, fechada.',
      sql: `CREATE TABLE ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(12) NOT NULL UNIQUE,
  equipamento_id INT NOT NULL,
  solicitante_id INT NOT NULL,
  tipo ENUM('corretiva','preventiva','melhoria') NOT NULL,
  prioridade ENUM('baixa','media','alta','parada_linha') NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('aberta','em_execucao','aguardando_verificacao','fechada') NOT NULL DEFAULT 'aberta',
  aberta_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  fechada_em DATETIME,
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '004',
      titulo: 'Execução pela manutenção',
      descricao: 'O técnico registra início, fim, o que fez e as peças trocadas.',
      sql: `CREATE TABLE os_execucao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL UNIQUE,
  tecnico_id INT NOT NULL,
  inicio DATETIME NOT NULL,
  fim DATETIME,
  servico_realizado TEXT,
  pecas_trocadas VARCHAR(255),
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '005',
      titulo: 'Verificação e liberação BPF',
      descricao: 'Outra pessoa confere o serviço, a limpeza e libera a linha. Sem essa assinatura a OS não fecha.',
      sql: `CREATE TABLE os_verificacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL UNIQUE,
  verificador_id INT NOT NULL,
  limpeza_ok TINYINT(1) NOT NULL,
  ferramentas_recolhidas TINYINT(1) NOT NULL,
  linha_liberada TINYINT(1) NOT NULL,
  observacao VARCHAR(255),
  verificado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  FOREIGN KEY (verificador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      id: '006',
      titulo: 'Histórico para auditoria',
      descricao: 'Toda mudança de status fica gravada com quem e quando. É o que a auditoria de BPF pede.',
      sql: `CREATE TABLE os_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  usuario_id INT NOT NULL,
  status_de VARCHAR(30),
  status_para VARCHAR(30) NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_os_status ON ordens_servico (status, prioridade);`
    },
    {
      id: '007',
      titulo: 'Dados de exemplo',
      descricao: 'Equipamentos, ordens e verificações fictícias para você consultar no console abaixo.',
      sql: `INSERT INTO usuarios (nome, email, senha_hash, papel, aprovado) VALUES
  ('Admin Qualidade', 'qualidade@os.example', '$2y$10$hash', 'admin', 1),
  ('Lucas Prado', 'lucas@os.example', '$2y$10$hash', 'solicitante', 1),
  ('Diego Martins', 'diego@os.example', '$2y$10$hash', 'manutencao', 1),
  ('Patrícia Nunes', 'patricia@os.example', '$2y$10$hash', 'verificador', 1),
  ('Novo Operador', 'operador@os.example', '$2y$10$hash', 'solicitante', 0);

INSERT INTO setores (nome, area_limpa) VALUES
  ('Extrusão', 1), ('Ensaque', 1), ('Utilidades', 0);

INSERT INTO equipamentos (tag, nome, setor_id, contato_produto) VALUES
  ('EXT-01', 'Extrusora principal', 1, 1),
  ('SEC-02', 'Secador de pellets', 1, 1),
  ('ENS-03', 'Ensacadeira 15 kg', 2, 1),
  ('CMP-01', 'Compressor de ar', 3, 0);

INSERT INTO ordens_servico (numero, equipamento_id, solicitante_id, tipo, prioridade, descricao, status, aberta_em, fechada_em) VALUES
  ('OS-2026-0141', 3, 2, 'corretiva', 'parada_linha', 'Selagem do saco abrindo na lateral.', 'fechada', '2026-11-03 07:40', '2026-11-03 10:15'),
  ('OS-2026-0142', 1, 2, 'preventiva', 'media', 'Troca programada das facas da matriz.', 'aguardando_verificacao', '2026-11-05 13:00', NULL),
  ('OS-2026-0143', 4, 2, 'corretiva', 'alta', 'Compressor desarmando com frequência.', 'em_execucao', '2026-11-06 08:20', NULL),
  ('OS-2026-0144', 2, 2, 'melhoria', 'baixa', 'Instalar visor de nível no secador.', 'aberta', '2026-11-06 15:05', NULL);

INSERT INTO os_execucao (os_id, tecnico_id, inicio, fim, servico_realizado, pecas_trocadas) VALUES
  (1, 3, '2026-11-03 08:00', '2026-11-03 09:30', 'Troca da resistência de selagem e ajuste de temperatura.', 'Resistência 220V'),
  (2, 3, '2026-11-05 13:30', '2026-11-05 16:10', 'Facas trocadas e matriz limpa.', 'Jogo de facas'),
  (3, 3, '2026-11-06 09:00', NULL, NULL, NULL);

INSERT INTO os_verificacao (os_id, verificador_id, limpeza_ok, ferramentas_recolhidas, linha_liberada, observacao) VALUES
  (1, 4, 1, 1, 1, 'Linha liberada após limpeza.');

INSERT INTO os_historico (os_id, usuario_id, status_de, status_para, criado_em) VALUES
  (1, 2, NULL, 'aberta', '2026-11-03 07:40'),
  (1, 3, 'aberta', 'em_execucao', '2026-11-03 08:00'),
  (1, 3, 'em_execucao', 'aguardando_verificacao', '2026-11-03 09:30'),
  (1, 4, 'aguardando_verificacao', 'fechada', '2026-11-03 10:15'),
  (2, 3, 'em_execucao', 'aguardando_verificacao', '2026-11-05 16:10'),
  (3, 3, 'aberta', 'em_execucao', '2026-11-06 09:00');`
    }
  ],
  exemplos: [
    { rotulo: 'OS abertas por prioridade', sql: `SELECT o.numero, e.tag, o.prioridade, o.status, o.descricao
FROM ordens_servico o JOIN equipamentos e ON e.id = o.equipamento_id
WHERE o.status <> 'fechada'
ORDER BY CASE o.prioridade WHEN 'parada_linha' THEN 0 WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END;` },
    { rotulo: 'Esperando o verificador', sql: `SELECT o.numero, e.nome AS equipamento, x.fim AS execucao_terminou
FROM ordens_servico o
JOIN equipamentos e ON e.id = o.equipamento_id
JOIN os_execucao x ON x.os_id = o.id
WHERE o.status = 'aguardando_verificacao';` },
    { rotulo: 'Trilha de auditoria de uma OS', sql: `SELECT h.criado_em, u.nome, u.papel, h.status_de, h.status_para
FROM os_historico h JOIN usuarios u ON u.id = h.usuario_id
WHERE h.os_id = 1 ORDER BY h.criado_em;` },
    { rotulo: 'Cadastros para aprovar', sql: `SELECT nome, email, criado_em FROM usuarios WHERE aprovado = 0;` }
  ]
};
