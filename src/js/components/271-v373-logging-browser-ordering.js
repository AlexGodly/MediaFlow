/* MediaFlow v373 — shared Quick/Per-unit logging Library browser.
 * Preserves canonical v372 logging, History/XP, settings, navigation and cloud.
 * Oldest Library addition is the default. Manual order is opt-in, global,
 * persistent and independent from the active temporary sort/filter.
 */
const V373_LOG_SORT_OPTIONS=[
  ['added','Date added'],
  ['recentlog','Recently added to logging'],
  ['logging','Last updated by logging'],
  ['progress','Progress'],
  ['total','Total episodes / units'],
  ['priority','Priority'],
  ['rating','Rating'],
  ['title','Alphabetical'],
  ['edited','Last edited'],
  ['seen','Last seen in Title Details'],
  ['random','Random'],
  ['manual','My custom order']
];
const V373_SORT_VALUES=new Set(V373_LOG_SORT_OPTIONS.map(x=>x[0]));
V224_LOG_SORT_OPTIONS.splice(0,V224_LOG_SORT_OPTIONS.length,...V373_LOG_SORT_OPTIONS);
const V373_RECENT_LIMIT=600;
let V373_BROWSER_CACHE={signature:'',rows:null};
let V373_MANUAL_CACHE={order:null,library:null,length:0,token:0,ids:new Map()};
let V373_POINTER_DRAG=null;
function v373Str(v){return String(v??'');}
function v373Timestamp(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0;}
function v373Defaults(){return {sort:'added',dir:'asc',sortAt:0,manualOrder:[],manualAt:0,recentlog:[],recentAt:0,randomSeed:373,randomAt:0};}
function v373NormalizeSettings(raw){
  const x=raw&&typeof raw==='object'?raw:{};
  const seen=new Set();
  const ids=Array.isArray(x.manualOrder)?x.manualOrder.map(v373Str).filter(id=>id&&!seen.has(id)&&seen.add(id)).slice(0,100000):[];
  const recent=new Set();
  const history=Array.isArray(x.recentlog)?x.recentlog.filter(row=>Array.isArray(row)&&row.length>=2).map(row=>[v373Str(row[0]),v373Timestamp(row[1])]).filter(row=>row[0]&&!recent.has(row[0])&&recent.add(row[0])).slice(0,V373_RECENT_LIMIT):[];
  return {sort:V373_SORT_VALUES.has(x.sort)?x.sort:'added',dir:x.dir==='desc'?'desc':'asc',
    sortAt:v373Timestamp(x.sortAt),manualOrder:ids,manualAt:v373Timestamp(x.manualAt),
    recentlog:history,recentAt:v373Timestamp(x.recentAt),
    randomSeed:Number.isFinite(Number(x.randomSeed))?(Number(x.randomSeed)>>>0):373,
    randomAt:v373Timestamp(x.randomAt)};
}
function v373GetSettings(){
  const holder=S.settings&&typeof S.settings==='object'?S.settings:DEFAULT_SETTINGS;
  if(!holder.v373LoggingBrowser)holder.v373LoggingBrowser=v373Defaults();
  return holder.v373LoggingBrowser;
}
function v373Save(mutator){
  const x=v373NormalizeSettings(v373GetSettings());
  mutator(x);
  S.settings=S.settings||{};
  S.settings.v373LoggingBrowser=x;
  V373_BROWSER_CACHE.signature='';
  V373_MANUAL_CACHE.order=null;
  persistSettings();
  return x;
}
function v373Active(){return v373NormalizeSettings(v373GetSettings());}
function v373SortState(){
  const cfg=v373Active(),state=V89_LOG;
  state.sortBase=cfg.sort;
  state.sortDir=cfg.dir;
  state.sort=v224SortKey(cfg.sort,cfg.dir);
  return state;
}
const v373PreviousNormalizeLogSort=v224NormalizeLogSort;
v224NormalizeLogSort=function(){
  v373PreviousNormalizeLogSort.apply(this,arguments);
  return v373SortState();
};
function v373InvalidateBrowser(){V373_BROWSER_CACHE.signature='';V373_MANUAL_CACHE.order=null;}
const v373InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){const x=v373InvalidateLibraryCacheBase.apply(this,arguments);v373InvalidateBrowser();return x;};
function v373LibraryIndex(){
  const lib=S.library||[],token=Number(V53_LIB?.libraryToken)||0;
  if(V373_MANUAL_CACHE.library===lib&&V373_MANUAL_CACHE.length===lib.length&&V373_MANUAL_CACHE.token===token)return V373_MANUAL_CACHE.ids;
  const byId=new Map();lib.forEach((item,index)=>{if(item?.id)byId.set(v373Str(item.id),index);});
  Object.assign(V373_MANUAL_CACHE,{library:lib,length:lib.length,token,ids:byId,order:null});
  return byId;
}
function v373AddedCompare(a,b,index){
  const at=v373Timestamp(a?.createdAt),bt=v373Timestamp(b?.createdAt);
  const diff=at&&bt?at-bt:0;
  return diff||((index.get(v373Str(a?.id))??0)-(index.get(v373Str(b?.id))??0));
}
function v373ManualIds(cfg){
  const index=v373LibraryIndex();
  const memo=V373_MANUAL_CACHE;
  const rawOrder=v373GetSettings().manualOrder;
  if(memo.order===rawOrder&&memo.fullIds)return memo.fullIds;
  const seen=new Set(),ids=[];
  for(const id of cfg.manualOrder){if(index.has(id)&&!seen.has(id)){seen.add(id);ids.push(id);}}
  const remaining=(S.library||[]).filter(item=>item?.id&&!seen.has(v373Str(item.id)))
    .sort((a,b)=>v373AddedCompare(a,b,index));
  for(const item of remaining)ids.push(v373Str(item.id));
  memo.order=rawOrder;memo.fullIds=ids;
  memo.positions=new Map(ids.map((id,i)=>[id,i]));
  return ids;
}
function v373Hash(id,seed){
  let h=(2166136261^(seed>>>0))>>>0;
  for(let i=0;i<id.length;i++){h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;}
  return h;
}
function v373CandidateSignature(q,cfg){
  const ses=S.sessions||[],last=ses.length?ses[ses.length-1]:null;
  return [Number(V53_LIB?.libraryToken)||0,(S.library||[]).length,
    cfg.sort,cfg.dir,cfg.sortAt,cfg.manualAt,cfg.recentAt,cfg.randomSeed,
    ses.length, v373Str(last?.id),v373Str(last?.timestamp),q,
    (V89_LOG.categories||[]).join(','),V89_LOG.status,V89_LOG.priority].join('|');
}
function v373SortRows(rows,cfg,positions){
  const rank=cfg.sort==='manual'?v373ManualIds(cfg)&&V373_MANUAL_CACHE.positions:null;
  const recent=cfg.sort==='recentlog'?new Map(cfg.recentlog):null;
  const dir=cfg.dir==='desc'?-1:1;
  rows.sort((a,b)=>{
    const ai=v373Str(a.id),bi=v373Str(b.id);
    let value=0;
    if(cfg.sort==='added')value=v373AddedCompare(a,b,positions);
    else if(cfg.sort==='manual')value=(rank.get(ai)??1e10)-(rank.get(bi)??1e10);
    else if(cfg.sort==='recentlog')value=(recent.get(ai)||0)-(recent.get(bi)||0);
    else if(cfg.sort==='random')value=v373Hash(ai,cfg.randomSeed)-v373Hash(bi,cfg.randomSeed);
    else if(cfg.sort==='logging')value=(Number(v53LastTouched(a))||0)-(Number(v53LastTouched(b))||0);
    else if(cfg.sort==='edited')value=(v373Timestamp(a.modifiedAt||a.updatedAt||a.createdAt))-(v373Timestamp(b.modifiedAt||b.updatedAt||b.createdAt));
    else if(cfg.sort==='seen')value=v373Timestamp(a.lastSeenAt)-v373Timestamp(b.lastSeenAt);
    else if(cfg.sort==='progress')value=(Number(a.progress)||0)-(Number(b.progress)||0);
    else if(cfg.sort==='total')value=(Number(a.total)||0)-(Number(b.total)||0);
    else if(cfg.sort==='rating')value=(Number(a.rating)||0)-(Number(b.rating)||0);
    else if(cfg.sort==='priority'){
      const levels={low:0,medium:1,high:2};
      value=(levels[v373Str(a.priority||'medium').toLowerCase()]??1)-(levels[v373Str(b.priority||'medium').toLowerCase()]??1);
    }else value=cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});
    return (value*dir)||v373AddedCompare(a,b,positions);
  });
  return rows;
}
logTitleCandidates=function(query){
  v373SortState();
  const cfg=v373Active(),q=v373Str(query).trim().toLocaleLowerCase();
  const idx=v242EnsureLoggingIndex(),positions=v373LibraryIndex();
  const signature=v373CandidateSignature(q,cfg);
  if(signature===V373_BROWSER_CACHE.signature)return V373_BROWSER_CACHE.rows;
  const cats=(V89_LOG.categories||[]).length?new Set(V89_LOG.categories.map(v373Str)):null;
  const status=v373Str(V89_LOG.status||'all').toLowerCase(),priority=v373Str(V89_LOG.priority||'all').toLowerCase();
  const rows=[];
  for(const item of (S.library||[])){
    if(!item?.id)continue;
    if(q&&!(idx.titleLower.get(v373Str(item.id))||'').includes(q))continue;
    if(cats&&!cats.has(v373Str(item.categoryId)))continue;
    if(status!=='all'&&v373Str(item.status||'planned').toLowerCase()!==status)continue;
    if(priority!=='all'&&v373Str(item.priority||'medium').toLowerCase()!==priority)continue;
    rows.push(item);
  }
  v373SortRows(rows,cfg,positions);
  V373_BROWSER_CACHE={signature,rows};
  return rows;
};
function v373SortDescription(cfg){
  if(cfg.sort==='added')return cfg.dir==='asc'?'Oldest additions first':'Newest additions first';
  if(cfg.sort==='recentlog')return 'Titles you added to logging most recently';
  if(cfg.sort==='manual')return 'Drag, use arrows or enter a position to organize the whole Library';
  if(cfg.sort==='random')return 'A repeatable shuffle until you reshuffle again';
  const label=V373_LOG_SORT_OPTIONS.find(row=>row[0]===cfg.sort)?.[1]||'Sorting';
  return label+' · '+(cfg.dir==='asc'?'ascending':'descending');
}
const v373LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
  let markup=v373LogToolsBase.apply(this,arguments);
  const cfg=v373Active(),manual=cfg.sort==='manual',random=cfg.sort==='random';
  markup=markup.replace('v224-log-tools"','v224-log-tools v373-log-tools'+(manual||random?' v373-sort-fixed':'')+'"');
  const decoration=`<div class="v373-order-summary"><span class="v373-order-emblem" aria-hidden="true">⇅</span><span class="v373-order-copy"><strong>${manual?'Custom title order':random?'Shuffle titles':'Title order'}</strong><small>${escapeHtml(v373SortDescription(cfg))}</small></span>${random?'<button type="button" class="btn btn-sm v373-shuffle" onclick="App.v373Reshuffle()">↻ Reshuffle</button>':''}${manual?'<button type="button" class="btn btn-sm v373-reset" onclick="App.v373ResetManual()">Restore added order</button>':''}</div>`;
  return markup+decoration;
};
function v373PageSize(){return Math.max(1,Number(v175PageSize('loggingLibrary'))||20);}
function v373SuggestionsMarkup(){
  if(!V238_LOG_LIBRARY_OPEN)return '<div class="v238-log-library-lazy">Open Library to search and organize titles.</div>';
  const cfg=v373Active(),query=v373Str(S.entryDraft?.title).trim(),candidates=logTitleCandidates(query);
  const size=v373PageSize(),pages=Math.max(1,Math.ceil(candidates.length/size));
  V89_LOG.pageSize=size;
  V89_LOG.page=Math.max(0,Math.min(Math.floor(Number(V89_LOG.page)||0),pages-1));
  const start=V89_LOG.page*size,rows=candidates.slice(start,start+size),index=v373LibraryIndex();
  const tools=v224LogToolsHtml(candidates,pages);
  if(!rows.length)return tools+'<div class="v86-log-empty">No matching titles. Try another search or filter.</div>';
  const manual=cfg.sort==='manual',allRanks=manual?(v373ManualIds(cfg),V373_MANUAL_CACHE.positions):null;
  const list='<div class="log-suggestion-list v373-title-list" role="list">'+rows.map((item,i)=>{
    const id=v373Str(item.id),safe=escapeHtml(id),cat=getCategory(item.categoryId);
    const progress=item.total!=null?`${Number(item.progress)||0}/${item.total}`:`${Number(item.progress)||0} progress`;
    const status=v199StatusLabel(item.status),pri=v373Str(item.priority||'medium');
    const image=item.coverUrl?`<img class="v86-log-cover" src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';
    const pos=manual?(allRanks.get(id)||0)+1:start+i+1;
    const controls=manual?`<div class="v373-reorder" aria-label="Reorder ${escapeHtml(cleanTitle(item.title))}">
      <button type="button" class="v373-grip" title="Drag to reorder" aria-label="Drag to reorder ${escapeHtml(cleanTitle(item.title))}" data-v373-drag="${safe}">⠿</button>
      <button type="button" class="v373-move" title="Move up" aria-label="Move ${escapeHtml(cleanTitle(item.title))} up" onclick="App.v373Nudge('${safe}',-1)">↑</button>
      <button type="button" class="v373-move" title="Move down" aria-label="Move ${escapeHtml(cleanTitle(item.title))} down" onclick="App.v373Nudge('${safe}',1)">↓</button>
      <label class="v373-position"><span>Position</span><input type="number" inputmode="numeric" min="1" max="${(S.library||[]).length}" value="${pos}" aria-label="Custom position for ${escapeHtml(cleanTitle(item.title))}" onchange="App.v373MovePosition('${safe}',this.value)"></label>
    </div>`:'';
    return `<div class="log-suggestion v373-title-row" role="listitem" data-v373-title="${safe}">
      <span class="v373-rank" title="${manual?'Custom position':'Position in this sort'}">${pos}</span>
      <div class="v86-log-result v373-result">${image}<div><b>${escapeHtml(cleanTitle(item.title))}</b><small>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${escapeHtml(status)} · ${escapeHtml(pri)} priority · ${escapeHtml(progress)}</small></div></div>
      <button class="btn btn-sm v373-use" type="button" onclick="App.selectLogTitle('${safe}')">Use</button>${controls}
    </div>`;
  }).join('')+'</div>';
  const count=Math.min(5,pages),from=Math.max(0,Math.min(V89_LOG.page-2,pages-count));
  const buttons=Array.from({length:count},(_,i)=>{const page=from+i;return `<button type="button" class="btn btn-sm ${page===V89_LOG.page?'active':''}" onclick="App.v224LogPage(${page})">${page+1}</button>`;}).join('');
  const pager=pages>1?`<nav class="v86-log-pager" aria-label="Logging Library pages"><button type="button" class="btn btn-sm" ${V89_LOG.page===0?'disabled':''} onclick="App.v224LogPage(${V89_LOG.page-1})">← Prev</button>${buttons}<button type="button" class="btn btn-sm" ${V89_LOG.page===pages-1?'disabled':''} onclick="App.v224LogPage(${V89_LOG.page+1})">Next →</button></nav>`:'';
  return tools+list+pager;
}
v224LogSuggestionsHtml=v373SuggestionsMarkup;
function v373SetSort(value){
  const sort=V373_SORT_VALUES.has(value)?value:'added';
  v373Save(x=>{x.sort=sort;x.dir=['added','title','manual'].includes(sort)?'asc':'desc';x.sortAt=Date.now();});
  V89_LOG.page=0;v373SortState();renderLogSuggestions();
}
function v373Direction(){
  const cfg=v373Active();if(cfg.sort==='manual'||cfg.sort==='random')return;
  v373Save(x=>{x.dir=x.dir==='asc'?'desc':'asc';x.sortAt=Date.now();});
  V89_LOG.page=0;v373SortState();renderLogSuggestions();
}
function v373Clear(){
  V89_LOG.categories=[];V89_LOG.status='all';V89_LOG.priority='all';V89_LOG.page=0;
  v373Save(x=>{x.sort='added';x.dir='asc';x.sortAt=Date.now();});
  v373SortState();renderLogSuggestions();
}
App.v224LogSetSort=v373SetSort;
App.v224LogToggleSortDirection=v373Direction;
App.v224LogClearFilters=v373Clear;
function v373ManualMove(source,to){
  const all=v373ManualIds(v373Active()).slice(),from=all.indexOf(v373Str(source));
  if(from<0||!Number.isInteger(to))return false;
  const target=Math.max(0,Math.min(all.length-1,to));
  if(target===from)return false;
  all.splice(from,1);all.splice(target,0,v373Str(source));
  v373Save(x=>{x.manualOrder=all;x.manualAt=Date.now();});
  renderLogSuggestions();
  if(typeof v175RefreshBatchLibraryUI==='function'&&document.querySelector('[id^="batch-suggestions-"]'))v175RefreshBatchLibraryUI();
  return true;
}
function v373Nudge(id,step){
  const all=v373ManualIds(v373Active());v373ManualMove(id,all.indexOf(v373Str(id))+Number(step));
}
function v373MovePosition(id,value){
  const n=Number(value);if(!Number.isFinite(n))return;
  v373ManualMove(id,Math.round(n)-1);
}
function v373MoveRelative(source,target,after=false){
  const all=v373ManualIds(v373Active());
  const sourceIndex=all.indexOf(v373Str(source)),targetIndex=all.indexOf(v373Str(target));
  if(sourceIndex<0||targetIndex<0||sourceIndex===targetIndex)return false;
  const destination=targetIndex+(after?1:0)-(sourceIndex<targetIndex?1:0);
  return v373ManualMove(source,destination);
}
function v373MoveBefore(source,target){return v373MoveRelative(source,target,false);}
function v373ResetManual(){
  v373Save(x=>{x.manualOrder=[];x.manualAt=Date.now();});
  V89_LOG.page=0;renderLogSuggestions();
  if(typeof v175RefreshBatchLibraryUI==='function'&&document.querySelector('[id^="batch-suggestions-"]'))v175RefreshBatchLibraryUI();
  showToast('Custom title order restored to oldest added first.');
}
function v373Reshuffle(){
  v373Save(x=>{x.randomSeed=(Math.floor(Math.random()*0xffffffff)>>>0);x.randomAt=Date.now();});
  V89_LOG.page=0;renderLogSuggestions();
  if(typeof v175RefreshBatchLibraryUI==='function'&&document.querySelector('[id^="batch-suggestions-"]'))v175RefreshBatchLibraryUI();
}
function v373RecordLog(id){
  if(!id)return;
  const now=Date.now(),safe=v373Str(id);
  v373Save(x=>{x.recentlog=[[safe,now],...x.recentlog.filter(row=>row[0]!==safe)].slice(0,V373_RECENT_LIMIT);x.recentAt=now;});
}
const v373AddLogBase=App.addLogEntry;
App.addLogEntry=function(){
  const before=S.logDraft?.entries?.length||0;
  const selected=v373Str(S.entryDraft?.libraryId||'');
  const result=v373AddLogBase.apply(this,arguments);
  const after=S.logDraft?.entries||[];
  if(after.length>before){
    const id=v373Str(after[after.length-1]?.libraryId||selected);
    if(id)v373RecordLog(id);
  }
  return result;
};

/* ---------- Batch Log shares the same canonical sort and manual sequence.
 * Batch filters/page selection remain independently controlled as before. */
if(typeof V224_BATCH_SORT_OPTIONS!=='undefined'&&typeof v175BatchLibraryMatches==='function'){
  V224_BATCH_SORT_OPTIONS.splice(0,V224_BATCH_SORT_OPTIONS.length,...V373_LOG_SORT_OPTIONS);
  const v373BatchNormalizeBase=v175NormalizeBatchLibraryState;
  v175NormalizeBatchLibraryState=function(){
    const st=v373BatchNormalizeBase.apply(this,arguments),cfg=v373Active();
    st.sortBase=cfg.sort;st.sortDir=cfg.dir;st.sort=v224SortKey(cfg.sort,cfg.dir);
    return st;
  };
  const batchCache={signature:'',rows:[]};
  v175BatchLibraryMatches=function(query){
    const st=v175NormalizeBatchLibraryState(),cfg=v373Active(),q=v373Str(query).trim().toLocaleLowerCase();
    const last=(S.sessions||[]).at(-1);
    const signature=[Number(V53_LIB?.libraryToken)||0,(S.library||[]).length,
      cfg.sort,cfg.dir,cfg.sortAt,cfg.manualAt,cfg.recentAt,cfg.randomSeed,
      (S.sessions||[]).length,v373Str(last?.id),q,st.categories.join(','),st.status,st.priority].join('|');
    if(signature===batchCache.signature)return batchCache.rows;
    const idx=v242EnsureLoggingIndex(),cats=st.categories.length?new Set(st.categories.map(v373Str)):null;
    const rows=[];
    for(const item of (S.library||[])){
      if(!item?.id)continue;
      if(q&&!(idx.titleLower.get(v373Str(item.id))||'').includes(q)){
        // Keep Batch Log's existing rich search (category, tags, metadata).
        const category=getCategory(item.categoryId);
        const other=[category?.name,item.status,item.priority,item.source,item.year,
          ...(Array.isArray(item.tags)?item.tags:[])].join(' ').toLowerCase();
        if(!other.includes(q))continue;
      }
      if(cats&&!cats.has(v373Str(item.categoryId)))continue;
      if(st.status!=='all'&&v373Str(item.status||'planned').toLowerCase()!==st.status)continue;
      if(st.priority!=='all'&&v373Str(item.priority||'medium').toLowerCase()!==st.priority)continue;
      rows.push(item);
    }
    v373SortRows(rows,cfg,v373LibraryIndex());
    batchCache.signature=signature;batchCache.rows=rows;
    return rows;
  };
  batchTitleCandidates=function(query){return v175BatchLibraryMatches(query);};
  const batchToolsBase=v175BatchLibraryToolsHtml;
  v175BatchLibraryToolsHtml=function(){
    const raw=String(batchToolsBase.apply(this,arguments));
    const cfg=v373Active();
    const detail=`<div class="v373-order-summary v373-batch-summary"><span class="v373-order-emblem">⇅</span><span class="v373-order-copy"><strong>${cfg.sort==='manual'?'Custom title order':'Title order'}</strong><small>${escapeHtml(v373SortDescription(cfg))}</small></span>${cfg.sort==='random'?'<button type="button" class="btn btn-sm" onclick="App.v373Reshuffle()">↻ Reshuffle</button>':''}${cfg.sort==='manual'?'<button type="button" class="btn btn-sm" onclick="App.v373ResetManual()">Restore added order</button>':''}</div>`;
    const branded=raw.replace('class="card v175-batch-library-tools"','class="card v175-batch-library-tools mf373-batch-order'+(['manual','random'].includes(cfg.sort)?' v373-sort-fixed':'')+'"');
    const end=branded.lastIndexOf('</div>');
    return end<0?branded:branded.slice(0,end)+detail+branded.slice(end);
  };
  const batchSetFilterBase=App.v175BatchSetFilter;
  App.v175BatchSetFilter=function(key,value){
    if(key==='sort'){v373SetSort(value);const st=v175NormalizeBatchLibraryState();st.pages={};v175RefreshBatchLibraryUI();return;}
    return batchSetFilterBase.apply(this,arguments);
  };
  App.v224BatchToggleSortDirection=function(){
    v373Direction();v175NormalizeBatchLibraryState().pages={};v175RefreshBatchLibraryUI();
  };
  App.v175BatchClearFilters=function(){
    const st=v175NormalizeBatchLibraryState();
    st.categories=[];st.status='all';st.priority='all';st.pages={};
    v373Clear();v175RefreshBatchLibraryUI();
  };
  const batchSuggestionsBase=renderBatchSuggestions;
  renderBatchSuggestions=function(rowIndex){
    const result=batchSuggestionsBase.apply(this,arguments);
    const box=document.getElementById(`batch-suggestions-${rowIndex}`);
    const row=S.batchDraft?.rows?.[rowIndex];
    if(!box||!row||row.libraryId)return result;
    const cfg=v373Active(),st=v175NormalizeBatchLibraryState();
    const candidates=v175BatchLibraryMatches(row.query||'');
    const size=Math.max(1,Number(v175PageSize('batchLibrary'))||20);
    const offset=Math.max(0,Math.floor(Number(st.pages[rowIndex])||0))*size;
    const manual=cfg.sort==='manual';
    if(manual)v373ManualIds(cfg);
    box.classList.add('mf373-batch-order');
    const nodes=box.querySelectorAll('.log-suggestion-list .log-suggestion');
    nodes.forEach((el,i)=>{
      const item=candidates[offset+i];if(!item)return;
      const id=v373Str(item.id),safe=escapeHtml(id);
      const position=manual?(V373_MANUAL_CACHE.positions.get(id)||0)+1:offset+i+1;
      el.classList.add('v373-title-row');el.dataset.v373Title=id;
      el.insertAdjacentHTML('afterbegin',`<span class="v373-rank">${position}</span>`);
      if(manual)el.insertAdjacentHTML('beforeend',`<div class="v373-reorder" aria-label="Reorder ${escapeHtml(cleanTitle(item.title))}">
        <button type="button" class="v373-grip" title="Drag to reorder" aria-label="Drag to reorder" data-v373-drag="${safe}">⠿</button>
        <button type="button" class="v373-move" title="Move up" onclick="App.v373Nudge('${safe}',-1)">↑</button>
        <button type="button" class="v373-move" title="Move down" onclick="App.v373Nudge('${safe}',1)">↓</button>
        <label class="v373-position"><span>Position</span><input type="number" inputmode="numeric" min="1" max="${(S.library||[]).length}" value="${position}" aria-label="Custom position" onchange="App.v373MovePosition('${safe}',this.value)"></label></div>`);
    });
    return result;
  };
  App.renderBatchSuggestions=renderBatchSuggestions;
  const selectBatchBase=App.selectBatchTitle;
  if(typeof selectBatchBase==='function')App.selectBatchTitle=function(index,id){
    const before=S.batchDraft?.rows?.[index]?.libraryId;
    const result=selectBatchBase.apply(this,arguments);
    const selected=S.batchDraft?.rows?.[index]?.libraryId;
    if(selected&&v373Str(selected)!==v373Str(before))v373RecordLog(selected);
    return result;
  };
}

// Pointer Events support mouse, touch and pen; arrows/numeric position remain
// available to keyboard and assistive technologies when dragging is unsuitable.
function v373DragEnd(event){
  const d=V373_POINTER_DRAG;if(!d)return;
  document.removeEventListener('pointermove',v373DragMove,true);
  document.removeEventListener('pointerup',v373DragEnd,true);
  document.removeEventListener('pointercancel',v373DragEnd,true);
  document.querySelectorAll('.v373-drop-target,.v373-drop-after,.v373-being-dragged').forEach(el=>el.classList.remove('v373-drop-target','v373-drop-after','v373-being-dragged'));
  V373_POINTER_DRAG=null;
  if(event.type==='pointercancel'||!d.moved||!d.target)return;
  v373MoveRelative(d.source,d.target,d.after);
}
function v373DragMove(event){
  const d=V373_POINTER_DRAG;
  if(!d||event.pointerId!==d.pointerId)return;
  if(Math.abs(event.clientY-d.startY)>5||Math.abs(event.clientX-d.startX)>5)d.moved=true;
  if(!d.moved)return;
  event.preventDefault();
  if(event.clientY<65)window.scrollBy(0,-22);else if(event.clientY>window.innerHeight-65)window.scrollBy(0,22);
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('.v373-title-row');
  const targetId=target?.dataset?.v373Title||null;
  const after=!!(target&&event.clientY>target.getBoundingClientRect().top+target.getBoundingClientRect().height/2);
  if(d.target===targetId&&d.after===after)return;
  document.querySelectorAll('.v373-drop-target,.v373-drop-after').forEach(el=>el.classList.remove('v373-drop-target','v373-drop-after'));
  if(targetId&&targetId!==d.source){d.target=targetId;d.after=after;target.classList.add(after?'v373-drop-after':'v373-drop-target');}else{d.target=null;d.after=false;}
}
document.addEventListener('pointerdown',event=>{
  const grip=event.target?.closest?.('[data-v373-drag]');
  if(!grip||event.button>0||v373Active().sort!=='manual')return;
  if(V373_POINTER_DRAG)v373DragEnd({type:'pointercancel'});
  V373_POINTER_DRAG={source:grip.dataset.v373Drag,pointerId:event.pointerId,startY:event.clientY,startX:event.clientX,moved:false,target:null};
  grip.closest('.v373-title-row')?.classList.add('v373-being-dragged');
  document.addEventListener('pointermove',v373DragMove,true);
  document.addEventListener('pointerup',v373DragEnd,true);
  document.addEventListener('pointercancel',v373DragEnd,true);
},{passive:true});
// Explicit field-level merge: independently changed sorting and manual order
// must not be silently discarded by snapshots from a different device.
const v373MergeBase=mergeStates;
mergeStates=function(a,b){
  const out=v373MergeBase.apply(this,arguments)||{};
  const left=v373NormalizeSettings(a?.settings?.v373LoggingBrowser),right=v373NormalizeSettings(b?.settings?.v373LoggingBrowser);
  const sorted=right.sortAt>left.sortAt?right:left;
  const manual=right.manualAt>left.manualAt?right:left;
  const shuffled=right.randomAt>left.randomAt?right:left;
  const logRows=new Map();for(const [id,when] of [...left.recentlog,...right.recentlog])logRows.set(id,Math.max(when,logRows.get(id)||0));
  const recent=[...logRows].sort((a,b)=>b[1]-a[1]).slice(0,V373_RECENT_LIMIT);
  out.settings=out.settings||{};
  out.settings.v373LoggingBrowser={...v373Defaults(),sort:sorted.sort,dir:sorted.dir,sortAt:sorted.sortAt,
    manualOrder:manual.manualOrder,manualAt:manual.manualAt,
    recentlog:recent,recentAt:Math.max(left.recentAt,right.recentAt),randomSeed:shuffled.randomSeed,randomAt:shuffled.randomAt};
  return out;
};
const v373VerifyCloudBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v373VerifyCloudBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  // Do not require a new section for users whose account predates v373.
  if(expected?.settings?.v373LoggingBrowser){
    const received=v373NormalizeSettings(cloudState?.settings?.v373LoggingBrowser);
    const wanted=v373NormalizeSettings(expected.settings.v373LoggingBrowser);
    if(JSON.stringify(received)!==JSON.stringify(wanted))problems.push('Logging Library order and sorting');
  }
  return {ok:!problems.length,missing:[...new Set(problems)]};
};
Object.assign(App,{v373SetSort,v373Direction,v373Clear,v373Nudge,v373MovePosition,v373MoveBefore,v373MoveRelative,v373ResetManual,v373Reshuffle});
MediaFlowRuntime.version=373;
window.MediaFlowV373={version:373,features:['Oldest added first logging browser','Persistent manual drag/arrow/position order','Advanced sorting modes including preserved Rating + manual','Mobile pointer dragging','Cloud and backup persistence']};