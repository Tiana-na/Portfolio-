/* ------------------------------------------------------------------
   Analytics (GA4) – one shared file for all pages.

   1. Runs only on the real site, so preview deployments, local files
      and old hosts never reach the analytics data.
   2. Marks your own visits as internal traffic. To switch it on in a
      browser, open the live site once with  ?internal=1  at the end of
      the address. To switch it off, open it with  ?internal=0.
      (A data filter for traffic_type = internal must be active in GA4.)
   3. Sends a few clear events: WhatsApp, email, phone and LinkedIn
      clicks (with the button location) and the quiz start / finish.
------------------------------------------------------------------- */
(function () {
  var MEASUREMENT_ID = 'G-1SDQXED43L';
  var PRODUCTION_HOSTS = ['tianaf-portfolio.vercel.app'];   /* add a custom domain here if one is connected later */
  var INTERNAL_KEY = 'ga-internal';
  var CLARITY_ID = '';   /* heat maps + recordings: paste the Project ID from clarity.microsoft.com between the quotes; empty = off */

  /* Always define the helper so other scripts can call it safely. */
  window.trackEvent = function () {};

  /* Switch the internal flag on or off from the address bar. */
  try {
    var flag = location.search.match(/[?&]internal=(0|1)(&|$)/);
    if (flag) {
      if (flag[1] === '1') localStorage.setItem(INTERNAL_KEY, '1');
      else localStorage.removeItem(INTERNAL_KEY);
    }
  } catch (e) {}

  if (PRODUCTION_HOSTS.indexOf(location.hostname) === -1) return;

  var isInternal = false;
  try { isInternal = localStorage.getItem(INTERNAL_KEY) === '1'; } catch (e) {}

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, isInternal ? { traffic_type: 'internal' } : {});

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(tag);

  /* Microsoft Clarity (heat maps, scroll maps, session recordings).
     Not loaded for your own visits. For visitors in the EEA, UK and
     Switzerland Clarity needs a consent signal; none is sent here, so
     for them it stays off and collects nothing. */
  if (CLARITY_ID && !isInternal) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function pageName() {
    return document.body && document.body.getAttribute('data-page') || location.pathname;
  }

  window.trackEvent = function (name, params) {
    var p = params || {};
    p.page = pageName();
    p.transport_type = 'beacon';
    gtag('event', name, p);
  };

  /* Link clicks, handled once for the whole page (also works for links
     that are rewritten when the language is switched). */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = (a.getAttribute('href') || '').toLowerCase();
    var name = null;
    if (href.indexOf('https://wa.me/') === 0) name = 'whatsapp_click';
    else if (href.indexOf('mailto:') === 0) name = 'email_click';
    else if (href.indexOf('tel:') === 0) name = 'phone_click';
    else if (href.indexOf('linkedin.com/') !== -1) name = 'linkedin_click';
    if (!name) return;
    var place = a.closest('.whatsapp-fab') ? 'floating' :
                a.closest('nav, header') ? 'menu' : 'content';
    window.trackEvent(name, { button_location: place });
  }, true);
})();
