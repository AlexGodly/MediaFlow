/* MediaFlow v537 — Unified XP Reward Preview.
 * One read-only projection for Quick / Advanced Logging, with the SAME
 * canonical category XP, v180 Respect and v149 streak calculations as submit.
 * Existing XP and cloud state are not changed by rendering or estimation.
 */
const MF537_RELEASE=537;
// Functions are deliberately hoisted. Older Logging renderers can request
// a preview while late runtime extensions are still initializing.
function mf537Num(n){return Math.max(0,Number.isFinite(Number(n))?Number(n):0);}
function mf537Fmt(n){return Math.round(mf537Num(n)).toLocaleString();}
function mf537DraftRows(){
  const draft=S.logDraft||{},task=S.currentTask||{};
  const assigned=getCategory(task.categoryId||draft.categoryId||'');
  if(!assigned)return {rows:[],entries:[],task,assigned:null};
  const entries=Array.isArray(draft.entries)?draft.entries:[];
  const itemized=draft.v369Interface==='itemized';
  const groups=new Map();
  if(entries.length){
    for(const entry of entries){
      const item=entry?.libraryId&&typeof v369ItemTitle==='function'
        ?v369ItemTitle(entry):null;
      const cat=(item&&getCategory(item.categoryId))||assigned;
      if(!cat?.id)continue;
      // Itemized submission canonicalizes quantity from exact unit records.
      // Draft qty can be stale before v369Sync() runs at submit.
      const qty=itemized&&Array.isArray(entry?.v369Units)
        ?entry.v369Units.length:mf537Num(entry?.qty);
      if(!groups.has(cat.id))groups.set(cat.id,{cat,entries:[],amount:0,weight:0});
      const group=groups.get(cat.id);
      group.entries.push(entry);
      group.amount+=qty;
      group.weight+=qty*Math.max(1,Number(cat.minutesPerUnit)||1);
    }
  }else{
    const amount=Math.min(999999,mf537Num(draft.amount));
    if(amount>0)groups.set(assigned.id,{cat:assigned,entries:[],amount,
      weight:Math.max(1,amount*Math.max(1,Number(assigned.minutesPerUnit)||1))});
  }
  const grouped=[...groups.values()];
  const totalWeight=grouped.reduce((sum,g)=>sum+g.weight,0)||1;
  const totalMinutes=Math.min(999999,mf537Num(draft.minutes));
  let minutesLeft=totalMinutes;
  const rows=grouped.map((g,index)=>{
    const minutes=itemized&&typeof v369Seconds==='function'
      ?g.entries.reduce((sum,e)=>{
          const units=Array.isArray(e?.v369Units)?e.v369Units:[];
          if(!units.length)return sum;
          // v394 distributes a manual TOTAL across units *before* submission;
          // the preview must use the same effective runtime without editing units.
          const manual=Number(e.v394RuntimeSeconds);
          if(e.v394RuntimeManual&&Number.isFinite(manual)&&manual>=0)
            return sum+Math.round(manual);
          return sum+units.reduce((v,u)=>v+v369Seconds(u),0);
        },0)/60
      :(index===grouped.length-1?minutesLeft:
        Math.min(minutesLeft,Math.round(totalMinutes*(g.weight/totalWeight))));
    minutesLeft=Math.max(0,minutesLeft-minutes);
    return {cat:g.cat,categoryId:g.cat.id,amount:g.amount,actualAmount:g.amount,minutes,
      entries:g.entries,status:g.amount>0?'logged':'partial',
      titles:g.entries.map(e=>({libraryId:e.libraryId,title:e.title,qty:e.qty}))};
  });
  return {rows,entries,task,assigned};
}
function mf537ProjectXP(){
  const draft=mf537DraftRows();
  const {rows,entries,task,assigned}=draft;
  // v180CalculateRespectAward is used by the real submission path too.
  // Its readOnly flag never mutates respect streaks/recommendation history.
  // Projecting Respect is read-only and should not block consumption XP if
  // older/restored recommendation metadata is inconsistent. A partial preview
  // is explicitly labeled rather than inventing bonus XP or changing History.
  let respect=null,respectUnavailable=false;
  if(assigned&&rows.length){
    try{respect=v180CalculateRespectAward(task,entries,rows,true);}
    catch(error){
      respectUnavailable=true;
      console.warn('MediaFlow XP preview: Respect projection unavailable',error);
    }
  }
  const streak=typeof v149ProspectiveTodayStreak==='function'?v149ProspectiveTodayStreak():0;
  const dayMultiplier=typeof v149StreakMultiplier==='function'
    ?v149StreakMultiplier(streak):1;
  let total=0,consumptionTotal=0,streakBonus=0,respectTotal=0;
  let rawSessionTotal=0,baseTotal=0;
  const categories=rows.map(row=>{
    const status=categoryStatus(row.cat);
    const calc=calculateConsumptionXP(row.cat,row.amount,row.minutes,status);
    const awardedRespect=respect?.respected&&String(row.categoryId)===String(task?.categoryId)
      ?mf537Num(respect.bonus):0;
    const consumed=mf537Num(calc.xp);
    const raw=consumed+awardedRespect;
    // v150BaseSessionXP combines consumption and Respect on the same session,
    // then the day-streak engine rounds that combined session exactly once.
    const afterDay=Math.max(0,Math.round(raw*dayMultiplier));
    baseTotal+=mf537Num(calc.base);
    consumptionTotal+=consumed;
    rawSessionTotal+=raw;
    respectTotal+=awardedRespect;
    streakBonus+=afterDay-raw;
    total+=afterDay;
    return {id:String(row.categoryId),name:String(row.cat.name||'Category'),
      unit:String(row.cat.unit||''),amount:row.amount,minutes:row.minutes,status,
      base:mf537Num(calc.base),rotation:mf537Num(calc.multiplier),
      consumption:consumed,respect:awardedRespect,beforeStreak:raw,
      afterStreak:afterDay};
  });
  return {total,baseTotal,consumptionTotal,respectTotal,rawSessionTotal,
    streakBonus,streak,dayMultiplier,respect,categories,
    eligible:rows.length>0&&rows.some(row=>row.actualAmount>0),
    respectUnavailable,
    mode:S.logDraft?.v369Interface==='itemized'?'advanced':'quick',
    note:'Only session consumption and System Respect are projected. Completion, repeat and other independent action rewards are credited separately when eligible.'};
}
function mf537XPCardMarkup(){
  const projection=mf537ProjectXP();
  const {total,consumptionTotal,respectTotal,streakBonus,streak,dayMultiplier,
    categories,respect,eligible,respectUnavailable}=projection;
  const icon=(name)=>v382Icon(name,17);
  const reason=respectUnavailable?'Respect estimate unavailable (consumption only)'
    :respect?.respected
    ?'Recommended category respected'
    :categories.length?'Recommended category not included':'Add titles or log a quantity to see rewards';
  const breakdown=categories.map(c=>'<div class="mf537-category-row">'+
    '<div class="mf537-category-name"><b>'+escapeHtml(c.name)+'</b><span>'+
      escapeHtml(String(c.status))+' · '+mf537Fmt(c.amount)+' units · '+
      mf537Fmt(c.minutes)+' min</span></div>'+
    '<div class="mf537-category-values"><span>'+mf537Fmt(c.base)+' base ×'+c.rotation+
      ' rotation</span><strong>+'+mf537Fmt(c.consumption)+' XP</strong></div></div>').join('');
  const matched=mf537Num(respect?.match?.matchedCount),
        slots=mf537Num(respect?.match?.slotLimit);
  const categoryXP=mf537Num(respect?.categoryXP),
        titleXP=mf537Num(respect?.exactTitleXP);
  const skipMultiplier=mf537Num(respect?.mult?.noSkip)||1;
  const pickMultiplier=mf537Num(respect?.mult?.noReroll)||1;
  const respectDetails='<div class="mf537-detail-grid">'+
    '<span>Recommended category</span><strong>+'+mf537Fmt(categoryXP)+' XP</strong>'+
    '<span>Recommended titles ('+matched+'/'+slots+')</span><strong>+'+mf537Fmt(titleXP)+' XP</strong>'+
    '<span>No-Skip · '+mf537Num(respect?.noSkipStreak)+' logs</span><strong>×'+skipMultiplier.toFixed(2)+'</strong>'+
    '<span>First-pick · '+mf537Num(respect?.noRerollStreak)+' logs</span><strong>×'+pickMultiplier.toFixed(2)+'</strong></div>';
  const heading=respectUnavailable?'PARTIAL XP ESTIMATE':eligible?'ESTIMATED TOTAL XP':'XP PREVIEW';
  return '<section class="mf537-xp-card" role="group" aria-label="Unified XP reward preview">'+
    '<div class="mf537-xp-head">'+
      '<div class="mf537-xp-heading"><span class="mf537-xp-icon">'+icon('sparkle')+'</span>'+
        '<div><small>'+heading+'</small><b>XP for this log</b></div></div>'+
      '<div class="mf537-xp-total"><strong>+'+mf537Fmt(total)+'</strong><span>XP</span></div></div>'+
    '<div class="mf537-xp-metrics">'+
      '<div><span>Consumption</span><strong>+'+mf537Fmt(consumptionTotal)+' XP</strong></div>'+
      '<div><span>System Respect</span><strong>'+(respectUnavailable?'Unavailable':'+'+mf537Fmt(respectTotal)+' XP')+'</strong></div>'+
      '<div><span>Day-streak bonus</span><strong>+'+mf537Fmt(streakBonus)+' XP</strong></div></div>'+
    '<div class="mf537-xp-status"><span>'+icon('shield')+' '+escapeHtml(reason)+'</span>'+
      '<span>Day '+mf537Fmt(streak)+' · ×'+Number(dayMultiplier).toFixed(2)+'</span></div>'+
    '<details class="mf537-xp-details"><summary><span>Full XP breakdown</span><span class="mf537-chevron" aria-hidden="true">⌄</span></summary>'+
      '<div class="mf537-xp-detail-body">'+
        '<div class="mf537-xp-subhead">Consumption &amp; Rotation</div>'+
        (breakdown||'<p class="mf537-empty">No consumable units in the draft yet.</p>')+
        '<div class="mf537-xp-subhead">System Respect</div>'+respectDetails+
        '<div class="mf537-xp-formula"><span>Before day streak</span><b>+'+mf537Fmt(projection.rawSessionTotal)+' XP</b>'+
          '<span>After ×'+Number(dayMultiplier).toFixed(2)+' day streak</span><b>+'+mf537Fmt(total)+' XP</b></div>'+
      '</div></details>'+
    '<p class="mf537-xp-footnote">'+(respectUnavailable
      ?'Partial estimate only: System Respect could not be projected from this draft. Actual eligible rewards are still calculated at submission. '
      :'')+'Preview updates as you edit. XP is awarded only when you submit. '+
      'Completion, repeat and other separate action rewards may add XP after submission.</p>'+
    '</section>';
}
// The existing v382 logging card is rendered on both mode-specific paths.
// Replace only its preview renderer, never the actual XP awards or submission.
v382XPCardMarkup=function(){return mf537XPCardMarkup();};
// XP History should show which XP was actually credited, using recorded
// session snapshots. Do not create new XP rows (which would double count).
const mf537HistoryEntriesBase=v348HistoryEntries;
v348HistoryEntries=function(){
  const result=mf537HistoryEntriesBase.apply(this,arguments);
  const sourceSessions=Array.isArray(arguments[1])?arguments[1]:S.sessions;
  const byId=new Map((sourceSessions||[]).filter(s=>s?.id).map(s=>[String(s.id),s]));
  for(const row of result){
    if(row.kind!=='consumption'||!row.sessionId)continue;
    const saved=byId.get(String(row.sessionId));
    if(!saved||!Object.prototype.hasOwnProperty.call(saved,'v165RespectBonusXP'))continue;
    const c=mf537Fmt(saved.xp),r=mf537Fmt(saved.v165RespectBonusXP);
    const categoryPart=mf537Fmt(saved.v165SystemBaseXP);
    const titlePart=mf537Fmt(saved.v165RecommendedTitleBaseXP);
    const mult=Number(saved.streakMultiplier)||1;
    const audit='Consumption '+c+' XP (rotation included) · Respect '+r+
      ' XP (category '+categoryPart+', title '+titlePart+') · Day streak ×'+mult.toFixed(2);
    row.details=[row.details,audit].filter(Boolean).join(' · ');
  }
  return result;
};
App.v537ProjectXP=mf537ProjectXP;
window.MediaFlowV537=Object.freeze({version:MF537_RELEASE,
  project:mf537ProjectXP,render:mf537XPCardMarkup});
MediaFlowRuntime.version=MF537_RELEASE;
