/* ============================================================
   MediaFlow v221 — Settings Organization & Search Polish
   - searchable Settings page
   - polished Settings search and quick navigation
   - page sections ordered exactly like the Settings index
   - per-setting reset buttons where a canonical default exists
   - complete Restore all defaults audit, including navigation layout
   ============================================================ */

const V221_SETTINGS_VERSION=221;
let V221_SETTINGS_REGISTRY=[];
let V221_SETTINGS_QUERY='';

function v221Clone(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}

function v221Slug(value){
  return String(value||'settings')
    .trim().toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'settings';
}

const V221_SETTINGS_GROUP_ORDER=['Library','Interface','Appearance','MediaFlow System','Progression','Data & Sync','Updates'];

const V221_SETTINGS_SECTION_ORDER={
  'Library':['CATEGORIES','LIBRARY EXPERIENCE','DEFAULT LOGGING METHOD','COVER SIZE ADJUSTMENT','LIBRARY INTEGRITY','CATEGORY ICONS','MISSING TITLE COVERS','LIBRARY OVERVIEW','LIBRARY MAINTENANCE','CATEGORY MAINTENANCE','COVER MAINTENANCE'],
  'Interface':['NAVIGATION','DASHBOARD SETTINGS','STATISTICS SETTINGS'],
  'Appearance':['THEMES & CUSTOMIZATION'],
  'MediaFlow System':['DAILY GOAL','TITLE RECOMMENDATIONS','MEDIAFLOW SYSTEM','SCHEDULER TUNING'],
  'Progression':['LEVELING & XP'],
  'Data & Sync':['IMPORT / EXPORT — MEDIA SERVICES','AUTOMATIC BACKUPS','CLOUD SYNC','SETTINGS PRESET','DATA'],
  'Updates':['APP UPDATES']
};

const V221_NATIVE_DEFAULT_BUTTON_SECTIONS=new Set([
  'DAILY GOAL','TITLE RECOMMENDATIONS','SCHEDULER TUNING','LEVELING & XP','AUTOMATIC BACKUPS'
]);

function v221PlainSectionTitle(label){
  if(!label)return '';
  const clone=label.cloneNode(true);
  clone.querySelectorAll('button').forEach(btn=>btn.remove());
  let title=String(clone.textContent||'').trim().replace(/\s+/g,' ');
  title=title.replace(/^🛠\s*/u,'').trim();
  title=title.replace(/\s+Default$/i,'').trim();
  if(/^LOGGING METHOD$/i.test(title))title='DEFAULT LOGGING METHOD';
  return title;
}

function v221DisplaySectionTitle(title){
  const t=String(title||'').trim();
  if(t==='DEFAULT LOGGING METHOD')return 'LOGGING METHOD';
  return t;
}

function v221SettingsGroup(label){
  const t=String(label||'').trim().toUpperCase();
  if(t==='CATEGORIES'||/^(LIBRARY|DEFAULT LOGGING METHOD|COVER SIZE ADJUSTMENT|LIBRARY INTEGRITY|CATEGORY ICONS|MISSING TITLE COVERS|CATEGORY MAINTENANCE|COVER MAINTENANCE)/.test(t))return 'Library';
  if(/^(NAVIGATION|DASHBOARD SETTINGS|STATISTICS SETTINGS)/.test(t))return 'Interface';
  if(/^APP UPDATES/.test(t))return 'Updates';
  if(/THEME|APPEARANCE|STYLE/.test(t))return 'Appearance';
  if(/^(DAILY GOAL|TITLE RECOMMENDATIONS|MEDIAFLOW SYSTEM|SCHEDULER TUNING)/.test(t)||/SEASONAL/.test(t))return 'MediaFlow System';
  if(/^(LEVELING & XP|LEVELING|XP|SYSTEM RESPECT)/.test(t))return 'Progression';
  if(/IMPORT|EXPORT|BACKUP|DATA|CLOUD|PRESET|SYNC/.test(t))return 'Data & Sync';
  return 'Library';
}

function v221SectionSortRank(item){
  const list=V221_SETTINGS_SECTION_ORDER[item.group]||[];
  const idx=list.indexOf(item.title);
  return idx>=0?idx:1000+Number(item.index||0);
}

