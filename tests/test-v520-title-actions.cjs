/* MediaFlow v520: canonical title action regression smoke test. */
(function testV520(){
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/js/components/377-v520-title-actions.js'),'utf8');
assert.match(source,/Add to Personal Order/);
assert.match(source,/Added to Personal Order/);
assert.match(source,/Add to Collection/);
assert.match(source,/v181TitleDetailsHtml=function/);
assert.match(source,/libraryModalHtml=function/);
let saves=0;
const state={
 library:[{id:'a',title:'Alpha'},{id:'b',title:'Beta'}],
 collections:[
  {id:'c1',title:'First',description:'',titleIds:['a'],order:['a'],updatedAt:1},
  {id:'c2',title:'Second',description:'',titleIds:[],order:[],updatedAt:1}
 ],
 orderPlan:{titleIds:[],modifiedAt:0},
 orderPlannerUI:{picks:new Set()}
};
const context={
 S:state,console,Date,Promise,Set,Object,String,Number,Map,
 App:{
  openLibraryModal(){},
  saveLibraryModal(id){if(!id)state.library.push({id:'created',title:'Created'});},
  closeModal(){}
 },
 window:{},
 document:{
  addEventListener(){},
  querySelectorAll(){return []},
  querySelector(){return null},
  getElementById(){return null},
  body:{insertAdjacentHTML(){}},
  createElement(){return {innerHTML:'',querySelector(){return null}}}
 },
 libraryModalHtml(){return ''},
 v181TitleDetailsHtml(){return ''},
 v138EnsureOrderPlan(){return state.orderPlan},
 v274EnsureCollections(){return state.collections},
 v274TouchCollection(c){c.order=c.titleIds.slice();c.updatedAt=Date.now();},
 v274CollectionCoverHtml(){return ''},
 v287ReconcileAllQueues(){},
 v141InvalidateOrderPickerCache(){},
 saveState(){saves++;return Promise.resolve();},
 showToast(){},
 cleanTitle(x){return x},
 escapeHtml(x){return String(x).replaceAll('&','&amp;').replaceAll('"','&quot;')}
};
vm.runInNewContext(source,context,{filename:'377-v520-title-actions.js'});
const {App}=context;
assert.equal(context.window.MediaFlowV520.version,520);
assert.equal(context.window.MediaFlowV520.membershipCount('a'),1);
App.mf520ToggleOrder('a');
assert.equal(state.orderPlan.titleIds.join(','),'a','added title to canonical personal order');
App.mf520ToggleOrder('a');
assert.equal(state.orderPlan.titleIds.length,0,'second tap removes title from personal order');
App.mf520OpenCollections('a');
App.mf520SelectCollection('c2',true);
App.mf520SaveCollections();
assert.equal(state.collections[0].titleIds.join(","),['a'].join(","),'unrelated membership preserved');
assert.equal(state.collections[1].titleIds.join(","),['a'].join(","),'selected collection gained title');
assert.equal(context.window.MediaFlowV520.membershipCount('a'),2);
App.mf520OpenCollections('a');
App.mf520SelectCollection('c1',false);
App.mf520SaveCollections();
assert.equal(state.collections[0].titleIds.join(","),[].join(","),'unselected collection removed membership');
assert.equal(state.collections[1].titleIds.join(","),['a'].join(","),'other collection membership unchanged');
App.openLibraryModal();
App.mf520ToggleOrder('');
App.mf520OpenCollections('');
App.mf520SelectCollection('c1',true);
App.mf520SaveCollections();
App.saveLibraryModal('');
assert.equal(state.orderPlan.titleIds.join(','),'created','new title added after save');
assert.equal(state.collections[0].titleIds.join(","),['created'].join(","),'draft collection membership committed after save');
assert.equal(state.collections[1].titleIds.join(","),['a'].join(","),'existing membership remains');
assert.ok(saves>=4,'membership mutations saved through canonical saveState');
console.log('v520 title actions: Personal Order toggle, collection add/remove, draft save, and persistence PASS');
})();
