/* MediaFlow v379 — Logging recovery, permanent selection, canonical mixed order.
 * v378 Tenrai repair remains installed by its independent bundle.
 * This module does not modify Library cover URLs or shared title artwork.
 */
const V379_RELEASE=379;

// --- Logging: discard the conflicting secondary v378 collapse state.
function v379RemoveBrokenControls(root){
  root.querySelectorAll('.mf378-collapse-toolbar,.mf378-collapse-one').forEach(x=>x.remove());
  root.querySelectorAll('.mf378-collapsed').forEach(x=>x.classList.remove('mf378-collapsed'));
}
function v379FixLoggingMarkup(raw){
  if(!S.logDraft)return raw;
  const box=document.createElement('div');box.innerHTML=String(raw||'');
  const form=box.querySelector('.log-form');if(!form)return raw;
  form.classList.add('mf379-logging');
  v379RemoveBrokenControls(form);
  const bar=form.querySelector('.v370-logging-actions');
  if(bar){
    const clear=bar.querySelector('.v370-clear-btn');
    const button=document.createElement('button');button.type='button';button.className='btn btn-sm v379-toggle-list';
    button.setAttribute('onclick','App.v379ToggleAddedTitles()');
    const hidden=!!S.logDraft.v379HideAddedTitles;
    button.innerHTML=(hidden?'◉ Show Added Titles':'◉ Hide Added Titles');
    if(clear)bar.insertBefore(button,clear);else bar.append(button);
  }
  const hidden=!!S.logDraft.v379HideAddedTitles;
  const panels=form.querySelector('.v370-panels,.v369-panels');
  if(panels){panels.classList.add('mf379-added-panels');panels.hidden=hidden;panels.style.display=hidden?'none':'';}
  const quick=form.querySelector('.v239-logged-title-list');
  if(quick){quick.classList.add('mf379-added-panels');quick.hidden=hidden;quick.style.display=hidden?'none':'';}
  // Quick logging uses the v239 card renderer, so it needs its own working
  // right-side card control; the v378 duplicate under the poster is removed.
  if(S.logDraft.v369Interface!=='itemized'){
    form.querySelectorAll('.v239-logged-title-card').forEach((card,index)=>{
      const entry=S.logDraft.entries?.[index];if(!entry)return;
      const closed=!!entry.v379QuickCollapsed;card.classList.toggle('mf379-quick-collapsed',closed);
      const actions=card.querySelector('.v239-logged-title-actions');
      if(actions){
        const control=document.createElement('button');control.type='button';control.className='btn btn-sm mf379-quick-expand';
        control.setAttribute('onclick',`App.v379ToggleQuickTitle(${index})`);
        control.setAttribute('aria-expanded',String(!closed));control.textContent=closed?'Expand':'Collapse';
        actions.insertBefore(control,actions.firstChild);
      }
    });
  }
  form.querySelectorAll('.v370-title-actions button[onclick*="v369ToggleTitle"]').forEach(btn=>{
    btn.classList.add('mf379-authoritative-expander');
    const row=btn.closest('.v370-title');const index=Number(row?.dataset?.v369Title);
    if(Number.isInteger(index)){const collapsed=!!S.logDraft.entries?.[index]?.v369Collapsed;btn.setAttribute('aria-expanded',String(!collapsed));}
  });
  return box.innerHTML;
}
const v379RenderLoggingBase=renderLogForm;
renderLogForm=function(){return v379FixLoggingMarkup(v379RenderLoggingBase.apply(this,arguments));};
App.v379ToggleQuickTitle=function(index){
  const entry=S.logDraft?.entries?.[Number(index)];if(!entry)return;
  entry.v379QuickCollapsed=!entry.v379QuickCollapsed;
  const card=document.querySelectorAll('.log-form .v239-logged-title-card')[Number(index)];
  if(card){card.classList.toggle('mf379-quick-collapsed',entry.v379QuickCollapsed);
    const button=card.querySelector('.mf379-quick-expand');if(button){button.textContent=entry.v379QuickCollapsed?'Expand':'Collapse';button.setAttribute('aria-expanded',String(!entry.v379QuickCollapsed));}
  }
  v369Touch();
};
App.v379ToggleAddedTitles=function(){
  if(!S.logDraft)return;
  const hidden=S.logDraft.v379HideAddedTitles=!S.logDraft.v379HideAddedTitles;
  const form=document.querySelector('.log-form');
  form?.querySelectorAll('.mf379-added-panels').forEach(panel=>{panel.hidden=hidden;panel.style.display=hidden?'none':'';});
  const button=form?.querySelector('.v379-toggle-list');if(button)button.textContent=hidden?'◉ Show Added Titles':'◉ Hide Added Titles';
  v369Touch();
};
// Older v378 refresh hook may reapply a hidden class to the still-visible unit editor.
const v379RefreshBase=v369RefreshPanels;
v369RefreshPanels=function(){const result=v379RefreshBase.apply(this,arguments);const form=document.querySelector('.log-form');if(form)v379RemoveBrokenControls(form);return result;};

