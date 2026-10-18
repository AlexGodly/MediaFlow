/* ============================================================
   MediaFlow v219 — Runtime Extension Foundation
   ------------------------------------------------------------
   New MediaFlow releases register active page renderers here instead of
   appending patches after the legacy application closure. Runtime extension
   files are injected by scripts/build.py BEFORE 999-close-app.js.
   ============================================================ */
const V219_RUNTIME_VERSION=219;
const V219_PAGE_RENDERERS=new Map();
const V219_PAGE_ENHANCERS=new Map();

function v219RegisterPageRenderer(view,renderer){
  const key=String(view||'').trim();
  if(!key||typeof renderer!=='function')throw new Error('MediaFlowRuntime.registerPageRenderer requires a view id and renderer function.');
  V219_PAGE_RENDERERS.set(key,renderer);
  return renderer;
}
function v219RegisterPageEnhancer(view,enhancer){
  const key=String(view||'').trim();
  if(!key||typeof enhancer!=='function')throw new Error('MediaFlowRuntime.registerPageEnhancer requires a view id and function.');
  const list=V219_PAGE_ENHANCERS.get(key)||[];
  list.push(enhancer);
  V219_PAGE_ENHANCERS.set(key,list);
  return enhancer;
}
function v219RunPageEnhancers(view){
  const list=V219_PAGE_ENHANCERS.get(String(view||''))||[];
  for(const fn of list){
    try{fn();}catch(err){console.error(`MediaFlow v219: ${view} page enhancer failed`,err);}
  }
}

const v219LegacyRenderView=renderView;
renderView=function(){
  const view=String(S.view||'');
  const renderer=V219_PAGE_RENDERERS.get(view);
  if(!renderer)return v219LegacyRenderView.apply(this,arguments);
  const root=document.getElementById('view-root');
  if(!root)return;
  let html='';
  try{
    html=renderer({view,state:S,settings:S.settings,defaults:DEFAULT_SETTINGS,app:App,runtime:MediaFlowRuntime})||'';
  }catch(err){
    console.error(`MediaFlow v219: registered renderer for ${view} failed; using legacy renderer`,err);
    return v219LegacyRenderView.apply(this,arguments);
  }
  root.innerHTML=`<div class="fade-in">${html}</div>`;
  // v367: Settings Center 2.0 must be the first visible Settings UI.
  // A timer lets the browser paint the legacy v221 page before the v365/v366
  // enhancers move its live controls into Settings Center. Complete that work
  // in the SAME JavaScript task as the HTML insertion, before the next paint.
  // Leave the established asynchronous schedule unchanged on other pages.
  if(view==='settings')v219RunPageEnhancers(view);
  else setTimeout(()=>v219RunPageEnhancers(view),0);
};

const MediaFlowRuntime={
  version:V219_RUNTIME_VERSION,
  registerPageRenderer:v219RegisterPageRenderer,
  registerPageEnhancer:v219RegisterPageEnhancer,
  hasPageRenderer(view){return V219_PAGE_RENDERERS.has(String(view||''));},
  getRegisteredPages(){return [...V219_PAGE_RENDERERS.keys()];},
  getCurrentView(){return String(S.view||'');},
  requestRender(){return render();},
  getSettings(){return JSON.parse(JSON.stringify(S.settings||{}));},
  getDefaultSettings(){return JSON.parse(JSON.stringify(DEFAULT_SETTINGS||{}));}
};
window.MediaFlowRuntime=MediaFlowRuntime;
