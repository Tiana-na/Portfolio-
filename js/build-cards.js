/* The info cards on About "build" themselves, in the site's own language: first a wireframe of the card appears
   (a dashed block where every line of text and every chip will be), then the blocks wipe away and the real content is printed
   underneath. Plays once, when a card first scrolls into view. The text stays in the DOM the whole time; with reduced motion
   (or without IntersectionObserver) nothing is hidden at all. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var SEL = window.TF_BUILD_SEL || '.stk--story .stk-card:first-child, .stk--skills .stk-card:first-child, .card-pair .card';
  var cards = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!cards.length) return;
  var doc = document;

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
    out.sort(function (a, b) { return (a.y - b.y) > 6 ? 1 : (b.y - a.y) > 6 ? -1 : a.x - b.x; });
    return out;
  }

  function prep(card) {
    if (card.__bld) return card.__bld;
    var ov = doc.createElement('div'); ov.className = 'bld-ov'; ov.setAttribute('aria-hidden', 'true');
    card.appendChild(ov);
    var st = { card: card, ov: ov, bars: [], done: false, armed: false };
    card.__bld = st; return st;
  }
  function arm(st) {
    var card = st.card, rtl = doc.documentElement.dir === 'rtl';
    st.ov.innerHTML = ''; st.bars = [];
    boxes(card).forEach(function (b, i) {
      var d = doc.createElement('i'); d.className = 'bld-bar';
      d.style.cssText = 'left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.h + 'px;transform-origin:' + (rtl ? 'left' : 'right') + ' center';
      st.ov.appendChild(d); st.bars.push(d);
    });
    card.classList.add('bld-hide'); st.armed = true;
    setTimeout(function () { card.classList.remove('bld-hide'); }, 7000);
  }
  function play(st) {
    if (st.done) return; st.done = true;
    arm(st);
    var n = st.bars.length, step = Math.min(55, 650 / Math.max(1, n)), drawEnd = 80 + n * step + 380;
    st.bars.forEach(function (d, i) { setTimeout(function () { d.classList.add('in'); }, 80 + i * step); });
    setTimeout(function () { st.card.classList.remove('bld-hide'); }, drawEnd - 40);
    var wstep = Math.min(45, 520 / Math.max(1, n));
    st.bars.forEach(function (d, i) { setTimeout(function () { d.classList.add('out'); }, drawEnd + i * wstep); });
    setTimeout(function () { st.ov.remove(); st.card.classList.remove('bld-hide'); }, drawEnd + n * wstep + 700);
  }

  function start() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var st = e.target.__bld; io.unobserve(e.target); if (st) setTimeout(function () { play(st); }, 480); } });
    }, { threshold: .4 });
    cards.forEach(function (c) { var st = prep(c); arm(st); io.observe(c); });
  }
  (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { setTimeout(start, 400); });
})();
