/* MediaFlow v364 — Personal Order Lists / Collection Queue presentation parity.
 * One canonical Lists-per-row preference for both boards; Collection Queue
 * direct-title cover scale is stored with existing queue-view state.
 * Original titles, mixed queue tokens, assignment editing, and XP untouched.
 */
const V364_RELEASE=364;
const V364_DIRECT_SCALE_KEY='directQueueTitleCoverScale';
const v364QueueNormalizeBase=v288NormalizeQueueView;
v288NormalizeQueueView=function(raw){
  const value=v364QueueNormalizeBase.apply(this,arguments);
  const src=raw&&typeof raw==='object'?raw:{};
  value[V364_DIRECT_SCALE_KEY]=v289ClampCoverScale(src[V364_DIRECT_SCALE_KEY],100);
  return value;
};

function v364DirectCoverScale(view){
  return v289ClampCoverScale(view?.[V364_DIRECT_SCALE_KEY],100);
}
function v364ApplyDirectCoverScale(view){
  const pct=v364DirectCoverScale(view||v288EnsureQueueView());
  const root=document.documentElement;
  root.style.setProperty('--mf364-direct-cover-w',`${Math.round(40*pct/100*100)/100}px`);
}
const v364CoverVariablesBase=v289ApplyQueueCoverVars;
v289ApplyQueueCoverVars=function(view){
  const result=v364CoverVariablesBase.apply(this,arguments);
  v364ApplyDirectCoverScale(view);
  return result;
};

function v364DirectCoverControlHtml(){
  const pct=v364DirectCoverScale(v288EnsureQueueView());
  return `<label class="mf289-cover-control mf364-direct-cover-tool"><span><b>Collection Queue title covers</b><small>Direct titles in Collection Queues · Lists and Tabs.</small></span><span class="mf289-cover-inputs"><input id="mf364-direct-cover-range" type="range" min="25" max="400" step="5" value="${pct}" aria-label="Collection Queue title cover size" oninput="App.v364PreviewDirectCover(this.value)" onchange="App.v364SetDirectCover(this.value)"><input id="mf364-direct-cover-number" type="number" min="10" max="400" step="5" value="${pct}" aria-label="Collection Queue title cover size percentage" oninput="App.v364PreviewDirectCover(this.value)" onchange="App.v364SetDirectCover(this.value)"><em>%</em></span></label>`;
}
const v364ControlsBase=v288QueueControlsHtml;
v288QueueControlsHtml=function(){
  const markup=String(v364ControlsBase.apply(this,arguments));
  if(markup.includes('mf364-direct-cover-tool'))return markup;
  const target=markup.indexOf('<div class="mf288-control-group mf289-cover-group">');
  if(target<0)return markup;
  const end=markup.indexOf('</div>',target);
  return end<0?markup:markup.slice(0,end)+v364DirectCoverControlHtml()+markup.slice(end);
};
function v364PreviewDirectCover(value){
  const next=v289ClampCoverScale(value,v364DirectCoverScale(v288EnsureQueueView()));
  v364ApplyDirectCoverScale({[V364_DIRECT_SCALE_KEY]:next});
  const slider=document.getElementById('mf364-direct-cover-range');
  const number=document.getElementById('mf364-direct-cover-number');
  if(slider&&document.activeElement!==slider)slider.value=String(next);
  if(number&&document.activeElement!==number)number.value=String(next);
}
function v364SetDirectCover(value){
  const plan=v287EnsureOrderExtensions(),view=v288EnsureQueueView();
  const next=v289ClampCoverScale(value,v364DirectCoverScale(view));
  view[V364_DIRECT_SCALE_KEY]=next;
  plan.v288QueueView=view;plan.modifiedAt=Date.now();
  v364PreviewDirectCover(next);
  // Persist through the v363 serialized / debounced UI-save path.
  if(typeof v363PersistQueue==='function')v363PersistQueue();
  else Promise.resolve(saveState()).catch(err=>console.warn('[v364] Cover-size save failed',err));
}

/* The v363 multi-column layout only included regular category cards. Extend
   the *same* --mf363-columns setting to the Collection Queue board. Layout is
   intentionally CSS-driven so column selection requires no queue rerender. */
function v364ApplyWorkspaceClass(){
  const page=document.querySelector('#view-root .mf363-order-workspace');
  if(!page)return;
  const collection=page.querySelector('.mf288-collection-board');
  if(collection)collection.classList.add('mf364-collection-grid');
  page.classList.add('mf364-order-workspace');
  v364ApplyDirectCoverScale();
}
const v364EnhanceBase=v363EnhanceWorkspace;
v363EnhanceWorkspace=function(){
  const result=v364EnhanceBase.apply(this,arguments);
  v364ApplyWorkspaceClass();
  return result;
};
const v364SwitchMainBase=App.v345SelectMain;
App.v345SelectMain=function(){const result=v364SwitchMainBase.apply(this,arguments);v364ApplyDirectCoverScale();return result;};

Object.assign(App,{v364PreviewDirectCover,v364SetDirectCover});
try{requestAnimationFrame(v364ApplyWorkspaceClass);}catch(_){ }
MediaFlowRuntime.version=V364_RELEASE;
window.MediaFlowV364={version:364,features:['Consistent Lists and Collection Queue desktop grids using one Lists-per-row setting','Fixed title and Collection artwork frames','Independent Collection Queue direct-title cover size in Queue Tools','Responsive collection card and title layout']};
