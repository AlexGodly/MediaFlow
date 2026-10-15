'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
const v424=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const css=fs.readFileSync('assets/css/236-v425-recovery-integration.css','utf8');
for(const name of ['mf425ScopeAllows','mf425CreditRecoveredCover','mf425SettingsEnhance','mf425Instant','mf425CleanDock','mf425PolishSupport','mf425Dismiss'])assert.match(source,new RegExp('function '+name+'\\('));
assert.match(v424,/mf425ScopeAllows\(item\)/,'v424 recovery queue must enforce the scope');
assert.match(v424,/mf425CreditRecoveredCover/,'v424 cover writes must credit XP before save');
assert.match(css,/--mf425-bg:var\(--panel/,'dialog must use real MediaFlow theme tokens');
assert.match(source,/App\.mf425OpenConfig/);
const prefix=source.split('// Called by the existing v424 job builder')[0]+'\n'+source.split('function mf425Counts(')[1].split('function mf425ScopeFields()')[0].replace(/^/,'function mf425Counts(');
const S={library:[],librarySelection:{},categories:[],settings:{}};
const ctx={S,MF424:{},DEFAULT_SETTINGS:{},cleanTitle:(v)=>v,escapeHtml:(v)=>v,mfSelectedIds:()=>[],mf424Missing:(i)=>!i.coverUrl};
vm.createContext(ctx);vm.runInContext(prefix,ctx);
const check=(s,i)=>vm.runInContext('mf425Allows('+JSON.stringify(i)+','+JSON.stringify(s)+')',ctx);
assert.equal(check({mode:'all'},{id:'2',categoryId:'manga'}),true);
assert.equal(check({mode:'category',categories:['anime']},{id:'2',categoryId:'manga'}),false);
assert.equal(check({mode:'categoryStatus',pairs:{anime:['completed']}},{id:'2',categoryId:'anime',status:'active'}),false);
assert.equal(check({mode:'categoryStatus',pairs:{anime:['completed']}},{id:'2',categoryId:'anime',status:'completed'}),true);
assert.equal(check({mode:'selected',ids:['a','b']},{id:'c'}),false);
assert.equal(check({mode:'single',ids:['a']},{id:'a'}),true);
S.library=Array.from({length:100000},(_,i)=>({id:String(i),categoryId:i%2?'anime':'manga',status:i%3?'completed':'planned',coverUrl:i%7?'':'https://example.com/x.jpg'}));
const subset={mode:'selected',ids:Array.from({length:5000},(_,i)=>String(i))};
ctx.subset=subset;const began=Date.now();const x=vm.runInContext('mf425Counts(subset)',ctx);assert.equal(x.all,5000);assert.ok(x.eligible>0);
const catCount=vm.runInContext('mf425Counts({mode:"categoryStatus",pairs:{anime:["completed"]}})',ctx);assert.ok(catCount.all>0&&catCount.eligible>0);

// Cover Recovery must use the existing Settings Center accordion; the v427
// appended confirmation control must stay inside its collapsible body.
const accordionStart=source.indexOf('function mf425SettingsEnhance(){');
const accordionEnd=source.indexOf("\nMediaFlowRuntime.registerPageEnhancer('settings',mf425SettingsEnhance)",accordionStart);
assert(accordionStart>=0&&accordionEnd>accordionStart,'Settings enhancer exists');
const accordionFn=source.slice(accordionStart,accordionEnd);
const settingsBody='<section class="mf425-settings-card">Existing recovery controls</section><label class="mf427-settings-confirm">Confirmation setting</label>';
let appended=null;
const libraryTarget={
 querySelector(selector){return appended&&selector==='.mf425-settings-card'?{}:null;},
 appendChild(element){appended=element;}
};
const settingsCtx={S:{view:'settings'},document:{
 querySelector:selector=>selector.includes('data-mf365-category="library"')?libraryTarget:null,
 createElement:()=>({dataset:{},className:'',innerHTML:''})
},mf425SettingsMarkup:()=>settingsBody,v365Icon:()=>'<svg></svg>'};
vm.createContext(settingsCtx);
vm.runInContext(accordionFn,settingsCtx);
settingsCtx.mf425SettingsEnhance();
assert(appended,'Cover Recovery subgroup is inserted');
assert.equal(appended.dataset.mf366Subgroup,'cover-recovery');
assert.match(appended.innerHTML,/class="mf365-section mf425-settings-section"/);
assert.match(appended.innerHTML,/class="mf365-section-toggle" aria-expanded="false" aria-controls="mf425-settings-body"/);
assert(appended.innerHTML.includes("App.v365ToggleSection('cover-recovery')"),'Accordion uses same Settings Center toggle');
assert.match(appended.innerHTML,/class="mf365-section-body" id="mf425-settings-body" hidden/);
assert(appended.innerHTML.indexOf('mf427-settings-confirm')>appended.innerHTML.indexOf('id="mf425-settings-body" hidden'),'Confirmation is hidden with other settings');
assert(appended.innerHTML.includes('Existing recovery controls'),'Original settings remain available');
settingsCtx.mf425SettingsEnhance();
assert(appended,'Settings injection is stable and non-duplicating');

console.log('v425 scoped recovery and 100k title contract checks passed in',Date.now()-began,'ms');
