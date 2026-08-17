document.addEventListener('DOMContentLoaded', function () {

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- trivia teaser (surprise popup) ---------- */
  var teaser = document.getElementById('trivia-teaser');
  if (teaser) {
    var TEASER_KEY = 'trivia-teaser-dismissed';
    var alreadyDismissed = false;
    try { alreadyDismissed = localStorage.getItem(TEASER_KEY) === '1'; } catch (e) {}

    if (!alreadyDismissed) {
      var showDelay = 6000 + Math.random() * 4000; /* 6-10s, feels less scripted */
      setTimeout(function () {
        teaser.classList.add('show');
      }, showDelay);
    }

    var teaserClose = teaser.querySelector('.trivia-teaser-close');
    if (teaserClose) {
      teaserClose.addEventListener('click', function (e) {
        e.preventDefault();
        teaser.classList.remove('show');
        try { localStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
      });
    }

    var teaserLink = teaser.querySelector('.trivia-teaser-link');
    if (teaserLink) {
      teaserLink.addEventListener('click', function () {
        try { localStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
      });
    }
  }

  /* ---------- trivia quiz ---------- */
  var quizCards = document.querySelectorAll('.quiz-card');
  if (quizCards.length) {
    var score = 0;
    var scoreEl = document.getElementById('quiz-score');
    quizCards.forEach(function (card) {
      var type = card.dataset.type;
      var optionsWrap = card.querySelector('.quiz-options');
      var options = card.querySelectorAll('.quiz-option');
      var feedback = card.querySelector('.quiz-feedback');
      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (optionsWrap.classList.contains('answered')) return;
          optionsWrap.classList.add('answered');
          opt.classList.add('selected');

          if (type === 'fact') {
            var isCorrect = opt.dataset.correct === 'true';
            options.forEach(function (o) {
              if (o.dataset.correct === 'true') o.classList.add('correct');
            });
            if (!isCorrect) opt.classList.add('wrong');
            if (isCorrect) {
              score++;
              if (scoreEl) scoreEl.textContent = score;
            }
            if (feedback) feedback.textContent = isCorrect ? 'נכון! 🎉' : 'לא בדיוק - התשובה הנכונה מסומנת למעלה.';
          } else {
            if (opt.dataset.personalPick === 'true') opt.classList.add('correct');
            if (feedback) feedback.textContent = feedback.dataset.reveal || '';
          }
          if (feedback) feedback.classList.add('show');
        });
      });
    });
  }

  /* ---------- footer easter egg ---------- */
  var stinger = document.getElementById('stinger');
  if (!stinger) return;

  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
  var pos = 0;
  var closeTimer = null;

  function openStinger() {
    stinger.classList.add('open');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      stinger.classList.remove('open');
    }, 6000);
  }

  function resetSeq() { pos = 0; }

  document.addEventListener('keydown', function (e) {
    if (e.key === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        openStinger();
        resetSeq();
      }
    } else if (e.key.indexOf('Arrow') === 0) {
      resetSeq();
    }
  });

  /* touch swipe version of the same combo */
  var touchStart = null;
  var swipeDirs = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  var swipePos = 0;
  var SWIPE_THRESHOLD = 30;

  document.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    var dir;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }

    if (dir === swipeDirs[swipePos]) {
      swipePos++;
      if (swipePos === swipeDirs.length) {
        openStinger();
        swipePos = 0;
      }
    } else {
      swipePos = (dir === swipeDirs[0]) ? 1 : 0;
    }
  }, { passive: true });
});
