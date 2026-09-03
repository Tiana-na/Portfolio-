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
    var quizResults = document.getElementById('quiz-results');
    var AUTO_ADVANCE_DELAY = 1800;

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
        question: 'What is the device Star-Lord listens to music on?',
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
          { text: 'Both start with tons of energy and end in a mess you have to clean up', feedback: 'Haha so true! I wish that at real work you could just take the whole complicated track apart at the end of the day and rebuild it tomorrow morning.' },
          { text: 'For us it’s all smooth, a straight line, and top speed', feedback: 'Wow!' }
        ]
      },
      {
        type: 'personal',
        question: 'What’s your reading style?',
        options: [
          { text: 'One book at a time, cover to cover', feedback: 'Laser focus! Sounds exactly like a single-tasking style, with a lot of depth, thoroughness, and commitment to a project until it ships.' },
          { text: 'A few books at once, depending on my mood', feedback: 'Multitasking in your blood! Great lateral thinking, with the ability to juggle tasks and adjust pace as needed, just like in the studio.' },
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
    var advanceTimer = null;

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

      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(advanceQuiz, AUTO_ADVANCE_DELAY);
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
      clearTimeout(advanceTimer);
      quizQuestionBlock.hidden = true;
      quizNav.hidden = true;
      quizProgressTrack.hidden = true;
      quizResults.hidden = false;
    }

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
    document.documentElement.classList.add('custom-cursor-active');

    document.addEventListener('mousemove', function (e) {
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
    });

    var VIEW_SELECTOR = '.work-row, .card';
    var CLICK_SELECTOR = '.btn, .work-btn, .quiz-start-btn, .quiz-icon-btn, .whatsapp-fab, .nav-cv-btn, .trivia-teaser-link, .quiz-option, button:not(.menu-toggle):not(.trivia-teaser-close)';
    var HINT_FAR_SELECTOR = '.ed-intro-portrait-wrap';
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
        cursorEl.style.width = '54px';
        cursorEl.style.height = '54px';
        cursorEl.style.whiteSpace = 'nowrap';
        cursorEl.style.fontSize = '10px';
        cursorEl.textContent = cursorIsEnglish ? 'Click' : 'לחיצה';
      } else if (viewTarget) {
        cursorEl.style.width = '64px';
        cursorEl.style.height = '64px';
        cursorEl.style.whiteSpace = 'nowrap';
        cursorEl.style.fontSize = '10px';
        cursorEl.textContent = cursorIsEnglish ? 'View' : 'צפייה';
      } else if (hintNearTarget) {
        cursorEl.style.width = '64px';
        cursorEl.style.height = '64px';
        cursorEl.style.whiteSpace = 'nowrap';
        cursorEl.style.fontSize = '10px';
        cursorEl.textContent = cursorIsEnglish ? 'Let’s play' : 'שנשחק';
      } else if (hintFarTarget) {
        cursorEl.style.width = '80px';
        cursorEl.style.height = '80px';
        cursorEl.style.whiteSpace = 'normal';
        cursorEl.style.fontSize = '9px';
        cursorEl.textContent = cursorIsEnglish ? 'Scroll me down, let’s play' : 'גללו אותי למטה ונשחק';
      }
    });

    document.addEventListener('mouseout', function (e) {
      var stillOver = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(ALL_HOVERABLE);
      if (stillOver) return;
      var leavingHoverable = e.target.closest(ALL_HOVERABLE);
      if (!leavingHoverable) return;
      cursorEl.style.width = '14px';
      cursorEl.style.height = '14px';
      cursorEl.style.whiteSpace = 'nowrap';
      cursorEl.textContent = '';
    });
  }

});
