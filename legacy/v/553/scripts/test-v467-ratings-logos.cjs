/* v467 contract — real SVG provider marks, per-title verified-only refresh,
 * new title safety, recovery locks, offline/mismatched provider and cloud save.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'467');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.deepEqual(order.slice(-3),[
 'components/351-v467-brand-logos-a.js',
 'components/352-v467-brand-logos-b.js',
 'components/353-v467-rating-refresh-brand-marks.js'
]);
const a=fs.readFileSync('src/js/components/351-v467-brand-logos-a.js','utf8');
const b=fs.readFileSync('src/js/components/352-v467-brand-logos-b.js','utf8');
const script=fs.readFileSync('src/js/components/353-v467-rating-refresh-brand-marks.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/css/271-v467-external-rating-source-logos.css','utf8');
const saved={id:'id1',title:'A valid Anime',year:2025,
 externalIds:{mal:'90'},rating:8,progress:2,
 universalMetadata:{externalRatings:{mal:{score:7,scale:10,votes:200,source:'jikan'}},
  provenance:{'rating.mal':{verified:true,source:'jikan',recordId:'90'}},locks:{}}};
let writes=0,providerScans=0,attempt=0,lease=false,discovered=null,cloudFailure=false;
const account={id:'account-1'};
const S={library:[saved],loading:false,settings:{},currentTask:{libraryId:'id1',title:'A valid Anime'},
 sessionActive:true};
const ctx={window:{},document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
 CSS:{escape:v=>v},navigator:{onLine:true},structuredClone:v=>JSON.parse(JSON.stringify(v)),
 Date,Math,Number,Object,Array,String,Promise,console,AbortController,
 AUTH_USER:account,AUTH_READY:true,S,App:{},
 MediaFlowRuntime:{version:466},MF439:{working:false,account:''},MF424:{running:false},
 MF442:{process:''},MF466:{working:false},MF453Quick:{current:null},
 MF439_LEGACY_FIELDS:{},MF450_MARKS:{anidb:'AniDB'},MF437_RATING_MAP:new Map([['mal',['mal','MAL',10]]]),
 mf450ProviderMark:()=>'<span>old</span>',
 mf437SaveCapture:(item,previous,capture)=>{ctx.lastCapture=capture;return false;},
 mf425Icon:()=>'<svg></svg>',mf419Icon:()=>'<svg></svg>',
 escapeHtml:t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/'/g,'&#39;'),
 mf439Account:()=>ctx.AUTH_USER.id,
 mf439Item:id=>ctx.S.library.find(t=>String(t.id)===String(id)),
 mf442TitleSignature:i=>JSON.stringify([i.id,i.title,i.year,i.externalIds]),
 mf442CoverLockIsActive:()=>false,
 mf442MetadataLockIsActive:()=>false,
 mf442AcquireProcess:()=>{if(ctx.MF442.process)return false;ctx.MF442.process='metadata';return true},
 mf442ReleaseProcess:()=>{ctx.MF442.process=''},
 mf442ProcessOwned:()=>ctx.MF442.process==='metadata',
 mf439AcquireLease:()=>{if(lease)return false;lease=true;return true},
 mf439ReleaseLease:()=>{lease=false},
 mf442MetadataLeaseOwned:()=>lease,mf442RenewMetadataLease:()=>lease,
 mf466Providers:()=>['jikan'],
 mf439Preferences:()=>({minimumConfidence:.94,enabled:['jikan']}),
 mf439Evidence:(_item,row)=>({confidence:row.confidence??1}),
 mf439Discover:async()=>{providerScans++;return discovered??{results:[],failures:[]}},
 mf466ApplyVerified:(item,rows,opts)=>{
  assert.equal(opts.metadata,false);assert.equal(opts.ids,false);
  const score=rows[0].ratings?.mal?.score;
  if(score==null)return {changed:0,ratings:0};
  item.universalMetadata.externalRatings.mal={score,scale:10,votes:rows[0].ratings.mal.votes,source:'jikan'};
  return {changed:1,ratings:1};
 },
 mf464RatingsHtml:()=>'<div></div>',mf466Repaint:()=>{},
 mf450RatingTiles:()=>'<div>ratings</div>',
 libraryModalHtml:()=>'<div class="v240-library-editor"><details class="mf437-ratings"><summary>External ratings</summary></details></div>',
 v181TitleDetailsHtml:()=>'<section class="v181-title-details"><div class="v181-title-details-body"></div></section>',
 saveState:async()=>{writes++;if(cloudFailure)throw Error('Cloud save failed');return true},
 v53InvalidateLibraryCache(){},showToast(){},
 setInterval:()=>4,clearInterval:()=>{}
};
vm.createContext(ctx);
vm.runInContext(a,ctx,{filename:'v467-logo-a'});
vm.runInContext(b,ctx,{filename:'v467-logo-b'});
vm.runInContext(script,ctx,{filename:'v467-refresh'});
const api=ctx.window.MediaFlowV467;
assert.equal(api.version,467);
assert.equal(ctx.MediaFlowRuntime.version,467);
const names=['imdb','trakt','rottentomatoes_critics','rottentomatoes_audience',
 'mal','anilist','kitsu','tmdb','simkl','metacritic','letterboxd',
 'goodreads','storygraph','igdb','opencritic','steam','mangaupdates','discogs','audible'];
for(const key of names){
 const markup=api.logo(key);
 assert(markup.includes('<svg viewBox="0 0 24 24"'));
 assert(markup.includes('<path'),'An authentic SVG shape required: '+key);
 assert(!markup.includes('src="https://'),'Offline logo needed: '+key);
}
for(const key of ['anidb','tvmaze','hardcover','backloggd','vndb',
 'rateyourmusic','ifdb','rawg','googlebooks']){
 const mark=api.logo(key);
 assert(mark.includes('s2/favicons'),'Actual online favicon rather than imitation for '+key);
 assert(mark.includes('mf467-source-fallback'),'Must degrade if offline');
}
assert(api.button(saved,'editor').includes('Refresh external ratings'));
// Provider-owned hidden source URLs must survive a later ordinary Edit Title save.
saved.universalMetadata.externalRatings.mal.url='https://myanimelist.net/anime/90';
ctx.mf437SaveCapture(saved,{}, {ratings:{mal:{score:7,scale:10,votes:200}}});
assert.equal(ctx.lastCapture.ratings.mal.url,'https://myanimelist.net/anime/90');
ctx.mf437SaveCapture(saved,{}, {ratings:{mal:{score:8,scale:10,votes:200}}});
assert.equal(ctx.lastCapture.ratings.mal.url,undefined,'Edited score is user-managed');

assert.deepEqual(Array.from(api.providers(saved)),['jikan'],'Only ready rating-capable sources are checked');
assert(api.button({},'editor').includes('disabled'));
assert(api.button({},'editor').includes('Save this title'));
assert.equal(api.details(saved).includes('ratings'),true);
assert(css.includes('@media(max-width:390px)')&&css.includes('var(--panel)'));
assert(html.includes('mediaflow-v467.bundle.js')&&html.includes('271-v467-external-rating-source-logos.css'));
(async()=>{
 let r=await api.refresh('not-saved');
 assert.equal(r.ok,false);assert.equal(providerScans,0);
 ctx.navigator.onLine=false;r=await api.refresh('id1');
 assert.equal(r.ok,false);assert.equal(providerScans,0);
 ctx.navigator.onLine=true;
 ctx.MF466.working=true;r=await api.refresh('id1');
 assert.equal(r.ok,false);assert.equal(providerScans,0);
 ctx.MF466.working=false;
 discovered={results:[{provider:'jikan',confidence:1,ratings:{mal:{score:9.3,scale:10,votes:400}}},
  {provider:'jikan',confidence:0.3,ratings:{mal:{score:0,scale:10}}}],failures:[]};
 r=await api.refresh('id1');
 assert(r.ok&&r.changed===1);
 assert.equal(saved.universalMetadata.externalRatings.mal.score,9.3);
 assert.equal(saved.rating,8);
 assert.equal(saved.progress,2);
 assert.equal(saved.externalIds.mal,'90');
 assert.equal(providerScans,1);assert.equal(writes,1);
 assert.equal(ctx.MF439.working,false);
 assert.equal(ctx.MF442.process,'');
 assert.equal(lease,false);
 assert.equal(ctx.MF439.account,'');
 discovered={results:[],failures:[{provider:'jikan',reason:'429'}]};
 r=await api.refresh('id1');
 assert(r.ok&&r.changed===0,'No verified match should not modify existing data');
 assert.equal(writes,1,'No cloud write when no changes');
 assert.equal(saved.universalMetadata.externalRatings.mal.score,9.3);
 assert.equal(ctx.MF442.process,'');
 assert.equal(lease,false);
 assert(!script.includes('item.rating='),'Personal rating mutation forbidden');
 assert(!script.includes('mf466ApplyVerified(item,verified,{ratings:true,metadata:true'),'No metadata writes');
 console.log('PASS v467: 19 real brand SVG positions, 9 official favicon fallbacks, title refresh guards, locks, save and draft button');
})().catch(e=>{console.error(e);process.exitCode=1});
