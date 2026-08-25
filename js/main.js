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

    var currentIndex = 0;
    var advanceTimer = null;

    function renderQuizQuestion() {
      var data = triviaData[currentIndex];
      quizProgressText.textContent = 'שאלה ' + (currentIndex + 1) + ' מתוך ' + triviaData.length;
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

      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(advanceQuiz, AUTO_ADVANCE_DELAY);
    }

    function advanceQuiz() {
      currentIndex++;
      if (currentIndex < triviaData.length) {
        renderQuizQuestion();
      } else {
        showQuizResults();
      }
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
    });

    if (quizSkipBtn) {
      quizSkipBtn.addEventListener('click', function () {
        showQuizResults();
      });
    }
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

});
