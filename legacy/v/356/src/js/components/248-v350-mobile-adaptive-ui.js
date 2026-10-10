/* MediaFlow v350 — mobile-only adaptive presentation.
 * No user/library/cloud state is changed.  The transient open/closed preferences
 * live in this page session only; desktop never receives new controls or markup.
 */
const V350_RELEASE=350;
const V350_WIDTH=window.matchMedia('(max-width: 1023px)');
const V350_PANEL_STATE={library:false,order:false,collections:false,collectionDetail:false,history:false};
const V350_ICONS={
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h9m5 0h2M4 17h2m5 0h9"/><circle cx="15.5" cy="7" r="2.5"/><circle cx="8.5" cy="17" r="2.5"/></svg>',
  filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/></svg>',
  chevron:'<svg class="mf350-toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
};
function v350ToggleHtml(scope,title,icon='sliders'){
  const opened=!!V350_PANEL_STATE[scope];
  return `${V350_ICONS[icon]||V350_ICONS.sliders}<span>${title}</span><span class="mf350-toggle-state">${opened?'Hide':'Show'}</span>${V350_ICONS.chevron}`;
}
function v350Control(scope,title,icon='sliders'){
  const button=document.createElement('button');
  button.type='button';button.className='mf350-mobile-toggle';
  button.dataset.mf350Panel=scope;button.dataset.v225Iconified='1';
  button.setAttribute('aria-expanded',String(!!V350_PANEL_STATE[scope]));
  button.innerHTML=v350ToggleHtml(scope,title,icon);
  button.addEventListener('click',()=>{
    V350_PANEL_STATE[scope]=!V350_PANEL_STATE[scope];
    v350EnhanceMobile();
  });
  return button;
}
function v350EnsureToggle(host,scope,title,icon='sliders',placement='append'){
  if(!host)return null;
  let button=host.querySelector(`:scope > .mf350-mobile-toggle[data-mf350-panel="${scope}"]`);
  if(!button){button=v350Control(scope,title,icon);if(placement==='prepend')host.prepend(button);else host.append(button);}
  const opened=!!V350_PANEL_STATE[scope];
  button.setAttribute('aria-expanded',String(opened));button.innerHTML=v350ToggleHtml(scope,title,icon);
  return button;
}
function v350EnhanceLibrary(root){
  const tools=root.querySelector('.mf262-library-tools');
  if(!tools)return;
  const head=tools.querySelector('.mf262-library-tools-head');
  v350EnsureToggle(head,'library','Library tools');
  tools.classList.toggle('mf350-panel-closed',!V350_PANEL_STATE.library);
  tools.classList.toggle('mf350-panel-open',V350_PANEL_STATE.library);
  // The original desktop collapse preference is deliberately not written.
}
function v350EnhanceOrder(root){
  const page=root.querySelector('.v138-order-view');if(!page)return;
  const layout=page.querySelector('.mf345-layout-switch');
  let anchor=layout||page.querySelector('.view-head');if(!anchor)return;
  let container=page.querySelector('.mf350-order-toggle-row');
  if(!container){container=document.createElement('div');container.className='mf350-order-toggle-row';anchor.insertAdjacentElement('afterend',container);}
  v350EnsureToggle(container,'order','View & queue options');
  page.classList.toggle('mf350-order-closed',!V350_PANEL_STATE.order);
}
function v350EnhanceHistory(root){
  const page=root.querySelector('.v260-history-page');if(!page)return;
  const tabs=page.querySelector('.v260-history-tabs');if(!tabs)return;
  let host=page.querySelector('.mf350-history-toggle-row');
  if(!host){host=document.createElement('div');host.className='mf350-history-toggle-row';tabs.insertAdjacentElement('afterend',host);}
  v350EnsureToggle(host,'history','History filters & tools','filter');
  page.classList.toggle('mf350-history-closed',!V350_PANEL_STATE.history);
}
function v350EnhanceCollectionBrowser(root){
  const page=root.querySelector('.mf274-collections-browser');if(!page)return;
  const bar=page.querySelector('.mf274-browser-toolbar');if(!bar)return;
  let extra=bar.querySelector(':scope > .mf350-collection-extras');
  if(!extra){
    extra=document.createElement('div');extra.className='mf350-collection-extras';
    const toMove=[...bar.children].filter(el=>!el.matches('input[type="search"],.hint,[data-mf276-collection-count],.mf350-mobile-toggle'));
    // Moving live controls keeps their original handlers, values and action APIs.
    for(const el of toMove)extra.appendChild(el);
    bar.appendChild(extra);
  }
  let toggle=bar.querySelector(':scope > .mf350-mobile-toggle[data-mf350-panel="collections"]');
  if(!toggle){toggle=v350Control('collections','Filters & views','filter');bar.insertBefore(toggle,extra);}
  toggle.setAttribute('aria-expanded',String(V350_PANEL_STATE.collections));toggle.innerHTML=v350ToggleHtml('collections','Filters & views','filter');
  page.classList.toggle('mf350-collections-closed',!V350_PANEL_STATE.collections);
}
function v350EnhanceCollectionDetail(root){
  const tools=root.querySelector('.mf274-collection-tools');if(!tools)return;
  const head=tools.querySelector('.mf274-tools-head');
  v350EnsureToggle(head,'collectionDetail','Collection tools');
  tools.classList.toggle('mf350-detail-closed',!V350_PANEL_STATE.collectionDetail);
}
function v350EnhanceMobile(){
  if(!V350_WIDTH.matches)return;
  const root=document.getElementById('view-root');if(!root)return;
  try{
    v350EnhanceLibrary(root);
    v350EnhanceOrder(root);
    v350EnhanceHistory(root);
    v350EnhanceCollectionBrowser(root);
    v350EnhanceCollectionDetail(root);
  }catch(err){console.error('MediaFlow mobile adaptive UI enhancement:',err);}
}
let V350_ENHANCE_PENDING=false;
function v350ScheduleMobile(){
  if(!V350_WIDTH.matches||V350_ENHANCE_PENDING)return;
  V350_ENHANCE_PENDING=true;
  requestAnimationFrame(()=>{V350_ENHANCE_PENDING=false;v350EnhanceMobile();});
}
const v350RenderViewBase=renderView;
renderView=function(){const result=v350RenderViewBase.apply(this,arguments);v350ScheduleMobile();return result;};
const v350RenderBase=render;
render=function(){const result=v350RenderBase.apply(this,arguments);v350ScheduleMobile();return result;};
function v350RestoreDesktop(){
  const root=document.getElementById('view-root');if(!root)return;
  // On desktop, undo all mobile-only DOM moves, not just their mobile styles.
  for(const bar of root.querySelectorAll('.mf274-collections-browser .mf274-browser-toolbar')){
    const extra=bar.querySelector(':scope > .mf350-collection-extras');
    if(extra){while(extra.firstElementChild)bar.insertBefore(extra.firstElementChild,extra);extra.remove();}
  }
  root.querySelectorAll('.mf350-order-toggle-row,.mf350-history-toggle-row').forEach(el=>el.remove());
  root.querySelectorAll('.mf350-mobile-toggle').forEach(el=>el.remove());
  root.querySelectorAll('.mf350-panel-closed,.mf350-panel-open,.mf350-order-closed,.mf350-history-closed,.mf350-collections-closed,.mf350-detail-closed').forEach(el=>{
    el.classList.remove('mf350-panel-closed','mf350-panel-open','mf350-order-closed','mf350-history-closed','mf350-collections-closed','mf350-detail-closed');
  });
}
try{V350_WIDTH.addEventListener('change',()=>{if(V350_WIDTH.matches)v350ScheduleMobile();else v350RestoreDesktop();});}catch(_){}
try{MediaFlowRuntime.registerPageEnhancer('library',v350ScheduleMobile);}catch(_){}
Object.assign(App,{v350MobileEnhance:v350EnhanceMobile});
window.MediaFlowV350Mobile={version:350,enhance:v350EnhanceMobile,panels:V350_PANEL_STATE,breakpoint:1023};
MediaFlowRuntime.version=V350_RELEASE;
v350ScheduleMobile();
