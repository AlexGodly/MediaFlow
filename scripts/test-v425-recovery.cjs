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

// New options must mount through the same v365 Settings Center registry,
// not create a separate fake accordion or duplicate category heading.
const sectionStart=source.indexOf('function mf425SettingsEnhance(){');
const sectionEnd=source.indexOf("\nMediaFlowRuntime.registerPageEnhancer('settings',mf425SettingsEnhance)",sectionStart);
assert(sectionStart>=0&&sectionEnd>sectionStart,'Settings enhancer exists');
const sectionFn=source.slice(sectionStart,sectionEnd);
const settingsBody='<section class="mf425-settings-card">Existing recovery controls</section><label data-mf-setting-id="cover-confirm">Confirmation setting</label>';
const registrations=[];let mounted=null;
const settingsCtx={S:{view:'settings'},window:{
 MediaFlowSettingsCenter:{mountSection:obj=>{mounted=obj;return obj;}},
 MediaFlowSettingsRegistry:{registerSetting:obj=>registrations.push(obj)}
},document:{
 querySelector:()=>null,
 createElement:()=>({nodeType:1,className:'',innerHTML:''})
},mf425SettingsMarkup:()=>settingsBody};
vm.createContext(settingsCtx);
vm.runInContext(sectionFn,settingsCtx);
settingsCtx.mf425SettingsEnhance();
assert(mounted,'Cover Recovery section is mounted');
assert.equal(mounted.id,'v221-settings-cover-recovery');
assert.equal(mounted.title,'COVER RECOVERY');
assert.equal(mounted.category,'library');
assert.equal(mounted.subgroup,'Library maintenance','Existing Library Maintenance group is reused');
assert.equal(mounted.nodes.length,1);
assert(mounted.nodes[0].innerHTML.includes('Existing recovery controls'),'Original preferences remain');
assert(mounted.nodes[0].innerHTML.includes('cover-confirm'),'Confirmation remains in the same settings body');
assert(!sectionFn.includes('mf366-subgroup-heading'),'Custom subgroup wrappers are forbidden');
assert(!sectionFn.includes('mf365-section-top'),'Settings Center owns all section styling');
assert.equal(registrations.length,10,'All ten Cover Recovery settings, including providers and auto-save, can be searched');
for(const setting of registrations){
 assert.equal(setting.section,'v221-settings-cover-recovery');
 assert(setting.selector.startsWith('[data-mf-setting-id='),'Settings are indexed by stable IDs');
}
settingsCtx.mf425SettingsEnhance();
assert.equal(registrations.length,20,'Metadata is re-registered safely on Settings refresh');

const centerSrc=fs.readFileSync('src/js/components/263-v365-settings-center.js','utf8');
for(const requirement of [
 'function v365MountRegisteredSection(input)',
 'window.MediaFlowSettingsCenter=Object.freeze({mountSection:v365MountRegisteredSection})',
 'const section=v365BuildSection(item)',
 'V365_SECTION_MAP.set(id,item)',
 'v366RegisterSection({id,title,category,subgroup',
 'v365BuildIndex([...V365_SECTION_MAP.values()])'
])assert(centerSrc.includes(requirement),'Future Settings use native styles/search/pins: '+requirement);
// Live callbacks are handled by the canonical renderer, not a copied copycat.
assert(centerSrc.includes("title.addEventListener('click',()=>v365ToggleSection(item.id))"));
assert(centerSrc.includes("star.addEventListener('click',()=>v365Favorite(item.id))"));


console.log('v425 scoped recovery and 100k title contract checks passed in',Date.now()-began,'ms');
