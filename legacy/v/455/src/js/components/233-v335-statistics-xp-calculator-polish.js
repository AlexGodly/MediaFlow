/* MediaFlow v335 — XP settings in active page renderer; clean Runtime Calculator
   icons; Statistics scroll, component order and a richer activity overview.
   Safely extends the v334 ledger instead of changing the Supabase schema. */
const V335_FIRST_EPISODE_DEFAULT=20;
DEFAULT_SETTINGS.leveling.firstEpisodeXP=V335_FIRST_EPISODE_DEFAULT;

function v335EpisodeLedger(){
  const ledger=v334Ledger();
  if(!ledger.v335FirstEpisodeRewards||typeof ledger.v335FirstEpisodeRewards!=='object'||Array.isArray(ledger.v335FirstEpisodeRewards))ledger.v335FirstEpisodeRewards={};
  return ledger.v335FirstEpisodeRewards;
}
function v335IsEpisodeTitle(item){
  const cat=(S.categories||[]).find(x=>String(x?.id||'')===String(item?.categoryId||''));
  return String(cat?.unit||'').toLowerCase()==='episodes';
}
let V335_KNOWN_EPISODES=null,V335_EPISODE_ACCOUNT='';
function v335SeedEpisodes(){
  V335_KNOWN_EPISODES=new Map((S.library||[]).filter(x=>x?.id).map(x=>[String(x.id),Math.max(0,Number(x.progress)||0)]));
  V335_EPISODE_ACCOUNT=String(AUTH_USER?.id||'');
}
const v335LoadAllBase=loadAll;
loadAll=async function(){const result=await v335LoadAllBase.apply(this,arguments);v335EpisodeLedger();v335SeedEpisodes();return result;};
function v335AwardFirstEpisode(item){
  if(!item?.id||!v335IsEpisodeTitle(item)||(Number(item.progress)||0)<=0)return false;
  const id=String(item.id),awards=v335EpisodeLedger();
  if(Object.prototype.hasOwnProperty.call(awards,id))return false;
  const amount=Number(S.settings?.leveling?.firstEpisodeXP??V335_FIRST_EPISODE_DEFAULT);
  awards[id]=S.settings?.leveling?.enabled===false?0:Math.round(Math.max(0,Math.min(100000,Number.isFinite(amount)?amount:V335_FIRST_EPISODE_DEFAULT)));
  v334InvalidateXP();return true;
}
const v335PersistLibraryBase=persistLibrary;
persistLibrary=function(){
  const userId=String(AUTH_USER?.id||'');
  if(V335_EPISODE_ACCOUNT!==userId||!V335_KNOWN_EPISODES)v335SeedEpisodes();
  for(const item of S.library||[]){
    const id=String(item?.id||'');if(!id)continue;
    const before=V335_KNOWN_EPISODES.get(id),after=Math.max(0,Number(item.progress)||0);
    if(before===0&&after>0)v335AwardFirstEpisode(item);
    V335_KNOWN_EPISODES.set(id,after);
  }
  return v335PersistLibraryBase.apply(this,arguments);
};
// A new title made with the Dashboard logger may already contain its first
// episode before persistLibrary. Do not award previously imported titles.
const v335AwardLibraryAdditionBase=awardLibraryAdditionXP;
awardLibraryAdditionXP=function(id){
  if(V334_ADDING_LOG_ENTRY&&id){
    const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));
    if(item)v335AwardFirstEpisode(item);
  }
  return v335AwardLibraryAdditionBase.apply(this,arguments);
};
const v335TotalsBase=v334Totals;
v334Totals=function(ledger=S.xpLedger){
  const result=v335TotalsBase.apply(this,arguments);
  const firstEpisodeXP=v334Sum(ledger?.v335FirstEpisodeRewards);
  return {...result,firstEpisodeXP,total:result.total+firstEpisodeXP};
};
const v335XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v335XPBreakdownBase.apply(this,arguments);
  return {...b,firstEpisodeXP:v334Sum(S.xpLedger?.v335FirstEpisodeRewards)};
};
const v335MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v335MergeStatesBase.apply(this,arguments);
  if(!out||typeof out!=='object')return out;
  out.xpLedger=out.xpLedger||{};
  const old=a?.xpLedger?.v335FirstEpisodeRewards||{};
  const incoming=b?.xpLedger?.v335FirstEpisodeRewards||{};
  const map={};
  for(const id of new Set([...Object.keys(old),...Object.keys(incoming)]))map[id]=Math.max(0,Number(old[id])||0,Number(incoming[id])||0);
  out.xpLedger.v335FirstEpisodeRewards=map;
  return out;
};

