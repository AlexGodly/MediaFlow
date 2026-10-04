/* ============================================================
   MediaFlow v230 — Choice + Filter Layout Control Center
   ------------------------------------------------------------
   Adds one organized Settings section for the six reusable Library choice /
   filter surfaces:
     - Set Category
     - Set Status
     - Set Priority
     - Category Filter
     - Status Filter
     - Priority Filter

   Every surface gets explicit ordering + visibility controls. Category-based
   surfaces may either keep their own independent configuration, follow the
   main Categories settings, or follow the Dynamic category-row settings.
   Status/Priority filters may keep their own settings or follow their matching
   Set popup so the filter language can stay synchronized without duplicating
   configuration.
   ============================================================ */

const V230_RUNTIME_VERSION=230;
const V230_STATUS_IDS=['planned','active','paused','completed','dropped'];
const V230_PRIORITY_IDS=['low','medium','high'];
const V230_PRIORITY_FILTER_DEFAULT=['high','medium','low'];
function v230DefaultStatusFilterOrder(){return ['active','paused','completed','dropped','planned'];}
const V230_SURFACES=['setCategory','setStatus','setPriority','categoryFilter','statusFilter','priorityFilter'];
let V230_DRAG={surface:'',id:''};

function v230Clone(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}
function v230UniqueIds(values,valid){
  const allowed=valid?new Set(valid.map(String)):null;
  const seen=new Set(),out=[];
  for(const raw of (Array.isArray(values)?values:[])){
    const id=String(raw||'');
    if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
    seen.add(id);out.push(id);
  }
  return out;
}
function v230CategoryIds(){
  return (S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean);
}
function v230DefaultLayout(){
  const cats=v230CategoryIds();
  return {
    modifiedAt:0,
    setCategory:{source:'custom',order:cats.slice(),hidden:[]},
    setStatus:{source:'custom',order:V230_STATUS_IDS.slice(),hidden:[]},
    setPriority:{source:'custom',order:V230_PRIORITY_IDS.slice(),hidden:[]},
    categoryFilter:{source:'custom',order:cats.slice(),hidden:[]},
    statusFilter:{source:'custom',order:v230DefaultStatusFilterOrder(),hidden:[]},
    priorityFilter:{source:'custom',order:V230_PRIORITY_FILTER_DEFAULT.slice(),hidden:[]}
  };
}
DEFAULT_SETTINGS.v230ChoiceLayout=DEFAULT_SETTINGS.v230ChoiceLayout||v230DefaultLayout();

function v230NormalizeSurface(raw,surface){
  const isCategory=surface==='setCategory'||surface==='categoryFilter';
  const isStatus=surface==='setStatus'||surface==='statusFilter';
  const valid=isCategory?v230CategoryIds():(isStatus?V230_STATUS_IDS:V230_PRIORITY_IDS);
  const def=v230DefaultLayout()[surface];
  let source=String(raw?.source||def.source||'custom');
  const allowedSources=isCategory
    ?new Set(['custom','categories','dynamic'])
    :(surface==='statusFilter'?new Set(['custom','setStatus']):(surface==='priorityFilter'?new Set(['custom','setPriority']):new Set(['custom'])));
  if(!allowedSources.has(source))source='custom';
  const order=v230UniqueIds(raw?.order,valid);
  for(const id of valid)if(!order.includes(String(id)))order.push(String(id));
  const hidden=v230UniqueIds(raw?.hidden,valid);
  return {source,order,hidden};
}
function v230EnsureChoiceLayout(settings=S.settings||DEFAULT_SETTINGS){
  settings.v230ChoiceLayout=settings.v230ChoiceLayout&&typeof settings.v230ChoiceLayout==='object'
    ?settings.v230ChoiceLayout:{};
  const raw=settings.v230ChoiceLayout;
  const out={modifiedAt:Number(raw.modifiedAt)||0};
  for(const surface of V230_SURFACES)out[surface]=v230NormalizeSurface(raw[surface],surface);
  settings.v230ChoiceLayout=out;
  return out;
}
v230EnsureChoiceLayout(DEFAULT_SETTINGS);
v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);

