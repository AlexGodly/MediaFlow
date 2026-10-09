/* MediaFlow v316 — uncapped active-time XP, server-authoritative interval ledger,
 * optional public active time, statistics, and lightweight people freshness.
 * Historical v312 usage remains unchanged; v316 XP begins upon authenticated tracking.
 */
const MF316={user:'',xp:0,seconds:0,pending:0,todayXP:0,todaySeconds:0,loading:false,busy:false,gotLedger:false,
  lastInteraction:Date.now(),lastTick:0,statStamp:0,days:[],refreshRevision:'',refreshAt:0,refreshBusy:false,
  debounce:null,headerWatch:null,headerHost:null};
function mf316TimeCfg(){const d=DEFAULT_SETTINGS.leveling.timeXP||{};const c=S?.settings?.leveling?.timeXP||{};return {
 enabled:c.enabled!==false,intervalMinutes:Math.min(60,Math.max(1,Math.floor(Number(c.intervalMinutes)||d.intervalMinutes||10))),
 xpPerInterval:Math.min(500,Math.max(0,Math.floor(c.xpPerInterval==null?(d.xpPerInterval||5):Number(c.xpPerInterval))||0)),
 idleMinutes:Math.min(30,Math.max(1,Math.floor(Number(c.idleMinutes)||d.idleMinutes||5))),useStreak:c.useStreak!==false};}
function mf316Streak(){const days=computeDayStreak();return {days,multiplier:mf316TimeCfg().useStreak?v149StreakMultiplier(days):1};}
function mf316SwitchAccount(){const uid=AUTH_USER?.id||'';if(uid===MF316.user)return;
 MF316.user=uid;MF316.xp=0;MF316.seconds=0;MF316.pending=0;MF316.todayXP=0;MF316.todaySeconds=0;MF316.gotLedger=false;
 MF316.lastInteraction=Date.now();MF316.lastTick=0;MF316.days=[];MF316.refreshRevision='';}
// These values are fetched from a per-account, server-owned ledger; never add them
// into a cloud snapshot where a second device could double count them.
const mf316PrevTotalXP=mediaFlowXP;
mediaFlowXP=function(){mf316SwitchAccount();return mf316PrevTotalXP.apply(this,arguments)+(AUTH_USER?MF316.xp:0);};
// v312's publication badge compares every default XP setting including this new group.
// Existing Level and XP displays use mediaFlowLevelInfo() -> mediaFlowXP().
function mf316ApplyLedger(row){if(!row||!AUTH_USER)return;
 const before=MF316.xp;MF316.xp=Math.max(0,Number(row.xp_total)||0);MF316.seconds=Math.max(0,Number(row.lifetime_seconds??row.credited_seconds)||0);
 MF316.pending=Math.max(0,Number(row.remainder_seconds)||0);MF316.todayXP=Math.max(0,Number(row.today_xp)||0);MF316.todaySeconds=Math.max(0,Number(row.today_seconds)||0);
 MF316.gotLedger=true;
 const todayISO=new Date().toISOString().slice(0,10);const found=MF316.days.find(d=>d.day===todayISO);
 if(found){found.active_seconds=MF316.todaySeconds;found.xp_earned=MF316.todayXP;}else MF316.days.push({day:todayISO,active_seconds:MF316.todaySeconds,xp_earned:MF316.todayXP});
 mf316PaintStats();
 if(MF316.xp!==before){try{mf315EnhanceSidebar();}catch(_){}try{mf312SyncOwnProfile(true);}catch(_){}const el=document.querySelector('.v149-sidebar-streak-xp');if(el)el.title='Time-based XP is included in total Level and XP';
  if(['dashboard','stats'].includes(S.view)&&!document.activeElement?.matches('input,textarea,select,[contenteditable]')){try{render();}catch(_){}}}
}
async function mf316LoadLedger(){mf316SwitchAccount();if(!AUTH_USER||!supabase||MF316.loading)return;const uid=AUTH_USER.id;MF316.loading=true;
 try{const {data,error}=await supabase.from('mf_time_xp_v316').select('xp_total,credited_seconds,remainder_seconds').eq('user_id',uid).maybeSingle();if(error)throw error;
 if(AUTH_USER?.id===uid){MF316.xp=Math.max(0,Number(data?.xp_total)||0);MF316.seconds=Math.max(0,Number(data?.credited_seconds)||0);MF316.pending=Math.max(0,Number(data?.remainder_seconds)||0);MF316.gotLedger=true;mf316PaintStats();mf312SyncOwnProfile(true);}}
 catch(e){console.warn('[v316] Time XP ledger not available:',e?.message||e);}finally{MF316.loading=false;}}
