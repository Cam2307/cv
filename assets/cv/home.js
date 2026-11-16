/* Landing page: the CV assembles itself, jigsaw-style, as you scroll.
   Progressive enhancement: the HTML and CSS alone are the finished, static layout. With motion on
   (no reduced-motion preference, or the Motion switch), GSAP ScrollTrigger scrubs every piece from
   a scattered start into place and Lenis smooths wheel scrolling. Switching motion off reverts
   every tween, pin and inline style, which leaves exactly the static layout. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, CV = window.CV = window.CV || {};
  var gsap = window.gsap, ST = window.ScrollTrigger;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var mqSmall = matchMedia('(max-width: 599.98px)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  CV.light = CV.light || 0;   // read by the shader: how assembled the page is (0..1)
  CV.pulse = CV.pulse || 0;   // a brief swell of light when a section locks

  /* ---------- 1. Structure that exists with or without motion ---------- */

  function tab(big, small) { return function () { return mqSmall.matches ? small : big; }; }
  var puzzles = {};
  if (window.Jigsaw) {
    var chainEl = $('.chain'), gridEl = $('.skills-grid'), finEl = $('.fin-board');
    if (chainEl) puzzles.xp = Jigsaw.mount(chainEl, { cells: ':scope > .xp-card', maxT: tab(24, 17), seed: 7 });
    if (gridEl) puzzles.skills = Jigsaw.mount(gridEl, { cells: ':scope > .skill', maxT: tab(28, 19), seed: 3 });
    if (finEl) puzzles.fin = Jigsaw.mount(finEl, { cells: ':scope > .fin-piece', maxT: tab(30, 19), seed: 5 });
  }

  // Hero portrait jigsaw (optional): phone mockup uses a crisp static avatar instead.
  var phoneHero = $('.phone-hero');
  var board = $('.board:not(.board--avatar)');
  var boardImg = (board && $('.board-img', board)) || $('.profile-avatar img');
  var portrait = null;
  if (!board) html.classList.add('hero-static-portrait');
  var srcPromise = null, rendered = 0, htTimer = 0;
  function source() {
    if (!srcPromise) srcPromise = Portrait.load(boardImg.currentSrc || boardImg.src);
    return srcPromise;
  }
  function fallback() { if (board) board.classList.add('is-fallback'); }
  function renderBoard(S) {
    if (!portrait || !S || (rendered && Math.abs(S - rendered) / rendered < 0.12)) return;
    source().then(function (img) {
      var canvas;
      try { canvas = Portrait.halftone(img, S); } catch (e) { fallback(); return; }   // tainted under file://
      rendered = S;
      return Portrait.toURL(canvas).then(function (url) {
        var old = portrait.href;
        portrait.setImage(url);
        if (old && old.indexOf('blob:') === 0) setTimeout(function () { URL.revokeObjectURL(old); }, 2000);
      });
    }).catch(fallback);
  }
  if (board && boardImg && window.Portrait && window.Jigsaw && !html.classList.contains('hero-static-portrait')) {
    portrait = Portrait.mountBoard(board, {
      n: 4, seed: 4,
      onLayout: function (S) { clearTimeout(htTimer); htTimer = setTimeout(function () { renderBoard(S); }, rendered ? 220 : 0); }
    });
    var finImg = $('.fin-portrait img');
    if (finImg) {
      source().then(function (img) {
        var canvas;
        try { canvas = Portrait.halftone(img, 196, { lines: 58 }); } catch (e) { return; }
        return Portrait.toURL(canvas).then(function (url) { finImg.src = url; finImg.classList.add('is-halftone'); });
      }).catch(function () {});
    }
  }

  // Statement: one span per word (for the scrubbed read-through), with an untouched copy for screen readers.
  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    var sr = d.createElement('span'), vis = d.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = el.textContent.replace(/\s+/g, ' ').trim();
    vis.setAttribute('aria-hidden', 'true');
    (function walk(src, dst) {
      Array.prototype.forEach.call(src.childNodes, function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { dst.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span');
            w.className = 'w';
            w.textContent = part;
            dst.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          var c = n.cloneNode(false);
          dst.appendChild(c);
          walk(n, c);
        }
      });
    })(el, vis);
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(vis);
  }
  splitWords($('.statement'));

  /* ---------- 2. Motion ---------- */

  if (!gsap || !ST || !window.Jigsaw) {
    // Without the animation libraries the page simply stays in its static layout.
    $$('.motion-switch').forEach(function (b) { b.hidden = true; });
    if (CV.setMotion) CV.setMotion(false, false); else html.classList.remove('motion');
    CV.ready = true;
    return;
  }
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  CV.st = ST;

  // Header mark: six pieces = portrait, name, role, experience, skills, certifications.
  var marks = $$('.mark--live path'), markCount = $('.mark-count b'), pzCount = $('.pz-count b');
  function setMark(k, on) {
    if (!marks[k]) return;
    marks[k].classList.toggle('on', on);
    if (markCount) markCount.textContent = String(marks.filter(function (m) { return m.classList.contains('on'); }).length);
  }

  // A lock fires once when a scrubbed timeline passes a time, and un-fires when scrubbed back.
  function Locks() {
    var items = [];
    return {
      add: function (t, on, off) { items.push({ t: t, on: on, off: off, done: false }); },
      update: function (time) {
        for (var i = 0; i < items.length; i++) {
          var it = items[i], now = time >= it.t - 1e-4;
          if (now === it.done) continue;
          it.done = now;
          if (now && it.on) it.on(); else if (!now && it.off) it.off();
        }
      }
    };
  }

  // The light that runs once round a piece's outline when it locks.
  function glint(root) {
    var g = root && $('.pz-glint', root);
    if (!g) return;
    gsap.killTweensOf(g);
    gsap.set(g, { strokeDashoffset: 0.16, opacity: 0 });
    gsap.to(g, { opacity: 1, duration: 0.2, ease: 'power1.out' });
    gsap.to(g, { strokeDashoffset: -0.84, duration: 1.2, ease: 'power2.inOut' });
    gsap.to(g, { opacity: 0, duration: 0.45, delay: 0.85, ease: 'power1.in' });
  }
  function cardGlint(card) {
    var g = card && $('.card-glint i', card);
    if (!g) return;
    gsap.killTweensOf(g);
    gsap.fromTo(g, { xPercent: -110, opacity: 1 }, { xPercent: 260, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(g, { opacity: 0, duration: 0.3, delay: 0.8 });
  }
  function pop(el) { if (el) gsap.fromTo(el, { scale: 1.03 }, { scale: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); }
  function pulse(v) { CV.pulse = Math.max(CV.pulse || 0, v); }

  // Lenis: smooth wheel scrolling on fine pointers only; touch keeps native scrolling.
  var lenis = null;
  function lenisRaf(t) { if (lenis) lenis.raf(t * 1000); }
  function lenisOn() {
    if (lenis || !window.Lenis || !mqFine.matches) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
    CV.lenis = lenis;
  }
  function lenisOff() {
    if (!lenis) return;
    gsap.ticker.remove(lenisRaf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
    lenis = CV.lenis = null;
  }
  d.addEventListener('cv:menu', function (e) { if (lenis) { if (e.detail.open) lenis.stop(); else lenis.start(); } });

  // Shader light, loaded lazily the first time motion is on.
  var glRequested = false;
  function glOn() {
    if (CV.gl) { CV.gl.start(); return; }
    if (glRequested) return;
    glRequested = true;
    var go = function () {
      var s = d.createElement('script');
      s.src = $('meta[name="cv-gl"]').content;
      s.async = true;
      d.head.appendChild(s);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
  }
  function glOff() { if (CV.gl) { CV.gl.stop(); $('.gl').classList.remove('is-on'); } }

  /* ---------- 3. Sections ---------- */

  // Stable pseudo-random numbers, so pieces scatter the same way on every visit.
  function randoms(n, seed) {
    var r = Jigsaw.rng(seed), out = [];
    for (var i = 0; i < n; i++) out.push({ a: r(), b: r(), c: r(), d: r(), e: r(), f: r() });
    return out;
  }

  /* ---------- 2b. Mobile motion design tokens (narrow only) ----------
     The single place that tunes how phones move. Desktop never reads any of this: its
     timelines are byte-for-byte what they were. On phones every element *type* gets its
     own gesture — text wipes and de-blurs, media pushes back in depth, cards arrive from
     four rotating directions, rails draw — and a per-element index picks the variant, so a
     long scroll never plays the same move twice in a row.
     Transform + opacity only (blur is reserved for one-shot, non-scrubbed entrances), so
     the compositor keeps everything on the GPU at 60fps. */
  var MOTION = {
    text:  { lift: 26, blur: 8,  dur: 0.82, ease: 'expo.out' },
    media: { scale: 1.12, lift: 30, dur: 1.2, ease: 'power4.out' },
    card:  { dist: 36, rot: 5,  dur: 1,    ease: 'back.out(1.28)' },
    rail:  { dur: 0.95, ease: 'expo.out' }
  };
  /* Four approach vectors for card-like elements. Cycling by index means neighbouring
     cards always arrive from different sides — the same move never repeats twice in a row. */
  var CARD_DIRS = [
    { x: -1,   y: 0.6, rot: -1 },    // from the left
    { x: 1,    y: 0.6, rot: 1 },     // from the right
    { x: 0,    y: 1,   rot: 0, flat: true },  // straight up (a touch of scale instead of tilt)
    { x: -0.7, y: 0.7, rot: -0.6 }   // diagonal
  ];
  /* Overshoot strength cycles too, so consecutive cards don't settle with the identical snap. */
  var CARD_EASES = ['back.out(1.28)', 'back.out(1.7)', 'expo.out'];

  function cardEase(k) { return CARD_EASES[k % CARD_EASES.length]; }

  /** Mobile card entrance: direction cycles by index, distance/rotation/lift jitter from the
   *  element's own random triple. Pure transform + opacity — never touches layout. */
  function mobileCardFrom(k, r) {
    var d = CARD_DIRS[k % CARD_DIRS.length], dist = MOTION.card.dist + r.a * 20;
    var v = { x: d.x * dist, y: d.y * dist, rotation: d.rot * (MOTION.card.rot + r.b * 3), opacity: 0 };
    if (d.flat) v.scale = 0.955;                // the straight-up card arrives slightly smaller → depth
    return v;
  }

  function buildHero(narrow, cleanups) {
    var hero = $('.hero'), stage = $('.hero-stage');
    var pieces = portrait ? portrait.pieces : [], n = pieces.length;
    var R = randoms(n, 21), RT = randoms(4, 33), DUR = 0.2;
    var roleTiles = $$('.role-tile'), lits = $$('.nm-lit');
    var locks = Locks(), locked = 0;

    // Solve it the way people do: corners, then edges, then the middle.
    var order = pieces.slice().sort(function (p, q) {
      function rank(x) { var e = (x.i === 0 || x.i === 3) + (x.j === 0 || x.j === 3); return 2 - e; }
      return rank(p) - rank(q) || (R[pieces.indexOf(p)].e - R[pieces.indexOf(q)].e);
    });

    /* Loose pieces wait in two bands beside the board, between the header and the location text,
       so they never cross the name, the role line or the meta text at any viewport size.
       Each band is a jittered grid of slots; the left half of the puzzle waits on the left. */
    var layout = null;
    function forget() { layout = null; }
    ST.addEventListener('refreshInit', forget);
    cleanups.push(function () { ST.removeEventListener('refreshInit', forget); });
    function measure() {
      if (!board) return { S: 300, slots: [], top: 0, bottom: 0, inner: 0, outer: 0 };
      var isAvatar = board.classList.contains('board--avatar');
      var anchor = phoneHero || board;
      var b = isAvatar ? board.getBoundingClientRect() : anchor.getBoundingClientRect();
      var s = stage.getBoundingClientRect();
      var cx = b.left + b.width / 2, cy = b.top + b.height / 2, S = b.width || 300;
      var gut = parseFloat(getComputedStyle(stage).paddingLeft) || 20;
      if (isAvatar) {
        /* Avatar pieces use the board’s real size so scatter offsets stay inside the square
           (and CSS clips paint) instead of using the phone width and spilling over profile text. */
        var pad = S * 0.08;
        var top = -S / 2 + pad, bottom = S / 2 - pad;
        var inner = S * 0.12, outer = narrow ? S * 0.4 : S * 0.46;
        var cols = narrow ? 2 : 2, rows = narrow ? 4 : 3, slots = [];
        [-1, 1].forEach(function (side) {
          for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
            var x0 = inner + (outer - inner) * (c + 0.5) / cols;
            var y0 = top + (bottom - top) * (r + 0.5) / rows;
            slots.push({ side: side, x: side * x0, y: y0, w: (outer - inner) / cols, h: (bottom - top) / rows });
          }
        });
        return { S: S, slots: slots, top: top, bottom: bottom, inner: inner, outer: outer };
      }
      var head = $('.site-header').offsetHeight;
      var floor = Math.min.apply(null, $$('.role, .hero-connect').map(function (e) { return e.getBoundingClientRect().top; }));
      if (!narrow) floor = Math.min(floor, $('.hero-meta--left').getBoundingClientRect().top);
      var top = (narrow ? $('.hero-meta--left').getBoundingClientRect().bottom + 6 : s.top + head + 4) - cy;
      var bottom = floor - 10 - cy;
      var inner = S / 2 + (narrow ? 4 : 28), outer = (narrow ? s.width / 2 - 4 : s.width / 2 - gut * 0.6);
      var cols = narrow ? 1 : 3, rows = narrow ? 8 : 3, slots = [];
      [-1, 1].forEach(function (side) {
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var x0 = inner + (outer - inner) * (c + 0.5) / cols, y0 = top + (bottom - top) * (r + 0.5) / rows;
          slots.push({ side: side, x: side * x0, y: y0, w: (outer - inner) / cols, h: (bottom - top) / rows });
        }
      });
      return { S: S, slots: slots, top: top, bottom: bottom, inner: inner, outer: outer };
    }
    function scatter(p) {
      if (!layout) { layout = measure(); assign(); }
      return p.scatter;
    }
    function assign() {
      var S = layout.S, cell = S / 4, used = {};
      pieces.forEach(function (p, k) {
        var r = R[k], side = p.j < 2 ? -1 : 1;
        var pool = layout.slots.filter(function (s, n) { return s.side === side && !used[n]; });
        var pick = pool[Math.floor(r.a * pool.length) % pool.length];
        used[layout.slots.indexOf(pick)] = true;
        var scale = narrow ? 0.62 + r.d * 0.22 : 0.74 + r.d * 0.3;
        var half = cell * scale * 0.72;
        var x = pick.x + (r.b - 0.5) * pick.w * 0.45, y = pick.y + (r.c - 0.5) * pick.h * 0.4;
        var lo = Math.min(layout.inner, layout.outer) + half, hi = Math.max(layout.inner, layout.outer) - half;
        var ax = Math.abs(x);
        ax = hi > lo ? Math.min(hi, Math.max(lo, ax)) : (layout.inner + layout.outer) / 2;
        x = side * ax;
        y = Math.min(layout.bottom - half, Math.max(layout.top + half, y));
        var hx = (p.j + 0.5) * cell - S / 2, hy = (p.i + 0.5) * cell - S / 2;
        p.scatter = { x: x - hx, y: y - hy, rotation: (r.e - 0.5) * 200, scale: scale };
      });
    }

    pieces.forEach(function (p) {
      p.prog = 0;
      p.enter = { v: 0 };
      p.sx = gsap.quickSetter(p.float, 'x', 'px');
      p.sy = gsap.quickSetter(p.float, 'y', 'px');
      p.sr = gsap.quickSetter(p.float, 'rotation', 'deg');
    });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () {
        var time = this.time();
        order.forEach(function (p) { p.prog = clamp01((time - p.t0) / DUR); });
        locks.update(time);
        // Someone scrolling straight away shouldn't catch the intro half-finished.
        if (introTl && time > 0.01 && introTl.isActive() && introTl.timeScale() < 3) introTl.timeScale(3);
      },
      // No pin: a 1.5-viewport pin made the first scroll feel stuck once the hero card was static.
      scrollTrigger: {
        trigger: hero, start: 'top top', end: '+=180', pin: false, scrub: true
      }
    });

    // The intro animates inner elements; the scroll timeline only touches their parents, so the two never fight.
    tl.fromTo(CV, { light: 0 }, { light: 1, duration: 0.9 }, 0);
    if (board && n) tl.fromTo(board, { '--seam': 0.34 }, { '--seam': 0.1, duration: 0.1 }, 0.8);

    order.forEach(function (p, idx) {
      p.t0 = 0.02 + idx * (0.6 / n);
      tl.fromTo(p.el,
        { x: function () { return scatter(p).x; }, y: function () { return scatter(p).y; },
          rotation: function () { return scatter(p).rotation; }, scale: function () { return scatter(p).scale; } },
        { x: 0, y: 0, rotation: 0, scale: 1, duration: DUR, ease: 'back.out(1.5)' }, p.t0);
      locks.add(p.t0 + DUR, function () {
        locked++;
        if (pzCount) pzCount.textContent = pad(locked);
        glint(p.el); pop(p.float);
      }, function () {
        locked--;
        if (pzCount) pzCount.textContent = pad(locked);
      });
    });
    var tPortrait = n ? 0.02 + (n - 1) * (0.6 / n) + DUR : 0.88;
    if (board && n) {
      locks.add(tPortrait, function () { setMark(0, true); board.classList.add('is-done'); pulse(0.7); },
        function () { setMark(0, false); board.classList.remove('is-done'); });
      tl.fromTo('.board-slots', { opacity: 1 }, { opacity: 0, duration: 0.08 }, tPortrait - 0.04);
    } else {
      locks.add(tPortrait, function () { setMark(0, true); pulse(0.45); }, function () { setMark(0, false); });
    }

    // Role tiles slide in along their own line (never up or down into the name), then click into place.
    // They start pushed outward, outer tiles furthest, so neighbours never cross while sliding.
    roleTiles.forEach(function (t, k) {
      var r = RT[k], half = roleTiles.length / 2;
      var side = narrow ? (k % 2 ? 1 : -1) : (k < half ? -1 : 1);
      var reach = Math.abs(k + 0.5 - half);
      tl.fromTo(t,
        { x: function () { return side * (narrow ? 16 + r.a * 24 : 70 + reach * 120 + r.a * 40); },
          y: (r.b - 0.5) * (narrow ? 6 : 14), rotation: side * (4 + r.c * 8), opacity: 0.2 },
        { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.16, ease: 'back.out(1.3)' }, 0.3 + k * 0.1);
      locks.add(0.46 + k * 0.1, function () { pop(t); });
    });
    locks.add(0.76, function () { setMark(2, true); }, function () { setMark(2, false); });

    if (narrow) {
      tl.fromTo(lits, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.14, ease: 'expo.out' }, 0.78);
    } else {
      tl.fromTo(lits, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1, stagger: 0.025, ease: 'power2.inOut' }, 0.8);
    }
    locks.add(0.95, function () { setMark(1, true); pulse(0.5); }, function () { setMark(1, false); });
    tl.fromTo($('.sweep i', phoneHero || board), { xPercent: -120 }, { xPercent: 240, duration: 0.14, ease: 'power1.inOut' }, 0.84);
    tl.to({}, { duration: 0.02 }, 0.98);
    // Show the assembled hero immediately so the first scroll is not spent pinning an assembly.
    // The short unpinned ScrollTrigger on this timeline is unused; kill it and fade the cue separately.
    if (tl.scrollTrigger) tl.scrollTrigger.kill();
    tl.progress(1);
    gsap.fromTo('.scroll-cue', { opacity: 1 }, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=180', scrub: true }
    });

    // Idle drift and mouse parallax on the floating layer; it fades out as each piece locks.
    var visible = true, t0 = performance.now();
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; });
    io.observe(stage);
    function drift() {
      if (!visible) return;
      var t = (performance.now() - t0) / 1000, m = CV.mouse || { x: 0.5, y: 0.5, on: 0 };
      var mx = m.on ? m.x - 0.5 : 0, my = m.on ? m.y - 0.5 : 0, idle = true;
      for (var k = 0; k < n; k++) {
        var p = pieces[k], r = R[k], free = 1 - p.prog, e = p.enter.v;
        if (free < 0.001 && e < 0.001) { if (!p.still) { p.sx(0); p.sy(0); p.sr(0); p.still = true; } continue; }
        p.still = false; idle = false;
        var side = p.j < 2 ? -1 : 1;
        var throwX = narrow ? 24 + r.e * 36 : 140 + r.e * 260;
        var throwR = narrow ? 10 + r.a * 16 : 40 + r.a * 80;
        var throwY = narrow ? 22 : 50;
        p.sx((Math.sin(t * (0.32 + r.a * 0.3) + r.b * 6.3) * 8 + mx * (16 + r.c * 44)) * free + side * throwX * e);
        p.sy((Math.cos(t * (0.28 + r.b * 0.3) + r.c * 6.3) * 6 + my * (8 + r.d * 16)) * free + (r.f - 0.5) * throwY * e);
        p.sr(Math.sin(t * (0.22 + r.d * 0.2) + r.a * 6.3) * 5 * free + side * throwR * e);
      }
      return idle;
    }
    gsap.ticker.add(drift);

    // Phones: give the profile card presence. A slow levitation plus a scroll parallax that lifts
    // and settles it as the hero leaves, so the first screen is never a dead frame. Transform-only
    // (y / rotation / scale) on one element, so it stays smooth on touch. Narrow only: desktop is
    // untouched.
    if (narrow) {
      var card = phoneHero || board;
      if (card) {
        var cardY = gsap.quickSetter(card, 'y', 'px');
        var cardR = gsap.quickSetter(card, 'rotation', 'deg');
        var cardS = gsap.quickSetter(card, 'scale');
        var par = { p: 0 };
        var parST = ST.create({
          trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
          onUpdate: function (self) { par.p = self.progress; }
        });
        var cardVisible = true, cardIO = new IntersectionObserver(function (es) { cardVisible = es[0].isIntersecting; });
        cardIO.observe(hero);
        var cardT0 = performance.now();
        function levitate() {
          if (!cardVisible) return;
          var t = (performance.now() - cardT0) / 1000;
          cardY(Math.sin(t * 0.85) * 5 - par.p * 30);
          cardR(Math.sin(t * 0.65 + 1.1) * 0.5);
          cardS(1 - par.p * 0.07);
        }
        gsap.ticker.add(levitate);
        cleanups.push(function () {
          gsap.ticker.remove(levitate); cardIO.disconnect();
          if (parST) parST.kill();
          gsap.set(card, { clearProps: 'transform' });
        });
      }
    }

    cleanups.push(function () {
      gsap.ticker.remove(drift);
      io.disconnect();
      pieces.forEach(function (p) { gsap.set(p.float, { clearProps: 'transform,opacity' }); p.prog = 1; p.still = false; });
      if (board) board.classList.remove('is-done');
      if (pzCount && n) pzCount.textContent = pad(n);
    });
    return { pieces: pieces };
  }

  function intro(hero, narrow) {
    var tl = gsap.timeline({ delay: 0.05, defaults: { ease: 'expo.out' } });
    var offs = [-26, 18, -10, 22, -14, 27, -17, 12, -24];
    tl.from('.header-inner', { y: -14, opacity: 0, duration: 1.2 }, 0.15);
    if (narrow) {
      // Cinematic mobile name: each word rises and de-blurs into place — never clipped, and fully
      // visible the moment it settles.
      tl.fromTo('.hero-name .nm-lit',
        { opacity: 0, yPercent: 62, filter: 'blur(10px)' },
        { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.13, ease: 'expo.out' }, 0.08);
      // Profile card is a media container: it pushes in from depth — a scale-up the cards never do.
      // Targets .phone-shell, not .phone-hero (which the levitation ticker owns), and stays
      // transform+opacity only: a blur on an element this large would cost real frames.
      var shell = $('.phone-shell', phoneHero) || (board && $('.board-img', board));
      if (shell) tl.fromTo(shell,
        { scale: MOTION.media.scale, y: MOTION.media.lift, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 1.15, ease: MOTION.media.ease }, 0.14);
    } else {
      tl.from('.nm-slice', { xPercent: function (i) { return offs[i % offs.length]; }, opacity: 0, duration: 1.9, stagger: 0.04 }, 0.1);
    }
    if (hero && hero.pieces.length) {
      var floats = hero.pieces.map(function (p) { return p.float; });
      var enters = hero.pieces.map(function (p) { p.enter.v = 1; return p.enter; });
      tl.from(floats, { opacity: 0, scale: 0.4, duration: 1.6, stagger: { each: 0.03, from: 'random' } }, 0.3);
      tl.to(enters, { v: 0, duration: 2.1, stagger: { each: 0.03, from: 'random' } }, 0.3);
    }
    tl.from('.board-slots path', { opacity: 0, duration: 1.2, ease: 'power2.out', stagger: { each: 0.03, from: 'random' } }, 0.9);
    tl.from(['.hero-meta--left', '.hero-connect'], { opacity: 0, y: 14, duration: 1.3, stagger: 0.12 }, 0.95);
    tl.from('.role', { opacity: 0, duration: 1.4, ease: 'power2.out' }, 1.05);
    tl.from('.cue-in', { opacity: 0, y: 10, duration: 1.2 }, 1.5);
    if (narrow) {
      // A single light sweep across the profile card on arrival (desktop keeps its own sweep beat).
      var hsweep = $('.sweep i', phoneHero || board);
      if (hsweep) tl.fromTo(hsweep, { xPercent: -120, opacity: 1 }, { xPercent: 240, duration: 0.75, ease: 'power2.inOut' }, 1);
    }
    return tl;
  }

  function buildStatement() {
    var words = $$('.statement .w');
    if (!words.length) return;
    gsap.timeline({ scrollTrigger: { trigger: '.statement', start: 'top 82%', end: 'bottom 52%', scrub: 0.6 } })
      .fromTo(words, { color: '#6b6b6b' }, { color: '#f2f2f2', duration: 0.12, stagger: 0.88 / words.length, ease: 'none' }, 0);
  }

  function buildExperience(narrow, tall) {
    var sec = $('.xp'), cards = $$('.xp-card'), spine = $('.spine i'), roll = $('.xp-year-roll');
    var dots = cards.map(function (c) { return $('.xp-dot', c); });
    var R = randoms(cards.length, 41);
    gsap.set(dots, { scale: 0 });
    function lockCard(k) {
      glint(cards[k]);
      gsap.to(dots[k], { scale: 1, duration: 0.7, ease: 'back.out(3)', overwrite: true });
      if (roll) gsap.to(roll, { yPercent: -100 / cards.length * k, duration: 0.9, ease: 'expo.out', overwrite: true });
      var chips = $$('.client-chip', cards[k]);
      if (chips.length) {
        gsap.fromTo(chips,
          { y: 18, scale: 0.82, opacity: 0, filter: 'blur(6px)' },
          { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.55, stagger: 0.09, ease: 'back.out(1.6)', overwrite: true,
            onComplete: function () { gsap.to(chips, { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06),0 0 0px rgba(255,255,255,0)', duration: 0.6, repeat: 1, yoyo: true, stagger: 0.06 }); }
          });
      }
      if (k === cards.length - 1) { setMark(3, true); pulse(0.5); }
    }
    function unlockCard(k) {
      gsap.to(dots[k], { scale: 0, duration: 0.3, overwrite: true });
      if (roll) gsap.to(roll, { yPercent: -100 / cards.length * Math.max(0, k - 1), duration: 0.9, ease: 'expo.out', overwrite: true });
      if (k === cards.length - 1) setMark(3, false);
    }
    function from(k, mobile) {
      var r = R[k];
      return mobile
        ? mobileCardFrom(k, r)
        : { xPercent: 55 + r.a * 25, yPercent: 20 + r.b * 30, rotation: 6 + r.c * 8, rotationY: -38, opacity: 0 };
    }
    function to(extra) {
      return Object.assign({ x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1, ease: 'back.out(1.15)' }, extra);
    }
    // Mobile tilts hinge about the centre; the pinned desktop reveal needs its left-edge origin.
    gsap.set(cards, { transformPerspective: 1400, transformOrigin: narrow ? '50% 50%' : '0% 50%' });

    if (!narrow && tall) {
      var locks = Locks();
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: function () { locks.update(this.time()); },
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(innerHeight * 1.5); }, pin: true, scrub: 0.9, anticipatePin: 1, invalidateOnRefresh: true }
      });
      tl.fromTo(spine, { scaleY: 0 }, { scaleY: 1, duration: 0.9 }, 0.04);
      cards.forEach(function (c, k) {
        var t0 = 0.04 + k * 0.21;
        tl.fromTo(c, from(k, false), to({ duration: 0.2 }), t0);
        locks.add(t0 + 0.2, function () { lockCard(k); }, function () { unlockCard(k); });
      });
      tl.to({}, { duration: 0.04 }, 0.96);
    } else {
      gsap.fromTo(spine, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.chain', start: 'top 75%', end: 'bottom 60%', scrub: 0.6 } });
      cards.forEach(function (c, k) {
        var r = R[k], l = Locks();
        gsap.fromTo(c, from(k, true), to({
          duration: MOTION.card.dur * (0.9 + r.d * 0.25),
          ease: cardEase(k),
          onUpdate: function () { l.update(this.progress()); },
          scrollTrigger: { trigger: c, start: 'top 96%', end: 'top 64%', scrub: 0.6 }
        }));
        l.add(1, function () { lockCard(k); }, function () { unlockCard(k); });
      });
    }
  }

  // Polygons (in %) that tile the education card with no gaps.
  var SHARDS = [
    [[0, 0], [38, 0], [30, 48], [0, 58]], [[38, 0], [72, 0], [66, 40], [30, 48]], [[72, 0], [100, 0], [100, 46], [66, 40]],
    [[0, 58], [30, 48], [22, 100], [0, 100]], [[30, 48], [66, 40], [64, 100], [22, 100]], [[66, 40], [100, 46], [100, 100], [64, 100]]
  ];
  function buildEducation() {
    var card = $('.edu-card'), shards = $$('.shards i', card), surface = $('.card-surface', card);
    if (!card) return;
    var R = randoms(shards.length, 51);
    shards.forEach(function (s, k) {
      var poly = SHARDS[k % SHARDS.length], cx = 0, cy = 0;
      poly.forEach(function (pt) { cx += pt[0] / poly.length; cy += pt[1] / poly.length; });
      gsap.set(s, { clipPath: 'polygon(' + poly.map(function (pt) { return pt[0] + '% ' + pt[1] + '%'; }).join(',') + ')', transformOrigin: cx + '% ' + cy + '%' });
      s.dataset.cx = cx; s.dataset.cy = cy;
    });
    var locks = Locks();
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () { locks.update(this.time()); },
      scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 34%', scrub: 0.8, invalidateOnRefresh: true }
    });
    shards.forEach(function (s, k) {
      var r = R[k], cx = +s.dataset.cx - 50, cy = +s.dataset.cy - 50;
      tl.fromTo(s,
        { xPercent: cx * (1.1 + r.a * 0.8), yPercent: cy * (1.4 + r.b) + 30, rotation: (r.c - 0.5) * 70, scale: 0.86, opacity: 0 },
        { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }, k * 0.055);
    });
    tl.fromTo(surface, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.8);
    tl.to(shards, { opacity: 0, duration: 0.06 }, 0.84);
    tl.from($$('.edu-meta > *, .edu-voice p', card), { y: 26, opacity: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out' }, 0.52);
    tl.to({}, { duration: 0.06 }, 0.94);
    locks.add(0.84, function () { cardGlint(card); pulse(0.35); });
  }

  function scrollTilt(els, cleanups) {
    els.forEach(function (el) {
      gsap.set(el, { transformPerspective: 1000 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      var z = gsap.quickTo(el, 'z', { duration: 0.5, ease: 'power2.out' });
      function reset() { rx(0); ry(0); z(0); el.style.zIndex = ''; }
      var tween = gsap.fromTo(el, { rotationX: 0, rotationY: 0, z: 0 }, {
        rotationX: 0, rotationY: 0, z: 0, ease: 'none',
        scrollTrigger: {
          trigger: el, start: 'top 88%', end: 'center 42%', scrub: 0.55, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var tilt = (self.progress - 0.5) * 2;
            ry(tilt * 7);
            rx(-tilt * 5);
            z(Math.abs(tilt) * 16);
            el.style.zIndex = Math.abs(tilt) > 0.08 ? '3' : '';
          },
          onLeave: reset, onLeaveBack: reset
        }
      });
      cleanups.push(function () { if (tween.scrollTrigger) tween.scrollTrigger.kill(); tween.kill(); reset(); gsap.set(el, { clearProps: 'transform' }); });
    });
  }

  function tilt(els, cleanups) {
    if (!mqFine.matches) return;
    els.forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      var z = gsap.quickTo(el, 'z', { duration: 0.7, ease: 'power3.out' });
      gsap.set(el, { transformPerspective: 1000 });
      function move(e) {
        var b = el.getBoundingClientRect();
        ry(((e.clientX - b.left) / b.width - 0.5) * 9);
        rx(-((e.clientY - b.top) / b.height - 0.5) * 9);
        z(24);
        el.style.zIndex = 3;
      }
      function leave() { rx(0); ry(0); z(0); el.style.zIndex = ''; }
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      cleanups.push(function () { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.style.zIndex = ''; });
    });
  }

  function buildSkills(narrow, cleanups) {
    var grid = $('.skills-grid'), cells = $$('.skill');
    if (!grid) return;
    var R = randoms(cells.length, 61), done = 0;
    function lockOne(c) { glint(c); if (++done === cells.length) { setMark(4, true); pulse(0.5); } }
    function unlockOne() { if (done-- === cells.length) setMark(4, false); }
    if (narrow) {
      gsap.set(cells, { transformPerspective: 1000, transformOrigin: '50% 55%' });
      cells.forEach(function (c, k) {
        var r = R[k], l = Locks();
        gsap.fromTo(c, mobileCardFrom(k, r),
          { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: MOTION.card.dur * (0.9 + r.c * 0.22), ease: cardEase(k),
            onUpdate: function () { l.update(this.progress()); },
            scrollTrigger: { trigger: c, start: 'top 98%', end: 'top 66%', scrub: 0.6, invalidateOnRefresh: true } });
        l.add(1, function () { lockOne(c); }, unlockOne);
      });
      var sweepN = $('.skills .sweep i');
      if (sweepN) {
        gsap.fromTo(sweepN, { xPercent: -120 }, {
          xPercent: 340, ease: 'none',
          scrollTrigger: { trigger: grid, start: 'top 52%', end: 'top 18%', scrub: 0.7, invalidateOnRefresh: true }
        });
      }
      scrollTilt(cells, cleanups);
      return;
    }
    var locks = Locks();
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () { locks.update(this.time()); },
      scrollTrigger: { trigger: grid, start: 'top 96%', end: 'top 26%', scrub: 0.9, invalidateOnRefresh: true }
    });
    var order = cells.map(function (c, k) { return k; }).sort(function (a, b) { return R[a].e - R[b].e; });
    order.forEach(function (k, idx) {
      var c = cells[k], r = R[k], t0 = idx * 0.075;
      tl.fromTo(c,
        { x: function () { return (c.offsetLeft + c.offsetWidth / 2 - grid.offsetWidth / 2) * (0.5 + r.a * 0.5) + (r.b - 0.5) * 120; },
          y: function () { return (c.offsetTop + c.offsetHeight / 2 - grid.offsetHeight / 2) * (0.6 + r.c) + 160 + r.d * 200; },
          rotation: (r.e - 0.5) * 70, scale: 0.84 + r.f * 0.1, opacity: 0 },
        { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.35)' }, t0);
      locks.add(t0 + 0.4, function () { lockOne(c); }, unlockOne);
    });
    tl.fromTo($('.skills .sweep i'), { xPercent: -120 }, { xPercent: 340, duration: 0.2, ease: 'power1.inOut' }, 0.92);
    tilt(cells, cleanups);
  }

  function buildCerts(narrow) {
    var cards = $$('.cert');
    if (!cards.length) return;
    var R = randoms(cards.length, 71), done = 0;
    gsap.set(cards, { transformPerspective: 1300, transformOrigin: '50% 0%' });
    cards.forEach(function (c, k) {
      var r = R[k], l = Locks();
      // Mobile: the flip hinges and leans a different way on each card (direction cycles),
      // and the depth (z) is jittered, so a wall of certificates never reads as one animation.
      var start = narrow
        ? { rotationX: -58 - r.a * 26, rotationZ: (k % 2 ? 1 : -1) * (5 + r.b * 10), y: 78 + r.c * 46, z: -150 - r.d * 90, opacity: 0 }
        : { rotationX: -70 - r.a * 20, rotationZ: (r.b - 0.5) * 16, y: 90, z: -160, opacity: 0 };
      gsap.fromTo(c, start,
        { rotationX: 0, rotationZ: 0, y: 0, z: 0, opacity: 1, duration: 1,
          ease: narrow ? cardEase(k) : 'back.out(1.25)',
          onUpdate: function () { l.update(this.progress()); },
          scrollTrigger: { trigger: c, start: narrow ? 'top 98%' : 'top 96%', end: narrow ? 'top 68%' : 'top 58%', scrub: 0.7 } });
      l.add(1, function () {
        cardGlint(c);
        if (++done === cards.length) { setMark(5, true); pulse(0.5); }
      }, function () { if (done-- === cards.length) setMark(5, false); });
    });
  }

  function buildFinale(narrow, tall) {
    var boardEl = $('.fin-board'), pcs = $$('.fin-piece'), tail = $$('.fin-lede, .fin-cta');
    if (!boardEl) return;
    var R = randoms(pcs.length, 81);
    function from(c, k) {
      var r = R[k];
      return {
        x: function () { return (c.offsetLeft + c.offsetWidth / 2 - boardEl.offsetWidth / 2) * (0.9 + r.a * 0.8) + (r.b - 0.5) * 80; },
        y: function () { return (c.offsetTop + c.offsetHeight / 2 - boardEl.offsetHeight / 2) * (1 + r.c) + (r.d - 0.5) * 120; },
        rotation: (r.e - 0.5) * 50, scale: 1.25 + r.f * 0.35, opacity: 0
      };
    }
    if (!narrow && tall) {
      // Only the heading and the board are pinned (centred), so the board always fits the screen.
      var locks = Locks();
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: function () { locks.update(this.time()); },
        scrollTrigger: { trigger: '.fin-stage', start: 'center center', end: function () { return '+=' + Math.round(innerHeight * 1.2); }, pin: true, scrub: 0.9, anticipatePin: 1, invalidateOnRefresh: true }
      });
      pcs.forEach(function (c, k) {
        var t0 = 0.02 + k * 0.11;
        tl.fromTo(c, from(c, k), { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.25)' }, t0);
        locks.add(t0 + 0.32, function () { glint(c); });
      });
      tl.fromTo($('.fin-board .sweep i'), { xPercent: -120 }, { xPercent: 340, duration: 0.16, ease: 'power1.inOut' }, 0.86);
      locks.add(0.88, function () { pulse(1); });
      tl.to({}, { duration: 0.04 }, 0.96);
    } else {
      gsap.set(pcs, { transformPerspective: 1200, transformOrigin: '50% 50%' });
      pcs.forEach(function (c, k) {
        var r = R[k], l = Locks();
        gsap.fromTo(c, mobileCardFrom(k, r),
          { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: MOTION.card.dur * (0.9 + r.c * 0.2), ease: cardEase(k), onUpdate: function () { l.update(this.progress()); },
            scrollTrigger: { trigger: c, start: 'top 98%', end: 'top 64%', scrub: 0.6, invalidateOnRefresh: true } });
        l.add(1, function () { glint(c); });
      });
      // The portrait is a *media* container, so it gets its own gesture: it pushes in from
      // depth (scale) while its piece arrives from the side — layered parallax, not one move.
      var pimg = $('.fin-portrait img');
      if (pimg) {
        gsap.fromTo(pimg, { scale: MOTION.media.scale, y: MOTION.media.lift, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: '.fin-portrait', start: 'top 98%', end: 'top 72%', scrub: 0.6, invalidateOnRefresh: true } });
      }
      var finSweep = $('.fin-board .sweep i');
      if (finSweep) {
        gsap.fromTo(finSweep, { xPercent: -120 }, {
          xPercent: 340, ease: 'none',
          scrollTrigger: { trigger: boardEl, start: 'top 58%', end: 'top 22%', scrub: 0.7, invalidateOnRefresh: true }
        });
      }
    }
    gsap.from(tail, { y: 24, opacity: 0, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: '.fin-lede', start: 'top 98%', end: 'top 74%', scrub: 0.6 } });
  }

  // Phones: every section heading rises and de-blurs into focus as it arrives, so the long scroll
  // (certifications alone is several screens) keeps a rhythm. Narrow only — desktop headings are
  // untouched and stay static.
  // Two different text gestures: the small .label wipes in left-to-right (reads like a rule being
  // drawn — a section divider), while the big heading lifts and de-focuses. Blur is used only here,
  // on one-shot entrances, never on scrubbed tweens.
  function buildHeads(narrow) {
    if (!narrow) return;
    $$('.intro .label, .xp-head .label, .edu-meta .label, .sec-head .label').forEach(function (h, i) {
      gsap.fromTo(h,
        { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.35 },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.6, delay: (i % 3) * 0.05, ease: 'power3.inOut',
          scrollTrigger: { trigger: h, start: 'top 92%', once: true, invalidateOnRefresh: true } });
    });
    $$('.xp-head .h2, .sec-head .h2, .edu-school, .certs-group-head h3').forEach(function (h, i) {
      var blur = MOTION.text.blur * (0.8 + (i % 3) * 0.2);
      gsap.fromTo(h,
        { opacity: 0, y: MOTION.text.lift, filter: 'blur(' + blur.toFixed(1) + 'px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: MOTION.text.dur, ease: MOTION.text.ease,
          scrollTrigger: { trigger: h, start: 'top 90%', once: true, invalidateOnRefresh: true } });
    });
  }

  /* ---------- 3b. Scroll-triggered container slide-in system ----------
     A reusable, configurable entrance for containers that DON'T already carry
     a complex scrubbed animation. Only transform (x/y/scale) + opacity are
     animated, so the compositor keeps everything on the GPU (60fps, no
     layout/paint). Every tween + ScrollTrigger is created inside the
     gsap.matchMedia() context, which means mm.revert() (motion off or
     prefers-reduced-motion) tears it all down and leaves the static layout
     untouched — that is the graceful fallback. */

  /**
   * @param {string|Element[]} targets
   * @param {object} [o]
   * @param {'up'|'down'|'left'|'right'|'diagonal'} [o.direction='up']
   * @param {number} [o.distance=48]        travel in px
   * @param {number} [o.duration=0.9]       seconds
   * @param {string} [o.ease='power3.out']  GSAP easing curve
   * @param {number|object} [o.stagger=0]   child stagger (seconds or GSAP object)
   * @param {string} [o.start='top 88%']    ScrollTrigger start
   * @param {boolean} [o.once=true]         play once then leave in place
   * @param {string|Element} [o.trigger]    ScrollTrigger trigger (auto: itself / shared parent)
   * @param {number} [o.parallax=0]         subtle scrubbed y-drift (px) on the trigger for depth
   * @param {number} [o.scale=0]            start scale (e.g. 0.97); 0 disables
   * @param {boolean} [o.opacity=true]      fade from 0
   * @param {number} [o.delay=0]            seconds before the tween starts
   * @param {number} [o.blur=0]             px of de-focus at the start (one-shot entrances only)
   * @param {number} [o.rotation=0]         start rotation in deg (needs a perspective on the element)
   * @param {string} [o.transformOrigin]    origin for scale/rotation
   */
  function slideIn(targets, o) {
    o = o || {};
    var els = typeof targets === 'string' ? $$(targets)
              : (targets && targets.length != null ? Array.prototype.slice.call(targets) : [targets]);
    if (!els.length) return;

    var dir = o.direction || 'up', dist = o.distance != null ? o.distance : 48;
    var duration = o.duration != null ? o.duration : 0.9;
    var ease = o.ease || 'power3.out';
    var start = o.start || 'top 88%';
    var once = o.once !== false;
    var fade = o.opacity !== false;
    var scale = o.scale || 0;
    var delay = o.delay || 0;
    var blur = o.blur || 0;
    var rotation = o.rotation || 0;

    var from = {};
    if (fade) from.opacity = 0;
    if (scale) from.scale = scale;
    if (blur) from.filter = 'blur(' + blur + 'px)';
    if (rotation) from.rotation = rotation;
    if (o.transformOrigin) from.transformOrigin = o.transformOrigin;
    switch (dir) {
      case 'up':       from.y =  dist; break;
      case 'down':     from.y = -dist; break;
      case 'left':     from.x =  dist; break;
      case 'right':    from.x = -dist; break;
      case 'diagonal': from.x =  dist * 0.7; from.y = dist * 0.7; break;
    }

    var to = { opacity: 1, ease: ease, duration: duration, delay: delay, force3D: true };
    if (from.x != null) to.x = 0;
    if (from.y != null) to.y = 0;
    if (scale) to.scale = 1;
    if (blur) to.filter = 'blur(0px)';
    if (rotation) to.rotation = 0;
    if (o.stagger) to.stagger = o.stagger;

    var trigger = o.trigger;
    if (typeof trigger === 'string') trigger = $(trigger);
    if (!trigger) {
      if (els.length === 1) {
        trigger = els[0];
      } else {
        var sameParent = els.every(function (e) { return e.parentElement === els[0].parentElement; });
        trigger = sameParent ? els[0].parentElement : els[0];
      }
    }
    to.scrollTrigger = { trigger: trigger, start: start, once: once, invalidateOnRefresh: true };

    gsap.fromTo(els, from, to);

    // Subtle parallax layer: the container drifts slightly against scroll as
    // it passes through the viewport, giving the slide-in a sense of depth
    // without ever touching layout (transform-only, scrubbed).
    if (o.parallax) {
      var px = typeof o.parallax === 'number' ? o.parallax : 24;
      gsap.to(trigger, {
        y: px, ease: 'none',
        scrollTrigger: { trigger: trigger, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
    }
  }

  function buildSlideIns(narrow) {
    var dh = narrow ? 24 : 42;   // heading distance (smaller on mobile — buildHeads adds inner motion)
    var dc = narrow ? 34 : 48;   // card distance

    // 1. Intro — gentle rise after the hero assembles.
    slideIn('.intro', { direction: 'up', distance: narrow ? 22 : 34, duration: 1, ease: 'power2.out', start: 'top 92%' });

    // 2. Experience heading block. On mobile buildHeads de-blurs the inner
    //    title; the container rise layers beneath it for depth.
    slideIn('.xp-head', { direction: 'up', distance: dh, duration: 0.95, ease: 'power3.out', start: 'top 90%' });

    // 3. Skills + Certifications headings (two independent blocks).
    $$('.sec-head').forEach(function (h) {
      slideIn(h, { direction: 'up', distance: dh, duration: 0.9, ease: 'power3.out', start: 'top 90%' });
    });

    // 4. Extra education cards. Phones: each card swings in from the opposite side to the one
    //    before it (never a mirrored row), with a hair of rotation; the list drifts against
    //    scroll for depth. Desktop keeps the calmer staggered cascade.
    if (narrow) {
      gsap.set($$('.edu-more--card'), { transformPerspective: 900 });
      $$('.edu-more--card').forEach(function (card, i) {
        slideIn(card, { direction: i % 2 ? 'left' : 'right', distance: 30, duration: 0.85,
                        ease: 'power3.out', rotation: (i % 2 ? 1 : -1) * 1.5,
                        transformOrigin: i % 2 ? '0% 50%' : '100% 50%', start: 'top 90%' });
      });
      var moreList = $('.edu-more');
      if (moreList) gsap.to(moreList, {
        y: 12, ease: 'none',
        scrollTrigger: { trigger: moreList, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
    } else {
      slideIn('.edu-more--card', {
        direction: 'up', distance: dc, duration: 0.85, ease: 'power3.out',
        stagger: 0.12, trigger: '.edu-more', start: 'top 90%', parallax: 22
      });
    }

    // 5. Highlighted skills strip — quick cascade.
    slideIn('.skills-strip li', {
      direction: 'up', distance: narrow ? 18 : 26, duration: 0.55, ease: 'power2.out',
      stagger: 0.04, trigger: '.skills-strip', start: 'top 86%', parallax: narrow ? 8 : 14
    });

    // 6. Certification group headers — staggered (each in its own group).
    $$('.certs-group-head').forEach(function (g, i) {
      slideIn(g, { direction: 'up', distance: narrow ? 22 : 32, duration: 0.7, ease: 'power3.out',
                   delay: i * 0.06, start: 'top 90%' });
    });

    // 7. Footer — final rise.
    slideIn('.site-footer', { direction: 'up', distance: narrow ? 28 : 42, duration: 1, ease: 'power3.out', start: 'top 96%' });
  }

  /* ---------- 4. Switching motion on and off ---------- */

  var mm = null, introTl = null;
  // Keep the visitor looking at the same content when pins are added or removed.
  function keepPlace(fn) {
    var probe = d.elementFromPoint(innerWidth / 2, innerHeight / 2);
    var sec = probe && probe.closest('section, footer');
    var before = sec ? sec.getBoundingClientRect().top : 0;
    fn();
    ST.refresh();
    if (sec) {
      var delta = sec.getBoundingClientRect().top - before;
      if (Math.abs(delta) > 2) {
        if (lenis) lenis.scrollTo(scrollY + delta, { immediate: true, force: true }); else scrollTo(0, scrollY + delta);
      }
    }
  }

  function enable(first) {
    if (mm) return;
    html.classList.add('cv-live');
    marks.forEach(function (m) { m.classList.remove('on'); });
    if (markCount) markCount.textContent = '0';
    if (pzCount) pzCount.textContent = '00';
    lenisOn();
    glOn();
    mm = gsap.matchMedia();
    // matchMedia only runs this when at least one query matches, hence `any`. Height only matters
    // on wide screens, so a phone's collapsing address bar never tears the timelines down.
    mm.add({ wide: '(min-width: 960px)', tall: '(min-width: 960px) and (min-height: 760px)', any: 'all' }, function (ctx) {
      var narrow = !ctx.conditions.wide, tall = ctx.conditions.tall, cleanups = [];
      var hero = buildHero(narrow, cleanups);
      buildStatement();
      buildExperience(narrow, tall);
      buildEducation();
      buildSkills(narrow, cleanups);
      buildCerts(narrow);
      buildHeads(narrow);
      buildSlideIns(narrow);
      buildFinale(narrow, tall);
      if (first && scrollY < innerHeight * 0.4) introTl = intro(hero, narrow);
      first = false;
      return function () {
        cleanups.forEach(function (f) { f(); });
        gsap.killTweensOf($$('.pz-glint, .card-glint i'));
        gsap.set($$('.pz-glint, .card-glint i'), { clearProps: 'all' });
      };
    });
  }

  function disable() {
    if (!mm) return;
    if (introTl) { introTl.kill(); introTl = null; }
    mm.revert();
    mm = null;
    lenisOff();
    glOff();
    marks.forEach(function (m) { m.classList.add('on'); });
    if (pzCount) pzCount.textContent = board && portrait && portrait.pieces.length ? pad(portrait.pieces.length) : '16';
    CV.light = 0;
  }

  // If the head script's failsafe already fell back to static (very slow load), respect that.
  if (CV.motion && !html.classList.contains('motion') && CV.setMotion) CV.setMotion(false, false);

  d.addEventListener('cv:motion', function (e) {
    keepPlace(function () { if (e.detail.on) enable(false); else disable(); });
  });

  html.classList.add('cv-live');
  if (CV.motion) enable(true);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { if (mm) ST.refresh(); });
  CV.ready = true;
})();
