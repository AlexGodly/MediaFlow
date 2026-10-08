/* ============================================================
   MediaFlow v226 — Semantic Icons + Dropdown Icon Language
   ------------------------------------------------------------
   - Replaces generic action glyphs with meaning-specific icons.
   - Keeps drag handles icon-free.
   - Adds status/show-hide/refresh/advanced/order/session semantics.
   - Gives every native single-select dropdown a purpose-aware icon
     without changing its values, sizing model, or event behavior.
   ============================================================ */

const V226_RUNTIME_VERSION=226;

Object.assign(V225_BUTTON_ICONS,{
  dynamicLibrary:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-13.7-2.6L4 7"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 13.7 2.6L20 17"/>'),
  watching:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>'),
  completedStatus:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8.5"/>'),
  onHold:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'),
  dropped:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'),
  planToWatch:v225IconSvg('<path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6M12 5v6"/>'),
  show:v225IconSvg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  hide:v225IconSvg('<path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6 0 10 8 10 8a17.4 17.4 0 0 1-2.1 3"/><path d="M6.6 6.6C3.9 8.4 2 12 2 12s4 8 10 8a9.8 9.8 0 0 0 4.4-1"/>'),
  refresh:v225IconSvg('<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11"/><path d="M5.5 15A7 7 0 0 0 18 17.5l2-4.5"/>'),
  advanced:v225IconSvg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><path d="M12 3v2M12 19v2"/>'),
  customOrder:v225IconSvg('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h1M3 12h1M3 18h1"/><path d="m17 3 3 3-3 3"/>'),
  endSession:v225IconSvg('<path d="M4 4h10v16H4z"/><path d="M14 12h7"/><path d="m18 9 3 3-3 3"/>'),
  minus:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  libraryExperience:v225IconSvg('<path d="M4 5h6v14H4zM14 5h6v14h-6z"/><path d="M7 8h.01M17 8h.01"/>'),
  logging:v225IconSvg('<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h5M8 16h3"/>'),
  resize:v225IconSvg('<path d="M8 3H3v5M16 21h5v-5M3 8l6-6M21 16l-6 6"/>'),
  integrity:v225IconSvg('<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>'),
  missingImage:v225IconSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/><path d="M16 7h.01"/><path d="M8 8l8 8"/>'),
  overview:v225IconSvg('<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/>'),
  maintenance:v225IconSvg('<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3Z"/>'),
  navigation:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6Z"/>'),
  dashboard:v225IconSvg('<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>'),
  palette:v225IconSvg('<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-3-4-5-9-5Z"/><circle cx="7.5" cy="9" r=".8"/><circle cx="10" cy="6.5" r=".8"/><circle cx="14" cy="6.5" r=".8"/>'),
  target:v225IconSvg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  recommendation:v225IconSvg('<path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z"/>'),
  scheduler:v225IconSvg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/><path d="M4 4h4M16 4h4"/>'),
  xp:v225IconSvg('<path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M6 5H4v2a3 3 0 0 0 3 3M18 5h2v2a3 3 0 0 1-3 3M12 12v5M8 21h8M9 17h6"/>'),
  exchange:v225IconSvg('<path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/>'),
  cloud:v225IconSvg('<path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 18Z"/><path d="m9 14 3 3 3-3M12 10v7"/>'),
  preset:v225IconSvg('<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="M17 14v4M15 16h4"/>'),
  database:v225IconSvg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
  update:v225IconSvg('<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M5 20h14"/>'),
  priority:v225IconSvg('<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>'),
  sort:v225IconSvg('<path d="M8 6h12M8 12h9M8 18h6"/><path d="m4 5-2 2 2 2M2 7h4"/>'),
  filter:v225IconSvg('<path d="M4 5h16l-6 7v5l-4 2v-7Z"/>'),
  page:v225IconSvg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  mediaType:v225IconSvg('<path d="M4 5h16v14H4z"/><path d="m10 9 5 3-5 3Z"/>'),
  unit:v225IconSvg('<path d="M4 17 17 4l3 3L7 20H4Z"/><path d="m11 10 3 3M8 13l3 3"/>'),
  dropdown:v225IconSvg('<path d="M4 7h16M7 12h10M10 17h4"/>')
});

