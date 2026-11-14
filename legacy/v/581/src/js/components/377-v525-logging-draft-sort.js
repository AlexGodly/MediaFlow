/* MediaFlow v525 — Logging draft recency integration.
 * Only affects the existing "Arrange your session" workspace. Does not
 * touch the Library picker, submitted History, XP, or Personal Order.
 */
const V525_LOGGING_RELEASE=525;
const v525QuickProgressBase=App.v179SetLogEntryEnd;
if(typeof v525QuickProgressBase==='function'){
  App.v179SetLogEntryEnd=function(index,value){
    const entry=S.logDraft?.v369Interface==='quick'?S.logDraft?.entries?.[Number(index)]:null;
    const before=entry?Number(entry.v179EndProgress):null;
    const result=v525QuickProgressBase.apply(this,arguments);
    if(entry && S.logDraft?.entries?.[Number(index)]===entry &&
        Number(entry.v179EndProgress)!==before){
      entry.v369UpdatedAt=Date.now();
      v369Touch();
    }
    return result;
  };
}
// The v373 sorter uses the authoritative draft entry indexes. Re-apply its
// presentation order after draft changes, without regenerating draft units,
// resetting focus, mutating Library data, or scrolling to the top.
const v525TouchBase=v369Touch;
let v525OrderFrame=0;
v369Touch=function(){
  const result=v525TouchBase.apply(this,arguments);
  if(S.logDraft?.v373Ordering?.sort==='draftUpdated'&&
      S.logging===true && !v525OrderFrame && typeof requestAnimationFrame==='function'){
    v525OrderFrame=requestAnimationFrame(()=>{
      v525OrderFrame=0;
      if(S.logDraft?.v373Ordering?.sort==='draftUpdated'&&S.logging===true)
        v373LiveUpdate();
    });
  }
  return result;
};
window.MediaFlowV525=Object.freeze({
  version:V525_LOGGING_RELEASE,
  scope:'Logging / Arrange your session only',
  defaultSort:'logAdded',
  draftUpdatedSort:'draftUpdated',
  inspect:()=>({sort:v373OrderState().sort,dir:v373OrderState().dir,
    options:V373_SORTS.map(x=>x[0]),pickerOptions:V373_PICKER_SORTS.map(x=>x[0])})
});
