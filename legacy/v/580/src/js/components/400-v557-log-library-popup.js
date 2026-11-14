/* MediaFlow v557 — "Add to Logging" opens only Browse Library.
 *
 * The popup is a quick way to add titles to the current Logging draft from any
 * page: search, filters, sorting, Select Visible / Add Selected and per-title
 * Add, nothing else. Quantities, XP, notes and saving stay in the Logging
 * workspace on the Dashboard ("Open Logging").
 *
 * The full Logging form is still rendered inside the popup, only hidden apart
 * from Browse Library, so every existing handler (which looks elements up by
 * id) keeps working exactly as before and the draft is shared with the
 * Dashboard.
 */
const MF557_VERSION=557;
const MF557_ICON={
  library:MF555_SVG('<path d="M4 5h4v14H4zM10 5h4v14h-4z"/><path d="m16 6 3.6-1 2.4 13.5-3.6 1z"/>'),
  open:MF555_SVG('<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')
};
function mf557Added(){return Array.isArray(S.logDraft?.entries)?S.logDraft.entries.length:0;}
function mf557HeadHtml(cat){
  const n=mf557Added();
  return '<div class="mf557-head-copy"><span class="mf557-head-icon" aria-hidden="true">'+MF557_ICON.library+'</span><div>'+
    '<strong id="mf555-log-title">Add to Logging</strong>'+
    '<small><span class="mf557-added" data-mf557-added>'+n.toLocaleString()+' title'+(n===1?'':'s')+' added</span> · '+escapeHtml(cat?.name||'Logging')+'</small></div></div>'+
    '<div class="mf557-head-actions">'+
      '<button type="button" class="btn btn-sm mf557-open-logging" onclick="App.mf557OpenLogging()" title="Open the Logging workspace on the Dashboard">'+MF557_ICON.open+'<span>Open Logging</span></button>'+
      '<button type="button" class="btn btn-sm v555-icon-btn" onclick="App.mf555CloseLogPopup()" aria-label="Close (added titles are kept)" title="Close (added titles are kept)">'+MF555_ICON.close+'</button>'+
    '</div>';
}
// Show only Browse Library: hide every sibling along the path from the
// library section up to the popup body (hidden, not removed).
function mf557LibraryOnly(pop){
  const body=pop.querySelector('.mf555-log-body');
  const lib=body?.querySelector('details.v238-log-library');
  if(!lib)return false;
  pop.classList.add('mf557-library-only');
  lib.open=true;
  for(let el=lib;el&&el!==body;el=el.parentElement){
    if(el!==lib)el.classList.add('mf557-path');
    for(const sib of el.parentElement?.children||[])if(sib!==el)sib.classList.add('mf557-hidden');
  }
  const summary=lib.querySelector(':scope > summary');
  if(summary){summary.setAttribute('tabindex','-1');summary.setAttribute('aria-hidden','true');}
  return true;
}
function mf557Decorate(){
  const pop=mf555LogPopupEl();
  if(!pop)return;
  const t=S.currentTask,cat=t?getCategory(t.categoryId):null;
  const head=pop.querySelector('.mf555-log-head');
  if(head&&!head.dataset.mf557){head.dataset.mf557='1';head.innerHTML=mf557HeadHtml(cat);}
  else mf557RefreshCount();
  mf557LibraryOnly(pop);
}
function mf557RefreshCount(){
  const el=document.querySelector('#mf555-log-popup [data-mf557-added]');
  if(!el)return;
  const n=mf557Added(),text=n.toLocaleString()+' title'+(n===1?'':'s')+' added';
  if(el.textContent!==text)el.textContent=text;
}
// Browse Library is always open while the popup is shown.
const mf557PaintBase=mf555PaintLogPopup;
mf555PaintLogPopup=function(){
  if(MF555UI.logPopup.open)V238_LOG_LIBRARY_OPEN=true;
  const out=mf557PaintBase.apply(this,arguments);
  mf557Decorate();
  if(MF555UI.logPopup.open)mf557Watch();
  return out;
};
// The library section cannot be collapsed inside the popup.
document.addEventListener('click',e=>{
  const summary=e.target?.closest?.('#mf555-log-popup details.v238-log-library > summary');
  if(summary)e.preventDefault();
},true);
// Adding a title updates the draft without always repainting: keep the count live.
const mf557Observer=new MutationObserver(()=>{if(MF555UI.logPopup.open)mf557RefreshCount();});
function mf557Watch(){
  const pop=mf555LogPopupEl();
  mf557Observer.disconnect();
  if(pop)mf557Observer.observe(pop.querySelector('.mf555-log-body')||pop,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed']});
}
const mf557OpenBase=App.mf555OpenLogPopup;
App.mf555OpenLogPopup=function(){
  V238_LOG_LIBRARY_OPEN=true;
  const out=mf557OpenBase.apply(this,arguments);
  if(!MF555UI.logPopup.open)return out;
  mf555PaintLogPopup();
  requestAnimationFrame(()=>{
    try{renderLogSuggestions();}catch(_){}
    mf557Decorate();
    const search=mf555LogPopupEl()?.querySelector('details.v238-log-library #entry-title,details.v238-log-library input[type="search"],details.v238-log-library input[type="text"]');
    search?.focus?.({preventScroll:true});
  });
  return out;
};
const mf557CloseBase=App.mf555CloseLogPopup;
App.mf555CloseLogPopup=function(){
  mf557Observer.disconnect();
  return mf557CloseBase.apply(this,arguments);
};
// Close the popup and go to the full Logging workspace (same draft).
App.mf557OpenLogging=function(){
  App.mf555CloseLogPopup();
  if(S.view!=='dashboard'){S.view='dashboard';render();}
  requestAnimationFrame(()=>{
    const ws=document.querySelector('#app .log-form, #mf419-workspace');
    ws?.scrollIntoView?.({behavior:'smooth',block:'start'});
  });
};
window.MediaFlowV557=Object.freeze({version:MF557_VERSION,added:mf557Added,
  libraryOnly:()=>!!document.querySelector('#mf555-log-popup.mf557-library-only')});
MediaFlowRuntime.version=MF557_VERSION;
