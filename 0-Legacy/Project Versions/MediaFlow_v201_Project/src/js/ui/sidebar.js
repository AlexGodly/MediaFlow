/* MediaFlow v201 source fragment
 * Desktop sidebar resizing
 * Original HTML lines 11193-11270.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   DESKTOP SIDEBAR RESIZING

   ============================================================ */

const SIDEBAR_WIDTH_KEY='mf_sidebar_width';
const SIDEBAR_MIN=190, SIDEBAR_MAX=380;
function applySidebarWidth(width){
  const w=Math.max(SIDEBAR_MIN,Math.min(SIDEBAR_MAX,Number(width)||236));
  document.documentElement.style.setProperty('--sidebar-width',w+'px');
  try{localStorage.setItem(SIDEBAR_WIDTH_KEY,String(w));}catch(e){}
  return w;
}
function loadSidebarWidth(){try{const v=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));if(v)applySidebarWidth(v);}catch(e){}}
let sidebarResizeState=null;
function beginSidebarResize(e){
  if(window.innerWidth<=860)return;
  e.preventDefault();
  e.stopPropagation();
  const handle=e.currentTarget||document.querySelector('.sidebar-resizer');
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar)return;
  sidebarResizeState={startX:e.clientX,startWidth:sidebar.getBoundingClientRect().width,handle};
  document.body.classList.add('sidebar-resizing');
  if(handle?.setPointerCapture && e.pointerId!=null){try{handle.setPointerCapture(e.pointerId);}catch(err){}}
  handle?.addEventListener('pointermove',onSidebarResize);
  handle?.addEventListener('pointerup',endSidebarResize,{once:true});
  handle?.addEventListener('pointercancel',endSidebarResize,{once:true});
}
function onSidebarResize(e){
  if(!sidebarResizeState)return;
  e.preventDefault();
  applySidebarWidth(sidebarResizeState.startWidth+(e.clientX-sidebarResizeState.startX));
}
function endSidebarResize(e){
  const state=sidebarResizeState;
  sidebarResizeState=null;
  document.body.classList.remove('sidebar-resizing');
  if(state?.handle){
    state.handle.removeEventListener('pointermove',onSidebarResize);
    try{if(e?.pointerId!=null && state.handle.releasePointerCapture)state.handle.releasePointerCapture(e.pointerId);}catch(err){}
  }
}
window.beginSidebarResize=beginSidebarResize;
window.onSidebarResize=onSidebarResize;
window.endSidebarResize=endSidebarResize;
function bindSidebarResizer(){
  const handle=document.querySelector('.sidebar-resizer');
  if(!handle||handle.dataset.bound==='1')return;
  handle.dataset.bound='1';
  handle.addEventListener('pointerdown',beginSidebarResize);
  handle.addEventListener('dblclick',()=>applySidebarWidth(236));
  handle.addEventListener('keydown',e=>{
    if(window.innerWidth<=860)return;
    const current=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'))||236;
    if(e.key==='ArrowLeft'){e.preventDefault();applySidebarWidth(current-12);}
    if(e.key==='ArrowRight'){e.preventDefault();applySidebarWidth(current+12);}
    if(e.key==='Home'){e.preventDefault();applySidebarWidth(SIDEBAR_MIN);}
    if(e.key==='End'){e.preventDefault();applySidebarWidth(SIDEBAR_MAX);}
  });
}
function autoFitSidebarToProfile(){
  if(window.innerWidth<=860)return;
  const sidebar=document.querySelector('.sidebar');
  const name=document.querySelector('.account-menu-email');
  if(!sidebar||!name)return;
  const text=String(name.textContent||'').trim();
  // Fit normal names/emails while keeping the sidebar compact. Long emails are capped.
  const target=Math.max(236,Math.min(SIDEBAR_MAX,Math.ceil(text.length*7.1+154)));
  const current=sidebar.getBoundingClientRect().width;
  if(current<target)applySidebarWidth(target);
}
loadSidebarWidth();
