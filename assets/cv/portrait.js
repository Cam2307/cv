/* The portrait, cut into jigsaw pieces.
   PLACEHOLDER: assets/img/cameron.jpg is Cameron Reece Allcock's 200×200 LinkedIn photo, standing in
   for a high-resolution portrait. It is never shown enlarged: it is redrawn as a fine line screen at
   the screen's own resolution, so its low resolution can't show. When a hi-res photo arrives, replace
   the file and adjust CROP (and LINE_PX if you want a finer screen). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CROP = { x: 25, y: 4, size: 150 };   // head and shoulders, in source pixels
  var LINE_PX = 3.4;                        // one line of the screen every ~3.4 CSS px

  function load(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function percentile(hist, total, p) {
    var acc = 0, goal = total * p;
    for (var i = 0; i < 256; i++) { acc += hist[i]; if (acc >= goal) return i; }
    return 255;
  }

  /* Horizontal line screen: each row is a white band whose thickness follows the photo's brightness.
     Drawn at css × devicePixelRatio, so edges stay crisp at any size. Returns a canvas.
     Throws if the image can't be read (e.g. a tainted canvas under file://). */
  function halftone(img, css, opts) {
    opts = opts || {};
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var S = Math.max(96, Math.round(css * dpr));
    var lines = opts.lines || Math.max(44, Math.min(118, Math.round(css / LINE_PX)));
    var cols = lines * 4;
    var src = document.createElement('canvas');
    src.width = cols; src.height = lines;
    var sx = src.getContext('2d', { willReadFrequently: true });
    sx.imageSmoothingEnabled = true;
    sx.imageSmoothingQuality = 'high';
    sx.drawImage(img, CROP.x, CROP.y, CROP.size, CROP.size, 0, 0, cols, lines);
    var px = sx.getImageData(0, 0, cols, lines).data;
    var n = cols * lines, L = new Float32Array(n), hist = new Uint32Array(256), i;
    for (i = 0; i < n; i++) {
      var y = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
      L[i] = y; hist[y | 0]++;
    }
    var lo = percentile(hist, n, 0.02), hi = percentile(hist, n, 0.985), span = Math.max(1, hi - lo);
    var gamma = opts.gamma || 1.18;

    var out = document.createElement('canvas');
    out.width = out.height = S;
    var c = out.getContext('2d');
    c.fillStyle = opts.ink || '#ececec';
    var pitch = S / lines, maxHalf = pitch * 0.47, step = S / cols;
    for (var r = 0; r < lines; r++) {
      var yc = (r + 0.5) * pitch, hs = new Float32Array(cols), any = false;
      for (var k = 0; k < cols; k++) {
        var v = (L[r * cols + k] - lo) / span;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        v = Math.pow(v, gamma);
        var nx = (k + 0.5) / cols - 0.5, ny = (r + 0.5) / lines - 0.42;
        var vig = 1 - smooth(0.3, 0.74, Math.sqrt(nx * nx * 1.15 + ny * ny));
        v *= 0.22 + 0.78 * vig;                // let the frame edges fall away into black
        var h = v * maxHalf;
        hs[k] = h < 0.18 ? 0 : h;
        if (hs[k]) any = true;
      }
      if (!any) continue;
      c.beginPath();
      c.moveTo(0, yc - hs[0]);
      for (k = 0; k < cols; k++) c.lineTo((k + 0.5) * step, yc - hs[k]);
      c.lineTo(S, yc - hs[cols - 1]);
      c.lineTo(S, yc + hs[cols - 1]);
      for (k = cols - 1; k >= 0; k--) c.lineTo((k + 0.5) * step, yc + hs[k]);
      c.lineTo(0, yc + hs[0]);
      c.closePath();
      c.fill();
    }
    return out;
  }

  function toURL(canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b ? URL.createObjectURL(b) : canvas.toDataURL()); }, 'image/png');
      else resolve(canvas.toDataURL());
    });
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* Cut the board into n×n mating pieces. Each piece: .pz (scroll-driven transform)
     > .pz-float (idle drift) > svg [clipPath, fill, image, outline, glint]. */
  var uid = 0;
  function mountBoard(board, opts) {
    opts = opts || {};
    var n = opts.n || 4, host = board.querySelector('.board-pieces'), slots = board.querySelector('.board-slots');
    var at = Jigsaw.grid(n, n, Jigsaw.rng(opts.seed || 4), { jitter: 0.05 });
    var pieces = [], href = '', id = 'pzc' + (++uid);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var el = document.createElement('div');
        el.className = 'pz pz--photo';
        var fl = document.createElement('div');
        fl.className = 'pz-float';
        var svg = svgEl('svg', { 'class': 'pz-svg', 'aria-hidden': 'true', focusable: 'false' });
        var clip = svgEl('clipPath', { id: id + '-' + i + '-' + j });
        var cp = svgEl('path', {});
        clip.appendChild(cp);
        var defs = svgEl('defs', {});
        defs.appendChild(clip);
        var fill = svgEl('path', { 'class': 'pz-fill' });
        var image = svgEl('image', { 'clip-path': 'url(#' + id + '-' + i + '-' + j + ')', preserveAspectRatio: 'none' });
        var line = svgEl('path', { 'class': 'pz-line' });
        var glint = svgEl('path', { 'class': 'pz-glint', pathLength: '1' });
        svg.appendChild(defs); svg.appendChild(fill); svg.appendChild(image); svg.appendChild(line); svg.appendChild(glint);
        fl.appendChild(svg); el.appendChild(fl); host.appendChild(el);
        pieces.push({ el: el, float: fl, svg: svg, paths: [cp, fill, line, glint], image: image, glint: glint, line: line, i: i, j: j });
      }
    }
    var slotPaths = pieces.map(function () { var p = svgEl('path', {}); slots.appendChild(p); return p; });
    var size = 0;

    function layout() {
      var S = board.clientWidth;
      if (!S || S === size) return;
      size = S;
      var cell = S / n, maxT = cell * 0.26, M = Math.ceil(maxT * 1.2) + 2;
      slots.setAttribute('viewBox', '0 0 ' + (S + 2 * M) + ' ' + (S + 2 * M));
      slots.style.left = slots.style.top = (-M) + 'px';
      slots.style.width = slots.style.height = (S + 2 * M) + 'px';
      pieces.forEach(function (p, k) {
        var e = Jigsaw.size(at(p.i, p.j), cell, cell, 0.26, maxT);
        var dd = Jigsaw.piece(M, M, cell, cell, e);
        p.el.style.left = (p.j * cell) + 'px';
        p.el.style.top = (p.i * cell) + 'px';
        p.el.style.width = p.el.style.height = cell + 'px';
        p.svg.setAttribute('viewBox', '0 0 ' + (cell + 2 * M) + ' ' + (cell + 2 * M));
        p.svg.style.left = p.svg.style.top = (-M) + 'px';
        p.svg.style.width = p.svg.style.height = (cell + 2 * M) + 'px';
        p.paths.forEach(function (q) { q.setAttribute('d', dd); });
        p.image.setAttribute('x', M - p.j * cell);
        p.image.setAttribute('y', M - p.i * cell);
        p.image.setAttribute('width', S);
        p.image.setAttribute('height', S);
        slotPaths[k].setAttribute('d', Jigsaw.piece(M + p.j * cell, M + p.i * cell, cell, cell, e));
      });
      if (opts.onLayout) opts.onLayout(S);
    }
    function setImage(url) {
      href = url;
      pieces.forEach(function (p) { p.image.setAttribute('href', url); });
      board.classList.add('is-ready');
    }
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); }).observe(board);
    return { pieces: pieces, layout: layout, setImage: setImage, get size() { return size; }, get href() { return href; } };
  }

  window.Portrait = { load: load, halftone: halftone, toURL: toURL, mountBoard: mountBoard };
})();