// v221 registered the Settings page BEFORE the v334 renderSettings wrapper was
// defined. v334's HTML edits therefore never reached the actual Settings page.
// Insert directly into the active v221 page renderer, before its DOM organizer.
function v335XPSettingsFields(){
  const defs={...V334_REWARD_DEFAULTS,firstEpisodeXP:V335_FIRST_EPISODE_DEFAULT};
  const L=S.settings?.leveling||{};
  const field=(key,label,help,step='1')=>`<div class="v335-reward-field field"><label class="field-label" for="v335-xp-${key}">${label}</label><input id="v335-xp-${key}" type="number" min="0" max="100000" step="${step}" value="${Number.isFinite(Number(L[key]))?Number(L[key]):defs[key]}" onchange="App.updateLeveling('${key}',this.value)" aria-describedby="v335-help-${key}"><small id="v335-help-${key}" class="hint">${help}</small></div>`;
  return `<div class="v335-xp-settings" id="v335-xp-settings" aria-label="MediaFlow milestone and activity XP rewards">
    <div class="v335-reward-intro"><span class="v335-reward-kicker">XP REWARDS</span><strong>Milestones &amp; active time</strong><p>Set XP for first milestones, collection changes and time spent inside MediaFlow. Changes are saved with your other leveling settings.</p></div>
    <div class="v335-reward-heading">TITLE MILESTONES</div>
    <div class="v335-reward-grid">
      ${field('firstEpisodeXP','First episode XP','One-time reward when the first episode is recorded as progress on an episode-based title.')}
      ${field('firstTitleStartXP','Start title XP','One-time reward when an unstarted title becomes active or progress begins.')}
    </div>
    <div class="v335-reward-heading">COLLECTION REWARDS</div>
    <div class="v335-reward-grid">
      ${field('collectionCreateXP','Create Collection XP','One-time reward for creating a Collection.')}
      ${field('collectionEditXP','Edit Collection XP','Reward each time a Collection is meaningfully edited; no reward for unchanged saves.')}
    </div>
    <div class="v335-reward-heading">APP ACTIVITY</div>
    <div class="v335-reward-grid">
      ${field('activeTimeXPPerMinute','Active time XP / minute','Foreground app time, multiplied by your streak. No idle cutoff or daily limit.','0.1')}
    </div>
  </div>`;
}
const v335SettingsPageBase=v221RenderSettingsPage;
function v335RenderSettingsPage(){
  const html=v335SettingsPageBase.apply(this,arguments);
  const host=document.createElement('div');host.innerHTML=html;
  const root=host.querySelector('.v221-settings-content');
  const label=[...(root?.querySelectorAll('.section-label')||[])].find(el=>v221PlainSectionTitle(el)==='LEVELING & XP');
  const card=label?.nextElementSibling;
  if(card?.classList.contains('card')&&!card.querySelector('#v335-xp-settings')){
    const anchor=[...card.querySelectorAll('div')].find(el=>el.children.length===0&&String(el.textContent||'').trim()==='UNIT XP');
    if(anchor)anchor.insertAdjacentHTML('beforebegin',v335XPSettingsFields());
    else card.insertAdjacentHTML('beforeend',v335XPSettingsFields());
  }
  return host.innerHTML;
}
MediaFlowRuntime.registerPageRenderer('settings',v335RenderSettingsPage);

