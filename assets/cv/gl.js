/* Ambient light for the landing page: one full-screen fragment shader, greyscale only.
   A slow haze under an overhead key light that brightens as the puzzle assembles (CV.light),
   a soft torch that follows the mouse, and a gentle swell when a section locks (CV.pulse).
   Rendered at reduced resolution (it is all soft light), paused when the tab is hidden or
   motion is off. Output luminance is capped so text contrast never drops below AA. */
(function () {
  'use strict';
  var CV = window.CV = window.CV || {};
  var canvas = document.querySelector('.gl');
  if (!canvas || CV.gl) return;
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl) return;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uMouseOn;uniform float uLight;uniform float uPulse;',
    'float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(h21(i),h21(i+vec2(1.,0.)),u.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*vn(p);p=m*p;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
    ' vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);float t=uTime;',
    ' vec2 q=vec2(fbm(p*1.3+vec2(0.,t*.018)),fbm(p*1.3+vec2(5.2,-t*.015)));',
    ' float haze=fbm(p*1.7+q*1.4+vec2(t*.01,0.));',
    ' vec2 d=p-vec2(0.,.86);float ang=abs(atan(d.x,-d.y));',
    ' float cone=smoothstep(.5+.16*uLight,0.,ang)*smoothstep(2.1,.2,length(d));',
    ' float rays=.62+.38*vn(vec2(ang*10.,t*.07));',
    ' float key=cone*rays*(.3+.7*haze);',
    ' vec2 m=vec2((uMouse.x-.5)*asp,uMouse.y-.5);',
    ' float torch=uMouseOn*smoothstep(.45,0.,length(p-m))*(.45+.55*haze);',
    ' float lum=.008+key*(.05+.06*uLight)+torch*.03+uPulse*.035*cone*(.4+.6*haze)+haze*.012;',
    ' lum*=1.-.6*smoothstep(.3,1.05,length(p*vec2(.82,1.3)));',
    ' lum=min(lum,.12);',
    ' lum+=(h21(gl_FragCoord.xy+fract(t*.37)*97.)-.5)*(1.6/255.);',
    ' gl_FragColor=vec4(vec3(lum),1.);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uMouse', 'uMouseOn', 'uLight', 'uPulse'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  var coarse = matchMedia('(pointer: coarse)').matches;
  var scale = coarse ? 0.34 : 0.5, W = 0, H = 0, lastW = 0;
  function resize(force) {
    var w = innerWidth, h = innerHeight;
    if (!force && w === lastW && Math.abs(h - H / scale) < 140) return;   // ignore mobile toolbar wobble
    lastW = w;
    W = Math.max(2, Math.round(w * scale)); H = Math.max(2, Math.round(h * scale));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  resize(true);

  var running = false, raf = 0, t0 = performance.now(), light = 0, pulse = 0, mx = 0.5, my = 0.5, mon = 0;
  var frames = 0, slow = 0, lastNow = 0;
  function draw(now) {
    var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    light += ((CV.light || 0) - light) * Math.min(1, dt * 3);
    if (CV.pulse) { pulse = Math.max(pulse, CV.pulse); CV.pulse = 0; }
    pulse *= Math.exp(-dt * 1.6);
    var m = CV.mouse || { x: 0.5, y: 0.5, on: 0 };
    mx += (m.x - mx) * Math.min(1, dt * 4); my += (m.y - my) * Math.min(1, dt * 4);
    mon += ((m.on ? 1 : 0) - mon) * Math.min(1, dt * 2);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, (now - t0) / 1000);
    gl.uniform2f(U.uMouse, mx, 1 - my);
    gl.uniform1f(U.uMouseOn, mon);
    gl.uniform1f(U.uLight, light);
    gl.uniform1f(U.uPulse, pulse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    raf = 0;
    if (!running) return;
    var before = lastNow;
    draw(now);
    // Adaptive quality: if frames run long, drop the render scale once.
    if (before && now - before > 26) slow++;
    if (++frames === 90 && slow > 30 && scale > 0.3) { scale *= 0.7; resize(true); }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || document.hidden) return;
    running = true; lastNow = 0;
    canvas.classList.add('is-on');
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function once() { draw(performance.now()); canvas.classList.add('is-on'); }

  var rz = 0;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { resize(false); if (!running) once(); }, 120); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (CV.motion) start(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); canvas.classList.remove('is-on'); });

  CV.gl = { start: start, stop: stop, once: once };
  if (CV.motion) start(); else once();
})();
