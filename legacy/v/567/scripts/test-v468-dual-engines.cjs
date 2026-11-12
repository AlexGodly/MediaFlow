/* v468 dual-engine backward-compatibility and Advanced safety regression */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'468');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-2),'components/354-v468-fresh-engines-core.js');
assert.equal(order.at(-1),'components/355-v468-fresh-engines-interface.js');
const source=fs.readFileSync('src/js/components/354-v468-fresh-engines-core.js','utf8');
const ui=fs.readFileSync('src/js/components/355-v468-fresh-engines-interface.js','utf8');
const title={id:'title-1',categoryId:'s1',title:'Example Anime',year:2026,progress:7,
 externalIds:{mal:'1'},seasons:[{number:1,name:'Season 1',total:12,progress:7}]};
const notSeasonal={id:'title-2',categoryId:'n1',title:'Other Show',year:2025,progress:0};
let saved=0,legacyRuns=0,requests=0,lease=false,rendered=0,unknown=0,shouldStop=false;
const settings={exactTitleRecommendations:true,v380EpisodeProvider:'automatic2',
 seasonalFreshAuto:true,v401RecommendFreshOnly:true,
 v377JikanLedger:{'title-1':{available:500,at:Date.now(),v401Mode:'automatic2'}}};
const S={library:[title,notSeasonal],settings,loading:false,view:'dashboard',
 currentTask:{libraryId:'title-1',title:'Example Anime'},sessionActive:true};
