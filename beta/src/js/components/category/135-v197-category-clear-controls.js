/* ============================================================
   MediaFlow v197 — Category Clear Controls
   ------------------------------------------------------------
   Adds a Clear action beside Edit/Delete in:
   - Settings → Categories
   - Settings → Dynamic Library category row

   Clear removes Library titles assigned to that category while keeping the
   category itself and consumption History. The existing Library History
   transaction/deleted-snapshot pipeline remains authoritative, so cleared
   titles are recorded and can be restored through Library History.

   No new persistent setting/data field is introduced in v197. Cloud Sync,
   Full Backup and Settings Preset schemas therefore stay unchanged.
   ============================================================ */

function v197CategoryClearInfo(id){
  const sid=String(id||'');
  const cat=(S.categories||[]).find(c=>String(c?.id||'')===sid)||null;
  const items=(S.library||[]).filter(i=>String(i?.categoryId||'')===sid);
  return {cat,items,count:items.length};
}

function v197CategoryClearModalHtml(data){
  const id=String(data?.id||'');
  const info=v197CategoryClearInfo(id);
  const cat=info.cat;
  if(!cat)return `<div class="priority-modal v197-category-clear-modal"><div class="modal-title">Category unavailable</div><div class="hint">This category no longer exists.</div><div class="modal-actions"><button type="button" class="btn" onclick="App.closeModal()">Close</button></div></div>`;

  const count=info.count;
  const noun=count===1?'title':'titles';
  const sample=info.items.slice(0,3).map(item=>`<div class="v197-clear-sample-row"><span>•</span><span>${escapeHtml(cleanTitle(item?.title)||'Untitled')}</span></div>`).join('');
  const more=Math.max(0,count-3);

  return `<div class="priority-modal v197-category-clear-modal">
    <div class="v197-category-clear-head">
      <div class="v197-category-clear-icon">${v144CategoryIconHtml(cat)}</div>
      <div>
        <div class="modal-title">Clear ${escapeHtml(cat.name)}?</div>
        <div class="hint">Delete every Library title currently assigned to this category.</div>
      </div>
    </div>

    <div class="v197-category-clear-count">
      <strong>${count.toLocaleString()}</strong>
      <span>${noun} will be removed from your Library</span>
    </div>

    ${sample?`<div class="v197-category-clear-samples">${sample}${more?`<div class="v197-clear-more">+ ${more.toLocaleString()} more</div>`:''}</div>`:''}

    <div class="v197-category-clear-warning">
      <b>The category itself will stay.</b>
      <span>Consumption History and Statistics stay intact. MediaFlow records the removed titles in Library History, where supported deletion snapshots can be restored later.</span>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="App.v197ConfirmCategoryClear('${escapeHtml(id)}',this)">Clear ${count.toLocaleString()} ${noun}</button>
    </div>
  </div>`;
}

function v197OpenCategoryClear(id){
  const info=v197CategoryClearInfo(id);
  if(!info.cat){showToast('That category no longer exists.');return;}
  if(!info.count){showToast(`${info.cat.name} is already empty`);return;}
  S.modal={type:'categoryClear',data:{id:String(id)}};
  render();
}

const v197ClearCategoryBase=App.clearCategoryLibrary;
async function v197ConfirmCategoryClear(id,button){
  if(button?.dataset?.working==='1')return;
  if(button){button.dataset.working='1';button.disabled=true;}

  const info=v197CategoryClearInfo(id);
  if(!info.cat){S.modal=null;render();showToast('That category no longer exists.');return;}
  if(!info.count){S.modal=null;render();showToast(`${info.cat.name} is already empty`);return;}

  // Close the confirmation before invoking the existing clear transaction.
  // That transaction already records Library History and v191 restore snapshots.
  S.modal=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();

  if(typeof v197ClearCategoryBase==='function'){
    v197ClearCategoryBase.call(App,String(id));
  }else{
    mfClearCategory(String(id));
  }
}

// Existing Category Maintenance buttons now receive the same designed
// confirmation instead of clearing immediately.
App.clearCategoryLibrary=function(id){v197OpenCategoryClear(id);};
Object.assign(App,{v197OpenCategoryClear,v197ConfirmCategoryClear});

/* New modal type, without disturbing any of MediaFlow's existing modal chain. */
const v197RenderModalBase=renderModal;
renderModal=function(){
  if(S.modal?.type!=='categoryClear')return v197RenderModalBase.apply(this,arguments);
  let el=document.getElementById('modal-root');
  if(el)el.remove();
  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v197CategoryClearModalHtml(S.modal.data)}</div></div>`;
  document.body.appendChild(wrap);
};

/* Category Settings: place Clear directly between Edit and Delete. */
const v197CategoryRowsHtmlBase=v171CategoryRowsHtml;
v171CategoryRowsHtml=function(){
  let h=v197CategoryRowsHtmlBase.apply(this,arguments);
  h=h.replace(
    /(<button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App\.openCategoryModal\('([^']+)'\)">Edit<\/button>)\s*(<button class="btn btn-sm btn-danger cat-delete-btn" onclick="App\.deleteCategory\('\2'\)">Delete<\/button>)/g,
    `$1<button type="button" class="btn btn-sm v197-clear-btn cat-clear-btn" onclick="App.v197OpenCategoryClear('$2')">Clear</button>$3`
  );
  return h;
};

/* Dynamic Library category rows: same Edit → Clear → Delete action cluster. */
const v197DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  let h=v197DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  h=h.replace(
    /(<button type="button" class="btn btn-sm btn-ghost" onclick="App\.openCategoryModal\('([^']+)'\)">Edit<\/button>)\s*(<button type="button" class="btn btn-sm btn-danger" onclick="App\.deleteCategory\('\2'\)">Delete<\/button>)/g,
    `$1<button type="button" class="btn btn-sm v197-clear-btn" onclick="App.v197OpenCategoryClear('$2')">Clear</button>$3`
  );
  h=h.replace(
    'show/hide the category, or edit/delete it directly.',
    'show/hide the category, or edit/clear/delete it directly.'
  );
  return h;
};


