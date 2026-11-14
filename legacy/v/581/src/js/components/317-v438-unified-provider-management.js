/* MediaFlow v438 — Unified Provider Registry & API Testing.
 * A registry is NOT an API adapter: descriptions are catalog capabilities, while
 * availability and testing only reflect real implemented request paths.
 * No new credentials or title writes. Existing v434 gateway remains authoritative.
 */
const MF438_VERSION=438;
const MF438_EXTRA_CATALOG=[
 ['igdb','IGDB','game','cover,id,metadata,rating','key'],
 ['steam','Steam Store','game','cover,id,metadata,rating,releases','public'],
 ['gog','GOG','game','cover,id,metadata','review'],
 ['itch','itch.io','game,interactive_fiction,visual_novel','cover,id,metadata','review'],
 ['rawg','RAWG','game','cover,id,metadata,rating','key'],
 ['mobygames','MobyGames','game','cover,id,metadata','key'],
 ['giantbomb','Giant Bomb','game','cover,id,metadata','key'],
 ['wikimedia','Wikimedia Commons','other','cover,id,metadata','public'],
 ['vndb','VNDB','visual_novel','cover,id,metadata,rating','public'],
 ['vndb-api','VNDB Kana API','visual_novel','id,metadata','public'],
 ['musicbrainz','MusicBrainz','music','id,metadata,releases','public'],
 ['coverartarchive','Cover Art Archive','music','cover,id','public'],
 ['itunes','Apple iTunes Search','music','cover,id,metadata,releases','public'],
 ['discogs','Discogs','music','cover,id,metadata,rating','key'],
 ['deezer','Deezer','music','cover,id,metadata','review'],
 ['lastfm','Last.fm','music','cover,id,metadata','key'],
 ['spotify','Spotify','music','cover,id,metadata','key'],
 ['vgmdb','VGMdb','music','cover,id,metadata','review'],
 ['ifdb','Interactive Fiction Database','interactive_fiction','cover,id,metadata,rating','review'],
 ['ifwiki','IFWiki','interactive_fiction','id,metadata','public'],
 ['ifarchive','IF Archive','interactive_fiction','id,metadata','public'],
 ['opencritic','OpenCritic','game','id,rating,metadata','review'],
 ['boardgamegeek','BoardGameGeek','other','cover,id,metadata','review'],
 ['googlebooks','Google Books','book','cover,id,metadata','review']
];
/* Allowlisted, small public read-only probes. These do not enable an adapter,
 * nor assert that the API is licensed for automated bulk recovery.
 * Browser CORS and quotas remain provider-controlled. */