function v221SortedRegistry(registry){
  return [...(registry||[])].sort((a,b)=>{
    const ga=V221_SETTINGS_GROUP_ORDER.indexOf(a.group);
    const gb=V221_SETTINGS_GROUP_ORDER.indexOf(b.group);
    if(ga!==gb)return ga-gb;
    const sa=v221SectionSortRank(a), sb=v221SectionSortRank(b);
    return sa!==sb?sa-sb:a.index-b.index;
  });
}

function v221GetByPath(obj,path){
  let cur=obj;
  for(const part of String(path||'').split('.').filter(Boolean)){
    if(cur==null||typeof cur!=='object'||!(part in cur))return undefined;
    cur=cur[part];
  }
  return cur;
}

function v221SetByPath(obj,path,value){
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

function v221TouchModifiedAt(path){
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

function v221ApplySettingsSideEffects(){
  try{applyTheme(S.settings?.theme||DEFAULT_SETTINGS.theme);}catch(_){ }
  try{v181ApplyCoverVars();}catch(_){ }
  try{v194ApplyCategoryIconScale();}catch(_){ }
  try{v201ApplyCoverCategoryIconScale();}catch(_){ }
  try{restartBackupTimer();}catch(_){ }
  try{v161EnsureAutomaticUpdateCheck(false);}catch(_){ }
  try{v162EnsureRotationTimer(true);}catch(_){ }
  try{v146ScheduleDynamicTheme();}catch(_){ }
}

function v221ResetSettingPath(path,label){
  const def=v221GetByPath(DEFAULT_SETTINGS,path);
  if(def===undefined){
    showToast(`No canonical default is registered for ${label||'this setting'}.`);
    return;
  }
  S.settings=S.settings||{};
  v221SetByPath(S.settings,path,v221Clone(def));
  v221TouchModifiedAt(path);
  v221ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Setting'} restored to default`);
}

function v221ResetNavigationDefaults(){
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

function v221ResetScopeCategory(scopeKey,id,label){
  const def=v221GetByPath(DEFAULT_SETTINGS,`v186ControlCenter.${scopeKey}.categoryIds`);
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

function v221RestoreAllDefaults(){
  const ok=window.confirm('Restore every MediaFlow setting to its default?\n\nYour Library, History, XP, categories and other content data are not deleted. Navigation layout and all Settings preferences will be reset.');
  if(!ok)return;

  S.settings=v221Clone(DEFAULT_SETTINGS);
  S.malLink={username:'',mode:'anime'};
  try{S.navLayout=v161NormalizeNavLayout(null);S.navLayout.modifiedAt=Date.now();}catch(_){ }

  v221ApplySettingsSideEffects();
  try{saveState();}catch(_){persistSettings();}
  render();
  showToast('All settings restored to defaults');
}

function v221ResetDescriptorForControl(el){
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

function v221SettingLabelForControl(el){
  const holder=el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v188-overview-settings-grid,.v194-category-icon-controls,.v161-nav-row');
  const label=holder?.querySelector('.field-label,label,b,.v186-scope-name,.v161-nav-label')?.textContent;
  return String(label||el.getAttribute('aria-label')||el.getAttribute('title')||'Setting').trim().replace(/\s+/g,' ');
}

function v221ResetButtonContainer(el){
  return el.closest('.field,.settings-toggle-row,.v192-dashboard-toggle-row,.v167-respect-edit,.v181-cover-setting,.v186-stat-toggle,.v186-scope-row,.v186-scope-head,.v194-category-icon-controls,.v161-nav-row') || el.parentElement;
}

function v221EnhancePerSettingResets(root){
  if(!root)return;
  const controls=[...root.querySelectorAll('input[onchange],input[oninput],select[onchange],button[onclick]')];
  const seen=new WeakMap();

  for(const el of controls){
    if(el.closest('.settings-categories-full'))continue; // Category objects are Library data, not Settings defaults.
    if(el.type==='file'||el.disabled)continue;
    const desc=v221ResetDescriptorForControl(el);
    if(!desc)continue;
    const holder=v221ResetButtonContainer(el);
    if(!holder)continue;

    const key=desc.type==='path'?`path:${desc.path}`:desc.type==='scopeCategory'?`scope:${desc.scope}:${desc.id}`:desc.type;
    let keys=seen.get(holder);
    if(!keys){keys=new Set();seen.set(holder,keys);}
    if(keys.has(key))continue;
    keys.add(key);

    // Respect native reset buttons already present for exactly this control group.
    const existing=[...holder.querySelectorAll('button')].some(b=>/reset|default/i.test(String(b.textContent||'')));
    if(existing&&holder!==el.parentElement)continue;

    const label=v221SettingLabelForControl(el);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v221-setting-reset';
    btn.textContent='Reset';
    btn.title=`Restore ${label} to default`;
    btn.setAttribute('aria-label',`Restore ${label} to default`);
    btn.addEventListener('click',ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(desc.type==='path')v221ResetSettingPath(desc.path,label);
      else if(desc.type==='navigation')v221ResetNavigationDefaults();
      else if(desc.type==='scopeCategory')v221ResetScopeCategory(desc.scope,desc.id,label);
    });
    holder.classList.add('v221-resettable-setting');
    holder.appendChild(btn);
  }
}


function v221SectionResetPlan(title){
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

function v221ResetSettingsPaths(paths,label){
  S.settings=S.settings||{};
  let changed=false;
  for(const path of (paths||[])){
    const def=v221GetByPath(DEFAULT_SETTINGS,path);
    if(def===undefined)continue;
    v221SetByPath(S.settings,path,v221Clone(def));
    v221TouchModifiedAt(path);
    changed=true;
  }
  if(!changed){showToast(`No canonical defaults are registered for ${label||'this section'}.`);return;}
  v221ApplySettingsSideEffects();
  persistSettings();
  render();
  showToast(`${label||'Section'} restored to defaults`);
}

function v221ResetSettingsSectionPlan(plan,label){
  if(!plan)return;
  if(plan.kind==='legacy'){resetSettingsSection(plan.section);return;}
  if(plan.kind==='navigation'){v221ResetNavigationDefaults();return;}
  if(plan.kind==='paths'){v221ResetSettingsPaths(plan.paths,label);}
}

function v221EnhanceSectionResetButtons(root){
  if(!root)return;
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  for(const label of labels){
    const title=v221PlainSectionTitle(label);
    const plan=v221SectionResetPlan(title);
    if(!plan)continue;
    const existing=[...label.querySelectorAll('button')].some(btn=>/reset section/i.test(String(btn.textContent||'')));
    if(existing)continue;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn btn-sm btn-ghost v221-section-reset';
    btn.textContent='Reset section';
    btn.title=`Restore ${v221DisplaySectionTitle(title)} to defaults`;
    btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();v221ResetSettingsSectionPlan(plan,v221DisplaySectionTitle(title));});
    label.classList.add('v221-settings-section-head');
    label.appendChild(btn);
  }
}

function v221NormalizeSectionLabels(root){
  if(!root)return;
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  for(const label of labels){
    const title=v221PlainSectionTitle(label);
    if(title==='LIBRARY INTEGRITY'){
      const buttons=[...label.querySelectorAll('button')];
      label.textContent='LIBRARY INTEGRITY';
      buttons.forEach(btn=>label.appendChild(btn));
    }
    if(V221_NATIVE_DEFAULT_BUTTON_SECTIONS.has(title)){
      label.querySelectorAll('button').forEach(btn=>{
        if(/^Default$/i.test(String(btn.textContent||'').trim()))btn.remove();
      });
    }
  }
}

function v221SectionNodes(label){
  const special=label.closest('.settings-categories-full');
  if(special)return [special];
  const nodes=[label];
  let cur=label.nextElementSibling;
  while(cur){
    if(cur.classList?.contains('section-label'))break;
    if(cur.matches?.('.two-col,footer,.v147-settings-footer,.v221-settings-empty,.v221-settings-page-group'))break;
    if(cur.querySelector?.(':scope > .section-label'))break;
    nodes.push(cur);
    cur=cur.nextElementSibling;
  }
  return nodes;
}

function v221BuildSettingsRegistry(root){
  const labels=[...root.querySelectorAll('.section-label')].filter(el=>!el.closest('.card'));
  const used=new Set();
  const seenMoveNodes=new Set();
  const registry=[];
  labels.forEach((label,index)=>{
    const title=v221PlainSectionTitle(label);
    if(!title)return;
    let id=`v221-settings-${v221Slug(title)}`;
    let n=2;while(used.has(id))id=`v221-settings-${v221Slug(title)}-${n++}`;
    used.add(id);
    label.id=id;
    const nodes=v221SectionNodes(label).filter(node=>{
      if(seenMoveNodes.has(node))return false;
      seenMoveNodes.add(node);return true;
    });
    const text=nodes.map(node=>node.textContent||'').join(' ').replace(/\s+/g,' ').toLowerCase();
    registry.push({id,title,displayTitle:v221DisplaySectionTitle(title),group:v221SettingsGroup(title),label,nodes,text,index});
  });
  V221_SETTINGS_REGISTRY=v221SortedRegistry(registry);
  return V221_SETTINGS_REGISTRY;
}

function v221OrganizeSettingsContent(root,registry){
  if(!root)return;
  root.querySelectorAll(':scope > .v221-settings-page-group').forEach(el=>el.remove());
  const footer=[...root.children].find(el=>el.matches?.('footer,.v147-settings-footer'))||null;
  const empty=document.getElementById('v221-settings-empty');
  const anchor=footer||empty||null;
  const sorted=v221SortedRegistry(registry);

  for(const groupName of V221_SETTINGS_GROUP_ORDER){
    const items=sorted.filter(item=>item.group===groupName);
    if(!items.length)continue;
    const group=document.createElement('section');
    group.className='v221-settings-page-group';
    group.dataset.settingsGroup=groupName;
    group.innerHTML=`<div class="v221-settings-page-group-head"><div><span class="v221-settings-page-group-kicker">Settings group</span><h2>${escapeHtml(groupName)}</h2></div><span class="v221-settings-page-group-count">${items.length} section${items.length===1?'':'s'}</span></div><div class="v221-settings-page-group-body"></div>`;
    const body=group.querySelector('.v221-settings-page-group-body');
    for(const item of items){
      for(const node of item.nodes){ if(node&&node.parentNode)body.appendChild(node); }
    }
    root.insertBefore(group,anchor);
  }

  root.querySelectorAll(':scope > .two-col').forEach(wrapper=>{if(!wrapper.children.length)wrapper.remove();});
}

function v221RenderSettingsNav(registry){
  const nav=document.getElementById('v221-settings-nav');
  if(!nav)return;
  const sorted=v221SortedRegistry(registry);
  const groups=V221_SETTINGS_GROUP_ORDER.map(name=>({name,items:sorted.filter(item=>item.group===name)})).filter(group=>group.items.length);
  nav.innerHTML=groups.map(group=>`<div class="v221-settings-nav-group" data-settings-group="${escapeHtml(group.name)}">
    <div class="v221-settings-nav-title">${escapeHtml(group.name)}</div>
    ${group.items.map(item=>`<button type="button" class="v221-settings-nav-item" data-settings-target="${escapeHtml(item.id)}" onclick="App.v221JumpSettings('${escapeHtml(item.id)}')">${escapeHtml(item.displayTitle)}</button>`).join('')}
  </div>`).join('');
}

function v221SearchSettings(value){
  const query=String(value||'').trim().toLowerCase();
  V221_SETTINGS_QUERY=query;
  let visible=0;
  for(const section of V221_SETTINGS_REGISTRY){
    const match=!query||section.text.includes(query)||section.title.toLowerCase().includes(query)||section.displayTitle.toLowerCase().includes(query)||section.group.toLowerCase().includes(query);
    section.nodes.forEach(node=>node.classList.toggle('v221-settings-hidden',!match));
    if(match)visible++;
    const nav=document.querySelector(`.v221-settings-nav-item[data-settings-target="${CSS.escape(section.id)}"]`);
    if(nav)nav.classList.toggle('v221-settings-hidden',!match);
  }
  document.querySelectorAll('.v221-settings-nav-group').forEach(group=>{
    const any=[...group.querySelectorAll('.v221-settings-nav-item')].some(btn=>!btn.classList.contains('v221-settings-hidden'));
    group.classList.toggle('v221-settings-hidden',!any);
  });
  document.querySelectorAll('.v221-settings-page-group').forEach(group=>{
    const groupName=group.dataset.settingsGroup||'';
    const any=V221_SETTINGS_REGISTRY.some(section=>section.group===groupName&&section.nodes.some(node=>!node.classList.contains('v221-settings-hidden')));
    group.classList.toggle('v221-settings-hidden',!any);
  });
  const count=document.getElementById('v221-settings-search-count');
  if(count)count.textContent=query?`${visible} result${visible===1?'':'s'}`:`${V221_SETTINGS_REGISTRY.length} sections`;
  const clear=document.getElementById('v221-settings-clear');
  if(clear)clear.hidden=!query;
  const empty=document.getElementById('v221-settings-empty');
  if(empty)empty.hidden=visible!==0;
}

function v221ClearSettingsSearch(){
  const input=document.getElementById('v221-settings-search');
  if(input)input.value='';
  v221SearchSettings('');
  input?.focus();
}

function v221JumpSettings(id){
  const el=document.getElementById(String(id||''));
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'start'});
  el.classList.add('v221-settings-flash');
  setTimeout(()=>el.classList.remove('v221-settings-flash'),900);
}


function v221EnhanceSettingsDom(){
  const page=document.querySelector('.v221-settings-page');
  if(!page||String(S.view||'')!=='settings')return;
  const content=page.querySelector('.v221-settings-content');
  if(!content)return;
  v221NormalizeSectionLabels(content);
  const registry=v221BuildSettingsRegistry(content);
  v221OrganizeSettingsContent(content,registry);
  v221RenderSettingsNav(registry);
  v221EnhancePerSettingResets(content);
  v221EnhanceSectionResetButtons(content);
  v221SearchSettings(V221_SETTINGS_QUERY);
}

const v221LegacySettingsRenderer=renderSettings;
function v221RenderSettingsPage(){
  let raw=v221LegacySettingsRenderer.apply(this,arguments);
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

  return `<div class="v221-settings-page">
    ${head||'<div class="view-head"><div><div class="view-title">Settings</div><div class="view-desc">Configure MediaFlow.</div></div></div>'}
    <div class="v221-settings-toolbar">
      <div class="v221-settings-search-panel">
        <div class="v221-settings-search-control">
          <span class="v221-settings-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></span>
          <div class="v221-settings-search-field">
            <label for="v221-settings-search">Search settings</label>
            <input id="v221-settings-search" type="search" autocomplete="off" spellcheck="false" placeholder="Search by setting, feature, or section…" value="${escapeHtml(V221_SETTINGS_QUERY)}" oninput="App.v221SearchSettings(this.value)">
          </div>
          <button id="v221-settings-clear" type="button" class="v221-settings-clear" onclick="App.v221ClearSettingsSearch()" aria-label="Clear settings search" title="Clear search" ${V221_SETTINGS_QUERY?'':'hidden'}>×</button>
        </div>
        <div class="v221-settings-search-status"><span id="v221-settings-search-count">Settings</span><span class="v221-settings-search-help">Search names, descriptions, and controls</span></div>
      </div>
      <button type="button" class="btn btn-danger v221-restore-all" onclick="App.v221RestoreAllDefaults()">Restore all defaults</button>
    </div>
    <div class="v221-settings-layout">
      <aside id="v221-settings-nav" class="v221-settings-nav" aria-label="Settings sections"></aside>
      <main class="v221-settings-content">${raw}<div id="v221-settings-empty" class="empty-state v221-settings-empty" hidden>No settings match your search.</div></main>
    </div>
  </div>`;
}

// Replace the old incomplete reset-all implementation with the audited v221 path.
resetAllSettings=v221RestoreAllDefaults;
Object.assign(App,{
  resetAllSettings:v221RestoreAllDefaults,
  v221RestoreAllDefaults,
  v221ResetSettingPath,
  v221ResetNavigationDefaults,
  v221SearchSettings,
  v221ClearSettingsSearch,
  v221JumpSettings
});

// v221 keeps Settings on the active runtime renderer and applies the polished organization layer.
MediaFlowRuntime.registerPageRenderer('settings',v221RenderSettingsPage);
MediaFlowRuntime.registerPageEnhancer('settings',v221EnhanceSettingsDom);
MediaFlowRuntime.version=221;
