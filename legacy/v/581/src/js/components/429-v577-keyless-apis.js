/* MediaFlow v577 — every keyless source that a browser can read, connected.
 *
 * Checked live against the real services (the app repo's
 * tool/live_sources.py, run on GitHub): these answer without a key and allow
 * a web page to read them (CORS).
 *   Covers:  Wikidata (its image, from Wikimedia Commons), Wikimedia Commons,
 *            Library of Congress, Inventaire.io, EpisoDate.
 *   Details: Wikidata, Library of Congress, Crossref, Inventaire.io,
 *            EpisoDate, German National Library (DNB), BnF.
 * Deezer and the Grand Comics Database also need no key but don't allow a web
 * page to read them: the MediaFlow app (9.0.0.577) uses them, the website
 * can't. Sources that now need a key or block automated requests
 * (BoardGameGeek, MangaUpdates, Royal Road, GOG's search) stay listed with
 * the reason. Every source is in Sources, in category presets and has a probe.
 */
const MF577_KEYLESS_VERSION=577;
const MF577_COVER_SOURCES=[
 {id:'wikidata',name:'Wikidata images',types:['anime','manga','movie','tv','book','comic','game','music','other'],key:'wikidata',limit:20,gap:1200,level:'Public · Wikimedia Commons images'},
 {id:'wikimedia',name:'Wikimedia Commons',types:['movie','tv','book','comic','game','music','other'],key:'',limit:20,gap:1200,level:'Public · free-licence images'},
 {id:'loc',name:'Library of Congress',types:['book','comic','reading','other'],key:'',limit:12,gap:2600,level:'Public · catalog images'},
 {id:'inventaire',name:'Inventaire.io',types:['book','comic','reading'],key:'wikidata',limit:15,gap:1500,level:'Public · book covers'},
 {id:'episodate',name:'EpisoDate',types:['tv'],key:'episodate',limit:15,gap:1500,level:'Public · TV posters'}
];
const MF577_DETAIL_SOURCES={
 wikidata:{name:'Wikidata',minGap:1200,hosts:['www.wikidata.org']},
 loc:{name:'Library of Congress',minGap:2600,hosts:['www.loc.gov']},
 crossref:{name:'Crossref',minGap:1500,hosts:['api.crossref.org']},
 inventaire:{name:'Inventaire.io',minGap:1500,hosts:['inventaire.io']},
 episodate:{name:'EpisoDate',minGap:1500,hosts:['www.episodate.com']},
 dnb:{name:'German National Library',minGap:2000,hosts:['services.dnb.de']},
 bnf:{name:'BnF',minGap:2000,hosts:['catalogue.bnf.fr']}
};
const MF577_APP_ONLY={deezer:'No key needed, but a web page may not read it (the MediaFlow app uses it)',
 gcd:'No key needed, but a web page may not read it (the MediaFlow app uses it)'};
const MF577_BLOCKED={boardgamegeek:'Now needs a registered key (HTTP 401)',mangaupdates:'Blocks automated requests (HTTP 403)',
 royalroad:'No search API; blocks automated requests (HTTP 403)',gog:'Its public search no longer returns results'};
const MF577_NET={last:new Map(),cache:new Map()};

const mf577Text=(v,max=220)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const mf577Year=v=>{const m=/(1[5-9]\d\d|20\d\d|21[0-4]\d)/.exec(String(v||''));return m?Number(m[1]):0;};
function mf577Commons(file,width=600){
 const f=String(file||'').replace(/^File:/i,'').trim();
 return f?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f.replace(/ /g,'_'))+'?width='+width:'';
}
async function mf577Fetch(provider,url,{xml=false,body=null}={}){
 const def=MF577_DETAIL_SOURCES[provider];
 const parsed=new URL(url);
 if(!def||parsed.protocol!=='https:'||!def.hosts.includes(parsed.hostname))throw Error('Unapproved endpoint');
 const key=url+'|'+(body?JSON.stringify(body):'');
 const hit=MF577_NET.cache.get(key);if(hit&&hit.until>Date.now())return hit.data;
 const last=MF577_NET.last.get(provider)||0,wait=def.minGap-(Date.now()-last);
 if(wait>0)await new Promise(r=>setTimeout(r,wait));
 MF577_NET.last.set(provider,Date.now());
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14500);
 try{
  const res=await fetch(url,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,credentials:'omit',cache:'no-store',signal:ctrl.signal,
   headers:{Accept:xml?'application/xml,text/xml':'application/json',...(body?{'Content-Type':'application/json'}:{})}});
  if(!res.ok)throw Error(provider+' HTTP '+res.status);
  const raw=await res.text();if(raw.length>2_000_000)throw Error('Response too large');
  const data=xml?new DOMParser().parseFromString(raw,'text/xml'):JSON.parse(raw);
  if(MF577_NET.cache.size>200)MF577_NET.cache.delete(MF577_NET.cache.keys().next().value);
  MF577_NET.cache.set(key,{data,until:Date.now()+15*60000});
  return data;
 }finally{clearTimeout(timer);}
}

