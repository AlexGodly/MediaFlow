/* ============================================================
   MediaFlow v279 — Collections progress/background/performance polish
   ------------------------------------------------------------
   - Semantic Collection create/open icons + click-anywhere opening.
   - Typed Collection title pagination size.
   - Redesigned Collection/Title progress UI in every display mode.
   - Designed confirmations for removing Collection titles.
   - Dedicated Collections import/export.
   - Automatic or custom Collection backgrounds with richer hero artwork.
   - Cached Collection lookup/progress + debounced indexed Add Titles search.
   ============================================================ */
const V279_RUNTIME_VERSION=279;

/* ---------- semantic icons ----------------------------------------- */
Object.assign(V225_BUTTON_ICONS,{
  collectionAdd:v225IconSvg('<path d="M3 6h7l2 2h9v11H3Z"/><path d="M12 11v6M9 14h6"/>'),
  openCollection:v225IconSvg('<path d="M3 7h7l2 2h9l-2 10H5Z"/><path d="m12 12 3 3-3 3"/><path d="M8 15h7"/>')
});

/* ---------- collection model + fast lookup ------------------------ */
const v279NormalizeCollectionBase=v274NormalizeCollection;
v274NormalizeCollection=function(raw){
  const c=v279NormalizeCollectionBase.apply(this,arguments),src=raw&&typeof raw==='object'?raw:{};
  c.backgroundUrl=v274Text(src.backgroundUrl||c.backgroundUrl||'');
  const requested=String(src.backgroundMode||'').toLowerCase();
  c.backgroundMode=requested==='custom'&&c.backgroundUrl?'custom':'auto';
  c.autoBackground=c.backgroundMode==='auto';
  return c;
};
function v279CollectionByIdFast(id){
  if(!Array.isArray(S.collections))v274EnsureCollections();
  const sid=String(id||'');return (S.collections||[]).find(c=>String(c?.id||'')===sid)||null;
}
v274CollectionById=v279CollectionByIdFast;

const v279EnsureSettingsBase=v274EnsureSettings;
v274EnsureSettings=function(target=S.settings||DEFAULT_SETTINGS){
  const rawPage=Number(target?.v274Collections?.pageSize);const s=v279EnsureSettingsBase.apply(this,arguments);
  if(Number.isFinite(rawPage)&&rawPage>0)s.pageSize=Math.max(1,Math.min(1000,Math.round(rawPage)));
  return s;
};
v274EnsureSettings(DEFAULT_SETTINGS);v274EnsureSettings(S.settings||DEFAULT_SETTINGS);

const v279CollectionProgressBase=v274CollectionProgress;
const V279_PROGRESS_CACHE=new Map();
v274CollectionProgress=function(c){
  if(!c)return {pct:0,done:0,total:0,known:0,label:'0%'};
  const key=String(c.id||''),hit=V279_PROGRESS_CACHE.get(key),epoch=typeof V276_RENDER_EPOCH==='number'?V276_RENDER_EPOCH:0;
  if(hit&&hit.epoch===epoch&&hit.ids===c.titleIds&&hit.library===S.library)return hit.value;
  const value=v279CollectionProgressBase.apply(this,arguments);V279_PROGRESS_CACHE.set(key,{epoch,ids:c.titleIds,library:S.library,value});return value;
};
const v279CollectionCoverItemsBase=v274CollectionCoverItems;
const V279_COVER_CACHE=new Map();
v274CollectionCoverItems=function(c){
  if(!c)return [];const key=String(c.id||''),hit=V279_COVER_CACHE.get(key),epoch=typeof V276_RENDER_EPOCH==='number'?V276_RENDER_EPOCH:0;
  if(hit&&hit.epoch===epoch&&hit.ids===c.titleIds&&hit.library===S.library)return hit.value;
  const value=v279CollectionCoverItemsBase.apply(this,arguments);V279_COVER_CACHE.set(key,{epoch,ids:c.titleIds,library:S.library,value});return value;
};

