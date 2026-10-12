/* MediaFlow 378: Tenrai metadata compatibility, import ID normalization,
 * Quick/Per Unit Logging Library, collapse controls and mixed Personal Order.
 * Release-only extension: existing cover rendering and cloud schemas retained.
 */
const V378_RELEASE=378;
const V378_ID_ALIASES={mal:['mal','myanimelist','myanimelist_id','mal_id','series_animedb_id','series_mangadb_id','manga_mangadb_id'],simkl:['simkl','simkl_id'],anilist:['anilist','ani_list','anilist_id'],tmdb:['tmdb','tmdb_id','tmdbtv'],imdb:['imdb','imdb_id','imdbid'],trakt:['trakt','trakt_id'],kitsu:['kitsu','kitsu_id'],isbn:['isbn','isbn10','isbn13']};
function v378NormalizeId(key,value){
  let s=String(value??'').trim();if(!s||s==='null'||s==='0')return '';
  if(/^https?:\/\//i.test(s)){
    const encoded=s;
    if(key==='mal'){const match=encoded.match(/myanimelist\.net\/(?:anime|manga)\/(\d+)/i);if(!match)return '';s=match[1];}
    else if(key==='imdb'){const match=encoded.match(/imdb\.com\/title\/(tt\d+)/i);if(!match)return '';s=match[1];}
    else {try{const u=new URL(s);s=u.pathname.split('/').filter(Boolean).pop()||'';}catch(_){return '';}}
  }
  if(key==='mal'||['simkl','anilist','tmdb','kitsu'].includes(key))return /^[1-9]\d*$/.test(s)?s:'';
  if(key==='imdb')return /^tt\d{7,12}$/i.test(s)?s.toLowerCase():'';
  if(key==='isbn')return /^[\dXx-]{10,20}$/.test(s)?s:'';
  return /^[\w.:-]{1,120}$/.test(s)?s:'';
}
function v378ExtractIds(record){
  const out={},sources=[record,record?.externalIds,record?.ids,record?.show,record?.show?.ids,record?.movie,record?.movie?.ids,record?.anime,record?.anime?.ids,record?.media,record?.media?.ids,record?.node,record?.node?.ids,record?.item,record?.item?.ids].filter(v=>v&&typeof v==='object');
  for(const [key,aliases] of Object.entries(V378_ID_ALIASES)){
    for(const obj of sources){let found='';for(const alias of aliases){if(obj[alias]!=null){found=v378NormalizeId(key,obj[alias]);if(found)break;}}if(found){out[key]=found;break;}}
  }
  return out;
}
const v378ImportNormBase=v158NormalizeExternalIds;
v158NormalizeExternalIds=function(raw){
  const prior=v378ImportNormBase.apply(this,arguments),mapped=v378ExtractIds(raw);
  const result={};
  for(const key of Object.keys(V378_ID_ALIASES)){
    const value=mapped[key]||v378NormalizeId(key,prior?.[key]);if(value)result[key]=value;
  }
  return result;
};
const v378ApplyNormBase=v158ApplyNormalizedRecord;
let V378_IMPORT_STATS={imported:0,preserved:0,conflicts:0,invalid:0};
v158ApplyNormalizedRecord=function(record,service,index,touched){
  if(!record)return v378ApplyNormBase.apply(this,arguments);
  const normalized={},original=record.externalIds||{};
  for(const [k,v] of Object.entries(original)){
    const key=Object.keys(V378_ID_ALIASES).find(name=>name===k);
    if(!key)continue;
    const value=v378NormalizeId(key,v);
    if(value)normalized[key]=value;else if(v!=null&&String(v).trim()!=='')V378_IMPORT_STATS.invalid++;
  }
  const target=v158FindImportItem(record,index);
  const existing=target?.externalIds||{};
  for(const [key,value] of Object.entries(normalized)){
    const previous=v378NormalizeId(key,existing[key]);
    if(previous&&previous!==value){V378_IMPORT_STATS.conflicts++;delete normalized[key];continue;}
    if(target?.v377ManualExternalIds&&Object.prototype.hasOwnProperty.call(target.v377ManualExternalIds,key)){
      V378_IMPORT_STATS.preserved++;delete normalized[key];continue;
    }
    if(previous)V378_IMPORT_STATS.preserved++;else V378_IMPORT_STATS.imported++;
  }
  return v378ApplyNormBase.call(this,{...record,externalIds:normalized},service,index,touched);
};
// Expose import normalization for integration checks; no changes to binary backups.
window.MediaFlowV378Import={normalizeId:v378NormalizeId,extractIds:v378ExtractIds,getStats:()=>({...V378_IMPORT_STATS}),resetStats:()=>{V378_IMPORT_STATS={imported:0,preserved:0,conflicts:0,invalid:0};}};

