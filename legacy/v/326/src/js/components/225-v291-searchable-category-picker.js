/* ============================================================
   MediaFlow v291 — Searchable, aligned Category chooser
   ------------------------------------------------------------
   - Adds Category search to Add Title, Edit Title and Title Details Quick Edit.
   - Quick Edit gets a wide viewport-level chooser that can show the full
     category set in a compact responsive grid instead of being trapped inside
     the small Quick Edit modal boundary.
   - Removes the generic v225/v226 action glyphs that were being injected next
     to real Category artwork.
   - Standardizes every Category option into the same icon/name/meta columns.
   ============================================================ */
const V291_RUNTIME_VERSION=291;

function v291NormalizeCategorySearch(value){
  return String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .trim();
}

function v291CategorySelectHtml(inputId,current,context='library'){
  const model=v290EditorCategoryModel(current),selected=model.selectedCategory;
  const label=selected?.name||'Choose category';
  const icon=selected?v144CategoryIconHtml(selected):V225_BUTTON_ICONS.category;
  const options=model.categories.map(cat=>{
    const id=String(cat?.id||'');
    return `<option value="${escapeHtml(id)}" ${id===model.selected?'selected':''}>${escapeHtml(cat?.name||'Unnamed category')}</option>`;
  }).join('');
  return `<div class="mf290-category-select mf291-category-select" data-mf290-category-select data-mf290-input-id="${escapeHtml(inputId)}" data-mf290-context="${escapeHtml(context)}">
    <select class="mf290-category-native" id="${escapeHtml(inputId)}" tabindex="-1" aria-hidden="true">${options}</select>
    <button type="button" class="mf290-category-trigger mf291-category-trigger" data-v225-iconified="1" aria-haspopup="listbox" aria-expanded="false" onclick="App.v290ToggleCategoryMenu(this)">
      <span class="mf290-category-trigger-icon">${icon}</span>
      <span class="mf290-category-trigger-name">${escapeHtml(label)}</span>
      <span class="mf290-category-trigger-chevron" aria-hidden="true">▾</span>
    </button>
  </div>`;
}

// v289/v290 render this helper by name when Add/Edit or Quick Edit opens.
v290CategorySelectHtml=v291CategorySelectHtml;
v289RichCategorySelectHtml=v291CategorySelectHtml;

function v291CategoryOptionHtml(cat,model){
  const id=String(cat?.id||''),selected=id===model.selected,hidden=model.hidden.has(id);
  const name=String(cat?.name||'Unnamed category');
  const unit=String(unitLabel(cat?.unit,cat?.target)||'');
  const mins=Number(cat?.minutesPerUnit)||0;
  const search=v291NormalizeCategorySearch(`${name} ${unit} ${mins}`);
  const hiddenTitle=hidden
    ?(model.applyVisibility&&selected?'Current category · hidden in Set Category':'Hidden in Set Category · available while editing')
    :'';
  return `<button type="button" role="option" aria-selected="${selected?'true':'false'}" class="mf290-category-option mf291-category-option ${selected?'selected':''}" data-v225-iconified="1" data-mf290-cat-id="${escapeHtml(id)}" data-mf291-search="${escapeHtml(search)}" ${hiddenTitle?`title="${escapeHtml(hiddenTitle)}"`:''}>
    <span class="mf290-category-option-icon">${v144CategoryIconHtml(cat)}</span>
    <span class="mf290-category-option-copy"><b>${escapeHtml(name)}</b><small>${escapeHtml(unit)} · ${mins} min/unit</small></span>
  </button>`;
}
v290CategoryOptionHtml=v291CategoryOptionHtml;

// The global v225/v226 icon layer sees every <button>. These Category controls
// already have meaningful Category artwork, so explicitly opt them out of the
// generic circular "action" glyph that appeared beside the artwork in v290.
const v291ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf290-category-trigger,.mf290-category-option,.mf291-category-trigger,.mf291-category-option'))return null;
  return v291ButtonIconNameBase.apply(this,arguments);
};

function v291CategorySearchMarkup(model){
  const count=model.categories.length;
  return `<div class="mf291-category-searchbar">
    <input class="mf291-category-search" type="search" autocomplete="off" spellcheck="false" aria-label="Search categories" placeholder="Search categories…">
    <span class="mf291-category-search-count" aria-live="polite">${count.toLocaleString()} ${count===1?'category':'categories'}</span>
  </div>`;
}

