
/* MediaFlow v89: functional logging filters with direct event binding */

(function(){

'use strict';

/* ============================================================

   CONSTANTS

   ============================================================ */

const SUPABASE_URL='https://zkmsvqepyraehaeydhpa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_aXInrBauOLd2SDCm4WJOUA_oZjwErgc';
const SUPABASE_CONFIGURED=SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('YOUR_')&&!!SUPABASE_PUBLISHABLE_KEY&&!SUPABASE_PUBLISHABLE_KEY.includes('YOUR_');
let supabase=null,AUTH_USER=null,AUTH_READY=false,AUTH_MODE='login';
if(SUPABASE_CONFIGURED&&window.supabase?.createClient)supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
function renderAuthScreen(mode='login',message='',isError=false){
 AUTH_MODE=mode;
 if(!SUPABASE_CONFIGURED){document.getElementById('app').innerHTML=`<div class="auth-screen"><div class="auth-card"><div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">Media rotation, your way.</div></div></div><div class="auth-title">Cloud accounts need setup</div><div class="auth-sub">This build is account-ready, but it needs your Supabase project URL and publishable key before users can sign up or log in.</div><div class="setup-code">SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'\nSUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...'</div><div class="auth-foot">Use only the publishable/anon key in this browser app. Never expose a service-role or secret key.</div></div></div>`;return;}
 const title=mode==='signup'?'Create your MediaFlow account':'Welcome back',desc=mode==='signup'?'Create an account and keep your MediaFlow library, history, settings and progress synced everywhere.':'Log in to continue to your personal MediaFlow workspace.';
 document.getElementById('app').innerHTML=`<div class="auth-screen"><div class="auth-card"><div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">Media rotation, your way.</div></div></div><div class="auth-title">${title}</div><div class="auth-sub">${desc}</div><div class="auth-tabs"><button class="auth-tab ${mode==='login'?'active':''}" onclick="window.MediaFlowAuth.show('login')">Log in</button><button class="auth-tab ${mode==='signup'?'active':''}" onclick="window.MediaFlowAuth.show('signup')">Sign up</button></div>${message?`<div class="${isError?'auth-error':'auth-success'}">${escapeHtml(message)}</div>`:''}<form onsubmit="return window.MediaFlowAuth.submit(event)"><div class="field"><label class="field-label">Email</label><input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="field"><label class="field-label">Password</label><input id="auth-password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="6" required placeholder="At least 6 characters"></div>${mode==='signup'?`<div class="field"><label class="field-label">Confirm password</label><input id="auth-confirm" type="password" autocomplete="new-password" minlength="6" required placeholder="Repeat your password"></div>`:''}<button class="btn btn-primary btn-block" type="submit">${mode==='signup'?'Create account':'Log in'}</button></form>${mode==='login'?'<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="window.MediaFlowAuth.reset()">Forgot password?</button>':''}<div class="auth-foot">Your account uses Supabase Auth. MediaFlow stores your app state in a private cloud row protected by Row Level Security.</div></div></div>`;
}
function friendlyAuthError(err){return String(err?.message||err||'Authentication failed.').replace('Invalid login credentials','Incorrect email or password.').replace('User already registered','That email is already registered. Try logging in.');}
async function authSubmit(e){e.preventDefault();const email=document.getElementById('auth-email')?.value.trim(),password=document.getElementById('auth-password')?.value||'';if(AUTH_MODE==='signup'&&password!==document.getElementById('auth-confirm')?.value){renderAuthScreen('signup','Passwords do not match.',true);return false;}try{if(AUTH_MODE==='signup'){const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:(location.protocol==='http:'||location.protocol==='https:')?location.href:undefined}});if(error)throw error;if(data.session){AUTH_USER=data.user;await startAuthenticatedApp();}else renderAuthScreen('login','Account created. Check your email to confirm your account, then log in.');}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;AUTH_USER=data.user;await startAuthenticatedApp();}}catch(err){renderAuthScreen(AUTH_MODE,friendlyAuthError(err),true);}return false;}
async function resetPassword(){const email=prompt('Enter your MediaFlow account email:');if(!email)return;try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:(location.protocol==='http:'||location.protocol==='https:')?location.href:undefined});if(error)throw error;renderAuthScreen('login','Password reset email sent. Check your inbox.');}catch(err){renderAuthScreen('login',friendlyAuthError(err),true);}}
async function signOut(){if(AUTH_USER&&supabase)await supabase.auth.signOut();AUTH_USER=null;AUTH_READY=false;renderAuthScreen('login','You have been logged out.');}
function getDisplayName(){const name=String(AUTH_USER?.user_metadata?.display_name||'').trim();return name||String(AUTH_USER?.email||'').trim()||'Account';}
function profileInitials(){const display=getDisplayName();const parts=display.split(/\s+/).filter(Boolean);if(parts.length>1)return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();return display.slice(0,1).toUpperCase()||'?';}
function getAvatarUrl(){return String(S.profilePicture||AUTH_USER?.user_metadata?.avatar_url||'').trim();}
function renderAccountAvatar(){const url=getAvatarUrl();return url?`<img class="account-avatar" src="${escapeHtml(url)}" alt="Profile picture">`:`<span class="account-avatar">${escapeHtml(profileInitials())}</span>`;}
function renderProfileAvatar(){const url=getAvatarUrl();return url?`<div class="profile-avatar"><img src="${escapeHtml(url)}" alt="Profile picture"></div>`:`<div class="profile-avatar">${escapeHtml(profileInitials())}</div>`;}
async function refreshAuthUser(){
 try{const {data,error}=await supabase.auth.getUser();if(error)throw error;if(data?.user)AUTH_USER=data.user;}catch(err){console.error('MediaFlow: could not refresh auth user',err);}
}
async function updateAccountName(){
 const input=document.getElementById('profile-name');
 const name=input?.value.trim()||'';
 const btn=input?.closest('.card')?.querySelector('button.btn-primary');
 if(btn){btn.disabled=true;btn.textContent='Saving…';}
 try{
   const {error}=await supabase.auth.updateUser({data:{display_name:name||null}});
   if(error)throw error;
   await refreshAuthUser();
   render();
   alert(name?'Name updated successfully.':'Name removed. Your email will be shown instead.');
 }catch(err){
   if(btn){btn.disabled=false;btn.textContent='Save name';}
   alert(friendlyAuthError(err));
 }
}
async function updateAccountEmail(){
 const input=document.getElementById('profile-email'); const email=input?.value.trim();
 if(!email||!email.includes('@')){alert('Enter a valid email address.');return;}
 if(email===String(AUTH_USER?.email||'').trim()){alert('That is already your current email.');return;}
 try{const {error}=await supabase.auth.updateUser({email});if(error)throw error;await refreshAuthUser();render();alert('Email update requested. Check your email and follow the confirmation link if Supabase requires confirmation.');}catch(err){alert(friendlyAuthError(err));}
}
async function updateAccountPassword(){
 const a=document.getElementById('profile-password'); const b=document.getElementById('profile-password-confirm');
 const password=a?.value||'',confirm=b?.value||'';
 if(password.length<6){alert('Password must be at least 6 characters.');return;}
 if(password!==confirm){alert('Passwords do not match.');return;}
 try{const {error}=await supabase.auth.updateUser({password});if(error)throw error;a.value='';b.value='';alert('Password updated successfully.');}catch(err){alert(friendlyAuthError(err));}
}
async function readAndStoreAvatar(file,autoSave=false){
 if(!file)return;
 if(!file.type.startsWith('image/')){alert('Please choose an image file.');return;}
 const reader=new FileReader();
 reader.onload=()=>{
   const img=new Image();
   img.onload=async()=>{
     try{
       // Keep profile pictures small enough to safely live inside the user's MediaFlow cloud state.
       const max=128,scale=Math.min(1,max/Math.max(img.width,img.height));
       const canvas=document.createElement('canvas');
       canvas.width=Math.max(1,Math.round(img.width*scale));
       canvas.height=Math.max(1,Math.round(img.height*scale));
       const ctx=canvas.getContext('2d');
       ctx.drawImage(img,0,0,canvas.width,canvas.height);
       const dataUrl=canvas.toDataURL('image/jpeg',0.72);
       const previous=S.profilePicture||'';
       S.profilePicture=dataUrl;
       try{
         await saveState();
         render();
       }catch(err){
         S.profilePicture=previous;
         throw err;
       }
     }catch(err){alert(friendlyAuthError(err));}
   };
   img.onerror=()=>alert('Could not read that image.');
   img.src=reader.result;
 };
 reader.readAsDataURL(file);
}
async function saveProfilePicture(){
  const btn=document.getElementById('save-profile-picture');
  const original=btn?.textContent||'Save picture';
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    lastSaveFailed=false;
    await saveState();
    if(lastSaveFailed) throw new Error('Could not save your profile picture to cloud storage.');
    if(btn){btn.disabled=false;btn.textContent='Saved ✓';setTimeout(()=>{if(btn&&document.body.contains(btn))btn.textContent=original;},1400);}
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent=original;}
    alert(friendlyAuthError(err));
  }
}
function chooseProfilePicture(file){ return readAndStoreAvatar(file,false); }
async function setProfilePictureFromUrl(){
 const input=document.getElementById('profile-picture-url');
 const raw=String(input?.value||'').trim();
 if(!raw){alert('Paste an image URL first.');return;}
 let url='';
 try{
   const parsed=new URL(raw);
   if(parsed.protocol!=='https:'&&parsed.protocol!=='http:')throw new Error('protocol');
   url=parsed.href;
 }catch(e){
   alert('Enter a valid http:// or https:// image URL.');
   return;
 }
 const previous=S.profilePicture||'';
 const btn=document.getElementById('use-profile-picture-url');
 const original=btn?.textContent||'Use URL';
 if(btn){btn.disabled=true;btn.textContent='Saving…';}
 try{
   S.profilePicture=url;
   lastSaveFailed=false;
   await saveState();
   if(lastSaveFailed)throw new Error('Could not save your profile picture URL.');
   render();
 }catch(err){
   S.profilePicture=previous;
   if(btn){btn.disabled=false;btn.textContent=original;}
   alert(friendlyAuthError(err));
 }
}

async function removeAvatar(){
 const previous=S.profilePicture||'';
 try{
   S.profilePicture='';
   await saveState();
   render();
 }catch(err){
   S.profilePicture=previous;
   render();
   alert(friendlyAuthError(err));
 }
}
window.MediaFlowAuth={show:renderAuthScreen,submit:authSubmit,reset:resetPassword,logout:signOut};
window.MediaFlowProfile={updateName:updateAccountName,updateEmail:updateAccountEmail,updatePassword:updateAccountPassword,chooseAvatar:chooseProfilePicture,useAvatarUrl:setProfilePictureFromUrl,saveAvatar:saveProfilePicture,removeAvatar};

const UNITS = {

  episodes: {label:'episodes', singular:'episode'},

  chapters: {label:'chapters', singular:'chapter'},

  movies:   {label:'movies', singular:'movie'},

  issues:   {label:'issues', singular:'issue'},

};

const DEFAULT_CATEGORIES = [

  {id:'seasonal',    name:'Seasonal Anime',      icon:'🔴', type:'video',   unit:'episodes', target:4,  weight:4, minutesPerUnit:24,  color:'#E8607A', seasonal:true,  enabled:true, custom:false},

  {id:'backlog',     name:'Anime Backlog',       icon:'🟢', type:'video',   unit:'episodes', target:5,  weight:3, minutesPerUnit:24,  color:'#3FC7A6', seasonal:false, enabled:true, custom:false},

  {id:'tv',          name:'TV Series',           icon:'📺', type:'video',   unit:'episodes', target:2,  weight:3, minutesPerUnit:42,  color:'#5AA9E6', seasonal:false, enabled:true, custom:false},

  {id:'otheranim',   name:'Other Animation',     icon:'🎨', type:'video',   unit:'episodes', target:2,  weight:2, minutesPerUnit:24,  color:'#F5A3D0', seasonal:false, enabled:true, custom:false},

  {id:'movies',      name:'Movies',              icon:'🎥', type:'video',   unit:'movies',   target:1,  weight:3, minutesPerUnit:115, color:'#E8A94A', seasonal:false, enabled:true, custom:false},

  {id:'animemovies', name:'Anime Movies',        icon:'🎞️', type:'video',   unit:'movies',   target:1,  weight:2, minutesPerUnit:100, color:'#C98CF5', seasonal:false, enabled:true, custom:false},

  {id:'manga',       name:'Manga',               icon:'📖', type:'reading', unit:'chapters', target:20, weight:4, minutesPerUnit:6,   color:'#9C8CF5', seasonal:false, enabled:true, custom:false},

  {id:'manhwa',      name:'Manhwa / Manhua',     icon:'📚', type:'reading', unit:'chapters', target:20, weight:3, minutesPerUnit:4,   color:'#4FD1C5', seasonal:false, enabled:true, custom:false},

  {id:'comics',      name:'Western Comics',      icon:'📰', type:'reading', unit:'issues',   target:3,  weight:2, minutesPerUnit:15,  color:'#F5C56A', seasonal:false, enabled:true, custom:false},

];

