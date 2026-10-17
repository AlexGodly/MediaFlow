/* v448 safety contracts: verified-ID gate, strict conflicting covers, metadata review,
 * protected base-engine handoff, persisted evidence queue, Dashboard opt-in. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=448);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/328-v448-smart-autofill-recovery.js'));
const src=fs.readFileSync('src/js/components/328-v448-smart-autofill-recovery.js','utf8');
const css=fs.readFileSync('assets/css/255-v448-smart-auto-fill.css','utf8');
assert(fs.readFileSync('index.html','utf8').includes('255-v448-smart-auto-fill.css'));
for(const key of ['.mf448-settings','.mf448-review-row','.mf448-candidate-confidence','@media(max-width:370px)','var(--flow)'])assert(css.includes(key));
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const saved=[
 {id:'anime',title:'Anime',coverUrl:'',modifiedAt:0},
 {id:'comic',title:'Comic',coverUrl:''}
];
const S={library:saved,settings:{}};
const MF424={job:null,account:'owner',running:false},MF439={job:null,working:false},MF447={active:'cover'},MF445={mode:'cover'};
const result={coverCalls:0,originalCover:0,metadataWrites:0,proposals:0,saves:0,autoSave:0,reviewed:0,candidates:[]};
let covers=[];
const MF448_PROPOSALS=()=>({titleId:'comic',title:'Comic',providers:['sourceA','sourceB'],
 proposals:[
  {token:'legacy.synopsis',status:'ready',protected:false,same:false,hasOriginal:false,disagree:false,options:[{sources:[{confidence:.98}]}],selected:true},
  {token:'rating.imdb',status:'conflict',protected:false,same:false,hasOriginal:false,disagree:true,options:[],selected:false},
  {token:'field.year',status:'protected',protected:true,same:false,hasOriginal:true,options:[],selected:false}
 ]});
const document={getElementById:()=>null,createElement:()=>({}),querySelector:()=>null};
const App={mf430SetMissingAutoSave:on=>{S.settings.v430MissingCoversAutoSave=on;result.autoSave++;}};
const c={S,MF424,MF439,MF447,MF445,App,window:{},document,localStorage,console,
 Promise,Number,String,Array,Map,Set,Object,Math,JSON,Date,
 mf424Escape:safe,mf425Icon:(key)=>'<svg data-icon="'+key+'"></svg>',
 mf439Account:()=> 'owner',mf439Preferences:()=>({minimumConfidence:.94,enabled:['sourceA']}),
 mf439Proposals:()=>{result.proposals++;return MF448_PROPOSALS();},
 mf439Apply:()=>{result.metadataWrites++;return {changed:1};},
 mf439SaveJob:()=>{result.saves++;},
 mf424SaveJob:async()=>{result.saves++;},
 mf424Process:async()=>{result.originalCover++;},
 mf424Missing:obj=>!obj.coverUrl,mf424Candidates:async()=>covers,
 mf424QueueReview:(item,list)=>{result.reviewed++;MF424.job.reviews.push({id:item.id,candidates:list});},
 mf424Note:()=>{},mf424Apply:async(item,best)=>{result.coverCalls++;item.coverUrl=best.url;return true;},
 mf425CandidatesHtml:(list)=>'<div class="mf425-found-count">Found '+list.length+'</div>'+
   list.map(x=>'<article class="mf425-candidate"></article>').join(''),
 mf445Panel:()=>{},mf441WorkspaceHtml:()=>'<fieldset class="mf447-settings-shortcuts"></fieldset>',
 mf439SettingsHtml:()=>'<div id="mf439-batch-status"></div>',
 mf441Paint:()=>{},saveState:async()=>{result.saves++;},showToast:()=>{},
 mf444Confirm:async()=>true,mf445Close:()=>{},mf445OriginalMetadataOpen:id=>id,
};
vm.createContext(c);vm.runInContext(src,c);
const api=c.window.MediaFlowV448;assert.equal(api.version,448);
assert.equal(api.prefs().coverPolicy,'original');
assert.equal(api.prefs().metadataPolicy,'original');
assert.equal(api.prefs().metadataConfidence,94);
assert.equal(api.prefs().dashboardAutoSave,false);
assert(c.mf448ConfigHtml('both').includes('Strict ID-verified'));
assert(c.mf448ConfigHtml('both').includes('Dashboard: automatically save'));
assert(c.mf441WorkspaceHtml().includes('mf448-settings'));
assert(c.mf439SettingsHtml().includes('mf448-settings'));
assert(c.mf425CandidatesHtml([{idMatch:true,confidence:.98},{idMatch:false,confidence:.9}]).includes('98% · Direct ID match'));
assert(c.mf425CandidatesHtml([{idMatch:false,confidence:.9}]).includes('90% · Manual review'));
(async()=>{
 MF424.job={account:'owner',reviews:[],skipped:0,fixed:0,unresolved:0,id:'cover-job'};
 await c.mf424SaveJob();
 assert.equal(MF424.job.mf448Options.coverPolicy,'original');
 covers=[{url:'https://source/one.png',provider:'public',confidence:.99,idMatch:true}];
 await c.mf424Process(saved[0]);
 assert.equal(result.originalCover,1,'default behavior delegates to the prior engine');
 S.settings.v448SmartRecovery={coverPolicy:'strict',coverConfidence:98,metadataPolicy:'review',metadataConfidence:98,collectReviews:true};
 MF424.job.mf448Options={coverPolicy:'strict',coverConfidence:98};
 await c.mf424Process(saved[0]);
 assert.equal(result.coverCalls,1,'uniquely ID-verified >=98% can be auto-selected');
 assert.equal(saved[0].coverUrl,'https://source/one.png');
 await c.mf424Process(saved[0]);
 assert.equal(MF424.job.skipped,1,'never overwrite existing artwork');
 covers=[{url:'https://source/two.png',provider:'A',confidence:.99,idMatch:true},
  {url:'https://source/three.png',provider:'B',confidence:.99,idMatch:true}];
 await c.mf424Process(saved[1]);
 assert.equal(result.coverCalls,1,'conflicting verified artwork must not auto-save');
 assert.equal(result.reviewed,1);
 assert(!saved[1].coverUrl);
 covers=[{url:'https://source/title-only.png',provider:'A',confidence:.99,idMatch:false}];
 await c.mf424Process(saved[1]);
 assert.equal(result.reviewed,2,'title-only matches require manual review');
 MF424.job.mf448Options.coverPolicy='review';
 await c.mf424Process(saved[1]);assert.equal(result.reviewed,3,'manual-only cover option prevents auto-save');
 MF439.job={id:'metadata-job',account:'owner',status:'running'};MF439.working=true;
 c.mf439SaveJob();
 assert.equal(MF439.job.mf448Options.metadataPolicy,'review');
 assert.equal(c.mf439Preferences().minimumConfidence,.98);
 const preview=c.mf439Proposals(saved[1],[]);
 assert.equal(api.review().length,1);
 assert.equal(api.review()[0].reason,'manual-review');
 assert.equal(api.review()[0].fields,2);
 const noChange=c.mf439Apply(saved[1],preview,'automatic');
 assert.equal(noChange.changed,0,'Review-only batch cannot write metadata');
 assert.equal(result.metadataWrites,0);
 MF439.job.mf448Options.metadataPolicy='original';c.mf439Apply(saved[1],preview,'automatic');
 assert.equal(result.metadataWrites,1,'Original verified batch stays delegated to existing engine');
 c.App.mf448Set('dashboardAutoSave',true);
 assert.equal(result.autoSave,1);assert.equal(api.prefs().dashboardAutoSave,true);
 c.App.mf448Set('coverConfidence',20);
 assert.equal(api.prefs().coverConfidence,95,'Confidence never below verified-ID safety threshold');
 assert.equal(storage.has('mediaflow-v448-review:owner'),true);
 console.log('PASS v448: strict ID verified auto-fill, existing cover protection, conflicting artwork review, metadata review-only policy, confidence floors, saved checkpoints and Dashboard auto-save reuse');
})().catch(e=>{console.error(e);process.exitCode=1});
