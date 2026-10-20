/* v545 — regression for production v544 startup failure.
 * v514 used to throw a ReferenceError and leave v537's const helpers in their
 * temporal dead zone. Run the REAL source blocks with and without v264.
 * No network, account data or persistent changes. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=545);
const oldDash=read('src/js/components/375-v514-canonical-category-settings.js');
const xp=read('src/js/components/381-v537-unified-xp-reward-preview.js');
const oldEnhance=read('src/js/components/201-v267-sync-order-balance-dynamic-cover-reliability.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
assert(!oldDash.includes('const mf514OriginalBalanceMarkup=v264BalanceMarkup;\nv264BalanceMarkup=function()'));
assert(oldDash.includes("if(typeof v264BalanceMarkup==='function')"));
assert(xp.includes('function mf537Num(')&&xp.includes('function mf537Fmt('));
assert(!xp.includes('const mf537Num=')&&!xp.includes('const mf537Fmt='));
assert(bundle.includes('function mf537Num(n)')&&bundle.includes('function mf537Fmt(n)'));
assert(bundle.includes("if(typeof v264BalanceMarkup==='function')"));
assert(oldEnhance.includes("&&typeof v265EnhanceBalance==='function')v265EnhanceBalance();"));
const renderers=new Map([['settings',()=>'<main><div id="v221-settings-empty"></div></main>']]);
const registrations=[];
const context={
  Map,Set,Array,Object,Number,String,Math,JSON,Date,
  window:{},console,
  V219_PAGE_RENDERERS:renderers,
  v366RegisterSection:x=>registrations.push(x),
  v366RegisterSetting:x=>registrations.push(x),
  MediaFlowRuntime:{registerPageRenderer:(k,v)=>renderers.set(k,v)},
  mf508PanelHtml:k=>'<section data-mf508-panel="'+k+'"></section>',
  mf508HealthSummaryHtml:()=>'<span>Balance health overview</span>',
  mf508VisibleCategories:()=>[],
  mf508Ensure:()=>({todayBalance:{enabled:true},libraryOverview:{enabled:true}})
};
vm.createContext(context);
assert.doesNotThrow(()=>vm.runInContext(oldDash,context,{filename:'v514.js'}),
  'v514 must not abort startup when obsolete v264 renderer is missing');
assert(context.window.MediaFlowV514,'v514 must complete initialization');
assert.equal(registrations.length>=3,true);
assert(renderers.get('settings')().includes('data-mf508-panel="todayBalance"'));
assert(renderers.get('settings')().includes('data-mf508-panel="libraryOverview"'));
const withLegacy=vm.createContext({...context,window:{},v264BalanceMarkup:()=>'<div class="original-balance"></div>',
 V219_PAGE_RENDERERS:new Map([['settings',()=>'<main><div id="v221-settings-empty"></div></main>']]),
 MediaFlowRuntime:{registerPageRenderer(){} }});
vm.runInContext(oldDash,withLegacy,{filename:'v514-legacy.js'});
const legacyHtml=vm.runInContext('v264BalanceMarkup()',withLegacy);
assert(legacyHtml.includes('original-balance')&&legacyHtml.includes('Balance health overview'),
  'Existing valid balance renderers still get their health summary');
const start=xp.indexOf('const MF537_RELEASE=537;');
const end=xp.indexOf('function mf537ProjectXP(){');
assert(start>=0&&end>start);
const early=vm.createContext({
  S:{currentTask:{categoryId:'anime'},logDraft:{v369Interface:'itemized',
    entries:[{libraryId:'title',qty:15,v369Units:Array.from({length:15},(_,i)=>({
      number:i+1,durationSeconds:840}))}]}},
  Map,Array,Object,Number,Math,String,
  getCategory:id=>id==='anime'?{id:'anime',name:'Anime',minutesPerUnit:14}:null,
  v369ItemTitle:()=>({id:'title',categoryId:'anime'}),
  v369Seconds:u=>u.durationSeconds
});
vm.runInContext('const beforeInitialization=mf537Num(15); '+
  'const formattedBeforeInitialization=mf537Fmt(210);\n'+xp.slice(start,end),early);
assert.equal(vm.runInContext('beforeInitialization',early),15,
  'XP helper must be callable before the v537 initializer statements');
assert.equal(vm.runInContext('formattedBeforeInitialization',early),'210');
const rows=vm.runInContext('mf537DraftRows().rows',early);
assert.equal(rows.length,1);
assert.equal(rows[0].amount,15);
assert.equal(rows[0].minutes,210);
const core=read('src/js/components/384-v543-xp-preview-recovery.js');
const guarantee=read('src/js/components/385-v544-reward-contract.js');
assert(bundle.indexOf('if(typeof v264BalanceMarkup')<bundle.indexOf('function mf537Num(n)'));
assert(bundle.indexOf('function mf537Num(n)')<bundle.indexOf('const MF543_VERSION=543'));
assert(bundle.includes('window.MediaFlowV543')&&bundle.includes('window.MediaFlowV544'));
assert(core.includes('window.MediaFlowV543')&&guarantee.includes('window.MediaFlowV544'));
console.log('PASS v545: production crash repaired, optional old Balance render, full Settings registration, early XP helper hoisting, 15 units 3h30, v543/v544 modules load in built app.');
