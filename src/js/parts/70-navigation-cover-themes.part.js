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



/* ============================================================
   MediaFlow v162 — User-controlled adaptive cover collections
   ============================================================ */

const V162_BACKUP_SCHEMA_VERSION=5;
const V162_THEME_MODES=new Set(['dynamic','library','image']);
let V162_ROTATION_TIMER=null;
let V162_ROTATION_MODE='';
let V162_ROTATION_INDEX={library:0,image:0};
let V162_LIBRARY_SEARCH_TIMER=null;

function v162ClampInterval(value){
  const n=Math.round(Number(value)||30);
  return Math.max(5,Math.min(3600,n));
}

function v162NormalizeHttpImageUrl(value){
  let s=String(value||'').trim();
  if(!s)return '';
  if(/^\/\//.test(s))s='https:'+s;
  if(!/^https?:\/\//i.test(s))return '';
  try{
    const u=new URL(s);
    return /^https?:$/i.test(u.protocol)?u.href:'';
  }catch(_){
    return '';
  }
}

function v162EnsureThemeSettingsObject(settings){
  const target=(settings&&typeof settings==='object')?settings:{};

  let mode=String(target.v162ThemeCollection||'').toLowerCase();
  if(!V162_THEME_MODES.has(mode))mode='dynamic';
  target.v162ThemeCollection=mode;

  const library=(target.v162LibraryTheme&&typeof target.v162LibraryTheme==='object')
    ?target.v162LibraryTheme:{};
  library.titleIds=[...new Set(
    (Array.isArray(library.titleIds)?library.titleIds:[])
      .map(String)
      .filter(Boolean)
  )];
  library.intervalSec=v162ClampInterval(library.intervalSec);
  library.modifiedAt=Number(library.modifiedAt)||0;
  target.v162LibraryTheme=library;

  const image=(target.v162ImageTheme&&typeof target.v162ImageTheme==='object')
    ?target.v162ImageTheme:{};
  image.urls=[...new Set(
    (Array.isArray(image.urls)?image.urls:[])
      .map(v162NormalizeHttpImageUrl)
      .filter(Boolean)
  )];
  image.intervalSec=v162ClampInterval(image.intervalSec);
  image.modifiedAt=Number(image.modifiedAt)||0;
  target.v162ImageTheme=image;

  return target;
}

function v162EnsureThemeSettings(){
  S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
  return S.settings;
}

v162EnsureThemeSettings();

function v162ThemeMode(){
  const s=v162EnsureThemeSettings();
  if(!s.dynamicCoverTheme)return 'static';
  return V162_THEME_MODES.has(s.v162ThemeCollection)?s.v162ThemeCollection:'dynamic';
}

function v162StopRotation(){
  clearTimeout(V162_ROTATION_TIMER);
  V162_ROTATION_TIMER=null;
  V162_ROTATION_MODE='';
}

function v162LibraryThemeSources(){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const byId=new Map((S.library||[]).map(x=>[String(x?.id||''),x]));
  const out=[];

  for(const id of cfg.titleIds){
    const item=byId.get(String(id));
    const url=v160SafeCoverUrl(item?.coverUrl);
    if(!item||!url)continue;
    out.push({
      source:'librarytheme',
      label:`Library Cover: ${cleanTitle(item.title)}`,
      url,
      libraryId:item.id
    });
  }

  return out;
}

function v162ImageThemeSources(){const cfg=v162EnsureThemeSettings().v162ImageTheme;
  return cfg.urls.map((url,index)=>({
    source:'imagetheme',
    label:`Custom Image ${index+1}`,
    url
  }));
}

function v162RotatingSources(mode){
  const rows=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();
  if(!rows.length)return [];

  const index=((Number(V162_ROTATION_INDEX[mode])||0)%rows.length+rows.length)%rows.length;
  const first=rows[index];

  // Current rotation item first. Remaining configured sources are safe fallback
  // candidates if the current URL cannot be loaded.
  return [first,...rows.filter((_,i)=>i!==index)];
}

function v162ThemeSources(){
  const mode=v162ThemeMode();

  if(mode==='dynamic')return v160AllDynamicSources();

  // On This Day may request a forced Dynamic source every 12 seconds. Custom
  // collections intentionally ignore it; their user-selected rotation remains
  // authoritative.
  V159_FORCED_THEME_SOURCE=null;

  if(mode==='library')return v162RotatingSources('library');
  if(mode==='image')return v162RotatingSources('image');
  return [];
}

function v162SoftPalette(themeData,mode){
  const p=v159CoverPalette(themeData,mode);
  if(!p)return null;

  // Dynamic Cover Theme keeps its expressive v159 palette. The two manually
  // curated collections are intentionally calmer so a chosen poster/photo
  // influences the whole UI without overpowering content.
  if(v162ThemeMode()==='dynamic')return p;

  if(mode==='light'){
    p.bg=v145MixHex(p.bg,'#F4F6FA',.38);
    p.panel=v145MixHex(p.panel,'#FFFFFF',.32);
    p.raised=v145MixHex(p.raised,'#EDF1F6',.38);
    p.border=v145MixHex(p.border,'#CCD3DE',.48);
    p.borderSoft=v145MixHex(p.borderSoft,'#DCE2EA',.42);
    p.primary=v145MixHex(p.primary,'#53606F',.76);
    p.secondary=v145MixHex(p.secondary,'#677383',.72);
    p.tertiary=v145MixHex(p.tertiary,'#75808E',.68);
    p.flow=p.primary;
    p.flowDim=v145MixHex(p.primary,'#D8DEE7',.32);
    p.text='#151A22';
    p.textDim='#3E4857';
    p.textMute='#687486';
  }else{
    p.bg=v145MixHex(p.bg,'#080C13',.42);
    p.panel=v145MixHex(p.panel,'#0D121B',.40);
    p.raised=v145MixHex(p.raised,'#151C28',.44);
    p.border=v145MixHex(p.border,'#303947',.48);
    p.borderSoft=v145MixHex(p.borderSoft,'#202938',.42);
    p.primary=v145MixHex(p.primary,'#AAB5C4',.78);
    p.secondary=v145MixHex(p.secondary,'#8E9AAA',.72);
    p.tertiary=v145MixHex(p.tertiary,'#7D8998',.68);
    p.flow=p.primary;
    p.flowDim=v145MixHex(p.primary,'#222D3B',.38);
    p.text='#F5F7FA';
    p.textDim='#C5CDD8';
    p.textMute='#8D98A8';
  }

  return p;
}

function v162HasLiveCoverTheme(){
  const st=S.v146DynamicThemeState||{};
  return (
    document.documentElement.dataset.v146DynamicActive==='1' &&
    !!st.palette &&
    ['recommended','onthisday','librarytheme','imagetheme'].includes(String(st.source||''))
  );
}

// Tag the adaptive source family so CSS can keep curated custom collections
// intentionally calmer than normal Dynamic Cover Theme.
const v162ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  const root=document.documentElement;
  const sourceType=String(source?.source||'');
  const mode=sourceType==='librarytheme'
    ?'library'
    :sourceType==='imagetheme'
      ?'image'
      :'dynamic';

  root.dataset.v162CoverMode=mode;
  return v162ApplyFullPaletteBase.apply(this,arguments);
};

const v162ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  document.documentElement.removeAttribute('data-v162-cover-mode');
  return v162ClearInlineThemeVarsBase.apply(this,arguments);
};

// FINAL v162 adaptive-theme resolver shared by all three cover collections.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v162ThemeSources();

  for(const source of sources){
    const themeData=await v160ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const appearance=v159DynamicAppearanceMode(themeData);
    const palette=v162SoftPalette(themeData,appearance);
    if(!palette)continue;

    palette.visualCoverUrl=themeData.visualCoverUrl||source.url;
    palette.corsFallback=!!themeData.corsFallback;
    palette.naturalMode=themeData.naturalMode||appearance;

    v146ApplyFullPalette(palette,source);
    return;
  }

  if(seq!==V146_DYNAMIC_SEQ)return;

  // A temporary image/CORS/network failure must never replace a valid adaptive
  // theme with a static fallback.
  if(v162HasLiveCoverTheme()){
    v146UpdateThemeStatus();
    return;
  }

  v146RestoreSelectedThemeFallback();
};

function v162CurrentCollectionLabel(){
  const mode=v162ThemeMode();
  if(mode==='library')return 'Library Cover Theme';
  if(mode==='image')return 'Image URL Theme';
  return 'Dynamic Cover Theme';
}

