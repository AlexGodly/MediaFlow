/* ============================================================
   MediaFlow v231 — Settings Navigation + Layout Inheritance Polish
   ------------------------------------------------------------
   - Promotes Default Library Mode into its own Library Settings section.
   - Adds a semantic Library Mode icon in the Settings sidebar.
   - Highlights the Settings sidebar section currently in view.
   - Removes redundant custom-layout helper copy from Choice & Filter Layout.
   - Set Priority default becomes High → Medium → Low.
   - Set Status can follow Dynamic Status Row order.
   - Category Filter can follow Set Category.
   - Status Filter can follow Set Status or Dynamic Status Row order.
   ============================================================ */

const V231_RUNTIME_VERSION=231;
const V231_SET_PRIORITY_DEFAULT=['high','medium','low'];

/* ---------- Library Mode becomes a first-class Settings section ---------- */
const v231DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  const raw=v231DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  try{
    const host=document.createElement('div');
    host.innerHTML=raw;
    const labels=[...host.children].filter(el=>el.classList?.contains('section-label'));
    const experienceLabel=labels.find(el=>String(el.textContent||'').trim().toUpperCase()==='LIBRARY EXPERIENCE');
    const experienceCard=experienceLabel?.nextElementSibling;
    const modeHead=experienceCard?.querySelector?.(':scope > .v181-setting-head');
    if(experienceLabel&&experienceCard&&modeHead&&/default library mode/i.test(String(modeHead.textContent||''))){
      const modeLabel=document.createElement('div');
      modeLabel.className='section-label';
      modeLabel.textContent='LIBRARY MODE';
      const modeCard=document.createElement('div');
      modeCard.className='card v181-settings-card v231-library-mode-card';
      modeCard.appendChild(modeHead);
      experienceLabel.before(modeLabel,modeCard);
    }
    return host.innerHTML;
  }catch(_){
    return raw;
  }
};

try{
  const list=V221_SETTINGS_SECTION_ORDER?.Library;
  if(Array.isArray(list)&&!list.includes('LIBRARY MODE')){
    const at=list.indexOf('LIBRARY EXPERIENCE');
    list.splice(at>=0?at:1,0,'LIBRARY MODE');
  }
}catch(_){ }

/* A Library Mode section reset should reset only the mode, while Library
   Experience resets the Dynamic Library configuration without unexpectedly
   switching the user's chosen default Library mode. */
const v231SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  const t=String(title||'').trim().toUpperCase();
  if(t==='LIBRARY MODE')return {kind:'paths',paths:['v181Library.mode']};
  if(t==='LIBRARY EXPERIENCE')return {kind:'paths',paths:[
    'v181Library.categoryOrder',
    'v181Library.hiddenCategoryIds',
    'v181Library.statusOrder',
    'v181Library.activeCategoryId',
    'v181Library.activeStatus',
    'v181Library.dynamicCategoryIcons',
    'v181Library.dynamicCategoryOrderMode'
  ]};
  return v231SectionResetPlanBase(title);
};

/* ---------- Semantic Settings icon for Library Mode ---------------------- */
Object.assign(V225_BUTTON_ICONS,{
  libraryMode:v225IconSvg('<rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/><path d="M7 9h.01M17 15h.01"/><path d="m8 12 2 2-2 2M16 12l-2-2 2-2"/>')
});
const v231ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  if(el?.classList?.contains('v221-settings-nav-item')&&t==='library mode')return 'libraryMode';
  return v231ButtonIconNameBase(el);
};

/* ---------- Settings sidebar active-section highlighting ---------------- */
let V231_ACTIVE_SETTINGS_ID='';
let V231_SETTINGS_SCROLL_FRAME=0;
let V231_SETTINGS_JUMP_LOCK_ID='';
let V231_SETTINGS_JUMP_LOCK_UNTIL=0;

function v231SetActiveSettingsNav(id,ensureVisible=false){
  const target=String(id||'');
  if(!target)return;
  const buttons=[...document.querySelectorAll('.v221-settings-nav-item')];
  for(const btn of buttons){
    const active=String(btn.dataset.settingsTarget||'')===target;
    btn.classList.toggle('v231-active',active);
    if(active)btn.setAttribute('aria-current','location');else btn.removeAttribute('aria-current');
  }
  if(V231_ACTIVE_SETTINGS_ID!==target){
    V231_ACTIVE_SETTINGS_ID=target;
    if(ensureVisible){
      const active=buttons.find(btn=>String(btn.dataset.settingsTarget||'')===target);
      try{active?.scrollIntoView?.({block:'nearest',inline:'nearest'});}catch(_){ }
    }
  }
}

