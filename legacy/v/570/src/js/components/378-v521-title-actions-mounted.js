/* MediaFlow v521 — visibility-proof mount of canonical title actions in live modal and Title Details. */
(function mf521(){
'use strict';
const MARK='mf521';
function esc(value){return escapeHtml(String(value??''));}
function savedOrder(id){return !!window.MediaFlowV520?.isOrdered?.(id);}
function savedCount(id){return Number(window.MediaFlowV520?.membershipCount?.(id))||0;}
function detailId(root){
 const button=root?.querySelector('[onclick*="v181EditFullTitle"],[onclick*="openLibraryModal"]');
 const value=button?.getAttribute('onclick')||'';
 const match=value.match(/(?:v181EditFullTitle|openLibraryModal)\((['"])(.*?)\1/);
 return match?match[2]:'';
}
function controls(id,scope){
 const count=id?savedCount(id):0;
 const on=id?savedOrder(id):false;
 const safe=esc(id);
 const node=document.createElement('section');
 node.className='mf520-title-actions mf521-action-bar';
 node.setAttribute('data-mf520-scope',scope);
 node.setAttribute('data-mf520-id',id);
 node.setAttribute('data-mf521-mounted','1');
 node.setAttribute('aria-label','Title Personal Order and Collections actions');
 node.innerHTML=`<button type="button" class="btn btn-sm mf520-order-btn ${on?'mf520-active':''}" aria-pressed="${on}" onclick="App.mf520ToggleOrder('${safe}')"><span class="mf521-action-icon" aria-hidden="true">${on?'✓':'☷'}</span><span>${on?'Added to Personal Order':'Add to Personal Order'}</span></button>
 <button type="button" class="btn btn-sm mf520-collections-btn ${count?'mf520-active':''}" onclick="App.mf520OpenCollections('${safe}')"><span class="mf521-action-icon" aria-hidden="true">▣</span><span>Add to Collection (${count})</span></button>`;
 return node;
}
function place(root,anchor,id,scope){
 if(!root||!anchor)return false;
 let group=root.querySelector('.mf520-title-actions');
 if(!group)group=controls(id,scope);
 const wasMounted=group.isConnected;
 // Prefer a first-class, immediately visible action group instead of hiding it
 // inside the long metadata editor or below the full Title Details grid.
 if(group.previousElementSibling!==anchor || group.parentElement!==anchor.parentElement)anchor.after(group);
 group.classList.add('mf521-action-bar');
 group.setAttribute('data-mf521-mounted','1');
 const tid=String(id||'');
 group.dataset.mf520Id=tid;
 group.dataset.mf520Scope=scope;
 if(!wasMounted){
  const buttons=group.querySelectorAll('button');
  for(const button of buttons)button.setAttribute('data-mf521-ui','active');
 }
 return true;
}
function mountEditor(){
 const root=document.getElementById('modal-root');
 if(!root||S.modal?.type!=='library'||!root.querySelector('#l-title'))return false;
 const anchor=root.querySelector('.modal-title');
 if(!anchor)return false;
 return place(root,anchor,String(S.modal.data?.id||''),'editor');
}
function mountDetails(){
 const root=document.getElementById('v181-title-details-overlay');
 if(!root)return false;
 const id=detailId(root);
 if(!id)return false;
 const hero=root.querySelector('.v181-title-hero-copy');
 const anchor=hero?.querySelector('h2')||root.querySelector('.v181-title-details-body .v181-detail-section-label');
 if(!anchor)return false;
 return place(root,anchor,id,'details');
}
function mount(){try{mountEditor();mountDetails();}catch(error){console.error('[v521] title actions could not mount',error);}}
let pending=false;
function schedule(){
 if(pending)return;
 pending=true;
 Promise.resolve().then(()=>{pending=false;mount();});
}
function start(){
 if(!document.body){document.addEventListener('DOMContentLoaded',start,{once:true});return;}
 mount();
 const watcher=new MutationObserver(records=>{
  if(records.some(r=>r.addedNodes?.length||r.removedNodes?.length))schedule();
 });
 watcher.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
Object.assign(App,{mf521RefreshTitleActions:mount});
window.MediaFlowV521=Object.freeze({version:521,inspect:()=>({
 editorPresent:!!document.querySelector('#modal-root #l-title'),
 editorActions:!!document.querySelector('#modal-root .mf521-action-bar'),
 detailsPresent:!!document.getElementById('v181-title-details-overlay'),
 detailActions:!!document.querySelector('#v181-title-details-overlay .mf521-action-bar'),
 buttons:Array.from(document.querySelectorAll('.mf521-action-bar button')).map(x=>x.textContent.trim())
})});
})();