v146UpdateThemeStatus=function(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const p=st.palette;
  const mode=v162ThemeMode();

  let text='Theme collections are active.';

  if(S.settings?.dynamicCoverTheme){
    const validSource=['recommended','onthisday','librarytheme','imagetheme'].includes(String(st.source||''));

    if(validSource&&p){
      const appearance=typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()
        ?`Global ${p.mode||'dynamic'}`
        :`Natural ${p.mode||st.naturalMode||'dynamic'}`;

      const method=st.corsFallback
        ?'cover visual + safe palette'
        :'adaptive cover palette';

      text=`${st.label} · ${appearance} · ${method}`;
    }else if(mode==='library'){
      const count=v162LibraryThemeSources().length;
      text=count
        ?`${count} selected Library cover${count===1?'':'s'} · preparing theme`
        :'Select at least one Library title that has a cover.';
    }else if(mode==='image'){
      const count=v162ImageThemeSources().length;
      text=count
        ?`${count} custom image${count===1?'':'s'} · preparing theme`
        :'Add at least one valid http/https image URL.';
    }else{
      const count=v160AllDynamicSources().length;
      text=count
        ?`${count} Dynamic Cover source${count===1?'':'s'} found · preparing theme`
        :'No recommendation / On This Day cover source is currently available — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

// v159's random Dynamic Cover timer should run only for the original Dynamic
// Cover collection. Curated Library/Image collections obey the user's interval.
const v162DynamicSourceTimerBase=v159EnsureDynamicSourceTimer;
v159EnsureDynamicSourceTimer=function(){
  if(v162ThemeMode()!=='dynamic'){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }
  return v162DynamicSourceTimerBase.apply(this,arguments);
};

// On This Day continues rotating visually, but it must not force a theme change
// while a user-curated collection is active.
const v162ApplyOtdHeroBase=v159ApplyOtdHero;
v159ApplyOtdHero=function(index,options={}){
  if(v162ThemeMode()!=='dynamic'){
    options=Object.assign({},options,{forceTheme:false});
  }
  return v162ApplyOtdHeroBase(index,options);
};

function v162EnsureRotationTimer(reset=false){
  const mode=v162ThemeMode();

  if(reset||mode!==V162_ROTATION_MODE){
    v162StopRotation();
  }

  if(mode!=='library'&&mode!=='image'){
    v162StopRotation();
    return;
  }

  const rows=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();
  if(rows.length<=1){
    v162StopRotation();
    return;
  }

  if(V162_ROTATION_TIMER)return;

  V162_ROTATION_MODE=mode;
  const cfg=mode==='library'
    ?v162EnsureThemeSettings().v162LibraryTheme
    :v162EnsureThemeSettings().v162ImageTheme;
  const delay=v162ClampInterval(cfg.intervalSec)*1000;

  V162_ROTATION_TIMER=setTimeout(()=>{
    V162_ROTATION_TIMER=null;
    const latest=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();

    if(v162ThemeMode()!==mode||latest.length<=1){
      v162EnsureRotationTimer(true);
      return;
    }

    V162_ROTATION_INDEX[mode]=(Number(V162_ROTATION_INDEX[mode])||0)+1;
    V162_ROTATION_INDEX[mode]%=latest.length;

    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(false);
  },delay);
}

// ---- Theme collection selector ---------------------------------------------

const v162SetThemeCollectionBase=App.setThemeCollection;
App.setThemeCollection=function(kind){
  const k=String(kind||'');

  if(k==='dynamic'||k==='library-cover'||k==='image-url'){
    S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
    S.settings.dynamicCoverTheme=true;
    S.settings.v162ThemeCollection=
      k==='library-cover'?'library':
      k==='image-url'?'image':
      'dynamic';

    V162_ROTATION_INDEX.library=0;
    V162_ROTATION_INDEX.image=0;
    v162StopRotation();

    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(true);
    return;
  }

  S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
  v162StopRotation();
  return v162SetThemeCollectionBase.call(this,k);
};

// ---- Library-cover collection actions --------------------------------------

function v162LibraryThemeSelectedHtml(){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const map=new Map((S.library||[]).map(x=>[String(x?.id||''),x]));
  const valid=cfg.titleIds.map(id=>map.get(String(id))).filter(Boolean);

  if(!valid.length){
    return `<div class="v162-theme-empty">No Library titles selected yet. Search for a title with a cover and add it.</div>`;
  }

  return valid.map((item,index)=>{
    const cover=v160SafeCoverUrl(item.coverUrl);
    return `<div class="v162-theme-selected-row">
      ${cover?`<img class="v162-theme-thumb" src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:''}
      <div class="v162-theme-selected-copy">
        <b>${escapeHtml(cleanTitle(item.title))}</b>
        <small>Theme ${index+1} of ${valid.length}</small>
      </div>
      <div class="v162-theme-row-actions">
        <button class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v162MoveLibraryTheme('${escapeHtml(String(item.id))}',-1)">↑</button>
        <button class="btn btn-sm btn-ghost" ${index===valid.length-1?'disabled':''} onclick="App.v162MoveLibraryTheme('${escapeHtml(String(item.id))}',1)">↓</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v162RemoveLibraryTheme('${escapeHtml(String(item.id))}')">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function v162LibraryThemeSearch(query){
  clearTimeout(V162_LIBRARY_SEARCH_TIMER);

  const box=document.getElementById('v162-library-theme-results');
  if(!box)return;

  const q=cleanTitle(String(query||'')).toLocaleLowerCase();
  if(!q){
    box.innerHTML='';
    return;
  }

  V162_LIBRARY_SEARCH_TIMER=setTimeout(()=>{
    const selected=new Set(v162EnsureThemeSettings().v162LibraryTheme.titleIds.map(String));
    const rows=[];

    // One debounced linear scan is deliberate: no giant <select> with tens of
    // thousands of options is ever rendered into Settings.
    for(const item of (S.library||[])){
      if(rows.length>=20)break;
      if(!item?.id||!v160SafeCoverUrl(item.coverUrl))continue;
      if(selected.has(String(item.id)))continue;

      const title=cleanTitle(item.title||'');
      if(!title.toLocaleLowerCase().includes(q))continue;
      rows.push(item);
    }

    if(!rows.length){
      box.innerHTML=`<div class="v162-theme-empty">No unselected Library title with a cover matches this search.</div>`;
      return;
    }

    box.innerHTML=rows.map(item=>`
      <button type="button" class="v162-theme-search-result" onclick="App.v162AddLibraryTheme('${escapeHtml(String(item.id))}')">
        <img class="v162-theme-thumb" src="${escapeHtml(String(item.coverUrl))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        <span class="v162-theme-selected-copy">
          <b>${escapeHtml(cleanTitle(item.title))}</b>
          <small>Add this cover to the rotation</small>
        </span>
      </button>`).join('');
  },140);
}

function v162AddLibraryTheme(id){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  const item=(S.library||[]).find(x=>String(x?.id||'')===sid);

  if(!item||!v160SafeCoverUrl(item.coverUrl)){
    showToast('That Library title does not currently have a usable cover.');
    return;
  }

  if(!cfg.titleIds.includes(sid))cfg.titleIds.push(sid);
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162RemoveLibraryTheme(id){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  cfg.titleIds=cfg.titleIds.filter(x=>String(x)!==sid);
  cfg.modifiedAt=Date.now();

  const count=v162LibraryThemeSources().length;
  if(count)V162_ROTATION_INDEX.library%=count;
  else V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162MoveLibraryTheme(id,delta){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  const from=cfg.titleIds.indexOf(sid);
  if(from<0)return;

  const to=Math.max(0,Math.min(cfg.titleIds.length-1,from+(Number(delta)||0)));
  if(to===from)return;

  cfg.titleIds.splice(from,1);
  cfg.titleIds.splice(to,0,sid);
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162SetLibraryThemeInterval(value){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  cfg.intervalSec=v162ClampInterval(value);
  cfg.modifiedAt=Date.now();

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
}

// ---- Image-URL collection actions ------------------------------------------

function v162SaveImageThemeUrls(){
  const el=document.getElementById('v162-image-theme-urls');
  if(!el)return;

  const raw=String(el.value||'');
  const pieces=raw
    .split(/\r?\n|,/)
    .map(x=>x.trim())
    .filter(Boolean);

  const valid=[];
  let invalid=0;

  for(const value of pieces){
    const url=v162NormalizeHttpImageUrl(value);
    if(!url){invalid++;continue;}
    if(!valid.includes(url))valid.push(url);
  }

  const cfg=v162EnsureThemeSettings().v162ImageTheme;
  cfg.urls=valid;
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.image=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);

  if(invalid){
    showToast(`${invalid} invalid image URL${invalid===1?' was':'s were'} ignored.`);
  }else{
    showToast(`${valid.length} image theme${valid.length===1?'':'s'} saved.`);
  }
}

function v162SetImageThemeInterval(value){
  const cfg=v162EnsureThemeSettings().v162ImageTheme;
  cfg.intervalSec=v162ClampInterval(value);
  cfg.modifiedAt=Date.now();

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
}

// ---- Settings UI -----------------------------------------------------------

function v162CollectionPanelHtml(mode){
  const settings=v162EnsureThemeSettings();

  if(mode==='dynamic'){
    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Dynamic Cover Theme</div>
          <div class="hint">MediaFlow automatically rotates priority between recommendation and On This Day covers. The cover drives an adaptive full-app palette while keeping text and form controls contrast-safe.</div>
        </div>
        <span class="v162-cover-theme-badge">Automatic</span>
      </div>
      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>
    </div>`;
  }

  if(mode==='library'){
    const cfg=settings.v162LibraryTheme;

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Library Cover Theme</div>
          <div class="hint">Choose one or more Library titles that already have covers. MediaFlow uses the same adaptive cover engine as Dynamic Cover Theme, but with a calmer palette and your exact rotation list.</div>
        </div>
        <span class="v162-cover-theme-badge">Your Library</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1" value="${cfg.intervalSec}"
            onchange="App.v162SetLibraryThemeInterval(this.value)">
        </div>
        <div class="field v162-theme-search-wrap" style="margin:0">
          <label class="field-label">Add Library title with cover</label>
          <input type="search" placeholder="Search titles with covers…"
            autocomplete="off"
            oninput="App.v162LibraryThemeSearch(this.value)">
          <div id="v162-library-theme-results" class="v162-theme-search-results"></div>
        </div>
      </div>

      <div class="v162-rotation-note">One selected title stays fixed. With multiple titles, themes rotate sequentially using the interval above. A failed cover automatically falls through to another selected cover instead of destroying the current theme.</div>
      <div class="v162-theme-selected-list">${v162LibraryThemeSelectedHtml()}</div>
      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing Library cover theme…</span></div>
    </div>`;
  }

  const cfg=settings.v162ImageTheme;
  return `<div class="v162-cover-theme-panel">
    <div class="v162-cover-theme-head">
      <div>
        <div class="v162-cover-theme-title">Image URL Theme</div>
        <div class="hint">Use any direct http/https image URL. Put multiple URLs on separate lines to rotate through them. MediaFlow applies the same adaptive/CORS-safe cover engine with a calmer visual treatment.</div>
      </div>
      <span class="v162-cover-theme-badge">Custom images</span>
    </div>

    <div class="v162-theme-controls">
      <div class="field" style="margin:0">
        <label class="field-label">Rotate every (seconds)</label>
        <input type="number" min="5" max="3600" step="1" value="${cfg.intervalSec}"
          onchange="App.v162SetImageThemeInterval(this.value)">
      </div>
      <div class="field" style="margin:0">
        <label class="field-label">Image URLs — one per line</label>
        <textarea id="v162-image-theme-urls" class="v162-image-url-box" placeholder="https://example.com/image.jpg&#10;https://example.com/another.jpg">${escapeHtml(cfg.urls.join('\n'))}</textarea>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px">
      <button type="button" class="btn btn-primary btn-sm" onclick="App.v162SaveImageThemeUrls()">Save image URLs</button>
      <span class="hint">${cfg.urls.length} saved image${cfg.urls.length===1?'':'s'}</span>
    </div>
    <div class="v162-rotation-note">One URL stays fixed. Multiple URLs rotate sequentially using the interval above. Invalid/non-image URLs are skipped and the last valid adaptive theme remains active during temporary failures.</div>
    <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing image theme…</span></div>
  </div>`;
}

const v162RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v162RenderSettingsBase();
  const settings=v162EnsureThemeSettings();
  const mode=v162ThemeMode();

  const current=settings.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);

  const collection=
    settings.dynamicCoverTheme
      ?(mode==='library'?'library-cover':mode==='image'?'image-url':'dynamic')
      :(isFull?'fullstyle':isPlatform?'platform':'mediaflow');

  const selector=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
    <option value="library-cover" ${collection==='library-cover'?'selected':''}>Library Cover Themes</option>
    <option value="image-url" ${collection==='image-url'?'selected':''}>Image URL Themes</option>
  </select>`;

  h=h.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    selector
  );

  // Remove v146's older one-purpose Dynamic panel/note. v162 supplies one
  // unified adaptive panel for all three special collections.
  h=h.replace(
    /<div class="v146-theme-mode-panel">[\s\S]*?<div id="v146-dynamic-theme-status" class="v146-theme-status">[\s\S]*?<\/div>\s*<\/div>/,
    ''
  );
  h=h.replace(
    /<div class="v146-static-fallback-note">[\s\S]*?<\/div>/,
    ''
  );

  if(settings.dynamicCoverTheme){
    // Keep the normal selected theme visible as the fallback chooser.
    h=h.replace(
      /<label class="field-label">(MediaFlow theme|Platform theme|Full style theme)<\/label>/,
      '<label class="field-label">Fallback theme</label>'
    );

    const panel=v162CollectionPanelHtml(mode);
    h=h.replace(
      /(<div class="field"><label class="field-label">Theme collection<\/label>[\s\S]*?<\/div>)/,
      `$1${panel}`
    );
  }

  return h;
};

// ---- Save/load/cloud/backup -------------------------------------------------

const v162PersistSettingsBase=persistSettings;
persistSettings=function(){
  v162EnsureThemeSettings();
  return v162PersistSettingsBase.apply(this,arguments);
};

const v162LoadAllBase=loadAll;
loadAll=async function(){
  await v162LoadAllBase.apply(this,arguments);
  v162EnsureThemeSettings();
};

const v162SnapshotBase=snapshot;
snapshot=function(){
  v162EnsureThemeSettings();
  const x=v162SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,162);
  return x;
};

const v162ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v162ApplyStateBase.apply(this,arguments);
  v162EnsureThemeSettings();
  V162_ROTATION_INDEX.library=0;
  V162_ROTATION_INDEX.image=0;
  v162StopRotation();
  return result;
};

const v162MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v162MergeStatesBase(a,b)||{};
  out.settings=v162EnsureThemeSettingsObject(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    162
  );
  return out;
};

const v162VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v162VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  const keys=['dynamicCoverTheme','v162ThemeCollection','v162LibraryTheme','v162ImageTheme'];
  for(const key of keys){
    if(JSON.stringify(cloud[key])!==JSON.stringify(wanted[key])){
      problems.push(`Theme setting: ${key}`);
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v162BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v162EnsureThemeSettings();
  const payload=v162BuildFullBackupBase();

  payload.backupSchemaVersion=V162_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V162_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v162 backup. Includes Library Cover Theme and Image URL Theme source lists/rotation intervals in Settings, plus all canonical account data, Personal Order, Old System, navigation, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v162BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v162BackupManifestBase(state,extras);
  const settings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );

  manifest.schemaVersion=V162_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    adaptiveThemeCollections:true,
    libraryCoverThemeSources:true,
    customImageThemeSources:true,
    adaptiveThemeRotationIntervals:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    libraryCoverThemeTitles:settings.v162LibraryTheme.titleIds.length,
    customImageThemeUrls:settings.v162ImageTheme.urls.length
  });

  return manifest;
};

// ---- Final render/timer hook ------------------------------------------------

const v162RenderBase=render;
render=function(){
  const result=v162RenderBase.apply(this,arguments);

  Promise.resolve().then(()=>{
    v162EnsureRotationTimer(false);
    const status=document.getElementById('v146-dynamic-theme-status');
    if(status)v146UpdateThemeStatus();
  });

  return result;
};

Object.assign(App,{
  v162LibraryThemeSearch,
  v162AddLibraryTheme,
  v162RemoveLibraryTheme,
  v162MoveLibraryTheme,
  v162SetLibraryThemeInterval,
  v162SaveImageThemeUrls,
  v162SetImageThemeInterval
});



/* ============================================================
   MediaFlow v163 — Dynamic Cover Theme rotation control
   ============================================================ */

const V163_BACKUP_SCHEMA_VERSION=6;

function v163ClampDynamicInterval(value){
  const n=Math.round(Number(value)||30);
  return Math.max(5,Math.min(3600,n));
}

function v163EnsureDynamicRotationSetting(settings){
  const target=(settings&&typeof settings==='object')?settings:{};
  target.v163DynamicThemeIntervalSec=v163ClampDynamicInterval(
    target.v163DynamicThemeIntervalSec
  );
  return target;
}

v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

const v163EnsureThemeSettingsObjectBase=v162EnsureThemeSettingsObject;
v162EnsureThemeSettingsObject=function(settings){
  const target=v163EnsureThemeSettingsObjectBase(settings);
  return v163EnsureDynamicRotationSetting(target);
};

const v163EnsureThemeSettingsBase=v162EnsureThemeSettings;
v162EnsureThemeSettings=function(){
  const target=v163EnsureThemeSettingsBase();
  v163EnsureDynamicRotationSetting(target);
  return target;
};

function v163DynamicThemeInterval(){
  return v163ClampDynamicInterval(
    v162EnsureThemeSettings().v163DynamicThemeIntervalSec
  );
}

function v163SetDynamicThemeInterval(value){
  const settings=v162EnsureThemeSettings();
  settings.v163DynamicThemeIntervalSec=v163ClampDynamicInterval(value);

  clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
  V159_DYNAMIC_SOURCE_TIMER=null;

  persistSettings();
  render();

  if(v162ThemeMode()==='dynamic'){
    v146ScheduleDynamicTheme();
    v159EnsureDynamicSourceTimer();
  }
}

// Exact user-controlled interval replaces v159's random 24–36 second cadence.
v159EnsureDynamicSourceTimer=function(){
  if(!S.settings?.dynamicCoverTheme || v162ThemeMode()!=='dynamic'){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }

  if(V159_DYNAMIC_SOURCE_TIMER)return;

  const delay=v163DynamicThemeInterval()*1000;

  V159_DYNAMIC_SOURCE_TIMER=setTimeout(()=>{
    V159_DYNAMIC_SOURCE_TIMER=null;

    if(S.settings?.dynamicCoverTheme && v162ThemeMode()==='dynamic'){
      V159_FORCED_THEME_SOURCE=null;
      v146ScheduleDynamicTheme();
      v159EnsureDynamicSourceTimer();
    }
  },delay);
};

// On This Day can continue its visual 12s hero rotation, but it no longer
// forces Dynamic Cover Theme to switch before the configured interval.
const v163ApplyOtdHeroBase=v159ApplyOtdHero;
v159ApplyOtdHero=function(index,options={}){
  if(v162ThemeMode()==='dynamic'){
    options=Object.assign({},options,{forceTheme:false});
  }
  return v163ApplyOtdHeroBase(index,options);
};

// Add interval control to the existing Dynamic Cover Theme panel.
const v163CollectionPanelBase=v162CollectionPanelHtml;
v162CollectionPanelHtml=function(mode){
  let out=v163CollectionPanelBase(mode);
  if(mode!=='dynamic')return out;

  const controls=`<div class="v162-theme-controls">
    <div class="field" style="margin:0">
      <label class="field-label">Rotate every (seconds)</label>
      <input type="number" min="5" max="3600" step="1"
        value="${v163DynamicThemeInterval()}"
        onchange="App.v163SetDynamicThemeInterval(this.value)">
    </div>
  </div>
  <div class="v162-rotation-note">Dynamic Cover Theme changes its active recommendation / On This Day theme source on this exact interval. The Dashboard's On This Day title can still rotate visually without forcing an early theme change.</div>`;

  out=out.replace(
    '<div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>',
    controls+'<div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>'
  );

  return out;
};

// ---- Persistence / cloud verification / backup -----------------------------

const v163PersistSettingsBase=persistSettings;
persistSettings=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);
  return v163PersistSettingsBase.apply(this,arguments);
};

const v163SnapshotBase=snapshot;
snapshot=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);
  const x=v163SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,163);
  return x;
};

