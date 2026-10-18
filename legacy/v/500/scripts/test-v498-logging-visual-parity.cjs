/* MediaFlow v498 — Logging Library readability and cover parity. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/386-v498-logging-cover-parity.js';
execFileSync('node',['--check',file]);
const code=fs.readFileSync(file,'utf8');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(runtime.at(-1),'components/386-v498-logging-cover-parity.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'498');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v498\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/299-v498-logging-readability-cover-parity\.css/);
assert.match(fs.readFileSync('index.html','utf8'),/300-v498-ambient-motion-surface-polish\.css/);
const css=fs.readFileSync('assets/css/299-v498-logging-readability-cover-parity.css','utf8');
assert.match(css,/\.mf379-picked/);
assert.match(css,/--panel-raised/);
assert.match(css,/--text-dim/);
assert.match(css,/input:checked/);
assert.match(css,/\.mf378-add-btn/);
assert.match(css,/\.mf498-cover-icon/);
assert.match(css,/\[hidden\]/);
assert.match(css,/prefers-reduced-motion:reduce/);
const motionCss=fs.readFileSync('assets/css/300-v498-ambient-motion-surface-polish.css','utf8');
assert.match(motionCss,/data-mf484-mode="advanced"/);
assert.match(motionCss,/data-mf484-mode="custom"/);
assert.match(motionCss,/data-mf497-motion="on"/);
assert.match(motionCss,/prefers-reduced-motion:reduce/);
let changed=0,opened='',pickerReplacement=null,recommendedReplacement=null;
const title={id:"cat's/video 42",title:"Yozakura-san Chi no Mini Sakusen",
 categoryId:'anime',coverUrl:''};
const valid={...title,id:'valid',coverUrl:'https://cdn.example/valid.png'};
const temporarilyDisplayed={...title,id:'tmp',coverUrl:'https://cdn.example/category-default.png',
 __v200OriginalCoverUrl:''};
const selected=new Set(['important']);
const escapeHtml=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
 .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;');
const pickerOld={replaceWith:node=>{pickerReplacement=node}};
const recommendedOld={replaceWith:node=>{recommendedReplacement=node}};
const result={querySelector:q=>q.includes('.mf419-logging-cover')?pickerOld:null,
 insertBefore:()=>{throw Error('Should replace picker cover');}};
const row={querySelector:q=>q==='.v86-log-result'?result:null};
function element(){
 let html='';
 return {set innerHTML(x){html=x},get innerHTML(){return html},
  get firstElementChild(){return {outerHTML:html}},
  querySelectorAll:q=>q==='.mf378-picker .log-suggestion'?[row]:[],
  querySelector:q=>q==='.mf419-log-rec-cover'&&html.includes('mf419-log-rec-cover')?recommendedOld:null};
}
const ctx={
 document:{createElement:element},window:{},App:{v181OpenTitleDetails:id=>opened=id},
 MediaFlowRuntime:{version:497},S:{entryDraft:{title:'Yozakura'},logDraft:{entries:[]}},
 V89_LOG:{page:0,pageSize:12},V378_LOG_UI:{selected},JSON,Math,Number,String,Object,Array,console,
 encodeURIComponent,decodeURIComponent,
 v200OwnCoverUrl:item=>Object.hasOwn(item,'__v200OriginalCoverUrl')
  ?item.__v200OriginalCoverUrl:item.coverUrl,
 v160SafeCoverUrl:s=>/^https:\/\//.test(String(s||''))?s:'',
 getCategory:id=>id==='anime'?{id,icon:'sakura'}:null,
 v144CategoryIconHtml:cat=>'<svg data-cat="'+cat.id+'"></svg>',
 v370Icon:()=>'<svg data-generic="1"></svg>',
 escapeHtml,cleanTitle:s=>s,
 v370CoverHtml:()=>'',v239LoggedCover:()=>'',v224LogSuggestionsHtml:()=>
  '<div class="mf378-picker"><div class="log-suggestion"><div class="v86-log-result"></div></div></div>',
 logTitleCandidates:()=>[title],
 v253RecommendedLogCardHtml:()=>
  '<section><span class="mf419-log-rec-cover"></span><button>Use recommended title</button></section>'
};
vm.createContext(ctx);vm.runInContext(code,ctx,{filename:file});
const api=ctx.window.MediaFlowV498;
assert.equal(api.version,498);
function inspect(html,expected){
 assert.match(html,/data-cat="anime"/);
 assert.doesNotMatch(html,/Missing cover/i,'No missing-cover text');
 assert.doesNotMatch(html,/>Y<\/div>|>Y<\/span>/i,'Never fallback to title initial');
 assert.match(html,/type="button"/);
 assert.match(html,/App\.v181OpenTitleDetails\(decodeURIComponent/);
 assert.match(html,/mf498-cover-icon/);
 assert.match(html,/aria-label="Open title details:/);
 assert.match(html,/onerror=/,undefined);
}
const advanced=ctx.v370CoverHtml({...title,coverUrl:''});
assert.match(advanced,/v370-title-cover/);
assert.match(advanced,/data-mf498-cover="advanced"/);
assert.doesNotMatch(advanced,/Missing cover/i);
const quick=ctx.v239LoggedCover(title,title.title);
assert.match(quick,/v239-logged-cover/);
assert.match(quick,/data-mf498-cover="quick"/);
assert.doesNotMatch(quick,/Missing cover/i);
const regular=api.cover(valid,'picker');
assert.match(regular,/https:\/\/cdn.example\/valid.png/);
assert.match(regular,/nextElementSibling\.hidden=false/);
assert.match(regular,/mf498-cover-icon"[^>]*hidden/);
const missing=api.cover(temporarilyDisplayed,'quick');
assert.doesNotMatch(missing,/category-default.png/,'Temporary category default cannot hide an actually missing cover');
assert.match(missing,/data-cat="anime"/);
assert.doesNotMatch(missing,/Missing cover/i);
const action=advanced.match(/onclick="([^"]+)"/)[1].replace(/&#39;/g,"'").replace(/&quot;/g,'"');
vm.runInContext(action,ctx);
assert.equal(opened,title.id,'Click poster opens correct saved Title Details ID');
assert.equal(ctx.S.logDraft.entries.length,0,'Cover click must not log titles');
ctx.v224LogSuggestionsHtml();
assert(pickerReplacement,'Logging Library picker poster must be replaced');
assert.match(pickerReplacement.outerHTML,/data-mf498-cover="picker"/);
assert.equal(selected.has('important'),true,'Selection must remain unchanged');
ctx.v253RecommendedLogCardHtml(title);
assert(recommendedReplacement,'Recommended title poster must be replaced');
assert.match(recommendedReplacement.outerHTML,/data-mf498-cover="recommended"/);
assert.equal(api.status().errors,0);
assert.equal(changed,0);
console.log('PASS v498: all Logging cover modes, category icon, bad URL fallback, click opens exact title, no draft mutation');
