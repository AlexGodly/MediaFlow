/* ============================================================
   MediaFlow v288 — Personal Order queue views & Collection drill-down
   ------------------------------------------------------------
   - Assigned Collections gain an explicit Open action.
   - Collection Queue defaults below the regular/category queue.
   - Personal Order can switch which queue section appears first.
   - Regular queues and Collection Queues can be shown/hidden independently.
   - Optional Collection mirrors inside By Category queues.
   - Collection assignments expand into paginated ordered-title lists.
   - Direct titles shown in the Collection Queue now include artwork.
   ============================================================ */
const V288_RUNTIME_VERSION=288;

function v288QueueViewDefaults(){
  return {
    sectionOrder:'regular-first',
    showRegularQueues:true,
    showCollectionQueues:true,
    showCollectionsInRegularQueues:false
  };
}
function v288NormalizeQueueView(raw){
  const d=v288QueueViewDefaults(),x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    sectionOrder:String(x.sectionOrder||'')==='collections-first'?'collections-first':'regular-first',
    showRegularQueues:x.showRegularQueues!==false,
    showCollectionQueues:x.showCollectionQueues!==false,
    showCollectionsInRegularQueues:x.showCollectionsInRegularQueues===true
  };
}

// Keep the queue-view choices inside Personal Order state so normal local,
// cloud, Sync Now and Full Backup paths remember how the page was left.
const v288NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v288NormalizeOrderPlanBase.apply(this,arguments),raw=plan&&typeof plan==='object'&&!Array.isArray(plan)?plan:{};
  out.v288QueueView=v288NormalizeQueueView(raw.v288QueueView);
  return out;
};
function v288EnsureQueueView(){
  const p=v287EnsureOrderExtensions();
  p.v288QueueView=v288NormalizeQueueView(p.v288QueueView);
  return p.v288QueueView;
}
function v288UI(){
  v287OrderUI();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  if(!ui.v288CollectionDetails||typeof ui.v288CollectionDetails!=='object'||Array.isArray(ui.v288CollectionDetails))ui.v288CollectionDetails={};
  return ui;
}
function v288DetailState(assignmentId){
  const ui=v288UI(),id=String(assignmentId||'');
  const raw=ui.v288CollectionDetails[id]&&typeof ui.v288CollectionDetails[id]==='object'?ui.v288CollectionDetails[id]:{};
  const state={expanded:raw.expanded===true,page:Math.max(0,Math.floor(Number(raw.page)||0)),pageSize:Math.max(1,Math.min(1000,Math.floor(Number(raw.pageSize)||10)))};
  ui.v288CollectionDetails[id]=state;
  return state;
}