const v163ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v163ApplyStateBase.apply(this,arguments);
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

  clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
  V159_DYNAMIC_SOURCE_TIMER=null;

  return result;
};

const v163MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v163MergeStatesBase(a,b)||{};
  out.settings=v163EnsureDynamicRotationSetting(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    163
  );
  return out;
};

const v163VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v163VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v163EnsureDynamicRotationSetting(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v163EnsureDynamicRotationSetting(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  if(
    Number(cloud.v163DynamicThemeIntervalSec)!==
    Number(wanted.v163DynamicThemeIntervalSec)
  ){
    problems.push('Dynamic Cover Theme rotation interval');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v163BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

  const payload=v163BuildFullBackupBase();
  payload.backupSchemaVersion=V163_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V163_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v163 backup. Includes configurable Dynamic Cover Theme rotation interval plus all v162 adaptive theme collections, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v163BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v163BackupManifestBase(state,extras);

  manifest.schemaVersion=V163_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    dynamicCoverThemeRotationInterval:true
  });

  return manifest;
};

Object.assign(App,{
  v163SetDynamicThemeInterval
});



/* ============================================================
   MediaFlow v164 — Simkl Full Style Theme
   ------------------------------------------------------------
   The selected Full Style theme already persists in S.settings.theme,
   therefore the existing cloud, Sync Now, Full Backup, Automatic Backup,
   JSON export/import and Settings merge pipelines require no new schema field.
   ============================================================ */

const v164BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v164BuildFullBackupBase();

  // Keep current schema: v164 introduces a new allowed theme ID, not a new
  // persistent structure.
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v164 backup. Includes the selected Simkl Full Style theme through normal Settings persistence, plus all existing Library/History, adaptive themes, navigation, Personal Order, Old System, Rating Queue and portable preferences.';
  }

  return payload;
};/* ============================================================
   MediaFlow v165 — System Respect XP
   ------------------------------------------------------------
   Rewards:
   - following MediaFlow's recommended category;
   - extra XP when Exact title recommendations are enabled AND the
     recommended title appears anywhere in the same log (other titles may
     be logged alongside it);
   - a growing No-Skip multiplier for consecutive respected recommendations;
   - a stronger First-Pick multiplier for consecutive respected recommendations
     without pressing "Give me something else".

   Performance:
   - reward calculation touches only the newly-created session group;
   - lifetime totals reuse v150's existing dirty/cached XP aggregation;
   - no per-render History scan was added.
   ============================================================ */

const V165_BACKUP_SCHEMA_VERSION=7;
const V165_RESPECT_XP_VERSION=165;
const V165_SYSTEM_BASE_XP=10;
const V165_RECOMMENDED_TITLE_XP=25;

const V165_RESPECT_DEFAULT={
  version:V165_RESPECT_XP_VERSION,
  noSkipStreak:0,
  noRerollStreak:0,
  bestNoSkipStreak:0,
  bestNoRerollStreak:0,
  currentRerolls:0,
  totalSkips:0,
  totalRerolls:0,
  lastRewardAt:0,
  modifiedAt:0
};

