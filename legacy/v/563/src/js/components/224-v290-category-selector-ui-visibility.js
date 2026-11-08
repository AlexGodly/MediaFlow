/* ============================================================
   MediaFlow v290 — Category selector UI + title-edit visibility control
   ------------------------------------------------------------
   - Replaces the v289 in-flow <details> Category chooser used by Add/Edit
     Title and Title Details quick edit with a viewport-aware floating picker.
   - The picker is rendered at document level so editor/modal overflow cannot
     clip it or let Priority/Start Date/Save/Cancel bleed through it.
   - Category ordering always follows Set Category order.
   - By default Set Category visibility does NOT hide categories from direct
     title editing. An explicit opt-in setting can apply that visibility to
     Add Title, Edit Title and Title Details quick edit.
   ============================================================ */
const V290_RUNTIME_VERSION=290;
const V290_EDITOR_VISIBILITY_KEY='v290ApplyCategoryVisibilityToTitleEditing';
let V290_CATEGORY_POPOVER=null;

function v290EnsureSettings(settings=S.settings||DEFAULT_SETTINGS){
  if(!settings||typeof settings!=='object')return settings;
  if(typeof settings[V290_EDITOR_VISIBILITY_KEY]!=='boolean')settings[V290_EDITOR_VISIBILITY_KEY]=false;
  return settings;
}
if(typeof DEFAULT_SETTINGS[V290_EDITOR_VISIBILITY_KEY]!=='boolean')DEFAULT_SETTINGS[V290_EDITOR_VISIBILITY_KEY]=false;
v290EnsureSettings(DEFAULT_SETTINGS);
v290EnsureSettings(S.settings||DEFAULT_SETTINGS);

function v290ApplyCategoryVisibilityToEditors(settings=S.settings||DEFAULT_SETTINGS){
  v290EnsureSettings(settings);
  return settings?.[V290_EDITOR_VISIBILITY_KEY]===true;
}
function v290ResolvedCategoryState(){
  const st=v230ResolvedSurface('setCategory');
  const valid=new Set((S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean));
  const order=(st?.order||[]).map(String).filter(id=>valid.has(id));
  for(const c of (S.categories||[])){
    const id=String(c?.id||'');
    if(id&&!order.includes(id))order.push(id);
  }
  return {order,hidden:new Set((st?.hidden||[]).map(String))};
}
function v290EditorCategoryModel(current=''){
  const currentId=String(current||'');
  const byId=new Map((S.categories||[]).map(c=>[String(c?.id||''),c]));
  const state=v290ResolvedCategoryState();
  const applyVisibility=v290ApplyCategoryVisibilityToEditors();
  let ids=state.order.filter(id=>!applyVisibility||!state.hidden.has(id)||id===currentId);

  // Never make an existing title look blank simply because its currently
  // assigned category was hidden after the title was created.
  if(currentId&&byId.has(currentId)&&!ids.includes(currentId))ids.unshift(currentId);

  let selected=currentId;
  if(!byId.has(selected)||!ids.includes(selected))selected=ids[0]||'';
  return {
    ids,
    categories:ids.map(id=>byId.get(id)).filter(Boolean),
    selected,
    selectedCategory:byId.get(selected)||null,
    hidden:state.hidden,
    applyVisibility
  };
}

function v290CategorySelectHtml(inputId,current,context='library'){
  const model=v290EditorCategoryModel(current),selected=model.selectedCategory;
  const label=selected?.name||'Choose category';
  const icon=selected?v144CategoryIconHtml(selected):V225_BUTTON_ICONS.category;
  const options=model.categories.map(cat=>{
    const id=String(cat?.id||'');
    return `<option value="${escapeHtml(id)}" ${id===model.selected?'selected':''}>${escapeHtml(cat?.name||'Unnamed category')}</option>`;
  }).join('');
  return `<div class="mf290-category-select" data-mf290-category-select data-mf290-input-id="${escapeHtml(inputId)}" data-mf290-context="${escapeHtml(context)}">
    <select class="mf290-category-native" id="${escapeHtml(inputId)}" tabindex="-1" aria-hidden="true">${options}</select>
    <button type="button" class="mf290-category-trigger" aria-haspopup="listbox" aria-expanded="false" onclick="App.v290ToggleCategoryMenu(this)">
      <span class="mf290-category-trigger-icon">${icon}</span>
      <span class="mf290-category-trigger-name">${escapeHtml(label)}</span>
      <span class="mf290-category-trigger-chevron" aria-hidden="true">▾</span>
    </button>
  </div>`;
}

