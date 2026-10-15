/* MediaFlow v428 — universal release scan adapters, evidence not progress mutation.
   Unsupported media/source combinations remain Unknown. */
(function(){
'use strict';
if(window.MediaFlowV428Fresh)return;
const F={job:null,running:false,ready:false,rate:{},cache:new Map(),account:''};
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const safeSourceLink=raw=>{try{const url=new URL(String(raw||''));return url.protocol==='https:'||url.protocol==='http:'?url.href:'';}catch(_){return '';}};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sourceKinds={tvmaze:['tv'],episodate:['tv'],mangadex:['manga'],feed:['podcasts','webnovels','webseries']};
const types={anime:'Anime episodes',tv:'TV episodes',manga:'translated chapters',comics:'comic issues',books:'books / volumes',webnovels:'web novel chapters',webseries:'web series episodes',podcasts:'podcast episodes',movies:'movie installments',other:'releases'};
function media(item){const c=(S.categories||[]).find(x=>String(x.id)===String(item.categoryId)),v=String(c?.name||item.categoryId||'').toLowerCase();
 if(/manga|manhwa|manhua/.test(v))return 'manga';
 if(/anime|seasonal/.test(v))return 'anime';
 if(/podcast|audio\s*series/.test(v))return 'podcasts';
 if(/web.?novel|web.?fiction|serial\s*fiction|royal road|scribble hub/.test(v))return 'webnovels';
 if(/web.?series|youtube|peertube|online\s*video/.test(v))return 'webseries';
 if(/comic|graphic novel/.test(v))return 'comics';
 if(/book|novel|light novel/.test(v))return 'books';
 if(/movie|film/.test(v))return 'movies';
 if(/tv|television|series/.test(v))return 'tv';
 return 'other';}
async function db(){return new Promise((ok,no)=>{const r=indexedDB.open('mediaflow-fresh-v428',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result);});}
async function record(op,val,owner=account()){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction('data',op==='get'?'readonly':'readwrite');const r=op==='get'?tx.objectStore('data').get('scan:'+owner):tx.objectStore('data').put(val,'scan:'+owner);r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result);tx.oncomplete=()=>d.close();});}
async function save(){if(F.job)await record('put',F.job,F.job.account);window.MediaFlowV428Hub?.paint();}
async function request(source,url,format='json'){const key=source+' '+url,now=Date.now(),hit=F.cache.get(key);if(hit&&hit.until>now)return hit.data;
 const rate=F.rate[source]||(F.rate[source]={next:0,wait:0});
 for(let attempt=0;attempt<3;attempt++){
  const wait=Math.max(rate.next-Date.now(),rate.wait-Date.now(),0);if(wait)await sleep(wait);
  rate.next=Date.now()+(source==='mangadex'?2600:1700);
  const ctrl=new AbortController(),clock=setTimeout(()=>ctrl.abort(),15000);
  try{const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});
   if(r.ok){const data=format==='xml'?await r.text():await r.json();if(F.cache.size>250)F.cache.delete(F.cache.keys().next().value);F.cache.set(key,{data,until:Date.now()+3600000});return data;}
   if(r.status===404)return null;
   if(r.status===429||r.status===503||r.status>=500){
    const h=String(r.headers.get('Retry-After')||'');
    const n=Number(h),absolute=Date.parse(h);
    const wait=Number.isFinite(n)&&n>0?n*1000:Number.isFinite(absolute)?Math.max(0,absolute-Date.now()):45000*(attempt+1);
    rate.wait=Date.now()+Math.max(1000,Math.min(300000,wait));continue;
   }
   throw Error(source+' HTTP '+r.status);
  }catch(e){if(attempt>=2||!(e?.name==='AbortError'||e instanceof TypeError))throw e;rate.wait=Date.now()+1500*(attempt+1);}
   finally{clearTimeout(clock);}
 }throw Error(source+' temporarily unavailable');
}
function aired(date,precise){if(!date)return false;let t=NaN;
 if(precise)t=Date.parse(date);
 else if(/^\d{4}-\d{2}-\d{2}$/.test(String(date)))t=Date.parse(date+'T23:59:59Z');
 else t=Date.parse(date);
 return Number.isFinite(t)&&t<=Date.now();
}
function known(title,raw){return normalize(title)===normalize(raw);}