function v165Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return JSON.parse(JSON.stringify(fallback));}
}

function v165NormalizeRespectState(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    version:V165_RESPECT_XP_VERSION,
    noSkipStreak:Math.max(0,Math.floor(Number(src.noSkipStreak)||0)),
    noRerollStreak:Math.max(0,Math.floor(Number(src.noRerollStreak)||0)),
    bestNoSkipStreak:Math.max(0,Math.floor(Number(src.bestNoSkipStreak)||0)),
    bestNoRerollStreak:Math.max(0,Math.floor(Number(src.bestNoRerollStreak)||0)),
    currentRerolls:Math.max(0,Math.floor(Number(src.currentRerolls)||0)),
    totalSkips:Math.max(0,Math.floor(Number(src.totalSkips)||0)),
    totalRerolls:Math.max(0,Math.floor(Number(src.totalRerolls)||0)),
    lastRewardAt:Math.max(0,Number(src.lastRewardAt)||0),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v165EnsureRespectState(){
  S.respectState=v165NormalizeRespectState(S.respectState);
  return S.respectState;
}

S.respectState=v165NormalizeRespectState(S.respectState);

function v165TouchRespectState(){
  const st=v165EnsureRespectState();
  st.modifiedAt=Date.now();
  return st;
}

function v165EndSessionContext(){
  const st=v165EnsureRespectState();
  if(st.currentRerolls){
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
  }
}

function v165RecordReroll(){
  const st=v165TouchRespectState();
  st.currentRerolls++;
  st.totalRerolls++;
  // "Give me something else" breaks the stronger first-pick streak,
  // but does not break the separate no-Skip streak.
  st.noRerollStreak=0;
}

function v165RecordSkip(){
  const st=v165TouchRespectState();
  st.totalSkips++;
  st.currentRerolls=0;
  // Skip breaks both respect streaks.
  st.noSkipStreak=0;
  st.noRerollStreak=0;
}

function v165RoundMultiplier(value){
  return Math.round((Number(value)||1)*100)/100;
}

function v165RespectMultipliers(noSkipStreak,noRerollStreak){
  const skip=Math.max(0,Number(noSkipStreak)||0);
  const reroll=Math.max(0,Number(noRerollStreak)||0);

  // Both start at ×1.00. The first-pick streak grows faster and to a higher cap,
  // because respecting the very first MediaFlow recommendation deserves more
  // than merely avoiding Skip.
  const noSkip=v165RoundMultiplier(
    1+Math.min(.50,.08*Math.log2(Math.max(1,skip)))
  );
  const noReroll=v165RoundMultiplier(
    1+Math.min(.75,.14*Math.log2(Math.max(1,reroll)))
  );

  return {noSkip,noReroll,combined:v165RoundMultiplier(noSkip*noReroll)};
}

function v165GroupSessions(sessionGroupId){
  const rows=[];
  const sessions=S.sessions||[];

  // New submitLog rows are contiguous at the end. Walk backward only across
  // this just-created group instead of scanning the whole History.
  for(let i=sessions.length-1;i>=0;i--){
    const s=sessions[i];
    if(!s)continue;
    if(String(s.sessionGroupId||'')===String(sessionGroupId||'')){
      rows.push(s);
      continue;
    }
    if(rows.length)break;
  }

  return rows.reverse();
}

function v165NormalizedTitle(value){
  return cleanTitle(String(value||'')).trim().toLocaleLowerCase();
}

function v165RecommendedTitleLogged(task,entries,groupRows){
  if(!S.settings?.exactTitleRecommendations)return false;
  if(!task?.title)return false;

  const wantedId=String(task.libraryId||'');
  const wantedTitle=v165NormalizedTitle(task.title);

  const matches=(libraryId,title,qty)=>{
    if(Number(qty)<=0)return false;
    const id=String(libraryId||'');
    if(wantedId&&id&&id===wantedId)return true;
    return !!wantedTitle&&v165NormalizedTitle(title)===wantedTitle;
  };

  for(const e of (entries||[])){
    if(matches(e?.libraryId,e?.title,e?.qty))return true;
  }

  for(const s of (groupRows||[])){
    for(const t of (s?.titles||[])){
      if(matches(t?.libraryId,t?.title,t?.qty))return true;
    }
  }

  return false;
}

function v165ApplyRespectReward(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const groupRows=v165GroupSessions(sessionGroupId);

  // Recommendation was respected when actual consumption includes the assigned
  // category. This remains true even if other categories/titles were logged too.
  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    // Logging something completely different is not a System Respect success.
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  const hadReroll=st.currentRerolls>0;

  // A completed recommendation without Skip extends the no-Skip streak,
  // including when the user rerolled first.
  st.noSkipStreak++;

  // First-pick streak is deliberately stricter.
  if(hadReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(st.bestNoSkipStreak,st.noSkipStreak);
  st.bestNoRerollStreak=Math.max(st.bestNoRerollStreak,st.noRerollStreak);

  const titleFollowed=v165RecommendedTitleLogged(task,entries,groupRows);
  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const baseRespectXP=
    V165_SYSTEM_BASE_XP+
    (titleFollowed?V165_RECOMMENDED_TITLE_XP:0);

  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const levelingEnabled=levelingSettings().enabled!==false;
  const bonus=levelingEnabled
    ?Math.max(0,Math.round(baseRespectXP*mult.noSkip*mult.noReroll))
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    // Bonus stays separate from s.xp. That is important: progression repair and
    // repeat-XP reconstruction are allowed to rebuild s.xp at any time without
    // ever deleting or double-awarding System Respect XP.
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=V165_SYSTEM_BASE_XP;
    target.v165RecommendedTitleBaseXP=titleFollowed?V165_RECOMMENDED_TITLE_XP:0;
    target.v165RecommendedTitleFollowed=!!titleFollowed;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;
    target.v165RecommendedLibraryId=exactEnabled?String(task?.libraryId||''):'';
    target.v165RecommendedTitle=exactEnabled?cleanTitle(task?.title||''):'';
    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=titleFollowed?' · recommended title followed':'';
    const message=`System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`;
    // submitLog still has one normal render to perform. Queue the toast until
    // after that render instead of causing another render/history pass.
    setTimeout(()=>showToast(message),0);
  }

  return bonus;
}

function v165RespectBonusForSession(s){
  if(!s||s.status==='skipped')return 0;
  return Math.max(0,Math.round(Number(s.v165RespectBonusXP)||0));
}

// Respect XP remains outside s.xp so repeat/repair logic can rebuild base XP.
// v150's cached single-pass progression engine adds it at read time.
const v165BaseSessionXPBase=v150BaseSessionXP;
v150BaseSessionXP=function(s){
  return Math.max(
    0,
    Number(v165BaseSessionXPBase(s))+
    v165RespectBonusForSession(s)
  );
};

// Extend the existing cache when it is rebuilt. This is one extra lightweight
// pass only when History is already dirty; normal renders stay O(1).
const v165BuildLiveXPCacheBase=v150BuildLiveXPCache;
v150BuildLiveXPCache=function(){
  const c=v165BuildLiveXPCacheBase();

  let respectBonusXP=0;
  let respectXPWithDayStreak=0;
  let rewardedSessions=0;
  let recommendedTitleFollowed=0;

  for(const s of (S.sessions||[])){
    const raw=v165RespectBonusForSession(s);
    if(raw<=0)continue;

    rewardedSessions++;
    respectBonusXP+=raw;
    if(s.v165RecommendedTitleFollowed)recommendedTitleFollowed++;

    const dayMultiplier=Math.max(1,Number(s.streakMultiplier)||1);
    respectXPWithDayStreak+=Math.max(0,Math.round(raw*dayMultiplier));
  }

  c.systemRespectBonusXP=Math.round(respectBonusXP);
  c.systemRespectXPWithDayStreak=Math.round(respectXPWithDayStreak);
  c.systemRespectDayStreakBonusXP=Math.max(
    0,
    Math.round(respectXPWithDayStreak-respectBonusXP)
  );
  c.systemRespectRewardedSessions=rewardedSessions;
  c.recommendedTitleFollowedRewards=recommendedTitleFollowed;

  return c;
};

const v165XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v165XPBreakdownBase();
  const c=v150EnsureLiveXPCache();
  const st=v165EnsureRespectState();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);

  return Object.assign({},b,{
    systemRespectBonusXP:Number(c.systemRespectBonusXP)||0,
    systemRespectXPWithDayStreak:Number(c.systemRespectXPWithDayStreak)||0,
    systemRespectDayStreakBonusXP:Number(c.systemRespectDayStreakBonusXP)||0,
    systemRespectRewardedSessions:Number(c.systemRespectRewardedSessions)||0,
    recommendedTitleFollowedRewards:Number(c.recommendedTitleFollowedRewards)||0,
    noSkipRespectStreak:st.noSkipStreak,
    firstPickRespectStreak:st.noRerollStreak,
    noSkipRespectMultiplier:mult.noSkip,
    firstPickRespectMultiplier:mult.noReroll,
    combinedRespectMultiplier:mult.combined
  });
};

// ---- Settings ---------------------------------------------------------------

function v165RespectSettingsHtml(){
  const st=v165EnsureRespectState();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const b=v120XPBreakdown();

  return `<div class="v165-respect-card">
    <div class="v165-respect-head">
      <div>
        <div class="v165-respect-title">SYSTEM RESPECT XP</div>
        <div class="hint">Earn bonus XP for actually following MediaFlow. Logging other titles at the same time is allowed — the recommended-title bonus still applies as long as the recommended title is included in that log.</div>
      </div>
      <span class="pill">v165</span>
    </div>

    <div class="v165-respect-grid">
      <div class="v165-respect-stat">
        <small>Recommended category</small>
        <b>+${V165_SYSTEM_BASE_XP} base XP</b>
      </div>
      <div class="v165-respect-stat">
        <small>Recommended exact title</small>
        <b>+${V165_RECOMMENDED_TITLE_XP} base XP</b>
      </div>
      <div class="v165-respect-stat">
        <small>No-Skip streak</small>
        <b>${st.noSkipStreak} · ×${mult.noSkip.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>First-pick streak</small>
        <b>${st.noRerollStreak} · ×${mult.noReroll.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Combined respect multiplier</small>
        <b>×${mult.combined.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Respect XP earned</small>
        <b>${Number(b.systemRespectBonusXP||0).toLocaleString()} XP</b>
      </div>
    </div>

    <div class="v165-respect-note">
      Skip resets both streaks. <b>Give me something else</b> resets only the stronger First-pick streak, so avoiding Skip still has value.
      The First-pick multiplier grows faster than the No-Skip multiplier.
      Exact-title bonus is awarded only when <b>Exact title recommendations</b> is enabled and the recommended title is actually present in the log.
      Existing day-streak XP can multiply the resulting session XP afterward.
    </div>
  </div>`;
}

