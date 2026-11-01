const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(join(__dirname, '../js/support.js'), 'utf8');
function setup(responses) {
  const calls = [];
  const window = {};
  runInNewContext(source, { window, URL, fetch: async (...args) => {
    calls.push(args);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  } });
  return { calls, submit: window.UPCXSupport.submit };
}
const config = () => ({ ok: true, json: async () => ({ apiBase: 'https://api.upcx.tech' }) });
test('guest support submits JSON without credentials and returns only an acknowledged receipt', async () => {
  const { calls, submit } = setup([config(), { status: 201, json: async () => ({ id: 'receipt', status: 'open' }), headers: new Headers() }]);
  const payload = { email: 'guest@example.com', subject: 'Consulta', body: 'Contexto ficticio' };
  assert.equal((await submit(payload, 'en')).id, 'receipt');
  assert.equal(calls[0][0], 'config.json');
  assert.equal(calls[1][0], 'https://api.upcx.tech/api/support/guest');
  assert.equal(calls[1][1].credentials, 'omit');
  assert.equal(calls[1][1].headers['Accept-Language'], 'en-US');
  assert.deepEqual(JSON.parse(calls[1][1].body), payload);
});
test('rate limiting never produces a receipt and retains retry/correlation information', async () => {
  const { submit } = setup([config(), { status: 429, json: async () => ({ message: 'Wait' }), headers: new Headers({ 'Retry-After': '60', 'X-Request-Id': 'req-local' }) }]);
  await assert.rejects(submit({}, 'es'), error => error.retryAfter === 60 && error.requestId === 'req-local');
});
test('network and malformed-success responses are rejected without a false acknowledgement', async () => {
  const offline = setup([config(), new TypeError('offline')]);
  await assert.rejects(offline.submit({}));
  const malformed = setup([config(), { status: 200, json: async () => ({}), headers: new Headers() }]);
  await assert.rejects(malformed.submit({}));
});
test('invalid configuration fails before transmitting guest information', async () => {
  const { calls, submit } = setup([{ ok: true, json: async () => ({ apiBase: 'http://remote.example' }) }]);
  await assert.rejects(submit({ email: 'guest@example.com' }));
  assert.equal(calls.length, 1);
});