/* ---------- progress presentation --------------------------------- */
function v279CollectionProgressHtml(c,context='browser'){
  const p=v274CollectionProgress(c),compact=context==='compact';
  return `<div class="mf279-collection-progress ${compact?'compact':''}" aria-label="${p.pct}% collection progress"><div class="mf279-progress-head"><b>${p.pct}%</b><span>${p.done.toLocaleString()} / ${p.total.toLocaleString()} titles completed</span></div><div class="mf279-progress-track"><span style="width:${p.pct}%"></span></div></div>`;
}
v274CollectionProgressHtml=function(c){return v279CollectionProgressHtml(c,'browser');};
function v279TitleProgressHtml(item,compact=false){
  const total=Math.max(0,v274Num(item?.total,0)),progress=Math.max(0,v274Num(item?.progress,0));
  const complete=String(item?.status||'')==='completed'||(total>0&&progress>=total);const pct=total>0?Math.max(0,Math.min(100,Math.round(progress/total*100))):(complete?100:0);
  const copy=total>0?`${Math.min(progress,total).toLocaleString()} / ${total.toLocaleString()}`:(complete?'Completed':(progress>0?`${progress.toLocaleString()} logged`:'Not started'));
  return `<div class="mf279-title-progress ${compact?'compact':''}" title="${escapeHtml(copy)}"><div class="mf279-title-progress-track"><span style="width:${pct}%"></span></div><small>${pct}% · ${escapeHtml(copy)}</small></div>`;
}

/* ---------- browser cards: click anywhere + progress everywhere --- */
function v279CollectionSurfaceAttrs(c,mode){const id=escapeHtml(String(c.id)),cls=mode==='compact'?'mf274-browser-compact':mode==='list'?'mf274-browser-list':mode==='cards'?'mf274-browser-card':'mf274-browser-showcase mf276-browser-showcase';return `class="${cls} mf279-open-surface" role="button" tabindex="0" onclick="App.v279OpenCollectionSurface(event,'${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.v274OpenCollection('${id}')}"`;}
function v279OpenCollectionSurface(event,id){
  if(event?.target?.closest?.('button,a,input,select,textarea,label,summary'))return;
  App.v274OpenCollection(id);
}
v274CollectionBrowserCard=function(c,mode){
  const cover=v274CollectionCoverHtml(c,'mf274-browser-cover'),desc=escapeHtml(c.description||'No description yet.'),p=v274CollectionProgress(c),id=escapeHtml(c.id);
  const open=`<button type="button" class="btn btn-sm" data-v225-icon="openCollection" onclick="App.v274OpenCollection('${id}')">Open</button>`;
  const edit=`<button type="button" class="btn btn-sm btn-ghost" data-v225-icon="edit" onclick="App.v274EditCollection('${id}')">Edit</button>`;
  if(mode==='covers')return `<button type="button" class="mf274-browser-cover-card mf279-browser-cover-card" onclick="App.v274OpenCollection('${id}')">${cover}<b>${escapeHtml(c.title)}</b>${v279CollectionProgressHtml(c,'compact')}<small>${c.titleIds.length.toLocaleString()} titles</small></button>`;
  if(mode==='compact')return `<article ${v279CollectionSurfaceAttrs(c,'compact')} data-mode="compact">${cover}<div class="mf274-browser-copy"><b>${escapeHtml(c.title)}</b><span>${desc}</span>${v279CollectionProgressHtml(c,'compact')}</div><span>${c.titleIds.length.toLocaleString()} titles</span><div class="mf274-browser-actions">${open}${edit}</div></article>`;
  if(mode==='list')return `<article ${v279CollectionSurfaceAttrs(c,'list')} data-mode="list">${cover}<div class="mf274-browser-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${id}')">${escapeHtml(c.title)}</button><p>${desc}</p>${v274CollectionStatsHtml(c)}${v279CollectionProgressHtml(c)}</div><div class="mf274-browser-actions">${open}${edit}</div></article>`;
  if(mode==='cards')return `<article ${v279CollectionSurfaceAttrs(c,'cards')} data-mode="cards">${cover}<div class="mf274-browser-card-copy"><span class="mf274-kicker">COLLECTION</span><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${id}')">${escapeHtml(c.title)}</button><p>${desc}</p>${v279CollectionProgressHtml(c)}${v274CollectionStatsHtml(c)}</div><div class="mf274-browser-actions">${open}${edit}</div></article>`;
  return `<article ${v279CollectionSurfaceAttrs(c,'showcase')} data-mode="showcase"><button type="button" class="mf274-showcase-cover mf276-showcase-cover" onclick="App.v274OpenCollection('${id}')">${v276ShowcaseCoverHtml(c)}</button><div class="mf274-showcase-copy"><div class="mf274-showcase-meta"><span>COLLECTION LIST</span><small>Created ${new Date(c.createdAt).toLocaleDateString()} · Updated ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${id}')">${escapeHtml(c.title)}</button><p>${desc}</p><div class="mf276-showcase-stats"><span>${c.titleIds.length.toLocaleString()} titles</span><span>${p.pct}% progress</span>${c.lastViewedAt?`<span>Viewed ${new Date(c.lastViewedAt).toLocaleDateString()}</span>`:''}</div>${v279CollectionProgressHtml(c,'compact')}</div><div class="mf274-browser-actions">${open}${edit}</div></article>`;
};

