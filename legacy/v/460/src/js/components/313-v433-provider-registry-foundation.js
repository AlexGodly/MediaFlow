/* MediaFlow v433 — credential-independent preparation for provider adapters.
 * v433 does NOT call newly registered providers or deploy a gateway.
 * Provider activation, live credentials and real cover retrieval are v434 gates.
 * Existing public providers continue to work without behavior changes. */
const MF433_VERSION=433;
const MF433_PROVIDER_CATALOG=[
  {id:'tmdb',name:'TMDB',capabilities:'cover,id,metadata',access:'key'},
  {id:'omdb',name:'OMDb',capabilities:'cover,id,metadata',access:'key'},
  {id:'fanart',name:'Fanart.tv',capabilities:'cover,id',access:'key'},
  {id:'animeschedule',name:'AnimeSchedule',capabilities:'cover,id,releases',access:'key'},
  {id:'trakt',name:'Trakt',capabilities:'id,metadata,releases',access:'key'},
  {id:'comicvine',name:'Comic Vine',capabilities:'cover,id,metadata,releases',access:'restricted'},
  {id:'metron',name:'Metron',capabilities:'cover,id,metadata,releases',access:'key'},
  {id:'hardcover',name:'Hardcover',capabilities:'cover,id,metadata',access:'key'},
  {id:'thetvdb',name:'TheTVDB',capabilities:'cover,id,metadata,releases',access:'restricted'},
  {id:'simkl',name:'SIMKL',capabilities:'id,metadata,releases',access:'restricted'},
  {id:'malofficial',name:'MyAnimeList Official',capabilities:'id,metadata',access:'restricted'},
  {id:'anidb',name:'AniDB',capabilities:'id,metadata',access:'restricted'},
  {id:'watchmode',name:'Watchmode',capabilities:'id,metadata,releases',access:'key'},
  {id:'marvel',name:'Marvel',capabilities:'cover,id,metadata',access:'restricted'},
  {id:'inventaire',name:'Inventaire.io',capabilities:'cover,id,metadata',access:'public'},
  {id:'bnf',name:'BnF',capabilities:'cover,id,metadata',access:'public'},
  {id:'gutendex',name:'Gutendex',capabilities:'cover,id,metadata',access:'public'},
  {id:'episodate',name:'EpisoDate',capabilities:'cover,id,releases',access:'public'},
  {id:'mangaupdates',name:'MangaUpdates',capabilities:'cover,id,releases',access:'review'},
  {id:'gcd',name:'Grand Comics Database',capabilities:'cover,id,releases',access:'review'},
  {id:'royalroad',name:'Royal Road RSS',capabilities:'id,releases',access:'public'},
  {id:'youtube',name:'YouTube Data API',capabilities:'cover,id,releases',access:'key'},
  {id:'livechart',name:'LiveChart',capabilities:'id,releases',access:'review'},
  {id:'wikidata',name:'Wikidata',capabilities:'id,mapping',access:'public'},
  {id:'fribb',name:'Fribb Anime Lists',capabilities:'id,mapping',access:'public'},
  {id:'loc',name:'Library of Congress',capabilities:'id,metadata',access:'public'},
  {id:'dnb',name:'German National Library',capabilities:'id,metadata',access:'public'},
  {id:'crossref',name:'Crossref',capabilities:'id,metadata',access:'public'},
  {id:'tenrai',name:'Tenrai',capabilities:'cover,id',access:'public'},
  {id:'jikan',name:'Jikan',capabilities:'cover,id',access:'public'},
  {id:'anilist',name:'AniList',capabilities:'cover,id',access:'public'},
  {id:'kitsu',name:'Kitsu',capabilities:'cover,id',access:'public'},
  {id:'tvmaze',name:'TVmaze',capabilities:'cover,id',access:'public'},
  {id:'mangadex',name:'MangaDex',capabilities:'cover,id,releases',access:'review'},
  {id:'openlibrary',name:'Open Library',capabilities:'cover,id',access:'public'},
  {id:'manami',name:'manami-project',capabilities:'id,mapping',access:'review'},
  {id:'googlebooks',name:'Google Books',capabilities:'cover,id',access:'skipped'}
];
const MF433_NATIVE_ID_KEYS={
  tenrai:'mal',jikan:'mal',anilist:'anilist',kitsu:'kitsu',tvmaze:'tvmaze',
  mangadex:'mangadex',tmdb:'tmdb',omdb:'imdb',thetvdb:'tvdb_series',
  simkl:'simkl',malofficial:'mal',anidb:'anidb',
  animeschedule:'animeschedule',watchmode:'watchmode',
  episodate:'episodate',mangaupdates:'mangaupdates',
  livechart:'livechart',trakt:'trakt',hardcover:'hardcover_book',
  gutendex:'gutendex',royalroad:'royalroad',
  wikidata:'wikidata',comicvine:'comicvine_volume',metron:'metron_series'
};
const MF433_ALLOWED_ID_KEYS=new Set(V377_ID_PROVIDERS.map(row=>row[0]).concat(['openlibrary','googlebooks','tvmaze','mal','imdb']));
/* Do not make a provider appear usable merely because it is in this catalog.
 * Only the preexisting tested browser providers have a nonzero request limit.
 * A v434 adapter must be separately activated after access/rights/API tests. */
