/* MediaFlow v559 — TMDB covers on for Find cover automatically and recovery.
 * - Turns TMDB on once in the saved cover-provider selection (it showed as
 *   "off for background recovery" because v443 only auto-enabled gateway
 *   providers when the selection was still the untouched default).
 * - Titles with a saved TMDB ID try TMDB first (ID-first ordering).
 * - Sends a movie/TV hint so the gateway queries the right TMDB catalogue.
 * - Retries once when the gateway's 1-second per-provider throttle answers 429,
 *   so back-to-back recovery titles are not marked unresolved.
 */
const MF559_VERSION=559;
const MF559_FLAG='v559TmdbCoversOn';
function mf559MediaKind(item){
 const cat=typeof getCategory==='function'?getCategory(item?.categoryId):null;
 const name=(String(item?.categoryId||'')+' '+String(cat?.name||'')).toLowerCase();
 const ids=item?.externalIds||{};
 if(/^[1-9]\d*$/.test(String(ids.tmdb_tv||'')))return 'tv';
 if(/movie|film/.test(name))return 'movie';
 if(/\btv\b|television|series|show/.test(name))return 'tv';
 return '';
}
// TMDB IDs count as "has an ID" so those titles query TMDB before name-search providers.
const mf559HasIdBase=mf424HasID;
mf424HasID=function(item,provider){
 if(provider==='tmdb'){const x=item?.externalIds||{};
  return /^[1-9]\d*$/.test(String(x.tmdb||''))||/^[1-9]\d*$/.test(String(x.tmdb_tv||''));}
 return mf559HasIdBase.apply(this,arguments);
};
const mf559PayloadBase=mf434Payload;
mf434Payload=function(item,provider){
 const payload=mf559PayloadBase.apply(this,arguments);
 if(provider==='tmdb'){const kind=mf559MediaKind(item);if(kind)payload.kind=kind;}
 return payload;
};
const mf559CallBase=mf434Call;
mf434Call=async function(action,payload={}){
 try{return await mf559CallBase.call(this,action,payload);}
 catch(e){
  if(action!=='search'||!/^Please wait \d+ seconds? before requesting this source/i.test(String(e?.message||'')))throw e;
  const seconds=Number(String(e.message).match(/\d+/)?.[0])||1;
  await new Promise(resolve=>setTimeout(resolve,Math.min(5000,seconds*1000+250)));
  return mf559CallBase.call(this,action,payload);
 }
};
function mf559TmdbReady(){
 const s=typeof mf434ProviderStatus==='function'?mf434ProviderStatus('tmdb'):null;
 return Boolean(s?.configured&&s?.testable);
}
function mf559EnableTmdb(){
 if(!mf559TmdbReady())return false;
 if(!MF424_DEFAULT.enabled.includes('tmdb'))MF424_DEFAULT.enabled.push('tmdb');
 if(!MF424_DEFAULT.priorities.includes('tmdb'))MF424_DEFAULT.priorities.push('tmdb');
 S.settings=S.settings||{};
 if(S.settings[MF559_FLAG])return false; // One-time: respect a later manual "off".
 const prev=S.settings.v424Covers||{};
 const enabled=Array.isArray(prev.enabled)?prev.enabled.slice():MF424_DEFAULT.enabled.slice();
 const priorities=Array.isArray(prev.priorities)?prev.priorities.slice():MF424_DEFAULT.priorities.slice();
 if(!enabled.includes('tmdb'))enabled.push('tmdb');
 if(!priorities.includes('tmdb'))priorities.push('tmdb');
 S.settings.v424Covers={...MF424_DEFAULT,...prev,enabled,priorities};
 S.settings[MF559_FLAG]=true;
 Promise.resolve(saveState()).catch(e=>console.warn('v559 TMDB cover setting',e));
 return true;
}
const mf559EnsureBase=mf443EnsureGateway;
mf443EnsureGateway=async function(...args){
 const state=await mf559EnsureBase.apply(this,args);
 try{if(mf559EnableTmdb()&&typeof mf443RepaintProviderSettings==='function')mf443RepaintProviderSettings();}
 catch(e){console.warn('v559 TMDB enable',String(e?.message||e));}
 return state;
};
window.MediaFlowV559=Object.freeze({version:MF559_VERSION,mediaKind:mf559MediaKind,
 tmdbEnabled:()=>mf424Defaults().enabled.includes('tmdb')});
