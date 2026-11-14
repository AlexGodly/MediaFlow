/* v443 provider-readiness and preference migration regression checks. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=443);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/323-v443-automatic-provider-availability.js'));
const cover=fs.readFileSync('src/js/components/314-v434-provider-connection.js','utf8');
const metadata=fs.readFileSync('src/js/components/318-v439-metadata-adapters.js','utf8');
const settings=fs.readFileSync('src/js/components/319-v439-metadata-recovery.js','utf8');
const coverSettings=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
assert(!cover.includes('verified.has(p.id)'), 'gateway cover adapters must not require a prior test');
assert(!cover.includes('!mf434SavedTests().includes(provider)'), 'cover discovery must not depend on past tests');
assert(!metadata.includes('!mf434SavedTests().includes(provider)'), 'metadata gateway discovery must not depend on past tests');
assert(settings.includes('mf439Available().map(id=>'), 'metadata provider preferences remain visible');
assert(!settings.includes('Requires configured and tested gateway'), 'metadata setup cannot require testing');
assert(coverSettings.includes('MF424_PROVIDER_META.slice().sort('), 'all registered cover providers must remain visible');
assert(cover.includes('status?.configured&&status?.testable'), 'unconfigured or unapproved endpoints remain blocked');
assert(metadata.includes('!status?.configured||!status?.testable'), 'metadata gateway cannot bypass configuration');
const records=[
 {id:'tenrai',limit:20},
 {id:'tmdb',limit:0},
 {id:'omdb',limit:0},
 {id:'malofficial',limit:0}
];
const defaults={enabled:['tenrai'],priorities:['tenrai']};
let statusCalls=0,saves=0,coverAdapterRefreshes=0,coverOpens=0,searches=0,coverRuns=0;
let remote={providers:[
 {id:'tmdb',configured:true,testable:true},
 {id:'omdb',configured:false,testable:true},
 {id:'malofficial',configured:true,testable:true}
]};
const S={view:'library',settings:{v424Covers:{enabled:['tenrai'],priorities:['tenrai']}}};
const AUTH_USER={id:'account-1'};
const App={
 mf425OpenConfig:()=>{coverOpens++;return 'opened';},
 mf425Instant:()=>{searches++;return 'searching';}
};
const runtime={registerPageEnhancer:()=>{}};
const ctx={console,Date,Math,Array,Object,Map,Set,JSON,Promise,String,Number,
 S,AUTH_USER,App,MediaFlowRuntime:runtime,MF424_DEFAULT:defaults,MF424:{job:{},running:false},
 mf424Run:async()=>{coverRuns++;},
 MF424_PROVIDER_META:records,MF434:{status:null},MF434_COVER:new Set(['tmdb','omdb','malofficial']),
 supabase:{},window:{},document:{querySelector:()=>null,createElement:()=>({innerHTML:'',querySelector:()=>null})},
 mf434EnableAdapters:()=>{coverAdapterRefreshes++;},
 mf434Call:async(action)=>{assert.equal(action,'status');statusCalls++;return remote;},
 mf434ProviderStatus:(id)=>ctx.MF434.status?.providers?.find(p=>p.id===id),
 mf434RefreshPanel:()=>{},mf425SettingsMarkup:()=>'',mf439SettingsHtml:()=>'',mf438Paint:()=>{},
 v148BuildFullBackup:()=>({}),saveState:async()=>{saves++;},
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/js/components/323-v443-automatic-provider-availability.js','utf8'),ctx);
(async()=>{
 const first=await ctx.mf443EnsureGateway();
 assert.equal(first.providers.length,3);
 assert.equal(statusCalls,1);
 assert.deepEqual([...defaults.enabled],['tenrai','tmdb','malofficial']);
 assert.deepEqual([...S.settings.v424Covers.enabled],['tenrai','tmdb','malofficial']);
 assert.equal(saves,1);
 await ctx.mf424Run();
 assert.equal(coverRuns,1,'background cover recovery waits for gateway status');
 const repeat=await ctx.mf443EnsureGateway();
 assert.equal(repeat,first);
 assert.equal(statusCalls,1,'gateway status is cached; recovery does not need manual checking');
 // Respect explicit choice when a user disables a now-ready source.
 S.settings.v424Covers.enabled=['tenrai','malofficial'];
 await ctx.mf443EnsureGateway(true);
 assert.deepEqual([...S.settings.v424Covers.enabled],['tenrai','malofficial']);
 assert.equal(statusCalls,2);
 assert.equal(saves,1);
 assert.equal(await App.mf425OpenConfig('library'),'opened');
 assert.equal(coverOpens,1);
 assert.equal(await App.mf425Instant('editor'),'searching');
 assert.equal(searches,1);
 assert.equal(statusCalls,2,'both cover entry points use a cached readiness check');
 // A different account must start from the public baseline, not another
 // account’s configured providers, and must fetch fresh status.
 AUTH_USER.id='account-2';
 S.settings.v424Covers={enabled:['tenrai'],priorities:['tenrai']};
 remote={providers:[{id:'tmdb',configured:false,testable:true},{id:'omdb',configured:true,testable:true}]};
 await ctx.mf443EnsureGateway();
 assert.deepEqual([...defaults.enabled],['tenrai','omdb']);
 assert.equal(statusCalls,3);
 assert.equal(saves,2);
 // Transient gateway failure must not erase a cached ready connection.
 ctx.mf434Call=async()=>{throw Error('temporary outage')};
 const previous=ctx.MF434.status;
 await ctx.mf443EnsureGateway(true);
 assert.equal(ctx.MF434.status,previous);
 assert.equal(ctx.mf443Account(),'account-2');
 assert(coverAdapterRefreshes>=2);
 console.log('v443 provider availability: passed gateway, cache, defaults, preferences, account isolation and fail-safe checks');
})().catch(e=>{console.error(e);process.exitCode=1;});