// --- Logging Library: no Clean Covers mode, one authoritative selection set.
V378_LOG_UI.clean=false;
function v379SelectedCount(){const added=v378AddedIds();return [...V378_LOG_UI.selected].filter(id=>!added.has(id)).length;}
function v379UpdatePickerActions(){
  const root=document.querySelector('.mf378-library-actions');if(!root)return;
  const n=v379SelectedCount();
  const actions=[...root.querySelectorAll('button')];
  const add=actions.find(b=>b.getAttribute('onclick')?.includes('v378BulkAdd'));
  const clear=actions.find(b=>b.getAttribute('onclick')?.includes('v378DeselectAll'));
  if(add){add.disabled=n===0;add.textContent=`Add Selected (${n})`;}
  if(clear)clear.disabled=V378_LOG_UI.selected.size===0;
  document.querySelectorAll('.mf378-picker .log-suggestion[data-mf378-id]').forEach(row=>{
    const selected=V378_LOG_UI.selected.has(row.dataset.mf378Id);
    row.classList.toggle('mf379-picked',selected);
    const input=row.querySelector('.mf378-check input');if(input)input.checked=selected;
  });
}
const v379LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
  const raw=String(v379LogToolsBase.apply(this,arguments)||'');
  const box=document.createElement('div');box.innerHTML=raw;
  box.querySelectorAll('.mf378-clean-toggle').forEach(x=>x.remove());
  const tools=box.querySelector('.mf378-library-actions');if(tools)tools.classList.add('mf379-library-actions');
  return box.innerHTML;
};
const v379LogSuggestBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
  V378_LOG_UI.clean=false;
  const raw=String(v379LogSuggestBase.apply(this,arguments)||'');
  const box=document.createElement('div');box.innerHTML=raw;
  const list=box.querySelector('.mf378-picker');if(!list)return raw;
  list.classList.remove('mf378-clean');list.classList.add('mf379-picker');
  list.querySelectorAll('.log-suggestion').forEach(row=>{
    const check=row.querySelector(':scope > .mf378-check');
    if(check){check.classList.add('mf379-integrated-check');row.classList.toggle('mf379-picked',!!check.querySelector('input')?.checked);}
    const add=row.querySelector('.mf378-add-btn');
    if(add && (add.disabled || add.textContent.trim()==='Added')){
      add.innerHTML=`${v225IconSvg('<path d="m4 12 5 5L20 6"/><circle cx="12" cy="12" r="10"/>')} Added`;
    }
  });
  return box.innerHTML;
};
App.v378Pick=function(id,value){
  id=String(id);if(value&&!v378AddedIds().has(id))V378_LOG_UI.selected.add(id);
  else V378_LOG_UI.selected.delete(id);
  // Update the existing toolbar in place. Rebuilding only the suggestion list
  // left the add button disabled until Select Visible had been clicked.
  v379UpdatePickerActions();
};
App.v378SelectVisible=function(){
  const q=String(S.entryDraft?.title||'').trim(),candidates=logTitleCandidates(q),added=v378AddedIds();
  for(const item of candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize)){
    if(item&&!added.has(String(item.id))&&item.status!=='dropped')V378_LOG_UI.selected.add(String(item.id));
  }
  v379UpdatePickerActions();
};
App.v378DeselectAll=function(){V378_LOG_UI.selected.clear();v379UpdatePickerActions();};
App.v378LogClean=function(){V378_LOG_UI.clean=false;};