/* ---------- main Collections actions + import/export ---------------- */
const v279CollectionsBrowserBase=v274CollectionsBrowserHtml;
v274CollectionsBrowserHtml=function(){
  let h=v279CollectionsBrowserBase.apply(this,arguments);
  const replacement=`<div class="mf279-collections-head-actions"><button type="button" class="btn btn-sm" data-v225-icon="export" onclick="App.v279ExportCollections()">Export</button><button type="button" class="btn btn-sm" data-v225-icon="import" onclick="document.getElementById('mf279-collections-import-file')?.click()">Import</button><input id="mf279-collections-import-file" type="file" accept=".json,application/json" hidden onchange="App.v279ImportCollections(this.files?.[0]);this.value=''"><button type="button" class="btn btn-primary" data-v225-icon="collectionAdd" onclick="App.v274CreateCollection()">Add collection</button></div>`;
  h=h.replace(/<button type="button" class="btn btn-primary" onclick="App\.v274CreateCollection\(\)">\+ Add collection<\/button>/,replacement);
  h=h.replace(/<button class="btn btn-primary" style="margin-top:14px" onclick="App\.v274CreateCollection\(\)">Create your first collection<\/button>/,`<button class="btn btn-primary" data-v225-icon="collectionAdd" style="margin-top:14px" onclick="App.v274CreateCollection()">Create your first collection</button>`);
  return h;
};
function v279ExportCollections(){
  const payload={mediaflowCollectionsExportVersion:1,appVersion:279,exportedAt:new Date().toISOString(),collections:v274Clone(v274EnsureCollections(),[])};
  triggerDownload(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`MediaFlow_Collections_${new Date().toISOString().slice(0,10)}.json`);
  showToast(`${payload.collections.length.toLocaleString()} collections exported`);
}
let V279_PENDING_IMPORT=null;
async function v279ImportCollections(file){
  if(!file)return;let parsed;
  try{parsed=JSON.parse(await file.text());}catch(_){showToast('Could not read that Collections file.');return;}
  const rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.collections)?parsed.collections:null;
  if(!rows){showToast('That file does not contain MediaFlow Collections.');return;}
  const incoming=v274NormalizeCollections(rows);if(!incoming.length){showToast('No valid collections were found.');return;}
  const ok=await v279Confirm({title:`Import ${incoming.length.toLocaleString()} collection${incoming.length===1?'':'s'}?`,body:'Imported collections will merge with your current Collections. Matching IDs use the newer copy. Titles remain in your Library.',confirmLabel:'Import collections'});if(!ok)return;
  const byId=new Map(v274EnsureCollections().map(c=>[String(c.id),c]));const now=v274Now();
  for(const c of incoming){const prev=byId.get(String(c.id));c.updatedAt=Math.max(v274Num(c.updatedAt,0),now);if(!prev||v274Num(c.updatedAt)>=v274Num(prev.updatedAt))byId.set(String(c.id),c);}
  S.collections=[...byId.values()];const importedIds=new Set(incoming.map(c=>String(c.id)));S.collectionTombstones=(S.collectionTombstones||[]).filter(t=>!importedIds.has(String(t?.id||'')));
  await saveState();V274_UI.activeId='';render();showToast(`${incoming.length.toLocaleString()} collections imported ✓`);
}

