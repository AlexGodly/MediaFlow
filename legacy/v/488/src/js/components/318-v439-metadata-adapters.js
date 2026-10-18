/* MediaFlow v439 — actual read-only metadata adapters.
 * Only explicit, fixed public endpoints and the existing verified Supabase
 * gateway are permitted. Catalog-only providers do not get fake adapters.
 * The adapter never writes Library data; the recovery engine owns review.
 */
const MF439_PUBLIC={
 jikan:{name:'Jikan / MyAnimeList',minGap:1700},
 anilist:{name:'AniList',minGap:1500},
 kitsu:{name:'Kitsu',minGap:1700},
 tvmaze:{name:'TVmaze',minGap:1100},
 openlibrary:{name:'Open Library',minGap:1600},
 gutendex:{name:'Gutendex',minGap:1800},
 itunes:{name:'Apple iTunes',minGap:1200},
 steam:{name:'Steam Store',minGap:1400},
 vndb:{name:'VNDB',minGap:1800},
 musicbrainz:{name:'MusicBrainz',minGap:1500}
};
const MF439_GATEWAY=['tmdb','omdb','malofficial','trakt','simkl','watchmode','animeschedule','metron','episodate','gutendex'];
const MF439_NET={last:new Map(),cache:new Map(),fail:new Map()};
const mf439Plain=(v,max=6000)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[m]||m)).replace(/\r/g,'').trim().slice(0,max);
const mf439StringList=(xs,n=35)=>[...new Set((Array.isArray(xs)?xs:[]).map(x=>mf439Plain(x,160)).filter(Boolean))].slice(0,n);
function mf439TitleVariants(item){
 return [...new Set([item?.title,item?.originalTitle,item?.titleEnglish,item?.titleRomaji,...(item?.universalMetadata?.fields?.alternateTitles||[])].map(x=>mf439Plain(x,220)).filter(Boolean))];
}
function mf439Norm(t){return mf439Plain(t,260).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function mf439Year(value){const x=Number(String(value||'').slice(0,4));return Number.isInteger(x)&&x>=1850&&x<=2150?x:0;}
function mf439Score(score,scale=10,votes=null){
 const n=Number(score),s=Number(scale),v=votes==null?null:Number(votes);
 return score!=null&&String(score).trim()!==''&&Number.isFinite(n)&&n>=0&&n<=s?
 {score:n,scale:s,votes:Number.isSafeInteger(v)&&v>=0?v:null}:null;
}
function mf439Entry(provider,id,title,other={}){
 return {provider,recordId:String(id??'').slice(0,110),title:mf439Plain(title,220),year:0,
  externalIds:{},fields:{},ratings:{},legacy:{},...other};
}
function mf439Url(base,params={}){
 const out=new URL(base);
 for(const [key,value] of Object.entries(params))if(value!=null&&value!=='')out.searchParams.set(key,String(value));
 return out.href;
}
async function mf439Fetch(provider,url,body,signal){
 if(!MF439_PUBLIC[provider])throw Error('Public metadata adapter not registered');
 // No arbitrary user-provided URL or host: only caller-owned fixed paths.
 const allowed={
  jikan:['api.jikan.moe'],anilist:['graphql.anilist.co'],
  kitsu:['kitsu.io'],tvmaze:['api.tvmaze.com'],
  openlibrary:['openlibrary.org'],gutendex:['gutendex.com'],
  itunes:['itunes.apple.com'],steam:['store.steampowered.com'],
  vndb:['api.vndb.org'],musicbrainz:['musicbrainz.org']
 };
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||!allowed[provider].includes(parsed.hostname))throw Error('Unapproved metadata endpoint');
 const existing=MF439_NET.fail.get(provider)||0;
 if(existing>Date.now())throw Error('Provider cooling down temporarily');
 const cacheKey=provider+':'+url+':'+JSON.stringify(body||{});
 const hit=MF439_NET.cache.get(cacheKey);
 if(hit&&hit.until>Date.now())return hit.data;
 const gap=MF439_PUBLIC[provider].minGap;
 const last=MF439_NET.last.get(provider)||0;
 if(Date.now()-last<gap)await new Promise(done=>setTimeout(done,gap-(Date.now()-last)));
 if(signal?.aborted)throw Error('Metadata request cancelled');
 MF439_NET.last.set(provider,Date.now());
 const controller=new AbortController();
 const abort=()=>controller.abort();
 signal?.addEventListener?.('abort',abort,{once:true});
 const timer=setTimeout(abort,14500);
 try{
  const result=await fetch(url,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,
   headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
   credentials:'omit',cache:'no-store',signal:controller.signal});
  if(result.status===429||result.status===503){const raw=result.headers.get('Retry-After')||'';
   const retry=Number(raw);
   MF439_NET.fail.set(provider,Date.now()+Math.min(300000,Math.max(30000,Number.isFinite(retry)&&retry>0?retry*1000:60000)));
   throw Error(provider+' is rate-limited; temporarily paused');
  }
  if(!result.ok)throw Error(provider+' HTTP '+result.status);
  const raw=await result.text();if(raw.length>1_800_000)throw Error('Metadata response too large');
  const data=JSON.parse(raw);
  if(MF439_NET.cache.size>220)MF439_NET.cache.delete(MF439_NET.cache.keys().next().value);
  MF439_NET.cache.set(cacheKey,{data,until:Date.now()+15*60000});
  return data;
 }finally{clearTimeout(timer);signal?.removeEventListener?.('abort',abort);}
}
async function mf439LookupPublic(provider,item,signal){
 const title=mf439TitleVariants(item)[0],ids=item.externalIds||{},rows=[];
 if(!title||title.length<2)return [];
 const pull=(obj)=>{if(obj&&obj.title&&obj.recordId)rows.push(obj);};
 if(provider==='jikan'){
  const mal=String(ids.mal||'').match(/^\d{1,12}$/)?.[0];
  for(const kind of ['anime','manga']){
   if(signal?.aborted)break;
   const url=mal?'https://api.jikan.moe/v4/'+kind+'/'+mal:mf439Url('https://api.jikan.moe/v4/'+kind,{q:title,limit:5,sfw:true});
   let d;try{d=await mf439Fetch(provider,url,null,signal);}catch(e){if(mal)continue;throw e;}
   const values=Array.isArray(d.data)?d.data:[d.data];
   for(const v of values.slice(0,5))if(v?.mal_id){
   const type=String(v.type||'').toLowerCase();
   const synopsis=mf439Plain(v.synopsis);
   pull(mf439Entry(provider,v.mal_id,v.title,{year:mf439Year(v.aired?.from||v.published?.from),
    aliases:mf439StringList([v.title_english,v.title_japanese,...(v.title_synonyms||[])]),
    externalIds:{mal:String(v.mal_id)},legacy:{synopsis,genres:mf439StringList(v.genres?.map(z=>z.name)),
     studios:mf439StringList(v.studios?.map(z=>z.name)),year:mf439Year(v.aired?.from||v.published?.from),mediaFormat:v.type||''},
    fields:{originalTitle:v.title_japanese||'',animeSeason:v.season?String(v.season):'',episodeCount:v.episodes||null,
      chapterCount:v.chapters||null,volumeCount:v.volumes||null,
      mangaAuthors:mf439StringList(v.authors?.map(z=>z.name))},
    ratings:{mal:mf439Score(v.score,10,v.scored_by)}}));
   }
  }
 }
 if(provider==='anilist'){
  const gql='query($s:String,$id:Int,$idMal:Int){Page(perPage:7){media(search:$s,id:$id,idMal:$idMal){id idMal title{romaji english native} synonyms description(asHtml:false) genres averageScore meanScore popularity episodes chapters volumes startDate{year month day} season seasonYear studios(isMain:true){nodes{name}} staff(perPage:12){nodes{name{full}}}}}}';
  const variables={s:title,id:Number(ids.anilist)||undefined,idMal:ids.anilist?undefined:(Number(ids.mal)||undefined)};
  const d=await mf439Fetch(provider,'https://graphql.anilist.co',{query:gql,variables},signal);
  for(const v of (d?.data?.Page?.media||[]).slice(0,7)){
   if(!v?.id)continue;
   const y=Number(v.startDate?.year)||0;
   pull(mf439Entry(provider,v.id,v.title?.romaji||v.title?.english||v.title?.native,{
    year:y,aliases:mf439StringList([v.title?.english,v.title?.native,...(v.synonyms||[])]),
    externalIds:{anilist:String(v.id),...(v.idMal?{mal:String(v.idMal)}:{})},
    legacy:{synopsis:mf439Plain(v.description),genres:mf439StringList(v.genres),studios:mf439StringList(v.studios?.nodes?.map(z=>z.name)),year:y},
    fields:{originalTitle:v.title?.native||'',alternateTitles:mf439StringList(v.synonyms),animeSeason:v.season?String(v.season)+' '+(v.seasonYear||''):'',
     episodeCount:v.episodes||null,chapterCount:v.chapters||null,volumeCount:v.volumes||null,creators:mf439StringList(v.staff?.nodes?.map(z=>z.name?.full))},
    ratings:{anilist:mf439Score(v.averageScore,100,null)}}));
  }
 }
 if(provider==='kitsu'){
  const url=mf439Url('https://kitsu.io/api/edge/anime',{ 'filter[text]':title,'page[limit]':6});
  const d=await mf439Fetch(provider,url,null,signal);
  for(const v of (d.data||[]).slice(0,6)){const a=v.attributes||{},y=mf439Year(a.startDate);
   pull(mf439Entry(provider,v.id,a.canonicalTitle||a.titles?.en||a.titles?.en_jp,{
    year:y,aliases:mf439StringList(Object.values(a.titles||{})),
    externalIds:{kitsu:String(v.id)},legacy:{synopsis:mf439Plain(a.synopsis),year:y,mediaFormat:a.subtype||''},
    fields:{originalTitle:a.titles?.ja_jp||'',episodeCount:a.episodeCount||null},
    ratings:{kitsu:mf439Score(a.averageRating,100,a.userCount)}}));
  }
 }
 if(provider==='tvmaze'){
  const stored=String(ids.tvmaze||'').match(/^\d+$/)?.[0];
  const url=stored?'https://api.tvmaze.com/shows/'+stored:mf439Url('https://api.tvmaze.com/search/shows',{q:title});
  const d=await mf439Fetch(provider,url,null,signal);
  for(const wrap of (Array.isArray(d)?d:[d]).slice(0,8)){
   const v=wrap.show||wrap;if(!v?.id)continue;
   pull(mf439Entry(provider,v.id,v.name,{year:mf439Year(v.premiered),
    externalIds:{tvmaze:String(v.id),...(v.externals?.imdb?{imdb:v.externals.imdb}:{})},
    legacy:{synopsis:mf439Plain(v.summary),genres:mf439StringList(v.genres),year:mf439Year(v.premiered),
     releaseDate:v.premiered||'',mediaFormat:v.type||'',ageRating:v.rating?.average==null?'':''},
    fields:{networks:mf439StringList([v.network?.name,v.webChannel?.name]),releaseStatus:v.status||'',originalLanguage:v.language||''},
    ratings:{tvmaze:mf439Score(v.rating?.average,10,null)}}));
  }
 }
 if(provider==='openlibrary'){
  const known=String(ids.openlibrary_work||ids.openlibrary||'');
  const match=known.match(/OL\d+W/i);
  const url=match?'https://openlibrary.org/works/'+match[0].toUpperCase()+'.json':
   mf439Url('https://openlibrary.org/search.json',{title,limit:6,fields:'key,title,first_publish_year,author_name,language,subject'});
  const d=await mf439Fetch(provider,url,null,signal);
  const list=Array.isArray(d.docs)?d.docs:[d];
  for(const v of list.slice(0,6)){
   const work=String(v.key||match?.[0]||'').match(/OL\d+W/i)?.[0];if(!work)continue;
   const names=mf439StringList(v.author_name);
   let desc=typeof v.description==='object'?v.description?.value:v.description;
   // Open Library search normally excludes synopsis. Fetch only the first
   // two exact-title works, never a whole search page of descriptions.
   if(!desc&&work&&rows.length<2&&mf439Norm(v.title)===mf439Norm(title)){
    try{
     const detail=await mf439Fetch(provider,'https://openlibrary.org/works/'+work+'.json',null,signal);
     desc=typeof detail?.description==='object'?detail.description.value:detail?.description;
    }catch(_){}
   }
   pull(mf439Entry(provider,work,v.title,{year:Number(v.first_publish_year)||0,
    externalIds:{openlibrary_work:work},
    legacy:{synopsis:mf439Plain(desc),year:Number(v.first_publish_year)||0,
     genres:mf439StringList(v.subject)},
    fields:{authors:names,originalLanguage:v.language?.[0]||'',keywords:mf439StringList(v.subject)}}));
  }
 }
 if(provider==='gutendex'){
  const d=await mf439Fetch(provider,mf439Url('https://gutendex.com/books',{search:title}),null,signal);
  for(const v of (d.results||[]).slice(0,6))if(v?.id){
   pull(mf439Entry(provider,v.id,v.title,{externalIds:{gutendex:String(v.id)},
    legacy:{genres:mf439StringList(v.subjects)},fields:{authors:mf439StringList(v.authors?.map(a=>a.name)),
     originalLanguage:v.languages?.[0]||''}}));
  }
 }
 if(provider==='itunes'){
  const d=await mf439Fetch(provider,mf439Url('https://itunes.apple.com/search',{term:title,entity:'album',limit:9}),null,signal);
  for(const v of (d.results||[]).slice(0,9))if(v?.collectionId){
   pull(mf439Entry(provider,v.collectionId,v.collectionName,{year:mf439Year(v.releaseDate),
    externalIds:{apple_music_album:String(v.collectionId)},
    fields:{albumArtists:mf439StringList([v.artistName]),trackCount:v.trackCount||null,
     recordLabels:mf439StringList([v.copyright]),releaseType:'Album'},
    legacy:{year:mf439Year(v.releaseDate),releaseDate:String(v.releaseDate||'').slice(0,10),genres:mf439StringList([v.primaryGenreName])}}));
  }
 }
 if(provider==='steam'){
  // Steam catalog listing is deliberately bounded: do not fetch all app IDs.
  const d=await mf439Fetch(provider,mf439Url('https://store.steampowered.com/api/storesearch/',{term:title,l:'english',cc:'us'}),null,signal);
  for(const v of (d.items||[]).slice(0,8))if(v?.id){
   pull(mf439Entry(provider,v.id,v.name,{externalIds:{steam_app:String(v.id)}}));
  }
 }
 if(provider==='vndb'){
  const valid=String(ids.vndb||'').match(/^v\d+$/i)?.[0];
  const query={filters:valid?['id','=',valid]:['search','=',title],
   fields:'title,alttitle,description,released,rating,votecount,platforms,length_minutes',results:7};
  const d=await mf439Fetch(provider,'https://api.vndb.org/kana/vn',query,signal);
  for(const v of (d.results||[]).slice(0,7))if(/^v\d+$/.test(v.id||'')){
   pull(mf439Entry(provider,v.id,v.title,{year:mf439Year(v.released),aliases:mf439StringList([v.alttitle]),
    externalIds:{vndb:v.id},legacy:{synopsis:mf439Plain(v.description),year:mf439Year(v.released),releaseDate:v.released||''},
    fields:{originalTitle:v.alttitle||'',ifPlatforms:mf439StringList(v.platforms),platforms:mf439StringList(v.platforms),
     mainStoryHours:Number.isFinite(Number(v.length_minutes))?Math.round(Number(v.length_minutes)/60*100)/100:null},
    ratings:{vndb:mf439Score(v.rating,100,v.votecount)}}));
  }
 }
 if(provider==='musicbrainz'){
  const d=await mf439Fetch(provider,mf439Url('https://musicbrainz.org/ws/2/release-group/',{query:'releasegroup:"'+title.replace(/"/g,'')+'"',fmt:'json',limit:7}),null,signal);
  for(const v of (d['release-groups']||[]).slice(0,7))if(v?.id){
   pull(mf439Entry(provider,v.id,v.title,{year:mf439Year(v['first-release-date']),
    externalIds:{musicbrainz_release_group:String(v.id)},
    fields:{albumArtists:mf439StringList(v['artist-credit']?.map(a=>a.artist?.name||a.name)),releaseType:v['primary-type']||''},
    legacy:{releaseDate:v['first-release-date']||'',year:mf439Year(v['first-release-date'])}}));
  }
 }
 return rows.filter(x=>x.title&&x.recordId).slice(0,10);
}
/* Existing live v437 gateway already returns metadata in a restricted
 * {verified,ids,fields,ratings:{value,scale}} shape. Normalize it to the v439
 * metadata contract WITHOUT replacing or weakening the deployed gateway. */
function mf439TranslateGateway(provider,record,item){
 if(record?.provider!==provider||record?.verified!==true||!record?.title)return null;
 const ids=record.ids&&typeof record.ids==='object'&&!Array.isArray(record.ids)?record.ids:{};
 const keys={tmdb:['tmdb','tmdb_tv'],omdb:['imdb'],malofficial:['mal'],trakt:['trakt'],
  simkl:['simkl'],watchmode:['watchmode'],animeschedule:['animeschedule'],
  metron:['metron_series'],episodate:['episodate'],gutendex:['gutendex']};
 const primary=(keys[provider]||[]).map(k=>ids[k]).find(Boolean);
 if(primary==null)return null;
 const raw=record.fields&&typeof record.fields==='object'?record.fields:{};
 const legacy={},fields={},ratings={};
 const legacyKeys=['synopsis','releaseDate','year','genres','themes','studios','producers',
  'durationMinutes','mediaFormat','ageRating'];
 for(const key of legacyKeys)if(raw[key]!==undefined)legacy[key]=raw[key];
 const universalKeys=['originalTitle','episodeCount','chapterCount','volumeCount','authors',
  'platforms','directors','cast','countries','budget'];
 for(const key of universalKeys)if(raw[key]!==undefined)fields[key]=raw[key];
 if(raw.language)fields.originalLanguage=raw.language;
 if(raw.network)fields.networks=Array.isArray(raw.network)?raw.network:[raw.network];
 if(raw.officialSite)fields.officialWebsite=raw.officialSite;
 if(raw.status)fields.releaseStatus=raw.status;
 if(raw.revenue)fields.boxOffice=String(raw.revenue);
 if(raw.publishers) {
  const type=item?.universalMetadata?.mediaType||'unspecified';
  if(type==='book')fields.bookPublishers=raw.publishers;
  if(type==='game')fields.gamePublishers=raw.publishers;
  if(type==='music')fields.recordLabels=raw.publishers;
 }
 if(raw.artists) {
  const type=item?.universalMetadata?.mediaType||'unspecified';
  if(type==='music')fields.albumArtists=raw.artists;
  if(type==='manga')fields.mangaArtists=raw.artists;
 }
 for(const [key,score] of Object.entries(record.ratings||{})){
  const source=key==='rottenTomatoes'?'rottentomatoes_critics':key;
  if(score?.value!=null&&Number.isFinite(Number(score.scale)))
   ratings[source]={score:Number(score.value),scale:Number(score.scale),votes:score.votes??null};
 }
 const aliases=Array.isArray(raw.alternateTitles)?raw.alternateTitles:[];
 return mf439Entry(provider,primary,record.title,{
  year:mf439Year(raw.year||raw.releaseDate),aliases:mf439StringList(aliases),
  externalIds:ids,fields,legacy,ratings});
}
async function mf439LookupGateway(provider,item){
 if(!MF439_GATEWAY.includes(provider))return [];
 if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway();
 const status=mf434ProviderStatus(provider);
 if(!status?.configured||!status?.testable)return [];
 const title=mf439TitleVariants(item)[0];
 const reply=await mf434Call('metadata',{provider,title,externalIds:item.externalIds||{},year:item.year||''});
 return (Array.isArray(reply?.results)?reply.results:[])
  .slice(0,8).map(row=>mf439TranslateGateway(provider,row,item)).filter(Boolean);
}
window.MediaFlowMetadataAdapters=Object.freeze({
 publicNames:Object.keys(MF439_PUBLIC),gatewayNames:MF439_GATEWAY.slice(),
 fetchPublic:mf439LookupPublic,fetchGateway:mf439LookupGateway
});
