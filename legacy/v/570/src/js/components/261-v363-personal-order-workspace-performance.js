/* MediaFlow v363 — Personal Order workspace parity and responsive organization.
 * Move canonical DOM controls rather than cloning them; all actions still use
 * original orderPlan, Collection assignment, XP, sync and backup handlers. */
const V363_RELEASE=363;
const V363_BREAKPOINT=window.matchMedia('(max-width: 1023px)');
const V363_SESSION={advanced:false,titleFilters:false,queueFilter:{categories:false,collections:false}};
let V363_ENHANCE_PENDING=false;
function v363Prefs(){
  const cfg=S.settings||(S.settings={}),raw=cfg.v363PersonalOrder||{};
  const columns=[1,2,3,4].includes(Number(raw.listColumns))?Number(raw.listColumns):2;
  if(!cfg.v363PersonalOrder||cfg.v363PersonalOrder.listColumns!==columns)cfg.v363PersonalOrder={...raw,listColumns:columns};
  return cfg.v363PersonalOrder;
}
function v363SaveVisualPrefs(){if(typeof v358SaveLater==='function')v358SaveLater();else try{persistSettings();}catch(_){ }}
function v363Move(node,container){
  if(!node||!container||node.parentElement===container)return;
  if(!node._mf363Home){node._mf363Home=document.createComment('v363 control origin');node.parentNode?.insertBefore(node._mf363Home,node);}
  container.appendChild(node);
}
function v363Restore(node){
  if(node?._mf363Home?.isConnected&&node.parentElement!==node._mf363Home.parentNode)node._mf363Home.parentNode.insertBefore(node,node._mf363Home);
}
function v363SetColumns(raw){
  const n=Number(raw);if(![1,2,3,4].includes(n))return;
  v363Prefs().listColumns=n;v363SaveVisualPrefs();
  const page=document.querySelector('#view-root .v138-order-view');
  if(page){page.style.setProperty('--mf363-columns',n);page.querySelectorAll('.mf363-columns-button').forEach(btn=>{btn.classList.toggle('active',Number(btn.dataset.columns)===n);btn.setAttribute('aria-pressed',String(Number(btn.dataset.columns)===n));});}
}
function v363ColumnsHtml(){const selected=v363Prefs().listColumns;
  return `<div class="mf363-columns-control" role="group" aria-label="Category lists per row"><span>Lists per row</span><div>${[1,2,3,4].map(n=>`<button type="button" class="mf363-columns-button ${selected===n?'active':''}" aria-pressed="${selected===n}" data-columns="${n}" onclick="App.v363SetColumns(${n})">${n}</button>`).join('')}</div></div>`;
}
function v363EnhanceWorkspace(){
  const page=document.querySelector('#view-root .v138-order-view');
  if(!page||String(S.view||'')!=='order')return;
  const tabs=v288EnsureQueueView().layoutMode==='tabs';
  page.classList.add('mf363-order-workspace');
  page.classList.toggle('mf363-tabs',tabs);page.classList.toggle('mf363-lists',!tabs);
  page.classList.toggle('mf363-tools-expanded',V363_SESSION.advanced);
  page.style.setProperty('--mf363-columns',v363Prefs().listColumns);
  const bar=page.querySelector('.mf354-quickbar');if(!bar)return;
  let control=bar.querySelector('.mf363-primary-actions');
  if(!control){control=document.createElement('div');control.className='mf363-primary-actions';bar.append(control);}
  const quick=bar.querySelector('.mf354-quick-switch');
  if(quick){
    v363Move(quick,control);
    const toggle=quick.querySelector('.mf354-advanced-access');
    if(toggle){toggle.setAttribute('onclick','App.v363ToggleTools()');toggle.setAttribute('aria-expanded',String(V363_SESSION.advanced));
      const label=toggle.querySelector('.mf357-btn-label');if(label)label.textContent=V363_SESSION.advanced?'Hide queue tools':'Show queue tools';
      else toggle.textContent=V363_SESSION.advanced?'Hide queue tools':'Show queue tools';}
  }
  let columns=control.querySelector('.mf363-columns-control');
  if(!columns){const host=document.createElement('div');host.innerHTML=v363ColumnsHtml();columns=host.firstElementChild;control.insertBefore(columns,quick||null);}
  if(!tabs){
    const view=page.querySelector('.v138-order-toolbar .v138-order-switch');
    if(view)v363Move(view,control);
  }
  let tools=page.querySelector(':scope > .mf363-queue-tools');
  if(!tools){tools=document.createElement('section');tools.className='mf363-queue-tools';tools.setAttribute('aria-label','Personal Order queue tools');
    tools.innerHTML='<div class="mf363-advanced-head"><b>Queue Tools</b><span>Display, pagination and Collection queue options</span></div><div class="mf363-advanced-grid"></div>';
    bar.insertAdjacentElement('afterend',tools);
  }
  const advanced=tools.querySelector('.mf363-advanced-grid');
  const old=page.querySelector('.mf288-queue-controls');
  if(old){old.classList.add('mf363-queue-display');v363Move(old,advanced);}
  const paged=page.querySelector('.mf346-queue-controls');
  if(paged){paged.classList.add('mf363-queue-pagination');v363Move(paged,advanced);}
  const listToolbar=page.querySelector('.v138-order-toolbar');
  if(listToolbar){listToolbar.classList.add('mf363-list-toolbar');v363Move(listToolbar,advanced);}
  const browse=page.querySelectorAll('.mf354-browse-tools');
  browse.forEach(p=>{
    const kind=p.dataset.kind==='collections'?'collections':'categories';
    const toggle=p.querySelector('.mf354-toggle-filters');
    if(toggle){
      const open=!!V363_SESSION.queueFilter[kind];p.classList.toggle('mf354-filters-open',open);p.classList.toggle('mf363-filters-open',open);
      toggle.textContent=open?'Hide filters & sorting':'Show filters & sorting';
      toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('data-v225-iconified','1');
    }
    p.querySelector('.mf354-clear')?.remove();
    p.querySelector('.mf354-browse-head>div>b')?.classList.add('mf363-filter-title');
    p.classList.add('mf363-filter-panel');
  });
  const state=tools.querySelector('.mf363-advanced-head b');if(state)state.textContent='Queue Tools';
  tools.hidden=!V363_SESSION.advanced;
  if(!tabs){
    const main=page.querySelector('.v138-order-main');
    if(main)main.classList.toggle('mf363-grid-categories',String(S.orderPlan?.viewMode||'')==='category');
  }
  // Prevent redundant legacy layout cards from pushing the actual content down.
  page.querySelectorAll('.mf345-layout-switch').forEach(card=>card.classList.add('mf363-legacy-layout'));
  const legacy=page.querySelector('.mf350-order-toggle-row');if(legacy)legacy.hidden=true;
}
function v363ToggleTools(){V363_SESSION.advanced=!V363_SESSION.advanced;v363EnhanceWorkspace();}
function v363ToggleBrowseFilters(button){
  const pane=button?.closest('.mf354-browse-tools');if(!pane)return;
  const kind=pane.dataset.kind==='collections'?'collections':'categories';
  V363_SESSION.queueFilter[kind]=!V363_SESSION.queueFilter[kind];
  pane.classList.toggle('mf354-filters-open',V363_SESSION.queueFilter[kind]);
  pane.classList.toggle('mf363-filters-open',V363_SESSION.queueFilter[kind]);
  button.textContent=V363_SESSION.queueFilter[kind]?'Hide filters & sorting':'Show filters & sorting';
  button.setAttribute('aria-expanded',String(V363_SESSION.queueFilter[kind]));
}
const v363OldToggleBrowse=App.v354ToggleFilters;
App.v354ToggleFilters=v363ToggleBrowseFilters;

