/* MediaFlow v387 — Added Titles ordering scroll/focus stability.
 * All reordering remains view-only: do not touch entry identities, draft
 * payloads, XP, History or cloud schemas. The v373 reorder implementation
 * now avoids moving DOM nodes that are already in the right place.
 */
const V387_RELEASE=387;
let V387_SCROLL_REVISION=0;
// Mouse focus follows a button when its whole card changes DOM position;
// prevent that browser-initiated scroll. Keyboard focus is unaffected.
document.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return;
  if(event.target?.closest?.('.mf373-logging .mf373-arrows button'))event.preventDefault();
},true);
const V387_SCROLL_GUARD={lastUserScroll:0};
// Avoid replaying a stale position after someone explicitly starts scrolling.
for(const type of ['wheel','touchmove']){
  document.addEventListener(type,()=>{V387_SCROLL_GUARD.lastUserScroll=performance.now();},{capture:true,passive:true});
}
function v387ScrollNodes(form){
  const seen=new Set(),nodes=[];
  const add=el=>{
    if(!el||seen.has(el)||!el.isConnected)return;
    seen.add(el);
    const style=getComputedStyle(el);
    if(/auto|scroll|overlay/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+1)nodes.push(el);
  };
  // Include the actual scrolling shell, not merely the Added Titles list.
  for(let el=form;el&&el!==document.documentElement;el=el.parentElement)add(el);
  for(const el of form.querySelectorAll('.v370-panels,.v369-panels,.v239-logged-title-list,[data-scroll-container]'))add(el);
  return nodes;
}
function v387CaptureLoggingScroll(){
  const form=document.querySelector('.log-form');
  if(!form||!form.isConnected||!S.logDraft)return null;
  const focused=document.activeElement;
  let selection=null;
  if(focused?.matches?.('.mf373-position-label input')&&focused.isConnected){
    selection={element:focused};
    try{selection.start=focused.selectionStart;selection.end=focused.selectionEnd;}catch(_){ }
  }
  return {form,top:window.scrollY,left:window.scrollX,
    containers:v387ScrollNodes(form).map(el=>({el,top:el.scrollTop,left:el.scrollLeft})),
    focus:selection,at:performance.now(),userScrollAt:V387_SCROLL_GUARD.lastUserScroll};
}
function v387RestoreLoggingScroll(snap,withFocus=false){
  if(!snap||!snap.form.isConnected)return;
  for(const {el,top,left} of snap.containers){
    if(el.isConnected){if(el.scrollTop!==top)el.scrollTop=top;if(el.scrollLeft!==left)el.scrollLeft=left;}
  }
  if(window.scrollY!==snap.top||window.scrollX!==snap.left)window.scrollTo({left:snap.left,top:snap.top,behavior:'instant'});
  // Browser focus can be lost when the source row is repositioned. Restore it
  // without calling scrollIntoView or forcing the page to follow the input.
  if(withFocus&&snap.focus?.element?.isConnected&&document.activeElement!==snap.focus.element){
    try{snap.focus.element.focus({preventScroll:true});}catch(_){ }
  }
}
function v387HoldLoggingViewport(fn){
  const snap=v387CaptureLoggingScroll();
  if(!snap)return fn();
  const revision=++V387_SCROLL_REVISION;
  try{return fn();}
  finally{
    v387RestoreLoggingScroll(snap,true);
    // Two frames cover focus/scroll anchoring, the original v380 sort-icon
    // pass, and immediate queued refreshes; never run a persistent timer.
    const restore=()=>{
      if(revision!==V387_SCROLL_REVISION||V387_SCROLL_GUARD.lastUserScroll>snap.userScrollAt)return;
      v387RestoreLoggingScroll(snap);
    };
    requestAnimationFrame(()=>{restore();requestAnimationFrame(restore);});
  }
}
// Every sorting pathway (drag/drop, arrows, position input, sort/direction,
// shuffle and an invalid numeric position) goes through this DOM arranger.
// Guard at the shared source instead of patching individual toolbar buttons.
const v387ApplyOrderBase=v373ApplyDOMOrder;
v373ApplyDOMOrder=function(){
  // The Logging renderer also sorts detached HTML before inserting it into the
  // page. Never restore viewport position for those off-DOM preparation passes.
  if(!v373ActiveList(arguments[0])?.isConnected)return v387ApplyOrderBase.apply(this,arguments);
  return v387HoldLoggingViewport(()=>v387ApplyOrderBase.apply(this,arguments));
};
// A full render is unusual during ordering but can be scheduled by legacy
// handlers. Only guard it while an order operation is in progress, without
// interfering with normal navigation or a user's deliberate scrolling.
let V387_ORDER_IN_PROGRESS=0;
const v387PersistBase=v373Persist;
v373Persist=function(){
  return v387HoldLoggingViewport(()=>{
    V387_ORDER_IN_PROGRESS++;
    try{return v387PersistBase.apply(this,arguments);}
    finally{V387_ORDER_IN_PROGRESS--;}
  });
};
const v387RenderBase=render;
render=function(){
  if(!V387_ORDER_IN_PROGRESS)return v387RenderBase.apply(this,arguments);
  return v387HoldLoggingViewport(()=>v387RenderBase.apply(this,arguments));
};
window.MediaFlowV387={version:V387_RELEASE,features:['Logging order scroll preservation','Minimal added-title DOM movement','Numeric focus preservation','No extra scroll polling']};
MediaFlowRuntime.version=V387_RELEASE;
