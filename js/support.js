// Public support transport. No credentials or browser session are sent.
(() => {
  let configuration;
  let waking;
  let awakeAt = 0;
  async function deadline(operation, milliseconds) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), milliseconds);
    try { return await operation(controller.signal); }
    finally { clearTimeout(timer); }
  }
  async function origin() {
    configuration ??= deadline(async signal => {
      const response = await fetch('config.json', { signal, cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Support configuration unavailable');
      const config = await response.json();
      const base = new URL(config.apiBase);
      if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
        throw new Error('Invalid support API origin');
      if (base.username || base.password || base.search || base.hash || base.pathname !== '/')
        throw new Error('Use the API origin without credentials, path or query');
      return base.origin;
    }, 10000).catch(error => { configuration = undefined; throw error; });
    return configuration;
  }
  async function warm() {
    if (Date.now() - awakeAt < 10 * 60 * 1000) return;
    waking ??= (async () => {
      const base = await origin();
      const until = Date.now() + 150000;
      for (;;) {
        try {
          await deadline(async signal => {
            const response = await fetch(`${base}/actuator/health/liveness`, { signal, credentials: 'omit', cache: 'no-store' });
            if (!response.ok) throw new Error('Server starting');
          }, Math.min(30000, until - Date.now()));
          awakeAt = Date.now();
          return;
        } catch (error) {
          if (Date.now() >= until) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.min(1000, until - Date.now())));
        }
      }
    })().finally(() => { waking = undefined; });
    return waking;
  }
  async function submit(payload, language = 'es') {
    await warm();
    const base = await origin();
    // A POST is sent once. A timeout might mean it was saved; never replay guest content automatically.
    return deadline(async signal => {
      const response = await fetch(`${base}/api/support/guest`, {
        signal,
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
    }, 30000);
  }
  window.UPCXSupport = { submit, warm };
})();
