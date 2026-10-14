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

  /* ================= the dot's ride ================= */
  root.classList.add('dot-away');
  root.classList.add('pw-armed');
  var ds = 22, vw = 0, vh = 0, xg = 0, docW = 0, mainTop = 0, mainLeft = 0, mainH = 0;
  var pts = [], stations = [], yStart = 0, rtl = false, built = false, glow = [], pathLen = 0, lenTab = [];
  var TAILS = [210, 110, 46];
  var dwell = null, dwellRaf = false;   /* the dot stays on each element it lights until the light has spread */
  function lengthAtY(y) {
    if (!lenTab.length) return 0;
    if (y <= lenTab[0][0]) return 0; if (y >= lenTab[lenTab.length - 1][0]) return pathLen;
    var lo = 0, hi = lenTab.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (lenTab[mid][0] <= y) lo = mid; else hi = mid; }
    var a = lenTab[lo], b = lenTab[hi], u = (y - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * u;
  }

  /* page-space box that ignores transforms (the .reveal elements start shifted) */
  function box(el) {
    var l = 0, t = 0, e = el, w = el.offsetWidth, h = el.offsetHeight;
    while (e) { l += e.offsetLeft; t += e.offsetTop; e = e.offsetParent; }
    return { left: l, top: t, right: l + w, bottom: t + h, width: w, height: h };
  }
  function station(kind, el, anchor) { return { kind: kind, el: el, ax: anchor.x, ay: anchor.y, opened: false }; }

  function measure() {
    var sy = window.scrollY, sx = window.scrollX;
    vw = root.clientWidth; vh = window.innerHeight; rtl = isRTL();
    var narrow = window.innerWidth <= 760;
    ds = narrow ? 16 : 22;
    dot.style.setProperty('--ds', ds + 'px');
    var mr = main.getBoundingClientRect();
    mainTop = mr.top + sy; mainLeft = mr.left + sx; mainH = main.offsetHeight; docW = vw;
    var gut = narrow ? 9 : Math.max(14, vw / 2 - 512);
    xg = rtl ? vw - gut : gut;

    stations = [];
    /* every station is met the same way: the dot parks a fixed breath of air beside the element's near edge, at a fixed height from its top */
    var AIR = ds / 2 + (narrow ? 8 : 12), TOPOFF = 28;
    function park(edge) {
      var x = rtl ? edge + AIR : edge - AIR;
      return rtl ? Math.min(x, vw - ds / 2 - 2) : Math.max(x, ds / 2 + 2);
    }
    /* where a stack's near edge really is once it is open (the tilt pulls the cards in, so the plain arithmetic misses) */
    function stackEdge(s) {
      var wasOpen = s.classList.contains('is-open'), e = rtl ? -1e9 : 1e9;
      s.classList.add('stk-measuring'); if (!wasOpen) s.classList.add('is-open');
      void s.offsetWidth;
      Array.prototype.forEach.call(s.querySelectorAll('.stk-card'), function (c) { var r = c.getBoundingClientRect(); e = rtl ? Math.max(e, r.right) : Math.min(e, r.left); });
      if (!wasOpen) s.classList.remove('is-open');
      void s.offsetWidth; s.classList.remove('stk-measuring');
      return e + sx;
    }
    function stackAnchor(s) {
      var r = box(s.querySelector('.stk-stage'));
      return { x: park(stackEdge(s)), y: r.top + TOPOFF };
    }
    var sStory = doc.querySelector('.stk--story'), sSkills = doc.querySelector('.stk--skills');
    if (sStory) { var a = stackAnchor(sStory); stations.push(station('stack', sStory, a)); }
    var chip = doc.querySelector('.quiz-block .pastel-eyebrow-chip');
    if (chip) { var cr = box(chip); var qs = station('quiz', chip.closest('.pastel-accent'), { x: park(rtl ? cr.right : cr.left), y: cr.top + cr.height / 2 }); var qb = box(doc.querySelector('.quiz-block')); qs.ayEnd = Math.max(qs.ay + 10, qb.bottom - 26); stations.push(qs); }
    if (sSkills) { var a2 = stackAnchor(sSkills); stations.push(station('stack', sSkills, a2)); }
    var pair = doc.querySelector('.card-pair');
    if (pair) { var pr = box(pair); stations.push(station('pair', pair, { x: park(rtl ? pr.right : pr.left), y: pr.top + TOPOFF })); }
    var key = doc.querySelector('.about-closing .btn.keycap');
    if (key) { var kr = box(key); stations.push(station('end', key, { x: park(rtl ? kr.right : kr.left), y: kr.top + kr.height * .5 })); }
    stations.forEach(function (s0) {
      var tg = s0.kind === 'quiz' ? (doc.querySelector('.quiz-block') || s0.el) : s0.kind === 'end' ? (doc.querySelector('.about-closing') || s0.el) : s0.el;
      s0.pw = tg; if (tg) tg.classList.add('pw');
    });
    stations.sort(function (p, q) { return p.ay - q.ay; });
    /* keep the "opened" memory across re-measures */
    stations.forEach(function (s) { var o = s.el && s.el.__stOpened; s.opened = !!o; });

    yStart = Math.round(vh * .28 + vh * .5);
    buildPath();
    built = true;
  }


  /* smooth curve through points that never doubles back: b is a monotone-cubic function of a (a strictly increasing); returns SVG 'C' commands */
  function monoPath(P, swap) {
    var Q = [P[0]];
    for (var i = 1; i < P.length; i++) if (P[i][0] - Q[Q.length - 1][0] > .5) Q.push(P[i]);
    var n = Q.length, h = [], dl = [], m = [];
    for (var i = 0; i < n - 1; i++) { h.push(Q[i + 1][0] - Q[i][0]); dl.push((Q[i + 1][1] - Q[i][1]) / h[i]); }
    m[0] = 0; m[n - 1] = 0;
    for (var i = 1; i < n - 1; i++) {
      if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
      else { var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]); }
    }
    function pt(a, b) { return swap ? b.toFixed(1) + ',' + a.toFixed(1) : a.toFixed(1) + ',' + b.toFixed(1); }
    var d = 'M' + pt(Q[0][0], Q[0][1]);
    for (var i = 0; i < n - 1; i++) {
      var a0 = Q[i][0], b0 = Q[i][1], a1 = Q[i + 1][0], b1 = Q[i + 1][1];
      d += 'C' + pt(a0 + h[i] / 3, b0 + m[i] * h[i] / 3) + ' ' + pt(a1 - h[i] / 3, b1 - m[i + 1] * h[i] / 3) + ' ' + pt(a1, b1);
    }
    return d;
  }

  var baseEl = null, Lelbow = 0;
  function buildPath() {
    var hold = 18, dir = rtl ? -1 : 1, Pm = [[yStart, xg]], curX = xg, curY = yStart;
    function sIn(x0, x1, y0, y1) { for (var k = 1; k <= 14; k++) { var u = k / 14; Pm.push([lerp(y0, y1, u), lerp(x0, x1, sm(u))]); } }
    function need(x) { return clamp(.55 * Math.abs(x - xg), 44, 200); }   /* vertical room an S-bend wants so it never turns sharply */
    var endS = null;
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      if (s.kind === 'end') { endS = s; break; }
      var yA = s.ay - hold / 2, yB = (s.ayEnd || s.ay) + hold / 2, avail = yA - curY, wIn = need(s.ax);
      if (curX === xg) {
        var w = Math.min(wIn, Math.max(20, avail)), y0 = Math.max(yA - w, curY + 1);
        if (y0 > curY + .5) Pm.push([y0, xg]);
        sIn(xg, s.ax, y0, yA);
      } else {
        var wOut = need(curX);
        if (avail >= wOut + wIn + 24) {          /* room enough: back to the main line, then out again */
          var y3 = curY + wOut; sIn(curX, xg, curY, y3);
          var y0b = Math.max(yA - wIn, y3 + 1); if (y0b > y3 + .5) Pm.push([y0b, xg]);
          sIn(xg, s.ax, y0b, yA);
        } else sIn(curX, s.ax, curY, Math.max(yA, curY + 2));   /* close together: one gentle S straight across */
      }
      Pm.push([yB, s.ax]); curX = s.ax; curY = yB;
    }
    var narrow = window.innerWidth <= 760;
    function P(p) { return [p[0] - mainTop, p[1] - mainLeft]; }
    var dMono, dFull;
    if (endS) {
      var ay = endS.ay, axE = endS.ax;
      var R = clamp(Math.min(64, Math.abs(axE - xg) * .5), 16, 64);
      if (curX !== xg) { var yo = Math.min(curY + need(curX), ay - R - 6); yo = Math.max(yo, curY + 10); sIn(curX, xg, curY, yo); curX = xg; curY = yo; }
      var yE = Math.max(ay - R, curY + 1); R = ay - yE;
      if (yE > curY + .5) Pm.push([yE, xg]);
      dMono = monoPath(Pm.map(P), true);
      var k0 = .5523, x1 = xg - mainLeft, y1 = yE - mainTop, yA2 = ay - mainTop;
      dFull = dMono + 'C' + x1.toFixed(1) + ',' + (y1 + k0 * R).toFixed(1) + ' ' + (x1 + dir * R * (1 - k0)).toFixed(1) + ',' + yA2.toFixed(1) + ' ' + (x1 + dir * R).toFixed(1) + ',' + yA2.toFixed(1);
      if ((axE - (xg + dir * R)) * dir > 1) dFull += 'L' + (axE - mainLeft).toFixed(1) + ',' + yA2.toFixed(1);
    } else { dMono = dFull = monoPath(Pm.map(P), true); }
    pts = Pm;
    /* draw: ONE soft stripe with round ends - smooth bends, and a rounded corner into the last key */
    railSvg.innerHTML = '<path d="' + dFull + '"/><path class="rg rg3" d="' + dFull + '"/><path class="rg rg2" d="' + dFull + '"/><path class="rg rg1" d="' + dFull + '"/>';
    glow = [railSvg.querySelector('.rg3'), railSvg.querySelector('.rg2'), railSvg.querySelector('.rg1')];
    baseEl = railSvg.querySelector('path');
    var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tmp.setAttribute('d', dMono); Lelbow = tmp.getTotalLength();
    pathLen = baseEl.getTotalLength(); lenTab = [];
    for (var li = 0; li <= 600; li++) { var lp = baseEl.getPointAtLength(pathLen * li / 600); lenTab.push([lp.y, pathLen * li / 600]); }
    baseEl.style.strokeWidth = narrow ? '2.6px' : '3.2px';
    baseEl.style.opacity = 0;   /* stays hidden until the dot has left the hero and starts to ride */
  }

  function mix(a, b, t) {
    var A = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), Bc = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (Bc[i] - v) * t); }).join(',') + ')';
  }
  function xAt(y) {
    if (y <= pts[0][0]) return pts[0][1];
    var last = pts[pts.length - 1];
    if (y >= last[0]) return last[1];
    var lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid][0] <= y) lo = mid; else hi = mid; }
    var a = pts[lo], b = pts[hi], u = (y - a[0]) / Math.max(1e-6, b[0] - a[0]);
    return lerp(a[1], b[1], u);
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
  function openStation(s) {
    s.opened = true; if (s.el) s.el.__stOpened = true;
    land();
    if (s.kind !== 'end') dwell = { x: s.ax, y: s.ay, t0: performance.now(), dur: 1050, blend: 600 };
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
    /* the last stretch: the dot keeps following the rail all the way to the key (even when the page itself stops scrolling), then grows into it */
    var m = 0, kw = 0, kh = 0, m1 = 0, kc = null;
    var docYe = docY;
    if (endS) {
      var maxS = Math.max(0, doc.documentElement.scrollHeight - vh);
      var endScroll = Math.min(maxS, endS.ay - vh * .5);
      endS.at = endScroll;
      m1 = sm(seg(sy, endScroll - 420, endScroll - 110));
      m = sm(seg(sy, endScroll - 120, endScroll - 4));
      docYe = lerp(docY, endS.ay, m1);
      var er = endS.el.getBoundingClientRect(); kw = er.width; kh = er.height;
      kc = { x: er.left + er.width / 2, y: er.top + er.height / 2 };
    }
    var rx = xAt(docYe), ry = docYe - sy, sDot = null;
    if (endS && m1 > 0 && baseEl) {
      /* the last stretch is followed by arc length (it bends round the corner and runs sideways into the key) */
      var sF = Math.min(lengthAtY(docY - mainTop), Lelbow);
      sDot = lerp(sF, pathLen, m1);
      var Pd = baseEl.getPointAtLength(sDot);
      rx = mainLeft + Pd.x; ry = mainTop + Pd.y - sy; docYe = mainTop + Pd.y;
    }
    var x = lerp(hd.x, rx, k), y = lerp(hd.y, ry, k);
    var size = lerp(hd.d, ds, k), round = k, shade = k;
    var rot = 0, docYg = docYe;
    if (dwell && k >= 1 && !m) {
      var el = performance.now() - dwell.t0, wd = el < dwell.dur ? 1 : 1 - ease(clamp((el - dwell.dur) / dwell.blend, 0, 1));
      var ly = dwell.y - sy;
      if (el > dwell.dur + dwell.blend || ly < 28 || ly > vh - 28) dwell = null;
      else { x = lerp(x, dwell.x, wd); y = lerp(y, ly, wd); docYg = lerp(docYe, dwell.y, wd); }
    }
    if (dwell && !dwellRaf) { dwellRaf = true; requestAnimationFrame(function () { dwellRaf = false; update(); }); }
    if (m > 0) { x = lerp(x, kc.x, m); y = lerp(y, kc.y, m); }
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
    dot.style.setProperty('--rot', rot.toFixed(3) + 'rad');
    dot.style.setProperty('--halo', (k > 0 && m < .6 ? .8 : 0).toFixed(2));
    if (pathLen) { var Lh = sDot != null ? sDot : lengthAtY(docYg - mainTop); glow.forEach(function (g, gi) { var tl = TAILS[gi]; g.style.strokeDasharray = tl + ' ' + (pathLen + 400); g.style.strokeDashoffset = (-(Lh - tl)).toFixed(1); }); }
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
    /* the rail grows behind the dot */
    if (baseEl) {
      var Lrev = sDot != null ? sDot : lengthAtY(docYe - mainTop + 3);
      railSvg.style.clipPath = 'none';
      if (Lrev < 1.5) baseEl.style.opacity = 0;
      else { baseEl.style.opacity = 1; baseEl.style.strokeDasharray = Lrev.toFixed(1) + ' ' + (pathLen + 400); }
    }
    /* stations open when the dot reaches them */
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      if (!s.opened && (s.at != null ? sy >= s.at - 6 : docY >= s.ay - 12)) openStation(s);
    }
  }

  var ticking = false;
  var movT = null;
  function onScroll() {
    if (railSvg) { railSvg.classList.add('is-moving'); clearTimeout(movT); movT = setTimeout(function () { railSvg.classList.remove('is-moving'); }, 380); }
    if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
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
  var h0 = headerDot();
  dot.style.opacity = 1;
  update();
  if (TF.heroOwns) { /* hero already started: it positions the dot */ }
})();
