/* MediaFlow v373 — Logging order studio.
 * Presentation-only sort/order of entries in the canonical v285/v369 draft.
 * Underlying draft entries and all existing indexes/XP/History calculations stay unchanged.
 */
const V373_RELEASE=373;
const V373_SORTS=[
  ['logAdded','Added to Logging'],
  ['progress','Current progress'],
  ['total','Total episodes / chapters'],
  ['priority','Priority'],
  ['title','Alphabetical'],
  ['logging','Last updated by logging'],
  ['edited','Last edited'],
  ['seen','Last seen in Anime Details'],
  ['added','Date added to Library'],
  ['random','Random'],
  ['custom','Custom order']
];
const V373_PICKER_SORTS=V373_SORTS.filter(([key])=>key!=='custom');
const V373_ALLOWED=new Set(V373_SORTS.map(x=>x[0]));
function v373OrderState(){
  const draft=S.logDraft;
  if(!draft||typeof draft!=='object')return {sort:'logAdded',dir:'asc',manualIds:[],randomSeed:1};
  if(!draft.v373Ordering||typeof draft.v373Ordering!=='object')draft.v373Ordering={sort:'logAdded',dir:'asc',manualIds:[],randomSeed:1};
  const st=draft.v373Ordering;
  if(!V373_ALLOWED.has(st.sort))st.sort='logAdded';
  st.dir=st.dir==='desc'?'desc':'asc';
  if(!Array.isArray(st.manualIds))st.manualIds=[];
  if(!Number.isSafeInteger(st.randomSeed)||st.randomSeed<1)st.randomSeed=1;
  return st;
}
function v373EntryKey(e){
  if(!e.v373Key)e.v373Key='mf373-'+uid();
  return String(e.v373Key);
}
function v373IndexedEntries(){
  const list=S.logDraft?.entries||[];
  return list.map((entry,index)=>({entry,index,id:v373EntryKey(entry),item:v369ItemTitle(entry)}));
}
function v373SeedHash(string,seed){
  let h=(2166136261^(seed>>>0))>>>0;
  for(let i=0;i<string.length;i++)h=Math.imul(h^string.charCodeAt(i),16777619)>>>0;
  h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;
}
function v373Timestamp(v){
  const n=Number(v);if(Number.isFinite(n)&&n>0)return n;
  if(typeof v==='string'){const d=Date.parse(v);return Number.isFinite(d)?d:0;}
  return 0;
}
function v373CompareData(a,b,field,dir){
  const sign=dir==='desc'?-1:1;
  const itemA=a.item||{},itemB=b.item||{};
  if(field==='title')return sign*cleanTitle(itemA.title||a.entry.title||'').localeCompare(cleanTitle(itemB.title||b.entry.title||''),undefined,{sensitivity:'base',numeric:true});
  if(field==='priority'){
    const ranks={low:0,medium:1,high:2};
    return sign*((ranks[String(itemA.priority||'medium').toLowerCase()]??1)-(ranks[String(itemB.priority||'medium').toLowerCase()]??1));
  }
  let av=0,bv=0;
  const num=(v)=>Number.isFinite(Number(v))?Number(v):0;
  switch(field){
    case 'logAdded':av=v373Timestamp(a.entry.loggedAt)||a.index+1;bv=v373Timestamp(b.entry.loggedAt)||b.index+1;break;
    case 'progress':av=num(itemA.progress);bv=num(itemB.progress);break;
    case 'total':av=num(itemA.total);bv=num(itemB.total);break;
    case 'logging':av=v373Timestamp(a.item?v53LastTouched(itemA):0);bv=v373Timestamp(b.item?v53LastTouched(itemB):0);break;
    case 'edited':av=v373Timestamp(itemA.modifiedAt||itemA.createdAt);bv=v373Timestamp(itemB.modifiedAt||itemB.createdAt);break;
    case 'seen':av=v373Timestamp(itemA.lastSeenAt);bv=v373Timestamp(itemB.lastSeenAt);break;
    case 'added':av=v373Timestamp(itemA.createdAt);bv=v373Timestamp(itemB.createdAt);break;
  }
  // Unknown timestamps always go last regardless of direction.
  if(['logging','edited','seen','added'].includes(field)){
    if(!av&&bv)return 1;
    if(av&&!bv)return -1;
  }
  return sign*(av-bv);
}
function v373OrderedEntries(){
  const st=v373OrderState(),entries=v373IndexedEntries();
  if(st.sort==='custom'){
    const positions=new Map(st.manualIds.map((id,i)=>[String(id),i]));
    entries.sort((a,b)=>(positions.has(a.id)?positions.get(a.id):Number.MAX_SAFE_INTEGER)-(positions.has(b.id)?positions.get(b.id):Number.MAX_SAFE_INTEGER)||a.index-b.index);
  }else if(st.sort==='random'){
    entries.sort((a,b)=>v373SeedHash(a.id,st.randomSeed)-v373SeedHash(b.id,st.randomSeed)||a.index-b.index);
  }else if(st.sort==='logAdded' && st.dir==='asc'){
    // Baseline for pre-v373 drafts: original insertion order, not last edited time.
    entries.sort((a,b)=>a.index-b.index);
  }else{
    entries.sort((a,b)=>v373CompareData(a,b,st.sort,st.dir)||a.index-b.index);
  }
  return entries;
}
function v373ToolbarHtml(){
  const st=v373OrderState(),size=(S.logDraft?.entries||[]).length;
  return `<section class="mf373-toolbar" aria-label="Logging title sorting and ordering">
    <div class="mf373-toolbar-copy"><span class="mf373-eyebrow">TITLE ORGANIZATION</span><strong>Arrange your session</strong><small>Sorting changes the view, never the recorded progress. Your custom sequence stays saved with this draft.</small></div>
    <div class="mf373-toolbar-actions"><label class="mf373-sort-label" for="mf373-sort">Sort titles<select id="mf373-sort" onchange="App.v373SetSort(this.value)">${V373_SORTS.map(([key,label])=>`<option value="${key}" ${st.sort===key?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label>
    <button class="btn btn-sm mf373-dir" type="button" ${['custom','random'].includes(st.sort)?'disabled':''} onclick="App.v373ToggleDirection()" title="Reverse sort direction" aria-label="Reverse sort direction">${st.dir==='asc'?'↑ Asc':'↓ Desc'}</button>
    <button class="btn btn-sm mf373-shuffle" type="button" ${st.sort!=='random'?'hidden':''} onclick="App.v373Reshuffle()" aria-label="Shuffle titles again">Reshuffle</button>
    <span class="mf373-count">${size} title${size===1?'':'s'}</span></div>
  </section>`;
}
function v373ActiveList(root){
  const form=root?.matches?.('.log-form')?root:root?.querySelector?.('.log-form');
  if(!form)return null;
  const itemized=S.logDraft?.v369Interface==='itemized';
  return itemized?form.querySelector('.v370-panels'):form.querySelector('.v239-logged-title-list');
}
function v373DecorateList(root){
  const list=v373ActiveList(root);
  if(!list)return;
  const nodes=[...list.children].filter(x=>x.matches('.v370-title,.v239-logged-title-card'));
  for(let position=0;position<nodes.length;position++){
    const node=nodes[position],index=Number(node.dataset.mf373Entry??(node.matches('.v370-title')?node.dataset.v369Title:position));
    if(!Number.isInteger(index)||index<0||index>=(S.logDraft?.entries||[]).length)continue;
    node.dataset.mf373Entry=String(index);
    if(node.querySelector(':scope > .mf373-row-controls'))continue;
    const handle=document.createElement('div');handle.className='mf373-row-controls';
    handle.innerHTML=`<button class="mf373-drag-handle" type="button" draggable="false" aria-label="Drag title to reorder" title="Drag to reorder" data-mf373-move-handle="1">⠿</button>
      <label class="mf373-position-label" title="Change display position">#<input type="number" min="1" max="${nodes.length}" value="${position+1}" inputmode="numeric" aria-label="Title display position" onchange="App.v373Position(${index},this.value)"></label>
      <div class="mf373-arrows"><button type="button" class="mf373-move-up" aria-label="Move title up" title="Move up" onclick="App.v373Step(${index},-1)">↑</button><button type="button" class="mf373-move-down" aria-label="Move title down" title="Move down" onclick="App.v373Step(${index},1)">↓</button></div>`;
    node.prepend(handle);
  }
  v373ApplyDOMOrder(root);
}
function v373ApplyDOMOrder(root){
  const list=v373ActiveList(root);
  if(!list)return;
  const map=new Map([...list.children].filter(x=>x.dataset.mf373Entry!==undefined).map(x=>[Number(x.dataset.mf373Entry),x]));
  const ordered=v373OrderedEntries();
  for(const row of ordered){const el=map.get(row.index);if(el)list.appendChild(el);}
  [...list.children].forEach((el,p)=>{
    const field=el.querySelector('.mf373-position-label input');if(field){field.value=String(p+1);field.max=String(ordered.length);}
    const up=el.querySelector('.mf373-move-up'),down=el.querySelector('.mf373-move-down');
    if(up)up.disabled=p===0;if(down)down.disabled=p===ordered.length-1;
    el.dataset.mf373Position=String(p+1);
  });
  const form=list.closest('.log-form');
  if(form){
    const select=form.querySelector('#mf373-sort'),st=v373OrderState();if(select)select.value=st.sort;
    const dir=form.querySelector('.mf373-dir');if(dir){dir.disabled=['custom','random'].includes(st.sort);dir.textContent=st.dir==='asc'?'↑ Asc':'↓ Desc';}
    const shuffle=form.querySelector('.mf373-shuffle');if(shuffle)shuffle.hidden=st.sort!=='random';
  }
}
function v373LiveUpdate(){
  const form=document.querySelector('.log-form.mf372-logging');
  if(form)v373ApplyDOMOrder(form);
}
function v373Persist(){v369Touch();v373LiveUpdate();}
function v373SetSort(value){
  const st=v373OrderState(),next=V373_ALLOWED.has(value)?value:'logAdded';
  if(next==='custom'&&st.sort!=='custom')st.manualIds=v373OrderedEntries().map(x=>x.id);
  if(next==='logAdded'&&st.sort!=='logAdded')st.dir='desc';
  st.sort=next;
  v373Persist();
}
function v373ToggleDirection(){
  const st=v373OrderState();if(st.sort==='custom'||st.sort==='random')return;
  st.dir=st.dir==='asc'?'desc':'asc';v373Persist();
}
function v373Reshuffle(){
  const st=v373OrderState();st.sort='random';st.randomSeed=(Date.now()%2147483647)||1;v373Persist();
}
function v373Move(index,target){
  const st=v373OrderState(),order=v373OrderedEntries(),at=order.findIndex(x=>x.index===Number(index));
  if(at<0||order.length<2)return;
  const end=Math.max(0,Math.min(order.length-1,Math.trunc(Number(target))));
  if(!Number.isFinite(end)||end===at)return;
  const ids=order.map(x=>x.id),[id]=ids.splice(at,1);ids.splice(end,0,id);
  st.manualIds=ids;st.sort='custom';v373Persist();
}
function v373Position(index,value){
  const n=Number(value),entries=S.logDraft?.entries||[];
  if(!Number.isInteger(n)||n<1||n>entries.length){v373LiveUpdate();return;}
  v373Move(index,n-1);
}
function v373Step(index,offset){
  const at=v373OrderedEntries().findIndex(x=>x.index===Number(index));v373Move(index,at+Number(offset));
}
// Only the browser's visual nodes move. Every original onclick index and each
// unsaved per-unit editor keep their authoritative S.logDraft.entries index.
const v373BaseRenderLogForm=renderLogForm;
renderLogForm=function(){
  const html=String(v373BaseRenderLogForm.apply(this,arguments)||'');
  if(!S.logDraft)return html;
  try{
    const host=document.createElement('div');host.innerHTML=html;
    const form=host.querySelector('.log-form');if(!form)return html;
    form.classList.add('mf373-logging');
    const anchor=form.querySelector('.v370-logging-actions')||form.querySelector('.v369-interface');
    if(anchor)anchor.insertAdjacentHTML('afterend',v373ToolbarHtml());
    v373DecorateList(form);
    return host.innerHTML;
  }catch(e){console.warn('MediaFlow v373 log ordering rendering fallback',e);return html;}
};
const v373BaseRefreshPanels=v369RefreshPanels;
v369RefreshPanels=function(){
  const r=v373BaseRefreshPanels.apply(this,arguments);
  const form=document.querySelector('.log-form.mf372-logging');if(form)v373DecorateList(form);
  return r;
};
// Event delegation is bound once and also supports a touch drag handle.
let V373_DRAG=null;
function v373FindRowAt(x,y){return document.elementFromPoint(x,y)?.closest?.('.mf373-logging [data-mf373-entry]')||null;}
function v373DropTarget(from,to,y){
  if(!from||!to||from===to)return;
  const rect=to.getBoundingClientRect();
  const positions=v373OrderedEntries(),fromIndex=positions.findIndex(x=>x.index===Number(from.dataset.mf373Entry));
  const toIndex=positions.findIndex(x=>x.index===Number(to.dataset.mf373Entry));
  if(fromIndex<0||toIndex<0)return;
  let dest=toIndex+(y>rect.top+rect.height/2?1:0);
  if(dest>fromIndex)dest--;
  v373Move(Number(from.dataset.mf373Entry),dest);
}
function v373ClearDropIndicators(){document.querySelectorAll('.mf373-drop-before,.mf373-drop-after,.mf373-dragging').forEach(x=>x.classList.remove('mf373-drop-before','mf373-drop-after','mf373-dragging'));}
function v373IndicateRow(row,y){
  document.querySelectorAll('.mf373-drop-before,.mf373-drop-after').forEach(x=>x.classList.remove('mf373-drop-before','mf373-drop-after'));
  if(!row)return;
  const box=row.getBoundingClientRect();row.classList.add(y>box.top+box.height/2?'mf373-drop-after':'mf373-drop-before');
}
document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  const handle=event.target?.closest?.('.mf373-logging [data-mf373-move-handle]');if(!handle)return;
  const row=handle.closest('[data-mf373-entry]');if(!row)return;
  V373_DRAG={row,source:'pointer',id:event.pointerId,x:event.clientX,y:event.clientY};
  handle.setPointerCapture?.(event.pointerId);
});
document.addEventListener('pointermove',event=>{
  if(V373_DRAG?.source!=='pointer'||event.pointerId!==V373_DRAG.id)return;
  const row=v373FindRowAt(event.clientX,event.clientY);
  if(row){V373_DRAG.row.classList.add('mf373-dragging');v373IndicateRow(row,event.clientY);}
});
document.addEventListener('pointerup',event=>{
  if(V373_DRAG?.source!=='pointer'||event.pointerId!==V373_DRAG.id)return;
  const row=v373FindRowAt(event.clientX,event.clientY);
  if(row)v373DropTarget(V373_DRAG.row,row,event.clientY);
  V373_DRAG=null;v373ClearDropIndicators();
});
document.addEventListener('pointercancel',()=>{V373_DRAG=null;v373ClearDropIndicators();});
Object.assign(App,{v373SetSort,v373ToggleDirection,v373Reshuffle,v373Move,v373Position,v373Step});
// The all-Library picker shares the new sort family, without changing selected
// draft order or requiring a download of titles from an external catalogue.
function v373NormalizePickerSort(){
  const st=V89_LOG;
  if(!st.v373Ready){
    st.v373Ready=true;
    if(!st.sortBase||st.sortBase==='title'||st.sort==='relevance'){
      st.sortBase='added';st.sortDir='asc';st.sort='added-asc';
    }
    st.v373RandomSeed=1;
  }
  const allowed=new Set(V373_PICKER_SORTS.map(x=>x[0]));
  if(!allowed.has(st.sortBase))st.sortBase='added';
  st.sortDir=st.sortDir==='desc'?'desc':'asc';
  if(!Array.isArray(st.categories))st.categories=[];
  st.sort=v224SortKey(st.sortBase,st.sortDir);
  return st;
}
v224NormalizeLogSort=v373NormalizePickerSort;
const v373PickerToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
  const st=v373NormalizePickerSort();
  const original=v373PickerToolsBase.apply(this,arguments);
  return original.replace(/(<select aria-label="Dashboard logging sort field"[^>]*>)[\s\S]*?(<\/select>)/,
    (_,open,close)=>open+v224SortOptionsHtml(st.sortBase,V373_PICKER_SORTS)+close)
    .replace('</div>\n    <select aria-label="Logging title status"',
      `<button type="button" class="btn btn-sm mf373-picker-shuffle" ${st.sortBase==='random'?'':'hidden'} onclick="App.v373ShufflePicker()">Shuffle</button></div>\n    <select aria-label="Logging title status"`);
};
const v373PickerCandidatesBase=logTitleCandidates;
logTitleCandidates=function(query){
  const st=v373NormalizePickerSort();
  // Keep v242's indexed prefix search, scoped filters and limited cache.
  // v242 predates Date/Seen/Edited sorts, so apply ALL fields here.
  const matched=v373PickerCandidatesBase.apply(this,arguments);
  if(!Array.isArray(matched)||matched.length<2)return matched;
  const rows=matched.slice(),field=st.sortBase;
  if(field==='random')return rows.sort((a,b)=>v373SeedHash(String(a.id),st.v373RandomSeed)-v373SeedHash(String(b.id),st.v373RandomSeed));
  const selected=new Map((S.logDraft?.entries||[]).map((e,index)=>[String(e.libraryId||''),v373Timestamp(e.loggedAt)||index+1]));
  const sign=st.sortDir==='desc'?-1:1;
  if(field==='logAdded')return rows.sort((a,b)=>{
    const av=selected.get(String(a.id))||0,bv=selected.get(String(b.id))||0;
    if(!av&&bv)return 1;if(av&&!bv)return -1;
    return sign*(av-bv)||cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});
  });
  const refs=new Map(rows.map((item,index)=>[String(item.id),{item,entry:{title:item.title},index}]));
  return rows.sort((a,b)=>v373CompareData(refs.get(String(a.id)),refs.get(String(b.id)),field,st.sortDir)
    ||cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'}));
};
App.v224LogSetSort=function(value){
  const st=v373NormalizePickerSort(),allowed=new Set(V373_PICKER_SORTS.map(x=>x[0]));
  st.sortBase=allowed.has(value)?value:'added';
  if(value==='logAdded')st.sortDir='desc';
  st.sort=v224SortKey(st.sortBase,st.sortDir);st.page=0;renderLogSuggestions();
};
App.v224LogClearFilters=function(){
  const st=v373NormalizePickerSort();
  st.categories=[];st.status='all';st.priority='all';st.sortBase='added';st.sortDir='asc';st.sort='added-asc';st.page=0;renderLogSuggestions();
};
App.v373ShufflePicker=function(){
  const st=v373NormalizePickerSort();st.sortBase='random';st.sortDir='asc';st.v373RandomSeed=(Date.now()%2147483647)||1;
  st.page=0;renderLogSuggestions();
};
// Existing direction action correctly reverses all numeric/text picker sorts.
// It should not reverse a random permutation.
App.v224LogToggleSortDirection=function(){
  const st=v373NormalizePickerSort();if(st.sortBase==='random')return;
  st.sortDir=st.sortDir==='asc'?'desc':'asc';st.sort=v224SortKey(st.sortBase,st.sortDir);st.page=0;renderLogSuggestions();
};
window.MediaFlowV373={version:373,features:['All Logging modes: persistent sort and custom order','Touch and desktop dragging, arrows and numeric position','All-Library picker expanded sorting','Stable random and re-shuffle','Original draft entry indexes, logging commit and XP unchanged'],
  diagnostics:()=>({sort:v373OrderState().sort,dir:v373OrderState().dir,order:v373OrderedEntries().map(x=>x.index)})};
MediaFlowRuntime.version=V373_RELEASE;