// v289's Add/Edit wrapper and quick-schema override resolve this function by
// name at render time, so swapping the renderer upgrades both surfaces without
// changing their save IDs or legacy persistence contract.
v289RichCategorySelectHtml=v290CategorySelectHtml;

function v290CategoryOptionHtml(cat,model){
  const id=String(cat?.id||''),selected=id===model.selected,hidden=model.hidden.has(id);
  let visibility='';
  if(hidden&&model.applyVisibility&&selected)visibility=' · current category · hidden in Set Category';
  else if(hidden&&!model.applyVisibility)visibility=' · hidden in Set Category · available while editing';
  return `<button type="button" role="option" aria-selected="${selected?'true':'false'}" class="mf290-category-option ${selected?'selected':''}" data-mf290-cat-id="${escapeHtml(id)}">
    <span class="mf290-category-option-icon">${v144CategoryIconHtml(cat)}</span>
    <span class="mf290-category-option-copy"><b>${escapeHtml(cat?.name||'Unnamed category')}</b><small>${escapeHtml(unitLabel(cat?.unit,cat?.target))} · ${Number(cat?.minutesPerUnit)||0} min/unit${escapeHtml(visibility)}</small></span>
    <span class="mf290-category-option-check" aria-hidden="true">${selected?'✓':''}</span>
  </button>`;
}

function v290CloseCategoryMenu(options={}){
  const state=V290_CATEGORY_POPOVER;
  if(!state)return;
  V290_CATEGORY_POPOVER=null;
  try{state.trigger?.setAttribute?.('aria-expanded','false');}catch(_){ }
  try{state.menu?.remove?.();}catch(_){ }
  if(options.returnFocus){try{state.trigger?.focus?.({preventScroll:true});}catch(_){ }}
}

function v290CategoryBoundary(trigger){
  const margin=10,vw=Math.max(0,window.innerWidth||document.documentElement.clientWidth||0),vh=Math.max(0,window.innerHeight||document.documentElement.clientHeight||0);
  let out={left:margin,right:vw-margin,top:margin,bottom:vh-margin};
  const modal=trigger?.closest?.('.v181-quick-detail-modal,.modal');
  if(modal){
    const r=modal.getBoundingClientRect();
    out={left:Math.max(out.left,r.left+8),right:Math.min(out.right,r.right-8),top:Math.max(out.top,r.top+8),bottom:Math.min(out.bottom,r.bottom-8)};
    const actions=modal.querySelector('.v181-quick-detail-actions,.modal-actions');
    if(actions){
      const ar=actions.getBoundingClientRect(),tr=trigger.getBoundingClientRect();
      if(ar.top>tr.bottom+2&&ar.top<out.bottom)out.bottom=Math.min(out.bottom,ar.top-8);
    }
  }
  if(out.right<=out.left+120){out.left=margin;out.right=vw-margin;}
  return out;
}

function v290PositionCategoryMenu(menu,trigger){
  if(!menu||!trigger||!trigger.isConnected)return;
  const tr=trigger.getBoundingClientRect(),b=v290CategoryBoundary(trigger),gap=6;
  const maxWidth=Math.max(180,b.right-b.left);
  const width=Math.min(maxWidth,Math.max(Math.min(390,maxWidth),Math.min(tr.width,maxWidth)));
  let left=Math.max(b.left,Math.min(tr.left,b.right-width));
  const desired=Math.min(420,Math.max(116,(menu.querySelectorAll('.mf290-category-option').length||1)*57+14),Math.max(116,(window.innerHeight||720)*.58));
  const below=Math.max(0,b.bottom-tr.bottom-gap),above=Math.max(0,tr.top-b.top-gap);
  const opensDown=below>=Math.min(220,desired)||below>=above;
  const available=Math.max(74,opensDown?below:above);
  const maxHeight=Math.min(desired,available);

  Object.assign(menu.style,{width:`${Math.round(width)}px`,left:`${Math.round(left)}px`,maxHeight:`${Math.round(maxHeight)}px`});
  menu.dataset.placement=opensDown?'bottom':'top';
  if(opensDown){
    menu.style.top=`${Math.round(Math.min(b.bottom-maxHeight,tr.bottom+gap))}px`;
  }else{
    menu.style.top=`${Math.round(Math.max(b.top,tr.top-gap-maxHeight))}px`;
  }

  // Once actual content height is known, tighten upward placement so short
  // lists sit directly against the trigger rather than floating high above it.
  requestAnimationFrame(()=>{
    if(V290_CATEGORY_POPOVER?.menu!==menu||!trigger.isConnected)return;
    const mh=menu.getBoundingClientRect().height;
    if(menu.dataset.placement==='top')menu.style.top=`${Math.round(Math.max(b.top,tr.top-gap-mh))}px`;
  });
}

