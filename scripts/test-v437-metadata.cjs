/* MediaFlow v437 metadata recovery contract tests — no network or account secrets. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=fs.readFileSync('src/js/components/316-v437-metadata-recovery-core.js','utf8');
const ui=fs.readFileSync('src/js/components/317-v437-metadata-recovery-ui.js','utf8');
const cover=fs.readFileSync('src/js/components/318-v437-expanded-cover-providers.js','utf8');
const adapters=fs.readFileSync('src/js/components/319-v437-public-metadata-adapters.js','utf8');
const ctx={
 console,Date,Promise,Map,Set,JSON,Number,String,Object,Math,
 window:{},S:{library:[{id:'a',title:'Naruto',categoryId:'anime',rating:9.5,progress:12,richMetadataManual:{synopsis:true},synopsis:'Written by me',externalIds:{mal:'20'}}],categories:[{id:'anime',name:'Anime'}],settings:{}},
 AUTH_USER:{id:'test-user'},mf424Account:()=> 'test-user',
 mf436SelectedLibraryIds:()=>['a','a'],mf424Storage:async()=>null,
 persistLibrary:()=>{},saveState:async()=>{},v176SafeText:s=>String(s).replace(/<[^>]+>/g,''),
 MF424_PROVIDER_META:[{id:'wikidata',name:'Wikidata',limit:0}],MF424_DEFAULT:{enabled:[],priorities:[]},
 MF424_EXTRA_COVER_ADAPTERS:new Map(),
 mf424Provider(id){return ctx.MF424_PROVIDER_META.find(p=>p.id===id);},
 mf424RegisterCoverProvider(def,adapter){ctx.MF424_PROVIDER_META.push(def);ctx.MF424_EXTRA_COVER_ADAPTERS.set(def.id,adapter);},
 mf424Match:()=>({confidence:.8}),mf433ReadinessMarkup:()=>'',App:{},document:{readyState:'loading',
 addEventListener(){},getElementById(){return null},querySelector(){return null},
 createElement(){return {style:{},set textContent(v){this.value=v;}}},head:{appendChild(){}}},
 MediaFlowRuntime:{registerPageEnhancer(){}},libraryModalHtml:()=>'<div class="modal-actions" style="justify-content:space-between;">',
 renderLibrary:()=>'<button class="mf425-tools-button">Covers</button>',
 v181TitleDetailsHtml:()=>'<div class="v181-detail-actions" style="margin:0;"><div class="v181-detail-section-label" style="margin-top:14px;">Dates & source</div>',
 mf397Markup:()=> '      </div>\n      <button type="button" id="mf397-fab"',
 mf397Action:()=>{},mf425Icon:()=>'<svg></svg>',
 showToast:()=>{},mf397SetMenu:()=>{},
 };
vm.createContext(ctx);
vm.runInContext(core,ctx);
vm.runInContext(adapters,ctx);
let test=vm.runInContext('mf437Merge(S.library[0], {verified:true,provider:"jikan",fields:{synopsis:"overwrite",genres:["Action"],year:2002},ratings:{mal:{value:8.9,scale:10,updatedAt:1}},ids:{mal:"999",anilist:"23"},sourceUrl:"https://example.org"});',ctx);
assert.equal(test.changed>0,true);
assert.equal(ctx.S.library[0].synopsis,'Written by me');
assert.equal(ctx.S.library[0].rating,9.5);
assert.equal(ctx.S.library[0].progress,12);
assert.equal(ctx.S.library[0].externalIds.mal,'20');
assert.equal(ctx.S.library[0].externalIds.anilist,'23');
assert.equal(ctx.S.library[0].externalRatings.mal.value,8.9);
assert.equal(ctx.S.library[0].externalRatings.mal.scale,10);
assert.equal(ctx.S.library[0].genres[0],'Action');
assert.equal(vm.runInContext('mf437Merge(S.library[0], {verified:true,provider:"jikan",fields:{episodeCount:220,originalTitle:"ナルト"},ratings:{},ids:{},sourceUrl:"https://example.org"}).changed',ctx)>0,true);
assert.equal(ctx.S.library[0].mediaMetadata.episodeCount,220);
assert.equal(vm.runInContext('mf437SelectedIds("selected")',ctx).length,2); // call reads source selections, dedupe happens at job creation
assert.equal(vm.runInContext('mf437Rating(null,10)',ctx),null,'Missing rating must never become zero');
assert.ok(vm.runInContext('MF437_PROVIDERS.filter(x=>x.public&&x.live).length',ctx)>=9);
vm.runInContext(ui,ctx);
assert.equal(typeof ctx.App.mf437Start,'function');
assert.ok(vm.runInContext('mf437PopupMarkup("settings")',ctx).includes('METADATA PROVIDERS'));
assert.ok(vm.runInContext('mf397Markup()',ctx).includes('New Metadata Recovery'));
vm.runInContext(cover,ctx);
assert.ok(vm.runInContext('MF437_COVER_CATALOG.length',ctx)>=12);
assert.equal(vm.runInContext('mf424Provider("gametdb").limit',ctx),0);
assert.equal(vm.runInContext('mf424Provider("vndb").limit',ctx)>0,true);
assert.equal(vm.runInContext('mf424Provider("coverartarchive").limit',ctx)>0,true);
assert.equal(vm.runInContext('MF424_EXTRA_COVER_ADAPTERS.has("deezer")',ctx),true);
assert.equal(vm.runInContext('MF424_EXTRA_COVER_ADAPTERS.has("pcgamingwiki")',ctx),true);
assert.equal(vm.runInContext('mf424Provider("gametdb").limit',ctx),0);
console.log('v437 metadata, personal-rating safety, scope, UI, and cover provider contracts passed');
