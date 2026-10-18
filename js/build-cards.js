/* The info cards on About are BUILT by the line's dot. The dot arrives at a station and the card is drawn as a wireframe
   (a dashed block where every line of text and every chip will be); then a print head runs down from the top edge, the way the dot came:
   the blocks wipe away under it and the real content is printed top to bottom. Plays once per card.
   The text stays in the DOM the whole time; with reduced motion (or if the line engine is missing) nothing is hidden for long. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var doc = document, TF = window.TF = window.TF || {};
  var SEL = '.stk--story .stk-card:first-child, .stk--skills .stk-card:first-child, .card-pair .card';
  var cards = Array.prototype.slice.call(doc.querySelectorAll(SEL));
  if (!cards.length) return;

  function boxes(card) {
    var pt = card.style.transform, ptr = card.style.transition;
    card.style.transition = 'none'; card.style.transform = 'none';
    var cr = card.getBoundingClientRect(), k = card.offsetWidth ? cr.width / card.offsetWidth : 1, out = [];
    function add(r) { if (r.width < 2 || r.height < 2) return; out.push({ x: (r.left - cr.left) / k, y: (r.top - cr.top) / k, w: r.width / k, h: r.height / k }); }
    var tw = doc.createTreeWalker(card, NodeFilter.SHOW_TEXT, null), n, seen = [];
    while ((n = tw.nextNode())) {
      if (!/\S/.test(n.nodeValue)) continue;
      var p = n.parentNode;
      if (p.closest && p.closest('.stk-spine')) continue;
      if (p.closest && p.closest('.tag')) { var t = p.closest('.tag'); if (seen.indexOf(t) < 0) { seen.push(t); add(t.getBoundingClientRect()); } continue; }
      var rg = doc.createRange(); rg.selectNodeContents(n);
      var rs = rg.getClientRects(), rows = [];
      for (var i = 0; i < rs.length; i++) {
        var r = rs[i], m = null;
        for (var j = 0; j < rows.length; j++) if (Math.abs(rows[j].top - r.top) < r.height * .5) { m = rows[j]; break; }
        if (m) { m.left = Math.min(m.left, r.left); m.right = Math.max(m.right, r.right); m.bottom = Math.max(m.bottom, r.bottom); }
        else rows.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
      rows.forEach(function (m) { add({ left: m.left - 3, top: m.top + 1, width: m.right - m.left + 6, height: m.bottom - m.top - 2 }); });
    }
    card.style.transform = pt; card.style.transition = ptr;
    out.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    return { list: out, h: cr.height / k };
  }

  function prep(card) {
    if (card.__bld) return card.__bld;
    var ov = doc.createElement('div'); ov.className = 'bld-ov'; ov.setAttribute('aria-hidden', 'true');
    card.appendChild(ov);
    var st = { card: card, ov: ov, bars: [], head: null, done: false, planned: false, printing: false, h: 0 };
    card.__bld = st; return st;
  }
  function arm(st) {
    var card = st.card, rtl = doc.documentElement.dir === 'rtl', b = boxes(card);
    st.ov.innerHTML = ''; st.bars = []; st.h = b.h;
    b.list.forEach(function (o) {
      var d = doc.createElement('i'); d.className = 'bld-bar';
      d.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px;transform-origin:' + (rtl ? 'left' : 'right') + ' center';
      d._y = o.y + o.h * .5; st.ov.appendChild(d); st.bars.push(d);
    });
    st.head = doc.createElement('i'); st.head.className = 'bld-head'; st.ov.appendChild(st.head);
    card.classList.add('bld-hide');
  }

  /* 1. PLAN: the dot arrives at the station and the card appears as a wireframe (every block drawn, top first).
     2. PRINT: right behind the dot, a print head runs down the card from its top edge (where the dot came from) and the content
     is printed under it, top to bottom. */
  function plan(st) {
    if (st.planned) return; st.planned = true; st.done = true;
    arm(st);
    var H = st.h;
    st.bars.forEach(function (d) { setTimeout(function () { d.classList.add('in'); }, 40 + (d._y / H) * 320); });
    st.planAt = performance.now();
    setTimeout(function () { print(st); }, 560);
  }
  function print(st) {
    if (st.printing) return; st.printing = true;
    var n = st.bars.length, H = st.h, D = Math.max(850, Math.min(1500, H * 2.6)), next = 0;
    st.card.classList.remove('bld-hide');
    st.head.classList.add('go');
    var t0 = performance.now();
    (function tick(now) {
      var t = Math.min(1, (now - t0) / D), y = t * (H + 8) - 4;
      st.head.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      while (next < n && st.bars[next]._y <= y) { st.bars[next].classList.add('out'); next++; }
      if (t < 1) requestAnimationFrame(tick);
      else {
        while (next < n) { st.bars[next].classList.add('out'); next++; }
        st.head.classList.add('off');
        setTimeout(function () { st.ov.remove(); st.card.classList.remove('bld-hide'); }, 700);
      }
    })(t0);
  }
  function stationCards(s) {
    if (s.kind === 'stack') { var f = s.el.querySelector('.stk-card'); return f ? [f] : []; }
    if (s.kind === 'pair') return Array.prototype.slice.call(s.el.querySelectorAll('.card'));
    return [];
  }
  /* the line engine calls this when its dot reaches a station */
  TF.onStation = function (s) { stationCards(s).forEach(function (c, i) { var st = c.__bld; if (st) setTimeout(function () { plan(st); }, i * 200); }); };

  function start() {
    cards.forEach(function (c) { arm(prep(c)); });
    /* when the line engine is running, the dot decides when a card is built - no timer of its own */
    if (doc.documentElement.classList.contains('pw-armed')) return;
    /* fallback: if the dot never gets there (no line engine, odd layout) the card still builds once it has been on screen a while */
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var st = e.target.__bld; io.unobserve(e.target);
        setTimeout(function () { if (st && !st.planned) { plan(st); } }, 2600);
      });
    }, { threshold: .5 });
    cards.forEach(function (c) { io.observe(c); });
  }
  (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { setTimeout(start, 300); });
})();
