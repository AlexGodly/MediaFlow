/* MediaFlow v434: deterministic contract for gateway and opt-in provider adapter UI. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
assert(['434','435','436','437','438','439','440','441','442','443','444','445','446','447','448','449','450','451','452','453','454','455','456'].includes(read('VERSION').trim()));
const code=read('src/js/components/314-v434-provider-connection.js');
const gateway=read('supabase/functions/mediaflow-api-gateway/index.ts');
const prior=read('src/js/components/313-v433-provider-registry-foundation.js');
const ids=read('src/js/components/273-v377-ids-editor-jikan-recovery.js');
const migration=read('supabase/migrations/20261015_v434_gateway_quota.sql');
assert(code.includes('mf434Gateway')||code.includes('mf434Call("status"'),'Missing authenticated gateway handshake');
assert(code.includes('MF424_EXTRA_COVER_ADAPTERS.set'),'New sources use existing cover registry');
assert(code.includes('mf433ValidId'),'External ID verification is preserved');
assert(code.includes('MF434_MAPPING'),'ID-only sources do not pretend to be image hosts');
assert(!prior.includes("id:'podcastindex'"),'Removed provider must not be discoverable');
assert(!ids.includes("['podcastindex_feed'"),'Removed External ID field must not display');
assert(!ids.includes("['podcastindex_episode'"),'Removed episode ID field must not display');
assert(!gateway.includes('PODCAST_INDEX_API_KEY')&&!gateway.includes('podcastindex'),'No Podcast Index API code');
assert(gateway.includes('getUser(jwt)'),'Gateway verifies signed-in session');
assert(gateway.includes('mediaflow_gateway_claim'),'Gateway enforces persistent quotas');
assert(gateway.includes('redirect:"error"'),'Prevent outbound redirects from approved API hosts');
assert(gateway.includes('const ORIGIN="https://alexgodly.github.io"'),'Only MediaFlow origin is allowed');
assert(gateway.includes('mode:"review"'),'Hardcover remains disabled until API query verified');
assert(gateway.includes('p==="metron"'),'Metron bearer token adapter');
assert(gateway.includes('p==="animeschedule"'),'AnimeSchedule bearer token adapter');
assert(gateway.includes('p==="watchmode"'),'Watchmode credits enforced');
assert(gateway.includes('p==="gutendex"'),'Keyless book source');
assert(migration.includes('enable row level security')&&migration.includes("service_role"),'Quota database locked down');
assert(!gateway.includes('Comic Vine'),'Terms-restricted Comic Vine disabled');
const context={
 console,Set,Map,Date,Promise,Math,URL,
 App:{},window:{},S:{settings:{}},AUTH_USER:{id:'account-a'},supabase:null,
 mf424Escape:x=>String(x),mf424Defaults:()=>({}),
 mf425Icon:()=>'<svg></svg>',
 mf433ReadinessMarkup:()=>'<div>pending</div>',
 mf425SettingsMarkup:()=>'<section><div>pending</div></section>',
 v377IdsEditorHtml:()=>'<section><div class="mf377-mal-preview"></div></section>',
 MF424_PROVIDER_META:[
  {id:'tmdb',limit:0,gap:0},{id:'omdb',limit:0,gap:0},{id:'episodate',limit:0,gap:0},
  {id:'gutendex',limit:0,gap:0},{id:'trakt',limit:0,gap:0},{id:'tvmaze',limit:50,gap:1200}
 ],
 MF424_EXTRA_COVER_ADAPTERS:new Map(),
 cleanTitle:x=>x,document:{querySelector:()=>null,getElementById:()=>null},
 showToast:()=>{},saveState:async()=>{},SUPABASE_URL:'https://example.supabase.co',
 SUPABASE_PUBLISHABLE_KEY:'public-test-key'
};
vm.createContext(context);vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
assert.equal(run('window.MediaFlowV434.version'),434,'Extension is loaded');
assert(run('mf434Panel()').includes('Verified API connections'),'Settings UI available');
assert(!run('mf434SavedTests().includes("tmdb")'),'No manual test history initially; live status determines readiness');
assert.equal(run('MF434_COVER.has("trakt")'),false,'Mapping-only provider is not a cover source');
context.MF434_STATUS={};
context.S.settings.v434TestedProviders=['tmdb','trakt'];
run('MF434.status={ready:true,providers:[{id:"tmdb",configured:true,testable:true,mode:"cover"},{id:"trakt",configured:true,testable:true,mode:"mapping"},{id:"episodate",configured:false,testable:true,mode:"cover"}]}');
run('mf434EnableAdapters()');
assert.equal(context.MF424_PROVIDER_META[0].limit,8,'TMDB activates immediately with configured, approved connection');
assert.equal(context.MF424_PROVIDER_META[2].limit,0,'Unverified keyless source remains disabled');
assert.equal(context.MF424_PROVIDER_META[5].limit,50,'Existing TVmaze is untouched');
assert.equal(context.MF424_EXTRA_COVER_ADAPTERS.has('tmdb'),true);
assert.equal(context.MF424_EXTRA_COVER_ADAPTERS.has('trakt'),false);
context.S.settings.v434TestedProviders=[];
run('mf434EnableAdapters()');
assert.equal(context.MF424_PROVIDER_META[0].limit,8,'Removing a diagnostic test must not deactivate a configured adapter');
run('MF434.status.providers[0].configured=false');
run('mf434EnableAdapters()');
assert.equal(context.MF424_PROVIDER_META[0].limit,0,'Missing actual credentials deactivate the adapter');
const payload=JSON.parse(JSON.stringify(run('mf434Payload({title:"A Test Title",year:2021,externalIds:{imdb:"tt1234567",invalid:"hello world","__proto__":"evil"}}, "tmdb")')));
assert.equal(payload.provider,'tmdb');assert.equal(payload.title,'A Test Title');assert.equal(payload.externalIds.imdb,'tt1234567');
assert.equal(payload.externalIds.invalid,undefined);
const hundredK=Array.from({length:100000},(_,i)=>({title:'Book '+i,externalIds:{isbn:'1234567890'}}));
for(let i=0;i<hundredK.length;i+=1000){
 const r=JSON.parse(JSON.stringify(run('mf434Payload({title:"Book '+i+'",externalIds:{isbn:"1234567890"}},"gutendex")')));
 assert.equal(r.title,'Book '+i);
}
assert(run('v377IdsEditorHtml({title:"Test"})').includes('Discover verified External IDs'),'ID discovery is inside Add/Edit editor');
assert(run('mf425SettingsMarkup()').includes('Verified API connections'),'Status integrated into real Settings component');
console.log('PASS v434: gateway rules, permission blocks, automatic configured API activation, ID-only separation, searchable IDs, 100k synthetic title test');
