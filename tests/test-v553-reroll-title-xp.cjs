/* v553: amount-scaled XP for consumed reroll recommendations. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
const source=read('src/js/components/393-v553-reroll-title-xp.js');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const index=read('index.html');
assert(version>=553,'VERSION must be v553 or newer');
assert(runtime.includes('components/393-v553-reroll-title-xp.js'),'v553 XP module must be in runtime order');
assert(index.includes('mediaflow-v'+version+'.bundle.js'),'HTML must reference the current bundle');
assert(source.includes('v553RerollTitleBonusAwarded'),'actual award must be guarded against duplicate credit');
assert(source.includes('MF553_SUPPRESS_PREVIEW_BONUS'),'v544 base-award audit must not double-count the new reward');

const settings={enabled:true,unitXP:{episodes:10,chapters:3,movies:30}};
const cat={id:'anime',name:'Anime',unit:'episodes'};
const task={categoryId:'anime',v180RecommendationHistory:[
  {libraryId:'initial',title:'Initial recommendation'},
  {libraryId:'reroll-a',title:'Reroll A'},
  {libraryId:'reroll-b',title:'Reroll B'}
]};
const entry={libraryId:'reroll-a',title:'Reroll A',qty:3};
const S={logging:true,currentTask:task,logDraft:{categoryId:'anime',v369Interface:'quick',entries:[entry]},
  sessions:[],library:[{id:'reroll-a',title:'Reroll A',categoryId:'anime'}]};
const baseProjection=()=>({eligible:true,awardReady:true,total:100,dayMultiplier:1.5,
  categories:[{id:'anime',name:'Anime',unit:'episodes',consumption:40,respect:0,
    rotation:1.2,afterStreak:60}],repeat:{perRow:new Map()},milestones:{},rerollTitleXP:0});
const ctx={S,App:{},window:{},MediaFlowRuntime:{},Map,Set,Object,Array,String,Number,Math,JSON,Date,
  console:{warn(){},error(){},log(){}},cleanTitle:x=>String(x||''),
  levelingSettings:()=>settings,getCategory:id=>String(id)==='anime'?cat:null,
  v180RespectSlotLimit:()=>1,v369ItemTitle:e=>S.library.find(i=>i.id===e.libraryId)||null,
  mf537ProjectXP:baseProjection,mf537XPCardMarkup:()=>'<section class="mf537-xp-card"><div class="mf537-xp-total"><strong>+100</strong></div><div class="mf537-xp-status"></div><div class="mf537-xp-formula"></div></section>',
  mf537Fmt:n=>Math.round(Number(n)||0).toLocaleString(),escapeHtml:x=>String(x),
  persistSessions(){ctx.persistCount=(ctx.persistCount||0)+1;},persistCount:0,
  v150ComputeStateMetrics:()=>({totalXP:S.sessions.reduce((n,s)=>n+(Number(s.xp)||0),0)}),
  showToast(){},todayISO:()=> '2026-10-26'
};
let nextSession=0;
ctx.App.submitLog=function(){
  assert.equal(vm.runInContext('mf537ProjectXP().total',ctx),100,
    'v544 must see the original projection while it verifies the base submission');
  const reroll=vm.runInContext('mf553RerollUnitRows().units>0',ctx);
  S.sessions.push({id:'session-'+(++nextSession),categoryId:'anime',
    actualAmount:reroll?3:1,status:'logged',xp:reroll?100:10});
  S.logging=false;
  return true;
};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'v553-reroll-title-xp.js'});
let p=vm.runInContext('mf537ProjectXP()',ctx);
assert.equal(p.rerollTitleUnits,3);
assert.equal(p.rerollTitleXP,30);
assert.equal(p.rerollTitleAwardXP,54);
assert.equal(p.rerollTitleRotationXP,6);
assert.equal(p.rerollTitleStreakXP,18);
assert.equal(p.total,154,'preview total must include unit XP, rotation and day-streak rounding');
let html=vm.runInContext('mf537XPCardMarkup()',ctx);
assert(html.includes('Reroll title reward'));
assert(html.includes('Consumed reroll units'));
assert(html.includes('+154'),'visible preview total must include the reroll award');

// Initial recommendation is not a reroll title and earns no extra reroll XP.
S.logDraft.entries=[{libraryId:'initial',title:'Initial recommendation',qty:5}];
p=vm.runInContext('mf537ProjectXP()',ctx);
assert.equal(p.rerollTitleUnits,0);
assert.equal(p.total,100);

// Itemized mode uses actual saved unit records, not a stale draft quantity.
S.logDraft.v369Interface='itemized';
S.logDraft.entries=[{libraryId:'reroll-b',title:'Reroll B',qty:99,
  v369Units:[{number:1},{number:2}]}];
p=vm.runInContext('mf537ProjectXP()',ctx);
assert.equal(p.rerollTitleUnits,2);
assert.equal(p.rerollTitleXP,20);
assert.equal(p.total,136);

// A real submit adds the same projected incremental award once and persists it.
S.logDraft.v369Interface='quick';
S.logDraft.entries=[{libraryId:'reroll-a',title:'Reroll A',qty:3}];
vm.runInContext('App.submitLog()',ctx);
assert.equal(S.sessions[0].xp,154);
assert.equal(S.sessions[0].v553RerollTitleBonusXP,54);
assert.equal(S.sessions[0].v553RerollTitleBonusUnits,3);
assert.equal(ctx.persistCount,1);
assert.equal(ctx.window.MediaFlowLastLogXPAudit.rerollTitleXP,54);

// A new submission with no consumed reroll title adds nothing.
S.logging=true;
S.currentTask={categoryId:'anime',v180RecommendationHistory:[{libraryId:'initial',title:'Initial'}]};
S.logDraft={categoryId:'anime',v369Interface:'quick',entries:[{libraryId:'initial',title:'Initial',qty:1}]};
vm.runInContext('App.submitLog()',ctx);
assert.equal(S.sessions[1].xp,10);
assert.equal(ctx.persistCount,1);
console.log('PASS v553: reroll-only eligibility, quantity-scaled unit XP, itemized quantity, preview total and exactly-once submission award.');
