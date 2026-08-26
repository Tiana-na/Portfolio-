/* ===== i18n engine: Hebrew <-> English site-wide language switch ===== */
(function () {
  var LANG_KEY = 'site-lang';

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

  function applyTranslations(lang) {
    var dict = getDict();

    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var el = textEls[i];
      var key = el.getAttribute('data-i18n');
      if (!el.hasAttribute('data-i18n-he')) {
        el.setAttribute('data-i18n-he', el.innerHTML);
      }
      if (lang === 'en' && dict[key] !== undefined) {
        el.innerHTML = dict[key];
      } else {
        el.innerHTML = el.getAttribute('data-i18n-he');
      }
    }

    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariaEls.length; j++) {
      var elA = ariaEls[j];
      var keyA = elA.getAttribute('data-i18n-aria');
      if (!elA.hasAttribute('data-i18n-aria-he')) {
        elA.setAttribute('data-i18n-aria-he', elA.getAttribute('aria-label') || '');
      }
      if (lang === 'en' && dict[keyA] !== undefined) {
        elA.setAttribute('aria-label', dict[keyA]);
      } else {
        elA.setAttribute('aria-label', elA.getAttribute('data-i18n-aria-he'));
      }
    }

    var altEls = document.querySelectorAll('[data-i18n-alt]');
    for (var m = 0; m < altEls.length; m++) {
      var elAlt = altEls[m];
      var keyAlt = elAlt.getAttribute('data-i18n-alt');
      if (!elAlt.hasAttribute('data-i18n-alt-he')) {
        elAlt.setAttribute('data-i18n-alt-he', elAlt.getAttribute('alt') || '');
      }
      if (lang === 'en' && dict[keyAlt] !== undefined) {
        elAlt.setAttribute('alt', dict[keyAlt]);
      } else {
        elAlt.setAttribute('alt', elAlt.getAttribute('data-i18n-alt-he'));
      }
    }
  }

  function updateToggleButtons(lang) {
    var btns = document.querySelectorAll('.lang-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = lang === 'en' ? 'עב' : 'EN';
      btns[i].setAttribute('aria-label', lang === 'en' ? 'עבור לעברית' : 'Switch to English');
    }
  }

  window.setSiteLang = function (lang) {
    applyChrome(lang);
    applyTranslations(lang);
    updateToggleButtons(lang);
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
    var lang = getStoredLang() || 'he';
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