const DEFAULT_SETTINGS = {

  dailyMinutes: 180,

  tasksPerDay: 5,

  intensity: 'normal',

  neglectRate: 6,        // score / day untouched

  neglectCap: 42,

  repetitionPenalty: 12, // per occurrence in recent window

  consecutivePenalty: 26,// per consecutive repeat

  saturationWeight: 20,

  seasonalBonus: 15,

  randomness: 0.28,      // jitter fraction

  seasonalFreshCount: 0,
  seasonalFreshAuto: true,          // v166: derive fresh Seasonal Anime titles from Jikan/MAL episode data
  seasonalFreshSyncMinutes: 60,     // v166: background refresh cadence
  seasonalFreshLastSyncAt: 0,
  seasonalFreshLastProvider: 'Jikan / MyAnimeList',
  seasonalFreshLastMatched: 0,
  seasonalFreshLastEpisodeTotal: 0,
  exactTitleRecommendations: false,
  prioritizePersonalOrder: false, // v139: when exact-title recommendations are enabled, prefer the first eligible title in Personal Order for the selected category
  customCategoryIcons: [], // v144: reusable [{type:'emoji'|'url',value:string}] category icon palette
  customCategoryColors: [], // v144: reusable #RRGGBB category color palette
  highlightDefaultCategories: true, // v171: visually identify categories whose IDs belong to MediaFlow defaults
  mediaServicesImportInterface: 'advanced', // v172: normal | advanced; advanced is recommended/default
  v175PageSizes: {library:50,orderLibrary:20,loggingLibrary:20,batchLibrary:20,modifiedAt:0}, // configurable pagination for Library surfaces
  v177CoverSizes: {library:100,order:100,modifiedAt:0}, // percentage scale for Library / Order title covers
  v179LoggingModes: {single:'amount',batch:'amount',modifiedAt:0}, // legacy v179 preference container; v181 uses a single default + temporary per-page switches
  v181Logging: {defaultMode:'progress',modifiedAt:0}, // progress is recommended/default; page switches remain temporary
  v181Library: {mode:'classic',categoryOrder:[],hiddenCategoryIds:[],statusOrder:['active','paused','completed','dropped','planned'],activeCategoryId:'',activeStatus:'active',modifiedAt:0},
  v181CoverSizes: {library:100,order:100,recommended:100,rating:100,onThisDayFirst:100,onThisDayList:100,logging:100,history:100,rerollHistory:100,modifiedAt:0},
  dynamicCoverTheme: false, // v146: dynamic full-cover theme mode; recommended cover -> On This Day -> selected theme
  theme: 'dark',
  globalAppearanceEnabled: true, // v132: when false, themes use their original/native appearance with no global Light/Dark override
  appearanceMode: '', // v106/v132: saved Light/Dark preference used only while Global appearance is enabled
  backup: {enabled:false, interval:60, mode:'single', folderName:'', fileName:'mediaflow-backup.json'},
  leveling: {
    enabled: true,
    minuteXP: 1,
    unitXP: {episodes:10, chapters:3, issues:6, movies:30},
    rotationMultiplier: {neglected:2.0, due:1.5, healthy:1.0, overused:0.5},
    libraryAdditionXP: 25,
    completionXP: 50
  },

};

const INTENSITY_PRESETS = {

  light:    {tasksPerDay:3, dailyMinutes:90,  label:'Light',    desc:'2–3 tasks'},

  normal:   {tasksPerDay:5, dailyMinutes:180, label:'Normal',   desc:'4–6 tasks'},

  marathon: {tasksPerDay:8, dailyMinutes:300, label:'Marathon', desc:'7–10+ tasks'},

};

const ICON_CHOICES = ['🔴','🟢','📺','🎨','🎥','🎞️','📖','📚','📰','🌊','⚡','🧩','🎮','🎭','🎧','📼','🀄','🖼️','🕹️','✨'];

const COLOR_CHOICES = ['#E8607A','#3FC7A6','#5AA9E6','#F5A3D0','#E8A94A','#C98CF5','#9C8CF5','#4FD1C5','#F5C56A','#7EE787','#F58A5A','#6AD1E3'];

/* ============================================================

   STATE

   ============================================================ */

let S = {

  categories: null,

  categoryOrder: [],

  library: null,

  sessions: null,

  settings: null,

  currentTask: null,

  sessionActive: false,

  view: 'dashboard',

  loading: true,

  modal: null,          // {type:'category'|'library', data:{...}} or null

  logging: false,       // is the inline log form open on the hero

  logDraft: {},

  entryDraft: {title:'', qty:1},
  batchDraft: {rows:[], note:'', date:''},

  histFilters: {category:'all', type:'all', range:'all'},
  histPage: 0,
  histPageSize: 50,

  showReasonDetail: false,

  profileReturnView: 'dashboard',

  profilePicture: '',
  offlineMode: false,
  stopwatch: {running:false, startedAt:0, elapsed:0, resetValue:0},
  malLink: {username:'', mode:'anime'},
  xpLedger: {libraryAdditions:{}},
  completionTimeline: [],
  statsRecapMonth: '',
  statsHeatmapYear: '',

  // v138: lightweight personal title-order planner. This is deliberately
  // independent from scheduler recommendations, History, progress and XP.
  orderPlan: {
    titleIds: [],
    viewMode: 'all',
    categoryMode: 'default',
    categoryOrder: [],
    hiddenCategories: [],
    modifiedAt: 0,
    lastClearedOrder: null
  },

};

/* ============================================================

   STORAGE

   All app data lives under ONE key so every save is a single atomic

   write — this avoids the race where a quick refresh lands between

   several in-flight writes and loses data. Every mutation calls

   saveState() and AWAITS it before anything else can run.

   ============================================================ */

/* ============================================================
   MediaFlow v63 — Cloud Library History Persistence
   Library History (activityLog) is now part of the canonical cloud
   snapshot and cloud/local merge path, so it follows the account
   across devices instead of starting empty on each browser.
   ============================================================ */
/* ============================================================
   MediaFlow v63 — Library History XP Visibility
   Library History entries now store the XP earned by the exact
   tracked Library transaction and render it beside the action.
   ============================================================ */
/* ============================================================
   MediaFlow v63 — Library History Integrity & Large-Library Fix
   - exact Library IDs for new history events
   - no substring title guessing
   - safe exact-match migration for legacy history
   - one-pass lookup maps for large libraries
   - XP history preserved without re-awarding
   ============================================================ */
const STATE_KEY = 'mf_state_v2';

const LEGACY_KEYS = ['mf_categories','mf_library','mf_sessions','mf_settings','mf_currentTask','mf_sessionActive'];

let saveQueue = Promise.resolve();

let lastSaveFailed = false;

let STORAGE_MODE = 'cloud';
const CLOUD_CACHE_KEY='mf_cloud_cache_v1';
let memoryStore={};
async function localRawGet(key){try{const v=localStorage.getItem(key);return v===null?undefined:JSON.parse(v);}catch(e){return undefined;}}
function localSetRaw(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}

/* ============================================================
   MediaFlow v115 — Cloud Data Loss Prevention & Recovery Guard
   - Never treats a failed/missing cloud read as permission to overwrite data.
   - Blocks all normal cloud writes until startup has been safely resolved.
   - Keeps a per-account local safety cache and can recover newer unsynced state.
   - Requires an explicit user decision before replacing suspicious cloud state.
   ============================================================ */
const V115_USER_CACHE_PREFIX='mf_cloud_cache_v2_';
let V115_STARTUP_GUARD=true;
let V115_BOOTSTRAP_OVERRIDE=false;
let V115_BOOTSTRAP_DATA=undefined;
let V115_RECOVERY_CONTEXT=null;

function v115UserCacheKey(){
  return V115_USER_CACHE_PREFIX+String(AUTH_USER?.id||'unknown');
}
function v115StateStats(state){
  const x=(state&&typeof state==='object')?state:{};
  const library=Array.isArray(x.library)?x.library.length:0;
  const sessions=Array.isArray(x.sessions)?x.sessions.length:0;
  const activity=Array.isArray(x.activityLog)?x.activityLog.length:0;
  const completions=Array.isArray(x.completionTimeline)?x.completionTimeline.length:0;
  const xpEntries=Object.keys(x.xpLedger?.libraryAdditions||{}).length;
  const savedAt=Number(x.savedAt)||0;
  return {library,sessions,activity,completions,xpEntries,savedAt,core:library+sessions+activity+completions+xpEntries};}
