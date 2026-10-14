/* About flow: the dot from the logo rolls down the page on a three-stripe rail
   (scroll-linked, never scroll-jacked) and opens each station as it lands:
   the story stack, the quiz, the skills stack, the closing key.
   Also: the stacks themselves (hover to peek, click / swipe / arrows to flip). */
(function () {
  'use strict';
  var TF = window.TF = window.TF || {};
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dot = doc.getElementById('flowDot');
  var logoDot = doc.getElementById('logoDot');
  var railSvg = doc.getElementById('flowRail');
  var main = doc.getElementById('flowMain');

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function isRTL() { return root.getAttribute('dir') === 'rtl'; }

  /* ================= stacks ================= */
  function initStack(stk) {
    var cards = Array.prototype.slice.call(stk.querySelectorAll('.stk-card'));
    var n = cards.length, order = cards.map(function (_, i) { return i; });
    var prev = stk.querySelector('.stk-prev'), next = stk.querySelector('.stk-next');
    var count = stk.querySelector('.stk-count b');
    var open = !stk.classList.contains('is-armed');

    function titleOf(c) { var h = c.querySelector('h2'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; }
    var spines = cards.map(function (c) {
      var sp = doc.createElement('span'); sp.className = 'stk-spine'; sp.setAttribute('aria-hidden', 'true'); c.appendChild(sp); return sp;
    });
    function apply() {
      cards.forEach(function (c, i) { spines[i].textContent = titleOf(c); });
      order.forEach(function (ci, d) {
        var c = cards[ci];
        c.style.setProperty('--d', d);
        c.classList.toggle('is-front', d === 0);
        if (d === 0) { c.removeAttribute('tabindex'); c.removeAttribute('role'); c.removeAttribute('aria-label'); }
        else { c.setAttribute('tabindex', '0'); c.setAttribute('role', 'button'); c.setAttribute('aria-label', titleOf(c)); }
      });
      if (count) count.textContent = order[0] + 1;
    }
    function bring(ci) { var k = order.indexOf(ci); if (k <= 0) return; order = order.slice(k).concat(order.slice(0, k)); apply(); }
    function step(dir) { if (dir > 0) order.push(order.shift()); else order.unshift(order.pop()); apply(); }

    cards.forEach(function (c, ci) {
      c.addEventListener('click', function (e) {
        if (c.__moved) { c.__moved = false; return; }
        if (!c.classList.contains('is-front')) bring(ci);
      });
      c.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !c.classList.contains('is-front')) { e.preventDefault(); bring(ci); }
      });
      /* swipe / drag the front card away */
      var sx = 0, sy = 0, dragging = false, id = null;
      c.addEventListener('pointerdown', function (e) {
        if (!c.classList.contains('is-front') || (e.pointerType === 'mouse' && e.button !== 0)) return;
        if (e.target.closest('a,button')) return;
        dragging = true; id = e.pointerId; sx = e.clientX; sy = e.clientY; c.__moved = false;
      });
      c.addEventListener('pointermove', function (e) {
        if (!dragging || e.pointerId !== id) return;
        var dx = e.clientX - sx;
        if (Math.abs(dx) > 8) {
          if (!c.__moved) { c.__moved = true; c.classList.add('is-dragging'); try { c.setPointerCapture(id); } catch (err) {} }
          c.style.setProperty('--dx', dx + 'px');
          c.style.setProperty('--dr', clamp(dx / 38, -6, 6) + 'deg');
        }
      });
      function finish(e) {
        if (!dragging || (e && e.pointerId !== id)) return;
        dragging = false;
        var dx = e ? e.clientX - sx : 0;
        c.classList.remove('is-dragging');
        c.style.setProperty('--dx', '0px'); c.style.setProperty('--dr', '0deg');
        if (c.__moved && Math.abs(dx) > 56 && n > 1) step((dx < 0) !== isRTL() ? 1 : -1);
        setTimeout(function () { c.__moved = false; }, 60);
      }
      c.addEventListener('pointerup', finish);
      c.addEventListener('pointercancel', function () { finish(null); });
    });
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    apply();
    return { el: stk, open: function () { stk.classList.add('is-open'); stk.classList.remove('is-spark'); void stk.offsetWidth; stk.classList.add('is-spark'); setTimeout(function () { stk.classList.remove('is-spark'); }, 1800); }, step: step, refresh: apply };
  }

  var stackEls = Array.prototype.slice.call(doc.querySelectorAll('.stk'));
  var stacks = stackEls.map(function (s) {
    if (!reduce) s.classList.add('is-armed');
    return initStack(s);
  });
  function stackOf(el) { for (var i = 0; i < stacks.length; i++) if (stacks[i].el === el) return stacks[i]; }

  Array.prototype.forEach.call(doc.querySelectorAll('.lang-toggle'), function (b) { b.addEventListener('click', function () { setTimeout(function () { stacks.forEach(function (s) { s.refresh(); }); }, 80); }); });

  if (reduce || !dot || !logoDot || !main) { TF.dock = function () {}; return; }


  /* ================= the dot's ride =================
     Desktop: one spine runs down the middle of the page and passes THROUGH each element (it goes in at the top edge,
     comes out at the bottom edge); where text sits between two elements the line steps out to the margin and back
     in with rounded corners. Phones have no room for a middle line, so the rail keeps to the margin and each element
     gets a node on it. The dot follows the line (it chases the scroll, never the other way round), and every
     element lights up when the dot arrives at it. */
  root.classList.add('dot-away');
  root.classList.add('pw-armed');
  var ds = 22, vw = 0, vh = 0, xg = 0, mainTop = 0, mainLeft = 0, mainH = 0, mainW = 0;
  var stations = [], built = false, rtl = false, glow = [], pathLen = 0, baseEl = null;
  var map = [], yStart = 0, yEnd = 0, sCur = null, lastT = 0, chaseRaf = false, stubs = [], rings = [], narrowMode = false;
  var TAILS = [210, 110, 46];
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* page-space box that ignores transforms (the .reveal elements start shifted) */
  function box(el) {
    var l = 0, t = 0, e = el, w = el.offsetWidth, h = el.offsetHeight;
    while (e) { l += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; }
    return { left: l, top: t, right: l + w, bottom: t + h, width: w, height: h };
  }

  /* a stack's open pose, measured without animating: the front card's width and the outermost edge */
  function stackInfo(s) {
    var sx = window.scrollX, wasOpen = s.classList.contains('is-open'), e = rtl ? -1e9 : 1e9, fl = 0, fr = 0;
    s.classList.add('stk-measuring'); if (!wasOpen) s.classList.add('is-open');
    void s.offsetWidth;
    Array.prototype.forEach.call(s.querySelectorAll('.stk-card'), function (c) {
      var r = c.getBoundingClientRect();
      e = rtl ? Math.max(e, r.right) : Math.min(e, r.left);
      if (c.classList.contains('is-front')) { fl = r.left + sx; fr = r.right + sx; }
    });
    if (!wasOpen) s.classList.remove('is-open');
    void s.offsetWidth; s.classList.remove('stk-measuring');
    var st = box(s.querySelector('.stk-stage'));
    return { top: st.top, bottom: st.bottom, l: fl, r: fr, edge: e + sx };
  }

  function measure() {
    var sy = window.scrollY;
    vw = root.clientWidth; vh = window.innerHeight; rtl = isRTL();
    narrowMode = window.innerWidth <= 760;
    ds = narrowMode ? 14 : 22;
    dot.style.setProperty('--ds', ds + 'px');
    var mr = main.getBoundingClientRect();
    mainTop = mr.top + sy; mainLeft = mr.left + window.scrollX; mainH = main.offsetHeight; mainW = main.offsetWidth;
    var gut = narrowMode ? 8 : Math.max(14, vw / 2 - 512);
    xg = rtl ? vw - gut : gut;
    var xs = vw / 2;
    yStart = Math.round(vh * .28 + vh * .5);
    var TOPOFF = 28;

    var list = [];
    var sStory = doc.querySelector('.stk--story'), sSkills = doc.querySelector('.stk--skills');
    var strip = doc.querySelector('.quiz-block .pastel-accent'), qb = doc.querySelector('.quiz-block'), qk = doc.querySelector('.quiz-start-btn');
    var pair = doc.querySelector('.card-pair'), key = doc.querySelector('.about-closing .btn.keycap');

    function stackSt(el) {
      var i = stackInfo(el), ex = clamp(xs, i.l + 36, i.r - 36);
      return { kind: 'stack', el: el, top: i.top, bottom: i.bottom, ex: ex, y: i.top + TOPOFF };
    }
    if (sStory) list.push(stackSt(sStory));
    if (strip && qb) {
      var sb = box(strip), qbb = box(qb), bot = qbb.bottom;
      if (qk && qk.offsetParent) bot = Math.max(bot, box(qk).bottom);
      var chip = doc.querySelector('.quiz-block .pastel-eyebrow-chip');
      list.push({ kind: 'quiz', el: strip, top: sb.top, bottom: bot + 4, ex: xs, y: chip ? box(chip).top + box(chip).height / 2 : sb.top + 19 });
    }
    if (sSkills) list.push(stackSt(sSkills));
    stubs = [];
    var pairSt = null;
    if (pair) {
      var cs = Array.prototype.map.call(pair.querySelectorAll('.card'), function (c) { return { r: box(c), el: c }; });
      if (cs.length) {
        cs.sort(function (a, b) { return a.r.left - b.r.left; });
        var top = Math.min.apply(null, cs.map(function (c) { return c.r.top; })), bottom = Math.max.apply(null, cs.map(function (c) { return c.r.bottom; }));
        pairSt = { kind: 'pair', el: pair, top: top, bottom: bottom, ex: xs, y: top + TOPOFF, cards: cs };
        list.push(pairSt);
      }
    }
    var endS = null;
    if (key) { var kr = box(key); endS = { kind: 'end', el: key, top: kr.top, ex: (kr.left + kr.right) / 2, y: kr.top }; list.push(endS); }
    list.sort(function (p, q) { return p.top - q.top; });
    stations = list;
    stations.forEach(function (s0) {
      var tg = s0.kind === 'quiz' ? (qb || s0.el) : s0.kind === 'end' ? (doc.querySelector('.about-closing') || s0.el) : s0.el;
      s0.pw = tg; if (tg) tg.classList.add('pw');
      var o = s0.el && s0.el.__stOpened; s0.opened = !!o;
    });
    yEnd = endS ? endS.top : 0;
    buildPath(xs);
    built = true;
  }

  /* ---- the line: a polyline with rounded corners, plus a table that says how far along it the dot is for a given scroll ---- */
  function f1(v) { return v.toFixed(1); }
  function makePath(pts, R) {
    var n = pts.length, turn = [], r = [], d = 'M' + f1(pts[0][0]) + ',' + f1(pts[0][1]), pieces = [], sAt = [0], cum = 0, i;
    function unit(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l, Math.hypot(dx, dy)]; }
    for (i = 0; i < n; i++) turn[i] = false;
    for (i = 1; i < n - 1; i++) { var a = unit(pts[i - 1], pts[i]), b = unit(pts[i], pts[i + 1]); turn[i] = Math.abs(a[0] * b[1] - a[1] * b[0]) > .5; }
    for (i = 0; i < n; i++) r[i] = 0;
    for (i = 1; i < n - 1; i++) {
      if (!turn[i]) continue;
      var li = unit(pts[i - 1], pts[i])[2], lo = unit(pts[i], pts[i + 1])[2];
      r[i] = Math.max(0, Math.min(R, li - r[i - 1], lo / (turn[i + 1] ? 2 : 1)));
    }
    for (i = 1; i < n; i++) {
      var A = pts[i - 1], V = pts[i], u = unit(A, V), sp = [A[0] + u[0] * r[i - 1], A[1] + u[1] * r[i - 1]], ep = [V[0] - u[0] * r[i], V[1] - u[1] * r[i]];
      var ll = Math.max(0, u[2] - r[i - 1] - r[i]);
      if (ll > .01) { d += 'L' + f1(ep[0]) + ',' + f1(ep[1]); pieces.push({ vi: i, s0: cum, len: ll, dy: u[1] * ll, h: Math.abs(u[1]) < .5 }); cum += ll; }
      if (r[i] > 0) {
        var W = pts[i + 1], v = unit(V, W), cr = u[0] * v[1] - u[1] * v[0], to = [V[0] + v[0] * r[i], V[1] + v[1] * r[i]];
        d += 'A' + f1(r[i]) + ',' + f1(r[i]) + ' 0 0 ' + (cr > 0 ? 1 : 0) + ' ' + f1(to[0]) + ',' + f1(to[1]);
        var al = Math.PI * r[i] / 2; pieces.push({ vi: i, s0: cum, len: al, dy: to[1] - ep[1], h: false, arc: true }); cum += al;
      }
      sAt[i] = cum;
    }
    return { d: d, pieces: pieces, sAt: sAt, total: cum };
  }
  function buildMap(pieces, pins, total) {
    map = [];
    for (var q = 0; q < pins.length - 1; q++) {
      var a = pins[q], b = pins[q + 1], ps = pieces.filter(function (p) { return p.vi > a.i && p.vi <= b.i; });
      var delta = Math.max(0, b.P - a.P), sumW = 0, dyS = 0;
      ps.forEach(function (p) { if (p.h) { p.w = clamp(p.len * .22, 60, 150); sumW += p.w; } else dyS += Math.abs(p.dy); });
      var cap = delta * .5; if (sumW > cap && sumW > 0) { var kf = cap / sumW; ps.forEach(function (p) { if (p.h) p.w *= kf; }); sumW = cap; }
      var rest = delta - sumW, P = a.P;
      ps.forEach(function (p) { var dP = p.h ? p.w : (dyS > 0 ? rest * Math.abs(p.dy) / dyS : 0); map.push({ P0: P, P1: P + dP, s0: p.s0, s1: p.s0 + p.len }); P += dP; });
    }
  }
  function targetS(P) {
    if (!map.length) return 0;
    if (P <= map[0].P0) return 0;
    var lastE = map[map.length - 1]; if (P >= lastE.P1) return lastE.s1;
    var lo = 0, hi = map.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (map[mid].P1 < P) lo = mid + 1; else hi = mid; }
    var e = map[lo], u = e.P1 - e.P0 > .01 ? (P - e.P0) / (e.P1 - e.P0) : 1;
    return e.s0 + (e.s1 - e.s0) * clamp(u, 0, 1);
  }

  function buildPath(xs) {
    var pts = [[xg, yStart]], pins = [{ i: 0, P: yStart }], idx = [];
    function push(x, y) { var l = pts[pts.length - 1]; if (Math.abs(l[0] - x) < .5 && Math.abs(l[1] - y) < .5) return pts.length - 1; pts.push([x, y]); return pts.length - 1; }
    var JG = 30, i, s, lastS = null, endS = null;
    var closeP = doc.querySelector('.about-closing p'), textRect = null;
    if (!narrowMode) {
      for (i = 0; i < stations.length; i++) {
        s = stations[i];
        if (lastS == null) { var yJ = Math.max(s.top - JG, yStart + 20); push(xg, yJ); push(s.ex, yJ); }
        else if (s.top - lastS.bottom > 200) { var yA = lastS.bottom + JG, yB = s.top - JG; push(lastS.ex, yA); push(xg, yA); push(xg, yB); push(s.ex, yB); }
        else if (Math.abs(lastS.ex - s.ex) > 1) { var ym = (lastS.bottom + s.top) / 2; push(lastS.ex, ym); push(s.ex, ym); }
        var ie = push(s.ex, s.top); s.vi = ie; pins.push({ i: ie, P: s.top });
        if (s.kind !== 'end') { var ix = push(s.ex, s.bottom); pins.push({ i: ix, P: s.bottom }); }
        else endS = s;
        lastS = s;
      }
    } else {
      stations.forEach(function (st) { if (st.kind === 'end') { endS = st; return; } var iv = push(xg, st.y); st.vi = iv; pins.push({ i: iv, P: st.y }); });
      if (endS) {
        var lastY = pts[pts.length - 1][1], yJ2 = Math.max(lastY + 30, (closeP ? box(closeP).top : endS.top - 60) - 18);
        yJ2 = Math.min(yJ2, endS.top - 40);
        var ij = push(xg, yJ2); pins.push({ i: ij, P: yJ2 }); push(endS.ex, yJ2);
        var ie2 = push(endS.ex, endS.top); endS.vi = ie2; pins.push({ i: ie2, P: endS.top });
      }
    }
    for (i = 1; i < pins.length; i++) if (pins[i].P < pins[i - 1].P) pins[i].P = pins[i - 1].P;
    var R = narrowMode ? 12 : 18;
    var mp = makePath(pts, R);
    buildMap(mp.pieces, pins, mp.total);
    stations.forEach(function (st) { st.sOpen = st.vi != null ? mp.sAt[st.vi] : 0; });

    /* a gap in the line behind the closing sentence (the line passes behind it, like a label on a wire) */
    var maskRect = '';
    if (closeP && endS) {
      var cb = box(closeP), rg = doc.createRange(); rg.selectNodeContents(closeP);
      var tw = Math.min(cb.width, rg.getBoundingClientRect().width || cb.width), cx = (cb.left + cb.right) / 2 - mainLeft;
      maskRect = '<rect x="' + f1(cx - tw / 2 - 16) + '" y="' + f1(cb.top - mainTop - 6) + '" width="' + f1(tw + 32) + '" height="' + f1(cb.height + 12) + '" fill="#000"/>';
    }
    var g = '<path d="' + mp.d + '"/><path class="rg rg3" d="' + mp.d + '"/><path class="rg rg2" d="' + mp.d + '"/><path class="rg rg1" d="' + mp.d + '"/>';
    /* the little branches into Education and Languages, and the nodes on a phone's margin */
    var extra = '';
    function PX(p) { return [p[0] - mainLeft, p[1] - mainTop]; }
    stations.forEach(function (st) {
      if (st.kind === 'pair' && !narrowMode && st.cards.length === 2) {
        st.cards.forEach(function (c, ci) {
          var cy = c.r.top + c.r.height / 2 - mainTop, edge = ci === 0 ? c.r.right : c.r.left, x0 = st.ex - mainLeft;
          extra += '<path class="rs" d="M' + f1(x0) + ',' + f1(cy) + 'H' + f1(edge - mainLeft + (ci === 0 ? 1 : -1)) + '"/>';
        });
      }
      if (narrowMode && st.kind !== 'end') extra += '<circle class="rp" cx="' + f1(xg - mainLeft) + '" cy="' + f1(st.y - mainTop) + '" r="5"/>';
    });
    railSvg.setAttribute('width', mainW); railSvg.setAttribute('height', mainH);
    railSvg.innerHTML = '<defs><mask id="flowMask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + mainW + '" height="' + mainH + '"><rect x="0" y="0" width="' + mainW + '" height="' + mainH + '" fill="#fff"/>' + maskRect + '</mask></defs>' +
      '<g mask="url(#flowMask)"><g transform="translate(' + f1(-mainLeft) + ',' + f1(-mainTop) + ')">' + g + '</g></g>' + extra;
    /* the path coordinates are page coordinates; the group moves them into the svg's own space */
    glow = [railSvg.querySelector('.rg3'), railSvg.querySelector('.rg2'), railSvg.querySelector('.rg1')];
    baseEl = railSvg.querySelector('g path');
    stubs = Array.prototype.slice.call(railSvg.querySelectorAll('.rs'));
    rings = Array.prototype.slice.call(railSvg.querySelectorAll('.rp'));
    pathLen = baseEl.getTotalLength();
    var k = mp.total > 0 ? pathLen / mp.total : 1;      /* the browser's own length for the same line */
    if (Math.abs(k - 1) > .0005) { map.forEach(function (e) { e.s0 *= k; e.s1 *= k; }); stations.forEach(function (st) { st.sOpen *= k; }); }
    baseEl.style.strokeWidth = narrowMode ? '2.6px' : '3.2px';
    baseEl.style.opacity = 0;   /* stays hidden until the dot has left the hero and starts to ride */
    stations.forEach(function (st, si) { if (st.opened) setLit(st); });
    sCur = null;
  }

  function mix(a, b, t) {
    var A = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), Bc = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (Bc[i] - v) * t); }).join(',') + ')';
  }
  function headerDot() {
    var r = logoDot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, d: Math.max(5, r.width) };
  }

  var landTimer = null;
  function land() {
    dot.classList.remove('is-land'); void dot.offsetWidth; dot.classList.add('is-land');
    clearTimeout(landTimer); landTimer = setTimeout(function () { dot.classList.remove('is-land'); }, 600);
  }
  /* what the rail itself shows once a station is reached (branches, nodes) */
  function setLit(s) {
    if (s.kind === 'pair') stubs.forEach(function (e) { e.classList.add('on'); });
    if (narrowMode && s.kind !== 'end') { var ix = stations.indexOf(s); if (rings[ix]) rings[ix].classList.add('on'); }
  }
  function openStation(s) {
    s.opened = true; if (s.el) s.el.__stOpened = true;
    land(); setLit(s);
    if (s.pw) {
      s.pw.classList.add('is-lit'); s.pw.classList.remove('is-spark'); void s.pw.offsetWidth; s.pw.classList.add('is-spark');
      var pwEl = s.pw; setTimeout(function () { pwEl.classList.remove('is-spark'); }, 1500);
    }
    if (s.kind === 'stack') { var o = stackOf(s.el); if (o) o.open(); }
    else if (s.kind === 'quiz') { s.el.classList.remove('is-hit'); void s.el.offsetWidth; s.el.classList.add('is-hit'); }
    else if (s.kind === 'end') { s.el.classList.remove('is-landed'); void s.el.offsetWidth; s.el.classList.add('is-landed'); }
  }

  function update() {
    if (!built || TF.heroOwns) return;
    var sy = window.scrollY;
    var docY = sy + vh * .5;
    var k = ease(clamp((sy - 8) / (vh * .28), 0, 1));
    var hd = headerDot();
    var endS = stations.length && stations[stations.length - 1].kind === 'end' ? stations[stations.length - 1] : null;
    var Peff = docY;
    if (endS) {
      var maxS = Math.max(0, doc.documentElement.scrollHeight - vh);
      var endScroll = Math.min(maxS, endS.top - vh * .5);
      Peff = lerp(docY, yEnd, sm(seg(sy, endScroll - 420, endScroll - 110)));
    }
    var sT = targetS(Peff);
    /* the dot chases where the scroll says it should be: it glides along the line instead of jumping when the line turns */
    var now = performance.now(), dt = lastT ? Math.min(64, now - lastT) : 16; lastT = now;
    if (sCur == null) sCur = sT;
    else {
      var diff = sT - sCur, stp = diff * (1 - Math.exp(-dt / 120)), cap = 2.6 * dt;
      if (Math.abs(stp) > cap) stp = stp < 0 ? -cap : cap;
      sCur += stp; if (Math.abs(sT - sCur) < .4) sCur = sT;
    }
    var more = Math.abs(sT - sCur) > .4;
    if (more && !chaseRaf) { chaseRaf = true; requestAnimationFrame(function () { chaseRaf = false; update(); }); }
    if (more && railSvg) { railSvg.classList.add('is-moving'); clearTimeout(movT); movT = setTimeout(function () { railSvg.classList.remove('is-moving'); }, 380); }

    var Pd = baseEl.getPointAtLength(clamp(sCur, 0, pathLen));
    var rx = Pd.x, ry = Pd.y - sy;   /* the line is built in page coordinates */
    var x = lerp(hd.x, rx, k), y = lerp(hd.y, ry, k);
    var size = lerp(hd.d, ds, k), round = k, shade = k;
    var m = 0, kw = 0, kh = 0, kc = null;
    if (endS) {
      var er = endS.el.getBoundingClientRect(); kw = er.width; kh = er.height;
      kc = { x: er.left + er.width / 2, y: er.top + er.height / 2 };
      m = sm(seg(sCur, pathLen - 30, pathLen));
      if (m > 0) { x = lerp(x, kc.x, m); y = lerp(y, kc.y, m); }
    }
    var keyOn = m >= .995;
    if (endS) endS.el.classList.toggle('is-pending', !keyOn);
    dot.classList.toggle('is-key', m > 0);
    dot.style.opacity = keyOn ? 0 : 1;
    dot.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    dot.style.setProperty('--ds', size.toFixed(1) + 'px');
    var gw = sm(seg(m, .12, 1));
    dot.style.setProperty('--dw', m > 0 ? lerp(size, kw, gw).toFixed(1) + 'px' : '');
    dot.style.setProperty('--dh', m > 0 ? lerp(size, kh, gw).toFixed(1) + 'px' : '');
    dot.style.setProperty('--r-tl', m > 0 ? (19 * m).toFixed(1) + 'px' : '');
    dot.style.setProperty('--r-tr', m > 0 ? lerp(size * .33, 19, m).toFixed(1) + 'px' : '');
    dot.style.setProperty('--r-br', m > 0 ? (19 * m).toFixed(1) + 'px' : '');
    dot.style.setProperty('--r-bl', m > 0 ? (19 * m).toFixed(1) + 'px' : '');
    dot.style.setProperty('--km', m.toFixed(3));
    dot.style.setProperty('--rs', round.toFixed(3));
    dot.style.setProperty('--sh', shade.toFixed(3));
    dot.style.setProperty('--rot', '0rad');
    dot.style.setProperty('--halo', (k > 0 && m < .6 ? .8 : 0).toFixed(2));
    if (pathLen) { glow.forEach(function (g, gi) { var tl = TAILS[gi]; g.style.strokeDasharray = tl + ' ' + (pathLen + 400); g.style.strokeDashoffset = (-(sCur - tl)).toFixed(1); }); }
    if (m > 0) {
      var sh1 = shade;
      dot.style.setProperty('--o1', lerp(0, 5, m).toFixed(2) + 'px');
      dot.style.setProperty('--o2', lerp(0, 3, m).toFixed(2) + 'px');
      dot.style.setProperty('--o3', lerp(size * .22 * sh1, 16, m).toFixed(2) + 'px');
      dot.style.setProperty('--b3', lerp(size * .3 * sh1, 11, m).toFixed(2) + 'px');
      dot.style.setProperty('--a3', lerp(.16 * sh1, .3, m).toFixed(3));
      dot.style.setProperty('--c1', mix('#cdbfb1', '#5A4D7E', m));
      dot.style.setProperty('--c2', mix('#b9aa9a', '#483D66', m));
    } else {
      ['--o1', '--o2', '--o3', '--b3', '--a3', '--c1', '--c2'].forEach(function (n) { dot.style.removeProperty(n); });
    }
    /* the line is drawn behind the dot */
    if (baseEl) {
      if (sCur < 1.5) baseEl.style.opacity = 0;
      else { baseEl.style.opacity = 1; baseEl.style.strokeDasharray = sCur.toFixed(1) + ' ' + (pathLen + 400); }
    }
    /* each element lights when the dot gets there */
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      if (s.opened) continue;
      if (s.kind === 'end' ? keyOn : sCur >= s.sOpen - 1.5) openStation(s);
    }
  }

  TF.dbg = function () { return { st: stations.map(function (q) { return [q.kind, q.top, q.bottom, q.ex, q.sOpen, q.opened]; }), sCur: sCur, pathLen: pathLen, map: map.slice(0, 60), yStart: yStart, yEnd: yEnd }; };
  var movT = null;
  var ticking = false;
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
  TF.dock = function (pop) {
    if (pop) { dot.classList.add('is-pop'); setTimeout(function () { dot.classList.remove('is-pop'); }, 700); }
    update();
  };

  function remeasure() { measure(); update(); }
  var rzT = null;
  function later() { clearTimeout(rzT); rzT = setTimeout(remeasure, 120); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(later);
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(later); ro.observe(main); }
  Array.prototype.forEach.call(doc.querySelectorAll('.lang-toggle'), function (b) { b.addEventListener('click', function () { setTimeout(remeasure, 200); }); });

  measure();
  /* dot sits in the logo until the hero hands it over */
  dot.style.opacity = 1;
  update();
})();