const v165RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v165RenderSettingsBase();

  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  if(h.includes(marker)&&!h.includes('SYSTEM RESPECT XP')){
    h=h.replace(marker,v165RespectSettingsHtml()+marker);
  }

  return h;
};

// ---- Persistence / cloud / import / merge ----------------------------------

const v165SnapshotBase=snapshot;
snapshot=function(){
  const x=v165SnapshotBase();
  x.respectState=v165Clone(v165EnsureRespectState(),V165_RESPECT_DEFAULT);
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,165);
  return x;
};

const v165ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v165ApplyStateBase.apply(this,arguments);
  S.respectState=v165NormalizeRespectState(d?.respectState);
  v149MarkStreakDirty();
  return result;
};

function v165MergeSessionRespectFields(target,...sources){
  const keys=[
    'v165RespectBonusXP',
    'v165RespectBaseXP',
    'v165SystemBaseXP',
    'v165RecommendedTitleBaseXP',
    'v165RecommendedTitleFollowed',
    'v165ExactTitleRecommendationEnabled',
    'v165RecommendedLibraryId',
    'v165RecommendedTitle',
    'v165NoSkipStreak',
    'v165NoRerollStreak',
    'v165NoSkipMultiplier',
    'v165NoRerollMultiplier',
    'v165RespectMultiplier',
    'v165RerollsBeforeLog',
    'v165RespectXPVersion'
  ];

  for(const src of sources){
    if(!src||typeof src!=='object')continue;
    for(const key of keys){
      if(
        Object.prototype.hasOwnProperty.call(src,key) &&
        src[key]!==undefined &&
        src[key]!==null
      ){
        target[key]=src[key];
      }
    }
  }

  return target;
}

const v165MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v165MergeStatesBase(a,b)||{};

  const ar=a?.respectState&&typeof a.respectState==='object'
    ?v165NormalizeRespectState(a.respectState):null;
  const br=b?.respectState&&typeof b.respectState==='object'
    ?v165NormalizeRespectState(b.respectState):null;

  let chosen=null;
  if(ar&&br){
    chosen=(Number(ar.modifiedAt)||0)>=(Number(br.modifiedAt)||0)?ar:br;
  }else{
    chosen=ar||br||V165_RESPECT_DEFAULT;
  }

  out.respectState=v165Clone(
    v165NormalizeRespectState(chosen),
    V165_RESPECT_DEFAULT
  );

  // Session IDs are stable. Preserve v165 metadata even when an older device's
  // copy of an otherwise-identical History row wins the legacy session merge.
  const aById=new Map((a?.sessions||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
  const bById=new Map((b?.sessions||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));

  for(const s of (out.sessions||[])){
    if(!s?.id)continue;
    const id=String(s.id);
    v165MergeSessionRespectFields(
      s,
      bById.get(id),
      aById.get(id)
    );
  }

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    165
  );

  return out;
};

// ---- Sync Now completeness / verification ----------------------------------

const v165StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const result=v165StateCompletenessBase(state);
  const missing=[...(result?.missing||[])];

  if(!state?.respectState||typeof state.respectState!=='object'){
    missing.push('System Respect state');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

function v165RespectSessionAudit(state){
  let count=0,total=0,titleCount=0;
  for(const s of (state?.sessions||[])){
    const xp=Math.max(0,Math.round(Number(s?.v165RespectBonusXP)||0));
    if(xp<=0)continue;
    count++;
    total+=xp;
    if(s?.v165RecommendedTitleFollowed)titleCount++;
  }
  return {count,total,titleCount};
}

const v165VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v165VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const c=v165NormalizeRespectState(cloudState?.respectState);
  const e=v165NormalizeRespectState(expected?.respectState);

  for(const key of [
    'noSkipStreak',
    'noRerollStreak',
    'bestNoSkipStreak',
    'bestNoRerollStreak',
    'currentRerolls',
    'totalSkips',
    'totalRerolls',
    'modifiedAt'
  ]){
    if(Number(c[key])!==Number(e[key])){
      problems.push('System Respect state');
      break;
    }
  }

  const ca=v165RespectSessionAudit(cloudState);
  const ea=v165RespectSessionAudit(expected);

  if(
    ca.count!==ea.count ||
    ca.total!==ea.total ||
    ca.titleCount!==ea.titleCount
  ){
    problems.push('System Respect XP History');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup ----------------------------------------

const v165BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v165BuildFullBackupBase();

  payload.backupSchemaVersion=V165_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.respectState=v165Clone(
    v165EnsureRespectState(),
    V165_RESPECT_DEFAULT
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V165_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v165 backup. Includes System Respect XP state, per-log respect/recommended-title rewards, no-Skip/First-pick streak metadata, all prior adaptive themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v165BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v165BackupManifestBase(state,extras);
  const audit=v165RespectSessionAudit(state);
  const respect=v165NormalizeRespectState(state?.respectState);

  manifest.schemaVersion=V165_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    systemRespectXP:true,
    recommendedTitleRespectRewards:true,
    noSkipRespectStreak:true,
    firstPickRespectStreak:true,
    respectSessionMetadata:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    systemRespectRewardedSessions:audit.count,
    recommendedTitleFollowedRewards:audit.titleCount,
    systemRespectRawXP:audit.total,
    currentNoSkipRespectStreak:respect.noSkipStreak,
    currentFirstPickRespectStreak:respect.noRerollStreak
  });

  return manifest;
};

// Import uses the final v46ApplyState chain above, so respectState is restored.
// Per-session reward fields are normal History fields and are restored unchanged.
// v152 Automatic Backup resolves this final v148BuildFullBackup at runtime.



/* ============================================================
   MediaFlow v166 — Automatic Seasonal Fresh-Episode Detection
   ------------------------------------------------------------
   AniList is not used.

   Provider:
   - Jikan v4, which exposes public MyAnimeList data without OAuth/API keys.
   - Exact MAL IDs are preferred.
   - Titles without MAL IDs use a strict exact-title/year resolver once; a
     resolved MAL ID is then stored on the Library title to avoid repeated
     searches.

   Fresh-title definition:
   - Seasonal Anime Library title;
   - not completed/dropped;
   - Jikan's public MAL episode list contains an aired/released episode number
     greater than MediaFlow Library progress.

   Performance:
   - only Seasonal categories are scanned;
   - sequential throttled requests, no request storm;
   - in-memory TTL cache;
   - MAL IDs are persisted for future fast refreshes;
   - one final save/render at most, never per title;
   - provider failure preserves the last good seasonalFreshCount.
   ============================================================ */

const V166_SEASONAL_PROVIDER='Jikan / MyAnimeList';
const V166_JIKAN_BASE='https://api.jikan.moe/v4';
const V166_DEFAULT_SYNC_MINUTES=60;
const V166_MIN_SYNC_MINUTES=15;
const V166_MAX_SYNC_MINUTES=1440;
const V166_CACHE_TTL=20*60*1000;

let V166_SEASONAL_SYNC_RUNNING=false;
let V166_SEASONAL_TIMER=null;
let V166_LAST_JIKAN_REQUEST_AT=0;
let V166_SEASONAL_RUNTIME={
  status:'idle',
  checked:0,
  total:0,
  matched:0,
  freshTitles:0,
  freshEpisodes:0,
  message:'',
  error:'',
  startedAt:0,
  finishedAt:0
};
const V166_JIKAN_CACHE=new Map();

function v166ClampSyncMinutes(value){
  const n=Math.round(Number(value)||V166_DEFAULT_SYNC_MINUTES);
  return Math.max(V166_MIN_SYNC_MINUTES,Math.min(V166_MAX_SYNC_MINUTES,n));
}

function v166EnsureSeasonalSettings(settings){
  const s=(settings&&typeof settings==='object')?settings:{};
  if(typeof s.seasonalFreshAuto!=='boolean')s.seasonalFreshAuto=true;
  s.seasonalFreshSyncMinutes=v166ClampSyncMinutes(s.seasonalFreshSyncMinutes);
  s.seasonalFreshCount=Math.max(0,Math.round(Number(s.seasonalFreshCount)||0));
  s.seasonalFreshLastSyncAt=Math.max(0,Number(s.seasonalFreshLastSyncAt)||0);
  s.seasonalFreshLastProvider=String(s.seasonalFreshLastProvider||V166_SEASONAL_PROVIDER);
  s.seasonalFreshLastMatched=Math.max(0,Math.round(Number(s.seasonalFreshLastMatched)||0));
  s.seasonalFreshLastEpisodeTotal=Math.max(0,Math.round(Number(s.seasonalFreshLastEpisodeTotal)||0));
  return s;
}

v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

function v166SeasonalCategories(){
  return new Set(
    (S.categories||[])
      .filter(c=>c && (c.seasonal===true || String(c.id)==='seasonal'))
      .map(c=>String(c.id))
  );
}

function v166SeasonalCandidates(){
  const ids=v166SeasonalCategories();
  return (S.library||[]).filter(item=>
    item &&
    ids.has(String(item.categoryId||'')) &&
    item.status!=='completed' &&
    item.status!=='dropped'
  );
}

function v166GetMalId(item){
  const values=[
    item?.externalIds?.mal,
    item?.malId,
    item?.mal_id
  ];
  for(const value of values){
    const s=String(value??'').trim();
    if(/^\d+$/.test(s))return s;
  }
  return '';
}

function v166StoreMalId(item,malId){
  const id=String(malId||'').trim();
  if(!item||!/^\d+$/.test(id))return false;

  item.externalIds=(item.externalIds&&typeof item.externalIds==='object')
    ?item.externalIds:{};

  if(String(item.externalIds.mal||'')===id)return false;

  item.externalIds.mal=id;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,Date.now());
  return true;
}

function v166Sleep(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

async function v166JikanThrottle(){
  const gap=430;
  const wait=Math.max(0,gap-(Date.now()-V166_LAST_JIKAN_REQUEST_AT));
  if(wait>0)await v166Sleep(wait);
  V166_LAST_JIKAN_REQUEST_AT=Date.now();
}

async function v166FetchJikan(path,{force=false,ttl=V166_CACHE_TTL}={}){
  const url=path.startsWith('http')?path:`${V166_JIKAN_BASE}${path}`;
  const cached=V166_JIKAN_CACHE.get(url);

  if(!force && cached && Date.now()-cached.at<ttl){
    return cached.data;
  }

  await v166JikanThrottle();

  let lastError=null;

  for(let attempt=0;attempt<3;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);

    try{
      const res=await fetch(url,{
        signal:controller.signal,
        cache:'no-store',
        headers:{Accept:'application/json'}
      });
      clearTimeout(timer);

      if(res.ok){
        const data=await res.json();
        V166_JIKAN_CACHE.set(url,{at:Date.now(),data});
        return data;
      }

      lastError=new Error(`Jikan HTTP ${res.status}`);

      if(![408,429,500,502,503,504].includes(res.status)){
        break;
      }

      const retryAfter=Math.max(0,Number(res.headers.get('Retry-After'))||0);
      await v166Sleep(retryAfter?retryAfter*1000:700*(attempt+1));
    }catch(e){
      clearTimeout(timer);
      lastError=e;
      if(attempt<2)await v166Sleep(500*(attempt+1));
    }
  }

  throw lastError||new Error('Jikan request failed');
}

