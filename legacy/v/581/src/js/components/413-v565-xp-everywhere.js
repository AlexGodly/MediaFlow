/* MediaFlow v565 — XP for everything you do, and while you're away.
 *
 * Every action
 *   Every App action that really changes your account (it ends in a save)
 *   earns XP for its kind (S.settings.leveling.mf565ActionXP[group]). Actions
 *   that already have their own XP (logging, Batch Log, Library edits, ratings,
 *   Collections, Personal Order, covers…) keep only their own reward.
 *   Repeat rule: the same action on the same thing earns once per 5 minutes;
 *   different things always earn. Opening a page, a menu or a dialog changes
 *   nothing and earns nothing.
 * Background work
 *   Automatic backups, finished recoveries and fresh-episode checks earn XP
 *   (mf565BackupXP, mf565RecoveryXP, mf565FreshCheckXP).
 * Away time
 *   Time when MediaFlow isn't open anywhere earns XP at its own rate
 *   (mf565AwayXPPerMinute; default a quarter of the active-time rate), times
 *   the day-streak multiplier, credited the next time MediaFlow opens.
 *   S.xpLedger.mf565LastSeenAt is shared by the website and the app, and each
 *   away stretch is stored under a key made from its start, so the same time
 *   is never credited twice — not by two devices, not as both away and
 *   active time.
 * Active time
 *   Website time now also counts while the tab is in the background or you're
 *   idle (v334). A tab the browser froze or put to sleep counts that gap as
 *   away time instead.
 * All events use the v348 XP ledger, so they sync, appear in XP History and
 * count toward total XP and level.
 */
const MF565_ACTION_GROUPS=Object.freeze([
  ['library','Library tools',3,/library|title|status|priority|rating|season|progress|cover|metadata|recovery|recover|missing|tag|genre/i],
  ['history','History edits',3,/history|session|log|undo|redo|consum/i],
  ['categories','Categories',3,/categor/i],
  ['collections','Collections & Personal Order tools',3,/collection|order|queue/i],
  ['data','Imports, exports & backups',5,/import|export|backup|restore|transfer|preset|sync/i],
  ['appearance','Themes & appearance',2,/theme|appearance|colou?r|icon|navigation|nav|dock|layout|view|density|font/i],
  ['settings','Settings',2,/setting|toggle|set[A-Z]|update[A-Z]|prefs?|option|enable|disable/i],
  ['other','Everything else',2,/./]
]);
const MF565_ACTION_SKIP=new Set([
  // Already rewarded by their own XP rules.
  'submitLog','submitBatchLog','saveLibraryModal','confirmDeleteLibrary','rateTitle','setRating','v123Rate',
  'v274SaveCollection','v274AddTitlesToCollection','v274CreateCollection','addToOrder','removeFromOrder',
  // Navigation / opening things is not a change.
  'setView','openLibraryModal','closeModal','openLogForm','closeLogForm','startSession','mf555OpenLogPopup','mf555CloseLogPopup',
  'mf565OpenBatch','mf565CloseBatch','mf565SaveAndNext','toggleSidebar','openMore','closeMore'
]);
const MF565_XP={depth:0,saved:false,action:'',subject:'',recent:new Map(),wrapped:new WeakSet(),
  away:{checking:false},bgAwarded:new Set()};
const MF565_REPEAT_MS=5*60*1000;