// --- Mixed Personal Order: synchronize category queue tokens and title-only
// index once after each intentional movement, avoiding reconciliation reversal.
function v379SyncTitleSubset(cid,queue){
  const p=v138EnsureOrderPlan(),titleIds=queue.filter(t=>t.startsWith('t:')).map(t=>t.slice(2));
  const slots=[];
  for(let i=0;i<p.titleIds.length;i++)if(String(v138OrderItem(p.titleIds[i])?.categoryId||'')===String(cid))slots.push(i);
  if(slots.length!==titleIds.length)return false;
  slots.forEach((pos,i)=>p.titleIds[pos]=titleIds[i]);
  return true;
}
// Serialize cloud/local writes for rapid mixed moves; never allow an older
// pending save to start after a newer one. This replaces the costly
// all-category reconciliation performed by the older title-only touch path.
let V379_ORDER_SAVE_TIMER=0,V379_ORDER_SAVE_DIRTY=false,V379_ORDER_SAVE_BUSY=false;
async function v379FlushMixedSave(){
  if(V379_ORDER_SAVE_BUSY||!V379_ORDER_SAVE_DIRTY)return;
  V379_ORDER_SAVE_BUSY=true;V379_ORDER_SAVE_DIRTY=false;
  try{await saveState();}catch(error){console.error('v379 queue save',error);V379_ORDER_SAVE_DIRTY=true;}
  finally{V379_ORDER_SAVE_BUSY=false;if(V379_ORDER_SAVE_DIRTY)v379ScheduleMixedSave();}
}
function v379ScheduleMixedSave(){
  v138EnsureOrderPlan().modifiedAt=Date.now();
  V379_ORDER_SAVE_DIRTY=true;
  if(V379_ORDER_SAVE_TIMER)clearTimeout(V379_ORDER_SAVE_TIMER);
  V379_ORDER_SAVE_TIMER=setTimeout(()=>{V379_ORDER_SAVE_TIMER=0;v379FlushMixedSave();},180);
}
window.addEventListener('pagehide',()=>{if(V379_ORDER_SAVE_DIRTY)v379FlushMixedSave();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&V379_ORDER_SAVE_DIRTY)v379FlushMixedSave();});
function v379RepaintMixedQueue(cid,queue){
  // Fast path: reorder only the DOM children of a fully-rendered category
  // queue. Paginated/global views fall back to the existing full render.
  for(const container of document.querySelectorAll('.mf287-queue-list,.v138-order-list')){
    const rows=[...container.children].filter(el=>el.dataset?.mf379Token);
    if(rows.length!==queue.length||rows.length<2)continue;
    const byToken=new Map(rows.map(el=>[el.dataset.mf379Token,el]));
    if(queue.some(token=>!byToken.has(token)))continue;
    for(const token of queue)container.appendChild(byToken.get(token));
    queue.forEach((token,index)=>{
      const row=byToken.get(token);const input=row?.querySelector('.v157-position-input,.mf287-queue-position input');
      if(input){input.value=String(index+1);input.max=String(queue.length);}
      const label=row?.querySelector('.mf287-queue-number,.mf376-global-number');
      if(label)label.textContent=String(index+1);
      // Locally repainted rows must update boundary controls, otherwise a
      // moved first/last item keeps stale disabled arrows until a full render.
      const up=row?.querySelector('.v138-order-actions button[title="Move up"],.mf287-assignment-actions button[title*="earlier"]');
      const down=row?.querySelector('.v138-order-actions button[title="Move down"],.mf287-assignment-actions button[title*="later"]');
      if(up)up.disabled=index===0;
      if(down)down.disabled=index===queue.length-1;
    });
    return true;
  }
  return false;
}
function v379MoveQueueToken(cid,token,targetIndex,{save=true}={}){
  cid=String(cid||'');token=String(token||'');
  if(!cid||!token)return false;
  const p=v287EnsureOrderExtensions(),q=v287Queue(cid),from=q.indexOf(token);
  if(from<0)return false;
  const to=Math.max(0,Math.min(q.length-1,Number(targetIndex)));
  if(!Number.isInteger(to)||from===to)return false;
  q.splice(from,1);q.splice(to,0,token);
  p.categoryQueues[cid]=q;
  v379SyncTitleSubset(cid,q);
  if(save){v379ScheduleMixedSave();if(!v379RepaintMixedQueue(cid,q))render();}
  return true;
}
function v379CategoryForToken(token){
  if(token.startsWith('c:'))return String(v287Assignment(token.slice(2))?.categoryId||'');
  if(token.startsWith('t:'))return String(v138OrderItem(token.slice(2))?.categoryId||'');
  return '';
}
App.v379MoveToken=function(cid,token,delta){const q=v287Queue(cid),from=q.indexOf(token);return from<0?false:v379MoveQueueToken(cid,token,from+Number(delta));};
App.v379PositionToken=function(cid,token,value){const n=Math.floor(Number(value));if(!Number.isFinite(n))return false;return v379MoveQueueToken(cid,token,n-1);};
// Both titles and Collections now use the exact same queue mutation.
App.v287MoveAssignment=function(id,delta){const a=v287Assignment(id);if(a)return App.v379MoveToken(String(a.categoryId),`c:${a.id}`,delta);};
App.v287SetAssignmentPosition=function(id,value){const a=v287Assignment(id);if(a)return App.v379PositionToken(String(a.categoryId),`c:${a.id}`,value);};
App.v138MoveTitleInCategory=function(id,cid,delta){return App.v379MoveToken(String(cid),`t:${id}`,delta);};
App.v138MoveTitle=function(id,delta){const cid=v379CategoryForToken(`t:${id}`);if(cid&&v287Assignments(cid).length)return App.v379MoveToken(cid,`t:${id}`,delta);return v138MoveTitle(id,delta);};
const v379SetTitlePositionBase=App.v157SetOrderTitlePosition;
App.v157SetOrderTitlePosition=function(id,value,cid=''){
  const category=String(cid||v379CategoryForToken(`t:${id}`));
  if(category&&v287Assignments(category).length){
    const q=v287Queue(category),local=q.indexOf(`t:${id}`);
    // In the continuous All Titles panel, input positions are displayed globally;
    // resolve them back to their category's queue window before changing data.
    if(!cid){
      const target=document.activeElement;const row=target?.closest?.('.v138-order-row');
      const all=row?.closest?.('.mf378-mixed-all');
      if(all){const rows=[...all.querySelectorAll('.v138-order-row,.mf287-queue-collection')];
        const dest=Math.floor(Number(value))-1;
        if(dest>=0&&dest<rows.length){const destToken=rows[dest].dataset.mf379Token;
          if(destToken&&v379CategoryForToken(destToken)===category){const index=q.indexOf(destToken);return v379MoveQueueToken(category,`t:${id}`,index);}
        }
      }
    }
    return v379MoveQueueToken(category,`t:${id}`,Math.floor(Number(value))-1);
  }
  return v379SetTitlePositionBase.apply(this,arguments);
};

