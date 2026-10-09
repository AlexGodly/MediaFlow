/* MediaFlow v326 — actual Workspace Statistics renderer in public profiles.
 * Only owner-published, section-scoped data is used. The visitor's globals
 * are restored synchronously and no private cloud data is requested.
 */
const MF326={version:326,renderingStats:false,activeStats:null};
function mf326StatsTitle(t){const x=mf325Title(t);delete x.notes;delete x.description;delete x.synopsis;delete x.externalIds;x.startedAt=Math.max(0,Number(t.startedAt)||0);return x;}
function mf326StatsSession(s){const x=mf325Session(s);delete x.note;return x;}
function mf326StatsTimeline(t){return {libraryId:mf325N(t.libraryId,120),title:mf325N(t.title,350),categoryId:mf325N(t.categoryId,120),completedAt:Number(t.completedAt)||0};}
function mf326StatsActivity(x){return {id:mf325N(x.id,120),title:mf325N(x.title,300),categoryId:mf325N(x.categoryId,120),timestamp:Number(x.timestamp)||0,date:mf325N(x.date,20),type:mf325N(x.type,50),minutes:Number(x.minutes)||0,amount:Number(x.amount)||0};}
function mf326SafeLedger(x){const out={};for(const key of ['libraryAdditions','libraryEdits','manualCovers','logCompletions','titleStarts']){const vals=x?.[key];if(vals&&typeof vals==='object'&&!Array.isArray(vals)){out[key]=Object.fromEntries(Object.entries(vals).slice(0,60000).map(([k,v])=>[mf325N(k,120),Math.max(0,Number(v)||0)]));}}return out;}
async function mf326OwnerTime(owner){
 const result={xp:Math.max(0,Number(MF316.xp)||0),seconds:Math.max(0,Number(MF316.seconds)||0),pending:Math.max(0,Number(MF316.pending)||0),days:Array.isArray(MF316.days)?MF316.days:[]};
 // Fetch the authoritative account ledger at publication time: Profile Studio
 // may be open without the owner having visited the private Statistics page.
 try{
  const [ledger,days]=await Promise.all([
   supabase.from('mf_time_xp_v316').select('xp_total,credited_seconds,remainder_seconds').eq('user_id',owner).maybeSingle(),
   supabase.from('mf_time_xp_days_v316').select('day,active_seconds,xp_earned').eq('user_id',owner).gte('day',new Date(Date.now()-31*86400000).toISOString().slice(0,10)).order('day',{ascending:false})
  ]);
  if(ledger.error)throw ledger.error;if(days.error)throw days.error;
  if(ledger.data){result.xp=Math.max(0,Number(ledger.data.xp_total)||0);result.seconds=Math.max(0,Number(ledger.data.credited_seconds)||0);result.pending=Math.max(0,Number(ledger.data.remainder_seconds)||0);}
  if(Array.isArray(days.data))result.days=days.data;
 }catch(e){console.warn('[v326] Time-XP publication uses loaded owner ledger:',e?.message||e);}
 return result;
}
function mf326StatsMeta(ownerTime){const config=S.settings||{};const copied=mf325SanitizedSettings();for(const k of ['v186ControlCenter','leveling'])if(config[k]!=null){try{copied[k]=JSON.parse(JSON.stringify(config[k]));}catch(_){}}
 const time={...ownerTime,days:(ownerTime?.days||[]).map(d=>({day:mf325N(d.day,12),active_seconds:Math.max(0,Number(d.active_seconds)||0),xp_earned:Math.max(0,Number(d.xp_earned)||0)}))};
 const totalXP=Math.max(0,Number(mediaFlowXP())-(Number(MF316.xp)||0)+(Number(time.xp)||0));
 return {settings:copied,xpLedger:mf326SafeLedger(S.xpLedger),totalXP,profileName:mf325N(S.profileName||AUTH_USER?.user_metadata?.name||'',150),statsHeatmapYear:Number(S.statsHeatmapYear)||new Date().getFullYear(),statsRecapMonth:mf325N(S.statsRecapMonth,8),time,publishedAt:Date.now()};}
