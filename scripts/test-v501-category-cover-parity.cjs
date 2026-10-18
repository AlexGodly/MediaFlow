/* MediaFlow v501 — canonical Library cover fallback in Logging. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/389-v501-logging-library-cover-fallback.js';
execFileSync('node',['--check',file]);
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'501');
assert.equal(JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8')).at(-1),
 'components/389-v501-logging-library-cover-fallback.js');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/mediaflow-v501\.bundle\.js/);
assert.match(html,/304-v501-logging-category-fallback\.css/);
const css=fs.readFileSync('assets/css/304-v501-logging-category-fallback.css','utf8');
for(const clause of ['position:absolute!important','container-type:inline-size',
  'width:72cqw','font-size:clamp(20px,63cqw,155px)','mf501-category-fallback[hidden]',
  'mf501-cover-image[hidden]','mf501-category-art .v144-cat-icon-emoji']){
 assert(css.includes(clause),'missing CSS fallback contract: '+clause);
}
const cat={id:'anime',name:'Seasonal Anime',color:'#EE4488',missingDefaultCoverUrl:'https://example.test/category.jpg'};
const saved={id:"the 'anime' / 7",title:'Saved Series',categoryId:'anime',coverUrl:''};
const original={...saved};
let useDefault=false,savedWrites=0;
const escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const ctx={
 window:{},MediaFlowRuntime:{version:500},
 S:{library:[saved]},Math,Number,String,Array,Object,JSON,console,
 cleanTitle:s=>s,escapeHtml,
 getCategory:id=>id==='anime'?cat:null,
 v144CategoryIconHtml:()=>'<span class="v144-cat-icon-emoji">🌸</span>',
 v370Icon:()=>'<svg data-generic="true"></svg>',
 v160SafeCoverUrl:url=>/^https:\/\/example\.test\//.test(String(url||''))?url:'',
 v200TitleCoverSource:item=>{
   const own=item.__v200OriginalCoverUrl!==undefined?item.__v200OriginalCoverUrl:item.coverUrl;
   if(own)return {type:'title',url:own};
   if(useDefault)return {type:'category-default',url:cat.missingDefaultCoverUrl};
   return {type:'category-icon',url:''};
 },
 v417LibraryCoverSource:item=>ctx.v200TitleCoverSource(item),
 mf498DetailsAction:item=>"App.v181OpenTitleDetails('"+encodeURIComponent(String(item.id))+"')",
 mf498CoverHtml:()=>{throw Error('v500 renderer should be replaced')},
 renderLogForm:()=>{savedWrites++;return ''}
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const api=ctx.window.MediaFlowV501;
assert.equal(api.version,501);
for(const surface of ['advanced','quick','picker','recommended']){
 let rendered=ctx.mf498CoverHtml(saved,surface);
 assert(rendered.includes('🌸'),'category icon missing for '+surface);
 assert.match(rendered,/mf501-category-fallback/);
 assert.match(rendered,/data-mf501-source="category-icon"/);
 assert.doesNotMatch(rendered,/<img class="mf498-cover-image/);
 assert.doesNotMatch(rendered,/Missing cover/i,'no caption');
 assert.match(rendered,/data-v225-iconified="1"/);
 assert.match(rendered,/data-mf500-clean-poster="1"/);
 assert.match(rendered,/onclick="App\.v181OpenTitleDetails/);
 assert.doesNotMatch(rendered,/v225-btn-icon/);
}
const partial={id:saved.id,title:saved.title};
assert.equal(api.category(partial).name,'Seasonal Anime',
 'recommendation partial item must resolve the original title category');
let recommended=api.cover(partial,'recommended');
assert.match(recommended,/Seasonal Anime/);
assert.match(recommended,/🌸/);
useDefault=true;
recommended=api.cover(partial,'recommended');
assert.match(recommended,/data-mf501-source="category-default"/);
assert.match(recommended,/src="https:\/\/example\.test\/category.jpg"/);
assert.match(recommended,/mf501-category-fallback" hidden/);
assert.match(recommended,/onerror="this\.hidden=true;this\.nextElementSibling\.hidden=false/);
assert.match(recommended,/mf501-cover-failed/);
saved.coverUrl='https://example.test/actual.jpg';
const own=api.cover(saved,'advanced');
assert.match(own,/data-mf501-source="title"/);
assert.match(own,/actual\.jpg/);
assert.doesNotMatch(own,/category\.jpg/);
saved.__v200OriginalCoverUrl='';
const tmp=api.cover(saved,'advanced');
assert.match(tmp,/data-mf501-source="category-default"/,
 'display-only temporary original must not masquerade as an own cover');
delete saved.__v200OriginalCoverUrl;
saved.coverUrl='';
useDefault=false;
const unknown=api.cover({id:'unknown',title:'Unknown'},'quick');
assert.match(unknown,/data-generic="true"/);
assert.match(unknown,/mf501-category-fallback/);
assert.equal(savedWrites,0,'do not persist or alter logging draft');
assert.deepEqual(saved,original,'title data unchanged');
assert.equal(api.status().missing>=5,true);
console.log('v501 canonical Library fallback PASS: source preference, all Logging modes, partial recommendation, broken image, theme category icon, no mutations');
