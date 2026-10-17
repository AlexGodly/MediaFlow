/* ============================================================
   MediaFlow v280 — Collection cover progress / selection / hero polish
   ------------------------------------------------------------
   - One title progress indicator per Collection title, attached to cover.
   - Rating badges live on the title cover instead of in text/meta rows.
   - Compact Collection browser progress UI is simplified and aligned.
   - Manual one-by-one Collection selection immediately updates bulk actions.
   - Collection hero backgrounds remain visible while copy stays readable.
   ============================================================ */
const V280_RUNTIME_VERSION=280;

/* ---------- collection title cover indicators --------------------- */
function v280CollectionTitleMeta(item){
  const cat=v274Cat(item);
  const progress=item?.total!=null
    ?`${v274Num(item.progress,0)}/${v274Num(item.total,0)}`
    :(v274Num(item?.progress,0)?String(item.progress):'—');
  return `<span>${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')}</span><span>${escapeHtml(v274StatusLabel(item?.status))}</span><span>${escapeHtml(String(item?.priority||'medium'))} priority</span><span>${escapeHtml(progress)}</span>`;
}
function v280CollectionCoverIndicatorsHtml(item,mode){
  const coverMode=mode==='covers'||mode==='covers-title';
  const cfg=typeof v254EnsureCoverOverlaySettings==='function'
    ?v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS)
    :{status:true,category:true,rating:true,progress:true};
  const status=coverMode&&cfg.status&&typeof v254StatusBadgeHtml==='function'?v254StatusBadgeHtml(item):'';
  const category=coverMode&&cfg.category&&typeof v254CategoryBadgeHtml==='function'?v254CategoryBadgeHtml(item):'';
  // In List/Compact/Cards, rating/progress are always attached to the cover.
  // Covers/Covers+Titles continue honoring the Collection on-cover toggles.
  const rating=(!coverMode||cfg.rating)&&typeof v254RatingBadgeHtml==='function'?v254RatingBadgeHtml(item):'';
  const progress=(!coverMode||cfg.progress)&&typeof v254ProgressHtml==='function'?v254ProgressHtml(item):'';
  return `<span class="v254-cover-overlay-frame mf280-cover-overlay-frame">${status}${category}${rating}${progress}</span>`;
}
function v280CollectionCoverHtml(item,mode){
  return `<span class="mf280-cover-frame mf280-cover-frame-${escapeHtml(mode)}">${v274TitleCover(item)}${v280CollectionCoverIndicatorsHtml(item,mode)}</span>`;
}
function v280CollectionSelectHtml(item,mode){
  const clean=v276CollectionSettings().cleanCovers&&(mode==='covers'||mode==='covers-title');
  if(clean)return '';
  const id=escapeHtml(String(item.id));
  return `<label class="mf274-select-title" title="Select title" onclick="event.stopPropagation()"><input type="checkbox" ${S.librarySelection?.[item.id]?'checked':''} onchange="event.stopPropagation();App.v280ToggleCollectionSelect('${id}',this.checked)"></label>`;
}
function v280ToggleCollectionSelect(id,on){
  const c=v274CollectionById(V274_UI.activeId);if(!c)return;
  const allowed=new Set((c.titleIds||[]).map(String)),sid=String(id||'');if(!allowed.has(sid))return;
  S.librarySelection=S.librarySelection||{};
  if(on)S.librarySelection[sid]=true;else delete S.librarySelection[sid];
  render();
}

/* Replace v279 Collection title renderers so rating + the single progress bar
   are anchored to the actual cover rectangle in every display mode. */
