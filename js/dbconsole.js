/* Console de banco de dados ao vivo — Caio Lopes
   Roda as migrações MySQL de cada projeto num SQLite dentro do navegador (sql.js),
   desenha o esquema a cada passo e deixa o visitante rodar SELECTs. */
(function (root) {
  'use strict';

  // ---------- MySQL -> SQLite (só o que as migrações usam) ----------
  function toSqlite(sql) {
    return sql
      .replace(/\)\s*ENGINE=[^;]*;/gi, ');')
      .replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/(\w+)\s+ENUM\(([^)]*)\)/gi, '$1 ENUM_TEXT CHECK ($1 IN ($2))')
      .replace(
        /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)\s+([\w()]+)\s*,\s*ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(\s*\2\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)\s*;/gi,
        'ALTER TABLE $1 ADD COLUMN $2 $3 REFERENCES $4($5);'
      );
  }

  // ---------- Destaque de SQL ----------
  var KW = 'SELECT FROM WHERE JOIN LEFT INNER ON AND OR NOT IN IS NULL AS GROUP BY ORDER HAVING LIMIT DESC ASC COUNT SUM AVG MIN MAX CASE WHEN THEN ELSE END CREATE TABLE INDEX PRIMARY KEY FOREIGN REFERENCES UNIQUE DEFAULT INSERT INTO VALUES UPDATE SET DELETE ALTER ADD COLUMN CONSTRAINT CASCADE ENGINE CHARSET AUTO_INCREMENT INT INTEGER VARCHAR CHAR TEXT DECIMAL DATE DATETIME TINYINT ENUM JSON CURRENT_TIMESTAMP DISTINCT'.split(' ');
  var KWSET = {}; KW.forEach(function (k) { KWSET[k] = 1; });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(sql) {
    var out = '', re = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|([\s\S])/g, m;
    while ((m = re.exec(sql))) {
      if (m[1]) out += '<span class="t-com">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="t-str">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="t-num">' + m[3] + '</span>';
      else if (m[4]) out += KWSET[m[4].toUpperCase()] ? '<span class="t-kw">' + m[4] + '</span>' : esc(m[4]);
      else out += esc(m[5]);
    }
    return out;
  }

  // ---------- Leitura do esquema ----------
  function readSchema(db) {
    var res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
    if (!res.length) return [];
    return res[0].values.map(function (r) {
      var name = r[0];
      var cols = db.exec('PRAGMA table_info(' + name + ')')[0].values.map(function (c) {
        return { name: c[1], type: c[2], notnull: !!c[3], pk: c[5] > 0 };
      });
      var fkRes = db.exec('PRAGMA foreign_key_list(' + name + ')');
      var fks = fkRes.length ? fkRes[0].values.map(function (f) { return { from: f[3], table: f[2], to: f[4] }; }) : [];
      var count = db.exec('SELECT COUNT(*) FROM ' + name)[0].values[0][0];
      return { name: name, cols: cols, fks: fks, rows: count };
    });
  }

  root.DBConsoleCore = { toSqlite: toSqlite, highlight: highlight, readSchema: readSchema, esc: esc };

  // ---------- Interface (só no navegador) ----------
  if (typeof document === 'undefined') return;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  function init() {
    var app = $('[data-dbconsole]');
    var data = root.PROJECT_DB;
    if (!app || !data) return;

    var stepList = $('[data-steps]', app);
    var stepCode = $('[data-step-code]', app);
    var stepTitle = $('[data-step-title]', app);
    var stepDesc = $('[data-step-desc]', app);
    var btnNext = $('[data-next]', app);
    var btnAll = $('[data-all]', app);
    var btnReset = $('[data-reset]', app);
    var progress = $('[data-progress]', app);
    var schemaEl = $('[data-schema]');
    var schemaMeta = $('[data-schema-meta]');
    var queryEl = $('[data-query]');
    var queryHl = $('[data-query-hl]');
    var runBtn = $('[data-run]');
    var resultEl = $('[data-result]');
    var statusEl = $('[data-query-status]');
    var examplesEl = $('[data-examples]');

    var SQL = null, db = null, applied = 0, selected = 0, known = {};

    // Lista de passos
    data.steps.forEach(function (s, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'step';
      b.innerHTML = '<span class="step__id">' + s.id + '</span><span class="step__name">' + esc(s.titulo) + '</span><span class="step__state" aria-hidden="true"></span>';
      b.addEventListener('click', function () { select(i); });
      li.appendChild(b);
      stepList.appendChild(li);
    });

    function select(i) {
      selected = i;
      var s = data.steps[i];
      stepTitle.textContent = s.id + ' · ' + s.titulo;
      stepDesc.textContent = s.descricao;
      stepCode.innerHTML = highlight(s.sql);
      stepCode.scrollTop = 0;
      paint();
    }

    function paint() {
      Array.prototype.forEach.call(stepList.querySelectorAll('.step'), function (b, i) {
        b.classList.toggle('is-done', i < applied);
        b.classList.toggle('is-current', i === selected);
        b.setAttribute('aria-current', i === selected ? 'step' : 'false');
        b.querySelector('.step__state').textContent = i < applied ? 'aplicado' : (i === applied ? 'próximo' : '');
      });
      progress.textContent = applied + ' de ' + data.steps.length + ' migrações aplicadas';
      btnNext.disabled = !db || applied >= data.steps.length;
      btnAll.disabled = !db || applied >= data.steps.length;
      btnNext.querySelector('span').textContent = applied >= data.steps.length ? 'Banco completo' : 'Aplicar migração ' + data.steps[applied].id;
    }

    function renderSchema(fresh) {
      var tables = readSchema(db);
      schemaMeta.textContent = tables.length
        ? tables.length + (tables.length === 1 ? ' tabela' : ' tabelas') + ' · ' + tables.reduce(function (a, t) { return a + t.fks.length; }, 0) + ' chaves estrangeiras'
        : 'Banco vazio. Aplique a primeira migração.';
      schemaEl.innerHTML = tables.length ? '' : '<p class="schema__empty">Nenhuma tabela ainda.</p>';
      tables.forEach(function (t) {
        var fkMap = {}; t.fks.forEach(function (f) { fkMap[f.from] = f; });
        var card = document.createElement('article');
        card.className = 'tbl' + (fresh && !known[t.name] ? ' is-new' : '');
        card.id = 'tbl-' + t.name;
        var rows = t.cols.map(function (c) {
          var f = fkMap[c.name];
          var tag = c.pk ? '<span class="key key--pk" title="Chave primária">PK</span>' : (f ? '<a class="key key--fk" href="#tbl-' + f.table + '" title="Referencia ' + f.table + '.' + f.to + '">FK</a>' : '<span class="key"></span>');
          return '<li>' + tag + '<span class="col__name">' + esc(c.name) + '</span><span class="col__type">' + esc(c.type.toLowerCase().replace('enum_text', 'enum')) + (f ? ' → ' + esc(f.table) : '') + '</span></li>';
        }).join('');
        card.innerHTML = '<header><h4>' + esc(t.name) + '</h4><span>' + t.rows + (t.rows === 1 ? ' linha' : ' linhas') + '</span></header><ul>' + rows + '</ul>';
        schemaEl.appendChild(card);
      });
      known = {}; tables.forEach(function (t) { known[t.name] = 1; });
    }

    function applyNext() {
      if (applied >= data.steps.length) return;
      try {
        db.exec(toSqlite(data.steps[applied].sql));
        applied++;
        renderSchema(true);
        select(Math.min(applied, data.steps.length - 1));
        if (applied === data.steps.length) runQuery();
      } catch (e) {
        statusEl.textContent = 'Erro na migração: ' + e.message;
      }
    }

    function reset() {
      if (db) db.close();
      db = new SQL.Database();
      db.exec('PRAGMA foreign_keys = ON;');
      applied = 0; known = {};
      renderSchema(false);
      select(0);
      resultEl.innerHTML = '';
      statusEl.textContent = 'Banco vazio. Aplique as migrações acima para ter tabelas e dados.';
    }

    function syncHl() { queryHl.innerHTML = highlight(queryEl.value) + '\n'; queryHl.scrollTop = queryEl.scrollTop; }

    function runQuery() {
      if (!db) return;
      var q = queryEl.value.trim();
      if (!q) return;
      if (!/^\s*(select|with|pragma)\b/i.test(q)) {
        statusEl.textContent = 'O console aceita consultas de leitura (SELECT). As alterações ficam nas migrações.';
        return;
      }
      var t0 = performance.now();
      try {
        var res = db.exec(q);
        var ms = (performance.now() - t0).toFixed(1);
        if (!res.length) { resultEl.innerHTML = ''; statusEl.textContent = 'Nenhuma linha · ' + ms + ' ms'; return; }
        var r = res[res.length - 1];
        var html = '<table><thead><tr>' + r.columns.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        r.values.forEach(function (row) {
          html += '<tr>' + row.map(function (v) {
            var num = typeof v === 'number';
            return '<td' + (num ? ' class="num"' : '') + '>' + (v === null ? '<span class="null">null</span>' : esc(num && !Number.isInteger(v) ? v.toFixed(2) : v)) + '</td>';
          }).join('') + '</tr>';
        });
        resultEl.innerHTML = html + '</tbody></table>';
        statusEl.textContent = r.values.length + (r.values.length === 1 ? ' linha' : ' linhas') + ' · ' + ms + ' ms';
      } catch (e) {
        resultEl.innerHTML = '';
        statusEl.textContent = /no such table/i.test(e.message)
          ? 'Essa tabela ainda não existe. Aplique as migrações até ela ser criada.'
          : 'Erro: ' + e.message;
      }
    }

    // Exemplos
    data.exemplos.forEach(function (ex, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = ex.rotulo;
      b.addEventListener('click', function () {
        queryEl.value = ex.sql; syncHl();
        Array.prototype.forEach.call(examplesEl.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        runQuery();
      });
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      examplesEl.appendChild(b);
    });
    queryEl.value = data.exemplos[0].sql; syncHl();

    queryEl.addEventListener('input', syncHl);
    queryEl.addEventListener('scroll', function () { queryHl.scrollTop = queryEl.scrollTop; });
    queryEl.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
    });
    runBtn.addEventListener('click', runQuery);
    btnNext.addEventListener('click', applyNext);
    btnAll.addEventListener('click', function () { while (applied < data.steps.length) applyNext(); });
    btnReset.addEventListener('click', reset);

    select(0);
    paint();
    statusEl.textContent = 'Carregando o SQLite no navegador…';

    var base = app.getAttribute('data-vendor') || '../vendor/';
    root.initSqlJs({ locateFile: function (f) { return base + f; } })
      .then(function (S) { SQL = S; reset(); })
      .catch(function () { statusEl.textContent = 'Não foi possível carregar o SQLite neste navegador. O código das migrações continua visível acima.'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
