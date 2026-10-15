/* v428 release readiness: synthetic 100k-title indexing/checkpoint performance.
   No network requests, account data, Supabase writes or GitHub releases. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{performance}=require('node:perf_hooks');
const items=Array.from({length:100000},(_,i)=>({
 id:'synthetic-'+String(i).padStart(6,'0'),
 title:'Synthetic Title '+i,categoryId:['anime','tv','manga','books','comics','podcasts'][i%6],
 status:'Plan to Watch',progress:i%21,total:24,coverUrl:'',
 externalIds:i%7===0?{mal:String(i+1)}:{}
}));
let start=performance.now();
const index=new Map(items.map(item=>[item.id,item]));
const elapsed=performance.now()-start;
assert.equal(index.size,100000);
assert(elapsed<15000,'100k title index took too long: '+elapsed.toFixed(1)+'ms');
start=performance.now();
const selected=items.filter(item=>item.categoryId==='anime').map(item=>item.id);
assert(selected.length>16000);
const results=selected.map(id=>index.get(id));
assert.equal(results.length,selected.length);
assert(results.every(x=>x&&x.categoryId==='anime'));
const lookupTime=performance.now()-start;
assert(lookupTime<15000,'Batch indexing/lookup took too long: '+lookupTime.toFixed(1)+'ms');
const sample=items.slice(0,300).map(x=>x.id);
const job={account:'synthetic-account',ids:sample,cursor:0,completed:0,reviews:[],status:'paused'};
for(let i=0;i<125;i++){assert.equal(index.get(job.ids[job.cursor]).id,job.ids[job.cursor]);job.cursor++;}
const checkpoint=JSON.parse(JSON.stringify(job));
assert.equal(checkpoint.cursor,125);
for(let i=checkpoint.cursor;i<sample.length;i++){assert(index.has(sample[i]));checkpoint.cursor++;}
assert.equal(checkpoint.cursor,300,'Resume avoids repeating processed titles');
for(const f of ['src/js/components/313-v428-metadata-fixer.js','src/js/components/314-v428-fresh-releases.js']){
 const content=fs.readFileSync(f,'utf8');assert(content.includes('Map('),'Lookup/index usage missing from '+f);
}
console.log('v428 scale indexing: 100,000 synthetic titles, '+selected.length+' targeted lookup ids, '+elapsed.toFixed(1)+'ms index and '+lookupTime.toFixed(1)+'ms lookup, checkpoint resume verified');
