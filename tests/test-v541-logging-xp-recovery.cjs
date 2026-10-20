/* v541: exercise v382's ACTUAL refresh and HTML paths when the older
 * consumption-only estimator throws, plus Advanced Logging 15-unit runtime. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=541);
const legacy=read('src/js/components/278-v382-logging-recommended-progress-xp.js');
const unified=read('src/js/components/381-v537-unified-xp-reward-preview.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
assert(bundle.includes('mf537ProjectXP()')&&bundle.includes('mf537XPCardMarkup()'));
assert(!legacy.includes('v382XPCardMarkup(estimateCurrentLogXP())'),
 'Never evaluate legacy estimator before calling the unified renderer');
assert(legacy.includes("if(x==null)x=estimateCurrentLogXP()"),
 'Keep legacy estimator only as fallback when unified module is missing');
assert(legacy.includes("catch(error){console.warn('Legacy XP UI refresh failed; attempting unified projection',error);}"),
 'Legacy refresh must not hide the unified card');
function segment(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing real source section '+start);
 return src.slice(a,b);
}
const oldCard=segment(legacy,'function v382XPCardMarkup(x){','window.MediaFlowV382=');
const advancedRows=segment(unified,'const MF537_RELEASE=537;','function mf537ProjectXP(){');
let updates=0,calls=0;
const visible={
  innerHTML:'',
  classList:{add(){}},removeAttribute(){},
};
const dom={
  getElementById(name){assert.equal(name,'xp-preview');return visible;},
  createElement(){
    const host={_html:'',preview:{innerHTML:'',classList:{add(){}},removeAttribute(){}},
      set innerHTML(v){this._html=v;},get innerHTML(){
        return this._html.replace('<div id="xp-preview"></div>',
          '<div id="xp-preview">'+this.preview.innerHTML+'</div>');},
      querySelector(q){return q==='#xp-preview'?this.preview:null;}};
    return host;
  }
};
const card='<section class="mf537-xp-card"><b>+4,090 XP</b><span>System Respect +45 XP</span></section>';
const C=vm.createContext({
 window:{},MediaFlowRuntime:{},S:{logDraft:{entries:[]}},document:dom,
 App:{},console:{warn(){}},
 v382Icon:()=>'<svg></svg>',escapeHtml:String,
 mf537XPCardMarkup:()=>{calls++;return card;},
 estimateCurrentLogXP:()=>{throw Error('Legacy estimator intentionally broken');},
 refreshXPPreview:()=>{updates++;throw Error('Legacy refresh intentionally broken');},
 renderLogForm:()=>'<section><div id="xp-preview"></div></section>'
});
vm.runInContext(oldCard,C);
assert.equal(vm.runInContext('v382XPCardMarkup()',C),card);
assert.equal(vm.runInContext('v382UpdateXPPreview()',C),undefined);
assert(visible.innerHTML.includes('mf537-xp-card'),'Live refresh must paint unified reward');
vm.runInContext('refreshXPPreview()',C);
assert(visible.innerHTML.includes('System Respect +45 XP'),
 'Failure in old refresh must not obscure the actual unified preview');
assert.equal(updates,1);
const page=vm.runInContext('renderLogForm()',C);
assert(page.includes('mf537-xp-card'),'Initial Advanced Logging HTML renders actual unified card');
assert(!page.includes('mf537-preview-error'),'No incorrect generic error');
assert(calls>=3);
const category={id:'games',unit:'sessions',name:'Games',minutesPerUnit:30, target:3};
const title={id:'game-1',title:'Demo Game',categoryId:'games'};
const records=Array.from({length:15},(_,i)=>({id:'session-'+i,number:i+1,durationSeconds:1800}));
const item={libraryId:title.id,qty:15,v369Units:records,v394RuntimeManual:true,v394RuntimeSeconds:36000};
const R=vm.createContext({
 S:{currentTask:{categoryId:'games'},logDraft:{v369Interface:'itemized',categoryId:'games',
  minutes:450,entries:[item]}},
 Map,Math,Number,String,Array,JSON,
 getCategory:id=>id==='games'?category:null,
 v369ItemTitle:entry=>entry?.libraryId===title.id?title:null,
 v369Seconds:unit=>Number(unit.durationSeconds)||0
});
vm.runInContext(advancedRows,R);
const projectRows=()=>vm.runInContext('mf537DraftRows()',R).rows;
assert.equal(projectRows().length,1);
assert.equal(projectRows()[0].amount,15);
assert.equal(projectRows()[0].minutes,600,
 '15 logged sessions with 10h customized runtime must estimate 600 minutes');
item.qty=999;assert.equal(projectRows()[0].amount,15,
 'Itemized unit count, not stale draft quantity, controls XP');
item.v394RuntimeManual=false;assert.equal(projectRows()[0].minutes,450,
 'Without manual override the per-unit durations are authoritative');
item.v394RuntimeManual=true;item.v394RuntimeSeconds=7200;
assert.equal(projectRows()[0].minutes,120,'Changing manual duration should update preview immediately');
const old=JSON.stringify(item);projectRows();assert.equal(JSON.stringify(item),old,
 'Read-only preview must never modify unit runtime or cloud draft');
// Test the genuine v537 projection + card with damaged Respect metadata.
// A single optional bonus failure must not erase valid consumption XP.
const rest=segment(unified,'function mf537ProjectXP(){','// The existing v382 logging card');
Object.assign(R,{
  console:{warn(){}},
  v180CalculateRespectAward(){throw Error('Stale recommendation metadata');},
  v149ProspectiveTodayStreak:()=>38,
  v149StreakMultiplier:()=>1.52,
  categoryStatus:()=> 'healthy',
  calculateConsumptionXP:(cat,qty,min)=>({
    base:Math.round(min)+qty*10,multiplier:5,xp:(Math.round(min)+qty*10)*5
  }),
  v382Icon:()=>'<svg></svg>',
  escapeHtml:String
});
vm.runInContext(rest,R);
const partial=vm.runInContext('mf537ProjectXP()',R);
assert.equal(partial.respectUnavailable,true);
assert(partial.total>0&&partial.consumptionTotal>0,'Valid consumption still projected');
const partialMarkup=vm.runInContext('mf537XPCardMarkup()',R);
assert(partialMarkup.includes('PARTIAL XP ESTIMATE'));
assert(partialMarkup.includes('System Respect'));
assert(partialMarkup.includes('Unavailable'));
assert(partialMarkup.includes('mf537-xp-card'));
R.v180CalculateRespectAward=()=>({
  respected:true,bonus:40,noSkipStreak:3,noRerollStreak:2,
  categoryXP:10,exactTitleXP:25,match:{matchedCount:1,slotLimit:1},
  mult:{noSkip:1.08,noReroll:1.14}
});
const full=vm.runInContext('mf537ProjectXP()',R);
assert.equal(full.respectUnavailable,false);
assert.equal(full.respectTotal,40);
assert.equal(full.total,Math.round((full.consumptionTotal+40)*1.52));
assert(vm.runInContext('mf537XPCardMarkup()',R).includes('ESTIMATED TOTAL XP'));
console.log('PASS v541: no eager legacy estimator, resilient unified refresh and HTML, Advanced Logging 15 sessions, accurate manual 10h runtime, nonmutating XP projection.');
