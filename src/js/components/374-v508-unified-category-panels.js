/* MediaFlow v508 — shared visual category presentation for Dashboard
 * Today's Balance and Library Overview. NEVER modifies Library, History,
 * XP, the task scheduler, or source category enabled flags.
 * This module intentionally runs last: older renderers resolve our helper at
 * call time and every upgrade path reads the same persisted panel settings. */
const MF508_PANEL_KEYS=Object.freeze(['todayBalance','libraryOverview']);
const MF508_SOURCES=Object.freeze(['categories','system','custom','todayBalance','libraryOverview']);
function mf508Own(v,k){return !!v&&Object.prototype.hasOwnProperty.call(v,k);}
function mf508AllCategories(){return Array.isArray(S.categories)?S.categories.filter(c=>c&&c.id!=null):[];}
function mf508Unique(ids){
  const known=new Set(mf508AllCategories().map(c=>String(c.id)));
  return [...new Set((Array.isArray(ids)?ids:[]).map(String).filter(id=>known.has(id)))];
}
function mf508FallbackPanel(key,settings=S.settings||DEFAULT_SETTINGS){
  const legacyBalance=settings?.v186ControlCenter?.todayBalance;
  const previouslyCustom=key==='todayBalance'&&legacyBalance?.mode==='custom';
  const all=mf508AllCategories();
  const priorIds=mf508Unique(legacyBalance?.categoryIds);
  return {
    enabled:key==='todayBalance'
      ?settings?.v192Dashboard?.showTodayBalance!==false
      :settings?.v183LibraryOverview?.showOverview!==false,
    source:previouslyCustom?'custom':'categories',
    hiddenIds:previouslyCustom
      ?all.filter(cat=>!priorIds.includes(String(cat.id))).map(cat=>String(cat.id))
      :[],
    order:all.map(cat=>String(cat.id)),
    metrics:'all',
    modifiedAt:0
  };
}
function mf508NormalizePanel(raw,key,settings=S.settings||DEFAULT_SETTINGS){
  const def=mf508FallbackPanel(key,settings);
  const val=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  let source=MF508_SOURCES.includes(val.source)?val.source:def.source;
  if(source===key)source='categories';
  const oldOrder=mf508Unique(val.order);
  const order=[...oldOrder,...mf508AllCategories().map(c=>String(c.id)).filter(id=>!oldOrder.includes(id))];
  return {
    enabled:mf508Own(val,'enabled')?val.enabled!==false:def.enabled,
    source,
    hiddenIds:mf508Own(val,'hiddenIds')?mf508Unique(val.hiddenIds):def.hiddenIds,
    order:mf508Own(val,'order')?order:def.order,
    metrics:key==='todayBalance'&&val.metrics==='visible'?'visible':'all',
    modifiedAt:Math.max(0,Number(val.modifiedAt)||0)
  };
}
function mf508NormalizeBoth(raw,settings=S.settings||DEFAULT_SETTINGS){
  const input=raw&&typeof raw==='object'?raw:{};
  const todayBalance=mf508NormalizePanel(input.todayBalance,'todayBalance',settings);
  const libraryOverview=mf508NormalizePanel(input.libraryOverview,'libraryOverview',settings);
  // Malformed or imported circular dependencies resolve deterministically.
  if(todayBalance.source==='libraryOverview'&&libraryOverview.source==='todayBalance')
    libraryOverview.source='categories';
  return {todayBalance,libraryOverview};
}
function mf508Ensure(settings=S.settings||DEFAULT_SETTINGS){
  if(!settings||typeof settings!=='object')return mf508NormalizeBoth(null,DEFAULT_SETTINGS);
  const cfg=mf508NormalizeBoth(settings.v508Panels,settings);
  settings.v508Panels=cfg;
  return cfg;
}
function mf508VisibleCategories(key,seen=new Set()){
  if(!MF508_PANEL_KEYS.includes(key))return mf508AllCategories().filter(c=>c.enabled!==false);
  if(seen.has(key))return mf508AllCategories().filter(c=>c.enabled!==false);
  seen.add(key);
  const cfg=mf508Ensure()[key];
  let result;
  if(cfg.source==='system'){
    result=typeof v186ScopeCategories==='function'
      ?v186ScopeCategories('scheduler'):mf508AllCategories().filter(c=>c.enabled!==false);
  }else if(cfg.source==='custom'){
    const hidden=new Set(cfg.hiddenIds);
    const map=new Map(mf508AllCategories().map(c=>[String(c.id),c]));
    result=cfg.order.filter(id=>map.has(id)&&!hidden.has(id)).map(id=>map.get(id));
  }else if(MF508_PANEL_KEYS.includes(cfg.source)){
    result=mf508VisibleCategories(cfg.source,seen);
  }else{
    result=mf508AllCategories().filter(c=>c.enabled!==false);
  }
  return (Array.isArray(result)?result:[]).filter(Boolean);
}
function mf508MetricScope(){return mf508Ensure().todayBalance.metrics;}
function mf508HealthSummaryHtml(visibleCats){
  const scope=mf508MetricScope();
  const subjects=scope==='visible'?(Array.isArray(visibleCats)?visibleCats:[]):mf508AllCategories();
  const countFor=fn=>{
    const counts={healthy:0,due:0,neglected:0,overused:0,other:0};
    for(const c of subjects){
      let status='other';try{status=String(fn(c)||'other');}catch(_){}
      if(!Object.prototype.hasOwnProperty.call(counts,status))status='other';
      counts[status]++;
    }
    return counts;
  };
  const current=countFor(categoryStatus),lifetime=countFor(overallCategoryStatus);
  const detail=c=>'<span>'+c.healthy+' healthy</span><span>'+c.due+' due</span>'+
    '<span>'+c.neglected+' neglected</span><span>'+c.overused+' overused</span>';
  return '<div class="mf508-health-summary" aria-label="Category balance health overview">'+
    '<div class="mf508-health-header"><strong>Balance health overview</strong><small>'+
    (scope==='visible'?'Only displayed categories':'All categories, including hidden')+
    ' · '+subjects.length+' total</small></div>'+
    '<div class="mf508-health-groups"><div><b>Today (72 hours)</b><div class="mf508-health-counts">'+detail(current)+'</div></div>'+
    '<div><b>Overall (lifetime)</b><div class="mf508-health-counts">'+detail(lifetime)+'</div></div></div></div>';
}
/* v516: Settings Center owns the live controls. A full render() destroys its
 * expanded section and scroll state, so update those controls in place instead.
 * Checkbox/Show All actions never replace their focused DOM elements. */
