/* The line arrives on the Contact page: it comes down from the top, goes round the whole contact block (the same
   rule as on About: the line never crosses content, it splits, wraps both sides and meets again underneath) and the
   dot lands under the three buttons. On a phone it runs down the margin and lands beside the buttons.
   Decorative only: aria-hidden, no pointer events, and no motion when the visitor prefers reduced motion. */
(function () {
  'use strict';
  var doc = document, main = doc.querySelector('main'), hero = doc.querySelector('.contact-hero');
  if (!main || !hero) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'flow-rail cl-rail'); svg.setAttribute('aria-hidden', 'true');
  main.style.position = 'relative';
  main.insertBefore(svg, main.firstChild);
  var dot = doc.createElement('span');
  dot.className = 'flow-dot cl-dot'; dot.setAttribute('aria-hidden', 'true');
  dot.innerHTML = '<span class="flow-dot-core"><b></b></span>';
  main.appendChild(dot);

  var TAILS = [210, 110, 46];
  var base, glow = [], rbr = null, badge = null, port = null, ring = null, L = 0, splitS = 0;
  var played = false, running = false, curS = 0, raf = 0, narrow = false, started = false;
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('.contact-icon-row .quiz-icon-btn'));
  var mail = doc.querySelector('.contact-icon-row a[href^="mailto"]'), phone = doc.querySelector('.contact-icon-row a[href^="tel"]');

  function f1(n) { return Math.round(n * 10) / 10; }
  function unit(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1; return [dx / l, dy / l, l]; }
  function roundedPath(pts, R) {
    var d = 'M' + f1(pts[0][0]) + ',' + f1(pts[0][1]), i;
    for (i = 1; i < pts.length; i++) {
      var A = pts[i - 1], V = pts[i], u = unit(A, V), r0 = 0, r1 = 0;
      if (i > 1) r0 = Math.min(R, unit(pts[i - 2], A)[2] / 2, u[2] / 2);
      if (i < pts.length - 1) r1 = Math.min(R, u[2] / 2, unit(V, pts[i + 1])[2] / 2);
      var ep = [V[0] - u[0] * r1, V[1] - u[1] * r1];
      d += 'L' + f1(ep[0]) + ',' + f1(ep[1]);
      if (r1 > 0) {
        var v = unit(V, pts[i + 1]), cr = u[0] * v[1] - u[1] * v[0], to = [V[0] + v[0] * r1, V[1] + v[1] * r1];
        d += 'A' + f1(r1) + ',' + f1(r1) + ' 0 0 ' + (cr > 0 ? 1 : 0) + ' ' + f1(to[0]) + ',' + f1(to[1]);
      }
    }
    return d;
  }

  function build() {
    var mr = main.getBoundingClientRect(), W = mr.width, H = mr.height;
    var rtl = doc.documentElement.dir === 'rtl';
    narrow = window.innerWidth <= 760;
    /* layout boxes (offset based): immune to the reveal transforms that are still settling when the page loads */
    function off(el) { var l = 0, t = 0, e = el; while (e) { l += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; } return { l: l, t: t, r: l + el.offsetWidth, b: t + el.offsetHeight }; }
    var mo = off(main);
    function rel(o) { return { l: o.l - mo.l, t: o.t - mo.t, r: o.r - mo.l, b: o.b - mo.t }; }
    function textBox(el) {
      var o = rel(off(el)), rg = doc.createRange(); rg.selectNodeContents(el);
      var tw = Math.min(o.r - o.l, rg.getBoundingClientRect().width || (o.r - o.l)), c = (o.l + o.r) / 2;
      return { l: c - tw / 2, r: c + tw / 2, t: o.t, b: o.b };
    }
    var wrap = hero.querySelector('.contact-callme-wrap'), row = hero.querySelector('.contact-icon-row');
    var parts = [];
    if (wrap) { var w = rel(off(wrap)); parts.push({ l: w.l - 34, t: w.t - 6, r: w.r + 34, b: w.b + 16 }); }
    Array.prototype.forEach.call(hero.querySelectorAll('h1, p'), function (el) { parts.push(textBox(el)); });
    var rr = null;
    if (row) {
      Array.prototype.forEach.call(row.children, function (k) { var o = rel(off(k)); rr = rr ? { l: Math.min(rr.l, o.l), t: Math.min(rr.t, o.t), r: Math.max(rr.r, o.r), b: Math.max(rr.b, o.b) } : o; });
      if (rr) parts.push(rr);
    }
    var T = Infinity, B = -Infinity, Lx = Infinity, Rx = -Infinity;
    parts.forEach(function (p) { T = Math.min(T, p.t); B = Math.max(B, p.b); Lx = Math.min(Lx, p.l); Rx = Math.max(Rx, p.r); });

    var pts, extra = '', R = narrow ? 12 : 26, cx = W / 2;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    dot.style.setProperty('--ds', narrow ? '14px' : '22px');
    rbr = badge = port = ring = null;
    if (!narrow) {
      var yT = Math.max(30, T - 48), yB = B + 42;
      var xl = Math.max(Lx - 76, 12), xr = Math.min(Rx + 76, W - 12);
      /* the line plugs into the e-mail key: both branches meet under it, then a short stub rises to the key */
      var mx = cx, yEnd = yB - 28;
      if (mail) { var mb = rel(off(mail)); mx = (mb.l + mb.r) / 2; yEnd = Math.min(yB - 18, mb.b + 16); }
      pts = [[cx, 0], [cx, yT], [xl, yT], [xl, yB], [mx, yB], [mx, yEnd]];
      splitS = yT;
      var rd = Math.min(R, (yB - yT) / 2);
      extra += '<path class="rs" pathLength="1" d="M' + f1(cx) + ',' + f1(yT) + 'H' + f1(xr - rd) + 'Q' + f1(xr) + ',' + f1(yT) + ' ' + f1(xr) + ',' + f1(yT + rd) + 'V' + f1(yB - rd) + 'Q' + f1(xr) + ',' + f1(yB) + ' ' + f1(xr - rd) + ',' + f1(yB) + 'H' + f1(mx) + '"/>';
      extra += '<g class="pb" data-cl="b"><circle cx="' + f1(cx) + '" cy="' + f1(yT) + '" r="10.5"/><text x="' + f1(cx) + '" y="' + f1(yT + .5) + '">06</text></g>';
      extra += '<circle class="px" data-cl="p" cx="' + f1(mx) + '" cy="' + f1(yB) + '" r="4.2"/>';
    } else {
      var gx = rtl ? W - 8 : 8, ry = rr ? (rr.t + rr.b) / 2 : B;
      pts = [[gx, 0], [gx, ry]];
      splitS = 0;
      extra += '<circle class="rp" data-cl="r" cx="' + f1(gx) + '" cy="' + f1(ry) + '" r="5"/>';
    }
    var d = roundedPath(pts, R);
    svg.innerHTML = '<path d="' + d + '"/><path class="rg rg3" d="' + d + '"/><path class="rg rg2" d="' + d + '"/><path class="rg rg1" d="' + d + '"/>' + extra;
    base = svg.querySelector('path');
    glow = [svg.querySelector('.rg3'), svg.querySelector('.rg2'), svg.querySelector('.rg1')];
    rbr = svg.querySelector('.rs'); badge = svg.querySelector('[data-cl="b"]'); port = svg.querySelector('[data-cl="p"]'); ring = svg.querySelector('[data-cl="r"]');
    L = base.getTotalLength();
    base.style.strokeWidth = narrow ? '2px' : '2.2px';
    svg.classList.add('is-active');
    render(played ? L : curS, false);
  }

  function render(s, moving) {
    if (!base) return;
    s = Math.max(0, Math.min(L, s)); curS = s;
    base.style.opacity = s > 1 ? 1 : 0;
    base.style.strokeDasharray = s.toFixed(1) + ' ' + (L + 400);
    glow.forEach(function (g, gi) { var tl = TAILS[gi]; g.style.strokeDasharray = tl + ' ' + (L + 400); g.style.strokeDashoffset = (-(s - tl)).toFixed(1); });
    svg.classList.toggle('is-moving', !!moving);
    var p = base.getPointAtLength(s);
    dot.style.transform = 'translate3d(' + f1(p.x) + 'px,' + f1(p.y) + 'px,0)';
    dot.style.opacity = s > 0.5 || played ? 1 : 0;
    var reachedSplit = s >= splitS - 1 && s > 1;
    if (rbr) rbr.classList.toggle('on', reachedSplit);
    if (badge) { badge.classList.toggle('on', reachedSplit); badge.classList.toggle('seen', reachedSplit); }
    var atEnd = s >= L - 0.5;
    if (port) { port.classList.toggle('on', atEnd); port.classList.toggle('seen', reachedSplit); }
    if (ring) { ring.classList.toggle('on', atEnd); }
  }

  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function land() {
    dot.classList.remove('is-land'); void dot.offsetWidth; dot.classList.add('is-land');
    /* the key is pressed, then the line "connects" and the phone key rings */
    if (mail) { mail.classList.add('is-pressed'); setTimeout(function () { mail.classList.remove('is-pressed'); }, 230); }
    svg.classList.add('is-connect', 'cl-after'); setTimeout(function () { svg.classList.remove('is-connect'); }, 1500);
    if (phone) { setTimeout(function () { phone.classList.add('is-ring'); setTimeout(function () { phone.classList.remove('is-ring'); }, 2000); }, 260); }
  }
  function play() {
    if (started) return; started = true;
    if (reduce) { played = true; render(L, false); return; }
    running = true; var dur = Math.max(1500, Math.min(2800, L * 1.9)), t0 = 0;
    function step(ts) {
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur);
      render(L * ease(t), t < 1);
      if (t < 1) raf = requestAnimationFrame(step);
      else { running = false; played = true; render(L, false); land(); }
    }
    raf = requestAnimationFrame(step);
  }

  function relayout() { if (!started) { build(); return; } var was = curS; build(); if (!played && running) render(Math.min(was, L), true); }
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  try { new MutationObserver(function () { clearTimeout(rt); rt = setTimeout(relayout, 60); }).observe(doc.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] }); } catch (e) { /* ignore */ }

  function init() {
    build();
    var go = function () { build(); setTimeout(play, 450); };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go); else go();
  }
  if (doc.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
