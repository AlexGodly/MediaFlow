/* MediaFlow v458: safe early cover commits + protected bulk metadata selection. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(['458','459'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/342-v458-recovery-dialog-quick-actions.js'));
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('264-v458-recovery-confirmation-quick-actions.css'));
const css=fs.readFileSync('assets/css/264-v458-recovery-confirmation-quick-actions.css','utf8');
assert(css.includes('2147483400')&&css.includes('[data-mf444-approve]')&&css.includes('.mf458-metadata-tools'));
const core=fs.readFileSync('src/js/components/334-v453-quick-title-recovery.js','utf8');
const view=fs.readFileSync('src/js/components/336-v454-quick-title-hardening.js','utf8');
assert(core.includes("typeof mf458CanConfirmQuick==='function'"),'Safe apply guard must permit early confirmed selections');
assert(core.includes('q.controller.abort()'),'Remaining cover scans should be cancelled after confirmed save');
assert(view.includes("typeof mf458CanConfirmQuick==='function'"),'Quick view and lower confidence handler must use same save readiness');
const source=fs.readFileSync('src/js/components/342-v458-recovery-dialog-quick-actions.js','utf8');
let paints=0;
const context={
 console,Number,String,Promise,Object,Array,Date,
 window:{},document:{getElementById:()=>null,createElement:()=>({innerHTML:'',querySelector:()=>null})},
 App:{},MF453Quick:{current:null},mf425Icon:()=>'<svg></svg>',
 mf453QuickRoot:()=>null,mf453PaintQuick:()=>{paints++;},
 mf454QuickView:()=>'',mf444Confirm:()=>Promise.resolve(false)
};
vm.createContext(context);vm.runInContext(source,context,{filename:'v458.js'});
const api=context.window.MediaFlowV458;
assert.equal(api.version,458);
const proposed=[
 {token:'summary',selected:false,protected:false,hasOriginal:false,same:false,options:[{value:'new'}]},
 {token:'genres',selected:false,protected:false,hasOriginal:false,same:false,options:[{value:['Drama']}]},
 {token:'existing',selected:false,protected:false,hasOriginal:true,same:false,options:[{value:'do not overwrite'}]},
 {token:'protected',selected:false,protected:true,hasOriginal:false,same:false,options:[{value:'do not edit'}]},
 {token:'unchanged',selected:false,protected:false,hasOriginal:false,same:true,options:[{value:'same'}]},
 {token:'missingSource',selected:false,protected:false,hasOriginal:false,same:false,options:[]},
];
let q={kind:'both',stage:'scanning',coverLoading:true,metaLoading:true,applying:false,
 covers:[{url:'https://example.org/genuine.jpg'}],coverIndex:0,metadata:{preview:{proposals:proposed}}};
context.MF453Quick.current=q;
assert.equal(api.canConfirm(q),false,'Both must wait until all metadata providers finish');
q.metaLoading=false;
assert.equal(api.canConfirm(q),true,'Both can confirm selected validated cover while other cover providers are pending');
assert.equal(api.eligible(q).length,2);
api.selectMetadataAll(true);
assert.equal(proposed[0].selected,true);assert.equal(proposed[1].selected,true);
assert(proposed.slice(2).every(p=>!p.selected),'No protected, unchanged, original, or empty-source field selected');
assert.equal(paints,1);
api.selectMetadataAll(false);
assert(proposed.every(p=>!p.selected),'Deselect All must only clear eligible fields');
q.coverIndex=-1;
assert.equal(api.canConfirm(q),false,'No cover and no metadata should block Apply');
api.selectMetadataAll(true);
assert.equal(api.canConfirm(q),true,'Metadata-only selection should be eligible after metadata scan');
q.kind='metadata';q.coverLoading=false;q.coverIndex=-1;
assert.equal(api.canConfirm(q),true,'Metadata mode can confirm selected metadata');
q.metaLoading=true;
assert.equal(api.canConfirm(q),false,'Metadata scan must finish first');
api.selectMetadataAll(false);
assert.equal(proposed[0].selected,true,'Blocked toggle must not mutate metadata while scanning');
q.metaLoading=false;q.applying=true;
assert.equal(api.canConfirm(q),false,'Applying cannot be re-entered');
q.applying=false;q.kind='cover';q.coverLoading=true;q.coverIndex=0;
api.selectMetadataAll(false);
assert.equal(api.canConfirm(q),true,'Cover mode can confirm without waiting for all artwork sources');
q.stage='pausing';assert.equal(api.canConfirm(q),false);
q.stage='scanning';q.covers=[{url:'javascript:invalid'}];
assert.equal(api.canConfirm(q),false,'Only https candidate cover can enter confirmation');
console.log('PASS v458: early safe cover save, metadata-complete guard, protected bulk selection, disabled applying and modal styles');
