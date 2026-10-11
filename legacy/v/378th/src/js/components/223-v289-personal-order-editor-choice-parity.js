/* ============================================================
   MediaFlow v289 — Personal Order cover sizing + editor choice parity
   ------------------------------------------------------------
   - Personal Order gets independent Collection-cover and expanded-title-cover
     size controls, persisted with the v288 queue-view state.
   - Add/Edit Title Category / Status / Priority choices follow the canonical
     Set Category / Set Status / Set Priority Popup & Filter Ordering settings.
   - Title Details quick editors use the same ordering contract.
   - Category editing uses a rich icon-aware selector so configured image/URL
     category icons render directly instead of the native-select image emoji.
   ============================================================ */
const V289_RUNTIME_VERSION=289;

/* ---------- Personal Order Collection cover sizing -------------------- */
function v289ClampCoverScale(value,fallback=100){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return Math.max(10,Number(fallback)||100);
  return Math.max(10,Math.min(400,Math.round(n*100)/100));
}
const v289NormalizeQueueViewBase=v288NormalizeQueueView;
v288NormalizeQueueView=function(raw){
  const out=v289NormalizeQueueViewBase.apply(this,arguments),x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  out.collectionCoverScale=v289ClampCoverScale(x.collectionCoverScale,100);
  out.collectionTitleCoverScale=v289ClampCoverScale(x.collectionTitleCoverScale,100);
  return out;
};

function v289ApplyQueueCoverVars(view=v288EnsureQueueView()){
  const root=document.documentElement;
  const collection=v289ClampCoverScale(view?.collectionCoverScale,100)/100;
  const inner=v289ClampCoverScale(view?.collectionTitleCoverScale,100)/100;
  const set=(name,value)=>root.style.setProperty(name,`${Math.round(value*100)/100}px`);
  set('--mf289-collection-cover-w',58*collection);
  set('--mf289-collection-cover-h',78*collection);
  set('--mf289-picker-cover-w',48*collection);
  set('--mf289-picker-cover-h',64*collection);
  set('--mf289-inner-cover-w',42*inner);
  set('--mf289-inner-cover-h',58*inner);
}
function v289PreviewQueueCoverScale(kind,value){
  const v=v288EnsureQueueView(),safe=kind==='collectionTitleCoverScale'?'collectionTitleCoverScale':'collectionCoverScale';
  const next=v289ClampCoverScale(value,v[safe]||100),preview=Object.assign({},v,{[safe]:next});
  v289ApplyQueueCoverVars(preview);
  const range=document.getElementById(`mf289-${safe}-range`),number=document.getElementById(`mf289-${safe}-number`);
  if(range&&document.activeElement!==range)range.value=String(Math.min(400,next));
  if(number&&document.activeElement!==number)number.value=String(next);
}
async function v289SetQueueCoverScale(kind,value){
  const p=v287EnsureOrderExtensions(),v=v288EnsureQueueView(),safe=kind==='collectionTitleCoverScale'?'collectionTitleCoverScale':'collectionCoverScale';
  v[safe]=v289ClampCoverScale(value,v[safe]||100);p.v288QueueView=v;p.modifiedAt=Date.now();
  v289ApplyQueueCoverVars(v);await saveState();
}
function v289QueueCoverControlHtml(kind,label,help){
  const v=v288EnsureQueueView(),value=v289ClampCoverScale(v[kind],100);
  return `<label class="mf289-cover-control"><span><b>${escapeHtml(label)}</b><small>${escapeHtml(help)}</small></span><span class="mf289-cover-inputs"><input id="mf289-${kind}-range" type="range" min="25" max="400" step="5" value="${Math.min(400,value)}" oninput="App.v289PreviewQueueCoverScale('${kind}',this.value)" onchange="App.v289SetQueueCoverScale('${kind}',this.value)" aria-label="${escapeHtml(label)}"><input id="mf289-${kind}-number" type="number" min="10" max="400" step="5" value="${value}" oninput="App.v289PreviewQueueCoverScale('${kind}',this.value)" onchange="App.v289SetQueueCoverScale('${kind}',this.value)" aria-label="${escapeHtml(label)} percentage"><em>%</em></span></label>`;
}

