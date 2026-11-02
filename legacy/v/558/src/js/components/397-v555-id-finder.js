/* MediaFlow v555 — External ID finder that actually works.
 * v434 decided "needs configuration" from a provider status that was only
 * loaded after visiting Provider Management, so Find IDs usually refused to
 * search. Now the status is loaded on demand, every site that is set up can
 * be searched at once with every known name, and results are grouped by ID
 * type so the right record can be picked separately for each ID.
 * Saved IDs are never replaced, and nothing is saved until the title is.
 */
const MF555ID={busy:false,controller:null,results:new Map(),status:new Map(),itemId:''};
const MF555ID_PUBLIC=['jikan','anilist','kitsu','tvmaze'];
const MF555ID_LABELS={all:'All sites',jikan:'MyAnimeList (Jikan)',anilist:'AniList',kitsu:'Kitsu',tvmaze:'TVmaze',
  tmdb:'TMDB',omdb:'IMDb (OMDb)',malofficial:'MyAnimeList Official',trakt:'Trakt',simkl:'SIMKL',watchmode:'Watchmode',
  animeschedule:'AnimeSchedule',metron:'Metron',episodate:'EpisoDate',gutendex:'Gutendex',fanart:'Fanart.tv'};
const MF555ID_KEYS={imdb:'IMDb',tmdb:'TMDB Movie',tmdb_tv:'TMDB TV',mal:'MyAnimeList',anilist:'AniList',kitsu:'Kitsu',
  tvmaze:'TVmaze',trakt:'Trakt',simkl:'SIMKL',tvdb_series:'TheTVDB',anidb:'AniDB',animeschedule:'AnimeSchedule',
  watchmode:'Watchmode',metron_series:'Metron',gcd_series:'Grand Comics Database',comicvine_volume:'Comic Vine',episodate:'EpisoDate',gutendex:'Gutendex'};
const MF555ID_LINKS={imdb:v=>'https://www.imdb.com/title/'+v+'/',tmdb:v=>'https://www.themoviedb.org/movie/'+v,
  tmdb_tv:v=>'https://www.themoviedb.org/tv/'+v,mal:v=>'https://myanimelist.net/anime/'+v,anilist:v=>'https://anilist.co/anime/'+v,
  kitsu:v=>'https://kitsu.io/anime/'+v,tvmaze:v=>'https://www.tvmaze.com/shows/'+v};