/* ---------- designed confirmation --------------------------------- */
let V279_CONFIRM_RESOLVE=null;
function v279Confirm({title='Confirm',body='',confirmLabel='Confirm',danger=false}={}){
  v274CloseOverlay('mf279-confirm');if(V279_CONFIRM_RESOLVE){V279_CONFIRM_RESOLVE(false);V279_CONFIRM_RESOLVE=null;}
  return new Promise(resolve=>{V279_CONFIRM_RESOLVE=resolve;document.body.insertAdjacentHTML('beforeend',`<div class="modal-overlay mf274-overlay mf279-confirm-overlay" id="mf279-confirm" onclick="if(event.target===this)App.v279ResolveConfirm(false)"><div class="modal mf279-confirm" role="dialog" aria-modal="true"><div class="mf279-confirm-mark ${danger?'danger':''}">${danger?'!':'✓'}</div><div class="modal-title">${escapeHtml(title)}</div><p>${escapeHtml(body)}</p><div class="modal-actions"><button type="button" class="btn btn-ghost" data-v225-icon="cancel" onclick="App.v279ResolveConfirm(false)">Cancel</button><button type="button" class="btn ${danger?'btn-danger':'btn-primary'}" data-v225-icon="${danger?'delete':'confirm'}" onclick="App.v279ResolveConfirm(true)">${escapeHtml(confirmLabel)}</button></div></div></div>`);});
}
function v279ResolveConfirm(ok){const resolve=V279_CONFIRM_RESOLVE;V279_CONFIRM_RESOLVE=null;v274CloseOverlay('mf279-confirm');resolve?.(!!ok);}

/* ---------- typed per-page pagination ------------------------------ */
const v279CollectionToolsBase=v274CollectionToolsHtml;
v274CollectionToolsHtml=function(c){
  let h=v279CollectionToolsBase.apply(this,arguments),size=v274EnsureSettings().pageSize;
  h=h.replace(/<label class="mf274-page-size">Titles\/page <select[\s\S]*?<\/select><\/label>/,`<label class="mf274-page-size mf279-page-size">Titles/page <input type="number" min="1" max="1000" step="1" value="${size}" inputmode="numeric" onchange="App.v274SetCollectionPageSize(this.value)" onkeydown="if(event.key==='Enter')this.blur()" title="Type how many titles to show on each page"></label>`);
  return h;
};
v274SetCollectionPageSize=function(value){const settings=v274EnsureSettings();settings.pageSize=Math.max(1,Math.min(1000,Math.round(Number(value)||50)));settings.modifiedAt=v274Now();V274_UI.detailPage=0;persistSettings();render();};

/* ---------- title renderers: consistent progress in every mode ----- */
v274CollectionItemHtml=function(c,item,mode){
  const id=escapeHtml(String(item.id)),cid=escapeHtml(String(c.id)),clean=v276CollectionSettings().cleanCovers&&(mode==='covers'||mode==='covers-title');
  const check=clean?'':`<label class="mf274-select-title" title="Select title" onclick="event.stopPropagation()"><input type="checkbox" ${S.librarySelection?.[item.id]?'checked':''} onchange="event.stopPropagation();App.toggleLibrarySelect('${id}',this.checked)"></label>`;
  if(mode==='covers'||mode==='covers-title'){
    const overlay=typeof v254OverlayHtml==='function'?v254OverlayHtml(item):'';
    return `<article class="mf274-collection-tile ${mode} v254-cover-overlay-host" data-library-id="${id}">${check}${v274TitleCover(item)}${overlay}${mode==='covers-title'?`<button type="button" class="mf274-tile-title" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button>`:''}${v279TitleProgressHtml(item,true)}<button type="button" class="mf274-remove-chip" title="Remove from collection" onclick="App.v274RemoveTitle('${cid}','${id}')">×</button></article>`;
  }
  if(mode==='cards')return `<article class="mf274-collection-title-card">${check}${v274TitleCover(item)}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${v274TitleMeta(item)}</div>${v279TitleProgressHtml(item)}</div><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></article>`;
  if(mode==='compact')return `<article class="mf274-collection-compact">${check}${v274TitleCover(item)}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button>${v279TitleProgressHtml(item,true)}</div><div class="mf274-title-meta">${v274TitleMeta(item)}</div><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></article>`;
  return `<article class="mf274-collection-list-row">${check}${v274TitleCover(item)}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${v274TitleMeta(item)}</div>${item.year?`<small>${escapeHtml(String(item.year))}</small>`:''}${v279TitleProgressHtml(item)}</div><div class="mf274-row-actions"><button class="btn btn-sm" data-v225-icon="details" onclick="App.v274OpenTitle('${id}')">Details</button><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></div></article>`;
};

