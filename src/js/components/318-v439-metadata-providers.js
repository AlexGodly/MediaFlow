/* v439 Metadata provider adapters: bounded, opt-in, read-only. Unavailable
 * providers never return invented fields and never become "connected".
 * A title category is NEVER treated as a media type. */
const MF439_PUBLIC=[
 ['jikan','Jikan (MyAnimeList)'],['anilist','AniList'],['kitsu','Kitsu'],
 ['tvmaze','TVmaze'],['openlibrary','Open Library'],['gutendex','Gutendex'],
 ['itunes','Apple iTunes'],['musicbrainz','MusicBrainz'],['vndb','VNDB'],
 ['episodate','EpisoDate']
];
const MF439_GATEWAY=new Set(['tmdb','omdb','malofficial','trakt']);
const MF439_NET={cache:new Map(),next:new Map(),fail:new Map()};
const mf439Text=(v,max=6000)=>typeof v==='string'?v.trim().slice(0,max):'';
function mf439Strip(v){return mf439Text(String(v??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' '),6000);}
function mf439Norm(v){return String(v||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function mf439Year(v){const m=String(v||'').match(/(?:19|20)\d{2}/);return m?Number(m[0]):0;}
function mf439CleanFields(input){
 const fields={};
 for(const [key,val] of Object.entries(input||{})){
  if(!val||typeof val==='string'&&!val.trim()||Array.isArray(val)&&!val.length)continue;
  if(V178_EDITABLE_RICH_FIELDS.includes(key)){
   if(['studios','producers','genres','themes'].includes(key)){
    const list=(Array.isArray(val)?val:[val]).map(v=>mf439Text(String(v),120)).filter(Boolean).slice(0,40);
    if(list.length)fields[key]=list;
   }else if(['communityScore','durationMinutes','year'].includes(key)){
    if(Number.isFinite(Number(val))&&Number(val)>0)fields[key]=Number(val);
   }else fields[key]=mf439Text(String(val),key==='synopsis'?6000:160);
  }else if(MF437_FIELD_MAP.has(key)){
   const def=MF437_FIELD_MAP.get(key);
   fields[key]=mf437Clean(val,def[2]);
  }
 }
 return fields;
}
function mf439Result(provider,input){
 const name=mf439Text(input.name||'',220),id=mf439Text(String(input.id||''),120);
 if(!name||!id)return null;
 const externalIds={};
 for(const [key,v] of Object.entries(input.ids||{})){
  if(v!=null&&/^[a-z][a-z0-9_]{0,32}$/.test(key)&&/^[\w.:-]{1,120}$/.test(String(v)))externalIds[key]=String(v);
 }
 const ratings={};
 for(const [key,val] of Object.entries(input.ratings||{})){
  if(!MF437_RATING_MAP.has(key)||val?.score==null||!Number.isFinite(Number(val.score)))continue;
  const def=MF437_RATING_MAP.get(key);
  if(Number(val.score)<0||Number(val.score)>Number(val.scale??def[2]))continue;
  ratings[key]={score:Number(val.score),scale:Number(val.scale??def[2]),
   votes:Number.isSafeInteger(Number(val.votes))&&Number(val.votes)>=0?Number(val.votes):null,
   url:mf437Clean(val.url||'','url')};
 }
 return {provider,name,id,year:mf439Year(input.year),mediaType:input.mediaType||'',
  ids:externalIds,fields:mf439CleanFields(input.fields),ratings};
}
function mf439Identity(item,rec){
 const wanted=[item.title,...(Array.isArray(item.alternateTitles)?item.alternateTitles:[]),
  ...(Array.isArray(item.universalMetadata?.fields?.alternateTitles)?item.universalMetadata.fields.alternateTitles:[])].map(mf439Norm).filter(Boolean);
 const same=wanted.includes(mf439Norm(rec.name));
 const saved=item.externalIds||{},matchedId=Object.entries(rec.ids||{}).some(([k,v])=>String(saved[k]||'')===String(v));
 const conflicts=Object.entries(rec.ids||{}).some(([k,v])=>saved[k]!=null&&String(saved[k])!==String(v));
 const expectedYear=mf439Year(item.year||item.releaseYear||item.publicationYear),foundYear=rec.year;
 if(conflicts)return {score:0,verified:false,reason:'Conflicting saved external ID'};
 if(expectedYear&&foundYear&&expectedYear!==foundYear)return {score:0,verified:false,reason:'Conflicting release year'};
 if(!same&&!matchedId)return {score:0,verified:false,reason:'Title does not match'};
 if(matchedId)return {score:1,verified:true,reason:'Verified saved external ID'};
 if(same&&expectedYear&&foundYear)return {score:.98,verified:true,reason:'Exact title and release year'};
 return {score:.82,verified:false,reason:'Exact title; independent identity verification required'};
}
/* Provider-independent request throttling shared across jobs and retries.
 * No global request polling; calls are only on explicit user action.
 * A network/API error must never cause a metadata change. */
async function mf439Json(provider,url,{method='GET',body=null,headers={}}={}){
 const key=provider+':'+url+':'+(body||'');
 const hit=MF439_NET.cache.get(key);
 if(hit&&hit.expires>Date.now())return hit.value;
 const last=MF439_NET.next.get(provider)||0;
 const delay=Math.max(0,last-Date.now());
 if(delay)await new Promise(r=>setTimeout(r,delay));
 MF439_NET.next.set(provider,Date.now()+(provider==='musicbrainz'?1800:provider==='jikan'?1600:1000));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(url,{method,body,headers:{Accept:'application/json',...headers,
   ...(body?{'Content-Type':'application/json'}:{})},signal:controller.signal,credentials:'omit'});
  if(!response.ok){if(response.status===429||response.status>=500)MF439_NET.next.set(provider,Date.now()+45000);
   throw Error(provider+' HTTP '+response.status);}
  const text=await response.text();if(text.length>1300000)throw Error('Oversized provider response');
  const json=JSON.parse(text);if(MF439_NET.cache.size>240)MF439_NET.cache.delete(MF439_NET.cache.keys().next().value);
  MF439_NET.cache.set(key,{expires:Date.now()+15*60000,value:json});return json;
 }finally{clearTimeout(timeout);}
}
const mf439Names=(x)=>Array.isArray(x)?x.map(o=>typeof o==='string'?o:o?.name||o?.title).filter(Boolean):[];
async function mf439FetchJikan(title,item){
 const responses=[];
 for(const kind of ['anime','manga']){
  const json=await mf439Json('jikan','https://api.jikan.moe/v4/'+kind+'?q='+encodeURIComponent(title)+'&limit=5');
  for(const a of (json?.data||[]).slice(0,5)){
   const r=mf439Result('jikan',{id:a.mal_id,name:a.title,year:a.year||a.published?.from||a.aired?.from,
    mediaType:kind,ids:{mal:a.mal_id},fields:{
     synopsis:mf439Strip(a.synopsis),originalTitle:a.title_japanese,
     alternateTitles:a.title_synonyms||[],studios:mf439Names(a.studios),
     producers:mf439Names(a.producers),genres:mf439Names(a.genres),
     themes:mf439Names(a.themes),mediaFormat:a.type,
     mediaSource:a.source,releaseDate:(a.aired?.from||a.published?.from||'').slice(0,10),
     episodeCount:a.episodes,chapterCount:a.chapters,volumeCount:a.volumes},
    ratings:{mal:{score:a.score,scale:10,votes:a.scored_by,url:a.url}}});
   if(r)responses.push(r);
  }
 }
 return responses;
}
async function mf439FetchAniList(title,item){
 const query='query($search:String,$type:MediaType){Page(perPage:6){media(search:$search,type:$type){id idMal title{romaji english native} description(asHtml:false) startDate{year month day} season format genres episodes chapters volumes averageScore favourites studios{nodes{name}}}}}';
 const all=[];
 for(const type of ['ANIME','MANGA']){
  const data=await mf439Json('anilist','https://graphql.anilist.co',{method:'POST',
   body:JSON.stringify({query,variables:{search:title,type}})});
  for(const a of data?.data?.Page?.media||[]){
   const date=a.startDate||{},year=date.year||0;
   const releaseDate=year&&date.month&&date.day?[year,String(date.month).padStart(2,'0'),String(date.day).padStart(2,'0')].join('-'):'';
   const rec=mf439Result('anilist',{id:a.id,name:a.title?.english||a.title?.romaji||a.title?.native,
    year,mediaType:type==='ANIME'?'anime':'manga',ids:{anilist:a.id,mal:a.idMal},fields:{
     synopsis:mf439Strip(a.description),originalTitle:a.title?.native,
     alternateTitles:[a.title?.romaji,a.title?.english].filter(Boolean),
     genres:a.genres||[],studios:mf439Names(a.studios?.nodes),
     mediaFormat:a.format,releaseDate,episodeCount:a.episodes,
     chapterCount:a.chapters,volumeCount:a.volumes},
    ratings:{anilist:{score:a.averageScore,scale:100,votes:null,
     url:'https://anilist.co/'+(type==='ANIME'?'anime':'manga')+'/'+a.id}}});
   if(rec)all.push(rec);
  }
 }
 return all;
}
async function mf439FetchKitsu(title,item){
 const out=[];
 for(const type of ['anime','manga']){
  const data=await mf439Json('kitsu','https://kitsu.io/api/edge/'+type+'?filter%5Btext%5D='+encodeURIComponent(title)+'&page%5Blimit%5D=5');
  for(const o of data?.data||[]){
   const a=o.attributes||{},rec=mf439Result('kitsu',{id:o.id,name:a.canonicalTitle||a.titles?.en||a.titles?.en_jp,
    year:a.startDate,mediaType:type,ids:{kitsu:o.id},fields:{synopsis:mf439Strip(a.synopsis||a.description),
     originalTitle:a.titles?.ja_jp,alternateTitles:Object.values(a.titles||{}),
     releaseDate:a.startDate,mediaFormat:a.showType||a.subtype,
     episodeCount:a.episodeCount,chapterCount:a.chapterCount,volumeCount:a.volumeCount},
    ratings:{kitsu:{score:a.averageRating?Number(a.averageRating):null,scale:100,
     url:'https://kitsu.app/'+type+'/'+o.id}}});
   if(rec)out.push(rec);
  }
 }
 return out;
}
async function mf439FetchTvmaze(title){
 const a=await mf439Json('tvmaze','https://api.tvmaze.com/search/shows?q='+encodeURIComponent(title));
 return (Array.isArray(a)?a:[]).slice(0,8).map(row=>{
  const s=row.show||{};
  return mf439Result('tvmaze',{id:s.id,name:s.name,year:s.premiered,mediaType:'tv',
   ids:{tvmaze:s.id,imdb:s.externals?.imdb},fields:{synopsis:mf439Strip(s.summary),
    genres:s.genres||[],releaseDate:s.premiered,mediaFormat:s.type,
    networks:[s.network?.name,s.webChannel?.name].filter(Boolean),
    episodeCount:s._embedded?.episodes?.length},
   ratings:{tvmaze:{score:s.rating?.average,scale:10,votes:null,url:s.url}}});
 }).filter(Boolean);
}
async function mf439FetchOpenLibrary(title){
 const data=await mf439Json('openlibrary','https://openlibrary.org/search.json?title='+encodeURIComponent(title)+'&limit=7');
 const results=[];
 for(const a of (data.docs||[]).slice(0,6)){
  const key=String(a.key||'').replace('/works/','');
  const rec=mf439Result('openlibrary',{id:key,name:a.title,year:a.first_publish_year,
   mediaType:'book',ids:{openlibrary_work:key,isbn:a.isbn?.[0]},fields:{
    authors:a.author_name||[],bookPublishers:a.publisher?.slice(0,15)||[],
    originalTitle:a.title,alternateTitles:a.title_suggest?[a.title_suggest]:[],
    pageCount:a.number_of_pages_median,originalLanguage:a.language?.[0]}});
  if(rec)results.push(rec);
 }
 // The search API omits work descriptions. Retrieve only when identity is
 // independently verified. A rejected match never triggers work detail calls.
 return results;
}
async function mf439OpenLibraryDescription(item,rec){
 if(!rec||rec.provider!=='openlibrary')return rec;
 const identity=mf439Identity(item,rec);
 if(!identity.verified||!/^[A-Za-z0-9]+$/.test(rec.id))return rec;
 const d=await mf439Json('openlibrary','https://openlibrary.org/works/'+rec.id+'.json');
 const description=typeof d.description==='string'?d.description:d.description?.value;
 if(mf439Text(description))rec.fields.synopsis=mf439Strip(description);
 return rec;
}
async function mf439FetchGutendex(title){
 const j=await mf439Json('gutendex','https://gutendex.com/books?search='+encodeURIComponent(title));
 return (j.results||[]).slice(0,6).map(a=>mf439Result('gutendex',{
  id:a.id,name:a.title,year:0,mediaType:'book',ids:{gutendex:a.id},fields:{
   authors:(a.authors||[]).map(x=>x.name).filter(Boolean),
   translators:(a.translators||[]).map(x=>x.name).filter(Boolean),keywords:a.subjects?.slice(0,20)},
 })).filter(Boolean);
}
async function mf439FetchITunes(title){
 const j=await mf439Json('itunes','https://itunes.apple.com/search?term='+encodeURIComponent(title)+'&entity=album&limit=12');
 return (j.results||[]).filter(r=>r.wrapperType==='collection').slice(0,8).map(a=>
  mf439Result('itunes',{id:a.collectionId,name:a.collectionName,year:a.releaseDate,
   mediaType:'music',ids:{apple_music_album:a.collectionId},fields:{
    albumArtists:[a.artistName],releaseDate:String(a.releaseDate||'').slice(0,10),
    trackCount:a.trackCount,releaseType:a.collectionType,
    musicbrainzArtist:a.artistName}})).filter(Boolean);
}
async function mf439FetchMusicBrainz(title){
 const j=await mf439Json('musicbrainz','https://musicbrainz.org/ws/2/release-group/?query='+encodeURIComponent('releasegroup:'+title)+'&fmt=json&limit=6');
 return (j['release-groups']||[]).slice(0,6).map(a=>mf439Result('musicbrainz',{
  id:a.id,name:a.title,year:a['first-release-date'],
  mediaType:'music',ids:{musicbrainz_release_group:a.id},fields:{
   albumArtists:(a['artist-credit']||[]).map(x=>x.artist?.name).filter(Boolean),
   releaseType:a['primary-type'],releaseDate:a['first-release-date']}
 })).filter(Boolean);
}
async function mf439FetchVNDB(title){
 const query={filters:['search','=',title],fields:'id,title,alttitle,description,released,rating,votecount',
  results:7};
 const j=await mf439Json('vndb','https://api.vndb.org/kana/vn',{method:'POST',body:JSON.stringify(query)});
 return (j.results||[]).map(a=>mf439Result('vndb',{
  id:a.id,name:a.title,year:a.released,mediaType:'visual_novel',ids:{vndb:a.id},
  fields:{synopsis:mf439Strip(a.description),alternateTitles:[a.alttitle].filter(Boolean),
   releaseDate:a.released},ratings:{vndb:{score:a.rating==null?null:Number(a.rating)/10,scale:10,
    votes:a.votecount,url:'https://vndb.org/'+a.id}}})).filter(Boolean);
}
async function mf439FetchEpisodate(title){
 const j=await mf439Json('episodate','https://www.episodate.com/api/search?q='+encodeURIComponent(title)+'&page=1');
 return (j.tv_shows||[]).slice(0,8).map(a=>mf439Result('episodate',{
  id:a.id,name:a.name,year:a.start_date,mediaType:'tv',ids:{episodate:a.id},
  fields:{releaseDate:a.start_date,networks:[a.network].filter(Boolean)}
 })).filter(Boolean);
}
const MF439_ADAPTERS={
 jikan:mf439FetchJikan,anilist:mf439FetchAniList,kitsu:mf439FetchKitsu,
 tvmaze:mf439FetchTvmaze,openlibrary:mf439FetchOpenLibrary,
 gutendex:mf439FetchGutendex,itunes:mf439FetchITunes,musicbrainz:mf439FetchMusicBrainz,
 vndb:mf439FetchVNDB,episodate:mf439FetchEpisodate
};
async function mf439Gateway(item,provider){
 if(typeof mf434Call!=='function')throw Error('MediaFlow API gateway unavailable');
 if(!mf434ProviderStatus(provider)?.configured||!mf434SavedTests().includes(provider))
  throw Error('Provider has not passed connection testing in API Providers & Testing');
 const response=await mf434Call('metadata',mf434Payload(item,provider));
 return (response.results||[]).map(r=>mf439Result(provider,r)).filter(Boolean);
}
async function mf439Fetch(item,provider){
 const source=MF439_ADAPTERS[provider];
 if(!source&&!MF439_GATEWAY.has(provider))throw Error('Provider has no metadata retrieval adapter yet');
 const list=source?await source(String(item.title||'').trim(),item):await mf439Gateway(item,provider);
 const records=(Array.isArray(list)?list:[]).filter(Boolean).slice(0,16).map(r=>({...r,identity:mf439Identity(item,r)}))
  .filter(r=>r.identity.score>0);
 if(provider==='openlibrary')for(const r of records.slice(0,2))
   if(r.identity.verified){try{await mf439OpenLibraryDescription(item,r);}catch(e){console.warn('Open Library description:',String(e.message||e));}}
 return records;
}
window.MediaFlowV439Adapters=Object.freeze({providers:MF439_PUBLIC.map(x=>x[0]).concat([...MF439_GATEWAY]),fetch:mf439Fetch,identity:mf439Identity});