function mf508RefreshActiveSettings(key,change){
  if(String(S.view||'')!=='settings'||typeof document==='undefined')return false;
  const center=document.querySelector('.mf365-settings-center');
  if(!center)return false;
  const panels=[...center.querySelectorAll('.mf508-panel[data-mf508-panel]')];
  if(!panels.length)return false;
  const stage=center.querySelector('.mf365-stage');
  const docScroll=document.scrollingElement||document.documentElement;
  const pageTop=docScroll?.scrollTop||0,stageTop=stage?.scrollTop||0;
  let replaced=false;
  for(const panel of panels){
    const panelKey=panel.getAttribute('data-mf508-panel');
    if(!MF508_PANEL_KEYS.includes(panelKey))continue;
    const cfg=mf508Ensure()[panelKey];
    const sectionToggle=panel.querySelector('.mf508-master input');
    if(sectionToggle)sectionToggle.checked=cfg.enabled;
    const controls=panel.querySelector('.mf508-panel-controls');
    controls?.classList.toggle('mf508-panel-disabled',!cfg.enabled);
    if(panelKey===key&&(change==='source'||change==='order')){
      const scratch=document.createElement('div');
      scratch.innerHTML=mf508PanelHtml(panelKey);
      const newControls=scratch.querySelector('.mf508-panel-controls');
      if(!controls||!newControls)return false;
      const active=document.activeElement;
      let oldList=controls.querySelector('.mf508-order-list');
      const listTop=oldList?.scrollTop||0,listLeft=oldList?.scrollLeft||0;
      const row=active?.closest?.('.mf508-order-row');
      const id=row?.getAttribute('data-mf508-category-id');
      const controlIndex=row?[...row.querySelectorAll('button,input')].indexOf(active):-1;
      const focusSource=change==='source'&&controls.contains(active);
      if(change==='source'){
        controls.innerHTML=newControls.innerHTML;
        replaced=true;
      }else{
        const list=controls.querySelector('.mf508-order-list');
        const replacement=newControls.querySelector('.mf508-order-list');
        if(list&&replacement){list.innerHTML=replacement.innerHTML;replaced=true;}
      }
      oldList=controls.querySelector('.mf508-order-list');
      if(oldList){oldList.scrollTop=listTop;oldList.scrollLeft=listLeft;}
      if(id){
        const nextRow=[...controls.querySelectorAll('.mf508-order-row')].find(el=>
          el.getAttribute('data-mf508-category-id')===id);
        const nextControl=nextRow?.querySelectorAll('button,input')?.[controlIndex];
        try{nextControl?.focus({preventScroll:true});}catch(_){}
      }else if(focusSource){
        try{controls.querySelector('.mf508-field select')?.focus({preventScroll:true});}catch(_){}
      }
    }
    // Keep selected categories checked without replacing a focused checkbox.
    panel.querySelectorAll('.mf508-order-row').forEach(row=>{
      const id=row.getAttribute('data-mf508-category-id');
      const input=row.querySelector('input.mf508-cat-toggle');
      if(input)input.checked=!cfg.hiddenIds.includes(String(id));
    });
    const preview=panel.querySelector('.mf508-follow-preview');
    if(preview){
      const names=mf508VisibleCategories(panelKey).map(c=>String(c.name));
      const count=preview.querySelector('b'),items=preview.querySelector('span');
      if(count)count.textContent=names.length+' categories shown';
      if(items)items.textContent=names.slice(0,12).join(' · ')+(names.length>12?' · …':'');
    }
    const insight=panel.querySelector('.mf508-field select[onchange*="mf508SetMetricScope"]');
    if(insight)insight.value=cfg.metrics;
  }
  // No page-wide render, so Settings Center remains expanded and in position.
  if(replaced){
    const restore=()=>{
      if(docScroll)docScroll.scrollTop=pageTop;
      if(stage)stage.scrollTop=stageTop;
    };
    restore();
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(restore);
  }
  return true;
}
function mf508Persist(key,change='general'){
  const cfg=mf508Ensure(),panel=cfg[key];
  if(!panel)return;
  panel.modifiedAt=Date.now();
  // Keep older visibility switches synchronized so old render wrappers honor
  // the same toggle on the initial paint and after cloud reload.
  const dashboard=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  dashboard.showTodayBalance=cfg.todayBalance.enabled;
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS).showOverview=cfg.libraryOverview.enabled;
  persistSettings();
  if(!mf508RefreshActiveSettings(key,change))render();
}
function mf508SetEnabled(key,on){
  if(!MF508_PANEL_KEYS.includes(key))return;
  mf508Ensure()[key].enabled=on===true;
  mf508Persist(key,'enabled');
}
function mf508SetSource(key,source){
  if(!MF508_PANEL_KEYS.includes(key)||!MF508_SOURCES.includes(source)||source===key)return;
  // Resolve the old selection BEFORE grabbing the mutable config; resolving
  // itself normalizes settings, which otherwise invalidated panel references.
  const current=source==='custom'?mf508VisibleCategories(key).map(c=>String(c.id)):[];
  const cfg=mf508Ensure(),other=key==='todayBalance'?'libraryOverview':'todayBalance';
  if(source===other&&cfg[other].source===key){
    showToast('These sections cannot follow each other in a loop. Change the other source first.');
    return;
  }
  const panel=cfg[key];
  if(source==='custom'&&panel.source!=='custom'){
    const shown=new Set(current);
    panel.hiddenIds=mf508AllCategories().filter(c=>!shown.has(String(c.id))).map(c=>String(c.id));
    panel.order=[...current,...mf508AllCategories().map(c=>String(c.id)).filter(id=>!shown.has(id))];
  }
  panel.source=source;
  mf508Persist(key,'source');
}
function mf508SetCategory(key,id,show){
  if(!MF508_PANEL_KEYS.includes(key))return;
  const panel=mf508Ensure()[key];
  if(panel.source!=='custom')return;
  const valid=new Set(mf508AllCategories().map(c=>String(c.id)));
  if(!valid.has(String(id)))return;
  const hidden=new Set(panel.hiddenIds);
  if(show)hidden.delete(String(id));else hidden.add(String(id));
  panel.hiddenIds=[...hidden];
  mf508Persist(key,'category');
}
function mf508SetAll(key,show){
  if(!MF508_PANEL_KEYS.includes(key))return;
  const panel=mf508Ensure()[key];
  if(panel.source!=='custom')return;
  panel.hiddenIds=show?[]:mf508AllCategories().map(c=>String(c.id));
  mf508Persist(key,'all');
}
function mf508MoveCategory(key,id,position){
  if(!MF508_PANEL_KEYS.includes(key))return;
  const panel=mf508Ensure()[key];
  if(panel.source!=='custom')return;
  const all=[...panel.order],from=all.indexOf(String(id));
  if(from<0)return;
  const target=Math.max(0,Math.min(all.length-1,Number(position)||0));
  if(from===target)return;
  all.splice(from,1);all.splice(target,0,String(id));
  panel.order=all;
  mf508Persist(key,'order');
}
function mf508SetMetricScope(scope){
  const panel=mf508Ensure().todayBalance;
  panel.metrics=scope==='visible'?'visible':'all';
  mf508Persist('todayBalance','metric');
}
function mf508SourceOptions(key){
  const linked=key==='todayBalance'?'libraryOverview':'todayBalance';
  const label=key==='todayBalance'?'Library Overview':'Today’s Balance';
  return [
    ['categories','Follow Categories (default)'],
    ['system','Follow MediaFlow System rotation'],
    ['custom','Custom visibility & order'],
    [linked,'Follow '+label]
  ];
}
function mf508OptionsHtml(key){
  const p=mf508Ensure()[key];
  return mf508SourceOptions(key).map(([value,label])=>'<option value="'+escapeHtml(value)+'"'+
    (p.source===value?' selected':'')+'>'+escapeHtml(label)+'</option>').join('');
}
function mf508ListHtml(key){
  const p=mf508Ensure()[key];
  if(p.source!=='custom'){
    const names=mf508VisibleCategories(key).map(c=>String(c.name));
    return '<div class="mf508-follow-preview"><b>'+names.length+' categories shown</b>'+
      '<span>'+escapeHtml(names.slice(0,12).join(' · ')+(names.length>12?' · …':''))+'</span></div>';
  }
  const known=new Map(mf508AllCategories().map(c=>[String(c.id),c]));
  return '<div class="mf508-custom-actions"><button type="button" class="btn btn-sm" onclick="App.mf508SetAll(\''+key+'\',true)">Show all</button>'+
    '<button type="button" class="btn btn-sm" onclick="App.mf508SetAll(\''+key+'\',false)">Hide all</button></div>'+
    '<div class="mf508-order-list">'+p.order.map((id,index)=>{
      const c=known.get(id);if(!c)return '';
      const on=!p.hiddenIds.includes(id);
      const safe=escapeHtml(id);
      return '<div class="mf508-order-row" data-mf508-category-id="'+safe+'"><input type="checkbox" class="mf508-cat-toggle" '+
        (on?'checked ':'')+'aria-label="Show '+escapeHtml(c.name)+' in '+(key==='todayBalance'?"Today\'s Balance":'Library Overview')+'" '+
        'onchange="App.mf508SetCategory(\''+key+'\',\''+safe+'\',this.checked)">'+
        '<span class="mf508-cat-name">'+v144CategoryIconHtml(c)+' '+escapeHtml(c.name)+'</span>'+
        '<div class="mf508-order-actions"><button type="button" class="btn btn-sm" aria-label="Move up" '+(index===0?'disabled':'')+
        ' onclick="App.mf508MoveCategory(\''+key+'\',\''+safe+'\','+(index-1)+')">↑</button>'+
        '<button type="button" class="btn btn-sm" aria-label="Move down" '+(index===p.order.length-1?'disabled':'')+
        ' onclick="App.mf508MoveCategory(\''+key+'\',\''+safe+'\','+(index+1)+')">↓</button>'+
        '<label class="mf508-position"><span>Position</span><input type="number" min="1" max="'+p.order.length+
        '" value="'+(index+1)+'" aria-label="Position of '+escapeHtml(c.name)+'" onchange="App.mf508MoveCategory(\''+key+'\',\''+safe+'\',Number(this.value)-1)"></label></div></div>';
    }).join('')+'</div>';
}
function mf508PanelHtml(key){
  const today=key==='todayBalance',title=today?"Today's Balance":"Library Overview";
  const p=mf508Ensure()[key];
  return '<section class="card mf508-panel" data-mf508-panel="'+key+'"><div class="mf508-panel-header">'+
    '<div><h3>'+title+'</h3><p>Show, hide and arrange categories without changing Library data, logging, XP or the scheduler.</p></div>'+
    '<label class="mf508-master"><input type="checkbox" '+(p.enabled?'checked':'')+
      ' onchange="App.mf508SetEnabled(\''+key+'\',this.checked)"><span>Show section</span></label></div>'+
    '<div class="mf508-panel-controls '+(!p.enabled?'mf508-panel-disabled':'')+'">'+
    '<label class="mf508-field"><span>Category source</span><select onchange="App.mf508SetSource(\''+key+'\',this.value)">'+
      mf508OptionsHtml(key)+'</select></label>'+mf508ListHtml(key)+
    (today?'<label class="mf508-field"><span>Balance insights scope</span><select onchange="App.mf508SetMetricScope(this.value)">'+
      '<option value="all"'+(p.metrics==='all'?' selected':'')+'>All categories, including hidden (default)</option>'+
      '<option value="visible"'+(p.metrics==='visible'?' selected':'')+'>Only displayed categories</option>'+
      '</select></label><p class="mf508-footnote">Only the Today/Overall category-health overview follows this scope. Category health, consumption, time totals, History, XP and task scores keep their existing calculations.</p>':
      '<p class="mf508-footnote">The Library-wide completion percentage retains its original all-Library meaning. Only category rows and their order change.</p>')+
    '</div></section>';
}
const mf508RenderSettingsBase=renderSettings;
renderSettings=function(){
  let html=String(mf508RenderSettingsBase.apply(this,arguments)||'');
  // Replace v186's obsolete Today’s Balance-only control; avoid presenting two
  // independent switches which could contradict each other.
  const begin='<div class="section-label">DASHBOARD SETTINGS</div>';
  const end='<div class="section-label">STATISTICS SETTINGS</div>';
  const i=html.indexOf(begin),j=i>=0?html.indexOf(end,i+begin.length):-1;
  const cards='<div class="section-label mf508-settings-heading">DASHBOARD SETTINGS</div>'+
    mf508PanelHtml('todayBalance')+
    '<div class="section-label mf508-settings-heading">LIBRARY OVERVIEW</div>'+
    mf508PanelHtml('libraryOverview');
  if(i>=0&&j>i)html=html.slice(0,i)+cards+html.slice(j);
  else html+=cards;
  return html;
};
/* Bridge previous switches so toggling either old control also changes this
 * release's canonical setting and every Dashboard/Library render. */
