/* MediaFlow v552 — theme-aware Delete Collection confirmation.
 * Release validation trigger: custom confirmation replaces native browser confirm.
 * Replaces only the collection deletion confirmation; deletion and tombstone
 * semantics remain identical to v274. No native browser confirmation dialogs.
 */
function mf552CloseDeleteDialog(){
  const overlay=document.getElementById('mf552-collection-delete-overlay');
  if(!overlay)return;
  overlay.remove();
  document.removeEventListener('keydown',mf552DeleteKeyHandler,true);
}
function mf552DeleteKeyHandler(event){
  if(event.key==='Escape'){
    event.preventDefault();
    event.stopPropagation();
    mf552CloseDeleteDialog();
  }
}
function v274DeleteCollection(id){
  const c=v274CollectionById(id);
  if(!c)return;
  mf552CloseDeleteDialog();
  const overlay=document.createElement('div');
  overlay.id='mf552-collection-delete-overlay';
  overlay.className='mf552-delete-overlay';
  overlay.setAttribute('role','presentation');
  overlay.innerHTML=`
    <section class="mf552-delete-dialog" role="alertdialog" aria-modal="true"
      aria-labelledby="mf552-delete-title" aria-describedby="mf552-delete-description">
      <header class="mf552-delete-header">
        <span class="mf552-delete-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6"/></svg>
        </span>
        <div class="mf552-delete-heading">
          <small>COLLECTION MANAGEMENT</small>
          <h2 id="mf552-delete-title">Delete collection?</h2>
          <p id="mf552-delete-description">You're about to delete <strong class="mf552-delete-name"></strong>.</p>
        </div>
        <button class="mf552-delete-dismiss" type="button" aria-label="Close confirmation">×</button>
      </header>
      <div class="mf552-delete-content">
        <div class="mf552-delete-safe"><span aria-hidden="true">i</span><div><b>Your Library stays safe</b><p>Deleting this collection won't delete titles from your Library or change their progress.</p></div></div>
        <p class="mf552-delete-warning">This collection will be removed from your Collections. This action cannot be undone from this dialog.</p>
      </div>
      <footer class="mf552-delete-actions">
        <button class="btn btn-ghost mf552-delete-cancel" type="button">Cancel</button>
        <button class="btn mf552-delete-confirm" type="button"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6"/></svg>Delete collection</button>
      </footer>
    </section>`;
  overlay.querySelector('.mf552-delete-name').textContent='“'+String(c.title||'Untitled collection')+'”';
  const cancel=()=>mf552CloseDeleteDialog();
  overlay.querySelector('.mf552-delete-dismiss').addEventListener('click',cancel);
  overlay.querySelector('.mf552-delete-cancel').addEventListener('click',cancel);
  overlay.addEventListener('click',event=>{if(event.target===overlay)cancel();});
  const confirmButton=overlay.querySelector('.mf552-delete-confirm');
  confirmButton.addEventListener('click',async()=>{
    if(confirmButton.disabled)return;
    confirmButton.disabled=true;
    confirmButton.textContent='Deleting…';
    try{
      const current=v274CollectionById(id);
      if(!current){mf552CloseDeleteDialog();return;}
      S.collections=S.collections.filter(x=>x.id!==current.id);
      S.collectionTombstones=S.collectionTombstones||[];
      S.collectionTombstones.push({id:current.id,deletedAt:v274Now()});
      await saveState();
      mf552CloseDeleteDialog();
      V274_UI.activeId='';
      v274CloseOverlay('mf274-collection-editor');
      render();
      showToast('Collection deleted');
    }catch(error){
      console.error('MediaFlow v552: collection deletion failed',error);
      confirmButton.disabled=false;
      confirmButton.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6"/></svg> Delete collection';
      showToast('Could not delete collection. Please try again.');
    }
  });
  overlay.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...overlay.querySelectorAll('button:not(:disabled)')];
    if(!controls.length)return;
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  document.body.appendChild(overlay);
  document.addEventListener('keydown',mf552DeleteKeyHandler,true);
  requestAnimationFrame(()=>overlay.querySelector('.mf552-delete-cancel')?.focus({preventScroll:true}));
}
window.MediaFlowV552=Object.freeze({version:552,closeDeleteDialog:mf552CloseDeleteDialog});
MediaFlowRuntime.version=552;