function v230MainCategoryState(){
  const order=v230CategoryIds();
  const hidden=(S.categories||[]).filter(c=>c?.enabled===false).map(c=>String(c.id));
  return {order,hidden};
}
function v230DynamicCategoryState(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const order=(typeof v228EffectiveDynamicCategoryOrder==='function'
    ?v228EffectiveDynamicCategoryOrder(cfg)
    :(cfg.categoryOrder||[])).map(String);
  const hidden=(cfg.hiddenCategoryIds||[]).map(String);
  return {order,hidden};
}
function v230ResolvedSurface(surface,seen=new Set()){
  const cfg=v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);
  const own=cfg[surface]||v230DefaultLayout()[surface];
  if(seen.has(surface))return {source:'custom',order:own.order.slice(),hidden:own.hidden.slice(),inherited:false};
  seen.add(surface);
  if((surface==='setCategory'||surface==='categoryFilter')&&own.source==='categories'){
    const st=v230MainCategoryState();
    return {source:'categories',order:st.order,hidden:st.hidden,inherited:true};
  }
  if((surface==='setCategory'||surface==='categoryFilter')&&own.source==='dynamic'){
    const st=v230DynamicCategoryState();
    return {source:'dynamic',order:st.order,hidden:st.hidden,inherited:true};
  }
  if(surface==='statusFilter'&&own.source==='setStatus'){
    const st=v230ResolvedSurface('setStatus',seen);
    return {source:'setStatus',order:st.order.slice(),hidden:st.hidden.slice(),inherited:true};
  }
  if(surface==='priorityFilter'&&own.source==='setPriority'){
    const st=v230ResolvedSurface('setPriority',seen);
    return {source:'setPriority',order:st.order.slice(),hidden:st.hidden.slice(),inherited:true};
  }
  return {source:'custom',order:own.order.slice(),hidden:own.hidden.slice(),inherited:false};
}
function v230VisibleIds(surface){
  const st=v230ResolvedSurface(surface);
  const hidden=new Set(st.hidden.map(String));
  return st.order.filter(id=>!hidden.has(String(id)));
}
function v230Touch(){
  const cfg=v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);
  cfg.modifiedAt=Date.now();
}
function v230PersistAndRender(message){
  v230Touch();
  persistSettings();
  render();
  if(message)showToast(message);
}
function v230SurfaceConfig(surface){
  return v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS)[surface];
}
function v230SetSource(surface,value){
  if(!V230_SURFACES.includes(surface))return;
  const cfg=v230SurfaceConfig(surface);
  const normalized=v230NormalizeSurface({source:value,order:cfg.order,hidden:cfg.hidden},surface);
  cfg.source=normalized.source;
  v230PersistAndRender(`${v230SurfaceTitle(surface)} now uses ${v230SourceLabel(cfg.source).toLowerCase()}.`);
}
function v230ToggleVisible(surface,id,visible){
  const cfg=v230SurfaceConfig(surface);
  if(cfg.source!=='custom')return;
  const set=new Set(cfg.hidden.map(String));
  if(visible)set.delete(String(id));else set.add(String(id));
  cfg.hidden=[...set];
  v230SanitizeActiveFilters(surface);
  v230PersistAndRender();
}
function v230Move(surface,id,delta){
  const cfg=v230SurfaceConfig(surface);
  if(cfg.source!=='custom')return;
  const order=cfg.order.map(String);const from=order.indexOf(String(id));
  if(from<0)return;
  const to=Math.max(0,Math.min(order.length-1,from+(Number(delta)||0)));
  if(from===to)return;
  const [moved]=order.splice(from,1);order.splice(to,0,moved);cfg.order=order;
  v230PersistAndRender();
}
function v230SetPosition(surface,id,value){
  const cfg=v230SurfaceConfig(surface);
  if(cfg.source!=='custom')return;
  const order=cfg.order.map(String);const from=order.indexOf(String(id));
  if(from<0)return;
  const to=Math.max(0,Math.min(order.length-1,(Number(value)||1)-1));
  if(from===to)return;
  const [moved]=order.splice(from,1);order.splice(to,0,moved);cfg.order=order;
  v230PersistAndRender();
}
function v230SetAllVisible(surface,visible){
  const cfg=v230SurfaceConfig(surface);
  if(cfg.source!=='custom')return;
  cfg.hidden=visible?[]:cfg.order.map(String);
  v230SanitizeActiveFilters(surface);
  v230PersistAndRender();
}
function v230DragStart(event,surface,id){
  const cfg=v230SurfaceConfig(surface);
  if(cfg.source!=='custom'){event?.preventDefault?.();return;}
  V230_DRAG={surface,id:String(id)};
  event?.currentTarget?.closest?.('.v230-layout-row')?.classList.add('v230-dragging');
  try{event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(id));}catch(_){ }
}
function v230DragEnd(event){
  event?.currentTarget?.closest?.('.v230-layout-row')?.classList.remove('v230-dragging');
  document.querySelectorAll('.v230-layout-row.v230-drop-target').forEach(x=>x.classList.remove('v230-drop-target'));
  V230_DRAG={surface:'',id:''};
}
function v230DragOver(event,surface){
  if(v230SurfaceConfig(surface).source!=='custom')return;
  event?.preventDefault?.();
  event?.currentTarget?.classList?.add('v230-drop-target');
}
function v230DragLeave(event){event?.currentTarget?.classList?.remove('v230-drop-target');}
function v230Drop(event,surface,target){
  event?.preventDefault?.();event?.currentTarget?.classList?.remove('v230-drop-target');
  if(v230SurfaceConfig(surface).source!=='custom')return;
  let source=V230_DRAG.surface===surface?V230_DRAG.id:'';
  try{source=event.dataTransfer.getData('text/plain')||source;}catch(_){ }
  if(!source||source===String(target))return;
  const cfg=v230SurfaceConfig(surface);const order=cfg.order.map(String);
  const from=order.indexOf(String(source)),to=order.indexOf(String(target));
  if(from<0||to<0)return;
  const [moved]=order.splice(from,1);order.splice(to,0,moved);cfg.order=order;
  v230PersistAndRender();
}

