/* ============================================================
   MediaFlow v282 — Category editor responsiveness, collection batch mode,
   compact progress polish, sidebar first-load stability and category clear performance
   ============================================================ */
const V282_RUNTIME_VERSION=282;
const V282_COLLECTION_BATCH={active:false,selected:new Set()};

/* ---------- Dynamic Category Row polish --------------------------- */
const v282DynamicLibrarySettingsBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  let h=String(v282DynamicLibrarySettingsBase.apply(this,arguments)||'');
  h=h.replaceAll('class="v181-config-row v186-dynamic-category-row','class="v181-config-row v186-dynamic-category-row mf282-dynamic-category-row');
  h=h.replace(/<div class="v186-dynamic-edit-actions">/g,'<div class="v186-dynamic-edit-actions mf282-dynamic-actions">');
  h=h.replace(/>↑<\/button>/g,' aria-label="Move category up" title="Move up">↑</button>');
  h=h.replace(/>↓<\/button>/g,' aria-label="Move category down" title="Move down">↓</button>');
  return h;
};

/* ---------- Category editor: direct modal open + scrollable shell -- */
const v282CategoryModalHtmlBase=categoryModalHtml;
categoryModalHtml=function(d){
  return `<div class="mf282-category-editor">${v282CategoryModalHtmlBase.apply(this,arguments)}</div>`;
};
function v282CategoryDraft(id){
  return id ? Object.assign({},getCategory(id)) : {name:'',icon:'✨',type:'video',unit:'episodes',target:5,weight:3,minutesPerUnit:20,color:COLOR_CHOICES[0],enabled:true,seasonal:false};
}
function v282OpenCategoryModal(id){
  S.modal={type:'category',data:v282CategoryDraft(id)};
  try{renderModal();}catch(_){render();return;}
  requestAnimationFrame(()=>{const el=document.getElementById('m-name');try{el?.focus({preventScroll:true});}catch(_){el?.focus?.();}});
}
App.openCategoryModal=v282OpenCategoryModal;

/* ---------- First-load sidebar collapse/expand binding ------------ */
function v282BindSidebarImmediately(){
  try{v265ApplySidebarState?.();v266BindBrandToggle?.();}catch(_){ }
  const brand=document.querySelector('.sidebar .brand');
  return !!(brand&&brand.dataset.mf266Bound==='1');
}
function v282InstallSidebarStartupBinding(){
  if(v282BindSidebarImmediately())return;
  const root=document.documentElement||document.body;if(!root)return;
  const observer=new MutationObserver(()=>{if(v282BindSidebarImmediately())observer.disconnect();});
  observer.observe(root,{childList:true,subtree:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(v282BindSidebarImmediately())observer.disconnect();}));
  setTimeout(()=>{v282BindSidebarImmediately();observer.disconnect();},2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v282InstallSidebarStartupBinding,{once:true});else v282InstallSidebarStartupBinding();

/* ---------- Category Clear: instant modal + chunked removal -------- */
function v282OpenCategoryClear(id){
  const info=v197CategoryClearInfo(id);
  if(!info.cat){showToast('That category no longer exists.');return;}
  if(!info.count){showToast(`${info.cat.name} is already empty`);return;}
  S.modal={type:'categoryClear',data:{id:String(id)}};
  try{renderModal();}catch(_){render();}
}
async function v282Yield(){return new Promise(resolve=>setTimeout(resolve,0));}
async function v282ConfirmCategoryClear(id,button){
  if(button?.dataset?.working==='1')return;
  if(button){button.dataset.working='1';button.disabled=true;}
  const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(id||''));
  if(!cat){showToast('That category no longer exists.');return;}
  S.modal=null;document.getElementById('modal-root')?.remove();
  showToast(`Clearing ${cat.name}…`);
  await v282Yield();
  const source=Array.isArray(S.library)?S.library:[],kept=[],removed=[];
  const sid=String(id||'');
  for(let i=0;i<source.length;i+=700){
    const end=Math.min(source.length,i+700);
    for(let j=i;j<end;j++){
      const item=source[j];
      if(String(item?.categoryId||'')===sid)removed.push(item);else kept.push(item);
    }
    if(end<source.length)await v282Yield();
  }
  if(!removed.length){showToast(`${cat.name} is already empty`);render();return;}
  S.library=kept;S.librarySelection={};
  S.activityLog=Array.isArray(S.activityLog)?S.activityLog:[];
  S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:'Clear category',detail:`${cat.name} · ${removed.length} titles`,deletedItems:removed.slice(),restoreVersion:191});
  if(S.activityLog.length>1000)S.activityLog.length=1000;
  try{v53InvalidateLibraryCache?.();}catch(_){ }
  try{normalizeSeasonalLibraryItems?.();}catch(_){ }
  await v282Yield();
  try{await saveState();}catch(_){ }
  render();showToast(`${cat.name} cleared · ${removed.length.toLocaleString()} titles`);
}
App.v197OpenCategoryClear=v282OpenCategoryClear;
App.clearCategoryLibrary=v282OpenCategoryClear;
App.v197ConfirmCategoryClear=v282ConfirmCategoryClear;

