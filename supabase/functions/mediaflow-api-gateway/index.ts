/* MediaFlow v434 personal edition: authenticated provider discovery gateway.
 * No user data writes, no credentials on the client, no arbitrary outbound URLs.
 * Providers awaiting legal/technical review are fail-closed. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
const ORIGIN="https://alexgodly.github.io";
const RULES={
tmdb:{env:"TMDB_API_TOKEN",mode:"cover",cap:120,perUser:30},
omdb:{env:"OMDB_API_KEY",mode:"cover",cap:70,perUser:20},
fanart:{env:"FANART_PROJECT_API_KEY",mode:"cover",cap:70,perUser:20},
animeschedule:{env:"ANIMESCHEDULE_APP_TOKEN",mode:"cover",cap:50,perUser:15},
malofficial:{env:"MAL_CLIENT_ID",mode:"cover",cap:70,perUser:20},
metron:{env:"METRON_API_TOKEN",mode:"mapping",cap:45,perUser:15},
trakt:{env:"TRAKT_CLIENT_ID",mode:"mapping",cap:45,perUser:15},
watchmode:{env:"WATCHMODE_API_KEY",mode:"mapping",cap:15,perUser:4},
episodate:{env:"",mode:"cover",cap:80,perUser:20},
gutendex:{env:"",mode:"cover",cap:80,perUser:20},
hardcover:{env:"HARDCOVER_API_TOKEN",mode:"review",cap:0,perUser:0}
} as const;
type Provider=keyof typeof RULES;
type IdMap=Record<string,string>;
const KEY=(k:string)=>String(Deno.env.get(k)||"").trim();
const IMAGES=["image.tmdb.org","assets.fanart.tv","fanart.tv","m.media-amazon.com",
"images-na.ssl-images-amazon.com","cdn.myanimelist.net","myanimelist.net",
"img.animeschedule.net","static.episodate.com","www.episodate.com",
"episodate.com","www.gutenberg.org","gutenberg.org"];
const mem=new Map<string,{until:number,results:unknown[]}>();
const pauses=new Map<string,number>();
const text=(v:unknown,max=180)=>typeof v==="string"?v.trim().slice(0,max):
 typeof v==="number"&&Number.isFinite(v)?String(v):"";
const norm=(v:string)=>v.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
const safeUrl=(v:unknown)=>{try{const u=new URL(text(v,1500));return u.protocol==="https:"?u.href:"";}catch(_){return "";}};
const cover=(v:unknown)=>{const u=safeUrl(v);try{return u&&IMAGES.includes(new URL(u).hostname)?u:"";}catch(_){return "";}};
const yr=(v:unknown)=>{const n=Number(text(v,20).slice(0,4));return Number.isInteger(n)&&n>=1850&&n<2150?n:0;};
const list=(v:any)=>Array.isArray(v)?v:Array.isArray(v?.results)?v.results:
 Array.isArray(v?.data)?v.data:Array.isArray(v?.items)?v.items:[];
async function read(p:string,url:string,headers:Record<string,string>={},body?:unknown){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),8500);
 try{const r=await fetch(url,{method:body?"POST":"GET",headers:{"Accept":"application/json",...headers,...(body?{"Content-Type":"application/json"}:{})},
  body:body?JSON.stringify(body):undefined,redirect:"error",signal:c.signal});
 const s=await r.text();if(s.length>1100000)throw Error("Provider payload too large");
 let data:any;try{data=JSON.parse(s);}catch(_){throw Error(p+" returned an invalid JSON response");}
 if(p==="omdb"&&String(data?.Response).toLowerCase()==="false"){
  const reason=String(data?.Error||"").toLowerCase();
  if(/invalid api key|no api key|not activated|not verified/.test(reason))
   throw Error("OMDb API key rejected. Check email activation and the OMDB_API_KEY Supabase secret.");
  if(/daily request limit|request limit|rate limit|quota/.test(reason))
   throw Error("OMDb API daily request limit reached. Please retry after the quota resets.");
  if(!/movie not found|series not found|episode not found|incorrect imdb id/.test(reason))
   throw Error("OMDb returned a provider-side error. Verify the API account.");
 }
 if(!r.ok)throw Error(p+" returned HTTP "+r.status);
 return data;
 }finally{clearTimeout(timer);}
}
function record(p:Provider,title:string,ids:IdMap,year:number,v:{
 id:unknown;name:unknown;image?:unknown;link?:unknown;year?:unknown;key:string;other?:Record<string,unknown>}){
 const name=text(v.name,220),recordId=text(v.id,120),url=cover(v.image),when=yr(v.year);
 if(!name||!recordId)return null;
 const matched=norm(name)===norm(title);
 const direct=Boolean(ids[v.key]&&ids[v.key]===recordId);
 if(!matched&&!direct)return null;
 const confidence=direct?(matched?.99:.84):year&&when&&year===when?.96:year&&when&&year!==when?.35:.7;
 const externalIdCandidates: {key:string;value:string;evidence:string;source:string}[]=[];
 const add=(key:string,input:unknown)=>{const value=text(input,120);
  if(!/^[a-z][a-z0-9_]{0,32}$/.test(key)||!value||!/^[A-Za-z0-9_.:-]+$/.test(value))return;
  if(key==="imdb"&&!/^tt\d{7,12}$/i.test(value))return;
  if(!externalIdCandidates.some(x=>x.key===key))externalIdCandidates.push({key,value,evidence:"Provider record",source:p});
 };
 add(v.key,recordId);for(const [k,x] of Object.entries(v.other||{}))add(k,x);
 return {provider:p,recordId,recordUrl:safeUrl(v.link),title:name,url,year:when,
  idMatch:direct,confidence,reason:direct?"Saved ID matched":year&&when&&year!==when?"Year conflict; manual review":"Provider title match",
  externalIdKey:v.key,externalIdValue:recordId,externalIdCandidates};
}
async function discover(p:Provider,title:string,ids:IdMap,year:number){
 const rows:any[]=[],secret=RULES[p].env?KEY(RULES[p].env):"";
 if(RULES[p].env&&!secret)throw Error("Provider not configured");
 const add=(v:Parameters<typeof record>[4])=>{const x=record(p,title,ids,year,v);if(x)rows.push(x);};
 if(p==="tmdb"){
  for(const type of ["movie","tv"]){
   const id=type==="movie"?ids.tmdb:ids.tmdb_tv;
   const endpoint=/^[1-9]\d*$/.test(id||"")?type+"/"+id:"search/"+type+"?query="+encodeURIComponent(title)+"&include_adult=false";
   const d=await read(p,"https://api.themoviedb.org/3/"+endpoint,{"Authorization":"Bearer "+secret});
   for(const r of (endpoint.startsWith("search/")?list(d):[d]).slice(0,8))
    add({id:r.id,name:r.title||r.name,year:r.release_date||r.first_air_date,key:type==="movie"?"tmdb":"tmdb_tv",
     image:r.poster_path?"https://image.tmdb.org/t/p/w500"+r.poster_path:"",
     link:"https://www.themoviedb.org/"+type+"/"+r.id});
  }
 }
 if(p==="omdb"){
  const q=new URL("https://www.omdbapi.com/");q.searchParams.set("apikey",secret);
  const known=/^tt\d{7,12}$/i.test(ids.imdb||"");
  if(known)q.searchParams.set("i",ids.imdb);
  else q.searchParams.set("s",title);
  const d=await read(p,q.href);
  const append=(payload:any)=>{for(const r of (Array.isArray(payload?.Search)?payload.Search:[payload]).slice(0,8))
    if(r?.imdbID)add({id:r.imdbID,name:r.Title,image:r.Poster,
     link:"https://www.imdb.com/title/"+r.imdbID+"/",year:r.Year,key:"imdb"});};
  append(d);
  // OMDb's 's' search and 't' direct-title endpoints can return different
  // matches. Only spend an additional request if search found no exact title.
  if(!known&&!rows.length){
   q.searchParams.delete("s");q.searchParams.set("t",title);
   const direct=await read(p,q.href);
   append(direct);
  }
 }
 if(p==="fanart"){
  const type=/^[1-9]\d*$/.test(ids.tmdb||"")?"movies":/^[1-9]\d*$/.test(ids.tvdb_series||"")?"tv":"";
  const id=type==="movies"?ids.tmdb:ids.tvdb_series;
  if(type&&id){const d=await read(p,"https://webservice.fanart.tv/v3.2/"+type+"/"+id,{"api-key":secret});
   for(const r of [...(d?.movieposter||[]),...(d?.tvposter||[])].slice(0,12))
    add({id,name:title,year,key:type==="movies"?"tmdb":"tvdb_series",image:r.url,
     link:type==="movies"?"https://www.themoviedb.org/movie/"+id:"https://thetvdb.com/"});
  }
 }
 if(p==="malofficial"){
  for(const kind of ["anime","manga"]){
   const q=new URL("https://api.myanimelist.net/v2/"+kind);
   q.searchParams.set("q",title);q.searchParams.set("limit","8");
   q.searchParams.set("fields",kind==="anime"?"main_picture,start_season":"main_picture,start_date");
   const d=await read(p,q.href,{"X-MAL-CLIENT-ID":secret});
   for(const item of list(d)){const n=item.node||item;
    add({id:n.id,name:n.title,image:n.main_picture?.large||n.main_picture?.medium,
     year:n.start_season?.year||n.start_date,link:"https://myanimelist.net/"+kind+"/"+n.id,key:"mal"});}
  }
 }
 if(p==="animeschedule"){
  const q=new URL("https://animeschedule.net/api/v3/anime");q.searchParams.set("q",title);
  const d=await read(p,q.href,{"Authorization":"Bearer "+secret});
  const a=Array.isArray(d)?d:Array.isArray(d?.anime)?d.anime:list(d);
  for(const row of a.slice(0,12)){const n=row.anime||row,site=n.websites||{};
   const extract=(x:any,re:RegExp)=>text(x,300).match(re)?.[1]||"";
   add({id:n.id||n.route,name:n.title||n.preferredTitle,year:n.year,
    image:n.imageVersionRoute?"https://img.animeschedule.net/production/assets/public/img/"+n.imageVersionRoute:"",
    link:"https://animeschedule.net/anime/"+n.route,key:"animeschedule",
    other:{mal:extract(site.mal,/\/anime\/(\d+)/),anilist:extract(site.aniList,/\/anime\/(\d+)/),
      anidb:extract(site.anidb,/\/anime\/(\d+)/),kitsu:extract(site.kitsu,/\/anime\/(\d+)/)}});
  }
 }
 if(p==="episodate"){
  const d=await read(p,"https://www.episodate.com/api/search?q="+encodeURIComponent(title)+"&page=1");
  for(const r of (d?.tv_shows||[]).slice(0,8))
   add({id:r.id,name:r.name,image:r.image_thumbnail_path,year:r.start_date,
    link:r.permalink?"https://www.episodate.com/tv-show/"+r.permalink:"",key:"episodate"});
 }
 if(p==="gutendex"){
  const d=await read(p,"https://gutendex.com/books?search="+encodeURIComponent(title));
  for(const r of list(d).slice(0,8))
   add({id:r.id,name:r.title,image:r.formats?.["image/jpeg"]||r.formats?.["image/png"],
    link:"https://www.gutenberg.org/ebooks/"+r.id,key:"gutendex"});
 }
 if(p==="metron"){
  const d=await read(p,"https://metron.cloud/api/series/?name="+encodeURIComponent(title),{"Authorization":"Bearer "+secret});
  for(const r of list(d).slice(0,8))
   add({id:r.id,name:r.name||r.title,year:r.year_began,image:"",link:"https://metron.cloud/series/"+r.id+"/",
    key:"metron_series",other:{gcd_series:r.gcd_id,comicvine_volume:r.cv_id}});
 }
 if(p==="trakt"){
  const d=await read(p,"https://api.trakt.tv/search/movie,show?query="+encodeURIComponent(title)+"&limit=8",
   {"trakt-api-key":secret,"trakt-api-version":"2"});
  for(const r of list(d).slice(0,8)){const n=r.movie||r.show||{};
   add({id:n.ids?.trakt,name:n.title,year:n.year,link:"https://trakt.tv/"+(r.type==="show"?"shows/":"movies/")+n.ids?.slug,key:"trakt",
     other:{imdb:n.ids?.imdb,...(r.type==="show"?{tmdb_tv:n.ids?.tmdb}:{tmdb:n.ids?.tmdb}),tvdb_series:n.ids?.tvdb}});}
 }
 if(p==="watchmode"){
  const q=new URL("https://api.watchmode.com/v1/search/");
  q.searchParams.set("search_field",/^tt\d{7,12}$/i.test(ids.imdb||"")?"imdb_id":"name");
  q.searchParams.set("search_value",/^tt\d{7,12}$/i.test(ids.imdb||"")?ids.imdb:title);
  const d=await read(p,q.href,{"X-API-Key":secret});
  for(const r of (d?.title_results||[]).slice(0,8))
   add({id:r.id,name:r.name,year:r.year,key:"watchmode",other:{imdb:r.imdb_id,
    ...(r.tmdb_type==="tv"?{tmdb_tv:r.tmdb_id}:{tmdb:r.tmdb_id})}});
 }
 return rows.slice(0,24);
}

/* v439 Metadata Recovery: read-only, authenticated, source-verified records.
 * Preserve v434 provider search and quotas; no arbitrary endpoints or writes.
 * Only enabled/configured services are accepted; metadata payloads contain
 * no user Library fields and no API keys. */
