# Portfólio CL DEV — Caio Lopes

Mesmo site de antes, com duas adições:

- **Seção "Projetos em destaque"** (index.html, id `destaques`): premiatta.com e o DevFood DB.
- **projetos/devfood-banco.html**: projeto de banco de dados fictício (delivery) com as migrações passo a passo, o esquema ao vivo e um console SQL. Roda em SQLite no navegador (`vendor/sql-wasm.*`).

## Print do premiatta.com
Salve um print da página inicial como `images/projetos/premiatta.webp` (1280x800). Ele aparece no lugar da tela em HTML automaticamente.

## Testar localmente
O console carrega um arquivo .wasm, então abra por um servidor: `python3 -m http.server 8000`.
