/* ============================================================
   MediaFlow v218 — Organized Settings Browser
   - searchable Settings page
   - sticky Settings index / quick navigation
   - per-setting reset buttons where a canonical default exists
   - complete Restore all defaults audit, including navigation layout
   ============================================================ */

const V218_SETTINGS_VERSION=218;
let V218_SETTINGS_REGISTRY=[];
let V218_SETTINGS_QUERY='';

function v218Clone(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}

function v218Slug(value){
  return String(value||'settings')
    .trim().toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'settings';
}

function v218SettingsGroup(label){
  const t=String(label||'').toUpperCase();
  if(/CATEGORY|LIBRARY|COVER|LOGGING|TITLE DETAILS/.test(t))return 'Library';
  if(/DASHBOARD|NAVIGATION|APP UPDATE/.test(t))return 'Interface';
  if(/THEME|APPEARANCE|STYLE/.test(t))return 'Appearance';
  if(/SCHEDULER|MEDIAFLOW SYSTEM|TITLE RECOMMEND|DAILY GOAL|SEASONAL/.test(t))return 'MediaFlow System';
  if(/LEVEL|XP|RESPECT/.test(t))return 'Progression';
  if(/BACKUP|DATA|IMPORT|EXPORT|CLOUD|PRESET|SYNC/.test(t))return 'Data & Sync';
  if(/STATISTIC/.test(t))return 'Statistics';
  return 'Other';
}

function v218GetByPath(obj,path){
  let cur=obj;
  for(const part of String(path||'').split('.').filter(Boolean)){
    if(cur==null||typeof cur!=='object'||!(part in cur))return undefined;
    cur=cur[part];
  }
  return cur;
}

function v218SetByPath(obj,path,value){
  const parts=String(path||'').split('.').filter(Boolean);
  if(!parts.length)return false;
  let cur=obj;
  for(let i=0;i<parts.length-1;i++){
    const p=parts[i];
    if(!cur[p]||typeof cur[p]!=='object')cur[p]={};
    cur=cur[p];
  }
  cur[parts[parts.length-1]]=value;
  return true;
}

function v218TouchModifiedAt(path){
  const parts=String(path||'').split('.').filter(Boolean);
  let cur=S.settings;
  const chain=[];
  for(let i=0;i<parts.length-1;i++){
    if(!cur||typeof cur!=='object')break;
    cur=cur[parts[i]];
    if(cur&&typeof cur==='object')chain.push(cur);
  }
  for(let i=chain.length-1;i>=0;i--){
    if(Object.prototype.hasOwnProperty.call(chain[i],'modifiedAt')){
      chain[i].modifiedAt=Date.now();
      break;
    }
  }
}

function v218ApplySettingsSideEffects(){
  try{applyTheme(S.settings?.theme||DEFAULT_SETTINGS.theme);}catch(_){ }
  try{v181ApplyCoverVars();}catch(_){ }
  try{v194ApplyCategoryIconScale();}catch(_){ }
  try{v201ApplyCoverCategoryIconScale();}catch(_){ }
  try{restartBackupTimer();}catch(_){ }
  try{v161EnsureAutomaticUpdateCheck(false);}catch(_){ }
  try{v162EnsureRotationTimer(true);}catch(_){ }
  try{v146ScheduleDynamicTheme();}catch(_){ }
}

function v218ResetSettingPath(path,label){
  const def=v218GetByPath(DEFAULT_SETTINGS,path);
  if(def===undefined){
    showToast(`No canonical default is registered for ${label||'this setting'}.`);
    return;
  }
  S.settings=S.settings||{};
  v218SetByPath(S.settings,path,v218Clone(def));
  v218TouchModifiedAt(path);
  v218ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Setting'} restored to default`);
}

function v218ResetNavigationDefaults(){
  try{
    S.navLayout=v161NormalizeNavLayout(null);
    S.navLayout.modifiedAt=Date.now();
    saveState();
    render();
    showToast('Navigation restored to default');
  }catch(_){
    showToast('Could not restore navigation defaults');
  }
}