function v231UpdateSettingsActiveNav(ensureVisible=false){
  if(String(S.view||'')!=='settings')return;
  if(V231_SETTINGS_JUMP_LOCK_ID&&Date.now()<V231_SETTINGS_JUMP_LOCK_UNTIL){
    v231SetActiveSettingsNav(V231_SETTINGS_JUMP_LOCK_ID,ensureVisible);
    return;
  }
  if(V231_SETTINGS_JUMP_LOCK_ID&&Date.now()>=V231_SETTINGS_JUMP_LOCK_UNTIL){V231_SETTINGS_JUMP_LOCK_ID='';V231_SETTINGS_JUMP_LOCK_UNTIL=0;}
  const registry=(V221_SETTINGS_REGISTRY||[]).filter(section=>{
    const el=section?.label||document.getElementById(section?.id||'');
    if(!el)return false;
    if(el.classList.contains('v221-settings-hidden'))return false;
    const style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden';
  });
  if(!registry.length)return;

  const anchor=132; // matches the Settings section scroll-margin/sticky toolbar offset
  let chosen=null;
  let firstBelow=null;
  for(const section of registry){
    const el=section.label||document.getElementById(section.id);
    const top=el?.getBoundingClientRect?.().top;
    if(!Number.isFinite(top))continue;
    if(top<=anchor)chosen=section;
    else if(!firstBelow)firstBelow=section;
  }
  chosen=chosen||firstBelow||registry[0];
  if(chosen)v231SetActiveSettingsNav(chosen.id,ensureVisible);
}

function v231ScheduleSettingsActiveNav(ensureVisible=false){
  if(V231_SETTINGS_SCROLL_FRAME)return;
  V231_SETTINGS_SCROLL_FRAME=requestAnimationFrame(()=>{
    V231_SETTINGS_SCROLL_FRAME=0;
    v231UpdateSettingsActiveNav(ensureVisible);
  });
}

const v231JumpSettingsBase=App.v221JumpSettings;
App.v221JumpSettings=function(id){
  const lockId=String(id||'');
  V231_SETTINGS_JUMP_LOCK_ID=lockId;
  V231_SETTINGS_JUMP_LOCK_UNTIL=Date.now()+900;
  v231SetActiveSettingsNav(id,true);
  const result=v231JumpSettingsBase(id);
  // Only clear the jump lock that belongs to this navigation request. Older
  // delayed callbacks must never cancel a newer section click after a resize
  // or a quick sequence of horizontal Settings navigation taps.
  setTimeout(()=>{
    if(V231_SETTINGS_JUMP_LOCK_ID!==lockId)return;
    V231_SETTINGS_JUMP_LOCK_ID='';V231_SETTINGS_JUMP_LOCK_UNTIL=0;v231ScheduleSettingsActiveNav(true);
  },920);
  return result;
};

function v231EnhanceSettingsActiveNav(){
  try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
  requestAnimationFrame(()=>v231UpdateSettingsActiveNav(true));
}
MediaFlowRuntime.registerPageEnhancer('settings',v231EnhanceSettingsActiveNav);
window.addEventListener('scroll',()=>v231ScheduleSettingsActiveNav(false),{passive:true});
window.addEventListener('resize',()=>v231ScheduleSettingsActiveNav(false),{passive:true});

/* ---------- v230 layout defaults / inheritance expansion --------------- */
const v231DefaultLayoutBase=v230DefaultLayout;
v230DefaultLayout=function(){
  const out=v231DefaultLayoutBase();
  out.setPriority=Object.assign({},out.setPriority,{order:V231_SET_PRIORITY_DEFAULT.slice()});
  return out;
};

if(DEFAULT_SETTINGS.v230ChoiceLayout?.setPriority){
  DEFAULT_SETTINGS.v230ChoiceLayout.setPriority.order=V231_SET_PRIORITY_DEFAULT.slice();
}

