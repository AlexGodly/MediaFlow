/* ============================================================
   MediaFlow v287 — Personal Order Collection queues
   ------------------------------------------------------------
   Collections become first-class Personal Order queue blocks.

   Per assignment:
   - one Collection can be assigned to multiple task categories;
   - queue position is mixed with the category's direct ordered titles;
   - Match Task Category vs Force Queue (ignore title category);
   - Skip Completed vs Include Completed;
   - Collection titles are always read live from the Collection's own order;
   - the Collection is flattened as one contiguous queue block before the
     outer Personal Order queue continues.

   The feature extends the existing orderPlan so Cloud Sync, Sync Now and Full
   Backup keep using the established Personal Order modifiedAt merge contract.
   ============================================================ */
const V287_RUNTIME_VERSION=287;
const V287_ORDER_FORMAT_VERSION=5;

function v287Clone(value,fallback){try{return JSON.parse(JSON.stringify(value));}catch(_){return fallback;}}
function v287Text(value){return String(value??'').trim();}
function v287Id(prefix='oca'){
  try{return `${prefix}_${uid()}`;}catch(_){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;}
}
function v287Collections(){try{return typeof v274EnsureCollections==='function'?v274EnsureCollections():(Array.isArray(S.collections)?S.collections:[]);}catch(_){return Array.isArray(S.collections)?S.collections:[];}}
function v287Collection(id){const sid=String(id||'');try{return typeof v274CollectionById==='function'?v274CollectionById(sid):v287Collections().find(c=>String(c?.id||'')===sid)||null;}catch(_){return v287Collections().find(c=>String(c?.id||'')===sid)||null;}}
function v287CollectionTitleIds(collection){
  if(!collection)return [];
  const ids=Array.isArray(collection.order)&&collection.order.length?collection.order:collection.titleIds;
  const seen=new Set(),out=[];
  for(const raw of (Array.isArray(ids)?ids:[])){
    const id=String(raw||'');
    if(id&&!seen.has(id)){seen.add(id);out.push(id);}
  }
  return out;
}
function v287LibraryItem(id){
  const sid=String(id||'');
  try{if(typeof v274LibraryItem==='function')return v274LibraryItem(sid);}catch(_){ }
  try{if(typeof v270LibraryById==='function')return v270LibraryById(sid);}catch(_){ }
  return (S.library||[]).find(item=>String(item?.id||'')===sid)||null;
}
function v287IsCompleted(item){
  if(!item)return false;
  if(String(item.status||'').toLowerCase()==='completed')return true;
  const total=Number(item.total),progress=Number(item.progress)||0;
  return Number.isFinite(total)&&total>0&&progress>=total;
}
function v287IsDropped(item){return String(item?.status||'').toLowerCase()==='dropped';}

function v287NormalizeAssignment(raw,categories){
  const a=raw&&typeof raw==='object'?raw:{};
  const categoryId=String(a.categoryId||'');
  if(!categoryId)return null;
  const categoryIds=new Set((Array.isArray(categories)?categories:(S.categories||[])).filter(c=>c?.id).map(c=>String(c.id)));
  if(categoryIds.size&&!categoryIds.has(categoryId))return null;
  const collectionId=String(a.collectionId||'');
  if(!collectionId)return null;
  return {
    id:String(a.id||'')||v287Id(),
    collectionId,
    categoryId,
    categoryRule:String(a.categoryRule||'match')==='force'?'force':'match',
    completedRule:String(a.completedRule||'skip')==='include'?'include':'skip',
    traversedTitleIds:[...new Set((Array.isArray(a.traversedTitleIds)?a.traversedTitleIds:[]).map(String).filter(Boolean))],
    createdAt:Math.max(0,Number(a.createdAt)||Date.now()),
    modifiedAt:Math.max(0,Number(a.modifiedAt)||Number(a.createdAt)||Date.now())
  };
}
function v287NormalizeAssignments(raw,categories){
  const out=[],seenPairs=new Set(),seenIds=new Set();
  for(const value of (Array.isArray(raw)?raw:[])){
    const a=v287NormalizeAssignment(value,categories);
    if(!a)continue;
    const pair=`${a.categoryId}\u0000${a.collectionId}`;
    if(seenPairs.has(pair))continue;
    seenPairs.add(pair);
    if(seenIds.has(a.id))a.id=v287Id();
    seenIds.add(a.id);
    out.push(a);
  }
  return out;
}
function v287NormalizeCategoryQueues(raw,categories){
  const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const validCats=new Set((Array.isArray(categories)?categories:(S.categories||[])).filter(c=>c?.id).map(c=>String(c.id)));
  const out={};
  for(const [key,value] of Object.entries(src)){
    const cid=String(key||'');
    if(!cid||(validCats.size&&!validCats.has(cid)))continue;
    const seen=new Set(),tokens=[];
    for(const rawToken of (Array.isArray(value)?value:[])){
      const token=String(rawToken||'');
      if(!/^[tc]:.+/.test(token)||seen.has(token))continue;
      seen.add(token);tokens.push(token);
    }
    out[cid]=tokens;
  }
  return out;
}

// Extend the canonical Personal Order normalizer. This is the critical piece
// that makes assignments survive every existing snapshot/apply/merge path.
const v287NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v287NormalizeOrderPlanBase.apply(this,arguments);
  const raw=plan&&typeof plan==='object'&&!Array.isArray(plan)?plan:{};
  out.collectionAssignments=v287NormalizeAssignments(raw.collectionAssignments,categories);
  out.categoryQueues=v287NormalizeCategoryQueues(raw.categoryQueues,categories);
  return out;
};