/* ---------- background modes + redesigned hero -------------------- */
function v279BackgroundUrls(c){
  if(c?.backgroundMode==='custom'&&v274Text(c.backgroundUrl))return [v274Text(c.backgroundUrl)];
  const covers=v274CollectionItems(c).map(v274CoverUrl).filter(Boolean);if(!covers.length)return [];
  const bucket=Math.floor(Date.now()/30000);let seed=bucket;for(const ch of String(c.id||''))seed=((seed*33)+ch.charCodeAt(0))>>>0;
  const out=[];for(let i=0;i<Math.min(3,covers.length);i++){const idx=(seed+i*Math.max(1,Math.floor(covers.length/3)))%covers.length;if(!out.includes(covers[idx]))out.push(covers[idx]);}
  for(const url of covers){if(out.length>=3)break;if(!out.includes(url))out.push(url);}return out;
}
function v279BgVar(url){return `url(&quot;${escapeHtml(String(url||'').replace(/\r|\n/g,''))}&quot;)`;}
function v279HeroBackgroundHtml(c){const urls=v279BackgroundUrls(c);if(!urls.length)return '<div class="mf279-hero-backdrop empty"></div>';const custom=c.backgroundMode==='custom';return `<div class="mf279-hero-backdrop ${custom?'custom':'automatic'}">${urls.map((u,i)=>`<span class="mf279-hero-bg-panel p${i+1}" style="--mf279-bg:${v279BgVar(u)}"></span>`).join('')}</div>`;}
function v279HeroProgressHtml(c){const p=v274CollectionProgress(c);return `<div class="mf279-hero-progress"><div class="mf279-hero-progress-copy"><span>COLLECTION PROGRESS</span><b>${p.pct}% complete</b><small>${p.done.toLocaleString()} of ${p.total.toLocaleString()} titles completed</small></div><div class="mf279-hero-progress-track"><span style="width:${p.pct}%"></span></div></div>`;}
v274CollectionDetailHtml=function(c){
  const p=v274CollectionProgress(c),settings=v274EnsureSettings(),pageState=v274CollectionPageState(c),rows=pageState.rows,shown=pageState.shown,mode=settings.detailView;
  const content=V274_UI.orderView?v274OrderRowsHtml(c):(shown.length?`<div class="mf274-collection-items mode-${mode}">${shown.map(i=>v274CollectionItemHtml(c,i,mode)).join('')}</div>${v274CollectionPagerHtml(pageState)}`:'<div class="empty-state card">No titles match the current Collection Tools filters.</div>');
  const bgLabel=c.backgroundMode==='custom'&&c.backgroundUrl?'Custom background':'Automatic background';
  return `<div class="mf275-collection-back"><button type="button" class="btn btn-sm btn-ghost" data-v225-icon="prev" onclick="App.v274BackToCollections()" aria-label="Back to Collections">Back to Collections</button></div><div class="mf274-page mf274-collection-detail">
    <section class="mf274-collection-hero mf279-collection-hero">${v279HeroBackgroundHtml(c)}<div class="mf279-hero-overlay"></div><div class="mf274-hero-content mf279-hero-content">${v274CollectionCoverHtml(c,'mf274-detail-cover')}<div class="mf274-hero-copy mf279-hero-copy"><span class="mf274-kicker">COLLECTION</span><h1>${escapeHtml(c.title)}</h1><p>${escapeHtml(c.description||'No description yet.')}</p>${v279HeroProgressHtml(c)}<div class="mf279-hero-stats"><span><b>${c.titleIds.length.toLocaleString()}</b> titles</span><span><b>${p.done.toLocaleString()}</b> completed</span><span><b>${p.pct}%</b> progress</span><span>${escapeHtml(bgLabel)}</span></div></div><div class="mf274-hero-actions"><button class="btn btn-sm btn-ghost" data-v225-icon="edit" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit collection</button><button class="btn btn-sm btn-primary" data-v225-icon="add" onclick="App.v274OpenAddTitles('${escapeHtml(c.id)}')">Add titles</button><button class="btn btn-sm ${V274_UI.orderView?'btn-primary':''}" data-v225-icon="orderList" onclick="App.v274ToggleOrderView()">Order view ${V274_UI.orderView?'ON':'OFF'}</button></div></div></section>
    <div class="mf274-tools-toggle-row">${settings.toolsVisible?'':`<button class="btn btn-sm" onclick="App.v274ToggleCollectionTools()">Show Collection Tools</button>`}<span class="hint">${rows.length.toLocaleString()} visible of ${c.titleIds.length.toLocaleString()} titles</span></div>
    ${settings.toolsVisible&&!V274_UI.orderView?v274CollectionToolsHtml(c):''}
    ${V274_UI.orderView?'<div class="mf274-order-note card"><b>Order view</b><span>Drag titles, type an exact position, or use ↑/↓. Turning Order view off keeps this manual order as the collection’s default order.</span></div>':''}
    ${content}</div>`;
};
v274RefreshAutoBackground=function(){
  if(String(S.view||'')!=='collections'||!V274_UI.activeId)return;const c=v274CollectionById(V274_UI.activeId);if(!c||c.backgroundMode==='custom')return;
  const urls=v279BackgroundUrls(c),panels=[...document.querySelectorAll('.mf279-hero-bg-panel')];if(!urls.length||!panels.length)return;panels.forEach((el,i)=>{const url=urls[i%urls.length];el.style.setProperty('--mf279-bg',`url("${String(url).replace(/["\n\r]/g,m=>encodeURIComponent(m))}")`);});
};