function v115HasMeaningfulState(state){
  if(!state||typeof state!=='object')return false;
  const st=v115StateStats(state);
  return st.core>0 || !!state.profilePicture || !!state.profileName || !!state.currentTask || !!state.sessionActive || st.savedAt>0;
}
function v115AccountLooksNew(){
  const created=Date.parse(String(AUTH_USER?.created_at||''));
  return Number.isFinite(created) && (Date.now()-created)<15*60*1000;
}
function v115WriteRecoveryCache(state,serializedState){
  if(!AUTH_USER||!state||typeof state!=='object')return false;
  try{
    // v134: stringify the potentially huge MediaFlow state only once.
    // The account-scoped wrapper is assembled around the already-serialized
    // state, while the legacy cache receives the exact same state JSON.
    const stateJson=typeof serializedState==='string'?serializedState:JSON.stringify(state);
    const cachedAt=Date.now();
    const wrappedJson=`{"__mediaflowCacheV2":1,"userId":${JSON.stringify(String(AUTH_USER.id))},"cachedAt":${cachedAt},"state":${stateJson}}`;
    let ok=false;
    try{localStorage.setItem(v115UserCacheKey(),wrappedJson);ok=true;}catch(_){}
    // Keep the legacy cache updated for backward compatibility with older builds.
    try{localStorage.setItem(CLOUD_CACHE_KEY,stateJson);}catch(_){}
    return ok;
  }catch(_){
    return false;
  }
}
async function v115ReadRecoveryCache(){
  try{
    const scoped=await localRawGet(v115UserCacheKey());
    if(scoped&&scoped.__mediaflowCacheV2===1&&scoped.userId===AUTH_USER?.id&&scoped.state&&typeof scoped.state==='object'){
      return {state:scoped.state,source:'account',cachedAt:Number(scoped.cachedAt)||Number(scoped.state.savedAt)||0};
    }
  }catch(_){}
  try{
    const legacy=await localRawGet(CLOUD_CACHE_KEY);
    if(legacy&&typeof legacy==='object')return {state:legacy,source:'legacy',cachedAt:Number(legacy.savedAt)||0};
  }catch(_){}
  return null;
}
async function v115FetchCloudState(){
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');
  const {data,error}=await supabase.from('mediaflow_states').select('state_data,updated_at').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error)throw error;
  if(!data)return {found:false,state:undefined,updatedAt:null};
  return {found:true,state:await decodeCloudState(data.state_data??undefined),updatedAt:data.updated_at||null};
}
function v115FormatWhen(ts){
  if(!ts)return 'unknown time';
  try{return new Date(ts).toLocaleString();}catch(_){return 'unknown time';}
}
function v115RenderSafetyScreen(ctx){
  V115_RECOVERY_CONTEXT=ctx;
  const app=document.getElementById('app');
  if(!app)return;
  const cache=ctx.cache||null;
  const localStats=v115StateStats(cache?.state);
  const cloudStats=v115StateStats(ctx.cloud?.state);
  const localSummary=cache&&v115HasMeaningfulState(cache.state)
    ? `<div class="card" style="margin:14px 0;padding:14px"><b>Local safety copy found</b><div class="auth-sub" style="margin:6px 0 0">${localStats.library.toLocaleString()} Library titles · ${localStats.sessions.toLocaleString()} consumption logs · ${localStats.activity.toLocaleString()} Library History events<br>Last local snapshot: ${escapeHtml(v115FormatWhen(cache.cachedAt||localStats.savedAt))}${cache.source==='legacy'?'<br><span style="color:var(--flow)">Legacy cache: confirm it belongs to this MediaFlow account before restoring.</span>':''}</div></div>`
    : '';
  let title='Cloud data safety check';
  let message='MediaFlow stopped before writing anything to your account.';
  let actions='';
  if(ctx.kind==='cloud-error'){
    title='Could not safely read cloud data';
    message=`MediaFlow could not read your Supabase state. To prevent an accidental reset, the app did not load defaults and did not write anything to the cloud.<br><br><b>${escapeHtml(String(ctx.error?.message||ctx.error||'Cloud read failed.'))}</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.retry()">Retry cloud connection</button>`;
  }else if(ctx.kind==='missing'){
    title='Cloud state is missing';
    message='This account did not return a MediaFlow cloud row. MediaFlow will not assume that means your data should be reset.';
    actions=`${cache&&v115HasMeaningfulState(cache.state)?'<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Restore local safety copy to cloud</button>':''}<button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">Retry cloud connection</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.startEmpty()">I intentionally want an empty workspace</button>`;
  }else if(ctx.kind==='cloud-empty'){
    title='Cloud state looks unexpectedly empty';
    message=`The cloud row exists, but it contains much less data than the local safety copy. MediaFlow blocked the startup write so the larger copy cannot be silently replaced.<br><br>Cloud: <b>${cloudStats.library.toLocaleString()} titles · ${cloudStats.sessions.toLocaleString()} logs</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local safety copy with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">Retry first</button>`;
  }else if(ctx.kind==='local-newer'){
    title='Unsynced local changes detected';
    message=`The local safety copy is newer than the cloud snapshot. This can happen if a previous cloud save failed. MediaFlow will not discard the newer local state automatically.<br><br>Cloud snapshot: <b>${escapeHtml(v115FormatWhen(Number(ctx.cloud?.state?.savedAt)||Date.parse(ctx.cloud?.updatedAt||'')||0))}</b><br>Local snapshot: <b>${escapeHtml(v115FormatWhen(localStats.savedAt||cache?.cachedAt))}</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local changes with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button>`;
  }
  app.innerHTML=`<div class="auth-screen"><div class="auth-card" style="width:min(560px,100%)"><div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">v115 data protection</div></div></div><div class="auth-title">${title}</div><div class="auth-sub">${message}</div>${localSummary}<div style="margin-top:16px">${actions}</div><div class="auth-foot">Safety rule: a missing, failed, or suspicious cloud read can never automatically overwrite your MediaFlow account.</div></div></div>`;
}
async function v115StartWithData(data){
  V115_STARTUP_GUARD=true;
  V115_BOOTSTRAP_DATA=data;
  V115_BOOTSTRAP_OVERRIDE=true;
  try{
    await loadAll();
  }finally{
    V115_BOOTSTRAP_OVERRIDE=false;
  }
  V115_STARTUP_GUARD=false;
  // Cache the exact source snapshot, not a newly timestamped snapshot. This keeps
  // savedAt meaningful so a normal app launch is never mistaken for an unsynced edit.
  try{if(data&&typeof data==='object')v115WriteRecoveryCache(data);}catch(_){}
  renderShell();
}
async function v115SafeBootstrap(){
  V115_STARTUP_GUARD=true;
  let cache=null;
  try{cache=await v115ReadRecoveryCache();}catch(_){}
  let cloud;
  try{
    cloud=await v115FetchCloudState();
  }catch(error){
    v115RenderSafetyScreen({kind:'cloud-error',error,cache});
    return false;
  }
  const localState=cache?.state;
  const localStats=v115StateStats(localState);
  const cloudStats=v115StateStats(cloud.state);
  const localMeaningful=cache&&v115HasMeaningfulState(localState);

  if(!cloud.found){
    if(localMeaningful || !v115AccountLooksNew()){
      v115RenderSafetyScreen({kind:'missing',cloud,cache});
      return false;
    }
    await v115StartWithData(undefined);
    return true;
  }

  // If cloud is effectively empty but this account has a populated local cache,
  // require an explicit recovery decision instead of silently trusting the empty row.
  if(localMeaningful && localStats.core>0 && cloudStats.core===0){
    v115RenderSafetyScreen({kind:'cloud-empty',cloud,cache});
    return false;
  }

  // A user-scoped cache newer than the cloud usually means a previous save failed.
  // Do not discard it on refresh; let the user merge or explicitly choose cloud.
  const localSaved=Number(localStats.savedAt)||0;
  const cloudSaved=Number(cloudStats.savedAt)||0;
  if(cache?.source==='account' && localMeaningful && localSaved>0 && cloudSaved>0 && localSaved>cloudSaved+15000){
    v115RenderSafetyScreen({kind:'local-newer',cloud,cache});
    return false;
  }

  try{if(cloud.state&&typeof cloud.state==='object')v115WriteRecoveryCache(cloud.state);}catch(_){}
  await v115StartWithData(cloud.state);
  return true;
}
window.MediaFlowRecovery={
  async retry(){
    const app=document.getElementById('app');if(app)app.innerHTML='<div class="loader-wrap">Retrying MediaFlow cloud…</div>';
    await startAuthenticatedApp();
  },
  async restore(){
    const ctx=V115_RECOVERY_CONTEXT,local=ctx?.cache?.state;
    if(!local)return;
    const app=document.getElementById('app');if(app)app.innerHTML='<div class="loader-wrap">Recovering MediaFlow data…</div>';
    try{
      const recovered=ctx?.cloud?.found&&ctx.cloud.state?mergeStates(local,ctx.cloud.state):local;
      await rawSet(STATE_KEY,recovered);
      await v115StartWithData(recovered);
      showToast('MediaFlow data recovered and protected ✓');
    }catch(error){v115RenderSafetyScreen({kind:'cloud-error',error,cache:ctx?.cache||null});}
  },
  async useCloud(){
    const ctx=V115_RECOVERY_CONTEXT;
    if(!ctx?.cloud?.found)return;
    await v115StartWithData(ctx.cloud.state);
  },
  async startEmpty(){
    if(!confirm('Start with an empty MediaFlow workspace? This is only for a genuinely new/empty account. Existing cloud data will not be written over until you make a later change.'))return;
    await v115StartWithData(undefined);
  }
};
async function encodeCloudState(value,serializedJson){
  // Large MediaFlow histories can make the single JSONB row expensive to update.
  // Compress the state in browsers that support CompressionStream before sending it.
  // v134 accepts a pre-serialized state so Sync/Save does not stringify it again.
  const json=typeof serializedJson==='string'?serializedJson:JSON.stringify(value);
  try{
    if(typeof CompressionStream==='function' && typeof TextEncoder!=='undefined'){
      const cs=new CompressionStream('gzip');
      const writer=cs.writable.getWriter();
      writer.write(new TextEncoder().encode(json));
      writer.close();
      const buf=await new Response(cs.readable).arrayBuffer();
      let binary='';
      const bytes=new Uint8Array(buf);
      const chunk=0x8000;
      for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
      return {__mediaflowCompressed:'gzip',data:btoa(binary)};
    }
  }catch(e){
    console.warn('MediaFlow: compression unavailable, saving normally.',e);
  }
  return value;
}

async function decodeCloudState(value){
  if(!value || value.__mediaflowCompressed!=='gzip') return value;
  try{
    if(typeof DecompressionStream!=='function' || typeof TextDecoder==='undefined') throw new Error('DecompressionStream unavailable');
    const binary=atob(value.data||'');
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const ds=new DecompressionStream('gzip');
    const writer=ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const text=await new Response(ds.readable).text();
    return JSON.parse(text);
  }catch(e){
    throw new Error('MediaFlow cloud data could not be decompressed. Try another Chromium-based browser or restore from a JSON backup.');
  }
}

async function rawGet(key){
  if(V115_BOOTSTRAP_OVERRIDE&&key===STATE_KEY)return V115_BOOTSTRAP_DATA;
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');
  const {data,error}=await supabase.from('mediaflow_states').select('state_data').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error)throw error;
  return await decodeCloudState(data?.state_data??undefined);
}