function v287EnsureOrderExtensions(){
  const p=v138EnsureOrderPlan();
  p.collectionAssignments=v287NormalizeAssignments(p.collectionAssignments,S.categories);
  p.categoryQueues=v287NormalizeCategoryQueues(p.categoryQueues,S.categories);
  return p;
}
function v287Assignments(categoryId=''){
  const p=v287EnsureOrderExtensions();
  const cid=String(categoryId||'');
  return cid?p.collectionAssignments.filter(a=>String(a.categoryId)===cid):p.collectionAssignments.slice();
}
function v287Assignment(id){const sid=String(id||'');return v287Assignments().find(a=>String(a.id)===sid)||null;}
function v287AssignmentCollection(a){return a?v287Collection(a.collectionId):null;}
function v287DirectTitleTokens(categoryId){
  const cid=String(categoryId||'');
  const p=v287EnsureOrderExtensions();
  const out=[];
  for(const id of p.titleIds||[]){
    const item=v138OrderItem(id);
    if(item&&String(item.categoryId||'')===cid)out.push(`t:${String(id)}`);
  }
  return out;
}
function v287CollectionTokens(categoryId){return v287Assignments(categoryId).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id)).map(a=>`c:${a.id}`);}

// Keep Collection tokens at their chosen outer slots while direct-title tokens
// follow the user's latest Personal Order title ordering.
function v287ReconcileCategoryQueue(categoryId){
  const cid=String(categoryId||'');
  if(!cid)return [];
  const p=v287EnsureOrderExtensions();
  const titleTokens=v287DirectTitleTokens(cid);
  const collectionTokens=v287CollectionTokens(cid);
  const allowed=new Set([...titleTokens,...collectionTokens]);
  const raw=Array.isArray(p.categoryQueues?.[cid])?p.categoryQueues[cid]:[];
  let queue=[];const seen=new Set();
  for(const token of raw){if(allowed.has(token)&&!seen.has(token)){seen.add(token);queue.push(token);}}

  if(!queue.length){
    queue=[...titleTokens,...collectionTokens];
  }else{
    // Reorder the direct titles relative to each other while preserving each
    // Collection token's mixed queue slot.
    const existingTitleTokens=titleTokens.filter(token=>seen.has(token));
    let titleIndex=0;
    queue=queue.map(token=>token.startsWith('t:')?(existingTitleTokens[titleIndex++]||token):token);
    // v368: preserve the existing mixed ordering without quadratic includes()
    // scans when a category contains thousands of ordered titles.
    const queued=new Set(queue);
    for(const token of titleTokens){if(!queued.has(token)){queued.add(token);queue.push(token);}}
    for(const token of collectionTokens){if(!queued.has(token)){queued.add(token);queue.push(token);}}
  }

  p.categoryQueues=p.categoryQueues||{};
  p.categoryQueues[cid]=queue;
  return queue;
}
function v287ReconcileAllQueues(){
  const p=v287EnsureOrderExtensions();
  const cats=new Set([
    ...(S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean),
    ...Object.keys(p.categoryQueues||{}),
    ...p.collectionAssignments.map(a=>String(a.categoryId||'')).filter(Boolean)
  ]);
  for(const cid of cats)v287ReconcileCategoryQueue(cid);
  return p.categoryQueues;
}

// Existing title add/remove/reorder actions all funnel through this touch path.
// Reconcile first so Collection slots stay coherent with those title changes.
const v287TouchOrderPlanBase=v138TouchOrderPlan;
v138TouchOrderPlan=function(){v287ReconcileAllQueues();return v287TouchOrderPlanBase.apply(this,arguments);};

function v287Queue(categoryId){return v287ReconcileCategoryQueue(categoryId).slice();}
function v287QueuePosition(assignmentId){
  const a=v287Assignment(assignmentId);if(!a)return 0;
  const q=v287Queue(a.categoryId);return Math.max(0,q.indexOf(`c:${a.id}`)+1);
}
function v287Touch(){
  const p=v287EnsureOrderExtensions();
  v287ReconcileAllQueues();
  p.modifiedAt=Date.now();
  try{return saveState();}catch(err){console.error('v287 Personal Order save failed',err);return Promise.resolve();}
}