function v166CandidateYear(item){
  const y=typeof v158ItemYear==='function'?v158ItemYear(item):Number(item?.year);
  return Number.isFinite(Number(y))&&Number(y)>1900?Number(y):null;
}

async function v166ResolveMalId(item,force=false){
  const existing=v166GetMalId(item);
  if(existing)return {malId:existing,stored:false};

  const title=cleanTitle(item?.title||'');
  if(!title)return {malId:'',stored:false};

  const payload=await v166FetchJikan(
    `/anime?q=${encodeURIComponent(title)}&limit=10`,
    {force,ttl:24*60*60*1000}
  );

  let rows=(payload?.data||[]).filter(x=>{
    if(typeof v158ExactTitleCandidate==='function'&&typeof v158JikanTitles==='function'){
      return v158ExactTitleCandidate(item,v158JikanTitles(x));
    }

    const wanted=cleanTitle(item.title||'').toLocaleLowerCase();
    const titles=[
      x?.title,x?.title_english,x?.title_japanese,
      ...(Array.isArray(x?.title_synonyms)?x.title_synonyms:[])
    ].filter(Boolean).map(v=>cleanTitle(v).toLocaleLowerCase());

    return titles.includes(wanted);
  });

  // Seasonal Anime should not accidentally resolve to a movie with the same name.
  const nonMovie=rows.filter(x=>String(x?.type||'').toLowerCase()!=='movie');
  if(nonMovie.length)rows=nonMovie;

  const year=v166CandidateYear(item);
  if(year){
    const sameYear=rows.filter(x=>{
      const candidate=
        Number(x?.year)||
        (x?.aired?.from?new Date(x.aired.from).getFullYear():0);
      return Number(candidate)===year;
    });
    if(sameYear.length)rows=sameYear;
  }

  const unique=new Map();
  for(const x of rows){
    const id=String(x?.mal_id||'');
    if(/^\d+$/.test(id))unique.set(id,x);
  }

  // Safety first: ambiguous title-only matches are skipped, not guessed.
  if(unique.size!==1)return {malId:'',stored:false};

  const malId=[...unique.keys()][0];
  return {malId,stored:v166StoreMalId(item,malId)};
}

function v166AiredEpisodeNumber(row,now=Date.now()){
  const num=Math.max(0,Math.floor(Number(row?.mal_id)||0));
  if(!num)return 0;

  // Current Jikan episode resources commonly contain aired ISO dates.
  // If the field is absent, its presence in the public episode list itself is
  // treated as the provider's released/available signal.
  const aired=row?.aired?new Date(row.aired).getTime():0;
  if(aired && Number.isFinite(aired) && aired>now+5*60*1000)return 0;

  return num;
}

async function v166AvailableEpisodeCount(malId,force=false){
  const first=await v166FetchJikan(
    `/anime/${encodeURIComponent(malId)}/episodes?page=1`,
    {force,ttl:V166_CACHE_TTL}
  );

  const now=Date.now();
  let available=0;

  for(const row of (first?.data||[])){
    available=Math.max(available,v166AiredEpisodeNumber(row,now));
  }

  const lastPage=Math.max(
    1,
    Math.floor(Number(first?.pagination?.last_visible_page)||1)
  );

  // Seasonal titles are normally one page. For long-running titles fetch only
  // the last page instead of walking every historical page.
  if(lastPage>1){
    const last=await v166FetchJikan(
      `/anime/${encodeURIComponent(malId)}/episodes?page=${lastPage}`,
      {force,ttl:V166_CACHE_TTL}
    );

    for(const row of (last?.data||[])){
      available=Math.max(available,v166AiredEpisodeNumber(row,now));
    }
  }

  return available;
}

function v166SeasonalStatusText(){
  const r=V166_SEASONAL_RUNTIME;
  const s=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

  if(!s.seasonalFreshAuto){
    return `Manual mode · current scheduler value: ${s.seasonalFreshCount} title${s.seasonalFreshCount===1?'':'s'}.`;
  }

  if(r.status==='running'){
    return `Checking ${r.checked.toLocaleString()} / ${r.total.toLocaleString()} Seasonal Anime title${r.total===1?'':'s'}… ${r.matched.toLocaleString()} matched to MyAnimeList.`;
  }

  if(r.status==='error'){
    return `Automatic refresh failed; MediaFlow kept the last good value (${s.seasonalFreshCount}). ${r.error||'Jikan is temporarily unavailable.'}`;
  }

  const when=s.seasonalFreshLastSyncAt
    ?new Date(s.seasonalFreshLastSyncAt).toLocaleString()
    :'not checked yet';

  return `${s.seasonalFreshCount.toLocaleString()} title${s.seasonalFreshCount===1?'':'s'} with fresh episodes · ${s.seasonalFreshLastEpisodeTotal.toLocaleString()} episode${s.seasonalFreshLastEpisodeTotal===1?'':'s'} waiting · ${s.seasonalFreshLastMatched.toLocaleString()} title${s.seasonalFreshLastMatched===1?'':'s'} matched · last checked ${when}.`;
}

function v166UpdateSeasonalStatusDOM(){
  const el=document.getElementById('v166-seasonal-status');
  if(el)el.innerHTML=escapeHtml(v166SeasonalStatusText());

  const bar=document.getElementById('v166-seasonal-progress-fill');
  if(bar){
    const r=V166_SEASONAL_RUNTIME;
    const pct=r.total?Math.round(r.checked/r.total*100):0;
    bar.style.width=`${Math.max(0,Math.min(100,pct))}%`;
  }

  const value=document.getElementById('v166-seasonal-fresh-count');
  if(value)value.value=String(Math.max(0,Number(S.settings?.seasonalFreshCount)||0));

  const button=document.getElementById('v166-seasonal-refresh-btn');
  if(button)button.disabled=V166_SEASONAL_SYNC_RUNNING;
}

async function v166RefreshSeasonalFresh({force=false,notify=false}={}){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

  if(!settings.seasonalFreshAuto && !force)return null;
  if(V166_SEASONAL_SYNC_RUNNING){
    if(notify)showToast('Seasonal episode refresh is already running.');
    return null;
  }

  V166_SEASONAL_SYNC_RUNNING=true;
  const rows=v166SeasonalCandidates();
  const previousCount=settings.seasonalFreshCount;

  V166_SEASONAL_RUNTIME={
    status:'running',
    checked:0,
    total:rows.length,
    matched:0,
    freshTitles:0,
    freshEpisodes:0,
    message:'',
    error:'',
    startedAt:Date.now(),
    finishedAt:0
  };
  v166UpdateSeasonalStatusDOM();

  let libraryChanged=false;
  let successfulChecks=0;
  let failures=0;

  try{
    for(let i=0;i<rows.length;i++){
      const item=rows[i];

      try{
        const resolved=await v166ResolveMalId(item,force);
        if(resolved.stored)libraryChanged=true;

        if(resolved.malId){
          V166_SEASONAL_RUNTIME.matched++;
          const available=await v166AvailableEpisodeCount(resolved.malId,force);
          successfulChecks++;

          const progress=Math.max(0,Number(item.progress)||0);
          const waiting=Math.max(0,available-progress);

          if(waiting>0){
            V166_SEASONAL_RUNTIME.freshTitles++;
            V166_SEASONAL_RUNTIME.freshEpisodes+=waiting;
          }
        }
      }catch(e){
        failures++;
        console.warn('MediaFlow v166 Seasonal check skipped',item?.title,e);
      }

      V166_SEASONAL_RUNTIME.checked=i+1;
      v166UpdateSeasonalStatusDOM();

      // Yield periodically so a large Seasonal list never locks the UI.
      if(i && i%5===0){
        await new Promise(resolve=>{
          if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>resolve());
          else setTimeout(resolve,0);
        });}
    }

    // If every provider lookup failed, do NOT turn a good old value into zero.
    if(rows.length>0 && successfulChecks===0 && failures>0){
      throw new Error('Jikan did not return any usable episode data this time.');
    }

    settings.seasonalFreshCount=V166_SEASONAL_RUNTIME.freshTitles;
    settings.seasonalFreshLastSyncAt=Date.now();
    settings.seasonalFreshLastProvider=V166_SEASONAL_PROVIDER;
    settings.seasonalFreshLastMatched=V166_SEASONAL_RUNTIME.matched;
    settings.seasonalFreshLastEpisodeTotal=V166_SEASONAL_RUNTIME.freshEpisodes;

    V166_SEASONAL_RUNTIME.status='success';
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();

    // One atomic save only after the whole scan. This carries any newly-resolved
    // MAL IDs plus the scheduler count/settings at once.
    if(libraryChanged){
      try{v53InvalidateLibraryCache();}catch(_){}
    }
    await saveState();

    if(S.view==='settings')render();
    else v166UpdateSeasonalStatusDOM();

    if(notify){
      showToast(
        `${settings.seasonalFreshCount} Seasonal title${settings.seasonalFreshCount===1?'':'s'} with fresh episodes`
      );
    }

    return {
      freshTitles:settings.seasonalFreshCount,
      freshEpisodes:settings.seasonalFreshLastEpisodeTotal,
      matched:settings.seasonalFreshLastMatched,
      previousCount
    };
  }catch(e){
    console.warn('MediaFlow v166 automatic Seasonal refresh failed',e);
    V166_SEASONAL_RUNTIME.status='error';
    V166_SEASONAL_RUNTIME.error=String(e?.message||e);
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();

    // Preserve previous count on failure.
    settings.seasonalFreshCount=previousCount;
    v166UpdateSeasonalStatusDOM();

    if(notify)showToast('Could not refresh Seasonal episodes; last good value was kept.');
    return null;
  }finally{
    V166_SEASONAL_SYNC_RUNNING=false;
    v166UpdateSeasonalStatusDOM();
    v166ScheduleSeasonalRefresh(false);
  }
}

function v166StopSeasonalTimer(){
  clearTimeout(V166_SEASONAL_TIMER);
  V166_SEASONAL_TIMER=null;
}

