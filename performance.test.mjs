import fs from 'node:fs';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {unzipSync,strFromU8} from 'fflate';
const exec=childProcess.execFile;let calls=0;
childProcess.execFile=function(...args){calls++;return exec.apply(this,args);};syncBuiltinESMExports();
const {generateMechanical}=await import('./mechanical.mjs'),{cad}=await import('./cad-core.mjs');
const solid=p=>new cad.Manifold(new cad.Mesh({numProp:3,vertProperties:new Float32Array(p.vertices),triVerts:new Uint32Array(p.triangles)}));
const fixtures=JSON.parse(strFromU8(unzipSync(fs.readFileSync(new URL('./tests/original-geometry.zip',import.meta.url)))['original.json']));
for(const fixture of fixtures){
 const model=await generateMechanical(fixture.input);assert.deepEqual(model.dimensions,fixture.dimensions);
 const plain=p=>({...p,vertices:Array.from(p.vertices),triangles:Array.from(p.triangles)});
 assert.deepEqual(model.parts.map(plain),fixture.parts);
 const a=solid(fixture.whole),b=solid(model.stlParts[0]),ab=a.subtract(b),ba=b.subtract(a);
 assert.equal(b.status(),'NoError');assert.ok(ab.volume()+ba.volume()<.00001,'Changed solid geometry');
 [a,b,ab,ba].forEach(p=>p.delete());console.log('Identical original geometry:',JSON.stringify(fixture.input));
}
const before=calls,one=generateMechanical({text:'CACHE',baseColor:'#112233'}),two=generateMechanical({text:'CACHE',baseColor:'#AABBCC'});
const [a,b]=await Promise.all([one,two]);assert.equal(calls-before,2,'Concurrent identical geometry should share two renders');
assert.equal(a.parts[0].color,'#112233');assert.equal(b.parts[0].color,'#AABBCC');
a.parts[0].vertices[0]=9999;const count=calls,c=await generateMechanical({text:'CACHE',topColor:'#123456'});
assert.equal(calls,count,'Recolor should not launch OpenSCAD');assert.notEqual(c.parts[0].vertices[0],9999);assert.equal(c.parts[1].color,'#123456');
await assert.rejects(()=>generateMechanical({text:'CACHE',baseColor:'invalid'}));assert.equal(calls,count);
console.log('Performance checks passed: original geometry, deduplicated renders, no render on recolor, isolated cache.');process.exit(0);