/* ---------- Add Collection picker ---------------------------------- */
function v287OrderUI(){
  v138EnsureOrderPlan();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  ui.v287CollectionSearch=String(ui.v287CollectionSearch||'');
  const cats=(S.categories||[]).filter(c=>c?.id);
  const valid=new Set(cats.map(c=>String(c.id)));
  if(!valid.has(String(ui.v287CollectionCategoryId||'')))ui.v287CollectionCategoryId=String(cats[0]?.id||'');
  return ui;
}
function v287CollectionMatches(){
  const ui=v287OrderUI(),q=ui.v287CollectionSearch.trim().toLowerCase();
  let rows=v287Collections().slice();
  if(q)rows=rows.filter(c=>[c?.title||'',c?.description||''].join(' ').toLowerCase().includes(q));
  return rows.sort((a,b)=>String(a?.title||'').localeCompare(String(b?.title||''),undefined,{numeric:true,sensitivity:'base'}));
}
function v287CollectionPickerResultsHtml(){
  const ui=v287OrderUI();
  const cid=String(ui.v287CollectionCategoryId||'');
  const rows=v287CollectionMatches();
  if(!rows.length)return `<div class="mf287-picker-empty">${v287Collections().length?'No Collections match this search.':'No Collections yet. Create one on the Collections page first.'}</div>`;
  const assigned=new Set(v287Assignments(cid).map(a=>String(a.collectionId)));
  return rows.map(c=>{
    const id=String(c.id||''),isAssigned=assigned.has(id),count=v287CollectionTitleIds(c).length;
    let cover='';
    try{cover=v274CollectionCoverHtml(c,'mf287-picker-cover');}catch(_){cover=`<div class="mf287-picker-cover empty">◇</div>`;}
    return `<div class="mf287-picker-row">
      ${cover}
      <div class="mf287-picker-copy"><b>${escapeHtml(String(c.title||'Untitled Collection'))}</b><small>${count.toLocaleString()} title${count===1?'':'s'}${c.description?` · ${escapeHtml(String(c.description).slice(0,72))}`:''}</small></div>
      <button type="button" class="btn btn-sm ${isAssigned?'btn-ghost':'btn-primary'}" ${isAssigned?'disabled':''} onclick="App.v287AddCollectionAssignment('${escapeHtml(id)}','${escapeHtml(cid)}')">${isAssigned?'Assigned':'Add'}</button>
    </div>`;
  }).join('');
}
function v287CollectionPickerHtml(){
  const ui=v287OrderUI(),cats=(S.categories||[]).filter(c=>c?.id);
  return `<div class="card mf287-add-collection-card">
    <div class="section-label">ADD COLLECTION</div>
    <p class="mf287-picker-help">Add a live Collection as one queue block. The same Collection can be assigned to multiple task categories.</p>
    <label class="mf287-field"><span>Task category</span><select id="mf287-collection-category" onchange="App.v287SetCollectionCategory(this.value)">${cats.map(c=>`<option value="${escapeHtml(String(c.id))}" ${String(c.id)===String(ui.v287CollectionCategoryId)?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></label>
    <input id="mf287-collection-search" type="search" value="${escapeHtml(ui.v287CollectionSearch)}" placeholder="Search Collections…" oninput="App.v287SetCollectionSearch(this.value)">
    <div id="mf287-collection-results" class="mf287-picker-results">${v287CollectionPickerResultsHtml()}</div>
  </div>`;
}
function v287RefreshCollectionPicker(){const box=document.getElementById('mf287-collection-results');if(box)box.innerHTML=v287CollectionPickerResultsHtml();}
function v287SetCollectionSearch(value){v287OrderUI().v287CollectionSearch=String(value||'');v287RefreshCollectionPicker();}
function v287SetCollectionCategory(value){v287OrderUI().v287CollectionCategoryId=String(value||'');v287RefreshCollectionPicker();}
async function v287AddCollectionAssignment(collectionId,categoryId){
  const p=v287EnsureOrderExtensions(),collection=v287Collection(collectionId),cat=v138OrderCategory(categoryId);
  if(!collection||!cat){showToast('Collection or task category is no longer available.');return;}
  if(p.collectionAssignments.some(a=>String(a.collectionId)===String(collection.id)&&String(a.categoryId)===String(cat.id))){showToast('That Collection is already assigned to this task category.');return;}
  const now=Date.now();
  const a={id:v287Id(),collectionId:String(collection.id),categoryId:String(cat.id),categoryRule:'match',completedRule:'skip',createdAt:now,modifiedAt:now};
  p.collectionAssignments=[...p.collectionAssignments,a];
  v287ReconcileCategoryQueue(cat.id);
  await v287Touch();
  render();
  showToast(`${collection.title} added to ${cat.name} queue ✓`);
}

/* ---------- Assignment management / mixed outer queue -------------- */
function v287AssignmentEligibility(a){
  const collection=v287AssignmentCollection(a);
  const ids=v287CollectionTitleIds(collection),traversed=new Set((a?.traversedTitleIds||[]).map(String));
  let eligible=0,remaining=0,matching=0,completed=0;
  for(const id of ids){
    const item=v287LibraryItem(id);if(!item||v287IsDropped(item))continue;
    const categoryMatches=String(item.categoryId||'')===String(a.categoryId||'');
    if(categoryMatches)matching++;
    const done=v287IsCompleted(item);if(done)completed++;
    if(a.categoryRule==='match'&&!categoryMatches)continue;
    if(a.completedRule!=='include'&&done)continue;
    eligible++;
    if(!traversed.has(String(item.id||'')))remaining++;
  }
  return {total:ids.length,eligible,remaining,matching,completed,traversed:traversed.size};
}
function v287AssignmentRowHtml(a,position,total){
  const c=v287AssignmentCollection(a),cat=v138OrderCategory(a.categoryId),stats=v287AssignmentEligibility(a);
  if(!c)return '';
  let cover='';try{cover=v274CollectionCoverHtml(c,'mf287-assignment-cover');}catch(_){cover=`<div class="mf287-assignment-cover empty">◇</div>`;}
  return `<div class="mf287-queue-item mf287-queue-collection" data-assignment-id="${escapeHtml(a.id)}">
    <div class="mf287-queue-position"><input type="number" min="1" max="${Math.max(1,total)}" value="${position}" aria-label="Collection queue position" onchange="App.v287SetAssignmentPosition('${escapeHtml(a.id)}',this.value)"></div>
    ${cover}
    <div class="mf287-assignment-main">
      <div class="mf287-assignment-title"><span class="mf287-collection-kicker">COLLECTION</span><b>${escapeHtml(String(c.title||'Untitled Collection'))}</b></div>
      <div class="mf287-assignment-meta"><span>${escapeHtml(cat?.name||'Unknown task')}</span><span>·</span><span>${stats.remaining}/${stats.eligible} remaining${stats.remaining===0&&stats.eligible?' · queue complete':''}</span></div>
      <div class="mf287-rule-grid">
        <label><span>Category rule</span><select onchange="App.v287SetAssignmentRule('${escapeHtml(a.id)}','categoryRule',this.value)"><option value="match" ${a.categoryRule==='match'?'selected':''}>Match task category</option><option value="force" ${a.categoryRule==='force'?'selected':''}>Force queue · ignore title category</option></select></label>
        <label><span>Completed titles</span><select onchange="App.v287SetAssignmentRule('${escapeHtml(a.id)}','completedRule',this.value)"><option value="skip" ${a.completedRule==='skip'?'selected':''}>Skip completed</option><option value="include" ${a.completedRule==='include'?'selected':''}>Include completed</option></select></label>
      </div>
    </div>
    <div class="mf287-assignment-actions">
      <button class="btn btn-sm btn-ghost" type="button" ${position<=1?'disabled':''} onclick="App.v287MoveAssignment('${escapeHtml(a.id)}',-1)" title="Move this Collection one queue position earlier">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${position>=total?'disabled':''} onclick="App.v287MoveAssignment('${escapeHtml(a.id)}',1)" title="Move this Collection one queue position later">↓</button>
      ${stats.traversed?`<button class="btn btn-sm btn-ghost" type="button" onclick="App.v287ResetAssignmentProgress('${escapeHtml(a.id)}')">Reset progress</button>`:''}
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v287RemoveCollectionAssignment('${escapeHtml(a.id)}')">Remove</button>
    </div>
  </div>`;
}
function v287QueueBoardHtml(){
  const p=v287EnsureOrderExtensions();
  if(!p.collectionAssignments.length)return '';
  const hidden=new Set((p.hiddenCategories||[]).map(String));
  const groups=[];
  for(const catId of v138CategoryDisplayOrder()){
    const cid=String(catId||'');if(hidden.has(cid))continue;
    const assignments=v287Assignments(cid);if(!assignments.length)continue;
    const cat=v138OrderCategory(cid);if(!cat)continue;
    const queue=v287Queue(cid),rows=[];
    queue.forEach((token,index)=>{
      if(token.startsWith('t:')){
        const item=v138OrderItem(token.slice(2));if(!item)return;
        rows.push(`<div class="mf287-queue-item mf287-queue-title"><span class="mf287-queue-number">${index+1}</span><span class="mf287-title-dot"></span><div><b>${escapeHtml(cleanTitle(item.title))}</b><small>Ordered title · ${escapeHtml(v199StatusLabel(item.status))}</small></div></div>`);
      }else if(token.startsWith('c:')){
        const a=v287Assignment(token.slice(2));if(a)rows.push(v287AssignmentRowHtml(a,index+1,queue.length));
      }
    });
    groups.push(`<section class="card mf287-queue-group"><div class="mf287-queue-head"><div><span class="section-label">COLLECTION QUEUE</span><h3>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</h3><p>Collections are contiguous queue blocks. Their titles are recommended in the Collection's own order before MediaFlow continues to the next outer queue item.</p></div><span class="mf287-queue-count">${queue.length} queue item${queue.length===1?'':'s'}</span></div><div class="mf287-queue-list">${rows.join('')}</div></section>`);
  }
  return groups.length?`<div class="mf287-queue-board">${groups.join('')}</div>`:'';
}
async function v287SetAssignmentRule(id,key,value){
  const p=v287EnsureOrderExtensions(),sid=String(id||''),idx=p.collectionAssignments.findIndex(a=>a.id===sid);if(idx<0)return;
  const old=p.collectionAssignments[idx],next=Object.assign({},old,{modifiedAt:Date.now()});
  if(key==='categoryRule')next.categoryRule=String(value)==='force'?'force':'match';
  else if(key==='completedRule')next.completedRule=String(value)==='include'?'include':'skip';
  else return;
  p.collectionAssignments=p.collectionAssignments.map((a,i)=>i===idx?next:a);
  await v287Touch();render();
}
async function v287MoveAssignment(id,delta){
  const a=v287Assignment(id);if(!a)return;
  const p=v287EnsureOrderExtensions(),cid=String(a.categoryId),q=v287Queue(cid),token=`c:${a.id}`,i=q.indexOf(token),j=Math.max(0,Math.min(q.length-1,i+(Number(delta)||0)));
  if(i<0||i===j)return;
  const [x]=q.splice(i,1);q.splice(j,0,x);p.categoryQueues[cid]=q;
  a.modifiedAt=Date.now();await v287Touch();render();
}
async function v287SetAssignmentPosition(id,value){
  const a=v287Assignment(id);if(!a)return;
  const p=v287EnsureOrderExtensions(),cid=String(a.categoryId),q=v287Queue(cid),token=`c:${a.id}`,from=q.indexOf(token);if(from<0)return;
  const target=Math.max(0,Math.min(q.length-1,(Math.round(Number(value)||1)-1)));
  if(from===target)return;
  q.splice(from,1);q.splice(target,0,token);p.categoryQueues[cid]=q;
  a.modifiedAt=Date.now();await v287Touch();render();
}
async function v287ResetAssignmentProgress(id){
  const p=v287EnsureOrderExtensions(),sid=String(id||''),idx=p.collectionAssignments.findIndex(a=>a.id===sid);if(idx<0)return;
  const next=Object.assign({},p.collectionAssignments[idx],{traversedTitleIds:[],modifiedAt:Date.now()});
  p.collectionAssignments=p.collectionAssignments.map((a,i)=>i===idx?next:a);await v287Touch();render();showToast('Collection queue progress reset');
}
async function v287RemoveCollectionAssignment(id){
  const p=v287EnsureOrderExtensions(),a=v287Assignment(id);if(!a)return;
  const collection=v287AssignmentCollection(a);
  p.collectionAssignments=p.collectionAssignments.filter(x=>x.id!==a.id);
  if(p.categoryQueues?.[a.categoryId])p.categoryQueues[a.categoryId]=p.categoryQueues[a.categoryId].filter(token=>token!==`c:${a.id}`);
  await v287Touch();render();showToast(`${collection?.title||'Collection'} removed from Personal Order`);
}