const mf508LegacyOverviewToggle=App.v183ToggleLibraryOverview;
App.v183ToggleLibraryOverview=function(){
  mf508SetEnabled('libraryOverview',!mf508Ensure().libraryOverview.enabled);
};
const mf508LegacyDashboardToggle=App.v192ToggleDashboardSection;
if(typeof mf508LegacyDashboardToggle==='function'){
  App.v192ToggleDashboardSection=function(key){
    if(key==='showTodayBalance')return mf508SetEnabled('todayBalance',!mf508Ensure().todayBalance.enabled);
    return mf508LegacyDashboardToggle.apply(this,arguments);
  };
}
const mf508PersistSettingsBase=persistSettings;
persistSettings=function(){
  mf508Ensure(S.settings||DEFAULT_SETTINGS);
  return mf508PersistSettingsBase.apply(this,arguments);
};
const mf508MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=mf508MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=mf508NormalizeBoth(a?.settings?.v508Panels,a?.settings||{});
  const bv=mf508NormalizeBoth(b?.settings?.v508Panels,b?.settings||{});
  const next={};
  for(const key of MF508_PANEL_KEYS){
    const left=av[key],right=bv[key];
    const stampA=Number(left.modifiedAt)||0,stampB=Number(right.modifiedAt)||0;
    next[key]=stampB>stampA?right:left;
  }
  if(next.todayBalance.source==='libraryOverview'&&next.libraryOverview.source==='todayBalance')
    next.libraryOverview.source='categories';
  out.settings.v508Panels=next;
  out.settings.v183LibraryOverview=Object.assign({},out.settings.v183LibraryOverview||{},
    {showOverview:next.libraryOverview.enabled});
  out.settings.v192Dashboard=Object.assign({},out.settings.v192Dashboard||{},
    {showTodayBalance:next.todayBalance.enabled});
  return out;
};
Object.assign(App,{mf508SetEnabled,mf508SetSource,mf508SetCategory,mf508SetAll,
  mf508MoveCategory,mf508SetMetricScope});
