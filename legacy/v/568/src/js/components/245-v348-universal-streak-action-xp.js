/* MediaFlow v348 — action XP and universal streak-award multiplier.
   All durable XP events use the existing cloud-synced XP ledger JSON. */
const V348_REWARD_DEFAULTS={
  collectionAddTitleXP:8,
  orderAddTitleXP:6,
  orderAddCollectionXP:12,
  orderReorderTitleXP:4,
  orderReorderCollectionXP:6,
  collectionReorderTitleXP:4,
  batchLogXP:15,
  globalStreakMultiplierEnabled:true
};
Object.assign(DEFAULT_SETTINGS.leveling,V348_REWARD_DEFAULTS);
function v348Enabled(){return S.settings?.leveling?.enabled!==false;}
function v348Multiplier(){
  if(!v348Enabled()||S.settings?.leveling?.globalStreakMultiplierEnabled===false)return 1;
  const streak=typeof v149ProspectiveTodayStreak==='function'?v149ProspectiveTodayStreak():computeDayStreak();
  return Math.max(1,Number(v149StreakMultiplier(streak))||1);
}
function v348Multiply(amount){return Math.max(0,Math.round((Number(amount)||0)*v348Multiplier()));}
function v348Rate(key){
  const raw=Number(S.settings?.leveling?.[key]??V348_REWARD_DEFAULTS[key]);
  return Number.isFinite(raw)?Math.max(0,Math.min(100000,raw)):Number(V348_REWARD_DEFAULTS[key]||0);
}
function v348Ledger(){
  S.xpLedger=S.xpLedger||{};
  for(const key of ['v348ActionEvents','v348LibraryAdditionBonus','v348LibraryCompletionBonus','v348EventMeta']){
    const x=S.xpLedger[key];if(!x||typeof x!=='object'||Array.isArray(x))S.xpLedger[key]={};
  }
  return S.xpLedger;
}
function v348Award(kind,amount=1,details={}){
  if(!v348Enabled())return 0;
  const quantity=Math.max(0,Math.round(Number(amount)||0));if(!quantity)return 0;
  const xp=v348Multiply(quantity*v348Rate(kind));if(!xp)return 0;
  const l=v348Ledger();const key=kind+':'+(typeof uid==='function'?uid():Date.now()+'_'+Math.random());
  l.v348ActionEvents[key]=xp;
  l.v348EventMeta[key]={kind,baseXP:quantity*v348Rate(kind),multiplier:v348Multiplier(),xp,timestamp:Date.now(),source:v348SourceLabel(kind),details:String(details?.description||'').slice(0,300),subjectId:String(details?.subjectId||''),quantity};
  v334InvalidateXP();
  return xp;
}
function v348SourceLabel(kind){
  const labels={collectionAddTitleXP:'Collection · added titles',collectionReorderTitleXP:'Collection · reordered titles',orderAddTitleXP:'Personal Order · added titles',orderAddCollectionXP:'Personal Order · assigned Collection',orderReorderTitleXP:'Personal Order · reordered titles',orderReorderCollectionXP:'Personal Order · reordered Collections',batchLogXP:'Batch Log bonus',libraryAdditions:'Library · new title',libraryEdits:'Library · edited title',manualCovers:'Library · manual cover',ratings:'Rating reward',v334StartedTitles:'First title start',v335FirstEpisodeRewards:'First episode',v334CollectionCreates:'Collection created',v334CollectionEdits:'Collection edited',logCompletions:'Log completion bonus'};
  return labels[kind]||String(kind);
}
// Session XP, completion streak bonus and foreground time already multiply in
// their own canonical calculations. A single common multiplier switch affects
// those calculations, too, without layering another multiplier on top.
const v348StreakBase=v149StreakMultiplier;
v149StreakMultiplier=function(streak){
  if(S.settings?.leveling?.globalStreakMultiplierEnabled===false)return 1;
  return v348StreakBase.apply(this,arguments);
};

