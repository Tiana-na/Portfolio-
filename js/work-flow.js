/* Home, projects: a small guide. The dot first underlines the key words of the intro line, then comes down the margin
   and, at each case card, runs once round the card's frame and lights it before it moves on. It never competes with the content.
   Wide screens only; a phone, a narrow window or "reduce motion" keeps the plain cards. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var list = doc.querySelector('.work-list');
  if (!list) return;
  var rows = Array.prototype.slice.call(list.querySelectorAll('.work-row'));
  if (!rows.length) return;
  var intro = doc.querySelector('.hero-lede');
  var wide = window.matchMedia('(min-width: 1100px)');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (wide.matches && !reduce) root.classList.add('wf-armed');          /* the key words wait, plain, for the dot (arms early so nothing flashes) */
  var rail, line, glow, dot, nodes = [], frames = [], ny = [], done = [], y0 = 0, yN = 0, cur = null;
  var raf = 0, moveT = 0, rtl = false, active = false, busy = false, queue = [], introState = 0, gen = 0, introDone = false, t0 = performance.now();

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function offsetTop(el, stop) { var t = 0, e = el; while (e && e !== stop) { t += e.offsetTop; e = e.offsetParent; } return t; }
  function place(x, y) { if (dot) dot.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; }
  function keys() { return intro ? Array.prototype.slice.call(intro.querySelectorAll('.hl')) : []; }
  function clearKeys() { keys().forEach(function (k) { k.classList.remove('on'); }); }

  function teardown() {
    gen++; active = false; busy = false; queue = []; cur = null; introState = 0;
    root.classList.remove('wf-armed');
    [rail, dot].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
    frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    rail = dot = null; nodes = []; frames = []; done = [];
    rows.forEach(function (r) { r.classList.remove('is-lit'); });
    clearKeys();
  }

  /* the frame each card is traced along: starts where the rail's stub meets the card, goes up and round clockwise (mirrored in Hebrew) */
  function framePath(w, h, sy) {
    var r = 14, a = .5;
    return 'M' + a + ',' + sy + 'L' + a + ',' + r + 'A' + (r - a) + ',' + (r - a) + ' 0 0 1 ' + r + ',' + a +
      'L' + (w - r) + ',' + a + 'A' + (r - a) + ',' + (r - a) + ' 0 0 1 ' + (w - a) + ',' + r +
      'L' + (w - a) + ',' + (h - r) + 'A' + (r - a) + ',' + (r - a) + ' 0 0 1 ' + (w - r) + ',' + (h - a) +
      'L' + r + ',' + (h - a) + 'A' + (r - a) + ',' + (r - a) + ' 0 0 1 ' + a + ',' + (h - r) + 'L' + a + ',' + sy;
  }

  function measure() {
    ny = rows.map(function (r) { return offsetTop(r, list) + 46; });
    y0 = ny[0]; yN = ny[ny.length - 1];
    line.style.top = y0 + 'px'; line.style.height = (yN - y0) + 'px';
    nodes.forEach(function (n, i) { n.style.top = ny[i] + 'px'; });
    frames.forEach(function (f, i) {
      var w = rows[i].offsetWidth, h = rows[i].offsetHeight, p = f.querySelector('path');
      f.setAttribute('width', w); f.setAttribute('height', h); f.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      p.setAttribute('d', framePath(w, h, 46));
      var L = p.getTotalLength(); f.__L = L; p.style.strokeDasharray = '0 ' + L;
    });
  }

  function build() {
    teardown();
    if (!wide.matches || reduce || list.getBoundingClientRect().left < 64) return;
    rtl = root.getAttribute('dir') === 'rtl';
    rail = doc.createElement('div'); rail.className = 'wf-rail'; rail.setAttribute('aria-hidden', 'true');
    rail.style[rtl ? 'right' : 'left'] = '-40px';
    line = doc.createElement('i'); line.className = 'wf-line';
    glow = doc.createElement('i'); glow.className = 'wf-glow';
    rail.appendChild(line); rail.appendChild(glow);
    rows.forEach(function (r) {
      var n = doc.createElement('b'); n.className = 'wf-node'; rail.appendChild(n); nodes.push(n);
      var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'wf-frame'); s.setAttribute('aria-hidden', 'true');
      s.appendChild(doc.createElementNS('http://www.w3.org/2000/svg', 'path')); r.appendChild(s); frames.push(s); done.push(false);
    });
    list.appendChild(rail);
    dot = doc.createElement('div'); dot.className = 'flow-dot wf-dot'; dot.setAttribute('aria-hidden', 'true');
    dot.innerHTML = '<i class="flow-dot-core"><b></b></i>'; dot.style.setProperty('--ds', '16px');
    doc.body.appendChild(dot);
    measure();
    active = true;
    root.classList.add('wf-armed');
    var ir = intro ? intro.getBoundingClientRect() : null;
    if (!ir || !keys().length || ir.bottom < 0 || introDone) { introState = 2; keys().forEach(function (k) { k.classList.add('on'); }); }      /* nothing to light, already scrolled past it, or already shown once */
    tick(true);
  }

  /* ---- little animation helpers ---- */
  function run(dur, step, fin, myGen) {
    var t0 = performance.now();
    (function f(now) {
      if (myGen !== gen) return;
      var u = clamp((now - t0) / dur, 0, 1);
      step(u);
      if (u < 1) requestAnimationFrame(f); else if (fin) fin();
    })(t0);
  }

  /* the intro: along the key words (marker draws under them), then down to the rail */
  function runIntro() {
    introState = 1; busy = true; introDone = true;
    var g = gen, ks = keys(), segs = [];
    function rectsOf(k) { return Array.prototype.slice.call(k.getClientRects()); }
    ks.forEach(function (k, ki) {
      var n = rectsOf(k).length || 1;
      for (var ri = 0; ri < n; ri++) segs.push({ k: k, ri: ri, first: ri === 0 });
    });
    function edge(seg, atEnd) {
      var rs = rectsOf(seg.k), r = rs[Math.min(seg.ri, rs.length - 1)];
      var startX = rtl ? r.right : r.left, endX = rtl ? r.left : r.right;
      return { x: atEnd ? endX : startX, y: r.bottom - 3 };
    }
    var i = 0;
    dot.classList.remove('is-pop'); void dot.offsetWidth; dot.classList.add('is-pop'); dot.style.opacity = 1;
    function next() {
      if (g !== gen) return;
      if (i >= segs.length) return toRail();
      var s = segs[i++], a = edge(s, false);
      var prev = { x: parseFloat(dot.__x || a.x), y: parseFloat(dot.__y || a.y) };
      var hop = dot.__x != null ? 380 : 1;
      run(hop, function (u) { var e = ease(u), p = edge(s, false); dot.__x = prev.x + (p.x - prev.x) * e; dot.__y = prev.y + (p.y - prev.y) * e; place(dot.__x, dot.__y); }, function () {
        if (s.first) s.k.classList.add('on');
        var dur = clamp(rectsOf(s.k)[Math.min(s.ri, rectsOf(s.k).length - 1)].width * 3.2, 420, 1100);
        run(dur, function (u) { var e = ease(u), p0 = edge(s, false), p1 = edge(s, true); dot.__x = p0.x + (p1.x - p0.x) * e; dot.__y = p0.y + (p1.y - p0.y) * e; place(dot.__x, dot.__y); }, next, g);
      }, g);
    }
    function toRail() {
      var from = { x: dot.__x, y: dot.__y };
      run(900, function (u) {
        var lr = list.getBoundingClientRect(), tx = rtl ? lr.right + 40 : lr.left - 40, ty = lr.top + y0, e = ease(u);
        var bow = Math.sin(u * Math.PI) * 26 * (rtl ? 1 : -1);          /* a soft curve rather than a straight line */
        dot.__x = from.x + (tx - from.x) * e + bow; dot.__y = from.y + (ty - from.y) * e; place(dot.__x, dot.__y);
      }, function () { introState = 2; busy = false; dot.__x = dot.__y = null; cur = y0; tick(false); }, g);
    }
    next();
  }

  /* one lap round a card's frame, lighting it, then back to the rail */
  function lap(i) {
    busy = true;
    var g = gen, row = rows[i], f = frames[i], p = f.querySelector('path'), L = f.__L || p.getTotalLength();
    row.classList.add('is-lit'); nodes[i].classList.add('on');
    f.classList.remove('fade'); f.classList.add('show');
    dot.classList.remove('is-land'); void dot.offsetWidth; dot.classList.add('is-land');
    var dur = clamp(L * .85, 1100, 2000);
    run(dur, function (u) {
      var e = ease(u), pt = p.getPointAtLength(L * e), rr = row.getBoundingClientRect(), x = rtl ? rr.width - pt.x : pt.x;
      p.style.strokeDasharray = (L * e) + ' ' + L;
      place(rr.left + x, rr.top + pt.y);
    }, function () {
      f.classList.add('fade'); f.classList.remove('show');
      setTimeout(function () { if (p) p.style.strokeDasharray = '0 ' + L; }, 1300);
      var rr0 = row.getBoundingClientRect(), sx = rtl ? rr0.right : rr0.left;
      run(260, function (u) {
        var lr = list.getBoundingClientRect(), tx = rtl ? lr.right + 40 : lr.left - 40, rr = row.getBoundingClientRect();
        var fx = rtl ? rr.right : rr.left;
        place(fx + (tx - fx) * ease(u), rr.top + 46);
      }, function () { done[i] = true; busy = false; cur = ny[i]; kick(); }, g);
    }, g);
  }

  function tick(first) {
    raf = 0;
    if (!active) return;
    var lr = list.getBoundingClientRect(), vh = window.innerHeight;
    if (introState === 0 && intro) {
      var ir = intro.getBoundingClientRect(), age = performance.now() - t0;
      if (ir.top < vh * .85 && ir.bottom > 0) {
        if (age < 2200) { setTimeout(kick, 2200 - age + 30); return; }     /* let the page's own entrance finish first */
        runIntro(); return;
      }
    }
    if (busy || introState < 2) { if (introState < 2 && !busy) dot.style.opacity = 0; return; }
    var rel = (vh * .55) - lr.top, target = clamp(rel, y0, yN), moved = false;
    if (cur === null || first) cur = target;
    else if (Math.abs(target - cur) > .4) { cur += (target - cur) * .14; moved = true; } else cur = target;
    var x = rtl ? lr.right + 40 : lr.left - 40;
    place(x, lr.top + cur);
    dot.style.opacity = (lr.top < vh * .92 && lr.bottom > vh * .08) ? 1 : 0;
    glow.style.top = y0 + 'px'; glow.style.height = Math.max(0, cur - y0) + 'px';
    for (var i = 0; i < rows.length; i++) {
      if (!done[i] && cur >= ny[i] - 4) {
        if (first && ny[i] < cur - 40) { done[i] = true; rows[i].classList.add('is-lit'); nodes[i].classList.add('on'); }
        else { place(x, lr.top + ny[i]); lap(i); return; }
      }
    }
    if (moved) {
      rail.classList.add('is-moving'); clearTimeout(moveT);
      moveT = setTimeout(function () { if (rail) rail.classList.remove('is-moving'); }, 260);
      raf = requestAnimationFrame(function () { tick(false); });
    }
  }
  function kick() { if (active && !raf) raf = requestAnimationFrame(function () { tick(false); }); }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { setTimeout(build, 140); });
  if (wide.addEventListener) wide.addEventListener('change', build);
  Array.prototype.forEach.call(doc.querySelectorAll('.lang-toggle'), function (b) { b.addEventListener('click', function () { setTimeout(build, 280); }); });
  window.addEventListener('load', function () { build(); setTimeout(function () { if (active && !busy) { measure(); kick(); } }, 600); });
  if (doc.readyState === 'complete') build();
  if (window.ResizeObserver) new ResizeObserver(function () { if (active && !busy) { measure(); kick(); } }).observe(list);
})();