const v226ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  const title=String(el?.getAttribute?.('title')||'').trim().toLowerCase();
  const aria=String(el?.getAttribute?.('aria-label')||'').trim().toLowerCase();
  const row=el?.closest?.('.v181-dynamic-row');
  const rowLabel=String(row?.querySelector?.('.v181-dynamic-row-label')?.textContent||'').trim().toLowerCase();

  // Drag/reorder handles deliberately remain glyph-only (☰ / three lines).
  if(el?.matches?.('.cat-drag-handle,.v161-nav-grip')||/drag .*reorder|drag to reorder/.test(`${title} ${aria}`)||t==='☰'||t==='≡')return null;

  // Dynamic category row: the separate v226 setting controls URL icons.
  // Never add the global action icon here.
  if(row&&rowLabel==='category')return null;

  if(/^watching\b/.test(t))return 'watching';
  if(/^completed\b/.test(t))return 'completedStatus';
  if(/^on hold\b/.test(t))return 'onHold';
  if(/^dropped\b/.test(t))return 'dropped';
  if(/^plan to watch\b/.test(t))return 'planToWatch';
  if(/^show\b|show \/ include all|include all/.test(t))return 'show';
  if(/^hide\b|hide \/ exclude all|exclude all/.test(t))return 'hide';
  if(/refresh/.test(t))return 'refresh';
  if(/^advanced\b/.test(t))return 'advanced';
  if(t==='dynamic'||t==='dynamic library')return 'dynamicLibrary';
  if(t==='normal'&&el?.closest?.('.v181-library-mode-switch'))return 'normalLibrary';
  if(t==='custom order')return 'customOrder';
  if(/end session/.test(t))return 'endSession';
  if(/minus time|subtract time|decrease time/.test(t))return 'minus';

  const settingsNav={
    'categories':'category',
    'library experience':'libraryExperience',
    'logging method':'logging',
    'default logging method':'logging',
    'cover size adjustment':'resize',
    'library integrity':'integrity',
    'category icons':'image',
    'missing title covers':'missingImage',
    'library overview':'overview',
    'library maintenance':'maintenance',
    'category maintenance':'maintenance',
    'cover maintenance':'fix',
    'navigation':'navigation',
    'dashboard settings':'dashboard',
    'statistics settings':'stats',
    'themes & customization':'palette',
    'daily goal':'target',
    'title recommendations':'recommendation',
    'mediaflow system':'system',
    'scheduler tuning':'scheduler',
    'leveling & xp':'xp',
    'import / export — media services':'exchange',
    'import / export - media services':'exchange',
    'automatic backups':'backup',
    'cloud sync':'cloud',
    'settings preset':'preset',
    'data':'database',
    'app updates':'update'
  };
  if(el?.classList?.contains('v221-settings-nav-item')&&settingsNav[t])return settingsNav[t];

  return v226ButtonIconNameBase(el);
};

/* ---------- Native dropdown icons --------------------------- */
const V226_DROPDOWN_PATHS={
  category:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  status:'<circle cx="12" cy="12" r="8"/><path d="m8 12 2.5 2.5L16 9"/>',
  priority:'<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>',
  sort:'<path d="M8 6h12M8 12h9M8 18h6"/><path d="m4 5-2 2 2 2M2 7h4"/>',
  cover:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m20 15-4-4L7 20"/>',
  theme:'<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-3-4-5-9-5Z"/><circle cx="8" cy="9" r="1"/><circle cx="11" cy="6" r="1"/><circle cx="15" cy="7" r="1"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  page:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  type:'<path d="M4 5h16v14H4z"/><path d="m10 9 5 3-5 3Z"/>',
  service:'<path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/>',
  mode:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  unit:'<path d="M4 17 17 4l3 3L7 20H4Z"/><path d="m11 10 3 3M8 13l3 3"/>',
  display:'<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/>',
  logging:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h5M8 16h3"/>',
  data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  generic:'<path d="M5 7h14M7 12h10M9 17h6"/>'
};

function v226DropdownIconUrl(key){
  const paths=V226_DROPDOWN_PATHS[key]||V226_DROPDOWN_PATHS.generic;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7B8496" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function v226DropdownPurpose(el){
  const opts=[...el.options||[]].slice(0,20).map(o=>String(o.textContent||'')).join(' ');
  const label=String(el.closest?.('.field,.v225-order-filter-control,.v186-scope-head,.v169-type-row')?.querySelector?.('label,.field-label,.v225-order-filter-label,b')?.textContent||'');
  const hay=[el.id,el.name,el.className,el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('onchange'),label,opts].filter(Boolean).join(' ').toLowerCase();
  if(/categor/.test(hay))return 'category';
  if(/status|watching|on hold|plan to watch|dropped|completed/.test(hay))return 'status';
  if(/priorit/.test(hay))return 'priority';
  if(/sort|alphabetic|rating:|progress:|date added|last seen/.test(hay))return 'sort';
  if(/cover/.test(hay))return 'cover';
  if(/theme|appearance|style/.test(hay))return 'theme';
  if(/month|year|date/.test(hay))return 'calendar';
  if(/per page|page size|titles per page|categories per/.test(hay))return 'page';
  if(/media type|format|type exclusion|content type/.test(hay))return 'type';
  if(/service|source|provider|mal|simkl/.test(hay))return 'service';
  if(/logging|progress method|amount consumed|last progress/.test(hay))return 'logging';
  if(/unit|episode|chapter|issue|movie/.test(hay))return 'unit';
  if(/display|view/.test(hay))return 'display';
  if(/mode|method|normal|advanced|follow category settings|use own/.test(hay))return 'mode';
  if(/backup|preset|data/.test(hay))return 'data';
  return 'generic';
}