function v166ScheduleSeasonalRefresh(runSoon=false){
  v166StopSeasonalTimer();

  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  if(!settings.seasonalFreshAuto)return;

  let delay;
  if(runSoon){
    const age=Date.now()-Number(settings.seasonalFreshLastSyncAt||0);
    delay=age>=10*60*1000?4500:Math.max(15000,10*60*1000-age);
  }else{
    delay=v166ClampSyncMinutes(settings.seasonalFreshSyncMinutes)*60*1000;
  }

  V166_SEASONAL_TIMER=setTimeout(()=>{
    V166_SEASONAL_TIMER=null;
    v166RefreshSeasonalFresh({force:false,notify:false});
  },delay);
}

function v166ToggleSeasonalAuto(){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  settings.seasonalFreshAuto=!settings.seasonalFreshAuto;

  if(settings.seasonalFreshAuto){
    persistSettings();
    render();
    v166ScheduleSeasonalRefresh(true);
  }else{
    v166StopSeasonalTimer();
    persistSettings();
    render();
  }
}

function v166SetSeasonalSyncMinutes(value){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  settings.seasonalFreshSyncMinutes=v166ClampSyncMinutes(value);
  persistSettings();
  v166ScheduleSeasonalRefresh(false);
  render();
}

function v166SetManualSeasonalFreshCount(value){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  if(settings.seasonalFreshAuto)return;
  settings.seasonalFreshCount=Math.max(0,Math.round(Number(value)||0));
  persistSettings();
  render();
}

function v166SeasonalSettingsHtml(){
  const s=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  const auto=s.seasonalFreshAuto!==false;

  return `<div class="field v166-seasonal-auto">
    <div class="v166-seasonal-auto-head">
      <div>
        <label class="field-label">Seasonal — titles with fresh episodes waiting</label>
        <div class="hint">Automatic mode uses Jikan's public MyAnimeList episode data — no AniList API, OAuth token or API key. MediaFlow compares released episode numbers with each Seasonal Anime title's Library progress.</div>
      </div>
      <div class="v166-seasonal-auto-actions">
        <span class="pill">${auto?'Automatic · Jikan':'Manual'}</span>
        <button type="button" class="toggle ${auto?'on':''}" onclick="App.v166ToggleSeasonalAuto()" aria-label="Toggle automatic Seasonal episode detection"></button>
      </div>
    </div>

    <div class="v166-seasonal-grid">
      <div class="field" style="margin:0">
        <label class="field-label">${auto?'Detected fresh titles':'Manual fresh-title count'}</label>
        <input id="v166-seasonal-fresh-count" type="number" min="0"
          value="${Math.max(0,Number(s.seasonalFreshCount)||0)}"
          ${auto?'readonly':''}
          onchange="App.v166SetManualSeasonalFreshCount(this.value)">
      </div>
      <div class="field" style="margin:0">
        <label class="field-label">Check every (minutes)</label>
        <input type="number" min="${V166_MIN_SYNC_MINUTES}" max="${V166_MAX_SYNC_MINUTES}" step="1"
          value="${v166ClampSyncMinutes(s.seasonalFreshSyncMinutes)}"
          ${auto?'':'disabled'}
          onchange="App.v166SetSeasonalSyncMinutes(this.value)">
      </div>
    </div>

    <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px">
      <button id="v166-seasonal-refresh-btn" type="button" class="btn btn-sm"
        ${auto?'':'disabled'}
        onclick="App.v166RefreshSeasonalFresh(true)">
        Refresh now
      </button>
      <span class="hint">Unmatched/ambiguous titles are skipped instead of guessed. MAL IDs imported from MAL are used directly and are fastest.</span>
    </div>

    <div id="v166-seasonal-status" class="v166-seasonal-status">${escapeHtml(v166SeasonalStatusText())}</div>
    <div class="v166-seasonal-progress"><span id="v166-seasonal-progress-fill"></span></div>
  </div>`;
}

// Replace the old manual v165 field instead of adding a second setting.
const v166RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v166RenderSettingsBase();

  h=h.replace(
    /<div class="field" style="margin-top:4px;">\s*<label class="field-label">Seasonal — titles with fresh episodes waiting<\/label>[\s\S]*?<\/div>\s*(?=<\/div>\s*<div class="section-label settings-section-head"><span>LEVELING)/,
    v166SeasonalSettingsHtml()
  );

  return h;
};

// ---- State normalization / persistence -------------------------------------

const v166PersistSettingsBase=persistSettings;
persistSettings=function(){
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  return v166PersistSettingsBase.apply(this,arguments);
};

const v166LoadAllBase=loadAll;
loadAll=async function(){
  await v166LoadAllBase.apply(this,arguments);
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  v166ScheduleSeasonalRefresh(true);
};

const v166SnapshotBase=snapshot;
snapshot=function(){
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  const x=v166SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,166);
  return x;
};

const v166ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v166ApplyStateBase.apply(this,arguments);
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  v166ScheduleSeasonalRefresh(true);
  return result;
};

const v166MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v166MergeStatesBase(a,b)||{};
  out.settings=v166EnsureSeasonalSettings(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    166
  );
  return out;
};

// Verify the automatic scheduler state during protected Sync Now.
const v166VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v166VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  for(const key of [
    'seasonalFreshAuto',
    'seasonalFreshSyncMinutes',
    'seasonalFreshCount',
    'seasonalFreshLastSyncAt',
    'seasonalFreshLastMatched',
    'seasonalFreshLastEpisodeTotal'
  ]){
    if(String(cloud[key])!==String(wanted[key])){
      problems.push('Automatic Seasonal episode state');
      break;
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// Full Backup/Automatic Backup need no new top-level object because all v166
// durable data lives in the canonical Settings object. Explicitly document it.
const v166BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v166BuildFullBackupBase();

  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(
    v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS)
  ));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v166 backup. Includes automatic Seasonal fresh-episode detection settings/last good scheduler value through canonical Settings, plus System Respect XP, adaptive themes, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences.';
  }

  return payload;
};

const v166BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v166BackupManifestBase(state,extras);
  const settings=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );

  manifest.includes=Object.assign({},manifest.includes||{},{
    automaticSeasonalFreshEpisodes:true,
    seasonalFreshSchedulerValue:true,
    seasonalJikanProvider:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    seasonalFreshTitles:settings.seasonalFreshCount,
    seasonalFreshEpisodesWaiting:settings.seasonalFreshLastEpisodeTotal,
    seasonalTitlesMatched:settings.seasonalFreshLastMatched
  });

  return manifest;
};

// Public actions.
App.v166ToggleSeasonalAuto=v166ToggleSeasonalAuto;
App.v166SetSeasonalSyncMinutes=v166SetSeasonalSyncMinutes;
App.v166SetManualSeasonalFreshCount=v166SetManualSeasonalFreshCount;
App.v166RefreshSeasonalFresh=function(force){
  return v166RefreshSeasonalFresh({force:!!force,notify:true});
};

// If the main startup path already ran before this patch's load wrapper became
// relevant, arm a safe delayed refresh anyway.
setTimeout(()=>v166ScheduleSeasonalRefresh(true),5000);



/* ============================================================
   MediaFlow v167 — Editable System Respect XP
   ------------------------------------------------------------
   User-editable future reward tuning:
   - recommended category base XP;
   - recommended exact-title base XP;
   - No-Skip growth rate + cap;
   - First-pick growth rate + cap.

   Existing History rewards remain frozen exactly as earned. Editing these
   values changes future rewards/current projected multipliers only; it never
   retroactively rewrites old session XP.
   ============================================================ */

const V167_BACKUP_SCHEMA_VERSION=8;
const V167_RESPECT_CONFIG_DEFAULT={
  categoryBaseXP:10,
  exactTitleBaseXP:25,
  noSkipGrowthPercent:8,
  noSkipCapPercent:50,
  firstPickGrowthPercent:14,
  firstPickCapPercent:75,
  modifiedAt:0
};

function v167ClampRespectNumber(value,min,max,fallback){
  const n=Number(value);
  return Number.isFinite(n)
    ?Math.max(min,Math.min(max,n))
    :fallback;
}

function v167NormalizeRespectConfig(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    categoryBaseXP:Math.round(v167ClampRespectNumber(
      src.categoryBaseXP,0,10000,V167_RESPECT_CONFIG_DEFAULT.categoryBaseXP
    )),
    exactTitleBaseXP:Math.round(v167ClampRespectNumber(
      src.exactTitleBaseXP,0,10000,V167_RESPECT_CONFIG_DEFAULT.exactTitleBaseXP
    )),
    noSkipGrowthPercent:v167ClampRespectNumber(
      src.noSkipGrowthPercent,0,100,V167_RESPECT_CONFIG_DEFAULT.noSkipGrowthPercent
    ),
    noSkipCapPercent:v167ClampRespectNumber(
      src.noSkipCapPercent,0,1000,V167_RESPECT_CONFIG_DEFAULT.noSkipCapPercent
    ),
    firstPickGrowthPercent:v167ClampRespectNumber(
      src.firstPickGrowthPercent,0,100,V167_RESPECT_CONFIG_DEFAULT.firstPickGrowthPercent
    ),
    firstPickCapPercent:v167ClampRespectNumber(
      src.firstPickCapPercent,0,1000,V167_RESPECT_CONFIG_DEFAULT.firstPickCapPercent
    ),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v167EnsureRespectConfig(settings=S.settings){
  const target=(settings&&typeof settings==='object')?settings:{};
  target.systemRespectXP=v167NormalizeRespectConfig(target.systemRespectXP);
  return target.systemRespectXP;
}

v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);

function v167RespectConfig(){
  return v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
}

// FINAL multiplier logic now reads the user's saved configuration.
v165RespectMultipliers=function(noSkipStreak,noRerollStreak){
  const cfg=v167RespectConfig();
  const skip=Math.max(0,Number(noSkipStreak)||0);
  const reroll=Math.max(0,Number(noRerollStreak)||0);

  const noSkipGrowth=cfg.noSkipGrowthPercent/100;
  const noSkipCap=cfg.noSkipCapPercent/100;
  const firstPickGrowth=cfg.firstPickGrowthPercent/100;
  const firstPickCap=cfg.firstPickCapPercent/100;

  const noSkip=v165RoundMultiplier(
    1+Math.min(
      noSkipCap,
      noSkipGrowth*Math.log2(Math.max(1,skip))
    )
  );

  const noReroll=v165RoundMultiplier(
    1+Math.min(
      firstPickCap,
      firstPickGrowth*Math.log2(Math.max(1,reroll))
    )
  );

  return {
    noSkip,
    noReroll,
    combined:v165RoundMultiplier(noSkip*noReroll)
  };
};

