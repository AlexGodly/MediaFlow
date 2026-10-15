/* v429: Public-provider reachability + browser-origin CORS snapshot.
   Diagnostic only: third-party outages never change Library data or CI correctness.
   No private account, credentials, API keys or Supabase requests. */
'use strict';
const fs=require('node:fs');
const origin='https://alexgodly.github.io';
const checks=[
 {name:'Tenrai',features:['covers','metadata'],url:'https://api.tenrai.org/v1/anime/1/full'},
 {name:'Jikan',features:['covers','metadata','legacy-anime'],url:'https://api.jikan.moe/v4/anime/1/full'},
 {name:'AniList',features:['covers','metadata','legacy-anime'],url:'https://graphql.anilist.co',method:'POST',body:JSON.stringify({query:'query { Media(id:1,type:ANIME) { id } }'})},
 {name:'Kitsu',features:['covers','metadata'],url:'https://kitsu.io/api/edge/anime/1'},
 {name:'TVmaze',features:['covers','metadata','fresh'],url:'https://api.tvmaze.com/shows/1'},
 {name:'MangaDex',features:['covers','metadata','fresh'],url:'https://api.mangadex.org/manga?limit=1'},
 {name:'Open Library',features:['covers','metadata'],url:'https://openlibrary.org/works/OL45804W.json'},
 {name:'EpisoDate',features:['fresh'],url:'https://www.episodate.com/api/search?q=Breaking%20Bad'}
];
async function probe(x){
 const controller=new AbortController(),clock=setTimeout(()=>controller.abort(),12000);
 try{
  const res=await fetch(x.url,{method:x.method||'GET',body:x.body||undefined,headers:{Origin:origin,Accept:x.name==='Kitsu'?'application/vnd.api+json':'application/json',...(x.body?{'Content-Type':'application/json'}:{})},signal:controller.signal});
  const acao=res.headers.get('access-control-allow-origin')||'';
  const browserCors=acao==='*'||acao===origin;
  let parsed=false;
  try{const body=await res.json();parsed=Boolean(body&&typeof body==='object');}catch(_){}
  return {name:x.name,features:x.features,httpStatus:res.status,browserCors,originHeader:acao||null,json:parsed,available:res.ok&&parsed,usableDirectlyFromBrowser:res.ok&&parsed&&browserCors};
 }catch(e){return {name:x.name,features:x.features,available:false,usableDirectlyFromBrowser:false,error:String(e?.name||'Error')+': '+String(e?.message||e).slice(0,180)};}
 finally{clearTimeout(clock);}
}
(async()=>{
 const results=await Promise.all(checks.map(probe)),folder='artifacts/v429-provider-probe';
 fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(folder+'/results.json',JSON.stringify({origin,generatedAt:new Date().toISOString(),note:'Single observed network snapshot; not a guarantee of availability or valid cross-origin preflight.',results},null,2)+'\n');
 for(const row of results)console.log((row.usableDirectlyFromBrowser?'PASS':'UNKNOWN')+' '+row.name+' HTTP '+(row.httpStatus||'network error')+' CORS '+(row.originHeader||'missing')+(row.error?' '+row.error:''));
 console.log('Live public provider diagnostic written to '+folder+'/results.json; diagnostic is non-blocking.');
})().catch(e=>{console.error(e);process.exitCode=1;});