async function rawSet(key,value){
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');

  // v134: one full JSON serialization feeds cloud compression and both protected
  // recovery caches. v133 could stringify the same very large state three times.
  const serializedState=JSON.stringify(value);
  if(serializedState.length>750000) await new Promise(r=>setTimeout(r,0));
  const payload=await encodeCloudState(value,serializedState);

  // Keep a per-account local copy as a safety net while the cloud write is in flight.
  // v115 keeps the legacy key too, but recovery prefers the account-scoped cache.
  try{ v115WriteRecoveryCache(value,serializedState); }catch(_){}

  let lastError=null;
  const delays=[0,450,1000,2000,4000];
  for(let attempt=0;attempt<delays.length;attempt++){
    if(delays[attempt]) await new Promise(r=>setTimeout(r,delays[attempt]));
    try{
      const {error}=await supabase.from('mediaflow_states').upsert({user_id:AUTH_USER.id,state_data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(!error) return true;
      lastError=error;
      const code=String(error?.code||'');
      if(code!=='57014' && !/timeout|canceling statement/i.test(String(error?.message||''))) throw error;
      if(attempt<delays.length-1) console.warn(`MediaFlow: cloud save timed out, retrying (${attempt+1}/${delays.length-1})...`);
    }catch(e){
      lastError=e;
      const code=String(e?.code||'');
      const timeout=code==='57014' || /timeout|canceling statement/i.test(String(e?.message||''));
      if(!timeout || attempt===delays.length-1) throw e;
      console.warn(`MediaFlow: cloud save timed out, retrying (${attempt+1}/${delays.length-1})...`);
    }
  }
  throw lastError||new Error('MediaFlow cloud save failed.');
}
function v84MergeLibraryItem(left,right){
  if(!left) return right ? Object.assign({},right) : null;
  if(!right) return Object.assign({},left);
  const lm=Number(left.modifiedAt||0), rm=Number(right.modifiedAt||0);
  const newer=rm>lm?right:left, older=rm>lm?left:right;
  const out=Object.assign({},older,newer);
  const nonEmpty=(a,b)=>{ const av=a!==undefined&&a!==null&&a!==''; const bv=b!==undefined&&b!==null&&b!==''; if(av&&bv) return rm>lm?b:a; return av?a:b; };
  out.id=nonEmpty(left.id,right.id)||uid();
  out.title=cleanTitle(nonEmpty(left.title,right.title)||'Untitled');
  out.categoryId=nonEmpty(left.categoryId,right.categoryId)||S.categories?.[0]?.id||'backlog';
  out.progress=Math.max(Number(left.progress)||0,Number(right.progress)||0);
  // Keep an explicitly known total from either side. If both differ, prefer the newer edited copy.
  const lt=left.total==null||left.total===''?null:Number(left.total), rt=right.total==null||right.total===''?null:Number(right.total);
  out.total=(lt!=null&&rt!=null)?(rm>lm?rt:lt):(lt!=null?lt:rt);
  const statusRank={dropped:0,planned:1,paused:2,active:3,completed:4};
  out.status=(statusRank[left.status]||0)>(statusRank[right.status]||0)?left.status:(right.status||left.status||'planned');
  const pr={low:1,medium:2,high:3}; out.priority=(pr[left.priority]||0)>=(pr[right.priority]||0)?(left.priority||'medium'):(right.priority||'medium');
  out.tags=[...new Set([...(Array.isArray(left.tags)?left.tags:[]),...(Array.isArray(right.tags)?right.tags:[])])];
  out.externalIds=Object.assign({},left.externalIds||{},right.externalIds||{});
  // v84: never let an empty device copy erase useful per-title metadata from cloud/another device.
  for(const k of ['coverUrl','coverSource','source','year','simklAddedAt','estimatedMinutes','startedAt','startedAtSource']) out[k]=nonEmpty(left[k],right[k]);
  const lr=Number(left.rating), rr=Number(right.rating); out.rating=lr>0&&rr>0?(rm>lm?rr:lr):(lr>0?lr:(rr>0?rr:null));
  out.manualRepeatAmount=Math.max(0,Number(left.manualRepeatAmount)||0,Number(right.manualRepeatAmount)||0);
  out.createdAt=Math.min(...[Number(left.createdAt)||0,Number(right.createdAt)||0].filter(Boolean))||Date.now();
  out.completedAt=nonEmpty(left.completedAt,right.completedAt)||null;
  out.modifiedAt=Math.max(lm,rm,Number(out.modifiedAt)||0);
  return out;
}
function mergeStates(a,b){
  if(!a)return b||{}; if(!b)return a;
  const out=Object.assign({},b,a);
  // v84: merge every Library title field instead of rebuilding titles from a small legacy field subset.
  // Match stable IDs first, then title/category for older imports that may have different IDs.
  const merged=[]; const byId=new Map(), byKey=new Map();
  const add=(x)=>{
    if(!x||typeof x!=='object')return;
    const key=cleanTitle(x.title).toLowerCase()+'::'+(x.categoryId||'');
    let idx=(x.id&&byId.has(x.id))?byId.get(x.id):(key&&byKey.has(key)?byKey.get(key):null);
    if(idx==null){idx=merged.length;merged.push(Object.assign({},x));if(x.id)byId.set(x.id,idx);if(key)byKey.set(key,idx);}
    else {merged[idx]=v84MergeLibraryItem(merged[idx],x);if(merged[idx].id)byId.set(merged[idx].id,idx);const nk=cleanTitle(merged[idx].title).toLowerCase()+'::'+(merged[idx].categoryId||'');if(nk)byKey.set(nk,idx);}
  };
  (b.library||[]).forEach(add); (a.library||[]).forEach(add); out.library=merged;
  const sessions=new Map(); [...(b.sessions||[]),...(a.sessions||[])].forEach(x=>sessions.set(x.id||uid(),x)); out.sessions=[...sessions.values()].sort((x,y)=>(x.timestamp||0)-(y.timestamp||0));
  out.xpLedger=Object.assign({libraryAdditions:{}},b.xpLedger||{},a.xpLedger||{}); out.xpLedger.libraryAdditions=Object.assign({},b.xpLedger?.libraryAdditions||{},a.xpLedger?.libraryAdditions||{});
  const activityById=new Map(); [...(b.activityLog||[]),...(a.activityLog||[])].forEach(x=>{if(!x||typeof x!=='object')return;const k=x.id||`${x.timestamp||0}::${x.action||''}::${x.detail||''}`;const prev=activityById.get(k);if(!prev||Number(x.timestamp||0)>=Number(prev.timestamp||0))activityById.set(k,x);});
  out.activityLog=[...activityById.values()].sort((x,y)=>Number(y.timestamp||0)-Number(x.timestamp||0)).slice(0,1000);
  out.migrations=Object.assign({},b.migrations||{},a.migrations||{});
  out.categories=a.categories||b.categories; out.categoryOrder=a.categoryOrder||a.settings?.categoryOrder||b.categoryOrder||b.settings?.categoryOrder||[]; out.settings=Object.assign({},b.settings||{},a.settings||{}); if(out.categoryOrder.length) out.settings.categoryOrder=out.categoryOrder.slice(); out.currentTask=a.currentTask||b.currentTask; out.sessionActive=a.sessionActive??b.sessionActive; out.profilePicture=a.profilePicture||b.profilePicture||'';
  return out;
}
function snapshot(){

  return {

    categories: S.categories, categoryOrder: v74SyncCategoryOrder().slice(), library: S.library, sessions: S.sessions,

    settings: S.settings, currentTask: S.currentTask, sessionActive: S.sessionActive,

    profilePicture: S.profilePicture || '',
    stopwatch: S.stopwatch || {running:false,startedAt:0,elapsed:0,resetValue:0},
    malLink: S.malLink || {username:'',mode:'anime'},
    xpLedger: S.xpLedger || {libraryAdditions:{}},
    completionTimeline: S.completionTimeline || [],
    // v50: Library History is account data, not device-only UI state.
    // Persist it in the same atomic cloud snapshot as Library + consumption History.
    activityLog: Array.isArray(S.activityLog) ? S.activityLog.slice(0,1000) : [],
    migrations: S.migrations || {},

    savedAt: Date.now(),

  };

}

// Serialize saves so two rapid actions never race each other; always await the tail.

function saveState(){
  // v115: startup/load code is never allowed to upload defaults or partial state.
  // Normal writes are enabled only after the cloud/local source has been resolved safely.
  if(V115_STARTUP_GUARD){
    console.warn('MediaFlow v115: blocked a cloud save during protected startup/recovery.');
    return Promise.resolve(false);
  }
  // Serialize saves so concurrent UI actions cannot overwrite each other.
  // Each queued save snapshots only when its turn begins, so a burst of actions
  // always ends with the newest state rather than a pile of stale uploads.
  saveQueue = saveQueue.then(async ()=>{
    try{
      await rawSet(STATE_KEY, snapshot());
      if(lastSaveFailed){ lastSaveFailed=false; hideSaveError(); }
    }catch(e){
      console.error('MediaFlow: save failed', e);
      lastSaveFailed = true; showSaveError();
    }
  });
  return saveQueue;
}

function showSaveError(){

  let bar = document.getElementById('save-error-bar');

  if(!bar){

    bar = document.createElement('div');

    bar.id='save-error-bar';

    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#E8607A;color:#1a0a0d;font-weight:700;font-size:13px;text-align:center;padding:9px;z-index:999;';

    bar.textContent = "Cloud save is taking longer than expected. MediaFlow is retrying automatically; your data is also kept locally until the cloud save succeeds.";

    document.body.appendChild(bar);

  }

}

function hideSaveError(){ const bar=document.getElementById('save-error-bar'); if(bar) bar.remove(); }

function showMemoryModeNotice(){

  if(document.getElementById('memory-mode-bar')) return;

  const bar = document.createElement('div');

  bar.id='memory-mode-bar';

  bar.style.cssText='position:fixed;top:0;left:0;right:0;background:#E8A94A;color:#1c1305;font-weight:700;font-size:12.5px;text-align:center;padding:8px;z-index:999;';

  bar.textContent = "This browser is blocking all local storage (private/incognito mode, or storage disabled) — nothing will be saved between refreshes right now.";

  document.body.appendChild(bar);

}

function sanitizeLibrary(list){
  const out=[];
  const seen=new Map();
  for(const raw of (Array.isArray(list)?list:[])){
    if(!raw || typeof raw!=='object') continue;
    const title=cleanTitle(raw.title);
    if(!title) continue;
    const item=Object.assign({
      id:uid(), categoryId:S.categories?.[0]?.id || 'backlog', progress:0, total:null,
      status:'planned', priority:'medium', estimatedMinutes:null, tags:[], createdAt:Date.now(), startedAt:null, startedAtSource:null, completedAt:null
    }, raw, {title, id:raw.id || uid()});
    const key=(item.categoryId||'')+'::'+title.toLowerCase();
    if(seen.has(key)){
      const existing=seen.get(key);
      const merged=v84MergeLibraryItem(existing,item);
      Object.keys(existing).forEach(k=>delete existing[k]);
      Object.assign(existing,merged);
    }else{
      seen.set(key,item); out.push(item);
    }
  }
  return out;
}

/* MediaFlow v74 — persistent category ordering */
function v74SyncCategoryOrder(){
  S.categoryOrder=(S.categories||[]).map(c=>c.id);
  return S.categoryOrder;
}
function v74ApplyCategoryOrder(order){
  if(!Array.isArray(S.categories) || !Array.isArray(order) || !order.length) return;
  const rank=new Map(order.map((id,i)=>[id,i]));
  const original=new Map(S.categories.map((c,i)=>[c.id,i]));
  S.categories=S.categories.slice().sort((a,b)=>{
    const ar=rank.has(a.id)?rank.get(a.id):Number.MAX_SAFE_INTEGER;
    const br=rank.has(b.id)?rank.get(b.id):Number.MAX_SAFE_INTEGER;
    return ar-br || (original.get(a.id)||0)-(original.get(b.id)||0);
  });
  v74SyncCategoryOrder();
}

async function loadAll(){
 STORAGE_MODE='cloud'; let data=await rawGet(STATE_KEY);
 data=data||{};S.categories=data.categories||JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));v74ApplyCategoryOrder(data.categoryOrder||data.settings?.categoryOrder||[]);S.library=sanitizeLibrary(data.library||[]);S.orderPlan=v138NormalizeOrderPlan(data.orderPlan,S.library,S.categories);S.sessions=data.sessions||[];S.settings=Object.assign({},DEFAULT_SETTINGS,data.settings||{});
S.settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,data.settings?.backup||{});
S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,data.settings?.leveling||{});
S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,data.settings?.leveling?.unitXP||{});
S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,data.settings?.leveling?.rotationMultiplier||{});S.currentTask=data.currentTask||null;S.sessionActive=!!data.sessionActive;S.profilePicture=String(data.profilePicture||AUTH_USER?.user_metadata?.avatar_url||'').trim();S.activityLog=Array.isArray(data.activityLog)?data.activityLog:[];S.migrations=(data.migrations&&typeof data.migrations==='object')?data.migrations:{};v53InvalidateLibraryCache();v53InvalidateSessionCache();S.loading=false;
}

// All mutations funnel through these — each persists the FULL state in one write.

function persistCategories(){ v74SyncCategoryOrder(); S.settings=S.settings||{}; S.settings.categoryOrder=S.categoryOrder.slice(); return saveState(); }

function persistLibrary(){ v53InvalidateLibraryCache(); return saveState(); }

function persistSessions(){ return saveState(); }

function persistSettings(){ return saveState(); }

function persistTask(){ return saveState(); }

/* ============================================================

   UTIL

   ============================================================ */

function uid(){ return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }

function todayISO(){ return new Date().toISOString().slice(0,10); }

function fmtDate(iso){

  const d = new Date(iso+'T00:00:00');

  const today = todayISO();

  const yest = new Date(Date.now()-86400000).toISOString().slice(0,10);

  if(iso===today) return 'Today';

  if(iso===yest) return 'Yesterday';

  return d.toLocaleDateString(undefined,{month:'short', day:'numeric'});

}

function fmtMinutes(m){

  m = Math.round(m);

  if(m < 60) return m+'m';

  const h = Math.floor(m/60), mm = m%60;

  return h+'h '+(mm? mm+'m':'').trim();

}

function getCategory(id){

  return S.categories.find(c=>c.id===id) || {id, name:'(removed category)', icon:'❔', color:'#555', unit:'episodes', target:1, minutesPerUnit:10, weight:1, enabled:false};

}

function unitLabel(unitKey, count){

  const u = UNITS[unitKey] || UNITS.episodes;

  return count===1 ? u.singular : u.label;

}

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cleanTitle(value){
  return String(value ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/^\s*<!\[CDATA\[\s*/i, '')
    .replace(/\s*\]\]>\s*$/i, '')
    .trim();
}

function daysSince(ts){ if(!ts) return Infinity; return (Date.now()-ts)/86400000; }

function hoursAgo(h){ return Date.now() - h*3600000; }

function lastSessionFor(catId){

  let best = null;

  for(const s of S.sessions){ if(s.categoryId===catId && (!best || s.timestamp>best.timestamp)) best = s; }

  return best;

}

function minutesSince(catId, hours){

  const cutoff = hoursAgo(hours);

  return S.sessions.filter(s=>s.categoryId===catId && s.timestamp>=cutoff && s.status!=='skipped')

    .reduce((sum,s)=>sum+(s.minutes||0),0);

}

function todaysSessions(){

  const t = todayISO();

  return S.sessions.filter(s=>s.date===t);

}

function sessionsInRange(days){

  const cutoff = hoursAgo(days*24);

  return S.sessions.filter(s=>s.timestamp>=cutoff);

}

/* ============================================================

   SCHEDULER

   ============================================================ */

// v90: Treat all category records created by one logging submission as one logical
// consumption event for recency/repetition calculations. Older sessions that do
// not have sessionGroupId remain individual logical events for compatibility.
function schedulerLogicalEvents(){
  const rows=schedulerConsumptionSessions().slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  const groups=new Map();
  for(const s of rows){
    const key=s.sessionGroupId ? `group:${s.sessionGroupId}` : `session:${s.id||uid()}`;
    if(!groups.has(key)) groups.set(key,{key,timestamp:Number(s.timestamp)||0,categoryIds:new Set(),sessions:[]});
    const g=groups.get(key);
    g.timestamp=Math.max(g.timestamp,Number(s.timestamp)||0);
    if(s.categoryId) g.categoryIds.add(s.categoryId);
    g.sessions.push(s);
  }
  return [...groups.values()].sort((a,b)=>b.timestamp-a.timestamp);
}

function recentTaskWindow(n){
  return schedulerLogicalEvents().slice(0,n);
}

function schedulerConsumptionSessions(){
  return S.sessions.filter(s=>s && s.status!=='skipped' && ((Number(s.minutes)||0)>0 || (Number(s.actualAmount)||0)>0));
}

