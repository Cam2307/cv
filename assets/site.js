/* Cameron Reece Allcock — site interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = mqReduce.matches;
  var native = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* Split headline into words for a staggered entrance */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = doc.createElement('span');
      s.className = 'w'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true');
      s.textContent = w + (i < words.length - 1 ? ' ' : '');
      el.appendChild(s);
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  });

  /* Reveal on scroll (IntersectionObserver) */
  var reveals = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* "On the chart" steps: highlight the step nearest the reading line */
  var steps = $$('[data-step]'), meter = doc.querySelector('.story-meter');
  if (steps.length && 'IntersectionObserver' in window) {
    var seen = 0;
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('on', e.isIntersecting);
        if (e.isIntersecting) seen = Math.max(seen, steps.indexOf(e.target) + 1);
      });
      if (meter) meter.style.setProperty('--steps', (seen / steps.length).toFixed(3));
    }, { rootMargin: '-35% 0px -35% 0px' });
    steps.forEach(function (s) { sio.observe(s); });
    if (reduce) steps.forEach(function (s) { s.classList.add('on'); });
  }

  /* Mobile menu */
  var btn = doc.querySelector('.menu-btn'), nav = doc.getElementById('primary-nav');
  if (btn && nav) {
    var setOpen = function (open) { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; };
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
  }

  /* Interest form: intentionally not connected to anything yet */
  var form = doc.getElementById('interest-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    doc.getElementById('form-note').textContent = 'Thank you. Sign-ups open soon. Nothing has been sent or stored yet, so please check back here.';
  });

  /* Scroll-linked effects: JS fallback where native scroll timelines are missing */
  var draws = $$('.js .draw'), shots = $$('.shot-frame img');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = innerHeight, max = root.scrollHeight - vh;
      root.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (native || reduce) return;
      draws.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7)));
        p.style.setProperty('--draw', (1 - t).toFixed(3));
      });
      shots.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        var t = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.setProperty('--py', (t * -3).toFixed(2) + '%');
      });
    });
  }
  if (!native || !reduce) { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  /* Tilt + cursor light on cards, magnetic buttons (fine pointers only) */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (card) {
      var raf = 0, ev = null;
      card.addEventListener('pointermove', function (e) {
        ev = e; if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - 0.5) * 5).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
          card.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
          card.style.setProperty('--lo', 1);
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); card.style.setProperty('--lo', 0);
      });
    });
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* Hero: a gold-tinted flowing line field on canvas. Purely decorative and trendless. */
  var cv = doc.querySelector('.hero-field');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, t0 = performance.now(), running = false, visible = true, mx = 0.5, my = 0.5;
    var LINES = innerWidth < 760 ? 16 : 26, STEP = innerWidth < 760 ? 14 : 10;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function wave(x, i, t) {
      var k = i / LINES;
      return Math.sin(x * 0.0042 + t * 0.35 + i * 0.42) * (26 + 30 * k)
           + Math.sin(x * 0.011 - t * 0.6 + i * 1.7) * 9
           + Math.sin(x * 0.0017 + t * 0.12 + k * 4) * 46;
    }
    function frame(now) {
      var t = reduce ? 4 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (var i = 0; i < LINES; i++) {
        var k = i / (LINES - 1);
        var base = H * (0.12 + k * 0.78) + (my - 0.5) * 30 * k;
        var a = 0.08 + 0.42 * Math.pow(Math.sin(Math.PI * k), 2);
        var g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(216,180,106,0)');
        g.addColorStop(0.45 + (mx - 0.5) * 0.3, 'rgba(240,217,166,' + a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(216,180,106,' + (a * 0.6).toFixed(3) + ')');
        ctx.strokeStyle = g;
        ctx.beginPath();
        for (var x = -STEP; x <= W + STEP; x += STEP) {
          var y = base + wave(x, i, t);
          x <= 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      if (running) requestAnimationFrame(frame);
    }
    function start() { if (!running && visible && !reduce && !doc.hidden) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }
    size(); frame(performance.now());
    var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); if (!running) frame(performance.now()); }, 150); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    doc.addEventListener('visibilitychange', function () { doc.hidden ? stop() : start(); });
    if (fine) cv.parentNode.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
    mqReduce.addEventListener && mqReduce.addEventListener('change', function (e) { reduce = e.matches; reduce ? (stop(), frame(0)) : start(); });
    start();
  }
})();
