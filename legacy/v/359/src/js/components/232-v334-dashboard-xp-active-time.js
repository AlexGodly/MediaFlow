/* MediaFlow v334: Dashboard scroll, Runtime Calculator semantics and Activity XP.
 * This is deliberately a late runtime extension: it uses the established
 * state, v150 cached XP model, v149 streaks, collection hooks and v186 controls.
 * No Supabase schema change is needed: all durable data lives in xpLedger/settings.
 */
const V334_REWARD_DEFAULTS={
  activeTimeXPPerMinute:2,
  firstTitleStartXP:40,
  collectionCreateXP:35,
  collectionEditXP:10
};
Object.assign(DEFAULT_SETTINGS.leveling,V334_REWARD_DEFAULTS);
V186_STATS_COMPONENT_DEFAULTS.activeTime=true;
V186_STATS_COMPONENT_LABELS.activeTime='Active time spent in MediaFlow';

function v334Ledger(){
  if(!S.xpLedger||typeof S.xpLedger!=='object')S.xpLedger={};
  for(const key of ['v334ActiveTimeDays','v334StartedTitles','v334CollectionCreates','v334CollectionEdits']){
    if(!S.xpLedger[key]||typeof S.xpLedger[key]!=='object'||Array.isArray(S.xpLedger[key]))S.xpLedger[key]={};
  }
  return S.xpLedger;
}
function v334Reward(key){
  const raw=Number(S.settings?.leveling?.[key]??V334_REWARD_DEFAULTS[key]);
  return Number.isFinite(raw)?Math.max(0,Math.min(100000,raw)):V334_REWARD_DEFAULTS[key];
}
function v334Sum(obj){return Object.values(obj||{}).reduce((sum,x)=>sum+(Math.max(0,Number(x)||0)),0);}
function v334Totals(ledger=S.xpLedger){
  const days=ledger?.v334ActiveTimeDays||{};
  const activeMs=Object.values(days).reduce((sum,x)=>sum+Math.max(0,Number(x?.ms)||0),0);
  const timeXP=Object.values(days).reduce((sum,x)=>sum+Math.max(0,Number(x?.xp)||0),0);
  const startsXP=v334Sum(ledger?.v334StartedTitles);
  const collectionCreateXP=v334Sum(ledger?.v334CollectionCreates);
  const collectionEditXP=v334Sum(ledger?.v334CollectionEdits);
  return {activeMs,timeXP,startsXP,collectionCreateXP,collectionEditXP,
    total:timeXP+startsXP+collectionCreateXP+collectionEditXP};
}
const v334ComputeStateMetricsBase=v150ComputeStateMetrics;
v150ComputeStateMetrics=function(state,mutateSessions){
  const metrics=v334ComputeStateMetricsBase.apply(this,arguments);
  const rewards=v334Totals(state?.xpLedger||{});
  return Object.assign(metrics,{v334Rewards:rewards,totalXP:metrics.totalXP+rewards.total,
    fixedLibraryXP:metrics.fixedLibraryXP+rewards.startsXP+rewards.collectionCreateXP+rewards.collectionEditXP});
};
const v334XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const info=v334XPBreakdownBase.apply(this,arguments),r=v334Totals();
  return {...info,activeTimeXP:r.timeXP,activeTimeMs:r.activeMs,firstTitleStartXP:r.startsXP,
    collectionCreateXP:r.collectionCreateXP,collectionEditXP:r.collectionEditXP};
};
function v334InvalidateXP(){
  if(typeof v149MarkStreakDirty==='function')v149MarkStreakDirty();
}
// Preserve v334 ledgers when a backup/device with an older schema is merged.
// Time days are counters: use the larger known progress for each day rather than
// adding two copies of the same accumulated day.
const v334MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const merged=v334MergeStatesBase.apply(this,arguments);
  if(!merged||typeof merged!=='object')return merged;
  const al=a?.xpLedger||{},bl=b?.xpLedger||{};
  merged.xpLedger=merged.xpLedger||{};
  for(const key of ['v334StartedTitles','v334CollectionCreates','v334CollectionEdits']){
    const out={};
    for(const id of new Set([...Object.keys(bl[key]||{}),...Object.keys(al[key]||{})])){
      out[id]=Math.max(0,Number(bl[key]?.[id])||0,Number(al[key]?.[id])||0);
    }
    merged.xpLedger[key]=out;
  }
  const days={};
  for(const day of new Set([...Object.keys(bl.v334ActiveTimeDays||{}),...Object.keys(al.v334ActiveTimeDays||{})])){
    const x=al.v334ActiveTimeDays?.[day]||{},y=bl.v334ActiveTimeDays?.[day]||{};
    const latest=(Number(x.updatedAt)||0)>=(Number(y.updatedAt)||0)?x:y;
    days[day]={...latest,ms:Math.max(Number(x.ms)||0,Number(y.ms)||0),
      xp:Math.max(Number(x.xp)||0,Number(y.xp)||0),
      exactXP:Math.max(Number(x.exactXP)||0,Number(y.exactXP)||0),
      updatedAt:Math.max(Number(x.updatedAt)||0,Number(y.updatedAt)||0)};
  }
  merged.xpLedger.v334ActiveTimeDays=days;
  return merged;
};