// FINAL reward function: same v165 behavior, but future rewards use the
// editable v167 configuration instead of fixed constants.
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const groupRows=v165GroupSessions(sessionGroupId);

  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  const hadReroll=st.currentRerolls>0;

  st.noSkipStreak++;

  if(hadReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(st.bestNoSkipStreak,st.noSkipStreak);
  st.bestNoRerollStreak=Math.max(st.bestNoRerollStreak,st.noRerollStreak);

  const titleFollowed=v165RecommendedTitleLogged(task,entries,groupRows);
  const exactEnabled=!!S.settings?.exactTitleRecommendations;

  const categoryXP=Math.max(0,Math.round(Number(cfg.categoryBaseXP)||0));
  const exactTitleXP=titleFollowed
    ?Math.max(0,Math.round(Number(cfg.exactTitleBaseXP)||0))
    :0;

  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const levelingEnabled=levelingSettings().enabled!==false;

  const bonus=levelingEnabled
    ?Math.max(0,Math.round(
      baseRespectXP*mult.noSkip*mult.noReroll
    ))
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=categoryXP;
    target.v165RecommendedTitleBaseXP=exactTitleXP;
    target.v165RecommendedTitleFollowed=!!titleFollowed;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;
    target.v165RecommendedLibraryId=exactEnabled?String(task?.libraryId||''):'';
    target.v165RecommendedTitle=exactEnabled?cleanTitle(task?.title||''):'';
    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;

    // Audit exactly which configuration produced this historical reward.
    target.v167RespectConfigAtLog={
      categoryBaseXP:categoryXP,
      exactTitleBaseXP:Math.max(0,Math.round(Number(cfg.exactTitleBaseXP)||0)),
      noSkipGrowthPercent:cfg.noSkipGrowthPercent,
      noSkipCapPercent:cfg.noSkipCapPercent,
      firstPickGrowthPercent:cfg.firstPickGrowthPercent,
      firstPickCapPercent:cfg.firstPickCapPercent
    };
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=titleFollowed?' · recommended title followed':'';
    setTimeout(()=>showToast(
      `System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`
    ),0);
  }

  return bonus;
};

function v167RespectEditorHtml(){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const b=v120XPBreakdown();

  return `<div class="v165-respect-card">
    <div class="v165-respect-head">
      <div>
        <div class="v165-respect-title">SYSTEM RESPECT XP</div>
        <div class="hint">Customize how strongly MediaFlow rewards following its recommendations. Changes affect future recommendation rewards only; already-earned History XP stays exactly as it was earned.</div>
      </div>
    </div>

    <div class="v167-respect-edit-grid">
      <div class="v167-respect-edit">
        <label>Recommended category — base XP</label>
        <input type="number" min="0" max="10000" step="1"
          value="${cfg.categoryBaseXP}"
          onchange="App.v167UpdateRespectSetting('categoryBaseXP',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>Recommended exact title — base XP</label>
        <input type="number" min="0" max="10000" step="1"
          value="${cfg.exactTitleBaseXP}"
          onchange="App.v167UpdateRespectSetting('exactTitleBaseXP',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>No-Skip growth per log2 step (%)</label>
        <input type="number" min="0" max="100" step="0.5"
          value="${cfg.noSkipGrowthPercent}"
          onchange="App.v167UpdateRespectSetting('noSkipGrowthPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>No-Skip maximum bonus (%)</label>
        <input type="number" min="0" max="1000" step="1"
          value="${cfg.noSkipCapPercent}"
          onchange="App.v167UpdateRespectSetting('noSkipCapPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>First-pick growth per log2 step (%)</label>
        <input type="number" min="0" max="100" step="0.5"
          value="${cfg.firstPickGrowthPercent}"
          onchange="App.v167UpdateRespectSetting('firstPickGrowthPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>First-pick maximum bonus (%)</label>
        <input type="number" min="0" max="1000" step="1"
          value="${cfg.firstPickCapPercent}"
          onchange="App.v167UpdateRespectSetting('firstPickCapPercent',this.value)">
      </div>
    </div>

    <div class="v167-respect-readonly">
      <div class="v165-respect-stat">
        <small>No-Skip streak</small>
        <b>${st.noSkipStreak} · ×${mult.noSkip.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>First-pick streak</small>
        <b>${st.noRerollStreak} · ×${mult.noReroll.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Combined respect multiplier</small>
        <b>×${mult.combined.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Respect XP earned</small>
        <b>${Number(b.systemRespectBonusXP||0).toLocaleString()} XP</b>
      </div>
    </div>

    <div class="v167-respect-actions">
      <button type="button" class="btn btn-sm btn-ghost"
        onclick="App.v167ResetRespectSettings()">Reset reward settings</button>
    </div>

    <div class="v165-respect-note">
      Skip resets both streaks. <b>Give me something else</b> resets only the stronger First-pick streak, so avoiding Skip still has value.
      Exact-title XP is awarded only when <b>Exact title recommendations</b> is enabled and the recommended title is actually present in the log.
      Existing day-streak XP can multiply the resulting session XP afterward.
    </div>
  </div>`;
}

// Remove the old read-only v165 panel entirely and insert the editable one.
const v167RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v167RenderSettingsBase();

  h=h.replace(
    /<div class="v165-respect-card">[\s\S]*?<div class="v165-respect-note">[\s\S]*?<\/div>\s*<\/div>/,
    v167RespectEditorHtml()
  );

  return h;
};

function v167UpdateRespectSetting(key,value){
  const allowed=new Set([
    'categoryBaseXP',
    'exactTitleBaseXP',
    'noSkipGrowthPercent',
    'noSkipCapPercent',
    'firstPickGrowthPercent',
    'firstPickCapPercent'
  ]);
  if(!allowed.has(String(key)))return;

  const cfg=v167RespectConfig();

  const bounds={
    categoryBaseXP:[0,10000,V167_RESPECT_CONFIG_DEFAULT.categoryBaseXP,true],
    exactTitleBaseXP:[0,10000,V167_RESPECT_CONFIG_DEFAULT.exactTitleBaseXP,true],
    noSkipGrowthPercent:[0,100,V167_RESPECT_CONFIG_DEFAULT.noSkipGrowthPercent,false],
    noSkipCapPercent:[0,1000,V167_RESPECT_CONFIG_DEFAULT.noSkipCapPercent,false],
    firstPickGrowthPercent:[0,100,V167_RESPECT_CONFIG_DEFAULT.firstPickGrowthPercent,false],
    firstPickCapPercent:[0,1000,V167_RESPECT_CONFIG_DEFAULT.firstPickCapPercent,false]
  };

  const [min,max,fallback,whole]=bounds[key];
  let next=v167ClampRespectNumber(value,min,max,fallback);
  if(whole)next=Math.round(next);

  cfg[key]=next;
  cfg.modifiedAt=Date.now();
  S.settings.systemRespectXP=cfg;

  persistSettings();
  render();
}

function v167ResetRespectSettings(){
  S.settings.systemRespectXP=Object.assign(
    {},
    V167_RESPECT_CONFIG_DEFAULT,
    {modifiedAt:Date.now()}
  );
  persistSettings();
  render();
  showToast('System Respect XP reward settings reset.');
}

Object.assign(App,{
  v167UpdateRespectSetting,
  v167ResetRespectSettings
});

// ---- Persistence / merge / import ------------------------------------------

const v167PersistSettingsBase=persistSettings;
persistSettings=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  return v167PersistSettingsBase.apply(this,arguments);
};

const v167LoadAllBase=loadAll;
loadAll=async function(){
  await v167LoadAllBase.apply(this,arguments);
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
};

const v167SnapshotBase=snapshot;
snapshot=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  const x=v167SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,167);
  return x;
};

const v167ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v167ApplyStateBase.apply(this,arguments);
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v167MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v167MergeStatesBase(a,b)||{};

  const ac=v167NormalizeRespectConfig(a?.settings?.systemRespectXP);
  const bc=v167NormalizeRespectConfig(b?.settings?.systemRespectXP);

  const chosen=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.settings=out.settings||{};
  out.settings.systemRespectXP=chosen;
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    167
  );

  return out;
};

// Preserve the historical config audit object when cloud/local versions of the
// same v165+ History session are merged.
const v167MergeSessionRespectFieldsBase=v165MergeSessionRespectFields;
v165MergeSessionRespectFields=function(target,...sources){
  const result=v167MergeSessionRespectFieldsBase(target,...sources);

  for(const src of sources){
    if(
      src &&
      src.v167RespectConfigAtLog &&
      typeof src.v167RespectConfigAtLog==='object'
    ){
      result.v167RespectConfigAtLog=JSON.parse(
        JSON.stringify(src.v167RespectConfigAtLog)
      );
    }
  }

  return result;
};

// ---- Protected Sync verification -------------------------------------------

const v167VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v167VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v167NormalizeRespectConfig(
    cloudState?.settings?.systemRespectXP
  );
  const wanted=v167NormalizeRespectConfig(
    expected?.settings?.systemRespectXP
  );

  for(const key of [
    'categoryBaseXP',
    'exactTitleBaseXP',
    'noSkipGrowthPercent',
    'noSkipCapPercent',
    'firstPickGrowthPercent',
    'firstPickCapPercent',
    'modifiedAt'
  ]){
    if(Number(cloud[key])!==Number(wanted[key])){
      problems.push('System Respect XP configuration');
      break;
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup ----------------------------------------

const v167BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  const payload=v167BuildFullBackupBase();

  payload.backupSchemaVersion=V167_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V167_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v167 backup. Includes editable System Respect XP reward configuration and historical per-log respect reward metadata, plus automatic Seasonal episode state, adaptive themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v167BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v167BackupManifestBase(state,extras);
  const cfg=v167NormalizeRespectConfig(
    state?.settings?.systemRespectXP
  );

  manifest.schemaVersion=V167_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    editableSystemRespectXP:true,
    systemRespectRewardConfiguration:true,
    historicalRespectConfigurationAudit:true
  });

  manifest.systemRespectXPConfig=Object.assign({},cfg);

  return manifest;
};

// v152 Automatic Backup already resolves the final v148BuildFullBackup() at
// call time, so it automatically receives the v167 schema/configuration.
// JSON export/import use the same final full-backup/apply-state chains.



/* ============================================================
   MediaFlow v168 — Settings cleanup
   ------------------------------------------------------------
   Removed the visible MyAnimeList username/list-sync card from Settings.
   MAL XML import, imported MAL metadata, Jikan seasonal detection and legacy
   internal helpers remain intact for compatibility.
   ============================================================ */

const v168BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v168BuildFullBackupBase();

  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v168 backup. The old MyAnimeList username/list-sync Settings card is no longer shown; persistent account data, MAL-imported metadata, automatic Seasonal/Jikan state, System Respect XP, themes, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences remain preserved.';
  }

  return payload;
};



