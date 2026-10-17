/* MediaFlow v458 — confirmation layering, metadata bulk selection, early cover commits.
 * Existing safe writers, queued jobs, metadata verification and provider locks
 * remain authoritative. Only UX/readiness and selection state change here.
 */
const MF458_VERSION=458;
function mf458SelectableMetadata(q){
 const proposals=q?.metadata?.preview?.proposals;
 return Array.isArray(proposals)?proposals.filter(p=>
  p&&!p.protected&&!p.hasOriginal&&!p.same&&Array.isArray(p.options)&&p.options.length>0):[];
}
function mf458CanConfirmQuick(q){
 if(!q||q.closed||q.applying||['pausing','connecting','error'].includes(q.stage)||q.metaLoading)return false;
 // Cover discovery is asynchronous and must NOT block committing an already
 // validated/selected cover. Combined mode still waits for ALL metadata sources.
 const cover=q.kind!=='metadata'&&Number.isInteger(q.coverIndex)&&q.coverIndex>=0&&
  !!q.covers?.[q.coverIndex]&&/^https:\/\//i.test(String(q.covers[q.coverIndex].url||''));
 const metadata=q.kind!=='cover'&&mf458SelectableMetadata(q).some(p=>p.selected===true);
 return Boolean(cover||metadata);
}
function mf458SelectMetadataAll(on){
 const q=MF453Quick.current;
 if(!q||q.closed||q.applying||q.metaLoading||q.kind==='cover')return;
 const eligible=mf458SelectableMetadata(q);
 for(const p of eligible)p.selected=Boolean(on);
 mf453PaintQuick();
}
App.mf458SelectMetadataAll=mf458SelectMetadataAll;

const mf458OriginalQuickView=mf454QuickView;
mf454QuickView=function(example=null){
 const q=example||MF453Quick.current;
 const html=mf458OriginalQuickView.apply(this,arguments);
 if(!html||!q||q.kind==='cover'||q.metaLoading||!q.metadata?.preview)return html;
 const eligible=mf458SelectableMetadata(q),selected=eligible.filter(p=>p.selected).length;
 const wrapper=document.createElement('div');
 wrapper.innerHTML=html;
 const section=wrapper.querySelector('.mf454-results-panel[aria-label="Metadata alternatives"]');
 const head=section?.querySelector('.mf454-results-head');
 if(!head)return html;
 const controls='<div class="mf458-metadata-tools" role="group" aria-label="Select eligible metadata suggestions">'+
  '<div class="mf458-metadata-count" role="status">'+selected+' / '+eligible.length+' eligible suggestions selected</div>'+
  '<div class="mf458-metadata-buttons">'+
  '<button type="button" class="btn btn-ghost" data-v225-iconified="1" onclick="App.mf458SelectMetadataAll(true)"'+
   ((!eligible.length||q.applying||selected===eligible.length)?' disabled':'')+'>'+
   mf425Icon('check',15)+' Select All</button>'+
  '<button type="button" class="btn btn-ghost" data-v225-iconified="1" onclick="App.mf458SelectMetadataAll(false)"'+
   ((!eligible.length||q.applying||!selected)?' disabled':'')+'>'+
   mf425Icon('x',15)+' Deselect All</button></div></div>';
 head.insertAdjacentHTML('afterend',controls);
 return wrapper.innerHTML;
};

/* Every streamed cover candidate currently redraws the entire inner dialog.
 * Keep the user's position while metadata suggestions and covers are updated.
 */
const mf458OriginalQuickPaint=mf453PaintQuick;
mf453PaintQuick=function(){
 const root=mf453QuickRoot(),content=root?.querySelector('[data-mf453-quick-content]');
 const currentScroll=content?.scrollTop||0;
 const meta=content?.querySelector('.mf454-metadata-list'),covers=content?.querySelector('.mf456-cover-gallery,.mf454-cover-gallery');
 const metadataScroll=meta?.scrollTop||0,coverScroll=covers?.scrollTop||0;
 const result=mf458OriginalQuickPaint.apply(this,arguments);
 const next=root?.querySelector('[data-mf453-quick-content]');
 if(next){next.scrollTop=currentScroll;
  const list=next.querySelector('.mf454-metadata-list'),gallery=next.querySelector('.mf456-cover-gallery,.mf454-cover-gallery');
  if(list)list.scrollTop=metadataScroll;
  if(gallery)gallery.scrollTop=coverScroll;
 }
 return result;
};

/* The confirmation is created synchronously inside mf444Confirm. Tag only the
 * newly opened dialog; do not mutate other pending recovery confirmations.
 */
const mf458OriginalConfirm=mf444Confirm;
mf444Confirm=function(title,detail,action='Continue',destructive=false,count=0,kind='metadata'){
 const result=mf458OriginalConfirm.apply(this,arguments);
 const root=document.getElementById('mf444-confirm');
 const label=root?.querySelector('#mf444-title')?.textContent;
 if(root&&String(label||'')===String(title||'')){
  root.classList.add('mf458-confirm');
  if(kind==='both'||/Cover\s*\+\s*Metadata/i.test(String(title))){
   const tag=root.querySelector('.mf444-heading small');
   if(tag)tag.textContent='COVER + METADATA RECOVERY';
   const symbol=root.querySelector('.mf444-symbol');
   if(symbol)symbol.innerHTML=mf425Icon('layers',24);
  }
  const approve=root.querySelector('[data-mf444-approve]');
  if(approve){approve.setAttribute('aria-label',String(action));approve.disabled=false;}
 }
 return result;
};
window.MediaFlowV458=Object.freeze({version:458,eligible:mf458SelectableMetadata,canConfirm:mf458CanConfirmQuick,
 selectMetadataAll:mf458SelectMetadataAll,confirm:mf444Confirm,quickHtml:mf454QuickView});