function availableEvidence(item,units,source,extra={}){
 const progress=Math.max(0,Number(item.progress)||0);
 return {status:units>progress?'fresh':'none',available:units,unwatched:Math.max(0,units-progress),source,...extra};
}
function freshButIncomplete(item,highest,source,unit,extra={}){
 if(!Number.isSafeInteger(highest)||highest<=0)return {status:'unknown',source,unit,reason:'No reliable numeric release evidence'};
 const progress=Math.max(0,Number(item.progress)||0);
 // A partial source cannot prove the user is caught up, only that a higher
 // chapter/episode number has already been released.
 return {status:highest>progress?'fresh':'unknown',available:highest,unwatched:Math.max(0,highest-progress),source,unit,partial:true,...extra,
 reason:highest>progress?'Verified released numbered item; incomplete feed does not establish a full total':'Incomplete feed; cannot prove no new releases'};
}
async function tvmaze(item){
 const ids=item.externalIds||{},id=String(ids.tvmaze||''),imdb=String(ids.imdb||'');
 let show=null;
 if(/^\d+$/.test(id))show=await request('tvmaze','https://api.tvmaze.com/shows/'+encodeURIComponent(id));
 else if(imdb)show=await request('tvmaze','https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb));
 else{
  const list=await request('tvmaze','https://api.tvmaze.com/search/shows?q='+encodeURIComponent(item.title||''));
  const match=(list||[]).map(x=>x.show).filter(s=>known(s?.name,item.title));
  if(match.length===1)show=match[0];
 }
 if(!show?.id||!known(item.title,show.name))return {status:'unknown',reason:'TVmaze title identity unverified'};
 const episodes=await request('tvmaze','https://api.tvmaze.com/shows/'+encodeURIComponent(show.id)+'/episodes?specials=1');
 if(!Array.isArray(episodes))return {status:'unknown',reason:'No episode list'};
 const normal=new Map(),specials=new Map(),unknownDates=[];
 for(const ep of episodes){
  const isSpecial=ep.number==null||Number(ep.number)<=0||ep.type==='significant_special'||ep.type==='insignificant_special';
  const stamp=ep.airstamp||ep.airdate;
  if(!stamp){unknownDates.push(ep.id);continue;}
  if(!aired(stamp,!!ep.airstamp))continue;
  const key=isSpecial?'special:'+String(ep.id||ep.season+':'+ep.name):String(ep.season)+':'+String(ep.number);
  (isSpecial?specials:normal).set(key,ep);
 }
 const released=[...normal.values()];
 const result=availableEvidence(item,normal.size,'TVmaze',{
  recordId:String(show.id),url:show.url||'',unit:'episodes',
  extras:{specialsReleased:specials.size,unknownDates:unknownDates.length},
  releasedAt:released.map(e=>e.airstamp||e.airdate).sort().at(-1)||''
 });
 if(result.status==='none'&&unknownDates.length){
  result.status='unknown';result.reason='Some episodes have no known airdate; cannot confirm caught up';
 }
 return result;
}
async function episodate(item){
 const ids=item.externalIds||{},id=ids.episodate||'';
 let target=id;
 if(!target){
  const hits=await request('episodate','https://www.episodate.com/api/search?q='+encodeURIComponent(item.title||'')+'&page=1');
  const exact=(hits?.tv_shows||[]).filter(x=>known(x.name,item.title));
  if(exact.length!==1)return {status:'unknown',reason:'EpisoDate title ambiguous'};
  target=exact[0].id;
 }
 const resp=await request('episodate','https://www.episodate.com/api/show-details?q='+encodeURIComponent(target));
 const tv=resp?.tvShow;if(!tv||!known(item.title,tv.name))return {status:'unknown',reason:'EpisoDate identity mismatch'};
 if(!Array.isArray(tv.episodes))return {status:'unknown',reason:'Episode list unavailable'};
 const normal=new Set(),unknownDates=[];
 for(const ep of tv.episodes){
  if(ep.season==null||ep.episode==null){continue;}
  if(!ep.air_date){unknownDates.push(ep.season+':'+ep.episode);continue;}
  if(aired(ep.air_date,false))normal.add(String(ep.season)+':'+String(ep.episode));
 }
 const result=availableEvidence(item,normal.size,'EpisoDate',{unit:'episodes',url:tv.url||'https://www.episodate.com',recordId:String(tv.id||target),extras:{unknownDates:unknownDates.length}});
 if(result.status==='none'&&unknownDates.length){result.status='unknown';result.reason='Episode dates unavailable';}
 return result;
}
async function mangadex(item){
 const id=String(item.externalIds?.mangadex||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  return {status:'unknown',reason:'Verified MangaDex title UUID required'};
 // The feed is paginated and can include duplicate chapters across
 // scanlation groups, languages and re-uploads. Treat its number as evidence
 // of a released higher chapter, not a full chapter count or zero.
 const resp=await request('mangadex','https://api.mangadex.org/manga/'+encodeURIComponent(id)+'/feed?limit=100&translatedLanguage%5B%5D=en&order%5BpublishAt%5D=desc');
 if(!Array.isArray(resp?.data))return {status:'unknown',reason:'MangaDex chapter feed unavailable'};
 const candidates=new Map();
 for(const entry of resp.data){
  const value=String(entry.attributes?.chapter||'').trim();
  const chapter=Number(value);
  if(!value||!Number.isSafeInteger(chapter)||chapter<=0)continue;
  const date=entry.attributes?.publishAt||entry.attributes?.readableAt;
  if(!aired(date,true))continue;
  const existing=candidates.get(chapter);
  if(!existing||Date.parse(existing.date)<Date.parse(date))candidates.set(chapter,{date,id:entry.id});
 }
 const highest=Math.max(0,...candidates.keys());
 return freshButIncomplete(item,highest,'MangaDex','English-translated chapters',{
  url:'https://mangadex.org/title/'+id,recordId:id,observedCount:candidates.size,
  releasedAt:[...candidates.values()].map(x=>x.date).sort().at(-1)||'',
  evidenceScope:'Last 100 matching feed entries, English; excludes future updates'
 });
}
function validFeedUrl(item){
 const raw=item.externalIds?.rss||item.externalIds?.feed||item.rssFeedUrl||item.feedUrl;
 if(typeof raw!=='string'||raw.length>2000)return '';
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.'))return '';
  if(/^(localhost|.*\.local|.*\.internal)$/i.test(url.hostname))return '';
  if(/^(?:127|10|0|169\.254|192\.168)\./.test(url.hostname))return '';
  return url.href;
 }catch(_){return '';}
}
function feedItems(raw,type){
 if(typeof DOMParser!=='function')return {error:'XML parser unavailable'};
 const doc=new DOMParser().parseFromString(raw,'application/xml');
 if(doc.querySelector('parsererror'))return {error:'Invalid feed XML'};
 const rss=[...doc.getElementsByTagName('item')],atom=[...doc.getElementsByTagName('entry')];
 const nodes=rss.length?rss:atom,items=[],seen=new Set();
 const child=(node,name)=>[...node.children].find(x=>x.localName===name)?.textContent?.trim()||'';
 for(const item of nodes.slice(0,400)){
  const guid=child(item,'guid')||child(item,'id')||child(item,'link')||child(item,'title');
  const date=child(item,'pubDate')||child(item,'published')||child(item,'updated');
  if(!guid||!date||!aired(date,true)||seen.has(guid))continue;
  if(type==='podcasts'&&!([...item.children].some(x=>x.localName==='enclosure')))continue;
  seen.add(guid);
  const text=child(item,'title');
  const explicit=[...item.children].find(x=>x.localName==='episode'&&/itunes/i.test(x.prefix||''))?.textContent;
  const titleNumber=/(?:episode|ep\.?|chapter|ch\.?|part)\s*#?\s*(\d{1,6})\b/i.exec(text);
  const num=Number(explicit||titleNumber?.[1]);
  items.push({id:guid,date,title:text,number:Number.isSafeInteger(num)&&num>0?num:null});
 }
 return {items,total:nodes.length};
}
async function feed(item){
 const url=validFeedUrl(item);
 if(!url)return {status:'unknown',reason:'No existing HTTPS RSS/Atom feed URL for this title (future setup remains hidden)'};
 const kind=media(item),raw=await request('feed',url,'xml');
 if(typeof raw!=='string'||raw.length>2e6)return {status:'unknown',reason:'Feed not available or too large'};
 const parsed=feedItems(raw,kind);
 if(parsed.error)return {status:'unknown',reason:parsed.error};
 const numbered=parsed.items.filter(x=>x.number!=null),highest=Math.max(0,...numbered.map(x=>x.number));
 const latest=parsed.items.map(x=>x.date).sort().at(-1)||'';
 return freshButIncomplete(item,highest,'RSS / Atom',
  kind==='podcasts'?'podcast episodes':kind==='webnovels'?'web novel chapters':'web series episodes',
  {url,recordId:url,observedCount:parsed.items.length,releasedAt:latest,
   evidenceScope:'Existing per-title feed; released unique GUIDs with explicit unit numbers'});
}
const adapters={tvmaze,episodate,mangadex,feed};
function verifiedEvidence(item,evidence,mode='automatic2'){
 const verified=evidence.filter(e=>['fresh','none','verified'].includes(e.status)&&Number.isSafeInteger(Number(e.available))&&Number(e.available)>=0);
 const failures=evidence.filter(e=>e.status==='unknown');
 const positives=verified.filter(e=>Number(e.available)>Math.max(0,Number(item.progress)||0));
 if(positives.length){
  const best=positives.reduce((a,b)=>a.available>=b.available?a:b);
  return {...best,status:'fresh',unwatched:Math.max(0,best.available-(Number(item.progress)||0)),evidence,disagreement:new Set(verified.map(x=>x.available)).size>1};
 }
 if(!verified.length)return {status:'unknown',unit:types[media(item)]||'releases',reason:evidence.map(x=>x.provider+': '+(x.reason||x.status)).join(' | '),evidence};
 // A positive from any verifiable source is enough to mark Fresh. For a
 // negative conclusion, every attempted applicable provider must have
 // completed positively and no partial/unknown source may remain.
 if(failures.length||verified.some(e=>e.partial===true)){
  return {status:'unknown',unit:types[media(item)]||'releases',reason:'Cannot confirm caught up: sources failed or only partial evidence exists',evidence};
 }
 const best=verified.reduce((a,b)=>a.available>=b.available?a:b);
 return {...best,status:'none',unwatched:0,evidence,disagreement:new Set(verified.map(x=>x.available)).size>1};
}
async function one(item,mode,selected){
 const type=media(item),supported=Object.entries(sourceKinds).filter(([_,types])=>types.includes(type)).map(([name])=>name);
 // An RSS adapter requires an already-existing title feed. No API setup
 // controls are surfaced in the MediaFlow UI for unconfigured providers.
 const eligible=supported.filter(p=>p!=='feed'||validFeedUrl(item));
 if(!eligible.length)return {status:'unknown',unit:types[type],reason:'No configured and verified release evidence source for '+type,evidence:[]};
 const providers=mode==='individual'
  ?[selected].filter(p=>eligible.includes(p))
  :type==='tv'?['tvmaze','episodate'].filter(p=>eligible.includes(p))
  :eligible;
 if(!providers.length)return {status:'unknown',unit:types[type],reason:'Chosen provider is not available for '+type,evidence:[]};
 const evidence=[];
 for(const p of providers){
  try{
   const row=await adapters[p](item);
   evidence.push({...row,provider:p});
   if(mode==='automatic'&&row.status==='fresh')break;
   if(mode==='automatic'&&row.status==='none'&&!row.partial)break;
  }catch(e){evidence.push({status:'unknown',provider:p,reason:String(e.message||e).slice(0,220)});}
 }
 return verifiedEvidence(item,evidence,mode);
}
function report(){const j=F.job;if(!j){showToast('No Fresh Releases results yet.');return;}
 document.getElementById('mf428-fresh-report')?.remove();const root=document.createElement('div');root.id='mf428-fresh-report';root.className='mf428-metadata-overlay';
 const lines=(j.results||[]).slice(-250);
 root.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428FreshCloseReport()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>FRESH RELEASE EVIDENCE</small><h2>Release Scan Results</h2><p>'+esc(j.cursor)+' / '+esc(j.ids.length)+' scanned · '+esc(j.fresh||0)+' fresh · '+esc(j.unknown||0)+' unknown · '+esc(j.none||0)+' caught up</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428FreshCloseReport()">Close</button></header><div class="mf428-fresh-list">'+lines.map(r=>'<article class="mf428-fresh-row"><strong>'+esc(r.title)+'</strong><small>'+esc(r.status)+' · '+esc(r.source||r.reason||'Unverified')+'</small>'+
 (r.unwatched?'<b>'+esc(r.unwatched)+' '+esc(r.unit||'releases')+(r.partial?' (partial)':'')+'</b>':'')+
 (r.releasedAt?'<small>Released: '+esc(r.releasedAt)+'</small>':'')+
 (safeSourceLink(r.url)?'<a href="'+esc(safeSourceLink(r.url))+'" target="_blank" rel="noopener noreferrer">Source evidence</a>':'')+
 (r.disagreement?'<small>Provider counts disagree; largest verified count used</small>':'')+
 (r.evidence?.length?'<small>Checks: '+esc(r.evidence.map(e=>e.provider+': '+e.status+(e.available!=null?' ('+e.available+')':'')).join(' · '))+'</small>':'')+'</article>').join('')+'</div><footer><button type="button" class="btn btn-ghost" onclick="App.mf428FreshResume()">Continue Scan</button></footer></section>';document.body.appendChild(root);
}
function closeReport(){document.getElementById('mf428-fresh-report')?.remove();}
function open(){document.getElementById('mf428-fresh-config')?.remove();const el=document.createElement('div');el.id='mf428-fresh-config';el.className='mf428-metadata-overlay';
 el.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428FreshClose()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>ALL MEDIA CATEGORIES</small><h2>Fresh Releases</h2><p>Keep the Smart Engine and check other supported release units without double-counting sources.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428FreshClose()">Close</button></header><div class="mf428-meta-config"><label>Detection<select id="mf428-fresh-mode"><option value="automatic2">Alex Godly’s Smart Engine</option><option value="automatic">Automatic Multi-Provider</option><option value="individual">Individual Provider</option></select></label><label>Individual provider<select id="mf428-fresh-provider"><option value="tvmaze">TVmaze</option><option value="episodate">EpisoDate</option><option value="mangadex">MangaDex</option></select></label><label>Scope<select id="mf428-fresh-scope"><option value="all">All applicable Library titles</option><option value="selected">Selected Library titles</option><option value="category">By Category</option></select></label></div><label class="mf428-category-chooser">Category filter<select id="mf428-fresh-category"><option value="">Choose category</option>'+((S.categories||[]).filter(x=>x?.id).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join(''))+'</select></label><div class="mf428-meta-note">Anime uses the original Seasonal Smart Engine and its saved provider mode. The detection choice here controls other supported public adapters. Existing HTTPS feeds yield partial release evidence; unknown never means zero. Providers needing credentials remain hidden.</div><footer><button type="button" class="btn btn-primary" onclick="App.mf428FreshBegin()">Start Release Scan</button><button type="button" class="btn btn-ghost" onclick="App.mf428FreshReport()">Previous Results</button></footer></section>';document.body.appendChild(el);}
function close(){document.getElementById('mf428-fresh-config')?.remove();}
async function begin(){await init();if(F.job&&!['complete','stopped','failed'].includes(F.job.status)){showToast('Resume or finish the current Fresh Releases scan first.');return;}
 const mode=document.getElementById('mf428-fresh-mode')?.value||'automatic2',provider=document.getElementById('mf428-fresh-provider')?.value||'tvmaze',scope=document.getElementById('mf428-fresh-scope')?.value||'all';
 const selected=scope==='selected'?(typeof mf425Selection==='function'?mf425Selection():[]):[];
 if(scope==='selected'&&!selected.length){showToast('Select Library titles first.');return;}
 const cat=String(document.getElementById('mf428-fresh-category')?.value||'');
 if(scope==='category'&&!cat){showToast('Choose a category to scan.');return;}
 const selectedSet=scope==='selected'?new Set(selected.map(String)):null;
 const ids=(S.library||[]).filter(item=>item?.id&&(!selectedSet||selectedSet.has(String(item.id)))&&(scope!=='category'||String(item.categoryId)===cat)).map(item=>String(item.id));
 if(!ids.length){showToast('No Library titles to scan.');return;}
 F.job={account:account(),ids,cursor:0,status:'queued',results:[],fresh:0,unknown:0,none:0,mode,provider,paused:false,stopped:false,created:Date.now(),errors:[]};await save();
 if(window.MediaFlowV428Hub?.enqueue('fresh',{universal:true})){close();showToast(ids.length+' titles queued for release verification.');}
 else{F.job.status='paused';await save();showToast('Release scanner is already active or queued.');}}
async function worker(params={}){await init();if(!params.universal)return window.MediaFlowV428Hub?.runLegacyFresh(params);
 const j=F.job;if(!j||j.account!==account())return;
 F.running=true;j.status='running';await save();
 const index=new Map((S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i]));
 try{
  if(!j.animeDone&&j.ids.some(id=>{const item=index.get(id);return item&&media(item)==='anime';})){
   try{await window.MediaFlowV428Hub?.runLegacyFresh({force:true});j.animeDone=true;}
   catch(e){j.animeDone=true;j.legacyError=String(e.message||e);console.warn('Seasonal Smart Engine could not verify every record',e);}
   await save();
  }
  while(j.cursor<j.ids.length){if(j.paused||j.stopped||account()!==j.account||!window.MediaFlowV428Hub?.ownsLease()){j.status=j.stopped?'stopped':'paused';break;}
   const id=j.ids[j.cursor],item=index.get(id);
   if(item){const type=media(item);if(type==='anime'){const state=typeof v401EpisodeOutcome==='function'?v401EpisodeOutcome(item):'unknown';if(state==='fresh')j.fresh++;else if(state==='none')j.none++;else j.unknown++;if(j.results.length<5000)j.results.push({id,title:item.title,status:state==='fresh'?'fresh':state==='none'?'none':'unknown',reason:j.legacyError||'Original seasonal verification result',source:'Alex Godly Smart Engine',unit:'episodes'});}
    else{const r=await one(item,j.mode,j.provider);if(j.paused||j.stopped||account()!==j.account||!window.MediaFlowV428Hub?.ownsLease()){j.status='paused';break;}j[r.status==='fresh'?'fresh':r.status==='none'?'none':'unknown']++;if((r.status==='fresh'||r.status==='unknown')&&j.results.length<5000)j.results.push({id,title:item.title,...r});}
   }
   j.cursor++;if(j.cursor%10===0)await save();
  }
  if(j.cursor>=j.ids.length)j.status='complete';await save();
 }catch(e){j.status='paused';j.errors.push(String(e.message||e));await save();throw e;}
 finally{F.running=false;window.MediaFlowV428Hub?.paint();if(j.status==='complete')showToast('Fresh Releases scan complete. '+j.fresh+' titles have verified new content.');}
}
async function resume(){await init();if(!F.job||F.job.account!==account()||F.running)return;F.job.paused=false;F.job.stopped=false;F.job.status='queued';await save();window.MediaFlowV428Hub?.enqueue('fresh',{universal:true});}
async function init(){
 if(F.account&&F.account!==account()&&!F.running){F.initPromise=null;F.job=null;F.ready=false;F.cache.clear();F.rate={};}
 if(F.initPromise)return F.initPromise;F.initPromise=(async()=>{F.account=account();try{const saved=await record('get');if(saved?.account===account()){F.job=saved;if(['running','ready','cooldown'].includes(saved.status)){F.job.status='paused';await save();}}}catch(e){console.warn('v428 fresh checkpoint unavailable',e);}F.ready=true;})();return F.initPromise;}
