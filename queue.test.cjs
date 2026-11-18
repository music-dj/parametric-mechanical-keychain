const assert=require('node:assert/strict'),latestQueue=require('./generation-queue.cjs');
(async()=>{
 const calls=[],releases=[];let active=0;
 const run=latestQueue(async input=>{assert.equal(++active,1);calls.push(input);await new Promise(r=>releases.push(r));active--;if(input==='fail')throw Error('expected');return input;});
 const first=run('first'),obsolete=run('obsolete').catch(e=>e.message),last=run('last');
 assert.match(await obsolete,/Superseded/);assert.deepEqual(calls,['first']);releases.shift()();assert.equal(await first,'first');
 await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['first','last']);releases.shift()();assert.equal(await last,'last');
 const failed=run('fail');releases.shift()();await assert.rejects(failed,/expected/);
 const recovery=run('recovered');releases.shift()();assert.equal(await recovery,'recovered');
 console.log('Queue tests passed: newest edit, one active job, rejection and recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