/* ---------- Recommendation engine ---------------------------------- */
function v287CollectionItemsForAssignment(a){
  const c=v287AssignmentCollection(a);if(!c)return [];
  const traversed=new Set((a?.traversedTitleIds||[]).map(String)),out=[];
  for(const id of v287CollectionTitleIds(c)){
    const item=v287LibraryItem(id);if(!item||v287IsDropped(item))continue;
    if(traversed.has(String(item.id||'')))continue;
    if(a.categoryRule==='match'&&String(item.categoryId||'')!==String(a.categoryId||''))continue;
    if(a.completedRule!=='include'&&v287IsCompleted(item))continue;
    out.push(item);
  }
  return out;
}
function v287RecommendationEntries(categoryId){
  const cid=String(categoryId||'');if(!cid)return [];
  const entries=[],seen=new Set();
  for(const token of v287Queue(cid)){
    if(token.startsWith('t:')){
      const item=v138OrderItem(token.slice(2));
      if(!item||String(item.categoryId||'')!==cid||v287IsDropped(item)||v287IsCompleted(item))continue;
      const id=String(item.id||'');if(id&&!seen.has(id)){seen.add(id);entries.push({item,sourceType:'title',assignmentId:'',token});}
      continue;
    }
    if(token.startsWith('c:')){
      const a=v287Assignment(token.slice(2));if(!a||String(a.categoryId)!==cid)continue;
      for(const item of v287CollectionItemsForAssignment(a)){
        const id=String(item?.id||'');if(!id||seen.has(id))continue;
        seen.add(id);entries.push({item,sourceType:'collection',assignmentId:a.id,token});
      }
    }
  }
  return entries;
}
function v287RecommendationSequence(categoryId){return v287RecommendationEntries(categoryId).map(entry=>entry.item);}
function v287OrderSourceForTask(task){
  if(!task||!task.categoryId||!task.libraryId)return null;
  const hit=v287RecommendationEntries(task.categoryId).find(entry=>String(entry.item?.id||'')===String(task.libraryId||''));
  return hit?{type:hit.sourceType,assignmentId:hit.assignmentId||'',libraryId:String(task.libraryId||''),categoryId:String(task.categoryId||'')}:null;
}
function v287AnnotateTaskOrderSource(task){
  if(!task)return task;
  const source=v287OrderSourceForTask(task);
  if(source)task.v287OrderSource=source;
  else if(task.v287OrderSource)delete task.v287OrderSource;
  return task;
}
function v287EntryConsumesRecommendation(entry,libraryId){
  if(!entry||String(entry.libraryId||'')!==String(libraryId||''))return false;
  if(Number(entry.qty)>0)return true;
  const start=Number(entry.v179StartProgress),end=Number(entry.v179EndProgress);
  if(Number.isFinite(end)&&(!Number.isFinite(start)||end>start))return true;
  return false;
}
function v287StageTraversal(assignmentId,libraryId){
  const p=v287EnsureOrderExtensions(),sid=String(assignmentId||''),idx=p.collectionAssignments.findIndex(a=>a.id===sid);if(idx<0)return null;
  const old=p.collectionAssignments[idx],before=[...(old.traversedTitleIds||[])];
  if(before.includes(String(libraryId||'')))return {idx,before,changed:false};
  const next=Object.assign({},old,{traversedTitleIds:[...before,String(libraryId)],modifiedAt:Date.now()});
  p.collectionAssignments=p.collectionAssignments.map((a,i)=>i===idx?next:a);p.modifiedAt=Date.now();
  return {idx,before,changed:true};
}
function v287RollbackTraversal(stage){
  if(!stage?.changed)return;
  const p=v287EnsureOrderExtensions(),current=p.collectionAssignments[stage.idx];if(!current)return;
  p.collectionAssignments=p.collectionAssignments.map((a,i)=>i===stage.idx?Object.assign({},a,{traversedTitleIds:[...stage.before],modifiedAt:Date.now()}):a);
}