function v363EnhanceTitleSheet(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-title-sheet');if(!sheet)return;
  const disclosure=sheet.querySelector('.mf356-title-filters');
  const display=sheet.querySelector('.mf358-title-display');if(!disclosure||!display)return;
  const controls=display.querySelector('.mf358-size-controls');
  const paging=display.querySelector('.mf359-title-paging');
  if(!controls||!paging)return;
  let group=disclosure.querySelector(':scope > .mf363-title-advanced');
  if(!group){group=document.createElement('section');group.className='mf363-title-advanced';group.innerHTML='<b>Display sizing & page size</b><div class="mf363-title-sizing"></div><div class="mf363-title-page-size"></div>';
    disclosure.append(group);
  }
  if(V363_BREAKPOINT.matches){
    v363Move(controls,group.querySelector('.mf363-title-sizing'));
    const select=paging.querySelector('.mf359-page-size-field');if(select)v363Move(select,group.querySelector('.mf363-title-page-size'));
    sheet.classList.add('mf363-mobile-title-tools');
  }else{
    v363Restore(controls);
    const select=group.querySelector('.mf359-page-size-field');if(select)v363Restore(select);
    sheet.classList.remove('mf363-mobile-title-tools');
  }
  // Show the result count even when the controls are collapsed.
  const summary=paging.querySelector('.mf359-page-summary');
  if(summary&&V363_BREAKPOINT.matches&&summary.parentElement===paging){
    const modes=display.querySelector('.mf358-mode-buttons');
    if(modes)display.insertBefore(summary,paging);
  }else if(summary&&!V363_BREAKPOINT.matches&&summary.parentElement!==paging)paging.prepend(summary);
}
function v363Enhance(){
  try{v363EnhanceWorkspace();}catch(err){console.warn('[v363] queue tools',err);}
  try{v363EnhanceTitleSheet();}catch(err){console.warn('[v363] title tools',err);}
}
function v363ScheduleEnhance(){if(V363_ENHANCE_PENDING)return;V363_ENHANCE_PENDING=true;
  requestAnimationFrame(()=>{V363_ENHANCE_PENDING=false;v363Enhance();});}