/* ---------- editor: custom/automatic background + fast open ------- */
function v279CollectionFormHtml(c){
  const editing=!!c,mode=c?.backgroundMode==='custom'&&c?.backgroundUrl?'custom':'auto';
  return `<div class="modal-overlay mf274-overlay" id="mf274-collection-editor" onclick="if(event.target===this)App.v274CloseOverlay('mf274-collection-editor')"><div class="modal mf274-editor mf279-editor" role="dialog" aria-modal="true"><div class="modal-title">${editing?'Edit collection':'Add collection'}</div><div class="mf279-editor-grid"><div class="field"><label class="field-label">Title</label><input id="mf274-col-title" type="text" value="${escapeHtml(c?.title||'')}" placeholder="Collection title"></div><div class="field"><label class="field-label">Cover URL <span class="hint">optional</span></label><input id="mf274-col-cover" type="url" value="${escapeHtml(c?.coverUrl||'')}" placeholder="https://…"></div><div class="field mf279-editor-desc"><label class="field-label">Description</label><textarea id="mf274-col-desc" rows="5" placeholder="What is this collection for?">${escapeHtml(c?.description||'')}</textarea></div></div><fieldset class="mf279-background-choice"><legend>Collection background</legend><label class="mf279-bg-option ${mode==='auto'?'selected':''}"><input type="radio" name="mf279-bg-mode" value="auto" ${mode==='auto'?'checked':''} onchange="App.v279SyncBackgroundForm()"><span><b>Automatic</b><small>Build a richer rotating backdrop from up to three title covers.</small></span></label><label class="mf279-bg-option ${mode==='custom'?'selected':''}"><input type="radio" name="mf279-bg-mode" value="custom" ${mode==='custom'?'checked':''} onchange="App.v279SyncBackgroundForm()"><span><b>Custom image URL</b><small>Use one background image that you choose.</small></span></label><div class="field mf279-bg-url"><label class="field-label">Background image URL</label><input id="mf279-col-background" type="url" value="${escapeHtml(c?.backgroundUrl||'')}" placeholder="https://…" ${mode==='custom'?'':'disabled'}></div></fieldset><div class="modal-actions"><button class="btn btn-ghost" data-v225-icon="cancel" onclick="App.v274CloseOverlay('mf274-collection-editor')">Cancel</button>${editing?`<button class="btn btn-danger" data-v225-icon="delete" onclick="App.v274DeleteCollection('${escapeHtml(c.id)}')">Delete collection</button>`:''}<button class="btn btn-primary" data-v225-icon="${editing?'save':'collectionAdd'}" onclick="App.v274SaveCollection('${editing?escapeHtml(c.id):''}')">${editing?'Save changes':'Create collection'}</button></div></div></div>`;
}
v274CollectionFormHtml=v279CollectionFormHtml;
function v279SyncBackgroundForm(){const mode=document.querySelector('input[name="mf279-bg-mode"]:checked')?.value||'auto',input=document.getElementById('mf279-col-background');if(input)input.disabled=mode!=='custom';document.querySelectorAll('.mf279-bg-option').forEach(el=>el.classList.toggle('selected',el.querySelector('input')?.value===mode));}
v274CreateCollection=function(){v274CloseOverlay('mf274-collection-editor');document.body.insertAdjacentHTML('beforeend',v279CollectionFormHtml(null));};
v274EditCollection=function(id){const c=v274CollectionById(id);if(!c)return;v274CloseOverlay('mf274-collection-editor');document.body.insertAdjacentHTML('beforeend',v279CollectionFormHtml(c));};
v274SaveCollection=async function(id){
  const title=v274Text(document.getElementById('mf274-col-title')?.value);if(!title){showToast('Give the collection a title.');return;}
  const now=v274Now();let c=id?v274CollectionById(id):null;if(!c){c=v274NormalizeCollection({id:v274Id(),title,createdAt:now,updatedAt:now,titleIds:[]});S.collections.push(c);}
  c.title=title;c.coverUrl=v274Text(document.getElementById('mf274-col-cover')?.value);c.description=String(document.getElementById('mf274-col-desc')?.value||'');
  const mode=document.querySelector('input[name="mf279-bg-mode"]:checked')?.value==='custom'?'custom':'auto';c.backgroundUrl=v274Text(document.getElementById('mf279-col-background')?.value);c.backgroundMode=mode==='custom'&&c.backgroundUrl?'custom':'auto';c.autoBackground=c.backgroundMode==='auto';
  v274TouchCollection(c);v274CloseOverlay('mf274-collection-editor');V274_UI.activeId=c.id;render();showToast(id?'Collection updated ✓':'Collection created ✓');
  try{await saveState();}catch(_){showToast('Collection saved locally; cloud save will retry.');}
};