v230NormalizeSurface=function(raw,surface){
  const isCategory=surface==='setCategory'||surface==='categoryFilter';
  const isStatus=surface==='setStatus'||surface==='statusFilter';
  const valid=isCategory?v230CategoryIds():(isStatus?V230_STATUS_IDS:V230_PRIORITY_IDS);
  const def=v230DefaultLayout()[surface];
  let source=String(raw?.source||def.source||'custom');
  let allowedSources;
  if(surface==='setCategory')allowedSources=new Set(['custom','categories','dynamic']);
  else if(surface==='categoryFilter')allowedSources=new Set(['custom','categories','dynamic','setCategory']);
  else if(surface==='setStatus')allowedSources=new Set(['custom','dynamicStatus']);
  else if(surface==='statusFilter')allowedSources=new Set(['custom','setStatus','dynamicStatus']);
  else if(surface==='priorityFilter')allowedSources=new Set(['custom','setPriority']);
  else allowedSources=new Set(['custom']);
  if(!allowedSources.has(source))source='custom';
  const order=v230UniqueIds(raw?.order,valid);
  for(const id of valid)if(!order.includes(String(id)))order.push(String(id));
  const hidden=v230UniqueIds(raw?.hidden,valid);
  return {source,order,hidden};
};

function v231DynamicStatusState(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  return {order:(cfg.statusOrder||[]).map(String),hidden:[]};
}

v230ResolvedSurface=function(surface,seen=new Set()){
  const cfg=v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);
  const own=cfg[surface]||v230DefaultLayout()[surface];
  if(seen.has(surface))return {source:'custom',order:own.order.slice(),hidden:own.hidden.slice(),inherited:false};
  seen.add(surface);

  if((surface==='setCategory'||surface==='categoryFilter')&&own.source==='categories'){
    const st=v230MainCategoryState();
    return {source:'categories',order:st.order,hidden:st.hidden,inherited:true};
  }
  if((surface==='setCategory'||surface==='categoryFilter')&&own.source==='dynamic'){
    const st=v230DynamicCategoryState();
    return {source:'dynamic',order:st.order,hidden:st.hidden,inherited:true};
  }
  if(surface==='categoryFilter'&&own.source==='setCategory'){
    const st=v230ResolvedSurface('setCategory',seen);
    return {source:'setCategory',order:st.order.slice(),hidden:st.hidden.slice(),inherited:true};
  }
  if((surface==='setStatus'||surface==='statusFilter')&&own.source==='dynamicStatus'){
    const st=v231DynamicStatusState();
    return {source:'dynamicStatus',order:st.order.slice(),hidden:[],inherited:true};
  }
  if(surface==='statusFilter'&&own.source==='setStatus'){
    const st=v230ResolvedSurface('setStatus',seen);
    return {source:'setStatus',order:st.order.slice(),hidden:st.hidden.slice(),inherited:true};
  }
  if(surface==='priorityFilter'&&own.source==='setPriority'){
    const st=v230ResolvedSurface('setPriority',seen);
    return {source:'setPriority',order:st.order.slice(),hidden:st.hidden.slice(),inherited:true};
  }
  return {source:'custom',order:own.order.slice(),hidden:own.hidden.slice(),inherited:false};
};

v230SourceLabel=function(source){
  return ({
    custom:'Own settings',
    categories:'Follow Category Settings',
    dynamic:'Follow Dynamic Category Row',
    setCategory:'Follow Set Category',
    dynamicStatus:'Follow Dynamic Status Order',
    setStatus:'Follow Set Status',
    setPriority:'Follow Set Priority'
  })[source]||source;
};

v230SourceOptions=function(surface,current){
  let values=[['custom','Own settings']];
  if(surface==='setCategory')values.push(['categories','Follow Category Settings'],['dynamic','Follow Dynamic Category Row']);
  if(surface==='categoryFilter')values.push(['categories','Follow Category Settings'],['dynamic','Follow Dynamic Category Row'],['setCategory','Follow Set Category']);
  if(surface==='setStatus')values.push(['dynamicStatus','Follow Dynamic Status Order']);
  if(surface==='statusFilter')values.push(['setStatus','Follow Set Status'],['dynamicStatus','Follow Dynamic Status Order']);
  if(surface==='priorityFilter')values.push(['setPriority','Follow Set Priority']);
  return values.map(([id,label])=>`<option value="${id}" ${current===id?'selected':''}>${label}</option>`).join('');
};

