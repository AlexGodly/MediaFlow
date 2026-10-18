/* MediaFlow v357 — Personal Order dialog scaling, Collection picker polish,
   aligned category tabs, and meaningful queue/quick-workspace icons.
   Keeps canonical Personal Order and Collection handlers intact. */
const V357_RELEASE=357;

const V357_COLLECTION_SORT_OPTIONS=[
  ['updated','Recently updated'],
  ['alphabetic','Alphabetic'],
  ['added','Recently added'],
  ['viewed','Recently viewed'],
  ['count','Title count'],
  ['progress','Progress']
];

const V357_INLINE_ICONS={
  addTitle:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5h7.5a2 2 0 0 1 2 2V20l-5.5-3-5.5 3V6.5a2 2 0 0 1 2-2Z"/><path d="M12 8v5"/><path d="M9.5 10.5h5"/></svg>',
  addCollection:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7h6l2 2h9v9.5A1.5 1.5 0 0 1 19 20H5A1.5 1.5 0 0 1 3.5 18.5Z"/><path d="M3.5 7V5.5A1.5 1.5 0 0 1 5 4h5.9l2 2H19"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>',
  lists:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 6.5h11"/><path d="M8.5 12h11"/><path d="M8.5 17.5h11"/><path d="M4.5 6.5h.01"/><path d="M4.5 12h.01"/><path d="M4.5 17.5h.01"/></svg>',
  tabs:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10v4H4Z"/><path d="M10 5h4a2 2 0 0 1 2 2.5V9H10Z"/><path d="M16 6.5A1.5 1.5 0 0 1 17.5 5H19a1.5 1.5 0 0 1 1.5 1.5V9H16Z"/><path d="M4 9h16v9.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5Z"/></svg>',
  categoryDisplay:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h7.5"/><path d="M4 12h7.5"/><path d="M4 17.5h7.5"/><rect x="14" y="4.5" width="6" height="4" rx="1"/><rect x="14" y="10" width="6" height="4" rx="1"/><rect x="14" y="15.5" width="6" height="4" rx="1"/></svg>',
  queueTools:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6.5h12"/><path d="M6 12h7"/><path d="M6 17.5h4"/><circle cx="17.5" cy="12" r="3.2"/><path d="m17.5 9.6.8 1.2 1.4.2-1 .9.3 1.4-1.5-.7-1.5.7.3-1.4-1-.9 1.4-.2Z"/></svg>',
  ascending:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18V6"/><path d="m3.5 9 3.5-3.5L10.5 9"/><path d="M14 8.5h6"/><path d="M14 13h4.5"/><path d="M14 17.5h3"/></svg>',
  descending:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 6v12"/><path d="m3.5 15 3.5 3.5 3.5-3.5"/><path d="M14 8.5h3"/><path d="M14 13h4.5"/><path d="M14 17.5h6"/></svg>'
};

const v357ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf357-icon-btn,.mf357-segmented-btn,.mf357-inline-picker-trigger,.mf354-add-actions .btn,.mf354-quick-switch .btn,.mf345-layout-buttons .btn'))return null;
  return v357ButtonIconNameBase.apply(this,arguments);
};