function mf555IdGatewayProviders(){
  return (MF434.status?.providers||[]).filter(p=>p.configured&&p.testable&&MF434_COVER.has(p.id)||p.configured&&p.testable&&MF434_MAPPING.has(p.id)).map(p=>p.id);
}
function mf555IdReason(raw){
  const m=String(raw||'');
  if(/credential missing|not configured/i.test(m))return 'Not set up: the API key for this site is missing in Supabase.';
  if(/quota|limit reached/i.test(m))return 'Daily limit reached for this site. Try again tomorrow.';
  if(/wait\s+(\d+)/i.test(m))return 'Busy: wait '+m.match(/wait\s+(\d+)/i)[1]+' seconds and try again.';
  if(/OMDb API key rejected/i.test(m))return 'IMDb (OMDb) rejected the API key. Check the OMDB_API_KEY secret.';
  if(/review pending/i.test(m))return 'This site is not available yet.';
  if(/sign in|session/i.test(m))return 'Sign in again to search this site.';
  if(/abort|timeout|network|fetch/i.test(m))return 'Could not reach the site. Check your connection and try again.';
  return m.slice(0,140)||'The site returned an error.';
}
mf434IdsEditorLookupHtml=function(item){
  const title=mf434Esc(item?.title||'');
  const options=['all',...MF555ID_PUBLIC,...MF434_COVER,...MF434_MAPPING].filter((x,i,a)=>a.indexOf(x)===i)
    .map(id=>'<option value="'+id+'"'+(id==='all'?' selected':'')+'>'+mf434Esc(MF555ID_LABELS[id]||MF434_LABELS[id]||id)+'</option>').join('');
  return '<div class="mf434-id-lookup mf555-id-finder" data-mf555-item="'+mf434Esc(String(item?.id??''))+'"><strong>Discover verified External IDs</strong>'+
    '<p>Searches with every name this title has. Pick the right record for each ID below; existing IDs are never replaced, and nothing is saved until you save this title.</p>'+
    '<div class="mf434-lookup-tools"><input id="mf434-lookup-title" aria-label="Search title" value="'+title+'" placeholder="Title to identify" maxlength="110">'+
    '<select id="mf434-lookup-provider" aria-label="Sites to search">'+options+'</select>'+
    '<button type="button" class="btn btn-ghost mf436-find-ids" data-v225-icon="search" data-v225-iconified="1" onclick="App.mf434SearchIds()">'+mf425Icon('search',16)+'<span>Find IDs</span></button></div>'+
    '<div id="mf434-lookup-results" aria-live="polite"></div></div>';
};
function mf555IdCandidates(row,provider){
  // Gateway search rows carry externalIdCandidates; public adapter rows carry externalIds.
  const list=Array.isArray(row?.externalIdCandidates)?row.externalIdCandidates.map(x=>[x.key,x.value]):Object.entries(row?.externalIds||{});
  const type=String(row?.legacy?.mediaFormat||row?.fields?.mediaFormat||'').trim()||
    (list.some(([k])=>k==='tmdb_tv')?'TV':list.some(([k])=>k==='tmdb')?'Movie':'');
  return list.filter(([k,v])=>k&&v!=null&&String(v).trim()&&mf433ValidId(k,String(v))).map(([key,value])=>({
    key,value:String(value),title:String(row.title||''),year:mf439Year(row.year||row.legacy?.year||row.legacy?.releaseDate)||'',
    type,provider,exact:row.exact!==false,link:row.recordUrl||MF555ID_LINKS[key]?.(String(value))||''}));
}
async function mf555IdSearchOne(provider,name,item,signal){
  if(MF555ID_PUBLIC.includes(provider)){
    const query={id:item?.id,title:name,categoryId:item?.categoryId,externalIds:{},universalMetadata:{mediaType:item?.universalMetadata?.mediaType||'unspecified'}};
    const rows=await mf439LookupPublic(provider,query,signal);
    const n=mf439Norm(name);
    return rows.map(r=>({...r,exact:[r.title,...(r.aliases||[])].some(t=>mf439Norm(t)===n)}));
  }
  const last=MF555R.gatewayLast.get(provider)||0,wait=last+MF555R_GATEWAY_GAP-Date.now();
  if(wait>0)await mf555rSleep(wait,signal);
  MF555R.gatewayLast.set(provider,Date.now());
  const reply=await mf434Call('search',{provider,title:name,externalIds:{},year:item?.year||'',loose:true});
  return reply.results||[];
}
App.mf434SearchIds=mf434SearchIds=async function(){
  if(MF555ID.busy){MF555ID.controller?.abort();return;}
  const root=document.getElementById('mf434-lookup-results');
  const box=root?.closest('.mf555-id-finder');
  const title=String(document.getElementById('mf434-lookup-title')?.value||'').trim();
  const choice=String(document.getElementById('mf434-lookup-provider')?.value||'all');
  if(title.length<2){showToast('Enter a title for ID discovery.');return;}
  const item=mf439Item(box?.dataset?.mf555Item||'')||null;
  MF555ID.busy=true;MF555ID.controller=new AbortController();MF555ID.itemId=String(item?.id||'');
  const signal=MF555ID.controller.signal;
  const button=box?.querySelector('.mf436-find-ids span');if(button)button.textContent='Stop';
  MF555ID.results=new Map();MF555ID.status=new Map();
  const paint=()=>{if(root)root.innerHTML=mf555IdResultsHtml(item);};
  try{
    if(root)root.textContent='Checking which sites are set up…';
    // Load the gateway status on demand (v434 only did this on another page).
    try{if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway(!MF434.status);else await mf434RefreshGateway();}catch(_){}
    const gateway=mf555IdGatewayProviders();
    // "All sites": every site that is set up and fits the title's media type.
    let providers=choice==='all'?[...MF555ID_PUBLIC,...gateway].filter(p=>p!=='fanart'):[choice];
    if(choice==='all'&&item){
      const type=String((typeof getCategory==='function'?getCategory(item.categoryId):null)?.type||'');
      const fit={video:['jikan','anilist','kitsu','tvmaze','tmdb','omdb','malofficial','trakt','simkl','watchmode','animeschedule','episodate'],
        reading:['jikan','anilist','kitsu','malofficial','metron','gutendex'],playing:[],listening:[]}[type];
      if(fit)providers=providers.filter(p=>fit.includes(p));
    }
    if(choice!=='all'&&!MF555ID_PUBLIC.includes(choice)&&!gateway.includes(choice)){
      const st=mf434ProviderStatus(choice);
      MF555ID.status.set(choice,{state:'error',note:!MF434.status?'Could not reach the MediaFlow provider service. Check your connection and sign-in.':
        !st?'This site is not available.':!st.testable?'This site is not available yet.':'Not set up: the API key for this site is missing in Supabase.'});
      paint();return;
    }
    const names=[title,...(item?mf439TitleVariants(item):[])].map(x=>String(x||'').trim()).filter(Boolean);
    const variants=[...new Map(names.map(n=>[mf439Norm(n),n])).values()].slice(0,3);
    for(const p of providers)MF555ID.status.set(p,{state:'waiting',note:'Waiting…'});
    paint();
    // Public sites in parallel with the gateway queue (each keeps its own spacing).
    await Promise.all(providers.map(async p=>{
      MF555ID.status.set(p,{state:'busy',note:'Searching…'});paint();
      let found=0;
      try{
        for(const v of variants){
          if(signal.aborted)throw new Error('Stopped');
          const rows=await mf555IdSearchOne(p,v,item,signal);
          for(const row of rows)for(const c of mf555IdCandidates(row,p)){
            const group=MF555ID.results.get(c.key)||new Map();
            const prev=group.get(c.value);
            if(prev){prev.sources.add(p);prev.exact=prev.exact||c.exact;if(!prev.year&&c.year)prev.year=c.year;}
            else{group.set(c.value,{...c,sources:new Set([p])});found++;}
            MF555ID.results.set(c.key,group);
          }
          if(rows.some(r=>r.exact!==false))break;   // an exact hit: no need for the other names
        }
        MF555ID.status.set(p,{state:'ok',note:found?found+' result'+(found===1?'':'s'):'No match'});
      }catch(e){
        MF555ID.status.set(p,{state:signal.aborted?'stopped':'error',note:signal.aborted?'Stopped':mf555IdReason(e?.message||e)});
      }
      paint();
    }));
  }finally{
    MF555ID.busy=false;MF555ID.controller=null;
    if(button)button.textContent='Find IDs';
    paint();
  }
};
function mf555IdResultsHtml(item){
  const saved=item?.externalIds||{};
  const editor=document.querySelector('[data-v377-ids-editor]');
  const draft=key=>String([...(editor?.querySelectorAll('[data-v377-id]')||[])].find(x=>x.dataset.v377Id===key)?.value||'').trim();
  const status=[...MF555ID.status].map(([p,s])=>'<span class="mf555-id-site is-'+s.state+'">'+mf434Esc(MF555ID_LABELS[p]||p)+': '+mf434Esc(s.note)+'</span>').join('');
  const order=Object.keys(MF555ID_KEYS);
  const groups=[...MF555ID.results].sort((a,b)=>(order.indexOf(a[0])+1||99)-(order.indexOf(b[0])+1||99));
  const body=groups.map(([key,map])=>{
    const rows=[...map.values()].sort((a,b)=>Number(b.exact)-Number(a.exact)||(b.sources.size-a.sources.size));
    const current=String(saved[key]??'').trim()||draft(key);
    const label=MF555ID_KEYS[key]||key.toUpperCase();
    if(current){
      const known=rows.find(r=>r.value===current);
      return '<fieldset class="mf555-id-group is-kept"><legend>'+mf434Esc(label)+'</legend><div class="mf555-id-kept">Already set: <code>'+mf434Esc(current)+'</code>'+
        (known?' · '+mf434Esc(known.title):'')+' (kept)</div></fieldset>';
    }
    const exact=rows.filter(r=>r.exact);
    const preselect=exact.length===1?exact[0].value:'';
    const name='mf555-id-'+key;
    return '<fieldset class="mf555-id-group" data-mf555-key="'+mf434Esc(key)+'"><legend>'+mf434Esc(label)+(rows.length>1?' · '+rows.length+' results':'')+'</legend>'+
      rows.map(r=>'<label class="mf555-id-option'+(r.exact?'':' is-loose')+'"><input type="radio" name="'+name+'" value="'+mf434Esc(r.value)+'"'+(r.value===preselect?' checked':'')+'>'+
        '<span class="mf555-id-main"><b>'+mf434Esc(r.title||'Untitled')+'</b>'+
        '<small>'+[r.year,r.type,'ID '+r.value,[...r.sources].map(s=>MF555ID_LABELS[s]||s).join(', ')].filter(Boolean).map(mf434Esc).join(' · ')+
        (r.exact?'':' · <em>check this</em>')+'</small></span>'+
        (r.link?'<a href="'+mf434Esc(r.link)+'" target="_blank" rel="noopener noreferrer" class="mf555-id-open">Open</a>':'')+'</label>').join('')+
      '<label class="mf555-id-option is-none"><input type="radio" name="'+name+'" value=""'+(preselect?'':' checked')+'><span class="mf555-id-main"><b>None of these</b></span></label>'+
      '</fieldset>';
  }).join('');
  const any=groups.some(([key])=>!String(saved[key]??'').trim()&&!draft(key));
  return '<div class="mf555-id-status">'+status+'</div>'+
    (MF555ID.busy&&!groups.length?'':groups.length?body:(MF555ID.busy?'':'<p class="mf555-id-empty">No records found. Try another name (for anime, the English or romanized title) or a single site.</p>'))+
    (any?'<button type="button" class="btn btn-sm mf555-id-link" onclick="App.mf555LinkChosenIds()">Add selected IDs to this title</button>':'');
}
App.mf555LinkChosenIds=function(){
  const editor=document.querySelector('[data-v377-ids-editor]'),list=editor?.querySelector('.mf377-ids-grid');
  if(!list){showToast('Open the title editor to add IDs.');return;}
  let count=0,kept=0;
  for(const group of document.querySelectorAll('.mf555-id-group[data-mf555-key]')){
    const key=group.dataset.mf555Key,value=group.querySelector('input[type=radio]:checked')?.value||'';
    if(!value||!mf433ValidId(key,value))continue;
    let input=[...list.querySelectorAll('[data-v377-id]')].find(x=>x.dataset.v377Id===key);
    if(!input){
      const row=document.createElement('label');row.className='field';row.dataset.v377IdRow=key;
      row.innerHTML='<span class="field-label">'+mf434Esc(MF555ID_KEYS[key]||key.toUpperCase())+'</span><span class="mf377-id-control"><input type="text" data-v377-id="'+mf434Esc(key)+'" autocomplete="off"></span>';
      list.appendChild(row);input=row.querySelector('input');
    }
    if(input.value&&String(input.value).trim()!==value){kept++;continue;}   // never replace
    if(input.value===value)continue;
    input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));count++;
  }
  showToast(count?count+' ID'+(count===1?'':'s')+' added'+(kept?' · '+kept+' existing kept':'')+'. Save the title to keep them.':'No new IDs selected.');
  const root=document.getElementById('mf434-lookup-results');
  if(root)root.innerHTML=mf555IdResultsHtml(mf439Item(MF555ID.itemId));
};
window.MediaFlowV555IdFinder=Object.freeze({version:MF555_VERSION,busy:()=>MF555ID.busy,results:()=>MF555ID.results,status:()=>MF555ID.status});
MediaFlowRuntime.version=MF555_VERSION;
