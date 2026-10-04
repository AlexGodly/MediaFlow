/* ============================================================
   MediaFlow v161 — About + Custom Navigation + Data Audit
   ============================================================ */

const V161_NAV_LAYOUT_VERSION=1;
const V161_BACKUP_SCHEMA_VERSION=4;
const V161_UPDATE_CHECK_INTERVAL=6*60*60*1000;
const V161_UPDATE_SOURCES=[
  'https://raw.githubusercontent.com/AlexGodly/MediaFlow/main/index.html',
  'https://alexgodly.github.io/MediaFlow/'
];

let V161_NAV_DRAG_ID='';
let V161_UPDATE_TIMER=null;
let V161_UPDATE_STATE={
  checked:false,
  checking:false,
  latest:null,
  available:false,
  message:'Not checked yet.',
  checkedAt:0
};

// ---- About navigation entry ------------------------------------------------
ICONS.about=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

if(!NAV_ITEMS.some(n=>n.id==='about')){
  const settingsIndex=NAV_ITEMS.findIndex(n=>n.id==='settings');
  NAV_ITEMS.splice(settingsIndex>=0?settingsIndex:NAV_ITEMS.length,0,{id:'about',label:'About'});
}
if(!MOBILE_MORE_NAV.includes('about'))MOBILE_MORE_NAV.push('about');

function v161CurrentVersion(){
  return String(
    document.querySelector('meta[name="mediaflow-version"]')?.getAttribute('content') ||
    '161'
  ).trim() || '161';
}

function v161AllNavIds(){
  return NAV_ITEMS.map(n=>String(n.id));
}

function v161NormalizeNavLayout(raw){
  const valid=v161AllNavIds();
  const validSet=new Set(valid);
  const src=(raw&&typeof raw==='object')?raw:{};

  const order=[];
  const seen=new Set();

  for(const id of (Array.isArray(src.order)?src.order:[])){
    const sid=String(id||'');
    if(validSet.has(sid)&&!seen.has(sid)){
      seen.add(sid);
      order.push(sid);
    }
  }

  for(const id of valid){
    if(!seen.has(id)){
      seen.add(id);
      order.push(id);
    }
  }

  const hiddenIds=[...new Set(
    (Array.isArray(src.hiddenIds)?src.hiddenIds:[])
      .map(String)
      .filter(id=>validSet.has(id)&&id!=='settings')
  )];

  return {
    version:V161_NAV_LAYOUT_VERSION,
    order,
    hiddenIds,
    modifiedAt:Number(src.modifiedAt)||0
  };
}

function v161EnsureNavLayout(){
  S.navLayout=v161NormalizeNavLayout(S.navLayout);
  S.settings=S.settings||DEFAULT_SETTINGS;
  if(typeof S.settings.autoUpdateCheck!=='boolean')S.settings.autoUpdateCheck=true;
  return S.navLayout;
}

S.navLayout=v161NormalizeNavLayout(S.navLayout);

function v161OrderedNavItems(){
  const layout=v161EnsureNavLayout();
  const map=new Map(NAV_ITEMS.map(n=>[String(n.id),n]));
  return layout.order.map(id=>map.get(id)).filter(Boolean);
}

function v161VisibleNavItems(){
  const layout=v161EnsureNavLayout();
  const hidden=new Set(layout.hiddenIds);
  return v161OrderedNavItems().filter(n=>!hidden.has(String(n.id))||n.id==='settings');
}

function v161FallbackView(){
  const visible=v161VisibleNavItems();
  return visible.find(n=>n.id==='dashboard')?.id ||
    visible.find(n=>n.id!=='settings')?.id ||
    'settings';
}

function v161TouchNavLayout(){
  const layout=v161EnsureNavLayout();
  layout.modifiedAt=Date.now();

  const hidden=new Set(layout.hiddenIds);
  if(hidden.has(String(S.view||''))){
    S.view=v161FallbackView();
  }

  saveState();
}

function v161SetNavPosition(id,raw){
  const layout=v161EnsureNavLayout();
  const sid=String(id||'');
  const current=layout.order.indexOf(sid);
  if(current<0)return;

  const max=layout.order.length;
  let target=Math.round(Number(raw));
  if(!Number.isFinite(target)){render();return;}
  target=Math.max(1,Math.min(max,target))-1;

  if(target===current){render();return;}

  layout.order.splice(current,1);
  layout.order.splice(target,0,sid);
  v161TouchNavLayout();
  render();
}

