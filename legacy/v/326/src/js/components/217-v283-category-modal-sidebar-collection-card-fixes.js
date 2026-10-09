/* ============================================================
   MediaFlow v283 — Category modal lifecycle, first-load sidebar,
   clear-category cancel reliability and Collections card typography
   ============================================================ */
const V283_RUNTIME_VERSION=283;

/* ---------- Modal lifecycle: close directly, never wait on render/cloud ----- */
function v283RemoveModalRoot(){
  const root=document.getElementById('modal-root');
  if(root)root.remove();
  try{document.body.classList.remove('modal-open');}catch(_){ }
}
function v283CloseModal(){
  S.modal=null;
  v283RemoveModalRoot();
}
// Category/clear/delete cancel buttons already call App.closeModal(). Making
// that primitive direct fixes all three without rebuilding the Settings page.
App.closeModal=v283CloseModal;

function v283RefreshAfterCategoryMutation(){
  try{
    if(String(S.view||'')==='settings'&&document.getElementById('view-root')){
      renderView();
      try{v219RunPageEnhancers?.('settings');}catch(_){ }
      try{v265EnhanceSidebar?.();}catch(_){ }
      return;
    }
    render();
  }catch(_){try{render();}catch(__){ }}
}

function v283ReadCategoryForm(id){
  const name=document.getElementById('m-name');
  const iconEl=document.getElementById('m-icon');
  const typeEl=document.getElementById('m-type');
  const unitEl=document.getElementById('m-unit');
  const targetEl=document.getElementById('m-target');
  const weightEl=document.getElementById('m-weight');
  const mpuEl=document.getElementById('m-mpu');
  const seasonalEl=document.getElementById('m-seasonal');
  const colorEl=document.getElementById('m-color');
  const enabledEl=document.getElementById('m-enabled');
  if(!name||!typeEl||!unitEl||!targetEl||!weightEl||!mpuEl||!colorEl||!enabledEl)throw new Error('Category editor fields are unavailable.');

  const iconUrl=typeof v144SafeIconUrl==='function'?v144SafeIconUrl(document.getElementById('m-icon-url')?.value||''):'';
  const icon=iconUrl?'🖼️':(String(iconEl?.value||'').trim()||'✨');
  const rawMissing=String(document.getElementById('m-missing-default-cover')?.value||'').trim();
  const missingDefaultCoverUrl=typeof v200SafeCategoryCoverUrl==='function'?v200SafeCategoryCoverUrl(rawMissing):rawMissing;
  if(rawMissing&&!missingDefaultCoverUrl)throw new Error('Use a valid http:// or https:// Missing default cover URL.');

  let color=String(colorEl.value||COLOR_CHOICES[0]).trim().toUpperCase();
  if(!/^#[0-9A-F]{6}$/.test(color))color=COLOR_CHOICES[0];
  const existing=(S.categories||[]).find(c=>String(c?.id||'')===String(id||''))||null;
  const oldMissing=typeof v200CategoryMissingCoverUrl==='function'?v200CategoryMissingCoverUrl(existing||{}):String(existing?.missingDefaultCoverUrl||'');
  const missingModifiedAt=oldMissing!==missingDefaultCoverUrl?Date.now():(Number(existing?.missingDefaultCoverModifiedAt)||0);

  return {
    id:id||uid(),
    name:name.value.trim()||'Untitled category',
    icon,
    iconUrl:iconUrl||null,
    missingDefaultCoverUrl:missingDefaultCoverUrl||null,
    missingDefaultCoverModifiedAt:missingModifiedAt,
    type:typeEl.value,
    unit:unitEl.value,
    target:Math.max(1,Number(targetEl.value)||1),
    weight:clamp(Number(weightEl.value)||3,1,5),
    minutesPerUnit:Math.max(1,Number(mpuEl.value)||20),
    seasonal:!!seasonalEl?.checked,
    color,
    enabled:!!enabledEl.checked,
    custom:true
  };
}

App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}
  let data;
  try{data=v283ReadCategoryForm(id);}catch(err){
    if(button){delete button.dataset.saving;button.disabled=false;}
    showToast(err?.message||'Could not save that category.');
    return;
  }
  const idx=(S.categories||[]).findIndex(c=>String(c?.id||'')===String(id||''));
  if(idx>=0)S.categories[idx]=Object.assign({},S.categories[idx],data);
  else S.categories.push(data);

  // Remove the modal before any storage/cloud work can block the interaction.
  v283CloseModal();
  v283RefreshAfterCategoryMutation();
  let pending=null;
  try{pending=persistCategories();}catch(err){console.error('Category persistence failed',err);}
  Promise.resolve(pending).then(()=>showToast(`${data.name} saved`)).catch(err=>{
    console.error('Category persistence failed',err);showToast(`${data.name} saved locally; cloud save will retry.`);
  });
};

App.confirmDeleteCategory=function(id,button){
  if(button?.dataset?.deleting==='1')return;
  if(button){button.dataset.deleting='1';button.disabled=true;}
  const sid=String(id||'');
  const cat=(S.categories||[]).find(c=>String(c?.id||'')===sid);
  if(!cat){v283CloseModal();showToast('That category no longer exists.');return;}
  S.categories=(S.categories||[]).filter(c=>String(c?.id||'')!==sid);
  if(Array.isArray(S.categoryOrder))S.categoryOrder=S.categoryOrder.filter(cid=>String(cid)!==sid);
  v283CloseModal();
  v283RefreshAfterCategoryMutation();
  let pending=null;
  try{pending=persistCategories();}catch(err){console.error('Category deletion persistence failed',err);}
  Promise.resolve(pending).then(()=>showToast(`${cat.name} deleted`)).catch(err=>{
    console.error('Category deletion persistence failed',err);showToast(`${cat.name} deleted locally; cloud save will retry.`);
  });
};

/* ---------- Sidebar: delegated first-load control -------------------------- */
function v283UpdateBrandA11y(brand){
  if(!brand)return;
  const collapsed=!!S.settings?.sidebarCollapsed;
  brand.setAttribute('aria-label',collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu');
  brand.title=collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu';
}
function v283InstallSidebarDelegation(){
  if(window.__mf283SidebarDelegationInstalled)return;
  window.__mf283SidebarDelegationInstalled=true;
  document.addEventListener('click',event=>{
    const brand=event.target?.closest?.('.sidebar .brand');
    if(!brand)return;
    if(event.target?.closest?.('button,a,input,select,textarea,label'))return;
    // Own this interaction in capture phase so an older per-element listener
    // cannot double-toggle the sidebar after later page renders.
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    App.v265ToggleSidebar();v283UpdateBrandA11y(brand);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const brand=event.target?.closest?.('.sidebar .brand');if(!brand)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    App.v265ToggleSidebar();v283UpdateBrandA11y(brand);
  },true);
}
v283InstallSidebarDelegation();

function v283AuditState(){
  return {
    version:283,pwaRelease:283,
    directModalClose:true,categorySaveCloses:true,categoryDeleteCloses:true,categoryClearCancelCloses:true,
    sidebarFirstLoadDelegation:!!window.__mf283SidebarDelegationInstalled,
    collectionsCardTypography:true
  };
}
Object.assign(App,{v283CloseModal,v283AuditState});
window.MediaFlowV283={version:283,focus:'Category modal lifecycle, first-load sidebar and Collections card typography'};
MediaFlowRuntime.version=V283_RUNTIME_VERSION;
