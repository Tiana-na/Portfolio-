/* About hero: the logo's dot drops into the page and sets off a chain reaction:
   key press -> rail -> sketch -> falling cards -> wireframe -> rail -> UI -> photo (last),
   then the layers converge into one portrait. Drag to rotate; the stack opens as it turns.
   Shapes are the site's own: the logo dot (a flat tile that energizes what it touches), paper layers, one soft trail. */
(function () {
  'use strict';
  var stage = document.getElementById('lhStage');
  var rig = document.getElementById('lhRig');
  if (!stage || !rig) return;

  var TF = window.TF = window.TF || {};
  var lh = document.getElementById('lh');
  var shadow = document.getElementById('lhShadow');
  var layers = Array.prototype.slice.call(rig.querySelectorAll(':scope > .lh-layer'));
  var T = rig.querySelector('.lh-T');
  var head = T.querySelector('.lh-head');
  var role = T.querySelector('.lh-role');
  var imgbox = rig.querySelector('.lh-imgbox'), btn = rig.querySelector('.lh-btn');
  var scrim = rig.querySelector('.lh-scrim'), tscrim = rig.querySelector('.lh-tscrim');
  var skl = Array.prototype.slice.call(rig.querySelectorAll('.lh-skl'));
  var wf = rig.querySelector('.lh-wf'), sketch = rig.querySelector('.lh-sketch'), pic = rig.querySelector('.lh-pic');
  var papers = layers.map(function (L) { return L.querySelector('.lh-paper'); });
  var body = document.getElementById('magBody');
  var dot = document.getElementById('flowDot');
  var logoDot = document.getElementById('logoDot');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(t, a, b) { return Math.min(1, Math.max(0, (t - a) / (b - a))); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function sm(t) { return t * t * (3 - 2 * t); }
  function back(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  /* ---------- timeline (tpl units; real seconds = units / SPEED) ---------- */
  var SPEED = 1.45;
  var T_HAND = 1.9;          /* the dot lands on the first key */
  var T_PRESS = 1.9;
  var T_END = 20.6, T_ASSEMBLED = 18.8;
  var CAM = [[0, -330, -130, 1.5], [2.8, -300, -100, 1.5], [3.5, -205, -55, 1.4], [5.8, -195, -52, 1.4], [7.1, 350, 78, 1.3], [9.0, 370, 90, 1.3], [10.6, 985, 455, 1.2], [12.4, 1010, 470, 1.2], [13.0, 1010, 470, 1.1]];
  var TILT = 58, TURN = -32;

  /* ---------- world ---------- */
  var cam = document.createElement('div'); cam.className = 'lh-cam'; rig.appendChild(cam);
  function el(cls, parent, css) { var e = document.createElement('div'); e.className = cls; (parent || cam).appendChild(e); if (css) e.style.cssText += css; return e; }
  var floor = el('lh-floor');
  layers.forEach(function (L) { cam.appendChild(L); });
  cam.appendChild(T);

  /* the final step is PRINTED: a print head runs back and forth over the stack, row band by row band, first as coarse pixels,
     then a finer pass, and the portrait comes together (drawn on a canvas, fading to the sharp photo at the end) */
  var PW = 380, PH = 475, PN = 17, PDPR = 2;
  var pcv = document.createElement('canvas'); pcv.className = 'lh-print'; pcv.width = PW * PDPR; pcv.height = PH * PDPR; T.insertBefore(pcv, T.firstChild);
  var pctx = pcv.getContext('2d');
  var shade = document.createElement('div'); shade.className = 'lh-shade'; T.insertBefore(shade, pcv.nextSibling);
  var lod = [], imgReady = false;
  (function () {
    var m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(pic).backgroundImage || '');
    if (!m) return;
    var im = new Image();
    im.onload = function () {
      var sc = Math.max(PW / im.width, PH / im.height), sw = PW / sc, sh = PH / sc, sx = (im.width - sw) / 2, sy = (im.height - sh) / 2;
      [[26, 33], [95, 119]].forEach(function (r) {
        var c = document.createElement('canvas'); c.width = r[0]; c.height = r[1];
        var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, sx, sy, sw, sh, 0, 0, r[0], r[1]);
        lod.push(c);
      });
      imgReady = true; if (typeof kick === 'function') kick();
    };
    im.src = m[1];
  })();
  var lastPP = -1, printHead = null, lastHead = null;
  function drawPrint(pp) {
    if (pp === lastPP || !imgReady) return; lastPP = pp;
    pctx.setTransform(PDPR, 0, 0, PDPR, 0, 0); pctx.clearRect(0, 0, PW, PH);
    var bh = PH / PN, passes = [[0, .5], [.34, .84]], head = null;
    for (var k = 0; k < 2; k++) {
      var q = seg(pp, passes[k][0], passes[k][1]); if (q <= 0) continue;
      var bands = q * PN, full = Math.floor(bands), part = bands - full;
      pctx.imageSmoothingEnabled = k === 1;
      var src = lod[k];
      pctx.save(); pctx.beginPath(); pctx.rect(0, PH - Math.min(PH, full * bh), PW, Math.min(PH, full * bh)); 
      if (full < PN && part > 0) { var rtl = full % 2 === 1, w = PW * part; pctx.rect(rtl ? PW - w : 0, PH - (full + 1) * bh, w, bh); head = { x: rtl ? PW - w : w, y: PH - (full + 1) * bh }; }
      pctx.clip(); pctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, PW, PH); pctx.restore();
    }
    printHead = head ? { x: head.x, y: head.y + bh / 2 } : (printHead && pp > 0 && pp < .99 ? printHead : null);
    if (head && pp < .9) { pctx.save(); pctx.fillStyle = 'rgba(255,253,248,.6)'; pctx.fillRect(0, head.y - .5, PW, 1); pctx.restore(); }
  }

  var STAND = 1, STAND_DIR = -1, STAND_CY = 190, STAND_S = .3;
  var SH = [{ x: 0, y: 0, yaw: 0 }, { x: -215, y: -50, yaw: -7 }, { x: 400, y: 70, yaw: 5 }, { x: 1010, y: 470, yaw: -4 }];
  var KA = [-370, -165];

  var ball = el('lh-abs lh-ball'); var ballBody = document.createElement('span'); ballBody.className = 'lh-bbody'; ball.appendChild(ballBody);
  (function () { /* a small extruded tile: the logo's own detail with real depth (stacked slices), lit from the top-left */
    var N = 8;
    for (var k = N; k >= 0; k--) {
      var sl = document.createElement('i'); sl.className = k === 0 ? 'lh-bs lh-bf' : 'lh-bs';
      sl.style.transform = 'translateZ(' + (-k * 1.15).toFixed(2) + 'px)';
      if (k) { var m = k / N; sl.style.background = 'rgb(' + Math.round(222 - 62 * m) + ',' + Math.round(210 - 66 * m) + ',' + Math.round(198 - 72 * m) + ')'; }
      ballBody.appendChild(sl);
    }
  })();
  var ballSh = el('lh-fl', null, 'width:40px;height:16px;margin:-8px 0 0 -20px');

  /* the trail: ONE soft stripe, laid on the floor under the sheets. The dot draws it as it rolls. */

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

  var TRAIL_C = '#D3C4B6';
  var WP = [[-370, -165], [-300, -100], [-200, -55], [-90, -15], [20, 55], [130, 85], [210, 72], [400, 102], [570, 124], [604, 128],
            [657, 174], [711, 274], [765, 374], [818, 420], [884, 440], [948, 455], [1000, 462]];
  var OX = 700, OY = 400;
  var trailExtra = [];
  var trailEl = el('lh-trail'), trailSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), trailPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  trailSvg.setAttribute('width', '1800'); trailSvg.setAttribute('height', '1100'); trailSvg.setAttribute('viewBox', '0 0 1800 1100');
  (function () {
    var d = monoPath(WP.map(function (w) { return [w[0] + OX, w[1] + OY]; }), false);
    trailPath.setAttribute('d', d); trailPath.setAttribute('pathLength', '1');
    trailPath.setAttribute('fill', 'none'); trailPath.setAttribute('stroke', TRAIL_C); trailPath.setAttribute('stroke-width', '4'); trailPath.setAttribute('stroke-linecap', 'round');
    trailPath.style.strokeDasharray = '1 2'; trailPath.style.strokeDashoffset = '1';
    var ns = 'http://www.w3.org/2000/svg';
    var defs = document.createElementNS(ns, 'defs'), flt = document.createElementNS(ns, 'filter');
    flt.setAttribute('id', 'lhBlur'); flt.setAttribute('x', '-20%'); flt.setAttribute('y', '-20%'); flt.setAttribute('width', '140%'); flt.setAttribute('height', '140%');
    var gb = document.createElementNS(ns, 'feGaussianBlur'); gb.setAttribute('stdDeviation', '3'); flt.appendChild(gb); defs.appendChild(flt); trailSvg.appendChild(defs);
    [['shadow', 9, 'rgba(37,31,28,.20)', '3.5px', 'url(#lhBlur)'], ['hi', 1.6, 'rgba(255,255,255,.7)', '-1.2px', null]].forEach(function (c) {
      var q = document.createElementNS(ns, 'path'); q.setAttribute('d', d); q.setAttribute('pathLength', '1'); q.setAttribute('fill', 'none');
      q.setAttribute('stroke', c[2]); q.setAttribute('stroke-width', c[1]); q.setAttribute('stroke-linecap', 'round');
      q.style.strokeDasharray = '1 2'; q.style.strokeDashoffset = '1'; q.style.transform = 'translate(0,' + c[3] + ')'; if (c[4]) q.setAttribute('filter', c[4]);
      trailSvg.appendChild(q); trailExtra.push(q);
    });
    trailSvg.appendChild(trailPath); trailEl.appendChild(trailSvg);
  })();
  var TRAIL_LEN = trailPath.getTotalLength();

  /* wireframe strokes draw themselves */
  var wfShapes = Array.prototype.slice.call(wf.querySelectorAll('path, rect'));
  wfShapes.forEach(function (s) { s.setAttribute('pathLength', '1'); s.style.strokeDasharray = '1'; s.dataset.fo = s.getAttribute('fill-opacity') || '0'; });
  var uiBits = [imgbox, btn].concat(skl);
  /* every layer is BUILT from the bottom up, like a printer: a lavender head line rises through the layer and the content appears under it */
  function mkHead(L) { var h = document.createElement('i'); h.className = 'lh-bh'; L.appendChild(h); return h; }
  var bhS = mkHead(layers[1]), bhW = mkHead(layers[2]), bhU = mkHead(layers[3]);
  var wfOrd = [], wfTop = [];
  (function () {
    var a = wfShapes.map(function (e) { var b; try { b = e.getBBox(); } catch (x) { b = { y: 0, height: 0 }; } return { e: e, top: b.y, bot: b.y + b.height }; });
    a.sort(function (p, q) { return q.bot - p.bot; });
    a.forEach(function (o, i) { o.e._ord = i; });
    wfTop = a.map(function (o) { return o.top; });
  })();
  var uiTop = [];
  (function () {
    uiBits.sort(function (p, q) { return (q.offsetTop + q.offsetHeight) - (p.offsetTop + p.offsetHeight); });
    uiTop = uiBits.map(function (e) { return { y: e.offsetTop, h: e.offsetHeight }; });
  })();
  function headAt(h, yPx, on) { h.style.bottom = (100 - yPx / 475 * 100).toFixed(2) + '%'; h.style.opacity = on ? 1 : 0; }

  /* ---------- ball path ---------- */
  /* the dot rolls to a sheet, stays and BUILDS it (climbing up the sheet as the print head, zig-zagging), slides down, rolls on to the next */
  var WF0 = 7.4, UI0 = 10.9, SK0 = 3.5;
  var T_ROLL0 = 2.3, T_FLY0 = 12.4, T_FLY1 = 14.5, T_PRINT0 = 15.9, T_PRINT1 = 18.5, T_BACK = 19.7;
  var APPEAR = [14.4, 3.2, 6.9, 10.4];
  var TB = [null, [SK0, 5.6], [WF0, WF0 + 12 * .085 + .55], [UI0, UI0 + 3 * .22 + .7]];
  var IN_ = .3, OUT_ = .4;
  var wfBot = 0, wfTop1 = 475, uiBot = 0, uiTop1 = 475;
  (function () {
    wfBot = 0; wfTop1 = 475;
    wfShapes.forEach(function (e) { var b; try { b = e.getBBox(); } catch (x) { return; } wfBot = Math.max(wfBot, b.y + b.height); wfTop1 = Math.min(wfTop1, b.y); });
    uiBot = 0; uiTop1 = 475;
    uiBits.forEach(function (e) { uiBot = Math.max(uiBot, e.offsetTop + e.offsetHeight); uiTop1 = Math.min(uiTop1, e.offsetTop); });
  })();
  /* where (px from the sheet's top) the print head is, per sheet, as a pure function of time; null before/after the build */
  function headY(i, t) {
    var a = TB[i][0], b = TB[i][1];
    if (t <= a || t >= b) return null;
    if (i === 1) { var sr = ease(seg(t, SK0, 5.6)) * 110; return 475 * (1 - Math.min(1, sr / 100)); }
    var p = seg(t, a, b);
    return i === 2 ? lerp(wfBot, wfTop1, p) : lerp(uiBot, uiTop1, p);
  }
  var TRAIL_PT = function (u) { var P = trailPath.getPointAtLength(u * TRAIL_LEN); return [P.x - OX, P.y - OY]; };
  function nearestU(wx, wy) {
    var best = 0, bd = 1e12;
    for (var k = 0; k <= 400; k++) { var P = trailPath.getPointAtLength(k / 400 * TRAIL_LEN), dx = P.x - OX - wx, dy = P.y - OY - wy, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k / 400; } }
    return best;
  }
  function sheetPt(i, lx, h, t) {
    var ap = ease(seg(t, APPEAR[i], APPEAR[i] + .5)), sc = .55 * (.5 + .5 * ap), dz = (1 - ap) * 90;
    var yw = SH[i].yaw * Math.PI / 180, c = Math.cos(yw), sn = Math.sin(yw), X = lx * sc, Y = 26;
    return [SH[i].x + X * c - Y * sn, SH[i].y + X * sn + Y * c, dz + h * sc + 8];
  }
  var UA = [0, 0, 0, 1];
  (function () { UA[1] = nearestU(SH[1].x, SH[1].y + 15); UA[2] = nearestU(SH[2].x, SH[2].y + 15); UA[3] = 1; })();
  /* progress along the trail (0..1): rolls between the sheets, waits while a sheet is being built */
  function uOf(t) {
    if (t < T_ROLL0) return 0;
    if (t < TB[1][0] - IN_) return UA[1] * sm(seg(t, T_ROLL0, TB[1][0] - IN_));
    if (t < TB[2][0] - IN_) return lerp(UA[1], UA[2], sm(seg(t, TB[1][1] + OUT_, TB[2][0] - IN_)));
    return lerp(UA[2], UA[3], sm(seg(t, TB[2][1] + OUT_, TB[3][0] - IN_)));
  }
  function trailU(t) { return uOf(t); }
  function ballPos(t) {
    if (t < T_HAND) return null;
    var u = uOf(t), P = TRAIL_PT(u), d = seg(t, T_HAND, 2.3);
    var pos = [P[0], P[1], 15 + 58 * (1 - d * d)];
    for (var i = 1; i <= 3; i++) {
      var a = TB[i][0], b = TB[i][1];
      if (t < a - IN_ || (i < 3 && t > b + OUT_)) continue;
      var kin = sm(seg(t, a - IN_, a)), kout = sm(seg(t, b, b + OUT_));
      var pr = seg(t, a, b), hy = headY(i, t), h0 = i === 1 ? 0 : 475 - (i === 2 ? wfBot : uiBot);
      var h = hy == null ? (t >= b ? 475 - (i === 1 ? 0 : (i === 2 ? wfTop1 : uiTop1)) : h0) : 475 - hy;
      if (i === 1 && hy == null && t >= b) h = 475;
      var ap = i === 3 ? 1 : (1 - kout);
      var lx = Math.sin(pr * Math.PI * 2 * (i === 1 ? 3.5 : 3)) * 150 * (.2 + .8 * Math.sin(Math.PI * clamp(pr * 1.15, 0, 1))) * ap;
      var Q = sheetPt(i, lx, h * ap, t), w = kin;
      pos = [lerp(pos[0], Q[0], w), lerp(pos[1], Q[1], w), lerp(pos[2], Q[2], w)];
      break;
    }
    return pos;
  }
  function camAt(t) {
    if (t >= CAM[CAM.length - 1][0]) return CAM[CAM.length - 1].slice(1);
    for (var i = 0; i < CAM.length - 1; i++) {
      var a = CAM[i], b = CAM[i + 1];
      if (t >= a[0] && t < b[0]) { var u = sm((t - a[0]) / (b[0] - a[0])); return [1, 2, 3].map(function (q) { return lerp(a[q], b[q], u); }); }
    }
    return CAM[0].slice(1);
  }

  /* ---------- sizing ---------- */
  var uE = 1, uF = 1, stageH = 600, nar = false;
  function measure() {
    var Wc = lh.clientWidth || 360, vw = window.innerWidth, vh = window.innerHeight;
    var desk = vw > 760; nar = !desk;
    var pw = Math.max(220, Math.min(Wc * .96, (vh - 235) * .8, 560));
    var ph = pw * 1.25;
    uF = pw / 380;
    uE = desk ? clamp((vh - 170) / 720, .62, 1) : clamp(vw / 650, .5, .7);
    stageH = Math.round(Math.max(ph + 24, (desk ? 680 : 620) * uE));
    stage.style.height = stageH + 'px';
  }

  /* ---------- state ---------- */
  var px = { x: 0, y: 0 }, tg = { x: 0, y: 0 };
  var ud = { x: 0, y: 0 }, ut = { x: 0, y: 0 };
  var dragging = false, idleTimer = null;
  var t0 = null, started = false, assembledFired = false, released = false, speedMul = 1, tNow = 0, tPrev = 0;
  var target = { x: 0, y: 0, d: 30 }, fin = null;

  function dotShow(x, y, size, sh, rot, o, halo) {
    dot.style.opacity = o;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    dot.style.setProperty('--ds', size + 'px');
    dot.style.setProperty('--sh', sh);
    dot.style.setProperty('--rot', rot + 'rad');
    dot.style.setProperty('--rs', sh);
    dot.style.setProperty('--halo', (halo || 0).toFixed(2));
  }
  function headerDot() {
    var r = logoDot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, d: Math.max(5, r.width) };
  }

  var B = function (e, x, y, z, sc, extra, b, a) { e.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) rotateZ(' + (-b) + 'deg) rotateX(' + (-a) + 'deg) scale(' + sc + ')' + (extra || ''); };
  var F = function (e, x, y, z, rot, sc) { e.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) rotateZ(' + (rot || 0) + 'deg) scale(' + (sc == null ? 1 : sc) + ')'; };

  function render(t) {
    tNow = t;
    var c = camAt(t), cx = c[0], cy = c[1], s = c[2], a = TILT, b = TURN;
    var vis = ease(seg(t, 0, .6));
    var pc = ease(seg(t, 12.8, 15.8));
    cy -= STAND_CY; s *= 1 - STAND_S * (1 - pc); cx *= 1 - pc; cy *= 1 - pc; a *= 1 - pc; b *= 1 - pc; s = lerp(s, 1, pc) * (1 - .4 * Math.sin(Math.PI * pc));
    var pr = seg(t, T_PRINT0, T_PRINT1);                 /* the print: 0 = nothing printed, 1 = portrait complete */
    var pe = ease(seg(pr, .7, 1));               /* (used for the light/shadow changes that follow the print) */
    var o = ease(clamp(Math.abs(ud.y) / 46, 0, 1)) * pc;
    var props = 1 - ease(seg(t, 12.6, 13.6));

    var base = lerp(uE, uF, pc);
    base = base * (1 - o) + uE * o;
    var scl = base * (1 - .08 * o - .2 * clamp(Math.abs(ud.y) / 84, 0, 1));
    stage.style.perspective = Math.round(1600 * base) + 'px';
    rig.style.transform = 'scale(' + scl + ') rotateX(' + (ud.x + px.x) + 'deg) rotateY(' + (ud.y + px.y) + 'deg)';
    rig.style.opacity = vis;
    cam.style.transform = 'scale(' + s + ') rotateX(' + a + 'deg) rotateZ(' + b + 'deg) translate3d(' + (-cx) + 'px,' + (-cy) + 'px,0)';
    floor.style.opacity = props * vis;

    /* the dot rolls and draws its trail */
    var bp = ballPos(t), bs = ease(seg(t, T_HAND - .05, T_HAND + .05)) * (1 - ease(seg(t, T_FLY0, T_FLY0 + .25)));
    if (bp) {
      B(ball, bp[0], bp[1], bp[2], 1, '', b, a);
      ball.style.opacity = bs;
      ballSh.style.opacity = bs * Math.max(0, 1 - bp[2] / 170) * .9; F(ballSh, bp[0], bp[1], .5, 0, 1 + bp[2] / 260);
    } else { ball.style.opacity = 0; ballSh.style.opacity = 0; }
    var tu = t >= T_ROLL0 ? trailU(t) : 0;
    trailPath.style.strokeDashoffset = (1 - tu).toFixed(4); trailExtra.forEach(function (q) { q.style.strokeDashoffset = (1 - tu).toFixed(4); });
    trailEl.style.opacity = props * vis * (tu > 0 ? 1 : 0);

    /* sheets */
    var appear = APPEAR;
    var spread = lerp(70, 1.5, ease(seg(t, 12.8, 15.4)));
    var sp = lerp(spread, 200 * (nar ? .62 : 1), o);
    layers.forEach(function (L, i) {
      var ap = i === 0 ? ease(seg(t, 14.4, 15.6)) : ease(seg(t, appear[i], appear[i] + .5));
      var zi = (i - 1.5) * sp * pc;
      var dz = (1 - ap) * (i ? 90 : 0);
      var x = SH[i].x * (1 - pc), y = SH[i].y * (1 - pc), yaw = SH[i].yaw * (1 - pc);
      var sc = lerp(.55, 1, pc) * (.5 + .5 * ap);
      L.style.opacity = ap;
      /* the sheets STAND (hinged on their bottom edge) while they are built, and tip back to face the viewer when the stack forms */
      var sd = i ? (1 - pc) * STAND : 0;
      L.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (zi + dz) + 'px) rotateZ(' + yaw + 'deg) scale(' + sc + ') translateY(' + (237 * (1 - sd)).toFixed(1) + 'px) rotateX(' + (STAND_DIR * 90 * sd).toFixed(2) + 'deg) translateY(-237px)';
      var shd = 1 - pe;
      var gl = 0;
      if (i > 0) { var ga = TB[i][0], gb = TB[i][1]; gl = .55 * seg(t, ga - .1, ga + .3) * (1 - seg(t, gb, gb + .8)) + .55 * seg(t, gb - .15, gb + .15) * (1 - seg(t, gb + .15, gb + 1.1)); }
      L.style.boxShadow = '0 ' + (14 * shd) + 'px ' + (26 * shd) + 'px rgba(37,31,28,' + (.18 * shd * ap) + '),0 0 0 ' + (o ? 1 : 0) + 'px rgba(37,31,28,' + (.1 * o) + ')' + (gl > 0.01 ? ',0 0 ' + (30 * gl) + 'px ' + (6 * gl) + 'px rgba(183,166,226,' + (.85 * gl) + ')' : '');
      if (i > 0) { papers[i].style.opacity = 1; if (pr * (1 - o) > .62) L.style.opacity = 0; }
    });
    pic.style.filter = 'grayscale(45%) contrast(1.06) brightness(1.03)';
    var sp0 = ease(seg(t, SK0, 5.6)), sr = sp0 * 110;
    sketch.style.webkitMaskImage = sketch.style.maskImage = 'linear-gradient(to top,#000 ' + sr + '%,transparent ' + (sr + 7) + '%)';
    sketch.style.opacity = 1;
    headAt(bhS, 475 * (1 - Math.min(1, sr / 100)), sp0 > 0 && sp0 < .985);
    wfShapes.forEach(function (e) {
      var i = e._ord || 0, k = ease(seg(t, WF0 + i * .085, WF0 + i * .085 + .55));
      e.style.strokeDashoffset = 1 - k; e.setAttribute('fill-opacity', (+e.dataset.fo) * k);
    });
    (function () { var y = headY(2, t); headAt(bhW, y == null ? 0 : y, y != null); })();
    wf.style.opacity = 1;
    uiBits.forEach(function (e, i) {
      var kk = ease(seg(t, UI0 + i * .22, UI0 + i * .22 + .7));
      e.style.opacity = kk > 0 ? 1 : 0; e.style.transform = '';
      e.style.clipPath = kk >= 1 ? 'none' : 'inset(' + ((1 - kk) * 100).toFixed(1) + '% 0 0 0)';
    });
    (function () { var y = headY(3, t); headAt(bhU, y == null ? 0 : y, y != null); })();

    /* headline plane floats above the UI layer; the role line and headline arrive last */
    var hs = ease(seg(t, 18.6, 19.9)), ro = ease(seg(t, 18.0, 19.0));
    var pee = pe * (1 - o);
    scrim.style.opacity = 0; tscrim.style.opacity = 0;
    var Yp = pr * (1 - o);
    drawPrint(Math.round(Yp * 600) / 600);
    pcv.style.opacity = Yp > 0 ? Math.min(1, (1 - seg(Yp, .86, 1))) : 0;
    shade.style.opacity = pee;
    skl.forEach(function (e) { e.style.opacity = Math.min(+e.style.opacity, 1 - hs); });
    var headEm = head.querySelector('em') || head;
    var cc = Math.round(37 + (253 - 37) * pee), c2 = Math.round(31 + (252 - 31) * pee), c3 = Math.round(28 + (248 - 28) * pee);
    var col = 'rgb(' + cc + ',' + c2 + ',' + c3 + ')';
    head.style.color = col; role.style.color = col;
    headEm.style.color = 'rgb(' + Math.round(122 + (231 - 122) * pee) + ',' + Math.round(106 + (224 - 106) * pee) + ',' + Math.round(158 + (243 - 158) * pee) + ')';
    head.style.opacity = hs; head.style.transform = 'translateY(' + (12 * (1 - hs)) + 'px)';
    role.style.opacity = ro;
    head.style.textShadow = '0 ' + (4 + 8 * o) + 'px ' + (14 + 10 * o) + 'px rgba(37,31,28,' + (.2 * (1 - pee)) + '),0 2px 22px rgba(0,0,0,' + (.35 * pee) + ')';
    headEm.style.transform = 'translateZ(' + (10 + 26 * o) + 'px)';
    T.style.opacity = pc > .98 ? 1 : 0;
    T.style.transform = 'translate3d(0,0,' + ((3 - 1.5) * sp * pc + 12 + 54 * o) + 'px)';
    shadow.style.opacity = vis * (1 - .15 * pee) * pc;
    shadow.style.transform = 'translate(-50%,0) scale(' + base + ')';

    /* the dot: from its place in the header down onto the floor - and, when the sheets are done, back up to the header */
    if (!released && TF.heroOwns) {
      var u = seg(t, .25, T_HAND);
      if (t < T_HAND) {
        var S = target.s || headerDot();
        if (u <= 0) dotShow(S.x, S.y, S.d, 0, 0, 1);
        else {
          var gx = lerp(S.x, target.x, eo(u)), gy = lerp(S.y, target.y, Math.pow(u, 2.2));
          dotShow(gx, gy, lerp(S.d, target.d, ease(clamp(u * 1.2, 0, 1))), clamp(u * 2.2, 0, 1), 0, 1, clamp(u * 1.5, 0, 1));
        }
      } else if (t < T_FLY0) { dot.style.opacity = 0; }
      else {
        /* the dot flies to where the portrait will be, waits there, becomes the print head, then goes home */
        var br = ball.getBoundingClientRect(), E = headerDot(), sr = stage.getBoundingClientRect();
        var bx = br.left + br.width / 2, by = br.top + br.height / 2;
        var live = pr > 0 && printHead, cr = pcv.getBoundingClientRect(), csc = (cr.width / PW) || 1;
        /* it flies to where the portrait will END UP (not to the moving stack), hovers there, then becomes the print head */
        var fx = fin ? sr.left + fin.x : cr.left, fy = fin ? sr.top + fin.y : cr.top; if (fin) csc = fin.w / PW || 1;
        var dsz = clamp(24 * csc, 13, 40);
        var hx = fx + 6 * csc, hy = fy - 24 * csc + Math.sin(t * 3.2) * 3;
        if (live) { var kk = ease(seg(pr, 0, .05)); hx = lerp(hx, cr.left + printHead.x * csc, kk); hy = lerp(hy, cr.top + printHead.y * csc, kk); }
        if (t < T_FLY1) {
          var uf = ease(seg(t, T_FLY0, T_FLY1)), ar = Math.sin(Math.PI * uf);
          dotShow(lerp(bx, hx, uf), lerp(by, hy, uf) - 90 * ar, lerp(Math.max(13, br.width * .9), dsz, uf) * (1 + .2 * ar), 1 + 1.4 * ar, -.35 * ar, 1, 1);
          dot.style.opacity = 1;
        } else if (t < T_PRINT1 + .05) {
          dotShow(hx, hy, dsz, 1, 0, 1, 1);
          lastHead = { x: hx, y: hy, d: dsz };
        } else if (t < T_BACK) {
          var ub = ease(seg(t, T_PRINT1 + .05, T_BACK)), L0 = lastHead || { x: hx, y: hy, d: dsz };
          dotShow(lerp(L0.x, E.x, ub), lerp(L0.y, E.y, ub) - 90 * Math.sin(Math.PI * ub), lerp(L0.d, E.d, ub), 1 - ub, 0, 1, 1 - ub);
        }
      }
      if (t >= T_BACK && !released) release();
    }
    if (!assembledFired && t >= T_ASSEMBLED) { assembledFired = true; tryReveal(); }
  }

  function release() {
    if (released) return; released = true;
    try { sessionStorage.setItem('tf-hero-seen', '1'); } catch (e) {}
    TF.heroOwns = false;
    if (TF.dock) TF.dock(false);
  }

  /* where does the 3D ball sit (in the page) when the dot lands on the key? */
  function measureTarget() {
    var keep = { x: ud.x, y: ud.y, px: px.x, py: px.y };
    ud.x = ud.y = px.x = px.y = 0;
    render(T_HAND + .001);
    var r = ball.getBoundingClientRect();
    target.x = r.left + r.width / 2; target.y = r.top + r.height / 2; target.d = Math.max(10, r.width);
    target.s = headerDot();
    /* where the finished portrait sits (relative to the stage), so the dot can fly straight there */
    render(T_PRINT0);
    var cr0 = pcv.getBoundingClientRect(), sr0 = stage.getBoundingClientRect();
    fin = { x: cr0.left - sr0.left, y: cr0.top - sr0.top, w: cr0.width };
    lastHead = null; lastPP = -1;
    render(T_HAND + .001);
    ud.x = keep.x; ud.y = keep.y; px.x = keep.px; px.y = keep.py;
  }

  /* ---------- loop ---------- */
  var raf = null;
  function settled(t) {
    return t >= T_END && !dragging && Math.abs(ud.x - ut.x) < .02 && Math.abs(ud.y - ut.y) < .02 && Math.abs(px.x - tg.x) < .02 && Math.abs(px.y - tg.y) < .02;
  }
  /* real time -> story time: slower while the dot rolls between sheets and while it builds one, so every sheet is seen being made */
  var WARP = [[0, 2.3, 1], [2.3, SK0, .68], [SK0, 5.6, .85], [5.6, WF0, .68], [WF0, TB[2][1], .85], [TB[2][1], UI0, .68], [UI0, TB[3][1], .85], [TB[3][1], 1e9, 1]];
  function warp(r) {
    var acc = 0;
    for (var i = 0; i < WARP.length; i++) {
      var a = WARP[i][0], b = WARP[i][1], k = WARP[i][2], len = (b - a) / k;
      if (r < acc + len) return a + (r - acc) * k;
      acc += len;
    }
    return T_END;
  }
  var T_ENDR = (function () { var acc = 0; for (var i = 0; i < WARP.length - 1; i++) acc += (WARP[i][1] - WARP[i][0]) / WARP[i][2]; return acc + (T_END - WARP[WARP.length - 1][0]); })();
  var tReal = 0, lastNow = 0;
  function frame(now) {
    var dt = lastNow ? Math.min(.05, (now - lastNow) / 1000) : 0; lastNow = now;
    if (started) tReal = Math.min(T_ENDR, tReal + dt * SPEED * speedMul);
    var t = window.__fixed !== undefined ? window.__fixed : Math.min(T_END, warp(tReal));
    px.x += (tg.x - px.x) * .08; px.y += (tg.y - px.y) * .08;
    var f = dragging ? .28 : .06;
    ud.x += (ut.x - ud.x) * f; ud.y += (ut.y - ud.y) * f;
    if (!target.s || (target.s && !released && t < .05)) { if (target.s) target.s = headerDot(); }
    render(Math.max(0, t));
    if (t >= T_END && !stage.classList.contains('lh-done')) { stage.classList.remove('is-playing'); stage.classList.add('lh-done'); release(); }
    raf = settled(t) ? null : requestAnimationFrame(frame);
    lastNow = raf ? now : 0;
  }
  function kick() { if (!raf) { lastNow = 0; raf = requestAnimationFrame(frame); } }

  function play() {
    if (started) return;
    started = true; tReal = 0;
    TF.heroOwns = true;
    document.documentElement.classList.add('dot-away');
    stage.classList.add('is-playing');
    measureTarget();
    kick();
  }
  function skip() { speedMul = 5; kick(); }

  measure();
  rig.style.opacity = 0;
  lh.classList.add('lh-ready');

  if (reduce) {
    started = true; tReal = T_ENDR; stage.classList.add('lh-done');
    render(T_END);
    revealBodyNow();
  } else {
    var scrolledPast = stage.getBoundingClientRect().bottom < 0;
    var seenBefore = false;
    try { seenBefore = sessionStorage.getItem('tf-hero-seen') === '1' && !/[?&]hero=1/.test(location.search) && window.__fixed === undefined; } catch (e) {}
    if (scrolledPast || seenBefore) {
      started = true; tReal = T_ENDR; stage.classList.add('lh-done'); render(T_END); revealBodyNow();
    } else {
      render(0);
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { play(); io.disconnect(); }
        }, { threshold: .35 });
        io.observe(stage);
      } else { play(); }
    }

    /* hover parallax (mouse) */
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || dragging || !started) return;
      tg.y = (e.clientX / innerWidth - .5) * 8; tg.x = -(e.clientY / innerHeight - .5) * 6; kick();
    });
    /* drag to rotate - nearly edge-on both ways, eases back after release */
    var lx = 0, ly = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (!started) return;
      dragging = true; lx = e.clientX; ly = e.clientY; clearTimeout(idleTimer);
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      stage.classList.add('is-dragging'); kick();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      ut.y = clamp(ut.y + dx * .5, -84, 84);
      if (e.pointerType === 'mouse') ut.x = clamp(ut.x - dy * .3, -32, 32);
      kick();
    });
    var end = function () {
      if (!dragging) return;
      dragging = false; stage.classList.remove('is-dragging');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { ut.x = 0; ut.y = 0; kick(); }, 1800);
      kick();
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    /* scrolling on past the hero fast-forwards the chain */
    window.addEventListener('scroll', function () {
      if (started && tNow < T_END && window.scrollY > 90) skip();
    }, { passive: true });
  }

  var rz = null;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { measure(); if (started && tNow < 1.9) measureTarget(); kick(); if (reduce || tNow >= T_END) render(T_END); }, 80);
  });

  /* ---- body: quote lines + cards reveal once the hero has assembled (or the visitor scrolls on) ---- */
  var bodyShown = false;
  function revealBodyNow() { if (body && !bodyShown) { bodyShown = true; body.classList.add('content-in'); } }
  function tryReveal() {
    if (bodyShown || !body) return;
    var ready = assembledFired || reduce || window.scrollY > 80;
    if (ready && body.getBoundingClientRect().top < window.innerHeight * .92) revealBodyNow();
  }
  window.addEventListener('scroll', tryReveal, { passive: true });
  window.addEventListener('resize', tryReveal);

  /* ---- pointer tilt for the two plain cards (desktop only) ---- */
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll('.card-pair .card'), function (e) {
      e.addEventListener('pointermove', function (ev) {
        var r = e.getBoundingClientRect();
        var nx = (ev.clientX - r.left) / r.width - .5, ny = (ev.clientY - r.top) / r.height - .5;
        e.style.setProperty('--ry', (nx * 7).toFixed(2) + 'deg');
        e.style.setProperty('--rx', (-ny * 5).toFixed(2) + 'deg');
        e.classList.add('is-tilting');
      });
      e.addEventListener('pointerleave', function () {
        e.style.setProperty('--ry', '0deg'); e.style.setProperty('--rx', '0deg');
        e.classList.remove('is-tilting');
      });
    });
  }

  /* ---- the inner layer: once the portrait is assembled, the pointer becomes a circle that shows the sketch layer beneath it
     (same framing as the photo, the headline set in ink on paper). Mouse only; off while dragging, and with reduced motion. ---- */
  if (fine && !reduce) (function () {
    var rv = document.createElement('div'); rv.className = 'lh-rv'; rv.setAttribute('aria-hidden', 'true');
    var clip = document.createElement('div'); clip.className = 'lh-rv-clip';
    var ring = document.createElement('div'); ring.className = 'lh-rv-ring';
    function twin(src, cls) {
      var d = document.createElement('div'); d.className = cls; d.innerHTML = src.innerHTML;
      var k = src.getAttribute('data-i18n'); if (k) d.setAttribute('data-i18n', k);
      Array.prototype.forEach.call(d.querySelectorAll('[style]'), function (n) { n.removeAttribute('style'); });   /* the original's animated colours must not follow it here */
      return d;
    }
    clip.appendChild(twin(role, 'lh-role')); clip.appendChild(twin(head, 'lh-head'));
    rv.appendChild(clip); rv.appendChild(ring); T.appendChild(rv);
    var R = 58, cur = { x: 190, y: 237, r: 0 }, tg2 = { x: 190, y: 237, r: 0 }, loop = 0, inside = false;
    function ready() { return stage.classList.contains('lh-done') && !dragging && Math.abs(ud.x) < 1.5 && Math.abs(ud.y) < 1.5; }
    function paint() {
      rv.style.setProperty('--vx', cur.x.toFixed(1) + 'px'); rv.style.setProperty('--vy', cur.y.toFixed(1) + 'px'); rv.style.setProperty('--vr', Math.max(0, cur.r).toFixed(1) + 'px');
      rv.classList.toggle('is-on', cur.r > .8);
    }
    function tick() {
      cur.x += (tg2.x - cur.x) * .38; cur.y += (tg2.y - cur.y) * .38; cur.r += (tg2.r - cur.r) * .2;
      paint();
      if (Math.abs(tg2.x - cur.x) > .2 || Math.abs(tg2.y - cur.y) > .2 || Math.abs(tg2.r - cur.r) > .3) loop = requestAnimationFrame(tick);
      else { loop = 0; cur.x = tg2.x; cur.y = tg2.y; cur.r = tg2.r; paint(); }
    }
    function go() { if (!loop) loop = requestAnimationFrame(tick); }
    function setPeek(on) { document.documentElement.classList.toggle('lh-peek', on); }
    function off() { if (inside) { inside = false; setPeek(false); } tg2.r = 0; go(); }
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !ready()) { if (inside) off(); return; }
      var b = rv.getBoundingClientRect();   /* the plane the circle lives on, so the circle stays under the pointer */
      if (!b.width) return;
      var x = (e.clientX - b.left) / b.width * PW, y = (e.clientY - b.top) / b.height * PH;
      if (x < 0 || y < 0 || x > PW || y > PH) { off(); return; }
      if (!inside) { inside = true; cur.x = tg2.x = x; cur.y = tg2.y = y; setPeek(true); }
      tg2.x = x; tg2.y = y; tg2.r = R; go();
    });
    stage.addEventListener('pointerleave', off);
    stage.addEventListener('pointerdown', off);
  })();

  TF.heroT = function () { return tNow; };
  TF.heroDone = function () { return tNow >= T_END || reduce; };
})();
