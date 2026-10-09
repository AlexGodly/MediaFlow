/* MediaFlow v327 — no public media snapshots: one existing cloud source of truth.
 * The Edge Function verifies profile visibility and returns sanitized live data.
 * Workspace renderers, scope guards and read-only actions remain v325/v326.
 */
const MF327={version:327,endpoint:SUPABASE_URL+'/functions/v1/mediaflow-public-live',cachedAt:0,live:true};
async function mf327FetchSection(section,owner,page){
 const url=MF327.endpoint+'?'+new URLSearchParams({owner,section,page:String(page)});
 const response=await fetch(url,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Accept:'application/json'},cache:'no-store'});
 let body;try{body=await response.json();}catch(_){throw Error('The live public API returned an invalid response.');}
 if(!response.ok)throw Error(body.error||'Unable to access the owner’s current Workspace.');
 if(!Array.isArray(body.items))throw Error('Unexpected public Workspace response');
 MF327.cachedAt=Date.parse(body.updated_at)||Date.now();return body;
}
mf325ReadAll=async function(section,owner){
 if(!MF323.profile||MF323.profile.user_id!==owner)throw Error('Public profile changed');
 const results=[];for(let page=0;page<200;page++){
  const result=await mf327FetchSection(section,owner,page);
  if(!MF323.profile||MF323.profile.user_id!==owner)throw Error('Public profile changed');
  results.push(...result.items);
  if(!result.has_more)return results;
 }
 throw Error('Live public data exceeded the maximum permitted response size');
};
// Saving edits to the profile remains supported, but no Library/History/Stats copies are published.
mf323Publish=async function(){
 if(!AUTH_USER)return false;
 const p=await mfMyProfile();if(!p?.is_public){mf323Status('Save your public profile first.');return false;}
 mf323Status('Profile visibility saved. Workspace pages read directly from current cloud data.');
 MF325.cache.clear();return true;
};
MF323.publish=async()=>{
 if(!AUTH_USER)return false;
 MF325.cache.clear();mf323Status('Live public data refreshes automatically after Cloud Sync. No publication required.');
 return true;
};
// v325/326 chain is intentionally bypassed: no duplicated public Workspace records.
MF325.publish=MF323.publish;
mf323Categories=async function(){
 try{const owner=MF323.profile?.user_id;if(!owner)return;const meta=await mf325ReadAll('meta',owner);MF323.categories=Array.isArray(meta[0]?.categories)?meta[0].categories:[];}
 catch(e){console.warn('[v327] Could not load public categories',e);MF323.categories=[];}
 document.getElementById('mf323-cats')?.replaceChildren(...(MF323.categories.length?MF323.categories:[{name:'No public categories available'}]).map(c=>{const tag=document.createElement('span');tag.className='mf323-tag';tag.textContent=c.name||'Category';return tag;}));
};
// The native view is refreshed from the original account state, not from published snapshots.
MF325.refresh=()=>{MF325.cache.clear();MF325.current=null;mf325LoadTab();};
// The native header timestamp represents the latest cloud update, not a publication event.
const mf327OldLoadTab=mf325LoadTab;
mf325LoadTab=async function(){await mf327OldLoadTab();const host=document.getElementById('mf323-tab-body');if(!host)return;const stamp=host.querySelector('.mf325-public-notice strong');if(stamp){stamp.textContent='Read only · Cloud updated '+new Date(MF327.cachedAt||Date.now()).toLocaleString();}const refresh=host.querySelector('.mf325-refresh');if(refresh)refresh.textContent='Refresh live view';};
mf323LoadTab=mf325LoadTab;
// Correct the old Studio instructions and remove the redundant publish action.
const mf327OldEditor=mf323Editor;
mf323Editor=async function(){await mf327OldEditor();const panel=document.querySelector('.mf323-editor');if(!panel)return;
 panel.querySelectorAll('p').forEach(el=>{
  if(el.textContent.includes('Saving enables your public profile and publishes'))el.textContent='Saving updates your public profile settings. Visible pages read current cloud-synced Workspace data directly; no duplicate Library, History, or Statistics copies are created. Changes appear after Cloud Sync and a page refresh.';
 });
 const old=panel.querySelector('.mf323-editor-head button[onclick*="publish"]');if(old)old.remove();
 const submit=panel.querySelector('#mf323-save');if(submit)submit.textContent='Save profile settings';
};
mfProfileEditor=mf323Editor;
MF325.previous=()=>{const host=document.getElementById('mf323-tab-body');if(host)host.innerHTML='<div class="mf323-error" role="alert">Live public data is temporarily unavailable. Please retry later.</div>';};
MF327.refresh=()=>MF325.refresh();
window.MF327=MF327;
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:327,liveWorkspacePublicTabs:true,snapshotPublishing:false};
