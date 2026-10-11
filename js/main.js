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
  var revealEls = document.querySelectorAll('.reveal, .reveal-stack');
  var STAGGER_MS = 90; /* פער בין שורה לשורה */

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var index = Array.prototype.indexOf.call(revealEls, entry.target);
          entry.target.style.setProperty('--reveal-delay', (index * STAGGER_MS) + 'ms');
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

  /* ---------- footnote inline note (e.g. "Handywoman*") - expands in place, never covers other text ---------- */
  /* delegated listeners so this keeps working after i18n swaps the trigger's markup on language toggle */
  function closeAllFootnotePopups() {
    document.querySelectorAll('.footnote-popup.show').forEach(function (p) {
      p.classList.remove('show');
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-footnote-trigger]');
    if (trigger) {
      var popup = document.getElementById('footnote-popup-' + trigger.getAttribute('data-footnote-trigger'));
      if (!popup) return;
      var isOpen = popup.classList.contains('show');
      closeAllFootnotePopups();
      if (!isOpen) popup.classList.add('show');
      return;
    }

    var closeBtn = e.target.closest('.footnote-popup-close');
    if (closeBtn) {
      closeAllFootnotePopups();
      return;
    }

    if (!e.target.closest('.footnote-popup')) {
      closeAllFootnotePopups();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllFootnotePopups();
  });

  /* ---------- trivia quiz ---------- */
  var quizStartBtn = document.getElementById('quiz-start-btn');
  var quizCard = document.getElementById('quiz-card');

  if (quizStartBtn && quizCard) {
    var quizNav = quizCard.querySelector('.quiz-nav');
    var quizProgressTrack = quizCard.querySelector('.quiz-progress-track');
    var quizSkipBtn = document.getElementById('quiz-skip-btn');
    var quizProgressText = document.getElementById('quiz-progress-text');
    var quizProgressBar = document.getElementById('quiz-progress-bar');
    var quizQuestionBlock = document.getElementById('quiz-question-block');
    var quizQText = document.getElementById('quiz-q-text');
    var quizQOptions = document.getElementById('quiz-q-options');
    var quizQFeedback = document.getElementById('quiz-q-feedback');
    var quizNextBtn = document.getElementById('quiz-next-btn');
    var quizResults = document.getElementById('quiz-results');

    var triviaDataHe = [
      {
        type: 'fact',
        question: 'איך נקרא המכשיר שבו סטאר-לורד שומע מוזיקה?',
        options: [
          { text: 'דיסקמן', correct: false },
          { text: 'ווקמן', correct: true },
          { text: 'אייפוד', correct: false }
        ],
        feedbackCorrect: 'יס! Sony Walkman האגדי. מוצר עם UX כל כך על-זמנית, שהוא שרד אפילו מסעות בחלל העמוק וקסטות מיקס ישנות.',
        feedbackWrong: 'לא, זה הווקמן הנוסטלגי! כי עם כל הכבוד לאייפוד, אין כמו ה-UX הפיזי של לחיצה על כפתור PLAY אמיתי בחללית.'
      },
      {
        type: 'personal',
        question: 'איזה גיבור-על הכי מתאים לך?',
        options: [
          { text: 'איירון מן - הכסף פותר הכל', feedback: 'פקטור התקציב! פרויקט עם תקציב בלתי מוגבל וטכנולוגיה מטורפת זה החלום של כל מעצבי המוצר. לעצב בלי מגבלות... תענוג.' },
          { text: 'ד"ר סטריינג\' - לדעת הכל עדיף מכוח', feedback: 'מאסטר במחקר משתמשים (User Research)! לדעת הכל, לקרוא דאטה, ולראות 14 מיליון תרחישים עתידיים לכל מסע משתמש.' },
          { text: 'תור - יש לו פטיש', feedback: 'הכי פרקטי. לפעמים לא צריך להתחכם עם קסמים או טכנולוגיה מורכבת - פשוט צריך כלי אחד חזק וטוב כדי להנחית פטיש על באג מעצבן.' }
        ]
      },
      {
        type: 'fact',
        question: 'מי לקח חלק בעיצוב ובתכנון של מכוניות הוט ווילס המקוריות כדי שהן יהיו הכי מהירות בעולם?',
        options: [
          { text: 'נהג מרוצים אמיתי', correct: false },
          { text: 'מדען טילים', correct: true },
          { text: 'הילד בן ה-8 של המייסד', correct: false }
        ],
        feedbackCorrect: 'בול! ג\'ק ראיין, מהנדס טילים לשעבר, תכנן את צירי הגלגלים. הוכחה שעיצוב וחוויית משתמש (UX) טובים דורשים לפעמים מדע טילים אמיתי!',
        feedbackWrong: 'נשמע הגיוני, אבל לא! זה היה מדען טילים אמיתי. כי כשרוצים לבנות מוצר בלי חיכוך - הולכים למקצוענים.'
      },
      {
        type: 'personal',
        question: 'מה המשותף בין יום עבודה עמוס אצלך לבין מסלול הוט ווילס בסלון של אמא לבן 5?',
        options: [
          { text: 'בשניהם יש לופים משוגעים, סיבובים חדים ובסוף מישהו עלול לדרוך על משהו ולצעוק', feedback: 'לגמרי! ההבדל היחיד הוא שבפיגמה לפחות אי אפשר לדרוך על מכונית קטנה ולשבור אצבע ברגליים באמצע הלילה.' },
          { text: 'שניהם מתחילים עם המון אנרגיה ומסתיימים בבלאגן שצריך לסדר', feedback: 'חחח כל כך נכון! הלוואי שבעבודה האמיתית היה אפשר פשוט לפרק את כל המסלול המורכב בסוף היום ולבנות מחדש מחר בבוקר.' },
          { text: 'אצלנו הכל חלק, בקו ישר ובמהירות שיא', feedback: 'וואו!' }
        ]
      },
      {
        type: 'personal',
        question: 'מה סגנון הקריאה שלך?',
        options: [
          { text: 'ספר אחד בכל פעם, עד הסוף', feedback: 'פוקוס של לייזר! נשמע בדיוק כמו סגנון Single-tasking, עם הרבה עומק ויסודיות ומחויבות לפרויקט עד שהוא פיקס בייצור.' },
          { text: 'כמה ספרים במקביל, לפי מצב רוח', feedback: 'מולטיטאסקינג בדם! חשיבה רוחבית מעולה, עם יכולת לתמרן בין משימות ולהתאים קצב לפי הצורך, בדיוק כמו בסטודיו.' },
          { text: 'מתחילים הרבה, מסיימים מעט', feedback: 'רוח של חוקרים אמיתיים! שלב ה-Discovery והמחקר הוא הכי כיפי, עם המון סקרנות ורעיונות חדשים בראש (רק לזכור לסגור טאבים בפיגמה בסוף).' }
        ]
      },
      {
        type: 'personal',
        question: 'איזה מטרד דיגיטלי הכי מוציא אותך מדעתך ברשת?',
        options: [
          { text: 'כפתור סגירה (X) קטנטן שמחטיאים תמיד' },
          { text: 'מבחני קאפצ\'ה ("אני לא רובוט") שלא נגמרים' },
          { text: 'דרישות סיסמה שכוללות אות גדולה ודם דרקונים' }
        ],
        feedbackGeneral: 'חחח לגמרי! כולנו סובלים מאותם דברים בדיוק.'
      }
    ];

    var triviaDataEn = [
      {
        type: 'fact',
        question: 'What does Star-Lord listen to music on?',
        options: [
          { text: 'Discman', correct: false },
          { text: 'Walkman', correct: true },
          { text: 'iPod', correct: false }
        ],
        feedbackCorrect: 'Yes! The legendary Sony Walkman. A product with UX so timeless it survived deep-space voyages and old mixtapes.',
        feedbackWrong: 'Nope, it’s the nostalgic Walkman! With all due respect to the iPod, nothing beats the physical UX of hitting a real PLAY button on a spaceship.'
      },
      {
        type: 'personal',
        question: 'Which superhero suits you best?',
        options: [
          { text: 'Iron Man - money solves everything', feedback: 'The budget factor! A project with an unlimited budget and insane tech is every product designer’s dream. Designing with no constraints... bliss.' },
          { text: 'Dr. Strange - knowing everything beats brute force', feedback: 'A User Research master! Knowing everything, reading the data, and seeing 14 million possible futures for every user journey.' },
          { text: 'Thor - he’s got a hammer', feedback: 'The most practical one. Sometimes you don’t need fancy magic or complex tech - you just need one solid tool to smash an annoying bug.' }
        ]
      },
      {
        type: 'fact',
        question: 'Who helped design and engineer the original Hot Wheels cars so they’d be the fastest in the world?',
        options: [
          { text: 'A real race car driver', correct: false },
          { text: 'A rocket scientist', correct: true },
          { text: 'The founder’s 8-year-old kid', correct: false }
        ],
        feedbackCorrect: 'Nailed it! Jack Ryan, a former missile engineer, designed the wheel axles. Proof that great design and UX sometimes really do take rocket science!',
        feedbackWrong: 'Sounds logical, but no! It was an actual rocket scientist. Because when you want to build a frictionless product - you call in the pros.'
      },
      {
        type: 'personal',
        question: 'What do a packed workday and a Hot Wheels track in a 5-year-old’s living room have in common?',
        options: [
          { text: 'Both have crazy loops, sharp turns, and eventually someone steps on something and yells', feedback: 'Totally! The only difference is that in Figma you at least can’t step on a tiny car and break a toe in the middle of the night.' },
          { text: 'Both start with tons of energy and end in a mess you have to clean up', feedback: 'Haha so true! I wish real work actually worked that way. You could just tear down the whole complicated track at the end of the day and rebuild it tomorrow morning.' },
          { text: 'For me it’s all smooth, a straight line, and top speed', feedback: 'Wow!' }
        ]
      },
      {
        type: 'personal',
        question: 'What’s your reading style?',
        options: [
          { text: 'One book at a time, cover to cover', feedback: 'Laser focus! Sounds exactly like a single-tasking style, with a lot of depth, thoroughness, and commitment to a project until it ships.' },
          { text: 'A few books at once, depending on my mood', feedback: 'Multitasking is in your blood! Great lateral thinking, with the ability to juggle tasks and adjust pace as needed, just like in the studio.' },
          { text: 'Start a lot, finish a few', feedback: 'The spirit of a true researcher! The Discovery and research phase is the most fun, full of curiosity and fresh ideas (just remember to close the Figma tabs eventually).' }
        ]
      },
      {
        type: 'personal',
        question: 'Which digital annoyance drives you the craziest online?',
        options: [
          { text: 'The tiny close (X) button you always miss' },
          { text: 'Endless CAPTCHA tests ("I’m not a robot")' },
          { text: 'Password requirements that need a capital letter and a dragon’s blood sample' }
        ],
        feedbackGeneral: 'Haha totally! We all suffer from exactly the same things.'
      }
    ];

    function isEnglish() {
      return document.documentElement.lang === 'en';
    }

    function getTriviaData() {
      return isEnglish() ? triviaDataEn : triviaDataHe;
    }

    var currentIndex = 0;

    function renderQuizQuestion() {
      var triviaData = getTriviaData();
      var data = triviaData[currentIndex];
      quizProgressText.textContent = isEnglish()
        ? 'Question ' + (currentIndex + 1) + ' of ' + triviaData.length
        : 'שאלה ' + (currentIndex + 1) + ' מתוך ' + triviaData.length;
      quizProgressBar.style.width = (((currentIndex + 1) / triviaData.length) * 100) + '%';
      quizQText.textContent = data.question;
      quizQOptions.innerHTML = '';
      quizQOptions.classList.remove('answered');
      quizQFeedback.textContent = '';
      quizQFeedback.classList.remove('show');
      quizNextBtn.hidden = true;

      data.options.forEach(function (opt) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.textContent = opt.text;
        button.addEventListener('click', function () { selectQuizOption(opt, button); });
        quizQOptions.appendChild(button);
      });
    }

    function selectQuizOption(opt, clickedButton) {
      var data = getTriviaData()[currentIndex];
      var buttons = quizQOptions.querySelectorAll('.quiz-option');
      if (quizQOptions.classList.contains('answered')) return;
      quizQOptions.classList.add('answered');

      if (data.type === 'fact') {
        buttons.forEach(function (btn, i) {
          if (data.options[i].correct) btn.classList.add('correct');
        });
        if (!opt.correct) clickedButton.classList.add('wrong');
        quizQFeedback.textContent = opt.correct ? data.feedbackCorrect : data.feedbackWrong;
      } else {
        clickedButton.classList.add('selected');
        quizQFeedback.textContent = data.feedbackGeneral || opt.feedback || '';
      }

      quizQFeedback.classList.add('show');

      var isLastQuestion = currentIndex >= getTriviaData().length - 1;
      quizNextBtn.textContent = isEnglish()
        ? (isLastQuestion ? 'See results' : 'Next question')
        : (isLastQuestion ? 'לתוצאות' : 'לשאלה הבאה');
      quizNextBtn.hidden = false;
    }

    var QUIZ_EXIT_MS = 460;

    function advanceQuiz() {
      quizQuestionBlock.classList.add('leaving');
      setTimeout(function () {
        currentIndex++;
        quizQuestionBlock.classList.remove('leaving');
        if (currentIndex < getTriviaData().length) {
          renderQuizQuestion();
          quizQuestionBlock.classList.add('settling');
          setTimeout(function () {
            quizQuestionBlock.classList.remove('settling');
          }, 420);
        } else {
          showQuizResults();
        }
      }, QUIZ_EXIT_MS);
    }

    function showQuizResults() {
      quizQuestionBlock.hidden = true;
      quizNav.hidden = true;
      quizProgressTrack.hidden = true;
      quizResults.hidden = false;
    }

    quizNextBtn.addEventListener('click', function () {
      quizNextBtn.hidden = true;
      advanceQuiz();
    });

    quizStartBtn.addEventListener('click', function () {
      quizStartBtn.hidden = true;
      quizCard.hidden = false;
      renderQuizQuestion();
      quizQuestionBlock.classList.add('settling');
      setTimeout(function () {
        quizQuestionBlock.classList.remove('settling');
      }, 420);
    });

    if (quizSkipBtn) {
      quizSkipBtn.addEventListener('click', function () {
        showQuizResults();
      });
    }

    document.addEventListener('sitelangchange', function () {
      if (!quizCard.hidden && quizResults.hidden) {
        renderQuizQuestion();
      }
    });
  }

  /* ---------- cursor trail (decoration zones only, never over text) ---------- */
  var prefersNoMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  if (!prefersNoMotion && hasHover) {
    var trailColors = ['#F0D98C', '#EBBE9C', '#D9D2EA'];
    var pastelZones = document.querySelectorAll('.pastel-zone');

    pastelZones.forEach(function (zone) {
      var lastSpawn = 0;
      var minGap = 45; /* ms between dots, keeps DOM light */

      zone.addEventListener('mousemove', function (e) {
        var now = Date.now();
        if (now - lastSpawn < minGap) return;
        lastSpawn = now;

        var rect = zone.getBoundingClientRect();
        var dot = document.createElement('span');
        dot.className = 'trail-dot';
        dot.style.left = (e.clientX - rect.left) + 'px';
        dot.style.top = (e.clientY - rect.top) + 'px';
        dot.style.background = trailColors[Math.floor(Math.random() * trailColors.length)];
        zone.appendChild(dot);

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            dot.classList.add('fade');
          });
        });

        setTimeout(function () {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
        }, 650);
      });
    });
  }

  /* ---------- custom cursor (whole site, desktop pointer only) ---------- */
  var supportsFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  if (!prefersNoMotion && hasHover && supportsFinePointer) {
    var cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    document.body.appendChild(cursorEl);

    var cursorHintEl = document.createElement('div');
    cursorHintEl.className = 'custom-cursor-hint';
    document.body.appendChild(cursorHintEl);

    document.documentElement.classList.add('custom-cursor-active');

    document.addEventListener('mousemove', function (e) {
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
      cursorHintEl.style.left = e.clientX + 'px';
      cursorHintEl.style.top = e.clientY + 'px';
    });

    /* The cursor dot itself never changes shape/color - only a small text
       hint appears next to it on certain elements (view / click / play). */
    var VIEW_SELECTOR = '.work-row, .card';
    var CLICK_SELECTOR = '.btn, .work-btn, .quiz-start-btn, .quiz-icon-btn, .whatsapp-fab, .nav-cv-btn, .trivia-teaser-link, .quiz-option, button:not(.menu-toggle):not(.trivia-teaser-close)';
    var HINT_FAR_SELECTOR = '.mag-page';
    var HINT_NEAR_SELECTOR = '.quiz-block';
    var HINT_SELECTOR = HINT_FAR_SELECTOR + ', ' + HINT_NEAR_SELECTOR;
    var ALL_HOVERABLE = VIEW_SELECTOR + ', ' + CLICK_SELECTOR + ', ' + HINT_SELECTOR;

    document.addEventListener('mouseover', function (e) {
      var clickTarget = e.target.closest(CLICK_SELECTOR);
      var viewTarget = e.target.closest(VIEW_SELECTOR);
      var hintNearTarget = e.target.closest(HINT_NEAR_SELECTOR);
      var hintFarTarget = e.target.closest(HINT_FAR_SELECTOR);

      var cursorIsEnglish = document.documentElement.lang === 'en';

      if (clickTarget) {
        cursorHintEl.textContent = cursorIsEnglish ? 'Click' : 'לחיצה';
        cursorHintEl.classList.add('is-visible');
      } else if (viewTarget) {
        cursorHintEl.textContent = cursorIsEnglish ? 'View' : 'צפייה';
        cursorHintEl.classList.add('is-visible');
      } else if (hintNearTarget) {
        cursorHintEl.textContent = cursorIsEnglish ? 'Let’s play' : 'שנשחק';
        cursorHintEl.classList.add('is-visible');
      } else if (hintFarTarget) {
        cursorHintEl.textContent = cursorIsEnglish ? 'Scroll me down, let’s play' : 'גללו אותי למטה ונשחק';
        cursorHintEl.classList.add('is-visible');
      }
    });

    document.addEventListener('mouseout', function (e) {
      var stillOver = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(ALL_HOVERABLE);
      if (stillOver) return;
      var leavingHoverable = e.target.closest(ALL_HOVERABLE);
      if (!leavingHoverable) return;
      cursorHintEl.classList.remove('is-visible');
      cursorHintEl.textContent = '';
    });

  }

  /* ---------- about page: magazine hero (canvas scan -> headline -> fact-card reveal) ---------- */
  var magPhotoImg = document.getElementById('magPhotoImg');
  var magStage = document.getElementById('magStage');

  if (magPhotoImg && magStage) {
    var magCtx = magStage.getContext('2d');
    var magCoverHead = document.getElementById('magCoverHead');
    var magBody = document.getElementById('magBody');

    var MAG_RASTER_W = 480, MAG_RASTER_H = 600; /* 4:5, matches the cover crop */
    var MAG_T_SCAN_START = 700;     /* ms, hold before the scan starts */
    var MAG_T_SCAN_DUR = 1900;      /* ms, sweep duration */
    var MAG_T_HOLD_DOTS = 700;      /* ms, hold fully-halftone before crossfading back */
    var MAG_T_FADE_BACK = 850;      /* ms, canvas fades out revealing the real photo */
    var MAG_T_CONTENT_DELAY = 150;  /* ms, extra pause after the photo settles before content lands */
    var MAG_SHADOW = { r: 0x4a, g: 0x3f, b: 0x66 };
    var MAG_ACCENT = '#7A6A9E';

    var magRaster, magRasterData;
    var MAG_COLS = 18, MAG_ROWS = 22;
    var magCw, magCh;
    var magFragments = [];

    function magSeededRand(seed) {
      var v = Math.sin(seed * 12.9898) * 43758.5453;
      return v - Math.floor(v);
    }

    function magBuildRaster() {
      var off = document.createElement('canvas');
      off.width = MAG_RASTER_W; off.height = MAG_RASTER_H;
      var octx = off.getContext('2d');
      var iw = magPhotoImg.naturalWidth, ih = magPhotoImg.naturalHeight;
      var targetR = MAG_RASTER_W / MAG_RASTER_H, srcR = iw / ih;
      var sx, sy, sw, sh;
      if (srcR > targetR) { sh = ih; sw = ih * targetR; sx = (iw - sw) / 2; sy = 0; }
      else { sw = iw; sh = iw / targetR; sx = 0; sy = (ih - sh) * 0.20; }
      octx.filter = 'grayscale(1) contrast(1.25) brightness(1.02)';
      octx.drawImage(magPhotoImg, sx, sy, sw, sh, 0, 0, MAG_RASTER_W, MAG_RASTER_H);
      octx.filter = 'none';
      magRaster = off;
      magRasterData = octx.getImageData(0, 0, MAG_RASTER_W, MAG_RASTER_H).data;
    }

    function magDarknessAt(cx, cy) {
      var x = Math.max(0, Math.min(MAG_RASTER_W - 1, Math.round(cx)));
      var y = Math.max(0, Math.min(MAG_RASTER_H - 1, Math.round(cy)));
      var idx = (y * MAG_RASTER_W + x) * 4;
      return 1 - (magRasterData[idx] / 255);
    }

    var MAG_SUB_N = 5;
    function magBuildSubDots(baseX, baseY, cellW, cellH) {
      var subW = cellW / MAG_SUB_N, subH = cellH / MAG_SUB_N;
      var subR = Math.min(subW, subH) * 0.62;
      var dots = [];
      for (var b = 0; b < MAG_SUB_N; b++) {
        for (var a = 0; a < MAG_SUB_N; a++) {
          var sx = baseX + (a + 0.5) * subW;
          var sy = baseY + (b + 0.5) * subH;
          var dark = magDarknessAt(sx, sy);
          var r = dark * subR;
          if (r > 0.4) dots.push({ dx: sx, dy: sy, r: r });
        }
      }
      return dots;
    }

    function magBuildFragments() {
      magCw = MAG_RASTER_W / MAG_COLS; magCh = MAG_RASTER_H / MAG_ROWS;
      magFragments = [];
      for (var j = 0; j < MAG_ROWS; j++) {
        for (var i = 0; i < MAG_COLS; i++) {
          var x = i * magCw, y = j * magCh;
          var seed = i * 97 + j * 131;
          var axis = magSeededRand(seed) > 0.5 ? 'x' : 'y';
          var mag = (magSeededRand(seed + 1) < 0.5 ? -1 : 1) * (magCw * 1.3 + magSeededRand(seed + 2) * magCw * 1.6);
          var scatterX = axis === 'x' ? mag : 0;
          var scatterY = axis === 'y' ? mag * (magCh / magCw) : 0;
          var triggerFrac = j / (MAG_ROWS - 1); /* top row triggers first - vertical scan, top to bottom */
          magFragments.push({
            sx: x, sy: y, sw: magCw, sh: magCh,
            scatterX: scatterX, scatterY: scatterY,
            triggerFrac: triggerFrac,
            subDots: magBuildSubDots(x, y, magCw, magCh)
          });
        }
      }
    }

    function magEaseInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

    function magDrawFragmentPhoto(f, ox, oy, alpha) {
      if (alpha <= 0.01) return;
      magCtx.save();
      magCtx.globalAlpha = alpha;
      magCtx.drawImage(magRaster, f.sx, f.sy, f.sw, f.sh, f.sx + ox, f.sy + oy, f.sw, f.sh);
      magCtx.restore();
    }

    /* same tile, but "lifted" off the surface with a small dark offset behind
       it - a cheap stand-in for a cube's shadowed side face, used only while a
       fragment is actually airborne (displaced), giving the break-apart a bit
       of a 3D, physical-block feel instead of a flat cutout sliding around. */
    function magDrawFragmentPhoto3D(f, ox, oy, alpha) {
      if (alpha <= 0.01) return;
      var depth = Math.max(2, f.sw * 0.16);
      magCtx.save();
      magCtx.globalAlpha = alpha * 0.85;
      magCtx.fillStyle = 'rgba(18,14,28,0.5)';
      magCtx.fillRect(f.sx + ox + depth * 0.55, f.sy + oy + depth * 0.55, f.sw, f.sh);
      magCtx.restore();
      magCtx.save();
      magCtx.globalAlpha = alpha;
      magCtx.drawImage(magRaster, f.sx, f.sy, f.sw, f.sh, f.sx + ox, f.sy + oy, f.sw, f.sh);
      magCtx.restore();
    }

    function magDrawDot(x, y, r, alpha) {
      if (alpha <= 0.01 || r <= 0.3) return;
      magCtx.save();
      magCtx.globalAlpha = alpha;
      magCtx.fillStyle = 'rgb(' + MAG_SHADOW.r + ',' + MAG_SHADOW.g + ',' + MAG_SHADOW.b + ')';
      magCtx.beginPath();
      magCtx.arc(x, y, r, 0, Math.PI * 2);
      magCtx.fill();
      magCtx.restore();
    }

    var MAG_BURST_WIDTH = 0.16, MAG_SETTLE_WIDTH = 0.22;
    var MAG_WAVE_MAX = 1 + MAG_BURST_WIDTH + MAG_SETTLE_WIDTH;

    function magDrawScanLine(waveProgress) {
      if (waveProgress <= 0 || waveProgress >= 1) return;
      var y = MAG_RASTER_H * waveProgress;
      magCtx.save();
      magCtx.globalAlpha = 0.9;
      magCtx.shadowColor = MAG_ACCENT;
      magCtx.shadowBlur = 10;
      magCtx.strokeStyle = MAG_ACCENT;
      magCtx.lineWidth = 2.5;
      magCtx.beginPath();
      magCtx.moveTo(0, y);
      magCtx.lineTo(MAG_RASTER_W, y);
      magCtx.stroke();
      magCtx.restore();
    }

    function magDrawScanFrame(waveP) {
      magCtx.clearRect(0, 0, MAG_RASTER_W, MAG_RASTER_H);
      magFragments.forEach(function (f) {
        var d = waveP - f.triggerFrac;
        if (d <= 0) {
          magDrawFragmentPhoto(f, 0, 0, 1);
        } else if (d < MAG_BURST_WIDTH) {
          var lp = d / MAG_BURST_WIDTH;
          magDrawFragmentPhoto3D(f, f.scatterX * lp, f.scatterY * lp, 1);
        } else if (d < MAG_BURST_WIDTH + MAG_SETTLE_WIDTH) {
          var lp2 = (d - MAG_BURST_WIDTH) / MAG_SETTLE_WIDTH;
          var ox = f.scatterX * (1 - lp2), oy = f.scatterY * (1 - lp2);
          magDrawFragmentPhoto3D(f, ox, oy, 1 - lp2);
          f.subDots.forEach(function (dot) { magDrawDot(dot.dx + ox, dot.dy + oy, dot.r, lp2); });
        } else {
          f.subDots.forEach(function (dot) { magDrawDot(dot.dx, dot.dy, dot.r, 1); });
        }
      });
      magDrawScanLine(Math.min(waveP, 1));
    }

    function magDrawAllDots() {
      magCtx.clearRect(0, 0, MAG_RASTER_W, MAG_RASTER_H);
      magFragments.forEach(function (f) {
        f.subDots.forEach(function (d) { magDrawDot(d.dx, d.dy, d.r, 1); });
      });
    }

    var magRafId = null;
    function magCancelLoop() { if (magRafId) { cancelAnimationFrame(magRafId); magRafId = null; } }

    /* ---- card reveal: frame draws itself, then a scan-line sweeps down
       through it, decoding the label right as the sweep crosses it ---- */
    function magSizeFactTrace(fact) {
      var svg = fact.querySelector('.mag-trace-svg');
      var rect = fact.querySelector('rect');
      var w = fact.offsetWidth, h = fact.offsetHeight;
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      rect.setAttribute('width', Math.max(0, w - 1.5));
      rect.setAttribute('height', Math.max(0, h - 1.5));
      var perim = 2 * ((w - 1.5) + (h - 1.5));
      rect.style.transition = 'none';
      rect.style.strokeDasharray = perim + ' ' + perim;
      rect.style.strokeDashoffset = perim;
    }
    function magDecodeFactLabel(el, duration) {
      var finalText = el.getAttribute('data-final') || '';
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*/';
      var start = null;
      var len = finalText.length;
      function frame(ts) {
        if (!start) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        var revealCount = Math.floor(t * len);
        var out = '';
        for (var i = 0; i < len; i++) {
          if (i < revealCount || finalText[i] === ' ') out += finalText[i];
          else out += chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = out;
        if (t < 1) requestAnimationFrame(frame); else el.textContent = finalText;
      }
      requestAnimationFrame(frame);
    }
    function magResetCardReveal(card) {
      card.classList.remove('frame-in', 'scanning');
      var label = card.querySelector('.mag-fact-label');
      /* capture whatever text is on the label right now (current site
         language) as the "final" text to decode into - this keeps the
         effect correct even if the language was switched before this
         card's reveal ever ran. Guarded so a redundant reset call (this
         runs both at the start of magPlaySequence and again right before
         magTriggerCardReveals) never overwrites the captured text with
         an already-blanked label. */
      if (label.textContent) {
        label.setAttribute('data-final', label.textContent);
      }
      label.textContent = '';
      magSizeFactTrace(card);
    }
    function magRevealCard(card) {
      var rect = card.querySelector('rect');
      rect.style.transition = 'stroke-dashoffset 260ms cubic-bezier(.4,0,.2,1)';
      rect.style.strokeDashoffset = '0';
      card.classList.add('frame-in');
      magCardTimers.push(setTimeout(function () {
        card.classList.add('scanning');
        magCardTimers.push(setTimeout(function () {
          magDecodeFactLabel(card.querySelector('.mag-fact-label'), 380);
        }, 150));
      }, 260));
    }

    /* ---- card reveal trigger: after the hero photo settles, each fact
       card reveals itself (frame -> scan -> decode, see magRevealCard
       above) in a short staggered sequence. No traveling element connects
       the photo to the cards - each card just wakes up on its own, one
       after another. ---- */
    var magCardTimers = [];
    var MAG_CARD_START_DELAY = 320, MAG_CARD_STAGGER = 360;

    function magCancelCardReveals() {
      magCardTimers.forEach(function (id) { clearTimeout(id); });
      magCardTimers = [];
    }

    function magTriggerCardReveals() {
      var facts = Array.prototype.slice.call(document.querySelectorAll('.mag-facts .mag-fact'));
      facts.forEach(magResetCardReveal);
      if (!facts.length) return;
      magCancelCardReveals();
      facts.forEach(function (card, i) {
        magCardTimers.push(setTimeout(function () {
          magRevealCard(card);
        }, MAG_CARD_START_DELAY + i * MAG_CARD_STAGGER));
      });
    }

    function magPlaySequence() {
      magCancelLoop();
      magCancelCardReveals();
      magCoverHead.classList.remove('in');
      magBody.classList.remove('content-in');
      document.querySelectorAll('.mag-facts .mag-fact').forEach(magResetCardReveal);
      magStage.style.transition = 'none';
      magStage.style.opacity = '1';
      magCtx.clearRect(0, 0, MAG_RASTER_W, MAG_RASTER_H);
      magCtx.drawImage(magRaster, 0, 0, MAG_RASTER_W, MAG_RASTER_H);

      if (prefersNoMotion) {
        magDrawAllDots();
        requestAnimationFrame(function () {
          magStage.style.transition = 'opacity 400ms ease';
          magStage.style.opacity = '0';
        });
        magCoverHead.classList.add('in');
        magBody.classList.add('content-in');
        document.querySelectorAll('.mag-facts .mag-fact').forEach(function (f) {
          f.classList.add('frame-in', 'scanning');
          var label = f.querySelector('.mag-fact-label');
          label.textContent = label.getAttribute('data-final');
        });
        return;
      }

      var SCAN_END = MAG_T_SCAN_START + MAG_T_SCAN_DUR;
      var HOLD_END = SCAN_END + MAG_T_HOLD_DOTS;
      var FADE_END = HOLD_END + MAG_T_FADE_BACK;
      var TOTAL = FADE_END + MAG_T_CONTENT_DELAY;
      var headlineShown = false, contentShown = false;
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var elapsed = ts - start;

        /* draw the current visual state - computed from elapsed directly
           (not branch side-effects), so a slow/stalled frame that jumps
           past a window still lands on the correct final picture instead
           of an in-between one. */
        if (elapsed < MAG_T_SCAN_START) {
          magCtx.clearRect(0, 0, MAG_RASTER_W, MAG_RASTER_H);
          magCtx.drawImage(magRaster, 0, 0, MAG_RASTER_W, MAG_RASTER_H);
        } else if (elapsed < SCAN_END) {
          var p = (elapsed - MAG_T_SCAN_START) / MAG_T_SCAN_DUR;
          var waveP = magEaseInOutQuad(p) * MAG_WAVE_MAX;
          magDrawScanFrame(waveP);
        } else if (elapsed < HOLD_END) {
          magDrawAllDots();
          magStage.style.opacity = '1';
        } else if (elapsed < FADE_END) {
          magDrawAllDots();
          var fp = (elapsed - HOLD_END) / MAG_T_FADE_BACK;
          magStage.style.opacity = String(Math.max(0, 1 - fp));
        } else {
          magStage.style.opacity = '0';
        }

        /* reveal triggers - threshold checks, independent of the draw
           branches above, so they still fire even if a frame skips over
           the window where they'd normally be set. */
        if (!headlineShown && elapsed >= SCAN_END) {
          magCoverHead.classList.add('in');
          headlineShown = true;
        }
        if (!contentShown && elapsed >= TOTAL) {
          magBody.classList.add('content-in');
          contentShown = true;
          magTriggerCardReveals();
          magRafId = null;
          return;
        }
        magRafId = requestAnimationFrame(frame);
      }
      magRafId = requestAnimationFrame(frame);
    }

    function magInit() {
      magStage.width = MAG_RASTER_W * 2; magStage.height = MAG_RASTER_H * 2;
      magCtx.scale(2, 2);
      magBuildRaster();
      magBuildFragments();

      if ('IntersectionObserver' in window) {
        var magIo = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              magPlaySequence();
              magIo.unobserve(entry.target);
            }
          });
        }, { threshold: 0.35 });
        magIo.observe(magStage.closest('.mag-photo'));
      } else {
        magPlaySequence();
      }

      window.addEventListener('resize', function () {
        document.querySelectorAll('.mag-facts .mag-fact').forEach(magSizeFactTrace);
      });
    }

    if (magPhotoImg.complete && magPhotoImg.naturalWidth) {
      magInit();
    } else {
      magPhotoImg.addEventListener('load', magInit);
    }
  }


});