function categoryBalance(cat){
  const enabled=(typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled));
  const weightTotal=enabled.reduce((a,c)=>a+Math.max(0.25,Number(c.weight)||1),0) || 1;
  const desiredShare=Math.max(0.25,Number(cat.weight)||1)/weightTotal;
  const all=schedulerConsumptionSessions();
  const now=Date.now();

  // Recent behavior matters most, but lifetime history remains a real signal.
  const windows=[
    {days:3, weight:.35, minMinutes:60},
    {days:7, weight:.25, minMinutes:120},
    {days:30, weight:.20, minMinutes:240},
    {days:null, weight:.20, minMinutes:1}
  ];

  let ratioSum=0, usedWeight=0;
  const detail={};
  for(const w of windows){
    const rows=w.days==null ? all : all.filter(x=>Number(x.timestamp)>=now-w.days*86400000);
    const totalMinutes=rows.reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const catMinutes=rows.filter(x=>x.categoryId===cat.id).reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const key=w.days==null?'lifetime':`${w.days}d`;
    const actualShare=totalMinutes>0 ? catMinutes/totalMinutes : 0;
    const ratio=desiredShare>0 ? actualShare/desiredShare : 1;
    detail[key]={totalMinutes,catMinutes,actualShare,ratio};
    if(totalMinutes>=w.minMinutes){ ratioSum+=Math.min(6,ratio)*w.weight; usedWeight+=w.weight; }
  }

  const consumptionRatio=usedWeight>0 ? ratioSum/usedWeight : 1;
  const last=lastSessionFor(cat.id);
  const daysIdle=daysSince(last?last.timestamp:null);
  return {desiredShare,consumptionRatio,daysIdle,detail};
}

function computeScores(excludeIds){
  excludeIds = excludeIds || [];
  const st = S.settings;
  let pool = (typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled)).filter(c=>!excludeIds.includes(c.id));
  if(pool.length===0) pool = (typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled));
  const recentWindow = recentTaskWindow(6);
  const logicalChron = schedulerLogicalEvents();

  return pool.map(cat=>{
    const last = lastSessionFor(cat.id);
    const dSince = daysSince(last ? last.timestamp : null);
    const neglectBonus = last ? Math.min(st.neglectCap, dSince*st.neglectRate) : st.neglectCap;

    // v90: a category can count at most once per user logging action, even when
    // that action produced several category-specific session rows.
    const occurrences = recentWindow.filter(e=>e.categoryIds.has(cat.id)).length;
    const repetitionPenalty = occurrences * st.repetitionPenalty;

    // Consecutive use is also measured in logical logging actions. A mixed log
    // therefore says “these categories were consumed together”, not that they
    // were consumed as several arbitrary back-to-back sessions.
    let logicalStreakLen=0;
    for(const e of logicalChron){
      if(e.categoryIds.has(cat.id)) logicalStreakLen++;
      else break;
    }
    const consecutivePenalty = logicalStreakLen * st.consecutivePenalty;

    const balance=categoryBalance(cat);
    // Ratio 1 = on balance. Above 1 = category owns too much consumption time.
    // Below 1 = underrepresented. Cap both sides so one binge never permanently locks a category out.
    const overRatio=Math.max(0,balance.consumptionRatio-1);
    const underRatio=Math.max(0,1-balance.consumptionRatio);
    const saturationPenalty=Math.min(70,overRatio*st.saturationWeight*2.2);
    const balanceBonus=Math.min(28,underRatio*st.neglectCap*.55);

    const seasonalBonus = cat.seasonal ? (st.seasonalBonus + st.seasonalFreshCount*4) : 0;
    const weightScore = cat.weight * 8;
    const raw = weightScore + neglectBonus + balanceBonus + seasonalBonus - repetitionPenalty - consecutivePenalty - saturationPenalty;
    const floored = Math.max(raw, 1.5);
    const jitter = floored * (Math.random()*st.randomness*2 - st.randomness);
    const final = Math.max(floored + jitter, 0.5);

    const reasons = [];
    if(!last) reasons.push({t:'Never consumed yet', w: st.neglectCap});
    else if(dSince>=1) reasons.push({t:`Neglected for ${Math.floor(dSince)}d`, w: neglectBonus});
    if(balance.consumptionRatio>=1.35) reasons.push({t:'Overrepresented across your consumption history — cooling off',w:-saturationPenalty});
    else if(balance.consumptionRatio<=.70 && last) reasons.push({t:'Underrepresented in your overall consumption — catching up',w:balanceBonus});
    if(cat.seasonal && st.seasonalFreshCount>0) reasons.push({t:`${st.seasonalFreshCount} seasonal title(s) have fresh episodes`, w: seasonalBonus});
    else if(cat.seasonal) reasons.push({t:'Time-sensitive — airing now', w: seasonalBonus});
    if(repetitionPenalty+consecutivePenalty>4) reasons.push({t:'Appeared often in recent tasks', w: -(repetitionPenalty+consecutivePenalty)});
    reasons.sort((a,b)=>Math.abs(b.w)-Math.abs(a.w));

    return {cat, score: final, reasons: reasons.slice(0,3), debug:{neglectBonus,repetitionPenalty,consecutivePenalty,saturationPenalty,seasonalBonus,weightScore,balanceBonus,balanceRatio:balance.consumptionRatio}};
  });
}

function weightedPick(scored){
  const total = scored.reduce((s,x)=>s+x.score,0);
  let r = Math.random()*total;
  for(const x of scored){
    r -= x.score;
    if(r<=0) return x;
  }
  return scored[scored.length-1];
}

function suggestedAmount(cat){
  const t=Math.max(1,Number(cat.target)||1);
  const balance=categoryBalance(cat);
  const ratio=balance.consumptionRatio;
  const idle=balance.daysIdle;

  // Amount is self-correcting too: overconsumed categories shrink, neglected ones grow.
  // Recent windows dominate, lifetime history prevents a long binge from being forgotten overnight.
  let mult=1;
  if(ratio>=2.5) mult*=.50;
  else if(ratio>=1.8) mult*=.62;
  else if(ratio>=1.35) mult*=.78;
  else if(ratio<=.45) mult*=1.35;
  else if(ratio<=.70) mult*=1.18;

  // Time since last consumption adds a gradual catch-up boost with diminishing returns.
  if(Number.isFinite(idle)){
    if(idle>=60) mult*=1.65;
    else if(idle>=30) mult*=1.50;
    else if(idle>=14) mult*=1.32;
    else if(idle>=7) mult*=1.18;
  }else{
    mult*=1.5;
  }

  // Keep correction gradual. MediaFlow should rebalance over rotations, not create giant debt sessions.
  mult=clamp(mult,.45,2.0);
  const center=Math.max(1,Math.round(t*mult));
  let low,high;
  if(center<=2){ low=center; high=center; }
  else{
    low=Math.max(1,Math.round(center*.85));
    high=Math.max(low,Math.round(center*1.15));
  }

  const direction=mult<.9?'reduced':mult>1.1?'increased':'normal';
  return {low,high,multiplier:mult,direction,balanceRatio:ratio,daysIdle:idle};
}

function scoreLibraryTitle(item, cat){
  if(!item || item.categoryId!==cat.id) return -Infinity;
  if(item.status==='completed' || item.status==='dropped') return -Infinity;
  const total = Number(item.total);
  const progress = Number(item.progress)||0;
  const completion = total>0 ? Math.min(1,progress/total) : 0;
  const remaining = total>0 ? Math.max(0,total-progress) : 10;
  const priorityBonus = ({high:18,medium:8,low:0}[item.priority]||0);
  const activeBonus = item.status==='active' ? 12 : item.status==='planned' ? 5 : 0;
  const unfinishedBonus = total>0 ? Math.min(20, remaining*2) : 6;
  const seasonalBonus = cat.seasonal ? 10 : 0;
  const jitter = Math.random()*8;
  return priorityBonus + activeBonus + unfinishedBonus + seasonalBonus - completion*10 + jitter;
}

function pickLibraryTitle(cat){
  const pool=S.library.filter(i=>i && i.categoryId===cat.id && i.status!=='completed' && i.status!=='dropped');
  if(!pool.length) return null;

  // v139: Personal Order only changes WHICH TITLE is selected after the normal
  // scheduler has already selected the category and calculated the amount.
  // The first eligible ordered title inside this task's category wins.
  // If Order has no eligible title for the category, fall back to the original
  // MediaFlow title-scoring behavior unchanged.
  if(S.settings?.prioritizePersonalOrder && Array.isArray(S.orderPlan?.titleIds)){
    const eligibleById=new Map(pool.filter(i=>i?.id).map(i=>[String(i.id),i]));
    for(const id of S.orderPlan.titleIds){
      const ordered=eligibleById.get(String(id));
      if(ordered)return ordered;
    }
  }

  return pool.slice().sort((a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat))[0] || null;
}


function generateTask(excludeIds){
  const scored = computeScores(excludeIds);
  if(scored.length===0) return null;
  const pick = weightedPick(scored);
  const amount = suggestedAmount(pick.cat);
  const {low, high} = amount;
  const recommendedTitle = S.settings.exactTitleRecommendations ? pickLibraryTitle(pick.cat) : null;
  const amountReason=amount.direction==='reduced'
    ? 'Session size reduced because this category is overrepresented in your consumption'
    : amount.direction==='increased'
      ? 'Session size increased to gradually catch this category up'
      : 'Session size is near its normal target';
  return {
    id: uid(),
    categoryId: pick.cat.id,
    libraryId: recommendedTitle ? recommendedTitle.id : null,
    title: recommendedTitle ? cleanTitle(recommendedTitle.title) : null,
    low, high,
    targetMid: Math.round((low+high)/2) || pick.cat.target,
    unit: pick.cat.unit,
    createdAt: Date.now(),
    reasons: [...pick.reasons.map(r=>r.t),amountReason].slice(0,4),
    amountMultiplier: amount.multiplier,
    balanceRatio: amount.balanceRatio
  };
}


/* ============================================================

   SESSION FLOW

   ============================================================ */

function startSession(){

  S.sessionActive = true;

  if(!S.currentTask) S.currentTask = generateTask([]);

  persistTask(); render();

}

function endSession(){

  v165EndSessionContext();

  S.sessionActive = false; S.currentTask = null; S.logging=false;

  persistTask(); render();

}

function rotateTask(){

  if(!S.currentTask) return;

  v165RecordReroll();

  const excl = [S.currentTask.categoryId];

  S.currentTask = generateTask(excl);

  S.logging=false;

  persistTask(); render();

}

function skipTask(){

  if(!S.currentTask) return;

  v165RecordSkip();

  const cat = getCategory(S.currentTask.categoryId);

  const sess = {

    id: uid(), timestamp: Date.now(), date: todayISO(),

    categoryId: cat.id, targetAmount: S.currentTask.targetMid, actualAmount: 0,

    minutes: 0, note: '', status: 'skipped', unit: cat.unit, xp: 0, healthStatus: categoryStatus(cat).status,

  };

  S.sessions.push(sess); persistSessions();

  S.currentTask = generateTask([cat.id]);

  S.logging=false;

  persistTask(); render();

}

function openLogForm(){

  const t = S.currentTask;

  S.logDraft = {

    categoryId: t.categoryId,

    amount: t.targetMid,

    minutes: Math.round(t.targetMid * getCategory(t.categoryId).minutesPerUnit),

    note:'',

    entries: [],           // [{title, qty, libraryId|null}]

    updateLibrary: true,

  };

  S.entryDraft = { title:'', qty:1 };

  S.logging = true; render();

}

function cancelLogForm(){ S.logging=false; render(); }

function findLibraryMatch(categoryId, title){

  const t = title.trim().toLowerCase();

  return S.library.find(i=>i.categoryId===categoryId && i.title.trim().toLowerCase()===t) || null;

}

function entriesNote(entries){

  return entries.map(e=> e.qty>1 ? `${e.title} ×${e.qty}` : e.title).join(', ');

}

function entriesTotal(entries){

  return entries.reduce((s,e)=>s+(Number(e.qty)||0),0);

}

function normalizeSeasonalLibraryItems(){
  // v72: Seasonal Anime titles stay in Seasonal Anime when completed.
  // Category changes are now always explicit/manual.
  return false;
}