// Provide one meaningful icon per calculator mode and for continuing the result.
// data-v225-iconified opt-out stops the global semantic icon enhancement layer
// from adding its generic circular arrow on top of the semantic SVG.
const v335CalculatorBase=v256RuntimeCalculatorHtml;
v256RuntimeCalculatorHtml=function(){
  let html=v335CalculatorBase.apply(this,arguments);
  const carry=v225IconSvg('<path d="M4 5v5h9a5 5 0 0 1 0 10h-3"/><path d="m13 17-3 3 3 3"/>');
  const multi=v225IconSvg('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="7" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="18" r="1" fill="currentColor" stroke="none"/>');
  const keep=v225IconSvg('<path d="M3 12h12"/><path d="m11 7 5 5-5 5"/><path d="M19 5v14"/>');
  const convert=(action,htmlIcon)=>{
    const rex=new RegExp('(<button[^>]*onclick="'+action.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"[^>]*>)([\\s\\S]*?)(<\\/button>)');
    html=html.replace(rex,(_all,opening,inner,close)=>{
      const label=inner.replace(/<span[^>]*class="v334-mode-icon"[^>]*>[\s\S]*?<\/span>/g,'');
      return opening.replace('<button','<button data-v225-iconified="1" data-v335-calculator-icon="1"')+`<span class="v335-calculator-icon" aria-hidden="true">${htmlIcon}</span><span>${label}</span>`+close;
    });
  };
  convert('App.v256SetRuntimeMode(\'chain\')',carry);
  convert('App.v256SetRuntimeMode(\'multi\')',multi);
  convert('App.v256ContinueRuntimeResult()',keep);
  return html;
};

// v334 icon is applied by a global button pass, too. Guard our custom buttons
// even when a later enhancer re-scans the page.
const v335ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('[data-v335-calculator-icon]'))return null;
  return v335ButtonIconNameBase.apply(this,arguments);
};