// Annotate every newly generated task with the queue source that produced its
// exact title. This lets Save & Get Next Task advance only the Collection block
// that the user actually followed.
const v287GenerateTaskBase=generateTask;
generateTask=function(excludeIds){return v287AnnotateTaskOrderSource(v287GenerateTaskBase.apply(this,arguments));};

// If Personal Order priority is toggled while a task is active, refresh source
// metadata after v139 refreshes the recommended title.
if(typeof App.togglePrioritizePersonalOrder==='function'){
  const v287TogglePriorityBase=App.togglePrioritizePersonalOrder;
  App.togglePrioritizePersonalOrder=function(){const out=v287TogglePriorityBase.apply(this,arguments);v287AnnotateTaskOrderSource(S.currentTask);try{persistTask();}catch(_){ }return out;};
}
if(typeof App.v180RerollRecommendedTitle==='function'){
  const v287RerollBase=App.v180RerollRecommendedTitle;
  App.v180RerollRecommendedTitle=function(){const out=v287RerollBase.apply(this,arguments);v287AnnotateTaskOrderSource(S.currentTask);try{persistTask();}catch(_){ }return out;};
}

// A Collection is a queue block, not a permanent alias for its first title.
// Once the recommended Collection title is actually logged, mark it traversed
// before the old submit chain generates the next task. If validation rejects
// the log, roll the staged traversal back.
if(typeof App.submitLog==='function'){
  const v287SubmitLogBase=App.submitLog;
  App.submitLog=function(){
    const task=S.currentTask,source=task?.v287OrderSource||v287OrderSourceForTask(task),libraryId=String(task?.libraryId||'');
    const followed=source?.type==='collection'&&source.assignmentId&&libraryId&&(S.logDraft?.entries||[]).some(entry=>v287EntryConsumesRecommendation(entry,libraryId));
    const stage=followed?v287StageTraversal(source.assignmentId,libraryId):null;
    let out;
    try{out=v287SubmitLogBase.apply(this,arguments);}catch(err){v287RollbackTraversal(stage);throw err;}
    const finish=()=>{
      const success=S.logging===false;
      if(stage?.changed&&!success)v287RollbackTraversal(stage);
      if(stage?.changed&&success){v287AnnotateTaskOrderSource(S.currentTask);Promise.resolve(v287Touch()).catch(()=>{});}
      return out;
    };
    if(out&&typeof out.then==='function')return out.then(value=>{out=value;finish();return value;},err=>{v287RollbackTraversal(stage);throw err;});
    finish();return out;
  };
}

