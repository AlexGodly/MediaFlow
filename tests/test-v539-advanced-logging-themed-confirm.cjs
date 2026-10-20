/* v539: execute the real Advanced Logging bulk handler, not a mock rewrite. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=539);
const source=read('src/js/components/288-v394-advanced-logging.js');
const start=source.indexOf('let V539_SEASON_REPLACE_CONFIRM_PENDING=false;');
const end=source.indexOf('App.v394SetWhen=function(',start);
assert(start>=0&&end>start,'real quantity handler available');
const code=source.slice(start,end);
assert(!code.includes('window.confirm('),'Native confirmation forbidden');
assert(code.includes("v336Confirm(message,{"));
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
assert(bundle.includes('Replace detailed season entries?'));
const css=read('assets/css/163-v336-dialogs-active-time-analytics.css');
assert(css.includes('.v336-dialog')&&css.includes('@media(max-width:640px)'));
const seasons=[{id:'s1',name:'Season One',number:1,total:20,progress:0},{id:'s2',name:'Season Two',number:2,total:20,progress:0}];
const item={id:'t1',title:'Demo Anime'};
const units=()=>[
{id:'a1',number:1,seasonId:'s1',loggedAt:100,durationSeconds:1200,isRepeat:false},
{id:'a3',number:3,seasonId:'s1',loggedAt:300,durationSeconds:2400,isRepeat:false},
{id:'b1',number:1,seasonId:'s2',loggedAt:500,durationSeconds:1200,isRepeat:false}
];
const draft=()=>({entries:[{libraryId:'t1',v394Method:'amount',v369SelectedSeasonId:'s1',isRepeat:false,v369Units:units()}]});
let seq=0,syncs=0,paints=0,dialogs=[],resolvers=[],toasts=[];
const C=vm.createContext({
 S:{logDraft:draft()},App:{},Date,Math,Number,Set,Map,Array,JSON,
 window:{confirm(){throw Error('Native window.confirm invoked');}},
 console:{warn:e=>{throw e;}},
 v394Entry:i=>C.S.logDraft?.entries?.[Number(i)]||null,
 v369ItemTitle:e=>e?.libraryId==='t1'?item:null,
 v394Relevant:e=>{const season=seasons.find(s=>s.id===e.v369SelectedSeasonId);
   return {season,units:e.v369Units.filter(u=>String(u.seasonId||'')===String(season?.id||''))};},
 v394SameSeason:(u,season)=>String(u.seasonId||'')===String(season?.id||''),
 v394Base:()=>0,v394Method:e=>e.v394Method,
 v394NumberLimit:season=>season?.total||20,
 v394ExactContiguous:(rows,b)=>rows.map(u=>u.number).sort((a,z)=>a-z).every((n,i)=>n===b+i+1),
 v369Seconds:u=>u.durationSeconds,v369DefaultSeconds:()=>1800,
 v400BulkStamp:()=>10000,v369Sync(){syncs++;},v394Paint(){paints++;},
 showToast:msg=>toasts.push(msg),cleanTitle:String,uid:()=>String(++seq),
 v336Confirm:(message,options)=>{dialogs.push({message,options});return new Promise(resolve=>resolvers.push(resolve));},
 v279Confirm:()=>{throw Error('v336 should be preferred');}
});
vm.runInContext(code,C);
const edit=n=>vm.runInContext('App.v394SetQuantity(0,'+JSON.stringify(String(n))+')',C);
const finish=choice=>{const fn=resolvers.shift();assert(fn);fn(choice);};
const copy=()=>JSON.stringify(C.S.logDraft.entries[0].v369Units);
(async()=>{
 const before=copy();
 const cancel=edit(1);
 assert.equal(dialogs.length,1);
 assert(dialogs[0].message.includes('Season One'));
 assert(dialogs[0].message.includes('Demo Anime'));
 assert(dialogs[0].message.includes('\\n\\n')===false,'Message must not display literal backslash-n escapes');
 assert(dialogs[0].message.includes('\n\n'),'Message must use actual paragraph breaks');
 assert(dialogs[0].options.cancelIcon==='keep'&&dialogs[0].options.confirmIcon==='replace','Use meaningful Keep/Replace icons');
 assert(dialogs[0].options.confirmText==='Replace season entries');
 assert(dialogs[0].options.cancelText==='Keep detailed entries');
 assert.equal(copy(),before,'No changes before user confirmation');
 finish(false);await cancel;
 assert.equal(copy(),before,'Cancel preserves units');
 assert.equal(syncs,0);
 assert(!C.S.logDraft.entries[0].v369DeletedUnits);
 const approve=edit(1);
 await edit(2);
 assert.equal(dialogs.length,2,'Only one destructive dialog open');
 assert.equal(copy(),before);
 finish(true);await approve;
 const after=C.S.logDraft.entries[0];
 assert.equal(JSON.stringify(Array.from(after.v369Units,u=>u.id).sort()),JSON.stringify(['a1','b1']),'Only target season is replaced');
 assert(after.v369DeletedUnits.a3,'Removed unit tombstone saved');
 assert.equal(syncs,1);
 C.S.logDraft=draft();const previous=C.S.logDraft;
 const pending=edit(1);
 C.S.logDraft=draft();
 finish(true);await pending;
 assert.equal(JSON.stringify(C.S.logDraft),JSON.stringify(draft()),'New draft remains unchanged');
 assert.equal(JSON.stringify(previous),JSON.stringify(draft()),'Stale draft remains unchanged');
 assert.equal(syncs,1);
 C.S.logDraft=draft();const seasonPending=edit(1);
 C.S.logDraft.entries[0].v369SelectedSeasonId='s2';
 finish(true);await seasonPending;
 assert.equal(copy(),JSON.stringify(units()),'Switching season invalidates pending confirmation');
 assert.equal(syncs,1);
 C.S.logDraft=draft();const unitPending=edit(1);
 C.S.logDraft.entries[0].v369Units[0].durationSeconds=9999;
 finish(true);await unitPending;
 assert.equal(C.S.logDraft.entries[0].v369Units[0].durationSeconds,9999,'In-flight unit modifications are preserved');
 assert.equal(syncs,1);
 C.S.logDraft=draft();C.S.logDraft.entries[0].v369Units=units().filter(u=>u.id!=='a3');
 const count=dialogs.length;
 await edit(2);
 assert.equal(dialogs.length,count,'Contiguous bulk extension skips destructive confirmation');
 assert(C.S.logDraft.entries[0].v369Units.some(u=>u.id==='b1'));
 C.S.logDraft=draft();
 const old=copy();await edit(-1);
 assert.equal(copy(),old,'Invalid quantity must not mutate');
 assert(toasts.some(x=>x.includes('valid whole unit number')));
 // No-season categories (e.g., games/sessions) must read naturally.
 C.S.logDraft=draft();
 C.S.logDraft.entries[0].v369SelectedSeasonId='';
 C.S.logDraft.entries[0].v369Units=[
   {id:'x1',number:1,seasonId:null,loggedAt:100,durationSeconds:1200,isRepeat:false},
   {id:'x3',number:3,seasonId:null,loggedAt:300,durationSeconds:2400,isRepeat:false}
 ];
 const beforeSeasonless=copy();
 const seasonless=edit(1);
 const message=dialogs[dialogs.length-1].message;
 assert(message.includes('for Demo Anime.'),'No-season title should be named directly');
 assert(!message.includes('other seasons'),'Do not reference nonexistent seasons');
 assert(message.includes('\n\n')&&!message.includes('\\n\\n'));
 finish(false);await seasonless;
 assert.equal(copy(),beforeSeasonless,'No-season Cancel preserves unit detail');
 console.log('PASS v539: MediaFlow-themed confirmation, Cancel, season safety, concurrent/race guard, tombstones and valid/invalid edits.');
})().catch(e=>{console.error(e);process.exitCode=1;});
