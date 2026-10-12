/* MediaFlow v392 — Collections: instant-add, persistent picker and oldest-first browsing.
 * Loaded last in the modular runtime. No Supabase schema changes are required.
 */
const V392_RELEASE=392;
const V392_PICKER={dirty:false,timer:0,inflight:null,queued:false,sortCache:null};
const V392_ICON_ADD='<svg class="mf392-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const V392_ICON_ADDED='<svg class="mf392-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
function v392Collection(){return v276CurrentAddCollection();}
function v392Has(c,id){return !!c&&Array.isArray(c.titleIds)&&c.titleIds.some(x=>String(x)===String(id));}
function v392ActionHtml(item,added){
  const id=escapeHtml(String(item.id)),title=escapeHtml(v274SafeTitle(item));
  return added
    ? '<button type="button" class="mf392-action mf392-added" aria-label="'+title+' already added" disabled>'+V392_ICON_ADDED+'<span>Added</span></button>'
    : '<button type="button" class="mf392-action mf392-add" aria-label="Add '+title+' to collection" onclick="App.v392AddTitle(\''+id+'\')">'+V392_ICON_ADD+'<span>Add</span></button>';
}
function v392ChronologicalIndex(){
  const library=Array.isArray(S.library)?S.library:[],rows=v279EnsureLibrarySearchIndex();
  const token=Number(V53_LIB?.libraryToken)||0,cache=V392_PICKER.sortCache;
  if(cache&&cache.library===library&&cache.rows===rows&&cache.token===token)return cache.sorted;
  const originalPos=new Map();
  library.forEach((item,index)=>{if(item?.id)originalPos.set(String(item.id),index);});
  const sorted=rows.slice().sort((a,b)=>{
    const aTime=Number(a.item?.createdAt)||0,bTime=Number(b.item?.createdAt)||0;
    if(aTime&&bTime&&aTime!==bTime)return aTime-bTime;
    if(aTime&&!bTime)return -1;
    if(bTime&&!aTime)return 1;
    return (originalPos.get(a.id)??0)-(originalPos.get(b.id)??0);
  });
  V392_PICKER.sortCache={library,rows,token,sorted};
  return sorted;
}
/* Keep already-added titles visible, while retaining all established filters,
 * indexed search, alternate sorting and 24-row pagination. */