/* ---------- shared readers (covers and details use the same records) ---------- */
async function mf577WikidataRecords(title,request){
 const s=await request('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en&uselang=en&type=item&limit=8&search='+encodeURIComponent(title));
 const ids=(s?.search||[]).map(r=>String(r.id||'')).filter(id=>/^Q\d{1,12}$/.test(id)).slice(0,8);
 if(!ids.length)return [];
 const e=await request('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=labels%7Cdescriptions%7Caliases%7Cclaims&languages=en%7Cja%7Cfr%7Cde%7Ces&ids='+ids.join('%7C'));
 const label=(x,l='en')=>x?.labels?.[l]?.value||'';
 const claim=(x,p)=>(x?.claims?.[p]||[]).map(c=>c?.mainsnak?.datavalue?.value).filter(v=>v!=null);
 return ids.map(id=>e?.entities?.[id]).filter(Boolean).map(x=>{
  const time=claim(x,'P577')[0]?.time||claim(x,'P580')[0]?.time||'';
  return {id:x.id,title:label(x)||Object.values(x.labels||{})[0]?.value||'',description:x.descriptions?.en?.value||'',
   aliases:[...Object.values(x.labels||{}).map(v=>v.value),...(x.aliases?.en||[]).map(v=>v.value)].filter(Boolean),
   image:claim(x,'P18')[0]||claim(x,'P154')[0]||'',year:mf577Year(time)};
 }).filter(r=>r.title);
}
async function mf577LocRecords(title,request){
 const d=await request('https://www.loc.gov/books/?fo=json&c=12&q='+encodeURIComponent(title));
 return (d?.results||[]).map(r=>{
  let img=[].concat(r.image_url||[])[0]||'';
  if(img.startsWith('//'))img='https:'+img;
  img=img.replace(/^http:/,'https:').replace(/#.*$/,'');
  const id=String(r.id||r.url||'').replace(/\/$/,'').split('/').pop();
  return {id,title:mf577Text(Array.isArray(r.title)?r.title[0]:r.title),year:mf577Year(r.date),image:img,link:String(r.url||r.id||''),
   subjects:[].concat(r.subject||[]).slice(0,12).map(x=>mf577Text(x,80)),creators:[].concat(r.contributor||[]).slice(0,6).map(x=>mf577Text(x,80)),
   lccn:[].concat(r.number_lccn||[])[0]||''};
 }).filter(r=>r.id&&r.title);
}
async function mf577InventaireRecords(title,request){
 const d=await request('https://inventaire.io/api/search?types=works&lang=en&limit=10&search='+encodeURIComponent(title));
 return (d?.results||[]).map(r=>{
  const uri=String(r.uri||''),wd=/^wd:(Q\d+)$/.exec(uri);
  const img=String(r.image||'');
  return {id:wd?wd[1]:uri,uri,title:mf577Text(r.label),description:mf577Text(r.description,400),
   image:img?(img.startsWith('http')?img:'https://inventaire.io'+img):'',year:mf577Year(r.description)};
 }).filter(r=>r.id&&r.title);
}
async function mf577EpisodateRecords(title,request){
 const d=await request('https://www.episodate.com/api/search?page=1&q='+encodeURIComponent(title));
 return (d?.tv_shows||[]).slice(0,10).map(r=>({id:String(r.permalink||r.id||''),num:String(r.id||''),title:mf577Text(r.name),year:mf577Year(r.start_date),
  image:String(r.image_thumbnail_path||'').replace('/thumbnail/','/full/').replace(/^http:/,'https:'),network:mf577Text(r.network,80),
  status:mf577Text(r.status,40),country:mf577Text(r.country,10),endDate:r.end_date||''})).filter(r=>r.id&&r.title);
}

/* ---------- covers ---------- */
function mf577CoverAdapter(id){
 return async function(item,ops){
  const title=mf440Title(item),out=[];
  if(!title)return [];
  const req=url=>ops.request(id,url);
  if(id==='wikidata'){
   for(const r of await mf577WikidataRecords(title,req)){
    if(!r.image)continue;
    const c=mf440Record(item,'wikidata','wikidata',r.id,r.title,r.year,mf577Commons(r.image),'https://www.wikidata.org/wiki/'+r.id,r.aliases,String(item?.externalIds?.wikidata||'')===r.id);
    if(c)out.push(c);
   }
  }else if(id==='wikimedia'){
   const d=await req('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srnamespace=6&srlimit=12&srsearch='+encodeURIComponent(title));
   for(const r of d?.query?.search||[]){
    const file=String(r.title||'');if(!/\.(jpe?g|png|webp)$/i.test(file))continue;
    const name=file.replace(/^File:/i,'').replace(/\.[a-z]+$/i,'').replace(/[_-]+/g,' ');
    const c=mf440Record(item,'wikimedia','',String(r.pageid||file),name,mf577Year(name),mf577Commons(file),'https://commons.wikimedia.org/wiki/'+encodeURIComponent(file.replace(/ /g,'_')));
    if(c)out.push(c);
   }
  }else if(id==='loc'){
   for(const r of await mf577LocRecords(title,req)){
    if(!r.image)continue;
    const c=mf440Record(item,'loc','',r.id,r.title,r.year,r.image,r.link);
    if(c)out.push(c);
   }
  }else if(id==='inventaire'){
   for(const r of await mf577InventaireRecords(title,req)){
    if(!r.image)continue;
    const c=mf440Record(item,'inventaire',/^Q\d+$/.test(r.id)?'wikidata':'',r.id,r.title,r.year,r.image,'https://inventaire.io/entity/'+r.uri);
    if(c)out.push(c);
   }
  }else if(id==='episodate'){
   for(const r of await mf577EpisodateRecords(title,req)){
    if(!r.image)continue;
    const c=mf440Record(item,'episodate','',r.id,r.title,r.year,r.image,'https://www.episodate.com/tv-show/'+r.id);
    if(c)out.push(c);
   }
  }
  return mf440Candidates(out);
 };
}
function mf577ActivateCovers(){
 for(const def of MF577_COVER_SOURCES){
  const adapter=mf577CoverAdapter(def.id);
  let record=mf424Provider(def.id);
  if(!record){mf424RegisterCoverProvider({...def,credentials:false},adapter);record=mf424Provider(def.id);}
  if(record){
   Object.assign(record,{name:def.name,limit:def.limit,gap:def.gap,types:def.types,credentials:false,level:def.level});
   MF424_EXTRA_COVER_ADAPTERS.set(def.id,adapter);
  }
  MF440_ACTIVE.add(def.id);
  const entry=MF438_EXTRA_CATALOG.find(x=>x[0]===def.id);
  if(entry){entry[4]='public';if(!String(entry[3]).includes('cover'))entry[3]+=',cover';}
 }
 MF424_DEFAULT.enabled=[...new Set([...MF424_DEFAULT.enabled,...MF577_COVER_SOURCES.map(x=>x.id)])];
 MF424_DEFAULT.priorities=[...new Set([...MF424_DEFAULT.priorities,...MF577_COVER_SOURCES.map(x=>x.id)])];
}
mf577ActivateCovers();
/* The cover sources' ID checks (Wikidata Q-ids, EpisoDate permalinks). */
const mf577HasIdBase=mf424HasID;
mf424HasID=function(item,provider){
 const ids=item?.externalIds||{};
 if(provider==='wikidata'||provider==='inventaire')return /^Q\d+$/.test(String(ids.wikidata||''));
 if(provider==='episodate')return /^[a-z0-9-]{2,120}$/.test(String(ids.episodate||''));
 if(provider==='wikimedia'||provider==='loc')return false;
 return mf577HasIdBase.apply(this,arguments);
};

/* ---------- details ---------- */
for(const [id,def] of Object.entries(MF577_DETAIL_SOURCES))if(!MF439_PUBLIC[id])MF439_PUBLIC[id]={name:def.name,minGap:def.minGap};
function mf577XmlText(node,tag){return [...node.getElementsByTagName(tag)].map(x=>mf577Text(x.textContent,400)).filter(Boolean);}
async function mf577LookupDetails(provider,item){
 const title=mf439TitleVariants(item)[0];if(!title||title.length<2)return [];
 const req=(url,opt)=>mf577Fetch(provider,url,opt),rows=[];
 if(provider==='wikidata'){
  for(const r of await mf577WikidataRecords(title,req))
   rows.push(mf439Entry('wikidata',r.id,r.title,{year:r.year,aliases:mf439StringList(r.aliases),externalIds:{wikidata:r.id},
    legacy:{synopsis:r.description,year:r.year},fields:{}}));
 }else if(provider==='loc'){
  for(const r of await mf577LocRecords(title,req))
   rows.push(mf439Entry('loc',r.id,r.title,{year:r.year,legacy:{year:r.year,genres:r.subjects},
    fields:{bookSubjects:r.subjects,creators:r.creators},externalIds:r.lccn?{lccn:String(r.lccn)}:{}}));
 }else if(provider==='crossref'){
  const d=await req('https://api.crossref.org/works?rows=10&query.bibliographic='+encodeURIComponent(title));
  for(const r of d?.message?.items||[]){
   const t=[].concat(r.title||[])[0];if(!t||!r.DOI)continue;
   const year=Number(r.published?.['date-parts']?.[0]?.[0]||r['published-print']?.['date-parts']?.[0]?.[0]||r.issued?.['date-parts']?.[0]?.[0])||0;
   const isbn=[].concat(r.ISBN||[]);
   rows.push(mf439Entry('crossref',r.DOI,t,{year,externalIds:{doi:String(r.DOI),...(isbn[0]?{isbn:String(isbn[0]).replace(/[^0-9X]/gi,'')}:{})},
    legacy:{year,synopsis:mf577Text(r.abstract,1200),mediaFormat:mf577Text(r.type,40)},
    fields:{publisher:mf577Text(r.publisher,160),creators:(r.author||[]).slice(0,8).map(a=>mf577Text([a.given,a.family].filter(Boolean).join(' '),120)).filter(Boolean)}}));
  }
 }else if(provider==='inventaire'){
  for(const r of await mf577InventaireRecords(title,req))
   rows.push(mf439Entry('inventaire',r.id,r.title,{year:r.year,externalIds:/^Q\d+$/.test(r.id)?{wikidata:r.id}:{},legacy:{synopsis:r.description,year:r.year}}));
 }else if(provider==='episodate'){
  for(const r of (await mf577EpisodateRecords(title,req)).slice(0,6))
   rows.push(mf439Entry('episodate',r.id,r.title,{year:r.year,externalIds:{episodate:r.id},
    legacy:{year:r.year,mediaFormat:'TV'},fields:{tvNetwork:r.network,tvStatus:r.status,country:r.country,tvLastAirDate:r.endDate||''}}));
 }else if(provider==='dnb'||provider==='bnf'){
  const url=provider==='dnb'
   ?'https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&recordSchema=oai_dc&maximumRecords=10&query='+encodeURIComponent('tit='+title)
   :'https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=dublincore&maximumRecords=10&query='+encodeURIComponent('bib.title all "'+title.replace(/"/g,'')+'"');
  const doc=await req(url,{xml:true});
  const recs=[...doc.getElementsByTagNameNS('*','dc')].length?[...doc.getElementsByTagNameNS('*','dc')]:[];
  for(const dc of recs){
   const t=mf577XmlText(dc,'dc:title')[0]||[...dc.getElementsByTagNameNS('*','title')].map(x=>x.textContent)[0];
   const ids=[...dc.getElementsByTagNameNS('*','identifier')].map(x=>mf577Text(x.textContent,200));
   const rid=provider==='dnb'?(ids.find(x=>/^\d{8,9}[\dX]$/i.test(x))||''):(ids.find(x=>/ark:\/12148\//.test(x))||'').split('ark:/12148/').pop();
   if(!t||!rid)continue;
   const isbn=ids.map(x=>x.replace(/[^0-9X]/gi,'')).find(x=>x.length===13||x.length===10)||'';
   const date=[...dc.getElementsByTagNameNS('*','date')].map(x=>x.textContent)[0]||'';
   const name=mf577Text(String(t).split(' / ')[0],220);
   rows.push(mf439Entry(provider,rid,name,{year:mf577Year(date),externalIds:{[provider]:rid,...(isbn?{isbn}:{})},
    legacy:{year:mf577Year(date),genres:[...dc.getElementsByTagNameNS('*','subject')].slice(0,10).map(x=>mf577Text(x.textContent,80))},
    fields:{publisher:mf577Text([...dc.getElementsByTagNameNS('*','publisher')].map(x=>x.textContent)[0],160),
     creators:[...dc.getElementsByTagNameNS('*','creator')].slice(0,6).map(x=>mf577Text(x.textContent,120))}}));
  }
 }
 return rows.filter(r=>r.title&&r.recordId).slice(0,10);
}
const mf577LookupPublicBase=mf439LookupPublic;
mf439LookupPublic=function(provider,item,signal){
 if(MF577_DETAIL_SOURCES[provider]&&!MF439_GATEWAY.includes(provider))return mf577LookupDetails(provider,item);
 if(provider==='episodate')return mf577LookupDetails(provider,item);
 return mf577LookupPublicBase.apply(this,arguments);
};
/* EpisoDate answers browsers directly now: no gateway key needed. */
const mf577GatewayBase=typeof mf439LookupGateway==='function'?mf439LookupGateway:null;
if(mf577GatewayBase){
 mf439LookupGateway=function(provider,item){
  if(provider==='episodate')return mf577LookupDetails('episodate',item);
  return mf577GatewayBase.apply(this,arguments);
 };
}

/* ---------- probes and the catalog ---------- */
Object.assign(MF438_PUBLIC_PROBES,{
 wikidata:{url:'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Dune&language=en&format=json&origin=*&limit=1',valid:d=>Array.isArray(d?.search)},
 wikimedia:{url:'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Dune&srnamespace=6&srlimit=1&format=json&origin=*',valid:d=>Array.isArray(d?.query?.search)},
 loc:{url:'https://www.loc.gov/books/?q=frankenstein&fo=json&c=1',valid:d=>Array.isArray(d?.results)},
 crossref:{url:'https://api.crossref.org/works?query.bibliographic=frankenstein&rows=1',valid:d=>Array.isArray(d?.message?.items)},
 inventaire:{url:'https://inventaire.io/api/search?types=works&search=dune&lang=en&limit=1',valid:d=>Array.isArray(d?.results)},
 episodate:{url:'https://www.episodate.com/api/search?q=breaking%20bad&page=1',valid:d=>Array.isArray(d?.tv_shows)}
});
if(typeof mf438Catalog==='function'){
 const mf577CatalogBase=mf438Catalog;
 mf438Catalog=function(){
  const rows=mf577CatalogBase.apply(this,arguments);
  for(const row of rows){
   if(MF577_DETAIL_SOURCES[row.id]||MF577_COVER_SOURCES.some(x=>x.id===row.id)){row.access='public';row.keyless=true;row.mf577Connected=true;}
   if(MF577_APP_ONLY[row.id])row.mf577Note=MF577_APP_ONLY[row.id];
   if(MF577_BLOCKED[row.id])row.mf577Note=MF577_BLOCKED[row.id];
  }
  return rows;
 };
}
window.MediaFlowV577Sources=Object.freeze({covers:MF577_COVER_SOURCES.map(x=>x.id),details:Object.keys(MF577_DETAIL_SOURCES),
 appOnly:Object.keys(MF577_APP_ONLY),blocked:MF577_BLOCKED,lookup:mf577LookupDetails,cover:id=>mf577CoverAdapter(id)});