function v226EnhanceDropdown(el){
  if(!el||el.nodeType!==1||!el.matches?.('select:not([multiple])'))return;
  const purpose=v226DropdownPurpose(el);
  el.dataset.v226DropdownIcon=purpose;
  el.style.setProperty('--v226-dropdown-icon',v226DropdownIconUrl(purpose));
}
function v226EnhanceDropdowns(root=document){
  if(root?.matches?.('select:not([multiple])'))v226EnhanceDropdown(root);
  root?.querySelectorAll?.('select:not([multiple])').forEach(v226EnhanceDropdown);
}
let V226_DROPDOWN_FRAME=0;
function v226ScheduleDropdowns(){
  if(V226_DROPDOWN_FRAME)return;
  V226_DROPDOWN_FRAME=requestAnimationFrame(()=>{
    V226_DROPDOWN_FRAME=0;
    v226EnhanceDropdowns(document);
  });
}
const V226_DROPDOWN_OBSERVER=new MutationObserver(mutations=>{
  if(mutations.some(m=>m.addedNodes?.length)){
    v226ScheduleDropdowns();
    v226ScheduleSemanticButtonIcons();
  }
});
V226_DROPDOWN_OBSERVER.observe(document.body,{childList:true,subtree:true});

/* ---------- Re-apply semantic icons after the v225 generic pass ---------
   v225 intentionally decorated every ordinary text button. v226 changes the
   meaning of a number of those buttons (status tabs, Settings navigation,
   show/hide, refresh, Dynamic Library, etc.), so replace any already-mounted
   generic icon instead of leaving the first icon that happened to render. */
function v226RefreshSemanticButtonIcon(el){
  if(!el||el.nodeType!==1||!el.matches?.('button,a.btn,label.btn,summary.btn,.v221-settings-nav-item'))return;
  // v305: MediaFlow Community owns these semantic controls. Do not inject a
  // legacy generic circle-arrow icon next to the actual MediaFlow logo or
  // duplicate the Community's hand-authored navigation/authentication SVGs.
  if(el.matches?.('#mf302-root .mf302-brand, #mf302-root .mf302-link, #mf302-root .mf303-workspace-button, #app .mf305-auth-home, #mf302-root .mf309-view, #mf302-root .mf309-quick, #mf302-root .mf309-reset, #mf302-root .mf309-pagination button, #mf309-add-dialog button')){
    el.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
    el.classList.remove('v225-icon-button');
    el.dataset.v225Iconified='1';
    el.dataset.v226SemanticIcon='community-custom';
    return;
  }
  const name=v225ButtonIconName(el);
  const oldName=String(el.dataset?.v226SemanticIcon||'');
  if(oldName===String(name||'')&&el.querySelector(':scope > .v225-btn-icon'))return;

  el.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
  delete el.dataset.v225Iconified;
  delete el.dataset.v226SemanticIcon;

  if(!name){
    el.classList.remove('v225-icon-button');
    el.dataset.v225Iconified='1';
    return;
  }

  v225StripLegacyActionGlyphs(el);
  el.classList.add('v225-icon-button');
  el.insertAdjacentHTML('afterbegin',V225_BUTTON_ICONS[name]||V225_BUTTON_ICONS.action);
  el.dataset.v225Iconified='1';
  el.dataset.v226SemanticIcon=name;
}
function v226RefreshSemanticButtonIcons(root=document){
  if(root?.matches?.('button,a.btn,label.btn,summary.btn,.v221-settings-nav-item'))v226RefreshSemanticButtonIcon(root);
  root?.querySelectorAll?.('button,a.btn,label.btn,summary.btn,.v221-settings-nav-item').forEach(v226RefreshSemanticButtonIcon);
}
let V226_SEMANTIC_ICON_FRAME=0;
function v226ScheduleSemanticButtonIcons(){
  if(V226_SEMANTIC_ICON_FRAME)return;
  V226_SEMANTIC_ICON_FRAME=requestAnimationFrame(()=>{
    V226_SEMANTIC_ICON_FRAME=0;
    v226RefreshSemanticButtonIcons(document);
  });
}

v226ScheduleDropdowns();
v226ScheduleSemanticButtonIcons();

Object.assign(App,{v226EnhanceDropdowns,v226RefreshSemanticButtonIcons});
MediaFlowRuntime.version=V226_RUNTIME_VERSION;
