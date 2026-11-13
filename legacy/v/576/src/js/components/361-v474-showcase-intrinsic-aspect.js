/* MediaFlow v474 — Collections > Showcase: intrinsic poster proportions.
 * Every hover target is sized from the cover's NATURAL width / height rather
 * than using a fixed 2.3x expansion. Uses only browser layout and Image data.
 * No writes to Library, Collections, Supabase, Settings, History or XP.
 */
const MF474_MIN_PEEK=5;
let MF474_REFRESH_PENDING=false;
let MF474_OBSERVER=null;
function mf474Measure(poster){
  if(!poster?.isConnected)return null;
  const strip=poster.closest('.mf474-showcase-strip');
  if(!strip)return null;
  const cover=poster.querySelector('.mf473-poster-crop');
  const sourceWidth=Number(cover?.naturalWidth);
  const sourceHeight=Number(cover?.naturalHeight);
  const valid=Number.isFinite(sourceWidth)&&Number.isFinite(sourceHeight)&&sourceWidth>0&&sourceHeight>0;
  const ratio=valid?sourceWidth/sourceHeight:2/3;
  const bounds=poster.getBoundingClientRect();
  const rowWidth=strip.clientWidth;
  const rowHeight=bounds.height;
  if(rowWidth<1||rowHeight<1)return null;
  const peers=Math.max(0,strip.querySelectorAll('.mf474-poster').length-1);
  const css=getComputedStyle(strip);
  const contentWidth=Math.max(1,rowWidth-(parseFloat(css.paddingLeft)||0)-(parseFloat(css.paddingRight)||0));
  const readablePeek=peers*MF474_MIN_PEEK;
  const maxWidth=Math.max(16,contentWidth-readablePeek);
  // Match the real pixels needed to display the complete image at the
  // showcase's current height. No cover-specific "portrait" assumptions.
  const target=Math.min(maxWidth,Math.max(16,rowHeight*ratio));
  const px=Math.round(target*100)/100;
  poster.style.setProperty('--mf474-native-width',px+'px');
  poster.dataset.mf474Aspect=ratio.toFixed(4);
  poster.dataset.mf474Source=valid?'natural':'placeholder';
  return px;
}
function mf474ImageReady(img){
  mf474Measure(img?.closest?.('.mf474-poster'));
}
function mf474RefreshAll(){
  document.querySelectorAll('.mf274-collections-browser .mf474-poster').forEach(mf474Measure);
  if(typeof ResizeObserver==='undefined')return;
  if(!MF474_OBSERVER)MF474_OBSERVER=new ResizeObserver(entries=>{
    for(const entry of entries){
      entry.target.querySelectorAll('.mf474-poster').forEach(mf474Measure);
    }
  });
  MF474_OBSERVER.disconnect();
  document.querySelectorAll('.mf274-collections-browser .mf474-showcase-frame').forEach(frame=>MF474_OBSERVER.observe(frame));
}
function mf474ScheduleRefresh(){
  if(MF474_REFRESH_PENDING)return;
  MF474_REFRESH_PENDING=true;
  requestAnimationFrame(()=>{MF474_REFRESH_PENDING=false;mf474RefreshAll();});
}
// The v473 HTML generator already enforces the strict five-poster preview.
// Add only ratio measurement hooks; preserve missing-cover behavior, alt
// labels, collection actions, per-cover shadows and all other view modes.
const mf474PosterBase=mf473PosterHtml;
mf473PosterHtml=function(poster,index){
  return mf474PosterBase(poster,index)
    .replace('class="mf471-showcase-poster mf473-showcase-poster',
      'class="mf471-showcase-poster mf473-showcase-poster mf474-poster')
    .replace('role="listitem"', 'role="listitem" onmouseenter="App.mf474Measure(this)" onpointerdown="App.mf474Measure(this)"')
    .replace('class="mf473-poster-crop"',
      'class="mf473-poster-crop" onload="App.mf474ImageReady(this)"');
};
const mf474BrowserBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(collection,mode){
  const html=mf474BrowserBase.apply(this,arguments);
  if(mode!=='showcase')return html;
  mf474ScheduleRefresh();
  return html
    .replace('mf473-showcase-entry"','mf473-showcase-entry mf474-showcase-entry"')
    .replace('mf473-showcase-frame"','mf473-showcase-frame mf474-showcase-frame"')
    .replace('mf473-showcase-strip"','mf473-showcase-strip mf474-showcase-strip"');
};
Object.assign(App,{mf474Measure,mf474ImageReady,mf474RefreshAll});
window.addEventListener('resize',mf474ScheduleRefresh,{passive:true});
window.MediaFlowV474=Object.freeze({version:474,maxCovers:5,measure:mf474Measure,refresh:mf474RefreshAll});
MediaFlowRuntime.version=474;