const v363RenderBase=render;
render=function(){const value=v363RenderBase.apply(this,arguments);v363ScheduleEnhance();return value;};
const v363RenderViewBase=renderView;
renderView=function(){const value=v363RenderViewBase.apply(this,arguments);v363ScheduleEnhance();return value;};
const v363SheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(){const result=v363SheetBase.apply(this,arguments);v363EnhanceTitleSheet();return result;};
try{V363_BREAKPOINT.addEventListener('change',()=>{v363EnhanceTitleSheet();v363ScheduleEnhance();});}catch(_){ }

// Interaction-first view switches: never hold a simple visual change behind
// a cloud/network write. Error reporting stays with the canonical save path.
let V363_QUEUE_SAVE_TIMER=0;
let V363_QUEUE_SAVE_CHAIN=Promise.resolve();
function v363PersistQueue(){
  clearTimeout(V363_QUEUE_SAVE_TIMER);
  V363_QUEUE_SAVE_TIMER=setTimeout(()=>{
    // Serialized writes avoid an older network completion overwriting the
    // user's most recent display setting after several rapid button presses.
    V363_QUEUE_SAVE_CHAIN=V363_QUEUE_SAVE_CHAIN.catch(()=>{}).then(()=>saveState())
      .catch(err=>console.warn('[v363] Queue save',err));
  },180);
}
App.v345SetLayout=function(mode){
  const next=mode==='tabs'?'tabs':'lists',queue=v288EnsureQueueView();if(queue.layoutMode===next)return;
  queue.layoutMode=next;S.orderPlan.v288QueueView=queue;S.orderPlan.modifiedAt=Date.now();
  render();v363PersistQueue();
};
App.v288SetQueueView=function(key,value){
  const queue=v288EnsureQueueView();
  if(key==='sectionOrder')queue.sectionOrder=value==='collections-first'?'collections-first':'regular-first';
  else if(['showRegularQueues','showCollectionQueues','showCollectionsInRegularQueues'].includes(key))queue[key]=!!value;
  else return;
  S.orderPlan.v288QueueView=queue;S.orderPlan.modifiedAt=Date.now();
  if(key==='sectionOrder'&&v288EnsureQueueView().layoutMode==='lists'){
    const main=document.querySelector('#view-root .v138-order-main');
    if(main){const first=main.querySelector(':scope > .mf288-regular-section');const second=main.querySelector(':scope > .mf288-collection-section');
      if(first&&second){if(queue.sectionOrder==='collections-first')main.insertBefore(second,first);else main.insertBefore(first,second);}
      const buttons=document.querySelectorAll('.mf288-control-group:first-child .mf288-segmented .btn');
      buttons.forEach((b,i)=>{b.classList.toggle('btn-primary',queue.sectionOrder===(i===0?'regular-first':'collections-first'));b.classList.toggle('btn-ghost',!b.classList.contains('btn-primary'));});
    }else render();
  }else render();
  v363PersistQueue();
};
// View-mode changes don't change the actual queue membership. Show the new
// view before persisting rather than calling the expensive queue touch path.
App.v138SetOrderView=function(mode){
  const p=v138EnsureOrderPlan(),next=mode==='category'?'category':'all';if(p.viewMode===next)return;
  p.viewMode=next;p.modifiedAt=Date.now();render();v363PersistQueue();
};
// Fast category-tab navigation: update only tab strip and visible queue panel;
// don't rebuild the entire order page, all pickers, or the advanced tools.
App.v345SelectCategory=function(kind,id){
  const key=kind==='collections'?'collections':'categories',target=String(id||'');
  if(!v345TabsData(key).includes(target))return;
  v345UI()[key]=target;
  const host=document.querySelector('#view-root .v138-order-view .mf345-tab-layout');
  const pane=host?.querySelector('.mf345-category-content');
  const tabs=host?.querySelectorAll('.mf345-subtab');
  if(!pane||!tabs?.length){v345RefreshTabs();v363ScheduleEnhance();return;}
  pane.innerHTML=key==='collections'?v345CollectionQueuePanel(target):v345TitleQueuePanel(target);
  pane.setAttribute('aria-label',v138OrderCategory(target)?.name||'Category');
  tabs.forEach(tab=>{const active=tab.getAttribute('onclick')?.includes(`'${target}'`)||false;
    tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
  });
};
App.v345SelectMain=function(kind){
  const next=kind==='collections'?'collections':'categories';v345UI().main=next;
  const host=document.querySelector('#view-root .v138-order-view .mf345-tab-layout');
  const oldTabs=host?.querySelector('.mf345-subnav-scroll');
  const oldPane=host?.querySelector('.mf345-category-content');
  const oldFilters=host?.querySelector('.mf354-browse-tools');
  if(!host||!oldPane){v345RefreshTabs();v363ScheduleEnhance();return;}
  const wrapper=document.createElement('div');wrapper.innerHTML=v345CategoryTabs(next);
  const newTabs=wrapper.querySelector('.mf345-subnav-scroll'),newPane=wrapper.querySelector('.mf345-category-content');
  if(oldTabs&&newTabs)oldTabs.replaceWith(newTabs);else if(newTabs)oldPane.before(newTabs);
  if(newPane)oldPane.replaceWith(newPane);
  if(oldFilters){const box=document.createElement('div');box.innerHTML=v354Toolbar(next);const replacement=box.firstElementChild;if(replacement)oldFilters.replaceWith(replacement);}
  host.dataset.mf345Main=next;
  host.querySelectorAll('.mf345-main-tab').forEach((btn,i)=>{const active=(i===0&&next==='categories')||(i===1&&next==='collections');
    btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));});
  v363ScheduleEnhance();
};
// Auto icon injection is disabled on the text-only filter toggle.
const v363IconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){if(el?.matches?.('.mf354-toggle-filters,.mf363-columns-button,.mf354-quick-switch .mf354-advanced-access'))return null;
  return v363IconNameBase.apply(this,arguments);};
Object.assign(App,{v363Enhance,v363ToggleTools,v363SetColumns});
try{requestAnimationFrame(v363Enhance);}catch(_){ }
MediaFlowRuntime.version=V363_RELEASE;
window.MediaFlowV363={version:363,features:['Unified desktop/mobile queue tools','Desktop 1–4 category list columns','Mobile Add Titles collapsible sizing and page size','Fast category tab navigation and immediate queue settings','Restored desktop Category Display']};
