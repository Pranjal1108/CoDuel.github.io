import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function checkRoom(origin, apiOrigin, send = fetch) {
  const endpoint = new URL('/api/duel', apiOrigin);
  function session() {
    const token = randomUUID() + randomUUID();
    return async (body, code) => {
      const url = new URL(endpoint);
      if (code) url.searchParams.set('code', code);
      const response = await send(new Request(url, {
        method: body ? 'POST' : 'GET',
        headers: {Origin: origin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: body && JSON.stringify(body)
      }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
      return response.json();
    };
  }
  const host = session(), guest = session();
  const {code} = await host({action:'create', mode:'blind', topic:'arrays', study:1, duration:10});
  assert.match(code, /^[A-F0-9]{8}$/);
  assert.equal((await guest({action:'join', code})).code, code);
  for (const [client, role] of [[host,'host'],[guest,'guest']]) {
    const room = await client(undefined, code);
    assert.equal(room.code, code);
    assert.equal(room.role, role);
    assert.equal(room.hasGuest, true);
  }
  return code;
}

if (process.argv[2]) {
  const page = new URL(process.argv[2]);
  const response = await fetch(page);
  assert.equal(response.status, 200);
  const html = await response.text();
  const match = html.match(/<meta name="duel-api" content="([^"]+)">/);
  assert.ok(match, 'Published page must contain the room API endpoint');
  console.log('Verified host and guest in room', await checkRoom(page.origin, match[1]));
}
