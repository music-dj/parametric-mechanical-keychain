import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {solidPart,cad} from './cad-core.mjs';
import {stlSolid} from './stl.mjs';
import {mechanicalDefaults,mechanicalFields} from './mechanical-fields.mjs';
import {openscadExecutable} from './openscad-runtime.mjs';
const run=promisify(execFile),folder=path.dirname(fileURLToPath(import.meta.url)),cache=new Map(),pending=new Map();
export async function generateMechanical(input={}){
 const s={...mechanicalDefaults,...input,project:'mechanical'};
 if(typeof s.text!=='string'||!/^[A-Za-z0-9 ♥★☆☺☀☾♫✿∞◆●✓✚⚡]{1,20}$/u.test(s.text)||!s.text.trim())throw Error('اكتب حتى 20 حرفًا أو رقمًا أو رمزًا من لوحة الرموز؛ كل عنصر على قطعة.');
 if(typeof s.mechanicalFont!=='string'||s.mechanicalFont.length>100||!s.mechanicalFont.trim())throw Error('حدد خطًا صالحًا.');
 if(!['todo','base','texto'].includes(s.mechanicalMode)||typeof s.eslabon_primer_elemento!=='boolean')throw Error('إعداد تصدير غير صحيح.');
 for(const [key,,value,min,max] of mechanicalFields){s[key]=Number(s[key]);if(!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw Error(`قيمة غير صحيحة: ${key}`);}
 if(s.diametro_interno_cilindro>=s.diametro_externo_cilindro)throw Error('قطر الحلقة الداخلي يجب أن يكون أصغر من الخارجي.');
 if(s.altura_letra<0&&-s.altura_letra>=s.alto)throw Error('عمق الحفر يجب أن يكون أقل من سماكة القطعة.');
 if(s.mechanicalMode==='texto'&&s.altura_letra===0)throw Error('ارتفاع النص صفر؛ لا يوجد نص للتصدير.');
 for(const key of ['baseColor','topColor'])if(!/^#[0-9a-f]{6}$/i.test(s[key]))throw Error('لون غير صحيح.');
 const key=JSON.stringify({...s,baseColor:undefined,topColor:undefined});
 if(!cache.has(key)&&!pending.has(key)){
  const job=buildGeometry(s).then(model=>{cache.set(key,model);if(cache.size>8)cache.delete(cache.keys().next().value);return model;}).finally(()=>pending.delete(key));
  pending.set(key,job);
 }
 const model=structuredClone(cache.get(key)||await pending.get(key));model.settings=s;
 for(const part of model.parts)part.color=part.role==='top'?s.topColor:s.baseColor;
 for(const part of model.stlParts)part.color=s.baseColor;
 return model;
}
async function buildGeometry(s){
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'mechanical-')),owned=[];
 try{
  const params={texto:s.text,fuente_seleccionada:s.mechanicalFont,eslabon_primer_elemento:s.eslabon_primer_elemento,...Object.fromEntries(mechanicalFields.map(([key])=>[key,s[key]]))};
  const render=async mode=>{
   // Windows .com argument conversion loses non-ASCII symbols; keep all settings in UTF-8 source.
   const wrapper=path.join(temp,mode+'.scad'),sourcePath=path.join(folder,'mechanical-symbols.scad').replaceAll('\\','/');
   await fs.writeFile(wrapper,`include <${sourcePath}>;\n`+Object.entries({...params,modo_exportacion:mode}).map(([k,v])=>`${k}=${JSON.stringify(v)};`).join('\n'),'utf8');
   const output=path.join(temp,mode+'.stl');await run(openscadExecutable(),['-o',output,wrapper],{windowsHide:true,timeout:180000,maxBuffer:1024*1024,env:{...process.env,OPENSCAD_FONT_PATH:path.join(folder,'assets')}});
   const solid=stlSolid(await fs.readFile(output));owned.push(solid);return solid;
  };
  let whole,base,letters;
  if(s.mechanicalMode==='todo'&&s.altura_letra>0){
   // Wait for both children before removing their shared temporary directory, even on failure.
   const results=await Promise.allSettled([render('base'),render('texto')]);
   const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
   [base,letters]=results.map(r=>r.value);whole=base.add(letters);owned.push(whole);
  }else whole=await render(s.mechanicalMode);
  const box=whole.boundingBox(),shift=box.min.map((v,i)=>i<2?-(v+box.max[i])/2:0),parts=[];
  const part=(solid,name,role,color)=>{const moved=solid.translate(shift);owned.push(moved);return solidPart(moved,name,role,color,[0,0,0]);};
  if(base){parts.push(part(base,'0-base','base',s.baseColor),part(letters,'1-letters-top','top',s.topColor));}
  else parts.push(part(whole,s.mechanicalMode==='texto'?'1-letters-top':'0-base',s.mechanicalMode==='texto'?'top':'base',s.mechanicalMode==='texto'?s.topColor:s.baseColor));
  const warnings=[];if(s.altura_letra<0&&s.mechanicalMode==='todo')warnings.push('النص محفور كالقالب الأصلي؛ لا يضاف حشو ملوّن داخل الحفر.');
  if(s.mechanicalMode==='texto')warnings.push('وضع النص فقط: أجزاء مستقلة دون قاعدة، كما في القالب.');
  warnings.push('تعديل أبعاد المفاصل قد يؤثر في الخلوص؛ افحص السلايس واطبع عينة.');
  const model={kind:'mechanical',text:s.text,settings:s,parts,stlParts:[part(whole,'mechanical','base',s.baseColor)],dimensions:box.max.map((v,i)=>v-box.min[i]),warnings,engine:'Original template.scad / OpenSCAD'};
  return model;
 }finally{owned.forEach(x=>x.delete());await fs.rm(temp,{recursive:true,force:true});}
}
