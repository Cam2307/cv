/* Shared behaviour for the CV pages: motion preference, menu, magnetic cursor, file:// links.
   No dependencies. The landing page builds on window.CV from here. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, CV = window.CV = window.CV || {};
  var KEY = 'cv-motion';
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  CV.mouse = CV.mouse || { x: 0.5, y: 0.5, on: 0 };

  /* ---------- Motion preference ----------
     Default follows prefers-reduced-motion. The Motion switch stores an explicit choice.
     Off means the same static, fully assembled layout that reduced motion gets. */
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  CV.motion = html.classList.contains('motion');
  var switches = $$('.motion-switch');
  function sync() { switches.forEach(function (b) { b.setAttribute('aria-checked', String(CV.motion)); }); }
  CV.setMotion = function (on, persist) {
    if (persist) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ } }
    if (on !== CV.motion) {
      CV.motion = on;
      html.classList.toggle('motion', on);
      d.dispatchEvent(new CustomEvent('cv:motion', { detail: { on: on } }));
    }
    sync();
    cursorSync();
  };
  switches.forEach(function (b) { b.addEventListener('click', function () { CV.setMotion(!CV.motion, true); }); });
  sync();
  var onReduce = function () { if (!stored()) CV.setMotion(!mqReduce.matches, false); };
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduce);

  /* ---------- file:// viewing: directory links need an explicit index.html ---------- */
  if (location.protocol === 'file:') {
    $$('a[href]').forEach(function (a) {
      var h = a.getAttribute('href'), m = h.match(/^([^#?]*)(.*)$/);
      if (!m || !m[1] || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(h)) return;
      if (/\/$/.test(m[1])) a.setAttribute('href', m[1] + 'index.html' + m[2]);
    });
  }

  /* ---------- Menu: a modal <dialog> (page inert, Escape closes, focus returns) ---------- */
  var menu = d.getElementById('menu'), openBtn = d.querySelector('.menu-btn');
  if (menu && openBtn && typeof menu.showModal === 'function') {
    openBtn.addEventListener('click', function () {
      menu.showModal();
      html.classList.add('menu-open');
      openBtn.setAttribute('aria-expanded', 'true');
      d.dispatchEvent(new CustomEvent('cv:menu', { detail: { open: true } }));
    });
    menu.addEventListener('close', function () {
      html.classList.remove('menu-open');
      openBtn.setAttribute('aria-expanded', 'false');
      d.dispatchEvent(new CustomEvent('cv:menu', { detail: { open: false } }));
    });
    var closeBtn = menu.querySelector('.menu-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { menu.close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.close(); });
    var mqWide = matchMedia('(min-width: 900px)');
    var onWide = function () { if (mqWide.matches && menu.open) menu.close(); };
    if (mqWide.addEventListener) mqWide.addEventListener('change', onWide);
  }

  /* ---------- Pointer tracking (also feeds the shader light and the floating pieces) ---------- */
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    CV.mouse.x = e.clientX / innerWidth;
    CV.mouse.y = e.clientY / innerHeight;
    CV.mouse.on = 1;
  }, { passive: true });
  d.addEventListener('pointerleave', function () { CV.mouse.on = 0; });

  /* ---------- Magnetic cursor: a ring that eases after the pointer and wraps magnetic controls ---------- */
  var cursor = null;
  function makeCursor() {
    var ring = d.createElement('div'), dot = d.createElement('div');
    ring.className = 'cursor-ring'; dot.className = 'cursor-dot';
    ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    d.body.appendChild(ring); d.body.appendChild(dot);
    html.classList.add('has-cursor');
    var mx = -100, my = -100, rx = -100, ry = -100, rw = 36, rh = 36, rr = 18, shown = false, raf = 0;
    var target = null, hover = false;

    function frame() {
      raf = 0;
      var tx = mx, ty = my, tw = 36, th = 36, tr = 18;
      if (target && target.isConnected) {
        var b = target.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        tx = cx + (mx - cx) * 0.1; ty = cy + (my - cy) * 0.1;
        tw = b.width + 16; th = b.height + 16;
        tr = Math.min(th / 2, (parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0) + 8);
      } else if (hover) { tw = th = 56; tr = 28; }
      rx += (tx - rx) * 0.22; ry += (ty - ry) * 0.22;
      rw += (tw - rw) * 0.2; rh += (th - rh) * 0.2; rr += (tr - rr) * 0.2;
      ring.style.width = rw.toFixed(1) + 'px';
      ring.style.height = rh.toFixed(1) + 'px';
      ring.style.borderRadius = rr.toFixed(1) + 'px';
      ring.style.transform = 'translate3d(' + (rx - rw / 2).toFixed(1) + 'px,' + (ry - rh / 2).toFixed(1) + 'px,0)';
      dot.style.transform = 'translate3d(' + (mx - 3) + 'px,' + (my - 3) + 'px,0) scale(' + (target || hover ? 0 : 1) + ')';
      if (Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(tw - rw) + Math.abs(th - rh) > 0.3) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function move(e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; ring.style.opacity = dot.style.opacity = '1'; }
      if (target) {
        var b = target.getBoundingClientRect();
        target.style.translate = ((mx - b.left - b.width / 2) * 0.22).toFixed(1) + 'px ' + ((my - b.top - b.height / 2) * 0.3).toFixed(1) + 'px';
      }
      kick();
    }
    function over(e) {
      var m = e.target.closest && e.target.closest('[data-magnetic]');
      var l = e.target.closest && e.target.closest('a, button, [role="switch"]');
      if (m !== target) { if (target) target.style.translate = ''; target = m; }
      hover = !!l; kick();
    }
    function leaveDoc() { shown = false; ring.style.opacity = dot.style.opacity = '0'; if (target) target.style.translate = ''; target = null; }
    function down() { ring.classList.add('is-down'); }
    function up() { ring.classList.remove('is-down'); }
    addEventListener('pointermove', move, { passive: true });
    d.addEventListener('pointerover', over, { passive: true });
    d.documentElement.addEventListener('pointerleave', leaveDoc);
    addEventListener('pointerdown', down, { passive: true });
    addEventListener('pointerup', up, { passive: true });
    return {
      destroy: function () {
        removeEventListener('pointermove', move); d.removeEventListener('pointerover', over);
        d.documentElement.removeEventListener('pointerleave', leaveDoc);
        removeEventListener('pointerdown', down); removeEventListener('pointerup', up);
        if (raf) cancelAnimationFrame(raf);
        if (target) target.style.translate = '';
        ring.remove(); dot.remove(); html.classList.remove('has-cursor');
      }
    };
  }
  function cursorSync() {
    var want = CV.motion && mqFine.matches;
    if (want && !cursor) cursor = makeCursor();
    else if (!want && cursor) { cursor.destroy(); cursor = null; }
  }
  if (mqFine.addEventListener) mqFine.addEventListener('change', cursorSync);
  cursorSync();
})();