/* ---------- remove confirmations ---------------------------------- */
v274RemoveTitle=async function(collectionId,titleId){
  const c=v274CollectionById(collectionId),item=v274LibraryItem(titleId);if(!c)return;
  const ok=await v279Confirm({title:'Remove title from collection?',body:`${item?v274SafeTitle(item):'This title'} will be removed from “${c.title}”. It will stay in your MediaFlow Library.`,confirmLabel:'Remove title',danger:true});if(!ok)return;
  c.titleIds=c.titleIds.filter(id=>String(id)!==String(titleId));c.order=c.titleIds.slice();v274TouchCollection(c);await saveState();render();showToast('Removed from collection');
};
v274RemoveSelectedFromCollection=async function(){
  const c=v274CollectionById(V274_UI.activeId);if(!c)return;const ids=new Set(v274SelectedCollectionIds(c));if(!ids.size)return;
  const ok=await v279Confirm({title:`Remove ${ids.size.toLocaleString()} selected title${ids.size===1?'':'s'}?`,body:`The selected titles will be removed from “${c.title}”, but they will remain in your main Library.`,confirmLabel:'Remove selected',danger:true});if(!ok)return;
  c.titleIds=c.titleIds.filter(id=>!ids.has(String(id)));c.order=c.titleIds.slice();v274TouchCollection(c);S.librarySelection={};await saveState();render();showToast('Selected titles removed from collection');
};

