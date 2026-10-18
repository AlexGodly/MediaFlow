/* MediaFlow v473 — Collections browser Showcase only.
 * Fixed five-poster preview, smooth Simkl-inspired expansion, uncropped hovered
 * cover, and no previous/next buttons. Does not modify account data. */
const MF473_SHOWCASE_MAX=5;
function mf473FeaturedPosters(collection){
  return mf471Posters(collection).slice(0,MF473_SHOWCASE_MAX);
}
function mf473PosterHtml(poster,index){
  const alt=escapeHtml(String(poster.title||'Collection poster'));
  const fallback='<span class="mf471-showcase-fallback mf473-fallback" style="--mf471-category:'+escapeHtml(poster.color||'var(--flow)')+'">'+(poster.icon||'◇')+'</span>';
  const url=escapeHtml(poster.url||'');
  // Two views of the same URL (shared browser cache): the resting poster crop,
  // and a full, uncropped image cross-faded above it while hovering. The
  // expanded cell stays within the frame, so outer overflow never clips art.
  const image=url?
    '<img class="mf473-poster-crop" src="'+url+'" alt="" loading="lazy" decoding="async" onerror="App.mf473MissingImage(this)">'+
    '<img class="mf473-poster-full" src="'+url+'" alt="" loading="lazy" decoding="async" onerror="App.mf473MissingImage(this)">'+
    '<span class="mf471-showcase-fallback mf473-fallback" hidden style="--mf471-category:'+escapeHtml(poster.color||'var(--flow)')+'">'+(poster.icon||'◇')+'</span>':fallback;
  return '<span class="mf471-showcase-poster mf473-showcase-poster'+(url?'':' mf471-no-cover')+'" role="listitem" data-cover-index="'+index+'" title="'+alt+'" aria-label="'+alt+'">'+image+'</span>';
}
function mf473StripHtml(collection){
  const posters=mf473FeaturedPosters(collection);
  if(!posters.length)return '<div class="mf471-showcase-empty" aria-label="Collection has no posters"><span aria-hidden="true">◇</span></div>';
  return '<div class="mf471-showcase-strip mf473-showcase-strip" role="list" style="--mf471-count:'+posters.length+'" aria-label="'+posters.length+' featured collection posters">'+
    posters.map(mf473PosterHtml).join('')+'</div>';
}
function mf473MissingImage(img){
  const poster=img?.closest?.('.mf473-showcase-poster');
  if(!poster)return;
  poster.querySelectorAll('img').forEach(node=>{node.hidden=true;});
  const fallback=poster.querySelector('.mf473-fallback');
  if(fallback)fallback.hidden=false;
}
const mf473CollectionCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(collection,mode){
  if(mode!=='showcase')return mf473CollectionCardBase.apply(this,arguments);
  const id=escapeHtml(String(collection.id)),name=escapeHtml(collection.title),desc=escapeHtml(collection.description||'No description yet.');
  const date='<div class="mf418-dates">Created '+new Date(collection.createdAt).toLocaleDateString()+
    ' · Updated '+new Date(collection.updatedAt).toLocaleDateString()+'</div>';
  const art='<div class="mf274-showcase-cover mf276-showcase-cover mf471-showcase-frame mf473-showcase-frame" data-cover-count="'+mf473FeaturedPosters(collection).length+'">'+mf473StripHtml(collection)+'</div>';
  // Preserve standard MediaFlow collection metadata, progress, and actions.
  // Crucially this frame contains NO arrow buttons / circle-arrow icons.
  return '<article class="mf274-browser-showcase mf276-browser-showcase mf279-open-surface mf418-browser-entry mf418-browser-showcase mf471-showcase-entry mf473-showcase-entry" data-mode="showcase" role="button" tabindex="0" onclick="App.v279OpenCollectionSurface(event,\''+id+'\')" onkeydown="if(event.target===this&&(event.key===\'Enter\'||event.key===\' \')){event.preventDefault();App.v274OpenCollection(\''+id+'\')}">'+
    art+'<div class="mf418-browser-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection(\''+id+'\')">'+name+'</button>'+
    '<p>'+desc+'</p>'+date+v418CollectionBrowseFacts(collection)+v418CollectionBrowseProgress(collection)+'</div>'+v418CollectionBrowseActions(collection)+'</article>';
};
App.mf473MissingImage=mf473MissingImage;
window.MediaFlowV473=Object.freeze({version:473,maximum:5,posters:mf473FeaturedPosters,strip:mf473StripHtml});
MediaFlowRuntime.version=473;