function v288TitleCoverHtml(item,cls='mf288-title-cover'){
  const cat=v138OrderCategory(item?.categoryId),title=cleanTitle(item?.title||'');
  if(item?.coverUrl){
    return `<div class="${cls}"><img src="${escapeHtml(String(item.coverUrl))}" alt="${escapeHtml(title)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="mf288-title-cover-fallback" style="display:none">${v144CategoryIconHtml(cat)}</div></div>`;
  }
  return `<div class="${cls} mf288-title-cover-fallback">${v144CategoryIconHtml(cat)}</div>`;
}
function v288AssignmentEligibilityLabel(a,item){
  if(!item)return {kind:'missing',label:'Unavailable'};
  if(v287IsDropped(item))return {kind:'skip',label:'Dropped · excluded'};
  if(a.categoryRule==='match'&&String(item.categoryId||'')!==String(a.categoryId||''))return {kind:'skip',label:'Category mismatch · skipped'};
  if(a.completedRule!=='include'&&v287IsCompleted(item))return {kind:'skip',label:'Completed · skipped'};
  if((a.traversedTitleIds||[]).map(String).includes(String(item.id||'')))return {kind:'done',label:'Already traversed'};
  return {kind:'eligible',label:'Eligible'};
}
function v288AssignmentTitleRows(a){
  const c=v287AssignmentCollection(a);if(!c)return [];
  return v287CollectionTitleIds(c).map((id,index)=>({id:String(id),index,item:v287LibraryItem(id)}));
}
function v288AssignmentDetailsHtml(a){
  const state=v288DetailState(a.id),rows=v288AssignmentTitleRows(a),total=rows.length,size=state.pageSize,pages=Math.max(1,Math.ceil(total/size));
  state.page=Math.max(0,Math.min(state.page,pages-1));
  if(!state.expanded)return '';
  const start=state.page*size,visible=rows.slice(start,start+size);
  const body=visible.length?visible.map(row=>{
    const item=row.item,elig=v288AssignmentEligibilityLabel(a,item),cat=item?v138OrderCategory(item.categoryId):null;
    return `<div class="mf288-collection-title-row ${elig.kind==='skip'?'is-skipped':''} ${elig.kind==='done'?'is-traversed':''}">
      <span class="mf288-inner-pos">${row.index+1}</span>
      ${item?v288TitleCoverHtml(item,'mf288-inner-cover'):`<div class="mf288-inner-cover mf288-title-cover-fallback">?</div>`}
      <div class="mf288-inner-copy"><b>${escapeHtml(item?cleanTitle(item.title):'Unavailable title')}</b><small>${item?`${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}`:'This Library title is no longer available.'}</small></div>
      <span class="mf288-eligibility ${elig.kind}">${escapeHtml(elig.label)}</span>
    </div>`;
  }).join(''):`<div class="mf288-inner-empty">This Collection has no titles.</div>`;
  return `<div class="mf288-assignment-details">
    <div class="mf288-details-toolbar">
      <div><b>Collection order</b><small>${total.toLocaleString()} title${total===1?'':'s'} · showing ${total?start+1:0}–${Math.min(total,start+size)}${pages>1?` · page ${state.page+1}/${pages}`:''}</small></div>
      <label class="mf288-page-size">Titles/page <input type="number" min="1" max="1000" step="1" inputmode="numeric" value="${size}" onchange="App.v288SetAssignmentPageSize('${escapeHtml(a.id)}',this.value)" onkeydown="if(event.key==='Enter')this.blur()"></label>
    </div>
    <div class="mf288-collection-title-list">${body}</div>
    ${pages>1?`<div class="mf288-details-pagination"><button class="btn btn-sm btn-ghost" type="button" data-v225-icon="prev" ${state.page<=0?'disabled':''} onclick="App.v288SetAssignmentPage('${escapeHtml(a.id)}',${state.page-1})">Previous</button><span>Page ${state.page+1} of ${pages}</span><button class="btn btn-sm btn-ghost" type="button" data-v225-icon="next" ${state.page>=pages-1?'disabled':''} onclick="App.v288SetAssignmentPage('${escapeHtml(a.id)}',${state.page+1})">Next</button></div>`:''}
  </div>`;
}

function v288AssignmentRowHtml(a,position,total,context='collection'){
  const c=v287AssignmentCollection(a),cat=v138OrderCategory(a.categoryId),stats=v287AssignmentEligibility(a);if(!c)return '';
  const state=v288DetailState(a.id);let cover='';try{cover=v274CollectionCoverHtml(c,'mf287-assignment-cover');}catch(_){cover=`<div class="mf287-assignment-cover empty">◇</div>`;}
  return `<div class="mf287-queue-item mf287-queue-collection mf288-assignment-shell ${context==='regular'?'mf288-inline-assignment':''}" data-assignment-id="${escapeHtml(a.id)}">
    <div class="mf287-queue-position"><input type="number" min="1" max="${Math.max(1,total)}" value="${position}" aria-label="Collection queue position" onchange="App.v287SetAssignmentPosition('${escapeHtml(a.id)}',this.value)"></div>
    ${cover}
    <div class="mf287-assignment-main">
      <div class="mf287-assignment-title"><span class="mf287-collection-kicker">COLLECTION</span><b>${escapeHtml(String(c.title||'Untitled Collection'))}</b></div>
      <div class="mf287-assignment-meta"><span>${escapeHtml(cat?.name||'Unknown task')}</span><span>·</span><span>${stats.remaining}/${stats.eligible} remaining${stats.remaining===0&&stats.eligible?' · queue complete':''}</span><span>·</span><span>${v287CollectionTitleIds(c).length.toLocaleString()} total titles</span></div>
      <div class="mf287-rule-grid">
        <label><span>Category rule</span><select onchange="App.v287SetAssignmentRule('${escapeHtml(a.id)}','categoryRule',this.value)"><option value="match" ${a.categoryRule==='match'?'selected':''}>Match task category</option><option value="force" ${a.categoryRule==='force'?'selected':''}>Force queue · ignore title category</option></select></label>
        <label><span>Completed titles</span><select onchange="App.v287SetAssignmentRule('${escapeHtml(a.id)}','completedRule',this.value)"><option value="skip" ${a.completedRule==='skip'?'selected':''}>Skip completed</option><option value="include" ${a.completedRule==='include'?'selected':''}>Include completed</option></select></label>
      </div>
    </div>
    <div class="mf287-assignment-actions mf288-assignment-actions">
      <button class="btn btn-sm" type="button" data-v225-icon="openCollection" onclick="App.v288OpenAssignedCollection('${escapeHtml(c.id)}')">Open</button>
      <button class="btn btn-sm btn-ghost" type="button" data-v225-icon="list" aria-expanded="${state.expanded?'true':'false'}" onclick="App.v288ToggleAssignmentTitles('${escapeHtml(a.id)}')">${state.expanded?'Hide titles':'Show titles'}</button>
      <button class="btn btn-sm btn-ghost" type="button" ${position<=1?'disabled':''} onclick="App.v287MoveAssignment('${escapeHtml(a.id)}',-1)" title="Move this Collection one queue position earlier">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${position>=total?'disabled':''} onclick="App.v287MoveAssignment('${escapeHtml(a.id)}',1)" title="Move this Collection one queue position later">↓</button>
      ${stats.traversed?`<button class="btn btn-sm btn-ghost" type="button" data-v225-icon="reset" onclick="App.v287ResetAssignmentProgress('${escapeHtml(a.id)}')">Reset progress</button>`:''}
      <button class="btn btn-sm btn-ghost" type="button" data-v225-icon="remove" onclick="App.v287RemoveCollectionAssignment('${escapeHtml(a.id)}')">Remove</button>
    </div>
    ${v288AssignmentDetailsHtml(a)}
  </div>`;
}