// Tenrai is MyAnimeList-specific: the historic internal function names remain
// callable for backward compatibility while endpoint URLs use /v1.
const v378OldSettingsHtml=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
  return String(v378OldSettingsHtml.apply(this,arguments))
    .replace(/Jikan/g,'Tenrai')
    .replace(/data-v225-icon="(?:refresh|sync)"([^>]*)(?=>)/g,'data-v225-icon="refresh"$1')
    .replace(/(<button[^>]*onclick="App\.v377ShowUnmatchedReport\(\)"[^>]*)(>)/,'$1 data-v225-icon="unmatched"$2')
    .replace(/(<button[^>]*onclick="App\.v377RetryUnmatched\('failed'\)"[^>]*)(>)/,'$1 data-v225-icon="retryApi"$2');
};
const v378VerifyBase=App.v377VerifyMalId;
// Existing v377 verification uses the shared v166 provider fetch, now Tenrai.
App.v377VerifyMalId=v378VerifyBase;
const v378IdsHtmlBase=v377IdsEditorHtml;
v377IdsEditorHtml=function(item){return String(v378IdsHtmlBase.apply(this,arguments))
  .replace('mf377-section-icon">⌗','mf377-section-icon"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l2.5-2.5a5 5 0 0 0-7.1-7.1L11 4.9"/><path d="M14 11a5 5 0 0 0-7.1 0l-2.5 2.5a5 5 0 0 0 7.1 7.1l1.5-1.5"/></svg>')
  .replace('onclick="App.v377VerifyMalId()"','data-v225-icon="verify" onclick="App.v377VerifyMalId()"')
  .replace(/Jikan/g,'Tenrai');};
const v378StatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){return String(v378StatusBase.apply(this,arguments)).replace(/Jikan/g,'Tenrai');};

// Verify the intended MAL media type. Anime and manga MAL number spaces
// overlap, so never accept an anime match for a manga simply because its
// numeric ID also exists in the anime catalog.
App.v377VerifyMalId=async function(){
  const field=document.querySelector('[data-v377-id="mal"]'),preview=document.getElementById('mf377-mal-preview');
  if(!field||!preview)return;
  const id=v378NormalizeId('mal',field.value);
  if(!id){preview.textContent='Enter a valid positive numeric MyAnimeList ID.';return;}
  const category=getCategory(document.getElementById('l-category')?.value||'');
  const reading=/manga|manhwa|manhua|comic|book|novel|read/i.test(String(category?.name||'')+' '+String(category?.type||'')+' '+String(category?.unit||''));
  const kind=reading?'manga':'anime';
  preview.textContent='Verifying MyAnimeList '+kind+' #'+id+' through Tenrai…';
  try{
    const payload=await v166FetchJikan(`/${kind}/${encodeURIComponent(id)}/full`,{ttl:60*60*1000});
    const title=String(payload?.data?.title||payload?.data?.title_english||'').trim();
    if(!title)throw new Error('The provider did not return a matching title.');
    if(!preview.isConnected)return;
    const data=payload.data,url=data.images?.jpg?.image_url||data.images?.webp?.image_url||'';
    preview.replaceChildren();
    const line=document.createElement('div');line.className='mf378-verified-result';
    if(/^https:\/\//.test(url)){
      const image=document.createElement('img');image.src=url;image.alt=title+' cover';image.loading='lazy';line.appendChild(image);
    }
    const info=document.createElement('span');
    const strong=document.createElement('strong');strong.textContent='Verified '+kind+': '+title;
    const small=document.createElement('small');small.textContent='MyAnimeList #'+id+' · Verified using Tenrai';
    info.append(strong,small);line.appendChild(info);preview.appendChild(line);
  }catch(err){if(preview.isConnected)preview.textContent='Verification unavailable: '+String(err?.message||err)+'. Your entered ID has not been changed.';}
};
// Present import ID outcomes after the established importer finishes.
const v378ExchangeImportBase=v158ImportExchangeFile;
v158ImportExchangeFile=async function(){
  V378_IMPORT_STATS={imported:0,preserved:0,conflicts:0,invalid:0};
  const result=await v378ExchangeImportBase.apply(this,arguments),n=V378_IMPORT_STATS;
  if(n.imported||n.preserved||n.conflicts||n.invalid){
    showToast(`External IDs: ${n.imported} added · ${n.preserved} preserved · ${n.conflicts} conflicts · ${n.invalid} invalid.`);
  }
  return result;
};
mfImportExchangeFile=v158ImportExchangeFile;
// Title-position inputs: browser number spinner was consuming the characters.
// Position containers and Collection cover styles are deliberately unchanged.

