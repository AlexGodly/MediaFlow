/* MediaFlow v438 — unified provider capability/health registry and API testing.
 * A provider listed here is NOT automatically live. Individual operations
 * require an implemented adapter and successful authorization/verification.
 * All media types are hints, never access-control filters for custom categories.
 * No background scans or metadata writes are introduced by v438.
 */
const MF438_VERSION=438;
const MF438_CAPS=['cover','metadata','description','ratings','id','releases','mapping','tracks','platforms'];
const MF438_EXTRA_CATALOG=[
 {id:'anizip',name:'AniZip',capabilities:['metadata','releases','id'],media:['anime'],access:'public'},
 {id:'musicbrainz',name:'MusicBrainz',capabilities:['metadata','id','tracks'],media:['music'],access:'public'},
 {id:'coverartarchive',name:'Cover Art Archive',capabilities:['cover','id'],media:['music'],access:'public'},
 {id:'discogs',name:'Discogs',capabilities:['cover','metadata','ratings','tracks','id'],media:['music'],access:'key'},
 {id:'itunes',name:'Apple iTunes Search',capabilities:['cover','metadata','tracks','id'],media:['music','book'],access:'public'},
 {id:'listenbrainz',name:'ListenBrainz',capabilities:['ratings','metadata','id'],media:['music'],access:'review'},
 {id:'spotify',name:'Spotify',capabilities:['cover','metadata','tracks','id'],media:['music'],access:'key'},
 {id:'deezer',name:'Deezer',capabilities:['cover','metadata','tracks','id'],media:['music'],access:'review'},
 {id:'igdb',name:'IGDB',capabilities:['cover','metadata','ratings','id','platforms'],media:['game'],access:'key'},
 {id:'rawg',name:'RAWG',capabilities:['cover','metadata','ratings','id','platforms'],media:['game'],access:'key'},
 {id:'steam',name:'Steam Store',capabilities:['cover','metadata','id','platforms'],media:['game'],access:'public'},
 {id:'opencritic',name:'OpenCritic',capabilities:['ratings','metadata','id'],media:['game'],access:'restricted'},
 {id:'mobygames',name:'MobyGames',capabilities:['cover','metadata','id','platforms'],media:['game'],access:'key'},
 {id:'wikidata-games',name:'Wikidata Game Records',capabilities:['metadata','id','mapping'],media:['game','visual_novel'],access:'public'},
 {id:'vndb',name:'VNDB',capabilities:['cover','metadata','ratings','id'],media:['visual_novel'],access:'public'},
 {id:'vndb-character',name:'VNDB Characters',capabilities:['metadata','id'],media:['visual_novel'],access:'public'},
 {id:'itch',name:'itch.io',capabilities:['cover','metadata','id'],media:['game','interactive_fiction','visual_novel'],access:'review'},
 {id:'ifdb',name:'Interactive Fiction Database',capabilities:['metadata','ratings','id'],media:['interactive_fiction'],access:'review'},
 {id:'ifwiki',name:'IFWiki',capabilities:['metadata','id','mapping'],media:['interactive_fiction'],access:'public'},
 {id:'openalex',name:'OpenAlex',capabilities:['metadata','id','mapping'],media:['book','other'],access:'public'},
 {id:'openlibrary-search',name:'Open Library Search',capabilities:['metadata','cover','id','description'],media:['book','comic'],access:'public'},
 {id:'googlebooks-meta',name:'Google Books Metadata',capabilities:['metadata','description','cover','id'],media:['book','comic'],access:'key'},
 {id:'comicvine-meta',name:'Comic Vine Metadata',capabilities:['metadata','cover','id'],media:['comic'],access:'restricted'},
 {id:'gcd-meta',name:'GCD Metadata',capabilities:['metadata','cover','id'],media:['comic'],access:'review'},
 {id:'mangadex-meta',name:'MangaDex Metadata',capabilities:['metadata','cover','id'],media:['manga'],access:'review'},
 {id:'wikidata',name:'Wikidata',capabilities:['metadata','id','mapping'],media:['other'],access:'public'}
];
// Aliases share the same underlying service, but distinguish potential future
// endpoints/capabilities. Never double-query them as independent providers.
const MF438_ALIAS={ 'wikidata-games':'wikidata','vndb-character':'vndb',
 'openlibrary-search':'openlibrary','googlebooks-meta':'googlebooks',
 'comicvine-meta':'comicvine','gcd-meta':'gcd','mangadex-meta':'mangadex'};