function v291FilterCategoryMenu(menu,query=''){
  if(!menu)return 0;
  const q=v291NormalizeCategorySearch(query);
  const rows=[...menu.querySelectorAll('.mf290-category-option')];
  let shown=0;
  for(const row of rows){
    const visible=!q||String(row.dataset.mf291Search||'').includes(q);
    row.hidden=!visible;
    if(visible)shown++;
  }
  const empty=menu.querySelector('.mf291-category-search-empty');
  if(empty)empty.hidden=shown!==0;
  const count=menu.querySelector('.mf291-category-search-count');
  if(count)count.textContent=q?`${shown.toLocaleString()} of ${rows.length.toLocaleString()}`:`${rows.length.toLocaleString()} ${rows.length===1?'category':'categories'}`;
  return shown;
}

function v291PositionCategoryMenu(menu,trigger){
  if(!menu||!trigger||!trigger.isConnected)return;
  const tr=trigger.getBoundingClientRect();
  const vw=Math.max(0,window.innerWidth||document.documentElement.clientWidth||0);
  const vh=Math.max(0,window.innerHeight||document.documentElement.clientHeight||0);
  const margin=12,gap=7;
  const context=String(trigger.closest('[data-mf290-category-select]')?.dataset?.mf290Context||'library');
  const count=menu.querySelectorAll('.mf290-category-option').length||1;

  menu.dataset.context=context;

  // Quick Edit is intentionally no longer constrained by the tiny modal.
  // The chooser becomes a wide viewport-level panel; on desktop its responsive
  // grid usually fits the entire Category set without internal scrolling.
  if(context==='quick-details'){
    const width=Math.max(280,Math.min(960,vw-margin*2));
    const cols=width>=840?3:(width>=560?2:1);
    const rows=Math.max(1,Math.ceil(count/cols));
    const desired=Math.min(vh-margin*2,58+(rows*56)+24);
    const maxHeight=Math.max(190,Math.min(vh-margin*2,desired));
    const left=Math.max(margin,Math.round((vw-width)/2));
    const top=Math.max(margin,Math.round((vh-maxHeight)/2));
    Object.assign(menu.style,{
      width:`${Math.round(width)}px`,
      left:`${left}px`,
      top:`${top}px`,
      maxHeight:`${Math.round(maxHeight)}px`
    });
    menu.dataset.placement='viewport';
    return;
  }

  // Add/Edit Title keeps an anchored picker, but the search header stays fixed
  // while only the result list scrolls when the viewport is genuinely too short.
  const b=v290CategoryBoundary(trigger);
  const maxWidth=Math.max(220,b.right-b.left);
  const width=Math.min(maxWidth,Math.max(Math.min(430,maxWidth),Math.min(tr.width,maxWidth)));
  const left=Math.max(b.left,Math.min(tr.left,b.right-width));
  const desired=Math.min(540,58+(count*55)+16,Math.max(180,vh*.68));
  const below=Math.max(0,b.bottom-tr.bottom-gap),above=Math.max(0,tr.top-b.top-gap);
  const opensDown=below>=Math.min(250,desired)||below>=above;
  const available=Math.max(150,opensDown?below:above);
  const maxHeight=Math.min(desired,available);

  Object.assign(menu.style,{
    width:`${Math.round(width)}px`,
    left:`${Math.round(left)}px`,
    maxHeight:`${Math.round(maxHeight)}px`
  });
  menu.dataset.placement=opensDown?'bottom':'top';
  if(opensDown)menu.style.top=`${Math.round(Math.min(b.bottom-maxHeight,tr.bottom+gap))}px`;
  else menu.style.top=`${Math.round(Math.max(b.top,tr.top-gap-maxHeight))}px`;

  requestAnimationFrame(()=>{
    if(V290_CATEGORY_POPOVER?.menu!==menu||!trigger.isConnected)return;
    if(menu.dataset.placement!=='top')return;
    const mh=menu.getBoundingClientRect().height;
    menu.style.top=`${Math.round(Math.max(b.top,tr.top-gap-mh))}px`;
  });
}
v290PositionCategoryMenu=v291PositionCategoryMenu;

