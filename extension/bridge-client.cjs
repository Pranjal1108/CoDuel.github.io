const http=require('node:http');
function validBridge(c){
 if(!c || typeof c.bridge!=='string' || !/^http:\/\/127\.0\.0\.1:[0-9]{1,5}$/.test(c.bridge) || !/^[a-f0-9]{64}$/.test(c.token||''))return false;
 const port=Number(c.bridge.slice(c.bridge.lastIndexOf(':')+1));return port>0&&port<=65535;
}
function bridgeRequest(config,route,data){
 if(!validBridge(config))return Promise.reject(Error('No desktop connection. Open this challenge from CodeDuel.'));
 return new Promise((resolve,reject)=>{
  const body=data?JSON.stringify(data):null;
  const request=http.request(config.bridge+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+config.token,...(body?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}:{})}},response=>{
   let text='';response.on('data',chunk=>{text+=chunk;if(text.length>100000)request.destroy(Error('Desktop response too large.'));});
   response.on('end',()=>{try{const value=JSON.parse(text);if(response.statusCode!==200)reject(Error(value.error||'Desktop request failed.'));else resolve(value);}catch{reject(Error('Invalid desktop response.'));}});
  });
  request.setTimeout(3000,()=>request.destroy(Error('Desktop connection timed out.')));
  request.on('error',reject);if(body)request.write(body);request.end();
 });
}
module.exports={validBridge,bridgeRequest};
