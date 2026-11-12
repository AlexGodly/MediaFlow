/* v464 provider scores, ranking, provenance and cloud settings regression */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'464');
assert.equal(JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8')).at(-1),'components/348-v464-recommendations-external-ratings.js');
const src=fs.readFileSync('src/js/components/348-v464-recommendations-external-ratings.js','utf8');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/css/269-v464-recommendations-external-ratings.css','utf8');
const title={id:'1',title:'Anime A',rating:9,universalMetadata:{updatedAt:1,
 externalRatings:{imdb:{score:8,scale:10,votes:1200,source:'imdb'},anilist:{score:75,scale:100,votes:400,source:'anilist'},goodreads:{score:5,scale:5,votes:3,source:'manual'},mal:{score:999,scale:10},vndb:{score:0,scale:100,source:'manual'}},
 provenance:{'rating.imdb':{verified:true,source:'imdb'},'rating.anilist':{verified:true,source:'anilist'},'rating.goodreads':{verified:false,source:'manual'},'rating.mal':{verified:true,source:'mal'},'rating.vndb':{verified:false,source:'manual'}}}};
let selected=title,cloudWrites=0,pageRegistrations=0,searchSettings=0;
const S={settings:{exactTitleRecommendations:true,v464RatingInfluence:'off'}};
const ctx={window:{},S,App:{},MediaFlowRuntime:{version:463,registerPageRenderer(){pageRegistrations++}},
 V219_PAGE_RENDERERS:new Map([['settings',()=>'<div>TEST</div>']]),
 MF437_RATING_SOURCES:[['imdb','IMDb',10],['anilist','AniList',100],['goodreads','Goodreads',5],['mal','MyAnimeList',10],['vndb','VNDB',100]],
 escapeHtml:v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
 mf419Icon:()=>'<svg></svg>',mf450ProviderMark:key=>'<span>'+key+'</span>',
 mf395DashboardRecommendedItem:()=>selected,
 mf395DashboardRecommendationHtml:()=>'<section class="mf419-recommend-card"><div class="mf419-category-stats">Existing category statistics</div></section>',
 scoreLibraryTitle:()=>100,persistSettings(){cloudWrites++;return Promise.resolve()},showToast(){},
 v366RegisterSetting(){searchSettings++;}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const api=ctx.window.MediaFlowV464;
assert.equal(api.version,464);assert.equal(ctx.MediaFlowRuntime.version,464);
assert.equal(pageRegistrations,1);assert.equal(searchSettings,2);
assert.equal(ctx.scoreLibraryTitle(title,{}),100,'Default Off must preserve original ranking exactly');
let out=ctx.mf395DashboardRecommendationHtml({title:'Anime A'},{});
assert(out.includes('External ratings')&&out.includes('Existing category statistics'));
assert(out.includes('Separate from your personal rating')&&out.includes('Verified provider')&&out.includes('Manually entered'));
assert(out.includes('1,200 votes')&&out.includes('Weighted verified-source average'));
assert(!out.includes('999'),'Invalid score must be excluded');
let rows=api.ratings(title);
assert.equal(rows.rows.length,4);assert.equal(rows.verifiedCount,2);
assert(rows.average>75&&rows.average<80,'Original-scale normalized score between trusted IMDb/AniList');
assert.equal(rows.rows.find(x=>x.key==='vndb').score,0,'Real zero remains a valid source score');
assert.equal(rows.rows.find(x=>x.key==='goodreads').verified,false);
ctx.App.mf464Setting('influence','light');
assert.equal(S.settings.v464RatingInfluence,'light');const small=api.bonus(title);
assert(small>0&&small<=4);
assert.equal(ctx.scoreLibraryTitle(title,{}),100+small);
ctx.App.mf464Setting('influence','balanced');assert(api.bonus(title)>0&&api.bonus(title)<=8);
const manual={universalMetadata:{externalRatings:{goodreads:{score:5,scale:5,source:'manual'}},provenance:{'rating.goodreads':{verified:false,source:'manual'}}}};
assert.equal(api.bonus(manual),0);
const mismatched={universalMetadata:{externalRatings:{imdb:{score:9,scale:10,source:'evil'}},provenance:{'rating.imdb':{verified:true,source:'imdb'}}}};
assert.equal(api.bonus(mismatched),0,'Mismatched provider record must not affect ranking');
const zero={universalMetadata:{externalRatings:{anilist:{score:0,scale:100,source:'anilist'}},provenance:{'rating.anilist':{verified:true,source:'anilist'}}}};
assert(api.bonus(zero)<0&&api.bonus(zero)>=-8);
const before=api.ratings(title);
title.universalMetadata={...title.universalMetadata,updatedAt:2,
 externalRatings:{...title.universalMetadata.externalRatings,imdb:{score:4,scale:10,votes:1200,source:'imdb'}}};
const after=api.ratings(title);
assert.notEqual(before,after);assert(after.average<before.average,'Cloud metadata revision busts cached reads');
ctx.App.mf464Setting('show',false);
assert(!ctx.mf395DashboardRecommendationHtml({title:'Anime A'},{}).includes('mf464-recommend-ratings'));
ctx.App.mf464Setting('show',true);
selected=null;assert(!ctx.mf395DashboardRecommendationHtml({title:'No title'},{}).includes('mf464-recommend-ratings'));
selected={id:'none'};assert(api.tiles(selected).includes('No external ratings saved'));
assert(!api.tiles(selected).includes('Weighted verified-source average'));
selected=title;S.settings.exactTitleRecommendations=false;
assert(!ctx.mf395DashboardRecommendationHtml({title:'Anime A'},{}).includes('mf464-recommend-ratings'));
assert.equal(title.rating,9,'Personal score never overwritten');
const settings=api.settings();
assert(settings.includes('Off · existing ranking unchanged')&&settings.includes('Light · up to ±4 points')&&settings.includes('Balanced · up to ±8 points'));
assert.equal(cloudWrites,4,'Changes save through MediaFlow cloud settings');
assert(html.includes('269-v464-recommendations-external-ratings.css')&&html.includes('mediaflow-v464.bundle.js'));
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,464);
assert(css.includes('var(--panel)')&&css.includes('@media(max-width:390px)'));
assert(!src.includes('fetch(')&&!src.includes('v377RunJikan('),'No network requests per dashboard render');
console.log('PASS v464: original rating scales, trust, score caps, manual exclusion, metadata cache, prefs and UI');
