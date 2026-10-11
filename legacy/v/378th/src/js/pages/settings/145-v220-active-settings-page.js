/* ============================================================
   MediaFlow v220 — Settings Organization & Search Polish
   - searchable Settings page
   - redesigned Settings search and quick navigation
   - page sections ordered exactly like the Settings index
   - per-setting reset buttons where a canonical default exists
   - complete Restore all defaults audit, including navigation layout
   ============================================================ */

const V220_SETTINGS_VERSION=220;
let V220_SETTINGS_REGISTRY=[];
let V220_SETTINGS_QUERY='';

function v220Clone(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}

function v220Slug(value){
  return String(value||'settings')
    .trim().toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'settings';
}

const V220_SETTINGS_GROUP_ORDER=['Library','Interface','Appearance','MediaFlow System','Progression','Statistics','Data & Sync'];

const V220_SETTINGS_SECTION_ORDER={
  'Library':['CATEGORIES','LIBRARY EXPERIENCE','DEFAULT LOGGING METHOD','COVER SIZE ADJUSTMENT','LIBRARY INTEGRITY','CATEGORY ICONS','MISSING TITLE COVERS','LIBRARY OVERVIEW','LIBRARY MAINTENANCE','CATEGORY MAINTENANCE','COVER MAINTENANCE'],
  'Interface':['DASHBOARD SETTINGS','NAVIGATION','APP UPDATES'],
  'Appearance':['THEMES & CUSTOMIZATION'],
  'MediaFlow System':['DAILY GOAL','TITLE RECOMMENDATIONS','MEDIAFLOW SYSTEM','SCHEDULER TUNING'],
  'Progression':['LEVELING & XP'],
  'Statistics':['STATISTICS SETTINGS'],
  'Data & Sync':['IMPORT / EXPORT — MEDIA SERVICES','AUTOMATIC BACKUPS','CLOUD SYNC','SETTINGS PRESET','DATA']
};

const V220_NATIVE_DEFAULT_BUTTON_SECTIONS=new Set([
  'DAILY GOAL','TITLE RECOMMENDATIONS','SCHEDULER TUNING','LEVELING & XP','AUTOMATIC BACKUPS'
]);

function v220PlainSectionTitle(label){
  if(!label)return '';
  const clone=label.cloneNode(true);
  clone.querySelectorAll('button').forEach(btn=>btn.remove());
  let title=String(clone.textContent||'').trim().replace(/\s+/g,' ');
  title=title.replace(/^🛠\s*/u,'').trim();
  title=title.replace(/\s+Default$/i,'').trim();
  if(/^LOGGING METHOD$/i.test(title))title='DEFAULT LOGGING METHOD';
  return title;
}

function v220DisplaySectionTitle(title){
  const t=String(title||'').trim();
  if(t==='DEFAULT LOGGING METHOD')return 'LOGGING METHOD';
  return t;
}

function v220SettingsGroup(label){
  const t=String(label||'').trim().toUpperCase();
  if(t==='CATEGORIES'||/^(LIBRARY|DEFAULT LOGGING METHOD|COVER SIZE ADJUSTMENT|LIBRARY INTEGRITY|CATEGORY ICONS|MISSING TITLE COVERS|CATEGORY MAINTENANCE|COVER MAINTENANCE)/.test(t))return 'Library';
  if(/^(DASHBOARD SETTINGS|NAVIGATION|APP UPDATES)/.test(t))return 'Interface';
  if(/THEME|APPEARANCE|STYLE/.test(t))return 'Appearance';
  if(/^(DAILY GOAL|TITLE RECOMMENDATIONS|MEDIAFLOW SYSTEM|SCHEDULER TUNING)/.test(t)||/SEASONAL/.test(t))return 'MediaFlow System';
  if(/^(LEVELING & XP|LEVELING|XP|SYSTEM RESPECT)/.test(t))return 'Progression';
  if(/STATISTIC/.test(t))return 'Statistics';
  if(/IMPORT|EXPORT|BACKUP|DATA|CLOUD|PRESET|SYNC/.test(t))return 'Data & Sync';
  return 'Library';
}

function v220SectionSortRank(item){
  const list=V220_SETTINGS_SECTION_ORDER[item.group]||[];
  const idx=list.indexOf(item.title);
  return idx>=0?idx:1000+Number(item.index||0);
}