function v348MapValues(map){return Object.values(map||{}).reduce((s,n)=>s+Math.max(0,Number(n)||0),0);}
function v348ExtraXP(ledger){
  return v348MapValues(ledger?.v348ActionEvents)+v348MapValues(ledger?.v348LibraryAdditionBonus)+v348MapValues(ledger?.v348LibraryCompletionBonus);
}
const v348MetricsBase=v150ComputeStateMetrics;
v150ComputeStateMetrics=function(state){
  const m=v348MetricsBase.apply(this,arguments),bonus=v348ExtraXP(state?.xpLedger);
  m.v348ActionXP=bonus;m.fixedLibraryXP+=bonus;m.totalXP+=bonus;
  return m;
};
const v348BreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v348BreakdownBase.apply(this,arguments),bonus=v348ExtraXP(S.xpLedger);
  return {...b,v348ActionXP:bonus};
};
const v348SnapshotXPBase=v50SnapshotXP;
v50SnapshotXP=function(state){const n=v348SnapshotXPBase.apply(this,arguments);return n==null?n:n+v348ExtraXP(state?.xpLedger);};
const v348MergeBase=mergeStates;
mergeStates=function(a,b){
  const out=v348MergeBase.apply(this,arguments);
  if(!out||typeof out!=='object')return out;
  out.xpLedger=out.xpLedger||{};
  for(const key of ['v348ActionEvents','v348LibraryAdditionBonus','v348LibraryCompletionBonus','v348EventMeta']){
    const map={};
    for(const id of new Set([...Object.keys(a?.xpLedger?.[key]||{}),...Object.keys(b?.xpLedger?.[key]||{})])){
      if(key==='v348EventMeta'){
        const av=a?.xpLedger?.[key]?.[id],bv=b?.xpLedger?.[key]?.[id];
        map[id]=(Number(av?.timestamp)||0)>=(Number(bv?.timestamp)||0)?(av||bv):(bv||av);
      }else map[id]=Math.max(0,Number(a?.xpLedger?.[key]?.[id])||0,Number(b?.xpLedger?.[key]?.[id])||0);
    }
    out.xpLedger[key]=map;
  }
  return out;
};

// One-time fixed rewards: the underlying v334/v335/v44/v123 calls store the
// base XP. Increase only this call's NEW increment; existing awards are never
// re-multiplied by the current streak.
function v348SnapshotMaps(keys){const l=v348Ledger();return Object.fromEntries(keys.map(key=>[key,{...(l[key]||{})}]));}
function v348RaiseNewRewards(snapshot){
  if(!v348Enabled())return;
  const l=v348Ledger();let changed=false;
  for(const [key,before] of Object.entries(snapshot)){
    const after=l[key]||{};
    for(const [id,value] of Object.entries(after)){
      const prior=Number(before[id])||0,added=Math.max(0,(Number(value)||0)-prior);
      if(added>0){
        const mult=v348Multiplier(),xp=v348Multiply(added),inc=xp-added;
        if(inc>0){after[id]=Number(value)+inc;changed=true;}
        const metaId=key+':'+id+':'+Date.now()+':'+(typeof uid==='function'?uid():Math.random());
        l.v348EventMeta[metaId]={kind:key,baseXP:added,multiplier:mult,xp,timestamp:Date.now(),source:v348SourceLabel(key),subjectId:id};
        changed=true;
      }
    }
  }
  if(changed)v334InvalidateXP();
}
// Library add/title start/first episode can be awarded in the addition hook
// or during a normal persist. Capture each path exactly once.
const v348AdditionBase=awardLibraryAdditionXP;
awardLibraryAdditionXP=function(){
  const before=v348SnapshotMaps(['libraryAdditions','v334StartedTitles','v335FirstEpisodeRewards']);
  const result=v348AdditionBase.apply(this,arguments);
  v348RaiseNewRewards(before);
  // The legacy XP engine calculates Library-addition XP from the live title
  // count, not from xpLedger.libraryAdditions. Persist only the extra streak
  // amount to avoid double-counting the base addition reward.
  const id=String(arguments[0]||'');
  const l=v348Ledger();
  if(id&&v348Enabled()&&!Object.hasOwn(l.v348LibraryAdditionBonus,id)&&
    !Object.hasOwn(before.libraryAdditions||{},id)&&Object.hasOwn(l.libraryAdditions||{},id)){
    const base=Math.max(0,Math.round(Number(levelingSettings().libraryAdditionXP)||0));
    const mult=v348Multiplier(),xp=v348Multiply(base);
    l.v348LibraryAdditionBonus[id]=Math.max(0,xp-base);
    l.v348EventMeta['library-add:'+id]={kind:'libraryAdditions',baseXP:base,multiplier:mult,xp,timestamp:Date.now(),source:v348SourceLabel('libraryAdditions'),subjectId:id};
    v334InvalidateXP();
  }
  return result;
};
const v348PersistLibraryBase=persistLibrary;
let V348_LIBRARY_KNOWN=null,V348_LIBRARY_ACCOUNT='';
function v348SeedLibrary(){
  V348_LIBRARY_ACCOUNT=String(AUTH_USER?.id||'');
  V348_LIBRARY_KNOWN=new Map((S.library||[]).filter(x=>x?.id).map(x=>[String(x.id),{completed:v120IsCompleted(x)}]));
}
persistLibrary=function(){
  if(!V348_LIBRARY_KNOWN||V348_LIBRARY_ACCOUNT!==String(AUTH_USER?.id||''))v348SeedLibrary();
  const before=v348SnapshotMaps(['v334StartedTitles','v335FirstEpisodeRewards']);
  const result=v348PersistLibraryBase.apply(this,arguments);
  v348RaiseNewRewards(before);
  if(v348Enabled()){
    const l=v348Ledger();
    for(const item of S.library||[]){
      if(!item?.id)continue;
      const id=String(item.id),known=V348_LIBRARY_KNOWN.get(id);
      // Base completion XP remains calculated from the completed-title count;
      // this ledger records ONLY the award-time streak bonus above that base.
      if(known&&!known.completed&&v120IsCompleted(item)&&!Object.hasOwn(l.v348LibraryCompletionBonus,id)){
        const amount=Math.max(0,Math.round(Number(levelingSettings().completionXP)||0));
        const mult=v348Multiplier(),xp=v348Multiply(amount);
        l.v348LibraryCompletionBonus[id]=Math.max(0,xp-amount);
        l.v348EventMeta['library-complete:'+id]={kind:'completedLibrary',baseXP:amount,multiplier:mult,xp,timestamp:Date.now(),source:'Library · title completed',subjectId:id};
      }
    }
  }
  v348SeedLibrary();
  return result;
};
const v348EditBase=v44AwardEditXP;
v44AwardEditXP=function(){const b=v348SnapshotMaps(['libraryEdits']);const r=v348EditBase.apply(this,arguments);v348RaiseNewRewards(b);return r;};
const v348CoverBase=v44AwardManualCoverXP;
v44AwardManualCoverXP=function(){const b=v348SnapshotMaps(['manualCovers']);const r=v348CoverBase.apply(this,arguments);v348RaiseNewRewards(b);return r;};
const v348RatingBase=v123AwardRatingXP;
v123AwardRatingXP=function(){const b=v348SnapshotMaps(['ratings']);const r=v348RatingBase.apply(this,arguments);v348RaiseNewRewards(b);return r;};

