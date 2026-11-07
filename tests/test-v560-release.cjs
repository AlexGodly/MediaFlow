/* v560 release contract: a saved recovery job's provider list (v455 override of
 * mf424Defaults) no longer hides TMDB once it is on in settings. Chains the real
 * v559 and v560 modules on top of a v455-style override. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=560,'VERSION must be v560 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/403-v560-tmdb-saved-job.js')>runtime.indexOf('components/402-v559-tmdb-covers.js'),'v560 module loads after v559');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
assert(fs.existsSync(path.join(root,'docs/release-v560.md')),'release notes present');
if(version===560){
  const wf=read('.github/workflows/publish-v560.yml');
  assert(wf.includes('test "$(cat VERSION)" = 560')&&wf.includes('legacy/v/560')&&wf.includes('gh release create 560'),'release workflow archives and releases v560');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v560"'),'deploy runs after the v560 release');
const v559=read('src/js/components/402-v559-tmdb-covers.js'),v560=read('src/js/components/403-v560-tmdb-saved-job.js');
const scenario=`(async()=>{
let S={settings:{v424Covers:{enabled:['tenrai','malofficial','tmdb'],priorities:['tenrai','tmdb']},v559TmdbCoversOn:true}};
const MF424_DEFAULT={enabled:['tenrai'],priorities:['tenrai']};
let saves=0,jobSaves=0;const saveState=()=>{saves++;};
const MF424={job:{account:'u',v455Providers:['tenrai','jikan','malofficial']}};
const mf424Account=()=>'u';const mf424SaveJob=async()=>{jobSaves++;};
const getCategory=()=>null;
function mf424HasID(){return false;}
// base + the v455 override that returns the saved job's list
function mf424Defaults(){return {...MF424_DEFAULT,...S.settings.v424Covers};}
const base455=mf424Defaults;
mf424Defaults=function(){const p=base455();const j=MF424.job;
 return j?.v455Providers&&j.account===mf424Account()?{...p,enabled:j.v455Providers}:p;};
function mf424CoverProviderChoices(){const s=mf424Defaults();
 return [{id:'tenrai',limit:35},{id:'tmdb',limit:8}].map(d=>({...d,usable:!!d.limit,enabled:s.enabled.includes(d.id)}));}
function mf434Payload(i,p){return {provider:p};}
async function mf434Call(){return {};}
let ready=true;function mf434ProviderStatus(){return {configured:ready,testable:ready};}
async function mf443EnsureGateway(){return {};}
const window={};
const before=mf424Defaults().enabled.includes('tmdb');
${v559}
${v560}
const label=mf424CoverProviderChoices().find(p=>p.id==='tmdb');
await mf443EnsureGateway();
const diag=window.MediaFlowV560.diagnose();
S.settings.v424Covers.enabled=['tenrai'];MF424.job.v455Providers=['tenrai'];
const offRespected=!mf424Defaults().enabled.includes('tmdb');
S.settings.v424Covers.enabled=['tenrai','tmdb'];ready=false;
const notReady=!mf424Defaults().enabled.includes('tmdb');
return {before,labelOn:label.enabled,jobHasTmdb:diag.savedJobProviders.includes('tmdb'),jobSaves,diag,offRespected,notReady};
})()`;
eval(scenario).then(r=>{
  assert.equal(r.before,false,'reproduces the bug: saved job list hides TMDB');
  assert.equal(r.labelOn,true,'Find cover no longer shows TMDB as off for background recovery');
  assert(r.jobHasTmdb&&r.jobSaves===1,'saved job updated once so resuming uses TMDB');
  assert(r.diag.tmdbUsable&&r.diag.enabledNow.includes('tmdb'),'diagnose() reports TMDB on');
  assert(r.offRespected,'TMDB off in settings stays off');
  assert(r.notReady,'TMDB not added while the gateway does not report it ready');
  console.log('PASS v560 release: TMDB stays on with a saved recovery job.');
}).catch(e=>{console.error(e);process.exit(1);});
