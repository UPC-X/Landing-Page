// Public support transport. No credentials or browser session are sent.
(() => {
  async function submit(payload, language = 'es') {
    const configResponse = await fetch('config.json', { cache: 'no-store', credentials: 'omit' });
    if (!configResponse.ok) throw new Error('Support configuration unavailable');
    const config = await configResponse.json();
    const base = new URL(config.apiBase);
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
      throw new Error('Invalid support API origin');
    if (base.username || base.password || base.search || base.hash || base.pathname !== '/')
      throw new Error('Use the API origin without credentials, path or query');
    const response = await fetch(`${base.origin}/api/support/guest`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', 'X-UPCX-Client': 'web', 'Accept-Language': language === 'en' ? 'en-US' : 'es-419' },
      body: JSON.stringify(payload),
    });
    const receipt = await response.json().catch(() => null);
    if (response.status !== 201 || !receipt || typeof receipt.id !== 'string' || !receipt.id || receipt.status !== 'open') {
      const error = new Error('Support request could not be confirmed');
      const retry = Number(response.headers.get('Retry-After'));
      error.retryAfter = Number.isFinite(retry) && retry > 0 ? retry : 0;
      error.requestId = response.headers.get('X-Request-Id') || '';
      throw error;
    }
    return receipt;
  }
  window.UPCXSupport = { submit };
})();