v274CollectionItemHtml=function(c,item,mode){
  const id=escapeHtml(String(item.id)),cid=escapeHtml(String(c.id));
  const check=v280CollectionSelectHtml(item,mode),cover=v280CollectionCoverHtml(item,mode),meta=v280CollectionTitleMeta(item);
  if(mode==='covers'||mode==='covers-title'){
    return `<article class="mf274-collection-tile ${mode} mf280-collection-tile ${check?'mf280-has-selection':''}" data-library-id="${id}">${check}${cover}${mode==='covers-title'?`<button type="button" class="mf274-tile-title" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button>`:''}<button type="button" class="mf274-remove-chip" title="Remove from collection" onclick="App.v274RemoveTitle('${cid}','${id}')">×</button></article>`;
  }
  if(mode==='cards')return `<article class="mf274-collection-title-card mf280-collection-title-card">${check}${cover}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${meta}</div></div><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></article>`;
  if(mode==='compact')return `<article class="mf274-collection-compact mf280-collection-compact">${check}${cover}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button></div><div class="mf274-title-meta">${meta}</div><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></article>`;
  return `<article class="mf274-collection-list-row mf280-collection-list-row">${check}${cover}<div class="mf274-title-copy"><button class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-title-meta">${meta}</div>${item.year?`<small>${escapeHtml(String(item.year))}</small>`:''}</div><div class="mf274-row-actions"><button class="btn btn-sm" data-v225-icon="details" onclick="App.v274OpenTitle('${id}')">Details</button><button class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></div></article>`;
};

/* ---------- main Collections Compact progress --------------------- */
function v280CompactCollectionProgressHtml(c){
  const p=v274CollectionProgress(c);
  return `<div class="mf280-browser-compact-progress" title="${p.done.toLocaleString()} of ${p.total.toLocaleString()} titles completed"><div class="mf280-browser-compact-progress-copy"><b>${p.pct}%</b><span>${p.done.toLocaleString()}/${p.total.toLocaleString()} completed</span></div><div class="mf280-browser-compact-progress-track"><span style="width:${p.pct}%"></span></div></div>`;
}
const v280CollectionBrowserCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(c,mode){
  if(mode!=='compact')return v280CollectionBrowserCardBase.apply(this,arguments);
  const cover=v274CollectionCoverHtml(c,'mf274-browser-cover'),desc=escapeHtml(c.description||'No description yet.'),id=escapeHtml(String(c.id));
  const open=`<button type="button" class="btn btn-sm" data-v225-icon="openCollection" onclick="App.v274OpenCollection('${id}')">Open</button>`;
  const edit=`<button type="button" class="btn btn-sm btn-ghost" data-v225-icon="edit" onclick="App.v274EditCollection('${id}')">Edit</button>`;
  return `<article ${v279CollectionSurfaceAttrs(c,'compact')} data-mode="compact">${cover}<div class="mf274-browser-copy"><b>${escapeHtml(c.title)}</b><span>${desc}</span>${v280CompactCollectionProgressHtml(c)}</div><span class="mf280-compact-title-count">${c.titleIds.length.toLocaleString()} titles</span><div class="mf274-browser-actions">${open}${edit}</div></article>`;
};

/* ---------- batch selection reliability --------------------------- */
const v280CollectionBatchBarBase=v274CollectionBatchBarHtml;
v274CollectionBatchBarHtml=function(c){
  let h=v280CollectionBatchBarBase.apply(this,arguments);
  const n=v274SelectedCollectionIds(c).length;
  // Older wrappers may have rendered a stale disabled state. Normalize the
  // current Collection count every time this bar is built.
  h=h.replace(/<b>\d[\d,]* selected<\/b>/,`<b>${n.toLocaleString()} selected</b>`);
  if(n>0)h=h.replace(/(<button type="button" class="btn btn-sm btn-danger")\s+disabled(\s+onclick="App\.v274RemoveSelectedFromCollection\(\)")/,'$1$2');
  return h;
};

/* ---------- v280 audit ------------------------------------------- */
function v280AuditState(){
  const c=v274CollectionById(V274_UI.activeId)||(S.collections||[])[0]||null;
  return {
    version:280,
    pwaRelease:280,
    activeCollection:c?.id||null,
    selected:c?v274SelectedCollectionIds(c).length:0,
    detailView:v274EnsureSettings().detailView,
    collectionCoverProgress:true,
    collectionRatingOnCover:true,
    compactProgressV280:true,
    heroBackgroundVisibilityV280:true
  };
}

Object.assign(App,{v280ToggleCollectionSelect,v280AuditState});
window.MediaFlowV280={version:280,focus:'Collection title cover progress/rating, manual selection, compact progress and hero background visibility'};
MediaFlowRuntime.version=V280_RUNTIME_VERSION;
