import { topics, challenge } from './content.js';


const json=(x    ,status=200)=>Response.json(x,{status});
async function identity(req        ){return req.headers.get('oai-authenticated-user-id');}
export async function POST(req, env){
 try{
 const id=await identity(req);if(!id)return json({error:'Sign in with ChatGPT to create or join a room.'},401);
 const db=env.DB;if(!db)return json({error:'Room storage is not available.'},503);
 const b=await req.json()       ;
 if(b.action==='profile'){if(typeof b.name!=='string'||b.name.length>32||!Array.isArray(b.skills)||b.skills.some((s    )=>!topics.map(t=>t.id).includes(s)))return json({error:'Invalid profile.'},400);await db.prepare('INSERT INTO profiles(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,JSON.stringify({name:b.name,skills:b.skills})).run();return json({ok:true});}
 if(b.action==='create'){
 if(!['normal','blind'].includes(b.mode)||!topics.map(t=>t.id).includes(b.topic)||![1,3,5,10].includes(b.study)||![10,20,30].includes(b.duration))return json({error:'Choose valid round settings.'},400);
 const p    =await db.prepare('SELECT data FROM profiles WHERE id=?').bind(id).first();const profile=p?JSON.parse(p.data):{name:'Player',skills:[]};
 if(b.mode==='normal'&&!profile.skills.includes(b.topic))return json({error:'Add this topic to your skills profile first.'},400);
 const code=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
 await db.prepare('INSERT INTO rooms(code,host,config) VALUES(?,?,?)').bind(code,id,JSON.stringify({mode:b.mode,topic:b.topic,study:b.study,duration:b.duration,hostName:profile.name})).run();return json({code});
 }
 const code=String(b.code||'').toUpperCase();const room    =await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
 if(!room)return json({error:'Room not found. Check the invite code.'},404);
 const c=JSON.parse(room.config);
 if(b.action==='join'){
 if(room.host===id||room.guest===id)return json({code});
 const p    =await db.prepare('SELECT data FROM profiles WHERE id=?').bind(id).first();const profile=p?JSON.parse(p.data):{name:'Challenger',skills:[]};
 if(c.mode==='normal'&&!profile.skills.includes(c.topic))return json({error:'This room uses '+c.topic+'. Add it to your skills profile before joining.'},400);
 const result=await db.prepare('UPDATE rooms SET guest=?,config=? WHERE code=? AND guest IS NULL AND starts IS NULL').bind(id,JSON.stringify({...c,guestName:profile.name}),code).run();
 if(!result.meta.changes)return json({error:'This room is full or already started.'},409);return json({code});
 }
 if(room.host!==id&&room.guest!==id)return json({error:'You are not a participant in this room.'},403);
 if(b.action==='start'){
 if(room.host!==id||!room.guest)return json({error:'The host can start when both players have joined.'},400);
 await db.prepare('UPDATE rooms SET starts=? WHERE code=? AND starts IS NULL').bind(Date.now()+3000,code).run();return json({ok:true});
 }
 if(b.action==='submit'){
 const begin=room.starts+(c.mode==='blind'?c.study*60000:0);const now=Date.now();
 if(!room.starts||now<begin||now>begin+c.duration*60000)return json({error:'Submissions are only accepted during the coding round.'},400);
 const total=c.topic==='fastapi'?5:challenge(c.topic).tests.length;
 if(!Number.isInteger(b.passed)||b.passed<0||b.passed>total||![b.timeRank,b.spaceRank].every(x=>Number.isInteger(x)&&x>=0&&x<=4)||typeof b.source!=='string'||b.source.length>20000)return json({error:'Invalid submission.'},400);
 const col=room.host===id?'host_result':'guest_result';
 const result={passed:b.passed,total,timeRank:b.timeRank,spaceRank:b.spaceRank,elapsed:now-begin,source:b.source,runtime:typeof b.runtime==='number'&&Number.isFinite(b.runtime)?Math.max(0,b.runtime):0};
 const updated=await db.prepare('UPDATE rooms SET '+col+'=? WHERE code=? AND '+col+' IS NULL').bind(JSON.stringify(result),code).run();
 if(!updated.meta.changes)return json({error:'Your final submission is already locked.'},409);return json({ok:true});
 }
 return json({error:'Unknown action.'},400);
 }catch{return json({error:'Could not complete the request. Please try again.'},500)}
}
export async function GET(req, env){
 try{
 const id=await identity(req);if(!id)return json({signedIn:false});
 const db=env.DB;if(!db)return json({error:'Storage is unavailable.'},503);
 const url=new URL(req.url), code=url.searchParams.get('code');
 if(!code){const p    =await db.prepare('SELECT data FROM profiles WHERE id=?').bind(id).first();return json({signedIn:true,profile:p?JSON.parse(p.data):{name:'Player',skills:[]}});}
 const r    =await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code.toUpperCase()).first();
 if(!r||r.host!==id&&r.guest!==id)return json({error:'Join this room to view it.'},403);
 const c=JSON.parse(r.config),end=r.starts+(c.mode==='blind'?c.study*60000:0)+c.duration*60000;
 const done=!!(r.host_result&&r.guest_result)||!!r.starts&&Date.now()>end;
 const result=(s    ,own        )=>{if(!s)return null;const parsed=JSON.parse(s);if(!done&&!own)delete parsed.source;return parsed;};
 return json({code:r.code,config:c,role:r.host===id?'host':'guest',hasGuest:!!r.guest,starts:r.starts,now:Date.now(),hostResult:result(r.host_result,r.host===id),guestResult:result(r.guest_result,r.guest===id),done});
 }catch{return json({error:'Unable to load room.'},500)}
}

