/* MediaFlow v542 — truthful, complete Logging XP forecast and award audit.
 * Pure read-only prediction; canonical submit still owns History, Library and
 * all XP ledgers. No settings/Supabase writes from rendering or simulation. */
const MF542_VERSION=542;
function mf542Has(map,id){return !!map&&Object.prototype.hasOwnProperty.call(map,String(id));}
function mf542SafeAmount(n){return Number.isFinite(Number(n))?Math.max(0,Math.round(Number(n))):0;}
function mf542RepeatBefore(){
  // Fast exit for normal non-repeat drafts. Historic repeats are counted by
  // the v121 canonical key, not by title names guessed from UI labels.
  const counts=new Map();
  for(const s of (Array.isArray(S.sessions)?S.sessions:[])){
    if(!s||s.status==='skipped')continue;
    for(const t of (Array.isArray(s.titles)?s.titles:[])){
      const itemized=t?.v369Itemized&&Array.isArray(t.v369Units);
      if(!t?.repeat&&!itemized)continue;
      const qty=itemized?t.v369Units.filter(u=>u&&(t.repeat||u.isRepeat===true)).length:
        mf542SafeAmount(t?.qty);
      if(!qty)continue;
      const key=v121RepeatKey(t,s);
      if(key)counts.set(key,(counts.get(key)||0)+qty);
    }
  }
  return counts;
}
function mf542ProjectRepeat(base){
  const rows=mf537DraftRows().rows;
  const entries=S.logDraft?.entries||[];
  const itemized=S.logDraft?.v369Interface==='itemized';
  const L=levelingSettings();
  const perRow=new Map(), running=entries.some(e=>e?.isRepeat||
    (itemized&&Array.isArray(e?.v369Units)&&e.v369Units.some(u=>u?.isRepeat)))?mf542RepeatBefore():new Map();
  let unitXP=0,fullXP=0,repeatUnits=0,fullRepeats=0;
  if(L.enabled===false)return {perRow,unitXP,fullXP,repeatUnits,fullRepeats};
  for(const row of rows){
    let rowUnitXP=0,rowFullXP=0;
    for(const entry of row.entries||[]){
      const units=itemized&&Array.isArray(entry?.v369Units)?entry.v369Units:null;
      const qty=units?units.filter(u=>u&&(entry.isRepeat||u.isRepeat===true)).length:
        (entry?.isRepeat?mf542SafeAmount(entry.qty):0);
      if(qty<=0)continue;
      const item=entry.libraryId?v369ItemTitle(entry):null;
      const unit=String(getCategory(item?.categoryId||row.categoryId)?.unit||row.cat?.unit||'');
      const perUnit=Math.max(0,Number(L.repeatUnitXP?.[unit])||0);
      const title={libraryId:entry.libraryId,title:entry.title,qty,repeat:!!entry.isRepeat};
      const session={categoryId:row.categoryId,unit};
      const key=v121RepeatKey(title,session);
      const before=running.get(key)||0,after=before+qty;
      // v121RepeatTotal also writes repeatTotalAtLog; pass a disposable object.
      const threshold=v121RepeatTotal({...title},session,item,unit);
      const crossed=threshold>0?Math.max(0,Math.floor(after/threshold)-Math.floor(before/threshold)):0;
      if(key)running.set(key,after);
      rowUnitXP+=qty*perUnit;
      rowFullXP+=crossed*Math.max(0,Number(L.fullRepeatXP)||0);
      repeatUnits+=qty;fullRepeats+=crossed;
    }
    const bonus=mf542SafeAmount(rowUnitXP)+mf542SafeAmount(rowFullXP);
    if(bonus)perRow.set(String(row.categoryId),bonus);
    unitXP+=mf542SafeAmount(rowUnitXP);
    fullXP+=mf542SafeAmount(rowFullXP);
  }
  return {perRow,unitXP,fullXP,repeatUnits,fullRepeats};
}
function mf542ProjectedMilestones(dayMultiplier){
  const out={completionXP:0,completionBonusXP:0,completionStreakXP:0,
    titleStartXP:0,firstEpisodeXP:0,completions:0,starts:0,firstEpisodes:0};
  if(S.logDraft?.updateLibrary!==true||levelingSettings().enabled===false)return out;
  const itemized=S.logDraft?.v369Interface==='itemized';
  const L=levelingSettings();
  const entries=S.logDraft?.entries||[];
  const projected=new Map();
  for(const e of entries){
    const item=e?.libraryId?v369ItemTitle(e):null;
    if(!item?.id||e.isRepeat)continue;
    const id=String(item.id);
    const previous=projected.get(id);
    const priorProgress=previous===undefined?Math.max(0,Number(item.progress)||0):previous;
    let nextProgress;
    if(itemized&&Array.isArray(e.v369Units)&&typeof v369ProjectedTitleProgress==='function'){
      nextProgress=v369ProjectedTitleProgress(item,e);
    }else{
      nextProgress=priorProgress+Math.max(0,Number(e.qty)||0);
    }
    if(Number(item.total)>0)nextProgress=Math.min(nextProgress,Number(item.total));
    projected.set(id,Math.max(priorProgress,nextProgress));
  }
  const ledger=S.xpLedger||{};
  for(const [id,progress] of projected){
    const item=(S.library||[]).find(x=>String(x?.id||'')===id);
    if(!item)continue;
    const future={...item,progress,
      status:Number(item.total)>0&&progress>=Number(item.total)&&item.status!=='dropped'
        ?'completed':item.status==='planned'&&progress>0?'active':item.status};
    const wasCompleted=v120IsCompleted(item),nowCompleted=v120IsCompleted(future);
    if(!wasCompleted&&nowCompleted){
      const base=mf542SafeAmount(L.completionXP);
      out.completionXP+=base;out.completions++;
      if(!mf542Has(ledger.logCompletions,id)){
        // The logged-completion ledger earns its own day-streak bonus, but
        // must not be multiplied again as session XP.
        const bonus=v120LoggedCompletionXP();
        out.completionBonusXP+=bonus;
        out.completionStreakXP+=Math.max(0,Math.round(bonus*dayMultiplier)-bonus);
      }
      const known=typeof V348_LIBRARY_KNOWN!=='undefined'&&typeof V348_LIBRARY_KNOWN?.get==='function'?V348_LIBRARY_KNOWN.get(id):null;
      if(known&&!known.completed&&!mf542Has(ledger.v348LibraryCompletionBonus,id)){
        out.completionStreakXP+=Math.max(0,v348Multiply(base)-base);
      }
    }
    const priorStart=typeof V334_KNOWN_TITLE_STATES!=='undefined'&&typeof V334_KNOWN_TITLE_STATES?.get==='function'?V334_KNOWN_TITLE_STATES.get(id):null;
    if(priorStart===false&&v334Started(future)&&!mf542Has(ledger.v334StartedTitles,id)){
      out.titleStartXP+=v348Multiply(v334Reward('firstTitleStartXP'));out.starts++;
    }
    const wasEpisode=typeof V335_KNOWN_EPISODES!=='undefined'&&typeof V335_KNOWN_EPISODES?.get==='function'?V335_KNOWN_EPISODES.get(id):null;
    if(wasEpisode===0&&progress>0&&v335IsEpisodeTitle(future)&&!mf542Has(ledger.v335FirstEpisodeRewards,id)){
      const amount=Math.max(0,Math.min(100000,Number(L.firstEpisodeXP??V335_FIRST_EPISODE_DEFAULT)||0));
      out.firstEpisodeXP+=v348Multiply(Math.round(amount));out.firstEpisodes++;
    }
  }
  return out;
}
function mf542EnrichProjection(base){
  // An invalid/empty draft cannot submit. Never promise an award for it.
  if(!base?.eligible)return {...base,milestones:null,repeat:null,awardReady:false};
  const repeat=mf542ProjectRepeat(base);
  const milestones=mf542ProjectedMilestones(base.dayMultiplier);
  let sessionChange=0,repeatStreakXP=0;
  for(const row of base.categories){
    const bonus=repeat.perRow.get(row.id)||0;
    if(!bonus)continue;
    const after=Math.round((row.consumption+row.respect+bonus)*base.dayMultiplier);
    sessionChange+=after-row.afterStreak;
    repeatStreakXP+=after-row.afterStreak-bonus;
  }
  const fixed=milestones.completionXP+milestones.completionBonusXP+
    milestones.completionStreakXP+milestones.titleStartXP+milestones.firstEpisodeXP;
  return {...base,total:base.total+sessionChange+fixed,
    repeatXP:repeat.unitXP+repeat.fullXP,repeatStreakXP,
    milestones,repeat,awardReady:!base.respectUnavailable,sessionChange,
    independentXP:fixed};
}
const mf542BaseProject=mf537ProjectXP;
let MF542_LAST_PREVIEW=null;
mf537ProjectXP=function(){
  const result=mf542EnrichProjection(mf542BaseProject());
  MF542_LAST_PREVIEW=result;
  return result;
};
const mf542BaseCard=mf537XPCardMarkup;
mf537XPCardMarkup=function(){
  const html=mf542BaseCard();
  const p=MF542_LAST_PREVIEW;
  if(!p?.eligible||!p.milestones)return html;
  const f=mf537Fmt,repeat=p.repeat,m=p.milestones;
  const milestone=m.completionXP+m.completionBonusXP+m.completionStreakXP+
    m.titleStartXP+m.firstEpisodeXP;
  const items=[
    ['Repeat units & full repeats',p.repeatXP],
    ['Repeat day-streak bonus',p.repeatStreakXP],
    ['Completed-title XP',m.completionXP],
    ['Log completion reward',m.completionBonusXP],
    ['Completion streak bonuses',m.completionStreakXP],
    ['First title start',m.titleStartXP],
    ['First episode',m.firstEpisodeXP]
  ];
  const summary='<div class="mf542-xp-extra" aria-label="Additional rewards included in total">'+
    '<div><span>Repeat rewards</span><strong>+'+f(p.repeatXP+p.repeatStreakXP)+' XP</strong></div>'+
    '<div><span>Milestone rewards</span><strong>+'+f(milestone)+' XP</strong></div></div>';
  const detail='<div class="mf537-xp-subhead">Additional rewards from submission</div>'+
    '<div class="mf537-detail-grid mf542-detail-grid">'+
    items.map(([name,n])=>'<span>'+escapeHtml(name)+'</span><strong>+'+f(n)+' XP</strong>').join('')+'</div>';
  const extra=p.awardReady
    ?'Projected total includes currently eligible consumption, Respect, repeat and milestone rewards.'
    :'Partial forecast: Respect is unavailable; the final award may differ.';
  return html.replace('<div class="mf537-xp-status">',summary+'<div class="mf537-xp-status">')
    .replace('<div class="mf537-xp-formula">',detail+'<div class="mf537-xp-formula">')
    .replace('After ×'+Number(p.dayMultiplier).toFixed(2)+' day streak',
      'Including day streak and milestones')
    .replace('Completion, repeat and other separate action rewards may add XP after submission.',
      extra);
};
// Final XP accounting is read-only; never top up/correct XP automatically
// because that could double-award after a retry or a cloud merge.
function mf542AccountXP(){
  return mf542SafeAmount(v150ComputeStateMetrics({
    sessions:S.sessions||[],library:S.library||[],xpLedger:S.xpLedger||{}
  }).totalXP);
}
const mf542SubmitBase=App.submitLog;
App.submitLog=function(){
  const beforeDraft=S.logDraft,oldCount=(S.sessions||[]).length;
  const forecast=S.logging&&beforeDraft?mf537ProjectXP():null;
  const before=mf542AccountXP();
  const value=mf542SubmitBase.apply(this,arguments);
  if(S.logging===false&&(S.sessions||[]).length>oldCount){
    const earned=mf542AccountXP()-before;
    const report={version:MF542_VERSION,projected:forecast?.total??null,
      actual:earned,matched:forecast?.awardReady===true&&forecast.total===earned,
      date:todayISO(),
      sessionCount:(S.sessions||[]).length-oldCount,
      breakdown:forecast?{consumption:forecast.consumptionTotal,
        respect:forecast.respectTotal,repeat:forecast.repeatXP,
        milestones:forecast.milestones,streak:forecast.streakBonus}:null};
    window.MediaFlowLastLogXPAudit=report;
    if(forecast?.awardReady&&earned!==forecast.total)
      console.warn('MediaFlow XP award variance (no XP modified)',{
        projected:forecast.total,actual:earned,difference:earned-forecast.total});
  }
  return value;
};
App.v542XPPreview=function(){return mf537ProjectXP();};
App.v542LastAward=function(){return window.MediaFlowLastLogXPAudit||null;};
window.MediaFlowV542=Object.freeze({version:MF542_VERSION,
  project:App.v542XPPreview,lastAward:App.v542LastAward});
MediaFlowRuntime.version=MF542_VERSION;
