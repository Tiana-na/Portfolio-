/* The line arrives on the Contact page and becomes the telephone cord: it comes down from the top, runs in to the payphone in the photo,
   follows the photo's own cord (drawn in lavender over it) to the receiver in Tiana's hand - and the phone rings: the photo gives a little
   shake, sound rings spread from the receiver and the payphone's display lights. The phone key below stays still:
   one ringing phone is enough. Clicking the photo rings it again.
   Decorative only: aria-hidden, no pointer events on the line, and no motion when the visitor prefers reduced motion. */
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
  /* where the photo's cord runs, as fractions of the picture (start at the payphone, two curves, end at the receiver) */
  var CORD = { s: [.135, .445], a: [.19, .51, .25, .572], m: [.33, .574], b: [.45, .57, .55, .5], e: [.685, .405] };
  var rung = false, base, glow = [], rbr = null, badge = null, port = null, ring = null, L = 0, splitS = 0;
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
    var wrap = hero.querySelector('.contact-callme-wrap'), img = hero.querySelector('.contact-callme-img');
    var pts, extra = '', R = narrow ? 12 : 26, cx = W / 2;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    dot.style.setProperty('--ds', narrow ? '14px' : '22px');
    rbr = badge = port = ring = null;
    /* the photo's own cord, as fractions of the picture (it leaves the payphone's underside, sags, and rises to the receiver) */
    var io = img ? rel(off(img)) : { l: cx - 100, t: 60, r: cx + 100, b: 310 }, iw = io.r - io.l, ih = io.b - io.t;
    function P(u, v) { return [io.l + u * iw, io.t + v * ih]; }
    var S = P(CORD.s[0], CORD.s[1]), c1 = P(CORD.a[0], CORD.a[1]), c2 = P(CORD.a[2], CORD.a[3]), m = P(CORD.m[0], CORD.m[1]), c3 = P(CORD.b[0], CORD.b[1]), c4 = P(CORD.b[2], CORD.b[3]), E = P(CORD.e[0], CORD.e[1]);
    if (!narrow) {
      var yT = Math.max(24, io.t - 34), xl = Math.max(io.l - 66, 12);
      pts = [[cx, 0], [cx, yT], [xl, yT], [xl, S[1]], [S[0], S[1]]];
    } else {
      var gx = rtl ? W - 8 : 8;
      pts = [[gx, 0], [gx, S[1]], [S[0], S[1]]];
    }
    var cord = ' C' + f1(c1[0]) + ',' + f1(c1[1]) + ' ' + f1(c2[0]) + ',' + f1(c2[1]) + ' ' + f1(m[0]) + ',' + f1(m[1]) +
               ' C' + f1(c3[0]) + ',' + f1(c3[1]) + ' ' + f1(c4[0]) + ',' + f1(c4[1]) + ' ' + f1(E[0]) + ',' + f1(E[1]);
    var d = roundedPath(pts, R) + cord;
    /* desktop: the cord does not stop at the receiver - it leaves the photo on its far side, runs down past the text and plugs into the nearest key */
    splitS = 0;
    if (!narrow) {
      var keys = buttons.filter(function (b) { return b.offsetWidth; }), kb = null, kx = -1, bi;
      for (bi = 0; bi < keys.length; bi++) { var ko = rel(off(keys[bi])), kc = (ko.l + ko.r) / 2; if (kc > kx) { kx = kc; kb = ko; } }
      if (kb) {
        var tr = cx, ti, tEls = hero.querySelectorAll('h1, .contact-looking, .contact-voice');
        for (ti = 0; ti < tEls.length; ti++) tr = Math.max(tr, textBox(tEls[ti]).r);
        var xr = Math.max(io.r + 44, tr + 30), yk = kb.t - 26, kcx = (kb.l + kb.r) / 2;
        var tmp = doc.createElementNS(NS, 'path'); tmp.setAttribute('d', d); svg.appendChild(tmp); splitS = tmp.getTotalLength(); svg.removeChild(tmp);
        var tail = roundedPath([E, [xr, E[1]], [xr, yk], [kcx, yk], [kcx, kb.t + 4]], R);
        d += tail.replace(/^M[^L]*/, '');
      }
    }
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
    dot.style.opacity = (s >= L - 0.5 && (played || !moving)) ? 0 : (s > 0.5 || played ? 1 : 0);
    if (moving && splitS > 0 && !rung && s >= splitS - 1) { rung = true; svg.classList.add('is-connect', 'cl-after'); setTimeout(function () { svg.classList.remove('is-connect'); }, 1500); ringNow(); }
    var reachedSplit = s >= splitS - 1 && s > 1;
    if (rbr) rbr.classList.toggle('on', reachedSplit);
    if (badge) { badge.classList.toggle('on', reachedSplit); badge.classList.toggle('seen', reachedSplit); }
    var atEnd = s >= L - 0.5;
    if (port) { port.classList.toggle('on', atEnd); port.classList.toggle('seen', reachedSplit); }
    if (ring) { ring.classList.toggle('on', atEnd); }
  }

  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  /* ---- the phone in the photo: ringing, the display ---- */
  var wrapEl = hero.querySelector('.contact-callme-wrap'), ringT = 0;
  function makeFx() {
    if (!wrapEl || wrapEl.querySelector('.cl-fx')) return;
    var fx = doc.createElement('div'); fx.className = 'cl-fx'; fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<i class="cl-disp"></i><span class="cl-recv"><i></i><i></i><i></i></span>';
    wrapEl.appendChild(fx); wrapEl.classList.add('cl-tap');
    wrapEl.addEventListener('click', function () { if (played || reduce) ringNow(); });
  }
  function ringNow() {
    if (!wrapEl || reduce) return;
    wrapEl.classList.remove('is-ringing'); void wrapEl.offsetWidth; wrapEl.classList.add('is-ringing');
    clearTimeout(ringT); ringT = setTimeout(function () { wrapEl.classList.remove('is-ringing'); }, 2600);
  }
  function land() {
    dot.classList.remove('is-land'); void dot.offsetWidth; dot.classList.add('is-land');
    /* the cord reaches the receiver: the line "connects", the phone in the photo rings, (the phone key below stays still - one ringing phone is enough) */
    if (!splitS) { svg.classList.add('is-connect', 'cl-after'); setTimeout(function () { svg.classList.remove('is-connect'); }, 1500); ringNow(); } else svg.classList.add('cl-after');
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
    makeFx();
    build();
    var go = function () { build(); setTimeout(play, 450); };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go); else go();
  }
  if (doc.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