v274AddCandidates=function(c){
  const s=v274AddState(),q=String(s.search||'').trim().toLowerCase();
  const categories=new Set(s.categories||[]),rank={low:0,medium:1,high:2};
  const byAdded=s.sort==='added',dir=s.dir==='desc'?-1:1;
  const index=byAdded?v392ChronologicalIndex():v279EnsureLibrarySearchIndex(),matches=[];
  for(let n=dir<0&&byAdded?index.length-1:0;byAdded&&dir<0?n>=0:n<index.length;n+=byAdded&&dir<0?-1:1){
    const rec=index[n];
    if(q&&!rec.search.includes(q))continue;
    if(categories.size&&!categories.has(rec.categoryId))continue;
    if(s.status!=='all'&&rec.status!==s.status)continue;
    if(s.priority!=='all'&&rec.priority!==s.priority)continue;
    if(s.rating!=='all'&&!v274RatingMatch(rec.item,s.rating))continue;
    matches.push(rec);
  }
  if(!byAdded){
    if(s.sort==='title'){if(dir<0)matches.reverse();}
    else matches.sort((a,b)=>{
      let delta=0;
      if(s.sort==='priority')delta=(rank[a.priority]??1)-(rank[b.priority]??1);
      else if(s.sort==='rating')delta=a.rating-b.rating;
      else if(s.sort==='progress')delta=a.progress-b.progress;
      else if(s.sort==='total')delta=a.total-b.total;
      return (delta||a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}))*dir;
    });
  }
  return matches.map(rec=>rec.item);
};
v276AddResultsHtml=function(shown){
  const c=v392Collection(),s=v274AddState(),multi=s.v392Mode==='multi';
  if(!shown.length)return '<div class="empty-state">No Library titles match.</div>';
  return shown.map(item=>{
    const cat=v274Cat(item),id=String(item.id),safeId=escapeHtml(id),title=escapeHtml(v274SafeTitle(item));
    const added=v392Has(c,id),checked=s.picks.has(id);
    const metadata=(cat?v144CategoryIconHtml(cat):'')+' '+escapeHtml(cat?.name||'Uncategorized')+' · '+escapeHtml(v274StatusLabel(item.status))+' · '+escapeHtml(String(item.priority||'medium'))+(Number(item.rating)>0?' · ★ '+Number(item.rating).toFixed(1):'');
    const action=multi&&!added
      ? '<label class="mf392-select-wrap"><input class="mf352-picker-check" type="checkbox" aria-label="Select '+title+'" '+(checked?'checked':'')+' onchange="App.v392Pick(\''+safeId+'\',this.checked)"><span>Select</span></label>'
      : v392ActionHtml(item,added);
    return '<div class="mf274-add-row mf352-picker-item mf392-picker-item '+(added?'mf392-item-added':'')+'" data-mf352-id="'+safeId+'" title="'+title+'">'
      +'<span class="mf352-picker-cover">'+v274TitleCover(item,false)+'</span>'
      +'<span class="mf352-picker-copy"><span class="mf352-picker-title">'+title+'</span><small class="mf352-picker-meta">'+metadata+'</small></span>'
      +'<span class="mf392-picker-action">'+action+'</span></div>';
  }).join('');
};
v276AddFooterHtml=function(data){
  const s=data.s,multi=s.v392Mode==='multi',c=v392Collection();
  const available=data.shown.filter(item=>!v392Has(c,item.id)).length;
  const info='<span class="hint mf392-result-summary">'+data.rows.length.toLocaleString()+' matching titles'+(multi?' · '+s.picks.size.toLocaleString()+' selected':'')+'</span>';
  const bulk=multi
    ? '<div class="mf274-add-select-actions"><button type="button" class="btn btn-sm btn-ghost" '+(available?'':'disabled')+' onclick="App.v392SelectVisible()">Select visible</button><button type="button" class="btn btn-sm btn-ghost" '+(s.picks.size?'':'disabled')+' onclick="App.v392DeselectAll()">Deselect all</button>'+info+'</div>'
    : '<div class="mf274-add-select-actions">'+info+'</div>';
  return bulk+'<div class="mf274-add-pager"><button class="btn btn-sm" '+(s.page===0?'disabled':'')+' onclick="App.v274AddPage('+(s.page-1)+')">← Prev</button><span>Page '+(s.page+1)+'/'+data.pages+'</span><button class="btn btn-sm" '+(s.page>=data.pages-1?'disabled':'')+' onclick="App.v274AddPage('+(s.page+1)+')">Next →</button></div>';
};
/* The v353 mobile filtering and v352 display adapters are retained. */
const v392AddBodyBase=v274AddModalBody;
v274AddModalBody=function(c){
  const s=v274AddState();if(s.v392Mode!=='multi')s.v392Mode='direct';
  const bar='<section class="mf392-mode-bar" aria-label="How to add titles">'
    +'<div class="mf392-mode-switch" role="group" aria-label="Add mode">'
    +'<button type="button" class="mf392-mode '+(s.v392Mode==='direct'?'active':'')+'" aria-pressed="'+(s.v392Mode==='direct')+'" onclick="App.v392SetMode(\'direct\')">'+V392_ICON_ADD+' Direct Add</button>'
    +'<button type="button" class="mf392-mode '+(s.v392Mode==='multi'?'active':'')+'" aria-pressed="'+(s.v392Mode==='multi')+'" onclick="App.v392SetMode(\'multi\')">☑ Multi-Select</button>'
    +'</div><span class="mf392-mode-note">Add titles without closing this window.</span></section>';
  let html=v392AddBodyBase.apply(this,arguments);
  html=html.replace('<option value="title"','<option value="added" '+(s.sort==='added'?'selected':'')+'>Date added (Library)</option><option value="title"');
  return bar+html;
};
function v392SyncFooter(){
  const s=v274AddState(),multi=s.v392Mode==='multi',confirm=document.getElementById('mf274-add-confirm');
  if(confirm){confirm.hidden=!multi;confirm.disabled=!s.picks.size;confirm.textContent='Add selected ('+s.picks.size+')';}
  const close=document.querySelector('#mf274-add-titles .modal-actions .btn-ghost');
  if(close)close.textContent='Done';
}
const v392RefreshBase=v274RefreshAddModal;
v274RefreshAddModal=function(){
  const results=document.getElementById('mf276-add-results'),top=results?.scrollTop||0;
  const out=v392RefreshBase.apply(this,arguments);
  const next=document.getElementById('mf276-add-results');if(next)next.scrollTop=top;
  v392SyncFooter();return out;
};
function v392SetMode(mode){
  if(mode!=='direct'&&mode!=='multi')return;
  const s=v274AddState();if(s.v392Mode===mode)return;
  s.v392Mode=mode;s.picks.clear();v274RefreshAddModal();
}
function v392RefreshSelection(){
  const c=v392Collection();if(!c)return;
  const footer=document.getElementById('mf276-add-footer');
  if(footer)footer.innerHTML=v276AddFooterHtml(v276AddData(c));
  v392SyncFooter();
}
function v392Pick(id,on){
  const s=v274AddState(),c=v392Collection(),key=String(id);
  if(s.v392Mode!=='multi'||v392Has(c,key))return;
  if(on)s.picks.add(key);else s.picks.delete(key);
  v392RefreshSelection();
}
function v392SelectVisible(){
  const c=v392Collection();if(!c)return;
  const s=v274AddState();
  for(const item of v276AddData(c).shown)if(!v392Has(c,item.id))s.picks.add(String(item.id));
  v274RefreshAddModal();
}
function v392DeselectAll(){v274AddState().picks.clear();v274RefreshAddModal();}
v274AddSelectVisible=v392SelectVisible;
v274AddDeselectAll=v392DeselectAll;
v274AddPick=v392Pick;
async function v392Flush(){
  clearTimeout(V392_PICKER.timer);
  if(V392_PICKER.inflight){await V392_PICKER.inflight;if(V392_PICKER.queued)return v392Flush();return;}
  if(!V392_PICKER.queued)return;
  V392_PICKER.queued=false;
  V392_PICKER.inflight=Promise.resolve().then(()=>saveState()).catch(err=>{
    V392_PICKER.queued=true;
    console.warn('v392 collection sync pending',err);
    showToast('Collection saved locally; cloud sync needs retry');
  }).finally(()=>{V392_PICKER.inflight=null;});
  await V392_PICKER.inflight;
}
function v392QueueSave(){
  V392_PICKER.dirty=true;V392_PICKER.queued=true;
  clearTimeout(V392_PICKER.timer);
  V392_PICKER.timer=setTimeout(()=>{void v392Flush();},480);
}
function v392UpdateVisible(ids){
  const affected=new Set(ids.map(String)),c=v392Collection();
  document.querySelectorAll('#mf276-add-results .mf392-picker-item').forEach(row=>{
    if(!affected.has(String(row.dataset.mf352Id||'')))return;
    const item=(S.library||[]).find(x=>String(x?.id||'')===String(row.dataset.mf352Id||''));if(!item)return;
    row.classList.add('mf392-item-added');
    const slot=row.querySelector('.mf392-picker-action');if(slot)slot.innerHTML=v392ActionHtml(item,v392Has(c,item.id));
  });
  v392RefreshSelection();
}
function v392AddIds(ids){
  const c=v392Collection();if(!c)return 0;
  if(!Array.isArray(c.titleIds))c.titleIds=[];
  const existing=new Set(c.titleIds.map(String));
  const libraryIds=new Set((S.library||[]).map(item=>String(item?.id||'')).filter(Boolean));
  const additions=[];
  for(const raw of ids){
    const id=String(raw);
    if(id&&libraryIds.has(id)&&!existing.has(id)){c.titleIds.push(id);existing.add(id);additions.push(id);}
  }
  if(!additions.length)return 0;
  const order=Array.isArray(c.order)?c.order.map(String):[];
  const ordered=new Set(order);
  c.order=order.filter(id=>existing.has(id));
  for(const id of c.titleIds)if(!ordered.has(String(id))){c.order.push(String(id));ordered.add(String(id));}
  for(const id of additions)v274AddState().picks.delete(id);
  v274TouchCollection(c);
  v392QueueSave();v392UpdateVisible(additions);
  showToast(additions.length===1?'Title added to collection':additions.length+' titles added to collection');
  return additions.length;
}
function v392AddTitle(id){return v392AddIds([id]);}
v274CommitAddTitles=async function(){const s=v274AddState(),c=v392Collection();if(!c||!s.picks.size)return;return v392AddIds([...s.picks]);};
const v392OpenBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){
  const out=v392OpenBase.apply(this,arguments),s=v274AddState();
  s.sort='added';s.dir='asc';s.v392Mode='direct';s.picks.clear();
  const hint=document.querySelector('#mf274-add-titles .mf274-add-head .hint');
  if(hint)hint.textContent='Click Add to include any title instantly. The picker stays open until you close it.';
  v274RefreshAddModal();
  return out;
};
const v392CloseBase=v274CloseOverlay;
v274CloseOverlay=function(id){
  const wasPicker=String(id)==='mf274-add-titles'&&!!document.getElementById('mf274-add-titles'),dirty=V392_PICKER.dirty;
  const out=v392CloseBase.apply(this,arguments);
  if(wasPicker&&dirty){
    V392_PICKER.dirty=false;
    void v392Flush();
    render();
  }
  return out;
};
Object.assign(App,{v274OpenAddTitles,v274RefreshAddModal,v274CommitAddTitles,v274AddSelectVisible,v274AddDeselectAll,v274AddPick,v274CloseOverlay,v392SetMode,v392Pick,v392SelectVisible,v392DeselectAll,v392AddTitle});
window.MediaFlowV392={version:392,features:['Instant Add / Added icons','Persistent Add Titles popup','Multi-select mode','Oldest added first by default','Existing membership visible','Preserved filters, views, pagination and cloud persistence']};
MediaFlowRuntime.version=V392_RELEASE;
