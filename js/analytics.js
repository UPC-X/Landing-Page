// Visits and calls to action of the landing (report sections 8.2.7 and 8.3.3.2), sent to PostHog without cookies
// or storage: every page load is a new anonymous visitor, no person profile is created and the browser's
// "do not track" or Global Privacy Control choice turns it off. Nothing is sent until config.json names a key.
(function () {
  'use strict';
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  const visitor = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  let target;

  function send(event, properties) {
    if (!target) return;
    const body = JSON.stringify({
      api_key: target.key,
      event: event,
      distinct_id: visitor,
      timestamp: new Date().toISOString(),
      properties: Object.assign({
        $process_person_profile: false,
        $current_url: location.origin + location.pathname,
        $pathname: location.pathname,
        $host: location.host,
        $referrer: document.referrer ? new URL(document.referrer).origin : '$direct',
        language: document.documentElement.lang || 'es',
        source: 'landing'
      }, properties || {})
    });
    const url = target.host + '/i/v0/e/';
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' })))) {
      fetch(url, { method: 'POST', body: body, keepalive: true, credentials: 'omit' }).catch(function () {});
    }
  }

  fetch('config.json', { cache: 'no-store', credentials: 'omit' })
    .then(function (response) { return response.ok ? response.json() : {}; })
    .then(function (config) {
      if (!config.posthogKey) return;
      target = { key: config.posthogKey, host: (config.posthogHost || 'https://us.i.posthog.com').replace(/\/+$/, '') };
      send('$pageview');
    })
    .catch(function () {});

  document.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('[data-cta]');
    if (link) send('cta_clicked', { cta: link.getAttribute('data-cta') });
  });
})();
