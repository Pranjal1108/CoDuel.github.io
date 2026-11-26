import { GET, POST } from '../src/api.js';

const pagesOrigin = 'https://pranjal1108.github.io';
const tokenPattern = /^Bearer ([a-f0-9-]{36}[a-f0-9-]{36})$/;

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/duel') return new Response(null, {status: 404});
    if (request.headers.get('Origin') !== pagesOrigin) return new Response(null, {status: 403});
    const headers = {
      'Access-Control-Allow-Origin': pagesOrigin,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-store',
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    if (!['GET','POST'].includes(request.method)) return new Response(null, {status: 405, headers});
    const match = tokenPattern.exec(request.headers.get('Authorization') || '');
    if (!match) return Response.json({error: 'Missing player session.'}, {status: 401, headers});
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1]));
    const player = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
    let body;
    if (request.method === 'POST') {
      const chunks = [];
      let size = 0;
      for await (const chunk of request.body || []) {
        size += chunk.length;
        if (size > 50000) return Response.json({error: 'Request too large.'}, {status: 413, headers});
        chunks.push(chunk);
      }
      body = new Blob(chunks);
    }
    const internal = new Request(request.url, {method: request.method, body, headers: {'oai-authenticated-user-id': player}});
    const result = await (request.method === 'GET' ? GET : POST)(internal, env);
    return new Response(result.body, {status: result.status, headers: {...headers, 'Content-Type': 'application/json'}});
  }
};
