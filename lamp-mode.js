/*! lamp-mode — a pull-cord dark mode toggle. No dependencies. MIT.
 *
 *   LampMode.init({ position: 'right', color: 'currentColor' })
 *
 * One monochrome icon (color: --lm-color, else inherited from the page): a loose string
 * with a knob, simulated as a verlet rope so it whips, sways and settles like
 * the real thing. Its length is the state: short = light, pulled down = dark.
 * Mash it (clicks under 600ms apart) and it gets thrown around harder.
 * Sets data-theme="light|dark" on <html>; remembers the choice in localStorage
 * and defaults to prefers-color-scheme.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LampMode = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var KEY = 'lamp-mode-theme';
  var LEN = { light: 72, dark: 84 };   // hanging length of the string, px
  var N = 14;                          // rope points; 0 is pinned above the page
  var TOP = -20, X0 = 12;              // anchor
  var GRAVITY = 0.35, DAMP = 0.965;     // per frame
  var CSS = [
    '.lm{position:fixed;top:0;z-index:9999;width:24px;height:130px;padding:0;border:0;',
    '  background:none;cursor:pointer;color:var(--lm-color);overflow:visible;touch-action:manipulation;',
    '  -webkit-tap-highlight-color:transparent}',
    '.lm-right{right:24px;right:calc(24px + env(safe-area-inset-right,0px))}',
    '.lm-left{left:24px;left:calc(24px + env(safe-area-inset-left,0px))}',
    '.lm svg{display:block;overflow:visible;pointer-events:none}'
  ].join('');

  var SVG = '<svg width="24" height="130" viewBox="0 0 24 130" aria-hidden="true">' +
    '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<circle r="6" fill="currentColor"/></svg>';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function rnd(n) { return (Math.random() * 2 - 1) * n; }

  function init(opts) {
    if (typeof document === 'undefined') return null; // SSR: no-op
    opts = opts || {};
    var side = opts.position === 'left' ? 'left' : 'right';
    var theme = stored() ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var el = document.createElement('button');
    el.className = 'lm lm-' + side;
    el.type = 'button';
    el.setAttribute('role', 'switch');
    el.setAttribute('aria-label', 'Dark mode');
    el.innerHTML = SVG;
    if (opts.color) el.style.setProperty('--lm-color', opts.color);
    document.body.appendChild(el);
    var path = el.querySelector('path'), knob = el.querySelector('circle');

    // Rope state. `len` eases toward the state's length; the rope is inextensible
    // but goes slack when shortened, so a pull yanks the tip and it ripples out.
    var len = LEN[theme];
    var pts = [];
    for (var i = 0; i < N; i++) {
      var y = TOP + (len * i) / (N - 1);
      pts.push({ x: X0, y: y, px: X0, py: y, w: i === N - 1 ? 0.5 : 1 }); // heavy knob
    }
    var raf = 0, lastT = 0;

    function draw() {
      var d = 'M' + pts[0].x + ' ' + pts[0].y;
      for (var i = 1; i < N - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        d += 'Q' + a.x + ' ' + a.y + ' ' + (a.x + b.x) / 2 + ' ' + (a.y + b.y) / 2;
      }
      var e = pts[N - 1];
      path.setAttribute('d', d + 'L' + e.x + ' ' + e.y);
      knob.setAttribute('cx', e.x);
      knob.setAttribute('cy', e.y);
    }

    var calm = false, dev = 0, kickT = 0;

    function step() {
      // length spring
      len += (LEN[theme] - len) * 0.08;
      // Guarantee it ends vertical: once calm, and increasingly the longer it
      // has been since the last tug, ease every point back under the anchor.
      var late = Math.min(1, Math.max(0, (performance.now() - kickT - 1200) / 1500));
      var pullK = Math.max(calm ? 0.06 : 0, late * 0.15);
      var seg = len / (N - 1), energy = Math.abs(len - LEN[theme]);

      for (var i = 1; i < N; i++) {
        var p = pts[i], vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + GRAVITY;
        if (pullK) { p.x += (X0 - p.x) * pullK; p.px += (X0 - p.px) * pullK; } // ease upright
        energy += Math.abs(vx) + Math.abs(vy);
      }
      for (var it = 0; it < 16; it++) {
        pts[0].x = X0; pts[0].y = TOP;
        for (var j = 0; j < N - 1; j++) {
          var a = pts[j], b = pts[j + 1];
          var dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          if (dist <= seg) continue; // a string goes slack, it never pushes
          var c = (dist - seg) / dist;
          var wa = j === 0 ? 0 : a.w, wb = b.w, ws = wa + wb;
          a.x += dx * c * wa / ws; a.y += dy * c * wa / ws;
          b.x -= dx * c * wb / ws; b.y -= dy * c * wb / ws;
        }
      }
      dev = 0;
      for (var m = 1; m < N; m++) dev = Math.max(dev, Math.abs(pts[m].x - X0));
      calm = energy < 2;
      return energy;
    }

    function straighten() {
      len = LEN[theme];
      for (var i = 0; i < N; i++) {
        var y = TOP + (len * i) / (N - 1), p = pts[i];
        p.x = p.px = X0; p.y = p.py = y;
      }
    }

    function frame(t) {
      var n = Math.max(1, Math.min(3, Math.round((t - lastT) / 16.7)));
      lastT = t;
      var energy = 0;
      for (var k = 0; k < n; k++) energy = step();
      draw();
      raf = energy > 0.08 || dev > 0.05 ? requestAnimationFrame(frame) : 0;
      if (!raf) { straighten(); draw(); }
    }
    function wake() {
      if (reduce) {
        straighten();
        draw();
      } else if (!raf) {
        lastT = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    // A pull yanks the string down and flicks it sideways; a streak throws it harder.
    var streak = 0, last = 0;
    function kick() {
      var chaos = Math.min(Math.max(0, streak - 2), 6);
      kickT = performance.now();
      var tip = pts[N - 1];
      len = Math.min(len + 14 + chaos * 2, LEN[theme] + 28); // let out string: the pull
      tip.py = tip.y - (5 + chaos * 0.6);    // and yank the knob down
      tip.px = tip.x - rnd(1.2 + chaos * 0.8);
      for (var i = 2; i < N - 1; i += 2) pts[i].px = pts[i].x - rnd(0.3 + chaos * 0.5);
      wake();
    }

    function sync() {
      document.documentElement.setAttribute('data-theme', theme);
      el.setAttribute('aria-checked', String(theme === 'dark'));
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    }
    function toggle() {
      var now = Date.now();
      streak = now - last < 600 ? streak + 1 : 1;
      last = now;
      theme = theme === 'dark' ? 'light' : 'dark';
      sync();
      kick();
    }

    el.addEventListener('click', toggle);
    sync();
    draw();
    kick(); // load: the string gets a tug and settles
    return { toggle: toggle, el: el };
  }

  return { init: init };
});
