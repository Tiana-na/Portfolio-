/* About hero: four layers (photo, sketch, wireframe, UI) floating in depth that
   converge into one portrait. Drag to rotate; the stack opens up as it turns.
   Also handles the depth-in reveal + pointer tilt for the cards below. */
(function () {
  'use strict';
  var stage = document.getElementById('lhStage');
  var rig = document.getElementById('lhRig');
  if (!stage || !rig) return;

  var lh = document.getElementById('lh');
  var shadow = document.getElementById('lhShadow');
  var layers = Array.prototype.slice.call(rig.querySelectorAll('.lh-layer'));
  var T = rig.querySelector('.lh-T');
  var head = T.querySelector('.lh-head');
  var role = T.querySelector('.lh-role');
  var imgbox = rig.querySelector('.lh-imgbox'), btn = rig.querySelector('.lh-btn');
  var scrim = rig.querySelector('.lh-scrim'), tscrim = rig.querySelector('.lh-tscrim');
  var skl = rig.querySelectorAll('.lh-skl');
  var wf = rig.querySelector('.lh-wf'), sketch = rig.querySelector('.lh-sketch');
  var papers = layers.map(function (L) { return L.querySelector('.lh-paper'); });
  var body = document.getElementById('magBody');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(t, a, b) { return Math.min(1, Math.max(0, (t - a) / (b - a))); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var APP = [0, 1.5, 3.0, 4.5];
  var T_END = 11, T_ASSEMBLED = 8.6;

  /* ---- sizing: uE = scale while exploded, uF = scale of the final portrait ---- */
  var uE = 1, uF = 1, stageH = 600, nar = false;
  function measure() {
    var Wc = lh.clientWidth || 360;
    var desk = window.innerWidth > 760;
    nar = !desk;
    var vh = window.innerHeight;
    var pw = Math.max(220, Math.min(Wc * .96, (vh - 235) * .8, 560));
    var ph = pw * 1.25;
    var budget = desk ? Math.min(Wc * 1.35, 760) : Wc;
    uF = pw / 380;
    uE = Math.min(budget / (desk ? 760 : 700), uF);
    stageH = Math.round(Math.max(ph + 24, 640 * uE));
    stage.style.height = stageH + 'px';
  }

  /* ---- interaction state ---- */
  var px = { x: 0, y: 0 }, tg = { x: 0, y: 0 };    /* hover parallax */
  var ud = { x: 0, y: 0 }, ut = { x: 0, y: 0 };    /* user rotation */
  var dragging = false, idleTimer = null;
  var t0 = null, started = false, assembledFired = false;

  function render(t) {
    var vis = ease(seg(t, 0, .7));
    var pr = ease(seg(t, .9, 5.4));
    var p = ease(seg(t, 6.8, 9.6));
    var spreadIn = ease(seg(t, 1.0, 5.4));
    var o = ease(clamp(Math.abs(ud.y) / 46, 0, 1)) * vis;
    var pe = p * (1 - o);
    var drift = Math.sin(t * .8) * 3 * (1 - p) * pr;
    var sm = nar ? .62 : 1;
    var spreadP = 250 * sm * spreadIn * (1 - p) + 1.5 * p;
    var spread = spreadP + (200 * sm * spreadIn - spreadP) * o;
    var rx = 12 * pr * (1 - p) + px.x + ud.x;
    var ry = -(nar ? 38 : 50) * pr * (1 - p) + px.y + ud.y + drift;
    var k = (1 - p) * pr;
    var base = uE * (1 - p) + uF * p;
    base = base * (1 - o) + uE * o;
    var sc = base * (1 - .2 * k - .08 * o - .2 * clamp(Math.abs(ud.y) / 84, 0, 1));
    stage.style.perspective = Math.round(1600 * base) + 'px';
    rig.style.transform = 'translate3d(' + ((nar ? 0 : 40) * k * base) + 'px,' + ((50 * k + 40 * o) * base) + 'px,0) scale(' + sc + ') rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    rig.style.opacity = vis;

    var headEm = head.querySelector('em') || head;   /* re-query: the language switch replaces the headline's HTML */
    var hs = ease(seg(t, 8.9, 10.4));
    head.style.opacity = hs;
    head.style.transform = 'translateY(' + (12 * (1 - hs)) + 'px)';
    var sk = Math.min(1 - ease(seg(pe, .25, .7)), 1 - hs);
    skl[0].style.opacity = skl[1].style.opacity = sk;
    tscrim.style.opacity = ease(seg(pe, .2, .8));
    var c = Math.round(37 + (253 - 37) * pe), c2 = Math.round(31 + (252 - 31) * pe), c3 = Math.round(28 + (248 - 28) * pe);
    var col = 'rgb(' + c + ',' + c2 + ',' + c3 + ')';
    head.style.color = col; role.style.color = col;
    headEm.style.color = 'rgb(' + Math.round(122 + (231 - 122) * pe) + ',' + Math.round(106 + (224 - 106) * pe) + ',' + Math.round(158 + (243 - 158) * pe) + ')';
    scrim.style.opacity = pe;
    imgbox.style.opacity = btn.style.opacity = 1 - ease(seg(pe, .1, .6));

    layers.forEach(function (L, i) {
      var e = ease(seg(t, APP[i], APP[i] + .9));
      var z = (i - 1.5) * spread + (1 - e) * (i ? 120 : 0);
      var x = (i - 1.5) * -10 * (1 - p) * pr * (1 - o);
      var y = -(i - 1.5) * 10 * (1 - p) * pr * (1 - o);
      L.style.opacity = e;
      L.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)';
      if (i > 0) papers[i].style.opacity = 1 - ease(seg(pe, .35, .95));
      var sh = 1 - pe;
      L.style.boxShadow = '0 ' + (18 * sh) + 'px ' + (34 * sh) + 'px rgba(37,31,28,' + (.16 * sh) + '),0 0 0 ' + (o ? 1 : 0) + 'px rgba(37,31,28,' + (.1 * o) + ')';
      if (i === 3) {
        var off = 12 + 16 * (1 - p) + 54 * o;
        T.style.opacity = e;
        T.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (z + off) + 'px)';
        headEm.style.transform = 'translateZ(' + (10 + 22 * (1 - p) + 26 * o) + 'px)';
        head.style.textShadow = '0 ' + (4 + 8 * o) + 'px ' + (14 + 10 * o) + 'px rgba(37,31,28,' + (.2 * (1 - pe)) + '),0 2px 22px rgba(0,0,0,' + (.35 * pe) + ')';
      }
    });
    sketch.style.opacity = 1 - .35 * pe;
    wf.style.opacity = 1 - ease(seg(pe, .2, .95));
    shadow.style.opacity = vis * (1 - .15 * pe) * Math.max(pr, p);
    shadow.style.transform = 'translate(-50%,0) scale(' + (base) + ')';

    if (!assembledFired && t >= T_ASSEMBLED) { assembledFired = true; tryReveal(); }
  }

  /* ---- loop (stops when everything has settled) ---- */
  var raf = null;
  function settled(t) {
    return t >= T_END && !dragging && Math.abs(ud.x - ut.x) < .02 && Math.abs(ud.y - ut.y) < .02 && Math.abs(px.x - tg.x) < .02 && Math.abs(px.y - tg.y) < .02;
  }
  function frame(now) {
    var t = started ? Math.min(T_END, (now - t0) / 1000) : -1;
    px.x += (tg.x - px.x) * .08; px.y += (tg.y - px.y) * .08;
    var f = dragging ? .28 : .06;
    ud.x += (ut.x - ud.x) * f; ud.y += (ut.y - ud.y) * f;
    render(Math.max(0, t));
    raf = settled(t) ? null : requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function play() {
    if (started) return;
    started = true; t0 = performance.now();
    kick();
  }

  measure();
  rig.style.opacity = 0;
  lh.classList.add('lh-ready');

  if (reduce) {
    started = true; t0 = performance.now() - T_END * 1000;
    render(T_END);
    revealBodyNow();
  } else {
    render(0);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { play(); io.disconnect(); }
      }, { threshold: .35 });
      io.observe(stage);
    } else { play(); }

    /* hover parallax (mouse) */
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || dragging || !started) return;
      tg.y = (e.clientX / innerWidth - .5) * 12; tg.x = -(e.clientY / innerHeight - .5) * 8; kick();
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
  }

  var rz = null;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { measure(); kick(); if (reduce) render(T_END); }, 80);
  });

  /* ---- body + cards: reveal once the hero has assembled (or the visitor scrolls on) ---- */
  var bodyShown = false;
  function revealBodyNow() { if (body && !bodyShown) { bodyShown = true; body.classList.add('content-in'); } }
  function tryReveal() {
    if (bodyShown || !body) return;
    var ready = assembledFired || reduce || window.scrollY > 80;
    if (ready && body.getBoundingClientRect().top < window.innerHeight * .92) revealBodyNow();
  }
  window.addEventListener('scroll', tryReveal, { passive: true });
  window.addEventListener('resize', tryReveal);

  /* ---- pointer tilt for cards (desktop only) ---- */
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll('.mag-fact, .card-grid .card'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', (nx * 7).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-ny * 5).toFixed(2) + 'deg');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
        el.classList.remove('is-tilting');
      });
    });
  }
})();
