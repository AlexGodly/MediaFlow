/* v538: catch the real regression: v537 release with stale v382 XP card
 * still showing on the mobile Logging page. Verify DOM and HTML paths. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=538);
const v382=read('src/js/components/278-v382-logging-recommended-progress-xp.js');
const guard=read('src/js/components/382-v538-unified-xp-renderer-integrity.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert.equal(runtime.at(-1),'components/382-v538-unified-xp-renderer-integrity.js');
assert(bundle.includes('function mf538ApplyLiveXP(){'),'Guard must ship in the actual bundle');
assert(bundle.includes("if(typeof mf537XPCardMarkup==='function')return mf537XPCardMarkup();"),
  'Original v382 renderer must call unified function directly');
assert(bundle.includes("v382UpdateXPPreview=mf538ApplyLiveXP;"));
assert(bundle.includes('window.MediaFlowV538'));
const start=v382.indexOf('function v382XPCardMarkup(x){');
const end=v382.indexOf('function v382UpdateXPPreview(){',start);
assert(start>=0&&end>start,'Real original card renderer must remain testable');
const native=v382.slice(start,end);
let calls=0;
const card='<section class="mf537-xp-card"><strong>+3990</strong><details class="mf537-xp-details">breakdown</details></section>';
function fakeEl(initial=''){
  return {
    innerHTML:initial,styleRemoved:false,classes:[],
    classList:{add(name){this.parent.classes.push(name);}},
    removeAttribute(key){if(key==='style')this.styleRemoved=true;},
    querySelector(selector){
      if(selector==='.mf537-xp-card')return this.innerHTML.includes('mf537-xp-card')?{}:null;
      if(selector==='.mf382-xp-card')return this.innerHTML.includes('mf382-xp-card')?{}:null;
      if(selector==='.mf537-xp-details')return this.innerHTML.includes('mf537-xp-details')?{open:this.expanded||false}:null;
      return null;
    }
  };
}
function init(initial){
  const root=fakeEl(initial);
  root.classList.parent=root;
  return root;
}
let live=init('<div class="mf382-xp-card">+3,952 XP · old preview</div>');
let missing=false,throwPreview=false;
const document={
  getElementById(id){return id==='xp-preview'&&!missing?live:null;},
  createElement(tag){
    assert.equal(tag,'div');
    const el={_html:'',preview:null,
      set innerHTML(value){this._html=value;this.preview=init('<div class="mf382-xp-card">OLD</div>');},
      get innerHTML(){return this._html.replace('<div id="xp-preview">old</div>',
        '<div id="xp-preview">'+this.preview.innerHTML+'</div>');},
      querySelector(query){return query==='#xp-preview'?this.preview:null;}
    };
    return el;
  }
};
const ctx=vm.createContext({
 S:{logDraft:{entries:[]}},App:{},window:{},MediaFlowRuntime:{version:537},document,console:{warn(){}},
 mf537ProjectXP:()=>({total:3990}),
 mf537XPCardMarkup:()=>{calls++;if(throwPreview)throw Error('projection fails');return card;},
 v348HistoryEntries:()=>[],
 renderLogForm:()=>'<section class="log-form"><div id="xp-preview">old</div></section>',
 v382UpdateXPPreview:()=>{throw Error('old preview renderer must be bypassed');},
 v382Icon:()=>'<svg></svg>',
 escapeHtml:x=>String(x)
});
vm.runInContext(native+'\n'+guard,ctx);
assert.equal(vm.runInContext('v382XPCardMarkup({xp:3952,base:260})',ctx),card,
 'Old card cannot reappear through the original v382 function');
const out=vm.runInContext('renderLogForm()',ctx);
assert(out.includes('mf537-xp-card'),'Actual Logging renderer must output new card');
assert(!out.includes('mf382-xp-card'),'Actual Logging renderer must not output stale card');
assert(out.includes('+3990'));
assert.equal(ctx.MediaFlowRuntime.version,538);
assert.equal(ctx.window.MediaFlowV538.version,538);
assert.equal(ctx.App.v538VerifyXPPreview().oldCardVisible,true,'Before refresh, old card is detected');
assert.equal(vm.runInContext('v382UpdateXPPreview()',ctx),true);
assert(live.innerHTML.includes('mf537-xp-card'));
assert(!live.innerHTML.includes('mf382-xp-card'));
assert.equal(ctx.App.v538VerifyXPPreview().unifiedVisible,true);
assert.equal(ctx.App.v538VerifyXPPreview().oldCardVisible,false);
assert(live.styleRemoved);
live.expanded=true;
vm.runInContext('v382UpdateXPPreview()',ctx);
assert(live.querySelector('.mf537-xp-details').open,'Expanded mobile details remain open across live updates');
missing=true;assert.equal(vm.runInContext('v382UpdateXPPreview()',ctx),false,'No logging preview is a safe no-op');
missing=false;throwPreview=true;
const error=vm.runInContext('renderLogForm()',ctx);
assert(error.includes('mf537-preview-error'),'Renderer failures must be visible');
assert(!error.includes('mf382-xp-card'),'Never show stale, misleading XP on calculation failure');
assert.equal(vm.runInContext('v382UpdateXPPreview()',ctx),false);
assert(live.innerHTML.includes('mf537-preview-error'),'Live failures show an explicit notice');
assert(!live.innerHTML.includes('mf382-xp-card'),'Live failures cannot fall back to misleading XP');
assert(calls>=5);
console.log('PASS v538: original XP renderer, entire Logging HTML and live DOM cannot show stale v382 card; expanded mobile panel and errors handled.');