v288QueueControlsHtml=function(){
  const v=v288EnsureQueueView();
  return `<div class="card mf288-queue-controls mf289-queue-controls">
    <div class="mf288-queue-controls-copy"><span class="section-label">QUEUE DISPLAY</span><b>Personal Order sections</b><small>Choose which queue sections are visible, which appears first, and how large Collection artwork should be. These choices are remembered.</small></div>
    <div class="mf288-queue-control-groups mf289-queue-control-groups">
      <div class="mf288-control-group"><span>First section</span><div class="mf288-segmented"><button class="btn btn-sm ${v.sectionOrder==='regular-first'?'btn-primary':'btn-ghost'}" type="button" data-v225-icon="category" onclick="App.v288SetQueueView('sectionOrder','regular-first')">Category / title queues</button><button class="btn btn-sm ${v.sectionOrder==='collections-first'?'btn-primary':'btn-ghost'}" type="button" data-v225-icon="folder" onclick="App.v288SetQueueView('sectionOrder','collections-first')">Collection queues</button></div></div>
      <div class="mf288-control-group"><span>Visibility</span><div class="mf288-checks"><label><input type="checkbox" ${v.showRegularQueues?'checked':''} onchange="App.v288SetQueueView('showRegularQueues',this.checked)"> Category / title queues</label><label><input type="checkbox" ${v.showCollectionQueues?'checked':''} onchange="App.v288SetQueueView('showCollectionQueues',this.checked)"> Collection queues</label></div></div>
      <div class="mf288-control-group"><span>By Category</span><label class="mf288-inline-toggle"><input type="checkbox" ${v.showCollectionsInRegularQueues?'checked':''} onchange="App.v288SetQueueView('showCollectionsInRegularQueues',this.checked)"> Also show assigned Collections inside category queues</label></div>
      <div class="mf288-control-group mf289-cover-group"><span>Cover sizes</span>${v289QueueCoverControlHtml('collectionCoverScale','Collection covers','Assigned Collections and Add Collection results.')}${v289QueueCoverControlHtml('collectionTitleCoverScale','Titles inside Collections','Covers in expanded Collection title lists.')}</div>
    </div>
  </div>`;
};

const v289RenderOrderBase=renderOrder;
renderOrder=function(){v289ApplyQueueCoverVars();return v289RenderOrderBase.apply(this,arguments);};

/* ---------- Add/Edit Title + Title Details choice ordering ------------ */
function v289ChoiceIds(surface,current=''){
  const st=v230ResolvedSurface(surface),hidden=new Set((st.hidden||[]).map(String)),cur=String(current||'');
  return (st.order||[]).map(String).filter(id=>!hidden.has(id)||id===cur);
}
function v289CategoryChoiceModel(current=''){
  const byId=new Map((S.categories||[]).map(c=>[String(c?.id||''),c]));
  const ids=v289ChoiceIds('setCategory',current).filter(id=>byId.has(id));
  let selected=String(current||'');if(!byId.has(selected)||!ids.includes(selected))selected=ids[0]||String(current||'');
  if(selected&&byId.has(selected)&&!ids.includes(selected))ids.unshift(selected);
  return {ids,categories:ids.map(id=>byId.get(id)).filter(Boolean),selected,selectedCategory:byId.get(selected)||null};
}
function v289RichCategorySelectHtml(inputId,current,context='library'){
  const model=v289CategoryChoiceModel(current),selected=model.selectedCategory,detailsId=`mf289-category-${context}`;
  const label=selected?selected.name:'Choose category';const icon=selected?v144CategoryIconHtml(selected):V225_BUTTON_ICONS.category;
  const choices=model.categories.length?model.categories.map(cat=>{
    const id=String(cat.id||''),isSelected=id===model.selected,hidden=v230ResolvedSurface('setCategory').hidden.map(String).includes(id);
    return `<button type="button" class="mf289-rich-option ${isSelected?'selected':''}" data-mf289-cat-id="${escapeHtml(id)}" onclick="App.v289ChooseCategory('${escapeHtml(inputId)}','${escapeHtml(detailsId)}','${escapeHtml(id)}')"><span class="mf289-rich-icon">${v144CategoryIconHtml(cat)}</span><span class="mf289-rich-copy"><b>${escapeHtml(cat.name||'Unnamed category')}</b><small>${escapeHtml(unitLabel(cat.unit,cat.target))} · ${Number(cat.minutesPerUnit)||0} min/unit${hidden?' · current hidden choice':''}</small></span><span class="mf289-rich-check">${isSelected?'✓':''}</span></button>`;
  }).join(''):`<div class="mf289-rich-empty">No Set Category choices are currently visible.</div>`;
  return `<div class="mf289-rich-select" data-mf289-category-select><select class="mf289-rich-native-value" id="${escapeHtml(inputId)}" tabindex="-1" aria-hidden="true">${model.categories.map(cat=>`<option value="${escapeHtml(String(cat.id||''))}" ${String(cat.id||'')===model.selected?'selected':''}>${escapeHtml(cat.name||'')}</option>`).join('')}</select><details id="${escapeHtml(detailsId)}"><summary><span class="mf289-rich-selected-icon">${icon}</span><span class="mf289-rich-selected-name">${escapeHtml(label)}</span><span class="mf289-rich-chevron">▾</span></summary><div class="mf289-rich-menu">${choices}</div></details></div>`;
}
function v289ChooseCategory(inputId,detailsId,id){
  const input=document.getElementById(inputId),cat=(S.categories||[]).find(c=>String(c?.id||'')===String(id));if(!input||!cat)return;
  input.value=String(cat.id);input.dispatchEvent(new Event('change',{bubbles:true}));
  const details=document.getElementById(detailsId);if(details){
    const icon=details.querySelector('.mf289-rich-selected-icon'),name=details.querySelector('.mf289-rich-selected-name');
    if(icon)icon.innerHTML=v144CategoryIconHtml(cat);if(name)name.textContent=cat.name||'Unnamed category';details.open=false;
    details.querySelectorAll('.mf289-rich-option').forEach(btn=>{const on=String(btn.dataset.mf289CatId||'')===String(cat.id);btn.classList.toggle('selected',on);const check=btn.querySelector('.mf289-rich-check');if(check)check.textContent=on?'✓':'';});
  }
}
function v289StatusOptionsHtml(current){
  const cur=String(current||'planned'),ids=v289ChoiceIds('setStatus',cur);
  return ids.map(id=>`<option value="${escapeHtml(id)}" ${cur===id?'selected':''}>${escapeHtml(v199StatusLabel(id))}</option>`).join('');
}
function v289PriorityOptionsHtml(current){
  const cur=String(current||'medium'),ids=v289ChoiceIds('setPriority',cur);
  return ids.map(id=>`<option value="${escapeHtml(id)}" ${cur===id?'selected':''}>${escapeHtml(id.charAt(0).toUpperCase()+id.slice(1))}</option>`).join('');
}