function mf316Active(){const cfg=mf316TimeCfg();return document.visibilityState==='visible'&&document.hasFocus()&&Date.now()-MF316.lastInteraction<cfg.idleMinutes*60000;}
function mf316RecordInteraction(e){if(e.type==='keydown'||e.type==='pointerdown'||e.type==='scroll'||e.type==='touchstart'||e.type==='mousemove'){MF316.lastInteraction=Date.now();}}
['pointerdown','keydown','touchstart','scroll'].forEach(type=>document.addEventListener(type,mf316RecordInteraction,{passive:true,capture:true}));
let mf316MoveStamp=0;document.addEventListener('mousemove',()=>{if(Date.now()-mf316MoveStamp>10000){mf316MoveStamp=Date.now();MF316.lastInteraction=mf316MoveStamp;}},{passive:true});
// Disable v312's old heartbeat; the v316 heartbeat is the sole writer of
// usage credit so the two versions cannot double count the same interval.
mf312UsageTick=async function(){return;};
async function mf316Tick(force=false){mf316SwitchAccount();const uid=AUTH_USER?.id;
 if(!uid||!supabase||MF316.busy)return;
 if(MF316.loading)return; if(!MF316.gotLedger){await mf316LoadLedger();if(!MF316.gotLedger)return;}
 const cfg=mf316TimeCfg();const active=mf316Active();
 if(!force&&Date.now()-MF316.lastTick<55000)return;
 MF316.lastTick=Date.now();MF316.busy=true;
 try{const {data,error}=await supabase.rpc('mf_time_xp_tick_v316',{p_active:active,p_enabled:cfg.enabled&&S.settings?.leveling?.enabled!==false,
 p_interval_seconds:cfg.intervalMinutes*60,p_reward_xp:cfg.xpPerInterval,p_multiplier:mf316Streak().multiplier});
 if(error)throw error;if(AUTH_USER?.id!==uid)return;const row=Array.isArray(data)?data[0]:data;mf316ApplyLedger(row);
 }catch(e){console.warn('[v316] Time XP heartbeat:',e?.message||e)}finally{MF316.busy=false;}}
// A single lightweight request per minute, regardless of how many MediaFlow pages are rendered.
setInterval(()=>{if(AUTH_USER)mf316Tick();},60000);
document.addEventListener('visibilitychange',()=>{if(AUTH_USER)mf316Tick(true);});
window.addEventListener('focus',()=>{MF316.lastInteraction=Date.now();if(AUTH_USER)mf316Tick(true);});
window.addEventListener('blur',()=>{if(AUTH_USER)mf316Tick(true);});
const mf316BaseStart=startAuthenticatedApp;
startAuthenticatedApp=async function(...args){const r=await mf316BaseStart.apply(this,args);mf316SwitchAccount();if(AUTH_USER){await mf316LoadLedger();mf316Tick(true);}return r;};
setTimeout(()=>{if(AUTH_USER){mf316LoadLedger();mf316Tick(true);}},6500);
function mf316Update(key,val){const c=S.settings.leveling||(S.settings.leveling={});const current=c.timeXP||{};const cfg=mf316TimeCfg();
 if(key==='enabled'||key==='useStreak')current[key]=!!val;
 else{const numeric=Math.floor(Number(val));if(!Number.isFinite(numeric))return;const range={intervalMinutes:[1,60],xpPerInterval:[0,500],idleMinutes:[1,30]}[key];if(!range)return;current[key]=Math.max(range[0],Math.min(range[1],numeric));}
 c.timeXP=current;persistSettings();render();mf312SyncOwnProfile(true);}
