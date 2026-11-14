/* MediaFlow v483 — Unified Recovery category selection scroll continuity.
 * v457 restored only the outer panel/dialog scrollTop. Category checkboxes
 * re-render the nested .mf446-category-grid, which has its OWN overflow and
 * resets to zero. This restores the precise nested viewport and focused row,
 * search results and expanded status filters. Does not change recovery scope,
 * providers, job queues or cloud writes.
 */
const MF483_VERSION=483;
let MF483_REVISION=0;
function mf483ActiveMode(){
 return typeof MF447!=='undefined'&&MF447.active==='both'?'both':MF445.mode;
}
function mf483ScrollNodes(root){
 const pane=root?.querySelector('[data-mf445-panel]');
 if(!pane)return [];
 return [
  ...pane.querySelectorAll('.mf446-category-grid,.mf445-provider-grid,.mf454-category-list,.mf446-statuses>div')
 ].map((element,index)=>({
  index,top:element.scrollTop,left:element.scrollLeft,
  selector:element.classList.contains('mf446-category-grid')?'categories':
   element.classList.contains('mf445-provider-grid')?'providers':
   element.classList.contains('mf454-category-list')?'category-list':'statuses'
 }));
}
function mf483Capture(){
 const root=document.getElementById('mf445-workspace');
 if(!root||!root.isConnected)return null;
 const pane=root.querySelector('[data-mf445-panel]'),dialog=root.querySelector('.mf445-dialog');
 if(!pane)return null;
 const active=document.activeElement;
 const scope=pane.querySelector('.mf446-categories');
 const activeCat=active?.closest?.('.mf446-category');
 const categoryId=activeCat?.querySelector('[data-mf446-category]')?.getAttribute('data-mf446-category')||'';
 const anchor=activeCat?.getBoundingClientRect?.();
 const search=[...pane.querySelectorAll('.mf455-search input[type="search"]')].map(input=>({
  value:input.value,kind:input.closest('.mf446-categories')?'categories':
   input.closest('[data-mf455-kind="metadata"]')?'metadata':'cover'
 }));
 const statuses=[...pane.querySelectorAll('.mf446-category')].map(el=>({
  id:el.querySelector('[data-mf446-category]')?.getAttribute('data-mf446-category')||'',
  open:el.querySelector('.mf446-statuses')?.open===true
 })).filter(x=>x.id);
 return {
  root,mode:mf483ActiveMode(),paneTop:pane.scrollTop,paneLeft:pane.scrollLeft,
  dialogTop:dialog?.scrollTop||0,dialogLeft:dialog?.scrollLeft||0,
  winX:window.scrollX||0,winY:window.scrollY||0,
  grids:mf483ScrollNodes(root),categoryOpen:scope?.open===true,
  statuses,search,
  focusedCategory:categoryId,
  focusedStatus:active?.closest?.('.mf446-statuses')?.querySelector?.('input[type=checkbox]')===active?
   active.value||active.getAttribute('onchange')||'':'',
  activeInScope:!!active?.closest?.('.mf446-scope'),
  anchorTop:anchor?.top??null
 };
}
function mf483Restore(s,focus){
 if(!s||!s.root.isConnected||document.getElementById('mf445-workspace')!==s.root||
    mf483ActiveMode()!==s.mode)return false;
 const pane=s.root.querySelector('[data-mf445-panel]'),dialog=s.root.querySelector('.mf445-dialog');
 if(!pane)return false;
 const scope=pane.querySelector('.mf446-categories');
 if(scope&&s.categoryOpen)scope.open=true;
 const restored=[...pane.querySelectorAll('.mf446-category')];
 const statusMap=new Map(s.statuses.map(row=>[row.id,row.open]));
 for(const entry of restored){
  const id=entry.querySelector('[data-mf446-category]')?.getAttribute('data-mf446-category');
  const details=entry.querySelector('.mf446-statuses');
  if(details&&statusMap.has(id)&&statusMap.get(id))details.open=true;
 }
 // The search input is rebuilt with pane.innerHTML and loses its value/filter.
 // Reapply filtering IN PLACE, without another recovery-panel rerender.
 const searches=[...pane.querySelectorAll('.mf455-search input[type="search"]')];
 for(const original of s.search){
  const input=searches.find(el=>(el.closest('.mf446-categories')?'categories':
    el.closest('[data-mf455-kind="metadata"]')?'metadata':'cover')===original.kind);
  if(!input)continue;
  input.value=original.value;
  if(original.value)App.mf455SearchWorkspace?.(input,original.kind);
 }
 const gridNodes=[...pane.querySelectorAll('.mf446-category-grid,.mf445-provider-grid,.mf454-category-list,.mf446-statuses>div')];
 for(const saved of s.grids){
  const node=gridNodes[saved.index];if(!node)return false;
  node.scrollTop=saved.top;node.scrollLeft=saved.left;
 }
 pane.scrollTop=s.paneTop;pane.scrollLeft=s.paneLeft;
 if(dialog){dialog.scrollTop=s.dialogTop;dialog.scrollLeft=s.dialogLeft;}
 let focused=null;
 if(s.focusedCategory){
  focused=[...pane.querySelectorAll('[data-mf446-category]')].find(el=>
   el.getAttribute('data-mf446-category')===s.focusedCategory)||null;
  if(focused&&s.focusedStatus){
   const parent=focused.closest('.mf446-category');
   const statuses=[...parent.querySelectorAll('.mf446-statuses input[type=checkbox]')];
   focused=statuses.find(el=>el.value===s.focusedStatus||el.getAttribute('onchange')===s.focusedStatus)||focused;
  }
 }
 // Only give focus back immediately after the selection. Delayed restores
 // should never steal focus from a user who has already moved elsewhere.
 if(focus&&focused?.isConnected)try{focused.focus({preventScroll:true});}catch(_){}
 if(s.focusedCategory&&s.anchorTop!=null){
  const row=focused?.closest('.mf446-category');
  const current=row?.getBoundingClientRect?.().top;
  const categoryGrid=scope?.querySelector('.mf446-category-grid');
  if(Number.isFinite(current)&&categoryGrid){
   const difference=current-s.anchorTop;
   if(Math.abs(difference)>1&&Math.abs(difference)<500)
    categoryGrid.scrollTop+=difference;
  }
 }
 // v457 also preserves window scroll, but enforce it here after restoring
 // nested scroll containers and focus to prevent browser scroll anchoring.
 if((window.scrollX||0)!==s.winX||(window.scrollY||0)!==s.winY)
  window.scrollTo(s.winX,s.winY);
 return true;
}
function mf483Preserve(action){
 const snapshot=mf483Capture(),revision=++MF483_REVISION;
 // Keep the existing engine's validation, immediate scope save, and re-render
 // (including combined Cover+Metadata mode and provider preset updates).
 const result=action();
 if(!snapshot)return result;
 mf483Restore(snapshot,true);
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{
  if(revision!==MF483_REVISION)return;
  mf483Restore(snapshot,false);
  requestAnimationFrame(()=>{
   if(revision===MF483_REVISION)mf483Restore(snapshot,false);
  });
 });
 return result;
}
for(const name of ['mf446ToggleCategory','mf446AllCategories','mf446ToggleStatus']){
 const previous=App[name];
 if(typeof previous!=='function')continue;
 App[name]=function(){
  const args=arguments,self=this;
  return mf483Preserve(()=>previous.apply(self,args));
 };
}
window.MediaFlowV483=Object.freeze({
 version:483,capture:mf483Capture,restore:mf483Restore,preserve:mf483Preserve
});
MediaFlowRuntime.version=483;
