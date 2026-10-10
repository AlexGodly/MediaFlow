/* ============================================================
   MediaFlow v267 — Cloud verification hardening, Order popover portal,
   Dashboard Balance first-paint stability and Dynamic cover filtering
   ============================================================ */
(function(){
'use strict';
const V267_RUNTIME_VERSION=267;

function v267Esc(value){
  return typeof escapeHtml==='function'
    ? escapeHtml(String(value??''))
    : String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function v267Sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function v267JsonSafe(value){
  try{return JSON.parse(JSON.stringify(value));}
  catch(error){console.warn('MediaFlow v267: JSON canonicalization failed; using original value.',error);return value;}
}
function v267Fp(value){
  const safe=v267JsonSafe(value);
  try{return typeof v250Fingerprint==='function'?v250Fingerprint(safe):JSON.stringify(safe);}
  catch(_){try{return JSON.stringify(safe);}catch(__){return String(safe);}}
}

/* ---------------------------------------------------------------------
   Cloud verification
   ---------------------------------------------------------------------
   Cloud writes are JSON round-trips. JavaScript object keys whose value is
   undefined are omitted by JSON.stringify. Older verification hashed the
   in-memory expected object before that round-trip, which could report
   "Library content" even when Supabase stored exactly what MediaFlow sent.
   v267 compares canonical persisted representations and retries a verified
   write when a genuine post-upload mismatch is detected.
   --------------------------------------------------------------------- */
const v267VerifyCloudStateBase=v155VerifyCloudState;
const V267_CONTENT_LABELS={
  'Settings content':['settings'],
  'XP ledgers content':['xpLedger'],
  'Personal Order content':['orderPlan'],
  'Library content':['library'],
  'History content':['sessions'],
  'Library History content':['activityLog'],
  'completion timeline content':['completionTimeline'],
  'Category artwork':['categories']
};
function v267EquivalentField(cloudState,expected,path){
  let a=cloudState,b=expected;
  for(const key of path){a=a?.[key];b=b?.[key];}
  return v267Fp(a)===v267Fp(b);
}
v155VerifyCloudState=function(cloudState,expected){
  const persistedExpected=v267JsonSafe(expected);
  const base=v267VerifyCloudStateBase.call(this,cloudState,persistedExpected)||{ok:true,missing:[]};
  let problems=[...(base.missing||[])];
  // Remove old content-fingerprint false positives only when persisted JSON is
  // demonstrably equivalent. Real missing/count/schema problems stay intact.
  problems=problems.filter(label=>{
    const path=V267_CONTENT_LABELS[label];
    return !(path&&v267EquivalentField(cloudState,persistedExpected,path));
  });
  // Always verify the core persisted collections with JSON-safe fingerprints.
  for(const [label,path] of Object.entries(V267_CONTENT_LABELS)){
    if(label==='Category artwork')continue;
    if(!v267EquivalentField(cloudState,persistedExpected,path)&&!problems.includes(label))problems.push(label);
  }
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

function v267CloudIntegritySummary(state){
  const s=state&&typeof state==='object'?state:{};
  return {
    library:Array.isArray(s.library)?s.library.length:-1,
    sessions:Array.isArray(s.sessions)?s.sessions.length:-1,
    activityLog:Array.isArray(s.activityLog)?s.activityLog.length:-1,
    completionTimeline:Array.isArray(s.completionTimeline)?s.completionTimeline.length:-1,
    categories:Array.isArray(s.categories)?s.categories.length:-1,
    settings:!!(s.settings&&typeof s.settings==='object'),
    xp:!!(s.xpLedger&&typeof s.xpLedger==='object'),
    order:!!(s.orderPlan&&typeof s.orderPlan==='object'),
    savedAt:Number(s.savedAt)||0,
    libraryFingerprint:v267Fp(s.library),
    sessionFingerprint:v267Fp(s.sessions),
    settingsFingerprint:v267Fp(s.settings)
  };
}
async function v267FetchAndVerify(expected){
  const verify=await v115FetchCloudState();
  if(!verify?.found||!verify.state)return {ok:false,verify,check:{ok:false,missing:['cloud upload readback']}};
  const check=v155VerifyCloudState(verify.state,expected);
  return {ok:!!check.ok,verify,check};
}
async function v267WriteVerifiedCloud(expected,{repairAttempts=2}={}){
  const canonical=v267JsonSafe(expected);
  await rawSet(STATE_KEY,canonical);
  let result=await v267FetchAndVerify(canonical);
  if(result.ok)return {...result,state:canonical,repaired:false};

  for(let attempt=1;attempt<=repairAttempts;attempt++){
    const remoteSaved=Number(result.verify?.state?.savedAt)||0;
    const expectedSaved=Number(canonical?.savedAt)||0;
    // Do not fight a clearly newer write from another device.
    if(remoteSaved&&expectedSaved&&remoteSaved>expectedSaved+5000){
      throw new Error('Cloud changed from another device while Sync Now was verifying. Nothing else was overwritten; run Sync Now again to merge the newer cloud state.');
    }
    updateDataProgress(Math.min(99,96+attempt),`Cloud verification found a mismatch. Repairing protected upload (${attempt}/${repairAttempts})…`);
    await v267Sleep(250*attempt);
    await rawSet(STATE_KEY,canonical);
    await v267Sleep(180*attempt);
    result=await v267FetchAndVerify(canonical);
    if(result.ok)return {...result,state:canonical,repaired:true,repairAttempt:attempt};
  }
  const missing=result.check?.missing||['unknown cloud verification mismatch'];
  const local=v267CloudIntegritySummary(canonical),remote=v267CloudIntegritySummary(result.verify?.state);
  console.error('MediaFlow v267 cloud verification mismatch',{missing,local,remote});
  throw new Error(`Cloud verification still differs after protected repair: ${missing.join(', ')}. Your local safety copy was kept; no empty/default state was written.`);
}

async function v267SyncNow(){
  if(v134OperationBusy('sync'))return;
  V134_HEAVY_OPERATION='sync';
  showDataProgress('Sync now','Preparing complete protected MediaFlow synchronization…',3);
  try{
    await saveQueue;
    updateDataProgress(8,'Building complete local cloud snapshot…');
    const local=v267JsonSafe(snapshot());
    const localCheck=v155StateCompleteness(local);
    if(!localCheck.ok)throw new Error(`Local state is incomplete (${localCheck.missing.join(', ')}). Sync stopped before writing anything.`);
    await v134Yield();

    updateDataProgress(15,'Reading protected cloud state…');
    let cloud;
    try{cloud=await v115FetchCloudState();}
    catch(error){throw new Error(`Cloud read failed. Nothing was written. ${String(error?.message||error)}`);}
    if(!cloud?.found)throw new Error('Cloud state is missing. Protected Sync stopped without writing anything. Retry the cloud connection or use the existing recovery flow.');
    if(!cloud.state||typeof cloud.state!=='object')throw new Error('Cloud state could not be read safely. Protected Sync stopped without writing anything.');

    const localStats=v115StateStats(local),cloudStats=v115StateStats(cloud.state);
    if(localStats.core>0&&cloudStats.core===0)throw new Error('Cloud state looks unexpectedly empty compared with this device. Protected Sync stopped without overwriting it.');

    updateDataProgress(25,'Merging all cloud + local MediaFlow data…');
    const merged=v267JsonSafe(mergeStates(local,cloud.state));
    const mergedCheck=v155StateCompleteness(merged);
    if(!mergedCheck.ok)throw new Error(`Merged state is incomplete (${mergedCheck.missing.join(', ')}). Sync stopped before upload.`);
    await v134Yield();

    updateDataProgress(34,'Applying Library, History, Settings, Order and protected state…');
    v46ApplyState(merged);v155ApplyPortableExtras(merged.portableExtras);V153_HISTORY_CACHE_DIRTY=true;v149MarkStreakDirty();
    await v134Yield();

    updateDataProgress(41,'Rebuilding progression, repeats and streak XP…');
    await v134RecalculateXPOptimized(false,{start:42,historyEnd:61,completionEnd:73,repeatEnd:83});
    updateDataProgress(85,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    updateDataProgress(91,'Uploading one canonical protected cloud state…');
    const finalState=v267JsonSafe(snapshot());
    const finalCheck=v155StateCompleteness(finalState);
    if(!finalCheck.ok)throw new Error(`Final state is incomplete (${finalCheck.missing.join(', ')}). Sync stopped before upload.`);

    updateDataProgress(96,'Verifying cloud upload…');
    const verified=await v267WriteVerifiedCloud(finalState,{repairAttempts:2});
    try{v115WriteRecoveryCache(verified.verify.state);}catch(_){ }

    const info=mediaFlowLevelInfo(),b=v120XPBreakdown(),os=v153NormalizeOldSystem(S.oldSystem),queueCount=(V123_RATING_QUEUE||[]).length;
    render();
    finishDataProgress(true,verified.repaired?'Sync complete · cloud repaired & verified':'Sync complete & verified',`${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${(S.activityLog||[]).length.toLocaleString()} Library History events · ${os.rules.length.toLocaleString()} Old System rule${os.rules.length===1?'':'s'} · ${queueCount.toLocaleString()} rating queue · Level ${info.level} · ${info.xp.toLocaleString()} XP`);
  }catch(error){
    console.error(error);finishDataProgress(false,'Sync failed safely',String(error?.message||error));
  }finally{V134_HEAVY_OPERATION='';}
}
App.syncNow=v267SyncNow;

/* ---------------------------------------------------------------------
   Dynamic Library cover filter
   v241's optimized v181DynamicRows replaced the earlier v224 wrapper.
   Reapply the cover-presence filter after the final optimized row builder.
   --------------------------------------------------------------------- */
const v267DynamicRowsBase=v181DynamicRows;
v181DynamicRows=function(){
  const rows=v267DynamicRowsBase.apply(this,arguments);
  return typeof v224FilterLibraryByCover==='function'?v224FilterLibraryByCover(rows):rows;
};

/* ---------------------------------------------------------------------
   Today's Balance: render the final v265 design in the Dashboard HTML
   itself so users never see the old Balance for one frame/load.
   --------------------------------------------------------------------- */
const v267RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  const html=String(v267RenderDashboardBase.apply(this,arguments)||'');
  const cfg=typeof v192EnsureDashboardSettings==='function'?v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS):null;
  if(cfg?.showTodayBalance===false)return html;
  try{
    const host=document.createElement('div');host.innerHTML=html;
    const card=host.querySelector('.mf265-balance-card,.mf264-balance-card,.v261-balance-card');
    if(!card)return html;
    const head=card.previousElementSibling;
    const label=head?.querySelector?.('.section-label')||[...host.querySelectorAll('.section-label')].find(el=>/Today[’']s Balance/i.test(String(el.textContent||'')));
    if(label)label.innerHTML='<span class="mf265-balance-heading"><span class="mf265-balance-kicker">Daily rotation</span><b>Today’s Balance</b><small>A clear snapshot of category health, progress and what needs attention next.</small></span>';
    card.className='card mf265-balance-card';card.dataset.v265Balance='1';card.dataset.v267FirstPaint='1';card.innerHTML=v265BalanceMarkup();
    return host.innerHTML;
  }catch(error){console.warn('MediaFlow v267: could not pre-render latest Today’s Balance.',error);return html;}
};


/* Older Dashboard enhancers used to repaint Balance through v261 -> v264 -> v265.
   Point every legacy Balance enhancer at the final renderer so navigation can
   never visibly switch between generations. */
try{v261EnhanceBalanceDom=v265EnhanceBalance;}catch(_){ }
try{v264EnhanceBalance=v265EnhanceBalance;}catch(_){ }

/* ---------------------------------------------------------------------
   Personal Order category filter portal
   Move the open panel to document.body. This avoids every transformed /
   overflow ancestor and guarantees neither edge can clip the category list.
   --------------------------------------------------------------------- */
const V267_ORDER_PORTALS=new Map();
let V267_ORDER_OUTSIDE_BOUND=false;
function v267OrderSafeLeft(){
  const vw=document.documentElement.clientWidth||innerWidth,sidebar=document.querySelector('.sidebar');
  if(!sidebar||vw<=760||getComputedStyle(sidebar).display==='none')return 10;
  const r=sidebar.getBoundingClientRect();return Math.max(10,Math.min(vw-10,Math.ceil(r.right)+10));
}
function v267PositionOrderPortal(details){
  const rec=V267_ORDER_PORTALS.get(details);if(!details?.open||!rec?.panel)return;
  const panel=rec.panel,summary=details.querySelector('summary');if(!summary)return;
  const vw=document.documentElement.clientWidth||innerWidth,vh=document.documentElement.clientHeight||innerHeight,margin=10,safeLeft=v267OrderSafeLeft(),safeRight=vw-margin;
  const available=Math.max(230,safeRight-safeLeft),width=Math.min(440,available),sr=summary.getBoundingClientRect();
  Object.assign(panel.style,{position:'fixed',display:'block',right:'auto',bottom:'auto',transform:'none',margin:'0',width:`${Math.round(width)}px`,maxWidth:`${Math.round(width)}px`,zIndex:'2147483000'});
  let left=Math.min(Math.max(sr.right-width,safeLeft),Math.max(safeLeft,safeRight-width));
  if(vw<=760)left=Math.min(Math.max(sr.left,margin),Math.max(margin,safeRight-width));
  panel.style.left=`${Math.round(left)}px`;
  const maxH=Math.max(220,Math.min(620,vh-margin*2));panel.style.maxHeight=`${Math.round(maxH)}px`;panel.style.overflow='auto';
  const natural=Math.min(panel.scrollHeight,maxH);let top=sr.bottom+7;if(top+natural>vh-margin)top=Math.max(margin,sr.top-natural-7);panel.style.top=`${Math.round(top)}px`;
}
function v267OpenOrderPortal(details){
  if(!details?.open)return;
  let rec=V267_ORDER_PORTALS.get(details);
  if(!rec){
    const panel=details.querySelector('.v237-category-filter-panel');if(!panel)return;
    const placeholder=document.createComment('MediaFlow v267 order category portal');
    panel.parentNode.insertBefore(placeholder,panel);rec={panel,placeholder};V267_ORDER_PORTALS.set(details,rec);
  }
  const {panel}=rec;panel.classList.add('mf267-order-category-portal');document.body.appendChild(panel);panel.scrollLeft=0;v267PositionOrderPortal(details);
}
function v267CloseOrderPortal(details){
  const rec=V267_ORDER_PORTALS.get(details);if(!rec)return;
  const {panel,placeholder}=rec;panel.classList.remove('mf267-order-category-portal');panel.removeAttribute('style');
  if(placeholder?.parentNode)placeholder.parentNode.insertBefore(panel,placeholder.nextSibling);
  placeholder?.remove();V267_ORDER_PORTALS.delete(details);
}
function v267CloseAllOrderPortals(){for(const details of [...V267_ORDER_PORTALS.keys()])v267CloseOrderPortal(details);}
function v267EnhanceOrder(){
  if(String(S.view||'')!=='order')return;
  const root=document.getElementById('view-root');if(!root)return;
  root.querySelectorAll('.v225-order-filter-category .v237-category-filter,.v138-order-view .v237-category-filter').forEach(details=>{
    details.classList.add('mf267-order-category-filter');
    if(details.dataset.mf267Bound!=='1'){
      details.dataset.mf267Bound='1';
      details.addEventListener('toggle',()=>{if(details.open)requestAnimationFrame(()=>v267OpenOrderPortal(details));else v267CloseOrderPortal(details);});
    }
    if(details.open)v267OpenOrderPortal(details);
  });
  if(!V267_ORDER_OUTSIDE_BOUND){
    V267_ORDER_OUTSIDE_BOUND=true;
    document.addEventListener('pointerdown',event=>{
      for(const [details,rec] of V267_ORDER_PORTALS){
        if(rec.panel.contains(event.target)||details.contains(event.target))continue;
        details.open=false;v267CloseOrderPortal(details);
      }
    },true);
    const reposition=()=>{if(String(S.view||'')==='order')for(const details of V267_ORDER_PORTALS.keys())v267PositionOrderPortal(details);};
    window.addEventListener('resize',reposition,{passive:true});window.addEventListener('scroll',reposition,{passive:true,capture:true});
  }
}

/* Cleanup portals before any page rerender removes their owner details. */
const v267RenderShellBase=renderShell;
renderShell=function(){
  const out=v267RenderShellBase.apply(this,arguments);
  if(String(S.view||'')==='dashboard'){
    queueMicrotask(()=>{try{v265EnhanceBalance();}catch(_){ }});
    requestAnimationFrame(()=>{try{v265EnhanceBalance();v267UpdateVersionChrome();}catch(_){ }});
  }
  return out;
};

const v267RenderBase=render;
render=function(){
  v267CloseAllOrderPortals();
  const out=v267RenderBase.apply(this,arguments);
  if(String(S.view||'')==='dashboard'){
    try{v265EnhanceBalance();}catch(_){ }
    queueMicrotask(()=>{try{v265EnhanceBalance();}catch(_){ }});
  }
  requestAnimationFrame(()=>{try{v267EnhanceOrder();v267UpdateVersionChrome();if(String(S.view||'')==='dashboard')v265EnhanceBalance();}catch(error){console.error('MediaFlow v267 enhancement failed',error);}});
  return out;
};

function v267UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v267';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v267');});
}
try{MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(v267EnhanceOrder));}catch(_){ }
Object.assign(App,{v267EnhanceOrder,v267CloudIntegritySummary,v267JsonSafe,v267EquivalentField,v267VerifyCloudState:(cloud,expected)=>v155VerifyCloudState(cloud,expected),v267DynamicRowsDebug:()=>v181DynamicRows().map(item=>({id:item?.id,title:item?.title,coverUrl:item?.coverUrl,categoryId:item?.categoryId,status:item?.status}))});
window.MediaFlowV267={version:267,focus:'verified cloud canonicalization + self-repair, Personal Order category portal, first-paint latest Today Balance, Dynamic cover filter'};
MediaFlowRuntime.version=V267_RUNTIME_VERSION;
requestAnimationFrame(()=>{try{v267EnhanceOrder();v267UpdateVersionChrome();}catch(_){ }});
})();
