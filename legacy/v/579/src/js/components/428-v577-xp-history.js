/* MediaFlow v577 — XP History adds up to your total XP.
 *
 * Adding a title and completing one earn XP from the level engine's Library
 * counts (v150: every title × "Library addition XP", every completed title ×
 * "Completion XP"), which XP History never listed. Now each title has its row:
 * "Library · added title" on the day it was added and "Title completed" on the
 * day it was completed (undated when the title doesn't know). The completion
 * streak bonus gets a row too, and anything else the engine counts that has
 * no row of its own is shown as one "Other XP" row, so the list always sums
 * to the account's XP. The MediaFlow app's XP History does the same (9.0.0.577).
 */
function mf577XpRows(library,metrics){
  const l=levelingSettings(),out=[];
  if(l.enabled===false)return out;
  const add=Math.max(0,Math.round(Number(l.libraryAdditionXP)||0)),done=Math.max(0,Math.round(Number(l.completionXP)||0));
  for(const item of Array.isArray(library)?library:[]){
    if(!item||!item.id)continue;
    const title=cleanTitle(item.title||'');
    if(add>0){
      const at=Number(item.createdAt)||Number(item.addedAt)||0;
      out.push({id:'library:'+item.id,kind:'libraryAddition',source:'Library · added title',title,subjectId:String(item.id),xp:add,baseXP:add,multiplier:1,timestamp:at>0?at:0,legacy:false});
    }
    if(done>0&&v120IsCompleted(item)){
      const at=Number(item.completedAt)||0;
      out.push({id:'completed:'+item.id,kind:'titleCompletion',source:'Title completed',title,subjectId:String(item.id),xp:done,baseXP:done,multiplier:1,timestamp:at>0?at:0,legacy:false});
    }
  }
  const streak=Math.max(0,Math.round(Number(metrics?.loggedCompletionStreakBonusXP)||0));
  if(streak)out.push({id:'completion-streak',kind:'titleCompletion',source:'Completion streak bonus',details:'Streak multiplier on log completion bonuses',xp:streak,baseXP:null,multiplier:null,timestamp:0,legacy:false});
  return out;
}
const mf577XpHistoryBase=v348HistoryEntries;
v348HistoryEntries=function(ledger=S.xpLedger,sessions=S.sessions,library=S.library){
  const out=mf577XpHistoryBase.call(this,ledger,sessions,library);
  const live=ledger===S.xpLedger&&sessions===S.sessions&&library===S.library;
  let metrics=null;
  try{metrics=live?v150EnsureLiveXPCache():v150ComputeStateMetrics({sessions,library,xpLedger:ledger});}catch(_){metrics=null;}
  out.push(...mf577XpRows(library,metrics));
  if(metrics&&Number.isFinite(Number(metrics.totalXP))){
    const sum=out.reduce((n,r)=>n+(Number(r.xp)||0),0);
    const rest=Math.round(Number(metrics.totalXP)-sum);
    if(rest>0)out.push({id:'other-xp',kind:'other',source:'Other XP',details:'XP the level engine counts without a dated record of its own',xp:rest,baseXP:null,multiplier:null,timestamp:0,legacy:true});
  }
  return out.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)||String(a.id).localeCompare(String(b.id)));
};
if(typeof v348SourceLabel==='function'){
  const mf577LabelBase=v348SourceLabel;
  v348SourceLabel=function(kind){
    if(kind==='libraryAddition')return 'Library · added title';
    if(kind==='titleCompletion')return 'Title completed';
    if(kind==='other')return 'Other XP';
    return mf577LabelBase.apply(this,arguments);
  };
}
window.MediaFlowV577Xp=Object.freeze({rows:mf577XpRows});
