/* MediaFlow v428 — universal release scan adapters, evidence not progress mutation.
   Unsupported media/source combinations remain Unknown. */
(function(){
'use strict';
if(window.MediaFlowV428Fresh)return;
const F={job:null,running:false,ready:false,rate:{},cache:new Map(),account:''};
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sourceKinds={tvmaze:['tv','anime'],episodate:['tv'],mangadex:['manga']};
function media(item){const c=(S.categories||[]).find(x=>String(x.id)===String(item.categoryId)),v=String(c?.name||item.categoryId||'').toLowerCase();
 if(/manga|manhwa|manhua|comic.*asian/.test(v))return 'manga';if(/anime|seasonal/.test(v))return 'anime';if(/tv|television|series/.test(v))return 'tv';if(/comic/.test(v))return 'comics';if(/book|novel/.test(v))return 'books';if(/movie|film/.test(v))return 'movies';if(/podcast|audio/.test(v))return 'podcasts';return 'other';}
async function db(){return new Promise((ok,no)=>{const r=indexedDB.open('mediaflow-fresh-v428',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result);});}
async function record(op,val){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction('data',op==='get'?'readonly':'readwrite');const r=op==='get'?tx.objectStore('data').get('scan:'+account()):tx.objectStore('data').put(val,'scan:'+account());r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result);tx.oncomplete=()=>d.close();});}
async function save(){if(F.job)await record('put',F.job);window.MediaFlowV428Hub?.paint();}
async function request(source,url){const key=source+' '+url,now=Date.now(),hit=F.cache.get(key);if(hit&&hit.until>now)return hit.data;
 const rate=F.rate[source]||(F.rate[source]={next:0,wait:0});let wait=Math.max(rate.next-Date.now(),rate.wait-Date.now(),0);
 if(wait)await sleep(wait);rate.next=Date.now()+(source==='mangadex'?2600:1700);
 for(let attempt=0;attempt<3;attempt++){const ctrl=new AbortController(),clock=setTimeout(()=>ctrl.abort(),15000);
  try{const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});
   if(r.ok){const data=await r.json();if(F.cache.size>250)F.cache.delete(F.cache.keys().next().value);F.cache.set(key,{data,until:Date.now()+3600000});return data;}
   if(r.status===404)return null;
   if(r.status===429||r.status===503){const n=Number(r.headers.get('Retry-After'));rate.wait=Date.now()+(Number.isFinite(n)&&n>0?Math.min(300000,n*1000):45000*(attempt+1));await sleep(rate.wait-Date.now());continue;}
   throw Error(source+' HTTP '+r.status);
  }finally{clearTimeout(clock);}
 }throw Error(source+' temporarily rate limited');
}
function aired(date,precise){if(!date)return false;let t=NaN;
 if(precise)t=Date.parse(date);
 else if(/^\d{4}-\d{2}-\d{2}$/.test(String(date)))t=Date.parse(date+'T23:59:59Z');
 else t=Date.parse(date);
 return Number.isFinite(t)&&t<=Date.now();
}
function known(title,raw){return normalize(title)===normalize(raw);}
async function tvmaze(item){
 const ids=item.externalIds||{},id=String(ids.tvmaze||''),imdb=String(ids.imdb||'');
 let show=null;
 if(/^\d+$/.test(id))show=await request('tvmaze','https://api.tvmaze.com/shows/'+encodeURIComponent(id));
 else if(imdb)show=await request('tvmaze','https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb));
 else{const list=await request('tvmaze','https://api.tvmaze.com/search/shows?q='+encodeURIComponent(item.title||''));const match=(list||[]).map(x=>x.show).filter(s=>known(s?.name,item.title));if(match.length===1)show=match[0];}
 if(!show||!show.id||!known(item.title,show.name)&&!id&&!imdb)return {status:'unknown',reason:'TVmaze title identity unverified'};
 const episodes=await request('tvmaze','https://api.tvmaze.com/shows/'+show.id+'/episodes');
 if(!Array.isArray(episodes))return {status:'unknown',reason:'No complete episode list'};
 const released=episodes.filter(e=>aired(e.airstamp||e.airdate,!!e.airstamp));
 return {status:'verified',available:released.length,source:'TVmaze',recordId:String(show.id),url:show.url||'',unit:'episodes',releasedAt:released.at(-1)?.airstamp||released.at(-1)?.airdate||''};
}
async function episodate(item){
 const ids=item.externalIds||{},id=ids.episodate||'';
 let target=id;
 if(!target){const hits=await request('episodate','https://www.episodate.com/api/search?q='+encodeURIComponent(item.title||'')+'&page=1');
  const exact=(hits?.tv_shows||[]).filter(x=>known(x.name,item.title));if(exact.length!==1)return {status:'unknown',reason:'EpisoDate title ambiguous'};target=exact[0].id;}
 const resp=await request('episodate','https://www.episodate.com/api/show-details?q='+encodeURIComponent(target));
 const tv=resp?.tvShow;if(!tv||!known(item.title,tv.name)&&!id)return {status:'unknown',reason:'EpisoDate identity mismatch'};
 if(!Array.isArray(tv.episodes))return {status:'unknown',reason:'Episode list unavailable'};
 const unique=new Map();for(const e of tv.episodes)if(aired(e.air_date,false)&&e.season!=null&&e.episode!=null)unique.set(String(e.season)+':'+String(e.episode),e);
 return {status:'verified',available:unique.size,source:'EpisoDate',unit:'episodes',url:tv.url||'https://www.episodate.com',recordId:String(tv.id||target)};
}
async function mangadex(item){
 const id=String(item.externalIds?.mangadex||'');if(!/^[0-9a-f-]{32,36}$/i.test(id))return {status:'unknown',reason:'Verified MangaDex ID required'};
 const resp=await request('mangadex','https://api.mangadex.org/manga/'+encodeURIComponent(id)+'/feed?limit=100&translatedLanguage%5B%5D=en&order%5Bchapter%5D=desc');
 if(!Array.isArray(resp?.data))return {status:'unknown',reason:'MangaDex chapter feed unavailable'};
 const seen=new Set();let highest=0,latest='';
 for(const e of resp.data){const ch=String(e.attributes?.chapter||'').trim(),n=Number(ch);
  if(!ch||!Number.isFinite(n)||n<=0||!aired(e.attributes?.publishAt||e.attributes?.readableAt,true))continue;
  seen.add(ch);highest=Math.max(highest,n);latest=e.attributes?.publishAt||latest;}
 if(!highest)return {status:'unknown',reason:'No numbered English chapter evidence in sampled feed'};
 return {status:'verified',available:highest,source:'MangaDex',unit:'translated chapters',url:'https://mangadex.org/title/'+id,recordId:id,partial:true,reason:'English translation feed; numeric chapter numbers can have gaps',releasedAt:latest};
}
async function one(item,mode,selected){const type=media(item),supported=Object.entries(sourceKinds).filter(([_,types])=>types.includes(type)).map(([name])=>name);
 if(!supported.length)return {status:'unknown',reason:'No verified public release adapter for '+type,unit:type};
 const providers=mode==='individual'?[selected].filter(p=>supported.includes(p)):type==='tv'?['tvmaze','episodate']:type==='manga'?['mangadex']:['tvmaze'];
 if(!providers.length)return {status:'unknown',reason:'Provider does not support '+type,unit:type};
 const evidence=[];for(const p of providers){
  try{const row=await ({tvmaze,episodate,mangadex}[p])(item);evidence.push({...row,provider:p});if(mode==='automatic'&&row.status==='verified')break;}
  catch(e){evidence.push({status:'unknown',provider:p,reason:String(e.message||e)});}
 }
 const verified=evidence.filter(x=>x.status==='verified'&&Number.isFinite(x.available));
 if(!verified.length)return {status:'unknown',reason:evidence.map(x=>x.provider+': '+x.reason).join(' | '),evidence};
 const best=verified.reduce((a,b)=>a.available>=b.available?a:b);
 const watched=Number(item.progress)||0;return {status:best.available>watched?'fresh':'none',available:best.available,unwatched:Math.max(0,best.available-watched),source:best.source,unit:best.unit,url:best.url||'',releasedAt:best.releasedAt||'',evidence,partial:best.partial||false};
}
function report(){const j=F.job;if(!j){showToast('No Fresh Releases results yet.');return;}
 document.getElementById('mf428-fresh-report')?.remove();const root=document.createElement('div');root.id='mf428-fresh-report';root.className='mf428-metadata-overlay';
 const lines=(j.results||[]).filter(r=>r.status==='fresh'||r.status==='unknown').slice(-250);
 root.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428FreshCloseReport()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>FRESH RELEASE EVIDENCE</small><h2>Release Scan Results</h2><p>'+esc(j.cursor)+' / '+esc(j.ids.length)+' scanned · '+esc(j.fresh||0)+' fresh · '+esc(j.unknown||0)+' unknown · '+esc(j.none||0)+' caught up</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428FreshCloseReport()">Close</button></header><div class="mf428-fresh-list">'+lines.map(r=>'<article class="mf428-fresh-row"><strong>'+esc(r.title)+'</strong><small>'+esc(r.status)+' · '+esc(r.source||r.reason||'Unverified')+'</small>'+(r.unwatched?'<b>'+esc(r.unwatched)+' '+esc(r.unit||'releases')+'</b>':'')+(r.url?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Source</a>':'')+'</article>').join('')+'</div><footer><button type="button" class="btn btn-ghost" onclick="App.mf428FreshResume()">Continue Scan</button></footer></section>';document.body.appendChild(root);
}
function closeReport(){document.getElementById('mf428-fresh-report')?.remove();}
function open(){document.getElementById('mf428-fresh-config')?.remove();const el=document.createElement('div');el.id='mf428-fresh-config';el.className='mf428-metadata-overlay';
 el.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428FreshClose()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>ALL MEDIA CATEGORIES</small><h2>Fresh Releases</h2><p>Keep the Smart Engine and check other supported release units without double-counting sources.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428FreshClose()">Close</button></header><div class="mf428-meta-config"><label>Detection<select id="mf428-fresh-mode"><option value="automatic2">Alex Godly’s Smart Engine</option><option value="automatic">Automatic Multi-Provider</option><option value="individual">Individual Provider</option></select></label><label>Individual provider<select id="mf428-fresh-provider"><option value="tvmaze">TVmaze</option><option value="episodate">EpisoDate</option><option value="mangadex">MangaDex</option></select></label><label>Scope<select id="mf428-fresh-scope"><option value="all">All applicable Library titles</option><option value="selected">Selected Library titles</option></select></label></div><div class="mf428-meta-note">Anime still uses the existing seasonal verification architecture. Unconfigured API providers stay hidden. Unsupported releases are Unknown, never assumed zero.</div><footer><button type="button" class="btn btn-primary" onclick="App.mf428FreshBegin()">Start Release Scan</button><button type="button" class="btn btn-ghost" onclick="App.mf428FreshReport()">Previous Results</button></footer></section>';document.body.appendChild(el);}
function close(){document.getElementById('mf428-fresh-config')?.remove();}
async function begin(){await init();if(F.job&&!['complete','stopped','failed'].includes(F.job.status)){showToast('Resume or finish the current Fresh Releases scan first.');return;}
 const mode=document.getElementById('mf428-fresh-mode')?.value||'automatic2',provider=document.getElementById('mf428-fresh-provider')?.value||'tvmaze',scope=document.getElementById('mf428-fresh-scope')?.value||'all';
 const selected=scope==='selected'&&(typeof mf425Selection==='function'?mf425Selection():[]);
 const ids=(selected?.length?selected.map(id=>(S.library||[]).find(i=>String(i.id)===String(id))).filter(Boolean):(S.library||[])).filter(item=>item?.id).map(item=>String(item.id));
 if(!ids.length){showToast('No Library titles to scan.');return;}
 F.job={account:account(),ids,cursor:0,status:'queued',results:[],fresh:0,unknown:0,none:0,mode,provider,paused:false,stopped:false,created:Date.now(),errors:[]};await save();close();window.MediaFlowV428Hub?.enqueue('fresh',{universal:true});}
async function worker(){await init();const j=F.job;
 if(!j||j.account!==account()){if(typeof window.MediaFlowV428Hub?.runLegacyFresh==='function')return window.MediaFlowV428Hub.runLegacyFresh();return;}
 F.running=true;j.status='running';await save();
 try{
  while(j.cursor<j.ids.length){if(j.paused||j.stopped||account()!==j.account){j.status=j.stopped?'stopped':'paused';break;}
   const id=j.ids[j.cursor],item=(S.library||[]).find(i=>String(i?.id)===id);
   if(item){const type=media(item);if(type==='anime'){j.unknown++;if(j.results.length<5000)j.results.push({id,title:item.title,status:'unknown',reason:'Use existing Seasonal Anime Smart Engine for verified anime airing records'});}
    else{const r=await one(item,j.mode,j.provider);j[r.status==='fresh'?'fresh':r.status==='none'?'none':'unknown']++;if((r.status==='fresh'||r.status==='unknown')&&j.results.length<5000)j.results.push({id,title:item.title,...r});}
   }
   j.cursor++;if(j.cursor%10===0)await save();
  }
  if(j.cursor>=j.ids.length)j.status='complete';await save();
 }catch(e){j.status='paused';j.errors.push(String(e.message||e));await save();throw e;}
 finally{F.running=false;window.MediaFlowV428Hub?.paint();if(j.status==='complete')showToast('Fresh Releases scan complete. '+j.fresh+' titles have verified new content.');}
}
async function resume(){if(!F.job)return;F.job.paused=false;F.job.stopped=false;F.job.status='queued';await save();window.MediaFlowV428Hub?.enqueue('fresh',{universal:true});}
async function init(){if(F.ready)return;F.ready=true;F.account=account();try{const saved=await record('get');if(saved?.account===account()){F.job=saved;if(['running','ready','cooldown'].includes(saved.status)){F.job.status='paused';await save();}}}catch(e){console.warn('v428 fresh checkpoint unavailable',e);}}
function control(cmd){if(!F.job)return;if(cmd==='pause'||cmd==='stop'){F.job[cmd==='pause'?'paused':'stopped']=true;save();}}
function settingsEnhance(){if(S.view!=='settings')return;const existing=document.querySelector('.mf428-settings-group');if(!existing||document.querySelector('.mf428-fresh-settings'))return;existing.insertAdjacentHTML('afterend','<div class="mf366-subgroup mf428-fresh-settings"><h3 class="mf366-subgroup-heading">Fresh Releases</h3><div class="mf366-subgroup-content"><section class="mf425-settings-card"><strong>Universal Fresh Releases</strong><p>Check episodes, chapters and other release types from available public providers.</p><div class="mf425-settings-actions"><button class="btn btn-primary" onclick="App.mf428FreshOpen()">Configure & Start</button><button class="btn btn-ghost" onclick="App.mf428FreshReport()">View Results</button></div></section></div></div>');}
if(typeof MediaFlowRuntime!=='undefined')MediaFlowRuntime.registerPageEnhancer('settings',settingsEnhance);
Object.assign(App,{mf428FreshOpen:open,mf428FreshClose:close,mf428FreshBegin:begin,mf428FreshReport:report,mf428FreshCloseReport:closeReport,mf428FreshResume:resume,mf428FreshControl:control});
window.MediaFlowV428Fresh={status:()=>F.job?.status||'idle',progress:()=>({at:F.job?.cursor||0,total:F.job?.ids?.length||0}),open,worker};
window.MediaFlowV428Hub?.registerFresh(worker);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();