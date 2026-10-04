/* ============================================================
   MediaFlow v225 — Global Button Icon System
   ------------------------------------------------------------
   All current and future text action buttons receive a consistent
   inline SVG icon automatically. Existing icon-first controls,
   toggles, swatches, pagination numbers and visual picker tiles are
   intentionally left alone.
   ============================================================ */

function v225IconSvg(paths,viewBox='0 0 24 24'){
  return `<span class="v225-btn-icon" aria-hidden="true"><svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

const V225_BUTTON_ICONS={
  action:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m10 8 4 4-4 4"/>'),
  add:v225IconSvg('<path d="M12 5v14M5 12h14"/>'),
  edit:v225IconSvg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  delete:v225IconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>'),
  remove:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  confirm:v225IconSvg('<path d="m5 12 4 4L19 6"/>'),
  cancel:v225IconSvg('<path d="M6 6l12 12M18 6 6 18"/>'),
  skip:v225IconSvg('<path d="m5 5 8 7-8 7Z"/><path d="M19 5v14"/>'),
  reroll:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 1 0 1.5 8"/>'),
  history:v225IconSvg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l4 2"/>'),
  details:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
  fix:v225IconSvg('<path d="m14.7 6.3 3-3a4 4 0 0 1-5 5l-6.7 6.7a2 2 0 1 0 3 3l6.7-6.7a4 4 0 0 0 5-5l-3 3Z"/>'),
  calculate:v225IconSvg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2"/>'),
  save:v225IconSvg('<path d="M5 3h11l3 3v15H5Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>'),
  saveNext:v225IconSvg('<path d="M4 3h10l3 3v6"/><path d="M7 3v5h7V3M7 18h10"/><path d="m14 15 3 3-3 3"/>'),
  clear:v225IconSvg('<path d="m3 15 8-8 6 6-8 8H5Z"/><path d="m14 10 4-4 3 3-4 4"/><path d="M10 21h11"/>'),
  clearFilter:v225IconSvg('<path d="M4 5h16l-6 7v5l-4 2v-7Z"/><path d="M17 17l4 4M21 17l-4 4"/>'),
  use:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>'),
  prev:v225IconSvg('<path d="m15 18-6-6 6-6"/>'),
  next:v225IconSvg('<path d="m9 18 6-6-6-6"/>'),
  up:v225IconSvg('<path d="m6 15 6-6 6 6"/>'),
  down:v225IconSvg('<path d="m6 9 6 6 6-6"/>'),
  play:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>'),
  pause:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'),
  stop:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M9 9h6v6H9Z"/>'),
  stopwatch:v225IconSvg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>'),
  reset:v225IconSvg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/>'),
  normalLibrary:v225IconSvg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  dynamicLibrary:v225IconSvg('<path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z"/>'),
  list:v225IconSvg('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>'),
  compact:v225IconSvg('<path d="M5 6h14M5 10h14M5 14h14M5 18h14"/>'),
  cards:v225IconSvg('<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/>'),
  covers:v225IconSvg('<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m20 15-4-4L7 20"/>'),
  coversTitles:v225IconSvg('<rect x="3" y="4" width="8" height="16" rx="1"/><path d="M14 7h7M14 12h7M14 17h5"/>'),
  export:v225IconSvg('<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 15v5h14v-5"/>'),
  import:v225IconSvg('<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 15v5h14v-5"/>'),
  restore:v225IconSvg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="m9 12 2 2 4-4"/>'),
  allTitles:v225IconSvg('<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  category:v225IconSvg('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>'),
  system:v225IconSvg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9ZM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>'),
  view:v225IconSvg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  dateView:v225IconSvg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
  stats:v225IconSvg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  amount:v225IconSvg('<path d="M5 19V5M5 19h14"/><path d="M9 15h2M9 11h5M9 7h8"/>'),
  lastProgress:v225IconSvg('<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>'),
  advanced:v225IconSvg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  light:v225IconSvg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  normal:v225IconSvg('<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 12 4-4"/><path d="M6 16h12"/>'),
  marathon:v225IconSvg('<path d="M13 2s1 4-2 6c-2 1-3 3-3 5a5 5 0 0 0 10 0c0-4-3-6-5-11Z"/><path d="M8 22h8"/>'),
  sync:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/>'),
  scanFix:v225IconSvg('<path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4"/><path d="m9 14 6-6"/><path d="m13 8 3 3"/>'),
  check:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>'),
  login:v225IconSvg('<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h7v18h-7"/>'),
  logout:v225IconSvg('<path d="m14 17 5-5-5-5"/><path d="M19 12H7"/><path d="M10 3H3v18h7"/>'),
  contact:v225IconSvg('<path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/>'),
  external:v225IconSvg('<path d="M14 3h7v7"/><path d="m10 14 11-11"/><path d="M18 13v7H4V6h7"/>'),
  backup:v225IconSvg('<path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>'),
  folder:v225IconSvg('<path d="M3 6h7l2 2h9v11H3Z"/>'),
  image:v225IconSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>'),
  search:v225IconSvg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  shuffle:v225IconSvg('<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6M4 4l5 5"/>')
};

function v225CleanActionText(el){
  const clone=el.cloneNode(true);
  clone.querySelectorAll?.('.v225-btn-icon,svg,input').forEach(n=>n.remove());
  return String(clone.textContent||el.getAttribute?.('aria-label')||el.getAttribute?.('title')||'')
    .replace(/[←→↑↓↶↷↻✓✕×＋+]/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function v225ButtonIconName(el){
  const explicit=String(el.dataset?.v225Icon||'').trim();
  if(explicit&&V225_BUTTON_ICONS[explicit])return explicit;
  const t=v225CleanActionText(el);
  const click=String(el.getAttribute?.('onclick')||'').toLowerCase();
  const scope=String(el.closest?.('[class]')?.className||'').toLowerCase();

  if(!t)return null;
  if(/^\d+$/.test(t))return null;
  if(el.matches?.('.toggle,.v144-swatch-main,.v45-cover-choice,.account-avatar-btn,.v161-nav-grip'))return null;
  if([...el.querySelectorAll?.('svg')||[]].some(svg=>!svg.closest('.v225-btn-icon')))return null;
  if(el.classList?.contains('v224-sort-direction'))return null;

  if(/skip/.test(t))return 'skip';
  if(/give me something else|reroll|shuffle again/.test(t))return /history/.test(t)?'history':'reroll';
  if(/rerolls? history|history/.test(t)&&/reroll/.test(t))return 'history';
  if(/confirm|^yes$|complete|mark complete|^done$/.test(t))return 'confirm';
  if(/save\s*&\s*get next|save and get next/.test(t))return 'saveNext';
  if(/^save|save /.test(t))return 'save';
  if(/edit|change name|change email|change password|rename/.test(t))return 'edit';
  if(/delete|empty library|empty category|permanently delete/.test(t))return 'delete';
  if(/^remove|remove /.test(t))return 'remove';
  if(/details|more info|title info/.test(t))return 'details';
  if(/scan and fix/.test(t))return 'scanFix';
  if(/fix|repair/.test(t))return 'fix';
  if(/calculate/.test(t))return 'calculate';
  if(/cancel|close/.test(t))return 'cancel';
  if(/clear filters|reset filters/.test(t))return 'clearFilter';
  if(/clear order/.test(t))return 'clear';
  if(/^clear|deselect all|clear selection|remove all/.test(t))return 'clear';
  if(/^add title|add selected|add shown|add category|^add\b|\badd time/.test(t))return 'add';
  if(/^use\b|apply|select visible|select all matching/.test(t))return 'use';
  if(/previous|\bprev\b|^back$|^back /.test(t))return 'prev';
  if(/^next\b|next task/.test(t))return 'next';
  if((/^up$/.test(t)||t==='move up'))return 'up';
  if((/^down$/.test(t)||t==='move down'))return 'down';

  if(/stopwatch/.test(scope)||/stopwatch/.test(click)){
    if(/^start|resume/.test(t))return 'play';
    if(/^pause/.test(t))return 'pause';
    if(/^stop/.test(t))return 'stop';
    if(/reset/.test(t))return 'reset';
    if(/clear/.test(t))return 'clear';
    return 'stopwatch';
  }

  if(t==='normal library'||(t==='normal'&&/library/.test(scope)))return 'normalLibrary';
  if(t==='dynamic library'||(t==='dynamic'&&/library/.test(scope)))return 'dynamicLibrary';
  if(t==='list')return 'list';
  if(t==='compact')return 'compact';
  if(t==='cards')return 'cards';
  if(t==='covers')return 'covers';
  if(t==='covers + titles'||t==='covers titles')return 'coversTitles';
  if(/export/.test(t))return 'export';
  if(/import|choose export file/.test(t))return 'import';
  if(/restore/.test(t))return 'restore';
  if(t==='all titles')return 'allTitles';
  if(t==='by category'||t==='categories'||/^all categories/.test(t)||/categor(y|ies) selected/.test(t))return 'category';
  if(t==='system')return 'system';
  if(t==='view')return 'view';
  if(t==='date view')return 'dateView';
  if(t==='stats'||t==='statistics')return 'stats';
  if(t==='amount consumed')return 'amount';
  if(t==='last progress'||/last progress/.test(t))return 'lastProgress';
  if(t==='advanced')return 'advanced';
  if(t==='light')return 'light';
  if(t==='normal')return 'normal';
  if(t==='marathon')return 'marathon';
  if(/sync now/.test(t))return 'sync';
  if(/check now/.test(t))return 'check';
  if(/log in|sign in/.test(t))return 'login';
  if(/log out|sign out/.test(t))return 'logout';
  if(/reset|default/.test(t))return 'reset';
  if(/choose picture|picture/.test(t)&&/choose/.test(t))return 'image';
  if(/choose backup folder|folder/.test(t)&&/choose/.test(t))return 'folder';
  if(/back up now|backup now/.test(t))return 'backup';
  if(/contact/.test(t))return 'contact';
  if(/other apps|open latest web app|alex godly apps|apps by alex godly|developer links?/.test(t))return 'external';
  if(/find cover|search/.test(t))return 'search';
  if(/shuffle/.test(t))return 'shuffle';

  // Every ordinary text action button gets a neutral action icon so newly
  // introduced controls also follow the v225 icon rule automatically.
  return 'action';
}

function v225IconEligible(el){
  if(!el||el.nodeType!==1)return false;
  if(el.dataset?.v225Iconified==='1')return false;
  if(el.matches?.('.toggle,.v144-swatch-main,.v45-cover-choice,.account-avatar-btn,.v161-nav-grip'))return false;
  if(el.matches?.('button,a.btn,label.btn,summary.btn,.v221-settings-nav-item'))return true;
  return false;
}

function v225StripLegacyActionGlyphs(el){
  const nodes=[];
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())nodes.push(walker.currentNode);
  const visible=nodes.filter(n=>!n.parentElement?.closest('.v225-btn-icon')&&String(n.nodeValue||'').trim());
  if(!visible.length)return;
  visible[0].nodeValue=String(visible[0].nodeValue||'').replace(/^\s*[←→↑↓↶↷↻✓✕×＋+]\s*/,m=>m.includes('▾')?m:'');
  const last=visible[visible.length-1];
  last.nodeValue=String(last.nodeValue||'').replace(/\s*[←→↑↓↶↷↻✓✕×＋+]\s*$/, '');
}

function v225EnhanceButtonIcon(el){
  if(!v225IconEligible(el))return;
  const name=v225ButtonIconName(el);
  el.dataset.v225Iconified='1';
  if(!name)return;
  v225StripLegacyActionGlyphs(el);
  el.classList.add('v225-icon-button');
  el.insertAdjacentHTML('afterbegin',V225_BUTTON_ICONS[name]||V225_BUTTON_ICONS.action);
}

function v225EnhanceButtonIcons(root=document){
  if(v225IconEligible(root))v225EnhanceButtonIcon(root);
  root.querySelectorAll?.('button,a.btn,label.btn,summary.btn,.v221-settings-nav-item').forEach(v225EnhanceButtonIcon);
}

let V225_ICON_FRAME=0;
function v225ScheduleButtonIcons(root=document){
  if(V225_ICON_FRAME)return;
  V225_ICON_FRAME=requestAnimationFrame(()=>{
    V225_ICON_FRAME=0;
    v225EnhanceButtonIcons(root);
  });
}

const V225_ICON_OBSERVER=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    for(const node of mutation.addedNodes){
      if(node?.nodeType===1)v225ScheduleButtonIcons(document);
    }
  }
});
V225_ICON_OBSERVER.observe(document.body,{childList:true,subtree:true});
v225ScheduleButtonIcons(document);

Object.assign(App,{v225EnhanceButtonIcons});
MediaFlowRuntime.version=V225_RUNTIME_VERSION;