Object.assign(App,{mf316Update});
const mf316OldSettings=renderSettings;
renderSettings=function(){let h=mf316OldSettings.apply(this,arguments);const cfg=mf316TimeCfg();const streak=mf316Streak();
 const card=`<div class="mf316-xp-settings"><div class="mf316-xp-head"><div><strong>ACTIVE TIME XP</strong><p>Earn XP for active time in MediaFlow. No daily XP limit. Rewards rise with your media streak.</p></div><label class="mf316-switch"><input type="checkbox" ${cfg.enabled?'checked':''} onchange="App.mf316Update('enabled',this.checked)" aria-label="Enable time-based XP"><span>${cfg.enabled?'Enabled':'Disabled'}</span></label></div><div class="mf316-xp-grid"><label>Minutes per reward<input type="number" min="1" max="60" value="${cfg.intervalMinutes}" onchange="App.mf316Update('intervalMinutes',this.value)"></label><label>XP per interval<input type="number" min="0" max="500" value="${cfg.xpPerInterval}" onchange="App.mf316Update('xpPerInterval',this.value)"></label><label>Idle timeout (minutes)<input type="number" min="1" max="30" value="${cfg.idleMinutes}" onchange="App.mf316Update('idleMinutes',this.value)"></label><label class="mf316-xp-check"><input type="checkbox" ${cfg.useStreak?'checked':''} onchange="App.mf316Update('useStreak',this.checked)"> Multiply by media streak</label></div><div class="mf316-xp-foot"><span>Current streak: <b>${streak.days} days</b> · <b>×${streak.multiplier.toFixed(2)}</b></span><span>Time XP earned: <b>${Math.round(MF316.xp).toLocaleString()} XP</b></span></div><p class="hint">Activity pauses when the window is hidden or idle. Rewards are stored once per account, not per tab. Time XP and public usage sharing are independent. Factory defaults determine the MediaFlow Verified configuration badge.</p></div>`;
 const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
 return h.includes(marker)?h.replace(marker,card+marker):h.replace('LEVELING &amp; XP','LEVELING &amp; XP')+card;
};
// Statistics Settings uses the existing v186 component visibility infrastructure.
V186_STATS_COMPONENT_DEFAULTS.timeSpent=true;
V186_STATS_COMPONENT_LABELS.timeSpent='Time spent in MediaFlow';
v186EnsureControlCenter(DEFAULT_SETTINGS);v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
function mf316Duration(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return n>=3600?`${Math.floor(n/3600).toLocaleString()}h ${Math.floor(n%3600/60)}m`:`${Math.floor(n/60)}m`;}
function mf316StatsCard(){const s=mf316Streak();return `<section class="card mf316-time-stat" aria-label="Time spent in MediaFlow"><div class="mf316-stats-title"><div><span class="section-label">TIME SPENT IN MEDIAFLOW</span><h2>Your active time</h2><p>Recorded eligible time and uncapped streak-powered XP</p></div><span class="mf316-stats-icon">◷</span></div><div class="mf316-stats-cells"><div><small>Today</small><b data-mf316-today>—</b></div><div><small>Last 7 days</small><b data-mf316-week>—</b></div><div><small>Last 30 days</small><b data-mf316-month>—</b></div><div><small>All time</small><b data-mf316-all>${mf316Duration(MF316.seconds)}</b></div></div><div class="mf316-stats-bottom"><div><small>Time-based XP earned</small><strong data-mf316-xp>${Math.round(MF316.xp).toLocaleString()} XP</strong></div><div><small>Streak multiplier</small><strong data-mf316-mult>×${s.multiplier.toFixed(2)}</strong></div><div><small>Until next reward</small><strong data-mf316-next>${Math.ceil(Math.max(0,mf316TimeCfg().intervalMinutes*60-MF316.pending)/60)} min</strong></div></div><div class="mf316-stats-track"><span data-mf316-progress style="width:${Math.min(100,MF316.pending/(mf316TimeCfg().intervalMinutes*60)*100)}%"></span></div><p class="hint">Visible, recently active use only, recorded from v316. Daily breakdowns use UTC. Public time sharing is optional.</p></section>`;}
const mf316PrevStats=renderStats;
renderStats=function(){const html=mf316PrevStats.apply(this,arguments);const c=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS).statsComponents.values;if(c.timeSpent===false)return html;
 if(!window.MF326?.renderingStats)setTimeout(()=>mf316RefreshStats(),100);return mf316StatsCard()+html;};