function v357Text(value){return String(value??'').trim();}
function v357NormalizeSearch(value){return v357Text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function v357IconHtml(name){return V357_INLINE_ICONS[name]||'';}
function v357DispatchChange(el){try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(_){ }}
function v357MapCollectionSort(value){
  const raw=v357Text(value||'updated').toLowerCase();
  if(raw==='title')return 'alphabetic';
  if(raw==='recent')return 'updated';
  return raw||'updated';
}
function v357SelectedText(select){
  if(!select)return '';
  const option=select.options?.[select.selectedIndex]||null;
  return v357Text(option?.textContent||select.value||'Choose');
}
function v357CollectionProgress(collection){
  try{
    if(typeof v274CollectionProgress==='function')return Number(v274CollectionProgress(collection)?.pct)||0;
  }catch(_){ }
  const ids=v287CollectionTitleIds(collection),items=ids.map(v287LibraryItem).filter(Boolean);
  if(!items.length)return 0;
  let total=0,done=0;
  for(const item of items){
    const max=Math.max(Number(item.total)||0,0),progress=Math.max(Number(item.progress)||0,0);
    if(max>0){total+=max;done+=Math.min(progress,max);}else if(v287IsCompleted(item)){total+=1;done+=1;}
  }
  return total>0?(done/total)*100:0;
}

/* Full Collection browse sort parity with the Collections page, while also
   honoring the v354 category + priority filters that scope addable Collections. */
v287CollectionMatches=function(){
  const ui=v287OrderUI(),q=v357NormalizeSearch(ui.v287CollectionSearch);
  const pick=(typeof V354_COLLECTION_PICK==='object'&&V354_COLLECTION_PICK)?V354_COLLECTION_PICK:{category:'all',priority:'all',sort:'updated',dir:'desc'};
  const categoryId=v357Text(pick.category||'all');
  const priority=v357Text(pick.priority||'all').toLowerCase();
  const sort=v357MapCollectionSort(pick.sort||'updated');
  const dir=v357Text(pick.dir||'desc').toLowerCase()==='asc'?1:-1;
  const titleCmp=(a,b)=>v357Text(a?.title||'Untitled Collection').localeCompare(v357Text(b?.title||'Untitled Collection'),undefined,{numeric:true,sensitivity:'base'});
  let rows=v287Collections().slice();
  if(q)rows=rows.filter(c=>v357NormalizeSearch(`${c?.title||''} ${c?.description||''}`).includes(q));
  if(categoryId!=='all')rows=rows.filter(c=>v287CollectionTitleIds(c).some(id=>String(v287LibraryItem(id)?.categoryId||'')===categoryId));
  if(priority!=='all')rows=rows.filter(c=>v287CollectionTitleIds(c).some(id=>String(v287LibraryItem(id)?.priority||'medium').toLowerCase()===priority));
  rows=rows.slice().sort((a,b)=>{
    let d=0;
    if(sort==='alphabetic')d=titleCmp(a,b);
    else if(sort==='added')d=(Number(a?.createdAt)||0)-(Number(b?.createdAt)||0);
    else if(sort==='viewed')d=(Number(a?.lastViewedAt)||0)-(Number(b?.lastViewedAt)||0);
    else if(sort==='count')d=v287CollectionTitleIds(a).length-v287CollectionTitleIds(b).length;
    else if(sort==='progress')d=v357CollectionProgress(a)-v357CollectionProgress(b);
    else d=(Number(a?.updatedAt||a?.modifiedAt)||0)-(Number(b?.updatedAt||b?.modifiedAt)||0);
    return (d||titleCmp(a,b))*dir;
  });
  return rows;
};

const V357_COLLECTION_PICKERS=new WeakMap();
function v357CloseInlinePicker(except=null){
  V357_COLLECTION_PICKERS.forEach?.(()=>{});
  document.querySelectorAll('.mf357-inline-picker').forEach(wrapper=>{
    if(except&&wrapper===except)return;
    const trigger=wrapper.querySelector('.mf357-inline-picker-trigger');
    const pop=wrapper.querySelector('.mf357-inline-picker-popover');
    if(trigger)trigger.setAttribute('aria-expanded','false');
    if(pop)pop.hidden=true;
  });
}
document.addEventListener('click',event=>{
  const picker=event.target?.closest?.('.mf357-inline-picker');
  if(!picker)v357CloseInlinePicker();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')v357CloseInlinePicker();});

function v357EnsureInlineCategoryPicker(select){
  if(!select||select.dataset.mf357InlineReady==='1')return;
  select.dataset.mf357InlineReady='1';
  const label=select.closest('label');
  const wrapper=document.createElement('div');
  wrapper.className='mf357-inline-picker';
  wrapper.innerHTML=`<button type="button" class="mf357-inline-picker-trigger" aria-haspopup="dialog" aria-expanded="false"><span class="mf357-inline-picker-text"></span><span class="mf357-inline-picker-chevron" aria-hidden="true">⌄</span></button><div class="mf357-inline-picker-popover" hidden><div class="mf357-inline-picker-head"><input type="search" class="mf357-inline-picker-search" placeholder="Search categories…" aria-label="Search collection categories"><span class="mf357-inline-picker-count"></span></div><div class="mf357-inline-picker-options" role="listbox" aria-label="Collection categories"></div><div class="mf357-inline-picker-empty" hidden>No matching categories.</div></div>`;
  select.classList.add('mf357-native-hidden');
  select.setAttribute('aria-hidden','true');
  select.tabIndex=-1;
  select.after(wrapper);
  const trigger=wrapper.querySelector('.mf357-inline-picker-trigger');
  const text=wrapper.querySelector('.mf357-inline-picker-text');
  const pop=wrapper.querySelector('.mf357-inline-picker-popover');
  const search=wrapper.querySelector('.mf357-inline-picker-search');
  const optionsBox=wrapper.querySelector('.mf357-inline-picker-options');
  const count=wrapper.querySelector('.mf357-inline-picker-count');
  const empty=wrapper.querySelector('.mf357-inline-picker-empty');

  const options=[...select.options].map(option=>({value:String(option.value||''),label:v357Text(option.textContent||option.value||'Category')}));
  const renderOptions=(query='')=>{
    const q=v357NormalizeSearch(query);
    const visible=options.filter(option=>!q||v357NormalizeSearch(option.label).includes(q));
    optionsBox.innerHTML=visible.map(option=>`<button type="button" class="mf357-inline-option ${option.value===String(select.value||'')?'active':''}" role="option" aria-selected="${option.value===String(select.value||'')?'true':'false'}" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`).join('');
    count.textContent=q?`${visible.length} / ${options.length}`:`${options.length} categories`;
    empty.hidden=visible.length!==0;
    optionsBox.querySelectorAll('[data-value]').forEach(btn=>btn.addEventListener('click',()=>{
      select.value=String(btn.dataset.value||'');
      v357DispatchChange(select);
      sync();
      pop.hidden=true;
      trigger.setAttribute('aria-expanded','false');
      search.value='';
      renderOptions('');
      trigger.focus({preventScroll:true});
    }));
  };
  const sync=()=>{text.textContent=v357SelectedText(select)||'Choose category';renderOptions(search.value||'');};
  trigger.addEventListener('click',()=>{
    const open=trigger.getAttribute('aria-expanded')==='true';
    if(open){v357CloseInlinePicker();return;}
    v357CloseInlinePicker(wrapper);
    trigger.setAttribute('aria-expanded','true');
    pop.hidden=false;
    search.value='';
    sync();
    setTimeout(()=>search.focus({preventScroll:true}),0);
  });
  search.addEventListener('input',()=>renderOptions(search.value||''));
  search.addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      const first=optionsBox.querySelector('[data-value]');
      if(first){event.preventDefault();first.click();}
    }
  });
  select.addEventListener('change',sync);
  sync();
}

