/* v566 release contract (runs in CI without a browser). The full in-browser
 * check is tests/test-v566-interface.cjs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=566);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const mods=['416-v566-get-mediaflow','417-v566-recovery-ratings','418-v566-log-times','419-v566-recovery-performance','420-v566-faq'];
let last=runtime.indexOf('components/415-v565-faq.js');
assert(last>=0);
for(const m of mods){const i=runtime.indexOf('components/'+m+'.js');assert(i>last,m+' runs after the previous module');last=i;}
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/298-v566-release.css'));
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===566){const wf=read('.github/workflows/publish-v566.yml');assert(wf.includes('gh release create 566')&&wf.includes('legacy/v/566'));}
assert(read('docs/release-v566.md').startsWith('## MediaFlow v566 Stable'),'release notes exist for the publish step');
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v566"'));
// Recovery performance hooks sit in the recovery engines.
assert(read('src/js/components/309-v424-advanced-cover-recovery.js').includes("mf566DeferRecoverySave('cover')"),'cover saves are batched');
assert(read('src/js/components/309-v424-advanced-cover-recovery.js').includes("mf566SafeCheckpoint('cover'"),'cover checkpoint stays safe');
assert(read('src/js/components/322-v442-recovery-hardening.js').includes("mf566DeferRecoverySave('metadata')"),'metadata saves are batched');
assert(read('src/js/components/322-v442-recovery-hardening.js').includes("mf566FlushRecovery('metadata')"),'metadata job flushes when it ends');
assert(read('src/js/components/319-v439-metadata-recovery.js').includes("mf566SafeCheckpoint('metadata'"),'metadata checkpoint stays safe');
assert(read('src/js/components/321-v441-recovery-workspace.js').includes('lastWidgetMarkup'),'widget skips identical repaints');
assert(read('src/js/components/401-v558-theme-polish.js').includes('mf558SchedulePlace'),'minimise button placement is batched');

// Pure: log times split by day, totals unchanged.
const ctx={window:{},S:{settings:{},sessions:[]},App:{submitLog(){}},MediaFlowRuntime:{registerPageEnhancer(){}},document:{querySelectorAll:()=>[]},
  cleanTitle:v=>String(v??'').trim(),uid:(()=>{let n=0;return()=>'u'+(++n);})(),persistSessions(){},render(){},persistSettings(){},showToast(){},
  v369Seconds:u=>Number(u.durationSeconds)||0};
vm.createContext(ctx);
vm.runInContext(read('src/js/components/418-v566-log-times.js')+`
const D=86400000,now=Date.now(),t0=now-2*D;
const units=[{loggedAt:t0,durationSeconds:600},{loggedAt:t0+1,durationSeconds:600},{loggedAt:now,durationSeconds:1200}];
const s={id:'s',timestamp:now,date:'x',status:'complete',xp:30,actualAmount:3,minutes:40,titles:[{title:'A',libraryId:'L',qty:3,loggedAt:t0,v369Units:units}]};
const parts=mf566RedateSession(s,new Map([['id:L',{added:t0}]]),'unit');
const added=mf566RedateSession({...s,titles:[{...s.titles[0],v369Units:units.map(u=>({...u}))}]},new Map([['id:L',{added:t0}]]),'added');
this.out={n:parts.length,xp:parts.map(p=>p.xp),amount:parts.reduce((a,p)=>a+p.actualAmount,0),minutes:parts.map(p=>p.minutes),
  lastId:parts[1].id,status:parts.map(p=>p.status),days:parts.map(p=>p.date),expect:[mf566DayKey(t0),mf566DayKey(now)],
  added:added.length,addedDay:added[0].date,mode:mf566LogTimeMode()};`,ctx);
const o=JSON.parse(JSON.stringify(ctx.out));
assert.equal(o.n,2,'two days → two sessions');assert.deepEqual(o.days,o.expect);
assert.deepEqual(o.xp,[20,10],'XP split by amount, total kept');assert.equal(o.amount,3);
assert.deepEqual(o.minutes,[20,20],'itemized minutes follow the units');
assert.equal(o.lastId,'s','latest day keeps the session id');assert.deepEqual(o.status,['logged','complete']);
assert.equal(o.added,1,'"when added" keeps one session');assert.equal(o.addedDay,o.expect[0]);
assert.equal(o.mode,'unit','default: when each unit was logged');
console.log('v566 release contract passed');
