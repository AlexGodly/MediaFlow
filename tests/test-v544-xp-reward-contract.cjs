/* v544: XP preview must equal credited XP, even on a canonical shortfall.
 * Run source in VM, never touch a real user's Library or cloud account. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=544);
const code=read('src/js/components/385-v544-reward-contract.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(order.includes('components/385-v544-reward-contract.js'));
if(order.includes('components/386-v546-recovery-lock-takeover.js'))
 assert(order.indexOf('components/385-v544-reward-contract.js')<order.indexOf('components/386-v546-recovery-lock-takeover.js'), 'The v544 XP contract must initialize before v546 recovery takeover');
assert(bundle.includes('function mf544ReceiptSum(state)'));
assert(bundle.includes('window.MediaFlowV544'));
assert(!/fetch\s*\(|rawSet\s*\(|updateUser\s*\(/.test(code));
const other=read('src/js/components/383-v542-award-parity.js');
assert(other.includes('u&&(t.repeat||u.isRepeat===true)'),'History repeat source must ignore null unit records');
assert(other.includes("typeof V348_LIBRARY_KNOWN?.get==='function'"),'Bad cached milestone indexes must not throw');
assert(read('src/js/features/rewatch/038-v121-rewatch-reread-xp.js').includes(
  'u&&(t.repeat||u.isRepeat===true)'), 'Real XP repeat rebuild must follow same safe unit rule');
assert(read('src/js/components/267-v369-itemized-logging.js').includes(
  'if(u&&!u.isRepeat)'), 'Real episode-progress history reader must ignore nulls');
let persisted=0,logs=[],nextSession=0,awardPerLog=90;
const makeEntry=()=>({libraryId:'a',qty:15,v369Units:Array.from({length:15},(_,i)=>({
  number:i+1,durationSeconds:840,isRepeat:false,loggedAt:Date.now()
}))});
const S={logging:true,currentTask:{categoryId:'anime'},
  logDraft:{v369Interface:'itemized',updateLibrary:false,entries:[makeEntry()]},
  xpLedger:{},sessions:[],library:[]};
const xpFunction=state=>({totalXP:state.sessions.reduce((n,s)=>n+(s.xp||0),0),
  fixedLibraryXP:0});
const ctx=vm.createContext({S,App:{},window:{},MediaFlowRuntime:{},
  Map,Set,Object,Array,String,Number,Math,JSON,Date,Promise,
  console:{warn(...x){logs.push(['warning',...x])},error(...x){logs.push(['error',...x])}},
  escapeHtml:String,v382Icon:()=>'<svg></svg>',todayISO:()=> '2026-10-20',
  getCategory:id=>id==='anime'?{id:'anime',unit:'episodes'}:null,
  mf537ProjectXP:()=>({total:100,awardReady:true,eligible:true,categories:[],
    dayMultiplier:1,consumptionTotal:100,respectTotal:0}),
  mf537XPCardMarkup:()=>'<section class="mf537-xp-card"><div class="mf537-xp-status"></div></section>',
  MF542_LAST_PREVIEW:null,
  v150ComputeStateMetrics:xpFunction,
  v120XPBreakdown:()=>({total:0}),
  mergeStates:(a,b)=>({sessions:a.sessions,xpLedger:{...(b.xpLedger||{}),...(a.xpLedger||{})}}),
  persistSessions:()=>{persisted++},
  saveState:()=>Promise.resolve(),
  v149MarkStreakDirty:()=>{},
  showToast:text=>logs.push(['toast',text])
});
ctx.App.submitLog=function(){
  S.sessions.push({id:'log'+(++nextSession),sessionGroupId:'group0',
    status:'logged',categoryId:'anime',xp:awardPerLog});
  S.logging=false;
};
vm.runInContext(code,ctx);
const project=()=>vm.runInContext('mf537ProjectXP()',ctx);
let unchanged=JSON.stringify(S);
assert.equal(project().total,100);
assert.equal(project().awardReady,true);
assert.equal(JSON.stringify(S),unchanged,'Read-only preview must never modify user data');
vm.runInContext('App.submitLog()',ctx);
assert.equal(S.sessions.length,1);
assert.equal(vm.runInContext('v150ComputeStateMetrics(S).totalXP',ctx),100);
assert.equal(vm.runInContext('mf544ReceiptSum(S)',ctx),10);
assert.equal(S.xpLedger.v544LogAwardGuarantees['session:log1'].xp,10);
assert.equal(persisted,1,'One cloud-safe persistence event per paid shortfall');
assert.equal(ctx.window.MediaFlowLastLogXPAudit.projected,100);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.actual,100);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.matched,true);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.guaranteedXP,10);
assert.equal(vm.runInContext('v120XPBreakdown().awardGuaranteeXP',ctx),10);
// A second real submission with a reused group ID is still separately paid.
S.logging=true;
vm.runInContext('App.submitLog()',ctx);
assert.equal(vm.runInContext('v150ComputeStateMetrics(S).totalXP',ctx),200);
assert.equal(vm.runInContext('mf544ReceiptSum(S)',ctx),20);
assert.equal(persisted,2);
assert.equal(Object.keys(S.xpLedger.v544LogAwardGuarantees).length,2);
// Idempotent merge after syncing two copies of the same receipts.
const a={sessions:S.sessions,xpLedger:{...S.xpLedger}};
const b={sessions:S.sessions,xpLedger:{...S.xpLedger}};
ctx.a=a;ctx.b=b;
const merged=vm.runInContext('mergeStates(a,b)',ctx);
assert.equal(vm.runInContext('mf544ReceiptSum(mergeStates(a,b))',ctx),20);
assert.equal(Object.keys(merged.xpLedger.v544LogAwardGuarantees).length,2);
// Removing a log must not leave an orphaned guarantee behind.
S.sessions.splice(0,1);
assert.equal(vm.runInContext('mf544ReceiptSum(S)',ctx),10);
// Exact canonical award: no compensation or extra persistence.
S.logging=true;awardPerLog=100;
vm.runInContext('App.submitLog()',ctx);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.guaranteedXP,0);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.actual,100);
assert.equal(persisted,2);
assert.equal(vm.runInContext('mf544ReceiptSum(S)',ctx),10);
// Invalid imported unit must be clearly shown, not secretly logged or promised.
S.logging=true;S.logDraft.entries[0].v369Units[2]=null;
const invalid=project();
assert.equal(invalid.awardReady,false);
assert(invalid.rewardWarning.includes('damaged'));
const html=vm.runInContext('mf537XPCardMarkup()',ctx);
assert(html.includes('Draft needs attention'));
const count=S.sessions.length;
assert.equal(vm.runInContext('App.submitLog()',ctx),false);
assert.equal(S.sessions.length,count);
assert(S.logging===true);
console.log('PASS v544: 15 units/3h30, source history guards, full forecast read-only, exact award, shortfall guarantee, two logs same group, max-merge, deleted-log orphan protection and invalid draft rejection.');