function v230SurfaceTitle(surface){
  return ({
    setCategory:'Set Category',setStatus:'Set Status',setPriority:'Set Priority',
    categoryFilter:'Category Filter',statusFilter:'Status Filter',priorityFilter:'Priority Filter'
  })[surface]||surface;
}
function v230SourceLabel(source){
  return ({custom:'Own settings',categories:'Follow Category Settings',dynamic:'Follow Dynamic Category Row',setStatus:'Follow Set Status',setPriority:'Follow Set Priority'})[source]||source;
}
function v230SourceOptions(surface,current){
  let values=[['custom','Own settings']];
  if(surface==='setCategory'||surface==='categoryFilter')values.push(['categories','Follow Category Settings'],['dynamic','Follow Dynamic Category Row']);
  if(surface==='statusFilter')values.push(['setStatus','Follow Set Status']);
  if(surface==='priorityFilter')values.push(['setPriority','Follow Set Priority']);
  return values.map(([id,label])=>`<option value="${id}" ${current===id?'selected':''}>${label}</option>`).join('');
}
function v230StatusIcon(id){return V225_BUTTON_ICONS[v229StatusIconName(id)]||V225_BUTTON_ICONS.status;}
function v230PriorityIcon(id){return V225_BUTTON_ICONS[id==='low'?'priorityLow':id==='high'?'priorityHigh':'priorityMedium'];}
function v230ItemMeta(surface,id){
  if(surface==='setCategory'||surface==='categoryFilter'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(id));
    return {label:cat?.name||id,icon:cat?v144CategoryIconHtml(cat):V225_BUTTON_ICONS.category};
  }
  if(surface==='setStatus'||surface==='statusFilter')return {label:v199StatusLabel(id),icon:v230StatusIcon(id)};
  return {label:`${String(id).charAt(0).toUpperCase()+String(id).slice(1)} Priority`,icon:v230PriorityIcon(id)};
}
function v230InheritedHint(surface,source){
  if(source==='categories')return 'Order and visibility are inherited from Settings → Categories.';
  if(source==='dynamic')return 'Order and visibility are inherited from Library Experience → Dynamic Category Row.';
  if(source==='setStatus')return 'Order and visibility are inherited from Set Status.';
  if(source==='setPriority')return 'Order and visibility are inherited from Set Priority.';
  return 'Drag with ☰, use the number or arrows to reorder, and show/hide individual choices.';
}
function v230SurfaceEditor(surface){
  const own=v230SurfaceConfig(surface);const resolved=v230ResolvedSurface(surface);
  const custom=own.source==='custom';const hidden=new Set(resolved.hidden.map(String));
  const rows=resolved.order.map((id,index)=>{
    const meta=v230ItemMeta(surface,id);const visible=!hidden.has(String(id));
    return `<div class="v230-layout-row ${custom?'':'v230-layout-row-inherited'}" data-v230-surface="${surface}" data-v230-id="${escapeHtml(String(id))}" ${custom?`ondragover="App.v230DragOver(event,'${surface}')" ondragleave="App.v230DragLeave(event)" ondrop="App.v230Drop(event,'${surface}','${escapeHtml(String(id))}')"`:''}>
      <div class="v230-layout-copy"><span class="v230-layout-identity">${meta.icon}</span><div><b>${escapeHtml(meta.label)}</b><small>${custom?`Position ${index+1} · ${visible?'shown':'hidden'}`:`Inherited position ${index+1} · ${visible?'shown':'hidden'}`}</small></div></div>
      <button type="button" class="btn btn-sm btn-ghost v230-drag-handle" ${custom?'draggable="true"':'disabled'} title="${custom?'Drag to reorder':'Inherited order'}" aria-label="${custom?'Drag to reorder':'Inherited order'}" ${custom?`ondragstart="App.v230DragStart(event,'${surface}','${escapeHtml(String(id))}')" ondragend="App.v230DragEnd(event)"`:''}>☰</button>
      <input class="v230-position" type="number" min="1" max="${resolved.order.length}" value="${index+1}" ${custom?'':'disabled'} aria-label="${escapeHtml(meta.label)} position" onchange="App.v230SetPosition('${surface}','${escapeHtml(String(id))}',this.value)">
      <div class="v230-order-buttons"><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===0?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',-1)">↑</button><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===resolved.order.length-1?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',1)">↓</button></div>
      <button type="button" class="toggle ${visible?'on':''}" ${custom?'':'disabled'} aria-label="${visible?'Hide':'Show'} ${escapeHtml(meta.label)}" onclick="App.v230ToggleVisible('${surface}','${escapeHtml(String(id))}',${visible?'false':'true'})"></button>
    </div>`;
  }).join('');
  return `<div class="v230-surface-card">
    <div class="v230-surface-head"><div><b>${v230SurfaceTitle(surface)}</b><div class="hint">${v230InheritedHint(surface,own.source)}</div></div><select aria-label="${v230SurfaceTitle(surface)} layout source" onchange="App.v230SetSource('${surface}',this.value)">${v230SourceOptions(surface,own.source)}</select></div>
    ${custom?`<div class="v230-surface-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',true)">Show all</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',false)">Hide all</button></div>`:`<div class="v230-follow-summary">${v230InheritedHint(surface,own.source)}</div>`}
    <div class="v230-layout-list">${rows}</div>
  </div>`;
}
function v230SettingsHtml(){
  v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);
  return `<div class="section-label">CHOICE & FILTER LAYOUT</div><div class="card v230-settings-card">
    <div class="v230-settings-intro"><b>Popup & filter ordering</b><div class="hint">Control the order and visibility of Set Category, Set Status, Set Priority and their filter equivalents. Category-based controls can inherit the main Category settings or the Dynamic Category Row instead of maintaining duplicate layouts.</div></div>
    <div class="v230-settings-grid">${V230_SURFACES.map(v230SurfaceEditor).join('')}</div>
  </div>`;
}
const v230DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  return v230DynamicLibrarySettingsHtmlBase.apply(this,arguments)+v230SettingsHtml();
};

/* Keep the organized v221 Settings index in the intended Library position. */
try{
  const list=V221_SETTINGS_SECTION_ORDER?.Library;
  if(Array.isArray(list)&&!list.includes('CHOICE & FILTER LAYOUT')){
    const at=list.indexOf('LIBRARY EXPERIENCE');list.splice(at>=0?at+1:1,0,'CHOICE & FILTER LAYOUT');
  }
}catch(_){ }
const v230SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  if(String(title||'').trim().toUpperCase()==='CHOICE & FILTER LAYOUT')return {kind:'paths',paths:['v230ChoiceLayout']};
  return v230SectionResetPlanBase(title);
};
const v230ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  const m=code.match(/App\.v230SetSource\('([^']+)'/);
  if(m)return {type:'path',path:`v230ChoiceLayout.${m[1]}.source`};
  return v230ResetDescriptorBase(el);
};

/* Settings sidebar semantic icon for the new section. */
const v230ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  if(el?.classList?.contains('v221-settings-nav-item')&&t==='choice & filter layout')return 'filter';
  if(el?.matches?.('.v230-drag-handle'))return null;
  return v230ButtonIconNameBase(el);
};

/* ---------- Modal ordering / visibility ---------------------- */
priorityModalHtml=function(d){
  const current=String(d?.priority||'medium');
  const desc={low:'A lower-priority title. The scheduler will generally give it less weight.',medium:'The normal priority level used by default.',high:'A title you want the scheduler to pay more attention to.'};
  const options=v230VisibleIds('setPriority');
  return `<div class="priority-modal v230-priority-modal"><div class="modal-title">Set priority</div><div class="v229-choice-modal-intro">Choose the priority for <b>${escapeHtml(d?.title||'this title')}</b>.</div><div class="choice-list">${options.map(id=>`<button type="button" class="priority-choice ${current===id?'selected':''}" onclick="App.setPriorityChoice('${escapeHtml(d.id)}','${id}')"><span class="priority-choice-icon">${v230PriorityIcon(id)}</span><span class="v229-choice-copy"><b>${escapeHtml(id.charAt(0).toUpperCase()+id.slice(1))}</b><small>${desc[id]}</small></span><span class="priority-choice-check">${current===id?'✓':''}</span></button>`).join('')||'<div class="v230-empty-choice">All priority choices are hidden in Settings.</div>'}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
};