function v290ChooseCategory(id){
  const state=V290_CATEGORY_POPOVER;
  if(!state)return;
  const wrapper=state.trigger?.closest?.('[data-mf290-category-select]');
  const inputId=wrapper?.dataset?.mf290InputId||'';
  const input=inputId?document.getElementById(inputId):null;
  const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(id));
  if(!input||!cat)return;

  if(![...input.options].some(o=>String(o.value)===String(id))){
    input.add(new Option(cat.name||'Unnamed category',String(id)));
  }
  input.value=String(id);
  input.dispatchEvent(new Event('change',{bubbles:true}));
  const icon=wrapper.querySelector('.mf290-category-trigger-icon'),name=wrapper.querySelector('.mf290-category-trigger-name');
  if(icon)icon.innerHTML=v144CategoryIconHtml(cat);
  if(name)name.textContent=cat.name||'Unnamed category';
  v290CloseCategoryMenu({returnFocus:true});
}

function v290ToggleCategoryMenu(trigger){
  if(!trigger)return;
  if(V290_CATEGORY_POPOVER?.trigger===trigger){v290CloseCategoryMenu({returnFocus:true});return;}
  v290CloseCategoryMenu();
  const wrapper=trigger.closest('[data-mf290-category-select]'),inputId=wrapper?.dataset?.mf290InputId||'',input=inputId?document.getElementById(inputId):null;
  if(!wrapper||!input)return;

  const model=v290EditorCategoryModel(input.value);
  // Keep the hidden native value synchronized with the model in case category
  // order/visibility changed while the editor was already open.
  input.innerHTML=model.categories.map(cat=>`<option value="${escapeHtml(String(cat?.id||''))}" ${String(cat?.id||'')===model.selected?'selected':''}>${escapeHtml(cat?.name||'Unnamed category')}</option>`).join('');
  if(model.selected)input.value=model.selected;

  const menu=document.createElement('div');
  menu.className='mf290-category-popover';
  menu.setAttribute('role','listbox');
  menu.setAttribute('aria-label','Category choices');
  menu.innerHTML=model.categories.length
    ?model.categories.map(cat=>v290CategoryOptionHtml(cat,model)).join('')
    :`<div class="mf290-category-empty"><b>No categories available</b><span>All Set Category choices are hidden for title editing. Change the visibility option in Settings → Popup & Filter Ordering.</span></div>`;
  document.body.appendChild(menu);
  V290_CATEGORY_POPOVER={menu,trigger,inputId};
  trigger.setAttribute('aria-expanded','true');

  menu.querySelectorAll('[data-mf290-cat-id]').forEach(btn=>btn.addEventListener('click',()=>v290ChooseCategory(btn.dataset.mf290CatId||'')));
  v290PositionCategoryMenu(menu,trigger);
  requestAnimationFrame(()=>{
    if(V290_CATEGORY_POPOVER?.menu!==menu)return;
    const option=menu.querySelector('.mf290-category-option.selected,.mf290-category-option');
    if(!option)return;
    const top=option.offsetTop,bottom=top+option.offsetHeight;
    if(top<menu.scrollTop)menu.scrollTop=Math.max(0,top-6);
    else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=Math.max(0,bottom-menu.clientHeight+6);
  });
}

function v290SetEditorCategoryVisibility(value){
  v290EnsureSettings(S.settings||DEFAULT_SETTINGS);
  S.settings[V290_EDITOR_VISIBILITY_KEY]=!!value;
  try{persistSettings();}catch(_){try{saveState();}catch(__){ }}
  v290CloseCategoryMenu();
  showToast(value?'Hidden Set Category choices will now also be hidden while adding/editing titles.':'All categories remain available while adding/editing titles, even when hidden from Set Category.');
}

/* ---------- Settings: explain + expose the opt-in rule --------------- */
const v290SurfaceEditorBase=v230SurfaceEditor;
v230SurfaceEditor=function(surface){
  let html=v290SurfaceEditorBase.apply(this,arguments);
  if(surface!=='setCategory')return html;
  const checked=v290ApplyCategoryVisibilityToEditors();
  const extra=`<div class="mf290-editor-visibility-setting">
    <div class="mf290-editor-visibility-copy"><b>Title editing visibility</b><small>Set Category order always applies to Add Title, Edit Title and Title Details Quick Edit. By default, categories hidden here still remain available in those direct title editors. Enable this only if you also want this visibility list to hide categories there. A title's current hidden category remains visible so an existing assignment never becomes blank.</small></div>
    <label class="mf290-editor-visibility-toggle"><input type="checkbox" ${checked?'checked':''} onchange="App.v290SetEditorCategoryVisibility(this.checked)"><span>Apply Set Category visibility to title editing</span></label>
    <em>Default: Off · hidden categories stay available when directly adding or editing a title.</em>
  </div>`;
  return html.replace('<div class="v230-layout-list">',`${extra}<div class="v230-layout-list">`);
};