// Record title-start XP once, on an actual planned -> started transition.
// Loading/importing an already-started title never retroactively awards XP.
let V334_KNOWN_TITLE_STATES=null;
let V334_KNOWN_ACCOUNT='';
function v334Started(item){return !!item && (item.status==='active'||(Number(item.progress)||0)>0||(Number(item.startedAt)||0)>0);}
function v334SeedTitles(){
  V334_KNOWN_TITLE_STATES=new Map((S.library||[]).filter(x=>x?.id).map(x=>[String(x.id),v334Started(x)]));
  V334_KNOWN_ACCOUNT=String(AUTH_USER?.id||'');
}
const v334LoadAllBase=loadAll;
loadAll=async function(){
  const result=await v334LoadAllBase.apply(this,arguments);
  v334Ledger();v334RestoreLocalTime();v334SeedTitles();
  V334_LAST_TICK=Date.now();
  return result;
};
const v334PersistLibraryBase=persistLibrary;
persistLibrary=function(){
  const userId=String(AUTH_USER?.id||'');
  if(V334_KNOWN_ACCOUNT!==userId||!V334_KNOWN_TITLE_STATES)v334SeedTitles();
  const ledger=v334Ledger();
  let modified=false;
  for(const item of S.library||[]){
    const id=String(item?.id||'');if(!id)continue;
    const now=v334Started(item),prior=V334_KNOWN_TITLE_STATES.get(id);
    if(prior===false&&now&&!Object.prototype.hasOwnProperty.call(ledger.v334StartedTitles,id)){
      ledger.v334StartedTitles[id]=S.settings?.leveling?.enabled===false?0:Math.round(v334Reward('firstTitleStartXP'));
      modified=true;
    }
    V334_KNOWN_TITLE_STATES.set(id,now);
  }
  if(modified)v334InvalidateXP();
  return v334PersistLibraryBase.apply(this,arguments);
};

// The Dashboard logger can create a new title already in Watching state. This
// is a genuine first start (unlike importing an already-started title).
let V334_ADDING_LOG_ENTRY=false;
const v334AddLogEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  V334_ADDING_LOG_ENTRY=true;
  try{return v334AddLogEntryBase.apply(this,arguments);}
  finally{V334_ADDING_LOG_ENTRY=false;}
};
const v334AwardAdditionBase=awardLibraryAdditionXP;
awardLibraryAdditionXP=function(id){
  if(V334_ADDING_LOG_ENTRY&&id){
    const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));
    const ledger=v334Ledger();
    if(item&&v334Started(item)&&!Object.prototype.hasOwnProperty.call(ledger.v334StartedTitles,String(id))){
      ledger.v334StartedTitles[String(id)]=S.settings?.leveling?.enabled===false?0:Math.round(v334Reward('firstTitleStartXP'));
      v334InvalidateXP();
    }
  }
  return v334AwardAdditionBase.apply(this,arguments);
};