async function mf326PublishStats(){if(!AUTH_USER?.id)return false;const owner=AUTH_USER.id;const profile=await mfMyProfile();if(!profile?.is_public)return false;const visible=mf323Tabs(mf323Meta(profile)).some(t=>t.id==='statistics'&&t.visible);
 const ownerTime=visible?await mf326OwnerTime(owner):null;
 const sections={statistics:()=>[mf326StatsMeta(ownerTime)],statistics_titles:()=> (S.library||[]).map(mf326StatsTitle),statistics_sessions:()=> (S.sessions||[]).map(mf326StatsSession),statistics_timeline:()=> (S.completionTimeline||[]).map(mf326StatsTimeline),statistics_activity:()=> (S.activityLog||[]).map(mf326StatsActivity)};
 const probe=await supabase.from('mf_public_workspace_v325').select('page').eq('user_id',owner).eq('section','statistics').limit(1);if(probe.error)throw Error('Install SQL_v326_native_public_statistics.sql before publishing: '+probe.error.message);
 for(const [section,make] of Object.entries(sections)){
  if(AUTH_USER?.id!==owner)throw Error('Account changed during Statistics publication');
  if(visible){const rows=make();mf323Status('Publishing native Statistics '+section+' ('+rows.length.toLocaleString()+' entries)…');await mf325PublishPages(section,rows,owner);}
  else{const {error}=await supabase.from('mf_public_workspace_v325').delete().eq('user_id',owner).eq('section',section);if(error)throw error;}
 }
 return true;
}
async function mf326LoadStatsState(){const state=await mf325LoadState('statistics');const [info,titles,sessions,timeline,activity]=await Promise.all(['statistics','statistics_titles','statistics_sessions','statistics_timeline','statistics_activity'].map(async section=>{
  if(!MF325.cache.has(section))MF325.cache.set(section,await mf325ReadAll(section,MF323.profile.user_id));return MF325.cache.get(section);
 }));
 const stats=info?.[0];if(!stats||!Number.isFinite(Number(stats.publishedAt)))throw Error('Statistics has not yet been republished with v326.');
 state.library=titles||[];state.sessions=sessions||[];state.completionTimeline=timeline||[];state.activityLog=activity||[];
 state.settings={...state.settings,...(stats.settings||{}),leveling:{...DEFAULT_SETTINGS.leveling,...(stats.settings?.leveling||{})}};
 state.xpLedger=stats.xpLedger||{};state.profileName=stats.profileName||MF323.profile.display_name;
 state.statsHeatmapYear=stats.statsHeatmapYear;state.statsRecapMonth=stats.statsRecapMonth;state.timelinePage=0;
 state.view='stats';state.stopwatch={running:false,startedAt:0,elapsed:0,resetValue:0};
 state.__mf326Stats=stats;
 return state;
}
function mf326NativeStats(state){const owner=MF323.profile.user_id,oldAuth=AUTH_USER,oldXP=mediaFlowXP;
 const oldTime={user:MF316.user,xp:MF316.xp,seconds:MF316.seconds,pending:MF316.pending,days:MF316.days,todayXP:MF316.todayXP,todaySeconds:MF316.todaySeconds,gotLedger:MF316.gotLedger};
 const published=state.__mf326Stats||{};
 try{
  MF326.renderingStats=true;MF326.activeStats=published;
  AUTH_USER={id:owner};MF316.user=owner;MF316.xp=Number(published.time?.xp)||0;MF316.seconds=Number(published.time?.seconds)||0;MF316.pending=Number(published.time?.pending)||0;MF316.days=published.time?.days||[];MF316.gotLedger=true;
  // XP is the owner's published total, never recomputed using a visitor's ledger.
  mediaFlowXP=()=>Math.max(0,Number(published.totalXP)||0);
  const result=mf325WithState(state,()=>renderStats());
  return mf325SafeDom(result,'statistics');
 }finally{mediaFlowXP=oldXP;AUTH_USER=oldAuth;Object.assign(MF316,oldTime);MF326.activeStats=null;MF326.renderingStats=false;}
}
function mf326PaintTime(root,state){const box=root.querySelector('.mf316-time-stat');if(!box)return;const time=state.__mf326Stats?.time||{},days=Array.isArray(time.days)?time.days:[];
 const cutoff=n=>new Date(Date.now()-(n-1)*86400000).toISOString().slice(0,10);
 const sum=n=>days.filter(x=>x.day>=cutoff(n)).reduce((a,x)=>a+(Number(x.active_seconds)||0),0);
 const put=(key,val)=>{const node=box.querySelector('[data-mf316-'+key+']');if(node)node.textContent=val;};
 put('today',mf316Duration(sum(1)));put('week',mf316Duration(sum(7)));put('month',mf316Duration(sum(30)));put('all',mf316Duration(time.seconds));put('xp',(Number(time.xp)||0).toLocaleString()+' XP');
 const cfg=state.settings?.leveling?.timeXP||{},streak=(()=>{try{return mf325WithState(state,()=>mf316Streak());}catch(_){return {multiplier:1};}})();
 put('mult','×'+(Number(streak.multiplier)||1).toFixed(2));const secs=Math.max(1,Number(cfg.intervalMinutes)||10)*60,pending=Number(time.pending)||0;
 put('next',Math.ceil(Math.max(0,secs-pending)/60)+'m');const bar=box.querySelector('[data-mf316-progress]');if(bar)bar.style.width=Math.min(100,100*pending/secs)+'%';
}
function mf326StatsRender(host,state){const page=host.querySelector('.mf325-native-page');if(!page)return;page.innerHTML=mf326NativeStats(state);mf326PaintTime(page,state);}
const mf326OldTab=mf325LoadTab;
mf325LoadTab=async function(){if(MF323.selected!=='statistics')return mf326OldTab();const host=document.getElementById('mf323-tab-body');if(!host||!MF323.profile)return;
 const owner=MF323.profile.user_id,seq=++MF323.seq;
 host.innerHTML='<div class="mf324-loading" role="status">Loading original Workspace Statistics…</div>';
 try{const state=await mf326LoadStatsState();if(seq!==MF323.seq||owner!==MF323.profile?.user_id)return;MF325.current=state;
  host.innerHTML='<div class="mf325-native mf326-statistics" data-public-workspace="statistics"><div class="mf325-public-notice"><span>Viewing '+mf323E(MF323.profile.display_name||MF323.profile.username)+'’s Statistics</span><strong>Read only · Published '+new Date(state.__mf326Stats.publishedAt).toLocaleString()+'</strong><button type="button" class="mf325-refresh" onclick="MF325.refresh()">Refresh published view</button></div><div class="mf325-native-page"></div></div>';
  const root=host.querySelector('.mf325-native');mf326StatsRender(root,state);
  for(const kind of ['click','change','input'])root.addEventListener(kind,mf326StatsInteraction,true);
 }catch(e){if(seq!==MF323.seq)return;host.innerHTML='<div class="mf323-error" role="alert">'+mf323E(e?.message||e)+'<p>Statistics can be republished in Profile Studio. The earlier snapshot remains available.</p><button type="button" onclick="MF325.previous()">Open previous Statistics snapshot</button></div>';}
};
// Read-only native Statistics controls use the original Workspace methods.
for(const action of ['setTimelinePage','setRecapMonth','setHeatmapYear'])MF325_READ_ACTIONS.add(action);
function mf326StatsInteraction(ev){const root=ev.currentTarget,el=ev.target.closest?.('[data-mf325-action]');if(!el||!root.contains(el))return;
 const kind=el.tagName==='INPUT'?'input':el.tagName==='SELECT'?'change':'click';if(ev.type!==kind)return;
 const method=el.dataset.mf325Action;if(!['setTimelinePage','setRecapMonth','setHeatmapYear'].includes(method))return mf325Interaction.call(root,ev);
 ev.preventDefault();ev.stopPropagation();let args=[];try{args=JSON.parse(el.dataset.mf325Args||'[]');}catch(_){return;}
 args=args.map(x=>x==='$value'?el.value:x==='$checked'?el.checked:x);
 try{mf325WithState(MF325.current,()=>App[method](...args));mf326StatsRender(root,MF325.current);}catch(e){console.warn('Public Statistics control failed',method,e);}
}
const mf326OldPublisher=mf325Publish;
mf325Publish=async function(){const ok=await mf326OldPublisher();if(!ok)return false;await mf326PublishStats();return true;};
MF325.publish=mf325Publish;
mf323LoadTab=mf325LoadTab;
// Existing Profile Studio Save and Refresh flows call mf323Publish -> mf325Publish.
// Previous v325 Save and publish closure directly calls mf325Publish; reassignment above is enough.
window.MF326=MF326;
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:326,nativePublicStatistics:true};