function v161MoveNav(id,delta){
  const layout=v161EnsureNavLayout();
  const sid=String(id||'');
  const current=layout.order.indexOf(sid);
  if(current<0)return;

  const target=Math.max(0,Math.min(layout.order.length-1,current+(Number(delta)||0)));
  if(target===current)return;

  layout.order.splice(current,1);
  layout.order.splice(target,0,sid);
  v161TouchNavLayout();
  render();
}

function v161ToggleNav(id,visible){
  const layout=v161EnsureNavLayout();
  const sid=String(id||'');

  // Settings deliberately stays visible so the user can always restore hidden
  // pages. Every other page can be shown/hidden.
  if(sid==='settings'){
    showToast('Settings always stays visible so navigation can be restored.');
    render();
    return;
  }

  const hidden=new Set(layout.hiddenIds);
  if(visible)hidden.delete(sid);
  else hidden.add(sid);

  layout.hiddenIds=[...hidden];
  v161TouchNavLayout();
  render();
}

function v161NavDragStart(event,id){
  V161_NAV_DRAG_ID=String(id||'');
  event?.currentTarget?.classList?.add('v161-dragging');

  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',V161_NAV_DRAG_ID);
  }catch(_){}
}

function v161NavDragEnd(event){
  event?.currentTarget?.classList?.remove('v161-dragging');
  V161_NAV_DRAG_ID='';
}

function v161NavDragOver(event){
  event?.preventDefault();
  try{event.dataTransfer.dropEffect='move';}catch(_){}
}

function v161NavDrop(event,targetId){
  event?.preventDefault();

  const layout=v161EnsureNavLayout();
  let source=V161_NAV_DRAG_ID;
  try{source=source||event.dataTransfer.getData('text/plain');}catch(_){}

  source=String(source||'');
  const target=String(targetId||'');
  if(!source||!target||source===target)return;

  const from=layout.order.indexOf(source);
  const to=layout.order.indexOf(target);
  if(from<0||to<0)return;

  layout.order.splice(from,1);
  const newTarget=layout.order.indexOf(target);
  layout.order.splice(newTarget,0,source);

  V161_NAV_DRAG_ID='';
  v161TouchNavLayout();
  render();
}