// v139's original behavior remains the fallback when there is no eligible
// mixed queue item. The task category/amount/balance logic is never replaced.
const v287PickLibraryTitleBase=pickLibraryTitle;
pickLibraryTitle=function(cat){
  if(S.settings?.prioritizePersonalOrder&&cat?.id){
    const queue=v287RecommendationSequence(cat.id);
    if(queue.length)return queue[0];
  }
  return v287PickLibraryTitleBase.apply(this,arguments);
};

// Reroll history must understand Force Queue too, because those Collection
// titles can legitimately belong to another Library category while the task
// itself remains assigned to the Personal Order category.
if(typeof v180RecommendationCandidates==='function'){
  const v287RecommendationCandidatesBase=v180RecommendationCandidates;
  v180RecommendationCandidates=function(task=S.currentTask){
    if(task&&S.settings?.prioritizePersonalOrder){
      const seen=new Set((typeof v180EnsureRecommendationHistory==='function'?v180EnsureRecommendationHistory(task):[]).map(x=>String(x?.libraryId||'')).filter(Boolean));
      const queue=v287RecommendationSequence(task.categoryId).filter(item=>!seen.has(String(item?.id||'')));
      if(queue.length)return queue;
    }
    return v287RecommendationCandidatesBase.apply(this,arguments);
  };
}

/* ---------- Personal Order UI integration -------------------------- */
const v287PickerHtmlBase=v138PickerHtml;
v138PickerHtml=function(){return `${v287PickerHtmlBase.apply(this,arguments)}<div class="mf287-picker-gap"></div>${v287CollectionPickerHtml()}`;};

const v287RenderOrderBase=renderOrder;
renderOrder=function(){
  let html=v287RenderOrderBase.apply(this,arguments);
  const board=v287QueueBoardHtml();
  if(board)html=html.replace('<div class="v138-order-main">',`<div class="v138-order-main">${board}`);
  const p=v287EnsureOrderExtensions();
  const assignmentCount=p.collectionAssignments.length;
  html=html.replace(/(<div class="v138-order-summary">[\s\S]*?<b>)([\d,]+)(<\/b> ordered title)/,`$1$2$3`);
  if(assignmentCount)html=html.replace(/(<div class="v138-order-summary">[\s\S]*?ordered title(?:s)?)/,`$1 · <b>${assignmentCount}</b> Collection assignment${assignmentCount===1?'':'s'}`);
  return html;
};

/* ---------- Dedicated Order import/export v5 ----------------------- */
const v287OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v287OrderExportPayloadBase.apply(this,arguments),p=v287EnsureOrderExtensions();
  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V287_ORDER_FORMAT_VERSION);
  payload.mediaFlowVersion=V287_RUNTIME_VERSION;
  payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.collectionAssignments=v287Clone(p.collectionAssignments,[]);
  payload.orderPlan.categoryQueues=v287Clone(p.categoryQueues,{});
  payload.collections=v287Collections().filter(c=>p.collectionAssignments.some(a=>String(a.collectionId)===String(c.id))).map(c=>({id:String(c.id),title:String(c.title||''),description:String(c.description||'')}));
  payload.exportAudit=payload.exportAudit||{};
  const includes=new Set([...(Array.isArray(payload.exportAudit.includes)?payload.exportAudit.includes:[]),'collectionAssignments','categoryQueues','collectionReferences']);
  payload.exportAudit.release=V287_RUNTIME_VERSION;payload.exportAudit.includes=[...includes];
  return payload;
};

