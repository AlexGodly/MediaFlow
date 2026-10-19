/* MediaFlow v434 gateway adapter; v443 makes testing optional for configured connections.
 * A successful gateway response only validates access; it does not establish a
 * match to a Library title. The user selects any unconfirmed results manually. */
const MF434={status:null,loading:false,tests:{},lookup:[],lookupProvider:"",cache:new Map(),busy:false};
const MF434_COVER=new Set(["tmdb","omdb","fanart","animeschedule","malofficial","episodate","gutendex"]);
const MF434_MAPPING=new Set(["metron","trakt","watchmode"]);
const MF434_LABELS={tmdb:"TMDB",omdb:"OMDb",fanart:"Fanart.tv",animeschedule:"AnimeSchedule",
 malofficial:"MyAnimeList Official",metron:"Metron",trakt:"Trakt",watchmode:"Watchmode",
 episodate:"EpisoDate",gutendex:"Gutendex",hardcover:"Hardcover"};
const mf434Esc=v=>mf424Escape(String(v??""));
function mf434SavedTests(){return Array.isArray(S.settings?.v434TestedProviders)?S.settings.v434TestedProviders:[];}
function mf434ProviderStatus(id){return MF434.status?.providers?.find(row=>row.id===id)||null;}
function mf434Session(){return supabase?.auth?.getSession?.();}
async function mf434Call(action,payload={}){
 if(!AUTH_USER||!supabase)throw Error("Sign in to use verified API providers.");
 const {data,error}=await mf434Session();
 if(error||!data?.session?.access_token||String(data.session.user?.id)!==String(AUTH_USER.id))
   throw Error("MediaFlow session is unavailable. Sign in again.");
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),17500);
 try{
  const response=await fetch(SUPABASE_URL+"/functions/v1/mediaflow-api-gateway",{
   method:"POST",headers:{"Authorization":"Bearer "+data.session.access_token,
     "apikey":SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},
   body:JSON.stringify({action,...payload}),signal:ctrl.signal
  });
  const json=await response.json();
  if(!response.ok)throw Error(String(json.error||"Provider request failed").slice(0,160));
  return json;
 }finally{clearTimeout(timer);}
}
function mf434EnableAdapters(){
 for(const p of MF424_PROVIDER_META){
  const status=mf434ProviderStatus(p.id);
  if(!MF434_COVER.has(p.id))continue;
  const enabled=Boolean(status?.configured&&status?.testable);
  p.limit=enabled?(p.id==="tmdb"?8:6):0;
  p.gap=enabled?Math.max(10000,Number(p.gap)||10000):0;
  if(enabled)MF424_EXTRA_COVER_ADAPTERS.set(p.id,(item)=>mf434Find(item,p.id));
  else MF424_EXTRA_COVER_ADAPTERS.delete(p.id);
 }
}
async function mf434RefreshGateway(){
 if(MF434.loading)return;
 MF434.loading=true;
 try{MF434.status=await mf434Call("status");mf434EnableAdapters();}
 catch(e){MF434.status=null;mf434EnableAdapters();console.warn("Gateway status:",String(e.message||e));showToast("Provider gateway: "+String(e.message||e));}
 finally{MF434.loading=false;mf434RefreshPanel();}
}
function mf434Payload(item,provider){
 const title=String((typeof cleanTitle==="function"?cleanTitle(item?.title||""):item?.title)||"").slice(0,110).trim();
 if(title.length<2)throw Error("Enter a title to search.");
 const externalIds={};
 for(const [key,v] of Object.entries(item.externalIds||{})){
  if(!/^[a-z][a-z0-9_]{0,32}$/.test(key))continue;
  const str=String(v||"").trim();
  if(/^[\w.:-]{1,120}$/.test(str))externalIds[key]=str;
 }
 return {provider,title,year:item.year||item.releaseYear||item.publicationYear||"",
  externalIds};
}
async function mf434Find(item,provider){
 if(!MF434_COVER.has(provider))return [];
 if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway();
 const status=mf434ProviderStatus(provider);
 if(!status?.configured||!status?.testable)return [];
 const key=String(AUTH_USER?.id||"")+":"+provider+":"+item.title+":"+JSON.stringify(item.externalIds||{});
 const hit=MF434.cache.get(key);
 if(hit&&hit.until>Date.now())return hit.rows;
 const response=await mf434Call("search",mf434Payload(item,provider));
 const rows=(response.results||[]).filter(r=>typeof r.url==="string"&&r.url.startsWith("https://")&&r.provider===provider)
  .map(row=>({...row,externalIdCandidates:Array.isArray(row.externalIdCandidates)?row.externalIdCandidates:[]}));
 if(MF434.cache.size>300)MF434.cache.delete(MF434.cache.keys().next().value);
 MF434.cache.set(key,{until:Date.now()+1200000,rows});
 return rows;
}
function mf434TestTitle(){return String(document.getElementById("mf434-test-title")?.value||"").trim();}
async function mf434TestProvider(provider){
 const status=mf434ProviderStatus(provider);
 if(!status?.configured||!status?.testable){showToast("This provider is not configured or cannot be tested yet.");return;}
 const title=mf434TestTitle();
 if(title.length<2){showToast("Enter a real title to test. Example: Breaking Bad, Naruto, Frankenstein.");return;}
 if(MF434.busy)return;
 MF434.busy=true;
 const area=document.getElementById("mf434-test-results");if(area)area.textContent="Checking "+provider+"…";
 try{
  const reply=await mf434Call("search",{provider,title,externalIds:{}});
  // OMDb reports some failures inside HTTP 200 JSON. A healthy provider test
  // must confirm at least one exact-title record, not merely a 200 response.
  if(provider==="omdb"&&!(reply.results?.length>0))
    throw Error("OMDb responded, but no matching title was found. Try The Matrix or Breaking Bad.");
  MF434.tests[provider]={checked:Date.now(),found:reply.results?.length||0};
  S.settings=S.settings||{};
  S.settings.v434TestedProviders=[...new Set([...mf434SavedTests(),provider])];
  await saveState();
  mf434EnableAdapters();
  if(area)area.textContent=MF434_LABELS[provider]+" responded successfully · "+MF434.tests[provider].found+" matching records. "+(MF434_COVER.has(provider)?"Cover Recovery can use this connection without testing.":"ID-only source; no unlicensed artwork.");
  showToast(MF434_LABELS[provider]+" API connection tested successfully.");
 }catch(e){
  if(area)area.textContent=MF434_LABELS[provider]+": "+String(e.message||e);
  showToast("Provider test failed: "+String(e.message||e));
 }
 finally{MF434.busy=false;mf434RefreshPanel(true);}
}
function mf434Panel(){
 const statuses=MF434.status?.providers||[];
 const label=p=>mf434Esc(MF434_LABELS[p.id]||p.id);
 const statusText=p=>!p.testable?"API access or licensing review":!p.configured?"Credential missing":mf434SavedTests().includes(p.id)?"Ready · last diagnostic passed":"Ready · optional test";
 return '<div class="mf434-connection" data-mf-setting-id="cover-api-gateway">'+
 '<header><strong>Verified API connections</strong><span>Personal MediaFlow · v434</span></header>'+
 '<p>Configured providers work without testing first. Test API is optional diagnostics. Credentials remain in Supabase.</p>'+
 '<div class="mf434-test-toolbar"><label>Test title <input id="mf434-test-title" type="text" placeholder="Breaking Bad / Naruto / Frankenstein" maxlength="110" value="'+mf434Esc(MF434.lastTestTitle||"")+'"></label>'+
 '<button class="btn btn-ghost" type="button" onclick="App.mf434RefreshGateway()">Check connections</button></div>'+
 '<div class="mf434-status-grid">'+(statuses.length?statuses.map(p=>'<div class="mf434-provider" data-provider="'+mf434Esc(p.id)+'"><div><strong>'+label(p)+'</strong><small>'+mf434Esc(statusText(p))+'</small></div>'+
 '<button type="button" class="btn btn-ghost" '+(!p.testable||!p.configured||MF434.busy?'disabled':'')+' onclick="App.mf434TestProvider(\''+mf434Esc(p.id)+'\')">Test API</button></div>').join(''):'<p>Click Check connections while signed in to discover safely configured providers.</p>')+'</div>'+
 '<div id="mf434-test-results" role="status" aria-live="polite"></div>'+
 '<p class="mf434-access-note">Comic Vine: non-commercial approval needed. Watchmode: restricted daily credits, ID-only. Hardcover: awaiting GraphQL contract review. AniDB, Marvel, SIMKL and TheTVDB: pending access. Podcast Index: excluded entirely.</p>'+
 '</div>';
}
function mf434RefreshPanel(replaceAll=true){
 const panel=document.querySelector('[data-mf-setting-id="cover-api-gateway"]');
 if(!panel)return;
 const testTitle=panel.querySelector("#mf434-test-title");
 if(testTitle)MF434.lastTestTitle=testTitle.value;
 const oldMessage=panel.querySelector("#mf434-test-results")?.textContent||"";
 // The legacy Settings Center mounts sections once; refresh just its source
 // rows when a provider becomes verified, without losing the current tab.
 const oldSources=document.querySelector(".mf430-settings-provider-list");
 if(oldSources){
  const temp=document.createElement("div");
  temp.innerHTML=mf425SettingsMarkup();
  const next=temp.querySelector(".mf430-settings-provider-list");
  if(next)oldSources.replaceWith(next);
 }
 if(!replaceAll)return;
 const replacement=document.createElement("div");
 replacement.innerHTML=mf434Panel();
 const fresh=replacement.firstElementChild;
 const status=fresh?.querySelector("#mf434-test-results");
 if(status)status.textContent=oldMessage;
 if(fresh)panel.replaceWith(fresh);
}
const mf434OldSettings=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
 const html=mf434OldSettings.apply(this,arguments);
 return html.replace(mf433ReadinessMarkup(),mf434Panel());
};
function mf434IdsEditorLookupHtml(item){
 const title=mf434Esc(item?.title||"");
 const options=[...MF434_COVER,...MF434_MAPPING].map(id=>'<option value="'+id+'">'+mf434Esc(MF434_LABELS[id]||id)+'</option>').join("");
 return '<div class="mf434-id-lookup"><strong>Discover verified External IDs</strong>'+
 '<p>Review a provider record and choose Link IDs. Existing values will never be replaced, and nothing is saved until you save this title.</p>'+
 '<div class="mf434-lookup-tools"><input id="mf434-lookup-title" aria-label="Search title" value="'+title+'" placeholder="Title to identify" maxlength="110">'+
 '<select id="mf434-lookup-provider" aria-label="ID provider">'+options+'</select>'+
 '<button type="button" class="btn btn-ghost mf436-find-ids" data-v225-icon="search" data-v225-iconified="1" onclick="App.mf434SearchIds()">'+mf425Icon('search',16)+'<span>Find IDs</span></button></div>'+
 '<div id="mf434-lookup-results" aria-live="polite"></div></div>';
}
const mf434EditorBase=v377IdsEditorHtml;
v377IdsEditorHtml=function(item){
 const html=mf434EditorBase(item);
 return html.replace('<div class="mf377-mal-preview"',mf434IdsEditorLookupHtml(item)+'<div class="mf377-mal-preview"');
};
async function mf434SearchIds(){
 if(MF434.busy)return;
 const title=String(document.getElementById("mf434-lookup-title")?.value||"").trim();
 const provider=String(document.getElementById("mf434-lookup-provider")?.value||"");
 const root=document.getElementById("mf434-lookup-results");
 if(title.length<2){showToast("Enter a title for ID discovery.");return;}
 const config=mf434ProviderStatus(provider);
 if(!config?.testable||!config.configured){showToast("This provider needs an available, configured API connection.");return;}
 MF434.busy=true;if(root)root.textContent="Searching "+provider+"…";
 try{
  const reply=await mf434Call("search",{provider,title,externalIds:{}});
  MF434.lookup=(reply.results||[]).filter(x=>x?.recordId&&x?.externalIdCandidates?.length).slice(0,12);
  MF434.lookupProvider=provider;
  if(root)root.innerHTML=MF434.lookup.length?MF434.lookup.map((r,i)=>
    '<div class="mf434-id-result"><strong>'+mf434Esc(r.title)+'</strong><small>'+r.externalIdCandidates.map(x=>mf434Esc(x.key.toUpperCase())+': '+mf434Esc(x.value)).join(" · ")+'</small>'+
    '<button type="button" class="btn btn-ghost" onclick="App.mf434LinkIds('+i+')">Link verified IDs</button></div>').join(''):'No confirmed title match returned. Try a different title or source.';
 }catch(e){if(root)root.textContent=String(e.message||e);}
 finally{MF434.busy=false;}
}
function mf434LinkIds(index){
 const choice=MF434.lookup[Number(index)],editor=document.querySelector("[data-v377-ids-editor]");
 if(!choice||!editor)return;
 const list=editor.querySelector(".mf377-ids-grid");
 if(!list)return;
 let count=0,conflicts=0;
 for(const id of choice.externalIdCandidates||[]){
  if(!mf433ValidId(id.key,String(id.value)))continue;
  let input=[...list.querySelectorAll("[data-v377-id]")].find(x=>x.dataset.v377Id===id.key);
  if(!input){
   const row=document.createElement("label");row.className="field";row.dataset.v377IdRow=id.key;
   row.innerHTML='<span class="field-label">'+mf434Esc(id.key.toUpperCase())+'</span><span class="mf377-id-control"><input type="text" data-v377-id="'+mf434Esc(id.key)+'" autocomplete="off"></span>';
   list.appendChild(row);input=row.querySelector("input");
  }
  if(!input)continue;
  if(input.value&&String(input.value).trim()!==String(id.value)){conflicts++;continue;}
  if(input.value===String(id.value))continue;
  input.value=String(id.value);input.dispatchEvent(new Event("input",{bubbles:true}));count++;
 }
 showToast(count+" verified ID"+(count===1?"":"s")+" added to draft"+(conflicts?" · "+conflicts+" existing IDs protected":"")+". Save title to persist.");
}
Object.assign(App,{mf434RefreshGateway,mf434TestProvider,mf434SearchIds,mf434LinkIds});
window.MediaFlowV434=Object.freeze({version:434,status:()=>MF434.status,
 configured:()=>Boolean(MF434.status?.ready),verified:()=>mf434SavedTests().slice()});
