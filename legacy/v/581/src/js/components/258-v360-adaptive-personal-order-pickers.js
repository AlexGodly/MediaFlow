/* MediaFlow v360 — responsive density and content-aware Personal Order dialogs.
 * Extend v359 presentation only; leave queue/Collection/XP/cloud mutations to
 * their original canonical handlers. */
const V360_RELEASE=360;

/* Short Collection result sets should never reserve an entire mobile viewport.
 * Keep the large-list layout for substantial results so 10–500 per-page choices
 * still scroll inside the popup instead of expanding the document. */
function v360CollectionDialogDensity(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-collection-sheet');
  if(!sheet)return;
  const panel=sheet.querySelector('.mf359-collection-results-panel');
  if(!panel)return;
  let count=0;
  try{count=v359CollectionPageData().shown.length;}catch(_){count=panel.querySelectorAll('.mf287-picker-row').length;}
  const compact=count<=4;
  sheet.classList.toggle('mf360-collection-compact',compact);
  sheet.classList.toggle('mf360-collection-many',!compact);
  sheet.dataset.mf360Results=String(count);
  const results=panel.querySelector('#mf287-collection-results');
  if(results)results.setAttribute('aria-label',`Available Collections, ${count} on this page`);
}

/* The picker refresh changes the result HTML and footer in place. Recompute
 * height only after the underlying canonical update has completed. */
const v360CollectionRefreshBase=v287RefreshCollectionPicker;
v287RefreshCollectionPicker=function(){
  const result=v360CollectionRefreshBase.apply(this,arguments);
  v360CollectionDialogDensity();
  return result;
};

const v360OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v360OpenSheetBase.apply(this,arguments);
  if(kind==='collection')v360CollectionDialogDensity();
  return result;
};

/* <details> expansion may alter available height by hundreds of pixels. Stay
 * content-sized when the results are short; the modal body itself scrolls if
 * expanded filters make its contents taller than the viewport. */
document.addEventListener('toggle',event=>{
  if(!event.target?.matches?.('.mf359-collection-sheet .mf358-collection-filters'))return;
  v360CollectionDialogDensity();
},true);

MediaFlowRuntime.version=V360_RELEASE;
window.MediaFlowV360={version:360,features:[
  'Cover tiles follow configured cover size without stretching to fill columns',
  'Responsive Covers/Covers+Titles gallery density',
  'Compact Add Titles controls and protected pager/footer space',
  'Content-sized Add Collections dialog for a few results',
  'Collections count and pager stay adjacent to actual result cards',
  'Original v359 independent pagination and persisted picker settings retained'
]};
