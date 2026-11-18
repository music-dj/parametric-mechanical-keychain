// Keep the active calculation and only the newest waiting edit.
module.exports=function latestQueue(generate){
 let active=false,pending=null;
 async function drain(){
  if(active)return;active=true;
  try{while(pending){const job=pending;pending=null;try{job.resolve(await generate(job.input));}catch(error){job.reject(error);}}}
  finally{active=false;}
 }
 return input=>new Promise((resolve,reject)=>{
  if(pending)pending.reject(Error('Superseded by a newer edit.'));
  pending={input,resolve,reject};void drain();
 });
};