// Collection edits include adding/removing/reordering titles as well as changes
// to the collection metadata. The normalized touch hook runs for actual writes.
let V334_COLLECTION_IDS=null;
function v334SeedCollections(){V334_COLLECTION_IDS=new Set((S.collections||[]).map(c=>String(c?.id||'')).filter(Boolean));}
const v334LoadCollectionBase=loadAll;
loadAll=async function(){const out=await v334LoadCollectionBase.apply(this,arguments);v334SeedCollections();return out;};
let V334_SUPPRESS_COLLECTION_EDIT_REWARD=false;
const v334CollectionTouchBase=v274TouchCollection;
v274TouchCollection=function(collection){
  if(!collection?.id)return v334CollectionTouchBase.apply(this,arguments);
  const id=String(collection.id),ledger=v334Ledger();
  if(!V334_COLLECTION_IDS)v334SeedCollections();
  const wasKnown=V334_COLLECTION_IDS.has(id);
  const out=v334CollectionTouchBase.apply(this,arguments);
  const enabled=S.settings?.leveling?.enabled!==false;
  if(!wasKnown){
    V334_COLLECTION_IDS.add(id);
    if(!Object.prototype.hasOwnProperty.call(ledger.v334CollectionCreates,id)){
      ledger.v334CollectionCreates[id]=enabled?Math.round(v334Reward('collectionCreateXP')):0;
    }
  }else if(!V334_SUPPRESS_COLLECTION_EDIT_REWARD){
    ledger.v334CollectionEdits[id]=(Number(ledger.v334CollectionEdits[id])||0)+(enabled?Math.round(v334Reward('collectionEditXP')):0);
  }
  v334InvalidateXP();
  return out;
};
// A metadata editor save with identical values is not a meaningful edit and
// should not generate reward XP.
const v334SaveCollectionBase=App.v274SaveCollection;
App.v274SaveCollection=async function(id){
  const old=id?v274CollectionById(id):null;
  const identical=!!old &&
    String(old.title||'')===String(document.getElementById('mf274-col-title')?.value||'').trim()&&
    String(old.coverUrl||'')===String(document.getElementById('mf274-col-cover')?.value||'').trim()&&
    String(old.description||'')===String(document.getElementById('mf274-col-desc')?.value||'')&&
    !!old.autoBackground===!!document.getElementById('mf274-col-bg')?.checked;
  const previous=V334_SUPPRESS_COLLECTION_EDIT_REWARD;
  if(identical)V334_SUPPRESS_COLLECTION_EDIT_REWARD=true;
  try{return await v334SaveCollectionBase.apply(this,arguments);}
  finally{V334_SUPPRESS_COLLECTION_EDIT_REWARD=previous;}
};

// Foreground elapsed time; not dependent on mouse/keyboard interaction. There
// is intentionally NO idle timer, inactivity cap, daily cap or XP ceiling.
// Hidden tabs do not earn time. A short local lease prevents double billing
// from two windows of the same browser profile.
const V334_TAB_TOKEN=Math.random().toString(36).slice(2)+Date.now().toString(36);
let V334_LAST_TICK=Date.now(),V334_LAST_SAVE=Date.now(),V334_WAS_VISIBLE=!document.hidden;
function v334LocalTimeKey(){return 'mediaflow-v334-time-ledger-'+String(AUTH_USER?.id||'anonymous');}
function v334CheckpointLocalTime(){
  try{if(AUTH_USER)localStorage.setItem(v334LocalTimeKey(),JSON.stringify(v334Ledger().v334ActiveTimeDays));}catch(_){/* private browsing / storage full */}
}
function v334RestoreLocalTime(){
  if(!AUTH_USER)return;
  try{
    const stored=JSON.parse(localStorage.getItem(v334LocalTimeKey())||'null');
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return;
    const ledger=v334Ledger(),days=ledger.v334ActiveTimeDays;
    for(const [date,local] of Object.entries(stored)){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!local||typeof local!=='object')continue;
      const remote=days[date]||{};
      if((Number(local.ms)||0)>(Number(remote.ms)||0)){
        days[date]={...local,xp:Math.max(Number(local.xp)||0,Number(remote.xp)||0),
          exactXP:Math.max(Number(local.exactXP)||0,Number(remote.exactXP)||0)};
      }
    }
    v334InvalidateXP();
  }catch(err){console.warn('MediaFlow v334 local time restore skipped',err);}
}
function v334TimeLease(userId){
  try{
    const key='mediaflow-v334-active-tab-'+userId,now=Date.now();
    const current=JSON.parse(localStorage.getItem(key)||'null');
    if(current&&current.token!==V334_TAB_TOKEN&&Number(current.expires)>now)return false;
    localStorage.setItem(key,JSON.stringify({token:V334_TAB_TOKEN,expires:now+25000}));
    return true;
  }catch(_){return true;}
}
function v334EarnTime(ms,day=todayISO()){
  if(!(ms>0)||!AUTH_READY||!AUTH_USER)return;
  const ledger=v334Ledger(),days=ledger.v334ActiveTimeDays;
  const row=days[day]&&typeof days[day]==='object'?days[day]:{ms:0,exactXP:0,xp:0};
  const streak=v149ProspectiveTodayStreak();
  const multiplier=v149StreakMultiplier(streak);
  row.ms=(Number(row.ms)||0)+ms;
  row.exactXP=(Number(row.exactXP)||0)+(S.settings?.leveling?.enabled===false?0:(ms/60000)*v334Reward('activeTimeXPPerMinute')*multiplier);
  row.xp=Math.floor(row.exactXP+1e-8);
  row.streak=streak;row.multiplier=multiplier;row.updatedAt=Date.now();
  days[day]=row;
  v334CheckpointLocalTime();
  v334InvalidateXP();
  const el=document.querySelector('[data-v334-live-time]');
  if(el)el.textContent=v334Duration(v334Totals().activeMs);
  const xpEl=document.querySelector('[data-v334-live-xp]');
  if(xpEl)xpEl.textContent=v334Totals().timeXP.toLocaleString()+' XP';
}
function v334TimeTick(forceSave=false){
  const now=Date.now(),delta=Math.max(0,now-V334_LAST_TICK);V334_LAST_TICK=now;
  if(AUTH_READY&&AUTH_USER&&V334_WAS_VISIBLE&&v334TimeLease(String(AUTH_USER.id)))v334EarnTime(delta);
  V334_WAS_VISIBLE=!document.hidden;
  if(AUTH_READY&&AUTH_USER&&!document.hidden&&now-V334_LAST_SAVE>=600000){
    V334_LAST_SAVE=now;
    if(!V115_STARTUP_GUARD)saveState();
  }
}
document.addEventListener('visibilitychange',()=>{
  v334TimeTick();v334CheckpointLocalTime();V334_LAST_TICK=Date.now();V334_WAS_VISIBLE=!document.hidden;
});
window.addEventListener('pagehide',()=>{v334TimeTick();v334CheckpointLocalTime();});
window.addEventListener('focus',()=>{V334_LAST_TICK=Date.now();V334_WAS_VISIBLE=!document.hidden;});
setInterval(()=>{try{v334TimeTick();}catch(err){console.warn('MediaFlow active time tick',err);}},15000);

