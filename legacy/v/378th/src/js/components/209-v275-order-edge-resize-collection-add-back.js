/* ============================================================
   MediaFlow v275 — Personal Order edge resizing + Collections fixes
   ------------------------------------------------------------
   - Removes the visible Personal Order width-slider panel.
   - Adds direct cursor/touch edge resizing for Add Titles and ordered
     category cards, preserving the existing saved v274 width values.
   - Fixes the Collections Add Titles modal sizing / clipping path.
   - Adds a dedicated Back to Collections control above collection detail.
   ============================================================ */
const V275_RUNTIME_VERSION=275;

/* ---------- Personal Order: direct edge resizing ------------------- */
const V275_ORDER_RESIZE={active:null,hover:null};
function v275OrderSettings(){try{return v274EnsureSettings(S.settings||DEFAULT_SETTINGS);}catch(_){return S.settings?.v274Collections||{};}}
function v275DesktopResizeEnabled(){return window.matchMedia?.('(min-width:981px)')?.matches!==false;}
function v275Clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function v275ApplyOrderWidth(kind,value,persist=false){
  const s=v275OrderSettings();
  if(kind==='side')s.orderPanelWidth=Math.round(v275Clamp(Number(value)||370,280,620));
  else if(kind==='category')s.orderCategoryWidth=Math.round(v275Clamp(Number(value)||760,420,1200));
  else return;
  try{v274ApplyOrderLayoutVars();}catch(_){
    document.documentElement.style.setProperty('--mf274-order-side-width',`${s.orderPanelWidth||370}px`);
    document.documentElement.style.setProperty('--mf274-order-category-width',`${s.orderCategoryWidth||760}px`);
  }
  if(persist){s.modifiedAt=Date.now();try{persistSettings();}catch(_){ }}
}
function v275ClearResizeHover(){
  document.querySelectorAll('.mf275-resize-edge-hover').forEach(el=>el.classList.remove('mf275-resize-edge-hover'));
  V275_ORDER_RESIZE.hover=null;
  if(!V275_ORDER_RESIZE.active)document.documentElement.classList.remove('mf275-resizing-order');
}
function v275ResizeEdgeAt(event){
  if(String(S.view||'')!=='order'||!v275DesktopResizeEnabled())return null;
  const x=Number(event.clientX);
  const side=event.target?.closest?.('.v138-order-side');
  if(side){const r=side.getBoundingClientRect();if(Math.abs(x-r.left)<=10)return {kind:'side',el:side,rect:r};}
  const card=event.target?.closest?.('.v138-category-card');
  if(card){const r=card.getBoundingClientRect();if(Math.abs(x-r.right)<=10)return {kind:'category',el:card,rect:r};}
  return null;
}
function v275OrderPointerMove(event){
  const a=V275_ORDER_RESIZE.active;
  if(a){
    if(event.pointerId!==a.pointerId)return;
    if(a.kind==='side'){
      const grid=document.querySelector('.v138-order-grid');if(!grid)return;
      const r=grid.getBoundingClientRect();
      const max=Math.min(620,Math.max(280,r.width-360));
      v275ApplyOrderWidth('side',v275Clamp(r.right-event.clientX,280,max));
    }else{
      const main=document.querySelector('.v138-order-main');if(!main)return;
      const mr=main.getBoundingClientRect();
      const width=v275Clamp(event.clientX-a.left,420,Math.min(1200,Math.max(420,mr.width)));
      v275ApplyOrderWidth('category',width);
    }
    event.preventDefault();
    return;
  }
  v275ClearResizeHover();
  const edge=v275ResizeEdgeAt(event);if(!edge)return;
  edge.el.classList.add('mf275-resize-edge-hover');V275_ORDER_RESIZE.hover=edge;
}
function v275OrderPointerDown(event){
  if(event.button!=null&&event.button!==0)return;
  const edge=v275ResizeEdgeAt(event);if(!edge)return;
  V275_ORDER_RESIZE.active={kind:edge.kind,el:edge.el,pointerId:event.pointerId,left:edge.rect.left};
  edge.el.classList.add('mf275-resize-edge-hover');document.documentElement.classList.add('mf275-resizing-order');
  try{edge.el.setPointerCapture?.(event.pointerId);}catch(_){ }
  event.preventDefault();
}
function v275OrderPointerUp(event){
  const a=V275_ORDER_RESIZE.active;if(!a||event.pointerId!==a.pointerId)return;
  try{a.el.releasePointerCapture?.(event.pointerId);}catch(_){ }
  V275_ORDER_RESIZE.active=null;
  v275ApplyOrderWidth(a.kind,a.kind==='side'?v275OrderSettings().orderPanelWidth:v275OrderSettings().orderCategoryWidth,true);
  v275ClearResizeHover();
}
function v275InstallOrderEdgeResize(){
  if(document.documentElement.dataset.mf275OrderResize==='1')return;
  document.documentElement.dataset.mf275OrderResize='1';
  document.addEventListener('pointermove',v275OrderPointerMove,{passive:false});
  document.addEventListener('pointerdown',v275OrderPointerDown,{passive:false});
  document.addEventListener('pointerup',v275OrderPointerUp,{passive:true});
  document.addEventListener('pointercancel',v275OrderPointerUp,{passive:true});
  window.addEventListener('blur',()=>{if(V275_ORDER_RESIZE.active){const a=V275_ORDER_RESIZE.active;V275_ORDER_RESIZE.active=null;v275ApplyOrderWidth(a.kind,a.kind==='side'?v275OrderSettings().orderPanelWidth:v275OrderSettings().orderCategoryWidth,true);}v275ClearResizeHover();});
}

