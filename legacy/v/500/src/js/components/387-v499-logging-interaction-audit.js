/* MediaFlow v499 — Logging interaction audit.
 * Presentation-only: preserve the v498 cover owner and all existing draft,
 * category, Library, progress, History and cloud synchronization actions.
 * Synchronize accessible selection information after in-place picker changes.
 */
const MF499_VERSION=499;
const MF499_AUDIT={pickerRenders:0,selectionUpdates:0,coverInspections:0,errors:0};
function mf499DecoratePicker(container){
 const rows=container?.querySelectorAll?.('.mf379-picker .log-suggestion[data-mf378-id],.mf378-picker .log-suggestion[data-mf378-id]')||[];
 for(const row of rows){
  const id=String(row.dataset.mf378Id||'');
  const checkbox=row.querySelector('.mf379-integrated-check input[type="checkbox"],.mf378-check input[type="checkbox"]');
  const selected=!!checkbox?.checked||!!V378_LOG_UI.selected?.has(id);
  // Neither class nor checkbox state is changed: v379 retains sole ownership
  // of what is selected and whether it can be added to the draft.
  row.dataset.mf499Selected=selected?'true':'false';
  const artwork=row.querySelector('.mf498-logging-cover');
  if(artwork){
   artwork.dataset.mf499Cover='picker';
   MF499_AUDIT.coverInspections++;
  }
 }
 return rows.length;
}
function mf499SyncPickerSelection(){
 try{
  const root=document.getElementById('log-suggestions');
  if(root)mf499DecoratePicker(root);
  MF499_AUDIT.selectionUpdates++;
 }catch(error){
  MF499_AUDIT.errors++;
  console.warn('[MediaFlow v499] Existing Logging picker controls retained',error);
 }
}
const mf499SuggestionsBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
 const raw=String(mf499SuggestionsBase.apply(this,arguments)||'');
 if(!raw.includes('log-suggestion'))return raw;
 try{
  const host=document.createElement('div');
  host.innerHTML=raw;
  mf499DecoratePicker(host);
  MF499_AUDIT.pickerRenders++;
  return host.innerHTML;
 }catch(error){
  MF499_AUDIT.errors++;
  return raw;
 }
};
// v379 intentionally updates checkboxes and classes without a DOM rebuild.
// Follow those changes instead of re-rendering, which would reset scroll.
for(const action of ['v378Pick','v378SelectVisible','v378DeselectAll']){
 const original=App[action];
 if(typeof original!=='function')continue;
 App[action]=function(){
  const result=original.apply(this,arguments);
  mf499SyncPickerSelection();
  return result;
 };
}
// Dynamic title covers already invoke App.v181OpenTitleDetails via v498. No
// extra click handler is added: nested controls and keyboard input remain safe.
window.MediaFlowV499=Object.freeze({
 version:MF499_VERSION,
 status:()=>({...MF499_AUDIT}),
 sync:mf499SyncPickerSelection
});
MediaFlowRuntime.version=MF499_VERSION;
