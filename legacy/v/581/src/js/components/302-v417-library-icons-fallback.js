/* MediaFlow v417 — shared, display-only Library covers and status icon helper.
   No mutation of the title coverUrl, cloud state, or configured category defaults. */
function v417LibraryCoverSource(item){
  // v200 is the existing source of truth for category missing-cover preferences.
  return v200TitleCoverSource(item);
}
function v417LibraryThumbHtml(item,cat){
  const source=v417LibraryCoverSource(item),name=escapeHtml(cleanTitle(item.title));
  const icon=v144CategoryIconHtml(cat||getCategory(item.categoryId));
  const label=escapeHtml(source.type==='category-default'?'Category missing-cover image':'Category icon placeholder');
  if(source.url){
    return `<img class="library-cover-thumb mf417-cover-thumb" data-library-id="${escapeHtml(String(item.id))}" src="${escapeHtml(source.url)}" alt="${name} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="library-cover-thumb mf417-cover-placeholder" role="img" aria-label="${label}" style="display:none">${icon}</span>`;
  }
  return `<span class="library-cover-thumb mf417-cover-placeholder" role="img" aria-label="${label}">${icon}</span>`;
}
function v417LibraryTileCoverHtml(item,placeholderClass){
  const source=v417LibraryCoverSource(item),cat=getCategory(item.categoryId);
  const id=escapeHtml(String(item.id)),name=escapeHtml(cleanTitle(item.title));
  const placeholder=`<div class="${placeholderClass} mf417-tile-placeholder" style="display:${source.url?'none':'grid'}" onclick="App.v181OpenTitleDetails('${id}')">${v144CategoryIconHtml(cat)}</div>`;
  if(!source.url)return placeholder;
  return `<img class="v181-cover-tile-cover" data-library-id="${id}" src="${escapeHtml(source.url)}" alt="${name} cover" loading="lazy" onclick="event.stopPropagation();App.v181OpenTitleDetails('${id}')" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${placeholder}`;
}

/* v226's semantic-icon pass intentionally refreshes even v225-iconified buttons.
   Suppress ONLY the duplicate global icon on Normal Library status chips;
   v265's one canonical .mf265-status-icon remains intact. */
const v417ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf262-status-row button.mf262-filter-chip') &&
     String(el.getAttribute('onclick')||'').includes('v262SetClassicStatus('))return null;
  return v417ButtonIconNameBase(el);
};