// Collection creation/edit XP already exists; add a distinct reward for every
// newly inserted title and for meaningful reordering (not unchanged writes).
let V348_SUPPRESS_IMPORTED_ACTIONS=0;
let V348_COLLECTION_KNOWN=null;
function v348CollectionIds(c){const list=Array.isArray(c?.order)&&c.order.length?c.order:c?.titleIds;return (Array.isArray(list)?list:[]).map(String);}
function v348SeedCollections(){V348_COLLECTION_KNOWN=new Map((S.collections||[]).filter(c=>c?.id).map(c=>[String(c.id),v348CollectionIds(c)]));}
const v348TouchCollectionBase=v274TouchCollection;
v274TouchCollection=function(c){
  if(!c?.id)return v348TouchCollectionBase.apply(this,arguments);
  if(!V348_COLLECTION_KNOWN)v348SeedCollections();
  const id=String(c.id),before=V348_COLLECTION_KNOWN.get(id);
  const rewards=v348SnapshotMaps(['v334CollectionCreates','v334CollectionEdits']);
  const result=v348TouchCollectionBase.apply(this,arguments);
  v348RaiseNewRewards(rewards);
  const after=v348CollectionIds(c);
  if(before && !V348_SUPPRESS_IMPORTED_ACTIONS && String(S.view||'')==='collections'){
    const previous=new Set(before),added=after.filter(x=>!previous.has(x));
    if(added.length)v348Award('collectionAddTitleXP',added.length,{subjectId:id,description:added.map(tid=>(S.library||[]).find(it=>String(it.id)===tid)?.title||tid).slice(0,8).join(', ')});
    const oldCommon=before.filter(x=>after.includes(x)),newCommon=after.filter(x=>previous.has(x));
    if(oldCommon.length>1&&oldCommon.join('\0')!==newCommon.join('\0'))v348Award('collectionReorderTitleXP',1,{subjectId:id,description:String(c.title||'Collection')});
  }
  V348_COLLECTION_KNOWN.set(id,after);
  return result;
};