function v357EnsureSegmentedDirection(select){
  if(!select||select.dataset.mf357SegmentedReady==='1')return;
  select.dataset.mf357SegmentedReady='1';
  const label=select.closest('label');
  const group=document.createElement('div');
  group.className='mf357-segmented';
  group.innerHTML=`<button type="button" class="mf357-segmented-btn" data-value="asc">${v357IconHtml('ascending')}<span>Ascending</span></button><button type="button" class="mf357-segmented-btn" data-value="desc">${v357IconHtml('descending')}<span>Descending</span></button>`;
  select.classList.add('mf357-native-hidden');
  select.setAttribute('aria-hidden','true');
  select.tabIndex=-1;
  select.after(group);
  const sync=()=>group.querySelectorAll('.mf357-segmented-btn').forEach(btn=>{
    const active=String(btn.dataset.value||'')===String(select.value||'');
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',active?'true':'false');
  });
  group.querySelectorAll('.mf357-segmented-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const value=String(btn.dataset.value||'asc');
    if(String(select.value||'')===value)return;
    select.value=value;
    v357DispatchChange(select);
    sync();
  }));
  select.addEventListener('change',sync);
  sync();
}

function v357EnsureCollectionSortSelect(sheet){
  const select=sheet?.querySelector?.('select[aria-label="Collection sort filter"]');
  if(!select||select.dataset.mf357SortReady==='1')return;
  select.dataset.mf357SortReady='1';
  const current=v357MapCollectionSort(select.value||V354_COLLECTION_PICK?.sort||'updated');
  select.innerHTML=V357_COLLECTION_SORT_OPTIONS.map(([value,label])=>`<option value="${escapeHtml(value)}" ${value===current?'selected':''}>${escapeHtml(label)}</option>`).join('');
  select.value=current;
  if(typeof V354_COLLECTION_PICK==='object'&&V354_COLLECTION_PICK)V354_COLLECTION_PICK.sort=current;
  v357DispatchChange(select);
}

function v357EnsureCollectionDialogTools(sheet){
  if(!sheet||sheet.dataset.kind!=='collection')return;
  v357EnsureCollectionSortSelect(sheet);
  const catSelect=sheet.querySelector('select[aria-label="Collection category filter"]');
  if(catSelect)v357EnsureInlineCategoryPicker(catSelect);
  const dirSelect=sheet.querySelector('select[aria-label="Collection dir filter"]');
  if(dirSelect)v357EnsureSegmentedDirection(dirSelect);
}