function v288DirectQueueTitleHtml(item,position){
  const cat=v138OrderCategory(item?.categoryId);
  return `<div class="mf287-queue-item mf287-queue-title mf288-queue-title-with-cover">
    <span class="mf287-queue-number">${position}</span>
    ${v288TitleCoverHtml(item,'mf288-direct-cover')}
    <div class="mf288-direct-copy"><b>${escapeHtml(cleanTitle(item.title))}</b><small>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}</small></div>
  </div>`;
}

function v288CollectionQueueBoardHtml(){
  const p=v287EnsureOrderExtensions();if(!p.collectionAssignments.length)return '';
  const hidden=new Set((p.hiddenCategories||[]).map(String)),groups=[];
  for(const catId of v138CategoryDisplayOrder()){
    const cid=String(catId||'');if(hidden.has(cid))continue;
    const assignments=v287Assignments(cid);if(!assignments.length)continue;
    const cat=v138OrderCategory(cid);if(!cat)continue;
    const queue=v287Queue(cid),rows=[];
    queue.forEach((token,index)=>{
      if(token.startsWith('t:')){const item=v138OrderItem(token.slice(2));if(item)rows.push(v288DirectQueueTitleHtml(item,index+1));}
      else if(token.startsWith('c:')){const a=v287Assignment(token.slice(2));if(a)rows.push(v288AssignmentRowHtml(a,index+1,queue.length,'collection'));}
    });
    groups.push(`<section class="card mf287-queue-group mf288-collection-queue-group"><div class="mf287-queue-head"><div><span class="section-label">COLLECTION QUEUE</span><h3>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</h3><p>Shows the complete outer queue around each Collection block. Open a Collection, inspect its live ordered titles, or change its recommendation rules here.</p></div><span class="mf287-queue-count">${queue.length} queue item${queue.length===1?'':'s'}</span></div><div class="mf287-queue-list">${rows.join('')}</div></section>`);
  }
  return groups.length?`<div class="mf287-queue-board mf288-collection-board"><div class="mf288-section-heading"><div><span class="section-label">COLLECTION QUEUES</span><h2>Collection queue blocks</h2></div><small>${p.collectionAssignments.length.toLocaleString()} assignment${p.collectionAssignments.length===1?'':'s'}</small></div>${groups.join('')}</div>`:'';
}

// v287 inserts its board above the regular queues. v288 owns section ordering,
// so suppress that insertion and place the richer board after/before explicitly.
v287QueueBoardHtml=function(){return '';};
v287AssignmentRowHtml=v288AssignmentRowHtml;