v230InheritedHint=function(surface,source){
  if(source==='categories')return 'Order and visibility follow Settings → Categories.';
  if(source==='dynamic')return 'Order and visibility follow Library Experience → Dynamic Category Row.';
  if(source==='setCategory')return 'Order and visibility follow Set Category.';
  if(source==='dynamicStatus')return 'Order follows Library Experience → Dynamic Status Row.';
  if(source==='setStatus')return 'Order and visibility follow Set Status.';
  if(source==='setPriority')return 'Order and visibility follow Set Priority.';
  return '';
};

/* Same editor as v230, but Own Settings no longer repeats the instructional
   "Drag with ☰..." sentence requested for removal in v231. */
v230SurfaceEditor=function(surface){
  const own=v230SurfaceConfig(surface);const resolved=v230ResolvedSurface(surface);
  const custom=own.source==='custom';const hidden=new Set(resolved.hidden.map(String));
  const hint=v230InheritedHint(surface,own.source);
  const rows=resolved.order.map((id,index)=>{
    const meta=v230ItemMeta(surface,id);const visible=!hidden.has(String(id));
    return `<div class="v230-layout-row ${custom?'':'v230-layout-row-inherited'}" data-v230-surface="${surface}" data-v230-id="${escapeHtml(String(id))}" ${custom?`ondragover="App.v230DragOver(event,'${surface}')" ondragleave="App.v230DragLeave(event)" ondrop="App.v230Drop(event,'${surface}','${escapeHtml(String(id))}')"`:''}>
      <div class="v230-layout-copy"><span class="v230-layout-identity">${meta.icon}</span><div><b>${escapeHtml(meta.label)}</b><small>${custom?`Position ${index+1} · ${visible?'shown':'hidden'}`:`Inherited position ${index+1} · ${visible?'shown':'hidden'}`}</small></div></div>
      <button type="button" class="btn btn-sm btn-ghost v230-drag-handle" ${custom?'draggable="true"':'disabled'} title="${custom?'Drag to reorder':'Inherited order'}" aria-label="${custom?'Drag to reorder':'Inherited order'}" ${custom?`ondragstart="App.v230DragStart(event,'${surface}','${escapeHtml(String(id))}')" ondragend="App.v230DragEnd(event)"`:''}>☰</button>
      <input class="v230-position" type="number" min="1" max="${resolved.order.length}" value="${index+1}" ${custom?'':'disabled'} aria-label="${escapeHtml(meta.label)} position" onchange="App.v230SetPosition('${surface}','${escapeHtml(String(id))}',this.value)">
      <div class="v230-order-buttons"><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===0?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',-1)">↑</button><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===resolved.order.length-1?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',1)">↓</button></div>
      <button type="button" class="toggle ${visible?'on':''}" ${custom?'':'disabled'} aria-label="${visible?'Hide':'Show'} ${escapeHtml(meta.label)}" onclick="App.v230ToggleVisible('${surface}','${escapeHtml(String(id))}',${visible?'false':'true'})"></button>
    </div>`;
  }).join('');
  return `<div class="v230-surface-card">
    <div class="v230-surface-head"><div><b>${v230SurfaceTitle(surface)}</b>${hint?`<div class="hint">${escapeHtml(hint)}</div>`:''}</div><select aria-label="${v230SurfaceTitle(surface)} layout source" onchange="App.v230SetSource('${surface}',this.value)">${v230SourceOptions(surface,own.source)}</select></div>
    ${custom?`<div class="v230-surface-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',true)">Show all</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',false)">Hide all</button></div>`:`<div class="v230-follow-summary">${escapeHtml(hint)}</div>`}
    <div class="v230-layout-list">${rows}</div>
  </div>`;
};

/* Migrate the v230 Set Priority default (Low → Medium → High) to the corrected
   v231 default only when it still exactly matches that old default. */
function v231MigrateSetPriorityDefault(settings){
  const cfg=v230EnsureChoiceLayout(settings||DEFAULT_SETTINGS);
  const target=cfg?.setPriority;
  if(target&&target.source==='custom'&&!(target.hidden||[]).length&&
     JSON.stringify((target.order||[]).map(String))===JSON.stringify(['low','medium','high'])){
    target.order=V231_SET_PRIORITY_DEFAULT.slice();
  }
  return cfg;
}
v231MigrateSetPriorityDefault(DEFAULT_SETTINGS);
v231MigrateSetPriorityDefault(S.settings||DEFAULT_SETTINGS);

Object.assign(App,{
  v231UpdateSettingsActiveNav,
  v231ScheduleSettingsActiveNav
});

MediaFlowRuntime.version=V231_RUNTIME_VERSION;