const MF438_MEDIA=['all',...MF437_MEDIA_TYPES.map(x=>x[0]).filter(x=>x!=='unspecified')];
const MF438={ui:{query:'',capability:'all',media:'all',state:'all'},publicResults:new Map(),
 testsRunning:new Set(),nextTestAt:new Map(),gatewayStatusAt:0};
const mf438Esc=x=>escapeHtml(String(x??''));
function mf438Caps(raw){
 const values=Array.isArray(raw)?raw:String(raw||'').split(',');
 const result=new Set();
 for(const cap of values){
  const v=String(cap||'').trim().toLowerCase();
  if(MF438_CAPS.includes(v))result.add(v);
 }
 // Description is a dedicated metadata field, not a separate remote service.
 if(result.has('metadata'))result.add('description');
 return [...result];
}
function mf438Prefs(){
 const src=S.settings?.v438Providers;
 return src&&typeof src==='object'&&!Array.isArray(src)?src:{disabled:[],updatedAt:0};
}
function mf438Disabled(id){
 return Array.isArray(mf438Prefs().disabled)&&mf438Prefs().disabled.includes(MF438_ALIAS[id]||id);
}
function mf438Registry(){
 const all=new Map(),cover=new Map(MF424_PROVIDER_META.map(x=>[x.id,x]));
 const add=(row,from)=>{
  if(!row||typeof row.id!=='string'||!/^[a-z][a-z0-9-]{1,38}$/.test(row.id))return;
  const id=MF438_ALIAS[row.id]||row.id;
  const existing=all.get(id);
  const srcCover=cover.get(id);
  const caps=mf438Caps(row.capabilities);
  const med=Array.isArray(row.media)?row.media:Array.isArray(srcCover?.types)?srcCover.types:[];
  const source=existing?.sources||new Set();
  source.add(from);
  if(existing){
   existing.capabilities=[...new Set([...existing.capabilities,...caps])];
   existing.media=[...new Set([...existing.media,...med])];
   existing.sources=source;
   if(!existing.name||existing.name===id)existing.name=row.name||id;
   if(from==='catalog'&&row.access&&existing.access==='unknown')existing.access=row.access;
  }else{
   all.set(id,{id,name:row.name||id,capabilities:caps,media:med,
    access:row.access||'unknown',sources:source});
  }
 };
 for(const row of MF433_PROVIDER_CATALOG)add(row,'catalog');
 for(const row of MF438_EXTRA_CATALOG)add(row,'catalog');
 for(const p of MF424_PROVIDER_META)add({id:p.id,name:p.name,
  capabilities:p.limit>0?['cover','id']:[],media:p.types,access:p.credentials?'key':'public'},'cover-engine');
 // Existing Fresh Episodes / Smart Engine adapters (not equivalent to a
 // metadata or cover API just because they share a source name).
 for(const source of V380_SOURCES){
  if(source==='automatic'||source==='automatic2')continue;
  add({id:source,name:V380_NAMES[source]||source,capabilities:['releases'],media:['anime'],access:'public'},'fresh-episodes');
 }
 return [...all.values()].map(row=>{
  const def=cover.get(row.id),server=MF434.status?.providers?.find(x=>x.id===row.id)||null;
  const tested=mf434SavedTests().includes(row.id);
  const publicTest=MF438.publicResults.get(row.id);
  // Tested means a successful real call in this session (public), or a saved
  // verified gateway result only when the server remains configured.
  const liveGateway=Boolean(server?.configured&&server?.testable&&tested);
  const coverReady=Boolean(def?.limit>0);
  const browserReady=Boolean(publicTest?.ok===true);
  const gatewayReady=Boolean(liveGateway);
  const active=coverReady||browserReady||gatewayReady;
  let state='catalog';
  if(server&&!server.testable)state='restricted';
  else if(server&&!server.configured)state='needs-key';
  else if(publicTest?.ok===false)state='failed';
  else if(active)state='available';
  else if(row.access==='skipped'||row.access==='restricted')state='restricted';
  else if(row.access==='key')state='needs-key';
  const health=MF424.rate?.[row.id]||null;
  return {
   ...row,sources:[...row.sources],gateway:!!server,configured:Boolean(server?.configured),
   testable:Boolean(server?.testable),verifiedGateway:gatewayReady,
   coverReady,browserReady,active,state,disabled:mf438Disabled(row.id),
   testedAt:Number(publicTest?.checked||0),cooldownUntil:Math.max(0,Number(health?.cooldown)||0),
   gapMs:Math.max(0,Number(def?.gap)||0),dailyLimit:null,
   adapterStatus:{cover:coverReady,metadata:false,ratings:false,releases:row.sources.includes('fresh-episodes')},
   // Catalog capability ≠ implemented live retrieval.
   capabilities:[...row.capabilities]
  };
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
function mf438Provider(id){return mf438Registry().find(x=>x.id===String(MF438_ALIAS[id]||id))||null;}
function mf438Supports(id,capability){return Boolean(mf438Provider(id)?.capabilities.includes(capability));}
function mf438Query({capability,mediaType,includeDisabled=false}={}){
 const rows=mf438Registry().filter(p=>(includeDisabled||!p.disabled)&&(!capability||p.capabilities.includes(capability)));
 // A custom category, missing type, or unknown type must never filter a source
 // out. A media type only moves relevant descriptors to the front.
 const media=MF438_MEDIA.includes(mediaType)?mediaType:'all';
 return rows.map(p=>({...p})).sort((a,b)=>{
  if(media==='all')return a.name.localeCompare(b.name);
  const am=a.media.includes(media)?1:0,bm=b.media.includes(media)?1:0;
  return bm-am||a.name.localeCompare(b.name);
 });
}
function mf438StateName(row){
 if(row.disabled)return 'Disabled for future shared recovery';
 switch(row.state){
 case 'available':return 'Available · at least one implemented source';
 case 'needs-key':return row.gateway?'Gateway credential missing':'Configuration or approved access required';
 case 'failed':return 'Public API check failed · see diagnostics';
 case 'restricted':return 'Access, CORS or license validation pending';
 default:return 'Catalog only · no verified test adapter';
 }
}
function mf438PublicSpecs(){
 // Only explicit manual probes. Use public browser-CORS endpoints with bounded
 // responses. A success verifies access, NOT that artwork/metadata matching
 // or licensing has been implemented for automatic recovery.
 return {
  jikan:{url:'https://api.jikan.moe/v4/anime?q=Naruto&limit=1',validate:d=>Array.isArray(d?.data)},
  tvmaze:{url:'https://api.tvmaze.com/search/shows?q=Breaking%20Bad',validate:d=>Array.isArray(d)},
  openlibrary:{url:'https://openlibrary.org/search.json?title=Frankenstein&limit=1',validate:d=>Array.isArray(d?.docs)},
  gutendex:{url:'https://gutendex.com/books/?search=Frankenstein',validate:d=>Array.isArray(d?.results)},
  anilist:{url:'https://graphql.anilist.co',method:'POST',body:JSON.stringify({query:'query($q:String){Media(search:$q,type:ANIME){id}}',variables:{q:'Naruto'}}),validate:d=>Boolean(d?.data?.Media?.id)}
 };
}
function mf438TestText(id){const row=mf438Provider(id);return row?row.name:String(id);}
async function mf438TestPublic(id){
 id=String(id||'');
 const def=mf438PublicSpecs()[id],row=mf438Provider(id);
 if(!def||!row||mf438Disabled(id))return false;
 if(MF438.testsRunning.size)return false;
 const next=Number(MF438.nextTestAt.get(id))||0;
 if(Date.now()<next){showToast(row.name+' is cooling down. Try again shortly.');return false;}
 MF438.testsRunning.add(id);
 MF438.nextTestAt.set(id,Date.now()+30000);
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const res=await fetch(def.url,{method:def.method||'GET',headers:def.method==='POST'?{'Content-Type':'application/json','Accept':'application/json'}:{'Accept':'application/json'},
   body:def.body,signal:ctrl.signal,credentials:'omit',cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const json=await res.json();
  if(!def.validate(json))throw Error('Unrecognized API response');
  MF438.publicResults.set(id,{ok:true,checked:Date.now(),error:''});
  showToast(row.name+' public API responded successfully.');
  return true;
 }catch(err){
  const msg=String(err?.name==='AbortError'?'Request timed out':err?.message||err).slice(0,140);
  MF438.publicResults.set(id,{ok:false,checked:Date.now(),error:msg});
  showToast(row.name+': '+msg);
  return false;
 }finally{
  clearTimeout(timer);MF438.testsRunning.delete(id);mf438PaintCatalog();
 }
}
async function mf438SetEnabled(id,checked){
 id=MF438_ALIAS[String(id||'')]||String(id||'');
 if(!mf438Provider(id))return;
 const prev=mf438Prefs();
 const disabled=new Set(Array.isArray(prev.disabled)?prev.disabled:[]);
 if(checked)disabled.delete(id);else disabled.add(id);
 S.settings=S.settings||{};
 S.settings.v438Providers={disabled:[...disabled].sort(),updatedAt:Date.now()};
 try{await saveState();}catch(error){console.warn('MediaFlow v438 provider preference save failed',error);showToast('Unable to sync provider preferences.');}
 mf438PaintCatalog();
}
function mf438SetFilter(key,value){
 if(!['query','capability','media','state'].includes(key))return;
 const next=String(value||'');
 MF438.ui[key]=next.slice(0,120);
 mf438PaintCatalog();
}
function mf438Filtered(){
 const ui=MF438.ui,q=ui.query.trim().toLowerCase();
 return mf438Registry().filter(row=>{
  if(ui.capability!=='all'&&!row.capabilities.includes(ui.capability))return false;
  if(ui.state!=='all'&&row.state!==ui.state)return false;
  if(ui.media!=='all'&&!row.media.includes(ui.media))return false;
  return !q||[row.name,row.id,row.access,row.state,...row.capabilities,...row.media].join(' ').toLowerCase().includes(q);
 });
}
function mf438Cards(){
 const rows=mf438Filtered(),specs=mf438PublicSpecs();
 if(!rows.length)return '<p class="mf438-empty">No providers match these filters.</p>';
 return rows.map(row=>{
  const caps=row.capabilities.map(c=>'<span class="mf438-cap">'+mf438Esc(c)+'</span>').join('');
  const probe=Boolean(specs[row.id]),gateway=row.gateway;
  const testable=probe||gateway&&row.configured&&row.testable;
  const test=probe?'<button type="button" class="btn btn-ghost" onclick="App.mf438TestPublic(\''+row.id+'\')"'+(row.disabled||MF438.testsRunning.size?' disabled':'')+'>Test public API</button>':
   gateway?'<button type="button" class="btn btn-ghost" onclick="App.mf434TestProvider(\''+row.id+'\')"'+(!row.configured||!row.testable||row.disabled||MF434.busy?' disabled':'')+'>Test API</button>':'';
  const result=MF438.publicResults.get(row.id);
  return '<article class="mf438-provider" data-mf438-provider="'+mf438Esc(row.id)+'">'+
   '<div class="mf438-provider-head"><div><strong>'+mf438Esc(row.name)+'</strong><small>'+mf438Esc(row.id)+' · '+mf438Esc(row.access)+'</small></div>'+
   '<span class="mf438-state '+(row.active?'mf438-live':'')+'">'+mf438Esc(mf438StateName(row))+'</span></div>'+
   '<div class="mf438-caps">'+(caps||'<small>No verified capabilities</small>')+'</div>'+
   '<div class="mf438-details"><small>Media hints: '+mf438Esc(row.media.join(', ')||'all')+'</small>'+
   '<small>Implemented: '+mf438Esc([row.coverReady?'cover':'',row.browserReady?'public test':'',row.verifiedGateway?'gateway':'',row.adapterStatus.releases?'fresh releases':''].filter(Boolean).join(', ')||'catalog only')+'</small></div>'+
   '<div class="mf438-provider-actions"><label class="mf438-enable"><input type="checkbox" '+(row.disabled?'':'checked')+' onchange="App.mf438SetEnabled(\''+row.id+'\',this.checked)"><span>Shared registry enabled</span></label>'+
   (test||'<small>API test not implemented yet</small>')+'</div>'+
   (result?'<small class="mf438-test-result" role="status">'+(result.ok?'Public API passed':'Public API unavailable: '+mf438Esc(result.error))+' · '+new Date(result.checked).toLocaleString()+'</small>':'')+
   '</article>';
 }).join('');
}
function mf438PaintCatalog(){
 const el=document.getElementById('mf438-provider-list');
 if(el)el.innerHTML=mf438Cards();
 const count=document.getElementById('mf438-provider-count');
 if(count)count.textContent=mf438Filtered().length+' / '+mf438Registry().length+' providers';
}
function mf438SelectOptions(values,current){
 return values.map(([value,label])=>'<option value="'+mf438Esc(value)+'"'+(value===current?' selected':'')+'>'+mf438Esc(label)+'</option>').join('');
}
function mf438SettingsHtml(){
 const total=mf438Registry().length;
 const kinds=[['all','All capabilities'],...MF438_CAPS.map(x=>[x,x[0].toUpperCase()+x.slice(1)])];
 const types=[['all','All media types'],...MF437_MEDIA_TYPES.filter(x=>x[0]!=='unspecified')];
 const states=[['all','All statuses'],['available','Available'],['needs-key','Needs configuration'],['restricted','Restricted / review'],['catalog','Catalog only'],['failed','Failed tests']];
 return '<div class="mf438-settings" data-mf-setting-id="api-provider-management">'+
  '<header class="mf438-title"><span>'+mf425Icon('database',22)+'</span><div><strong>One registry for every media type</strong><p>Cover Recovery, Fresh Episodes and future Metadata Recovery share these provider identities. Listing a source is not proof of working access.</p></div></header>'+
  '<div class="mf438-notice">API testing is manual. No automatic Metadata Recovery is active in v438. Existing Supabase keys remain server-side. Enabled here means eligible for future shared integrations, not permission to overwrite Library data.</div>'+
  '<div class="mf438-gateway" data-mf-setting-id="api-gateway-connections">'+mf434Panel()+'</div>'+
  '<div class="mf438-toolbar" data-mf-setting-id="api-provider-filter"><label>Search<input id="mf438-search" type="search" placeholder="Provider, ID, capability..." value="'+mf438Esc(MF438.ui.query)+'" oninput="App.mf438SetFilter(\'query\',this.value)"></label>'+
  '<label>Capability<select onchange="App.mf438SetFilter(\'capability\',this.value)">'+mf438SelectOptions(kinds,MF438.ui.capability)+'</select></label>'+
  '<label>Media type<select onchange="App.mf438SetFilter(\'media\',this.value)">'+mf438SelectOptions(types,MF438.ui.media)+'</select></label>'+
  '<label>Status<select onchange="App.mf438SetFilter(\'state\',this.value)">'+mf438SelectOptions(states,MF438.ui.state)+'</select></label></div>'+
  '<div class="mf438-list-top"><strong>Provider capabilities & readiness</strong><span id="mf438-provider-count">'+total+' / '+total+' providers</span></div>'+
  '<div class="mf438-provider-list" id="mf438-provider-list">'+mf438Cards()+'</div>'+
  '<p class="mf438-footnote">Media types guide recommendation order only. All sources remain searchable regardless of custom Library category. Provider capability tags describe possible data, not automatically enabled APIs. Disabled providers do not change your existing Cover Recovery choices.</p>'+
 '</div>';
}
// Remove the old v434 gateway panel only from COVER RECOVERY; keep the
// source-provider order/enable fieldset and its existing persistence untouched.
const mf438CoverSettingsBase=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
 const html=mf438CoverSettingsBase.apply(this,arguments);
 const legacy=mf434Panel();
 return html.replace(legacy,'');
};
function mf438SettingsEnhance(){
 if(S.view!=='settings')return;
 const center=window.MediaFlowSettingsCenter;
 if(!center?.mountSection)return;
 if(document.querySelector('.mf365-section[data-mf365-section="v438-settings-api-providers"]'))return;
 const reg=window.MediaFlowSettingsRegistry;
 if(reg?.registerSetting){
  for(const [id,label,keywords] of [
   ['api-provider-management','API Providers & Testing','public metadata covers games music novels'],
   ['api-gateway-connections','Supabase gateway connections','configured credentials verification connection diagnostics'],
   ['api-provider-filter','Search and filter API providers','capability media status'],
  ])reg.registerSetting({id,section:'v438-settings-api-providers',selector:'[data-mf-setting-id="'+id+'"]',label,keywords:[keywords]});
 }
 const body=document.createElement('div');body.className='mf438-settings-content';
 body.innerHTML=mf438SettingsHtml();
 center.mountSection({id:'v438-settings-api-providers',title:'API PROVIDERS & TESTING',
  category:'app',subgroup:'API services',keywords:['providers','api','connection','metadata','cover','ratings','fresh episodes','gateway','supabase','testing'],
  nodes:[body]});
}
// The v434 panel refresh now lives in the dedicated shared Settings section.
MediaFlowRuntime.registerPageEnhancer('settings',mf438SettingsEnhance);
Object.assign(App,{mf438SetFilter,mf438SetEnabled,mf438TestPublic});
window.MediaFlowV438=Object.freeze({
 version:MF438_VERSION,capabilities:MF438_CAPS.slice(),
 list:()=>mf438Registry().map(x=>({...x})),
 get:mf438Provider,supports:mf438Supports,query:mf438Query,
 publicTestable:()=>Object.keys(mf438PublicSpecs()),
 state:()=>({gatewayReady:Boolean(MF434.status?.ready),providerCount:mf438Registry().length})
});