const v288ByCategoryHtmlBase=v138ByCategoryHtml;
v138ByCategoryHtml=function(){
  const view=v288EnsureQueueView();if(!view.showCollectionsInRegularQueues)return v288ByCategoryHtmlBase.apply(this,arguments);
  const p=v287EnsureOrderExtensions(),hidden=new Set((p.hiddenCategories||[]).map(String)),blocks=[];
  for(const catId of v138CategoryDisplayOrder()){
    const cid=String(catId||'');if(hidden.has(cid))continue;
    const cat=v138OrderCategory(cid);if(!cat)continue;
    const queue=v287Queue(cid),assignmentCount=v287Assignments(cid).length,directCount=v138CategoryTitleIds(cid).length;
    if(!queue.length)continue;
    const rows=[];
    queue.forEach((token,index)=>{
      if(token.startsWith('t:')){const item=v138OrderItem(token.slice(2));if(item)rows.push(v138OrderRowHtml(item,index+1,cid));}
      else if(token.startsWith('c:')){const a=v287Assignment(token.slice(2));if(a)rows.push(v288AssignmentRowHtml(a,index+1,queue.length,'regular'));}
    });
    blocks.push(`<div class="card v138-category-card mf288-category-mixed-card"><div class="v138-category-head"><div class="v138-category-head-copy"><b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b><small>Relative title order is shared with All Titles. Assigned Collections are mirrored here at their mixed queue positions.</small></div><span class="v138-category-count">${directCount} title${directCount===1?'':'s'}${assignmentCount?` · ${assignmentCount} Collection${assignmentCount===1?'':'s'}`:''}</span></div><div class="v138-order-list mf288-mixed-regular-list">${rows.join('')}</div></div>`);
  }
  return blocks.length?blocks.join(''):`<div class="v138-order-empty"><b>No visible category groups</b>Add titles or Collections to Personal Order, or show a hidden category from Category display.</div>`;
};

function v288QueueControlsHtml(){
  const v=v288EnsureQueueView();
  return `<div class="card mf288-queue-controls">
    <div class="mf288-queue-controls-copy"><span class="section-label">QUEUE DISPLAY</span><b>Personal Order sections</b><small>Choose which queue sections are visible and which one appears first. These choices are remembered.</small></div>
    <div class="mf288-queue-control-groups">
      <div class="mf288-control-group"><span>First section</span><div class="mf288-segmented"><button class="btn btn-sm ${v.sectionOrder==='regular-first'?'btn-primary':'btn-ghost'}" type="button" data-v225-icon="category" onclick="App.v288SetQueueView('sectionOrder','regular-first')">Category / title queues</button><button class="btn btn-sm ${v.sectionOrder==='collections-first'?'btn-primary':'btn-ghost'}" type="button" data-v225-icon="folder" onclick="App.v288SetQueueView('sectionOrder','collections-first')">Collection queues</button></div></div>
      <div class="mf288-control-group"><span>Visibility</span><div class="mf288-checks"><label><input type="checkbox" ${v.showRegularQueues?'checked':''} onchange="App.v288SetQueueView('showRegularQueues',this.checked)"> Category / title queues</label><label><input type="checkbox" ${v.showCollectionQueues?'checked':''} onchange="App.v288SetQueueView('showCollectionQueues',this.checked)"> Collection queues</label></div></div>
      <div class="mf288-control-group"><span>By Category</span><label class="mf288-inline-toggle"><input type="checkbox" ${v.showCollectionsInRegularQueues?'checked':''} onchange="App.v288SetQueueView('showCollectionsInRegularQueues',this.checked)"> Also show assigned Collections inside category queues</label></div>
    </div>
  </div>`;
}
function v288EmptyQueueSectionsHtml(){return `<div class="v138-order-empty mf288-sections-empty"><b>Both queue sections are hidden</b>Use Queue Display above to show Category / title queues, Collection queues, or both.</div>`;}