window.MediaFlowV508={version:508,resolve:mf508VisibleCategories,
  inspect:()=>({settings:mf508Ensure(),todayBalance:mf508VisibleCategories('todayBalance').map(c=>c.id),
    libraryOverview:mf508VisibleCategories('libraryOverview').map(c=>c.id)})};

// v510: Always expose an explicit update path, even when an old controller
// reports no waiting worker. Never clear IndexedDB, localStorage or user data.
async function mf510ForcePwaRefresh(){
  if(!('serviceWorker' in navigator)){location.reload();return;}
  try{
    const reg=await navigator.serviceWorker.getRegistration('./');
    if(reg){
      await reg.update();
      if(reg.waiting){
        reg.waiting.postMessage({type:'SKIP_WAITING'});
        const onChange=()=>location.reload();
        navigator.serviceWorker.addEventListener('controllerchange',onChange,{once:true});
        setTimeout(()=>location.reload(),4500);
        return;
      }
    }
    // A new document URL bypasses stale app-shell HTML without touching storage.
    const url=new URL(location.href);
    url.searchParams.set('mf_update',String(Date.now()));
    location.replace(url.href);
  }catch(error){
    const url=new URL(location.href);
    url.searchParams.set('mf_update',String(Date.now()));
    location.replace(url.href);
  }
}
App.mf510ForcePwaRefresh=mf510ForcePwaRefresh;