// Mobile navigation now follows the exact same persisted order/visibility.
// First five visible destinations are primary; remaining destinations live in More.
renderMobileTabs=function(){
  const visible=v161VisibleNavItems();
  const primary=visible.slice(0,5);
  const extra=visible.slice(5);
  const moreActive=extra.some(n=>n.id===S.view);

  const tabs=primary.map(n=>`
    <button type="button" class="mtab ${S.view===n.id?'active':''}"
      onclick="App.mobileNav('${n.id}')"
      aria-label="${escapeHtml(n.label)}">
      ${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span>
    </button>`).join('');

  if(!extra.length)return tabs;

  return `${tabs}
    <div class="mobile-more-wrap">
      <button type="button" class="mtab ${moreActive?'active':''}"
        onclick="App.toggleMobileMore(event)"
        aria-label="More pages" aria-expanded="false">
        ${ICONS.more}<span>More</span>
      </button>
      <div id="mobile-more-menu" class="mobile-more-menu hide">
        ${extra.map(n=>`
          <button type="button" class="mobile-more-item ${S.view===n.id?'active':''}"
            onclick="App.mobileNav('${n.id}')">
            ${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span>
          </button>`).join('')}
      </div>
    </div>`;
};

// ---- About -----------------------------------------------------------------

function v161FeatureList(){
  return [
    'Balanced media-consumption scheduler with category health, targets, weights and exact-title recommendations.',
    'Large-Library management with custom categories, custom units, covers, ratings, priority, status, start/finish dates and bulk tools.',
    'History, Batch Log, Statistics, streaks, XP/levels, repeats, completions and On This Day.',
    'Personal Order planner with global/category ordering, drag controls, arrows and exact numeric positioning.',
    'Old System with independent balances, directional conversion rules, simulation and exact consumption stats.',
    'MAL, Simkl and multi-service import/export with dates, timestamps, external IDs and URL-based cover artwork.',
    'Cloud synchronization, Full Backup, Automatic Backup, offline-friendly local state and recovery safeguards.',
    'MediaFlow, platform and full-style themes plus adaptive Dynamic Cover Theme generated from media artwork.'
  ];
}

function v161FaqHtml(){
  const rows=[
    ['What is MediaFlow?','MediaFlow is a personal media-consumption scheduler and Library tracker. It helps rotate between the media categories you care about while keeping your Library, progress, History, Stats and account data together.'],
    ['Does MediaFlow choose the exact title for me?','It can. Exact-title recommendations are optional. The scheduler can recommend only a category, or it can recommend an eligible Library title inside that category.'],
    ['What is Personal Order?','Personal Order is an independent title sequence you control. You can drag titles, use arrows or type an exact position number. If the related setting is enabled, MediaFlow can prioritize eligible titles from that order when making exact-title recommendations.'],
    ['What is Old System?','Old System recreates a directional category-conversion system separately from the normal scheduler. System mode uses independent balances, View mode simulates the rules over real MediaFlow History, and Stats shows raw consumed units.'],
    ['Where is my data stored?','Signed-in MediaFlow state is saved through the app cloud pipeline and also kept in the local runtime/cache used by the app. Full Backup and Automatic Backup provide portable JSON copies of the account state.'],
    ['What does Full Backup contain?','The complete backup pipeline carries the canonical MediaFlow state plus newer persistent systems such as Personal Order, Old System, Rating Queue, portable preferences and the v161 navigation layout.'],
    ['Can I import from other media services?','Yes. MediaFlow supports its Exchange Hub plus dedicated MAL XML/public sync and Simkl JSON flows. When a source provides them, v158+ also imports start dates, finish dates, timestamps, external IDs and external cover URLs.'],
    ['Does MediaFlow store cover images themselves?','Imported and automatically repaired covers are stored as URLs, not embedded image bytes. This keeps account and backup data lighter.'],
    ['How does Dynamic Cover Theme work?','Dynamic Cover Theme can use recommendation and On This Day covers. It extracts multiple cover colors when possible, handles CORS-limited covers with a visual fallback, and can follow Global Appearance or choose a natural cover-driven light/dark treatment.'],
    ['Can I hide or reorder menu tabs?','Yes. Settings → Navigation lets you drag tabs, use arrows, type an exact position and hide/show destinations. Settings itself always remains visible so you can restore the menu.'],
    ['How do I contact the developer?','Use the Contact Alex Godly button on this About page.']
  ];

  return `<div class="v161-faq">${rows.map(([q,a])=>`
    <details>
      <summary>${escapeHtml(q)}</summary>
      <div>${escapeHtml(a)}</div>
    </details>`).join('')}</div>`;
}

function v161UpdateStatusHtml(){
  const s=V161_UPDATE_STATE;
  if(s.checking)return 'Checking the official MediaFlow build…';

  if(s.available&&s.latest){
    return `MediaFlow v${escapeHtml(String(s.latest))} is available. Current build: v${escapeHtml(v161CurrentVersion())}.`;
  }

  if(s.checked&&s.latest){
    return `You are on the latest detected build (v${escapeHtml(v161CurrentVersion())}).`;
  }

  if(s.checked){
    return `Update check could not verify the hosted build right now. Current build: v${escapeHtml(v161CurrentVersion())}.`;
  }

  return `Current build: v${escapeHtml(v161CurrentVersion())}. Automatic update checking is ${S.settings?.autoUpdateCheck===false?'off':'on'}.`;
}

function renderAbout(){
  const version=v161CurrentVersion();
  const counts={
    categories:(S.categories||[]).length,
    titles:(S.library||[]).length,
    logs:(S.sessions||[]).length
  };

  return `<div class="v161-about">
    <div class="v161-about-hero">
      <div class="section-label">ABOUT MEDIAFLOW</div>
      <h1>MediaFlow</h1>
      <div style="color:var(--text-dim);font-size:12px;margin-bottom:11px">Personal media rotation, Library tracking and consumption history.</div>
      <div class="v161-about-version">MediaFlow v${escapeHtml(version)} · by Alex Godly</div>

      <div class="v161-about-links">
        <a class="btn btn-primary" href="https://guns.lol/alexgodly" target="_blank" rel="noopener noreferrer">Contact Alex Godly</a>
        <a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Other apps by Alex Godly</a>
      </div>
    </div>

    <div class="v161-about-grid">
      <div class="v161-about-card">
        <h3>What MediaFlow does</h3>
        <p>MediaFlow combines a weighted consumption-rotation scheduler with a personal media Library, detailed History, Statistics, progression systems and optional title-level recommendations.</p>
        <ul>${v161FeatureList().map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>
      </div>

      <div class="v161-about-card">
        <h3>Current account</h3>
        <p>
          <b>${counts.categories.toLocaleString()}</b> categories<br>
          <b>${counts.titles.toLocaleString()}</b> Library titles<br>
          <b>${counts.logs.toLocaleString()}</b> History records
        </p>
        <p>Account data participates in MediaFlow's protected cloud-save and complete backup pipelines.</p>
      </div>

      <div class="v161-about-card">
        <h3>Version & updates</h3>
        <p>This file identifies itself as <b>MediaFlow v${escapeHtml(version)}</b>. Automatic update checking compares the current build with the official hosted MediaFlow build when the browser allows the request.</p>
        <div class="v161-update-status" id="v161-update-status">${v161UpdateStatusHtml()}</div>
        <div class="v161-about-links">
          <button class="btn btn-sm" onclick="App.v161CheckForUpdates(false)">Check now</button>
          <a class="btn btn-sm btn-ghost" href="https://alexgodly.github.io/MediaFlow/" target="_blank" rel="noopener noreferrer">Open latest web app</a>
        </div>
      </div>
    </div>

    <div class="section-label">FAQ</div>
    ${v161FaqHtml()}

    <div class="v161-about-card" style="margin-top:18px">
      <h3>Developer</h3>
      <p><b>MediaFlow is by Alex Godly.</b> For contact, profiles and developer links use <b>guns.lol/alexgodly</b>. To see other Alex Godly applications, use the Apps hub.</p>
      <div class="v161-about-links">
        <a class="btn btn-primary" href="https://guns.lol/alexgodly" target="_blank" rel="noopener noreferrer">Contact developer</a>
        <a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Alex Godly Apps</a>
      </div>
    </div>
  </div>`;
}

const v161RenderViewBase=renderView;
renderView=function(){
  if(S.view==='about'){
    const root=document.getElementById('view-root');
    if(!root)return;
    root.innerHTML=`<div class="fade-in">${renderAbout()}</div>`;
    return;
  }
  return v161RenderViewBase();
};

// ---- Settings: navigation customization ------------------------------------

function v161NavigationSettingsHtml(){
  const layout=v161EnsureNavLayout();
  const hidden=new Set(layout.hiddenIds);
  const rows=v161OrderedNavItems();

  return `<div class="section-label">NAVIGATION</div>
    <div class="card" style="margin-bottom:22px">
      <div style="font-weight:800;font-size:12px;margin-bottom:5px">Menu tabs</div>
      <div class="hint" style="margin-bottom:12px">
        Reorder menu destinations by dragging, arrows or exact number. Hide any destination you do not want in the menu. Settings always stays visible so you can restore hidden tabs. The same order drives desktop and mobile navigation.
      </div>

      <div class="v161-nav-manager">
        ${rows.map((n,index)=>{
          const isSettings=n.id==='settings';
          const visible=isSettings||!hidden.has(String(n.id));
          return `<div class="v161-nav-row" draggable="true"
            ondragstart="App.v161NavDragStart(event,'${n.id}')"
            ondragend="App.v161NavDragEnd(event)"
            ondragover="App.v161NavDragOver(event)"
            ondrop="App.v161NavDrop(event,'${n.id}')">
            <div class="v161-nav-grip" title="Drag to reorder">☰</div>
            <div class="v161-nav-label">${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span></div>
            <input class="v161-nav-number" type="number" min="1" max="${rows.length}" step="1" value="${index+1}"
              title="Set exact menu position"
              onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()"
              onkeydown="if(event.key==='Enter'){this.blur();}"
              onchange="App.v161SetNavPosition('${n.id}',this.value)">
            <div class="v161-nav-arrows">
              <button type="button" class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v161MoveNav('${n.id}',-1)">↑</button>
              <button type="button" class="btn btn-sm btn-ghost" ${index===rows.length-1?'disabled':''} onclick="App.v161MoveNav('${n.id}',1)">↓</button>
            </div>
            <label class="v161-nav-visible">
              <input type="checkbox" ${visible?'checked':''} ${isSettings?'disabled':''}
                onchange="App.v161ToggleNav('${n.id}',this.checked)">
              ${isSettings?'Always shown':'Show'}
            </label>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function v161UpdateSettingsHtml(){
  const enabled=S.settings?.autoUpdateCheck!==false;
  return `<div class="section-label">APP UPDATES</div>
    <div class="card" style="margin-bottom:22px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div style="min-width:220px;flex:1">
          <b>Automatic update checking</b>
          <div class="hint">Periodically checks the official MediaFlow build version. Hosted/web builds can open the latest app immediately; local files cannot replace themselves automatically, so MediaFlow reports the newer version instead.</div>
          <div class="v161-update-status" id="v161-settings-update-status">${v161UpdateStatusHtml()}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="toggle ${enabled?'on':''}" onclick="App.v161ToggleAutoUpdateCheck()" aria-label="Toggle automatic update checking"></button>
          <button class="btn btn-sm" onclick="App.v161CheckForUpdates(false)">Check now</button>
        </div>
      </div>
    </div>`;
}

const v161RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v161RenderSettingsBase();
  const nav=v161NavigationSettingsHtml();
  const updates=v161UpdateSettingsHtml();

  const cloudMarker='<div class="section-label">CLOUD SYNC</div>';
  if(h.includes(cloudMarker)){
    h=h.replace(cloudMarker,nav+updates+cloudMarker);
  }else{
    h+=nav+updates;
  }

  return h;
};

// ---- Automatic update checker ----------------------------------------------

function v161RefreshUpdateStatusDom(){
  for(const id of ['v161-update-status','v161-settings-update-status']){
    const el=document.getElementById(id);
    if(el)el.innerHTML=v161UpdateStatusHtml();
  }
}

async function v161FetchRemoteVersion(){
  let lastError=null;

  for(const url of V161_UPDATE_SOURCES){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),9000);
      const res=await fetch(url,{cache:'no-store',signal:controller.signal});
      clearTimeout(timer);

      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const text=await res.text();
      const match=text.match(/<meta\s+name=["']mediaflow-version["']\s+content=["'](\d+)["'][^>]*>/i) ||
        text.match(/<meta\s+content=["'](\d+)["']\s+name=["']mediaflow-version["'][^>]*>/i);

      if(match)return Number(match[1]);
      throw new Error('Version metadata not found');
    }catch(e){
      lastError=e;
    }
  }

  throw lastError||new Error('Unable to check version');
}

async function v161CheckForUpdates(silent=true){
  if(V161_UPDATE_STATE.checking)return V161_UPDATE_STATE;

  V161_UPDATE_STATE.checking=true;
  V161_UPDATE_STATE.message='Checking…';
  v161RefreshUpdateStatusDom();

  try{
    const latest=await v161FetchRemoteVersion();
    const current=Number(v161CurrentVersion())||161;

    V161_UPDATE_STATE={
      checked:true,
      checking:false,
      latest,
      available:latest>current,
      message:latest>current?`v${latest} available`:'Up to date',
      checkedAt:Date.now()
    };

    if(latest>current){
      showToast(`MediaFlow v${latest} is available`);
    }else if(!silent){
      showToast(`MediaFlow v${current} is up to date`);
    }
  }catch(e){
    V161_UPDATE_STATE={
      checked:true,
      checking:false,
      latest:null,
      available:false,
      message:'Could not verify hosted version',
      checkedAt:Date.now()
    };
    if(!silent)showToast('Could not check for updates right now');
  }

  v161RefreshUpdateStatusDom();
  return V161_UPDATE_STATE;
}

function v161ToggleAutoUpdateCheck(){
  S.settings=S.settings||DEFAULT_SETTINGS;
  S.settings.autoUpdateCheck=S.settings.autoUpdateCheck===false;
  persistSettings();

  if(S.settings.autoUpdateCheck){
    v161EnsureAutomaticUpdateCheck(true);
  }else{
    clearTimeout(V161_UPDATE_TIMER);
    V161_UPDATE_TIMER=null;
  }

  render();
}

function v161EnsureAutomaticUpdateCheck(runSoon=false){
  if(S.settings?.autoUpdateCheck===false){
    clearTimeout(V161_UPDATE_TIMER);
    V161_UPDATE_TIMER=null;
    return;
  }

  if(V161_UPDATE_TIMER)return;

  V161_UPDATE_TIMER=setTimeout(async()=>{
    V161_UPDATE_TIMER=null;
    await v161CheckForUpdates(true);
    v161EnsureAutomaticUpdateCheck(false);
  },runSoon?3500:V161_UPDATE_CHECK_INTERVAL);
}

// ---- Persistence / cloud / backup audit ------------------------------------

const v161SnapshotBase=snapshot;
snapshot=function(){
  const x=v161SnapshotBase();
  x.navLayout=JSON.parse(JSON.stringify(v161NormalizeNavLayout(S.navLayout)));
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,161);
  return x;
};

const v161ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v161ApplyStateBase.apply(this,arguments);
  S.navLayout=v161NormalizeNavLayout(d?.navLayout);
  if(typeof S.settings?.autoUpdateCheck!=='boolean')S.settings.autoUpdateCheck=true;
  return result;
};

const v161MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v161MergeStatesBase(a,b)||{};

  const an=a?.navLayout&&typeof a.navLayout==='object'?a.navLayout:null;
  const bn=b?.navLayout&&typeof b.navLayout==='object'?b.navLayout:null;

  let chosen=null;
  if(an&&bn){
    chosen=(Number(an.modifiedAt)||0)>=(Number(bn.modifiedAt)||0)?an:bn;
  }else{
    chosen=an||bn||null;
  }

  out.navLayout=v161NormalizeNavLayout(chosen);
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    161
  );

  return out;
};

