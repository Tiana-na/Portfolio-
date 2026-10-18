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

  /* ---------- WhatsApp button: hide while scrolling down on phones, show on scroll up ---------- */
  var waFab = document.querySelector('.whatsapp-fab');
  if (waFab) {
    var lastY = window.pageYOffset || 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || 0;
      var nearBottom = (window.innerHeight + y) >= (document.documentElement.scrollHeight - 120);
      if (y > lastY + 6 && y > 120 && !nearBottom) { waFab.classList.add('fab-away'); }
      else if (y < lastY - 6 || nearBottom || y <= 120) { waFab.classList.remove('fab-away'); }
      lastY = y;
    }, { passive: true });
  }

  /* ---------- trivia teaser (surprise popup) ---------- */
  var teaser = document.getElementById('trivia-teaser');
  if (teaser && document.body.getAttribute('data-page') !== 'about') {   /* not on the page that already holds the quiz */
    var TEASER_KEY = 'trivia-teaser-dismissed';
    var alreadyDismissed = false;
    try { alreadyDismissed = localStorage.getItem(TEASER_KEY) === '1'; } catch (e) {}

    if (!alreadyDismissed) {
      /* appears once, after the visitor has had time to read (22-28s), and fades away on its own after 9s
         so it never sits on top of the text; either way it is not shown again */
      var showDelay = 22000 + Math.random() * 6000;
      setTimeout(function () {
        teaser.classList.add('show');
        try { localStorage.setItem(TEASER_KEY, '1'); } catch (e) {}
        setTimeout(function () { teaser.classList.remove('show'); }, 9000);
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
        question: 'איזה גיבור-על הכי מתאים לכם?',
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
        question: 'מה המשותף בין יום עבודה עמוס אצלכם לבין מסלול הוט ווילס בסלון של אמא לבן 5?',
        options: [
          { text: 'בשניהם יש לופים משוגעים, סיבובים חדים ובסוף מישהו עלול לדרוך על משהו ולצעוק', feedback: 'לגמרי! ההבדל היחיד הוא שבפיגמה לפחות אי אפשר לדרוך על מכונית קטנה ולשבור אצבע ברגליים באמצע הלילה.' },
          { text: 'שניהם מתחילים עם המון אנרגיה ומסתיימים בבלאגן שצריך לסדר', feedback: 'חחח כל כך נכון! הלוואי שבעבודה האמיתית היה אפשר פשוט לפרק את כל המסלול המורכב בסוף היום ולבנות מחדש מחר בבוקר.' },
          { text: 'אצלנו הכל חלק, בקו ישר ובמהירות שיא', feedback: 'וואו!' }
        ]
      },
      {
        type: 'personal',
        question: 'מה סגנון הקריאה שלכם?',
        options: [
          { text: 'ספר אחד בכל פעם, עד הסוף', feedback: 'פוקוס של לייזר! נשמע בדיוק כמו סגנון Single-tasking, עם הרבה עומק ויסודיות ומחויבות לפרויקט עד שהוא פיקס בייצור.' },
          { text: 'כמה ספרים במקביל, לפי מצב רוח', feedback: 'מולטיטאסקינג בדם! חשיבה רוחבית מעולה, עם יכולת לתמרן בין משימות ולהתאים קצב לפי הצורך, בדיוק כמו בסטודיו.' },
          { text: 'מתחילים הרבה, מסיימים מעט', feedback: 'רוח של חוקרים אמיתיים! שלב ה-Discovery והמחקר הוא הכי כיפי, עם המון סקרנות ורעיונות חדשים בראש (רק לזכור לסגור טאבים בפיגמה בסוף).' }
        ]
      },
      {
        type: 'personal',
        question: 'איזה מטרד דיגיטלי הכי מוציא אתכם מדעתכם ברשת?',
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
        feedbackCorrect: 'Nailed it! Jack Ryan, a former missile engineer, helped engineer the original Hot Wheels. Proof that great toys sometimes really do take rocket science!',
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

  /* No custom cursor: the native pointer everywhere. The pointer changes shape in one place only -
     over the assembled portrait on About, where it becomes the dot-shaped window onto the sketch (chain-hero.js). */

  /* ---------- discovery hints (desktop mouse only) ----------
     A small label beside the native pointer, ONLY on secondary things worth discovering (the quiz).
     Buttons and project covers already say what they do - no hint there. */
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var HINT_NEAR = '.quiz-block', HINT_FAR = '.mag-body';
  if (finePointer && document.querySelector(HINT_NEAR + ', ' + HINT_FAR)) {
    var hintEl = document.createElement('div');
    hintEl.className = 'cursor-hint';
    hintEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hintEl);

    function hintText(target) {
      var en = document.documentElement.lang === 'en';
      var near = target.closest(HINT_NEAR);
      /* "Let's play" only invites before the quiz has started */
      if (near && !(quizStartBtn && quizStartBtn.hidden)) return en ? 'Let’s play' : 'שנשחק';
      if (!near && target.closest(HINT_FAR)) return en ? 'Scroll me down, let’s play' : 'גללו אותי למטה ונשחק';
      return '';
    }
    document.addEventListener('mousemove', function (e) {
      hintEl.style.left = e.clientX + 'px';
      hintEl.style.top = e.clientY + 'px';
      var t = e.target.closest ? hintText(e.target) : '';
      if (t) { if (hintEl.textContent !== t) hintEl.textContent = t; hintEl.classList.add('is-visible'); }
      else hintEl.classList.remove('is-visible');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { hintEl.classList.remove('is-visible'); });
  }

  /* ---------- the same hint on touch screens: no hover there, so it sits in the page instead of beside a pointer.
     It rises once, just before the quiz; a tap scrolls to the quiz; it fades when the quiz is reached or started.
     Its space is always reserved, so nothing jumps when it appears or leaves. ---------- */
  var touchOnly = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var nudgeAfter = document.querySelector('.about-editorial');
  var quizEl = document.getElementById('trivia');
  if (touchOnly && nudgeAfter && quizEl) {
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nudgeWrap = document.createElement('div');
    nudgeWrap.className = 'quiz-nudge-wrap';
    var nudge = document.createElement('button');
    nudge.type = 'button';
    nudge.className = 'quiz-nudge';
    nudgeWrap.appendChild(nudge);
    nudgeAfter.parentNode.insertBefore(nudgeWrap, quizEl);

    var nudgeText = function () {
      nudge.textContent = document.documentElement.lang === 'en' ? 'Scroll down, let’s play ↓' : 'גללו למטה ונשחק ↓';
    };
    nudgeText();
    document.addEventListener('sitelangchange', nudgeText);

    var nudgeDone = false;
    var retire = function () {
      if (nudgeDone) return;
      nudgeDone = true;
      nudge.classList.remove('is-in');
      nudge.classList.add('is-done');
      nudge.setAttribute('tabindex', '-1');
    };
    nudge.addEventListener('click', function () {
      quizEl.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      retire();
    });
    if (quizStartBtn) quizStartBtn.addEventListener('click', retire);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, obs) {
        if (es[0].isIntersecting && !nudgeDone) { nudge.classList.add('is-in'); obs.disconnect(); }
      }, { threshold: 1 }).observe(nudgeWrap);
      /* once the quiz fills most of the screen, the hint has done its job */
      new IntersectionObserver(function (es, obs) {
        if (es[0].isIntersecting) { retire(); obs.disconnect(); }
      }, { rootMargin: '0px 0px -55% 0px' }).observe(quizEl);
    } else {
      nudge.classList.add('is-in');
    }
  }

});

/* logo = home. On the home page itself it glides back to the top instead of reloading */
document.addEventListener('DOMContentLoaded', function () {
  var logo = document.querySelector('a.logo-lockup');
  if (!logo) return;
  logo.addEventListener('click', function (e) {
    var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (!onHome) return;
    e.preventDefault();
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });
});
