/* v555 gateway: runs supabase/functions/mediaflow-api-gateway/index.ts under
 * Node (types stripped, Deno/Supabase stubbed) and checks the v555 changes:
 * larger daily limits within the quota function's new bounds, short
 * per-source spacing, loose search for the manual ID finder only, and
 * unchanged strict matching for automatic metadata. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'supabase/functions/mediaflow-api-gateway/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20261102_v555_gateway_quota_limits.sql'),'utf8');
// Quota bounds in the migration must admit every limit the gateway requests.
const maxUser=Number(migration.match(/p_user_max>(\d+)/)[1]),maxGlobal=Number(migration.match(/p_global_max>(\d+)/)[1]);
for(const m of src.matchAll(/(\w+):\{env:"[^"]*",mode:"(\w+)",cap:(\d+),perUser:(\d+),gap:(\d+)\}/g)){
  const [,id,mode,cap,per,gap]=m;
  if(mode==='review')continue;
  assert(Number(cap)<=maxGlobal&&Number(per)<=maxUser,id+' limits exceed the quota function bounds');
  assert(Number(gap)>=1000,id+' spacing must stay at least one second');
}
assert(/omdb:\{[^}]*cap:(\d+)/.exec(src)[1]<=1000,'OMDb stays under its 1,000/day free tier');
const body=src.replace(/^import .*$/gm,'');
const harness=`
const createClient=(url,key)=>({auth:{getUser:async jwt=>jwt==='good'?{data:{user:{id:'u1'}}}:{error:{message:'bad'}}},
  rpc:async(name,args)=>{globalThis.__claims.push(args);return {data:true,error:null};}});
globalThis.__claims=[];
let handler;
globalThis.Deno={env:{get:k=>({SUPABASE_URL:'https://x.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',OMDB_API_KEY:'k',TMDB_API_TOKEN:'t'})[k]},serve:h=>{handler=h;}};
globalThis.fetch=async url=>{
  const u=String(url);
  if(u.includes('omdbapi.com')&&u.includes('s=Fright'))return new Response(JSON.stringify({Search:[
    {imdbID:'tt0089175',Title:'Fright Night',Year:'1985',Poster:'N/A'},
    {imdbID:'tt0093036',Title:'Fright Night Part 2',Year:'1988',Poster:'N/A'}]}));
  return new Response(JSON.stringify({Response:'False',Error:'Movie not found!'}));
};
${body}
const call=async payload=>{const r=await handler(new Request('https://x/functions/v1/g',{method:'POST',
  headers:{Authorization:'Bearer good',origin:'https://alexgodly.github.io','content-type':'application/json'},body:JSON.stringify(payload)}));
  return {status:r.status,json:await r.json()};};
const out={};
out.status=await call({action:'status'});
out.strict=await call({action:'search',provider:'omdb',title:'Fright Night'});
out.tooSoon=await call({action:'search',provider:'omdb',title:'Fright Night',loose:true});
await new Promise(r=>setTimeout(r,1100));
out.loose=await call({action:'search',provider:'omdb',title:'Fright Night',loose:true});
await new Promise(r=>setTimeout(r,1100));
out.meta=await call({action:'metadata',provider:'omdb',title:'Fright Night',loose:true});
out.claims=globalThis.__claims;
console.log(JSON.stringify(out));
`;
const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'mf555gw-')),'gateway.mts');
fs.writeFileSync(file,harness);
const run=spawnSync(process.execPath,['--experimental-strip-types','--no-warnings',file],{encoding:'utf8',timeout:60000});
assert.equal(run.status,0,run.stderr);
const out=JSON.parse(run.stdout.trim().split('\n').pop());
assert(out.status.json.version>=555,'status reports v555 or newer');
assert.deepEqual(out.strict.json.results.map(r=>r.recordId),['tt0089175'],'automatic search stays exact');
assert.equal(out.tooSoon.status,429,'per-source spacing still enforced');
assert.match(out.tooSoon.json.error,/wait 1 seconds/,'spacing is now about a second');
const loose=out.loose.json.results;
assert.deepEqual(loose.map(r=>r.recordId).sort(),['tt0089175','tt0093036'],'ID finder gets close matches');
assert.equal(loose.find(r=>r.recordId==='tt0093036').exact,false,'close matches are flagged');
assert.equal(out.meta.status,200);
assert(out.claims.every(c=>c.p_user_max<=maxUser&&c.p_global_max<=maxGlobal),'claims within quota bounds');
assert.equal(out.claims.find(c=>c.p_provider==='omdb').p_user_max,950,'OMDb daily limit raised');
console.log('PASS v555 gateway: limits within quota bounds, ~1s spacing, loose search only for the ID finder, strict automatic matching.');
