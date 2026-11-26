import {topics} from '../src/content.js';
import http from 'node:http';
import { randomBytes } from 'node:crypto';

// Each launch pairs one room with a short-lived, unguessable capability.
export function createBridge(onEvent = () => {}) {
  const sessions = new Map();
  let port=0;
  function pair(room, topic) {
    if (!/^[A-F0-9]{8}$/.test(room) || !topics.some(t=>t.id===topic)) throw Error('Invalid challenge.');
    for (const [key,s] of sessions) if (s.room === room) sessions.delete(key);
    const token = randomBytes(32).toString('hex');
    sessions.set(token, {room, topic, seen:0, pending:false, expires:Date.now()+4*60*60*1000});
    return {url:`http://127.0.0.1:${port}`, token};
  }
  function status(room) {
    const s = [...sessions.values()].find(s=>s.room===room && s.expires>Date.now());
    return {connected:!!s && Date.now()-s.seen<7000, pending:!!s?.pending};
  }
  function run(room) {
    const s = [...sessions.values()].find(s=>s.room===room && s.expires>Date.now());
    if (!s || !status(room).connected) throw Error('Open this challenge in VS Code and trust its workspace first.');
    if (s.pending) throw Error('A test request is already queued.');
    s.pending = true;
  }
  async function handle(req, res) {
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    // Browser pages cannot drive this service, even if they discover its port.
    if (req.headers.origin || req.headers.host!==`127.0.0.1:${port}`) return reply(403,{error:'Forbidden'});
    const s=sessions.get((req.headers.authorization||'').replace(/^Bearer /,''));
    if (!s || s.expires<Date.now()) return reply(401,{error:'Pair again from CodeDuel.'});
    if (req.method==='GET' && req.url==='/commands') {
      s.seen=Date.now(); const command=s.pending?'run':null; s.pending=false;
      return reply(200,{command});
    }
    if (req.method==='POST' && req.url==='/events') {
      let body='';
      for await (const chunk of req) {body+=chunk;if(Buffer.byteLength(body)>100000)return reply(413,{error:'Too large'});}
      let event;try{event=JSON.parse(body)}catch{return reply(400,{error:'Invalid JSON'})}
      if(event.type==='report') {
        const r=event.report;
        if(!r || r.version!==1 || r.room!==s.room || r.topic!==s.topic || !Number.isInteger(r.passed) || r.passed<0 || r.passed>(s.topic==='fastapi'?5:8) || typeof r.source!=='string' || r.source.length>20000 || !Number.isFinite(r.runtime) || r.runtime<0) return reply(400,{error:'Invalid report'});
      } else if(event.type!=='error' || typeof event.message!=='string' || event.message.length>1000) return reply(400,{error:'Invalid event'});
      s.seen=Date.now();onEvent({...event,room:s.room});return reply(200,{ok:true});
    }
    reply(404,{error:'Not found'});
  }
  const server=http.createServer((req,res)=>handle(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();}));
  server.requestTimeout=10000;
  return {pair,status,run,handle,
    async listen(){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});port=server.address().port;return port;},
    close(){sessions.clear();server.closeAllConnections();return new Promise(resolve=>server.close(resolve));}
  };
}