// Attach stable token IDs to actual rows. Preserve the original cover HTML.
const v379TitleRowBase=v138OrderRowHtml;
v138OrderRowHtml=function(item,position,category){
  const html=String(v379TitleRowBase.apply(this,arguments)||'');
  return html.replace('class="v138-order-row"',`class="v138-order-row mf379-draggable" data-mf379-token="t:${escapeHtml(String(item.id))}"`);
};
const v379AssignmentBase=v288AssignmentRowHtml;
v288AssignmentRowHtml=function(a,position,total,context){
  const html=String(v379AssignmentBase.apply(this,arguments)||'');
  return html.replace(/class="mf287-queue-item ([^"]*mf287-queue-collection[^"]*)"/,`class="mf287-queue-item $1 mf379-draggable" data-mf379-token="c:${escapeHtml(String(a.id))}" draggable="true"`)
    .replace('class="mf287-assignment-actions',`class="mf287-assignment-actions`)
    .replace(/(<div class="mf287-assignment-actions[^\"]*">)/,`<div class="mf379-collection-grip" draggable="true" title="Drag Collection to reorder" aria-label="Drag Collection to reorder">⠿</div>$1`);
};
// v287 points at the v288 implementation and must follow our wrapper too.
v287AssignmentRowHtml=v288AssignmentRowHtml;
// Queue-only direct rows are also valid draggable mixed title tokens.
const v379QueueTitleBase=v288DirectQueueTitleHtml;
v288DirectQueueTitleHtml=function(item,position){return String(v379QueueTitleBase.apply(this,arguments)||'').replace('class="mf287-queue-item mf287-queue-title','class="mf287-queue-item mf287-queue-title mf379-draggable').replace('mf288-queue-title-with-cover"','mf288-queue-title-with-cover" data-mf379-token="t:'+escapeHtml(String(item.id))+'" draggable="true"');};

