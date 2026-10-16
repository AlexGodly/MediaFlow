/* MediaFlow v443 — configured/public recovery APIs work without an API test.
 * Gateway status is resolved on demand, with a bounded per-account cache.
 * This module does not add fictitious adapters, cloud secrets or data writes. */
const MF443_VERSION=443;
const MF443_BASE_COVER_ENABLED=MF424_DEFAULT.enabled.slice();
const MF443_BASE_COVER_PRIORITIES=MF424_DEFAULT.priorities.slice();
const MF443={account:'',checkedAt:0,pending:null,lastError:'',migrated:false};
function mf443Account(){return String(AUTH_USER?.id||'');}
function mf443ReadyCoverProviders(){
 return MF424_PROVIDER_META.filter(p=>MF434_COVER.has(p.id)&&
  mf434ProviderStatus(p.id)?.configured===true&&mf434ProviderStatus(p.id)?.testable===true)
  .map(p=>p.id);
}
function mf443MaybeEnableDefaultCovers(){
 const configured=mf443ReadyCoverProviders();
 if(!configured.length)return;
 // Default recovery previously excluded gateway adapters even when configured.
 // Migrate ONLY unchanged default selections; never overwrite custom provider choices.
 const previous=S.settings?.v424Covers;
 const baseline=MF443_BASE_COVER_ENABLED;
 const unchanged=previous&&Array.isArray(previous.enabled)&&
  previous.enabled.length===baseline.length&&
  baseline.every(id=>previous.enabled.includes(id));
 MF424_DEFAULT.enabled=[...new Set([...baseline,...configured])];
 MF424_DEFAULT.priorities=[...new Set([...MF443_BASE_COVER_PRIORITIES,...configured])];
 if(unchanged){
  S.settings.v424Covers={...previous,
   enabled:[...new Set([...previous.enabled,...configured])],
   priorities:[...new Set([...(previous.priorities||[]),...configured])]};
  Promise.resolve(saveState()).catch(e=>console.warn('v443 default cover migration',e));
 }
}
function mf443RepaintProviderSettings(){
 if(String(S.view||'')!=='settings')return;
 try{
  const cover=document.querySelector('.mf430-settings-provider-list');
  if(cover){
   const wrap=document.createElement('div');wrap.innerHTML=mf425SettingsMarkup();
   const next=wrap.querySelector('.mf430-settings-provider-list');
   if(next)cover.replaceWith(next);
  }
  const metadata=document.querySelector('.mf439-provider-list');
  if(metadata){
   const wrap=document.createElement('div');wrap.innerHTML=mf439SettingsHtml();
   const next=wrap.querySelector('.mf439-provider-list');
   if(next)metadata.replaceWith(next);
  }
  if(typeof mf438Paint==='function')mf438Paint();
  if(typeof mf434RefreshPanel==='function')mf434RefreshPanel();
 }catch(e){console.warn('v443 provider settings refresh:',String(e?.message||e));}
}
async function mf443EnsureGateway(force=false){
 const account=mf443Account();
 if(!account||!supabase)return null;
 if(MF443.account!==account){
  MF443.account=account;MF443.checkedAt=0;MF443.lastError='';
  MF424_DEFAULT.enabled=MF443_BASE_COVER_ENABLED.slice();
  MF424_DEFAULT.priorities=MF443_BASE_COVER_PRIORITIES.slice();
  MF434.status=null;mf434EnableAdapters();
 }
 if(!force&&MF443.checkedAt&&Date.now()-MF443.checkedAt<5*60*1000)
  return MF434.status;
 if(MF443.pending)return MF443.pending;
 MF443.pending=(async()=>{
  try{
   const state=await mf434Call('status');
   if(account!==mf443Account())return null; // Never cross account boundaries.
   if(!Array.isArray(state?.providers))throw Error('Gateway returned no provider list');
   MF434.status=state;
   MF443.checkedAt=Date.now();MF443.lastError='';
   mf434EnableAdapters();
   mf443MaybeEnableDefaultCovers();
   mf443RepaintProviderSettings();
   return state;
  }catch(e){
   MF443.lastError=String(e?.message||e).slice(0,160);
   MF443.checkedAt=Date.now(); // Avoid repeated silent retry storms.
   console.warn('v443 gateway status temporarily unavailable:',MF443.lastError);
   return MF434.status;
  }finally{MF443.pending=null;}
 })();
 return MF443.pending;
}
// The Check connections button is optional diagnostics, not a prerequisite.
mf434RefreshGateway=async function(){
 await mf443EnsureGateway(true);
 mf443RepaintProviderSettings();
};
App.mf434RefreshGateway=mf434RefreshGateway;
// Resumed background cover jobs must have the same gateway readiness as manual jobs.
const mf443CoverRunBase=mf424Run;
mf424Run=async function(...args){
 if(!MF424.job||MF424.running)return;
 await mf443EnsureGateway();
 return mf443CoverRunBase.apply(this,args);
};
const mf443CoverConfigBase=App.mf425OpenConfig;
App.mf425OpenConfig=async function(...args){
 await mf443EnsureGateway();
 return mf443CoverConfigBase?.apply(this,args);
};
App.mf424OpenConfig=()=>App.mf425OpenConfig('settings');
const mf443InstantBase=App.mf425Instant;
App.mf425Instant=async function(...args){
 await mf443EnsureGateway();
 return mf443InstantBase?.apply(this,args);
};
MediaFlowRuntime.registerPageEnhancer('settings',()=>{
 if(String(S.view||'')==='settings')void mf443EnsureGateway();
});
const mf443BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const backup=mf443BackupBase.apply(this,arguments);
 if(backup){
  backup.mediaFlowVersion=443;backup.backupVersion=443;
  const manifest=backup.backupManifest||(backup.backupManifest={});
  manifest.includes={...(manifest.includes||{}),v443AutomaticProviderAvailability:true};
 }
 return backup;
};
window.MediaFlowV443=Object.freeze({version:443,
 ensureGateway:mf443EnsureGateway,
 readyCoverProviders:mf443ReadyCoverProviders,
 state:()=>({gatewayAvailable:Boolean(MF434.status?.providers),lastError:MF443.lastError})});