const MF438_PUBLIC_PROBES={
 jikan:{url:'https://api.jikan.moe/v4/anime/1',valid:d=>!!d?.data?.mal_id},
 anilist:{url:'https://graphql.anilist.co',method:'POST',body:JSON.stringify({query:'query{Media(id:1,type:ANIME){id}}'}),valid:d=>Number(d?.data?.Media?.id)===1},
 kitsu:{url:'https://kitsu.io/api/edge/anime?page%5Blimit%5D=1',valid:d=>Array.isArray(d?.data)},
 tvmaze:{url:'https://api.tvmaze.com/shows/1',valid:d=>Number(d?.id)===1},
 openlibrary:{url:'https://openlibrary.org/works/OL45883W.json',valid:d=>typeof d?.key==='string'&&d.key.startsWith('/works/')},
 episodate:{url:'https://www.episodate.com/api/search?q=breaking%20bad&page=1',valid:d=>Array.isArray(d?.tv_shows)},
 gutendex:{url:'https://gutendex.com/books?search=frankenstein',valid:d=>Array.isArray(d?.results)},
 wikidata:{url:'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q42&format=json&origin=*',valid:d=>!!d?.entities?.Q42},
 crossref:{url:'https://api.crossref.org/works?query=frankenstein&rows=1',valid:d=>Array.isArray(d?.message?.items)},
 itunes:{url:'https://itunes.apple.com/search?term=queen&entity=album&limit=1',valid:d=>Array.isArray(d?.results)},
 musicbrainz:{url:'https://musicbrainz.org/ws/2/release-group/?query=artist%3AQueen&fmt=json&limit=1',valid:d=>Array.isArray(d?.['release-groups'])},
 mangadex:{url:'https://api.mangadex.org/manga?limit=1',valid:d=>Array.isArray(d?.data)}
};
const MF438_UI={query:'',cap:'all',media:'all',access:'all',tests:new Map(),busy:'',lastRequest:new Map(),nextRequest:0,failures:0};
const mf438Escape=v=>mf424Escape(String(v??''));
const mf438Caps=s=>[...new Set(String(s||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean))];
const mf438Types=s=>[...new Set(String(s||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean))];
function mf438Catalog(){
 const entries=new Map();
 for(const p of MF424_PROVIDER_META){
  entries.set(p.id,{id:p.id,name:p.name,mediaTypes:(p.types||[]).slice(),capabilities:['cover','id'],
   access:p.credentials?'key':'public',coverAdapter:!!p.limit,source:'cover'});
 }
 for(const p of MF433_PROVIDER_CATALOG){
  const before=entries.get(p.id)||{};
  entries.set(p.id,{...before,id:p.id,name:p.name,access:p.access,
    capabilities:[...new Set([...(before.capabilities||[]),...mf438Caps(p.capabilities)])],
    mediaTypes:before.mediaTypes||[],source:'registered'});
 }
 for(const [id,name,types,caps,access] of MF438_EXTRA_CATALOG){
  const before=entries.get(id)||{};
  entries.set(id,{...before,id,name,access:before.access||access,
   mediaTypes:[...new Set([...(before.mediaTypes||[]),...mf438Types(types)])],
   capabilities:[...new Set([...(before.capabilities||[]),...mf438Caps(caps)])],
   source:before.source||'catalog'});
 }
 const live=MF434.status?.providers||[];
 for(const entry of entries.values()){
  const status=live.find(p=>p.id===entry.id);
  const cover=mf424Provider(entry.id);
  entry.coverAdapter=Boolean(cover?.limit&&(
   ['tenrai','jikan','anilist','kitsu','tvmaze','openlibrary'].includes(entry.id)||
   MF424_EXTRA_COVER_ADAPTERS.has(entry.id)));
  entry.gateway=Boolean(status);
  entry.configured=Boolean(status?.configured);
  entry.testable=Boolean(status?.testable&&status?.configured);
  entry.verified=Boolean(entry.testable&&mf434SavedTests().includes(entry.id)); // diagnostic history only
  entry.publicProbe=Boolean(MF438_PUBLIC_PROBES[entry.id]);
  entry.probeResult=MF438_UI.tests.get(entry.id)||null;
  entry.coverEnabled=entry.coverAdapter&&mf424Defaults().enabled.includes(entry.id);
  // A catalog entry is NOT evidence of a live adapter.
  entry.metadataActive=(typeof MF439_PUBLIC!=='undefined'&&Boolean(MF439_PUBLIC[entry.id]))||
    (typeof MF439_GATEWAY!=='undefined'&&MF439_GATEWAY.includes(entry.id)&&Boolean(status?.configured&&status?.testable));
  entry.releaseActive=false;
  entry.ratingActive=false;
  entry.testKind=entry.gateway?(entry.testable?'gateway':'none'):(entry.publicProbe?'public':'none');
  entry.state=entry.coverEnabled?'cover':entry.metadataActive?'configured':
   entry.gateway&&entry.configured&&entry.testable?'configured':
   entry.probeResult?.ok===true?'tested':entry.probeResult?.ok===false?'failed':'pending';
 }
 return [...entries.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function mf438Filtered(list){
 const query=String(MF438_UI.query||'').trim().toLowerCase();
 return list.filter(p=>{
  if(MF438_UI.cap!=='all'&&!p.capabilities.includes(MF438_UI.cap))return false;
  if(MF438_UI.media!=='all'&&p.mediaTypes.length&&!p.mediaTypes.includes(MF438_UI.media))return false;
  if(MF438_UI.media!=='all'&&!p.mediaTypes.length)return false;
  if(MF438_UI.access==='testable'&&p.testKind==='none')return false;
  if(MF438_UI.access==='active'&&!(p.coverEnabled||p.metadataActive||p.gateway&&p.configured&&p.testable))return false;
  if(MF438_UI.access==='pending'&&(p.coverEnabled||p.metadataActive||p.gateway&&p.configured&&p.testable))return false;
  if(!query)return true;
  const hay=[p.id,p.name,p.access,p.source,...p.capabilities,...p.mediaTypes].join(' ').toLowerCase();
  return hay.includes(query);
 });
}
function mf438StateLabel(p){
 if(p.coverEnabled)return 'Cover Recovery ready · no test required';
 if(p.metadataActive)return 'Metadata Recovery ready · no test required';
 if(p.gateway&&p.configured&&p.testable)return 'Configured gateway · no test required';
 if(p.probeResult?.ok===false)return 'Optional API diagnostic failed';
 if(p.verified)return 'Last diagnostic passed';
 if(p.probeResult?.ok===true)return 'Public API responded';
 if(p.gateway&&!p.configured)return 'Gateway credential not configured';
 if(p.gateway&&!p.testable)return 'Gateway integration not approved';
 if(p.publicProbe)return 'Public · optional diagnostic available';
 return 'Catalog only · no tested request adapter';
}
function mf438EntryHtml(p){
 const badges=p.capabilities.map(c=>'<span>'+mf438Escape(c==='id'?'External IDs':c==='releases'?'Fresh releases':c==='rating'?'Ratings':c.charAt(0).toUpperCase()+c.slice(1))+'</span>').join('');
 const options=p.testKind!=='none'?
  '<button type="button" class="btn btn-ghost" onclick="App.mf438Test(\''+mf438Escape(p.id)+'\')" '+(MF438_UI.busy?'disabled':'')+'>'+mf425Icon('search')+' Test API</button>':
  '<small class="mf438-unavailable">Testing unavailable until an approved adapter exists</small>';
 const test=p.probeResult?
  '<small class="mf438-last-test">'+mf438Escape(p.probeResult.ok?'Passed':'Failed')+
   ' · '+mf438Escape(new Date(p.probeResult.at).toLocaleTimeString())+
   (p.probeResult.error?' · '+mf438Escape(p.probeResult.error):'')+'</small>':'';
 return '<article class="mf438-provider" data-mf438-id="'+mf438Escape(p.id)+'" data-mf438-state="'+mf438Escape(p.state)+'">'+
  '<div class="mf438-provider-head"><div><h4>'+mf438Escape(p.name)+'</h4><small>'+mf438Escape(p.access==='key'?'Key-based API':p.access==='restricted'?'Restricted API':p.access==='public'?'Public API':p.access==='skipped'?'Not in use':'Requires review')+'</small></div>'+
  '<span class="mf438-state mf438-state-'+mf438Escape(p.state)+'">'+mf438Escape(mf438StateLabel(p))+'</span></div>'+
  '<div class="mf438-capabilities">'+badges+'</div>'+
  '<p class="mf438-availability">Capabilities are provider catalog descriptions. Automatic metadata, ratings and Fresh Episodes retrieval is not yet enabled by this registry.</p>'+
  '<div class="mf438-provider-actions">'+options+test+'</div></article>';
}
function mf438ControlsHtml(){
 const selected=(value,current,label)=>'<option value="'+value+'" '+(current===value?'selected':'')+'>'+label+'</option>';
 const list=mf438Catalog();
 const total=list.length,active=list.filter(p=>p.coverEnabled).length,ready=list.filter(p=>p.testKind!=='none').length;
 return '<section class="mf438-workspace" data-mf-setting-id="api-provider-registry">'+
  '<div class="mf438-lead"><span class="mf438-symbol">'+mf425Icon('database',23)+'</span><div><h3>API Providers & Testing</h3><p>One shared directory for artwork, metadata, ratings, external IDs and fresh releases.</p></div></div>'+
  '<div class="mf438-metrics"><span><strong>'+total+'</strong> Registered</span><span><strong>'+ready+'</strong> Test paths</span><span><strong>'+active+'</strong> Enabled cover sources</span></div>'+
  '<p class="mf438-context">Configured connections are verified through MediaFlow’s existing authenticated Supabase gateway. Public tests run only when requested, using fixed read-only endpoints. A listed capability is not evidence that MediaFlow can retrieve it yet.</p>'+
  '<div class="mf438-toolbar">'+
  '<label>Find a provider<input type="search" id="mf438-search" placeholder="Search provider or media…" value="'+mf438Escape(MF438_UI.query)+'" oninput="App.mf438Filter(\'query\',this.value)" autocomplete="off"></label>'+
  '<label>Capability<select onchange="App.mf438Filter(\'cap\',this.value)">'+
  [['all','All capabilities'],['cover','Cover art'],['metadata','Metadata'],['rating','Ratings'],['id','External IDs'],['releases','Fresh releases'],['mapping','ID mapping']].map(([id,name])=>selected(id,MF438_UI.cap,name)).join('')+'</select></label>'+
  '<label>Media type<select onchange="App.mf438Filter(\'media\',this.value)">'+
  [['all','All media'],['anime','Anime'],['manga','Manga'],['movie','Movies'],['tv','TV'],['book','Books'],['comic','Comics'],['game','Video games'],['visual_novel','Visual novels'],['music','Music / Albums'],['interactive_fiction','Interactive fiction']].map(([id,name])=>selected(id,MF438_UI.media,name)).join('')+'</select></label>'+
  '<label>Status<select onchange="App.mf438Filter(\'access\',this.value)">'+
  [['all','All providers'],['testable','Has testing path'],['active','Enabled / tested'],['pending','Not enabled yet']].map(([id,name])=>selected(id,MF438_UI.access,name)).join('')+'</select></label>'+
  '</div>'+
  '<div class="mf438-results-line" aria-live="polite" id="mf438-results-count"></div>'+
  '<div class="mf438-grid" id="mf438-provider-grid"></div>'+
  '<div id="mf438-test-message" role="status" aria-live="polite"></div>'+
  '<p class="mf438-note">No API keys appear here. Existing Cover Recovery provider order and enable choices remain in Cover Recovery. Testing is optional and does not unlock providers. Only real adapters with proper access can recover data. Provider coverage is never restricted by your custom categories.</p>'+
  '<div class="mf438-gateway" data-mf-setting-id="api-gateway-panel">'+mf434Panel()+'</div>'+
  '</section>';
}
function mf438Paint(){
 const root=document.querySelector('.mf438-workspace');
 if(!root)return;
 const rows=mf438Filtered(mf438Catalog());
 const grid=root.querySelector('#mf438-provider-grid');
 if(grid)grid.innerHTML=rows.length?rows.map(mf438EntryHtml).join(''):'<p class="mf438-no-results">No providers match. Try different filters.</p>';
 const count=root.querySelector('#mf438-results-count');
 if(count)count.textContent=rows.length+' provider'+(rows.length===1?'':'s')+' shown';
}
function mf438Filter(key,value){
 if(!['query','cap','media','access'].includes(key))return;
 MF438_UI[key]=String(value||'');
 mf438Paint();
}
async function mf438Test(id){
 const p=mf438Catalog().find(row=>row.id===id);
 if(!p||p.testKind==='none')return;
 if(MF438_UI.busy)return;
 const now=Date.now(),last=MF438_UI.lastRequest.get(id)||0;
 if(now<MF438_UI.nextRequest||now-last<30000){
  const seconds=Math.ceil(Math.max(MF438_UI.nextRequest-now,last+30000-now)/1000);
  showToast('Please wait '+seconds+'s before testing another connection.');return;
 }
 MF438_UI.busy=id;
 MF438_UI.lastRequest.set(id,now);MF438_UI.nextRequest=now+12000;
 const result=document.querySelector('#mf438-test-message');
 if(result)result.textContent='Testing '+p.name+' connection…';
 mf438Paint();
 try{
  if(p.testKind==='gateway'){
   const input=document.getElementById('mf434-test-title');
   if(String(input?.value||'').trim().length<2){
    throw Error('Enter a title in Configured API Connections below before testing '+p.name+'.');
   }
   const checkedBefore=Number(MF434.tests[id]?.checked)||0;
   await mf434TestProvider(id);
   // A saved verification from an earlier day must NOT count as success of
   // this new test. Only a fresh v434 response is authoritative.
   const checkedAfter=Number(MF434.tests[id]?.checked)||0;
   const ok=checkedAfter>checkedBefore&&checkedAfter>=now&&mf434SavedTests().includes(id);
   MF438_UI.tests.set(id,{at:Date.now(),ok,error:ok?'':'Connection was not verified; see gateway results.'});
   if(!ok)throw Error('Gateway test did not verify this source. Review the result below.');
  }else{
   const probe=MF438_PUBLIC_PROBES[id];
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
   try{
    const response=await fetch(probe.url,{method:probe.method||'GET',
     body:probe.body||undefined,headers:{Accept:'application/json',...(probe.body?{'Content-Type':'application/json'}:{})},
     signal:controller.signal,cache:'no-store',credentials:'omit'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const text=await response.text();
    if(text.length>750000)throw Error('Unexpected response size');
    let data;try{data=JSON.parse(text);}catch(_){throw Error('Non-JSON response');}
    if(!probe.valid(data))throw Error('Response did not match the expected API shape');
    MF438_UI.tests.set(id,{at:Date.now(),ok:true});
   }finally{clearTimeout(timeout);}
  }
  if(result)result.textContent=p.name+': API responded successfully. This is a connection test, not metadata or cover recovery activation.';
 }catch(e){
  const message=String(e?.name==='AbortError'?'Request timed out':e?.message||e).slice(0,170);
  MF438_UI.tests.set(id,{at:Date.now(),ok:false,error:message});
  if(result)result.textContent=p.name+': '+message+'. Browser CORS, quotas, or permissions may block this source.';
 }finally{MF438_UI.busy='';mf438Paint();}
}
/* Relocate the ONE existing test interface; do not clone its DOM or API state.
 * The cover provider priority controls remain in Cover Recovery by design. */
const mf438CoverSettingsBase=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
 const html=mf438CoverSettingsBase.apply(this,arguments);
 try{
  const holder=document.createElement('div');holder.innerHTML=html;
  holder.querySelectorAll('.mf434-connection,.mf433-provider-readiness').forEach(n=>n.remove());
  return holder.innerHTML;
 }catch(e){console.warn('Provider settings relocation:',e);return html;}
};
const mf438GatewayBase=mf434Panel;
mf434Panel=function(){
 return mf438GatewayBase.apply(this,arguments)
  .replace('Verified API connections','Configured API Connections')
  .replace('Personal MediaFlow · v434','Authenticated gateway')
  .replace('New APIs are opt-in. Use a real title to test each provider, then enable approved cover sources. No credential is displayed or stored in the browser.',
    'Existing Supabase-configured providers. Use a real title to test access; recovered titles and personal data are not changed. Secrets stay in Supabase.');
};
function mf438SettingsEnhance(){
 if(String(S.view||'')!=='settings')return;
 const center=window.MediaFlowSettingsCenter;
 if(!center?.mountSection)return;
 if(document.querySelector('.mf365-section[data-mf365-section="v221-settings-api-providers"]'))return;
 const reg=window.MediaFlowSettingsRegistry;
 reg?.registerSetting?.({id:'api-provider-registry',section:'v221-settings-api-providers',
  selector:'[data-mf-setting-id="api-provider-registry"]',label:'API provider directory, testing and connection diagnostics',
  keywords:['cover metadata ratings games music visual novels interactive fiction public api supabase']});
 reg?.registerSetting?.({id:'api-gateway-panel',section:'v221-settings-api-providers',
  selector:'[data-mf-setting-id="api-gateway-panel"]',label:'Existing configured API connections',
  keywords:['TMDB OMDb MAL Trakt gateway connection test']});
 const body=document.createElement('div');body.className='mf438-settings-content';
 body.innerHTML=mf438ControlsHtml();
 const section=center.mountSection({id:'v221-settings-api-providers',
  title:'API PROVIDERS & TESTING',category:'api-providers',subgroup:'Connections & diagnostics',
  keywords:['public API','providers','connections','diagnostics','metadata','covers','ratings','gateway','games','music'],
  nodes:[body]});
 if(section)mf438Paint();
}
// Register a real Settings Center category, not a custom side modal. Keep
// classification independent from user Library categories.
V365_ICONS.plug='<path d="M9 7V3M15 7V3M7 7h10v5a5 5 0 0 1-10 0V7ZM12 17v4"/><path d="M6 12H4m16 0h-2"/>';
window.MediaFlowSettingsRegistry?.registerCategory?.({
 id:'api-providers',name:'API Providers & Testing',icon:'plug',
 hint:'Connections, provider capabilities and testing',
 description:'Manage verified API connections and inspect public and planned provider coverage'
});
// A gateway status refresh changes actual activation and connection readiness.
const mf438GatewayRefreshBase=mf434RefreshGateway;
mf434RefreshGateway=async function(){
 const value=await mf438GatewayRefreshBase.apply(this,arguments);
 mf438Paint();
 return value;
};
Object.assign(App,{mf434RefreshGateway,mf438Filter,mf438Test});
MediaFlowRuntime.registerPageEnhancer('settings',mf438SettingsEnhance);
const mf438BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const out=mf438BackupBase.apply(this,arguments);
 if(out){
  out.mediaFlowVersion=MF438_VERSION;
  out.backupVersion=MF438_VERSION;
  const manifest=out.backupManifest||(out.backupManifest={});
  manifest.includes={...(manifest.includes||{}),v438UnifiedProviderRegistry:true};
  manifest.v438={release:MF438_VERSION,providerTestingCredentialsExcluded:true,
   existingGatewayVerificationRetained:true,metadataRecoveryEnabled:false};
 }
 return out;
};
window.MediaFlowV438=Object.freeze({version:MF438_VERSION,
 render:mf438ControlsHtml,
 list:()=>mf438Catalog().map(p=>({...p,probeResult:p.probeResult?{...p.probeResult}:null})),
 inspect:()=>({total:mf438Catalog().length,publicTestPaths:Object.keys(MF438_PUBLIC_PROBES).length,
  gatewayTestPaths:mf438Catalog().filter(p=>p.gateway).length,
  testedProviders:mf434SavedTests().slice()}),
 refresh:mf438Paint});
