/* MediaFlow v365 — Settings Center 2.0.
 * The original Settings controls are MOVED, never cloned. The original
 * v221 registry, handlers, defaults, import/export and XP panels are retained.
 */
const V365_RELEASE=365;
const V365_CATEGORIES=[
  {id:'appearance',name:'Appearance',icon:'palette',hint:'Themes, colors and navigation',description:'Themes and interface navigation'},
  {id:'library',name:'Library & Titles',icon:'library',hint:'Display, covers, filters and title behavior',description:'Library presentation and title preferences'},
  {id:'categories',name:'Categories',icon:'categories',hint:'Manage categories, artwork and defaults',description:'Categories, icons and maintenance'},
  {id:'personal-order',name:'Personal Order',icon:'order',hint:'Queue layout and ordered title controls',description:'Configure queues directly in Personal Order',route:'order'},
  {id:'collections',name:'Collections',icon:'collections',hint:'Views, covers and Collection preferences',description:'Configure Collections directly in the Collections page',route:'collections'},
  {id:'dashboard',name:'Dashboard',icon:'dashboard',hint:'Widgets, goals and recommendations',description:'Dashboard and recommendations'},
  {id:'progression',name:'XP & Statistics',icon:'xp',hint:'Leveling, achievements and statistics',description:'XP rewards and statistic preferences'},
  {id:'cloud',name:'Data & Cloud',icon:'cloud',hint:'Cloud Sync, backups, presets, imports',description:'Backups, synchronization and transfers'},
  {id:'account',name:'Account & Privacy',icon:'account',hint:'Account, profile and personal data',description:'Account preferences are managed from Account',route:'profile'},
  {id:'app',name:'App & Updates',icon:'app',hint:'Updates, scheduling and system behavior',description:'Application updates and advanced MediaFlow options'}
];
const V365_ICONS={
  palette:'<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1.3-3.5 2 2 0 0 1 1.4-3.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r=".65"/><circle cx="9.5" cy="7" r=".65"/><circle cx="14.5" cy="7.5" r=".65"/>',
  library:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M12 8h4M12 12h4"/>',
  categories:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  order:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  collections:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
  dashboard:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
  xp:'<path d="M8 3h8l3 4-7 14L5 7Z"/><path d="M5 7h14M8 3l4 4 4-4"/>',
  cloud:'<path d="M6 19h12a4 4 0 0 0 .7-7.9A6.5 6.5 0 0 0 6.1 9 5 5 0 0 0 6 19Z"/><path d="m12 11 0 6m-3-3 3 3 3-3"/>',
  account:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  app:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.6l6.2-.9Z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  pin:'<path d="m9 4 6 6m-7 3-4 7 7-4m-1-12 5-1 5 5-1 5-6 2-5-5Z"/>'
};
function v365Icon(name,size=19){return `<svg class="mf365-svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${V365_ICONS[name]||V365_ICONS.settings}</svg>`;}
function v365CategoryOf(title){
  const t=String(title||'').toUpperCase();
  if(/THEME|CUSTOMIZATION|NAVIGATION/.test(t))return 'appearance';
  if(/CATEGORIES|CATEGORY ICONS|CATEGORY MAINTENANCE/.test(t))return 'categories';
  if(/DASHBOARD|DAILY GOAL|TITLE RECOMMENDATION/.test(t))return 'dashboard';
  if(/LEVELING|\bXP\b|STATISTICS/.test(t))return 'progression';
  if(/CLOUD|BACKUP|DATA$|IMPORT|EXPORT|PRESET/.test(t))return 'cloud';
  if(/UPDATES|MEDIAFLOW SYSTEM|SCHEDULER/.test(t))return 'app';
  return 'library';
}
function v365Normalize(q){return String(q||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
const V365_SYNONYMS={cover:'poster artwork thumbnail image picture',poster:'cover artwork thumbnail',sync:'cloud synchronize backup',queue:'order list sorting',dark:'theme appearance color',skin:'theme appearance',backup:'export recovery data',xp:'level reward experience progression',episode:'progress logging',category:'categories filters icons',layout:'view display interface'};
let V365_ACTIVE='home',V365_SEARCH='',V365_SEARCH_MODE=false,V365_SECTION_ID='',V365_INDEX=[],V365_SECTION_MAP=new Map(),V365_CURRENT_PAGE=null;
function v365Prefs(){
  S.settings=S.settings||{};
  const current=S.settings.v365SettingsCenter;
  if(!current||typeof current!=='object'||Array.isArray(current))S.settings.v365SettingsCenter={favorites:[],recent:[]};
  const prefs=S.settings.v365SettingsCenter;
  if(!Array.isArray(prefs.favorites))prefs.favorites=[];
  if(!Array.isArray(prefs.recent))prefs.recent=[];
  return prefs;
}
function v365Category(id){return V365_CATEGORIES.find(cat=>cat.id===id)||V365_CATEGORIES[0];}
function v365BuildIndex(registry){
  V365_INDEX=[];
  const seen=new Set();
  registry.forEach(item=>{
    const category=v365CategoryOf(item.title);
    V365_INDEX.push({type:'section',section:item.id,category,title:item.displayTitle,sub:'',text:v365Normalize(`${item.displayTitle} ${item.title} ${item.text}`)});
    let taken=0;
    for(const node of item.nodes){
      if(taken>=75)break;
      const candidates=node.querySelectorAll?.('.field,.settings-toggle-row,.v181-cover-setting,.v192-dashboard-toggle-row,.v335-reward-field,.v348-xp-field,.v186-stat-toggle,.v186-scope-row,.v221-resettable-setting')||[];
      for(const control of candidates){
        if(taken>=75)break;
        if(control.closest('.v221-setting-reset')||control.closest('.cat-manage-row'))continue;
        const title=(control.querySelector(':scope > label,:scope > .field-label,:scope > b,:scope > strong,label,.section-label')?.textContent||control.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
        if(!title||title.length<3||title.length>140)continue;
        const key=`${item.id}:${v365Normalize(title)}`;
        if(seen.has(key))continue;
        seen.add(key);taken++;
        if(!control.id)control.id=`mf365-control-${V365_INDEX.length}`;
        V365_INDEX.push({type:'setting',section:item.id,category,title,sub:item.displayTitle,target:control.id,text:v365Normalize(`${title} ${item.title} ${control.textContent||''}`)});
      }
    }
  });
}
function v365SearchMatches(query){
  const q=v365Normalize(query);if(!q)return [];
  const words=q.split(/\s+/).filter(Boolean);
  const synonyms=[...words,...words.flatMap(w=>V365_SYNONYMS[w]?.split(' ')||[])];
  return V365_INDEX.map((item,index)=>{
    const name=v365Normalize(item.title);let score=0;
    if(name===q)score+=100;
    if(name.startsWith(q))score+=45;
    if(name.includes(q))score+=25;
    if(item.text.includes(q))score+=20;
    if(words.every(w=>item.text.includes(w)))score+=15;
    if(!score&&synonyms.some(w=>w.length>2&&item.text.includes(w)))score+=4;
    if(item.type==='setting')score+=score?12:0;
    return {...item,index,score};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,50);
}
function v365CategoryButton(cat){const count=[...V365_SECTION_MAP.values()].filter(s=>s.category===cat.id).length;
  return `<button type="button" class="mf365-category-button" onclick="App.v365OpenCategory('${cat.id}')"><span class="mf365-category-icon">${v365Icon(cat.icon,23)}</span><span class="mf365-category-copy"><strong>${escapeHtml(cat.name)}</strong><small>${escapeHtml(cat.hint)}</small></span><span class="mf365-category-tail">${count?`${count} sections`:''}${v365Icon('chevron',16)}</span></button>`;
}
function v365FavoriteKey(item){return `setting:${item.section}:${v365Normalize(item.title)}`;}
function v365FavoriteItems(){return v365Prefs().favorites.map(key=>{
  const section=V365_SECTION_MAP.get(key);if(section)return section;
  const match=V365_INDEX.find(item=>item.type==='setting'&&v365FavoriteKey(item)===key);
  return match?{...match,shortcutIndex:V365_INDEX.indexOf(match)}:null;
}).filter(Boolean);}
function v365HomeHtml(){
  const prefs=v365Prefs(),fav=v365FavoriteItems(),recent=prefs.recent.map(id=>V365_SECTION_MAP.get(id)).filter(Boolean);
  return `<div class="mf365-home" id="mf365-home">
    <div class="mf365-intro"><span class="mf365-overline">YOUR MEDIAFLOW · YOUR RULES</span><h2>Make MediaFlow yours.</h2><p>Everything in one place. Choose an area below or search for an individual setting.</p></div>
    ${fav.length?`<section class="mf365-home-group"><div class="mf365-home-group-head"><h3>${v365Icon('star',17)} Favorites</h3><span>Quick access</span></div><div class="mf365-shortcuts">${fav.map(s=>v365Shortcut(s)).join('')}</div></section>`:''}
    ${recent.length?`<section class="mf365-home-group"><div class="mf365-home-group-head"><h3>Recently visited</h3></div><div class="mf365-shortcuts">${recent.slice(0,4).map(s=>v365Shortcut(s)).join('')}</div></section>`:''}
    <section class="mf365-home-group"><div class="mf365-home-group-head"><h3>Browse settings</h3><span>${V365_SECTION_MAP.size} existing sections</span></div><div class="mf365-category-grid">${V365_CATEGORIES.map(v365CategoryButton).join('')}</div></section>
    <div class="mf365-home-tip">${v365Icon('search',16)} Tip: search for “cover”, “XP”, “cloud sync”, or the name of a specific setting.</div>
  </div>`;
}
function v365Shortcut(item){const setting=item.type==='setting';const action=setting?`App.v365OpenResult(${item.shortcutIndex})`:`App.v365OpenSection('${escapeHtml(item.id)}')`;
  return `<button type="button" class="mf365-shortcut" onclick="${action}">${v365Icon(v365Category(item.category).icon,16)}<span>${escapeHtml(setting?item.title:item.displayTitle)}</span>${v365Icon('chevron',15)}</button>`;
}
function v365NavHtml(){return `<div class="mf365-desktop-index-title">SETTINGS CENTER</div><button type="button" class="mf365-desktop-nav-item" data-mf365-target="home" onclick="App.v365OpenHome()">${v365Icon('settings',18)}<span>Overview</span></button>${V365_CATEGORIES.map(cat=>`<button type="button" class="mf365-desktop-nav-item" data-mf365-target="${cat.id}" onclick="App.v365OpenCategory('${cat.id}')">${v365Icon(cat.icon,18)}<span>${escapeHtml(cat.name)}</span></button>`).join('')}`;}
function v365DetailHtml(cat){
  const items=[...V365_SECTION_MAP.values()].filter(item=>item.category===cat.id);
  return `<section class="mf365-detail" data-mf365-category="${cat.id}"><div class="mf365-detail-head"><div class="mf365-detail-identity"><span class="mf365-category-icon">${v365Icon(cat.icon,24)}</span><span><small>SETTINGS CATEGORY</small><h2>${escapeHtml(cat.name)}</h2><p>${escapeHtml(cat.description)}</p></span></div></div>
    ${cat.route?`<div class="mf365-route-note"><strong>These settings are managed where you use them.</strong><p>Open ${escapeHtml(cat.name)} to access its existing, fully functional controls. No duplicate settings or separate saved values.</p><button type="button" class="btn btn-primary" onclick="App.v365GoTo('${cat.route}')">Open ${escapeHtml(cat.name)} ${v365Icon('chevron',16)}</button></div>`:''}
    <div class="mf365-detail-accordion" data-mf365-content-for="${cat.id}"></div>
    ${cat.id==='cloud'?`<div class="mf365-danger-zone"><div><strong>Reset all preferences</strong><p>Restore MediaFlow settings to their defaults. Your Library, History and Collections are not deleted. A confirmation is required.</p></div><button type="button" class="btn btn-danger" onclick="App.v221RestoreAllDefaults()">Restore all defaults</button></div>`:''}
  </section>`;
}
function v365BuildSection(item){
  const wrapper=document.createElement('section');wrapper.className='mf365-section';wrapper.dataset.mf365Section=item.id;
  const head=document.createElement('div');head.className='mf365-section-top';
  const title=document.createElement('button');title.type='button';title.className='mf365-section-toggle';title.setAttribute('aria-expanded','false');title.innerHTML=`<span class="mf365-expand-caret">${v365Icon('chevron',17)}</span><span>${escapeHtml(item.displayTitle)}</span>`;
  const star=document.createElement('button');star.type='button';star.className='mf365-favorite-button';star.dataset.mf365Favorite=item.id;star.title='Pin or unpin this section';star.setAttribute('aria-label',`Favorite ${item.displayTitle}`);star.innerHTML=v365Icon('star',18);
  head.append(title,star);
  const body=document.createElement('div');body.className='mf365-section-body';body.hidden=true;
  for(const node of item.nodes)if(node&&node.parentNode)body.appendChild(node);
  // The heading inside the existing Settings section remains its own original
  // DOM node, but is visually hidden because the accessible section header is
  // now the toggle above it. Do not remove it: other controls reference it.
  title.addEventListener('click',()=>v365ToggleSection(item.id));
  star.addEventListener('click',()=>v365Favorite(item.id));
  wrapper.append(head,body);return wrapper;
}
function v365ToggleSection(id,force){
  const section=V365_CURRENT_PAGE?.querySelector(`.mf365-section[data-mf365-section="${CSS.escape(id)}"]`);
  if(!section)return;
  const button=section.querySelector('.mf365-section-toggle'),body=section.querySelector('.mf365-section-body');
  const open=force==null?body.hidden:!!force;
  body.hidden=!open;section.classList.toggle('mf365-expanded',open);button?.setAttribute('aria-expanded',String(open));
}
function v365Favorite(id){
  const prefs=v365Prefs();const index=prefs.favorites.indexOf(id);
  if(index>=0)prefs.favorites.splice(index,1);else prefs.favorites.unshift(id);
  prefs.favorites=prefs.favorites.slice(0,12);
  document.querySelectorAll('[data-mf365-favorite]').forEach(btn=>{const pressed=prefs.favorites.includes(btn.dataset.mf365Favorite);btn.classList.toggle('mf365-pinned',pressed);btn.setAttribute('aria-pressed',String(pressed));});
  try{persistSettings();}catch(_){ }
}
function v365Recent(id){
  const prefs=v365Prefs();prefs.recent=[id,...prefs.recent.filter(x=>x!==id)].slice(0,8);
  // UI navigation is session-local; do not write cloud state on every click.
}
function v365OpenHome(){V365_ACTIVE='home';V365_SEARCH='';V365_SEARCH_MODE=false;v365UpdateView();}
function v365OpenCategory(id){V365_ACTIVE=v365Category(id).id;V365_SEARCH='';V365_SEARCH_MODE=false;v365UpdateView();}
function v365OpenSection(id){const item=V365_SECTION_MAP.get(id);if(!item)return;V365_ACTIVE=item.category;V365_SEARCH='';V365_SEARCH_MODE=false;V365_SECTION_ID=id;v365Recent(id);v365UpdateView();v365ToggleSection(id,true);
  const section=V365_CURRENT_PAGE?.querySelector(`.mf365-section[data-mf365-section="${CSS.escape(id)}"]`);
  section?.scrollIntoView({behavior:'smooth',block:'start'});
}
function v365Search(value){V365_SEARCH=String(value||'');V365_SEARCH_MODE=!!V365_SEARCH.trim();v365UpdateView({preserveSearch:true});}
function v365SearchHtml(){
  const results=v365SearchMatches(V365_SEARCH);
  return `<section class="mf365-results" aria-label="Settings search results"><div class="mf365-results-heading"><h2>Search results</h2><span>${results.length}${results.length===50?'+':''} matching settings</span></div>${results.length?results.map(item=>{
    const key=v365FavoriteKey(item),pinned=item.type==='setting'&&v365Prefs().favorites.includes(key);
    return `<div class="mf365-result-row"><button type="button" class="mf365-result" onclick="App.v365OpenResult(${item.index})"><span class="mf365-result-symbol">${v365Icon(item.type==='setting'?'settings':v365Category(item.category).icon,17)}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(v365Category(item.category).name)} / ${escapeHtml(item.sub||V365_SECTION_MAP.get(item.section)?.displayTitle||'')}</small></span>${v365Icon('chevron',17)}</button>${item.type==='setting'?`<button class="mf365-result-pin ${pinned?'mf365-pinned':''}" type="button" aria-pressed="${pinned}" aria-label="${pinned?'Unpin':'Pin'} ${escapeHtml(item.title)}" title="${pinned?'Remove favorite':'Add to favorites'}" onclick="App.v365FavoriteSearch(${item.index})">${v365Icon('star',18)}</button>`:''}</div>`;
  }).join(''):`<div class="mf365-no-results"><strong>No settings found</strong><p>Try a different word, such as “theme”, “cover”, “backup”, or “XP”.</p></div>`}</section>`;
}
function v365FavoriteSearch(index){
  const item=V365_INDEX[Number(index)];if(!item||item.type!=='setting')return;
  const key=v365FavoriteKey(item),prefs=v365Prefs(),old=prefs.favorites.indexOf(key);
  if(old>=0)prefs.favorites.splice(old,1);else prefs.favorites.unshift(key);
  prefs.favorites=prefs.favorites.slice(0,12);
  try{persistSettings();}catch(_){ }
  const region=V365_CURRENT_PAGE?.querySelector('.mf365-results-region');if(region&&!region.hidden)region.innerHTML=v365SearchHtml();
}
function v365OpenResult(i){const result=V365_INDEX[Number(i)];if(!result)return;
  v365OpenSection(result.section);
  if(result.target){const el=document.getElementById(result.target);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('mf365-found-control');setTimeout(()=>el.classList.remove('mf365-found-control'),1600);}}
}
function v365GoTo(route){if(['order','collections','profile'].includes(String(route)))App.setView(route);}
function v365UpdateView(options={}){
  const page=V365_CURRENT_PAGE||document.querySelector('.mf365-settings-center');if(!page)return;
  const main=page.querySelector('.mf365-stage'),search=page.querySelector('.mf365-search-input');if(!main)return;
  const home=main.querySelector('.mf365-home');if(home){home.hidden=V365_ACTIVE!=='home'||V365_SEARCH_MODE;if(V365_ACTIVE==='home'&&!V365_SEARCH_MODE)home.outerHTML=v365HomeHtml();}
  main.querySelectorAll('.mf365-detail').forEach(el=>el.hidden=V365_SEARCH_MODE||el.dataset.mf365Category!==V365_ACTIVE);
  const results=main.querySelector('.mf365-results-region');
  if(results){results.hidden=!V365_SEARCH_MODE;if(V365_SEARCH_MODE)results.innerHTML=v365SearchHtml();}
  const crumb=page.querySelector('.mf365-current-crumb');if(crumb)crumb.textContent=V365_SEARCH_MODE?'Search results':V365_ACTIVE==='home'?'Overview':v365Category(V365_ACTIVE).name;
  const back=page.querySelector('.mf365-back');if(back)back.hidden=V365_ACTIVE==='home'&&!V365_SEARCH_MODE;
  page.querySelectorAll('.mf365-desktop-nav-item').forEach(el=>{const active=el.dataset.mf365Target===V365_ACTIVE&&!V365_SEARCH_MODE;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
  if(search&&!options.preserveSearch&&search.value)search.value='';
  if(!options.preserveSearch){const searchControl=page.querySelector('.mf365-search-input');if(searchControl)searchControl.value=V365_SEARCH;}
  if(!options.preserveScroll){const stage=page.querySelector('.mf365-stage');if(stage)stage.scrollTop=0;try{window.scrollTo({top:0,behavior:'instant'});}catch(_){ }}
}
function v365EnhanceSettings(){
  const page=document.querySelector('.v221-settings-page');
  if(!page||String(S.view||'')!=='settings'||page.dataset.mf365Ready==='1')return;
  const content=page.querySelector('.v221-settings-content');if(!content||!V221_SETTINGS_REGISTRY.length)return;
  const registry=V221_SETTINGS_REGISTRY.filter(s=>s.nodes?.length);
  V365_SECTION_MAP=new Map(registry.map(s=>[s.id,{...s,category:v365CategoryOf(s.title)}]));
  V365_CURRENT_PAGE=page;page.dataset.mf365Ready='1';page.classList.add('mf365-settings-center');
  // Use the live canonical registry; each node is reparented exactly once.
  // This intentionally leaves original onclick/onchange handlers untouched.
  const stage=document.createElement('main');stage.className='mf365-stage';stage.id='mf365-stage';stage.innerHTML=`${v365HomeHtml()}${V365_CATEGORIES.map(v365DetailHtml).join('')}<div class="mf365-results-region" hidden></div>`;
  for(const item of V365_SECTION_MAP.values()){
    const target=stage.querySelector(`[data-mf365-content-for="${item.category}"]`);
    if(target)target.appendChild(v365BuildSection(item));
  }
  // Ensure all original controls from all 28 sections survived relocation.
  const legacyFooter=[...content.children].filter(el=>!el.classList.contains('v221-settings-page-group')&&el.id!=='v221-settings-empty');
  if(legacyFooter.length){const archive=stage.querySelector('[data-mf365-content-for="app"]');if(archive)legacyFooter.forEach(n=>archive.appendChild(n));}
  content.innerHTML='';
  const layout=page.querySelector('.v221-settings-layout');const oldNav=page.querySelector('#v221-settings-nav');
  if(oldNav){oldNav.className='mf365-desktop-index';oldNav.innerHTML=v365NavHtml();}
  if(layout){layout.classList.add('mf365-settings-layout');layout.appendChild(stage);}
  const toolbar=page.querySelector('.v221-settings-toolbar');
  if(toolbar){toolbar.classList.add('mf365-topbar');toolbar.innerHTML=`<button type="button" class="mf365-back" onclick="App.v365OpenHome()" aria-label="Back to Settings overview" hidden>${v365Icon('back',18)}<span>Back</span></button><div class="mf365-search-field">${v365Icon('search',19)}<input type="search" class="mf365-search-input" aria-label="Search all settings" placeholder="Find a setting…" autocomplete="off" value="${escapeHtml(V365_SEARCH)}" oninput="App.v365Search(this.value)"></div><span class="mf365-current-crumb">Overview</span>`;}
  const viewHead=page.querySelector(':scope > .view-head');if(viewHead)viewHead.classList.add('mf365-view-head');
  v365BuildIndex(registry);
  page.querySelectorAll('[data-mf365-favorite]').forEach(btn=>{const pinned=v365Prefs().favorites.includes(btn.dataset.mf365Favorite);btn.classList.toggle('mf365-pinned',pinned);btn.setAttribute('aria-pressed',String(pinned));});
  v365UpdateView({preserveScroll:true});
}
// v265's legacy Settings morph used an old v221 renderer, which drops v335+
// XP Settings and reopens the old all-sections layout after any settings edit.
// Replace it with the currently registered canonical v348 renderer; restore
// Settings Center navigation and focus after rebuilding the DOM.
function v365PatchSettings(){
  const current=document.querySelector('#view-root .v221-settings-page');if(!current||String(S.view||'')!=='settings')return false;
  const previous=document.activeElement,activeId=previous?.id||'',focusSearch=!!previous?.classList?.contains('mf365-search-input');
  const expanded=[...current.querySelectorAll('.mf365-section.mf365-expanded')].map(el=>el.dataset.mf365Section).filter(Boolean);
  const previousScroll=window.scrollY||document.documentElement.scrollTop||0;
  const selection=previous&&typeof previous.selectionStart==='number'?{start:previous.selectionStart,end:previous.selectionEnd}:null;
  const temp=document.createElement('div');temp.innerHTML=v348RenderSettingsPage();const next=temp.querySelector('.v221-settings-page');if(!next)return false;
  current.replaceWith(next);
  try{v219RunPageEnhancers('settings');}catch(err){console.error('MediaFlow v365 Settings refresh failed',err);}
  for(const id of expanded)try{v365ToggleSection(id,true);}catch(_){ }
  try{window.scrollTo({top:previousScroll,behavior:'instant'});}catch(_){ }
  const target=focusSearch?document.querySelector('.mf365-search-input'):activeId?document.getElementById(activeId):null;
  if(target){try{target.focus({preventScroll:true});if(selection&&target.setSelectionRange)target.setSelectionRange(selection.start,selection.end);}catch(_){ }}
  return true;
}
Object.assign(App,{v365OpenHome,v365OpenCategory,v365OpenSection,v365Search,v365OpenResult,v365Favorite,v365FavoriteSearch,v365GoTo,v365ToggleSection});
MediaFlowRuntime.registerPageEnhancer('settings',v365EnhanceSettings);
MediaFlowRuntime.version=V365_RELEASE;
window.MediaFlowV365={version:365,patchSettings:v365PatchSettings,features:['Mobile Settings home and dedicated categories','Desktop Settings index','Control-level search with navigation','Favorites and recently visited sections','Original Settings controls retained without copies','Canonical XP-safe settings rerenders']};