const V89_LOG={page:0,pageSize:20,categories:[],status:'all',priority:'all',sort:'relevance'};
function v89ResetLogPage(){ V89_LOG.page=0; }
function logTitleCandidates(query){
  const q=String(query||'').trim().toLowerCase();
  if(!q) return [];
  let rows=S.library.filter(i=>i && cleanTitle(i.title).toLowerCase().includes(q));
  if(V89_LOG.categories.length) rows=rows.filter(i=>V89_LOG.categories.includes(String(i.categoryId||'')));
  if(V89_LOG.status!=='all') rows=rows.filter(i=>String(i.status||'planned').toLowerCase()===V89_LOG.status);
  if(V89_LOG.priority!=='all') rows=rows.filter(i=>String(i.priority||'medium').toLowerCase()===V89_LOG.priority);
  const rank={low:0,medium:1,high:2}, num=v=>Number.isFinite(Number(v))?Number(v):0;
  const cmpTitle=(a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});
  rows=rows.slice().sort((a,b)=>{
    let d=0;
    if(V89_LOG.sort==='title-asc') return cmpTitle(a,b);
    if(V89_LOG.sort==='title-desc') return cmpTitle(b,a);
    if(V89_LOG.sort==='priority-desc') d=(rank[b.priority]??1)-(rank[a.priority]??1);
    else if(V89_LOG.sort==='priority-asc') d=(rank[a.priority]??1)-(rank[b.priority]??1);
    else if(V89_LOG.sort==='rating-desc') d=num(b.rating)-num(a.rating);
    else if(V89_LOG.sort==='rating-asc') d=num(a.rating)-num(b.rating);
    else if(V89_LOG.sort==='progress-desc') d=num(b.progress)-num(a.progress);
    else if(V89_LOG.sort==='progress-asc') d=num(a.progress)-num(b.progress);
    else if(V89_LOG.sort==='total-desc') d=num(b.total)-num(a.total);
    else if(V89_LOG.sort==='total-asc') d=num(a.total)-num(b.total);
    else {
      const at=cleanTitle(a.title).toLowerCase(), bt=cleanTitle(b.title).toLowerCase();
      const ar=at===q?0:at.startsWith(q)?1:2, br=bt===q?0:bt.startsWith(q)?1:2;
      d=ar-br || at.indexOf(q)-bt.indexOf(q);
    }
    return d||cmpTitle(a,b);
  });
  return rows;
}
function v89LogPage(p){ V89_LOG.page=Math.max(0,Number(p)||0); renderLogSuggestions(); }
function v89LogFilter(k,v){ V89_LOG[k]=v; V89_LOG.page=0; renderLogSuggestions(); }
function v89ToggleLogCategory(id,on){
  const set=new Set(V89_LOG.categories||[]); if(on)set.add(id);else set.delete(id); V89_LOG.categories=[...set]; V89_LOG.page=0; renderLogSuggestions();
}
function v89ClearLogCategories(){V89_LOG.categories=[];V89_LOG.page=0;renderLogSuggestions();}
function v89ClearLogFilters(){V89_LOG.categories=[];V89_LOG.status='all';V89_LOG.priority='all';V89_LOG.sort='relevance';V89_LOG.page=0;renderLogSuggestions();}
function v89LogTools(candidates,pages){
  const cats=(S.categories||[]).filter(c=>c&&c.id);
  const catLabel=V89_LOG.categories.length?`${V89_LOG.categories.length} categories selected`:'All categories';
  return `<div class="v87-log-tools v89-log-tools" data-v89-log-tools="1">
    <details class="v66-cat-filter"><summary class="btn">${catLabel} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" data-v89-action="all-categories">All</button></div>${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" data-v89-category="${escapeHtml(String(c.id))}" ${V89_LOG.categories.includes(String(c.id))?'checked':''}><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}</div></details>
    <select data-v89-filter="sort" aria-label="Logging title display order"><option value="relevance" ${V89_LOG.sort==='relevance'?'selected':''}>Best match</option><option value="priority-desc" ${V89_LOG.sort==='priority-desc'?'selected':''}>Priority: High → Low</option><option value="priority-asc" ${V89_LOG.sort==='priority-asc'?'selected':''}>Priority: Low → High</option><option value="title-asc" ${V89_LOG.sort==='title-asc'?'selected':''}>Title: A → Z</option><option value="title-desc" ${V89_LOG.sort==='title-desc'?'selected':''}>Title: Z → A</option><option value="rating-desc" ${V89_LOG.sort==='rating-desc'?'selected':''}>Rating: High → Low</option><option value="rating-asc" ${V89_LOG.sort==='rating-asc'?'selected':''}>Rating: Low → High</option><option value="progress-desc" ${V89_LOG.sort==='progress-desc'?'selected':''}>Progress: Most → Least</option><option value="progress-asc" ${V89_LOG.sort==='progress-asc'?'selected':''}>Progress: Least → Most</option><option value="total-desc" ${V89_LOG.sort==='total-desc'?'selected':''}>Total: Most → Least</option><option value="total-asc" ${V89_LOG.sort==='total-asc'?'selected':''}>Total: Least → Most</option></select>
    <select data-v89-filter="status" aria-label="Logging title status"><option value="all" ${V89_LOG.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${V89_LOG.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}</select>
    <select data-v89-filter="priority" aria-label="Logging title priority"><option value="all" ${V89_LOG.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${V89_LOG.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select>
    <button type="button" class="btn btn-sm btn-ghost v87-log-clear" data-v89-action="clear">Clear filters</button>
    <span class="v87-log-count">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${V89_LOG.page+1}/${pages}</span>
  </div>`;
}
function v89BindLogFilterEvents(box){
  if(!box) return;
  box.querySelectorAll('[data-v89-filter]').forEach(el=>el.addEventListener('change',()=>{
    const key=el.dataset.v89Filter;
    V89_LOG[key]=String(el.value||'all').toLowerCase(); V89_LOG.page=0; renderLogSuggestions();
  }));
  box.querySelectorAll('[data-v89-category]').forEach(el=>el.addEventListener('change',()=>{
    const id=String(el.dataset.v89Category||''); const set=new Set(V89_LOG.categories||[]);
    if(el.checked)set.add(id);else set.delete(id); V89_LOG.categories=[...set]; V89_LOG.page=0; renderLogSuggestions();
  }));
  box.querySelectorAll('[data-v89-action="all-categories"]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();V89_LOG.categories=[];V89_LOG.page=0;renderLogSuggestions();}));
  box.querySelectorAll('[data-v89-action="clear"]').forEach(el=>el.addEventListener('click',()=>{V89_LOG.categories=[];V89_LOG.status='all';V89_LOG.priority='all';V89_LOG.sort='relevance';V89_LOG.page=0;renderLogSuggestions();}));
  box.querySelectorAll('[data-v89-page]').forEach(el=>el.addEventListener('click',()=>{
    if(el.disabled)return;
    v89LogPage(Number(el.dataset.v89Page));
  }));
}
function renderLogSuggestions(){
  const box=document.getElementById('log-suggestions'); if(!box)return;
  V89_LOG.pageSize=v175PageSize('loggingLibrary');
  const q=String(S.entryDraft.title||'').trim(); if(!q){box.innerHTML='';return;}
  const candidates=logTitleCandidates(q),pages=Math.max(1,Math.ceil(candidates.length/V89_LOG.pageSize));
  V89_LOG.page=Math.max(0,Math.min(V89_LOG.page,pages-1));
  const rows=candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize);
  const tools=v89LogTools(candidates,pages);
  if(!rows.length){box.innerHTML=tools+'<div class="v86-log-empty">No matching Library titles with these filters.</div>';v89BindLogFilterEvents(box);return;}
  const list=`<div class="log-suggestion-list">${rows.map(i=>{const c=getCategory(i.categoryId),progress=i.total!=null?`${i.progress||0}/${i.total}`:'progress unknown';const repeat=(i.status==='completed'||(Number(i.total)>0&&Number(i.progress)>=Number(i.total)))?' · ↻ Rewatch/Reread':'';const cover=i.coverUrl?`<img class="v86-log-cover" src="${escapeHtml(i.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';return `<div class="log-suggestion"><div class="v86-log-result">${cover}<div><b>${escapeHtml(cleanTitle(i.title))}</b><small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Library')} · ${escapeHtml(v199StatusLabel(i.status))} · ${escapeHtml(i.priority||'medium')} priority · ${progress}${repeat}</small></div></div><button class="btn btn-sm btn-ghost" type="button" onclick="App.selectLogTitle('${i.id}')">Use</button></div>`}).join('')}</div>`;
  const nums=[],from=Math.max(0,Math.min(V89_LOG.page-2,pages-5)),to=Math.min(pages,from+5);for(let n=from;n<to;n++)nums.push(`<button type="button" class="btn btn-sm ${n===V89_LOG.page?'active':''}" data-v89-page="${n}">${n+1}</button>`);
  const pager=pages>1?`<div class="v86-log-pager"><button type="button" class="btn btn-sm" ${V89_LOG.page===0?'disabled':''} data-v89-page="${V89_LOG.page-1}">← Prev</button>${nums.join('')}<button type="button" class="btn btn-sm" ${V89_LOG.page===pages-1?'disabled':''} data-v89-page="${V89_LOG.page+1}">Next →</button></div>`:'';
  box.innerHTML=tools+list+pager;
  v89BindLogFilterEvents(box);
}
function submitLog(){
  const t=S.currentTask;
  const assignedCat=getCategory(t.categoryId);const enteredAmount=clamp(Number(S.logDraft.amount)||0,0,999999);
  const totalMinutes=clamp(Number(S.logDraft.minutes)||0,0,999999);
  const entries=S.logDraft.entries||[];
  const extra=(S.logDraft.note||'').trim();
  const timestamp=Date.now(), sessionGroupId=uid();

  // v61: actual consumption and recommendation outcome are separate concepts.
  const groups=new Map();
  if(entries.length){
    entries.forEach(e=>{
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):null;
      const actualCat=(item&&getCategory(item.categoryId))||assignedCat;
      const qty=Math.max(0,Number(e.qty)||0);
      if(!groups.has(actualCat.id)) groups.set(actualCat.id,{cat:actualCat,entries:[],amount:0,weight:0});
      const g=groups.get(actualCat.id); g.entries.push(e); g.amount+=qty;
      g.weight+=qty*Math.max(1,Number(actualCat.minutesPerUnit)||1);
    });
  }else if(enteredAmount>0){
    groups.set(assignedCat.id,{cat:assignedCat,entries:[],amount:enteredAmount,weight:Math.max(1,enteredAmount*Math.max(1,Number(assignedCat.minutesPerUnit)||1))});
  }

  const grouped=[...groups.values()], totalWeight=grouped.reduce((n,g)=>n+g.weight,0)||1;
  let minutesLeft=totalMinutes;
  grouped.forEach((g,index)=>{
    const actualCat=g.cat, isAssigned=actualCat.id===assignedCat.id;
    const groupMinutes=index===grouped.length-1?minutesLeft:Math.min(minutesLeft,Math.round(totalMinutes*(g.weight/totalWeight)));
    minutesLeft=Math.max(0,minutesLeft-groupMinutes);
    let status='logged';
    if(isAssigned){
      if(g.amount<t.targetMid) status='partial';
      else if(g.amount>t.targetMid) status='over';
      else status='complete';
    }
    const healthStatus=categoryStatus(actualCat).status;
    const xpCalc=calculateConsumptionXP(actualCat,g.amount,groupMinutes,healthStatus);
    const note=[entriesNote(g.entries),extra].filter(Boolean).join(' — ');
    S.sessions.push({
      id:uid(),timestamp,date:todayISO(),categoryId:actualCat.id,
      assignedCategoryId:assignedCat.id,assignedTargetAmount:t.targetMid,sessionGroupId,
      followedAssignedCategory:isAssigned,targetAmount:isAssigned?t.targetMid:g.amount,
      actualAmount:g.amount,minutes:groupMinutes,note,status,unit:actualCat.unit,
      xp:xpCalc.xp,healthStatus,source:'recommendation',
      titles:g.entries.map(e=>({title:cleanTitle(e.title),libraryId:e.libraryId||null,qty:Number(e.qty)||0,repeat:!!e.isRepeat}))
    });
  });

  // If none of the actual consumption belonged to the recommended category,
  // preserve the recommendation itself as Skipped without adding fake consumption.
  if(!grouped.some(g=>g.cat.id===assignedCat.id && g.amount>0)){
    S.sessions.push({id:uid(),timestamp,date:todayISO(),categoryId:assignedCat.id,
      assignedCategoryId:assignedCat.id,assignedTargetAmount:t.targetMid,sessionGroupId,
      followedAssignedCategory:false,targetAmount:t.targetMid,actualAmount:0,minutes:0,
      note:'Recommendation not followed',status:'skipped',unit:assignedCat.unit,xp:0,
      healthStatus:categoryStatus(assignedCat).status,source:'recommendation',titles:[]});
  }

  // v165: award System Respect XP once per recommendation/log group.
  // This runs before the normal persist/render path, so there is no extra
  // History scan, save, or render just to award the bonus.
  v165ApplyRespectReward(t,entries,sessionGroupId,assignedCat);

  if(S.logDraft.updateLibrary){
    entries.forEach(e=>{
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):findLibraryMatch(assignedCat.id,e.title);
      if(item){
        // v81: repeat consumption counts in History/XP/stats but never pushes main Library progress past completion.
        if(e.isRepeat){ return; }
        item.progress=(item.progress||0)+(Number(e.qty)||0);
        if(item.total) item.progress=Math.min(item.progress,item.total);
        if(item.total&&item.progress>=item.total&&item.status!=='dropped'){
          item.status='completed'; item.completedAt=item.completedAt||timestamp;
          S.completionTimeline=S.completionTimeline||[];
          if(!S.completionTimeline.some(x=>x.libraryId===item.id)) S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});
        }else if(item.status==='planned') item.status='active';
      }
    });
    normalizeSeasonalLibraryItems(); persistLibrary();
  }
  persistSessions();
  const consumedCategoryIds=grouped.filter(g=>g.amount>0).map(g=>g.cat.id);
  S.currentTask=generateTask(consumedCategoryIds.length?consumedCategoryIds:[assignedCat.id]);
  S.logging=false; persistTask(); render();
}


