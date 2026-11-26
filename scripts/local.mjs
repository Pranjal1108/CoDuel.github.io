import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import worker from '../dist/server/index.js';
// Online clients use this server only for room coordination.
const host = process.env.CODEDUEL_BIND || '127.0.0.1';
const publicOrigin = process.env.CODEDUEL_PUBLIC_ORIGIN;
const peer = process.env.CODEDUEL_PEER;
const dataDir=process.env.CODEDUEL_DATA_DIR||'.local';
fs.mkdirSync(dataDir,{recursive:true});const sqlite=new DatabaseSync(path.join(dataDir,'duel.sqlite'));
sqlite.exec('CREATE TABLE IF NOT EXISTS rooms (code text PRIMARY KEY,host text NOT NULL,guest text,config text NOT NULL,starts integer,host_result text,guest_result text); CREATE TABLE IF NOT EXISTS profiles(id text PRIMARY KEY,data text NOT NULL);');
const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}};
http.createServer(async(req,res)=>{try{
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>50000){res.writeHead(413);res.end();return}chunks.push(c)}
 let id=(req.headers.cookie||'').match(/(?:^|; )duel_local=([a-f0-9-]+)/)?.[1];if(!id){id=crypto.randomUUID();res.setHeader('Set-Cookie','duel_local='+id+'; HttpOnly; SameSite=Lax; Path=/')}
 if(peer && req.url.split('?')[0]==='/api/duel'){
  if(req.method==='POST' && req.headers.origin!=='http://'+req.headers.host){res.writeHead(403);res.end();return}
  const target=new URL('/api/duel',peer);target.search=new URL(req.url,'http://localhost').search;
  const response=await fetch(target,{method:req.method,redirect:'error',headers:{'Content-Type':'application/json',Origin:target.origin,Cookie:'duel_local='+id},...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
  res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());return;
 }
 const headers=new Headers();for(const [k,v]of Object.entries(req.headers)){if(v&&!k.startsWith('oai-'))headers.set(k,Array.isArray(v)?v.join(','):v)}headers.set('oai-authenticated-user-id',id);
 const request=new Request((publicOrigin || 'http://'+req.headers.host)+req.url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
 const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);res.writeHead(500);res.end('Local server error')}
}).listen(Number(process.env.CODEDUEL_PORT ?? 4317),host,function(){console.log('CodeDuel local preview: http://'+host+':'+this.address().port)});