function v218ResetScopeCategory(scopeKey,id,label){
  const def=v218GetByPath(DEFAULT_SETTINGS,`v186ControlCenter.${scopeKey}.categoryIds`);
  if(!Array.isArray(def))return;
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg?.[scopeKey];
  if(!scope)return;
  const set=new Set(scope.categoryIds.map(String));
  if(def.map(String).includes(String(id)))set.add(String(id));else set.delete(String(id));
  scope.categoryIds=[...set];
  scope.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(`${label||'Category'} restored to default`);
}

function v218RestoreAllDefaults(){
  const ok=window.confirm('Restore every MediaFlow setting to its default?\n\nYour Library, History, XP, categories and other content data are not deleted. Navigation layout and all Settings preferences will be reset.');
  if(!ok)return;

  S.settings=v218Clone(DEFAULT_SETTINGS);
  S.malLink={username:'',mode:'anime'};
  try{S.navLayout=v161NormalizeNavLayout(null);S.navLayout.modifiedAt=Date.now();}catch(_){ }

  v218ApplySettingsSideEffects();
  try{saveState();}catch(_){persistSettings();}
  render();
  showToast('All settings restored to defaults');
}

function v218ResetDescriptorForControl(el){
  if(!el)return null;
  const code=[el.getAttribute('onchange'),el.getAttribute('onclick'),el.getAttribute('oninput')].filter(Boolean).join(' ');
  if(!code)return null;
  let m;

  if((m=code.match(/App\.updateSetting\('([^']+)'/)))return {type:'path',path:m[1]};
  if(/App\.setIntensity\(/.test(code))return {type:'path',path:'intensity'};
  if((m=code.match(/App\.updateLeveling\('([^']+)'/)))return {type:'path',path:`leveling.${m[1]}`};
  if((m=code.match(/App\.updateLevelingUnit\('([^']+)'/)))return {type:'path',path:`leveling.unitXP.${m[1]}`};
  if((m=code.match(/App\.updateLevelingRotation\('([^']+)'/)))return {type:'path',path:`leveling.rotationMultiplier.${m[1]}`};
  if((m=code.match(/App\.updateRepeatUnitXP\('([^']+)'/)))return {type:'path',path:`leveling.repeatUnitXP.${m[1]}`};
  if((m=code.match(/App\.updateBackup\('([^']+)'/)))return {type:'path',path:`backup.${m[1]}`};
  if(/App\.toggleBackup\(/.test(code))return {type:'path',path:'backup.enabled'};
  if(/App\.toggleExactTitleRecommendations\(/.test(code))return {type:'path',path:'exactTitleRecommendations'};
  if(/App\.togglePrioritizePersonalOrder\(/.test(code))return {type:'path',path:'prioritizePersonalOrder'};
  if(/App\.v166ToggleSeasonalAuto\(/.test(code))return {type:'path',path:'seasonalFreshAuto'};
  if(/App\.v166SetSeasonalSyncMinutes\(/.test(code))return {type:'path',path:'seasonalFreshSyncMinutes'};
  if(/App\.v166SetManualSeasonalFreshCount\(/.test(code))return {type:'path',path:'seasonalFreshCount'};
  if(/App\.v171ToggleDefaultCategoryHighlight\(/.test(code))return {type:'path',path:'highlightDefaultCategories'};
  if(/App\.v172SetImportInterface\(/.test(code))return {type:'path',path:'mediaServicesImportInterface'};
  if(/App\.v175SetPageSize\(/.test(code)){ const mm=code.match(/App\.v175SetPageSize\('([^']+)'/); if(mm)return {type:'path',path:`v175PageSizes.${mm[1]}`}; }
  if(/App\.v183ToggleLibraryOverview\(/.test(code))return {type:'path',path:'v183LibraryOverview.showOverview'};
  if(/App\.v181SetDefaultLoggingMode\(/.test(code))return {type:'path',path:'v181Logging.defaultMode'};
  if(/App\.v181SetLibraryMode\(/.test(code))return {type:'path',path:'v181Library.mode'};
  if((m=code.match(/App\.v181SetCoverSize\('([^']+)'/)))return {type:'path',path:`v181CoverSizes.${m[1]}`};
  if(/App\.v188SetTitleTextSize\(/.test(code))return {type:'path',path:'v188Library.titleText.percent'};
  if(/App\.v188SetOverviewOrderMode\(/.test(code))return {type:'path',path:'v188Library.overview.orderMode'};
  if(/App\.v188SetOverviewVisibilityMode\(/.test(code))return {type:'path',path:'v188Library.overview.visibilityMode'};
  if(/App\.v188SetOverviewPerPage\(/.test(code))return {type:'path',path:'v188Library.overview.perPage'};
  if((m=code.match(/App\.v192ToggleDashboardSection\('([^']+)'/)))return {type:'path',path:`v192Dashboard.${m[1]}`};
  if(/App\.v194SetCategoryIconScale\(/.test(code))return {type:'path',path:'v194CategoryIcons.scale'};
  if(/App\.v201SetCoverCategoryIconScale\(/.test(code))return {type:'path',path:'v194CategoryIcons.coverScale'};
  if(/App\.v200ToggleCategoryDefaultCovers\(/.test(code))return {type:'path',path:'v200CategoryCovers.useCategoryDefault'};
  if(/App\.v161ToggleAutoUpdateCheck\(/.test(code))return {type:'path',path:'autoUpdateCheck'};
  if((m=code.match(/App\.v167UpdateRespectSetting\('([^']+)'/)))return {type:'path',path:`systemRespectXP.${m[1]}`};
  if((m=code.match(/App\.v186SetStatsComponent\('([^']+)'/)))return {type:'path',path:`v186ControlCenter.statsComponents.values.${m[1]}`};
  if((m=code.match(/App\.v186SetScopeMode\('([^']+)'/)))return {type:'path',path:`v186ControlCenter.${m[1]}.mode`};
  if((m=code.match(/App\.v186ToggleScopeCategory\('([^']+)','([^']+)'/)))return {type:'scopeCategory',scope:m[1],id:m[2]};
  if(/App\.setTheme\(/.test(code))return {type:'path',path:'theme'};
  if(/App\.setAppearanceMode\(/.test(code))return {type:'path',path:'appearanceMode'};
  if(/App\.(?:setGlobalAppearanceEnabled|toggleGlobalAppearance)\(/.test(code))return {type:'path',path:'globalAppearanceEnabled'};
  if(/App\.toggleAppearanceMode\(/.test(code))return {type:'path',path:'appearanceMode'};
  if((m=code.match(/App\.setCustomTheme\('([^']+)'/)))return {type:'path',path:`customTheme.${m[1]}`};
  if(/App\.setLibraryView\(/.test(code))return {type:'path',path:'libraryView'};
  if(/App\.toggleDynamicCoverTheme\(/.test(code))return {type:'path',path:'dynamicCoverTheme'};
  if(/App\.v162SetLibraryThemeInterval\(/.test(code))return {type:'path',path:'v162LibraryTheme.intervalSec'};
  if(/App\.v162SetImageThemeInterval\(/.test(code))return {type:'path',path:'v162ImageTheme.intervalSec'};
  if((m=code.match(/App\.v173SetThemeInterval\('([^']+)'/))){
    const map={'recommended-only':'v173RecommendedTheme.intervalSec','onthisday-only':'v173OnThisDayTheme.intervalSec','source-picker':'v173SourcePickerTheme.intervalSec'};
    if(map[m[1]])return {type:'path',path:map[m[1]]};
  }
  if(/App\.v163SetDynamicThemeInterval\(/.test(code))return {type:'path',path:'v163DynamicThemeIntervalSec'};
  if((m=code.match(/App\.v161(?:SetNavPosition|MoveNav|ToggleNav)\('([^']+)'/)))return {type:'navigation'};
  return null;
}

function v218SettingLabelForControl(el){
  const holder=el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v188-overview-settings-grid,.v194-category-icon-controls,.v161-nav-row');
  const label=holder?.querySelector('.field-label,label,b,.v186-scope-name,.v161-nav-label')?.textContent;
  return String(label||el.getAttribute('aria-label')||el.getAttribute('title')||'Setting').trim().replace(/\s+/g,' ');
}

function v218ResetButtonContainer(el){
  return el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v194-category-icon-controls,.v161-nav-row') || el.parentElement;
}

function v218EnhancePerSettingResets(root){
  if(!root)return;
  const controls=[...root.querySelectorAll('input[onchange],select[onchange],button.toggle[onclick]')];
  const seen=new WeakMap();

  for(const el of controls){
    if(el.closest('.settings-categories-full'))continue; // Category objects are Library data, not Settings defaults.
    if(el.type==='file'||el.disabled)continue;
    const desc=v218ResetDescriptorForControl(el);
    if(!desc)continue;
    const holder=v218ResetButtonContainer(el);
    if(!holder)continue;

    const key=desc.type==='path'?`path:${desc.path}`:desc.type==='scopeCategory'?`scope:${desc.scope}:${desc.id}`:desc.type;
    let keys=seen.get(holder);
    if(!keys){keys=new Set();seen.set(holder,keys);}
    if(keys.has(key))continue;
    keys.add(key);

    // Respect native reset buttons already present for exactly this control group.
    const existing=[...holder.querySelectorAll('button')].some(b=>/reset|default/i.test(String(b.textContent||'')));
    if(existing&&holder!==el.parentElement)continue;

    const label=v218SettingLabelForControl(el);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v218-setting-reset';
    btn.textContent='Reset';
    btn.title=`Restore ${label} to default`;
    btn.setAttribute('aria-label',`Restore ${label} to default`);
    btn.addEventListener('click',ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(desc.type==='path')v218ResetSettingPath(desc.path,label);
      else if(desc.type==='navigation')v218ResetNavigationDefaults();
      else if(desc.type==='scopeCategory')v218ResetScopeCategory(desc.scope,desc.id,label);
    });
    holder.classList.add('v218-resettable-setting');
    holder.appendChild(btn);
  }
}


function v218SectionResetPlan(title){
  const t=String(title||'').trim().toUpperCase();
  if(t==='DAILY GOAL')return {kind:'legacy',section:'daily'};
  if(t==='TITLE RECOMMENDATIONS')return {kind:'legacy',section:'titles'};
  if(t==='SCHEDULER TUNING')return {kind:'legacy',section:'scheduler'};
  if(t==='LEVELING & XP')return {kind:'legacy',section:'leveling'};
  if(t==='AUTOMATIC BACKUPS')return {kind:'legacy',section:'backups'};
  if(t==='APPEARANCE')return {kind:'legacy',section:'appearance'};
  if(t==='NAVIGATION')return {kind:'navigation'};
  if(t==='APP UPDATES')return {kind:'paths',paths:['autoUpdateCheck']};
  if(t==='LIBRARY EXPERIENCE')return {kind:'paths',paths:['v181Library']};
  if(t==='DEFAULT LOGGING METHOD')return {kind:'paths',paths:['v181Logging']};
  if(t==='COVER SIZE ADJUSTMENT')return {kind:'paths',paths:['v181CoverSizes']};
  if(t==='LIBRARY OVERVIEW')return {kind:'paths',paths:['v183LibraryOverview','v188Library']};
  if(t==='CATEGORY ICONS')return {kind:'paths',paths:['v194CategoryIcons']};
  if(t==='MISSING TITLE COVERS')return {kind:'paths',paths:['v200CategoryCovers']};
  if(t==='MEDIAFLOW SYSTEM')return {kind:'paths',paths:['v186ControlCenter.scheduler']};
  if(t==='DASHBOARD SETTINGS')return {kind:'paths',paths:['v186ControlCenter.todayBalance','v192Dashboard']};
  if(t==='STATISTICS SETTINGS')return {kind:'paths',paths:['v186ControlCenter.statsComponents','v186ControlCenter.categoryBalance','v186ControlCenter.saturation']};
  if(t.includes('PAGINATION'))return {kind:'paths',paths:['v175PageSizes']};
  if(t.includes('THEMES')||t.includes('CUSTOMIZATION'))return {kind:'paths',paths:['theme','customTheme','globalAppearanceEnabled','appearanceMode','dynamicCoverTheme','v162ThemeCollection','v162LibraryTheme','v162ImageTheme','v173RecommendedTheme','v173OnThisDayTheme','v173SourcePickerTheme','v163DynamicThemeIntervalSec']};
  return null;
}

function v218ResetSettingsPaths(paths,label){
  S.settings=S.settings||{};
  let changed=false;
  for(const path of (paths||[])){
    const def=v218GetByPath(DEFAULT_SETTINGS,path);
    if(def===undefined)continue;
    v218SetByPath(S.settings,path,v218Clone(def));
    v218TouchModifiedAt(path);
    changed=true;
  }
  if(!changed){showToast(`No canonical defaults are registered for ${label||'this section'}.`);return;}
  v218ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Section'} restored to defaults`);
}

function v218ResetSettingsSectionPlan(plan,label){
  if(!plan)return;
  if(plan.kind==='legacy'){resetSettingsSection(plan.section);return;}
  if(plan.kind==='navigation'){v218ResetNavigationDefaults();return;}
  if(plan.kind==='paths'){v218ResetSettingsPaths(plan.paths,label);}
}

function v218EnhanceSectionResetButtons(root){
  if(!root)return;
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  for(const label of labels){
    const title=String(label.textContent||'').replace(/\b(Default|Reset)\b/gi,'').trim().replace(/\s+/g,' ');
    const plan=v218SectionResetPlan(title);
    if(!plan)continue;
    const existing=[...label.querySelectorAll('button')].some(btn=>/reset|default/i.test(String(btn.textContent||'')));
    if(existing)continue;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v218-section-reset';
    btn.textContent='Reset section';
    btn.title=`Restore ${title} to defaults`;
    btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();v218ResetSettingsSectionPlan(plan,title);});
    label.classList.add('v218-settings-section-head');
    label.appendChild(btn);
  }
}

function v218SectionNodes(label){
  const nodes=[label];
  let cur=label.nextElementSibling;
  while(cur){
    if(cur.classList?.contains('section-label'))break;
    nodes.push(cur);
    cur=cur.nextElementSibling;
  }
  return nodes;
}

function v218BuildSettingsRegistry(root){
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  const used=new Set();
  const registry=[];
  labels.forEach((label,index)=>{
    const title=String(label.textContent||'').replace(/\b(Default|Reset)\b/gi,'').trim().replace(/\s+/g,' ');
    if(!title)return;
    let id=`v218-settings-${v218Slug(title)}`;
    let n=2;while(used.has(id))id=`v218-settings-${v218Slug(title)}-${n++}`;
    used.add(id);
    label.id=id;
    const nodes=v218SectionNodes(label);
    const text=nodes.map(node=>node.textContent||'').join(' ').replace(/\s+/g,' ').toLowerCase();
    registry.push({id,title,group:v218SettingsGroup(title),label,nodes,text,index});
  });
  V218_SETTINGS_REGISTRY=registry;
  return registry;
}

function v218RenderSettingsNav(registry){
  const nav=document.getElementById('v218-settings-nav');
  if(!nav)return;
  const groups=[];
  for(const item of registry){
    let group=groups.find(g=>g.name===item.group);
    if(!group){group={name:item.group,items:[]};groups.push(group);}
    group.items.push(item);
  }
  nav.innerHTML=groups.map(group=>`<div class="v218-settings-nav-group">
    <div class="v218-settings-nav-title">${escapeHtml(group.name)}</div>
    ${group.items.map(item=>`<button type="button" class="v218-settings-nav-item" data-settings-target="${escapeHtml(item.id)}" onclick="App.v218JumpSettings('${escapeHtml(item.id)}')">${escapeHtml(item.title)}</button>`).join('')}
  </div>`).join('');
}

function v218SearchSettings(value){
  const query=String(value||'').trim().toLowerCase();
  V218_SETTINGS_QUERY=query;
  let visible=0;
  for(const section of V218_SETTINGS_REGISTRY){
    const match=!query||section.text.includes(query)||section.title.toLowerCase().includes(query);
    section.nodes.forEach(node=>node.classList.toggle('v218-settings-hidden',!match));
    if(match)visible++;
    const nav=document.querySelector(`.v218-settings-nav-item[data-settings-target="${CSS.escape(section.id)}"]`);
    if(nav)nav.classList.toggle('v218-settings-hidden',!match);
  }
  document.querySelectorAll('.v218-settings-nav-group').forEach(group=>{
    const any=[...group.querySelectorAll('.v218-settings-nav-item')].some(btn=>!btn.classList.contains('v218-settings-hidden'));
    group.classList.toggle('v218-settings-hidden',!any);
  });
  const count=document.getElementById('v218-settings-search-count');
  if(count)count.textContent=query?`${visible} section${visible===1?'':'s'} found`:`${V218_SETTINGS_REGISTRY.length} settings sections`;
  const empty=document.getElementById('v218-settings-empty');
  if(empty)empty.hidden=visible!==0;
}

function v218ClearSettingsSearch(){
  const input=document.getElementById('v218-settings-search');
  if(input)input.value='';
  v218SearchSettings('');
  input?.focus();
}

function v218JumpSettings(id){
  const el=document.getElementById(String(id||''));
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'start'});
  el.classList.add('v218-settings-flash');
  setTimeout(()=>el.classList.remove('v218-settings-flash'),900);
}

function v218EnhanceSettingsDom(){
  const page=document.querySelector('.v218-settings-page');
  if(!page||String(S.view||'')!=='settings')return;
  const content=page.querySelector('.v218-settings-content');
  if(!content)return;
  const registry=v218BuildSettingsRegistry(content);
  v218RenderSettingsNav(registry);
  v218EnhancePerSettingResets(content);
  v218EnhanceSectionResetButtons(content);
  v218SearchSettings(V218_SETTINGS_QUERY);
}

const v218RenderSettingsBase=renderSettings;
renderSettings=function(){
  let raw=v218RenderSettingsBase.apply(this,arguments);
  let head='';
  try{
    const host=document.createElement('div');
    host.innerHTML=raw;
    const viewHead=host.querySelector('.view-head');
    if(viewHead){
      viewHead.querySelectorAll('button').forEach(btn=>{
        if(String(btn.getAttribute('onclick')||'').includes('resetAllSettings'))btn.remove();
      });
      head=viewHead.outerHTML;
      viewHead.remove();
    }
    raw=host.innerHTML;
  }catch(_){ }

  const html=`<div class="v218-settings-page">
    ${head||'<div class="view-head"><div><div class="view-title">Settings</div><div class="view-desc">Configure MediaFlow.</div></div></div>'}
    <div class="v218-settings-toolbar">
      <div class="v218-settings-search-wrap">
        <span class="v218-settings-search-icon">⌕</span>
        <input id="v218-settings-search" type="search" autocomplete="off" placeholder="Search settings…" value="${escapeHtml(V218_SETTINGS_QUERY)}" oninput="App.v218SearchSettings(this.value)">
        <button type="button" class="btn btn-sm btn-ghost v218-settings-clear" onclick="App.v218ClearSettingsSearch()">Clear</button>
      </div>
      <div class="v218-settings-toolbar-meta"><span id="v218-settings-search-count">Settings</span><button type="button" class="btn btn-danger" onclick="App.v218RestoreAllDefaults()">Restore all defaults</button></div>
    </div>
    <div class="v218-settings-layout">
      <aside id="v218-settings-nav" class="v218-settings-nav" aria-label="Settings sections"></aside>
      <main class="v218-settings-content">${raw}<div id="v218-settings-empty" class="empty-state v218-settings-empty" hidden>No settings match your search.</div></main>
    </div>
  </div>`;

  setTimeout(v218EnhanceSettingsDom,0);
  return html;
};

// Replace the old incomplete reset-all implementation with the audited v218 path.
resetAllSettings=v218RestoreAllDefaults;
Object.assign(App,{
  resetAllSettings:v218RestoreAllDefaults,
  v218RestoreAllDefaults,
  v218ResetSettingPath,
  v218ResetNavigationDefaults,
  v218SearchSettings,
  v218ClearSettingsSearch,
  v218JumpSettings
});

/* Rebuild the Settings index after any full render. */
const v218RenderBase=render;
render=function(){
  const result=v218RenderBase.apply(this,arguments);
  if(String(S.view||'')==='settings')setTimeout(v218EnhanceSettingsDom,0);
  return result;
};
