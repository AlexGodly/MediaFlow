/* ============================================================
   MediaFlow v229 — Library Choice Modal Polish
   ------------------------------------------------------------
   - Set Category uses each category's real configured Icon URL when present.
   - Set Category includes every current category, including disabled categories.
   - The category list never uses its own scrollbar: up to 15 choices render at
     once; pagination appears only when the Library has more than 15 categories.
   - Set Status uses the same semantic status icons as Dynamic Library.
   - The Dynamic category-row "Category icon URL" selector regains a clear
     image/category-artwork icon without changing its selected value or sizing.
   ============================================================ */

const V229_RUNTIME_VERSION=229;
const V229_CATEGORY_MODAL_PAGE_SIZE=15;

function v229StatusIconName(status){
  const map={
    planned:'planToWatch',
    active:'watching',
    paused:'onHold',
    completed:'completedStatus',
    dropped:'dropped'
  };
  return map[String(status||'planned')]||'planToWatch';
}

function v229StatusChoiceIcon(status){
  const name=v229StatusIconName(status);
  return V225_BUTTON_ICONS[name]||V225_BUTTON_ICONS.action;
}

/* Status-choice rows already carry an explicit status icon inside the choice
   tile. Do not let the global button decorator add a second leading icon. */
const v229ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.status-choice'))return null;
  return v229ButtonIconNameBase(el);
};

libraryStatusModalHtml=function(d){
  const current=String(d?.status||'planned');
  const options=[
    {id:'planned',label:'Plan to Watch',desc:'Planned for later, but not started yet.'},
    {id:'active',label:'Watching',desc:'Currently being watched or read.'},
    {id:'paused',label:'On Hold',desc:'Temporarily set aside without abandoning it.'},
    {id:'completed',label:'Completed',desc:'Finished and kept as part of your history.'},
    {id:'dropped',label:'Dropped',desc:'Abandoned and excluded from recommendations.'}
  ];
  return `<div class="priority-modal v229-status-modal">
    <div class="modal-title">Set status</div>
    <div class="v229-choice-modal-intro">Choose the status for <b>${escapeHtml(d?.title||'this title')}</b>.</div>
    <div class="choice-list v229-status-choice-list">${options.map(o=>`<button type="button" class="status-choice ${current===o.id?'selected':''}" onclick="App.setLibraryStatus('${escapeHtml(d.id)}','${o.id}')">
      <span class="choice-icon v229-status-choice-icon" aria-hidden="true">${v229StatusChoiceIcon(o.id)}</span>
      <span class="v229-choice-copy"><b>${o.label}</b><small>${o.desc}</small></span>
      <span class="choice-check">${current===o.id?'✓':''}</span>
    </button>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
};

function v229CategoryModalPageCount(){
  return Math.max(1,Math.ceil((S.categories||[]).length/V229_CATEGORY_MODAL_PAGE_SIZE));
}

function v229SetLibraryCategoryPage(page){
  if(!S.modal||S.modal.type!=='libraryCategory')return;
  const pages=v229CategoryModalPageCount();
  const next=Math.max(0,Math.min(pages-1,Number(page)||0));
  S.modal.data=S.modal.data||{};
  S.modal.data.categoryPage=next;
  renderModal();
}

function v229CategoryChoiceIcon(cat){
  // v144CategoryIconHtml prefers the real, safe Icon URL and only falls back
  // to the category emoji when no usable URL exists.
  return v144CategoryIconHtml(cat||{});
}

libraryCategoryModalHtml=function(d){
  const current=String(d?.categoryId||'');
  const cats=(S.categories||[]).slice(); // all current categories, enabled or disabled
  const pageCount=Math.max(1,Math.ceil(cats.length/V229_CATEGORY_MODAL_PAGE_SIZE));
  const currentIndex=Math.max(0,cats.findIndex(c=>String(c?.id||'')===current));
  const defaultPage=Math.floor(currentIndex/V229_CATEGORY_MODAL_PAGE_SIZE);
  const requested=Number.isFinite(Number(d?.categoryPage))?Number(d.categoryPage):defaultPage;
  const page=Math.max(0,Math.min(pageCount-1,requested));
  const start=page*V229_CATEGORY_MODAL_PAGE_SIZE;
  const visible=cats.slice(start,start+V229_CATEGORY_MODAL_PAGE_SIZE);
  const twoColumn=visible.length>7;

  const choices=visible.length?visible.map(c=>{
    const disabled=c?.enabled===false;
    const catId=String(c?.id||'');
    const selected=current===catId;
    const unit=escapeHtml(unitLabel(c?.unit,c?.target));
    const mins=Number(c?.minutesPerUnit)||0;
    return `<button type="button" class="category-choice v229-category-choice ${selected?'selected':''}" onclick="App.setLibraryCategory('${escapeHtml(String(d?.id||''))}','${escapeHtml(catId)}')">
      <span class="choice-icon v229-category-choice-icon" aria-hidden="true">${v229CategoryChoiceIcon(c)}</span>
      <span class="v229-choice-copy"><b>${escapeHtml(c?.name||'Unnamed category')}</b><small>${unit} · ${mins} min/unit${disabled?' · Disabled':''}</small></span>
      <span class="choice-check">${selected?'✓':''}</span>
    </button>`;
  }).join(''):`<div class="v229-category-empty">No categories are available yet.</div>`;

  const pagination=cats.length>V229_CATEGORY_MODAL_PAGE_SIZE?`<div class="v229-category-pagination" aria-label="Category pages">
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v229SetLibraryCategoryPage(${page-1})" ${page<=0?'disabled':''}>Previous</button>
    <span class="v229-category-page-label">Page <b>${page+1}</b> of <b>${pageCount}</b> · ${cats.length} categories</span>
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v229SetLibraryCategoryPage(${page+1})" ${page>=pageCount-1?'disabled':''}>Next</button>
  </div>`:'';

  return `<div class="priority-modal v229-category-modal">
    <div class="modal-title">Set category</div>
    <div class="v229-choice-modal-intro">Choose the category for <b>${escapeHtml(d?.title||'this title')}</b>. The category controls its rotation, units, and scheduler behavior.</div>
    <div class="choice-list v229-category-choice-list ${twoColumn?'v229-category-choice-list-two':'v229-category-choice-list-one'}">${choices}</div>
    ${pagination}
    <div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
};

/* v227 intentionally made this selector icon-free. v229 makes the selected
   "Category icon URL" action visually explicit with an image/artwork icon. */
const v229EnhanceDropdownBase=v226EnhanceDropdown;
v226EnhanceDropdown=function(el){
  v229EnhanceDropdownBase(el);
  if(el?.matches?.('select[aria-label="Dynamic Library category row icons"]')){
    el.classList.remove('v227-dropdown-no-leading-icon');
    el.dataset.v226DropdownIcon='categoryArtwork';
    el.style.setProperty('--v226-dropdown-icon',v226DropdownIconUrl('cover'));
  }
};

function v229RefreshChoiceModalUi(){
  try{v226EnhanceDropdowns(document);}catch(_){ }
  try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
}

requestAnimationFrame(v229RefreshChoiceModalUi);

Object.assign(App,{
  v229SetLibraryCategoryPage,
  v229RefreshChoiceModalUi
});

MediaFlowRuntime.version=V229_RUNTIME_VERSION;
