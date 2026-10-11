/* ============================================================
   MediaFlow v274 — Collections mini-Library + rating filters +
                    Personal Order layout controls
   ------------------------------------------------------------
   - Adds a complete Collections page directly below Library.
   - Collections support cover/compact/list/card/showcase browser modes.
   - Each collection behaves like a mini Library with Library-style tools,
     manual order view, advanced filters, overlays and add-title browser.
   - Adds rating filters to Normal + Dynamic Library.
   - Adds adjustable Personal Order side/category widths + Deselect all.
   - Persists collections through snapshot/cloud/backup/import/merge paths.
   ============================================================ */
const V274_RUNTIME_VERSION=274;

/* ---------- Shared helpers ------------------------------------------ */
function v274Clone(value,fallback){try{return JSON.parse(JSON.stringify(value));}catch(_){return fallback;}}
function v274Now(){return Date.now();}
function v274Id(){try{return uid();}catch(_){return 'c_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}}
function v274Num(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function v274Text(v){return String(v??'').trim();}
function v274SafeTitle(item){return cleanTitle(item?.title||'Untitled');}
function v274LibraryMap(){return new Map((S.library||[]).filter(Boolean).map(i=>[String(i.id),i]));}
function v274LibraryItem(id){const sid=String(id||'');try{return typeof v270LibraryById==='function'?v270LibraryById(sid):(S.library||[]).find(i=>String(i?.id||'')===sid)||null;}catch(_){return (S.library||[]).find(i=>String(i?.id||'')===sid)||null;}}
function v274CollectionItems(c){return (c?.titleIds||[]).map(id=>v274LibraryItem(id)).filter(Boolean);}
function v274StatusLabel(status){try{return v199StatusLabel(status);}catch(_){return String(status||'planned').replace(/^./,x=>x.toUpperCase());}}
function v274Cat(item){try{return getCategory(item?.categoryId)||null;}catch(_){return null;}}
function v274CoverUrl(item){return v274Text(item?.coverUrl||item?.cover||item?.imageUrl||'');}
function v274SeasonCount(item){try{if(typeof v252Seasons==='function')return v252Seasons(item).length;}catch(_){ }return Array.isArray(item?.seasons)?item.seasons.length:v274Num(item?.seasonCount,0);}
function v274RuntimeMinutes(item){const candidates=[item?.runtimeMinutes,item?.runtime,item?.durationMinutes,item?.duration,item?.minutesPerEpisode];for(const v of candidates){const n=Number(v);if(Number.isFinite(n)&&n>0)return n;}return 0;}
function v274EpisodeCount(item){const cat=v274Cat(item);if(cat?.unit==='episodes')return Math.max(0,v274Num(item?.total,0));return Math.max(0,v274Num(item?.episodeCount,0));}
function v274ServiceLinked(item){const keys=['malId','simklId','tmdbId','tvdbId','anilistId','kitsuId','imdbId','mediaServiceId'];return keys.some(k=>v274Text(item?.[k]));}

/* ---------- Settings ------------------------------------------------ */
function v274EnsureSettings(target=S.settings||DEFAULT_SETTINGS){
  target.v274Collections=Object.assign({
    browserView:'showcase',detailView:'covers-title',toolsVisible:true,pageSize:50,
    orderPanelWidth:370,orderCategoryWidth:760,modifiedAt:0
  },target.v274Collections||{});
  target.v274Collections.browserView=['covers','compact','list','cards','showcase'].includes(String(target.v274Collections.browserView))?String(target.v274Collections.browserView):'showcase';
  target.v274Collections.detailView=['list','compact','cards','covers','covers-title'].includes(String(target.v274Collections.detailView))?String(target.v274Collections.detailView):'covers-title';
  target.v274Collections.toolsVisible=target.v274Collections.toolsVisible!==false;
  target.v274Collections.pageSize=Math.max(10,Math.min(200,Math.round(v274Num(target.v274Collections.pageSize,50))));
  target.v274Collections.orderPanelWidth=Math.max(280,Math.min(620,Math.round(v274Num(target.v274Collections.orderPanelWidth,370))));
  target.v274Collections.orderCategoryWidth=Math.max(420,Math.min(1200,Math.round(v274Num(target.v274Collections.orderCategoryWidth,760))));
  return target.v274Collections;
}
v274EnsureSettings(DEFAULT_SETTINGS);
v274EnsureSettings(S.settings||DEFAULT_SETTINGS);

/* ---------- Collection persistence model ---------------------------- */
function v274NormalizeCollection(raw){
  const c=raw&&typeof raw==='object'?raw:{};
  const titleIds=[...new Set((Array.isArray(c.titleIds)?c.titleIds:[]).map(String).filter(Boolean))];
  const order=[...new Set((Array.isArray(c.order)?c.order:titleIds).map(String).filter(id=>titleIds.includes(id)))];
  for(const id of titleIds)if(!order.includes(id))order.push(id);
  return {
    id:v274Text(c.id)||v274Id(),
    title:v274Text(c.title)||'Untitled Collection',
    description:String(c.description||''),
    coverUrl:v274Text(c.coverUrl),
    titleIds:order.slice(),
    order:order.slice(),
    autoBackground:c.autoBackground!==false,
    createdAt:v274Num(c.createdAt,v274Now()),
    updatedAt:v274Num(c.updatedAt,v274Now()),
    lastViewedAt:v274Num(c.lastViewedAt,0)
  };
}
function v274NormalizeCollections(raw){
  const seen=new Set();return (Array.isArray(raw)?raw:[]).map(v274NormalizeCollection).filter(c=>c.id&&!seen.has(c.id)&&seen.add(c.id));
}
function v274EnsureCollections(){
  S.collections=v274NormalizeCollections(S.collections);
  S.collectionTombstones=Array.isArray(S.collectionTombstones)?S.collectionTombstones.filter(x=>x&&x.id).map(x=>({id:String(x.id),deletedAt:v274Num(x.deletedAt,0)})):[];
  return S.collections;
}
v274EnsureCollections();

function v274TouchCollection(c){if(!c)return;c.updatedAt=v274Now();c.titleIds=[...new Set((c.titleIds||[]).map(String))];c.order=[...c.titleIds];}
function v274CollectionById(id){return v274EnsureCollections().find(c=>String(c.id)===String(id))||null;}
function v274CollectionProgress(c){
  const items=v274CollectionItems(c);if(!items.length)return {pct:0,done:0,total:0,known:0,label:'0%'};
  let done=0,total=0,known=0,completed=0;
  for(const item of items){
    const t=Math.max(0,v274Num(item.total,0)),p=Math.max(0,v274Num(item.progress,0));
    if(t>0){total+=t;done+=Math.min(p,t);known++;}
    if(String(item.status||'')==='completed'||(t>0&&p>=t))completed++;
  }
  const pct=total>0?Math.round(done/total*100):Math.round(completed/items.length*100);
  return {pct:Math.max(0,Math.min(100,pct)),done:completed,total:items.length,known,label:`${Math.max(0,Math.min(100,pct))}%`};
}
function v274CollectionCoverItems(c){
  const items=v274CollectionItems(c);const withCovers=items.filter(i=>v274CoverUrl(i));
  return (withCovers.length?withCovers:items).slice(0,4);
}
function v274CollectionCoverHtml(c,cls='mf274-collection-cover'){
  const cover=v274Text(c?.coverUrl);
  if(cover)return `<div class="${cls} single"><img src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('broken')"></div>`;
  const items=v274CollectionCoverItems(c);
  if(!items.length)return `<div class="${cls} empty"><span>◇</span></div>`;
  return `<div class="${cls} collage count-${Math.min(4,items.length)}">${items.map(item=>{const url=v274CoverUrl(item),cat=v274Cat(item);return url?`<img src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span style="--mf274-cat:${escapeHtml(cat?.color||'var(--flow)')}">${cat?v144CategoryIconHtml(cat):'◇'}</span>`;}).join('')}</div>`;
}
function v274CollectionBackground(c){
  if(!c?.autoBackground)return '';
  const covers=v274CollectionItems(c).map(v274CoverUrl).filter(Boolean);if(!covers.length)return '';
  const bucket=Math.floor(Date.now()/30000);let seed=bucket;for(const ch of String(c.id||''))seed=((seed*31)+ch.charCodeAt(0))>>>0;
  return covers[seed%covers.length]||'';
}

/* ---------- Cloud / full backup / merge ----------------------------- */
const v274SnapshotBase=snapshot;
snapshot=function(){
  v274EnsureCollections();const out=v274SnapshotBase.apply(this,arguments);
  out.collections=v274Clone(S.collections,[]);out.collectionTombstones=v274Clone(S.collectionTombstones,[]);
  return out;
};
const v274ApplyStateBase=v46ApplyState;
v46ApplyState=function(data){v274ApplyStateBase.apply(this,arguments);S.collections=v274NormalizeCollections(data?.collections);S.collectionTombstones=Array.isArray(data?.collectionTombstones)?v274Clone(data.collectionTombstones,[]):[];v274EnsureCollections();v274EnsureSettings(S.settings||DEFAULT_SETTINGS);};
const v274LoadAllBase=loadAll;
loadAll=async function(){let bootstrap;try{if(typeof V115_BOOTSTRAP_OVERRIDE!=='undefined'&&V115_BOOTSTRAP_OVERRIDE)bootstrap=V115_BOOTSTRAP_DATA;}catch(_){ }const out=await v274LoadAllBase.apply(this,arguments);const data=(bootstrap&&typeof bootstrap==='object')?bootstrap:null;if(data){S.collections=v274NormalizeCollections(data.collections);S.collectionTombstones=Array.isArray(data.collectionTombstones)?v274Clone(data.collectionTombstones,[]):[];}v274EnsureCollections();v274EnsureSettings(S.settings||DEFAULT_SETTINGS);return out;};
const v274MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v274MergeStatesBase.apply(this,arguments)||{};
  const tomb=new Map();for(const x of [...(a?.collectionTombstones||[]),...(b?.collectionTombstones||[])]){if(!x?.id)continue;const prev=tomb.get(String(x.id));if(!prev||v274Num(x.deletedAt)>v274Num(prev.deletedAt))tomb.set(String(x.id),{id:String(x.id),deletedAt:v274Num(x.deletedAt)});}
  const byId=new Map();for(const raw of [...(a?.collections||[]),...(b?.collections||[])]){const c=v274NormalizeCollection(raw),prev=byId.get(c.id);if(!prev||c.updatedAt>=prev.updatedAt)byId.set(c.id,c);}
  out.collections=[...byId.values()].filter(c=>v274Num(tomb.get(c.id)?.deletedAt,0)<c.updatedAt);
  out.collectionTombstones=[...tomb.values()];
  return out;
};
if(typeof v148BackupManifest==='function'){
  const v274ManifestBase=v148BackupManifest;
  v148BackupManifest=function(){const m=v274ManifestBase.apply(this,arguments);m.includes=Object.assign({},m.includes||{},{collectionsV274:true,collectionOrderV274:true,collectionArtworkV274:true,collectionFiltersV274:true,libraryRatingFilterV274:true,personalOrderLayoutV274:true});m.counts=Object.assign({},m.counts||{},{collections:v274EnsureCollections().length});m.v274={collections:true,miniLibrary:true,advancedCollectionFilters:true,libraryRatingFilter:true,personalOrderLayout:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4,pwaRelease:274};return m;};
}

/* ---------- Navigation ------------------------------------------------ */
ICONS.collections=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="2"/><rect x="3" y="10" width="18" height="5" rx="2"/><rect x="3" y="16" width="18" height="5" rx="2"/></svg>`;
if(!NAV_ITEMS.some(n=>n.id==='collections')){
  const lib=NAV_ITEMS.findIndex(n=>n.id==='library');NAV_ITEMS.splice(lib>=0?lib+1:1,0,{id:'collections',label:'Collections'});
}
if(!MOBILE_MORE_NAV.includes('collections'))MOBILE_MORE_NAV.unshift('collections');
try{
  const layout=v161EnsureNavLayout();
  if(!layout.order.includes('collections'))layout.order.push('collections');
  const ci=layout.order.indexOf('collections'),li=layout.order.indexOf('library');
  if(ci>=0&&li>=0&&ci!==li+1){layout.order.splice(ci,1);layout.order.splice(layout.order.indexOf('library')+1,0,'collections');}
}catch(_){ }

/* ---------- Collection browser state --------------------------------- */
const V274_UI={
  search:'',sort:'updated',dir:'desc',page:0,
  activeId:'',orderView:false,detailPage:0,
  filters:{search:'',categories:[],status:'all',priority:'all',rating:'all',cover:'all',sort:'order',dir:'asc',yearMin:'',yearMax:'',runtimeMin:'',runtimeMax:'',seasonMin:'',seasonMax:'',episodeMin:'',episodeMax:'',limit:0,moderator:'all'},
  add:{search:'',categories:[],status:'all',priority:'all',rating:'all',sort:'title',dir:'asc',page:0,picks:new Set()}
};
function v274ResetCollectionFilters(){V274_UI.filters={search:'',categories:[],status:'all',priority:'all',rating:'all',cover:'all',sort:'order',dir:'asc',yearMin:'',yearMax:'',runtimeMin:'',runtimeMax:'',seasonMin:'',seasonMax:'',episodeMin:'',episodeMax:'',limit:0,moderator:'all'};}
function v274SetBrowserView(mode){const s=v274EnsureSettings();if(!['covers','compact','list','cards','showcase'].includes(String(mode)))return;s.browserView=String(mode);s.modifiedAt=v274Now();persistSettings();render();}
function v274SetDetailView(mode){const s=v274EnsureSettings();if(!['list','compact','cards','covers','covers-title'].includes(String(mode)))return;s.detailView=String(mode);s.modifiedAt=v274Now();V274_UI.detailPage=0;persistSettings();render();}
function v274SetCollectionSearch(value){V274_UI.search=String(value||'');V274_UI.page=0;render();}
function v274SetCollectionSort(value){V274_UI.sort=String(value||'updated');V274_UI.page=0;render();}
function v274ToggleCollectionSortDir(){V274_UI.dir=V274_UI.dir==='asc'?'desc':'asc';V274_UI.page=0;render();}
function v274CollectionSortRows(rows){const dir=V274_UI.dir==='asc'?1:-1;return rows.slice().sort((a,b)=>{let d=0;if(V274_UI.sort==='alphabetic')d=a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'});else if(V274_UI.sort==='added')d=a.createdAt-b.createdAt;else if(V274_UI.sort==='viewed')d=a.lastViewedAt-b.lastViewedAt;else if(V274_UI.sort==='count')d=a.titleIds.length-b.titleIds.length;else if(V274_UI.sort==='progress')d=v274CollectionProgress(a).pct-v274CollectionProgress(b).pct;else d=a.updatedAt-b.updatedAt;return (d||a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}))*dir;});}
function v274FilteredCollections(){const q=V274_UI.search.trim().toLowerCase();let rows=v274EnsureCollections();if(q)rows=rows.filter(c=>`${c.title} ${c.description}`.toLowerCase().includes(q));return v274CollectionSortRows(rows);}

/* ---------- Collection list cards ------------------------------------ */
function v274CollectionStatsHtml(c){const p=v274CollectionProgress(c);return `<div class="mf274-collection-stats"><span>${c.titleIds.length.toLocaleString()} title${c.titleIds.length===1?'':'s'}</span><span>${p.pct}% progress</span><span>${c.lastViewedAt?`Viewed ${new Date(c.lastViewedAt).toLocaleDateString()}`:'Not viewed yet'}</span></div>`;}
function v274CollectionProgressHtml(c){const p=v274CollectionProgress(c);return `<div class="mf274-progress"><span style="width:${p.pct}%"></span></div><small class="mf274-progress-copy">${p.pct}% complete · ${p.done}/${p.total} titles completed</small>`;}
function v274CollectionBrowserCard(c,mode){
  const cover=v274CollectionCoverHtml(c,'mf274-browser-cover');const desc=escapeHtml(c.description||'No description yet.');
  if(mode==='covers')return `<button type="button" class="mf274-browser-cover-card" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${cover}<b>${escapeHtml(c.title)}</b><small>${c.titleIds.length} titles · ${v274CollectionProgress(c).pct}%</small></button>`;
  if(mode==='compact')return `<article class="mf274-browser-compact">${cover}<button type="button" class="mf274-browser-copy" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')"><b>${escapeHtml(c.title)}</b><span>${desc}</span></button><span>${c.titleIds.length} titles</span><button type="button" class="btn btn-sm" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit</button></article>`;
  if(mode==='list')return `<article class="mf274-browser-list">${cover}<div class="mf274-browser-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${escapeHtml(c.title)}</button><p>${desc}</p>${v274CollectionStatsHtml(c)}${v274CollectionProgressHtml(c)}</div><div class="mf274-browser-actions"><button type="button" class="btn btn-sm" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">Open</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit</button></div></article>`;
  if(mode==='cards')return `<article class="mf274-browser-card">${cover}<div class="mf274-browser-card-copy"><span class="mf274-kicker">COLLECTION</span><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${escapeHtml(c.title)}</button><p>${desc}</p>${v274CollectionProgressHtml(c)}${v274CollectionStatsHtml(c)}</div><div class="mf274-browser-actions"><button class="btn btn-sm" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">Open</button><button class="btn btn-sm btn-ghost" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit</button></div></article>`;
  // Showcase — inspired by the supplied Simkl list screenshot while remaining MediaFlow-native.
  return `<article class="mf274-browser-showcase"><button type="button" class="mf274-showcase-cover" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${cover}</button><div class="mf274-showcase-copy"><div class="mf274-showcase-meta"><span>COLLECTION</span><small>Created ${new Date(c.createdAt).toLocaleDateString()} · Updated ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${escapeHtml(c.title)}</button><p>${desc}</p>${v274CollectionStatsHtml(c)}${v274CollectionProgressHtml(c)}</div><div class="mf274-browser-actions"><button class="btn btn-sm" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">Open</button><button class="btn btn-sm btn-ghost" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit</button></div></article>`;
}
function v274BrowserViewSwitch(){const mode=v274EnsureSettings().browserView;return `<div class="mf274-view-switch" aria-label="Collection display mode">${[['covers','Covers'],['compact','Compact'],['list','List'],['cards','Cards'],['showcase','Showcase']].map(([id,label])=>`<button type="button" class="btn btn-sm ${mode===id?'btn-primary':''}" onclick="App.v274SetBrowserView('${id}')">${label}</button>`).join('')}</div>`;}
function v274CollectionsBrowserHtml(){
  const rows=v274FilteredCollections(),mode=v274EnsureSettings().browserView;
  return `<div class="mf274-page mf274-collections-browser">
    <div class="view-head mf274-collections-head"><div><div class="view-title">Collections</div><div class="view-desc">Build curated lists that behave like focused mini Libraries.</div></div><button type="button" class="btn btn-primary" onclick="App.v274CreateCollection()">+ Add collection</button></div>
    <div class="mf274-browser-toolbar card"><input type="search" placeholder="Search collections…" value="${escapeHtml(V274_UI.search)}" oninput="App.v274SetCollectionSearch(this.value)"><select onchange="App.v274SetCollectionSort(this.value)"><option value="updated" ${V274_UI.sort==='updated'?'selected':''}>Recently updated</option><option value="alphabetic" ${V274_UI.sort==='alphabetic'?'selected':''}>Alphabetic</option><option value="added" ${V274_UI.sort==='added'?'selected':''}>Recently added</option><option value="viewed" ${V274_UI.sort==='viewed'?'selected':''}>Recently viewed</option><option value="count" ${V274_UI.sort==='count'?'selected':''}>Title count</option><option value="progress" ${V274_UI.sort==='progress'?'selected':''}>Progress</option></select><button type="button" class="btn btn-sm" onclick="App.v274ToggleCollectionSortDir()" title="Sort direction">${V274_UI.dir==='asc'?'ASC ↑':'DESC ↓'}</button>${v274BrowserViewSwitch()}<span class="hint">${rows.length.toLocaleString()} collection${rows.length===1?'':'s'}</span></div>
    ${rows.length?`<div class="mf274-browser-results mode-${mode}">${rows.map(c=>v274CollectionBrowserCard(c,mode)).join('')}</div>`:`<div class="empty-state card"><div class="em-title">No collections yet</div><div>Create a collection to build franchises, watchlists, reading lists or any custom grouping.</div><button class="btn btn-primary" style="margin-top:14px" onclick="App.v274CreateCollection()">Create your first collection</button></div>`}
  </div>`;
}

/* ---------- Collection title filters -------------------------------- */
function v274RatingMatch(item,mode){const r=v274Num(item?.rating,0);if(mode==='rated')return r>0;if(mode==='unrated')return r<=0;if(/^\d+\+$/.test(mode))return r>=Number(mode.slice(0,-1));return true;}
function v274CollectionFilteredItems(c){
  const f=V274_UI.filters,q=f.search.trim().toLowerCase(),manualIndex=new Map((c.titleIds||[]).map((id,i)=>[String(id),i]));let rows=v274CollectionItems(c);
  if(q)rows=rows.filter(i=>[v274SafeTitle(i),v274Cat(i)?.name||'',i.status||'',i.priority||'',i.year||'',...(i.tags||[]),...(i.genres||[])].join(' ').toLowerCase().includes(q));
  if(f.categories.length)rows=rows.filter(i=>f.categories.includes(String(i.categoryId||'')));
  if(f.status!=='all')rows=rows.filter(i=>String(i.status||'planned')===f.status);
  if(f.priority!=='all')rows=rows.filter(i=>String(i.priority||'medium')===f.priority);
  if(f.rating!=='all')rows=rows.filter(i=>v274RatingMatch(i,f.rating));
  if(f.cover==='has')rows=rows.filter(i=>!!v274CoverUrl(i));else if(f.cover==='missing')rows=rows.filter(i=>!v274CoverUrl(i));
  const minmax=(keyMin,keyMax,getter)=>{const min=v274Text(f[keyMin]),max=v274Text(f[keyMax]);if(min!=='')rows=rows.filter(i=>getter(i)>=Number(min));if(max!=='')rows=rows.filter(i=>getter(i)<=Number(max));};
  minmax('yearMin','yearMax',i=>v274Num(i.year,0));minmax('runtimeMin','runtimeMax',v274RuntimeMinutes);minmax('seasonMin','seasonMax',v274SeasonCount);minmax('episodeMin','episodeMax',v274EpisodeCount);
  if(f.moderator==='imported')rows=rows.filter(i=>String(i.source||'').toLowerCase()!=='manual'&&String(i.source||'').trim()!=='');
  if(f.moderator==='manual')rows=rows.filter(i=>!i.source||String(i.source).toLowerCase()==='manual');
  if(f.moderator==='service')rows=rows.filter(v274ServiceLinked);
  const rank={low:0,medium:1,high:2},dir=f.dir==='desc'?-1:1,num=x=>v274Num(x,0),titleCmp=(a,b)=>v274SafeTitle(a).localeCompare(v274SafeTitle(b),undefined,{numeric:true,sensitivity:'base'});
  rows=rows.slice().sort((a,b)=>{let d=0;if(f.sort==='order')d=(manualIndex.get(String(a.id))??999999)-(manualIndex.get(String(b.id))??999999);else if(f.sort==='title')d=titleCmp(a,b);else if(f.sort==='priority')d=(rank[String(a.priority||'medium')]??1)-(rank[String(b.priority||'medium')]??1);else if(f.sort==='rating')d=num(a.rating)-num(b.rating);else if(f.sort==='progress')d=num(a.progress)-num(b.progress);else if(f.sort==='total')d=num(a.total)-num(b.total);else if(f.sort==='year')d=num(a.year)-num(b.year);return (d||titleCmp(a,b))*dir;});
  const limit=Math.max(0,Math.floor(v274Num(f.limit,0)));if(limit>0)rows=rows.slice(0,limit);return rows;
}
function v274SetCollectionFilter(key,value){if(!(key in V274_UI.filters))return;V274_UI.filters[key]=Array.isArray(V274_UI.filters[key])?V274_UI.filters[key]:String(value??'');V274_UI.detailPage=0;render();}
function v274ToggleCollectionCategory(id,on){const set=new Set(V274_UI.filters.categories);on?set.add(String(id)):set.delete(String(id));V274_UI.filters.categories=[...set];V274_UI.detailPage=0;render();}
function v274ClearCollectionCategories(event){event?.preventDefault?.();event?.stopPropagation?.();V274_UI.filters.categories=[];V274_UI.detailPage=0;render();}
function v274ToggleCollectionFilterDir(){V274_UI.filters.dir=V274_UI.filters.dir==='asc'?'desc':'asc';V274_UI.detailPage=0;render();}
function v274ClearCollectionFilters(){v274ResetCollectionFilters();V274_UI.detailPage=0;render();}
function v274ToggleCollectionTools(){const s=v274EnsureSettings();s.toolsVisible=!s.toolsVisible;s.modifiedAt=v274Now();persistSettings();render();}

function v274CollectionPageState(c){const rows=v274CollectionFilteredItems(c),size=v274EnsureSettings().pageSize,pages=Math.max(1,Math.ceil(rows.length/size));V274_UI.detailPage=Math.max(0,Math.min(V274_UI.detailPage,pages-1));return {rows,size,pages,page:V274_UI.detailPage,shown:rows.slice(V274_UI.detailPage*size,(V274_UI.detailPage+1)*size)};}
function v274SetCollectionPage(page){V274_UI.detailPage=Math.max(0,Math.floor(Number(page)||0));render();try{document.querySelector('.mf274-collection-tools')?.scrollIntoView({block:'start'});}catch(_){ }}
function v274SetCollectionPageSize(value){const settings=v274EnsureSettings();settings.pageSize=Math.max(10,Math.min(200,Math.round(Number(value)||50)));settings.modifiedAt=v274Now();V274_UI.detailPage=0;persistSettings();render();}
function v274CollectionPagerHtml(state){if(!state||state.pages<=1)return '';return `<div class="mf274-collection-pager card"><button class="btn btn-sm" ${state.page===0?'disabled':''} onclick="App.v274SetCollectionPage(${state.page-1})">← Prev</button><span>Page ${state.page+1} / ${state.pages} · ${state.rows.length.toLocaleString()} matching titles</span><button class="btn btn-sm" ${state.page>=state.pages-1?'disabled':''} onclick="App.v274SetCollectionPage(${state.page+1})">Next →</button></div>`;}
function v274AdvancedFiltersHtml(){const f=V274_UI.filters;const range=(title,minKey,maxKey,placeholderA,placeholderB)=>`<details class="mf274-advanced-filter"><summary>${title}</summary><div class="mf274-range-row"><input type="number" placeholder="${placeholderA}" value="${escapeHtml(String(f[minKey]||''))}" onchange="App.v274SetCollectionFilter('${minKey}',this.value)"><span>to</span><input type="number" placeholder="${placeholderB}" value="${escapeHtml(String(f[maxKey]||''))}" onchange="App.v274SetCollectionFilter('${maxKey}',this.value)"></div></details>`;return `<div class="mf274-advanced-grid">${range('Year','yearMin','yearMax','1900','2030')}${range('Running time (min)','runtimeMin','runtimeMax','0','200')}${range('Season count','seasonMin','seasonMax','0','50')}${range('Episode count','episodeMin','episodeMax','0','2000')}<details class="mf274-advanced-filter"><summary>Limit items</summary><div class="mf274-preset-row">${[5,10,100,500,1000,10000].map(n=>`<button class="btn btn-sm ${Number(f.limit)===n?'btn-primary':''}" onclick="App.v274SetCollectionFilter('limit','${n}')">${n>=1000?(n/1000)+'k':n}</button>`).join('')}<button class="btn btn-sm ${!Number(f.limit)?'btn-primary':''}" onclick="App.v274SetCollectionFilter('limit','0')">All</button></div></details><details class="mf274-advanced-filter"><summary>Moderator filters</summary><select onchange="App.v274SetCollectionFilter('moderator',this.value)"><option value="all" ${f.moderator==='all'?'selected':''}>All titles</option><option value="imported" ${f.moderator==='imported'?'selected':''}>Imported only</option><option value="manual" ${f.moderator==='manual'?'selected':''}>Manual only</option><option value="service" ${f.moderator==='service'?'selected':''}>Has media-service ID</option></select></details></div>`;}
function v274CollectionOverlayToggleButton(key,label,icon){const cfg=typeof v254EnsureCoverOverlaySettings==='function'?v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS):{status:true,category:true,rating:true,progress:true};const on=!!cfg[key];return `<button type="button" class="btn btn-sm v254-cover-overlay-toggle ${on?'active':''}" data-v225-icon="${escapeHtml(icon)}" aria-pressed="${on?'true':'false'}" title="${on?'Hide':'Show'} ${escapeHtml(label.toLowerCase())} on Collection covers" onclick="App.v254ToggleCoverOverlay('${escapeHtml(key)}')">${escapeHtml(label)} <span class="v254-cover-overlay-state">${on?'ON':'OFF'}</span></button>`;}
function v274CollectionOverlayControlsHtml(mode){if(mode!=='covers'&&mode!=='covers-title')return '';return `<div class="v254-cover-overlay-controls mf274-cover-overlay-controls" aria-label="Collection cover information visibility"><div class="v254-cover-overlay-label"><b>On cover</b><span>Choose what appears over Collection Covers and Covers+Titles.</span></div><div class="v254-cover-overlay-actions">${v274CollectionOverlayToggleButton('status','Status','watching')}${v274CollectionOverlayToggleButton('category','Category','category')}${v274CollectionOverlayToggleButton('rating','Rating','rating')}${v274CollectionOverlayToggleButton('progress','Progress','progressBar')}</div></div>`;}
function v274CollectionToolsHtml(c){
  const f=V274_UI.filters,cats=(S.categories||[]).filter(c=>c?.id),catLabel=f.categories.length?`${f.categories.length} categories selected`:'All categories',mode=v274EnsureSettings().detailView;
  return `<div class="mf274-collection-tools card">
    <div class="mf274-tools-head"><div><span class="section-label">COLLECTION TOOLS</span><p>Library-style browsing, filters, display modes and cover overlays for this collection.</p></div><button class="btn btn-sm btn-ghost" onclick="App.v274ToggleCollectionTools()">Hide tools</button></div>
    <div class="mf274-tools-grid"><input type="search" placeholder="Search titles…" value="${escapeHtml(f.search)}" oninput="App.v274SetCollectionFilter('search',this.value)"><details class="v66-cat-filter"><summary class="btn">${escapeHtml(catLabel)} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274ClearCollectionCategories(event)">All</button></div>${cats.map(cat=>`<label class="v66-cat-option"><input type="checkbox" ${f.categories.includes(String(cat.id))?'checked':''} onchange="App.v274ToggleCollectionCategory('${escapeHtml(String(cat.id))}',this.checked)"><span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span></label>`).join('')}</div></details><select onchange="App.v274SetCollectionFilter('status',this.value)"><option value="all" ${f.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${f.status===x?'selected':''}>${escapeHtml(v274StatusLabel(x))}</option>`).join('')}</select><select onchange="App.v274SetCollectionFilter('priority',this.value)"><option value="all" ${f.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${f.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select><select onchange="App.v274SetCollectionFilter('rating',this.value)"><option value="all" ${f.rating==='all'?'selected':''}>All ratings</option><option value="rated" ${f.rating==='rated'?'selected':''}>Rated only</option><option value="unrated" ${f.rating==='unrated'?'selected':''}>Unrated</option>${[9,8,7,6,5].map(n=>`<option value="${n}+" ${f.rating===n+'+'?'selected':''}>${n}+ rating</option>`).join('')}</select><select onchange="App.v274SetCollectionFilter('cover',this.value)"><option value="all" ${f.cover==='all'?'selected':''}>All covers</option><option value="has" ${f.cover==='has'?'selected':''}>Has cover</option><option value="missing" ${f.cover==='missing'?'selected':''}>Missing cover</option></select><select onchange="App.v274SetCollectionFilter('sort',this.value)"><option value="order" ${f.sort==='order'?'selected':''}>Collection order</option><option value="title" ${f.sort==='title'?'selected':''}>Alphabetic</option><option value="priority" ${f.sort==='priority'?'selected':''}>Priority</option><option value="rating" ${f.sort==='rating'?'selected':''}>Rating</option><option value="progress" ${f.sort==='progress'?'selected':''}>Progress</option><option value="total" ${f.sort==='total'?'selected':''}>Total</option><option value="year" ${f.sort==='year'?'selected':''}>Year</option></select><button type="button" class="btn btn-sm" onclick="App.v274ToggleCollectionFilterDir()">${f.dir==='asc'?'ASC ↑':'DESC ↓'}</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274ClearCollectionFilters()">Clear filters</button></div>
    <div class="mf274-display-row"><span>Display</span>${[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-title','Covers+Titles']].map(([id,label])=>`<button class="btn btn-sm ${mode===id?'btn-primary':''}" onclick="App.v274SetDetailView('${id}')">${label}</button>`).join('')}<label class="mf274-page-size">Titles/page <select onchange="App.v274SetCollectionPageSize(this.value)">${[25,50,100,200].map(n=>`<option value="${n}" ${v274EnsureSettings().pageSize===n?'selected':''}>${n}</option>`).join('')}</select></label></div>
    ${v274AdvancedFiltersHtml()}
    ${v274CollectionOverlayControlsHtml(mode)}
  </div>`;
}

/* ---------- Collection title renderers ------------------------------- */
function v274TitleCover(item,click=true){const url=v274CoverUrl(item),cat=v274Cat(item),handler=click?`onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')"`:'';return url?`<button type="button" class="mf274-title-cover" ${handler}><img src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="mf274-title-cover-fallback" style="display:none;--mf274-cat:${escapeHtml(cat?.color||'var(--flow)')}">${cat?v144CategoryIconHtml(cat):'◇'}</span></button>`:`<button type="button" class="mf274-title-cover fallback" ${handler} style="--mf274-cat:${escapeHtml(cat?.color||'var(--flow)')}">${cat?v144CategoryIconHtml(cat):'◇'}</button>`;}
function v274TitleMeta(item){const cat=v274Cat(item),rating=v274Num(item.rating,0),progress=item.total!=null?`${v274Num(item.progress,0)}/${v274Num(item.total,0)}`:(v274Num(item.progress,0)?String(item.progress):'—');return `<span>${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')}</span><span>${escapeHtml(v274StatusLabel(item.status))}</span><span>${escapeHtml(String(item.priority||'medium'))} priority</span>${rating>0?`<span>★ ${rating.toFixed(Number.isInteger(rating)?0:1)}</span>`:''}<span>${escapeHtml(progress)}</span>`;}
function v274CollectionItemHtml(c,item,mode){
  if(mode==='covers'||mode==='covers-title'){
    const overlay=typeof v254OverlayHtml==='function'?v254OverlayHtml(item):'';
    return `<article class="mf274-collection-tile ${mode} v254-cover-overlay-host" data-library-id="${escapeHtml(String(item.id))}">${v274TitleCover(item)}${overlay}${mode==='covers-title'?`<button type="button" class="mf274-tile-title" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button>`:''}<button type="button" class="mf274-remove-chip" title="Remove from collection" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">×</button></article>`;
  }
  if(mode==='cards')return `<article class="mf274-collection-title-card">${v274TitleCover(item)}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${v274TitleMeta(item)}</div></div><button class="btn btn-sm btn-ghost" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">Remove</button></article>`;
  if(mode==='compact')return `<article class="mf274-collection-compact">${v274TitleCover(item)}<button class="mf274-title-link" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${v274TitleMeta(item)}</div><button class="btn btn-sm btn-ghost" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">Remove</button></article>`;
  return `<article class="mf274-collection-list-row">${v274TitleCover(item)}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${v274TitleMeta(item)}</div>${item.year?`<small>${escapeHtml(String(item.year))}</small>`:''}</div><div class="mf274-row-actions"><button class="btn btn-sm" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">Details</button><button class="btn btn-sm btn-ghost" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">Remove</button></div></article>`;
}
function v274OrderRowsHtml(c){const items=v274CollectionItems(c);if(!items.length)return '<div class="empty-state">Add titles before ordering this collection.</div>';return `<div class="mf274-order-list">${items.map((item,index)=>`<article class="mf274-order-row" draggable="true" data-collection-id="${escapeHtml(c.id)}" data-title-id="${escapeHtml(String(item.id))}" ondragstart="App.v274OrderDragStart(event,'${escapeHtml(String(item.id))}')" ondragover="event.preventDefault()" ondrop="App.v274OrderDrop(event,'${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')"><span class="mf274-order-pos">${index+1}</span><span class="mf274-grip">⋮⋮</span>${v274TitleCover(item)}<button class="mf274-title-link" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-order-actions"><button class="btn btn-sm" ${index===0?'disabled':''} onclick="App.v274MoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}',-1)">↑</button><button class="btn btn-sm" ${index===items.length-1?'disabled':''} onclick="App.v274MoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}',1)">↓</button><button class="btn btn-sm btn-ghost" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">Remove</button></div></article>`).join('')}</div>`;}

/* ---------- Collection detail page ---------------------------------- */
function v274CollectionDetailHtml(c){
  const bg=v274CollectionBackground(c),p=v274CollectionProgress(c),settings=v274EnsureSettings(),pageState=v274CollectionPageState(c),rows=pageState.rows,shown=pageState.shown,mode=settings.detailView;
  const content=V274_UI.orderView?v274OrderRowsHtml(c):(shown.length?`<div class="mf274-collection-items mode-${mode}">${shown.map(i=>v274CollectionItemHtml(c,i,mode)).join('')}</div>${v274CollectionPagerHtml(pageState)}`:'<div class="empty-state card">No titles match the current Collection Tools filters.</div>');
  return `<div class="mf274-page mf274-collection-detail">
    <section class="mf274-collection-hero ${bg?'has-bg':''}" ${bg?`style="--mf274-bg:url('${escapeHtml(bg.replace(/'/g,'%27'))}')"`:''}>
      <div class="mf274-hero-shade"></div><div class="mf274-hero-content">${v274CollectionCoverHtml(c,'mf274-detail-cover')}<div class="mf274-hero-copy"><span class="mf274-kicker">COLLECTION</span><h1>${escapeHtml(c.title)}</h1><p>${escapeHtml(c.description||'No description yet.')}</p>${v274CollectionProgressHtml(c)}<div class="mf274-collection-stats"><span>${c.titleIds.length} titles</span><span>${p.pct}% progress</span><span>${c.autoBackground?'Automatic background':'Static background'}</span></div></div><div class="mf274-hero-actions"><button class="btn btn-sm btn-ghost" onclick="App.v274BackToCollections()">← Collections</button><button class="btn btn-sm" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit collection</button><button class="btn btn-sm btn-primary" onclick="App.v274OpenAddTitles('${escapeHtml(c.id)}')">+ Add titles</button><button class="btn btn-sm ${V274_UI.orderView?'btn-primary':''}" onclick="App.v274ToggleOrderView()">Order view ${V274_UI.orderView?'ON':'OFF'}</button></div></div>
    </section>
    <div class="mf274-tools-toggle-row">${settings.toolsVisible?'':`<button class="btn btn-sm" onclick="App.v274ToggleCollectionTools()">Show Collection Tools</button>`}<span class="hint">${rows.length.toLocaleString()} visible of ${c.titleIds.length.toLocaleString()} titles</span></div>
    ${settings.toolsVisible&&!V274_UI.orderView?v274CollectionToolsHtml(c):''}
    ${V274_UI.orderView?'<div class="mf274-order-note card"><b>Order view</b><span>Drag titles or use ↑/↓. Turning Order view off keeps this manual order as the collection’s default order.</span></div>':''}
    ${content}
  </div>`;
}
function v274RenderCollectionsPage(){v274EnsureCollections();const id=String(V274_UI.activeId||'');const c=id?v274CollectionById(id):null;return c?v274CollectionDetailHtml(c):v274CollectionsBrowserHtml();}
MediaFlowRuntime.registerPageRenderer('collections',v274RenderCollectionsPage);
let V274_BG_TIMER=0;
function v274RefreshAutoBackground(){if(String(S.view||'')!=='collections'||!V274_UI.activeId)return;const c=v274CollectionById(V274_UI.activeId),hero=document.querySelector('.mf274-collection-hero');if(!c?.autoBackground||!hero)return;const bg=v274CollectionBackground(c);if(!bg)return;const safe=String(bg).replace(/[\"\n\r]/g,m=>encodeURIComponent(m));hero.style.setProperty('--mf274-bg',`url("${safe}")`);hero.classList.add('has-bg');}
function v274EnsureBackgroundRotation(){if(V274_BG_TIMER)return;V274_BG_TIMER=setInterval(()=>{try{v274RefreshAutoBackground();}catch(_){ }},30000);}
MediaFlowRuntime.registerPageEnhancer('collections',()=>{v274EnsureBackgroundRotation();requestAnimationFrame(()=>{try{v274RefreshAutoBackground();}catch(_){ }});});

/* ---------- Collection CRUD overlays -------------------------------- */
function v274CloseOverlay(id){document.getElementById(id)?.remove();}
function v274CollectionFormHtml(c){const editing=!!c;return `<div class="modal-overlay mf274-overlay" id="mf274-collection-editor" onclick="if(event.target===this)App.v274CloseOverlay('mf274-collection-editor')"><div class="modal mf274-editor" role="dialog" aria-modal="true"><div class="modal-title">${editing?'Edit collection':'Add collection'}</div><div class="field"><label class="field-label">Title</label><input id="mf274-col-title" type="text" value="${escapeHtml(c?.title||'')}" placeholder="Collection title"></div><div class="field"><label class="field-label">Cover URL <span class="hint">optional</span></label><input id="mf274-col-cover" type="url" value="${escapeHtml(c?.coverUrl||'')}" placeholder="https://…"></div><div class="field"><label class="field-label">Description</label><textarea id="mf274-col-desc" rows="5" placeholder="What is this collection for?">${escapeHtml(c?.description||'')}</textarea></div><label class="mf274-check"><input id="mf274-col-bg" type="checkbox" ${c?.autoBackground!==false?'checked':''}><span>Automatic background from title covers</span></label><div class="modal-actions"><button class="btn btn-ghost" onclick="App.v274CloseOverlay('mf274-collection-editor')">Cancel</button>${editing?`<button class="btn btn-danger" onclick="App.v274DeleteCollection('${escapeHtml(c.id)}')">Delete collection</button>`:''}<button class="btn btn-primary" onclick="App.v274SaveCollection('${editing?escapeHtml(c.id):''}')">${editing?'Save changes':'Create collection'}</button></div></div></div>`;}
function v274CreateCollection(){v274CloseOverlay('mf274-collection-editor');document.body.insertAdjacentHTML('beforeend',v274CollectionFormHtml(null));}
function v274EditCollection(id){const c=v274CollectionById(id);if(!c)return;v274CloseOverlay('mf274-collection-editor');document.body.insertAdjacentHTML('beforeend',v274CollectionFormHtml(c));}
async function v274SaveCollection(id){const title=v274Text(document.getElementById('mf274-col-title')?.value);if(!title){showToast('Give the collection a title.');return;}const now=v274Now();let c=id?v274CollectionById(id):null;if(!c){c=v274NormalizeCollection({id:v274Id(),title,createdAt:now,updatedAt:now,titleIds:[]});S.collections.push(c);}c.title=title;c.coverUrl=v274Text(document.getElementById('mf274-col-cover')?.value);c.description=String(document.getElementById('mf274-col-desc')?.value||'');c.autoBackground=!!document.getElementById('mf274-col-bg')?.checked;v274TouchCollection(c);await saveState();v274CloseOverlay('mf274-collection-editor');V274_UI.activeId=c.id;render();showToast(id?'Collection updated ✓':'Collection created ✓');}
async function v274DeleteCollection(id){const c=v274CollectionById(id);if(!c)return;if(!confirm(`Delete collection “${c.title}”? Titles stay in your Library.`))return;S.collections=S.collections.filter(x=>x.id!==c.id);S.collectionTombstones=S.collectionTombstones||[];S.collectionTombstones.push({id:c.id,deletedAt:v274Now()});await saveState();V274_UI.activeId='';v274CloseOverlay('mf274-collection-editor');render();showToast('Collection deleted');}
async function v274OpenCollection(id){const c=v274CollectionById(id);if(!c)return;c.lastViewedAt=v274Now();c.updatedAt=Math.max(c.updatedAt,c.lastViewedAt);V274_UI.activeId=c.id;V274_UI.orderView=false;V274_UI.detailPage=0;v274ResetCollectionFilters();await saveState();render();try{window.scrollTo({top:0,behavior:'smooth'});}catch(_){window.scrollTo(0,0);}}
function v274BackToCollections(){V274_UI.activeId='';V274_UI.orderView=false;render();}
function v274ToggleOrderView(){V274_UI.orderView=!V274_UI.orderView;render();}
function v274OpenTitle(id){try{if(typeof App.v181OpenTitleDetails==='function')return App.v181OpenTitleDetails(id);if(typeof App.openLibraryModal==='function')return App.openLibraryModal(id);}catch(_){ }}

/* ---------- Add Titles modal ---------------------------------------- */
function v274AddState(){const s=V274_UI.add;if(!(s.picks instanceof Set))s.picks=new Set();return s;}
function v274AddCandidates(c){const s=v274AddState(),existing=new Set(c.titleIds.map(String)),q=s.search.trim().toLowerCase();let rows=(S.library||[]).filter(i=>i?.id&&!existing.has(String(i.id)));if(q)rows=rows.filter(i=>[v274SafeTitle(i),v274Cat(i)?.name||'',i.status||'',i.priority||'',i.year||'',...(i.tags||[])].join(' ').toLowerCase().includes(q));if(s.categories.length)rows=rows.filter(i=>s.categories.includes(String(i.categoryId||'')));if(s.status!=='all')rows=rows.filter(i=>String(i.status||'planned')===s.status);if(s.priority!=='all')rows=rows.filter(i=>String(i.priority||'medium')===s.priority);if(s.rating!=='all')rows=rows.filter(i=>v274RatingMatch(i,s.rating));const rank={low:0,medium:1,high:2},num=x=>v274Num(x,0),titleCmp=(a,b)=>v274SafeTitle(a).localeCompare(v274SafeTitle(b),undefined,{numeric:true,sensitivity:'base'}),dir=s.dir==='desc'?-1:1;rows=rows.slice().sort((a,b)=>{let d=0;if(s.sort==='title')d=titleCmp(a,b);else if(s.sort==='priority')d=(rank[String(a.priority||'medium')]??1)-(rank[String(b.priority||'medium')]??1);else if(s.sort==='rating')d=num(a.rating)-num(b.rating);else if(s.sort==='progress')d=num(a.progress)-num(b.progress);else if(s.sort==='total')d=num(a.total)-num(b.total);return (d||titleCmp(a,b))*dir;});return rows;}
function v274AddModalBody(c){const s=v274AddState(),rows=v274AddCandidates(c),pageSize=24,pages=Math.max(1,Math.ceil(rows.length/pageSize));s.page=Math.max(0,Math.min(s.page,pages-1));const shown=rows.slice(s.page*pageSize,(s.page+1)*pageSize),cats=(S.categories||[]).filter(x=>x?.id),catLabel=s.categories.length?`${s.categories.length} categories selected`:'All categories';return `<div class="mf274-add-tools"><input type="search" placeholder="Search your Library…" value="${escapeHtml(s.search)}" oninput="App.v274AddFilter('search',this.value)"><details class="v66-cat-filter"><summary class="btn">${escapeHtml(catLabel)} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button class="btn btn-sm btn-ghost" onclick="App.v274AddClearCategories(event)">All</button></div>${cats.map(cat=>`<label class="v66-cat-option"><input type="checkbox" ${s.categories.includes(String(cat.id))?'checked':''} onchange="App.v274AddToggleCategory('${escapeHtml(String(cat.id))}',this.checked)"><span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span></label>`).join('')}</div></details><select onchange="App.v274AddFilter('status',this.value)"><option value="all" ${s.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${s.status===x?'selected':''}>${escapeHtml(v274StatusLabel(x))}</option>`).join('')}</select><select onchange="App.v274AddFilter('priority',this.value)"><option value="all" ${s.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${s.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select><select onchange="App.v274AddFilter('rating',this.value)"><option value="all" ${s.rating==='all'?'selected':''}>All ratings</option><option value="rated" ${s.rating==='rated'?'selected':''}>Rated only</option><option value="unrated" ${s.rating==='unrated'?'selected':''}>Unrated</option>${[9,8,7,6,5].map(n=>`<option value="${n}+" ${s.rating===n+'+'?'selected':''}>${n}+ rating</option>`).join('')}</select><select onchange="App.v274AddFilter('sort',this.value)"><option value="title" ${s.sort==='title'?'selected':''}>Alphabetic</option><option value="priority" ${s.sort==='priority'?'selected':''}>Priority</option><option value="rating" ${s.sort==='rating'?'selected':''}>Rating</option><option value="progress" ${s.sort==='progress'?'selected':''}>Progress</option><option value="total" ${s.sort==='total'?'selected':''}>Total</option></select><button class="btn btn-sm" onclick="App.v274AddToggleDir()">${s.dir==='asc'?'ASC ↑':'DESC ↓'}</button></div><div class="mf274-add-results">${shown.length?shown.map(item=>{const cat=v274Cat(item),id=String(item.id),checked=s.picks.has(id);return `<label class="mf274-add-row"><input type="checkbox" ${checked?'checked':''} onchange="App.v274AddPick('${escapeHtml(id)}',this.checked)">${v274TitleCover(item,false)}<span><b>${escapeHtml(v274SafeTitle(item))}</b><small>${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')} · ${escapeHtml(v274StatusLabel(item.status))} · ${escapeHtml(String(item.priority||'medium'))}${Number(item.rating)>0?` · ★ ${Number(item.rating).toFixed(1)}`:''}</small></span></label>`;}).join(''):'<div class="empty-state">No Library titles match.</div>'}</div><div class="mf274-add-footer"><div class="mf274-add-select-actions"><button class="btn btn-sm btn-ghost" ${shown.length?'':'disabled'} onclick="App.v274AddSelectVisible()">Select visible</button><button class="btn btn-sm btn-ghost" ${s.picks.size?'':'disabled'} onclick="App.v274AddDeselectAll()">Deselect all</button><span class="hint">${s.picks.size} selected · ${rows.length.toLocaleString()} matches</span></div><div class="mf274-add-pager"><button class="btn btn-sm" ${s.page===0?'disabled':''} onclick="App.v274AddPage(${s.page-1})">← Prev</button><span>Page ${s.page+1}/${pages}</span><button class="btn btn-sm" ${s.page>=pages-1?'disabled':''} onclick="App.v274AddPage(${s.page+1})">Next →</button></div></div>`;}
function v274OpenAddTitles(id){const c=v274CollectionById(id);if(!c)return;V274_UI.add={search:'',categories:[],status:'all',priority:'all',rating:'all',sort:'title',dir:'asc',page:0,picks:new Set()};v274CloseOverlay('mf274-add-titles');document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay mf274-overlay" id="mf274-add-titles" onclick="if(event.target===this)App.v274CloseOverlay('mf274-add-titles')"><div class="modal mf274-add-modal"><div class="mf274-add-head"><div><div class="modal-title">Add titles</div><p class="hint">Browse your full Library using the same core filters as logging, then add multiple titles at once.</p></div><button class="btn btn-sm btn-ghost" onclick="App.v274CloseOverlay('mf274-add-titles')">Close</button></div><div id="mf274-add-body">${v274AddModalBody(c)}</div><div class="modal-actions"><button class="btn btn-ghost" onclick="App.v274CloseOverlay('mf274-add-titles')">Cancel</button><button class="btn btn-primary" id="mf274-add-confirm" ${V274_UI.add.picks.size?'':'disabled'} onclick="App.v274CommitAddTitles('${escapeHtml(c.id)}')">Add selected</button></div></div></div>`);}
function v274RefreshAddModal(){const c=v274CollectionById(V274_UI.activeId);const body=document.getElementById('mf274-add-body');if(c&&body)body.innerHTML=v274AddModalBody(c);const b=document.getElementById('mf274-add-confirm');if(b)b.disabled=!v274AddState().picks.size;}
function v274AddFilter(key,value){const s=v274AddState();if(!(key in s))return;s[key]=String(value??'');s.page=0;v274RefreshAddModal();}
function v274AddToggleCategory(id,on){const s=v274AddState(),set=new Set(s.categories);on?set.add(String(id)):set.delete(String(id));s.categories=[...set];s.page=0;v274RefreshAddModal();}
function v274AddClearCategories(event){event?.preventDefault?.();event?.stopPropagation?.();const s=v274AddState();s.categories=[];s.page=0;v274RefreshAddModal();}
function v274AddToggleDir(){const s=v274AddState();s.dir=s.dir==='asc'?'desc':'asc';s.page=0;v274RefreshAddModal();}
function v274AddPick(id,on){const s=v274AddState();on?s.picks.add(String(id)):s.picks.delete(String(id));v274RefreshAddModal();}
function v274AddSelectVisible(){const c=v274CollectionById(V274_UI.activeId);if(!c)return;const s=v274AddState(),rows=v274AddCandidates(c).slice(s.page*24,(s.page+1)*24);rows.forEach(i=>s.picks.add(String(i.id)));v274RefreshAddModal();}
function v274AddDeselectAll(){v274AddState().picks.clear();v274RefreshAddModal();}
function v274AddPage(page){v274AddState().page=Math.max(0,Math.floor(Number(page)||0));v274RefreshAddModal();}
async function v274CommitAddTitles(id){const c=v274CollectionById(id),picks=v274AddState().picks;if(!c||!picks.size)return;const set=new Set(c.titleIds.map(String));for(const item of S.library||[]){const sid=String(item?.id||'');if(sid&&picks.has(sid)&&!set.has(sid)){c.titleIds.push(sid);set.add(sid);}}c.order=c.titleIds.slice();v274TouchCollection(c);await saveState();v274CloseOverlay('mf274-add-titles');render();showToast('Titles added to collection ✓');}

/* ---------- Ordering/removal ----------------------------------------- */
let V274_DRAG_ID='';
function v274OrderDragStart(event,id){V274_DRAG_ID=String(id||'');event?.dataTransfer?.setData?.('text/plain',V274_DRAG_ID);if(event?.dataTransfer)event.dataTransfer.effectAllowed='move';}
async function v274OrderDrop(event,collectionId,targetId){event?.preventDefault?.();const source=V274_DRAG_ID||event?.dataTransfer?.getData?.('text/plain');V274_DRAG_ID='';if(!source||source===String(targetId))return;const c=v274CollectionById(collectionId);if(!c)return;const ids=c.titleIds.slice(),from=ids.indexOf(String(source)),to=ids.indexOf(String(targetId));if(from<0||to<0)return;ids.splice(from,1);ids.splice(to,0,String(source));c.titleIds=ids;c.order=ids.slice();v274TouchCollection(c);await saveState();render();}
async function v274MoveTitle(collectionId,titleId,delta){const c=v274CollectionById(collectionId);if(!c)return;const ids=c.titleIds.slice(),i=ids.indexOf(String(titleId)),j=Math.max(0,Math.min(ids.length-1,i+(Number(delta)||0)));if(i<0||i===j)return;const [x]=ids.splice(i,1);ids.splice(j,0,x);c.titleIds=ids;c.order=ids.slice();v274TouchCollection(c);await saveState();render();}
async function v274RemoveTitle(collectionId,titleId){const c=v274CollectionById(collectionId);if(!c)return;c.titleIds=c.titleIds.filter(id=>String(id)!==String(titleId));c.order=c.titleIds.slice();v274TouchCollection(c);await saveState();render();showToast('Removed from collection');}

/* ---------- Library rating filter ----------------------------------- */
function v274LibraryRatingMode(){S.histFilters=S.histFilters||{};const v=String(S.histFilters.libRating||'all');return ['all','rated','unrated','9+','8+','7+','6+','5+'].includes(v)?v:'all';}
function v274FilterByRating(rows){const mode=v274LibraryRatingMode();return mode==='all'?rows:(rows||[]).filter(i=>v274RatingMatch(i,mode));}
const v274FilteredLibraryBase=v53FilteredLibrary;
v53FilteredLibrary=function(){return v274FilterByRating(v274FilteredLibraryBase.apply(this,arguments));};
const v274DynamicRowsBase=v181DynamicRows;
v181DynamicRows=function(){return v274FilterByRating(v274DynamicRowsBase.apply(this,arguments));};
function v274SetLibraryRatingFilter(value){S.histFilters=S.histFilters||{};S.histFilters.libRating=String(value||'all');S.libPage=0;try{v53InvalidateLibraryCache();}catch(_){ }render();}
function v274LibraryRatingFilterHtml(){const m=v274LibraryRatingMode();return `<select class="mf274-library-rating-filter" onchange="App.v274SetLibraryRatingFilter(this.value)" aria-label="Filter Library by rating"><option value="all" ${m==='all'?'selected':''}>All ratings</option><option value="rated" ${m==='rated'?'selected':''}>Rated only</option><option value="unrated" ${m==='unrated'?'selected':''}>Unrated</option>${[9,8,7,6,5].map(n=>`<option value="${n}+" ${m===n+'+'?'selected':''}>${n}+ rating</option>`).join('')}</select>`;}
const v274RenderLibraryBase=renderLibrary;
renderLibrary=function(){let h=v274RenderLibraryBase.apply(this,arguments);if(!h.includes('mf274-library-rating-filter')){h=h.replace(/(<select class="v224-cover-filter"[\s\S]*?<\/select>)/,`$1${v274LibraryRatingFilterHtml()}`);if(!h.includes('mf274-library-rating-filter'))h=h.replace(/(<input[^>]+class="[^"]*lib-search[^"]*"[^>]*>)/,`$1${v274LibraryRatingFilterHtml()}`);}return h;};

/* ---------- Personal Order layout ------------------------------------ */
function v274OrderLayout(){return v274EnsureSettings();}
function v274SetOrderLayout(key,value){const s=v274OrderLayout();if(key==='orderPanelWidth')s.orderPanelWidth=Math.max(280,Math.min(620,Math.round(Number(value)||370)));else if(key==='orderCategoryWidth')s.orderCategoryWidth=Math.max(420,Math.min(1200,Math.round(Number(value)||760)));else return;s.modifiedAt=v274Now();persistSettings();v274ApplyOrderLayoutVars();}
function v274ApplyOrderLayoutVars(){const s=v274OrderLayout();document.documentElement.style.setProperty('--mf274-order-side-width',`${s.orderPanelWidth}px`);document.documentElement.style.setProperty('--mf274-order-category-width',`${s.orderCategoryWidth}px`);document.querySelector('[data-mf274-order-side-value]')?.replaceChildren(document.createTextNode(`${s.orderPanelWidth}px`));document.querySelector('[data-mf274-order-category-value]')?.replaceChildren(document.createTextNode(`${s.orderCategoryWidth}px`));}
function v274OrderLayoutControlsHtml(){const s=v274OrderLayout();return `<div class="mf274-order-layout card"><div><b>Layout widths</b><span>Resize Personal Order without changing its content.</span></div><label>Add Titles width <input type="range" min="280" max="620" step="10" value="${s.orderPanelWidth}" oninput="App.v274SetOrderLayout('orderPanelWidth',this.value)"><output data-mf274-order-side-value>${s.orderPanelWidth}px</output></label><label>Ordered categories width <input type="range" min="420" max="1200" step="20" value="${s.orderCategoryWidth}" oninput="App.v274SetOrderLayout('orderCategoryWidth',this.value)"><output data-mf274-order-category-value>${s.orderCategoryWidth}px</output></label></div>`;}
function v274OrderDeselectAll(){const ui=v140EnsureOrderPickerUI?.()||S.orderPlannerUI;if(ui?.picks instanceof Set)ui.picks.clear();try{v138RefreshPickerDOM();}catch(_){render();}}
const v274PickerHtmlBase=v138PickerHtml;
v138PickerHtml=function(){let h=v274PickerHtmlBase.apply(this,arguments);if(!h.includes('v274-order-deselect'))h=h.replace(/(<button id="v140-order-add-shown"[\s\S]*?<\/button>)/,`$1<button id="v274-order-deselect" class="btn btn-sm btn-ghost v274-order-deselect" type="button" onclick="App.v274OrderDeselectAll()">Deselect all</button>`);return h;};
const v274RenderOrderBase=renderOrder;
renderOrder=function(){let h=v274RenderOrderBase.apply(this,arguments);if(!h.includes('mf274-order-layout'))h=h.replace(/(<div class="v138-order-toolbar">[\s\S]*?<\/div>\s*<div class="v138-order-grid">)/,match=>match.replace('<div class="v138-order-grid">',`${v274OrderLayoutControlsHtml()}<div class="v138-order-grid">`));return h;};
MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(v274ApplyOrderLayoutVars));

/* ---------- Version-aware React topbar label ------------------------- */
const v274SignalReactBase=typeof v260SignalReact==='function'?v260SignalReact:null;
if(v274SignalReactBase){v260SignalReact=function(){const out=v274SignalReactBase.apply(this,arguments);const b=document.querySelector('.v260-topbar-copy b'),span=document.querySelector('.v260-topbar-copy span');if(String(S.view)==='collections'){if(b)b.textContent='Collections';if(span)span.textContent='Curated lists and focused mini libraries';}return out;};}

/* ---------- Public API / audit -------------------------------------- */
function v274AuditState(){let snap=null,backup=null,preset=null;try{snap=snapshot();}catch(_){ }try{backup=v148BuildFullBackup();}catch(_){ }try{preset=v196BuildSettingsPreset();}catch(_){ }return {version:274,collections:v274EnsureCollections().length,snapshotCollections:Array.isArray(snap?.collections),backupCollections:Array.isArray(backup?.collections),settingsPersisted:!!snap?.settings?.v274Collections,presetSettings:!!preset?.settings?.v274Collections,cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,fullBackupSchema:Number(backup?.backupSchemaVersion||backup?.backupManifest?.schemaVersion)||29,settingsPresetSchema:Number(preset?.schemaVersion||preset?.presetSchemaVersion)||1,personalOrderExportVersion:typeof v142OrderExportPayload==='function'?Number(v142OrderExportPayload()?.formatVersion)||4:4,pwaRelease:274};}
function v274VisibleNavIds(){try{return v161VisibleNavItems().map(x=>String(x.id));}catch(_){return [...document.querySelectorAll('.sidebar [data-view],.mobile-tabbar [data-view]')].map(x=>String(x.dataset.view||'')).filter(Boolean);}}
function v274TestCollectionVisibleCount(id){const c=v274CollectionById(id||V274_UI.activeId);return c?v274CollectionFilteredItems(c).length:0;}
function v274TestAddPickCount(){try{return v274AddState().picks.size;}catch(_){return 0;}}
function v274TestLibraryRatingCounts(){const prev=S.histFilters?.libRating;S.histFilters=S.histFilters||{};S.histFilters.libRating='all';if(typeof v53InvalidateLibraryFilterCache==='function')v53InvalidateLibraryFilterCache();const normalAll=v53FilteredLibrary('all','all','all','').length;S.histFilters.libRating='9+';if(typeof v53InvalidateLibraryFilterCache==='function')v53InvalidateLibraryFilterCache();const normalHigh=v53FilteredLibrary('all','all','all','').length;const cfg=typeof v181EnsureLibrarySettings==='function'?v181EnsureLibrarySettings(S.settings):null;if(cfg){cfg.activeCategoryId='anime';cfg.activeStatus='active';}S.histFilters.libRating='all';const dynAll=typeof v181DynamicRows==='function'?v181DynamicRows().length:0;S.histFilters.libRating='9+';const dynHigh=typeof v181DynamicRows==='function'?v181DynamicRows().length:0;S.histFilters.libRating=prev||'all';if(typeof v53InvalidateLibraryFilterCache==='function')v53InvalidateLibraryFilterCache();return {normalAll,normalHigh,dynAll,dynHigh};}
Object.assign(App,{v274SetBrowserView,v274SetDetailView,v274SetCollectionSearch,v274SetCollectionSort,v274ToggleCollectionSortDir,v274CreateCollection,v274EditCollection,v274SaveCollection,v274DeleteCollection,v274OpenCollection,v274BackToCollections,v274ToggleOrderView,v274OpenTitle,v274CloseOverlay,v274SetCollectionFilter,v274SetCollectionPage,v274SetCollectionPageSize,v274ToggleCollectionCategory,v274ClearCollectionCategories,v274ToggleCollectionFilterDir,v274ClearCollectionFilters,v274ToggleCollectionTools,v274OpenAddTitles,v274AddFilter,v274AddToggleCategory,v274AddClearCategories,v274AddToggleDir,v274AddPick,v274AddSelectVisible,v274AddDeselectAll,v274AddPage,v274CommitAddTitles,v274OrderDragStart,v274OrderDrop,v274MoveTitle,v274RemoveTitle,v274SetLibraryRatingFilter,v274SetOrderLayout,v274OrderDeselectAll,v274AuditState,v274VisibleNavIds,v274TestCollectionVisibleCount,v274TestAddPickCount,v274TestLibraryRatingCounts});
window.MediaFlowV274={version:274,focus:'Collections mini-Library, Library rating filters and adjustable Personal Order layout'};
MediaFlowRuntime.version=V274_RUNTIME_VERSION;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{v274EnsureCollections();v274ApplyOrderLayoutVars();},{once:true});else{v274EnsureCollections();v274ApplyOrderLayoutVars();}

/* ---------- v274 shared mini-Library bulk toolbar ------------------- */
function v274SelectedCollectionIds(c){const allowed=new Set((c?.titleIds||[]).map(String));return Object.entries(S.librarySelection||{}).filter(([id,on])=>on&&allowed.has(String(id))).map(([id])=>String(id));}
function v274SelectCollectionVisible(){const c=v274CollectionById(V274_UI.activeId);if(!c)return;S.librarySelection=S.librarySelection||{};for(const item of v274CollectionPageState(c).shown)S.librarySelection[String(item.id)]=true;render();}
function v274SelectCollectionAll(){const c=v274CollectionById(V274_UI.activeId);if(!c)return;S.librarySelection=S.librarySelection||{};for(const item of v274CollectionFilteredItems(c))S.librarySelection[String(item.id)]=true;render();}
function v274DeselectCollection(){S.librarySelection={};render();}
function v274PrepareCollectionSelection(c){const ids=new Set(v274SelectedCollectionIds(c));S.librarySelection={};for(const id of ids)S.librarySelection[id]=true;return [...ids];}
function v274BatchCollectionStatus(value){const c=v274CollectionById(V274_UI.activeId);if(!c||!v274PrepareCollectionSelection(c).length)return;return App.batchLibraryStatus?.(value);}
function v274BatchCollectionPriority(value){const c=v274CollectionById(V274_UI.activeId);if(!c||!v274PrepareCollectionSelection(c).length)return;return App.batchLibraryPriority?.(value);}
function v274BatchCollectionCategory(value){const c=v274CollectionById(V274_UI.activeId);if(!c||!v274PrepareCollectionSelection(c).length)return;return App.batchLibraryCategory?.(value);}
async function v274RemoveSelectedFromCollection(){const c=v274CollectionById(V274_UI.activeId);if(!c)return;const ids=new Set(v274SelectedCollectionIds(c));if(!ids.size)return;c.titleIds=c.titleIds.filter(id=>!ids.has(String(id)));c.order=c.titleIds.slice();v274TouchCollection(c);S.librarySelection={};await saveState();render();showToast('Selected titles removed from collection');}
function v274CollectionBatchBarHtml(c){const n=v274SelectedCollectionIds(c).length;return `<div class="mf-batchbar mf274-collection-batchbar"><div class="v189-batch-left"><button type="button" class="btn btn-sm" onclick="App.v274SelectCollectionVisible()">Select visible</button><button type="button" class="btn btn-sm" onclick="App.v274SelectCollectionAll()">Select all matching</button><button type="button" class="btn btn-sm" onclick="App.v274DeselectCollection()">Deselect all</button><button type="button" class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button></div><b>${n.toLocaleString()} selected</b><span class="spacer"></span><select style="width:auto" onchange="if(this.value){App.v274BatchCollectionStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><select style="width:auto" onchange="if(this.value){App.v274BatchCollectionPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select style="width:auto" onchange="if(this.value){App.v274BatchCollectionCategory(this.value);this.value=''}"><option value="">Move to category…</option>${(S.categories||[]).map(cat=>`<option value="${escapeHtml(String(cat.id))}">${escapeHtml(cat.name)}</option>`).join('')}</select><button type="button" class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.v274RemoveSelectedFromCollection()">Remove selected</button></div>`;}
const v274CollectionToolsHtmlBulkBase=v274CollectionToolsHtml;
v274CollectionToolsHtml=function(c){const h=v274CollectionToolsHtmlBulkBase.apply(this,arguments);return v274CollectionBatchBarHtml(c)+h;};
const v274CollectionItemHtmlSelectBase=v274CollectionItemHtml;
v274CollectionItemHtml=function(c,item,mode){let h=v274CollectionItemHtmlSelectBase.apply(this,arguments);const id=escapeHtml(String(item.id)),check=`<label class="mf274-select-title" title="Select title" onclick="event.stopPropagation()"><input type="checkbox" ${S.librarySelection?.[item.id]?'checked':''} onchange="event.stopPropagation();App.toggleLibrarySelect('${id}',this.checked)"></label>`;return h.replace(/(<article class="mf274-[^"]+"[^>]*>)/,`$1${check}`);};
const v274OpenCollectionSelectionBase=v274OpenCollection;
v274OpenCollection=async function(id){S.librarySelection={};return v274OpenCollectionSelectionBase.apply(this,arguments);};
Object.assign(App,{v274SelectCollectionVisible,v274SelectCollectionAll,v274DeselectCollection,v274BatchCollectionStatus,v274BatchCollectionPriority,v274BatchCollectionCategory,v274RemoveSelectedFromCollection,v274OpenCollection});