// Observe canonical Personal Order writes across List/Tabs/drag/numeric inputs.
// Snapshot the previous saved sequence before each mutation, compare at the
// actual save touch, and never pay for unrelated display-only preference edits.
let V348_ORDER_KNOWN=null;
function v348OrderSnapshot(){
  const p=S.orderPlan||{};
  return {titles:(p.titleIds||[]).map(String),assignments:(p.collectionAssignments||[]).map(a=>String(a?.id||'')).filter(Boolean),queues:Object.fromEntries(Object.entries(p.categoryQueues||{}).map(([k,q])=>[k,Array.isArray(q)?q.map(String):[]]))};
}
function v348SeedOrder(){V348_ORDER_KNOWN=v348OrderSnapshot();}
function v348CompareOrder(){
  const next=v348OrderSnapshot(),prev=V348_ORDER_KNOWN;
  if(!prev||V348_SUPPRESS_IMPORTED_ACTIONS||String(S.view||'')!=='order'){V348_ORDER_KNOWN=next;return;}
  const titles=new Set(prev.titles),nowTitles=new Set(next.titles);
  const addedTitleIds=next.titles.filter(x=>!titles.has(x)),added=addedTitleIds.length;
  if(added)v348Award('orderAddTitleXP',added,{description:addedTitleIds.map(id=>(S.library||[]).find(it=>String(it.id)===id)?.title||id).slice(0,8).join(', ')});
  const oldCommon=prev.titles.filter(x=>nowTitles.has(x)),newCommon=next.titles.filter(x=>titles.has(x));
  if(oldCommon.length>1&&oldCommon.join('\0')!==newCommon.join('\0'))v348Award('orderReorderTitleXP',1,{description:'Reordered Personal Order title sequence'});
  const assignments=new Set(prev.assignments),nowAssignments=new Set(next.assignments);
  const newlyAssignedIds=next.assignments.filter(x=>!assignments.has(x)),newlyAssigned=newlyAssignedIds.length;
  if(newlyAssigned)v348Award('orderAddCollectionXP',newlyAssigned,{description:newlyAssignedIds.map(id=>{const a=(S.orderPlan?.collectionAssignments||[]).find(r=>String(r.id)===id);return (S.collections||[]).find(c=>String(c.id)===String(a?.collectionId))?.title||id;}).slice(0,8).join(', ')});
  if(!newlyAssigned){
    const allKeys=new Set([...Object.keys(prev.queues),...Object.keys(next.queues)]);
    for(const key of allKeys){
      const old=prev.queues[key]||[],current=next.queues[key]||[];
      const oldCollections=old.filter(x=>x.startsWith('c:')&&current.includes(x));
      const newCollections=current.filter(x=>x.startsWith('c:')&&old.includes(x));
      const positionChanged=oldCollections.some(token=>old.indexOf(token)!==current.indexOf(token));
      if((oldCollections.length>1&&oldCollections.join('\0')!==newCollections.join('\0'))||positionChanged){v348Award('orderReorderCollectionXP',1,{description:'Moved Collection queue position'});break;}
    }
  }
  V348_ORDER_KNOWN=next;
}
const v348OrderTouchBase=v138TouchOrderPlan;
v138TouchOrderPlan=function(){v348CompareOrder();return v348OrderTouchBase.apply(this,arguments);};
const v348CollectionQueueTouchBase=v287Touch;
v287Touch=function(){v348CompareOrder();return v348CollectionQueueTouchBase.apply(this,arguments);};

// Batch logging already earns consumption XP and its streak bonus. Award an
// additional configurable submission bonus only for actual new batch sessions.
const v348BatchBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const previous=new Set((S.sessions||[]).map(s=>String(s?.id||'')));
  const result=v348BatchBase.apply(this,arguments);
  const added=(S.sessions||[]).some(s=>s?.source==='batch'&&!previous.has(String(s?.id||'')));
  if(added){v348Award('batchLogXP',1,{description:'Successfully submitted a Batch Log entry'});try{saveState();}catch(_){/* existing save continues */}}
  return result;
};
const v348LoadBase=loadAll;
loadAll=async function(){const result=await v348LoadBase.apply(this,arguments);v348Ledger();v348SeedCollections();v348SeedOrder();v348SeedLibrary();return result;};