// Strengthen v155 Sync Now completeness/verification for the new persistent
// navigation state. This means Sync Now cannot report success if navLayout was
// dropped from the final cloud object.
const v161StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const result=v161StateCompletenessBase(state);
  const missing=[...(result?.missing||[])];

  if(!state?.navLayout||typeof state.navLayout!=='object'){
    if(!missing.includes('navigation layout'))missing.push('navigation layout');
  }

  return {ok:missing.length===0,missing};
};

const v161VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v161VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cn=v161NormalizeNavLayout(cloudState?.navLayout);
  const en=v161NormalizeNavLayout(expected?.navLayout);

  if(Number(cn.modifiedAt||0)!==Number(en.modifiedAt||0)){
    problems.push('Navigation layout');
  }

  if(JSON.stringify(cn.order)!==JSON.stringify(en.order)){
    problems.push('Navigation order');
  }

  if(JSON.stringify([...cn.hiddenIds].sort())!==JSON.stringify([...en.hiddenIds].sort())){
    problems.push('Navigation visibility');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// Full Backup explicitly carries the v161 layout and bumps the modern schema.
// Because v152 Automatic Backup resolves v148BuildFullBackup() at call time,
// scheduled folder backups automatically receive this same final payload.
const v161BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v161BuildFullBackupBase();

  payload.backupSchemaVersion=V161_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.navLayout=JSON.parse(JSON.stringify(v161NormalizeNavLayout(S.navLayout)));
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V161_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v161 backup. Includes canonical account state, Personal Order, Old System, Rating Queue/portable preferences, import metadata, Dynamic Cover settings, and customizable navigation. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v161BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v161BackupManifestBase(state,extras);

  manifest.schemaVersion=V161_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    navigationLayout:true,
    navigationVisibility:true,
    navigationOrder:true,
    aboutVersionMetadata:true,
    automaticUpdatePreference:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    navigationTabs:v161NormalizeNavLayout(state?.navLayout).order.length,
    hiddenNavigationTabs:v161NormalizeNavLayout(state?.navLayout).hiddenIds.length
  });

  return manifest;
};