for(const row of MF433_PROVIDER_CATALOG){
  if(!MF424_PROVIDER_META.some(p=>p.id===row.id)){
    MF424_PROVIDER_META.push({id:row.id,name:row.name,types:['other'],limit:0,gap:0,
      credentials:row.access==='key'||row.access==='restricted',level:'v434 validation pending'});
  }
}
function mf433ValidId(key,value){
  if(!MF433_ALLOWED_ID_KEYS.has(key)||typeof value!=='string'||!value.trim())return false;
  if(/[\u0000-\u001f\u007f]/.test(value))return false;
  return typeof v377IdValid==='function'&&v377IdValid(key,value.trim());
}
function mf433NativeKey(candidate){
  if(MF433_ALLOWED_ID_KEYS.has(String(candidate?.externalIdKey||'')))return candidate.externalIdKey;
  if(candidate?.provider==='openlibrary'){
    if(/^OL\d+W$/i.test(candidate.recordId||''))return 'openlibrary_work';
    if(/^OL\d+M$/i.test(candidate.recordId||''))return 'openlibrary_edition';
    return 'openlibrary';
  }
  return MF433_NATIVE_ID_KEYS[candidate?.provider]||'';
}
function mf433EnrichCoverCandidate(entry,candidate){
  const c=candidate;
  if(!c||typeof c!=='object')return c;
  const ids=[],add=(key,value,evidence)=>{
    const str=String(value??'').trim();
    if(mf433ValidId(key,str)&&!ids.some(r=>r.key===key&&r.value===str))
      ids.push({key,value:str,evidence,source:c.provider});
  };
  const native=mf433NativeKey(c);
  if(native&&c.recordId)add(native,c.recordId,'Provider native record');
  if(c.provider==='openlibrary'&&/\/isbn\/([\dXx-]{10,20})/.test(c.recordUrl||''))
    add('isbn',RegExp.$1,'Existing exact ISBN lookup');
  if(c.provider==='anilist'&&entry?.idMal)add('mal',entry.idMal,'Linked MAL ID reported by AniList');
  if(c.provider==='tvmaze'&&entry?.externals?.imdb)add('imdb',entry.externals.imdb,'Linked IMDb ID reported by TVmaze');
  // Future adapters must provide actual verified record IDs, not guess them from a title.
  if(entry?.externalIds&&typeof entry.externalIds==='object'){
    for(const [key,value] of Object.entries(entry.externalIds))
      add(key,value,'Source record verified mapping');
  }
  if(Array.isArray(entry?.identifiers)){
    for(const row of entry.identifiers){
      if(row?.verified===true)add(String(row.key||''),row.value,'Verified provider mapping');
    }
  }
  c.externalIdCandidates=ids;
  return c;
}
function mf433CandidateLinks(item,candidate){
  const links=[],seen=new Set();
  if(!candidate||typeof candidate!=='object')return links;
  const push=(key,value)=>{
    key=String(key||'').trim().toLowerCase();value=String(value??'').trim();
    if(!mf433ValidId(key,value)||seen.has(key))return;
    seen.add(key);
    const existing=String(item?.externalIds?.[key]??'').trim();
    links.push({key,value,existing,conflict:Boolean(existing&&existing!==value)});
  };
  for(const row of (Array.isArray(candidate.externalIdCandidates)?candidate.externalIdCandidates:[]).slice(0,32)){
    if(row?.key&&row?.value&&row?.evidence)push(row.key,row.value);
  }
  const native=mf433NativeKey(candidate);
  if(native&&candidate.recordId&&!links.some(l=>l.key===native))push(native,candidate.recordId);
  // v427 legacy candidate representation and existing single-ID adapters.
  if(candidate.externalIdKey&&candidate.externalIdValue)push(candidate.externalIdKey,candidate.externalIdValue);
  return links;
}
function mf433LinkCandidateIds(item,candidate,{manual=false}={}){
  if(!item||!candidate)return 0;
  const links=mf433CandidateLinks(item,candidate);
  if(!links.length)return 0;
  let changes=0;
  for(const link of links){
    if(link.conflict||link.existing===link.value)continue;
    // Respect both intentionally cleared IDs and user-written overrides.
    if(!manual&&Object.prototype.hasOwnProperty.call(item.v377ManualExternalIds||{},link.key))continue;
    if(!item.externalIds||typeof item.externalIds!=='object')item.externalIds={};
    item.externalIds[link.key]=link.value;
    if(manual){
      if(!item.v377ManualExternalIds||typeof item.v377ManualExternalIds!=='object')
        item.v377ManualExternalIds={};
      item.v377ManualExternalIds[link.key]=link.value;
    }
    changes++;
  }
  return changes;
}
function mf433CoverIdMarkup(item,candidate,index,scope='mf424'){
  const links=mf433CandidateLinks(item,candidate);
  if(!links.length)return '<small class="mf424-cover-id-note">This provider has not returned any usable verified External IDs.</small>';
  const available=links.filter(x=>!x.conflict&&x.existing!==x.value);
  const conflicts=links.filter(x=>x.conflict);
  const saved=links.filter(x=>x.existing===x.value);
  const label=available.map(x=>mf424Escape(x.key.toUpperCase())+': '+mf424Escape(x.value)).join(' · ');
  const warning=conflicts.length?'<small class="mf424-cover-id-conflict">'+conflicts.map(x=>mf424Escape(x.key.toUpperCase())+' protected (conflicting provider value)').join(' · ')+'</small>':'';
  const present=saved.length?'<small class="mf424-cover-id-note">'+saved.length+' existing ID'+(saved.length===1?'':'s')+' already linked.</small>':'';
  const checkbox=available.length?'<label class="mf424-cover-id-control"><input type="checkbox" data-'+mf424Escape(scope)+'-cover-link-id="'+Number(index)+'" checked> Save '+available.length+' verified External ID'+(available.length===1?'':'s')+' with this cover <strong>'+label+'</strong></label>':'';
  return checkbox+warning+present||'<small class="mf424-cover-id-note">No new External IDs available.</small>';
}
function mf433FillDraftExternalIds(candidate){
  const root=document.querySelector('#modal-root [data-v377-ids-editor]');
  const grid=root?.querySelector('.mf377-ids-grid');
  if(!grid)return false;
  const draft=MF425.draft||{},links=mf433CandidateLinks(draft,candidate);
  let changes=0;
  for(const link of links){
    if(link.conflict||link.existing===link.value)continue;
    let input=[...grid.querySelectorAll('[data-v377-id]')].find(el=>el.dataset.v377Id===link.key);
    if(!input){
      const row=document.createElement('label');
      row.className='field';row.dataset.v377IdRow=link.key;
      row.innerHTML='<span class="field-label">'+mf424Escape(link.key.toUpperCase())+
        '</span><span class="mf377-id-control"><input type="text" data-v377-id="'+mf424Escape(link.key)+'" autocomplete="off"></span>';
      grid.appendChild(row);input=row.querySelector('input');
    }
    if(input&&(!input.value||String(input.value).trim()===link.value)){
      input.value=link.value;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      changes++;
    }
  }
  return changes>0;
}
function mf433FilterExternalIds(needle){
  needle=String(needle||'').trim().toLowerCase();
  document.querySelectorAll('[data-v377-ids-editor] [data-v377-id-row]').forEach(row=>{
    row.hidden=!!needle&&!String(row.textContent||'').toLowerCase().includes(needle)&&
      !String(row.querySelector('[data-v377-id]')?.dataset.v377Id||'').includes(needle);
  });
}
function mf433ReadinessMarkup(){
  const counts={public:0,key:0,restricted:0,review:0,skipped:0};
  for(const p of MF433_PROVIDER_CATALOG)counts[p.access]=(counts[p.access]||0)+1;
  return '<details class="mf433-provider-readiness" data-mf-setting-id="cover-provider-readiness">'+
    '<summary><strong>Additional API providers · v434 activation pending</strong><small>Registered ID formats and integration plans; not live cover sources</small></summary>'+
    '<p>No additional API keys are read by v433. Existing cover sources remain active. New connections will be tested and explicitly enabled in v434.</p>'+
    '<div class="mf433-readiness-grid">'+
      Object.entries(counts).map(([kind,count])=>'<span><b>'+count+'</b> '+mf424Escape(kind)+' providers</span>').join('')+'</div>'+
    '<p>Providers include TMDB, OMDb, Fanart.tv, AnimeSchedule, Trakt, Comic Vine, Metron, Hardcover, Podcast Index, Inventaire, BnF, Gutendex, EpisoDate, MangaUpdates, GCD and the mapping sources.</p>'+
    '</details>';
}
const mf433SettingsMarkupBase=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
  const html=mf433SettingsMarkupBase();
  return html.replace('<p class="mf425-settings-note">A saved cover change',mf433ReadinessMarkup()+'<p class="mf425-settings-note">A saved cover change');
};
Object.assign(App,{mf433FilterExternalIds});
window.MediaFlowV433=Object.freeze({
  version:MF433_VERSION,
  stage:'provider-registration-and-external-ids',
  liveProviderActivation:'v434',
  list:()=>MF433_PROVIDER_CATALOG.map(p=>({...p})),
  verifyCandidateIds:(item,candidate)=>mf433CandidateLinks(item,candidate).map(link=>({...link}))
});
