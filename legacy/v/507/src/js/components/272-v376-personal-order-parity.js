/* MediaFlow v376 — Personal Order number/cover parity and continuous Collection Queue.
 * This is a view-only extension. Canonical mixed queue tokens, per-category
 * assignment positions, reordering actions and cloud schemas are unchanged.
 * In Lists / All Titles, every visible category's queue is displayed in one
 * continuous list. Lists / By Category retains independently grouped queues.
 */
const V376_RELEASE=376;
function v376VisibleQueues(){
  const p=v287EnsureOrderExtensions();
  const hidden=new Set((p.hiddenCategories||[]).map(String));
  const groups=[];
  for(const categoryId of v138CategoryDisplayOrder()){
    const cid=String(categoryId);
    if(hidden.has(cid))continue;
    const cat=v138OrderCategory(cid);
    if(!cat)continue;
    const tokens=v287Queue(cid);
    // The Collection Queue exists only where the task has assignments.
    if(!v287Assignments(cid).length)continue;
    groups.push({cid,cat,tokens});
  }
  return groups;
}
function v376DisplayAssignment(a,localPosition,total,globalPosition){
  // Keep the editable input's canonical *category-local* position, and expose
  // the global display number separately (never write global values to state).
  const html=v288AssignmentRowHtml(a,localPosition,total,'collection');
  const marker='<div class="mf287-queue-position"><input';
  return html.replace(marker,`<div class="mf287-queue-position mf376-global-assignment-position"><span class="mf376-global-number" aria-label="Continuous queue position ${globalPosition}">${globalPosition}</span><input title="Edit position within this category queue"`);
}
function v376ContinuousCollectionQueue(){
  const groups=v376VisibleQueues(),assignments=v287EnsureOrderExtensions().collectionAssignments||[];
  if(!groups.length)return '';
  let globalPosition=0;
  const rows=[];
  for(const {cid,cat,tokens} of groups){
    for(let index=0;index<tokens.length;index++){
      const token=tokens[index];
      if(token.startsWith('t:')){
        const item=v138OrderItem(token.slice(2));if(!item)continue;
        globalPosition++;
        rows.push(v288DirectQueueTitleHtml(item,globalPosition));
      }else if(token.startsWith('c:')){
        const assignment=v287Assignment(token.slice(2));if(!assignment)continue;
        globalPosition++;
        rows.push(v376DisplayAssignment(assignment,index+1,tokens.length,globalPosition));
      }
    }
  }
  return `<div class="mf287-queue-board mf288-collection-board mf376-continuous-board" data-v376-queue-mode="all">
    <div class="mf288-section-heading"><div><span class="section-label">COLLECTION QUEUE</span><h2>All queue items</h2><small>One continuous list in Settings category order. Each assigned Collection retains its own task/category rules.</small></div><small>${rows.length.toLocaleString()} queue items · ${assignments.length.toLocaleString()} Collection assignments</small></div>
    <section class="card mf287-queue-group mf288-collection-queue-group mf376-all-queue" aria-label="All Collection queue items">
      <div class="mf287-queue-list v138-order-list">${rows.join('')||'<div class="v138-order-empty">No queue items.</div>'}</div>
    </section>
  </div>`;
}
const v376CategoryQueueBase=v288CollectionQueueBoardHtml;
v288CollectionQueueBoardHtml=function(){
  if(v288EnsureQueueView().layoutMode==='lists'&&v287EnsureOrderExtensions().viewMode==='all')return v376ContinuousCollectionQueue();
  return v376CategoryQueueBase.apply(this,arguments);
};
// Explicitly avoid changes to the Tabs category switch, filters, Queue Tools,
// pagination or the source renderers. All share the same v376 CSS row contract.
MediaFlowRuntime.version=V376_RELEASE;
window.MediaFlowV376={version:376,features:['Shared readable 3+ digit order badges','Cover/number separation on titles and assigned Collections','Responsive expanded Collection title rows','Continuous Collection Queue in Lists / All Titles','Preserved grouped Collection Queues in Lists / By Category']};
