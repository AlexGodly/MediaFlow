/* MediaFlow v201 source fragment
 * Application shell, navigation and shared UI rendering
 * Original HTML lines 7974-8242.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   RENDER: SHELL

   ============================================================ */

const ICONS = {

  dashboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>`,

  library:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,

  history:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,

  libraryhistory:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l4 2"/></svg>`,

  batch:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/><path d="M18 16v6M15 19h6"/></svg>`,

  stats:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>`,

  profile:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,

  more:`<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,

  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,

};

const NAV_ITEMS = [

  {id:'dashboard', label:'Dashboard'},

  {id:'library', label:'Library'},

  {id:'libraryhistory', label:'Library History'},

  {id:'history', label:'History'},

  {id:'batch', label:'Batch Log'},

  {id:'stats', label:'Statistics'},

  {id:'profile', label:'Profile settings'},

  {id:'settings', label:'Settings'},

];

function xpUnitBonus(unit){ return ({episodes:10,movies:30,chapters:3,issues:6}[unit]||5); }
function levelingSettings(){
  const d=DEFAULT_SETTINGS.leveling;
  const l=Object.assign({},d,S.settings?.leveling||{});
  l.unitXP=Object.assign({},d.unitXP,S.settings?.leveling?.unitXP||{});
  l.rotationMultiplier=Object.assign({},d.rotationMultiplier,S.settings?.leveling?.rotationMultiplier||{});
  return l;
}
function xpRotationMultiplier(status){ return Number(levelingSettings().rotationMultiplier?.[status])||1; }
function xpRotationLabel(status){ return ({neglected:'Neglected bonus',due:'Due bonus',healthy:'Normal rotation',overused:'Overuse reduction'}[status]||'Normal rotation'); }
function xpUnitBonus(unit){ return Number(levelingSettings().unitXP?.[unit])||0; }
function libraryAdditionXP(){ return Math.max(0,Math.round(Number(levelingSettings().libraryAdditionXP)||0)); }
function titleCompletionXP(item, qty){
  if(!item || item.total==null) return 0;
  const before=Number(item.progress)||0, after=Math.min(Number(item.total)||0,before+Math.max(0,Number(qty)||0));
  return before < Number(item.total) && after >= Number(item.total) ? Math.max(0,Math.round(Number(levelingSettings().completionXP)||0)) : 0;
}
function calculateConsumptionXP(cat, amount, minutes, status){
  if(!levelingSettings().enabled || !cat || status==='skipped' || amount<=0 || minutes<=0) return {base:0,multiplier:xpRotationMultiplier(status),xp:0,label:xpRotationLabel(status),unitBonus:0};
  const minuteBase=Math.max(0,Math.round(minutes))*Math.max(0,Number(levelingSettings().minuteXP)||0);
  const base=minuteBase + Math.max(0,Math.round(amount))*xpUnitBonus(cat.unit);
  const multiplier=xpRotationMultiplier(status);
  return {base,multiplier,xp:Math.max(0,Math.round(base*multiplier)),label:xpRotationLabel(status),unitBonus:xpUnitBonus(cat.unit)};
}
function estimateCurrentLogXP(){
  const cat=getCategory(S.currentTask?.categoryId||S.logDraft?.categoryId||'');
  const amount=Math.max(0,Number(S.logDraft?.amount)||0), minutes=Math.max(0,Number(S.logDraft?.minutes)||0);
  const status=cat?.id ? categoryStatus(cat).status : 'healthy';
  return calculateConsumptionXP(cat,amount,minutes,status);
}
function awardLibraryAdditionXP(id){
  if(!id) return 0;
  S.xpLedger=S.xpLedger||{libraryAdditions:{}};
  S.xpLedger.libraryAdditions=S.xpLedger.libraryAdditions||{};
  if(S.xpLedger.libraryAdditions[id]) return 0;
  const xp=libraryAdditionXP(); S.xpLedger.libraryAdditions[id]=xp; return xp;
}
function libraryXPTotal(){ return Object.values(S.xpLedger?.libraryAdditions||{}).reduce((a,v)=>a+(Number(v)||0),0); }
function sessionStoredXP(s){
  if(!s || s.status==='skipped') return 0;
  if(Number.isFinite(Number(s.xp))) return Math.max(0,Number(s.xp));
  // Legacy history from before the leveling system still contributes XP,
  // but is not retroactively given a rotation bonus because its original
  // category health at the time of logging was not recorded.
  const cat=getCategory(s.categoryId);
  return calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,'healthy').xp;
}
function mediaFlowXP(){
  return S.sessions.reduce((total,s)=>total+sessionStoredXP(s),0) + libraryXPTotal();
}
function mediaFlowLevelInfo(){
  const xp=mediaFlowXP();
  let level=1, spent=0, need=100;
  while(xp>=spent+need){ spent+=need; level++; need=Math.round(100*Math.pow(level,1.35)); }
  const into=xp-spent;
  const pct=need?Math.min(100,Math.round(into/need*100)):100;
  return {xp,level,current:into,needed:need,pct,totalToNext:spent+need};
}
function refreshXPPreview(){
  const el=document.getElementById('xp-preview'); if(!el) return;
  const x=estimateCurrentLogXP();
  el.innerHTML=`<div><b>+${x.xp.toLocaleString()} XP</b> for this log</div><small>${escapeHtml(x.label)} · ${x.base.toLocaleString()} base × ${x.multiplier} rotation × ${Number(x.streakMultiplier||1).toFixed(2)} streak (${Number(x.streak||0)}d)</small>`;
}
function renderLevelBlock(){
  const l=mediaFlowLevelInfo();
  return `<div class="level-block" title="XP comes from logged consumption and Library additions. Rotation-aware bonuses reward giving neglected or due categories attention.">
    <div class="level-head"><span class="level-title">Leveling</span><span class="level-num">Lv. ${l.level}</span></div>
    <div class="xp-line"><span>${l.xp.toLocaleString()} XP total</span><span>${l.current.toLocaleString()} / ${l.needed.toLocaleString()}</span></div>
    <div class="xp-track"><div class="xp-fill" style="width:${l.pct}%"></div></div>
    <div class="level-next">${l.needed-l.current > 0 ? `${(l.needed-l.current).toLocaleString()} XP to Level ${l.level+1}` : `Ready for Level ${l.level+1}`}</div>
  </div>`;
}

const MOBILE_PRIMARY_NAV=['dashboard','library','history','batch','stats'];
const MOBILE_MORE_NAV=['libraryhistory','profile','settings'];
function renderMobileTabs(){
  const primary=MOBILE_PRIMARY_NAV.map(id=>NAV_ITEMS.find(n=>n.id===id)).filter(Boolean);
  const extra=MOBILE_MORE_NAV.map(id=>NAV_ITEMS.find(n=>n.id===id)).filter(Boolean);
  const moreActive=extra.some(n=>n.id===S.view);
  return `${primary.map(n=>`<button type="button" class="mtab ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')" aria-label="${escapeHtml(n.label)}">${ICONS[n.id]}<span>${escapeHtml(n.label)}</span></button>`).join('')}
    <div class="mobile-more-wrap">
      <button type="button" class="mtab ${moreActive?'active':''}" onclick="App.toggleMobileMore(event)" aria-label="More pages" aria-expanded="false">${ICONS.more}<span>More</span></button>
      <div id="mobile-more-menu" class="mobile-more-menu hide">
        ${extra.map(n=>`<button type="button" class="mobile-more-item ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')">${ICONS[n.id]}<span>${escapeHtml(n.label)}</span></button>`).join('')}
      </div>
    </div>`;
}
function toggleMobileMore(ev){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  const menu=document.getElementById('mobile-more-menu');
  if(!menu)return;
  const willOpen=menu.classList.contains('hide');
  menu.classList.toggle('hide',!willOpen);
  const btn=menu.parentElement?.querySelector('.mtab');
  if(btn)btn.setAttribute('aria-expanded',willOpen?'true':'false');
}
function mobileNav(view){
  const menu=document.getElementById('mobile-more-menu');
  if(menu)menu.classList.add('hide');
  S.view=view; render();
  try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}
}

function renderShell(){

  const app = document.getElementById('app');

   app.innerHTML = `

    <div class="sidebar">
      <div class="sidebar-resizer" title="Drag to resize sidebar" aria-label="Resize sidebar" role="separator" aria-orientation="vertical" tabindex="0"></div>

      <div class="brand">

        <div class="brand-mark"></div>

        <div>

          <div class="brand-name">MediaFlow</div>

          <div class="brand-sub">consumption rotation</div>

        </div>

      </div>

      <div class="nav">

         ${v161VisibleNavItems().map(n=>`

          <div class="nav-item ${S.view===n.id?'active':''}" onclick="App.setView('${n.id}')">

            ${ICONS[n.id]}<span>${n.label}</span>

          </div>`).join('')}

      </div>

      <div class="sidebar-foot"><div class="account-menu"><button class="account-avatar-btn" onclick="App.openProfile()" title="Open profile settings">${renderAccountAvatar()}</button><button class="account-profile-btn" onclick="App.openProfile()" title="Open profile settings"><span class="account-menu-email">${escapeHtml(getDisplayName())}</span></button><span class="cloud-badge">CLOUD</span><button class="btn btn-ghost btn-sm" onclick="window.MediaFlowAuth.logout()">Log out</button></div>

        ${renderLevelBlock()}

        <div class="k" style="margin-top:14px;">Day streak</div>

        <div class="v">${computeDayStreak()} 🔥 <span class="v149-sidebar-streak-xp">×${v149StreakMultiplier(computeDayStreak()).toFixed(2)} XP</span></div>

        <div style="font-size:10.5px; color:var(--text-mute); margin-top:10px;">

          ● Saved to cloud storage

        </div>

      </div>

    </div>

    <div class="main">

      <div class="container" id="view-root"></div>

    </div>

    <div class="mobile-tabbar">
      ${renderMobileTabs()}
    </div>

  `;

  renderView();

  renderModal();

}

function computeDayStreak(){

  const days = new Set(S.sessions.filter(s=>s.status!=='skipped').map(s=>s.date));

  let streak=0, cur=new Date();

  while(true){

    const iso = cur.toISOString().slice(0,10);

    if(days.has(iso)){ streak++; cur.setDate(cur.getDate()-1); }

    else break;

  }

  return streak;

}

function renderView(){

  const root = document.getElementById('view-root');

  if(!root) return;

  let html='';

  if(S.view==='dashboard') html = renderDashboard();

  else if(S.view==='library') html = renderLibrary();

  else if(S.view==='libraryhistory') html = renderLibraryHistory();

  else if(S.view==='history') html = renderHistory();

  else if(S.view==='batch') html = renderBatchLog();

  else if(S.view==='stats') html = renderStats();

  else if(S.view==='settings') html = renderSettings();
  else if(S.view==='profile') html = renderProfile();

  root.innerHTML = `<div class="fade-in">${html}</div>`;

}