function v291ToggleCategoryMenu(trigger){
  if(!trigger)return;
  if(V290_CATEGORY_POPOVER?.trigger===trigger){v290CloseCategoryMenu({returnFocus:true});return;}
  v290CloseCategoryMenu();

  const wrapper=trigger.closest('[data-mf290-category-select]');
  const inputId=wrapper?.dataset?.mf290InputId||'';
  const input=inputId?document.getElementById(inputId):null;
  if(!wrapper||!input)return;

  const model=v290EditorCategoryModel(input.value);
  input.innerHTML=model.categories.map(cat=>`<option value="${escapeHtml(String(cat?.id||''))}" ${String(cat?.id||'')===model.selected?'selected':''}>${escapeHtml(cat?.name||'Unnamed category')}</option>`).join('');
  if(model.selected)input.value=model.selected;

  const menu=document.createElement('div');
  menu.className='mf290-category-popover mf291-category-popover';
  menu.setAttribute('role','listbox');
  menu.setAttribute('aria-label','Category choices');
  menu.dataset.context=String(wrapper.dataset.mf290Context||'library');

  const options=model.categories.length
    ?model.categories.map(cat=>v291CategoryOptionHtml(cat,model)).join('')
    :`<div class="mf290-category-empty"><b>No categories available</b><span>All Set Category choices are hidden for title editing. Change the visibility option in Settings → Popup & Filter Ordering.</span></div>`;

  menu.innerHTML=`${v291CategorySearchMarkup(model)}
    <div class="mf291-category-options">${options}</div>
    <div class="mf291-category-search-empty" hidden><b>No matching categories</b><span>Try a different Category name.</span></div>`;

  document.body.appendChild(menu);
  V290_CATEGORY_POPOVER={menu,trigger,inputId};
  trigger.setAttribute('aria-expanded','true');

  menu.querySelectorAll('[data-mf290-cat-id]').forEach(btn=>btn.addEventListener('click',()=>v290ChooseCategory(btn.dataset.mf290CatId||'')));
  const search=menu.querySelector('.mf291-category-search');
  search?.addEventListener('input',()=>v291FilterCategoryMenu(menu,search.value));
  search?.addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      const first=[...menu.querySelectorAll('.mf290-category-option')].find(row=>!row.hidden);
      if(first){event.preventDefault();v290ChooseCategory(first.dataset.mf290CatId||'');}
    }
  });

  v291PositionCategoryMenu(menu,trigger);
  requestAnimationFrame(()=>{
    if(V290_CATEGORY_POPOVER?.menu!==menu)return;
    // Search is the primary interaction in v291. The selected Category remains
    // highlighted in place, but opening the chooser never forces the list to
    // scroll away from its beginning.
    search?.focus?.({preventScroll:true});
  });
}

v290ToggleCategoryMenu=v291ToggleCategoryMenu;
App.v290ToggleCategoryMenu=v291ToggleCategoryMenu;

// Clear any generic semantic glyph that may have been injected into an already
// mounted Category trigger during a hot update; future observers also resolve
// these controls to "no global icon" through the v225ButtonIconName override.
try{v226RefreshSemanticButtonIcons(document);}catch(_){ }

function v291AuditState(){
  const state=v290ResolvedCategoryState(),model=v290EditorCategoryModel('');
  return {
    version:291,
    categorySearch:true,
    addEditCategorySearch:true,
    quickEditCategorySearch:true,
    quickEditViewportGrid:true,
    genericCategoryActionIcons:false,
    alignedCategoryRows:true,
    categoryOrder:state.order.slice(),
    setCategoryHidden:[...state.hidden],
    applyCategoryVisibilityToTitleEditing:v290ApplyCategoryVisibilityToEditors(),
    editorCategoryCount:model.categories.length,
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:Number(v142OrderExportPayload()?.formatVersion)||0,
    collectionsExportVersion:2,
    pwaRelease:291
  };
}

Object.assign(App,{v291FilterCategoryMenu,v291AuditState});
window.MediaFlowV291={version:291,focus:'Searchable full Category chooser, aligned rows and removal of duplicate action icons'};
MediaFlowRuntime.version=V291_RUNTIME_VERSION;