/* ============================================================

   DERIVED / STATS HELPERS

   ============================================================ */

function categoryHealthGuidance(cat, status){
  if(status==='overused'){
    return `Take a break from ${cat.name}. Focus on categories marked Due or Neglected, and let this category cool down before consuming more.`;
  }
  if(status==='neglected'){
    const amount = suggestedAmount(cat);
    const mid = Math.max(1, Math.round((amount.low + amount.high) / 2));
    return `Prioritize ${cat.name}. Do about ${mid} ${unitLabel(cat.unit, mid)} next, then rotate and let the status recalculate.`;
  }
  if(status==='due'){
    const amount = suggestedAmount(cat);
    const mid = Math.max(1, Math.round((amount.low + amount.high) / 2));
    return `Give ${cat.name} attention next. Aim for about ${mid} ${unitLabel(cat.unit, mid)}, then rotate to another category.`;
  }
  return `Keep ${cat.name} in your normal rotation. No special correction is needed.`;
}

function categoryStatusActionSummary(cat, todayStatus, overallStatus){
  const todayGuide = categoryHealthGuidance(cat, todayStatus);
  const overallGuide = categoryHealthGuidance(cat, overallStatus);
  if(todayStatus===overallStatus) return todayGuide;
  return `Today: ${todayGuide} Overall: ${overallGuide}`;
}

function categoryStatus(cat){

  const last = lastSessionFor(cat.id);

  const dSince = daysSince(last?last.timestamp:null);

  const min72 = minutesSince(cat.id,72);

  const expected3d = cat.target*cat.minutesPerUnit*2.2;

  const satRatio = expected3d>0 ? min72/expected3d : 0;

  const todayAmt = todaysSessions().filter(s=>s.categoryId===cat.id && s.status!=='skipped').reduce((a,s)=>a+s.actualAmount,0);

  if(todayAmt>0 && satRatio>=1.6) return 'overused';

  if(dSince>=6) return 'neglected';

  if(dSince>=2.2) return 'due';

  return 'healthy';

}

function overallCategoryStatus(cat){

  // Overall health uses the category's entire recorded history:
  // from its first ever non-skipped log through its last ever log.
  const sessions = S.sessions
    .filter(s=>s && s.categoryId===cat.id && s.status!=='skipped' && Number(s.minutes)>0)
    .sort((a,b)=>new Date(a.timestamp||a.date)-new Date(b.timestamp||b.date));

  if(!sessions.length) return 'healthy';

  const first = sessions[0];
  const last = sessions[sessions.length-1];
  const firstTime = new Date(first.timestamp||first.date).getTime();
  const lastTime = new Date(last.timestamp||last.date).getTime();
  const spanDays = Math.max(3,(lastTime-firstTime)/(24*60*60*1000));
  const totalMinutes = sessions.reduce((sum,s)=>sum+(Number(s.minutes)||0),0);
  const expectedPerDay = (cat.target*cat.minutesPerUnit*2.2)/3;
  const expectedOverall = expectedPerDay*spanDays;
  const ratio = expectedOverall>0 ? totalMinutes/expectedOverall : 0;

  // Recency still matters for whether the category is currently due/neglected,
  // while the consumption ratio itself covers the full lifetime of the category.
  const dSince = daysSince(last.timestamp||last.date);
  if(dSince>=6) return 'neglected';
  if(ratio>=1.6) return 'overused';
  if(dSince>=2.2) return 'due';
  return 'healthy';
}

function saturationLevel(cat){

  const min72 = minutesSince(cat.id,72);

  const baseline = Math.max(cat.target*cat.minutesPerUnit,1)*2.2;

  const ratio = min72/baseline;

  if(ratio<0.25) return {label:'VERY LOW', c:'#5AA9E6'};

  if(ratio<0.7) return {label:'LOW', c:'#3FC7A6'};

  if(ratio<1.4) return {label:'MEDIUM', c:'#E8A94A'};

  if(ratio<2.4) return {label:'HIGH', c:'#F58A5A'};

  return {label:'VERY HIGH', c:'#E8607A'};

}

function totalsForSessions(list){

  const out = {minutes:0, episodes:0, chapters:0, movies:0, issues:0, tasks:0};

  list.forEach(s=>{

    if(s.status==='skipped') return;

    out.minutes += s.minutes||0;

    out.tasks += 1;

    if(out[s.unit]!==undefined) out[s.unit]+=s.actualAmount;

  });

  return out;

}

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

/* ============================================================

   VIEW: DASHBOARD

   ============================================================ */

