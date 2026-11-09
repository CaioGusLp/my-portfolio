/* Caio Lopes — portfólio: menu no celular e a animação de migrações da home. */
(function () {
  'use strict';

  // Menu
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.hasAttribute('data-open');
      if (open) nav.removeAttribute('data-open'); else nav.setAttribute('data-open', '');
      toggle.setAttribute('aria-expanded', String(!open));
    });
    nav.querySelectorAll('.nav__sheet a').forEach(function (a) {
      a.addEventListener('click', function () { nav.removeAttribute('data-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  // Migrações rodando em loop (3,6 s por volta, com pausa)
  var mig = document.querySelector('[data-mig]');
  if (!mig) return;
  var rows = Array.prototype.slice.call(mig.querySelectorAll('.mig__row'));
  var tablesEl = mig.querySelector('[data-mig-tables]');
  var pauseBtn = document.querySelector('[data-mig-pause]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0, timer = null, paused = false;

  function paint() {
    var tables = 0;
    rows.forEach(function (r, k) {
      r.classList.toggle('is-done', k < i);
      r.classList.toggle('is-run', k === i);
      r.querySelector('em').textContent = k < i ? 'ok' : (k === i ? 'rodando' : '');
      if (k < i) tables += +r.getAttribute('data-tables') || 0;
    });
    if (tablesEl) tablesEl.textContent = tables;
  }
  function tick() { i = i >= rows.length ? 0 : i + 1; paint(); }
  function start() { stop(); timer = setInterval(tick, 450); }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  if (reduce) { i = rows.length; paint(); if (pauseBtn) pauseBtn.hidden = true; return; }
  paint(); start();
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      if (paused) stop(); else start();
      pauseBtn.setAttribute('aria-label', paused ? 'Continuar animação' : 'Pausar animação');
      pauseBtn.innerHTML = paused
        ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z"/></svg>'
        : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z"/></svg>';
    });
  }
})();
