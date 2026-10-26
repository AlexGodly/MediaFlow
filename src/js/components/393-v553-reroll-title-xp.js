/* MediaFlow v553 — amount-scaled XP for consumed reroll recommendations.
 * Reroll titles earn the existing configured per-unit XP for each unit actually
 * consumed. The forecast applies the same category rotation and day-streak
 * rounding as the current session. The preview is read-only and never touches
 * saved state.
 */
const MF553_VERSION=553;
let MF553_SUPPRESS_PREVIEW_BONUS=false;

function mf553SafeNumber(value){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(0,n):0;
}
function mf553TitleKey(value){
  const id=String(value?.libraryId||'').trim();
  if(id)return 'id:'+id;
  const title=String(cleanTitle(value?.title||'')||'').trim().toLowerCase();
  return title?'title:'+title:'';
}
function mf553RerollUnitRows(){
  const draft=S.logDraft||{};
  const task=S.currentTask||{};
  const history=Array.isArray(task.v180RecommendationHistory)
    ?task.v180RecommendationHistory:[];
  if(!history.length||!Array.isArray(draft.entries)||!draft.entries.length)
    return {byCategory:new Map(),units:0,baseXP:0,titles:[]};
  let slotLimit=1;
  try{
    if(typeof v180RespectSlotLimit==='function')
      slotLimit=Math.max(0,Math.floor(Number(v180RespectSlotLimit(task))||0));
  }catch(_){}
  const rerollKeys=new Set();
  const rerollTitles=new Map();
  for(const rec of history.slice(slotLimit)){
    const key=mf553TitleKey(rec);
    if(!key)continue;
    rerollKeys.add(key);
    if(!rerollTitles.has(key))
      rerollTitles.set(key,String(rec.title||'').trim()||'Reroll title');
  }
  if(!rerollKeys.size)return {byCategory:new Map(),units:0,baseXP:0,titles:[]};
  const settings=typeof levelingSettings==='function'?levelingSettings():{};
  if(settings.enabled===false)return {byCategory:new Map(),units:0,baseXP:0,titles:[]};
  const byCategory=new Map(),titleNames=new Set();
  let unitsTotal=0,baseXP=0;
  const itemized=draft.v369Interface==='itemized';
  for(const entry of draft.entries){
    if(!entry||typeof entry!=='object')continue;
    const key=mf553TitleKey(entry);
    if(!key||!rerollKeys.has(key))continue;
    const units=itemized&&Array.isArray(entry.v369Units)
      ?entry.v369Units.filter(unit=>unit&&typeof unit==='object').length
      :Math.max(0,Math.floor(mf553SafeNumber(entry.qty)));
    if(!units)continue;
    const item=entry.libraryId&&typeof v369ItemTitle==='function'
      ?v369ItemTitle(entry):null;
    const categoryId=String(item?.categoryId||task.categoryId||draft.categoryId||'');
    const cat=typeof getCategory==='function'?getCategory(categoryId):null;
    if(!cat?.id)continue;
    const unit=String(cat.unit||'');
    const perUnit=Math.max(0,mf553SafeNumber(settings.unitXP?.[unit]));
    if(!perUnit)continue;
    const xp=units*perUnit;
    if(!byCategory.has(String(cat.id)))
      byCategory.set(String(cat.id),{categoryId:String(cat.id),units:0,baseXP:0});
    const row=byCategory.get(String(cat.id));
    row.units+=units;
    row.baseXP+=xp;
    unitsTotal+=units;
    baseXP+=xp;
    titleNames.add(rerollTitles.get(key)||String(entry.title||'Reroll title'));
  }
  return {byCategory,units:unitsTotal,baseXP,titles:[...titleNames]};
}
function mf553EnrichProjection(base){
  if(!base||MF553_SUPPRESS_PREVIEW_BONUS||!base.eligible)return base;
  const reroll=mf553RerollUnitRows();
  if(!reroll.units||!reroll.baseXP)return {...base,rerollTitleXP:0,
    rerollTitleAwardXP:0,rerollTitleUnits:0,rerollTitleCount:0,rerollTitles:[]};
  let awardDelta=0,rotationXP=0,streakXP=0;
  const repeatMap=base.repeat?.perRow;
  for(const row of base.categories||[]){
    const item=reroll.byCategory.get(String(row.id));
    if(!item)continue;
    const rotation=Number.isFinite(Number(row.rotation))
      ?Math.max(0,Number(row.rotation)):1;
    const rawBonus=item.baseXP*rotation;
    rotationXP+=rawBonus-item.baseXP;
    const repeat=repeatMap instanceof Map?mf553SafeNumber(repeatMap.get(String(row.id))):0;
    const multiplier=Number.isFinite(Number(base.dayMultiplier))
      ?Math.max(0,Number(base.dayMultiplier)):1;
    const before=Math.round((mf553SafeNumber(row.consumption)+
      mf553SafeNumber(row.respect)+repeat)*multiplier);
    const after=Math.round((mf553SafeNumber(row.consumption)+
      mf553SafeNumber(row.respect)+repeat+rawBonus)*multiplier);
    awardDelta+=Math.max(0,after-before);
  }
  streakXP=awardDelta-(reroll.baseXP+rotationXP);
  return {...base,total:mf553SafeNumber(base.total)+awardDelta,
    rerollTitleXP:reroll.baseXP,rerollTitleRotationXP:Math.round(rotationXP),
    rerollTitleStreakXP:Math.round(streakXP),rerollTitleAwardXP:awardDelta,
    rerollTitleUnits:reroll.units,rerollTitleCount:reroll.titles.length,
    rerollTitles:reroll.titles};
}
const mf553BaseProject=mf537ProjectXP;
mf537ProjectXP=function(){
  const base=mf553BaseProject.apply(this,arguments);
  return mf553EnrichProjection(base);
};

