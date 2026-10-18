/* MediaFlow v501 — canonical Library missing-cover behavior in Logging.
 * v200/v417 choose saved artwork, category default image or category icon.
 * This module renders it in every v498 Logging cover surface; it never
 * modifies item.coverUrl, Settings, draft entries or recovery state.
 */
const MF501_VERSION=501;
const MF501_COVERS={advanced:0,quick:0,picker:0,recommended:0,missing:0,categoryDefault:0,broken:0};
function mf501TitleItem(item){
 if(!item)return null;
 const id=item.id;
 const library=Array.isArray(S.library)?S.library:[];
 if(id!==undefined&&id!==null){
  const match=library.find(x=>x&&String(x.id)===String(id));
  if(match)return match;
 }
 // Recommendations may contain partial objects without a saved categoryId.
 // Only use a title match when unique; otherwise preserve the passed object.
 if(!item.categoryId&&item.title){
  const matches=library.filter(x=>x&&String(x.title||'').trim()===String(item.title).trim());
  if(matches.length===1)return matches[0];
 }
 return item;
}
function mf501LibraryCoverSource(item){
 const actual=mf501TitleItem(item);
 if(!actual)return {type:'category-icon',url:''};
 const source=typeof v417LibraryCoverSource==='function'?
  v417LibraryCoverSource(actual):v200TitleCoverSource(actual);
 // v200 preserves the title's real cover even during temporary display-only
 // category defaults. Do not synthesize or save a cover URL.
 return {type:source?.type||'category-icon',
  url:typeof v160SafeCoverUrl==='function'?v160SafeCoverUrl(source?.url||''):String(source?.url||'')};
}
function mf501CategoryArtwork(item){
 const actual=mf501TitleItem(item),cat=actual?getCategory(actual.categoryId):null;
 const icon=cat&&typeof v144CategoryIconHtml==='function'?
  v144CategoryIconHtml(cat):v370Icon('list',24);
 const safeColor=/^#[0-9a-f]{3,8}$/i.test(String(cat?.color||''))?cat.color:'var(--flow)';
 return {icon:icon||v370Icon('list',24),color:safeColor,
  name:String(cat?.name||actual?.category||'Category')};
}
function mf501CoverHtml(item,surface='advanced'){
 const actual=mf501TitleItem(item);
 if(!actual)return '';
 const styles={advanced:'v370-title-cover',quick:'v239-logged-cover',
  picker:'mf419-cover-art mf419-logging-cover',
  recommended:'mf419-cover-art mf419-log-rec-cover'};
 const kind=styles[surface]?surface:'advanced';
 const source=mf501LibraryCoverSource(actual),category=mf501CategoryArtwork(actual);
 const title=cleanTitle(actual.title||item?.title||'Untitled');
 const action=mf498DetailsAction(actual);
 const hasImage=!!source.url,tag=action?'button':'span';
 const fallback='<span class="mf498-cover-icon mf501-category-fallback"'+
  (hasImage?' hidden':'')+' role="img" aria-label="'+
  escapeHtml('Category icon: '+category.name)+'" style="--mf501-category-color:'+
  escapeHtml(category.color)+'"><span class="mf501-category-art">'+category.icon+'</span></span>';
 const image=hasImage?'<img class="mf498-cover-image mf501-cover-image" src="'+
  escapeHtml(source.url)+'" loading="lazy" decoding="async" alt=""'+
  ' referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false;this.parentElement.classList.add(\'mf501-cover-failed\')">':'';
 const attrs=action?' type="button" onclick="'+escapeHtml(action)+
  '" title="Open title details" aria-label="'+escapeHtml('Open title details: '+title)+'"':'';
 MF501_COVERS[kind]++;
 if(!hasImage)MF501_COVERS.missing++;
 if(source.type==='category-default')MF501_COVERS.categoryDefault++;
 return '<'+tag+' class="'+styles[kind]+' mf498-logging-cover mf501-library-cover'+
  (!hasImage?' is-missing':'')+'" data-mf498-cover="'+kind+
  '" data-mf501-source="'+escapeHtml(source.type)+'"'+
  (action?' data-v225-iconified="1" data-mf500-clean-poster="1"':'')+attrs+
  '>'+image+fallback+'</'+tag+'>';
}
// Existing v498 owners (Advanced, Quick, picker, recommendation) resolve this
// shared function at runtime. Keep all existing selection/click routes intact.
mf498CoverHtml=mf501CoverHtml;
window.MediaFlowV501=Object.freeze({
 version:MF501_VERSION,source:mf501LibraryCoverSource,
 category:mf501CategoryArtwork,cover:mf501CoverHtml,
 status:()=>({...MF501_COVERS})
});
MediaFlowRuntime.version=MF501_VERSION;
