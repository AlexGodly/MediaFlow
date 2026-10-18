/* MediaFlow v498 — Logging selection readability & cover parity.
 * All Logging cover surfaces use the real title's saved cover or its category
 * icon, never a "Missing cover" caption or an invented title initial.
 * Cover clicks open Title Details. They never select/add/remove a draft title.
 * Library/History, category settings, source priorities and persistence remain
 * under existing owners.
 */
const MF498_VERSION=498;
const MF498_COVERS={advanced:0,quick:0,picker:0,recommended:0,errors:0};
function mf498OwnCoverUrl(item){
 if(!item)return '';
 const raw=typeof v200OwnCoverUrl==='function'?v200OwnCoverUrl(item):item.coverUrl;
 return typeof v160SafeCoverUrl==='function'?v160SafeCoverUrl(raw):(/^https?:\/\//i.test(String(raw||''))?String(raw):'');
}
function mf498CategoryIcon(item){
 const category=getCategory(item?.categoryId);
 return category?v144CategoryIconHtml(category):v370Icon('list',24);
}
function mf498DetailsAction(item){
 const id=item?.id;
 if(id===undefined||id===null||String(id)==='')return '';
 // URL encoding + explicit single-quote escaping protect inline actions
 // even when a title's external/library ID contains quotes.
 return 'App.v181OpenTitleDetails(decodeURIComponent(\''+
  encodeURIComponent(String(id)).replace(/'/g,'%27')+'\'))';
}
function mf498CoverHtml(item,surface='advanced'){
 const surfaces={advanced:'v370-title-cover',quick:'v239-logged-cover',
  picker:'mf419-cover-art mf419-logging-cover',
  recommended:'mf419-cover-art mf419-log-rec-cover'};
 const classname=surfaces[surface]||surfaces.advanced;
 const name=escapeHtml(cleanTitle(item?.title||'Untitled'));
 const url=mf498OwnCoverUrl(item);
 const icon=mf498CategoryIcon(item);
 const valid=!!url;
 const action=mf498DetailsAction(item);
 const button=!!action;
 const classes=classname+' mf498-logging-cover'+(!valid?' is-missing':'');
 // Use actual img for covers and a permanently present category icon fallback.
 // A failed URL can be retried on a later render, without persisting a fake
 // image to the title record. HTML hidden is removed on the fallback onerror.
 const artwork=(valid?'<img class="mf498-cover-image" src="'+escapeHtml(url)+
  '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false">':'')+
  '<span class="mf498-cover-icon'+(surface==='advanced'?' v370-cover-fallback':'')+
  '" role="img" aria-label="'+escapeHtml('Category icon for '+cleanTitle(item?.title||'title'))+
  '"'+(valid?' hidden':'')+'>'+icon+'</span>';
 const tag=button?'button':'span';
 const attrs=button?' type="button" onclick="'+escapeHtml(action)+
  '" aria-label="'+escapeHtml('Open title details: '+cleanTitle(item.title||'Untitled'))+
  '" title="Open title details"':'';
 MF498_COVERS[surface]=(MF498_COVERS[surface]||0)+1;
 return '<'+tag+' class="'+classes+'" data-mf498-cover="'+surface+'"'+attrs+'>'+artwork+'</'+tag+'>';
}
// Advanced Logging: v370TitlePanelHtml resolves v370CoverHtml at render
// time. v394 tabs and the v396 per-title repaint keep this behavior.
v370CoverHtml=function(item){
 return mf498CoverHtml(item,'advanced');
};
// Quick Logging (both quantity and progress modes): the canonical v239
// logged-title renderer calls this function for each selected title.
v239LoggedCover=function(item,title){
 if(item)return mf498CoverHtml(item,'quick');
 const fallback={title:title||'Untitled',categoryId:null};
 return mf498CoverHtml(fallback,'quick');
};
// Logging Library: keep the existing five display modes, search, selection,
// checked state, sorting, pagination and Add/Remove buttons untouched.
const mf498SuggestionBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
 const raw=String(mf498SuggestionBase.apply(this,arguments)||'');
 if(!raw.includes('log-suggestion')||!raw.includes('v86-log-result'))return raw;
 try{
  const box=document.createElement('div');box.innerHTML=raw;
  const query=String(S.entryDraft?.title||'').trim();
  const titles=logTitleCandidates(query);
  const page=Math.max(0,Number(V89_LOG.page)||0),size=Math.max(1,Number(V89_LOG.pageSize)||1);
  const pageRows=titles.slice(page*size,(page+1)*size);
  box.querySelectorAll('.mf378-picker .log-suggestion').forEach((row,index)=>{
   const item=pageRows[index];if(!item)return;
   const result=row.querySelector('.v86-log-result');if(!result)return;
   const holder=document.createElement('div');
   holder.innerHTML=mf498CoverHtml(item,'picker');
   const replacement=holder.firstElementChild;
   if(!replacement)return;
   const existing=result.querySelector('.mf419-logging-cover,.v86-log-cover');
   if(existing)existing.replaceWith(replacement);
   else result.insertBefore(replacement,result.firstChild);
  });
  return box.innerHTML;
 }catch(error){
  MF498_COVERS.errors++;
  console.warn('[MediaFlow v498] Logging Library retained existing artwork',error);
  return raw;
 }
};
// Logging's "Use Recommended Title" card: preserve its existing button and
// recommendation logic, replace only the visual artwork/placeholder.
const mf498RecommendedBase=v253RecommendedLogCardHtml;
v253RecommendedLogCardHtml=function(item){
 const raw=String(mf498RecommendedBase.apply(this,arguments)||'');
 if(!item||!raw.includes('mf419-log-rec-cover'))return raw;
 try{
  const host=document.createElement('div');host.innerHTML=raw;
  const cover=host.querySelector('.mf419-log-rec-cover');
  if(!cover)return raw;
  const node=document.createElement('div');
  node.innerHTML=mf498CoverHtml(item,'recommended');
  if(node.firstElementChild)cover.replaceWith(node.firstElementChild);
  return host.innerHTML;
 }catch(error){
  MF498_COVERS.errors++;return raw;
 }
};
window.MediaFlowV498=Object.freeze({
 version:MF498_VERSION,cover:mf498CoverHtml,
 ownCover:mf498OwnCoverUrl,action:mf498DetailsAction,
 status:()=>({...MF498_COVERS})
});
MediaFlowRuntime.version=MF498_VERSION;