function mf316PaintStats(){const box=[...document.querySelectorAll('.mf316-time-stat')].find(node=>!node.closest('.mf326-statistics')); if(!box)return;const today=MF316.days.filter(d=>d.day===new Date().toISOString().slice(0,10));const last=days=>{const limit=new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10);return MF316.days.filter(d=>d.day>=limit);};
 const sum=arr=>arr.reduce((s,d)=>s+(Number(d.active_seconds)||0),0);
 const put=(key,val)=>{const el=box.querySelector(`[data-mf316-${key}]`);if(el)el.textContent=val;};
 put('today',mf316Duration(sum(today)));put('week',mf316Duration(sum(last(7))));put('month',mf316Duration(sum(last(30))));put('all',mf316Duration(MF316.seconds));put('xp',Math.round(MF316.xp).toLocaleString()+' XP');put('mult','×'+mf316Streak().multiplier.toFixed(2));
 const seconds=mf316TimeCfg().intervalMinutes*60;put('next',Math.ceil(Math.max(0,seconds-MF316.pending)/60)+'m');const bar=box.querySelector('[data-mf316-progress]');if(bar)bar.style.width=`${Math.min(100,MF316.pending/seconds*100)}%`;}
async function mf316RefreshStats(){if(!AUTH_USER||!supabase||S.view!=='stats')return;const uid=AUTH_USER.id;try{
 const {data,error}=await supabase.from('mf_time_xp_days_v316').select('day,active_seconds,xp_earned').eq('user_id',uid).gte('day',new Date(Date.now()-31*86400000).toISOString().slice(0,10)).order('day',{ascending:false});if(error)throw error;
 if(AUTH_USER?.id===uid){MF316.days=data||[];mf316PaintStats();}}
 catch(e){console.warn('[v316] Time spent statistics:',e?.message||e);}}
// Freshness checks for People rankings: light indexed revision instead of full users download.
async function mf316CheckUsers(){if(MF316.refreshBusy||!supabase||document.visibilityState==='hidden'||MF302.page!=='users'||!document.querySelector('#mf312-users-results'))return;
 if(document.activeElement?.id==='mf312-user-search')return;
 MF316.refreshBusy=true;try{const {data,error}=await supabase.rpc('mf_users_revision_v316');if(error)throw error;const rev=String(data||'');const now=Date.now();
 if(!MF316.refreshRevision){MF316.refreshRevision=rev;MF316.refreshAt=now;return;}
 if(MF316.refreshRevision!==rev||now-MF316.refreshAt>300000){MF316.refreshAt=now;await mf312FetchUsers(++MF312.users.request);}
 MF316.refreshRevision=rev;
 }catch(e){console.warn('[v316] User ranking refresh:',e?.message||e);}finally{MF316.refreshBusy=false;}}
setInterval(mf316CheckUsers,50000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')mf316CheckUsers();});
// v316 fixes the underlying v261 React PAGE and PATHS tables directly.
// The v315 fallback remains responsible when React does not load. Avoid
// DOM observers that would fight with React and trigger feedback loops.
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:316,timeXP:true,usersAutoRefresh:true});