const v289LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  let h=v289LibraryModalHtmlBase.apply(this,arguments);
  h=h.replace(/<select id="l-category"[^>]*>[\s\S]*?<\/select>/,v289RichCategorySelectHtml('l-category',d?.categoryId,'library'));
  h=h.replace(/<select id="l-status"[^>]*>[\s\S]*?<\/select>/,`<select id="l-status" data-mf289-choice="setStatus" onchange="App.v135LibraryStatusChanged(this.value)">${v289StatusOptionsHtml(d?.status||'planned')}</select>`);
  h=h.replace(/<select id="l-priority"[^>]*>[\s\S]*?<\/select>/,`<select id="l-priority" data-mf289-choice="setPriority">${v289PriorityOptionsHtml(d?.priority||'medium')}</select>`);
  return h;
};

const v289QuickSchemaBase=v181QuickSchema;
v181QuickSchema=function(item,key){
  if(key==='categoryId')return {label:'Category',input:v289RichCategorySelectHtml('v181-quick-value',item?.categoryId,'quick-details')};
  if(key==='status')return {label:'Status',input:`<select id="v181-quick-value" data-mf289-choice="setStatus">${v289StatusOptionsHtml(item?.status||'planned')}</select>`};
  if(key==='priority')return {label:'Priority',input:`<select id="v181-quick-value" data-mf289-choice="setPriority">${v289PriorityOptionsHtml(item?.priority||'medium')}</select>`};
  return v289QuickSchemaBase.apply(this,arguments);
};

function v289AuditState(){
  const v=v288EnsureQueueView();
  return {
    version:289,
    collectionCoverScale:v.collectionCoverScale,
    collectionTitleCoverScale:v.collectionTitleCoverScale,
    setCategoryOrder:v289ChoiceIds('setCategory'),
    setStatusOrder:v289ChoiceIds('setStatus'),
    setPriorityOrder:v289ChoiceIds('setPriority'),
    personalOrderExportVersion:Number(v142OrderExportPayload()?.formatVersion)||0,
    cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,collectionsExportVersion:2,pwaRelease:289
  };
}

Object.assign(App,{v289PreviewQueueCoverScale,v289SetQueueCoverScale,v289ChooseCategory,v289AuditState});
v289ApplyQueueCoverVars();
window.MediaFlowV289={version:289,focus:'Personal Order Collection cover sizing and Add/Edit/Title Details choice-order parity'};
MediaFlowRuntime.version=V289_RUNTIME_VERSION;