function v287MapImportedCollectionId(id,descriptors){
  const sid=String(id||'');if(v287Collection(sid))return sid;
  const source=(descriptors||[]).find(c=>String(c?.id||'')===sid);if(!source)return '';
  const key=String(source.title||'').trim().toLowerCase();if(!key)return '';
  return String(v287Collections().find(c=>String(c?.title||'').trim().toLowerCase()===key)?.id||'');
}
const v287ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let extra=null;
  try{
    if(file){
      const data=JSON.parse(await file.text()),raw=data?.orderPlan&&typeof data.orderPlan==='object'?data.orderPlan:data;
      extra={assignments:Array.isArray(raw?.collectionAssignments)?raw.collectionAssignments:[],queues:raw?.categoryQueues&&typeof raw.categoryQueues==='object'?raw.categoryQueues:{},collections:Array.isArray(data?.collections)?data.collections:[],categories:Array.isArray(data?.categories)?data.categories:[],titles:Array.isArray(data?.titles)?data.titles:[]};
    }
  }catch(_){ }
  await v287ImportOrderBase.apply(this,arguments);
  if(!extra?.assignments?.length)return;

  const p=v287EnsureOrderExtensions(),assignmentMap=new Map(),next=[];
  for(const raw of extra.assignments){
    const collectionId=v287MapImportedCollectionId(raw.collectionId,extra.collections);if(!collectionId)continue;
    let categoryId='';try{categoryId=v142MapImportedCategoryId(raw.categoryId,extra.categories);}catch(_){categoryId=String(raw.categoryId||'');}
    if(!categoryId)continue;
    if(next.some(a=>a.collectionId===collectionId&&a.categoryId===categoryId))continue;
    const id=(raw.id&&!next.some(a=>a.id===String(raw.id)))?String(raw.id):v287Id();
    const a=v287NormalizeAssignment(Object.assign({},raw,{id,collectionId,categoryId}),S.categories);if(!a)continue;
    assignmentMap.set(String(raw.id||''),a.id);next.push(a);
  }
  p.collectionAssignments=next;

  // Build old->current title map so queue interleaving survives imports even
  // when Library ids differ on the receiving account.
  const titleMap=new Map();
  for(const d of extra.titles){
    try{const item=v142FindImportedOrderItem(Object.assign({_categories:extra.categories},d));if(item?.id)titleMap.set(String(d.id||''),String(item.id));}catch(_){ }
  }
  const queueOut={};
  for(const [rawCat,tokens] of Object.entries(extra.queues||{})){
    let cid='';try{cid=v142MapImportedCategoryId(rawCat,extra.categories);}catch(_){cid=String(rawCat||'');}
    if(!cid)continue;
    const mapped=[];
    for(const rawToken of (Array.isArray(tokens)?tokens:[])){
      const token=String(rawToken||'');
      if(token.startsWith('t:')){const mappedId=titleMap.get(token.slice(2))||token.slice(2);if(v138OrderItem(mappedId))mapped.push(`t:${mappedId}`);}
      else if(token.startsWith('c:')){const mappedId=assignmentMap.get(token.slice(2));if(mappedId)mapped.push(`c:${mappedId}`);}
    }
    queueOut[cid]=mapped;
  }
  p.categoryQueues=queueOut;v287ReconcileAllQueues();p.modifiedAt=Date.now();await saveState();render();showToast(`Order Collections imported: ${next.length.toLocaleString()} assignment${next.length===1?'':'s'} ✓`);
};
App.v142ImportOrder=v142ImportOrder;

/* ---------- Clear/recovery extensions ------------------------------ */
const v287OrderSnapshotFromBase=v142OrderSnapshotFrom;
v142OrderSnapshotFrom=function(plan){const snap=v287OrderSnapshotFromBase.apply(this,arguments),p=plan||v287EnsureOrderExtensions();snap.collectionAssignments=v287Clone(p.collectionAssignments||[],[]);snap.categoryQueues=v287Clone(p.categoryQueues||{},{});return snap;};
const v287NormalizeSavedOrderSnapshotBase=v142NormalizeSavedOrderSnapshot;
v142NormalizeSavedOrderSnapshot=function(raw,library,categories){
  let out=v287NormalizeSavedOrderSnapshotBase.apply(this,arguments);
  if(!out&&raw&&typeof raw==='object'&&(Array.isArray(raw.collectionAssignments)&&raw.collectionAssignments.length))out={titleIds:[],viewMode:raw.viewMode==='category'?'category':'all',categoryMode:raw.categoryMode==='custom'?'custom':'default',categoryOrder:(S.categories||[]).map(c=>String(c.id)),hiddenCategories:[],savedAt:Math.max(0,Number(raw.savedAt)||Date.now())};
  if(out){out.collectionAssignments=v287NormalizeAssignments(raw?.collectionAssignments,categories);out.categoryQueues=v287NormalizeCategoryQueues(raw?.categoryQueues,categories);}
  return out;
};

// Preserve Collection assignments when Restore Last Order is used.
const v287RestoreLastOrderBase=v142RestoreLastOrder;
v142RestoreLastOrder=async function(){
  const p=v287EnsureOrderExtensions(),last=p.lastClearedOrder?v287Clone(p.lastClearedOrder,null):null;
  await v287RestoreLastOrderBase.apply(this,arguments);
  if(last?.collectionAssignments?.length){const now=v287EnsureOrderExtensions();now.collectionAssignments=v287NormalizeAssignments(last.collectionAssignments,S.categories);now.categoryQueues=v287NormalizeCategoryQueues(last.categoryQueues,S.categories);v287ReconcileAllQueues();now.modifiedAt=Date.now();await saveState();render();}
};
App.v142RestoreLastOrder=v142RestoreLastOrder;