const v288RenderOrderBase=renderOrder;
renderOrder=function(){
  let html=v288RenderOrderBase.apply(this,arguments),v=v288EnsureQueueView();
  html=html.replace('<div class="v138-order-grid">',`${v288QueueControlsHtml()}<div class="v138-order-grid">`);
  const startToken='<div class="v138-order-main">',sideToken='<div class="v138-order-side">';
  const start=html.indexOf(startToken),side=html.indexOf(sideToken,start+startToken.length);
  if(start<0||side<0)return html;
  const close=html.lastIndexOf('</div>',side);if(close<start)return html;
  const regular=html.slice(start+startToken.length,close),collection=v.showCollectionQueues?v288CollectionQueueBoardHtml():'';
  const regularBlock=v.showRegularQueues?`<div class="mf288-regular-section">${regular}</div>`:'';
  const collectionBlock=collection?`<div class="mf288-collection-section">${collection}</div>`:'';
  let main='';
  if(v.sectionOrder==='collections-first')main=`${collectionBlock}${regularBlock}`;else main=`${regularBlock}${collectionBlock}`;
  if(!main.trim())main=v288EmptyQueueSectionsHtml();
  return `${html.slice(0,start+startToken.length)}${main}${html.slice(close)}`;
};

async function v288SetQueueView(key,value){
  const p=v287EnsureOrderExtensions(),v=v288EnsureQueueView();
  if(key==='sectionOrder')v.sectionOrder=String(value)==='collections-first'?'collections-first':'regular-first';
  else if(key==='showRegularQueues')v.showRegularQueues=!!value;
  else if(key==='showCollectionQueues')v.showCollectionQueues=!!value;
  else if(key==='showCollectionsInRegularQueues')v.showCollectionsInRegularQueues=!!value;
  else return;
  p.v288QueueView=v;p.modifiedAt=Date.now();await saveState();render();
}
function v288ToggleAssignmentTitles(id){const s=v288DetailState(id);s.expanded=!s.expanded;s.page=0;render();}
function v288SetAssignmentPage(id,page){const s=v288DetailState(id);s.page=Math.max(0,Math.floor(Number(page)||0));render();}
function v288SetAssignmentPageSize(id,value){const s=v288DetailState(id);s.pageSize=Math.max(1,Math.min(1000,Math.floor(Number(value)||10)));s.page=0;render();}
async function v288OpenAssignedCollection(collectionId){
  const c=v287Collection(collectionId);if(!c){showToast('That Collection is no longer available.');return;}
  App.setView('collections');
  try{await Promise.resolve(App.v274OpenCollection(String(c.id)));}catch(err){console.error('v288 open Collection failed',err);showToast('Could not open that Collection.');}
}

/* ---------- Dedicated Personal Order export/import view preference -- */
const v288OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v288OrderExportPayloadBase.apply(this,arguments),p=v287EnsureOrderExtensions();payload.mediaFlowVersion=V288_RUNTIME_VERSION;payload.orderPlan=payload.orderPlan||{};payload.orderPlan.v288QueueView=v288NormalizeQueueView(p.v288QueueView);payload.exportAudit=payload.exportAudit||{};payload.exportAudit.release=V288_RUNTIME_VERSION;const includes=new Set([...(Array.isArray(payload.exportAudit.includes)?payload.exportAudit.includes:[]),'queueViewPreferences']);payload.exportAudit.includes=[...includes];return payload;
};
const v288ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let view=null;try{if(file){const data=JSON.parse(await file.text()),raw=data?.orderPlan&&typeof data.orderPlan==='object'?data.orderPlan:data;view=v288NormalizeQueueView(raw?.v288QueueView);}}catch(_){ }
  await v288ImportOrderBase.apply(this,arguments);
  if(view){const p=v287EnsureOrderExtensions();p.v288QueueView=view;p.modifiedAt=Date.now();await saveState();render();}
};
App.v142ImportOrder=v142ImportOrder;

function v288AuditState(){
  const p=v287EnsureOrderExtensions(),v=v288EnsureQueueView(),assignment=p.collectionAssignments[0]||null,detail=assignment?v288DetailState(assignment.id):null;
  const exported=v142OrderExportPayload();return {version:288,queueView:v,collectionAssignments:p.collectionAssignments.length,firstAssignmentOpenable:!!(assignment&&v287AssignmentCollection(assignment)),detailPageSize:detail?.pageSize||10,personalOrderExportVersion:Number(exported?.formatVersion)||0,exportQueueView:v288NormalizeQueueView(exported?.orderPlan?.v288QueueView),cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,collectionsExportVersion:2,pwaRelease:288};
}

Object.assign(App,{v288SetQueueView,v288ToggleAssignmentTitles,v288SetAssignmentPage,v288SetAssignmentPageSize,v288OpenAssignedCollection,v288AuditState});
window.MediaFlowV288={version:288,focus:'Personal Order queue display controls, Collection opening and paginated Collection title drill-down'};
MediaFlowRuntime.version=V288_RUNTIME_VERSION;
