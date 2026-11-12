/* MediaFlow v420 — final rendering fixes. Presentation-only: no Library records,
 * collection membership, category cover configuration, or cloud data are edited. */
const MF420_COVER_VERSION=420;
function mf420SafeCategory(item){return getCategory(item?.categoryId)||null;}
function mf420CoverFallback(item,klass=''){
  const cat=mf420SafeCategory(item);
  const color=escapeHtml(String(cat?.color||'var(--flow)'));
  const title=escapeHtml(cleanTitle(item?.title||'Title'));
  const icon=cat?v144CategoryIconHtml(cat):'<span class="v144-cat-icon-emoji" aria-hidden="true">◇</span>';
  return `<span class="mf420-cover-fallback ${klass}" style="--mf420-cat-color:${color}" role="img" aria-label="Missing cover for ${title}"><span class="mf420-cover-glyph">${icon}</span></span>`;
}
function mf420ImageOrFallback(item,klass='',click=''){
  const source=v200TitleCoverSource(item);
  const alt=escapeHtml(cleanTitle(item?.title||'Title'));
  const missing=source.type==='category-icon';
  const fallback=mf420CoverFallback(item);
  const img=source.url?`<img class="mf420-cover-image" src="${escapeHtml(source.url)}" alt="${alt} cover" loading="lazy" onerror="this.hidden=true;this.parentNode.classList.add('mf420-cover-missing')">`:'';
  const onclick=click?` onclick="${click}"`:'';
  return `<span class="mf420-cover-stage ${klass} ${missing?'mf420-cover-missing':''}" data-mf420-cover-source="${escapeHtml(source.type)}"${onclick}>${fallback}${img}</span>`;
}
/* Both library renderers call these functions at render time. The normal
 * library's Cards/List/Compact thumbnails and Dynamic equivalents use the
 * same category fallback, while Cover-only tiles retain their own dimensions. */
v417LibraryThumbHtml=function(item,cat){
  return mf420ImageOrFallback(item,'library-cover-thumb mf417-cover-thumb mf420-library-thumb');
};
v417LibraryTileCoverHtml=function(item,placeholderClass){
  const id=escapeHtml(String(item.id));
  return mf420ImageOrFallback(item,`${escapeHtml(placeholderClass||'v181-cover-tile-placeholder')} mf417-tile-placeholder mf420-library-poster`,`event.stopPropagation();App.v181OpenTitleDetails('${id}')`);
};
/* The v418 Collections renderer calls this function directly. Do not patch
 * markup after rendering (which would miss virtualized/redrawn cards). */
v418CollectionTitleCover=function(item){
  const id=escapeHtml(String(item.id)),alt=escapeHtml(v274SafeTitle(item));
  return `<button type="button" class="mf274-title-cover mf418-title-cover mf420-collection-cover" onclick="App.v274OpenTitle('${id}')" aria-label="Details for ${alt}">${mf420ImageOrFallback(item,'mf420-collection-stage')}</button>`;
};