function renderDashboard(){

  const today = todaysSessions();

  const totals = totalsForSessions(today);

  const st = S.settings;

  const minutesPct = clamp(Math.round(totals.minutes/st.dailyMinutes*100),0,100);

  const tasksPct = clamp(Math.round(totals.tasks/st.tasksPerDay*100),0,100);

  let heroHtml;

  if(!S.sessionActive || !S.currentTask){

     heroHtml = ` 

      <div class="hero">

        <div class="hero-eyebrow">Ready when you are</div>

        <div class="hero-cat" style="margin-top:14px;">

          <div class="hero-icon" style="background:rgba(232,169,74,.14); color:var(--flow);">▶</div>

          <div>

            <div class="hero-name">Start a session</div>

            <div class="hero-amount">MediaFlow will hand you one category at a time — you pick the titles.</div>

          </div>

        </div>

        <div class="hero-actions">

          <button class="btn btn-primary" onclick="App.startSession()">Start Session</button>

        </div>

      </div>`;

  } else {

    const t = S.currentTask;

    const cat = getCategory(t.categoryId);

    const amountStr = t.low===t.high ? `${t.low} ${unitLabel(t.unit,t.low)}` : `${t.low}–${t.high} ${unitLabel(t.unit,t.high)}`;

     heroHtml = ` 

      <div class="hero">

        <div class="hero-eyebrow">Next task</div>

        <div class="hero-cat">

          <div class="hero-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>

          <div>

            <div class="hero-name">${escapeHtml(cat.name)}</div>

          </div>

        </div>

        <div class="hero-amount">Consume <b>${amountStr}</b></div>

        ${S.settings.exactTitleRecommendations ? (t.title ? `<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>` : `<div class="hero-note">No eligible title found in this category. Add one to your Library.</div>`) : `<div class="hero-note">You choose the titles — pick whatever you're in the mood for.</div>`}

        <div class="hero-reasons">

          ${t.reasons.map(r=>`<span class="pill">${escapeHtml(r)}</span>`).join('')}

        </div>

         ${S.logging ? renderLogForm(t,cat) : ` 

        <div class="hero-actions">

          <button class="btn btn-primary" onclick="App.openLogForm()">Log &amp; Complete</button>

          <button class="btn" onclick="App.rotateTask()">Give me something else</button>

          <button class="btn btn-ghost" onclick="App.skipTask()">Skip</button>

          <button class="btn btn-ghost" onclick="App.endSession()">End session</button>

        </div>

        <button class="link-btn" style="margin-top:14px;" onclick="App.toggleReasonDetail()">${S.showReasonDetail?'Hide':'Why this pick?'}</button>

        ${S.showReasonDetail ? renderReasonDetail(cat) : ''}

        `}

      </div>`;

  }

  const cats = (typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled));

   const balanceHtml = cats.length===0 ? `<div class="empty-state"><div class="em-icon">🗂️</div><div class="em-title">No categories selected</div><div>Choose categories in Settings → Dashboard Settings.</div></div>` : ` 

    <div class="balance-list">

      ${cats.map(cat=>{

        const amt = today.filter(s=>s.categoryId===cat.id && s.status!=='skipped').reduce((a,s)=>a+s.actualAmount,0);

        const todayStatus = categoryStatus(cat);

        const overallStatus = overallCategoryStatus(cat);

        const labelMap = {healthy:'Healthy', neglected:'Neglected', overused:'Overused', due:'Due'};

        return `<div class="balance-row">

          <div class="bal-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>

          <div class="bal-name">${escapeHtml(cat.name)}</div>

          <div class="bal-amt">${amt} ${unitLabel(cat.unit,amt)} today</div>

          <div class="status-badge status-${todayStatus}" title="Based on recent 72-hour consumption">Today: ${labelMap[todayStatus]}</div>

          <div class="status-badge status-${overallStatus}" title="Based on all recorded consumption from the first ever log to the last ever log">Overall: ${labelMap[overallStatus]}</div>

          <div class="health-action">${escapeHtml(categoryStatusActionSummary(cat, todayStatus, overallStatus))}</div>

        </div>`;

      }).join('')}

    </div>
    <div class="health-note">Today status reflects the last 72 hours. Overall status uses all recorded consumption from the first ever log to the last ever log.</div>`;

   return ` 

    <div class="view-head">

      <div>

        <div class="view-title">Today</div>

        <div class="view-desc">${new Date().toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}</div>

      </div>

    </div>

    <div class="today-strip">

      <div class="stat-box">

        <div class="num">${totals.tasks} / ${st.tasksPerDay}</div>

        <div class="lbl">tasks complete</div>

        <div class="progress-track"><div class="progress-fill" style="width:${tasksPct}%"></div></div>

      </div>

      <div class="stat-box">

        <div class="num">${fmtMinutes(totals.minutes)} / ${fmtMinutes(st.dailyMinutes)}</div>

        <div class="lbl">time invested</div>

        <div class="progress-track"><div class="progress-fill" style="width:${minutesPct}%"></div></div>

      </div>

      <div class="stat-box">

        <div class="num">${computeDayStreak()}</div>

        <div class="lbl">day streak</div>

      </div>

    </div>

    ${heroHtml}
    ${stopwatchHtml()}

    <div style="display:flex; align-items:center; justify-content:space-between;">

      <div class="section-label">TODAY'S BALANCE</div>

      ${S.sessions.length? `<button class="link-btn" onclick="App.undoLastEntry()">↺ Undo last entry</button>` : ''}

    </div>

    <div class="card">${balanceHtml}</div>

  `;

}

function renderReasonDetail(cat){

  return `<div class="reason-explain">

    The scheduler blends this category's weight, how long it's been neglected, whether it's time-sensitive (seasonal), how often it's shown up in your last few tasks, and how much you've already consumed of it recently — plus a little randomness so the rotation doesn't feel scripted. Right now <b>${escapeHtml(cat.name)}</b> scored highest among enabled categories.

  </div>`;

}

function renderLogForm(t, cat){

  // Logging can pick from the entire Library. The current task still determines
  // the session category, while the selected Library entry determines which
  // title's progress gets updated. This lets you log Manga, Manhwa, TV, Movies,
  // Anime, and custom categories from the same form.
  const libOptions = S.library.filter(i=>i && i.status!=='dropped');

  const entries = S.logDraft.entries||[];

  const total = entriesTotal(entries);

  return `<div class="log-form">

    <label class="field-label">Titles consumed</label>

    <div style="display:flex; gap:8px; margin-bottom:8px;">

      <input type="text" id="entry-title" placeholder="Type a title, or pick from your library"

        value="${escapeHtml(S.entryDraft.title)}" oninput="App.updateEntryDraft('title', this.value)"

        onkeydown="if(event.key==='Enter'){event.preventDefault(); App.addLogEntry();}" style="flex:1;">

      <input type="number" id="entry-qty" min="1" value="${S.entryDraft.qty}" oninput="App.updateEntryDraft('qty', this.value)" style="width:74px;">

      <button class="btn btn-sm" onclick="App.addLogEntry()">+ Add</button>

    </div>

    <div id="log-suggestions" class="log-suggestions"></div>

     ${entries.length===0 ? `<small class="hint">Add one or more — e.g. "One Piece" ×1, "Detective Conan" ×3. Matches in your Library get suggested as you type.</small>` : ` 

    <div style="display:flex; flex-wrap:wrap; gap:6px; margin:8px 0;">

      ${entries.map((e,idx)=>{

        const matched = e.libraryId || findLibraryMatch(cat.id, e.title);

        return `<span class="pill" style="gap:7px;">${matched?'📚 ':''}${escapeHtml(e.title)}${e.qty>1?' ×'+e.qty:''}${e.isRepeat?' <span style="color:var(--flow);font-weight:800">↻ Rewatch/Reread</span>':''}

          <button class="link-btn" style="color:var(--overused); text-decoration:none;" onclick="App.removeLogEntry(${idx})">✕</button></span>`;

      }).join('')}

    </div>

    ${entries.filter(e=>e.isNew).map(e=>{
      const idx=entries.indexOf(e);
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):null;
      if(!item) return '';
      return `
        <div class="new-entry-box">
          <div class="new-entry-head">
            <div class="new-entry-title">📚 New library entry</div>
            <div class="new-entry-badge">Added automatically</div>
          </div>
          <div class="new-entry-grid">
            <div class="field">
              <label class="field-label">Title</label>
              <input type="text" value="${escapeHtml(item.title)}" onchange="App.updateLogEntryDetail(${idx},'title',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Current progress</label>
              <input type="number" min="0" value="${item.progress||0}" onchange="App.updateLogEntryDetail(${idx},'progress',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Total (optional)</label>
              <input type="number" min="0" value="${item.total??''}" placeholder="Unknown" onchange="App.updateLogEntryDetail(${idx},'total',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Status</label>
              <select onchange="App.updateLogEntryDetail(${idx},'status',this.value)">
                ${['planned','active','paused','completed','dropped'].map(s=>`<option value="${s}" ${item.status===s?'selected':''}>${v199StatusLabel(s)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">Priority</label>
              <select onchange="App.updateLogEntryDetail(${idx},'priority',this.value)">
                ${['low','medium','high'].map(s=>`<option value="${s}" ${item.priority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">Estimated minutes</label>
              <input type="number" min="0" value="${item.estimatedMinutes??''}" placeholder="Optional" onchange="App.updateLogEntryDetail(${idx},'estimatedMinutes',this.value)">
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label class="field-label">Tags</label>
              <input type="text" value="${escapeHtml((item.tags||[]).join(', '))}" placeholder="e.g. shonen, backlog" onchange="App.updateLogEntryDetail(${idx},'tags',this.value)">
            </div>
          </div>
          <div class="new-entry-note">This title is already in your Library. Saving this log will also add the consumed quantity to its progress.</div>
        </div>`;
    }).join('')}

    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">

      <small class="hint" style="margin:0;">Total from titles: <b style="color:var(--text);">${total}</b> ${unitLabel(t.unit,total)}</small>

      <button class="link-btn" onclick="App.syncAmountFromEntries()">Use as amount</button>

    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--text-dim); margin-bottom:10px;">

      <input type="checkbox" ${S.logDraft.updateLibrary?'checked':''} onchange="App.toggleUpdateLibrary(this.checked)">

      Update Library progress automatically

    </label>`}

    <div class="field-row">

      <div class="field">

        <label class="field-label">Actual amount (${unitLabel(t.unit,2)})</label>

        <input type="number" min="0" id="log-amount" value="${S.logDraft.amount}" oninput="App.updateLogDraft('amount', this.value)">

        <small class="hint">Suggested: ${t.low===t.high? t.low : t.low+'–'+t.high}. More or less is fine.</small>

      </div>

      <div class="field">

        <label class="field-label">Minutes spent</label>

        <input type="number" min="0" id="log-minutes" value="${S.logDraft.minutes}" oninput="App.updateLogDraft('minutes', this.value)">

      </div>

    </div>

    <div id="xp-preview" style="margin:10px 0 14px;padding:11px 13px;border:1px solid var(--border-soft);background:var(--panel-raised);border-radius:10px;color:var(--flow);line-height:1.45;">${(()=>{const x=estimateCurrentLogXP();return `<div><b>+${x.xp.toLocaleString()} XP</b> for this log</div><small style="color:var(--text-mute)">${escapeHtml(x.label)} · ${x.base.toLocaleString()} base × ${x.multiplier} rotation × ${Number(x.streakMultiplier||1).toFixed(2)} streak (${Number(x.streak||0)}d)</small>`})()}</div>

    <div class="field">

      <label class="field-label">Anything else to note? (optional)</label>

      <input type="text" id="log-note" placeholder="e.g. binged the season finale" value="${escapeHtml(S.logDraft.note||'')}" oninput="App.updateLogDraft('note', this.value)">

    </div>

    <div class="hero-actions">

      <button class="btn btn-primary" onclick="App.submitLog()">Save &amp; get next task</button>

      <button class="btn btn-ghost" onclick="App.cancelLogForm()">Cancel</button>

    </div>

  </div>`;

}

/* ============================================================

   VIEW: LIBRARY

   ============================================================ */


/* ============================================================
   MediaFlow v63 — Large Library Performance Engine
   ============================================================ */
const V53_LIB={
  libraryRef:null, libraryLen:-1, libraryToken:0,
  searchIndex:[], overview:null,
  sessionRef:null, sessionLen:-1, sessionTail:'', lastTouched:new Map(),
  filterKey:'', filtered:[]
};
let V53_LIB_SEARCH_TIMER=null;

function v53InvalidateLibraryCache(){
  V53_LIB.libraryRef=null;
  V53_LIB.libraryLen=-1;
  V53_LIB.libraryToken++;
  V53_LIB.searchIndex=[];
  V53_LIB.overview=null;
  V53_LIB.filterKey='';
  V53_LIB.filtered=[];
}
function v53InvalidateSessionCache(){
  V53_LIB.sessionRef=null;
  V53_LIB.sessionLen=-1;
  V53_LIB.sessionTail='';
  V53_LIB.lastTouched=new Map();
}
function v53EnsureLibraryIndex(){
  if(V53_LIB.libraryRef===S.library && V53_LIB.libraryLen===S.library.length && V53_LIB.searchIndex.length===S.library.length) return;
  V53_LIB.libraryRef=S.library;
  V53_LIB.libraryLen=S.library.length;
  V53_LIB.searchIndex=S.library.map((item,index)=>({
    item,index,
    title:cleanTitle(item.title),
    search:cleanTitle(item.title).toLocaleLowerCase()
  }));
  V53_LIB.overview=null;
  V53_LIB.filterKey='';
  V53_LIB.filtered=[];
}
function v53LibraryOverview(){
  v53EnsureLibraryIndex();
  if(V53_LIB.overview)return V53_LIB.overview;
  const byCat=new Map(S.categories.map(c=>[c.id,{items:0,done:0,knownDone:0,total:0,unknown:false}]));
  let totalDone=0,totalAll=0;
  for(const i of S.library){
    let x=byCat.get(i.categoryId);
    if(!x){x={items:0,done:0,knownDone:0,total:0,unknown:false};byCat.set(i.categoryId,x);}
    const progress=Math.max(0,Number(i.progress)||0);
    const total=Number(i.total)||0;
    x.items++; x.done+=progress;
    if(total>0){
      x.knownDone+=Math.min(progress,total);
      x.total+=total;
      totalDone+=Math.min(progress,total);
      totalAll+=total;
    }else x.unknown=true;
  }
  V53_LIB.overview={byCat,totalDone,totalAll,overallPct:totalAll>0?Math.round(totalDone/totalAll*100):0};
  return V53_LIB.overview;
}
function v53EnsureLastTouchedIndex(){
  const tail=S.sessions.length ? `${S.sessions[S.sessions.length-1]?.id||''}:${S.sessions[S.sessions.length-1]?.timestamp||0}` : '';
  if(V53_LIB.sessionRef===S.sessions && V53_LIB.sessionLen===S.sessions.length && V53_LIB.sessionTail===tail)return;
  const map=new Map();
  // Newest wins. Index by stable Library ID first, with normalized title as a legacy fallback.
  for(let n=S.sessions.length-1;n>=0;n--){
    const ss=S.sessions[n];
    const ts=Number(ss?.timestamp)||0;
    for(const t of (ss?.titles||[])){
      if(t?.libraryId && !map.has('id:'+t.libraryId))map.set('id:'+t.libraryId,ts);
      const title=cleanTitle(t?.title||'').toLocaleLowerCase();
      if(title && !map.has('title:'+title))map.set('title:'+title,ts);
    }
  }
  V53_LIB.sessionRef=S.sessions;
  V53_LIB.sessionLen=S.sessions.length;
  V53_LIB.sessionTail=tail;
  V53_LIB.lastTouched=map;
}
function v53LastTouched(item){
  v53EnsureLastTouchedIndex();
  return V53_LIB.lastTouched.get('id:'+item.id) ||
         V53_LIB.lastTouched.get('title:'+cleanTitle(item.title).toLocaleLowerCase()) || 0;
}
function v53FilteredLibrary(catFilter,statusFilter,priorityFilter,q){
 v53EnsureLibraryIndex();const nq=String(q||'').trim().toLocaleLowerCase(),cats=Array.isArray(S.histFilters?.libCategories)?S.histFilters.libCategories:[],sort=S.histFilters?.libSort||'priority';
 const key=[V53_LIB.libraryToken,S.library.length,catFilter,cats.slice().sort().join(','),statusFilter,priorityFilter,nq,sort].join('|');if(V53_LIB.filterKey===key)return V53_LIB.filtered;
 let rows=V53_LIB.searchIndex;if(cats.length)rows=rows.filter(x=>cats.includes(x.item.categoryId));else if(catFilter!=='all')rows=rows.filter(x=>x.item.categoryId===catFilter);
 if(statusFilter!=='all')rows=rows.filter(x=>x.item.status===statusFilter);if(priorityFilter!=='all')rows=rows.filter(x=>x.item.priority===priorityFilter);if(nq)rows=rows.filter(x=>x.search.includes(nq));
 const rank={low:0,medium:1,high:2};
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
 const cmpTitle=(a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'});
 rows=rows.slice().sort((a,b)=>{
   let d=0;
   if(sort==='title-asc') return cmpTitle(a,b);
   if(sort==='title-desc') return cmpTitle(b,a);
   if(sort==='priority-asc') d=(rank[a.item.priority]??1)-(rank[b.item.priority]??1);
   else if(sort==='priority-desc'||sort==='priority') d=(rank[b.item.priority]??1)-(rank[a.item.priority]??1);
   else if(sort==='rating-asc') d=num(a.item.rating)-num(b.item.rating);
   else if(sort==='rating-desc') d=num(b.item.rating)-num(a.item.rating);
   else if(sort==='progress-asc') d=num(a.item.progress)-num(b.item.progress);
   else if(sort==='progress-desc') d=num(b.item.progress)-num(a.item.progress);
   else if(sort==='total-asc') d=num(a.item.total)-num(b.item.total);
   else if(sort==='total-desc') d=num(b.item.total)-num(a.item.total);
   return d||cmpTitle(a,b);
 });
 V53_LIB.filterKey=key;V53_LIB.filtered=rows.map(x=>x.item);return V53_LIB.filtered;
}
function v53DebouncedLibrarySearch(value){
  S.histFilters.libSearch=value;
  S.libPage=0;
  clearTimeout(V53_LIB_SEARCH_TIMER);
  V53_LIB_SEARCH_TIMER=setTimeout(()=>{
    if(S.view!=='library')return;

    // render() replaces the Library DOM, including the search input.
    // Remember whether the user is actively typing and restore the new
    // input's focus/caret immediately after the debounced refresh.
    const active=document.activeElement;
    const wasTyping=!!(active && active.classList && active.classList.contains('lib-search'));
    const caret=wasTyping && active.selectionStart!=null ? active.selectionStart : String(S.histFilters.libSearch||'').length;
    const end=wasTyping && active.selectionEnd!=null ? active.selectionEnd : caret;

    render();

    if(wasTyping){
      const next=document.querySelector('.lib-search');
      if(next){
        next.focus({preventScroll:true});
        try{ next.setSelectionRange(Math.min(caret,next.value.length),Math.min(end,next.value.length)); }catch(e){}
      }
    }
  },180);
}


