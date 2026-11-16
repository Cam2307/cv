(function () {
  'use strict';
  var CV = window.CV = window.CV || {};
  if (CV.bg) return;
  var d = document;
  var canvas = d.querySelector('.bg-fx-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var running = false, raf = 0, W = 0, H = 0, dpr = 1;
  var pts = [];
  var lastNow = 0;

  var layers = [
    { el: d.querySelector('.bg-fx-grid'), depth: 0.15 },
    { el: d.querySelector('.bg-fx-beam'), depth: 0.2 },
    { el: canvas, depth: 0.3 },
    { el: d.querySelector('.bg-fx-dots'), depth: 0.5 },
    { el: d.querySelector('.bg-fx-dots--near'), depth: 0.8 },
    { el: d.querySelector('.bg-fx-shape--a'), depth: 0.4 },
    { el: d.querySelector('.bg-fx-shape--b'), depth: 0.6 }
  ].filter(function (l) { return l.el; });

  function resize() {
    W = canvas.offsetWidth || innerWidth;
    H = canvas.offsetHeight || innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    var targetCount = Math.floor((innerWidth * innerHeight) / 18000);
    targetCount = Math.max(20, Math.min(80, targetCount));
    if (pts.length < targetCount) {
      for (var i = pts.length; i < targetCount; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          a: Math.random() * 0.5 + 0.1
        });
      }
    } else if (pts.length > targetCount) {
      pts.length = targetCount;
    }
  }

  var scrollY = 0, targetScrollY = 0;
  var mx = 0, my = 0, targetMx = 0, targetMy = 0;

  function onScroll() { targetScrollY = window.scrollY; }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function draw(now) {
    var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016;
    lastNow = now;

    // Particles
    ctx.clearRect(0, 0, W, H);
    var maxDist = 120;
    ctx.lineWidth = 1;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      
      ctx.fillStyle = 'rgba(255, 255, 255, ' + p.a * 0.3 + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      ctx.fill();

      for (var j = i + 1; j < pts.length; j++) {
        var p2 = pts[j];
        var dx = p.x - p2.x, dy = p.y - p2.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + ((1 - dist / maxDist) * 0.12) + ')';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Parallax
    var m = CV.mouse || { x: 0.5, y: 0.5, on: 0 };
    if (m.on) { targetMx = (m.x - 0.5) * innerWidth; targetMy = (m.y - 0.5) * innerHeight; }
    mx += (targetMx - mx) * Math.min(1, dt * 5);
    my += (targetMy - my) * Math.min(1, dt * 5);
    scrollY += (targetScrollY - scrollY) * Math.min(1, dt * 8);

    var cx = innerWidth * 0.12; // max travel x
    var cy = innerHeight * 0.12; // max travel y
    
    for (var k = 0; k < layers.length; k++) {
      var l = layers[k];
      var tx = -(mx * l.depth);
      var ty = -((my + scrollY) * l.depth);
      // clamp
      if (tx > cx) tx = cx; else if (tx < -cx) tx = -cx;
      if (ty > cy) ty = cy; else if (ty < -cy) ty = -cy;
      l.el.style.translate = tx.toFixed(2) + 'px ' + ty.toFixed(2) + 'px';
    }
  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastNow = performance.now();
    resize();
    window.addEventListener('resize', resize, { passive: true });
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener('resize', resize);
    for (var k = 0; k < layers.length; k++) layers[k].el.style.translate = '0px 0px';
  }

  CV.bg = { start: start, stop: stop };
})();