function v334Duration(ms){
  const seconds=Math.floor(Math.max(0,ms)/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  return h?`${h.toLocaleString()}h ${m}m ${s}s`:`${m}m ${s}s`;
}
function v334TimeCard(){
  const totals=v334Totals(),today=v334Ledger().v334ActiveTimeDays[todayISO()]||{};
  const xpRate=v334Reward('activeTimeXPPerMinute');
  return `<section class="card v334-active-time-card" aria-label="Active time spent in MediaFlow">
    <div class="section-label">ACTIVE TIME SPENT</div>
    <div class="v334-time-head"><div><b data-v334-live-time>${v334Duration(totals.activeMs)}</b><span>Time in MediaFlow</span></div><div><b data-v334-live-xp>${totals.timeXP.toLocaleString()} XP</b><span>Time-earned XP</span></div></div>
    <div class="record-list">
      <div class="record-row"><span class="k">Today</span><span class="v">${v334Duration(today.ms||0)}</span></div>
      <div class="record-row"><span class="k">Today’s streak multiplier</span><span class="v">×${Number(v149StreakMultiplier(v149ProspectiveTodayStreak())).toFixed(2)}</span></div>
      <div class="record-row"><span class="k">Base reward</span><span class="v">${xpRate.toLocaleString()} XP / minute</span></div>
      <div class="record-row"><span class="k">First-time title starts</span><span class="v">${totals.startsXP.toLocaleString()} XP</span></div>
      <div class="record-row"><span class="k">Collection creation / edits</span><span class="v">${(totals.collectionCreateXP+totals.collectionEditXP).toLocaleString()} XP</span></div>
    </div><p class="hint">Tracks foreground time while MediaFlow is open, even without clicks. No idle timeout or daily reward cap. Hidden/background tabs do not count.</p>
  </section>`;
}
const v334RenderStatsBase=renderStats;
renderStats=function(){
  const html=v334RenderStatsBase.apply(this,arguments);
  const settings=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS).statsComponents.values;
  if(settings.activeTime===false)return html;
  const host=document.createElement('div');host.innerHTML=html;
  const leveling=host.querySelector('.stats-level-card');
  if(leveling)leveling.insertAdjacentHTML('afterend',v334TimeCard());
  else {
    const head=host.querySelector('.view-head');
    if(head)head.insertAdjacentHTML('afterend',v334TimeCard());
    else host.insertAdjacentHTML('afterbegin',v334TimeCard());
  }
  return host.innerHTML;
};