const v290SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  if(String(title||'').trim().toUpperCase()==='CHOICE & FILTER LAYOUT')return {kind:'paths',paths:['v230ChoiceLayout',V290_EDITOR_VISIBILITY_KEY]};
  return v290SectionResetPlanBase.apply(this,arguments);
};
const v290ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  if(code.includes('App.v290SetEditorCategoryVisibility'))return {type:'path',path:V290_EDITOR_VISIBILITY_KEY};
  return v290ResetDescriptorBase.apply(this,arguments);
};

/* ---------- Lifecycle + persistence normalization -------------------- */
const v290NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){const next=v290NormalizeImportedSettingsBase.apply(this,arguments);v290EnsureSettings(next);return next;};
const v290PersistSettingsBase=persistSettings;
persistSettings=function(){v290EnsureSettings(S.settings||DEFAULT_SETTINGS);return v290PersistSettingsBase.apply(this,arguments);};
const v290LoadAllBase=loadAll;
loadAll=async function(){await v290LoadAllBase.apply(this,arguments);v290EnsureSettings(S.settings||DEFAULT_SETTINGS);};

// Focus the visible Category trigger instead of the hidden compatibility
// <select> when Title Details opens its Category quick editor.
const v290QuickEditDetailBase=v181QuickEditDetail;
v181QuickEditDetail=function(id,key){
  const out=v290QuickEditDetailBase.apply(this,arguments);
  if(key==='categoryId')setTimeout(()=>document.querySelector('.v181-quick-detail-modal [data-mf290-category-select] .mf290-category-trigger')?.focus?.(),0);
  return out;
};
App.v181QuickEditDetail=v181QuickEditDetail;

const v290CloseQuickDetailBase=v181CloseQuickDetail;
v181CloseQuickDetail=function(){v290CloseCategoryMenu();return v290CloseQuickDetailBase.apply(this,arguments);};
App.v181CloseQuickDetail=v181CloseQuickDetail;

const v290AppCloseModalBase=App.closeModal;
App.closeModal=function(){v290CloseCategoryMenu();return v290AppCloseModalBase.apply(this,arguments);};

// Close rather than detach the picker from its trigger when a scroll/resize
// changes modal geometry. Scrolling inside the picker itself remains isolated.
document.addEventListener('pointerdown',event=>{
  const state=V290_CATEGORY_POPOVER;if(!state)return;
  if(state.menu?.contains(event.target)||state.trigger?.contains(event.target))return;
  v290CloseCategoryMenu();
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&V290_CATEGORY_POPOVER){event.preventDefault();v290CloseCategoryMenu({returnFocus:true});}},true);
document.addEventListener('scroll',event=>{
  const state=V290_CATEGORY_POPOVER;if(!state||state.menu?.contains(event.target))return;
  requestAnimationFrame(()=>{
    const current=V290_CATEGORY_POPOVER;
    if(!current)return;
    if(!current.trigger?.isConnected){v290CloseCategoryMenu();return;}
    v290PositionCategoryMenu(current.menu,current.trigger);
  });
},true);
window.addEventListener('resize',()=>v290CloseCategoryMenu(),{passive:true});

function v290AuditState(){
  const state=v290ResolvedCategoryState(),model=v290EditorCategoryModel('');
  return {
    version:290,
    categoryOrder:state.order.slice(),
    setCategoryHidden:[...state.hidden],
    applyCategoryVisibilityToTitleEditing:v290ApplyCategoryVisibilityToEditors(),
    editorCategoryCount:model.categories.length,
    editorShowsHiddenByDefault:!v290ApplyCategoryVisibilityToEditors(),
    portalPicker:true,
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:Number(v142OrderExportPayload()?.formatVersion)||0,
    collectionsExportVersion:2,
    pwaRelease:290
  };
}

Object.assign(App,{v290ToggleCategoryMenu,v290CloseCategoryMenu,v290SetEditorCategoryVisibility,v290AuditState});
window.MediaFlowV290={version:290,focus:'Category selector UI, modal-safe floating picker and optional Set Category visibility enforcement for title editing'};
MediaFlowRuntime.version=V290_RUNTIME_VERSION;