/* ---------- Collections default nav position ---------------------- */
const v282NormalizeNavLayoutBase=v161NormalizeNavLayout;
v161NormalizeNavLayout=function(raw){
  const out=v282NormalizeNavLayoutBase.apply(this,arguments);
  if((Number(out.modifiedAt)||0)===0){
    const order=out.order.filter(id=>id!=='collections');
    const lib=order.indexOf('library');order.splice(lib>=0?lib+1:1,0,'collections');out.order=order;
  }
  return out;
};
S.navLayout=v161NormalizeNavLayout(S.navLayout);

/* ---------- Main Collections Batch Mode --------------------------- */
function v282BatchSelectedCount(){return V282_COLLECTION_BATCH.selected.size;}
function v282BatchBarHtml(){
  const n=v282BatchSelectedCount();
  if(!V282_COLLECTION_BATCH.active)return `<div class="mf282-collections-batchbar"><button type="button" class="btn btn-sm" data-v225-icon="select" onclick="App.v282SetCollectionBatchMode(true)">Batch mode</button></div>`;
  return `<div class="mf282-collections-batchbar active"><b>${n.toLocaleString()} selected</b><div class="mf282-batch-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v282SelectVisibleCollections()">Select visible</button><button type="button" class="btn btn-sm btn-ghost" ${n?'':'disabled'} onclick="App.v282ClearCollectionBatchSelection()">Deselect all</button><button type="button" class="btn btn-sm btn-danger" ${n?'':'disabled'} data-v225-icon="delete" onclick="App.v282DeleteSelectedCollections()">Delete selected</button><button type="button" class="btn btn-sm" onclick="App.v282SetCollectionBatchMode(false)">Done</button></div></div>`;
}
function v282SetCollectionBatchMode(on){V282_COLLECTION_BATCH.active=!!on;if(!on)V282_COLLECTION_BATCH.selected.clear();render();}
function v282ToggleCollectionBatchSelection(id,on){const sid=String(id||'');if(on)V282_COLLECTION_BATCH.selected.add(sid);else V282_COLLECTION_BATCH.selected.delete(sid);render();}
function v282SelectVisibleCollections(){for(const c of v274FilteredCollections())V282_COLLECTION_BATCH.selected.add(String(c.id));render();}
function v282ClearCollectionBatchSelection(){V282_COLLECTION_BATCH.selected.clear();render();}
async function v282DeleteSelectedCollections(){
  const ids=[...V282_COLLECTION_BATCH.selected].filter(id=>v274CollectionById(id));if(!ids.length)return;
  const ok=await v279Confirm({title:`Delete ${ids.length.toLocaleString()} collection${ids.length===1?'':'s'}?`,body:'The selected Collections will be deleted. Titles inside them will stay in your MediaFlow Library.',confirmLabel:'Delete collections',danger:true});if(!ok)return;
  const set=new Set(ids),now=Date.now();S.collections=(S.collections||[]).filter(c=>!set.has(String(c?.id||'')));
  S.collectionTombstones=Array.isArray(S.collectionTombstones)?S.collectionTombstones:[];
  for(const id of ids)S.collectionTombstones.push({id,deletedAt:now});
  V282_COLLECTION_BATCH.selected.clear();
  try{await saveState();}catch(_){ }
  render();showToast(`${ids.length.toLocaleString()} collection${ids.length===1?'':'s'} deleted`);
}
const v282CollectionBrowserCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(c,mode){
  const h=v282CollectionBrowserCardBase.apply(this,arguments);if(!V282_COLLECTION_BATCH.active)return h;
  const id=escapeHtml(String(c.id)),checked=V282_COLLECTION_BATCH.selected.has(String(c.id));
  return `<div class="mf282-batch-collection ${checked?'selected':''}" data-mode="${escapeHtml(mode)}"><label class="mf282-batch-checkbox" title="Select collection" onclick="event.stopPropagation()"><input type="checkbox" ${checked?'checked':''} onchange="event.stopPropagation();App.v282ToggleCollectionBatchSelection('${id}',this.checked)"></label>${h}</div>`;
};
const v282CollectionsBrowserHtmlBase=v274CollectionsBrowserHtml;
v274CollectionsBrowserHtml=function(){
  const h=String(v282CollectionsBrowserHtmlBase.apply(this,arguments)||'');
  const marker='<div id="mf276-collections-results"';
  if(h.includes(marker))return h.replace(marker,v282BatchBarHtml()+marker);
  const marker2='<div class="mf274-browser-results';
  return h.includes(marker2)?h.replace(marker2,v282BatchBarHtml()+marker2):h+v282BatchBarHtml();
};

/* ---------- Compact progress final visual ------------------------- */
function v282AuditState(){return {version:282,pwaRelease:282,categoryModalDirect:true,categoryModalScrollable:true,categoryClearChunked:true,sidebarFirstLoadToggle:true,collectionsDefaultBelowLibrary:true,collectionsBatchMode:true,collectionBatchSelected:v282BatchSelectedCount(),compactCollectionProgressPolish:true};}
Object.assign(App,{v282SetCollectionBatchMode,v282ToggleCollectionBatchSelection,v282SelectVisibleCollections,v282ClearCollectionBatchSelection,v282DeleteSelectedCollections,v282AuditState});
window.MediaFlowV282={version:282,focus:'Category responsiveness, non-blocking clear, first-load sidebar, Collections batch mode and compact progress polish'};
MediaFlowRuntime.version=V282_RUNTIME_VERSION;