libraryStatusModalHtml=function(d){
  const current=String(d?.status||'planned');
  const desc={planned:'Planned for later, but not started yet.',active:'Currently being watched or read.',paused:'Temporarily set aside without abandoning it.',completed:'Finished and kept as part of your history.',dropped:'Abandoned and excluded from recommendations.'};
  const options=v230VisibleIds('setStatus');
  return `<div class="priority-modal v229-status-modal"><div class="modal-title">Set status</div><div class="v229-choice-modal-intro">Choose the status for <b>${escapeHtml(d?.title||'this title')}</b>.</div><div class="choice-list v229-status-choice-list">${options.map(id=>`<button type="button" class="status-choice ${current===id?'selected':''}" onclick="App.setLibraryStatus('${escapeHtml(d.id)}','${id}')"><span class="choice-icon v229-status-choice-icon" aria-hidden="true">${v230StatusIcon(id)}</span><span class="v229-choice-copy"><b>${escapeHtml(v199StatusLabel(id))}</b><small>${desc[id]}</small></span><span class="choice-check">${current===id?'✓':''}</span></button>`).join('')||'<div class="v230-empty-choice">All status choices are hidden in Settings.</div>'}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
};

v229CategoryModalPageCount=function(){return Math.max(1,Math.ceil(v230VisibleIds('setCategory').length/V229_CATEGORY_MODAL_PAGE_SIZE));};
libraryCategoryModalHtml=function(d){
  const current=String(d?.categoryId||'');
  const byId=new Map((S.categories||[]).map(c=>[String(c?.id||''),c]));
  const cats=v230VisibleIds('setCategory').map(id=>byId.get(String(id))).filter(Boolean);
  const pageCount=Math.max(1,Math.ceil(cats.length/V229_CATEGORY_MODAL_PAGE_SIZE));
  const currentIndex=Math.max(0,cats.findIndex(c=>String(c?.id||'')===current));
  const defaultPage=Math.floor(currentIndex/V229_CATEGORY_MODAL_PAGE_SIZE);
  const requested=Number.isFinite(Number(d?.categoryPage))?Number(d.categoryPage):defaultPage;
  const page=Math.max(0,Math.min(pageCount-1,requested));
  const start=page*V229_CATEGORY_MODAL_PAGE_SIZE;const visible=cats.slice(start,start+V229_CATEGORY_MODAL_PAGE_SIZE);const twoColumn=visible.length>7;
  const choices=visible.length?visible.map(c=>{
    const disabled=c?.enabled===false,catId=String(c?.id||''),selected=current===catId,unit=escapeHtml(unitLabel(c?.unit,c?.target)),mins=Number(c?.minutesPerUnit)||0;
    return `<button type="button" class="category-choice v229-category-choice ${selected?'selected':''}" onclick="App.setLibraryCategory('${escapeHtml(String(d?.id||''))}','${escapeHtml(catId)}')"><span class="choice-icon v229-category-choice-icon" aria-hidden="true">${v229CategoryChoiceIcon(c)}</span><span class="v229-choice-copy"><b>${escapeHtml(c?.name||'Unnamed category')}</b><small>${unit} · ${mins} min/unit${disabled?' · Disabled':''}</small></span><span class="choice-check">${selected?'✓':''}</span></button>`;
  }).join(''):'<div class="v229-category-empty">All category choices are hidden in Settings.</div>';
  const pagination=cats.length>V229_CATEGORY_MODAL_PAGE_SIZE?`<div class="v229-category-pagination" aria-label="Category pages"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v229SetLibraryCategoryPage(${page-1})" ${page<=0?'disabled':''}>Previous</button><span class="v229-category-page-label">Page <b>${page+1}</b> of <b>${pageCount}</b> · ${cats.length} categories</span><button type="button" class="btn btn-sm btn-ghost" onclick="App.v229SetLibraryCategoryPage(${page+1})" ${page>=pageCount-1?'disabled':''}>Next</button></div>`:'';
  return `<div class="priority-modal v229-category-modal"><div class="modal-title">Set category</div><div class="v229-choice-modal-intro">Choose the category for <b>${escapeHtml(d?.title||'this title')}</b>. The category controls its rotation, units, and scheduler behavior.</div><div class="choice-list v229-category-choice-list ${twoColumn?'v229-category-choice-list-two':'v229-category-choice-list-one'}">${choices}</div>${pagination}<div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
};

/* ---------- Filter ordering / visibility --------------------- */
function v230ReorderSelect(select,surface){
  if(!select||select.dataset.v230LayoutApplying==='1')return;
  const ids=v230ResolvedSurface(surface).order.map(String);const hidden=new Set(v230ResolvedSurface(surface).hidden.map(String));
  const byValue=new Map([...select.options].map(o=>[String(o.value),o]));
  const first=[...select.options].filter(o=>!ids.includes(String(o.value)));
  select.dataset.v230LayoutApplying='1';
  try{
    for(const option of first)select.appendChild(option);
    for(const id of ids){const o=byValue.get(id);if(!o)continue;o.hidden=hidden.has(id);select.appendChild(o);}
  }finally{delete select.dataset.v230LayoutApplying;}
}
function v230FilterSelectSurface(select){
  const texts=[...select.options].map(o=>String(o.textContent||'').trim().toLowerCase());
  if(texts.some(t=>t==='all statuses'))return 'statusFilter';
  if(texts.some(t=>t==='all priorities'))return 'priorityFilter';
  if(texts.some(t=>t==='all categories'))return 'categoryFilter';
  return '';
}
function v230CategoryIdFromOptionLabel(label){
  const input=label?.querySelector?.('input');if(!input)return '';
  const data=input.dataset?.v89Category;if(data)return String(data);
  const code=String(input.getAttribute('onchange')||'');
  const m=code.match(/(?:ToggleCategory|toggleCategory)\('([^']+)'/i)||code.match(/\('([^']+)'\s*,\s*this\.checked/);
  return m?String(m[1]):'';
}
function v230ApplyCategoryPanel(details){
  const panel=details?.querySelector?.('.v66-cat-panel');if(!panel)return;
  const rows=[...panel.querySelectorAll(':scope > .v66-cat-option')];if(!rows.length)return;
  const st=v230ResolvedSurface('categoryFilter');const hidden=new Set(st.hidden.map(String));
  const map=new Map(rows.map(row=>[v230CategoryIdFromOptionLabel(row),row]).filter(x=>x[0]));
  for(const id of st.order){const row=map.get(String(id));if(!row)continue;row.hidden=hidden.has(String(id));panel.appendChild(row);}
}
function v230ApplyDynamicStatusRow(root=document){
  const rows=[...(root.querySelectorAll?.('.v181-dynamic-row')||[])];
  const row=rows.find(r=>String(r.querySelector('.v181-dynamic-row-label')?.textContent||'').trim().toLowerCase()==='status');
  if(!row)return;
  const st=v230ResolvedSurface('statusFilter');const hidden=new Set(st.hidden.map(String));
  const buttons=[...row.querySelectorAll('button')];
  const map=new Map();
  for(const btn of buttons){
    const code=String(btn.getAttribute('onclick')||'');const m=code.match(/v181SelectDynamicStatus\('([^']+)'/);if(m)map.set(m[1],btn);
  }
  for(const id of st.order){const btn=map.get(String(id));if(!btn)continue;btn.hidden=hidden.has(String(id));row.appendChild(btn);}
}
function v230ApplyFilterLayouts(root=document){
  const selects=[];
  if(root?.matches?.('select'))selects.push(root);
  root?.querySelectorAll?.('select').forEach(s=>selects.push(s));
  for(const select of selects){const surface=v230FilterSelectSurface(select);if(surface)v230ReorderSelect(select,surface);}
  const details=[];if(root?.matches?.('.v66-cat-filter'))details.push(root);root?.querySelectorAll?.('.v66-cat-filter').forEach(x=>details.push(x));details.forEach(v230ApplyCategoryPanel);
  v230ApplyDynamicStatusRow(root===document?document:document);
}
function v230SanitizeActiveFilters(surface){
  if(surface!=='statusFilter')return;
  try{
    const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);const visible=v230VisibleIds('statusFilter');
    if(visible.length&&!visible.includes(String(cfg.activeStatus||'')))cfg.activeStatus=visible[0];
  }catch(_){ }
}
let V230_FILTER_FRAME=0;
function v230ScheduleFilterLayouts(){
  if(V230_FILTER_FRAME)return;
  V230_FILTER_FRAME=requestAnimationFrame(()=>{V230_FILTER_FRAME=0;v230ApplyFilterLayouts(document);try{v226EnhanceDropdowns(document);}catch(_){ }try{v226RefreshSemanticButtonIcons(document);}catch(_){ }});
}
const V230_FILTER_OBSERVER=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes?.length))v230ScheduleFilterLayouts();});
V230_FILTER_OBSERVER.observe(document.body,{childList:true,subtree:true});
requestAnimationFrame(v230ScheduleFilterLayouts);

/* Keep Settings Preset imports/current state normalization aware of v230. */
const v230NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){const next=v230NormalizeImportedSettingsBase(raw);v230EnsureChoiceLayout(next);return next;};

Object.assign(App,{
  v230SetSource,v230ToggleVisible,v230Move,v230SetPosition,v230SetAllVisible,
  v230DragStart,v230DragEnd,v230DragOver,v230DragLeave,v230Drop,
  v230ApplyFilterLayouts,v230EnsureChoiceLayout
});
MediaFlowRuntime.version=V230_RUNTIME_VERSION;
