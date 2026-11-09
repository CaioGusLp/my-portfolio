# Portfólio — Caio Lopes

Site estático (HTML, CSS e JavaScript puros). Não precisa de build.

## Estrutura
- `index.html` — home
- `projetos/*.html` — uma página por projeto (premiatta.com, Premiatta Connect, Roteirizador, Ordem de Serviço)
- `js/db/*.js` — as migrações MySQL e as consultas prontas de cada projeto (edite aqui para mudar o banco de modelo)
- `js/dbconsole.js` — aplica as migrações num SQLite no navegador (sql.js), desenha o esquema e roda o console
- `css/site.css` — sistema visual; `css/ui.css` — telas dos projetos em HTML
- `vendor/` — sql.js (SQLite em WebAssembly), `fonts/` — Geist, `img/icons/` — ícones Devicon

## Rodar localmente
O console SQL carrega um arquivo `.wasm`, então abra por um servidor (não pelo `file://`):

    python3 -m http.server 8000

e acesse http://localhost:8000. No GitHub Pages, Vercel ou Hostinger funciona direto.