function v357DeduplicateDisclosures(sheet){
  ['.mf356-title-filters','.mf356-collection-filters'].forEach(selector=>{
    const nodes=[...sheet.querySelectorAll(selector)];
    nodes.slice(1).forEach(node=>node.remove());
  });
}

function v357MaybeFixTitleFiltersLocation(sheet){
  if(!sheet||sheet.dataset.kind!=='title')return;
  const card=sheet.querySelector('.mf356-browse-card');
  const result=sheet.querySelector('#v138-order-picker-results');
  const filters=sheet.querySelector('.mf356-title-filters');
  if(!card||!result||!filters)return;
  if(result.contains(filters))card.insertBefore(filters,result);
}

function v357UpgradeOrderSheet(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf356-browse-sheet, .mf354-sheet-backdrop .mf355-personal-order-sheet');
  if(!sheet)return;
  if(sheet.dataset.mf356Ready!=='1')try{v356ImproveOrderSheet();}catch(_){ }
  const kind=sheet.dataset.kind;
  if(kind!=='title'&&kind!=='collection')return;
  sheet.classList.add('mf357-browse-sheet',`mf357-${kind}-sheet`);
  v357DeduplicateDisclosures(sheet);
  v357MaybeFixTitleFiltersLocation(sheet);
  if(kind==='collection')v357EnsureCollectionDialogTools(sheet);
}

function v357ApplyIconButton(btn,icon){
  if(!btn||!icon)return;
  const label=v357Text(btn.dataset.mf357Label||btn.textContent||'');
  btn.dataset.mf357Label=label;
  btn.dataset.mf357Icon=icon;
  btn.classList.add('mf357-icon-btn');
  btn.innerHTML=`<span class="mf357-btn-icon" aria-hidden="true">${v357IconHtml(icon)}</span><span class="mf357-btn-label">${escapeHtml(label)}</span>`;
}

function v357DecorateQuickButtons(root=document){
  const scope=root||document;
  const addTitle=scope.querySelector('.mf354-add-actions .btn.btn-primary');
  const addCollection=scope.querySelector('.mf354-add-actions .btn:not(.btn-primary)');
  v357ApplyIconButton(addTitle,'addTitle');
  v357ApplyIconButton(addCollection,'addCollection');
  scope.querySelectorAll('.mf345-layout-buttons .btn, .mf354-quick-switch .btn').forEach(btn=>{
    const text=v357Text(btn.dataset.mf357Label||btn.textContent||'').toLowerCase();
    if(text==='lists')v357ApplyIconButton(btn,'lists');
    else if(text==='tabs')v357ApplyIconButton(btn,'tabs');
    else if(text.includes('category display'))v357ApplyIconButton(btn,'categoryDisplay');
    else if(text.includes('queue tools'))v357ApplyIconButton(btn,'queueTools');
  });
}

function v357RefreshUiEnhancements(){
  try{v357DecorateQuickButtons(document);}catch(_){ }
  try{v357UpgradeOrderSheet();}catch(_){ }
}

const v357RenderBase=render;
render=function(){
  const out=v357RenderBase.apply(this,arguments);
  try{requestAnimationFrame(v357RefreshUiEnhancements);}catch(_){ }
  return out;
};
const v357RenderViewBase=renderView;
renderView=function(){
  const out=v357RenderViewBase.apply(this,arguments);
  try{requestAnimationFrame(v357RefreshUiEnhancements);}catch(_){ }
  return out;
};
const v357RefreshTabsBase=v345RefreshTabs;
v345RefreshTabs=function(){
  const changed=v357RefreshTabsBase.apply(this,arguments);
  if(changed)try{requestAnimationFrame(v357RefreshUiEnhancements);}catch(_){ }
  return changed;
};
const v357OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(){
  const out=v357OpenSheetBase.apply(this,arguments);
  v357RefreshUiEnhancements();
  return out;
};

try{requestAnimationFrame(v357RefreshUiEnhancements);}catch(_){ }
MediaFlowRuntime.version=V357_RELEASE;
window.MediaFlowV357={
  version:357,
  features:[
    'Wider desktop Personal Order title and Collection dialogs',
    'Searchable Collection category filter and segmented direction buttons',
    'Collection browser sort parity with Collections page',
    'Aligned category tab icons and meaningful quick-workspace button icons'
  ]
};
