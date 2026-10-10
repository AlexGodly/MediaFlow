/* MediaFlow v349 — History should begin at the top when entered from another page.
   This is a navigation-only correction: internal History tab, filter and week
   pagination interactions retain their existing scroll behavior. */
const V349_HISTORY_RUNTIME=349;
function v349HistoryScrollTop(){
  if(String(S.view||'')!=='history')return;
  // A few themes use an element scroller rather than the document viewport.
  for(const element of [
    document.scrollingElement,document.documentElement,document.body,
    document.querySelector('.main'),document.querySelector('.main-content'),
    document.querySelector('.content')
  ]){
    if(element&&typeof element.scrollTop==='number')element.scrollTop=0;
  }
  try{window.scrollTo({top:0,left:0,behavior:'instant'});}catch(_){window.scrollTo(0,0);}
}
function v349HistoryScrollAfterMount(){
  if(String(S.view||'')!=='history')return;
  v349HistoryScrollTop();
  requestAnimationFrame(()=>{
    if(S.view!=='history')return;
    v349HistoryScrollTop();
    requestAnimationFrame(()=>{if(S.view==='history')v349HistoryScrollTop();});
  });
}
let V349_PREVIOUS_RENDERED_VIEW=null;
const v349RenderViewBase=renderView;
renderView=function(){
  const view=String(S.view||'');
  const entering=view==='history'&&V349_PREVIOUS_RENDERED_VIEW!=='history';
  if(entering)v349HistoryScrollTop();
  const result=v349RenderViewBase.apply(this,arguments);
  V349_PREVIOUS_RENDERED_VIEW=view;
  if(entering)v349HistoryScrollAfterMount();
  return result;
};
const v349SetViewBase=App.setView;
App.setView=function(view){
  const entering=String(view)==='history'&&String(S.view||'')!=='history';
  const result=v349SetViewBase.apply(this,arguments);
  if(entering&&S.view==='history')v349HistoryScrollAfterMount();
  return result;
};
const v349MobileNavBase=App.mobileNav;
App.mobileNav=function(view){
  const entering=String(view)==='history'&&String(S.view||'')!=='history';
  const result=v349MobileNavBase.apply(this,arguments);
  if(entering&&S.view==='history')v349HistoryScrollAfterMount();
  return result;
};
MediaFlowRuntime.version=V349_HISTORY_RUNTIME;
window.MediaFlowV349History={version:349};
