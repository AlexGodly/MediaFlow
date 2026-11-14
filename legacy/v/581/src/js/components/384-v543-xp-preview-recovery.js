/* MediaFlow v543 — resilient Logging XP forecast and real-render recovery.
 * This code never submits, awards, saves or synchronizes data. The v542
 * canonical full forecast remains the primary source when it succeeds.
 * A bonus subsystem failure MUST NOT hide otherwise valid consumption XP. */
const MF543_VERSION=543;
let MF543_LAST_ERROR=null;
function mf543Report(stage,error){
  MF543_LAST_ERROR={stage,message:String(error?.message||error||'Unknown preview error').slice(0,300)};
  console.warn('MediaFlow v543 XP preview · '+stage,error);
}
function mf543PartialBase(base,stage){
  const result={...base,awardReady:false,rewardDetailsUnavailable:true,
    rewardWarning:'Full reward prediction is unavailable ('+stage+'). Consumption and any available System Respect are shown; additional rewards may be earned on submission.',
    milestones:null,repeat:null,repeatXP:0,repeatStreakXP:0,independentXP:0};
  MF542_LAST_PREVIEW=result;
  return result;
}
// Preserve the verified v542 full forecast when available. Isolate failures in
// legacy/partially restored XP ledgers, previous repeat units and milestone
// tracking; never turn those into a fabricated 0-XP award.
const mf543FullProject=mf537ProjectXP;
mf537ProjectXP=function(){
  try{
    const full=mf543FullProject();
    if(!full||!Number.isFinite(Number(full.total)))throw Error('Invalid reward total');
    if(full.eligible&&full.rewardDetailsUnavailable)return mf543PartialBase(full,'bonus forecast');
    MF543_LAST_ERROR=null;
    return full;
  }catch(error){
    mf543Report('extra rewards',error);
    try{
      const core=mf542BaseProject();
      if(!core||!Number.isFinite(Number(core.total)))throw Error('Invalid core XP total');
      return mf543PartialBase(core,'repeat or milestone calculation');
    }catch(coreError){
      mf543Report('core reward calculation',coreError);
      return mf543EmergencyProjection();
    }
  }
};
// This is an emergency read-only consumption projection. It intentionally
// marks Respect / milestone rewards unverified instead of inventing an award.
function mf543EmergencyProjection(){
  let rows=[];
  try{rows=mf537DraftRows().rows||[];}catch(error){mf543Report('draft rows',error);}
  let dayMultiplier=1,streak=0;
  try{
    streak=typeof v149ProspectiveTodayStreak==='function'?v149ProspectiveTodayStreak():0;
    dayMultiplier=typeof v149StreakMultiplier==='function'?Number(v149StreakMultiplier(streak))||1:1;
  }catch(error){mf543Report('day streak',error);}
  let baseTotal=0,consumptionTotal=0,streakBonus=0,total=0;
  const categories=[];
  for(const row of rows){
    try{
      const status=categoryStatus(row.cat);
      const calc=calculateConsumptionXP(row.cat,row.amount,row.minutes,status);
      const raw=Math.max(0,Number(calc.xp)||0);
      const after=Math.max(0,Math.round(raw*dayMultiplier));
      categories.push({id:String(row.categoryId),name:String(row.cat?.name||'Category'),
        unit:String(row.cat?.unit||''),amount:row.amount,minutes:row.minutes,status,
        base:Math.max(0,Number(calc.base)||0),rotation:Math.max(0,Number(calc.multiplier)||0),
        consumption:raw,respect:0,beforeStreak:raw,afterStreak:after});
      baseTotal+=Math.max(0,Number(calc.base)||0);
      consumptionTotal+=raw;streakBonus+=after-raw;total+=after;
    }catch(error){mf543Report('category calculation',error);}
  }
  return mf543PartialBase({total,baseTotal,consumptionTotal,respectTotal:0,
    rawSessionTotal:consumptionTotal,streakBonus,streak,dayMultiplier,
    categories,respect:null,respectUnavailable:true,
    eligible:rows.some(r=>Number(r.actualAmount)>0),
    mode:S.logDraft?.v369Interface==='itemized'?'advanced':'quick'},'core reward calculation');
}
function mf543PartialNotice(p){
  if(!p?.rewardDetailsUnavailable)return '';
  return '<div class="mf543-xp-warning" role="status">'+
    v382Icon('shield',16)+
    '<span><strong>Partial XP forecast</strong> — '+escapeHtml(p.rewardWarning)+
    ' Your draft is safe. No XP is awarded until you submit.</span></div>';
}
const mf543FullCard=mf537XPCardMarkup;
function mf543MinimalCard(p){
  const fmt=(n)=>mf537Fmt(n);
  const rows=(p.categories||[]).map(c=>'<div class="mf537-category-row">'+
    '<b>'+escapeHtml(c.name)+'</b> <span>'+fmt(c.amount)+' units · '+
    fmt(c.minutes)+' min</span><strong>+'+fmt(c.afterStreak)+' XP</strong></div>').join('');
  return '<section class="mf537-xp-card mf543-xp-rescued" role="group" aria-label="XP reward preview">'+
    '<div class="mf537-xp-head"><div class="mf537-xp-heading"><span class="mf537-xp-icon">'+
    v382Icon('sparkle',17)+'</span><div><small>PARTIAL XP ESTIMATE</small>'+
    '<b>XP for this log</b></div></div><div class="mf537-xp-total"><strong>+'+
    fmt(p.total)+'</strong><span>XP</span></div></div>'+
    '<div class="mf537-xp-metrics"><div><span>Consumption</span><strong>+'+
    fmt(p.consumptionTotal)+' XP</strong></div><div><span>System Respect</span>'+
    '<strong>Not verified</strong></div><div><span>Day-streak bonus</span><strong>+'+
    fmt(p.streakBonus)+' XP</strong></div></div>'+
    mf543PartialNotice(p)+
    '<details class="mf537-xp-details"><summary>XP by category</summary>'+
    '<div class="mf537-xp-detail-body">'+(rows||'Add units to see an XP estimate.')+
    '</div></details><p class="mf537-xp-footnote">Read-only preview. Final XP is calculated by MediaFlow when you log.</p></section>';
}
mf537XPCardMarkup=function(){
  try{
    const html=mf543FullCard();
    const p=MF542_LAST_PREVIEW;
    if(typeof html!=='string'||!html.includes('mf537-xp-card'))throw Error('Missing XP card markup');
    if(!p?.rewardDetailsUnavailable)return html;
    return html.replace('<div class="mf537-xp-status">',mf543PartialNotice(p)+'<div class="mf537-xp-status">')
      .replace('ESTIMATED TOTAL XP','PARTIAL XP ESTIMATE');
  }catch(error){
    mf543Report('XP card',error);
    const p=mf537ProjectXP();
    return mf543MinimalCard(p);
  }
};
// Refresh the real DOM, not only the legacy formatter. This is the final
// runtime-extension patch, after v538 and v542, for BOTH Logging modes.
function mf543ApplyLiveXP(){
  const el=document.getElementById('xp-preview');
  if(!el||!S.logDraft)return false;
  const open=!!el.querySelector?.('.mf537-xp-details')?.open;
  const html=mf537XPCardMarkup();
  el.classList.add('mf382-xp-host');
  el.removeAttribute('style');
  if(el.innerHTML!==html)el.innerHTML=html;
  if(open){
    const details=el.querySelector?.('.mf537-xp-details');
    if(details)details.open=true;
  }
  return !!el.querySelector?.('.mf537-xp-card');
}
v382UpdateXPPreview=mf543ApplyLiveXP;
const mf543RenderBase=renderLogForm;
renderLogForm=function(){
  const html=String(mf543RenderBase.apply(this,arguments)||'');
  if(!S.logDraft||!html.includes('xp-preview'))return html;
  try{
    const host=document.createElement('div');
    host.innerHTML=html;
    const el=host.querySelector('#xp-preview');
    if(!el)return html;
    // Do not render twice if v538 already supplied a correct card.
    if(!el.querySelector('.mf537-xp-card')||
      el.querySelector('.mf537-preview-error'))el.innerHTML=mf537XPCardMarkup();
    return host.innerHTML;
  }catch(error){
    mf543Report('Logging HTML',error);
    return html;
  }
};
App.v543XPDiagnostics=function(){
  const el=document.getElementById('xp-preview');
  return {version:MF543_VERSION,error:MF543_LAST_ERROR&&{...MF543_LAST_ERROR},
    previewVisible:!!el?.querySelector?.('.mf537-xp-card'),
    failedPlaceholder:!!el?.querySelector?.('.mf537-preview-error'),
    partial:!!el?.querySelector?.('.mf543-xp-warning')};
};
window.MediaFlowV543=Object.freeze({
  version:MF543_VERSION,diagnostics:App.v543XPDiagnostics,
  repair:mf543ApplyLiveXP,project:()=>mf537ProjectXP()
});
MediaFlowRuntime.version=MF543_VERSION;