function mf565ActionGroup(name){
  const n=String(name||'');
  for(const [id,,,re] of MF565_ACTION_GROUPS)if(re.test(n))return id;
  return 'other';
}
function mf565ActionRate(group){
  const map=S.settings?.leveling?.mf565ActionXP||{};
  const def=MF565_ACTION_GROUPS.find(g=>g[0]===group)?.[2]??2;
  const raw=Number(map[group]??def);
  return Number.isFinite(raw)?Math.max(0,Math.min(100000,raw)):def;
}
function mf565Subject(args){
  const a=args?.[0];
  if(typeof a==='string'||typeof a==='number')return String(a).slice(0,80);
  if(a&&typeof a==='object'&&!(a instanceof Event)&&(a.id!=null))return String(a.id).slice(0,80);
  return '';
}
// Award with the repeat rule. Returns XP awarded (0 when it repeats).
function mf565AwardAction(name,subject){
  if(S.settings?.leveling?.enabled===false)return 0;
  const group=mf565ActionGroup(name),rate=mf565ActionRate(group);
  if(!(rate>0))return 0;
  const key=name+'\u0001'+subject,now=Date.now(),last=MF565_XP.recent.get(key)||0;
  if(now-last<MF565_REPEAT_MS)return 0;
  MF565_XP.recent.set(key,now);
  if(MF565_XP.recent.size>2000)for(const [k,t] of MF565_XP.recent)if(now-t>MF565_REPEAT_MS)MF565_XP.recent.delete(k);
  const label=MF565_ACTION_GROUPS.find(g=>g[0]===group)?.[1]||'Action';
  return mf565LedgerEvent('mf565Action:'+(typeof uid==='function'?uid():now+'_'+Math.random()),
    {kind:'mf565Action.'+group,base:rate,source:label,details:mf565ActionLabel(name),subjectId:subject});
}
function mf565ActionLabel(name){
  return String(name||'').replace(/^(v|mf)\d+/,'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^\w/,c=>c.toUpperCase()).trim()||'Action';
}
// Writes one XP event to the shared v348 ledger. multiply: apply the streak multiplier.
function mf565LedgerEvent(key,{kind,base,source,details='',subjectId='',multiply=true,timestamp=Date.now()}){
  const xp=multiply?v348Multiply(base):Math.max(0,Math.round(Number(base)||0));
  if(!xp)return 0;
  const l=v348Ledger();
  if(l.v348ActionEvents[key]!=null)return 0;
  l.v348ActionEvents[key]=xp;
  l.v348EventMeta[key]={kind,baseXP:Math.round(Number(base)*100)/100,multiplier:multiply?v348Multiplier():1,xp,timestamp,
    source:String(source||kind),details:String(details||'').slice(0,300),subjectId:String(subjectId||'').slice(0,120)};
  try{v334InvalidateXP();}catch(_){}
  return xp;
}

/* ---------- every App action ---------- */
// A save while an action runs marks that action as a real change. Async
// actions (dialogs, network) are tracked separately so one that never
// finishes can't block the others; they expire after 10 minutes.
const MF565_ASYNC=new Map();let MF565_ASYNC_SEQ=0;
function mf565MarkSaved(){
  if(MF565_XP.depth>0)MF565_XP.saved=true;
  for(const a of MF565_ASYNC.values())a.saved=true;
}
persistLibrary=(base=>function(){mf565MarkSaved();return base.apply(this,arguments);})(persistLibrary);
persistSettings=(base=>function(){mf565MarkSaved();return base.apply(this,arguments);})(persistSettings);
persistTask=(base=>function(){mf565MarkSaved();return base.apply(this,arguments);})(persistTask);
saveState=(base=>function(){mf565MarkSaved();return base.apply(this,arguments);})(saveState);
function mf565WrapAction(name,fn){
  if(typeof fn!=='function'||MF565_XP.wrapped.has(fn))return fn;
  const wrapped=function(){
    const outer=MF565_XP.depth===0;
    if(outer){MF565_XP.saved=false;MF565_XP.action=name;MF565_XP.subject=mf565Subject(arguments);}
    const subject=outer?MF565_XP.subject:'';
    MF565_XP.depth++;
    let result;
    try{result=fn.apply(this,arguments);}
    finally{
      MF565_XP.depth=Math.max(0,MF565_XP.depth-1);
      if(outer){
        const savedNow=MF565_XP.saved;
        MF565_XP.saved=false;MF565_XP.action='';MF565_XP.subject='';
        if(result&&typeof result.then==='function'){
          const id=++MF565_ASYNC_SEQ,entry={name,subject,saved:savedNow,started:Date.now()};
          MF565_ASYNC.set(id,entry);
          const done=()=>{if(!MF565_ASYNC.has(id))return;MF565_ASYNC.delete(id);mf565FinishAction(entry.name,entry.subject,entry.saved);};
          Promise.resolve(result).then(done,done);
          setTimeout(()=>MF565_ASYNC.delete(id),10*60*1000);
        }else mf565FinishAction(name,subject,savedNow);
      }
    }
    return result;
  };
  MF565_XP.wrapped.add(wrapped);
  return wrapped;
}
function mf565FinishAction(name,subject,saved){
  if(!saved||MF565_ACTION_SKIP.has(name)||/^(v|mf)\d+.*(Open|Close|Show|Hide|Toggle(Menu|Panel|Section)|Paint|Preview|Focus|Scroll|Search|Filter|Sort|Page|Select|Expand|Collapse)/.test(name))return;
  if(mf565AwardAction(name,subject))try{saveState();}catch(_){}
}
// Wrap what exists now and anything added later.
function mf565WrapApp(){
  for(const name of Object.keys(App)){
    const fn=App[name];
    if(typeof fn==='function'&&!MF565_XP.wrapped.has(fn))App[name]=mf565WrapAction(name,fn);
  }
}
setTimeout(mf565WrapApp,0);
setInterval(mf565WrapApp,5000);

/* ---------- background work ---------- */
const MF565_BG_DEFAULTS={mf565BackupXP:5,mf565RecoveryXP:10,mf565FreshCheckXP:2};
Object.assign(DEFAULT_SETTINGS.leveling,MF565_BG_DEFAULTS);
function mf565BgAward(kind,key,source,details){
  if(S.settings?.leveling?.enabled===false||MF565_XP.bgAwarded.has(key))return 0;
  MF565_XP.bgAwarded.add(key);
  const rate=v348Rate(kind)||Number(MF565_BG_DEFAULTS[kind]||0);
  const xp=mf565LedgerEvent('mf565Bg:'+key,{kind,base:rate,source,details});
  if(xp)try{saveState();}catch(_){}
  return xp;
}
const mf565SaveBackupBase=saveBackupNow;
saveBackupNow=async function(manual=false){
  const before=Number(S.settings?.backup?.lastBackup)||0;
  const result=await mf565SaveBackupBase.apply(this,arguments);
  const after=Number(S.settings?.backup?.lastBackup)||0;
  if(!manual&&after>before)mf565BgAward('mf565BackupXP','backup:'+after,'Automatic backup','Backup written to your folder');
  return result;
};
if(typeof mf424Run==='function'){
  const base=mf424Run;
  mf424Run=async function(){
    const result=await base.apply(this,arguments);
    const job=MF424?.job;
    if(job&&job.status==='complete')mf565BgAward('mf565RecoveryXP','cover:'+(job.id||job.created||job.startedAt||''),'Recovery finished','Cover Recovery completed');
    return result;
  };
}
if(typeof mf439RunBatch==='function'){
  const base=mf439RunBatch;
  mf439RunBatch=async function(){
    const result=await base.apply(this,arguments);
    const job=MF439?.job;
    if(job&&job.status==='completed')mf565BgAward('mf565RecoveryXP','meta:'+(job.id||job.createdAt||job.created||''),'Recovery finished','Metadata Recovery completed');
    return result;
  };
}
if(typeof mf468Scan==='function'){
  const base=mf468Scan;
  mf468Scan=async function(){
    const result=await base.apply(this,arguments);
    const day=todayISO(),hour=new Date().getHours();
    mf565BgAward('mf565FreshCheckXP','fresh:'+day+':'+hour,'Fresh-episode check','Checked for new episodes and chapters');
    return result;
  };
}

/* ---------- away time ---------- */
const MF565_AWAY_MIN_GAP=15*60*1000;
function mf565AwayRate(){
  const raw=Number(S.settings?.leveling?.mf565AwayXPPerMinute);
  if(Number.isFinite(raw)&&raw>=0)return Math.min(100000,raw);
  let active=2;try{active=v334Reward('activeTimeXPPerMinute');}catch(_){}
  return Math.max(0,(Number(active)||0)/4);
}
function mf565Seen(now=Date.now()){
  const l=v348Ledger();
  if(!(Number(l.mf565LastSeenAt)>now))l.mf565LastSeenAt=now;
}
function mf565CreditAway(now=Date.now()){
  if(!AUTH_READY||!AUTH_USER||MF565_XP.away.checking)return 0;
  const l=v348Ledger(),last=Number(l.mf565LastSeenAt)||0;
  if(!last){l.mf565LastSeenAt=now;return 0;}
  const gap=now-last;
  if(gap<MF565_AWAY_MIN_GAP)return 0;
  const minutes=Math.floor(gap/60000),rate=mf565AwayRate();
  const key='mf565Away:'+last;
  let xp=0;
  if(rate>0&&S.settings?.leveling?.enabled!==false){
    xp=mf565LedgerEvent(key,{kind:'mf565Away',base:minutes*rate,source:'Away time',
      details:minutes.toLocaleString()+' min while MediaFlow was closed',timestamp:now});
  }
  l.mf565Away=l.mf565Away&&typeof l.mf565Away==='object'?l.mf565Away:{};
  if(!l.mf565Away[last])l.mf565Away[last]={from:last,to:now,ms:gap,xp};
  l.mf565LastSeenAt=now;
  if(xp){try{saveState();}catch(_){}showToast('+'+xp.toLocaleString()+' XP for your time away');}
  return xp;
}
// Away stretches merge by their start time across devices.
const mf565MergeBase=mergeStates;
mergeStates=function(a,b){
  const out=mf565MergeBase.apply(this,arguments);
  if(!out||typeof out!=='object')return out;
  out.xpLedger=out.xpLedger||{};
  out.xpLedger.mf565LastSeenAt=Math.max(Number(a?.xpLedger?.mf565LastSeenAt)||0,Number(b?.xpLedger?.mf565LastSeenAt)||0)||undefined;
  out.xpLedger.mf565Away=Object.assign({},a?.xpLedger?.mf565Away||{},b?.xpLedger?.mf565Away||{});
  return out;
};
// Active time keeps counting in the background (v334); a frozen gap is away time.
const MF565_FROZEN_MS=3*60*1000;
const mf565TimeTickBase=v334TimeTick;
v334TimeTick=function(forceSave=false){
  const now=Date.now(),delta=Math.max(0,now-V334_LAST_TICK);
  if(delta>MF565_FROZEN_MS){
    // The browser froze or slept this tab: credit the gap as away time once.
    V334_LAST_TICK=now;
    try{mf565CreditAway(now);}catch(_){}
    mf565Seen(now);
    return;
  }
  if(document.hidden)V334_WAS_VISIBLE=true; // background and idle count too
  const r=mf565TimeTickBase.apply(this,arguments);
  if(document.hidden&&AUTH_READY&&AUTH_USER&&now-V334_LAST_SAVE>=600000){V334_LAST_SAVE=now;if(!V115_STARTUP_GUARD)try{saveState();}catch(_){}}
  mf565Seen(now);
  return r;
};
window.addEventListener('pagehide',()=>{try{mf565Seen(Date.now());v334CheckpointLocalTime();}catch(_){}});
// Leaving the tab saves the last-seen time, so away time starts from the right moment.
let MF565_HIDDEN_SAVE=0;
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='hidden'||!AUTH_READY||!AUTH_USER||V115_STARTUP_GUARD)return;
  mf565Seen(Date.now());
  if(Date.now()-MF565_HIDDEN_SAVE>60000){MF565_HIDDEN_SAVE=Date.now();try{saveState();}catch(_){}}
});
// After the account loads.
const mf565LoadAllBase=loadAll;
loadAll=async function(){
  const result=await mf565LoadAllBase.apply(this,arguments);
  setTimeout(()=>{try{mf565CreditAway();}catch(e){console.warn('MediaFlow v565: away XP skipped',e);}},4000);
  return result;
};

