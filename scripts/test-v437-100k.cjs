/* v437 synthetic 100k Library metadata and selected-scope regression. Network-free. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('src/js/components/316-v437-metadata-recovery-core.js','utf8');
const library=Array.from({length:100000},(_,i)=>({id:'title-'+i,title:'Media '+i,categoryId:'mixed',rating:i%10,progress:i%50,
  externalIds:{},richMetadataManual:i%7?{}:{synopsis:true},synopsis:i%7?'':'User authored',externalRatings:{}}));
const original=library.map(x=>[x.rating,x.progress,x.synopsis]);
const ctx={window:{},console,S:{library,categories:[{id:'mixed',name:'Mixed'}],settings:{}},
  AUTH_USER:{id:'unit-user'},Date,Math,Map,Set,Number,String,JSON,Promise,
  mf424Account:()=> 'unit-user',mf424Storage:async()=>null,saveState:async()=>{},persistLibrary:()=>{},
  mf436SelectedLibraryIds:()=>library.slice(0,101).map(x=>x.id),v176SafeText:x=>String(x),
  mf437Paint:()=>{},App:{},setTimeout,clearTimeout};
vm.createContext(ctx);vm.runInContext(code,ctx);
const t=Date.now();
const all=vm.runInContext('mf437SelectedIds("all")',ctx);
assert.equal(all.length,100000);
assert.equal(new Set(all).size,100000);
const chosen=vm.runInContext('mf437SelectedIds("selected")',ctx);assert.equal(chosen.length,101);
for(let i=0;i<100000;i++){
 const item=library[i],score=(i%100);
 const change=vm.runInContext('mf437Merge',ctx)(item,{verified:true,provider:'vndb',
  fields:{synopsis:'Factual description '+i,originalTitle:'Original '+i},
  ratings:{vndb:{value:score,scale:100,votes:i,updatedAt:1}},ids:{vndb:'v'+i},sourceUrl:'https://vndb.org/v'+i},'missing');
 assert(change.changed>=1);
 if(i%7===0)assert.equal(item.synopsis,'User authored');
 assert.equal(item.rating,original[i][0]);
 assert.equal(item.progress,original[i][1]);
}
console.log('v437 100k title metadata merge complete in',Date.now()-t,'ms; all personal ratings, progress, and protected descriptions unchanged');