// Show assigned Collections in the regular All Titles list, next to their
// nearest preceding category queue title, without creating or moving assignments.
const v378AllTitlesBase=v138AllTitlesHtml;
v138AllTitlesHtml=function(){
  const queues=v376VisibleQueues(),assignments=queues.reduce((n,g)=>n+g.tokens.filter(x=>x.startsWith('c:')).length,0);
  if(!assignments)return v378AllTitlesBase.apply(this,arguments);
  const structure=v156EnsureOrderStructure();
  const items=structure.orderedItems||[];
  const orderIds=new Set(items.map(x=>String(x?.id||'')));
  const after=new Map(),before=new Map(),orphan=[];
  for(const group of queues){
    let preceding=null;
    for(let i=0;i<group.tokens.length;i++){
      const token=group.tokens[i];
      if(token.startsWith('t:')){if(orderIds.has(token.slice(2)))preceding=token.slice(2);continue;}
      if(!token.startsWith('c:'))continue;
      const a=v287Assignment(token.slice(2));if(!a)continue;
      const detail={a,position:i+1,total:group.tokens.length};
      if(preceding){if(!after.has(preceding))after.set(preceding,[]);after.get(preceding).push(detail);}
      else {const next=group.tokens.slice(i+1).find(x=>x.startsWith('t:')&&orderIds.has(x.slice(2)));
        if(next){const k=next.slice(2);if(!before.has(k))before.set(k,[]);before.get(k).push(detail);}else orphan.push(detail);}
    }
  }
  const mixed=[];
  for(const item of items){const id=String(item?.id||'');mixed.push(...(before.get(id)||[]));mixed.push(item);mixed.push(...(after.get(id)||[]));}
  mixed.push(...orphan);
  const p=v138EnsureOrderPlan(),ui=v173OrderUI(),size=v175OrderPageSize(),pages=Math.max(1,Math.ceil(mixed.length/size));
  const page=p.paginateOrderedTitles?Math.min(pages-1,Math.max(0,ui.v173AllPage||0)):0;
  ui.v173AllPage=page;
  const start=p.paginateOrderedTitles?page*size:0;
  const visible=p.paginateOrderedTitles?mixed.slice(start,start+size):mixed;
  const html=visible.map((entry,i)=>{
    if(entry&&entry.a)return v288AssignmentRowHtml(entry.a,entry.position,entry.total,'regular');
    return v138OrderRowHtml(entry,start+i+1,'');
  }).join('');
  return `<div class="v138-order-list mf378-mixed-all">${html}</div>${p.paginateOrderedTitles?v173OrderPaginationHtml(page,pages,'all'):''}`;
};