/* ---------- settings (XP & Statistics) ---------- */
function mf565XpSettingsHtml(){
  const field=(key,label,hint,value,step='1')=>'<label class="field mf565-xp-field" data-mf565-setting="'+key+'"><span class="field-label">'+escapeHtml(label)+'</span>'+
    '<input type="number" min="0" step="'+step+'" value="'+escapeHtml(String(value))+'" onchange="App.mf565SetXpRate(\''+key+'\',this.value)"><small class="hint">'+escapeHtml(hint)+'</small></label>';
  return '<div class="mf565-xp-settings">'+
    '<p class="hint">Every action that changes your account earns XP. The same action on the same thing earns once every 5 minutes; 0 turns a kind off.</p>'+
    '<div class="mf565-xp-grid">'+MF565_ACTION_GROUPS.map(([id,label,def])=>field('action.'+id,label,'XP per action',mf565ActionRate(id))).join('')+'</div>'+
    '<div class="mf565-xp-grid">'+
      field('mf565BackupXP','Automatic backup','XP each time a backup is written',v348Rate('mf565BackupXP'))+
      field('mf565RecoveryXP','Recovery finished','XP when a Cover or Metadata Recovery completes',v348Rate('mf565RecoveryXP'))+
      field('mf565FreshCheckXP','Fresh-episode check','XP per check (at most once an hour)',v348Rate('mf565FreshCheckXP'))+
      field('mf565AwayXPPerMinute','Away time XP / minute','While MediaFlow is closed everywhere. Default: a quarter of active time.',Math.round(mf565AwayRate()*100)/100,'0.05')+
    '</div></div>';
}
function mf565SetXpRate(key,value){
  const n=Math.max(0,Math.min(100000,Number(value)||0));
  S.settings=S.settings||{};S.settings.leveling=S.settings.leveling||{};
  if(key.startsWith('action.')){
    const g=key.slice(7);if(!MF565_ACTION_GROUPS.some(x=>x[0]===g))return;
    S.settings.leveling.mf565ActionXP=Object.assign({},S.settings.leveling.mf565ActionXP||{},{[g]:n});
  }else if(['mf565BackupXP','mf565RecoveryXP','mf565FreshCheckXP','mf565AwayXPPerMinute'].includes(key))S.settings.leveling[key]=n;
  else return;
  try{const saved=persistSettings();if(saved&&typeof saved.catch==='function')saved.catch(()=>{});}catch(_){}
}
function mf565MountXpSettings(){
  if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
  if(document.querySelector('.mf565-xp-settings'))return;
  const node=document.createElement('div');node.innerHTML=mf565XpSettingsHtml();
  window.MediaFlowSettingsRegistry?.registerSetting?.({id:'mf565-action-xp',section:'mf565-xp-everywhere',selector:'.mf565-xp-settings',
    label:'XP for every action',subgroup:'Leveling',keywords:['xp','action','away','background','backup','recovery','reward','idle']});
  window.MediaFlowSettingsCenter.mountSection({id:'mf565-xp-everywhere',title:'XP for Every Action & Away Time',category:'progression',subgroup:'Leveling',
    keywords:['xp','action','away time','background','backup','recovery','fresh episodes','reward'],nodes:[node]});
}
MediaFlowRuntime.registerPageEnhancer('settings',mf565MountXpSettings);

App.mf565SetXpRate=mf565SetXpRate;
MF565_ACTION_SKIP.add('mf565SetXpRate'); // changing XP rates doesn't earn XP
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{
  actionGroup:mf565ActionGroup,awardAction:mf565AwardAction,creditAway:mf565CreditAway,awayRate:mf565AwayRate,
  xpStats:()=>({recent:MF565_XP.recent.size,lastSeen:S.xpLedger?.mf565LastSeenAt||0})
});