const ctx={
 S,Date,Math,Number,Object,Array,String,Promise,console,
 navigator:{onLine:true},window:{},
 setInterval:()=>3,clearInterval(){},setTimeout:fn=>{fn();return 3;},
 AUTH_USER:{id:'account-1'},AUTH_READY:true,
 MF439:{account:'',working:false},MF424:{running:false},MF442:{process:''},
 MF466:{working:false},MF467:{working:false},MF453Quick:{current:null},
 V166_SEASONAL_SYNC_RUNNING:false,
 V380_PROVIDER_SEQUENCE:['tenrai','anizip','anilist','tvmaze','kitsu'],
 V380_NAMES:{tenrai:'Tenrai',anilist:'AniList',kitsu:'Kitsu'},
 V380_ADAPTERS:{},
 MediaFlowRuntime:{version:467},
 getCategory:id=>id==='s1'?{id:'s1',seasonal:true,name:'Anime'}:{id:'n1',seasonal:false},
 mf439Item:id=>S.library.find(i=>String(i.id)===String(id)),
 v252Seasons:i=>i.seasons||[],v401Progress:i=>Number(i.progress)||0,
 v166GetMalId:i=>i.externalIds?.mal||'',
 mf442TitleSignature:i=>JSON.stringify([i.id,i.title,i.progress,i.externalIds]),
 mf439Account:()=>ctx.AUTH_USER.id,
 mf442AcquireProcess:()=>{ctx.MF442.process='metadata';return true},
 mf442ReleaseProcess:()=>{ctx.MF442.process=''},
 mf442ProcessOwned:()=>ctx.MF442.process==='metadata',
 mf439AcquireLease:()=>{lease=true;return true},
 mf439ReleaseLease:()=>{lease=false},
 mf442MetadataLeaseOwned:()=>lease,mf442RenewMetadataLease:()=>lease,
 v402ResolveIdentity:async i=>{i.externalIds.mal='999';return {malId:'1',verifiedMal:true,
  evidence:[{source:'myanimelist',status:'verified'}],conflict:false}},
 v402CheckAllProviders:async()=>{
  requests++;
  if(shouldStop)ctx.MF468_RUNTIME?.stopping; // runner tests cancellation separately
  return {status:'fresh',results:[{source:'anilist',status:'verified',available:10},
   {source:'tenrai',status:'verified',available:9}],verifiedSources:2,
   v403SingleSourceCertified:false};},
 v403VerifyAniListNoFresh:async()=>({verified:false}),
 v380AiredTimestamp:()=>null,v380Request:async()=>({}),
 v401AutomaticEnabled:()=>S.settings.seasonalFreshAuto!==false,
 v401FilterEnabled:()=>S.settings.v401RecommendFreshOnly===true,
 v401IsSeasonal:cat=>Boolean(cat?.seasonal),
 v401EpisodeOutcome:()=> 'none',v402EpisodeOutcomeFor:()=> 'none',
 v401Eligible:()=>false,
 mf463FreshForRecommendedTitle:()=>({count:900,status:'legacy'}),
 mf419FreshRemaining:()=>({fresh:900,unknown:0}),
 v377RunJikan:async()=>{legacyRuns++;return {legacy:true}},
 saveState:async()=>{saved++},
 render:()=>{rendered++},showToast(){},mf468UpdateDashboard(){},
 cleanTitle:x=>x
};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'v468-core.js'});
const api=ctx.window.MediaFlowV468;
assert.equal(api.system(),'legacy','Default must retain historical system');
assert.equal(ctx.MediaFlowRuntime.version,468);
assert.equal(ctx.v401EpisodeOutcome(title),'none','Legacy outcome untouched');
assert.equal(ctx.mf463FreshForRecommendedTitle(title).count,900);
assert.equal(ctx.v401AutomaticEnabled(),true);
assert.equal(ctx.v401FilterEnabled(),true);
assert.equal(ctx.v401IsSeasonal({id:'seasonal',seasonal:false}),false);
const p=api.advanced();
assert.equal(p.source,'smart');assert.equal(p.verification,'balanced');
assert.equal(p.freshOnly,false);
assert.equal(api.candidates().length,1,'Checkbox controls advanced categories');
(async()=>{
 const old=await ctx.v377RunJikan({});
 assert(old.legacy);assert.equal(legacyRuns,1);assert.equal(requests,0);
 settings.v468FreshEpisodesSystem='advanced';
 settings.v468AdvancedFresh={source:'smart',schedules:false,freshOnly:true};
 assert.equal(api.system(),'advanced');
 assert.equal(ctx.v401FilterEnabled(),true);
 assert.equal(ctx.v401EpisodeOutcome(title),'unknown','Never reuse Legacy ledger');
 assert.equal(ctx.v401Eligible(title,{id:'s1',seasonal:true}),true,'Unknown remains eligible');
 assert.equal(ctx.v401Eligible(notSeasonal,{id:'s1',seasonal:true}),false,'Reject different category');
 assert.equal(ctx.mf463FreshForRecommendedTitle(title).count,null);
 const report=api.verdict(title,
  {malId:'1',verifiedMal:true,evidence:[{source:'myanimelist',status:'verified'}]},
  {results:[{source:'anilist',status:'verified',available:10},
   {source:'tenrai',status:'verified',available:9}]});
 assert.equal(report.status,'fresh');assert.equal(report.available,10);
 assert.equal(report.disagreement,true);assert.equal(report.seasonAmbiguous,false);
 const missingProof=api.verdict({...title,progress:10},
  {malId:'1',verifiedMal:true,evidence:[]},
  {results:[{source:'anilist',status:'verified',available:10}]});
 assert.equal(missingProof.status,'unknown','One unsupported negative cannot mean caught up');
 const conflict=api.verdict(title,{malId:'1',verifiedMal:false,conflict:true,evidence:[]},
  {results:[{source:'anilist',status:'verified',available:18}]});
 assert.equal(conflict.status,'unknown','Conflicting ID cannot be trusted');
 let outcome=await ctx.v377RunJikan({force:true,notify:false});
 assert(outcome.ok&&outcome.verified===1);
 assert.equal(requests,1);assert(saved>=1);
 assert.equal(settings.v377JikanLedger['title-1'].available,500,'Legacy ledger must remain identical');
 assert.equal(settings.v380EpisodeProvider,'automatic2');
 assert.equal(settings.seasonalFreshAuto,true);
 assert.equal(title.externalIds.mal,'1','Advanced ID matching must never mutate original Library');
 assert.equal(api.entry(title).available,10);
 assert.equal(api.outcome(title),'fresh');assert.equal(ctx.v401EpisodeOutcome(title),'fresh');
 assert.equal(api.report(title).count,3);
 assert.equal(ctx.mf419FreshRemaining({id:'s1',seasonal:true}).fresh,3);
 assert.equal(ctx.mf419FreshRemaining({id:'s1',seasonal:true}).unknown,0);
 assert.equal(ctx.MF439.working,false);assert.equal(ctx.MF442.process,'');
 assert.equal(lease,false);
 settings.v468AdvancedFresh.freshOnly=false;
 assert.equal(ctx.v401FilterEnabled(),false);
 settings.v468AdvancedFresh.source='manual';
 assert.equal(ctx.v401AutomaticEnabled(),false);
 assert.equal(api.report(title),null,'Manual advanced mode hides tile');
 settings.v468AdvancedFresh.source='smart';
 title.progress=10;
 assert.equal(api.outcome(title),'none','Watched progress updates without provider request');
 assert.equal(ctx.v401EpisodeOutcome(title),'none');
 settings.v468FreshEpisodesSystem='legacy';
 assert.equal(ctx.v401EpisodeOutcome(title),'none');
 assert.equal(ctx.mf463FreshForRecommendedTitle(title).count,900);
 assert.equal(ctx.mf419FreshRemaining({id:'s1',seasonal:true}).fresh,900);
 assert.equal(settings.v377JikanLedger['title-1'].available,500);
 assert.equal(ctx.mf419FreshRemaining({id:'s1',seasonal:true}).fresh,900);
 assert.equal(legacyRuns,1);
 const markup=fs.readFileSync('index.html','utf8');
 assert(markup.includes('mediaflow-v468.bundle.js'));
 assert(markup.includes('272-v468-dual-fresh-engines.css'));
 assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,468);
 assert(ui.includes('App.mf468SelectSystem'));
 assert(ui.includes('App.mf468Stop'));
 assert(ui.includes('Legacy'));
 assert(ui.includes('Advanced'));
 assert(ui.includes('mf468AdvancedWorkspaceHtml'));
 assert(!source.includes('S.library.push('),'No Library additions allowed');
 console.log('PASS v468: untouched Legacy, independent Advanced ledger/preferences, mismatch/unknown, safe scan, progress, manual mode and reversion');
})().catch(e=>{console.error(e);process.exitCode=1});