// Import already uses the final v46ApplyState chain. The wrappers above restore
// navLayout and Settings. No parallel/import-only state exists.

// ---- Final navigation safety + public actions -------------------------------

const v161SetViewBase=App.setView;
App.setView=function(v){
  const id=String(v||'');
  const known=NAV_ITEMS.some(n=>n.id===id);

  // Programmatic routes such as profile remain allowed, but visible navigation
  // destinations honor the user's hide/show configuration.
  if(known){
    const visible=new Set(v161VisibleNavItems().map(n=>String(n.id)));
    if(!visible.has(id)&&id!=='settings'){
      showToast(`${NAV_ITEMS.find(n=>n.id===id)?.label||'This tab'} is hidden in Navigation settings.`);
      return;
    }
  }

  return v161SetViewBase.call(this,v);
};

Object.assign(App,{
  v161SetNavPosition,
  v161MoveNav,
  v161ToggleNav,
  v161NavDragStart,
  v161NavDragEnd,
  v161NavDragOver,
  v161NavDrop,
  v161CheckForUpdates,
  v161ToggleAutoUpdateCheck
});

// Arm the version checker without making page rendering wait on a network call.
const v161RenderBase=render;
render=function(){
  const result=v161RenderBase.apply(this,arguments);
  Promise.resolve().then(()=>v161EnsureAutomaticUpdateCheck(true));
  return result;
};



