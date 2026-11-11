/* Jigsaw geometry: mating piece outlines as SVG path data.
   Shared by the landing page (live, responsive grids) and by the static marks in the HTML.
   No dependencies. Exposes window.Jigsaw in the browser and module.exports in Node. */
(function (root) {
  'use strict';

  /* One knob, as cubic Bézier segments relative to the knob centre, in units of the tab size.
     x runs along the edge and y points out of the piece. The profile is symmetric, so two
     pieces traversing a shared edge in opposite directions trace exactly the same curve. */
  var KNOB_IN = [-0.64, 0];
  var KNOB = [
    [-0.30, 0.00, -0.15, 0.06, -0.21, 0.23],
    [-0.27, 0.40, -0.55, 0.44, -0.51, 0.71],
    [-0.47, 0.99, -0.21, 1.07, 0.00, 1.07],
    [0.21, 1.07, 0.47, 0.99, 0.51, 0.71],
    [0.55, 0.44, 0.27, 0.40, 0.21, 0.23],
    [0.15, 0.06, 0.30, 0.00, 0.64, 0.00]
  ];

  function r2(n) { return Math.round(n * 100) / 100; }

  /* Edge from A to B. e = { dir: 1 (knob out) | -1 (socket in) | 0, s: 0..1 from A, t: px }. */
  function edge(ax, ay, bx, by, e) {
    if (!e || !e.dir) return 'L' + r2(bx) + ' ' + r2(by);
    var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len, uy = dy / len, nx = uy, ny = -ux; // outward normal for clockwise winding, y down
    var c = e.s * len, t = e.t, k = e.dir * t;
    function P(px, py) {
      var along = c + px * t, out = py * k;
      return r2(ax + ux * along + nx * out) + ' ' + r2(ay + uy * along + ny * out);
    }
    var d = 'L' + P(KNOB_IN[0], KNOB_IN[1]);
    for (var i = 0; i < KNOB.length; i++) {
      var q = KNOB[i];
      d += 'C' + P(q[0], q[1]) + ' ' + P(q[2], q[3]) + ' ' + P(q[4], q[5]);
    }
    return d + 'L' + r2(bx) + ' ' + r2(by);
  }

  function flip(e) { return e && e.dir ? { dir: e.dir, s: 1 - e.s, t: e.t } : null; }

  /* Outline of a w×h cell whose top-left corner is at (x, y).
     edges = { top, right, bottom, left }; s is measured from the left (top/bottom) or the top (left/right). */
  function piece(x, y, w, h, edges) {
    var E = edges || {};
    return 'M' + r2(x) + ' ' + r2(y) +
      edge(x, y, x + w, y, E.top) +
      edge(x + w, y, x + w, y + h, E.right) +
      edge(x + w, y + h, x, y + h, flip(E.bottom)) +
      edge(x, y + h, x, y, flip(E.left)) + 'Z';
  }

  /* Small deterministic PRNG so shapes stay identical between rebuilds and screenshots. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Mating edges for a rows×cols grid. Returns at(i, j) → { top, right, bottom, left }
     with { dir, s, k } per edge; k scales the tab size and is shared by both neighbours. */
  function grid(rows, cols, rand, opts) {
    opts = opts || {};
    var jitter = opts.jitter == null ? 0.06 : opts.jitter;
    function mk() {
      return { dir: rand() < 0.5 ? 1 : -1, s: 0.5 + (rand() * 2 - 1) * jitter, k: 0.92 + rand() * 0.16 };
    }
    var H = [], V = [], i, j;
    for (i = 0; i < rows; i++) {
      H[i] = []; V[i] = [];
      for (j = 0; j < cols; j++) {
        H[i][j] = j < cols - 1 ? mk() : null;
        V[i][j] = i < rows - 1 ? mk() : null;
      }
    }
    function inv(e) { return e ? { dir: -e.dir, s: e.s, k: e.k } : null; }
    return function at(a, b) {
      return {
        top: a > 0 ? inv(V[a - 1][b]) : null,
        right: H[a][b],
        bottom: V[a][b],
        left: b > 0 ? inv(H[a][b - 1]) : null
      };
    };
  }

  /* Turn { dir, s, k } edges into { dir, s, t } for a w×h cell. */
  function size(edges, w, h, ratio, maxT) {
    function one(e, len) {
      if (!e) return null;
      return { dir: e.dir, s: e.s, t: Math.min(maxT, ratio * len) * (e.k || 1) };
    }
    return { top: one(edges.top, w), right: one(edges.right, h), bottom: one(edges.bottom, w), left: one(edges.left, h) };
  }

  var api = { piece: piece, edge: edge, rng: rng, grid: grid, size: size };

  /* Browser-only: shape every cell of a CSS grid into mating pieces, and keep them in sync
     with layout. Each cell gets an absolutely positioned <svg class="pz-svg"> with fill,
     outline and a "glint" path (pathLength=1, used for the light that runs round a piece). */
  if (typeof document !== 'undefined') {
    var NS = 'http://www.w3.org/2000/svg';

    api.mount = function (container, opts) {
      opts = opts || {};
      var sel = opts.cells || ':scope > .pz-cell';
      // maxT may be a function, re-read on every build, so tabs can shrink with the card padding.
      var ratio = opts.ratio || 0.2, seed = opts.seed || 1;
      var cells = [], built = null, raf = 0;

      function ensureSvg(cell) {
        var svg = cell.querySelector(':scope > .pz-svg');
        if (svg) return svg;
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'pz-svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        ['pz-fill', 'pz-line', 'pz-glint'].forEach(function (c) {
          var p = document.createElementNS(NS, 'path');
          p.setAttribute('class', c);
          if (c === 'pz-glint') p.setAttribute('pathLength', '1');
          svg.appendChild(p);
        });
        cell.insertBefore(svg, cell.firstChild);
        return svg;
      }

      function build() {
        raf = 0;
        cells = Array.prototype.slice.call(container.querySelectorAll(sel));
        if (!cells.length) return;
        var boxes = cells.map(function (c) {
          return { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
        });
        var xs = [], ys = [];
        boxes.forEach(function (b) {
          if (xs.indexOf(Math.round(b.x)) < 0) xs.push(Math.round(b.x));
          if (ys.indexOf(Math.round(b.y)) < 0) ys.push(Math.round(b.y));
        });
        xs.sort(function (a, b) { return a - b; });
        ys.sort(function (a, b) { return a - b; });
        var rows = ys.length, cols = xs.length;
        var maxT = typeof opts.maxT === 'function' ? opts.maxT() : (opts.maxT || 28);
        var at = opts.edges ? opts.edges(rows, cols, boxes) : grid(rows, cols, rng(seed + rows * 31 + cols * 7), opts);
        var M = Math.ceil(maxT * 1.2) + 2;
        built = { rows: rows, cols: cols, M: M, pieces: [] };
        cells.forEach(function (cell, n) {
          var b = boxes[n], i = ys.indexOf(Math.round(b.y)), j = xs.indexOf(Math.round(b.x));
          var e = size(at(i, j), b.w, b.h, ratio, maxT);
          var d = piece(M, M, b.w, b.h, e);
          var svg = ensureSvg(cell);
          svg.setAttribute('viewBox', '0 0 ' + (b.w + 2 * M) + ' ' + (b.h + 2 * M));
          svg.style.left = svg.style.top = (-M) + 'px';
          svg.style.width = (b.w + 2 * M) + 'px';
          svg.style.height = (b.h + 2 * M) + 'px';
          Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) { p.setAttribute('d', d); });
          cell.dataset.row = i; cell.dataset.col = j;
          built.pieces.push({ el: cell, row: i, col: j, svg: svg, d: d });
        });
        if (opts.onBuild) opts.onBuild(built);
      }

      function schedule() { if (!raf) raf = requestAnimationFrame(build); }
      build();
      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(schedule);
        ro.observe(container);
        cells.forEach(function (c) { ro.observe(c); });
      } else {
        window.addEventListener('resize', schedule);
      }
      return { rebuild: build, get state() { return built; } };
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Jigsaw = api;
})(typeof window !== 'undefined' ? window : this);
