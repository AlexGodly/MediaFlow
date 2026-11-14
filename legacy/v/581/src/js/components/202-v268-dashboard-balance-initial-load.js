/* ============================================================
   MediaFlow v268 — Dashboard Today's Balance Initial-Load Fix
   ------------------------------------------------------------
   v265 owns the final Today’s Balance renderer inside its isolated runtime
   module. v267 attempted to call that private renderer directly from another
   isolated module, so its "first paint" path could not reliably finalize a
   pristine Dashboard card.

   v268 fixes the lifecycle without crossing module-private boundaries:
   - recognizes pristine Dashboard Balance markup directly from its heading
   - primes the returned HTML so the public v265 enhancer can finalize it
   - calls App.v265EnhanceBalance() synchronously after Dashboard rendering
   - repairs an already-rendered Dashboard immediately at startup
   - repeats safely after hydration/microtask/frame/page-enhancer passes
   ============================================================ */
(function(){
'use strict';
const V268_RUNTIME_VERSION=268;
const V268_BALANCE_HEADING='<span class="mf265-balance-heading"><span class="mf265-balance-kicker">Daily rotation</span><b>Today’s Balance</b><small>A clear snapshot of category health, progress and what needs attention next.</small></span>';

function v268NormalizeBalanceText(value){
  return String(value||'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toUpperCase();
}
function v268IsBalanceLabel(el){
  return !!el?.classList?.contains('section-label')&&v268NormalizeBalanceText(el.textContent).includes("TODAY'S BALANCE");
}
function v268LocateBalance(root){
  if(!root?.querySelectorAll)return {label:null,head:null,card:null};
  const label=[...root.querySelectorAll('.section-label')].find(v268IsBalanceLabel)||null;
  let head=label?.parentElement||null;
  let card=head?.nextElementSibling||null;
  if(card&&!card.classList?.contains('card')&&!card.matches?.('.mf265-balance-card,.mf264-balance-card,.v261-balance-card'))card=null;
  if(!card){
    card=root.querySelector('.mf265-balance-card,.mf264-balance-card,.v261-balance-card');
    if(card&&!label){
      const maybeHead=card.previousElementSibling||null;
      const maybeLabel=maybeHead?.querySelector?.('.section-label')||null;
      if(maybeLabel&&v268IsBalanceLabel(maybeLabel))return {label:maybeLabel,head:maybeHead,card};
    }
  }
  return {label,head,card};
}
function v268BalanceEnabled(){
  try{
    const cfg=typeof v192EnsureDashboardSettings==='function'?v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS):null;
    return cfg?.showTodayBalance!==false;
  }catch(_){return true;}
}

/* Prepare a Balance card for v265's exported enhancer. The v265 enhancer is
   intentionally called through App because its markup helpers are private to
   the v265 module. */
function v268PrimeBalance(label,card,source){
  if(!label||!card)return false;
  label.innerHTML=V268_BALANCE_HEADING;
  if(!card.classList.contains('mf265-balance-card')&&!card.classList.contains('mf264-balance-card')&&!card.classList.contains('v261-balance-card')){
    card.classList.add('v261-balance-card');
  }
  card.dataset.v268BalancePrimed='1';
  card.dataset.v268BalanceSource=source||'runtime';
  return true;
}

/* Used while renderDashboard() is still returning a string. We cannot call the
   v265 DOM enhancer against this detached tree, so make the card recognizable;
   v268EnsureInitialBalance() finalizes it synchronously immediately after the
   Dashboard HTML is mounted by render(). */
function v268UpgradeBalanceHtml(html){
  if(!v268BalanceEnabled())return String(html||'');
  try{
    const host=document.createElement('div');
    host.innerHTML=String(html||'');
    const found=v268LocateBalance(host);
    if(!v268PrimeBalance(found.label,found.card,'render-html'))return String(html||'');
    return host.innerHTML;
  }catch(error){
    console.warn('MediaFlow v268: could not prime Today’s Balance render HTML.',error);
    return String(html||'');
  }
}

function v268EnsureInitialBalance(){
  if(String(S?.view||'')!=='dashboard'||!v268BalanceEnabled())return false;
  const root=document.getElementById('view-root')||document;
  let found=v268LocateBalance(root);
  if(!found.label||!found.card)return false;

  /* If v265 already won the race, simply certify the current canonical card. */
  if(!found.card.classList.contains('mf265-balance-card')){
    v268PrimeBalance(found.label,found.card,'dashboard-dom');
    try{
      if(typeof App.v265EnhanceBalance==='function')App.v265EnhanceBalance();
    }catch(error){console.warn('MediaFlow v268: v265 Balance finalization failed.',error);}
    found=v268LocateBalance(root);
  }

  if(!found.label||!found.card)return false;
  found.label.innerHTML=V268_BALANCE_HEADING;
  found.card.dataset.v268InitialLoad='1';
  found.card.dataset.v268BalanceSource='dashboard-dom';
  return found.card.classList.contains('mf265-balance-card');
}

/* Every future Dashboard HTML payload is primed before it reaches the DOM. */
const v268RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  return v268UpgradeBalanceHtml(v268RenderDashboardBase.apply(this,arguments));
};

function v268HydrateBalance(){
  if(String(S?.view||'')!=='dashboard')return;
  try{v268EnsureInitialBalance();}catch(error){console.warn('MediaFlow v268: initial Balance hydration failed.',error);}
}

/* render() is the decisive path: renderView() mounts Dashboard HTML inside the
   base call, then v268 finalizes Balance in the same JavaScript task, before a
   browser paint or page switch is required. */
const v268RenderShellBase=renderShell;
renderShell=function(){
  const out=v268RenderShellBase.apply(this,arguments);
  if(String(S?.view||'')==='dashboard')v268HydrateBalance();
  return out;
};
const v268RenderBase=render;
render=function(){
  const out=v268RenderBase.apply(this,arguments);
  if(String(S?.view||'')==='dashboard')v268HydrateBalance();
  requestAnimationFrame(()=>{try{v268HydrateBalance();v268UpdateVersionChrome();}catch(_){ }});
  return out;
};

function v268UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v268';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v268');});
}

try{MediaFlowRuntime.registerPageEnhancer('dashboard',()=>v268HydrateBalance());}catch(_){ }
Object.assign(App,{v268EnsureInitialBalance,v268UpgradeBalanceHtml});
window.MediaFlowV268={version:268,focus:'Today’s Balance immediate initial Dashboard render + hydration stability'};
MediaFlowRuntime.version=V268_RUNTIME_VERSION;

/* Handle both bootstrap timings: the Dashboard may already exist when this
   module loads, or authenticated hydration may mount it immediately afterward. */
v268HydrateBalance();
queueMicrotask(v268HydrateBalance);
requestAnimationFrame(()=>{v268HydrateBalance();v268UpdateVersionChrome();});
window.addEventListener('load',v268HydrateBalance,{once:true});
})();
