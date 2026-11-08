/* MediaFlow v560 — TMDB stays on when a saved recovery job exists.
 * Since v455, mf424Defaults() returns a saved cover job's own provider list
 * (job.v455Providers) instead of the user's settings, for as long as that job
 * is kept in the browser. That list predates v559, so TMDB kept showing as
 * "off for background recovery" in Find cover automatically and the
 * workspaces, and was never queried. When TMDB is on in the saved settings and
 * the gateway reports it ready, it is now part of the enabled list everywhere,
 * including that saved job (so a resumed job uses it too).
 */
const MF560_VERSION=560;
function mf560TmdbOnInSettings(){
 const saved=S.settings?.v424Covers?.enabled;
 return Array.isArray(saved)&&saved.includes('tmdb');
}
const mf560DefaultsBase=mf424Defaults;
mf424Defaults=function(){
 const prefs=mf560DefaultsBase.apply(this,arguments);
 const enabled=Array.isArray(prefs?.enabled)?prefs.enabled:[];
 if(enabled.includes('tmdb')||!mf560TmdbOnInSettings()||!mf559TmdbReady())return prefs;
 return {...prefs,enabled:[...enabled,'tmdb']};
};
// Persist TMDB into the saved job too, so it survives reloads and resumes.
function mf560PatchSavedJob(){
 const job=MF424.job;
 if(!job||!Array.isArray(job.v455Providers)||job.v455Providers.includes('tmdb'))return false;
 if(!mf560TmdbOnInSettings()||!mf559TmdbReady())return false;
 job.v455Providers=[...job.v455Providers,'tmdb'];
 Promise.resolve(mf424SaveJob()).catch(e=>console.warn('v560 saved job TMDB',e));
 return true;
}
const mf560EnsureBase=mf443EnsureGateway;
mf443EnsureGateway=async function(...args){
 const state=await mf560EnsureBase.apply(this,args);
 try{mf560PatchSavedJob();}catch(e){console.warn('v560 TMDB job patch',String(e?.message||e));}
 return state;
};
window.MediaFlowV560=Object.freeze({version:MF560_VERSION,
 // Run MediaFlowV560.diagnose() in the browser console to see which cover sources are on.
 diagnose:()=>({tmdbInSettings:mf560TmdbOnInSettings(),tmdbReady:mf559TmdbReady(),
  savedJobProviders:Array.isArray(MF424.job?.v455Providers)?MF424.job.v455Providers.slice():null,
  enabledNow:mf424Defaults().enabled.slice(),
  tmdbUsable:Boolean(mf424CoverProviderChoices({title:'x'}).find(p=>p.id==='tmdb')?.usable)})});
