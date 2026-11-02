/* ===== i18n engine: English (default, lives in the HTML) <-> Hebrew (js/i18n-data.js) ===== */
(function () {
  var LANG_KEY = 'site-lang-v2';

  function getStoredLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function storeLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function applyChrome(lang) {
    var html = document.documentElement;
    if (lang === 'en') {
      html.setAttribute('lang', 'en');
      html.setAttribute('dir', 'ltr');
      html.classList.add('lang-en');
    } else {
      html.setAttribute('lang', 'he');
      html.setAttribute('dir', 'rtl');
      html.classList.remove('lang-en');
    }
  }

  function getDict() {
    var page = (document.body && document.body.getAttribute('data-page')) || '';
    var common = (window.I18N && window.I18N.common) || {};
    var pageDict = (window.I18N && window.I18N[page]) || {};
    var merged = {};
    for (var k in common) merged[k] = common[k];
    for (var k2 in pageDict) merged[k2] = pageDict[k2];
    return merged;
  }

  /* The HTML is English. The first time we run, remember the English
     markup of every translatable element so we can switch back to it. */
  function applyTranslations(lang) {
    var dict = getDict();

    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var el = textEls[i];
      var key = el.getAttribute('data-i18n');
      if (!el.hasAttribute('data-i18n-en')) {
        el.setAttribute('data-i18n-en', el.innerHTML);
      }
      if (lang === 'he' && dict[key] !== undefined) {
        el.innerHTML = dict[key];
      } else {
        el.innerHTML = el.getAttribute('data-i18n-en');
      }
    }

    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariaEls.length; j++) {
      var elA = ariaEls[j];
      var keyA = elA.getAttribute('data-i18n-aria');
      if (!elA.hasAttribute('data-i18n-aria-en')) {
        elA.setAttribute('data-i18n-aria-en', elA.getAttribute('aria-label') || '');
      }
      if (lang === 'he' && dict[keyA] !== undefined) {
        elA.setAttribute('aria-label', dict[keyA]);
      } else {
        elA.setAttribute('aria-label', elA.getAttribute('data-i18n-aria-en'));
      }
    }

    var altEls = document.querySelectorAll('[data-i18n-alt]');
    for (var m = 0; m < altEls.length; m++) {
      var elAlt = altEls[m];
      var keyAlt = elAlt.getAttribute('data-i18n-alt');
      if (!elAlt.hasAttribute('data-i18n-alt-en')) {
        elAlt.setAttribute('data-i18n-alt-en', elAlt.getAttribute('alt') || '');
      }
      if (lang === 'he' && dict[keyAlt] !== undefined) {
        elAlt.setAttribute('alt', dict[keyAlt]);
      } else {
        elAlt.setAttribute('alt', elAlt.getAttribute('data-i18n-alt-en'));
      }
    }
  }

  /* Browser-tab title + meta description (English lives in the HTML) */
  var enTitle = null, enDescription = null;
  function applyMeta(lang) {
    var dict = getDict();
    var descEl = document.querySelector('meta[name="description"]');
    if (enTitle === null) enTitle = document.title;
    if (enDescription === null && descEl) enDescription = descEl.getAttribute('content') || '';

    document.title = (lang === 'he' && dict['meta-title']) ? dict['meta-title'] : enTitle;
    if (descEl) {
      descEl.setAttribute('content',
        (lang === 'he' && dict['meta-description']) ? dict['meta-description'] : enDescription);
    }
  }

  function updateToggleButtons(lang) {
    var btns = document.querySelectorAll('.lang-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = lang === 'en' ? 'עב' : 'EN';
      btns[i].setAttribute('aria-label', lang === 'en' ? 'עבור לעברית' : 'Switch to English');
    }
  }

  var CV_HE = 'assets/tiana-folkenfolk-cv.pdf';
  var CV_EN = 'assets/tiana-folkenfolk-cv-en.pdf';

  function updateCvLinks(lang) {
    var links = document.querySelectorAll('.nav-cv-btn');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', lang === 'en' ? CV_EN : CV_HE);
    }
  }

  window.setSiteLang = function (lang) {
    applyChrome(lang);
    applyTranslations(lang);
    applyMeta(lang);
    updateToggleButtons(lang);
    updateCvLinks(lang);
    storeLang(lang);
    var evt;
    try {
      evt = new CustomEvent('sitelangchange', { detail: { lang: lang } });
    } catch (e) {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('sitelangchange', false, false, { lang: lang });
    }
    document.dispatchEvent(evt);
  };

  document.addEventListener('DOMContentLoaded', function () {
    /* English unless the visitor explicitly chose Hebrew */
    var lang = getStoredLang() === 'he' ? 'he' : 'en';
    window.setSiteLang(lang);

    var toggles = document.querySelectorAll('.lang-toggle');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', function () {
        var current = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'he';
        window.setSiteLang(current === 'en' ? 'he' : 'en');
      });
    }
  });
})();