let V379_DRAG=null;
function v379DragRow(element){return element?.closest?.('[data-mf379-token]')||null;}
function v379Drop(sourceRow,targetRow,after){
  if(!sourceRow||!targetRow||sourceRow===targetRow)return false;
  const token=sourceRow.dataset.mf379Token,target=targetRow.dataset.mf379Token;
  const cid=v379CategoryForToken(token);
  if(!cid||cid!==v379CategoryForToken(target))return false;
  const q=v287Queue(cid),from=q.indexOf(token),at=q.indexOf(target);
  if(from<0||at<0)return false;
  let to=at+(after?1:0);if(from<to)to--;
  return v379MoveQueueToken(cid,token,to);
}
document.addEventListener('dragstart',e=>{
  const row=v379DragRow(e.target);if(!row)return;
  if(e.target.closest('input,select,button')){e.preventDefault();return;}
  V379_DRAG={row,token:row.dataset.mf379Token};
  e.dataTransfer?.setData('text/plain',V379_DRAG.token);
  if(e.dataTransfer)e.dataTransfer.effectAllowed='move';
  row.classList.add('mf379-dragging');
  e.stopImmediatePropagation();
},true);
document.addEventListener('dragover',e=>{
  if(!V379_DRAG)return;const row=v379DragRow(e.target);if(!row)return;
  e.preventDefault();e.stopImmediatePropagation();
  document.querySelectorAll('.mf379-drop-before,.mf379-drop-after').forEach(x=>x.classList.remove('mf379-drop-before','mf379-drop-after'));
  const rect=row.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2;
  row.classList.add(after?'mf379-drop-after':'mf379-drop-before');
},true);
document.addEventListener('drop',e=>{
  if(!V379_DRAG)return;const target=v379DragRow(e.target);
  if(target){e.preventDefault();e.stopImmediatePropagation();const rect=target.getBoundingClientRect();v379Drop(V379_DRAG.row,target,e.clientY>rect.top+rect.height/2);}
  V379_DRAG=null;
  document.querySelectorAll('.mf379-drop-before,.mf379-drop-after,.mf379-dragging').forEach(x=>x.classList.remove('mf379-drop-before','mf379-drop-after','mf379-dragging'));
},true);
document.addEventListener('dragend',()=>{V379_DRAG=null;document.querySelectorAll('.mf379-drop-before,.mf379-drop-after,.mf379-dragging').forEach(x=>x.classList.remove('mf379-drop-before','mf379-drop-after','mf379-dragging'));},true);
// A touch drag starts only on the dedicated handle, never on an interactive button.
let V379_TOUCH=null;
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;
  const handle=e.target.closest?.('.mf379-collection-grip,.v138-drag-handle');
  if(!handle)return;const row=v379DragRow(handle);if(!row)return;
  V379_TOUCH={source:row,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,pointerId:e.pointerId};
},true);
document.addEventListener('pointermove',e=>{
  const d=V379_TOUCH;if(!d||d.pointerId!==e.pointerId)return;
  d.x=e.clientX;d.y=e.clientY;
  if(Math.abs(d.x-d.startX)+Math.abs(d.y-d.startY)>12)d.active=true;
  if(d.active){const row=v379DragRow(document.elementFromPoint(e.clientX,e.clientY));
    document.querySelectorAll('.mf379-drop-before,.mf379-drop-after').forEach(x=>x.classList.remove('mf379-drop-before','mf379-drop-after'));
    if(row){const rect=row.getBoundingClientRect();row.classList.add(e.clientY>rect.top+rect.height/2?'mf379-drop-after':'mf379-drop-before');}
  }
},true);
document.addEventListener('pointerup',e=>{
  const d=V379_TOUCH;if(!d||d.pointerId!==e.pointerId)return;
  V379_TOUCH=null;
  const target=d.active?v379DragRow(document.elementFromPoint(e.clientX,e.clientY)):null;
  if(target){const rect=target.getBoundingClientRect();v379Drop(d.source,target,e.clientY>rect.top+rect.height/2);}
  document.querySelectorAll('.mf379-drop-before,.mf379-drop-after').forEach(x=>x.classList.remove('mf379-drop-before','mf379-drop-after'));
},true);