// v242 intentionally returned no results for an empty query. Logging 4.0
// exposes the paginated browser without requiring a search phrase.
const v378CandidateBase=logTitleCandidates;
logTitleCandidates=function(query){
  if(String(query||'').trim())return v378CandidateBase.apply(this,arguments);
  const state=v224NormalizeLogSort();
  let rows=(S.library||[]).filter(i=>i?.id&&i.status!=='dropped');
  if(state.categories.length){const ids=new Set(state.categories.map(String));rows=rows.filter(i=>ids.has(String(i.categoryId||'')));}
  if(state.status!=='all')rows=rows.filter(i=>String(i.status||'planned')===state.status);
  if(state.priority!=='all')rows=rows.filter(i=>String(i.priority||'medium')===state.priority);
  return rows.sort((a,b)=>v224CompareLibraryLike(a,b,state.sortBase,state.sortDir));
};
// Explicit semantic icons in the existing MediaFlow v225 icon system.
Object.assign(V225_BUTTON_ICONS,{
  verify:v225IconSvg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 10l2 2 3-3"/>'),
  unmatched:v225IconSvg('<path d="M8 6h13M8 12h9M8 18h7"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'),
  retryApi:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 1 0 1.5 8"/>')
});
// Logging 4.0: picker selections are ephemeral UI state, never a Library mutation.
const V378_LOG_UI={view:'list',clean:false,selected:new Set()};
function v378AddedIds(){return new Set((S.logDraft?.entries||[]).map(e=>String(e.libraryId||'')).filter(Boolean));}
function v378LogPickerActions(){
  const views=[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-titles','Covers + Titles']];
  const clean=V378_LOG_UI.clean,sel=V378_LOG_UI.selected;
  return `<div class="mf378-library-actions" role="group" aria-label="Logging Library tools">
    <label>Display <select aria-label="Logging Library display mode" onchange="App.v378LogView(this.value)">${views.map(([k,v])=>`<option value="${k}" ${V378_LOG_UI.view===k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label class="mf378-clean-toggle"><input type="checkbox" ${clean?'checked':''} onchange="App.v378LogClean(this.checked)"> Clean Covers</label>
    <button type="button" class="btn btn-sm" ${clean?'disabled':''} onclick="App.v378SelectVisible()">Select Visible</button>
    <button type="button" class="btn btn-sm" ${clean||!sel.size?'disabled':''} onclick="App.v378DeselectAll()">Deselect All</button>
    <button type="button" class="btn btn-sm btn-primary" ${clean||!sel.size?'disabled':''} onclick="App.v378BulkAdd()">Add Selected (${sel.size})</button>
  </div>`;
}
const v378LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){return v378LogToolsBase.apply(this,arguments)+v378LogPickerActions();};
const v378SuggestionsBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
  const raw=String(v378SuggestionsBase.apply(this,arguments)||'');
  try{
    const root=document.createElement('div');root.innerHTML=raw;
    const list=root.querySelector('.log-suggestion-list');if(!list)return raw;
    list.classList.add('mf378-picker',`mf378-${V378_LOG_UI.view}`);
    if(V378_LOG_UI.clean)list.classList.add('mf378-clean');
    const q=String(S.entryDraft?.title||'').trim(),candidates=logTitleCandidates(q),size=V89_LOG.pageSize;
    const rows=candidates.slice(V89_LOG.page*size,(V89_LOG.page+1)*size),added=v378AddedIds();
    [...list.children].forEach((el,index)=>{
      const item=rows[index];if(!item)return;
      const id=String(item.id),already=added.has(id);
      const old=el.querySelector('button[onclick*="selectLogTitle"]');
      if(old){old.textContent=already?'Added':'Add';old.disabled=already;old.setAttribute('onclick',`App.v378QuickAdd(${JSON.stringify(id)})`);old.classList.add('mf378-add-btn');}
      if(!V378_LOG_UI.clean){
        const label=document.createElement('label');label.className='mf378-check';
        label.innerHTML=`<input type="checkbox" aria-label="Select ${escapeHtml(cleanTitle(item.title))}" ${V378_LOG_UI.selected.has(id)?'checked':''} onchange="App.v378Pick(decodeURIComponent('${encodeURIComponent(id)}'),this.checked)">`;
        el.prepend(label);
      }
      el.dataset.mf378Id=id;
      if(already)el.classList.add('mf378-added');
    });
    return root.innerHTML;
  }catch(e){console.warn('v378 Logging picker display fallback',e);return raw;}
};
App.v378LogView=function(value){V378_LOG_UI.view=['list','compact','cards','covers','covers-titles'].includes(value)?value:'list';renderLogSuggestions();};
App.v378LogClean=function(value){V378_LOG_UI.clean=!!value;if(value)V378_LOG_UI.selected.clear();renderLogSuggestions();};
App.v378Pick=function(id,value){id=String(id);if(value)V378_LOG_UI.selected.add(id);else V378_LOG_UI.selected.delete(id);renderLogSuggestions();};
App.v378DeselectAll=function(){V378_LOG_UI.selected.clear();renderLogSuggestions();};
App.v378SelectVisible=function(){
  if(V378_LOG_UI.clean)return;
  const q=String(S.entryDraft?.title||'').trim(),candidates=logTitleCandidates(q),added=v378AddedIds();
  for(const item of candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize)){
    if(item&&!added.has(String(item.id))&&item.status!=='dropped')V378_LOG_UI.selected.add(String(item.id));
  }renderLogSuggestions();
};
App.v378QuickAdd=function(id,{quiet=false,defer=false}={}){
  const item=(S.library||[]).find(x=>String(x?.id)===String(id));if(!item||item.status==='dropped')return false;
  if(v378AddedIds().has(String(id))){if(!quiet)showToast('Already added to this Logging session.');return false;}
  if(!S.logDraft){if(!quiet)showToast('Open Logging before adding titles.');return false;}
  const start=typeof v179StartProgress==='function'?v179StartProgress(item):Math.max(0,Number(item.progress)||0);
  const repeat=item.status==='completed'||(Number(item.total)>0&&Number(item.progress)>=Number(item.total));
  const stamp=Date.now();
  const entry={title:cleanTitle(item.title),libraryId:item.id,qty:0,isNew:false,isRepeat:repeat,loggedAt:stamp,v394When:stamp,v179StartProgress:start,v179EndProgress:start};
  if(S.logDraft.v369Interface==='itemized')Object.assign(entry,{v369Units:[],v369UpdatedAt:Date.now(),v369SelectedSeasonId:''});
  (S.logDraft.entries||(S.logDraft.entries=[])).push(entry);
  V378_LOG_UI.selected.delete(String(id));
  if(!defer){if(S.logDraft.v369Interface==='itemized')v369Sync();else if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();v369Touch();render();}
  if(!quiet)showToast('Title added. Enter consumption before submitting.');
  return true;
};
App.v378BulkAdd=function(){
  if(V378_LOG_UI.clean)return;
  let count=0;for(const id of [...V378_LOG_UI.selected]){if(App.v378QuickAdd(id,{quiet:true,defer:true}))count++;}
  V378_LOG_UI.selected.clear();
  if(count){if(S.logDraft.v369Interface==='itemized')v369Sync();else if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();v369Touch();render();}
  showToast(count?`${count} title${count===1?'':'s'} added to Logging. Fill in consumption to log.`:'No new titles added.');
};
App.v378QuickQuantity=function(index,value){
  const entry=S.logDraft?.entries?.[Number(index)];if(!entry)return;
  entry.qty=Math.max(0,Math.floor(Number(value)||0));
  if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();
  v369Touch();render();
};
// Existing Quick UI rendered amounts as uneditable text. Expose a draft amount
// editor, and remove the zero-quantity placeholders before committing.
const v378SubmitBase=App.submitLog;
App.submitLog=function(){
  if(S.logDraft?.v369Interface!=='itemized'&&(S.logDraft?.entries||[]).some(e=>Number(e.qty)<=0)){
    showToast('Enter consumption for added titles, or remove empty titles before submitting.');return false;
  }
  return v378SubmitBase.apply(this,arguments);
};
function v378Collapsed(){
  const draft=S.logDraft||{};
  if(!Array.isArray(draft.v378CollapsedIds))draft.v378CollapsedIds=[];
  return new Set(draft.v378CollapsedIds.map(String));
}
function v378PersistCollapse(set){if(!S.logDraft)return;S.logDraft.v378CollapsedIds=[...set];v369Touch();v378ApplyCollapsed(document);}
function v378ApplyCollapsed(root){
  const form=root?.querySelector?.('.log-form')||root?.closest?.('.log-form');if(!form)return;
  const collapsed=v378Collapsed();
  form.querySelectorAll('[data-mf373-entry]').forEach(row=>{
    const index=Number(row.dataset.mf373Entry),entry=S.logDraft?.entries?.[index];if(!entry)return;
    const key=String(entry.libraryId||`index:${index}`),on=collapsed.has(key);
    row.classList.toggle('mf378-collapsed',on);
    const control=row.querySelector('.mf378-collapse-one');if(control){control.textContent=on?'Expand':'Collapse';control.setAttribute('aria-expanded',String(!on));}
  });
}
App.v378CollapseAll=function(on){const entries=S.logDraft?.entries||[];const ids=on?new Set(entries.map((e,i)=>String(e.libraryId||`index:${i}`))):new Set();v378PersistCollapse(ids);};
App.v378ToggleTitle=function(index){const entry=S.logDraft?.entries?.[Number(index)];if(!entry)return;const ids=v378Collapsed(),key=String(entry.libraryId||`index:${index}`);if(ids.has(key))ids.delete(key);else ids.add(key);v378PersistCollapse(ids);};
const v378RenderLogBase=renderLogForm;
renderLogForm=function(){
  const html=String(v378RenderLogBase.apply(this,arguments)||'');
  if(!S.logDraft)return html;
  try{
    const root=document.createElement('div');root.innerHTML=html;const form=root.querySelector('.log-form');if(!form)return html;
    form.classList.add('mf378-logging');
    const toolbar=form.querySelector('.mf373-toolbar')||form.querySelector('.v370-logging-actions')||form.querySelector('.v369-interface');
    if(toolbar)toolbar.insertAdjacentHTML('afterend','<div class="mf378-collapse-toolbar"><button type="button" class="btn btn-sm" onclick="App.v378CollapseAll(true)">Collapse All</button><button type="button" class="btn btn-sm" onclick="App.v378CollapseAll(false)">Expand All</button></div>');
    form.querySelectorAll('[data-mf373-entry]').forEach(node=>{
      const index=Number(node.dataset.mf373Entry),entry=S.logDraft.entries[index];if(!entry)return;
      const target=node.querySelector('.v370-title-head,.v369-title-head,.v239-logged-title-actions')||node;
      target.insertAdjacentHTML('beforeend',`<button type="button" class="btn btn-sm mf378-collapse-one" onclick="App.v378ToggleTitle(${index})">Collapse</button>`);
      if(S.logDraft.v369Interface!=='itemized'&&v179Mode('single')!=='progress'){
        const qty=node.querySelector('.v239-logged-consumed');if(qty){qty.outerHTML=`<label class="mf378-quick-amount">Consumed <input type="number" inputmode="numeric" min="0" value="${Math.max(0,Number(entry.qty)||0)}" aria-label="Amount consumed for ${escapeHtml(entry.title)}" onchange="App.v378QuickQuantity(${index},this.value)"></label>`;}
      }
    });
    v378ApplyCollapsed(root);
    return root.innerHTML;
  }catch(e){console.warn('v378 Logging controls fallback',e);return html;}
};
const v378RefreshPanelsBase=v369RefreshPanels;
v369RefreshPanels=function(){const r=v378RefreshPanelsBase.apply(this,arguments);v378ApplyCollapsed(document);return r;};
MediaFlowRuntime.version=V378_RELEASE;
window.MediaFlowV378={version:378,features:['Tenrai v1 MAL provider','External ID import normalization','Logging direct/bulk add and five picker layouts','Collapse/Expand All','Personal Order mixed All Titles','Three-digit title positions']};
