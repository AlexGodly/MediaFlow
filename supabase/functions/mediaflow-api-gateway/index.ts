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
 if(!r.ok)throw Error(p+" returned HTTP "+r.status);
 const s=await r.text();if(s.length>1100000)throw Error("Provider payload too large");
 return JSON.parse(s);
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
  if(/^tt\d{7,12}$/i.test(ids.imdb||""))q.searchParams.set("i",ids.imdb);
  else q.searchParams.set("s",title);
  const d=await read(p,q.href);
  for(const r of (Array.isArray(d.Search)?d.Search:[d]).slice(0,8))
   if(r?.imdbID)add({id:r.imdbID,name:r.Title,image:r.Poster,link:"https://www.imdb.com/title/"+r.imdbID+"/",year:r.Year,key:"imdb"});
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
   add({id:r.id,name:r.name||r.title,year:r.year_began,url:"",link:"https://metron.cloud/series/"+r.id+"/",
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
 if(data.action==="status")return reply(200,{version:434,ready:true,
  providers:Object.entries(RULES).map(([id,r])=>({id,configured:!r.env||Boolean(KEY(r.env)),
   mode:r.mode,testable:r.mode!=="review"}))});
 if(data.action!=="search")return reply(400,{error:"Invalid action"});
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
 const cacheKey=account+":"+p+":"+norm(title)+":"+JSON.stringify(ids)+":"+year;
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
  const results=await discover(p,title,ids,year);
  if(mem.size>300)mem.delete(mem.keys().next().value as string);
  mem.set(cacheKey,{until:Date.now()+1200000,results});
  return reply(200,{provider:p,results,cached:false});
 }catch(e){
  const msg=String((e as Error)?.message||"");
  return reply(502,{error:/^[a-z]+ returned HTTP \d{3}$/.test(msg)?msg:"Provider request failed or returned an unexpected response"});
 }
});
