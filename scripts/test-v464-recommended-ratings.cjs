/* v464 — preserve original provider scales, provenance, matching and data. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'464');
assert.equal(JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8')).at(-1),
 'components/348-v464-recommended-external-ratings.js');
const src=fs.readFileSync('src/js/components/348-v464-recommended-external-ratings.js','utf8');
const css=fs.readFileSync('assets/css/269-v464-recommended-external-ratings.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const defs=[['imdb','IMDb',10],['rottentomatoes_critics','Rotten Tomatoes · Critics',100],
 ['rottentomatoes_audience','Rotten Tomatoes · Audience',100],['mal','MyAnimeList',10],
 ['anilist','AniList',100],['kitsu','Kitsu',100],['tmdb','TMDB',10],['tvmaze','TVmaze',10]];
const item={id:'rec-1',title:'The Example',year:2023,externalIds:{imdb:'tt123'},
 universalMetadata:{externalRatings:{imdb:{score:7.8,scale:10,votes:2354,source:'manual'},
  rottentomatoes_critics:{score:91,scale:100,votes:30}},
 provenance:{'rating.imdb':{source:'manual',verified:false},
  'rating.rottentomatoes_critics':{source:'omdb',verified:true}}}};
const storage=new Map(),calls=[],settings={
 exactTitleRecommendations:true,v439Metadata:{enabled:['jikan','tmdb','omdb']}
};
const ctx={
 window:{},App:{},MediaFlowRuntime:{},AUTH_USER:null,AUTH_READY:false,
 V115_STARTUP_GUARD:true,MF437_RATING_SOURCES:defs,MF437_RATING_MAP:new Map(defs),
 MF439_PUBLIC:{jikan:{},anilist:{},kitsu:{}},MF439_GATEWAY:['tmdb','omdb'],
 sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 S:{settings,loading:true,view:'dashboard',currentTask:{libraryId:item.id,title:item.title}},
 mf439Preferences:()=>({enabled:settings.v439Metadata.enabled}),
 mf439Evidence:(_i,row)=>({confidence:row.confidence??0}),
 mf439LookupPublic:async(p)=>{calls.push(p);return [{provider:p,recordId:'44',title:item.title,confidence:1,ratings:{mal:{score:8.4,scale:10,votes:413}}}]},
 mf439LookupGateway:async(p)=>{calls.push(p);return []},
 mf434ProviderStatus:p=>p==='tmdb'?{configured:false,testable:true}:p==='omdb'?{configured:true,testable:true}:null,
 mf443EnsureGateway:async()=>null,
 mf450ProviderMark:key=>'<span class="mf450-source-mark">'+key+'</span>',
 mf450NormalizeRatingMap:o=>o,
 mf437Normalized:meta=>meta||{externalRatings:{},provenance:{}},
 mf419Icon:()=>'<svg></svg>',
 mf395DashboardRecommendedItem:()=>item,
 mf395DashboardRecommendationHtml:()=>'<section><div class="mf419-category-stats">category remains</div></section>',
 escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 document:{querySelector:()=>null},
 setTimeout,clearTimeout
};
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'v464.js'});
const api=ctx.window.MediaFlowV464;
assert.equal(api.version,464);
assert.equal(api.stored(item).imdb.score,7.8);
assert.equal(api.stored(item).rottentomatoes_critics.scale,100);
assert.equal(api.stored(item).imdb.attribution,'Entered manually');
assert.equal(api.stored(item).rottentomatoes_critics.attribution,'Verified provider rating');
let card=api.score({...api.stored(item).imdb});
console.log('DEBUG rating card:',card);assert(card.includes('IMDb')&&card.includes('7.8')&&card.includes('2,354 votes'));
assert(card.includes('imdb')&&card.includes('Entered manually'));
const matches=[
 {provider:'jikan',title:item.title,recordId:'42',confidence:1,ratings:{mal:{score:8.4,scale:10,votes:99}}},
 {provider:'anilist',title:item.title,recordId:'22',confidence:.97,ratings:{anilist:{score:84,scale:100,votes:120}}},
 {provider:'kitsu',title:'wrong',recordId:'23',confidence:.89,ratings:{kitsu:{score:100,scale:100}}},
 {provider:'omdb',title:item.title,recordId:'44',confidence:1,ratings:{rottentomatoes_audience:{score:87,scale:100}}},
 {provider:'omdb',title:item.title,recordId:'55',confidence:1,ratings:{rottentomatoes_audience:{score:81,scale:100}}}
];
let found=api.verified(item,matches);
assert.equal(found.mal.score,8.4);assert.equal(found.anilist.score,84);
assert(!found.kitsu&&!found.rottentomatoes_audience,'Reject mismatched and ambiguous values');
assert.equal(found.mal.attribution,'Verified match · jikan');
assert.deepEqual([...api.readyProviders()],['jikan','omdb'],'Only enabled and configured gateways');
ctx.AUTH_USER={id:'acct1'};
ctx.AUTH_READY=true;ctx.V115_STARTUP_GUARD=false;ctx.S.loading=false;
const render=ctx.mf395DashboardRecommendationHtml(ctx.S.currentTask);
assert(render.includes('External ratings')&&render.includes('Category')===false);
assert(render.includes('Entered manually')&&render.includes('Verified provider rating'));
assert(render.includes('Refresh ratings')&&render.includes('mf464-rating-grid'));
assert.equal(calls.length,0,'Render must never block on network');
(async()=>{
 await new Promise(r=>setTimeout(r,540));
 const now=api.current(item);
 assert.equal(now.imdb.score,7.8,'Manual stored ratings may not be overridden by providers');
 assert.equal(now.mal.score,8.4,'Exact identity-matched provider score appears asynchronously');
 assert(calls.includes('jikan')&&calls.includes('omdb'));
 assert(!calls.includes('tmdb'),'Never request an unconfigured gateway');
 assert([...storage.keys()].some(k=>k.includes('acct1')),'Cache is account scoped');
 assert(!item.universalMetadata.externalRatings.mal,'Fetched ratings may NOT silently persist into Library');
 ctx.AUTH_USER={id:'acct2'};
 assert(!api.current(item).mal,'Never show account 1 cached provider ratings to account 2');
 assert.match(css,/mf464-rating-grid/);
 assert(html.includes('mediaflow-v464.bundle.js'));
 assert(html.includes('assets/css/269-v464-recommended-external-ratings.css'));
 assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).appVersion,464);
 assert(!src.includes('saveState('),'Only existing metadata recovery may persist ratings');
 assert(!src.includes('persistLibrary('),'No automatic Library writes');
 console.log('PASS v464: original scales, provider marks/votes, safe matches, duplicate suppression, lazy allowed sources, account cache, no Library changes');
})().catch(err=>{console.error(err);process.exitCode=1});
