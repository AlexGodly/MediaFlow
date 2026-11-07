/* v559 release contract: TMDB covers on for Find cover automatically and
 * recovery. Runs the gateway's TMDB discovery against a mocked TMDB API and the
 * client module against stubbed app functions. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=559,'VERSION must be v559 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/402-v559-tmdb-covers.js')>runtime.indexOf('components/401-v558-theme-polish.js'),'v559 module loads after v558');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
assert(fs.existsSync(path.join(root,'docs/release-v559.md')),'release notes present');
if(version===559){
  const wf=read('.github/workflows/publish-v559.yml');
  assert(wf.includes('test "$(cat VERSION)" = 559')&&wf.includes('legacy/v/559')&&wf.includes('gh release create 559'),'release workflow archives and releases v559');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v559"'),'deploy runs after the v559 release');

// --- Gateway: TMDB discovery against a mocked API ---------------------------
let gw=read('supabase/functions/mediaflow-api-gateway/index.ts');
assert(/version:(\d+),ready/.test(gw)&&Number(gw.match(/version:(\d+),ready/)[1])>=559,'gateway reports v559+');
gw=gw.replace(/^import .*$/mg,'').replace(/Deno\.serve\([\s\S]*$/,'export {discover};');
const harness=`const Deno={env:{get:(k:string)=>k==="TMDB_API_TOKEN"?"tok":""}};const createClient:any=null;
${gw}
const db:any={'movie/1271':{id:1271,title:'300',release_date:'2006',poster_path:'/300.jpg'},
 'tv/1399':{id:1399,name:'Game of Thrones',first_air_date:'2011',poster_path:'/got.jpg'},
 'search/tv?Game of Thrones':{results:[{id:1399,name:'Game of Thrones',first_air_date:'2011',poster_path:'/got.jpg'}]},
 'search/movie?Game of Thrones':{results:[]},
 'search/movie?Inception':{results:[{id:27205,title:'Inception',release_date:'2010',poster_path:'/inc.jpg'},{id:9,title:'Inception 2',poster_path:'/x.jpg'}]},
 'search/tv?Inception':{results:[]}};
const calls:string[]=[];
(globalThis as any).fetch=async(url:string)=>{const u=new URL(url);let k=u.pathname.replace('/3/','');
 if(k.startsWith('search/'))k+='?'+u.searchParams.get('query');calls.push(k);const d=db[k];
 return {ok:!!d,status:d?200:404,text:async()=>JSON.stringify(d||{status_message:'not found'})};};
const take=(r:any[])=>{const c=calls.splice(0);return {rows:r.map(x=>({title:x.title,url:x.url,idMatch:x.idMatch,key:x.externalIdKey})),calls:c};};
const out={
 movie:take(await discover('tmdb','300',{tmdb:'1271'},0,false,'movie')),
 tvHint:take(await discover('tmdb','Game of Thrones',{tmdb:'1399'},0,false,'tv')),
 tvNoHint:take(await discover('tmdb','Game of Thrones',{tmdb:'1399'},0,false,'')),
 search:take(await discover('tmdb','Inception',{},0,false,'movie'))};
console.log(JSON.stringify(out));`;
const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'mf559gw-')),'gateway.mts');
fs.writeFileSync(file,harness);
const run=spawnSync(process.execPath,['--experimental-strip-types','--no-warnings',file],{encoding:'utf8',timeout:60000});
assert.equal(run.status,0,run.stderr);
const out=JSON.parse(run.stdout.trim().split('\n').pop());
assert.deepEqual(out.movie.calls,['movie/1271'],'saved movie ID is used directly');
assert.equal(out.movie.rows[0].url,'https://image.tmdb.org/t/p/w500/300.jpg');
assert.deepEqual(out.tvHint.calls,['tv/1399'],'TV show with its ID under tmdb is looked up as TV');
assert(out.tvHint.rows[0].idMatch&&out.tvHint.rows[0].key==='tmdb_tv','TV ID match is trusted and suggested as tmdb_tv');
assert.equal(out.tvNoHint.rows[0]?.url,'https://image.tmdb.org/t/p/w500/got.jpg','a 404 on the movie ID falls back to title search');
assert.equal(out.tvNoHint.rows[0].idMatch,false,'fallback result is a title match, not an ID match');
assert.deepEqual(out.search.calls,['search/movie?Inception'],'hinted search skips the other catalogue after an exact cover');
assert.deepEqual(out.search.rows.map(r=>r.title),['Inception'],'automatic search stays exact');

// --- Client module against stubbed app functions -----------------------------
const mod=read('src/js/components/402-v559-tmdb-covers.js');
const client=`(async()=>{
let S={settings:{v424Covers:{enabled:['tenrai','malofficial'],priorities:['tenrai','tmdb']}}};
const MF424_DEFAULT={enabled:['tenrai'],priorities:['tenrai']};
let saves=0;const saveState=()=>{saves++;};
const getCategory=id=>({movies:{name:'Movies'},tv:{name:'TV Shows'}})[id];
function mf424HasID(){return false;}
function mf424Defaults(){return {...MF424_DEFAULT,...S.settings.v424Covers};}
function mf434Payload(item,provider){return {provider,title:item.title,externalIds:item.externalIds||{}};}
let attempts=0;async function mf434Call(){attempts++;if(attempts===1)throw Error('Please wait 1 seconds before requesting this source');return {ok:true};}
function mf434ProviderStatus(){return {configured:true,testable:true};}
async function mf443EnsureGateway(){return {};}
const window={};
${mod}
await mf443EnsureGateway();
const on=S.settings.v424Covers.enabled.includes('tmdb'),savesAfterOn=saves;
S.settings.v424Covers.enabled=S.settings.v424Covers.enabled.filter(x=>x!=='tmdb');
await mf443EnsureGateway();
return {on,savesAfterOn,staysOff:!S.settings.v424Covers.enabled.includes('tmdb'),saves,
 hasId:mf424HasID({externalIds:{tmdb:'1271'}},'tmdb'),noId:mf424HasID({externalIds:{tmdb:null}},'tmdb'),
 tv:mf434Payload({title:'GoT',categoryId:'tv'},'tmdb').kind,movie:mf434Payload({title:'300',categoryId:'movies'},'tmdb').kind,
 other:mf434Payload({title:'x',categoryId:'tv'},'omdb').kind,retried:(await mf434Call('search',{})).ok,attempts};
})()`;
eval(client).then(r=>{
  assert(r.on&&r.savesAfterOn===1,'TMDB is switched on once and saved');
  assert(r.staysOff&&r.saves===1,'a later manual "off" is respected');
  assert(r.hasId&&!r.noId,'saved TMDB IDs make TMDB an ID-first provider');
  assert.equal(r.tv,'tv');assert.equal(r.movie,'movie');assert.equal(r.other,undefined,'hint only sent to TMDB');
  assert(r.retried&&r.attempts===2,'one retry after the gateway spacing 429');
  console.log('PASS v559 release: TMDB on for covers, ID/TV-aware gateway lookups, throttle retry, workflows.');
}).catch(e=>{console.error(e);process.exit(1);});