function control(cmd){if(!F.job)return;
 if(cmd==='pause'||cmd==='stop'||cmd==='cancel'){
  F.job[cmd==='pause'||cmd==='cancel'?'paused':'stopped']=true;
  if(cmd==='cancel')F.job.status='paused';save();
 }
}
function settingsEnhance(){if(S.view!=='settings')return;const existing=document.querySelector('.mf428-settings-group');if(!existing||document.querySelector('.mf428-fresh-settings'))return;existing.insertAdjacentHTML('afterend','<div class="mf366-subgroup mf428-fresh-settings"><h3 class="mf366-subgroup-heading">Fresh Releases</h3><div class="mf366-subgroup-content"><section class="mf425-settings-card"><strong>Universal Fresh Releases</strong><p>Check episodes, chapters and other release types from available public providers.</p><div class="mf425-settings-actions"><button class="btn btn-primary" onclick="App.mf428FreshOpen()">Configure & Start</button><button class="btn btn-ghost" onclick="App.mf428FreshReport()">View Results</button></div></section></div></div>');}
if(typeof MediaFlowRuntime!=='undefined')MediaFlowRuntime.registerPageEnhancer('settings',settingsEnhance);
Object.assign(App,{mf428FreshOpen:open,mf428FreshClose:close,mf428FreshBegin:begin,mf428FreshReport:report,mf428FreshCloseReport:closeReport,mf428FreshResume:resume,mf428FreshControl:control});
window.MediaFlowV428Fresh={status:()=>F.job?.status||'idle',progress:()=>({at:F.job?.cursor||0,total:F.job?.ids?.length||0}),open,worker,media,combine:verifiedEvidence,feedItems,validFeedUrl,evidence:one};
window.MediaFlowV428Hub?.registerFresh(worker);
if(typeof MediaFlowRuntime!=='undefined')MediaFlowRuntime.version=428;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();