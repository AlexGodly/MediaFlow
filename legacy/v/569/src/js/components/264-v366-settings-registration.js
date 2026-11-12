/* MediaFlow v366 — Settings Registry.
 * Code metadata, not an alternate settings store. Actual controls continue to
 * be owned by the v221/v348 renderer and MediaFlow's existing state/handlers.
 *
 * Integration for future releases:
 *   MediaFlowSettingsRegistry.registerSection({
 *     id:'v221-settings-my-new-options', category:'dashboard',
 *     subgroup:'Recommendations', keywords:['suggestions','discover']
 *   });
 *   MediaFlowSettingsRegistry.registerSetting({
 *     id:'my-new-toggle', section:'v221-settings-my-new-options',
 *     selector:'[data-setting="my-new-toggle"]',
 *     label:'My new toggle', keywords:['quick option','feature switch']
 *   });
 * The section is discovered through the existing v221 `.section-label` system.
 * Register metadata BEFORE the Settings page is built, or call refresh().
 */
const V366_RELEASE=366;
const V366_SECTION_REGISTRY=new Map();
const V366_SETTING_REGISTRY=new Map();
const V366_CATEGORY_REGISTRY=new Map();
const V366_SAFE_ID=/^[a-z0-9][a-z0-9._:-]{0,119}$/i;
function v366Words(values){return [...new Set((Array.isArray(values)?values:typeof values==='string'?[values]:[]).flatMap(v=>String(v||'').split(/[;,]/)).map(v=>v.trim()).filter(Boolean))].slice(0,32);}
function v366SectionKey(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');}
function v366RegisteredCategory(id){return V365_CATEGORIES.some(c=>c.id===id);}
function v366Warn(message){console.warn('MediaFlow Settings Registry:',message);}
function v366RegisterCategory(input){
  if(!input||typeof input!=='object'||!V366_SAFE_ID.test(String(input.id||'')))throw new TypeError('A valid category id is required');
  const id=String(input.id);
  if(!input.name||!String(input.name).trim())throw new TypeError('A category name is required');
  if(V365_CATEGORIES.some(c=>c.id===id)&&!V366_CATEGORY_REGISTRY.has(id))throw new Error(`Built-in category ${id} cannot be replaced`);
  const category={id,name:String(input.name).trim(),icon:String(input.icon||'settings'),hint:String(input.hint||''),description:String(input.description||''),route:input.route?String(input.route):undefined};
  V366_CATEGORY_REGISTRY.set(id,category);
  const existing=V365_CATEGORIES.findIndex(c=>c.id===id);
  if(existing>=0)V365_CATEGORIES[existing]=category;
  else V365_CATEGORIES.splice(Math.max(0,V365_CATEGORIES.length-1),0,category);
  return category;
}
function v366RegisterSection(input){
  if(!input||typeof input!=='object')throw new TypeError('Section metadata is required');
  const id=String(input.id||'').trim(),title=String(input.title||'').trim();
  if(!id&&!title)throw new TypeError('Section id or title is required');
  if(id&&!V366_SAFE_ID.test(id))throw new TypeError('Invalid section id');
  const category=String(input.category||'uncategorized').trim();
  if(!v366RegisteredCategory(category)){v366Warn(`Unknown category "${category}"; assigned to Uncategorized`);}
  const entry={id,title,category:v366RegisteredCategory(category)?category:'uncategorized',subgroup:String(input.subgroup||'General').trim()||'General',keywords:v366Words(input.keywords)};
  if(id)V366_SECTION_REGISTRY.set(v366SectionKey(id),entry);
  if(title)V366_SECTION_REGISTRY.set(v366SectionKey(title),entry);
  return entry;
}
function v366RegisterSetting(input){
  if(!input||typeof input!=='object'||!V366_SAFE_ID.test(String(input.id||'')))throw new TypeError('Setting metadata needs a stable id');
  const section=String(input.section||'').trim();
  if(!section)throw new TypeError('A parent section is required');
  const entry={id:String(input.id),section,selector:String(input.selector||'').trim(),label:String(input.label||'').trim(),subgroup:String(input.subgroup||'').trim(),keywords:v366Words(input.keywords)};
  V366_SETTING_REGISTRY.set(`${v366SectionKey(section)}::${entry.id}`,entry);
  return entry;
}
function v366ResolveSection(item){
  const matched=V366_SECTION_REGISTRY.get(v366SectionKey(item?.id))||V366_SECTION_REGISTRY.get(v366SectionKey(item?.title));
  return matched||{category:'uncategorized',subgroup:'Uncategorized',keywords:[]};
}
function v366SettingEntries(item){
  const names=new Set([v366SectionKey(item.id),v366SectionKey(item.title)]);
  const seen=new Set();
  return [...V366_SETTING_REGISTRY.values()].filter(setting=>{
    if(!names.has(v366SectionKey(setting.section))||seen.has(setting.id))return false;
    seen.add(setting.id);return true;
  });
}
function v366FindSettingMeta(control,entries){
  for(const entry of entries){
    if(!entry.selector)continue;
    try{if(control.matches?.(entry.selector)||control.querySelector?.(entry.selector))return entry;}catch(_){ }
  }
  return null;
}
function v366ControlName(control){
  const title=(control.querySelector?.(':scope > label,:scope > .field-label,:scope > b,:scope > strong,label,.section-label')?.textContent||control.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
  return title.length>=3&&title.length<=150?title:'';
}
function v366BuildIndex(registry){
  const index=[],seen=new Set();
  const add=(item,control,meta,section)=>{
    const label=meta?.label||v366ControlName(control);
    if(!label)return;
    const key=`${section.id}:${meta?.id||v365Normalize(label)}`;
    if(seen.has(key))return;
    seen.add(key);
    if(!control.id)control.id=`mf366-setting-${index.length}`;
    const keywords=[...(section.keywords||[]),...(meta?.keywords||[])].join(' ');
    const subgroup=meta?.subgroup||section.subgroup||'General';
    index.push({type:'setting',section:section.id,settingId:meta?.id||'',category:section.category,subgroup,title:label,sub:section.displayTitle,target:control.id,text:v365Normalize(`${label} ${section.title} ${section.displayTitle} ${v365Category(section.category).name} ${subgroup} ${keywords} ${control.textContent||''}`)});
  };
  for(const item of registry){
    const section=V365_SECTION_MAP.get(item.id)||{...item,...v366ResolveSection(item)};
    index.push({type:'section',section:item.id,category:section.category,subgroup:section.subgroup,title:item.displayTitle,sub:section.subgroup,text:v365Normalize(`${item.displayTitle} ${item.title} ${item.text||''} ${section.subgroup} ${(section.keywords||[]).join(' ')} ${v365Category(section.category).name}`)});
    const custom=v366SettingEntries(item);
    for(const node of item.nodes){
      const selector='.field,.settings-toggle-row,.v181-cover-setting,.v192-dashboard-toggle-row,.v335-reward-field,.v348-xp-field,.v186-stat-toggle,.v186-scope-row,.v221-resettable-setting,[data-mf-setting-id]';
      const candidates=[...(node.matches?.(selector)?[node]:[]),...(node.querySelectorAll?.(selector)||[])];
      let count=0;
      for(const control of candidates){
        if(count>=150)break;
        if(control.closest('.v221-setting-reset')||control.closest('.cat-manage-row'))continue;
        add(item,control,v366FindSettingMeta(control,custom),section);
        count++;
      }
    }
    // Nonstandard controls can opt into search with an explicit selector.
    // Search actual live DOM only: never create fake setting entries.
    for(const entry of custom){
      if(!entry.selector)continue;
      for(const node of item.nodes){
        let el=null;
        try{el=node.matches?.(entry.selector)?node:node.querySelector?.(entry.selector);}catch(_){ }
        if(el){add(item,el,entry,section);break;}
      }
    }
  }
  return index;
}
function v366RefreshRegistry(){
  if(String(S.view||'')==='settings'&&document.querySelector('.mf365-settings-center'))return v365PatchSettings();
  return false;
}
function v366InspectRegistry(){
  return {categories:V365_CATEGORIES.map(c=>({id:c.id,name:c.name})),sections:[...new Set(V366_SECTION_REGISTRY.values())].map(s=>({...s})),settings:[...V366_SETTING_REGISTRY.values()].map(s=>({...s})),fallback:'uncategorized'};
}
// The last category only appears if Settings includes unregistered sections.
V365_CATEGORIES.push({id:'uncategorized',name:'Uncategorized',icon:'uncategorized',hint:'New settings awaiting classification',description:'New or legacy settings that have not been registered yet. They remain available and searchable.'});
V365_ICONS.uncategorized='<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h4"/><circle cx="17" cy="15" r="1"/>';

const V366_BUILTIN_SECTIONS=[
  ['library-mode','library','Library display','view display switch'],
  ['dynamic-settings','library','Dynamic Library','dynamic mode queue'],
  ['categories','categories','Category management','category list'],
  ['choice-and-filter-layout','library','Filtering & Sorting','popup filters visibility'],
  ['default-logging-method','library','Title logging','default logging'],
  ['cover-size-adjustment','library','Covers & Artwork','cover poster thumbnail sizing'],
  ['library-integrity','library','Library maintenance','integrity repair'],
  ['category-icons','categories','Category artwork','icon image artwork'],
  ['missing-title-covers','library','Covers & Artwork','missing poster cover'],
  ['library-overview','library','Library display','overview'],
  ['library-maintenance','library','Library maintenance','reset clean'],
  ['category-maintenance','categories','Category maintenance','recover restore'],
  ['cover-maintenance','library','Covers & Artwork','missing cover repair'],
  ['navigation','appearance','Navigation','sidebar mobile bottom menu'],
  ['dashboard-settings','dashboard','Dashboard display','widgets layout'],
  ['statistics-settings','progression','Statistics display','charts balance'],
  ['themes-and-customization','appearance','Themes & Colors','theme color skin'],
  ['daily-goal','dashboard','Goals','daily target'],
  ['title-recommendations','dashboard','Recommendations','suggested titles recommendations'],
  ['mediaflow-system','app','App behavior','system performance'],
  ['scheduler-tuning','app','Scheduling','scheduler performance'],
  ['leveling-and-xp','progression','XP & Rewards','experience level achievements streak'],
  ['import-export-media-services','cloud','Import & Export','mal simkl media services transfer'],
  ['automatic-backups','cloud','Backups','automatic data protection'],
  ['cloud-sync','cloud','Synchronization','online sync now'],
  ['settings-preset','cloud','Settings presets','presets transfer'],
  ['data','cloud','Data management','restore backups exports'],
  ['app-updates','app','Updates & Installation','pwa offline install reload']
];
for(const [suffix,category,subgroup,keywords] of V366_BUILTIN_SECTIONS){
  v366RegisterSection({id:`v221-settings-${suffix}`,category,subgroup,keywords:[keywords]});
}
window.MediaFlowSettingsRegistry=Object.freeze({registerCategory:v366RegisterCategory,registerSection:v366RegisterSection,registerSetting:v366RegisterSetting,refresh:v366RefreshRegistry,inspect:v366InspectRegistry});
window.MediaFlowV366={version:366,features:['Explicit category and subgroup registration for all 28 legacy sections','Future section and control metadata API','Uncategorized fallback for unknown settings','Search keywords and stable registered setting ids','Original Settings control handlers and persistence preserved']};
MediaFlowRuntime.version=V366_RELEASE;