// Display-only semantic icons for the Tenrai report, installed as a mutation
// observer because v377 report content is inserted without full-page renders.
const V379_ICON_PATHS={
  all:'<path d="M8 6h13M8 12h13M8 18h13M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  selected:'<path d="M3 12l5 5L21 4M3 20h18"/>',
  retry:'<path d="M20 7v-5M20 7h-5M20 7A8 8 0 1 0 21.5 15"/>',
  unmatched:'<path d="M8 6h13M8 12h9M8 18h7"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'
};
function v379IconifyReport(root){
  root?.querySelectorAll?.('button[onclick*="v377Retry"],button[onclick*="v377ShowUnmatchedReport"]').forEach(btn=>{
    if(btn.dataset.mf379Icon)return;
    const call=btn.getAttribute('onclick')||'';
    const icon=call.includes("'all'")?'all':call.includes("'selected'")?'selected':call.includes('ShowUnmatched')?'unmatched':'retry';
    // Preserve the existing label and theme colors; replace only the emblem.
    btn.querySelectorAll('.v225-btn-icon').forEach(x=>x.remove());
    btn.insertAdjacentHTML('afterbegin',v225IconSvg(V379_ICON_PATHS[icon]));
    btn.dataset.mf379Icon=icon;
  });
}
const V379_REPORT_OBSERVER=new MutationObserver(changes=>{
  for(const change of changes)for(const node of change.addedNodes){
    if(node.nodeType===1&&(node.matches?.('.mf377-report-toolbar,.mf377-jikan-report-actions,.mf377-report-actions')||node.querySelector?.('.mf377-report-toolbar,.mf377-jikan-report-actions,.mf377-report-actions'))){v379IconifyReport(node.parentElement||node);return;}
  }
});
if(document.documentElement)V379_REPORT_OBSERVER.observe(document.documentElement,{childList:true,subtree:true});

MediaFlowRuntime.version=V379_RELEASE;
window.MediaFlowV379={version:379,moveMixed:v379MoveQueueToken,features:['Logging expansion recovery','Show or hide added titles','Always-on multiselect','Mixed title-Collection order','Drag assigned Collections','Tenrai repair retained']};