/* ---------- Clear / export first-class Collection queue items -------- */
function v287OrderItemCounts(){const p=v287EnsureOrderExtensions();return {titles:(p.titleIds||[]).length,collections:(p.collectionAssignments||[]).length};}
function v287OrderClearConfirmHtml(){
  const counts=v287OrderItemCounts(),total=counts.titles+counts.collections;
  return `<div class="priority-modal">
    <div class="v142-order-confirm-icon">🧹</div>
    <div class="modal-title">Clear Personal Order?</div>
    <div class="v142-order-confirm-copy">You're about to remove <b>${total.toLocaleString()} queue item${total===1?'':'s'}</b> from Personal Order.</div>
    <div class="v142-order-confirm-box"><b>Your Library and Collections will not be deleted.</b><br>${counts.titles.toLocaleString()} direct title${counts.titles===1?'':'s'} and ${counts.collections.toLocaleString()} Collection assignment${counts.collections===1?'':'s'} will be removed from Personal Order only. MediaFlow keeps one recovery copy for Restore Last Order.</div>
    <div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button><button class="btn btn-danger" type="button" onclick="App.v287ConfirmClearOrder(this)">Clear Order</button></div>
  </div>`;
}
function v287OpenClearOrderConfirm(){
  const counts=v287OrderItemCounts();if(!counts.titles&&!counts.collections){showToast('Your Order is already empty.');return;}
  document.getElementById('modal-root')?.remove();
  const wrap=document.createElement('div');wrap.id='modal-root';wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v287OrderClearConfirmHtml()}</div></div>`;document.body.appendChild(wrap);
}
async function v287ConfirmClearOrder(button){
  if(button?.dataset?.clearing==='1')return;if(button){button.dataset.clearing='1';button.disabled=true;}
  const p=v287EnsureOrderExtensions(),counts=v287OrderItemCounts();if(!counts.titles&&!counts.collections){App.closeModal();return;}
  p.lastClearedOrder=v142OrderSnapshotFrom(p);p.titleIds=[];p.collectionAssignments=[];p.categoryQueues={};p.modifiedAt=Date.now();S.orderPlannerUI?.picks?.clear?.();
  document.getElementById('modal-root')?.remove();S.modal=null;await saveState();render();showToast('Personal Order cleared · Restore Last Order is available');
}
async function v287RestoreLastOrderComplete(){
  const p=v287EnsureOrderExtensions(),last=v142NormalizeSavedOrderSnapshot(p.lastClearedOrder,S.library,S.categories);
  if(!last||(!(last.titleIds||[]).length&&!(last.collectionAssignments||[]).length)){p.lastClearedOrder=null;render();showToast('No cleared Order is available to restore.');return;}
  p.titleIds=[...(last.titleIds||[])];p.viewMode=last.viewMode;p.categoryMode=last.categoryMode;p.categoryOrder=[...(last.categoryOrder||[])];p.hiddenCategories=[...(last.hiddenCategories||[])];p.collectionAssignments=v287NormalizeAssignments(last.collectionAssignments,S.categories);p.categoryQueues=v287NormalizeCategoryQueues(last.categoryQueues,S.categories);p.lastClearedOrder=null;p.modifiedAt=Date.now();v287ReconcileAllQueues();S.orderPlannerUI?.picks?.clear?.();await saveState();render();showToast(`${(p.titleIds.length+p.collectionAssignments.length).toLocaleString()} Personal Order queue item${(p.titleIds.length+p.collectionAssignments.length)===1?'':'s'} restored ✓`);
}
function v287ExportOrder(){
  const p=v287EnsureOrderExtensions(),counts=v287OrderItemCounts();if(!counts.titles&&!counts.collections){showToast('Your Order is empty.');return;}
  const payload=v142OrderExportPayload(),stamp=new Date().toISOString().slice(0,10);triggerDownload(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`MediaFlow_Order_${stamp}.json`);showToast(`${counts.titles.toLocaleString()} title${counts.titles===1?'':'s'} · ${counts.collections.toLocaleString()} Collection assignment${counts.collections===1?'':'s'} exported ✓`);
}
v138ClearOrder=v287OpenClearOrderConfirm;App.v138ClearOrder=v287OpenClearOrderConfirm;v142OpenClearOrderConfirm=v287OpenClearOrderConfirm;v142ConfirmClearOrder=v287ConfirmClearOrder;App.v142ConfirmClearOrder=v287ConfirmClearOrder;v142RestoreLastOrder=v287RestoreLastOrderComplete;App.v142RestoreLastOrder=v287RestoreLastOrderComplete;v142ExportOrder=v287ExportOrder;App.v142ExportOrder=v287ExportOrder;

/* ---------- Release audit / public API ------------------------------ */
function v287PickForCategory(categoryId){const cat=v138OrderCategory(categoryId);const item=cat?pickLibraryTitle(cat):null;return item?{id:String(item.id||''),title:cleanTitle(item.title||''),categoryId:String(item.categoryId||'')}:null;}

function v287AuditState(){
  const p=v287EnsureOrderExtensions(),snap=(()=>{try{return snapshot();}catch(_){return null;}})(),order=(()=>{try{return v142OrderExportPayload();}catch(_){return null;}})();
  return {
    version:287,
    collectionAssignments:p.collectionAssignments.length,
    categoryQueueCount:Object.keys(p.categoryQueues||{}).length,
    snapshotAssignments:Array.isArray(snap?.orderPlan?.collectionAssignments),
    personalOrderExportVersion:Number(order?.formatVersion)||0,
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    collectionsExportVersion:2,
    pwaRelease:287
  };
}

Object.assign(App,{
  v287SetCollectionSearch,v287SetCollectionCategory,v287AddCollectionAssignment,
  v287SetAssignmentRule,v287MoveAssignment,v287SetAssignmentPosition,v287ResetAssignmentProgress,v287RemoveCollectionAssignment,
  v287RecommendationSequence,v287Queue,v287PickForCategory,v287ConfirmClearOrder,v287AuditState
});
window.MediaFlowV287={version:287,focus:'Personal Order Collection queue blocks with per-assignment category/completed rules'};
MediaFlowRuntime.version=V287_RUNTIME_VERSION;
