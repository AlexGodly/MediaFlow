/* MediaFlow v418 — the FINAL Collections renderer layer.
   Read-only presentation; collection memberships, Library titles and user settings unchanged.
   Reuses MediaFlow's real category icons, status icons and category-cover configuration. */
function v418CollectionTitleCover(item){
  const source=v200TitleCoverSource(item),cat=v274Cat(item),color=escapeHtml(cat?.color||'var(--flow)');
  const id=escapeHtml(String(item.id)),alt=escapeHtml(v274SafeTitle(item));
  const inner=cat?v144CategoryIconHtml(cat):'<span aria-hidden="true">◇</span>';
  const placeholder=`<span class="mf418-placeholder" role="img" aria-label="Missing cover for ${alt}" style="${source.url?'display:none;':''}">${inner}</span>`;
  return `<button type="button" class="mf274-title-cover mf418-title-cover ${source.url?'':'mf418-missing-cover'}" style="--mf418-cat:${color}" onclick="App.v274OpenTitle('${id}')" aria-label="Details for ${alt}">${source.url?`<img src="${escapeHtml(source.url)}" alt="${alt} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}${placeholder}</button>`;
}
function v418CollectionProgress(item){
  const total=Math.max(0,v274Num(item?.total,0));
  const progress=Math.max(0,v274Num(item?.progress,0));
  const complete=String(item?.status)==='completed'||(total>0&&progress>=total);
  const pct=total>0?Math.round(100*Math.min(progress,total)/total):(complete?100:0);
  const copy=total>0?`${progress.toLocaleString()} / ${total.toLocaleString()}`:(complete?'Completed':progress?`${progress.toLocaleString()} logged`:'Not started');
  return `<div class="mf418-title-progress" aria-label="Progress ${escapeHtml(copy)}"><div class="mf418-progress-copy"><span>Progress</span><strong>${escapeHtml(copy)} <span class="mf418-pct">(${pct}%)</span></strong></div><div class="mf418-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div></div>`;
}
function v418CollectionMetadata(item){
  const cat=v274Cat(item),status=String(item?.status||'planned');
  const category=cat?v144CategoryIconHtml(cat):'<span aria-hidden="true">◇</span>';
  const statusIcon=typeof v229StatusChoiceIcon==='function'?v229StatusChoiceIcon(status):'';
  return `<div class="mf418-title-metadata"><span class="mf418-info-pill mf418-category">${category}<span>${escapeHtml(cat?.name||'Uncategorized')}</span></span><span class="mf418-info-pill mf418-status">${statusIcon}<span>${escapeHtml(v274StatusLabel(status))}</span></span><span class="mf418-info-pill mf418-priority">${escapeHtml(String(item?.priority||'medium'))} priority</span></div>`;
}
function v418CollectionActions(c,item){
  const id=escapeHtml(String(item.id)),cid=escapeHtml(String(c.id));
  return `<div class="mf418-title-actions"><button type="button" class="btn btn-sm" data-v225-icon="details" onclick="App.v274OpenTitle('${id}')">Details</button><button type="button" class="btn btn-sm" data-v225-icon="edit" onclick="App.openLibraryModal('${id}')">Edit</button><button type="button" class="btn btn-sm btn-ghost" data-v225-icon="remove" onclick="App.v274RemoveTitle('${cid}','${id}')">Remove</button></div>`;
}
// This override intentionally replaces the late v280 renderer, not just its CSS.
v274CollectionItemHtml=function(c,item,mode){
  const id=escapeHtml(String(item.id)),cid=escapeHtml(String(c.id));
  const check=v280CollectionSelectHtml(item,mode);
  const cover=v418CollectionTitleCover(item);
  if(mode==='covers'||mode==='covers-title'){
    const overlay=v280CollectionCoverIndicatorsHtml(item,mode);
    return `<article class="mf274-collection-tile mf280-collection-tile mf418-poster-tile ${mode}" data-library-id="${id}">${check}<span class="mf280-cover-frame">${cover}${overlay}</span>${mode==='covers-title'?`<button type="button" class="mf274-tile-title" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button>`:''}<button type="button" class="mf274-remove-chip mf418-remove-poster" title="Remove from collection" aria-label="Remove ${escapeHtml(v274SafeTitle(item))} from collection" onclick="App.v274RemoveTitle('${cid}','${id}')">×</button></article>`;
  }
  const cls=mode==='cards'?'mf274-collection-title-card mf280-collection-title-card':mode==='compact'?'mf274-collection-compact mf280-collection-compact':'mf274-collection-list-row mf280-collection-list-row';
  const header=`<div class="mf418-title-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenTitle('${id}')">${escapeHtml(v274SafeTitle(item))}</button>${v418CollectionMetadata(item)}${v418CollectionProgress(item)}</div>`;
  return `<article class="${cls} mf418-detail-card mf418-mode-${escapeHtml(mode)}" data-library-id="${id}">${check}${cover}${header}${v418CollectionActions(c,item)}</article>`;
};
// Reuse the existing v417 category fallback rules for regular Library row and tile
// thumbnails, with one centered/scalable icon across all display modes.
function v418CollectionBrowseActions(c){
  const id=escapeHtml(String(c.id));
  return `<div class="mf274-browser-actions mf418-browser-actions"><button class="btn btn-sm" data-v225-icon="openCollection" onclick="App.v274OpenCollection('${id}')">Open</button><button class="btn btn-sm btn-ghost" data-v225-icon="edit" onclick="App.v274EditCollection('${id}')">Edit</button></div>`;
}
function v418CollectionBrowseProgress(c){
  const p=v274CollectionProgress(c);
  return `<div class="mf418-browser-progress" aria-label="${p.pct}% progress"><div class="mf418-browser-progress-copy"><strong>${p.pct}% complete</strong><span>${p.done.toLocaleString()} / ${p.total.toLocaleString()} titles completed</span></div><div class="mf418-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.pct}"><span style="width:${p.pct}%"></span></div></div>`;
}
function v418CollectionBrowseFacts(c){
  return `<div class="mf418-browser-facts"><span><b>${c.titleIds.length.toLocaleString()}</b> titles</span>${c.lastViewedAt?`<span>Viewed ${new Date(c.lastViewedAt).toLocaleDateString()}</span>`:''}</div>`;
}
const v418BrowserCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(c,mode){
  const id=escapeHtml(String(c.id)),name=escapeHtml(c.title),desc=escapeHtml(c.description||'No description yet.');
  const cover=v274CollectionCoverHtml(c,'mf274-browser-cover'),actions=v418CollectionBrowseActions(c),progress=v418CollectionBrowseProgress(c),facts=v418CollectionBrowseFacts(c);
  if(mode==='covers')return `<button type="button" class="mf274-browser-cover-card mf279-browser-cover-card mf418-browser-cover" onclick="App.v274OpenCollection('${id}')">${cover}<span class="mf418-cover-title">${name}</span>${progress}${facts}</button>`;
  const layout=mode==='compact'?'mf274-browser-compact':mode==='list'?'mf274-browser-list':mode==='cards'?'mf274-browser-card':'mf274-browser-showcase mf276-browser-showcase';
  const art=mode==='showcase'?`<button type="button" class="mf274-showcase-cover mf276-showcase-cover" onclick="App.v274OpenCollection('${id}')">${v276ShowcaseCoverHtml(c)}</button>`:cover;
  const dates=mode==='showcase'?`<div class="mf418-dates">Created ${new Date(c.createdAt).toLocaleDateString()} · Updated ${new Date(c.updatedAt).toLocaleDateString()}</div>`:'';
  return `<article class="${layout} mf279-open-surface mf418-browser-entry mf418-browser-${escapeHtml(mode)}" data-mode="${escapeHtml(mode)}" role="button" tabindex="0" onclick="App.v279OpenCollectionSurface(event,'${id}')" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();App.v274OpenCollection('${id}')}">${art}<div class="mf418-browser-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${id}')">${name}</button><p>${desc}</p>${dates}${facts}${progress}</div>${actions}</article>`;
};
// v276's switch is used by the actual Collections browser even after later UI wrappers.
v276BrowserViewSwitch=function(){
  const mode=v274EnsureSettings().browserView;
  const rows=[['compact','Compact','compact'],['list','List','list'],['cards','Cards','cards'],['showcase','Showcase','showcase'],['covers','Covers','covers']];
  return `<div class="mf274-view-switch mf418-view-switch" aria-label="Collection display mode">${rows.map(([id,label,icon])=>`<button type="button" class="btn btn-sm ${mode===id?'btn-primary':''}" data-v225-icon="${icon}" onclick="App.v274SetBrowserView('${id}')">${label}</button>`).join('')}</div>`;
};
