/* ============================================================
   MediaFlow v200 — Category Default Missing Covers
   ------------------------------------------------------------
   - Categories now support a "Missing default cover URL".
   - A title's own cover URL always wins.
   - When enabled, titles without their own cover use their category's default
     missing-cover URL; if unavailable, MediaFlow falls back to the category icon.
   - A global Settings switch can force category-icon-only fallback instead.
   - Category defaults remain DISPLAY fallbacks only: they never populate the
     title's own coverUrl, so Missing Covers can still find/fix actual missing art.
   - Full Backup / Cloud Sync / Sync Now / Settings Preset paths are audited.
   ============================================================ */
const V200_BACKUP_SCHEMA_VERSION=28;
const V200_CLOUD_SYNC_VERSION=200;
const V200_CATEGORY_COVER_DEFAULT={useCategoryDefault:true,modifiedAt:0};
const V200_TEMP_ORIGINAL_COVER='__v200OriginalCoverUrl';

function v200NormalizeCategoryCoverSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    useCategoryDefault:src.useCategoryDefault!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}
function v200EnsureCategoryCoverSettings(settings=S.settings){
  const target=settings&&typeof settings==='object'?settings:(S.settings=S.settings||{});
  target.v200CategoryCovers=v200NormalizeCategoryCoverSettings(target.v200CategoryCovers);
  return target.v200CategoryCovers;
}
function v200UseCategoryDefaultCover(){
  return v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS).useCategoryDefault!==false;
}
function v200SafeCategoryCoverUrl(raw){
  return v144SafeIconUrl(raw||'');
}
function v200CategoryMissingCoverUrl(cat){
  return v200SafeCategoryCoverUrl(cat?.missingDefaultCoverUrl||'');
}
function v200OwnCoverUrl(item){
  if(!item)return '';
  if(Object.prototype.hasOwnProperty.call(item,V200_TEMP_ORIGINAL_COVER)){
    return String(item[V200_TEMP_ORIGINAL_COVER]??'');
  }
  return String(item.coverUrl??'');
}
function v200EffectiveTitleCoverUrl(item){
  const own=v160SafeCoverUrl(v200OwnCoverUrl(item));
  if(own)return own;
  if(!v200UseCategoryDefaultCover())return '';
  return v200CategoryMissingCoverUrl(getCategory(item?.categoryId));
}
function v200TitleCoverSource(item){
  const own=v160SafeCoverUrl(v200OwnCoverUrl(item));
  if(own)return {type:'title',url:own};
  const fallback=v200UseCategoryDefaultCover()?v200CategoryMissingCoverUrl(getCategory(item?.categoryId)):'';
  return fallback?{type:'category-default',url:fallback}:{type:'category-icon',url:''};
}

/* During synchronous UI rendering only, expose category default covers through
   the legacy item.coverUrl field. The original value is restored immediately,
   so no Library/export/cloud data is mutated and Missing Covers stays accurate. */
function v200WithDisplayCovers(fn,ctx,args){
  if(typeof fn!=='function')return;
  if(!v200UseCategoryDefaultCover())return fn.apply(ctx,args||[]);
  const changed=[];
  for(const item of (S.library||[])){
    if(!item||String(item.coverUrl||'').trim())continue;
    const fallback=v200CategoryMissingCoverUrl(getCategory(item.categoryId));
    if(!fallback)continue;
    const original=item.coverUrl;
    try{Object.defineProperty(item,V200_TEMP_ORIGINAL_COVER,{value:original,configurable:true,writable:true,enumerable:false});}
    catch(_){item[V200_TEMP_ORIGINAL_COVER]=original;}
    item.coverUrl=fallback;
    changed.push([item,original]);
  }
  try{return fn.apply(ctx,args||[]);}
  finally{
    for(const [item,original] of changed){
      item.coverUrl=original;
      try{delete item[V200_TEMP_ORIGINAL_COVER];}catch(_){item[V200_TEMP_ORIGINAL_COVER]=undefined;}
    }
  }
}

/* Keep the Missing Covers queue based on ACTUAL title cover URLs rather than
   temporary display fallbacks. */
v192MissingCoverItems=function(){
  return (S.library||[]).filter(item=>item?.id&&!String(v200OwnCoverUrl(item)||'').trim());
};

/* All normal page renderers automatically inherit category default cover art
   without rewriting dozens of existing cover components. */
const v200RenderViewBase=renderView;
renderView=function(){
  return v200WithDisplayCovers(v200RenderViewBase,this,arguments);
};

/* Title Details is created directly outside renderView, so give it the same
   display-only cover treatment. The full title editor intentionally remains
   untouched so its Cover URL field always reflects the title's REAL cover. */
const v200OpenTitleDetailsBase=v181OpenTitleDetails;
v181OpenTitleDetails=function(id){
  return v200WithDisplayCovers(v200OpenTitleDetailsBase,this,arguments);
};
App.v181OpenTitleDetails=v181OpenTitleDetails;

/* Missing Covers must remain in the queue even when a category fallback is
   visible. Show that category fallback as the card artwork when available. */
const v200MissingCoversHtmlBase=v192MissingCoversHtml;
v192MissingCoversHtml=function(){
  const item=v192CurrentMissingCoverItem();
  const url=item?v200EffectiveTitleCoverUrl(item):'';
  const html=v200MissingCoversHtmlBase.apply(this,arguments);
  if(!item||!url)return html;
  try{
    const host=document.createElement('div');
    host.innerHTML=html;
    const ph=host.querySelector('.v192-cover-placeholder');
    if(ph){
      ph.innerHTML=`<img class="v200-missing-default-cover" src="${escapeHtml(url)}" alt="${escapeHtml(cleanTitle(item.title))} category default cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="v200-missing-default-icon" style="display:none">${v144CategoryIconHtml(getCategory(item.categoryId))}</span>`;
      ph.title='Open title details · category default cover';
    }
    return host.innerHTML;
  }catch(_){return html;}
};

/* Dynamic theme recommendations can also use the visible category fallback,
   while still preferring a title's own cover whenever one exists. */
v160RecommendedCoverSource=function(){
  const t=S.currentTask;
  if(!t)return null;
  let item=null;
  if(t.libraryId)item=(S.library||[]).find(x=>String(x?.id||'')===String(t.libraryId))||null;
  if(!item&&t.title)item=v50FindLibraryItem(t.libraryId,t.title);
  const url=item?v200EffectiveTitleCoverUrl(item):'';
  if(!item||!url)return null;
  const source=v200TitleCoverSource(item);
  return {source:'recommended',label:`Recommended: ${cleanTitle(item.title)}`,url,libraryId:item.id||t.libraryId||null,coverType:source.type};
};
v145RecommendedCoverSource=v160RecommendedCoverSource;

