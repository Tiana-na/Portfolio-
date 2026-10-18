/* About hero: the logo's dot drops into the page and travels from station to station along one soft road: it PRINTS the sketch, the wireframe, the UI and, last,
   the photo. With every layer a short caption joins the list under the stage, so by the time the portrait is printed the information is already there.
   Then the layers converge into one portrait. Drag to rotate; the stack opens as it turns. ~9 seconds, skippable. */
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
  var finalEl = document.getElementById('lhFinal'), mBlocks = Array.prototype.slice.call(document.querySelectorAll('#lhBgm .lh-bgb'));
  var skipBtn = document.getElementById('lhSkip'), skipped = false;
  var bgBlocks = Array.prototype.slice.call(document.querySelectorAll('#lhBg .lh-bgb'));
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
  var SPEED = 2.9;
  var T_HAND = 1.9;          /* the dot lands on the first key */
  var T_PRESS = 1.9;
  var T_END = 20.6, T_ASSEMBLED = 18.8;
  var CAM = [[0, -330, -130, 1.5], [2.8, -300, -100, 1.5], [3.5, -205, -55, 1.4], [5.8, -195, -52, 1.4], [7.1, 350, 78, 1.3], [9.0, 370, 90, 1.3], [10.6, 985, 455, 1.2], [12.4, 1010, 470, 1.2], [13.0, 1010, 470, 1.1]];
  var TILT = 64, TURN = -112, YAWADD = -32 - TURN;   /* the world is turned so the road runs INTO the screen; the sheets are turned back by YAWADD so they still face the viewer */

  /* ---------- world ---------- */
  var cam = document.createElement('div'); cam.className = 'lh-cam'; rig.appendChild(cam);
  function el(cls, parent, css) { var e = document.createElement('div'); e.className = cls; (parent || cam).appendChild(e); if (css) e.style.cssText += css; return e; }
  var floor = el('lh-floor');
  layers.forEach(function (L) { cam.appendChild(L); });
  cam.appendChild(T);

  /* the final step is PRINTED: a print head runs back and forth over the stack, row band by row band, first as coarse pixels,
     then a finer pass, and the portrait comes together (drawn on a canvas, fading to the sharp photo at the end) */
  var PW = 380, PH = 475, PN = 17, PDPR = 2;
  var pcv = document.createElement('canvas'); pcv.className = 'lh-print'; pcv.width = 4; pcv.height = 4; T.insertBefore(pcv, T.firstChild);   /* only marks where the portrait sits; the picture itself is built from slabs */
  var shade = document.createElement('div'); shade.className = 'lh-shade'; T.insertBefore(shade, pcv.nextSibling);
  var printHead = null, lastHead = null;
  /* the photo is BUILT, not faded in: a stack of four planes (the wall, the pencil sketch, flat tones, then the colour) that open up in depth.
     The print head goes over each plane top to bottom, row by row; when the last one is done the planes slide together into the picture. */
  var NR = 28, RH = PH / NR;      /* the same fine rows as the other sheets */
  var PL = [], plReady = false, PSTART = [0, .17, .36, .58], PEND4 = [.15, .34, .55, .80], PCOLL = [.80, .95];
  var plBox = document.createElement('div'); plBox.className = 'lh-slabs'; plBox.style.cssText = 'left:0;top:0'; T.insertBefore(plBox, T.firstChild);
  ['wall', 'lines', 'tones', 'colour'].forEach(function (n, i) {
    var d = document.createElement('div'); d.className = 'lh-pl lh-pl--' + n;
    var bar = document.createElement('div'); bar.className = 'lh-bh'; bar.style.opacity = 0; d.appendChild(bar);
    var mk = document.createElement('i'); mk.className = 'lh-hm'; d.appendChild(mk);
    plBox.appendChild(d); PL.push({ el: d, bar: bar, mk: mk, last: '' });
  });
  (function () {
    var n = 0, srcs = ['tiana-L-wall.webp', 'tiana-sketch.webp', 'tiana-L-tones.webp', 'tiana-L-colour.webp'];
    srcs.forEach(function (f) { var im = new Image(); im.onload = im.onerror = function () { if (++n === srcs.length) { plReady = true; if (typeof kick === 'function') kick(); } }; im.src = 'assets/' + f; });
  })();
  var plActive = -1;
  function plRevealed(i, loc) {                             /* clip-path for "rows 0..loc are printed", the unfinished row is a zigzag band */
    if (loc <= 0) return 'inset(0 0 100% 0)'; if (loc >= 1) return 'inset(0)';
    var rows = loc * NR, fl = Math.floor(rows), part = rows - fl, yF = fl / NR * 100, yB = (fl + 1) / NR * 100, w = part * 100;
    return (fl % 2 === 1)
      ? 'polygon(0 0,100% 0,100% ' + yB.toFixed(2) + '%,' + (100 - w).toFixed(2) + '% ' + yB.toFixed(2) + '%,' + (100 - w).toFixed(2) + '% ' + yF.toFixed(2) + '%,0 ' + yF.toFixed(2) + '%)'
      : 'polygon(0 0,100% 0,100% ' + yF.toFixed(2) + '%,' + w.toFixed(2) + '% ' + yF.toFixed(2) + '%,' + w.toFixed(2) + '% ' + yB.toFixed(2) + '%,0 ' + yB.toFixed(2) + '%)';
  }
  function updatePlanes(pp, show, narrow, uf) {
    plBox.style.display = show ? 'block' : 'none';
    if (!show || !plReady) { plActive = -1; return; }
    var open = 0, ry = 0, rx = 0;   /* one flat sheet printed in passes (wall, lines, tones, colour), each over the last - like the other sheets, no depth tilt */
    plBox.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + (-ry).toFixed(2) + 'deg)';
    plActive = -1;
    for (var i = 0; i < 4; i++) {
      var loc = seg(pp, PSTART[i], PEND4[i]), o = PL[i];
      var z = i * .6;
      var tf = 'translate3d(0,0,' + z.toFixed(1) + 'px)';
      var cp = plRevealed(i, loc), key = tf + cp;
      if (key !== o.last) { o.last = key; o.el.style.transform = tf; o.el.style.clipPath = cp; o.el.style.webkitClipPath = cp; }
      o.el.style.opacity = loc > 0 ? 1 : 0;
      var sweeping = loc > 0 && loc < 1;
      if (sweeping) {
        plActive = i;
        var q = seg(loc, 0, .985), rows = q * NR, fl = Math.min(NR - 1, Math.floor(rows)), part = q >= 1 ? 1 : rows - Math.floor(rows), rtl = fl % 2 === 1;
        var hx = (rtl ? 1 - part : part) * PW, hy = (fl + .5) * RH;
        o.mk.style.left = hx.toFixed(1) + 'px'; o.mk.style.top = hy.toFixed(1) + 'px';
        o.bar.style.bottom = (100 - ((fl + 1) * RH + 3) / PH * 100).toFixed(2) + '%'; o.bar.style.opacity = 1;
        printHead = { x: hx, y: hy, el: o.mk };
      } else if (o.bar.style.opacity !== '0') o.bar.style.opacity = 0;
    }
    if (plActive < 0) { if (pp > PEND4[3]) printHead = null; }
  }

  var STAND = 1, STAND_DIR = -1, STAND_CY = 190, STAND_S = .3;
  var SH = [{ x: 0, y: 0, yaw: 0 }, { x: -215, y: -50, yaw: -7 }, { x: 400, y: 70, yaw: 5 }, { x: 1010, y: 470, yaw: -4 }];
  var KA = [-370, -165];

  /* the print head: the logo's tile with real depth (stacked slices), lit from the top-left */
  var ball = el('lh-abs lh-ball'); var ballBody = document.createElement('span'); ballBody.className = 'lh-bbody'; ball.appendChild(ballBody);
  (function () {
    var N = 8;
    for (var k = N; k >= 0; k--) {
      var sl = document.createElement('i'); sl.className = k === 0 ? 'lh-bs lh-bf' : 'lh-bs';
      sl.style.transform = 'translateZ(' + (-k * 1.15).toFixed(2) + 'px)';
      if (k) { var m = k / N; sl.style.background = 'rgb(' + Math.round(222 - 62 * m) + ',' + Math.round(210 - 66 * m) + ',' + Math.round(198 - 72 * m) + ')'; }
      ballBody.appendChild(sl);
    }
  })();
  /* the traveller: a small cube that tumbles along the road, one face at a time */
  var CS = 20;
  var cube = el('lh-abs lh-cube');
  [['translateZ(10px)', '#f6efe6', 1], ['rotateY(180deg) translateZ(10px)', '#c9baa9'], ['rotateY(90deg) translateZ(10px)', '#e4d8cb'], ['rotateY(-90deg) translateZ(10px)', '#d6c8b9'], ['rotateX(90deg) translateZ(10px)', '#ebe0d4'], ['rotateX(-90deg) translateZ(10px)', '#d1c2b2']].forEach(function (f) {
    var q = document.createElement('i'); q.className = 'lh-cf' + (f[2] ? ' lh-cp' : ''); q.style.transform = f[0]; q.style.background = f[1]; cube.appendChild(q);
  });
  var ballSh = el('lh-fl', null, 'width:40px;height:16px;margin:-8px 0 0 -20px');
  var ballSh2 = el('lh-fl', null, 'width:34px;height:14px;margin:-7px 0 0 -17px');

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

  var WP0 = [[-370, -165], [-300, -100], [-200, -55], [-90, -15], [20, 55], [130, 85], [210, 72], [400, 102], [570, 124], [604, 128],
             [657, 174], [711, 274], [765, 374], [818, 420], [884, 440], [948, 455], [1000, 462]];
  /* the road winds: S-curves between the stations (the road passes exactly through each station), seen from behind so it leads away into the depth */
  var WP = (function () {
    function y0(x) { for (var i = 0; i < WP0.length - 1; i++) { var A = WP0[i], B = WP0[i + 1]; if (x >= A[0] && x <= B[0]) return A[1] + (B[1] - A[1]) * (x - A[0]) / (B[0] - A[0]); } return WP0[WP0.length - 1][1]; }
    var ST = [-370, -215, 400, 1000], out = [], amps = [60, 175, 190], px = -.416, py = .909;
    for (var x = -370; x <= 1000; x += 40) {
      var j = x < -215 ? 0 : (x < 400 ? 1 : 2), f = (x - ST[j]) / (ST[j + 1] - ST[j]), l = amps[j] * Math.sin(2 * Math.PI * f) * (j === 0 ? .5 : 1);
      out.push([x + px * l, y0(x) + py * l]);
    }
    out.push([1000, 462]);
    return out;
  })();
  var OX = 700, OY = 400;
  var trailEl = el('lh-trail'), trailSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), trailPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  var TRAIL_LEN = 1600, glowPath = null;
  trailSvg.setAttribute('width', '1800'); trailSvg.setAttribute('height', '1100'); trailSvg.setAttribute('viewBox', '0 0 1800 1100');
  (function () {
    /* one continuous soft road: the reveal mask is the path itself, drawn by the traveller */
    var ns = 'http://www.w3.org/2000/svg';
    var Q = WP.map(function (w) { return [w[0] + OX, w[1] + OY]; }), d = 'M' + Q[0][0].toFixed(1) + ',' + Q[0][1].toFixed(1);
    for (var qi = 0; qi < Q.length - 1; qi++) {                      /* Catmull-Rom -> Bezier: a smooth, winding line (not angular) */
      var P0 = Q[Math.max(0, qi - 1)], P1 = Q[qi], P2 = Q[qi + 1], P3 = Q[Math.min(Q.length - 1, qi + 2)];
      d += 'C' + (P1[0] + (P2[0] - P0[0]) / 6).toFixed(1) + ',' + (P1[1] + (P2[1] - P0[1]) / 6).toFixed(1) + ' ' + (P2[0] - (P3[0] - P1[0]) / 6).toFixed(1) + ',' + (P2[1] - (P3[1] - P1[1]) / 6).toFixed(1) + ' ' + P2[0].toFixed(1) + ',' + P2[1].toFixed(1);
    }
    trailPath.setAttribute('d', d); trailPath.setAttribute('pathLength', '1'); trailPath.setAttribute('fill', 'none');
    trailPath.setAttribute('stroke', '#fff'); trailPath.setAttribute('stroke-width', '80'); trailPath.setAttribute('stroke-linecap', 'butt');
    trailPath.style.strokeDasharray = '1 2'; trailPath.style.strokeDashoffset = '1';
    var defs = document.createElementNS(ns, 'defs'), mk = document.createElementNS(ns, 'mask');
    mk.setAttribute('id', 'lhRoad'); mk.setAttribute('maskUnits', 'userSpaceOnUse'); mk.setAttribute('x', '0'); mk.setAttribute('y', '0'); mk.setAttribute('width', '1800'); mk.setAttribute('height', '1100');
    mk.appendChild(trailPath); defs.appendChild(mk); trailSvg.appendChild(defs);
    TRAIL_LEN = trailPath.getTotalLength();
    var gh = document.createElementNS(ns, 'path'); gh.setAttribute('d', d); gh.setAttribute('fill', 'none'); gh.setAttribute('stroke', '#C9BFB2'); gh.setAttribute('stroke-width', '2'); gh.setAttribute('stroke-linecap', 'round'); gh.setAttribute('stroke-dasharray', '1 8'); gh.setAttribute('opacity', '.4');
    trailSvg.appendChild(gh);                                        /* the road ahead: a faint dotted line that the dot lights up as it passes */
    var g = document.createElementNS(ns, 'g'); g.setAttribute('mask', 'url(#lhRoad)');
    [['#D8CBBE', 3, 'round', null], ['#B7A6E2', 3.4, 'round', 'drop-shadow(0 0 5px rgba(183,166,226,.95))']].forEach(function (c, ci) {
      var q = document.createElementNS(ns, 'path'); q.setAttribute('d', d); q.setAttribute('pathLength', '1'); q.setAttribute('fill', 'none');
      q.setAttribute('stroke', c[0]); q.setAttribute('stroke-width', c[1]); q.setAttribute('stroke-linecap', c[2]);
      if (c[3]) q.style.filter = c[3];
      if (ci) glowPath = q;
      g.appendChild(q);
    });
    trailSvg.appendChild(g); trailEl.appendChild(trailSvg);
  })();

  /* every layer is PRINTED: the dot runs back and forth over it, row by row from the bottom, and the real content appears behind it */
  var PN2 = 28, PEND = .96, BH2 = PH / PN2;          /* many thin rows, like a real print: the head sweeps across, the paper advances */
  var SP = [null, null, null, null], uiEls = [imgbox, btn].concat(skl);
  function mkHead(L) { var h = document.createElement('i'); h.className = 'lh-bh'; L.appendChild(h); return h; }
  var BHD = [null, mkHead(layers[1]), mkHead(layers[2]), mkHead(layers[3])];
  var realEl = [null, sketch, wf, layers[3].querySelector('.lh-ui')];
  function mkSP(i) {
    var cv = document.createElement('canvas'); cv.className = 'lh-sp'; cv.width = PW * PDPR; cv.height = PH * PDPR;
    layers[i].insertBefore(cv, BHD[i]);
    SP[i] = { cv: cv, ctx: cv.getContext('2d'), src: null, last: -1, ready: false };
  }
  function setSrc(i, drawSrc) {
    var o = SP[i], c = document.createElement('canvas'); c.width = PW * PDPR; c.height = PH * PDPR;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; drawSrc(x, c.width, c.height);
    o.src = c; o.ready = true; o.last = -1; if (typeof kick === 'function') kick();
  }
  function svgImage(str, cb) { var im = new Image(); im.onload = function () { cb(im); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str); }
  function loadSketch() {
    var m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(sketch).backgroundImage || ''); if (!m) return;
    var im = new Image();
    im.onload = function () {
      var sc = Math.max(PW / im.width, PH / im.height), sw = PW / sc, sh = PH / sc, sx = (im.width - sw) / 2, sy = (im.height - sh) / 2;
      setSrc(1, function (x, w, h) { x.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); });
    };
    im.src = m[1];
  }
  function loadWf() {
    var c = wf.cloneNode(true); c.removeAttribute('class'); c.removeAttribute('style');
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('width', PW * PDPR); c.setAttribute('height', PH * PDPR);
    Array.prototype.forEach.call(c.querySelectorAll('*'), function (e) { e.removeAttribute('style'); e.removeAttribute('pathLength'); });
    svgImage(new XMLSerializer().serializeToString(c), function (im) { setSrc(2, function (x, w, h) { x.drawImage(im, 0, 0, w, h); }); });
  }
  function loadUi() {
    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + PW * PDPR + '" height="' + PH * PDPR + '" viewBox="0 0 ' + PW + ' ' + PH + '">'];
    uiEls.forEach(function (e) {
      var cs = getComputedStyle(e), bw = parseFloat(cs.borderTopWidth) || 0, r = Math.max(0, (parseFloat(cs.borderTopLeftRadius) || 0) - bw / 2);
      parts.push('<rect x="' + (e.offsetLeft + bw / 2) + '" y="' + (e.offsetTop + bw / 2) + '" width="' + (e.offsetWidth - bw) + '" height="' + (e.offsetHeight - bw) + '" rx="' + r + '" fill="' + cs.backgroundColor + '" stroke="' + (bw ? cs.borderTopColor : 'none') + '" stroke-width="' + bw + '"/>');
    });
    parts.push('</svg>');
    svgImage(parts.join(''), function (im) { setSrc(3, function (x, w, h) { x.drawImage(im, 0, 0, w, h); }); });
  }
  [1, 2, 3].forEach(mkSP);
  try { loadSketch(); loadWf(); loadUi(); } catch (e) {}

  function bandAt(q) {
    var bands = q * PN2, fl = Math.min(PN2 - 1, Math.floor(bands)), part = q >= 1 ? 1 : bands - Math.floor(bands), rtl = fl % 2 === 1, w = PW * part;
    return { x: rtl ? PW - w : w, y: (fl + .5) * BH2, top: fl * BH2 };
  }
  /* where the head is for a print progress pp (0..1) */
  function headAtPP(pp) { return pp <= 0 || pp >= 1 ? null : bandAt(seg(pp, 0, PEND)); }
  function drawSP(i, pp) {
    var o = SP[i]; if (!o || !o.ready) return;
    pp = Math.round(pp * 400) / 400; if (pp === o.last) return; o.last = pp;
    var x = o.ctx; x.setTransform(PDPR, 0, 0, PDPR, 0, 0); x.clearRect(0, 0, PW, PH);
    var q = seg(pp, 0, PEND); if (q <= 0) return;
    var bands = q * PN2, fl = q >= 1 ? PN2 : Math.floor(bands), part = q >= 1 ? 0 : bands - fl;
    x.imageSmoothingEnabled = true; x.save(); x.beginPath(); x.rect(0, 0, PW, fl * BH2);
    if (fl < PN2 && part > 0) { var rtl = fl % 2 === 1, w = PW * part; x.rect(rtl ? PW - w : 0, fl * BH2, w, BH2); }
    x.clip(); x.drawImage(o.src, 0, 0, o.src.width, o.src.height, 0, 0, PW, PH); x.restore();
  }
  function headAt(h, yPx, on) { h.style.bottom = (100 - yPx / 475 * 100).toFixed(2) + '%'; h.style.opacity = on ? 1 : 0; }
  /* ---------- ball path ---------- */
  /* the traveller tumbles along the road to a sheet, becomes the print head and PRINTS it row by row, then goes on as a cube again */
  var WF0 = 7.4, UI0 = 10.9, SK0 = 3.5;
  var T_ROLL0 = 2.3, T_FLY0 = 12.4, T_FLY1 = 14.5, T_PRINT0 = 15.9, T_PRINT1 = 18.5, T_BACK = 19.7;
  var APPEAR = [14.4, 3.2, 6.9, 10.4];
  var TB = [null, [SK0, 5.7], [WF0, 9.2], [UI0, 12.3]];
  var IN_ = .3, OUT_ = .4;
  var TRAIL_PT = function (u) { var P = trailPath.getPointAtLength(u * TRAIL_LEN); return [P.x - OX, P.y - OY]; };
  function nearestU(wx, wy) {
    var best = 0, bd = 1e12;
    for (var k = 0; k <= 400; k++) { var P = trailPath.getPointAtLength(k / 400 * TRAIL_LEN), dx = P.x - OX - wx, dy = P.y - OY - wy, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k / 400; } }
    return best;
  }
  function sheetPt(i, lx, h, t) {
    var ap = ease(seg(t, APPEAR[i], APPEAR[i] + .5)), sc = .55 * (.5 + .5 * ap), dz = (1 - ap) * 90;
    var yw = (SH[i].yaw + YAWADD) * Math.PI / 180, c = Math.cos(yw), sn = Math.sin(yw), X = lx * sc, Y = 26;
    return [SH[i].x + X * c - Y * sn, SH[i].y + X * sn + Y * c, dz + h * sc + 8];
  }
  var UA = [0, 0, 0, 1];
  (function () { UA[1] = nearestU(SH[1].x, SH[1].y + 26); UA[2] = nearestU(SH[2].x, SH[2].y + 26); UA[3] = 1; })();
  /* progress along the road (0..1): moves between the sheets, waits while a sheet is being printed */
  function gb(x) { return .45 * sm(x) + .55 * (1 - Math.pow(1 - x, 3)); }   /* quick on the gas, long soft brake into the sheet */
  function uOf(t) {
    if (t < T_ROLL0) return 0;
    if (t < TB[1][0] - IN_) return UA[1] * gb(seg(t, T_ROLL0, TB[1][0] - IN_));
    if (t < TB[2][0] - IN_) return lerp(UA[1], UA[2], gb(seg(t, TB[1][1] + OUT_, TB[2][0] - IN_)));
    return lerp(UA[2], UA[3], gb(seg(t, TB[2][1] + OUT_, TB[3][0] - IN_)));
  }
  function trailU(t) { return uOf(t); }
  /* a cube rolling without slipping: whole quarter-turns per stretch, so it always rests flat where it stops */
  var SEGU = [[0, 0], [0, 0], [0, 0]], SEGN = [0, 0, 0], SEGC = [0, 0, 0];
  (function () {
    var us = [0, UA[1], UA[2], UA[3]], cum = 0;
    for (var i = 0; i < 3; i++) { SEGU[i] = [us[i], us[i + 1]]; SEGN[i] = Math.max(1, Math.round((us[i + 1] - us[i]) * TRAIL_LEN / CS)); SEGC[i] = cum; cum += SEGN[i]; }
  })();
  function cubeAt(u) {
    var i = u >= SEGU[2][0] ? 2 : (u >= SEGU[1][0] ? 1 : 0), a = SEGU[i][0], b = SEGU[i][1], n = SEGN[i], len = (b - a) * TRAIL_LEN, s = len / n;
    var L = clamp(u - a, 0, b - a) * TRAIL_LEN, k = Math.min(n - 1, Math.floor(L / s + 1e-6)), r = L - k * s, lo = 0, hi = Math.PI / 2, ph = 0;
    if (L >= len - 1e-6) { k = n - 1; r = s; }
    for (var q = 0; q < 14; q++) { ph = (lo + hi) / 2; var xr = s / 2 * (1 - Math.cos(ph) + Math.sin(ph)); if (xr < r) lo = ph; else hi = ph; }
    var P0 = TRAIL_PT(clamp(u - .004, 0, 1)), P1 = TRAIL_PT(clamp(u + .004, 0, 1));
    return { roll: (SEGC[i] + k + ph / (Math.PI / 2)) * 90, h: s / 2 * (Math.sin(ph) + Math.cos(ph)) * (CS / s), head: Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) * 180 / Math.PI };
  }
  function ballState(t) {
    if (t < T_HAND) return null;
    var u = uOf(t), P = TRAIL_PT(u), d = seg(t, T_HAND, 2.3), cs = cubeAt(u);
    var st = { cx: P[0], cy: P[1], cz: cs.h + 58 * (1 - d * d), roll: cs.roll, head: cs.head, cv: 1, tile: null, tv: 0 };
    for (var i = 1; i <= 3; i++) {
      var a = TB[i][0], b = TB[i][1];
      if (t < a - IN_ || (i < 3 && t > b + OUT_)) continue;
      var kin = sm(seg(t, a - IN_, a)), kout = i === 3 ? 0 : sm(seg(t, b, b + OUT_));
      var hd = headAtPP(seg(t, a, b));
      var fin = t >= b;                                    /* printed: the head rests at the top */
      var lx = hd ? hd.x - PW / 2 : (fin ? PW / 2 : -PW / 2 + 20), h = hd ? PH - hd.y : (fin ? PH : 10);
      lx *= (1 - kout); h *= (1 - kout);
      st.tile = sheetPt(i, lx, h, t); st.tv = kin * (1 - kout * .9);
      st.cv = clamp(1 - kin + (i < 3 ? sm(seg(t, b + OUT_ * .5, b + OUT_)) : 0), 0, 1);
      break;
    }
    return st;
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
    var pw = Math.max(220, Math.min(Wc * .96, (vh - (desk ? 385 : 235)) * .8, 560));   /* on a laptop the captions row has to fit under the portrait */
    var ph = pw * 1.25;
    uF = pw / 380;
    uE = desk ? clamp((vh - 170) / 720 * .8, .5, .85) : clamp(vw / 650, .5, .7);   /* a little smaller on a laptop so the captions row fits under the stage */
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
    var c = camAt(t), cx = c[0], cy = c[1], s = c[2] * (nar ? .8 : 1), a = TILT, b = TURN;   /* the camera moves only while the dot travels; it rests while a sheet prints */
    var vis = ease(seg(t, 0, .6));
    var pc = ease(seg(t, 12.8, 15.8));
    cx += STAND_CY * Math.sin(-TURN * Math.PI / 180); cy -= STAND_CY * Math.cos(-TURN * Math.PI / 180); s *= 1 - STAND_S * (1 - pc);   /* aim at the middle of the standing sheet (screen-up, whichever way the world is turned) */ cx *= 1 - pc; cy *= 1 - pc; a *= 1 - pc; b *= 1 - pc; s = lerp(s, 1, pc) * (1 - .4 * Math.sin(Math.PI * pc));
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

    /* the dot: the logo's own tile glides along the line (no tumbling), lighting it as it goes, and becomes the print head on each sheet */
    var bst = ballState(t), bs = ease(seg(t, T_HAND - .05, T_HAND + .05)) * (1 - ease(seg(t, T_FLY0, T_FLY0 + .25)));
    cube.style.opacity = 0; ballSh.style.opacity = 0;
    if (bst) {
      var dd = seg(t, T_HAND, 2.3), wgt = bst.tile && bst.tv > .01 ? clamp(bst.tv, 0, 1) : 0;
      var gx = bst.cx, gy = bst.cy, gz = 12 + 58 * (1 - dd * dd);
      if (wgt) { gx = lerp(gx, bst.tile[0], wgt); gy = lerp(gy, bst.tile[1], wgt); gz = lerp(gz, bst.tile[2], wgt); }
      B(ball, gx, gy, gz, 1.55, '', b, a); ball.style.opacity = bs;
      ballSh2.style.opacity = bs * .35; F(ballSh2, gx, gy, .5, 0, 1 + gz / 200);
    } else { ball.style.opacity = 0; ballSh2.style.opacity = 0; }
    var tu = t >= T_ROLL0 ? trailU(t) : 0;
    trailPath.style.strokeDashoffset = (1 - tu).toFixed(4);
    var gst = Math.max(0, tu - .16);                                 /* the stretch the dot has just passed glows, then settles to the calm colour */
    glowPath.style.strokeDasharray = (tu - gst).toFixed(4) + ' 2'; glowPath.style.strokeDashoffset = (-gst).toFixed(4);
    trailEl.style.opacity = props * vis * ease(seg(t, T_HAND - .3, T_HAND + .3));

    /* sheets */
    var appear = APPEAR;
    var spread = lerp(70, 1.5, ease(seg(t, 12.8, 15.4)));
    var sp = lerp(spread, 200 * (nar ? .62 : 1), o);
    layers.forEach(function (L, i) {
      var ap = i === 0 ? ease(seg(t, 14.4, 15.6)) : ease(seg(t, appear[i], appear[i] + .5));
      var zi = (i - 1.5) * sp * pc;
      var dz = (1 - ap) * (i ? 90 : 0);
      var x = SH[i].x * (1 - pc), y = SH[i].y * (1 - pc), yaw = (SH[i].yaw + YAWADD) * (1 - pc);
      var sc = lerp(.55, 1, pc) * (.5 + .5 * ap);
      var gone = (i > 0 && i < 3) ? .5 * seg(t, TB[i][1] + .1, TB[i][1] + .9) * (1 - seg(t, 12.8, 14.2)) : 0;     /* a sheet the dot has left recedes, so it never looms over the next one */
      L.style.opacity = ap * (1 - gone) * (i > 0 ? Math.max(1 - ease(seg(pr, .03, .2)), o) : 1);   /* turning the finished portrait opens the stack: all four layers come back, one behind the other */   /* the old sheets give way as the new stack is printed over them */
      /* the sheets STAND (hinged on their bottom edge) while they are built, and tip back to face the viewer when the stack forms */
      var sd = i ? (1 - pc) * STAND : 0;
      L.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (zi + dz) + 'px) rotateZ(' + yaw + 'deg) scale(' + sc + ') translateY(' + (237 * (1 - sd)).toFixed(1) + 'px) rotateX(' + (STAND_DIR * 90 * sd).toFixed(2) + 'deg) translateY(-237px)';
      var shd = i > 0 ? Math.max(1 - pe, o * .8) : 1 - pe;
      var gl = 0;
      if (i > 0) { var ga = TB[i][0], gb = TB[i][1]; gl = .55 * seg(t, ga - .1, ga + .3) * (1 - seg(t, gb, gb + .8)) + .55 * seg(t, gb - .15, gb + .15) * (1 - seg(t, gb + .15, gb + 1.1)); }
      L.style.boxShadow = '0 ' + (14 * shd) + 'px ' + (26 * shd) + 'px rgba(37,31,28,' + (.18 * shd * ap) + '),0 0 0 ' + (o ? 1 : 0) + 'px rgba(37,31,28,' + (.1 * o) + ')' + (gl > 0.01 ? ',0 0 ' + (30 * gl) + 'px ' + (6 * gl) + 'px rgba(183,166,226,' + (.85 * gl) + ')' : '');
      if (i > 0) { papers[i].style.opacity = 1; if (pr * (1 - o) > .97) L.style.opacity = 0; }   /* at rest only the portrait; the sheets show again as the stack opens when it is turned */
    });
    pic.style.filter = 'grayscale(45%) contrast(1.06) brightness(1.03)';
    for (var si = 1; si <= 3; si++) {
      var spp = seg(t, TB[si][0], TB[si][1]), real = realEl[si], so = SP[si], hd = headAtPP(spp);
      var fadeIn = ease(seg(spp, .94, 1));
      if (so && so.ready) {
        drawSP(si, spp);
        so.cv.style.opacity = spp > 0 ? 1 - fadeIn : 0;
        real.style.opacity = fadeIn;
      } else { real.style.opacity = ease(seg(spp, .3, 1)); }
      headAt(BHD[si], hd ? hd.top + BH2 + 3 : 0, !!hd);
    }

    /* the text of each layer is written beside it while it is printed (only text that is already on the page): one block at a time, revealed in step with
       the print and gone before the next layer starts. On a phone it is written under the stage. The last text is written under the photo as it is printed. */
    var srect = stage.getBoundingClientRect();
    var blocks = nar ? mBlocks : bgBlocks;
    for (var bi = 0; bi < blocks.length; bi++) {
      var be = blocks[bi], t0b = TB[bi + 1][0], t1b = TB[bi + 1][1], tin = t0b - .15, tout = bi < 2 ? TB[bi + 2][0] - .3 : T_FLY0 - .2;
      var vis2 = ease(seg(t, tin, tin + .45)) * (1 - ease(seg(t, tout, tout + .5)));
      if (vis2 <= .001) { if (be.style.opacity !== '0') be.style.opacity = 0; be._side = null; continue; }
      var rv2 = ease(seg(seg(t, t0b, t1b), 0, .7));
      be.style.opacity = vis2.toFixed(3);
      be.style.clipPath = 'inset(0 0 ' + ((1 - rv2) * 100).toFixed(1) + '% 0)';
      if (nar) continue;
      /* beside the layer it belongs to, on the side with more room */
      var anchor = layers[bi + 1], ar = anchor.getBoundingClientRect(), bw = be.offsetWidth, bh = be.offsetHeight;
      if (!be._side && t >= t0b - .05) be._side = (ar.left - srect.left) > (srect.right - ar.right) ? 'l' : 'r';
      var side = be._side || ((ar.left - srect.left) > (srect.right - ar.right) ? 'l' : 'r');
      var bx = side === 'l' ? ar.left - srect.left - bw - 36 : ar.right - srect.left + 36;
      var vwHi = Math.min(srect.width, window.innerWidth - srect.left) - bw - 6, vwLo = Math.max(6, 6 - srect.left);
      bx = clamp(bx, vwLo, Math.max(vwLo, vwHi));
      var by = clamp(ar.top - srect.top + 14, 6, Math.max(6, srect.height - bh - 6));
      be.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0)';
    }
    if (finalEl && !finalEl._on) {
      var fr = ease(seg(pr, .06, .9));
      finalEl.style.opacity = fr < .01 ? 0 : 1;
      finalEl.style.clipPath = fr >= .999 ? 'none' : 'inset(0 0 ' + ((1 - fr) * 100).toFixed(1) + '% 0)';
    }

    if (skipBtn) skipBtn.classList.toggle('is-show', started && t > 2.2 && t < T_BACK && !skipped);

    /* headline plane floats above the UI layer; the role line and headline arrive last */
    var hs = ease(seg(t, 18.6, 19.9)), ro = ease(seg(t, 18.0, 19.0));
    var pee = pe * (1 - o);
    scrim.style.opacity = 0; tscrim.style.opacity = 0;
    var Yp = pr * (1 - o);
    pcv.style.opacity = 0;
    updatePlanes(pr, pr > 0 && pr < .985 && o < .02, nar, uF);
    pic.style.opacity = plReady ? ease(seg(pr, .93, .985)) : ease(seg(pr, .3, 1));
    shade.style.opacity = pee;
    skl.forEach(function (e) { e.style.opacity = 1 - hs; });
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
        if (live) { var kk = ease(seg(pr, 0, .05)), mr = printHead.el.getBoundingClientRect(); hx = lerp(hx, mr.left + mr.width / 2, kk); hy = lerp(hy, mr.top + mr.height / 2, kk); }
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
    lastHead = null;
    render(T_HAND + .001);
    ud.x = keep.x; ud.y = keep.y; px.x = keep.px; px.y = keep.py;
  }

  /* ---------- loop ---------- */
  var raf = null;
  function settled(t) {
    return t >= T_END && !dragging && Math.abs(ud.x - ut.x) < .02 && Math.abs(ud.y - ut.y) < .02 && Math.abs(px.x - tg.x) < .02 && Math.abs(px.y - tg.y) < .02;
  }
  /* real time -> story time: slower while the dot rolls between sheets and while it builds one, so every sheet is seen being made */
  /* two speeds: the journey between sheets is slow and calm (about 1.5 s each); only the printing itself runs fast */
  var WARP = [[0, 2.3, .95], [2.3, SK0, .36], [SK0, TB[1][1], .76], [TB[1][1], WF0, .4], [WF0, TB[2][1], .69], [TB[2][1], UI0, .4], [UI0, TB[3][1], .64], [TB[3][1], T_PRINT0, .95], [T_PRINT0, T_PRINT1, .5], [T_PRINT1, 1e9, 1.5]];
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
    revealBodyNow();
    measureTarget();
    kick();
  }
  function skip() { if (!started || skipped || tNow >= T_END) return; skipped = true; speedMul = 6; kick(); }
  if (skipBtn) skipBtn.addEventListener('click', function (e) { e.preventDefault(); skip(); });
  function showAllSteps() { if (finalEl) { finalEl._on = true; finalEl.style.opacity = 1; finalEl.style.clipPath = 'none'; } }

  measure();
  rig.style.opacity = 0; if (finalEl) finalEl.style.opacity = 0;
  lh.classList.add('lh-ready');

  if (reduce) {
    started = true; tReal = T_ENDR; stage.classList.add('lh-done');
    showAllSteps(); render(T_END);
    revealBodyNow();
  } else {
    var scrolledPast = stage.getBoundingClientRect().bottom < 0;
    var seenBefore = false;
    try { seenBefore = sessionStorage.getItem('tf-hero-seen') === '1' && !/[?&]hero=1/.test(location.search) && window.__fixed === undefined; } catch (e) {}
    if (scrolledPast || seenBefore) {
      started = true; tReal = T_ENDR; stage.classList.add('lh-done'); showAllSteps(); render(T_END); revealBodyNow();
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
      if (tNow < T_END) { skip(); return; }      /* while it is still printing, a tap on the stage skips */
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

  /* ---- the inner layer: once the portrait is assembled, the pointer becomes a dot-shaped window (the logo tile) that shows the sketch layer beneath it
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
    /* design notes on the sketch: found only through the window. Short enough to sit whole inside it (window ~116 units).
       English only, on purpose. a = anchor on the feature, l = label box (plane units, 380 x 475). */
    var NOTES = [
      { a: [212, 110], l: [120, 96],  t: 'User research<br>mode: on' },
      { a: [204, 152], l: [128, 146], t: 'Extrovert' },      /* the side you see */
      { a: [286, 94],  l: [298, 70],  t: 'Introvert' },      /* the side you don't */
      { a: [304, 166], l: [300, 186], t: 'Do not<br>disturb' },
      { a: [134, 333], l: [64, 350],  t: 'Coffee: just<br>out of frame' },
      { a: [200, 238], l: [146, 250], t: 'Hidden potential.<br>You found it.' }   /* dead centre: where the window first opens */
    ];
    var notes = document.createElement('div'); notes.className = 'lh-notes'; notes.setAttribute('dir', 'ltr');
    NOTES.forEach(function (n) {
      var lab = document.createElement('span'); lab.className = 'lh-note';
      lab.style.left = n.l[0] + 'px'; lab.style.top = n.l[1] + 'px'; lab.innerHTML = n.t;
      var pin = document.createElement('i'); pin.className = 'lh-note-pin';
      pin.style.left = n.a[0] + 'px'; pin.style.top = n.a[1] + 'px';
      notes.appendChild(pin); notes.appendChild(lab);
    });
    clip.appendChild(notes);
    rv.appendChild(clip); rv.appendChild(ring); T.appendChild(rv);
    var R = 68, cur = { x: 190, y: 237, r: 0 }, tg2 = { x: 190, y: 237, r: 0 }, loop = 0, inside = false;
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
