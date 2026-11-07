/* v561 release contract: live logging with the MediaFlow app and app time.
 * Runs the real v561 module on top of minimal v285 / v334 / v348 / v556 stand-ins. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=561,'VERSION must be v561 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/404-v561-live-logging-app-time.js')>runtime.indexOf('components/403-v560-tmdb-saved-job.js'),'v561 module loads after v560');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
assert(fs.existsSync(path.join(root,'docs/release-v561.md')),'release notes present');
if(version===561){
  const wf=read('.github/workflows/publish-v561.yml');
  assert(wf.includes('test "$(cat VERSION)" = 561')&&wf.includes('legacy/v/561')&&wf.includes('gh release create 561'),'release workflow archives and releases v561');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v561"'),'deploy runs after the v561 release');
const mod=read('src/js/components/404-v561-live-logging-app-time.js');

const scenario=`(async()=>{
const timers=[];const setTimeout=(fn,ms)=>{timers.push(fn);return timers.length;};const clearTimeout=()=>{};
const document={visibilityState:'visible',activeElement:null,addEventListener(){},getElementById(){return null;}};
const navigator={onLine:true};const window={};const MediaFlowRuntime={};
let renders=0;const render=()=>{renders++;};
const escapeHtml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S={view:'dashboard',logging:true,sessionActive:true,settings:{},
  v285ResumeState:{dashboard:{modifiedAt:0},logging:{active:true,currentTask:{id:'t1'},logDraft:{note:'old'},entryDraft:{},ui:{},modifiedAt:1000}},
  xpLedger:{v334ActiveTimeDays:{'2026-11-07':{ms:600000,xp:20,exactXP:20,multiplier:1,updatedAt:1}},
    v561AppTimeDays:{'2026-11-07':{ms:900000,xp:30,exactXP:30,multiplier:1,streak:1,updatedAt:2,platforms:{android:600000,windows:300000}}}}};
const AUTH_USER={id:'u'};const V115_STARTUP_GUARD=false;
const MF556_SEP='\\u001f',MF556_TABLE='mediaflow_records';
const MF556={migrated:true,cursor:'2026-11-07T10:00:00Z',local:new Map()};
const mf556Key=(k,i)=>k+'\\u0001'+i;
const mf556Hash=s=>'h'+s.length+':'+s.slice(-12);
let pulls=0;async function mf556Pull(){pulls++;return {};}
// v334 / v335 / v348 stand-ins
function v334Totals(ledger=S.xpLedger){const days=ledger?.v334ActiveTimeDays||{};
  const activeMs=Object.values(days).reduce((a,x)=>a+(+x.ms||0),0),timeXP=Object.values(days).reduce((a,x)=>a+(+x.xp||0),0);
  return {activeMs,timeXP,startsXP:0,collectionCreateXP:0,collectionEditXP:0,total:timeXP};}
function v334Duration(ms){const m=Math.floor(ms/60000);return Math.floor(m/60)+'h '+(m%60)+'m';}
function v335ActiveTimeCard(){return '<section class="card">time</section>';}
function v348HistoryEntries(){return [];}
function mergeStates(a,b){return {xpLedger:{}};}
// v285 / v369 stand-ins
const v285NormalizeLogging=x=>({active:x?.active===true,currentTask:x?.currentTask||null,logDraft:x?.logDraft||{},entryDraft:x?.entryDraft||{},ui:x?.ui||{},modifiedAt:Number(x?.modifiedAt)||0});
const v369MergeLogging=()=>null;
function v285ApplyResume(raw){S.v285ResumeState={...S.v285ResumeState,logging:raw.resumeStateV285.logging};S.logDraft=raw.resumeStateV285.logging.logDraft;}
// the cloud
let cloudRows=[];
const supabase={from(){const q={_ids:null,_since:'',eq(){return q;},in(_,ids){q._ids=ids;return q;},gt(_,s){q._since=s;return q;},select(){return q;},
  order(){return Promise.resolve({data:cloudRows.filter(r=>q._ids.includes(r.record_id)&&(!q._since||r.updated_at>q._since)),error:null});}};return q;}};
${mod}
const t=v334Totals();
const history=v348HistoryEntries();
const card=v335ActiveTimeCard();
const merged=mergeStates({xpLedger:{v561AppTimeDays:{'2026-11-07':{ms:100,xp:1,updatedAt:5,platforms:{ios:100}}}}},{xpLedger:{v561AppTimeDays:{'2026-11-07':{ms:900000,xp:30,updatedAt:2,platforms:{android:600000}}}}});
// the app saves a newer draft
const appDraft={active:true,currentTask:{id:'t1'},logDraft:{note:'typed in the app'},entryDraft:{},ui:{},modifiedAt:5000};
cloudRows=[{kind:'doc',record_id:'resumeStateV285\\u001flogging',pos:null,data:JSON.stringify(appDraft),deleted:false,updated_at:'2026-11-07T10:00:05Z'}];
await window.MediaFlowV561.tick();
const afterLive=S.logDraft?.note,rendersAfter=renders;
// the same row again: nothing happens
await window.MediaFlowV561.tick();
const rendersAgain=renders;
// typing here: a newer app draft waits
document.activeElement={tagName:'TEXTAREA'};S.v285ResumeState.logging.modifiedAt=Date.now();
cloudRows=[{kind:'doc',record_id:'resumeStateV285\\u001flogging',pos:null,data:JSON.stringify({...appDraft,logDraft:{note:'later'},modifiedAt:Date.now()+1}),deleted:false,updated_at:'2026-11-07T10:00:09Z'}];
await window.MediaFlowV561.tick();
const whileTyping=S.logDraft?.note;
// a task rerolled in the app triggers the record pull
document.activeElement=null;
cloudRows=[{kind:'doc',record_id:'currentTask\\u001fid',pos:null,data:'"t2"',deleted:false,updated_at:'2026-11-07T10:00:12Z'}];
await window.MediaFlowV561.tick();
return {t,history,card,merged,afterLive,rendersAfter,rendersAgain,whileTyping,pulls};
})()`;
eval(scenario).then(r=>{
  assert.equal(r.t.activeMs,600000+900000,'app time adds to active time');
  assert.equal(r.t.timeXP,20+30,'app time XP counts toward total XP');
  assert.equal(r.t.total,50,'total reward XP includes app time');
  assert.equal(r.t.appActiveMs,900000);assert.equal(r.t.websiteActiveMs,600000);
  assert.deepEqual(r.t.appPlatforms,{android:600000,windows:300000});
  assert(r.history.some(h=>h.id==='apptime:2026-11-07'&&h.xp===30&&h.source==='MediaFlow app time'),'XP history lists app time');
  assert(r.card.includes('In the MediaFlow app')&&r.card.includes('Android')&&r.card.indexOf('mf561-time-split')<r.card.lastIndexOf('</section>'),'Statistics shows website vs app time');
  const m=r.merged.xpLedger.v561AppTimeDays['2026-11-07'];
  assert.equal(m.ms,900000);assert.deepEqual(m.platforms,{ios:100,android:600000},'merge keeps the larger progress per platform');
  assert.equal(r.afterLive,'typed in the app','a draft typed in the app appears live');
  assert.equal(r.rendersAgain,r.rendersAfter,'the same draft is not applied twice');
  assert.equal(r.whileTyping,'typed in the app','a draft is never replaced while typing');
  assert.equal(r.pulls,1,'a task change in the app pulls records right away');
  console.log('PASS v561 release: live logging with the app and app time.');
}).catch(e=>{console.error(e);process.exit(1);});