// Patch the actual registered v221/v335 Settings page, not a deprecated
// renderSettings() function. Also guard against later DOM organizing layers.
function v348SettingsHtml(){
  const l=S.settings?.leveling||{};
  const field=(key,label,help)=>`<div class="field v348-xp-field"><label class="field-label" for="v348-setting-${key}">${label}</label><input id="v348-setting-${key}" type="number" min="0" max="100000" step="1" value="${Number.isFinite(Number(l[key]))?Number(l[key]):V348_REWARD_DEFAULTS[key]}" onchange="App.updateLeveling('${key}',this.value)"><small class="hint">${help}</small></div>`;
  return `<div class="v348-xp-settings" id="v348-xp-settings" aria-label="MediaFlow Personal Order, Collections and Batch Log XP settings">
    <div class="v335-reward-heading">UNIVERSAL STREAK MULTIPLIER</div>
    <label class="v348-streak-toggle"><input id="v348-setting-globalStreakMultiplierEnabled" type="checkbox" ${l.globalStreakMultiplierEnabled!==false?'checked':''} onchange="App.updateLeveling('globalStreakMultiplierEnabled',this.checked)"><span><b>Apply streak multiplier to all XP sources</b><small>When enabled, each new XP reward is multiplied by your streak, including Library edits, ratings, Collections, Personal Order, milestones and Batch Log. Logging and active-time XP already use the streak multiplier and are not multiplied twice.</small></span></label>
    <div class="v335-reward-heading">COLLECTIONS ACTION XP</div><div class="v335-reward-grid">
      ${field('collectionAddTitleXP','Add title to Collection XP','Per newly added title; duplicates and imports do not earn XP.')}
      ${field('collectionReorderTitleXP','Reorder Collection titles XP','Per meaningful rearrangement in a Collection.')}
    </div>
    <div class="v335-reward-heading">PERSONAL ORDER ACTION XP</div><div class="v335-reward-grid">
      ${field('orderAddTitleXP','Add title to Personal Order XP','Per newly added ordered title.')}
      ${field('orderAddCollectionXP','Add Collection to Personal Order XP','Per new category-to-Collection assignment.')}
      ${field('orderReorderTitleXP','Reorder titles in Personal Order XP','Per actual title-order change.')}
      ${field('orderReorderCollectionXP','Reorder Collections in Personal Order XP','Per actual Collection queue-position change.')}
    </div>
    <div class="v335-reward-heading">BATCH LOG REWARDS</div><div class="v335-reward-grid">
      ${field('batchLogXP','Batch Log bonus XP','Once per successful Batch Log submission, in addition to consumption XP.')}
    </div>
  </div>`;
}
function v348RenderSettingsPage(){
  const markup=v335RenderSettingsPage.apply(this,arguments);
  const host=document.createElement('div');host.innerHTML=markup;
  const existing=host.querySelector('#v335-xp-settings');
  if(existing&&!host.querySelector('#v348-xp-settings'))existing.insertAdjacentHTML('beforeend',v348SettingsHtml());
  else if(!host.querySelector('#v348-xp-settings')){
    const content=host.querySelector('.v221-settings-content');
    const heading=[...(content?.querySelectorAll('.section-label')||[])].find(el=>v221PlainSectionTitle(el)==='LEVELING & XP');
    const card=heading?.nextElementSibling;
    if(card)card.insertAdjacentHTML('beforeend',v348SettingsHtml());
  }
  return host.innerHTML;
}
// The original app updateLeveling() converts every non-'enabled' value to a
// number. This is a true boolean setting; preserve it correctly across saves.
const v348UpdateLevelingBase=App.updateLeveling;
App.updateLeveling=function(key,value){
  if(key!=='globalStreakMultiplierEnabled')return v348UpdateLevelingBase.apply(this,arguments);
  S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
  S.settings.leveling.globalStreakMultiplierEnabled=value===true||value==='true';
  v334InvalidateXP();persistSettings();render();
};
MediaFlowRuntime.registerPageRenderer('settings',v348RenderSettingsPage);
window.MediaFlowV348={version:348,features:['Seven configurable activity rewards','Universal streak XP multiplier','Cloud-synced event ledgers','Visible active Leveling & XP settings']};

// Import operations are data transfers, not new user activity. Do not award
// action XP when replacing/restoring queues or collection records.
for(const name of ['v142ImportOrder','v279ImportCollections']){
  if(typeof App[name]!=='function')continue;
  const original=App[name];
  App[name]=async function(){
    V348_SUPPRESS_IMPORTED_ACTIONS++;
    try{return await original.apply(this,arguments);}
    finally{V348_SUPPRESS_IMPORTED_ACTIONS--;v348SeedOrder();v348SeedCollections();}
  };
}