// v274 inserted a visible pair of range sliders. v275 keeps the persisted width
// values but removes that control surface: the panels themselves are the handles.
const v275RenderOrderBase=renderOrder;
renderOrder=function(){
  let html=v275RenderOrderBase.apply(this,arguments);
  try{const controls=v274OrderLayoutControlsHtml();if(controls)html=html.replace(controls,'');}catch(_){ }
  return html;
};
MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(()=>{v275InstallOrderEdgeResize();try{v274ApplyOrderLayoutVars();}catch(_){ }}));

/* ---------- Collections: clearer return navigation ----------------- */
const v275CollectionDetailBase=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){
  let html=v275CollectionDetailBase.apply(this,arguments);
  html=html.replace(/<button class="btn btn-sm btn-ghost" onclick="App\.v274BackToCollections\(\)">← Collections<\/button>/,'');
  if(!html.includes('mf275-collection-back'))html=`<div class="mf275-collection-back"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274BackToCollections()" aria-label="Back to Collections">← Back to Collections</button></div>${html}`;
  return html;
};

/* ---------- Collections Add Titles reliability -------------------- */
// Keep refresh bound to the collection that opened the modal instead of relying
// on a later UI state transition. This also makes the popup resilient to rerenders.
let V275_ADD_COLLECTION_ID='';
const v275OpenAddTitlesBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){V275_ADD_COLLECTION_ID=String(id||'');return v275OpenAddTitlesBase.apply(this,arguments);};
const v275RefreshAddModalBase=v274RefreshAddModal;
v274RefreshAddModal=function(){
  const id=V275_ADD_COLLECTION_ID||String(V274_UI.activeId||'');
  const c=v274CollectionById(id);const body=document.getElementById('mf274-add-body');
  if(c&&body)body.innerHTML=v274AddModalBody(c);
  const b=document.getElementById('mf274-add-confirm');if(b)b.disabled=!v274AddState().picks.size;
  if(!c)return v275RefreshAddModalBase.apply(this,arguments);
};
const v275CloseOverlayBase=v274CloseOverlay;
v274CloseOverlay=function(id){const out=v275CloseOverlayBase.apply(this,arguments);if(String(id)==='mf274-add-titles')V275_ADD_COLLECTION_ID='';return out;};

/* ---------- v275 release audit ------------------------------------ */
function v275AuditState(){
  let base={};try{base=v274AuditState()||{};}catch(_){ }
  const s=v275OrderSettings();
  return Object.assign({},base,{version:275,pwaRelease:275,orderEdgeResize:true,orderSliderPanelRemoved:true,collectionAddModalFixed:true,collectionBackButton:true,orderPanelWidth:Number(s.orderPanelWidth)||370,orderCategoryWidth:Number(s.orderCategoryWidth)||760});
}
Object.assign(App,{v274OpenAddTitles,v274CloseOverlay,v275AuditState});
window.MediaFlowV275={version:275,focus:'Personal Order edge resizing and Collections Add Titles/navigation fixes'};
MediaFlowRuntime.version=V275_RUNTIME_VERSION;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>v275InstallOrderEdgeResize(),{once:true});else v275InstallOrderEdgeResize();
