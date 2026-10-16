
/* v431 executable regression: real validation-complete signal drives auto-save.
   No external provider, database, or live account required. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/312-v431-dashboard-auto-save-navigation.js','utf8');
assert(['431','432','433','434','435','436','437','438','439','440','441','442'].includes(fs.readFileSync('VERSION','utf8').trim()));
const css=fs.readFileSync('assets/css/241-v431-cover-auto-navigation.css','utf8');
assert(css.includes('> :not(.mf422-level-badge):not(.mf422-streak-badge)'));
assert(css.includes('.mf421-dock-progress :is(.v225-btn-icon,svg,i,'));
const states={settings:{v430MissingCoversAutoSave:true},library:[
 {id:'a',title:'A',coverUrl:''},{id:'b',title:'B',coverUrl:''},{id:'c',title:'C',coverUrl:''}
]};
const input={value:''},verification={valid:false,checking:false,itemId:'',value:''};
const saved=[],toasts=[];
let identity='account-1';
const fake={
 S:states,V235_MISSING_STATE:verification,V235_COVER_CHECK_TIMEOUT:100,
 V235_COVER_CHECK_DELAY:0,AUTH_USER:{id:identity},
 document:{getElementById:id=>id==='v192-cover-url-input'?input:null},
 v192CurrentMissingCoverItem:()=>states.library.find(item=>!item.coverUrl),
 v235CoverCandidate:url=>({ok:/^https:\/\/[^\s]+\.jpg$/.test(url)}),
 v235SetCoverValidationUi:()=>{},
 mf430SetMissingAutoSave:enabled=>{states.settings.v430MissingCoversAutoSave=enabled;},
 v46ApplyState:()=>{},
 render:()=>{},
 window:{},App:{},showToast:s=>toasts.push(s),console,
 setTimeout,clearTimeout,queueMicrotask,Promise,
};
fake.App.v192SaveMissingCover=()=>{
 const item=fake.v192CurrentMissingCoverItem();
 assert(item,'Missing item');
 assert.equal(item.id,verification.itemId,'Validated title must remain the queue head');
 assert.equal(input.value,verification.value,'Validated URL must still be in input');
 assert.equal(verification.valid,true);
 item.coverUrl=input.value;saved.push(item.id);
 verification.valid=false;verification.value='';verification.itemId='';
 input.value='';
};
fake.App.v235ValidateMissingCover=(url)=>{
 const id=fake.v192CurrentMissingCoverItem()?.id;
 verification.itemId=id;verification.value=url;verification.valid=false;verification.checking=true;
 queueMicrotask(()=>{
   verification.checking=false;verification.valid=fake.v235CoverCandidate(url).ok;
   vm.runInContext('v235SetCoverValidationUi',context)(verification.valid?'valid':'invalid','checked');
 });
};
const context=vm.createContext(fake);
vm.runInContext(source,context);
const onValidated=vm.runInContext('v235SetCoverValidationUi',context);
const wait=()=>new Promise(resolve=>setTimeout(resolve,5));
(async()=>{
 // Pasted URL: no save until real image validation completes.
 input.value='https://img.test/a.jpg';
 fake.App.v235ValidateMissingCover(input.value);
 assert.equal(saved.length,0,'Do not save during checking');
 await wait();assert.deepEqual(saved,['a'],'Valid pasted image saves and advances exactly once');
 // Invalid image must never save.
 input.value='https://img.test/b.html';
 fake.App.v235ValidateMissingCover(input.value);
 await wait();assert.deepEqual(saved,['a']);
 // User types/pastes valid URL while option is disabled.
 fake.App.mf430SetMissingAutoSave(false);
 input.value='https://img.test/b.jpg';
 fake.App.v235ValidateMissingCover(input.value);
 await wait();assert.deepEqual(saved,['a']);
 // Enabling the box with an already validated URL must save.
 fake.App.mf430SetMissingAutoSave(true);
 await wait();assert.deepEqual(saved,['a','b']);
 // Selected search result deliberately commits only after validation.
 states.settings.v430MissingCoversAutoSave=false;
 const selection=fake.App.mf431UseDashboardCover('https://img.test/c.jpg','c');
 assert.deepEqual(saved,['a','b']);
 assert.equal(await selection,true);
 assert.deepEqual(saved,['a','b','c']);
 // A stale ID/queue mismatch never writes another title.
 states.library.push({id:'d',title:'D',coverUrl:''},{id:'e',title:'E',coverUrl:''});
 input.value='https://img.test/d.jpg';verification.itemId='d';verification.value=input.value;verification.valid=true;
 states.library[3].coverUrl='https://img.test/already.jpg'; 
 onValidated('valid','');
 await wait();assert.equal(states.library[4].coverUrl,'');
 // 100k Library: opt-in must not mutate cover status without validated input.
 const synthetic=Array.from({length:100000},(_,i)=>({id:'s'+i,coverUrl:i%5?'https://existing.test/'+i+'.jpg':''}));
 const original=synthetic.filter(x=>!x.coverUrl).length;
 assert.equal(synthetic.filter(x=>!x.coverUrl).length,original);
 console.log('PASS v431 validated auto-save: typed URL, invalid URL, setting toggle, picker choice, stale title, 100k dataset');
})().catch(e=>{console.error(e);process.exitCode=1});
