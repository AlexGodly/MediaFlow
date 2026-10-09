/* ============================================================

   CONSTANTS

   ============================================================ */

const SUPABASE_URL='https://wgeijxfdpgehesxialxm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_d2P0qZlvGZOSqcUzEg3BNg_3wQsHY_M';
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

  {id:'seasonal',            name:'Seasonal Anime',         icon:'🌸', type:'video',   unit:'episodes', target:4,  weight:4, minutesPerUnit:24,  color:'#FF5D9E', seasonal:true,  enabled:true, custom:false, iconUrl:'assets/category-icons/seasonal-anime.png'},

  {id:'missedanime',         name:'Missed Anime',           icon:'🕘', type:'video',   unit:'episodes', target:4,  weight:4, minutesPerUnit:24,  color:'#FF7A59', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/missed-anime.png'},

  {id:'finishedanime',       name:'Finished Anime',         icon:'✅', type:'video',   unit:'episodes', target:4,  weight:3, minutesPerUnit:24,  color:'#50B878', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/finished-anime.png'},

  {id:'animemovies',         name:'Anime Movies',           icon:'🎞️', type:'video',  unit:'movies',   target:1,  weight:2, minutesPerUnit:100, color:'#FF9F1C', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/anime-movies.png'},

  {id:'manga',               name:'Asian Comics',           icon:'📖', type:'reading', unit:'chapters', target:20, weight:4, minutesPerUnit:6,   color:'#7C6CF2', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/asian-comics.png'},

  {id:'movies',              name:'Movies',                 icon:'🎬', type:'video',   unit:'movies',   target:1,  weight:3, minutesPerUnit:115, color:'#FF647C', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/movies.png'},

  {id:'tv',                  name:'TV Series',              icon:'📺', type:'video',   unit:'episodes', target:2,  weight:3, minutesPerUnit:42,  color:'#5AA9E6', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/tv-series.png'},

  {id:'backlog',             name:'Anime Backlog',          icon:'🔖', type:'video',   unit:'episodes', target:5,  weight:3, minutesPerUnit:24,  color:'#FF5D9E', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/anime-backlog.png'},

  {id:'animemoviesbacklog',  name:'Anime Movies Backlog',   icon:'🔖', type:'video',   unit:'movies',   target:1,  weight:2, minutesPerUnit:100, color:'#EF5DA8', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/anime-movies-backlog.png'},

  {id:'mangabacklog',        name:'Asian Comics Backlog',   icon:'🔖', type:'reading', unit:'chapters', target:20, weight:3, minutesPerUnit:6,   color:'#7967E8', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/asian-comics-backlog.png'},

  {id:'tvbacklog',           name:'TV Series Backlog',      icon:'🔖', type:'video',   unit:'episodes', target:2,  weight:2, minutesPerUnit:42,  color:'#5887FF', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/tv-series-backlog.png'},

  {id:'moviesbacklog',       name:'Movies Backlog',         icon:'🔖', type:'video',   unit:'movies',   target:1,  weight:2, minutesPerUnit:115, color:'#75B85A', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/movies-backlog.png'},

  {id:'books',               name:'Books',                  icon:'📕', type:'reading', unit:'chapters', target:5,  weight:2, minutesPerUnit:20,  color:'#E84A8A', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/books.png'},

  {id:'booksbacklog',        name:'Books Backlog',          icon:'🔖', type:'reading', unit:'chapters', target:5,  weight:2, minutesPerUnit:20,  color:'#E84A8A', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/books-backlog.png'},

  {id:'novels',              name:'Novels',                 icon:'📘', type:'reading', unit:'chapters', target:5,  weight:3, minutesPerUnit:15,  color:'#2E9CFF', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/novels.png'},

  {id:'novelsbacklog',       name:'Novels Backlog',         icon:'🔖', type:'reading', unit:'chapters', target:5,  weight:2, minutesPerUnit:15,  color:'#2E9CFF', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/novels-backlog.png'},

  {id:'magazines',           name:'Magazines',              icon:'🗞️', type:'reading', unit:'issues',   target:2,  weight:2, minutesPerUnit:25,  color:'#35BEB0', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/magazines.png'},

  {id:'magazinesbacklog',    name:'Magazines Backlog',      icon:'🔖', type:'reading', unit:'issues',   target:2,  weight:2, minutesPerUnit:25,  color:'#35BEB0', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/magazines-backlog.png'},

  {id:'onlinemedia',         name:'Online Media',           icon:'🌐', type:'video',   unit:'episodes', target:3,  weight:2, minutesPerUnit:20,  color:'#F06292', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/online-media.png'},

  {id:'onlinemediabacklog',  name:'Online Media Backlog',   icon:'🔖', type:'video',   unit:'episodes', target:3,  weight:2, minutesPerUnit:20,  color:'#F06292', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/online-media-backlog.png'},

  {id:'comics',              name:'Comics',                 icon:'📰', type:'reading', unit:'issues',   target:3,  weight:2, minutesPerUnit:15,  color:'#2EA7FF', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/comics.png'},

  {id:'comicsbacklog',       name:'Comics Backlog',         icon:'🔖', type:'reading', unit:'issues',   target:3,  weight:2, minutesPerUnit:15,  color:'#2EA7FF', seasonal:false, enabled:true, custom:false, iconUrl:'assets/category-icons/comics-backlog.png'},

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
  historyPageSize: 10, // v253: persistent History entries-per-page preference
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