const v334RenderSettingsBase=renderSettings;
renderSettings=function(){
  let html=v334RenderSettingsBase.apply(this,arguments);
  const L=S.settings?.leveling||{};
  const field=(key,label,help,step='1')=>`<div class="field"><label class="field-label">${label}</label><input type="number" min="0" max="100000" step="${step}" value="${Number(L[key]??V334_REWARD_DEFAULTS[key])}" onchange="App.updateLeveling('${key}',this.value)"><small class="hint">${help}</small></div>`;
  const fields=`<div class="v334-xp-settings"><div class="v334-section-title">APP ACTIVITY & COLLECTION REWARDS</div><div class="field-row">
    ${field('activeTimeXPPerMinute','Active app time XP / minute','Earn XP while MediaFlow is in the foreground. Streak multiplier applies; no inactivity or daily cap.','0.1')}
    ${field('firstTitleStartXP','First-time title start XP','One-time bonus when an existing unstarted Library title becomes active or first gets progress.')}
    </div><div class="field-row">
    ${field('collectionCreateXP','Create collection XP','Awarded once when a new collection is created.')}
    ${field('collectionEditXP','Edit collection XP','Awarded each time you make a real edit or add/remove/reorder titles in a collection.')}
    </div></div>`;
  const anchor='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">UNIT XP</div>';
  if(html.includes(anchor))html=html.replace(anchor,fields+anchor);
  else html=html.replace(/(<div[^>]+class="section-label settings-section-head"[^>]*><span>LEVELING &amp; XP<\/span>)/,fields+'$1');
  return html;
};

// Calculator modes now identify their actions visually rather than relying on
// identical generic icons. Forward arrow=carry result, stacked rows=multi-row.
const v334RuntimeHtmlBase=v256RuntimeCalculatorHtml;
v256RuntimeCalculatorHtml=function(){
  let html=v334RuntimeHtmlBase.apply(this,arguments);
  const forward=v225IconSvg('<path d="M4 12h15m-6-6 6 6-6 6"/><path d="M4 5v14"/>');
  const rows=v225IconSvg('<rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>');
  html=html.replace('>Carry-forward</button>',`><span class="v334-mode-icon" aria-hidden="true">${forward}</span>Carry-forward</button>`);
  html=html.replace('>Multi-row</button>',`><span class="v334-mode-icon" aria-hidden="true">${rows}</span>Multi-row</button>`);
  return html;
};

// Navigation: switching onto Dashboard should ALWAYS open at the top; a
// re-render *within* Dashboard (inputs, timers) must preserve current position.
function v334ScrollDashboardTop(){
  for(const el of [document.scrollingElement,document.documentElement,document.body,document.querySelector('.main'),document.querySelector('.main-content'),document.querySelector('.content')]){
    if(el && typeof el.scrollTop==='number')el.scrollTop=0;
  }
  try{window.scrollTo({top:0,left:0,behavior:'instant'});}catch(_){window.scrollTo(0,0);}
}
let V334_LAST_RENDERED_VIEW=null;
const v334RenderViewBase=renderView;
renderView=function(){
  const view=String(S.view||''),was=V334_LAST_RENDERED_VIEW;
  if(view==='dashboard'&&was!=='dashboard')v334ScrollDashboardTop();
  const result=v334RenderViewBase.apply(this,arguments);
  V334_LAST_RENDERED_VIEW=view;
  if(view==='dashboard'&&was!=='dashboard'){
    v334ScrollDashboardTop();
    requestAnimationFrame(()=>{if(String(S.view)==='dashboard')v334ScrollDashboardTop();});
  }
  return result;
};
const v334SetViewBase=App.setView;
App.setView=function(view){const out=v334SetViewBase.apply(this,arguments);if(view==='dashboard')v334ScrollDashboardTop();return out;};
const v334MobileNavBase=App.mobileNav;
App.mobileNav=function(view){const out=v334MobileNavBase.apply(this,arguments);if(view==='dashboard')v334ScrollDashboardTop();return out;};
