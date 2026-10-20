/* v543: verify an actual 15-unit/3h30 Logging draft stays visible when the
 * optional v542 projection throws, without awarding or persisting anything. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
assert(Number(read('VERSION').trim())>=543);
const file='components/384-v543-xp-preview-recovery.js';
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(order.indexOf(file)>order.indexOf('components/383-v542-award-parity.js'));
const source=read('src/js/'+file);
assert(read('assets/js/mediaflow-v'+read('VERSION').trim()+'.bundle.js').includes('function mf543EmergencyProjection()'));
assert(!/persistLibrary\s*\(|persistSessions\s*\(|saveState\s*\(|saveQueue\s*\(|awardXP\s*\(/.test(source));
const cat={id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:14};
const draft=()=>({
  currentTask:{categoryId:'anime'},
  logDraft:{v369Interface:'itemized',entries:[{libraryId:'a',qty:15,
    v369Units:Array.from({length:15},(_,i)=>({number:i+1,durationSeconds:840}))}]},
  sessions:[],library:[],xpLedger:{}
});
let S=draft(),fullFailed=false,coreFailed=false,calls=0,renderFailed=false;
const good={eligible:true,awardReady:true,total:1000,baseTotal:200,
  consumptionTotal:1000,respectTotal:0,rawSessionTotal:1000,
  streakBonus:0,streak:1,dayMultiplier:1,respectUnavailable:false,
  categories:[{id:'anime',name:'Anime',amount:15,minutes:210,status:'healthy',
    consumption:1000,base:200,rotation:5,beforeStreak:1000,afterStreak:1000}]};
const preview={
  innerHTML:'<div class="mf537-preview-error">The XP preview is temporarily unavailable. No XP has been awarded.</div>',
  classList:{add(){}},removeAttribute(){},querySelector(s){
    if(s==='.mf537-xp-details')return null;
    if(s==='.mf537-xp-card')return this.innerHTML.includes('mf537-xp-card')?{}:null;
    if(s==='.mf537-preview-error')return this.innerHTML.includes('mf537-preview-error')?{}:null;
    if(s==='.mf543-xp-warning')return this.innerHTML.includes('mf543-xp-warning')?{}:null;
    return null;
  }
};
const doc={
  getElementById(id){return id==='xp-preview'?preview:null;},
  createElement(){
    return {
      _html:'',set innerHTML(v){this._html=v;this.preview={
        ...preview,innerHTML:'<div class="mf537-preview-error">The XP preview is temporarily unavailable. No XP has been awarded.</div>'
      };},
      get innerHTML(){return this._html.replace('<div id="xp-preview"></div>',
        '<div id="xp-preview">'+this.preview.innerHTML+'</div>');},
      querySelector(s){return s==='#xp-preview'?this.preview:null;}
    };
  }
};
const ctx=vm.createContext({
  S,App:{},window:{},MediaFlowRuntime:{},document:doc,
  Map,Number,Array,Math,Date,Object,String,
  console:{warn(){}},
  MF542_LAST_PREVIEW:null,
  mf537ProjectXP:()=>{calls++;if(fullFailed)throw Error('Historic repeat data incomplete');return {...good};},
  mf542BaseProject:()=>{if(coreFailed)throw Error('Old recommendation metadata');return {...good};},
  mf537XPCardMarkup:()=>{const p=vm.runInContext('mf537ProjectXP()',ctx);
    return '<section class="mf537-xp-card"><div class="mf537-xp-status"></div><strong>+'+p.total+
      ' XP</strong></section>';},
  mf537Fmt:n=>Math.round(Number(n)||0).toLocaleString(),
  mf537DraftRows:()=>({rows:[{categoryId:'anime',cat,amount:15,actualAmount:15,minutes:210}]}),
  v149ProspectiveTodayStreak:()=>1,v149StreakMultiplier:()=>1,
  calculateConsumptionXP:(_c,qty,minutes)=>({base:qty*10+minutes,multiplier:5,
    xp:(qty*10+minutes)*5}),
  categoryStatus:()=> 'healthy',
  v382Icon:()=>'<svg></svg>',escapeHtml:String,
  renderLogForm:()=>'<section><div id="xp-preview"></div></section>',
  v382UpdateXPPreview:()=>{throw Error('legacy refresh');}
});
vm.runInContext(source,ctx);
let before=JSON.stringify(S);
assert.equal(vm.runInContext('mf537ProjectXP().total',ctx),1000);
assert.equal(vm.runInContext('mf537ProjectXP().awardReady',ctx),true);
assert(ctx.App.v543XPDiagnostics().failedPlaceholder,'Initially old fallback exists');
fullFailed=true;
let p=vm.runInContext('mf537ProjectXP()',ctx);
assert.equal(p.total,1000);
assert.equal(p.awardReady,false);
assert.equal(p.rewardDetailsUnavailable,true);
let card=vm.runInContext('mf537XPCardMarkup()',ctx);
assert(card.includes('mf537-xp-card')&&card.includes('Partial XP forecast'));
assert(card.includes('+1000 XP'));
assert(!card.includes('ESTIMATED TOTAL XP'));
assert(vm.runInContext('v382UpdateXPPreview()',ctx));
assert(preview.innerHTML.includes('Partial XP forecast')&&!preview.innerHTML.includes('temporarily unavailable'));
let html=vm.runInContext('renderLogForm()',ctx);
assert(html.includes('mf537-xp-card')&&!html.includes('temporarily unavailable'));
coreFailed=true;
p=vm.runInContext('mf537ProjectXP()',ctx);
assert(p.eligible);assert.equal(p.categories.length,1);
assert.equal(p.categories[0].amount,15);
assert.equal(p.categories[0].minutes,210);
assert.equal(p.total,1800);
card=vm.runInContext('mf537XPCardMarkup()',ctx);
assert(card.includes('mf537-xp-card')&&card.includes('Consumption'));
assert(card.includes('1,800'));
assert.equal(JSON.stringify(S),before,'Preview never modifies draft, History or XP ledger');
assert.equal(ctx.App.v543XPDiagnostics().error.stage,'core reward calculation');
fullFailed=false;coreFailed=false;
assert.equal(vm.runInContext('mf537ProjectXP().total',ctx),1000);
assert.equal(ctx.App.v543XPDiagnostics().error,null);
console.log('PASS v543: full forecast intact, 15-unit 3h30 recovery, isolated bonus and core failures, HTML and DOM fallback repair, diagnostic warnings, no XP writes.');