const mf553BaseCard=mf537XPCardMarkup;
mf537XPCardMarkup=function(){
  const html=String(mf553BaseCard.apply(this,arguments)||'');
  const p=mf537ProjectXP();
  if(!p?.rerollTitleUnits||!p.rerollTitleAwardXP)return html;
  const f=mf537Fmt;
  const total=html.replace(/(<div class="mf537-xp-total"><strong>\+)[\d,]+/,(_,prefix)=>prefix+f(p.total));
  const summary='<div class="mf542-xp-extra mf553-reroll-summary" aria-label="Reroll title reward included in total">'+
    '<div><span>Reroll title reward · '+f(p.rerollTitleUnits)+' units</span><strong>+'+
    f(p.rerollTitleAwardXP)+' XP</strong></div></div>';
  const detail='<div class="mf537-xp-subhead">Reroll title consumption</div>'+
    '<div class="mf537-detail-grid mf542-detail-grid mf553-reroll-detail">'+
    '<span>Consumed reroll units</span><strong>'+f(p.rerollTitleUnits)+'</strong>'+
    '<span>Configured per-unit XP</span><strong>+'+f(p.rerollTitleXP)+' XP</strong>'+
    '<span>Category rotation adjustment</span><strong>'+(p.rerollTitleRotationXP>=0?'+':'')+f(p.rerollTitleRotationXP)+' XP</strong>'+
    '<span>Day-streak and rounding adjustment</span><strong>'+(p.rerollTitleStreakXP>=0?'+':'')+f(p.rerollTitleStreakXP)+' XP</strong>'+
    '<span>Total reroll-title reward</span><strong>+'+f(p.rerollTitleAwardXP)+' XP</strong>'+
    '<span>Titles consumed</span><strong>'+escapeHtml(p.rerollTitles.join(', '))+'</strong></div>';
  return total.replace('<div class="mf537-xp-status">',summary+'<div class="mf537-xp-status">')
    .replace('<div class="mf537-xp-formula">',detail+'<div class="mf537-xp-formula">');
};

/* v544's existing reward contract remains authoritative for its base award.
 * Temporarily suppress only this add-on during that check, then credit the
 * exact incremental forecast once the canonical logger creates a session.
 */
const mf553SubmitBase=App.submitLog;
App.submitLog=function(){
  if(S.logging!==true||!S.logDraft)return mf553SubmitBase.apply(this,arguments);
  const task=S.currentTask||{};
  const beforeIds=new Set((S.sessions||[]).filter(s=>s?.id).map(s=>String(s.id)));
  const full=mf537ProjectXP();
  MF553_SUPPRESS_PREVIEW_BONUS=true;
  let base;
  try{base=mf537ProjectXP();}
  finally{MF553_SUPPRESS_PREVIEW_BONUS=false;}
  const delta=Math.max(0,Math.round(mf553SafeNumber(full?.total)-mf553SafeNumber(base?.total)));
  const audit={delta,units:full?.rerollTitleUnits||0,baseXP:full?.rerollTitleXP||0,
    titles:Array.isArray(full?.rerollTitles)?full.rerollTitles.slice():[]};
  MF553_SUPPRESS_PREVIEW_BONUS=true;
  let result;
  try{result=mf553SubmitBase.apply(this,arguments);}
  finally{MF553_SUPPRESS_PREVIEW_BONUS=false;}
  const added=(S.sessions||[]).filter(s=>s?.id&&!beforeIds.has(String(s.id))&&
    s.status!=='skipped'&&Number(s.actualAmount)>0);
  if(S.logging===false&&added.length&&delta>0){
    const target=added.find(s=>String(s.categoryId||'')===String(task.categoryId||''))||added[0];
    if(target&&!target.v553RerollTitleBonusAwarded){
      target.xp=Math.max(0,mf553SafeNumber(target.xp)+delta);
      if(Number.isFinite(Number(target.xpWithStreak)))
        target.xpWithStreak=Math.max(0,mf553SafeNumber(target.xpWithStreak)+delta);
      target.v553RerollTitleBonusAwarded=true;
      target.v553RerollTitleBonusXP=delta;
      target.v553RerollTitleBonusUnits=audit.units;
      target.v553RerollTitleBonusBaseXP=audit.baseXP;
      target.v553RerollTitleNames=audit.titles;
      try{persistSessions();}
      catch(error){console.error('MediaFlow v553: reroll XP persistence failed',error);}
      try{if(typeof render==='function')render();}
      catch(error){console.warn('MediaFlow v553: XP display refresh failed',error);}
      const prior=window.MediaFlowLastLogXPAudit||{};
      window.MediaFlowLastLogXPAudit={...prior,version:MF553_VERSION,
        projected:full?.total??null,actual:Math.max(0,mf553SafeNumber(prior.actual)+delta),
        matched:full?.awardReady===true,rerollTitleXP:delta,rerollTitleUnits:audit.units,
        rerollTitles:audit.titles};
    }
  }
  return result;
};

window.MediaFlowV553=Object.freeze({version:MF553_VERSION,
  project:()=>mf537ProjectXP(),rerollUnits:()=>mf553RerollUnitRows()});
MediaFlowRuntime.version=MF553_VERSION;