const clean=(v:unknown,max=6000)=>text(v,max).replace(/<[^>]*>/g," ").replace(/&(?:amp|lt|gt|quot|#39);/g,m=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"}[m]||m)).trim();
const score=(value:unknown,scale:number,votes:unknown=null)=>{
 const n=Number(value),q=Number(votes);
 return value!==null&&value!==undefined&&String(value).trim()!==""&&Number.isFinite(n)&&n>=0&&n<=scale?
 {score:n,scale,votes:Number.isSafeInteger(q)&&q>=0?q:null}:null;
};
function makeMetadata(p:Provider,id:unknown,name:unknown,extra:Record<string,unknown>={}){
 const title=clean(name,220),recordId=text(id,100);
 if(!title||!recordId)return null;
 return {provider:p,recordId,title,year:0,aliases:[],externalIds:{},legacy:{},fields:{},ratings:{},...extra};
}
async function discoverMetadata(p:Provider,title:string,ids:IdMap,year:number){
 const rows:any[]=[];
 const add=(value:unknown)=>{if(value)rows.push(value);};
 const secret=RULES[p].env?KEY(RULES[p].env):"";
 if(!secret&&RULES[p].env)throw Error("Provider not configured");
 if(p==="tmdb"){
  for(const type of ["movie","tv"]){
   const existing=/^[1-9]\d*$/.test(ids[type==="movie"?"tmdb":"tmdb_tv"]||"")?
    ids[type==="movie"?"tmdb":"tmdb_tv"]:"";
   const endpoint=existing?type+"/"+existing:"search/"+type+"?query="+encodeURIComponent(title)+"&include_adult=false";
   const result=await read(p,"https://api.themoviedb.org/3/"+endpoint,{"Authorization":"Bearer "+secret});
   const candidates=(existing?[result]:list(result)).slice(0,7);
   for(const r of candidates){
    if(!r?.id)continue;
    const name=clean(r.title||r.name,220);
    if(norm(name)!==norm(title)&&String(r.id)!==existing)continue;
    const key=type==="movie"?"tmdb":"tmdb_tv";
    const y=yr(r.release_date||r.first_air_date);
    const date=text(r.release_date||r.first_air_date,10);
    let detail=r;
    // Detail is essential for credited creators, genres and runtime, but
    // only fetch for a verified exact title or an explicit saved provider ID.
    try{detail=await read(p,"https://api.themoviedb.org/3/"+type+"/"+encodeURIComponent(String(r.id)),
      {"Authorization":"Bearer "+secret});}catch(_){}
    const vote=score(detail.vote_average??r.vote_average,10,detail.vote_count??r.vote_count);
    const genres=(Array.isArray(detail.genres)?detail.genres:[]).map((x:any)=>clean(x.name,120)).filter(Boolean).slice(0,40);
    add(makeMetadata(p,r.id,name,{
     year:y,externalIds:{[key]:String(r.id)},
     legacy:{synopsis:clean(detail.overview||r.overview),genres,year:y,releaseDate:date,
      durationMinutes:detail.runtime||null,mediaFormat:type==="movie"?"Movie":"TV"},
     fields:{originalLanguage:clean(detail.original_language||r.original_language,20),
      originalTitle:clean(detail.original_title||detail.original_name||r.original_title||r.original_name,220),
      tvCreators:((detail.created_by||[]) as any[]).map(x=>clean(x.name,150)).filter(Boolean),
      networks:((detail.networks||[]) as any[]).map(x=>clean(x.name,150)).filter(Boolean),
      releaseStatus:clean(detail.status,120)},
     ratings:vote?{tmdb:vote}:{}
    }));
   }
  }
 }
 if(p==="omdb"){
  const existing=/^tt\d{7,12}$/i.test(ids.imdb||"")?ids.imdb:"";
  const url=new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey",secret);
  if(existing)url.searchParams.set("i",existing);
  else url.searchParams.set("t",title);
  const d=await read(p,url.href);
  if(d?.Response==="True"&&d.imdbID&&(norm(d.Title)===norm(title)||d.imdbID===existing)){
   const y=yr(d.Year),genres=clean(d.Genre,400).split(",").map(x=>x.trim()).filter(Boolean);
   const ratings:any={},imdb=score(d.imdbRating,10,d.imdbVotes?Number(String(d.imdbVotes).replace(/,/g,"")):null);
   if(imdb)ratings.imdb=imdb;
   const rotten=(d.Ratings||[]).find((x:any)=>/Rotten Tomatoes/i.test(x.Source));
   if(rotten?.Value&&/^\d+%$/.test(rotten.Value))ratings.rottentomatoes_critics=score(Number(rotten.Value.slice(0,-1)),100);
   if(/^\d+$/.test(d.Metascore||""))ratings.metacritic=score(Number(d.Metascore),100);
   add(makeMetadata(p,d.imdbID,d.Title,{year:y,externalIds:{imdb:d.imdbID},
    legacy:{synopsis:clean(d.Plot),genres,year:y,releaseDate:text(d.Released,40),
      durationMinutes:Number(String(d.Runtime||"").match(/\d+/)?.[0])||null,ageRating:clean(d.Rated,80)},
    fields:{directors:clean(d.Director,400).split(",").map((x:string)=>x.trim()).filter(Boolean),
      screenwriters:clean(d.Writer,400).split(",").map((x:string)=>x.trim()).filter(Boolean),
      cast:clean(d.Actors,600).split(",").map((x:string)=>x.trim()).filter(Boolean)},
    ratings
   }));
  }
 }
 if(p==="malofficial"){
  // Supports anime metadata with existing MAL client ID. No OAuth user token.
  const existing=/^\d{1,12}$/.test(ids.mal||"")?ids.mal:"";
  const sources=existing?[{node:{id:Number(existing),title}}]:
   list(await read(p,"https://api.myanimelist.net/v2/anime?q="+encodeURIComponent(title)+"&limit=6",
    {"X-MAL-CLIENT-ID":secret}));
  for(const source of sources.slice(0,6)){
   const n=source.node||source;
   if(!n?.id||(norm(n.title)!==norm(title)&&String(n.id)!==existing))continue;
   try{
    const details=await read(p,"https://api.myanimelist.net/v2/anime/"+n.id+
      "?fields=id,title,alternative_titles,start_date,synopsis,mean,num_scoring_users,genres,media_type,num_episodes,studios",
      {"X-MAL-CLIENT-ID":secret});
    if(!details?.id)continue;
    const y=yr(details.start_date);
    const rating=score(details.mean,10,details.num_scoring_users);
    add(makeMetadata(p,details.id,details.title,{year:y,
     aliases:[details.alternative_titles?.en,details.alternative_titles?.ja].filter(Boolean),
     externalIds:{mal:String(details.id)},
     legacy:{synopsis:clean(details.synopsis),genres:((details.genres||[]) as any[]).map(x=>clean(x.name,120)).filter(Boolean),
      studios:((details.studios||[]) as any[]).map(x=>clean(x.name,120)).filter(Boolean),
      year:y,releaseDate:text(details.start_date,10),mediaFormat:clean(details.media_type,60)},
     fields:{originalTitle:clean(details.alternative_titles?.ja,200),
      episodeCount:Number(details.num_episodes)||null},
     ratings:rating?{mal:rating}:{}
    }));
   }catch(_){}
  }
 }
 return rows.slice(0,12);
}
function cors(origin:string){const h:Record<string,string>={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
 if(origin===ORIGIN)Object.assign(h,{"Access-Control-Allow-Origin":ORIGIN,
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"});
 return h;}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"",h=cors(origin);
 const reply=(code:number,body:unknown)=>new Response(JSON.stringify(body),{status:code,headers:h});
 if(origin&&origin!==ORIGIN)return reply(403,{error:"Invalid origin"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(req.method!=="POST")return reply(405,{error:"POST required"});
 if(Number(req.headers.get("content-length")||0)>12000)return reply(413,{error:"Request too large"});
 const jwt=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!jwt)return reply(401,{error:"Please sign in to MediaFlow"});
 const url=KEY("SUPABASE_URL"),pub=KEY("SUPABASE_ANON_KEY")||KEY("SUPABASE_PUBLISHABLE_KEY"),
  service=KEY("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!pub||!service)return reply(503,{error:"Gateway environment unavailable"});
 const auth=createClient(url,pub,{auth:{autoRefreshToken:false,persistSession:false}});
 const verified=await auth.auth.getUser(jwt);
 if(verified.error||!verified.data?.user?.id)return reply(401,{error:"Invalid account session"});
 let data:any;
 try{data=await req.json();if(!data||typeof data!=="object"||Array.isArray(data))throw Error();}
 catch(_){return reply(400,{error:"Invalid JSON request"});}
 if(data.action==="status")return reply(200,{version:439,ready:true,metadataProviders:["tmdb","omdb","malofficial"],
  providers:Object.entries(RULES).map(([id,r])=>({id,configured:!r.env||Boolean(KEY(r.env)),
   mode:r.mode,testable:r.mode!=="review"}))});
 if(data.action!=="search"&&data.action!=="metadata")return reply(400,{error:"Invalid action"});
 if(data.action==="metadata"&&!["tmdb","omdb","malofficial"].includes(text(data.provider,25)))
  return reply(403,{error:"Metadata adapter not approved for this gateway provider"});
 const p=text(data.provider,25) as Provider;
 if(!Object.prototype.hasOwnProperty.call(RULES,p))return reply(400,{error:"Unknown provider"});
 const rule=RULES[p];
 if(rule.mode==="review")return reply(403,{error:"Provider API contract review pending"});
 if(rule.env&&!KEY(rule.env))return reply(503,{error:"Provider credential missing"});
 const title=text(data.title,120);
 if(title.length<2||title.length>110)return reply(400,{error:"Invalid title length"});
 const ids:IdMap={};
 if(data.externalIds&&typeof data.externalIds==="object"&&!Array.isArray(data.externalIds))
  for(const [k,v] of Object.entries(data.externalIds).slice(0,24)){
   const value=text(v,130);
   if(/^[a-z][a-z0-9_]{0,32}$/.test(k)&&/^[\w.:-]{1,120}$/.test(value))ids[k]=value;
  }
 const year=yr(data.year),account=verified.data.user.id;
 const cacheKey=account+":"+data.action+":"+p+":"+norm(title)+":"+JSON.stringify(ids)+":"+year;
 const cached=mem.get(cacheKey);
 if(cached&&cached.until>Date.now())return reply(200,{provider:p,results:cached.results,cached:true});
 const throttle=account+":"+p;
 if((pauses.get(throttle)||0)>Date.now())return reply(429,{error:"Please wait ten seconds before requesting this source"});
 pauses.set(throttle,Date.now()+10000);
 try{
  const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const claim=await admin.rpc("mediaflow_gateway_claim",
   {p_user:account,p_provider:p,p_global_max:rule.cap,p_user_max:rule.perUser});
  if(claim.error)return reply(503,{error:"Gateway quota database is unavailable"});
  if(claim.data!==true)return reply(429,{error:"Safe daily provider quota reached"});
  const results=data.action==="metadata"?await discoverMetadata(p,title,ids,year):await discover(p,title,ids,year);
  if(mem.size>300)mem.delete(mem.keys().next().value as string);
  mem.set(cacheKey,{until:Date.now()+1200000,results});
  return reply(200,{provider:p,results,cached:false});
 }catch(e){
  const msg=String((e as Error)?.message||"");
  return reply(502,{error:msg.startsWith("OMDb ")?msg:/^[a-z]+ returned HTTP \d{3}$/.test(msg)?msg:"Provider request failed or returned an unexpected response"});
 }
});
