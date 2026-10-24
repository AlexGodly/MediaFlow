/* MediaFlow v544 — truthful XP award contract.
 * Projection and submission use the canonical XP functions. Only completed
 * submissions may create an immutable, session-keyed shortfall receipt. No
 * estimate, DOM refresh or invalid draft ever writes user data. */
const MF544_VERSION=544;
const MF544_MAX_FINITE=Number.MAX_SAFE_INTEGER;
function mf544Rows(x){return Array.isArray(x)?x:[];}
function mf544SafeXP(value){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(0,Math.min(MF544_MAX_FINITE,Math.round(n))):0;
}
function mf544DraftError(){
  const d=S.logDraft;
  if(!d||typeof d!=='object')return 'No Logging draft is open.';
  if(!getCategory(S.currentTask?.categoryId||d.categoryId||''))return 'The recommended category is missing.';
  if(d.entries!==undefined&&!Array.isArray(d.entries))return 'Logging entries must be an array.';
  if(d.v369Interface==='itemized'){
    for(const entry of mf544Rows(d.entries)){
      if(!entry||typeof entry!=='object')return 'A Logging entry is damaged.';
      if(!Array.isArray(entry.v369Units))return 'A title has invalid unit records.';
      for(const unit of entry.v369Units){
        if(!unit||typeof unit!=='object')return 'A saved unit is damaged. Remove or repair it before logging.';
        if(!Number.isFinite(Number(unit.number))||Number(unit.number)<=0)
          return 'A logged unit has an invalid episode/chapter number.';
        if(unit.durationSeconds!==undefined&&(!Number.isFinite(Number(unit.durationSeconds))||Number(unit.durationSeconds)<0))
          return 'A logged unit has an invalid runtime.';
      }
    }
  }
  return '';
}
// v543 already contains a safe consumption-only card. Distinguish an invalid
// draft from a valid full forecast so that the user is never shown a guaranteed
// amount for a submission the canonical logger would reject.
const mf544OriginalProject=mf537ProjectXP;
mf537ProjectXP=function(){
  const error=mf544DraftError();
  const p=mf544OriginalProject();
  if(!error||!p)return p;
  const result={...p,awardReady:false,rewardDetailsUnavailable:true,
    rewardWarning:error+' Correct the Logging draft to verify all rewards.'};
  MF542_LAST_PREVIEW=result;
  return result;
};
const mf544OriginalCard=mf537XPCardMarkup;
mf537XPCardMarkup=function(){
  const card=mf544OriginalCard();
  const message=mf544DraftError();
  if(!message||card.includes('mf543-xp-warning'))return card;
  return card.replace('<div class="mf537-xp-status">',
    '<div class="mf543-xp-warning" role="status">'+v382Icon('shield',16)+
    '<span><strong>Draft needs attention</strong> — '+escapeHtml(message)+
    ' No XP has been awarded.</span></div><div class="mf537-xp-status">');
};
function mf544Receipts(state){
  const out=state?.xpLedger?.v544LogAwardGuarantees;
  return out&&typeof out==='object'&&!Array.isArray(out)?out:{};
}
function mf544ReceiptSum(state){
  const receipts=mf544Receipts(state);
  if(!Object.keys(receipts).length)return 0;
  const validGroups=new Set(),validSessions=new Set();
  for(const s of mf544Rows(state?.sessions)){
    if(!s||s.status==='skipped')continue;
    if(s.sessionGroupId)validGroups.add(String(s.sessionGroupId));
    if(s.id)validSessions.add(String(s.id));
  }
  let xp=0;
  for(const [key,receipt] of Object.entries(receipts)){
    if(!receipt||typeof receipt!=='object')continue;
    if(receipt.sessionId?validSessions.has(String(receipt.sessionId)):
      receipt.groupId&&validGroups.has(String(receipt.groupId))){
      xp+=mf544SafeXP(receipt.xp);
    }
  }
  return xp;
}
// Include guarantee receipts in the ONE canonical progression-metrics function
// used by Dashboard, Levels, History comparisons and the submission audit.
const mf544MetricsBase=v150ComputeStateMetrics;
v150ComputeStateMetrics=function(state){
  const m=mf544MetricsBase.apply(this,arguments);
  const extra=mf544ReceiptSum(state);
  m.v544AwardGuaranteeXP=extra;
  m.fixedLibraryXP+=extra;
  m.totalXP+=extra;
  return m;
};
// Receipts are keyed by a committed session ID. Max-merge, never
// sum the same receipt after offline edits or bidirectional cloud restores.
const mf544MergeBase=mergeStates;
mergeStates=function(a,b){
  const out=mf544MergeBase.apply(this,arguments)||{};
  const fromA=mf544Receipts(a),fromB=mf544Receipts(b);
  const merged={};
  for(const key of new Set([...Object.keys(fromB),...Object.keys(fromA)])){
    const x=fromA[key],y=fromB[key];
    const winner=mf544SafeXP(x?.xp)>=mf544SafeXP(y?.xp)?x:y;
    if(winner&&typeof winner==='object')merged[key]={...winner,xp:mf544SafeXP(winner.xp)};
  }
  out.xpLedger=out.xpLedger||{};
  out.xpLedger.v544LogAwardGuarantees=merged;
  return out;
};
const mf544XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const report=mf544XPBreakdownBase.apply(this,arguments);
  report.awardGuaranteeXP=mf544ReceiptSum(S);
  return report;
};
const mf544SubmitBase=App.submitLog;
App.submitLog=function(){
  if(S.logging!==true||!S.logDraft)return mf544SubmitBase.apply(this,arguments);
  const draftError=mf544DraftError();
  if(draftError){
    if(typeof showToast==='function')showToast('Logging not submitted: '+draftError);
    return false;
  }
  let preview=null;
  try{preview=mf537ProjectXP();}catch(error){
    console.warn('MediaFlow v544: full XP forecast cannot be verified',error);
  }
  // Partial estimates aren't guarantees. The UI labels them accordingly.
  const promised=preview?.awardReady===true&&Number.isFinite(Number(preview.total))
    ?mf544SafeXP(preview.total):null;
  const beforeIds=new Set(mf544Rows(S.sessions).filter(s=>s?.id).map(s=>String(s.id)));
  const before=mf544SafeXP(v150ComputeStateMetrics({
    sessions:S.sessions||[],library:S.library||[],xpLedger:S.xpLedger||{}
  }).totalXP);
  const result=mf544SubmitBase.apply(this,arguments);
  const submitted=mf544Rows(S.sessions).filter(s=>s?.id&&!beforeIds.has(String(s.id)));
  if(S.logging!==false||!submitted.some(s=>s.status!=='skipped'))return result;
  const groupId=String(submitted.find(s=>s?.sessionGroupId)?.sessionGroupId||'');
  const sessionId=String(submitted.find(s=>s?.status!=='skipped')?.id||'');
  const receiptKey='session:'+sessionId;
  let actual=mf544SafeXP(v150ComputeStateMetrics({
    sessions:S.sessions||[],library:S.library||[],xpLedger:S.xpLedger||{}
  }).totalXP)-before;
  let credited=0;
  if(promised!==null&&actual<promised&&sessionId){
    const ledger=S.xpLedger||(S.xpLedger={});
    const receipts=ledger.v544LogAwardGuarantees&&
      typeof ledger.v544LogAwardGuarantees==='object'&&!Array.isArray(ledger.v544LogAwardGuarantees)
      ?ledger.v544LogAwardGuarantees:(ledger.v544LogAwardGuarantees={});
    const existing=mf544SafeXP(receipts[receiptKey]?.xp);
    const owed=Math.max(0,promised-actual);
    if(owed>existing){
      credited=owed-existing;
      receipts[receiptKey]={xp:owed,groupId,sessionId,
        createdAt:Date.now(),source:'Logging forecast shortfall guarantee',version:MF544_VERSION};
      if(typeof v149MarkStreakDirty==='function')v149MarkStreakDirty();
      // Persist the ledger using MediaFlow's existing session/account save
      // mechanism. It is also included in full backups and max-merges.
      try{persistSessions();}catch(error){
        console.error('MediaFlow v544: guarantee persistence failed',error);
        if(typeof saveState==='function')Promise.resolve(saveState()).catch(e=>
          console.error('MediaFlow v544: guarantee retry failed',e));
      }
    }
    actual=mf544SafeXP(v150ComputeStateMetrics({
      sessions:S.sessions||[],library:S.library||[],xpLedger:S.xpLedger||{}
    }).totalXP)-before;
    if(credited&&typeof showToast==='function')
      showToast('XP promise honored · +'+credited.toLocaleString()+' XP shortfall credited');
  }
  const report={version:MF544_VERSION,projected:promised,actual,
    matched:promised!==null&&actual>=promised,
    difference:promised===null?null:actual-promised,
    guaranteedXP:credited,verified:promised!==null,
    sessionCount:submitted.length,date:todayISO()};
  window.MediaFlowLastLogXPAudit={...(window.MediaFlowLastLogXPAudit||{}),...report};
  if(promised!==null&&actual<promised)
    console.error('MediaFlow XP promise has an unresolved shortfall',report);
  return result;
};
App.v544RewardContract=function(){
  const report=window.MediaFlowLastLogXPAudit||null;
  return {version:MF544_VERSION,guaranteedXP:mf544ReceiptSum(S),
    lastAward:report?{...report}:null,preview:mf537ProjectXP()};
};
window.MediaFlowV544=Object.freeze({version:MF544_VERSION,
  audit:App.v544RewardContract,project:()=>mf537ProjectXP()});
MediaFlowRuntime.version=MF544_VERSION;