function v335SmallIcon(paths){return `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;}
function v335ActiveTimeCard(){
  const ledger=v334Ledger(),totals=v334Totals(),days=ledger.v334ActiveTimeDays;
  const today=todayISO(),current=days[today]||{},rate=v334Reward('activeTimeXPPerMinute');
  const multiplier=v149StreakMultiplier(v149ProspectiveTodayStreak());
  const weekdays=[];
  // Use local calendar dates so the chart lines up with MediaFlow's daily dates.
  for(let i=6;i>=0;i--){
    const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-i);
    const dateStr=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const ms=Math.max(0,Number(days[dateStr]?.ms)||0);
    weekdays.push({day:date.toLocaleDateString(undefined,{weekday:'short'}),ms,active:dateStr===today});
  }
  const peak=Math.max(60000,...weekdays.map(x=>x.ms));
  const svgTime=v335SmallIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  const svgSpark=v335SmallIcon('<path d="m12 2-1.5 7H4l5 5-1 8 4-3 4 3-1-8 5-5h-6.5z"/>');
  const svgChart=v335SmallIcon('<path d="M4 20h16"/><rect x="5" y="11" width="3" height="7" rx=".5"/><rect x="11" y="5" width="3" height="13" rx=".5"/><rect x="17" y="9" width="3" height="9" rx=".5"/>');
  const fmt=n=>Math.max(0,Math.round(n)).toLocaleString();
  return `<section class="card v335-active-card" aria-label="Active Time Spent">
    <header class="v335-active-top"><div class="v335-active-title"><span class="v335-active-emblem">${svgTime}</span><div><span class="v335-active-eyebrow">YOUR APP ACTIVITY</span><h3>Active Time Spent</h3><p>Time invested in your media journey</p></div></div><span class="v335-active-status"><span></span>Foreground tracking</span></header>
    <div class="v335-active-hero"><div class="v335-active-hero-main"><small>TOTAL ACTIVE TIME</small><strong data-v334-live-time>${v334Duration(totals.activeMs)}</strong><span>Accumulated while MediaFlow was visible</span></div><div class="v335-active-hero-xp"><span>${svgSpark} TIME XP EARNED</span><strong data-v334-live-xp>${fmt(totals.timeXP)} XP</strong><small>From active time and streaks</small></div></div>
    <div class="v335-active-metrics"><div><span class="v335-metric-label">Today</span><b>${v334Duration(current.ms||0)}</b><small>Today's foreground time</small></div><div><span class="v335-metric-label">Streak multiplier</span><b>×${multiplier.toFixed(2)}</b><small>Applied to time XP</small></div><div><span class="v335-metric-label">Earning rate</span><b>${rate.toLocaleString()} <em>XP / min</em></b><small>Before multiplier</small></div></div>
    <div class="v335-active-detail"><div class="v335-active-week"><div class="v335-active-sectionhead">${svgChart}<span>Last 7 days</span><small>Visible app time</small></div><div class="v335-active-bars" role="img" aria-label="${weekdays.map(x=>`${x.day}: ${v334Duration(x.ms)}`).join(', ')}">${weekdays.map(x=>`<div class="v335-active-day ${x.active?'is-today':''}" title="${x.day}: ${v334Duration(x.ms)}"><div class="v335-active-track"><span style="height:${x.ms>0?Math.max(5,Math.round(x.ms/peak*100)):0}%"></span></div><small>${x.day}</small></div>`).join('')}</div></div><div class="v335-active-bonuses"><div class="v335-active-sectionhead">${svgSpark}<span>Bonus XP earned</span></div><div><span>First episode</span><b>${fmt(totals.firstEpisodeXP)} XP</b></div><div><span>First title starts</span><b>${fmt(totals.startsXP)} XP</b></div><div><span>Collections created</span><b>${fmt(totals.collectionCreateXP)} XP</b></div><div><span>Collections edited</span><b>${fmt(totals.collectionEditXP)} XP</b></div></div></div>
    <footer class="v335-active-foot">Tracking continues while the app is visible. No idle timeout or daily XP cap; hidden tabs don't count.</footer>
  </section>`;
}
const v335RenderStatsBase=renderStats;
renderStats=function(){
  const html=v335RenderStatsBase.apply(this,arguments);
  const host=document.createElement('div');host.innerHTML=html;
  const existing=host.querySelector('.v334-active-time-card');
  if(existing){
    const holder=document.createElement('div');holder.innerHTML=v335ActiveTimeCard();
    existing.replaceWith(holder.firstElementChild);
  }
  const achievements=[...host.querySelectorAll('.section-label')].find(x=>String(x.textContent||'').trim().toUpperCase()==='LIFETIME ACHIEVEMENTS')?.closest('.card');
  const active=host.querySelector('.v335-active-card');
  const leveling=host.querySelector('.stats-level-card');
  // When Active Time is hidden, follow the Leveling card. If both are hidden,
  // keep the existing achievements placement without creating a ghost card.
  if(achievements&&(active||leveling)) (active||leveling).insertAdjacentElement('afterend',achievements);
  return host.innerHTML;
};

// Statistics is the 'stats' view, NOT 'statistics'. Reset ONLY on entering it;
// internal edits and rerenders preserve the reader's position.
function v335StatsScrollTop(){v334ScrollDashboardTop();}
let V335_PREVIOUS_VIEW=String(S.view||'');
const v335RenderViewBase=renderView;
renderView=function(){
  const next=String(S.view||''),entering=next==='stats'&&V335_PREVIOUS_VIEW!=='stats';
  if(entering)v335StatsScrollTop();
  const out=v335RenderViewBase.apply(this,arguments);
  V335_PREVIOUS_VIEW=next;
  if(entering){
    v335StatsScrollTop();
    requestAnimationFrame(()=>{if(S.view==='stats'){
      v335StatsScrollTop();
      requestAnimationFrame(()=>{if(S.view==='stats')v335StatsScrollTop();});
    }});
  }
  return out;
};
const v335SetViewBase=App.setView;
App.setView=function(view){const entering=view==='stats'&&S.view!=='stats';const out=v335SetViewBase.apply(this,arguments);if(entering)v335StatsScrollTop();return out;};
const v335MobileNavBase=App.mobileNav;
App.mobileNav=function(view){const entering=view==='stats'&&S.view!=='stats';const out=v335MobileNavBase.apply(this,arguments);if(entering)v335StatsScrollTop();return out;};
