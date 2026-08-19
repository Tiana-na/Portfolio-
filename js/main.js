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
  var quizStartBtn = document.getElementById('quiz-start-btn');
  var quizCard = document.getElementById('quiz-card');

  if (quizStartBtn && quizCard) {
    var quizNav = quizCard.querySelector('.quiz-nav');
    var quizProgressTrack = quizCard.querySelector('.quiz-progress-track');
    var quizSkipBtn = document.getElementById('quiz-skip-btn');
    var quizNextBtn = document.getElementById('quiz-next-btn');
    var quizProgressText = document.getElementById('quiz-progress-text');
    var quizProgressBar = document.getElementById('quiz-progress-bar');
    var quizQuestionBlock = document.getElementById('quiz-question-block');
    var quizQText = document.getElementById('quiz-q-text');
    var quizQOptions = document.getElementById('quiz-q-options');
    var quizQFeedback = document.getElementById('quiz-q-feedback');
    var quizResults = document.getElementById('quiz-results');

    var triviaData = [
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
        question: 'איזה גיבור-על היית/ה רוצה להיות?',
        options: [
          { text: 'איירון מן - הכסף פותר הכל', feedback: 'פקטור התקציב! פרויקט עם תקציב בלתי מוגבל וטכנולוגיה מטורפת זה החלום של כל מעצב/ת מוצר. לעצב בלי מגבלות... תענוג.' },
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
        question: 'איך את/ה קורא/ת ספרים?',
        options: [
          { text: 'ספר אחד בכל פעם, עד הסוף', feedback: 'פוקוס של לייזר! את/ה כנראה טיפוס של משימה אחת בכל פעם (Single-tasking) - מעמיק/ה, יסודי/ת, ולא עוזב/ת פרויקט עד שהוא פיקס בייצור.' },
          { text: 'כמה ספרים במקביל, לפי מצב רוח', feedback: 'מולטיטאסקינג בדם! חשיבה רוחבית מעולה. מתמרנ/ת בין משימות ומתאימ/ה את עצמך לשינויים בקצב מהיר ויודע/ת לתמרן בין פרויקטים בסטודיו.' },
          { text: 'מתחיל/ה הרבה, מסיים/ת מעט', feedback: 'חוקר/ת אמיתי/ת! שלב ה-Discovery והמחקר הוא האהוב עלייך. המון סקרנות ורעיונות חדשים בראש (רק לזכור לסגור טאבים בפיגמה בסוף).' }
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
        feedbackGeneral: 'חחח לגמרי! כולנו סובלים מאותם דברים בדיוק. הבטחה שלי: בפורטפוליו שלי אין אף מבחן רובוטים מעצבן, והכל בגודל לחיץ, נגיש ומאוזן לפי חוקי ה-UX.'
      }
    ];

    var currentIndex = 0;

    function renderQuizQuestion() {
      var data = triviaData[currentIndex];
      quizProgressText.textContent = 'שאלה ' + (currentIndex + 1) + ' מתוך ' + triviaData.length;
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
      var data = triviaData[currentIndex];
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
      quizNextBtn.hidden = false;
    }

    function showQuizResults() {
      quizQuestionBlock.hidden = true;
      quizNav.hidden = true;
      quizProgressTrack.hidden = true;
      quizResults.hidden = false;
    }

    quizStartBtn.addEventListener('click', function () {
      quizStartBtn.hidden = true;
      quizCard.hidden = false;
      renderQuizQuestion();
    });

    quizNextBtn.addEventListener('click', function () {
      currentIndex++;
      if (currentIndex < triviaData.length) {
        renderQuizQuestion();
      } else {
        showQuizResults();
      }
    });

    if (quizSkipBtn) {
      quizSkipBtn.addEventListener('click', function () {
        showQuizResults();
      });
    }
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