/* ---------- Add Titles indexed + debounced search ----------------- */
let V279_LIBRARY_SEARCH_INDEX={library:null,length:-1,rows:[]};
function v279EnsureLibrarySearchIndex(){
  const lib=Array.isArray(S.library)?S.library:[];if(V279_LIBRARY_SEARCH_INDEX.library===lib&&V279_LIBRARY_SEARCH_INDEX.length===lib.length)return V279_LIBRARY_SEARCH_INDEX.rows;
  const rows=lib.filter(i=>i?.id).map(item=>{const cat=v274Cat(item);return {item,id:String(item.id),categoryId:String(item.categoryId||''),status:String(item.status||'planned'),priority:String(item.priority||'medium'),rating:v274Num(item.rating,0),progress:v274Num(item.progress,0),total:v274Num(item.total,0),title:v274SafeTitle(item),search:[v274SafeTitle(item),cat?.name||'',item.status||'',item.priority||'',item.year||'',...(item.tags||[])].join(' ').toLowerCase()};});
  rows.sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}));V279_LIBRARY_SEARCH_INDEX={library:lib,length:lib.length,rows};return rows;
}
v274AddCandidates=function(c){
  const s=v274AddState(),existing=new Set((c.titleIds||[]).map(String)),q=s.search.trim().toLowerCase();let rows=[];
  for(const rec of v279EnsureLibrarySearchIndex()){if(existing.has(rec.id))continue;if(q&&!rec.search.includes(q))continue;if(s.categories.length&&!s.categories.includes(rec.categoryId))continue;if(s.status!=='all'&&rec.status!==s.status)continue;if(s.priority!=='all'&&rec.priority!==s.priority)continue;if(s.rating!=='all'&&!v274RatingMatch(rec.item,s.rating))continue;rows.push(rec);}
  const dir=s.dir==='desc'?-1:1,rank={low:0,medium:1,high:2};
  if(s.sort==='title'){if(dir<0)rows.reverse();}
  else rows.sort((a,b)=>{let d=0;if(s.sort==='priority')d=(rank[a.priority]??1)-(rank[b.priority]??1);else if(s.sort==='rating')d=a.rating-b.rating;else if(s.sort==='progress')d=a.progress-b.progress;else if(s.sort==='total')d=a.total-b.total;return (d||a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}))*dir;});
  return rows.map(r=>r.item);
};
let V279_ADD_SEARCH_TIMER=0;
function v279RunAddSearch(){const c=v276CurrentAddCollection();if(!c)return;const data=v276AddData(c),results=document.getElementById('mf276-add-results'),footer=document.getElementById('mf276-add-footer');if(results)results.innerHTML=v276AddResultsHtml(data.shown);if(footer)footer.innerHTML=v276AddFooterHtml(data);const b=document.getElementById('mf274-add-confirm');if(b)b.disabled=!data.s.picks.size;}
v276AddSearchInput=function(value,input){const s=v274AddState();s.search=String(value||'');s.page=0;clearTimeout(V279_ADD_SEARCH_TIMER);V279_ADD_SEARCH_TIMER=setTimeout(v279RunAddSearch,90);};
const v279OpenAddTitlesBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){v279EnsureLibrarySearchIndex();return v279OpenAddTitlesBase.apply(this,arguments);};

/* ---------- release audit ----------------------------------------- */
function v279AuditState(){let base={};try{base=v276AuditState()||{};}catch(_){ }const c=v274CollectionById(V274_UI.activeId)||v274EnsureCollections()[0],settings=v274EnsureSettings();return Object.assign({},base,{version:279,pwaRelease:279,collectionClickSurface:true,collectionTypedPageSize:true,collectionPageSize:settings.pageSize,collectionProgressAllModes:true,collectionImportExport:true,designedRemoveConfirm:true,backgroundMode:c?.backgroundMode||'auto',backgroundUrl:c?.backgroundUrl||'',collectionCount:v274EnsureCollections().length,addSearchDebounced:true,fastCollectionLookup:true});}
Object.assign(App,{v279OpenCollectionSurface,v279ExportCollections,v279ImportCollections,v279Confirm,v279ResolveConfirm,v279SyncBackgroundForm,v279AuditState,v274CreateCollection,v274EditCollection,v274SaveCollection,v274SetCollectionPageSize,v274RemoveTitle,v274RemoveSelectedFromCollection,v274OpenAddTitles,v276AddSearchInput});
window.MediaFlowV279={version:279,focus:'Collection progress/hero/background/import-export/removal confirmations and performance'};
MediaFlowRuntime.version=V279_RUNTIME_VERSION;
