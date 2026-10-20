/* v542 — test the real completion/repeat forecast and final XP award audit.
 * Execute source functions in a VM, including a real v121 repeat algorithm. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=542);
const source=read('src/js/components/383-v542-award-parity.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(order.includes('components/383-v542-award-parity.js'));
assert(bundle.includes('function mf542ProjectedMilestones('));
assert(source.includes('v120IsCompleted(')&&source.includes('v121RepeatKey(')&&source.includes('v348Multiply('));
assert(!source.includes('persistLibrary(')&&!source.includes('persistSessions(')&&!source.includes('saveState('),
 'Projection must not save anything');
const cat={id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:30,target:3};
const getCategory=id=>id==='anime'?cat:null;
const item={id:'a',categoryId:'anime',title:'Anime Title',progress:0,total:12,status:'planned'};
let sessionIndex=0,audits=[];
let dates={streak:38,mult:1.52};
const l={enabled:true,minuteXP:1,unitXP:{episodes:10},rotationMultiplier:{healthy:5,neglected:10,due:8,overused:2},
 repeatUnitXP:{episodes:7},fullRepeatXP:50,completionXP:100,
 firstTitleStartXP:40,firstEpisodeXP:20,loggingCompletionBonusXP:25};
const makeState=()=>({
 settings:{leveling:{...l},systemRespectXP:{}},
 sessions:[],library:[{...item}],
 xpLedger:{logCompletions:{},v334StartedTitles:{},v335FirstEpisodeRewards:{},
  v348LibraryCompletionBonus:{},v348ActionEvents:{},v348EventMeta:{}},
 currentTask:{categoryId:'anime',targetMid:3},
 logDraft:{v369Interface:'itemized',updateLibrary:true,entries:[
  {libraryId:'a',title:'Anime Title',qty:3,v369Units:[
    {number:1,durationSeconds:1800,isRepeat:false},
    {number:2,durationSeconds:1800,isRepeat:false},
    {number:3,durationSeconds:1800,isRepeat:false}]}]},
 logging:true
});
const C=vm.createContext({S:makeState(),App:{},window:{},MediaFlowRuntime:{},
 Map,Set,Math,Number,Object,String,Array,JSON,Date,
 AUTH_USER:null,todayISO:()=> '2026-10-20',
 console:{warn:()=>{}},
 v120IsCompleted:x=>!!x&&(x.status==='completed'||(Number(x.total)>0&&Number(x.progress)>=Number(x.total))),
 v334Started:x=>!!x&&(x.status==='active'||Number(x.progress)>0||Number(x.startedAt)>0),
 v335IsEpisodeTitle:x=>getCategory(x.categoryId)?.unit==='episodes',
 V335_FIRST_EPISODE_DEFAULT:20,
 V334_KNOWN_TITLE_STATES:new Map([['a',false]]),
 V335_KNOWN_EPISODES:new Map([['a',0]]),
 V348_LIBRARY_KNOWN:new Map([['a',{completed:false}]]),
 levelingSettings:()=>C.S.settings.leveling,
 v348Multiply:n=>Math.round(n*dates.mult),
 v334Reward:k=>Number(C.S.settings.leveling[k]||0),
 v120LoggedCompletionXP:()=>C.S.settings.leveling.loggingCompletionBonusXP,
 v369ItemTitle:e=>C.S.library.find(x=>x.id===e.libraryId),
 getCategory,
 v369ProjectedTitleProgress:(it,e)=>Math.min(it.total,Number(it.progress)+e.v369Units.filter(u=>!u.isRepeat).length),
 v121RepeatKey:(t,s)=>t.libraryId?'id:'+t.libraryId:'title:'+t.title+'::'+s.categoryId,
 v121RepeatTotal:(t,s,it,unit)=>Number(it?.total)|| (unit==='movies'?1:0),
 mf537DraftRows:()=>({rows:[{cat,categoryId:'anime',amount:C.S.logDraft.entries[0].v369Units.length,
     entries:C.S.logDraft.entries,minutes:C.S.logDraft.entries[0].v369Units.length*30}]}),
 mf537Fmt:n=>Math.round(Number(n)||0).toLocaleString(),
 escapeHtml:String,
 mf537ProjectXP:()=>({
  total:1000,rawSessionTotal:650,baseTotal:130,consumptionTotal:650,
  respectTotal:0,streakBonus:350,streak:dates.streak,dayMultiplier:dates.mult,
  eligible:true,awardReady:true,request:'test',
  categories:[{id:'anime',base:130,rotation:5,consumption:650,respect:0,
    beforeStreak:650,afterStreak:1000}]
 }),
 mf537XPCardMarkup:()=>'<section class="mf537-xp-card"><div class="mf537-xp-status"></div><div class="mf537-xp-formula"></div><p class="mf537-xp-footnote">Completion, repeat and other separate action rewards may add XP after submission.</p></section>',
 v150ComputeStateMetrics:state=>{
   const ledger=state.xpLedger||{};
   const sums=o=>Object.values(o||{}).reduce((a,v)=>a+(Number(v)||0),0);
   return {totalXP:state.sessions.reduce((n,s)=>n+(s.xpWithStreak||0),0)+
     sums(ledger.logCompletions)+sums(ledger.v334StartedTitles)+
     sums(ledger.v335FirstEpisodeRewards)+sums(ledger.v348LibraryCompletionBonus)};
 },
 v149StreakMultiplier:()=>dates.mult
});
C.App.submitLog=function(){
  const xp=vm.runInContext('App.v542XPPreview().total',C);
  C.S.sessions.push({id:'new-'+(++sessionIndex),xpWithStreak:xp});
  C.S.logging=false;
};
vm.runInContext(source,C);
const project=()=>vm.runInContext('App.v542XPPreview()',C);
const clone=()=>JSON.stringify({draft:C.S.logDraft,sessions:C.S.sessions,ledger:C.S.xpLedger,library:C.S.library});
const newEntry=(isRepeat,qty,seconds=1800)=>({
 libraryId:'a',title:'Anime Title',qty,isRepeat,
 v369Units:Array.from({length:qty},(_,i)=>({number:i+1,durationSeconds:seconds,isRepeat}))
});
const zero=project();
assert.equal(zero.milestones.starts,1);
assert.equal(zero.milestones.firstEpisodes,1);
assert.equal(zero.milestones.completions,0);
assert.equal(zero.milestones.titleStartXP,61);
assert.equal(zero.milestones.firstEpisodeXP,30);
assert.equal(zero.repeatXP,0);
assert.equal(zero.total,1091);
const html=vm.runInContext('mf537XPCardMarkup()',C);
assert(html.includes('Repeat rewards')&&html.includes('Milestone rewards'));
assert(html.includes('+91'));
let stamp=clone();project();assert.equal(clone(),stamp,'Read-only projection must not change any persistent state');
// A completed title earns completed-title XP + logged-completion XP + streak bonuses.
C.S.logDraft.entries[0]=newEntry(false,12);
const completed=project();
assert.equal(completed.milestones.completions,1);
assert.equal(completed.milestones.completionXP,100);
assert.equal(completed.milestones.completionBonusXP,25);
assert.equal(completed.milestones.completionStreakXP,Math.round(25*1.52)-25+
  Math.round(100*1.52)-100);
assert(completed.total>zero.total);
// No duplicate completion or first-award when ledger already contains it.
C.S.xpLedger.logCompletions.a=25;
C.S.xpLedger.v334StartedTitles.a=61;
C.S.xpLedger.v335FirstEpisodeRewards.a=30;
C.S.xpLedger.v348LibraryCompletionBonus.a=52;
const existing=project();
assert.equal(existing.milestones.completionBonusXP,0);
assert.equal(existing.milestones.titleStartXP,0);
assert.equal(existing.milestones.firstEpisodeXP,0);
assert.equal(existing.milestones.completionStreakXP,0);
C.S.xpLedger=makeState().xpLedger;
// Repeat XP enters session BEFORE streak multiplication and full-repeat threshold.
C.S.logDraft.entries[0]=newEntry(true,12);
const repeat=project();
assert.equal(repeat.repeat.repeatUnits,12);
assert.equal(repeat.repeat.fullRepeats,1);
assert.equal(repeat.repeatXP,12*7+50);
assert.equal(repeat.sessionChange,Math.round((650+134)*1.52)-1000);
assert.equal(repeat.milestones.completions,0);
assert.equal(repeat.total,1000+repeat.sessionChange);
stamp=clone();project();assert.equal(clone(),stamp,'Repeat projection must not mutate History or Library');
// Starting a new game/session title has no first-episode bonus.
C.S.logDraft.entries[0]=newEntry(false,1);C.S.library[0].categoryId='game';
const noEpisode=project();assert.equal(noEpisode.milestones.firstEpisodes,0);
C.S.library[0].categoryId='anime';
// Global leveling off stops milestone/repeat awards.
C.S.settings.leveling.enabled=false;
C.S.logDraft.entries[0]=newEntry(true,12);
const disabled=project();
assert.equal(disabled.repeatXP,0);
assert.equal(disabled.independentXP,0);
C.S.settings.leveling.enabled=true;
// Post-submit audit must NEVER top up or duplicate XP.
C.S.logDraft.entries[0]=newEntry(false,3);
const forecast=project().total;
const beforeHistory=C.S.sessions.length;
vm.runInContext('App.submitLog()',C);
assert.equal(C.S.sessions.length,beforeHistory+1);
const actual=C.window.MediaFlowLastLogXPAudit;
assert.equal(actual.projected,forecast);
assert.equal(actual.actual,forecast);
assert.equal(actual.matched,true);
assert(!('accountId' in actual),'Do not expose auth account IDs');
assert.equal(C.S.sessions.at(-1).xpWithStreak,forecast);
console.log('PASS v542: projection includes title starts, first episodes, completion ledgers, repeat unit/full title, day streak, no duplicate XP, no cloud writes, post-submit parity audit.');