function v220SortedRegistry(registry){
  return [...(registry||[])].sort((a,b)=>{
    const ga=V220_SETTINGS_GROUP_ORDER.indexOf(a.group);
    const gb=V220_SETTINGS_GROUP_ORDER.indexOf(b.group);
    if(ga!==gb)return ga-gb;
    const sa=v220SectionSortRank(a), sb=v220SectionSortRank(b);
    return sa!==sb?sa-sb:a.index-b.index;
  });
}

function v220GetByPath(obj,path){
  let cur=obj;
  for(const part of String(path||'').split('.').filter(Boolean)){
    if(cur==null||typeof cur!=='object'||!(part in cur))return undefined;
    cur=cur[part];
  }
  return cur;
}

function v220SetByPath(obj,path,value){
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

function v220TouchModifiedAt(path){
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

function v220ApplySettingsSideEffects(){
  try{applyTheme(S.settings?.theme||DEFAULT_SETTINGS.theme);}catch(_){ }
  try{v181ApplyCoverVars();}catch(_){ }
  try{v194ApplyCategoryIconScale();}catch(_){ }
  try{v201ApplyCoverCategoryIconScale();}catch(_){ }
  try{restartBackupTimer();}catch(_){ }
  try{v161EnsureAutomaticUpdateCheck(false);}catch(_){ }
  try{v162EnsureRotationTimer(true);}catch(_){ }
  try{v146ScheduleDynamicTheme();}catch(_){ }
}

function v220ResetSettingPath(path,label){
  const def=v220GetByPath(DEFAULT_SETTINGS,path);
  if(def===undefined){
    showToast(`No canonical default is registered for ${label||'this setting'}.`);
    return;
  }
  S.settings=S.settings||{};
  v220SetByPath(S.settings,path,v220Clone(def));
  v220TouchModifiedAt(path);
  v220ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Setting'} restored to default`);
}

function v220ResetNavigationDefaults(){
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

function v220ResetScopeCategory(scopeKey,id,label){
  const def=v220GetByPath(DEFAULT_SETTINGS,`v186ControlCenter.${scopeKey}.categoryIds`);
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

function v220RestoreAllDefaults(){
  const ok=window.confirm('Restore every MediaFlow setting to its default?\n\nYour Library, History, XP, categories and other content data are not deleted. Navigation layout and all Settings preferences will be reset.');
  if(!ok)return;

  S.settings=v220Clone(DEFAULT_SETTINGS);
  S.malLink={username:'',mode:'anime'};
  try{S.navLayout=v161NormalizeNavLayout(null);S.navLayout.modifiedAt=Date.now();}catch(_){ }

  v220ApplySettingsSideEffects();
  try{saveState();}catch(_){persistSettings();}
  render();
  showToast('All settings restored to defaults');
}

function v220ResetDescriptorForControl(el){
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

function v220SettingLabelForControl(el){
  const holder=el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v188-overview-settings-grid,.v194-category-icon-controls,.v161-nav-row');
  const label=holder?.querySelector('.field-label,label,b,.v186-scope-name,.v161-nav-label')?.textContent;
  return String(label||el.getAttribute('aria-label')||el.getAttribute('title')||'Setting').trim().replace(/\s+/g,' ');
}

function v220ResetButtonContainer(el){
  return el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v194-category-icon-controls,.v161-nav-row') || el.parentElement;
}

function v220EnhancePerSettingResets(root){
  if(!root)return;
  const controls=[...root.querySelectorAll('input[onchange],input[oninput],select[onchange],button[onclick]')];
  const seen=new WeakMap();

  for(const el of controls){
    if(el.closest('.settings-categories-full'))continue; // Category objects are Library data, not Settings defaults.
    if(el.type==='file'||el.disabled)continue;
    const desc=v220ResetDescriptorForControl(el);
    if(!desc)continue;
    const holder=v220ResetButtonContainer(el);
    if(!holder)continue;

    const key=desc.type==='path'?`path:${desc.path}`:desc.type==='scopeCategory'?`scope:${desc.scope}:${desc.id}`:desc.type;
    let keys=seen.get(holder);
    if(!keys){keys=new Set();seen.set(holder,keys);}
    if(keys.has(key))continue;
    keys.add(key);

    // Respect native reset buttons already present for exactly this control group.
    const existing=[...holder.querySelectorAll('button')].some(b=>/reset|default/i.test(String(b.textContent||'')));
    if(existing&&holder!==el.parentElement)continue;

    const label=v220SettingLabelForControl(el);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v220-setting-reset';
    btn.textContent='Reset';
    btn.title=`Restore ${label} to default`;
    btn.setAttribute('aria-label',`Restore ${label} to default`);
    btn.addEventListener('click',ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(desc.type==='path')v220ResetSettingPath(desc.path,label);
      else if(desc.type==='navigation')v220ResetNavigationDefaults();
      else if(desc.type==='scopeCategory')v220ResetScopeCategory(desc.scope,desc.id,label);
    });
    holder.classList.add('v220-resettable-setting');
    holder.appendChild(btn);
  }
}


function v220SectionResetPlan(title){
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

function v220ResetSettingsPaths(paths,label){
  S.settings=S.settings||{};
  let changed=false;
  for(const path of (paths||[])){
    const def=v220GetByPath(DEFAULT_SETTINGS,path);
    if(def===undefined)continue;
    v220SetByPath(S.settings,path,v220Clone(def));
    v220TouchModifiedAt(path);
    changed=true;
  }
  if(!changed){showToast(`No canonical defaults are registered for ${label||'this section'}.`);return;}
  v220ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Section'} restored to defaults`);
}

function v220ResetSettingsSectionPlan(plan,label){
  if(!plan)return;
  if(plan.kind==='legacy'){resetSettingsSection(plan.section);return;}
  if(plan.kind==='navigation'){v220ResetNavigationDefaults();return;}
  if(plan.kind==='paths'){v220ResetSettingsPaths(plan.paths,label);}
}

function v220EnhanceSectionResetButtons(root){
  if(!root)return;
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  for(const label of labels){
    const title=v220PlainSectionTitle(label);
    const plan=v220SectionResetPlan(title);
    if(!plan)continue;
    const existing=[...label.querySelectorAll('button')].some(btn=>/reset section/i.test(String(btn.textContent||'')));
    if(existing)continue;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v220-section-reset';
    btn.textContent='Reset section';
    btn.title=`Restore ${v220DisplaySectionTitle(title)} to defaults`;
    btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();v220ResetSettingsSectionPlan(plan,v220DisplaySectionTitle(title));});
    label.classList.add('v220-settings-section-head');
    label.appendChild(btn);
  }
}

function v220NormalizeSectionLabels(root){
  if(!root)return;
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  for(const label of labels){
    const title=v220PlainSectionTitle(label);
    if(title==='LIBRARY INTEGRITY'){
      const buttons=[...label.querySelectorAll('button')];
      label.textContent='LIBRARY INTEGRITY';
      buttons.forEach(btn=>label.appendChild(btn));
    }
    if(V220_NATIVE_DEFAULT_BUTTON_SECTIONS.has(title)){
      label.querySelectorAll('button').forEach(btn=>{
        if(/^Default$/i.test(String(btn.textContent||'').trim()))btn.remove();
      });
    }
  }
}

function v220SectionNodes(label){
  const special=label.closest('.settings-categories-full');
  if(special)return [special];
  const nodes=[label];
  let cur=label.nextElementSibling;
  while(cur){
    if(cur.classList?.contains('section-label'))break;
    if(cur.matches?.('.two-col,footer,.v147-settings-footer,.v220-settings-empty,.v220-settings-page-group'))break;
    if(cur.querySelector?.(':scope > .section-label'))break;
    nodes.push(cur);
    cur=cur.nextElementSibling;
  }
  return nodes;
}

function v220BuildSettingsRegistry(root){
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  const used=new Set();
  const seenMoveNodes=new Set();
  const registry=[];
  labels.forEach((label,index)=>{
    const title=v220PlainSectionTitle(label);
    if(!title)return;
    let id=`v220-settings-${v220Slug(title)}`;
    let n=2;while(used.has(id))id=`v220-settings-${v220Slug(title)}-${n++}`;
    used.add(id);
    label.id=id;
    const nodes=v220SectionNodes(label).filter(node=>{
      if(seenMoveNodes.has(node))return false;
      seenMoveNodes.add(node);return true;
    });
    const text=nodes.map(node=>node.textContent||'').join(' ').replace(/\s+/g,' ').toLowerCase();
    registry.push({id,title,displayTitle:v220DisplaySectionTitle(title),group:v220SettingsGroup(title),label,nodes,text,index});
  });
  V220_SETTINGS_REGISTRY=v220SortedRegistry(registry);
  return V220_SETTINGS_REGISTRY;
}

function v220OrganizeSettingsContent(root,registry){
  if(!root)return;
  root.querySelectorAll(':scope > .v220-settings-page-group').forEach(el=>el.remove());
  const footer=[...root.children].find(el=>el.matches?.('footer,.v147-settings-footer'))||null;
  const empty=document.getElementById('v220-settings-empty');
  const anchor=footer||empty||null;
  const sorted=v220SortedRegistry(registry);

  for(const groupName of V220_SETTINGS_GROUP_ORDER){
    const items=sorted.filter(item=>item.group===groupName);
    if(!items.length)continue;
    const group=document.createElement('section');
    group.className='v220-settings-page-group';
    group.dataset.settingsGroup=groupName;
    group.innerHTML=`<div class="v220-settings-page-group-head"><div><span class="v220-settings-page-group-kicker">Settings group</span><h2>${escapeHtml(groupName)}</h2></div><span class="v220-settings-page-group-count">${items.length} section${items.length===1?'':'s'}</span></div><div class="v220-settings-page-group-body"></div>`;
    const body=group.querySelector('.v220-settings-page-group-body');
    for(const item of items){
      for(const node of item.nodes){ if(node&&node.parentNode)body.appendChild(node); }
    }
    root.insertBefore(group,anchor);
  }

  root.querySelectorAll(':scope > .two-col').forEach(wrapper=>{if(!wrapper.children.length)wrapper.remove();});
}

function v220RenderSettingsNav(registry){
  const nav=document.getElementById('v220-settings-nav');
  if(!nav)return;
  const sorted=v220SortedRegistry(registry);
  const groups=V220_SETTINGS_GROUP_ORDER.map(name=>({name,items:sorted.filter(item=>item.group===name)})).filter(group=>group.items.length);
  nav.innerHTML=groups.map(group=>`<div class="v220-settings-nav-group" data-settings-group="${escapeHtml(group.name)}">
    <div class="v220-settings-nav-title">${escapeHtml(group.name)}</div>
    ${group.items.map(item=>`<button type="button" class="v220-settings-nav-item" data-settings-target="${escapeHtml(item.id)}" onclick="App.v220JumpSettings('${escapeHtml(item.id)}')">${escapeHtml(item.displayTitle)}</button>`).join('')}
  </div>`).join('');
}

function v220SearchSettings(value){
  const query=String(value||'').trim().toLowerCase();
  V220_SETTINGS_QUERY=query;
  let visible=0;
  for(const section of V220_SETTINGS_REGISTRY){
    const match=!query||section.text.includes(query)||section.title.toLowerCase().includes(query)||section.displayTitle.toLowerCase().includes(query)||section.group.toLowerCase().includes(query);
    section.nodes.forEach(node=>node.classList.toggle('v220-settings-hidden',!match));
    if(match)visible++;
    const nav=document.querySelector(`.v220-settings-nav-item[data-settings-target="${CSS.escape(section.id)}"]`);
    if(nav)nav.classList.toggle('v220-settings-hidden',!match);
  }
  document.querySelectorAll('.v220-settings-nav-group').forEach(group=>{
    const any=[...group.querySelectorAll('.v220-settings-nav-item')].some(btn=>!btn.classList.contains('v220-settings-hidden'));
    group.classList.toggle('v220-settings-hidden',!any);
  });
  document.querySelectorAll('.v220-settings-page-group').forEach(group=>{
    const groupName=group.dataset.settingsGroup||'';
    const any=V220_SETTINGS_REGISTRY.some(section=>section.group===groupName&&section.nodes.some(node=>!node.classList.contains('v220-settings-hidden')));
    group.classList.toggle('v220-settings-hidden',!any);
  });
  const count=document.getElementById('v220-settings-search-count');
  if(count)count.textContent=query?`${visible} result${visible===1?'':'s'}`:`${V220_SETTINGS_REGISTRY.length} sections`;
  const clear=document.getElementById('v220-settings-clear');
  if(clear)clear.hidden=!query;
  const empty=document.getElementById('v220-settings-empty');
  if(empty)empty.hidden=visible!==0;
}

function v220ClearSettingsSearch(){
  const input=document.getElementById('v220-settings-search');
  if(input)input.value='';
  v220SearchSettings('');
  input?.focus();
}

function v220JumpSettings(id){
  const el=document.getElementById(String(id||''));
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'start'});
  el.classList.add('v220-settings-flash');
  setTimeout(()=>el.classList.remove('v220-settings-flash'),900);
}

function v220BindSettingsSearchShortcut(){
  if(window.__v220SettingsSearchShortcutBound)return;
  window.__v220SettingsSearchShortcutBound=true;
  document.addEventListener('keydown',ev=>{
    if((ev.ctrlKey||ev.metaKey)&&String(ev.key||'').toLowerCase()==='k'&&String(S.view||'')==='settings'){
      ev.preventDefault();
      document.getElementById('v220-settings-search')?.focus();
    }
  });
}

function v220EnhanceSettingsDom(){
  const page=document.querySelector('.v220-settings-page');
  if(!page||String(S.view||'')!=='settings')return;
  const content=page.querySelector('.v220-settings-content');
  if(!content)return;
  v220NormalizeSectionLabels(content);
  const registry=v220BuildSettingsRegistry(content);
  v220OrganizeSettingsContent(content,registry);
  v220RenderSettingsNav(registry);
  v220EnhancePerSettingResets(content);
  v220EnhanceSectionResetButtons(content);
  v220BindSettingsSearchShortcut();
  v220SearchSettings(V220_SETTINGS_QUERY);
}

const v220LegacySettingsRenderer=renderSettings;
function v220RenderSettingsPage(){
  let raw=v220LegacySettingsRenderer.apply(this,arguments);
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

  return `<div class="v220-settings-page">
    ${head||'<div class="view-head"><div><div class="view-title">Settings</div><div class="view-desc">Configure MediaFlow.</div></div></div>'}
    <div class="v220-settings-toolbar">
      <div class="v220-settings-search-panel">
        <div class="v220-settings-search-control">
          <span class="v220-settings-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></span>
          <div class="v220-settings-search-field">
            <label for="v220-settings-search">Search settings</label>
            <input id="v220-settings-search" type="search" autocomplete="off" spellcheck="false" placeholder="Search by setting, feature, or section…" value="${escapeHtml(V220_SETTINGS_QUERY)}" oninput="App.v220SearchSettings(this.value)">
          </div>
          <kbd class="v220-settings-search-shortcut">Ctrl K</kbd>
          <button id="v220-settings-clear" type="button" class="v220-settings-clear" onclick="App.v220ClearSettingsSearch()" aria-label="Clear settings search" title="Clear search" ${V220_SETTINGS_QUERY?'':'hidden'}>×</button>
        </div>
        <div class="v220-settings-search-status"><span id="v220-settings-search-count">Settings</span><span class="v220-settings-search-help">Search names, descriptions, and controls</span></div>
      </div>
      <button type="button" class="btn btn-danger v220-restore-all" onclick="App.v220RestoreAllDefaults()">Restore all defaults</button>
    </div>
    <div class="v220-settings-layout">
      <aside id="v220-settings-nav" class="v220-settings-nav" aria-label="Settings sections"></aside>
      <main class="v220-settings-content">${raw}<div id="v220-settings-empty" class="empty-state v220-settings-empty" hidden>No settings match your search.</div></main>
    </div>
  </div>`;
}

// Replace the old incomplete reset-all implementation with the audited v220 path.
resetAllSettings=v220RestoreAllDefaults;
Object.assign(App,{
  resetAllSettings:v220RestoreAllDefaults,
  v220RestoreAllDefaults,
  v220ResetSettingPath,
  v220ResetNavigationDefaults,
  v220SearchSettings,
  v220ClearSettingsSearch,
  v220JumpSettings
});

// v220 keeps Settings on the active runtime renderer and applies the polished organization layer.
MediaFlowRuntime.registerPageRenderer('settings',v220RenderSettingsPage);
MediaFlowRuntime.registerPageEnhancer('settings',v220EnhanceSettingsDom);
MediaFlowRuntime.version=220;
