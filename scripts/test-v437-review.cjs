/* MediaFlow v437 — conflict preview / undo safety tests, network free. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/316-v437-metadata-recovery-core.js','utf8');
const saved=[],library=[
 {id:'a',title:'Example',categoryId:'game',synopsis:'Original',rating:9,progress:6,
  richMetadataManual:{},externalRatings:{imdb:{value:7.5,scale:10}}},
 {id:'b',title:'Other',categoryId:'game',synopsis:'Owner writing',rating:8,richMetadataManual:{synopsis:true}}
];
const ctx={console,window:{},S:{library,categories:[],settings:{}},AUTH_USER:{id:'a-user'},Date,Math,Map,Set,Promise,
 mf424Account:()=> 'a-user',mf424Storage:async(a,k,v)=>{if(a==='put')saved.push(v);return null;},setTimeout:fn=>{fn();return 1;},
 saveState:async()=>{},persistLibrary:()=>{},mf437Paint:()=>{},v176SafeText:s=>String(s)};
vm.createContext(ctx);vm.runInContext(source,ctx);
const proposal=vm.runInContext('mf437Merge',ctx)(library[0],{provider:'omdb',verified:true,fields:{synopsis:'Revised'},
 ratings:{imdb:{value:8.6,scale:10,updatedAt:1}},ids:{},sourceUrl:'https://example.org'},'review');
assert.equal(library[0].synopsis,'Original','Review must not mutate title');
assert.deepEqual(Object.keys(proposal.preview.after),['synopsis']);
vm.runInContext('MF437.job={version:437,account:"a-user",ids:["a"],cursor:1,status:"waiting-review",updated:0,events:[],previews:[]}',ctx);
vm.runInContext('MF437.job.previews.push({titleId:"a",provider:"omdb",before:{synopsis:"Original"},after:{synopsis:"Revised"}})',ctx);
(async()=>{
 const applied=await vm.runInContext('mf437ApplyReviews({0:["synopsis"]})',ctx);
 assert.equal(applied,1);
 assert.equal(library[0].synopsis,'Revised');
 assert.equal(library[0].rating,9);assert.equal(library[0].progress,6);
 const undone=await vm.runInContext('mf437UndoRecent()',ctx);
 assert.equal(undone.events,1);assert.equal(library[0].synopsis,'Original');
 assert.equal((await vm.runInContext('mf437UndoRecent()',ctx)).events,0,'Undo is idempotent');
 const disallowed=vm.runInContext('mf437Merge',ctx)(library[1],{verified:true,provider:'omdb',fields:{synopsis:'Provider'},
  ids:{},ratings:{},sourceUrl:''},'review');
 assert.equal(disallowed.changed,0);
 assert.equal(library[1].synopsis,'Owner writing','Manual metadata cannot be proposed for replacement');
 vm.runInContext('MF437.job={version:437,account:"a-user",ids:["a"],cursor:0,status:"queued",updated:0,skipped:0,errors:0,partSize:100,mode:"review",providers:["itunes"],engine:"smart",events:[],previews:[],failedIds:[]};mf437Discover=async ()=>({provider:"itunes",title:"Example",verified:true,matchedBy:"title",externalIdVerified:false,fields:{synopsis:"Final title review"},ratings:{},ids:{},sourceUrl:""})',ctx);
 await vm.runInContext('mf437ProcessLocked()',ctx);
 assert.equal(vm.runInContext('MF437.job.status',ctx),'waiting-review','Final-title review must not be silently completed');
 assert.equal(library[0].synopsis,'Original','Review must never commit automatically');
 assert.equal(vm.runInContext('MF437.job.previews.length',ctx),1);
 console.log('v437 recovery review and eligible undo contracts passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
