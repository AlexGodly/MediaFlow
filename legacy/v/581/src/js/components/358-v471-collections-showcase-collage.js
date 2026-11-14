/* MediaFlow v471 — Collections > Showcase ONLY.
 * An unrestricted, responsive edge-to-edge poster strip. No account writes.
 * Other Collections display modes and the collection detail page are untouched.
 */
const MF471_VERSION=471;
function mf471Posters(c){
  const own=v274Text(c?.coverUrl);
  const found=v274CollectionItems(c);
  const posters=[];
  if(own)posters.push({url:own,title:String(c?.title||'Collection')+' · featured cover',color:'',icon:''});
  for(const item of found){
    const source=typeof v200TitleCoverSource==='function'?v200TitleCoverSource(item):null;
    const url=v274Text(source?.url||v274CoverUrl(item));
    const cat=v274Cat(item);
    // The manually chosen Collection cover is a featured image, not a reason
    // to hide its other members. Avoid an identical first image duplicate.
    if(own&&url===own)continue;
    posters.push({url,title:v274SafeTitle(item),color:cat?.color||'var(--flow)',
      icon:cat?v144CategoryIconHtml(cat):'<span aria-hidden="true">◇</span>'});
  }
  return posters;
}
function mf471StripHtml(c){
  const posters=mf471Posters(c);
  if(!posters.length)return '<div class="mf471-showcase-empty" aria-label="Collection contains no covers"><span aria-hidden="true">◇</span></div>';
  const count=posters.length;
  const slides=posters.map((poster,index)=>{
    const label=escapeHtml(String(poster.title||'Collection title'));
    const fallback='<span class="mf471-showcase-fallback" style="--mf471-category:'+escapeHtml(poster.color||'var(--flow)')+'">'+(poster.icon||'◇')+'</span>';
    return '<span class="mf471-showcase-poster'+(poster.url?'':' mf471-no-cover')+'" role="listitem" aria-label="'+label+'" title="'+label+'" data-cover-index="'+index+'">'+
      (poster.url?'<img src="'+escapeHtml(poster.url)+'" loading="lazy" decoding="async" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false">'+
        '<span class="mf471-showcase-fallback" hidden style="--mf471-category:'+escapeHtml(poster.color||'var(--flow)')+'">'+(poster.icon||'◇')+'</span>':fallback)+
      '</span>';
  }).join('');
  return '<div class="mf471-showcase-strip" role="list" tabindex="0" style="--mf471-count:'+count+'" aria-label="Collection poster showcase, '+count+' covers. Use Left and Right arrow keys or swipe to explore." onscroll="App.mf471SyncShowcase(this.closest(\'.mf471-showcase-frame\'))" onkeydown="App.mf471Key(event)">'+slides+'</div>';
}
const mf471BrowserCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(c,mode){
  if(mode!=='showcase')return mf471BrowserCardBase.apply(this,arguments);
  const id=escapeHtml(String(c.id)),name=escapeHtml(c.title),desc=escapeHtml(c.description||'No description yet.');
  const dates='<div class="mf418-dates">Created '+new Date(c.createdAt).toLocaleDateString()+
    ' · Updated '+new Date(c.updatedAt).toLocaleDateString()+'</div>';
  const coverCount=mf471Posters(c).length;
  const art='<div class="mf274-showcase-cover mf276-showcase-cover mf471-showcase-frame" data-cover-count="'+coverCount+'"'+
    ' onpointerdown="App.mf471PointerStart(event)" onpointermove="App.mf471PointerMove(event)" onpointerup="App.mf471PointerEnd(event)" onpointercancel="App.mf471PointerEnd(event)" onclick="App.mf471PreviewClick(event)">'+
    mf471StripHtml(c)+
    '<button type="button" class="mf471-showcase-arrow mf471-prev" aria-label="Previous collection posters" onclick="App.mf471Scroll(event,-1)">&#8249;</button>'+
    '<button type="button" class="mf471-showcase-arrow mf471-next" aria-label="Next collection posters" onclick="App.mf471Scroll(event,1)">&#8250;</button>'+
    '</div>';
  mf471ScheduleSync();
  // Preserve the established v418 card content, actions, progress and opening.
  return '<article class="mf274-browser-showcase mf276-browser-showcase mf279-open-surface mf418-browser-entry mf418-browser-showcase mf471-showcase-entry" data-mode="showcase" role="button" tabindex="0" onclick="App.v279OpenCollectionSurface(event,\''+id+'\')" onkeydown="if(event.target===this&&(event.key===\'Enter\'||event.key===\' \')){event.preventDefault();App.v274OpenCollection(\''+id+'\')}">'+
    art+'<div class="mf418-browser-copy"><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection(\''+id+'\')">'+name+'</button>'+
    '<p>'+desc+'</p>'+dates+v418CollectionBrowseFacts(c)+v418CollectionBrowseProgress(c)+'</div>'+v418CollectionBrowseActions(c)+'</article>';
};
function mf471SyncShowcase(frame){
  if(!frame?.isConnected)return;
  const strip=frame.querySelector('.mf471-showcase-strip');
  if(!strip)return;
  const over=strip.scrollWidth>strip.clientWidth+2;
  frame.classList.toggle('mf471-can-scroll',over);
  const left=strip.scrollLeft<=2, right=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-2;
  const prev=frame.querySelector('.mf471-prev'),next=frame.querySelector('.mf471-next');
  if(prev)prev.disabled=!over||left;
  if(next)next.disabled=!over||right;
}
function mf471SyncAll(){
  document.querySelectorAll('.mf274-collections-browser .mf471-showcase-frame').forEach(mf471SyncShowcase);
}
let MF471_SYNC_PENDING=false;
function mf471ScheduleSync(){
  if(MF471_SYNC_PENDING)return;
  MF471_SYNC_PENDING=true;
  requestAnimationFrame(()=>{MF471_SYNC_PENDING=false;mf471SyncAll();mf471Observe();});
}
let MF471_RESIZE_OBSERVER=null;
function mf471Observe(){
  if(typeof ResizeObserver==='undefined')return;
  if(!MF471_RESIZE_OBSERVER)MF471_RESIZE_OBSERVER=new ResizeObserver(mf471SyncAll);
  // Observe the active gallery widths, not unrelated application surfaces.
  MF471_RESIZE_OBSERVER.disconnect();
  document.querySelectorAll('.mf274-collections-browser .mf471-showcase-strip').forEach(node=>MF471_RESIZE_OBSERVER.observe(node));
}
function mf471Scroll(event,direction){
  event.preventDefault();event.stopPropagation();
  const strip=event.currentTarget?.closest('.mf471-showcase-frame')?.querySelector('.mf471-showcase-strip');
  if(strip)strip.scrollBy({left:Math.round(strip.clientWidth*.78)*direction,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});
}
function mf471Key(event){
  if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
  event.preventDefault();event.stopPropagation();
  const strip=event.currentTarget;
  strip.scrollBy({left:(event.key==='ArrowRight'?1:-1)*Math.max(48,Math.round(strip.clientWidth*.65)),
    behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});
}
function mf471PointerStart(event){
  if(event.target?.closest?.('.mf471-showcase-arrow'))return;
  const frame=event.currentTarget;
  frame.__mf471Gesture={x:event.clientX,y:event.clientY,lastX:event.clientX,moved:false,
    kind:event.pointerType};
}
function mf471PointerMove(event){
  const frame=event.currentTarget,g=frame.__mf471Gesture;
  if(!g||((event.buttons&1)===0&&g.kind==='mouse'))return;
  const dx=event.clientX-g.x,dy=event.clientY-g.y;
  if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy))g.moved=true;
  if(g.kind==='mouse'&&g.moved){
    const strip=frame.querySelector('.mf471-showcase-strip');
    if(strip){strip.scrollLeft+=g.lastX-event.clientX;event.preventDefault();}
  }
  g.lastX=event.clientX;
}
function mf471PointerEnd(event){
  const frame=event.currentTarget,g=frame.__mf471Gesture;
  if(!g)return;
  if(g.moved)setTimeout(()=>{if(frame.__mf471Gesture===g)delete frame.__mf471Gesture;},350);
  else delete frame.__mf471Gesture;
}
function mf471PreviewClick(event){
  const frame=event.currentTarget,g=frame.__mf471Gesture;
  if(g?.moved){event.preventDefault();event.stopPropagation();delete frame.__mf471Gesture;}
}
Object.assign(App,{mf471SyncShowcase,mf471Scroll,mf471Key,mf471PointerStart,mf471PointerMove,
  mf471PointerEnd,mf471PreviewClick});
window.addEventListener('resize',mf471ScheduleSync,{passive:true});
window.MediaFlowV471=Object.freeze({version:471,posters:mf471Posters,strip:mf471StripHtml,sync:mf471SyncAll});
MediaFlowRuntime.version=MF471_VERSION;
