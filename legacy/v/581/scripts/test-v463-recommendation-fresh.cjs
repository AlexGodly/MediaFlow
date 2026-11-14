/* v463: verified per-recommendation Fresh Episodes count, with manual suppression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'463');
const modules=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(modules.at(-1),'components/347-v463-recommended-title-fresh-left.js');
const src=fs.readFileSync('src/js/components/347-v463-recommended-title-fresh-left.js','utf8');
const css=fs.readFileSync('assets/css/268-v463-recommended-fresh-remaining.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const item={id:'one',progress:1,title:'Zombie Anime',categoryId:'seasonal'};
const cat={id:'seasonal',seasonal:true};
const context={window:{},MediaFlowRuntime:{},V380_NAMES:{automatic2:'Alex Godly Smart Fresh Episodes Engine',anilist:'AniList'},
 S:{settings:{exactTitleRecommendations:true,seasonalFreshAuto:true,v380EpisodeProvider:'automatic2',
 v377JikanLedger:{one:{available:12,at:Date.now(),v402Winner:'anilist'}}}},
 v401IsSeasonal:c=>!!(c&&(c.seasonal||c.id==='seasonal')),
 v401AutomaticEnabled:()=>context.S.settings.seasonalFreshAuto!==false,
 v380Mode:()=>context.S.settings.v380EpisodeProvider,
 v401Progress:i=>Math.max(0,Number(i?.progress)||0),
 v401EpisodeOutcome:()=>context.outcome,
 mf395DashboardRecommendedItem:()=>context.chosen,
 mf395DashboardRecommendationHtml:()=>'<div class="mf419-category-stats"><section class="mf419-stat">Category remaining</section><section class="mf419-stat">Verified fresh remaining</section></div>',
 mf419Icon:()=>'<svg aria-hidden="true"></svg>',escapeHtml:x=>String(x)};
context.chosen=item;context.outcome='fresh';
vm.createContext(context);vm.runInContext(src,context,{filename:'v463.js'});
const api=context.window.MediaFlowV463;
assert.equal(api.version,463);
let report=api.freshForTitle(item,cat);
assert.equal(report.count,11);assert.equal(report.available,12);assert.equal(report.progress,1);
assert.equal(report.source,'AniList');
let out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(out.includes('Recommended title · fresh episodes left'));
assert(out.includes('11</strong>'));
assert(out.includes('12 aired · 1 logged · AniList'));
assert.equal((out.match(/mf419-stat/g)||[]).length,3,'Keep two category statistics and add one title-specific statistic');
item.progress=11;
out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(out.includes('1</strong>'),'Current Library progress updates calculation');
context.outcome='none';item.progress=12;
out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(out.includes('0</strong>'));assert(out.includes('Caught up'));
context.outcome='unknown';
out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(out.includes('Awaiting verification'));assert(!out.includes('12 aired'),'Do not show stale scan as verified');
context.S.settings.v377JikanLedger.one.available=NaN;
context.outcome='fresh';
out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(out.includes('Awaiting verification'),'Invalid ledger count never becomes an invented 0');
context.S.settings.v377JikanLedger.one.available=12;
context.S.settings.seasonalFreshAuto=false;
assert.equal(api.freshForTitle(item,cat),null,'Manual checker mode suppresses the tile entirely');
out=context.mf395DashboardRecommendationHtml({title:item.title},cat);
assert(!out.includes('mf463-fresh-stat'));
context.S.settings.seasonalFreshAuto=true;
context.S.settings.v380EpisodeProvider='manual';
assert.equal(api.freshForTitle(item,cat),null,'Explicit manual source cannot show fresh counts');
context.S.settings.v380EpisodeProvider='automatic2';
assert.equal(api.freshForTitle(item,{id:'books'}),null,'Non-seasonal categories remain unchanged');
context.chosen=null;
assert(!context.mf395DashboardRecommendationHtml({title:'Unmatched'},cat).includes('mf463-fresh-stat'));
context.chosen=item;context.S.settings.exactTitleRecommendations=false;
assert(!context.mf395DashboardRecommendationHtml({title:item.title},cat).includes('mf463-fresh-stat'));
assert(html.includes('assets/css/268-v463-recommended-fresh-remaining.css'));
assert(html.includes('mediaflow-v463.bundle.js'));
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,463);
assert.match(css,/mf463-fresh-stat/);
assert(!src.includes('saveState('),'Display only: do not write data');
assert(!src.includes('v377RunJikan('),'Do not make network requests on render');
console.log('PASS v463: per-title remaining 11/0/unknown, progress refresh, manual suppression, no fake counts, no save/scan');
