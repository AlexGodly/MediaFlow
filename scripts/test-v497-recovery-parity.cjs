/* MediaFlow v497 — Title Details / Edit recovery parity contract. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path='src/js/components/384-v497-title-recovery-parity.js';
execFileSync('node',['--check',path]);
const code=fs.readFileSync(path,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/384-v497-title-recovery-parity.js'));
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'497');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v497\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/297-v497-title-recovery-parity\.css/);
const css=fs.readFileSync('assets/css/297-v497-title-recovery-parity.css','utf8');
assert.match(css,/\.mf497-action-label/);
assert.match(css,/column-gap:5px/);
assert.match(css,/max-width:380px/);
let detailsEnabled=true,editorEnabled=true,selectedId='',created=[],writes=0;
function button(onclick,text){
 return {tagName:'BUTTON',attrs:{onclick},dataset:{},textContent:text,removed:false,
  getAttribute(k){return this.attrs[k]||'';},
  setAttribute(k,v){this.attrs[k]=v;},
  remove(){this.removed=true;}};
}
function group(){
 const buttons=[button("App.mf447Open('cover')",'Cover Recovery'),
  button("App.mf447Open('metadata')",'Metadata Recovery'),
  button("App.mf447Open('both')",'Recover Both')];
 const classes=new Set();
 return {buttons,attrs:{},classList:{add:x=>classes.add(x)},
  setAttribute(k,v){this.attrs[k]=v;},remove(){this.removed=true;},
  querySelectorAll:s=>s==='button'?buttons:[],
  get classes(){return classes;}};
}
const legacy=[
 button("App.mf447Open('cover',{id:'x'})",'Fix Cover'),
 button("App.mf445Open('cover',{id:'x'})",'Covers + Metadata Recovery'),
 button("App.mf439Open('x')",'Fix Metadata'),
 button("App.editTitle('x')",'Edit'),
 button("App.deleteTitle('x')",'Delete')];
const actionState={group:null,retired:[],buttons:legacy,
 querySelectorAll(sel){
  if(sel==='button')return this.buttons.filter(b=>!b.removed);
  if(sel==='.mf447-shortcut-group')return this.group?[this.group]:[];
  return [];
 },prepend(g){this.group=g;}};
const draft=[button('', 'Cover Recovery'),button('','Metadata Recovery'),
 button('','Recover Both'),button('','Fix Metadata')];
draft.forEach(b=>b.disabled=true);
const editorGroup=group();
const toolbar={group:editorGroup,
 querySelector(s){return s==='.mf447-shortcut-group'?this.group:null;},
 querySelectorAll(s){return s==='.mf449-editor-draft-actions button'?draft:[];},
 prepend(g){this.group=g;}};
function fakeHost(){
 let raw='';
 const el={set innerHTML(s){raw=s;},get innerHTML(){return raw;},
  querySelector(s){
   if(s==='.mf447-shortcut-group')return raw.includes('mf447-shortcut-group')?group():null;
   if(s==='.v181-detail-actions')return raw.includes('v181-detail-actions')?actionState:null;
   if(s==='.mf449-editor-recovery-toolbar')return raw.includes('mf449-editor-recovery-toolbar')?toolbar:null;
   return null;
  }};
 created.push(el);return el;
}
const ctx={window:{},document:{createElement:fakeHost},Object,Array,JSON,Number,String,
 Math,console,MediaFlowRuntime:{version:496},
 mf447Prefs:()=>({details:detailsEnabled,editor:editorEnabled}),
 mf447Buttons:({id})=>{selectedId=id;return '<div class="mf447-shortcut-group"></div>';},
 mf425Icon:name=>'<svg data-icon="'+name+'"></svg>',
 v181TitleDetailsHtml:()=>'<div class="v181-detail-actions"></div>',
 libraryModalHtml:()=>'<div class="mf449-editor-recovery-toolbar"></div>'};
vm.createContext(ctx);vm.runInContext(code,ctx,{filename:path});
const api=ctx.window.MediaFlowV497Recovery;
assert.equal(api.version,497);
assert.equal(ctx.MediaFlowRuntime.version,497);
ctx.v181TitleDetailsHtml({id:'test-100'});
assert.equal(selectedId,'test-100','same saved title ID in all three actions');
assert.equal(actionState.group.buttons.length,3);
assert.equal(actionState.group.attrs['aria-label'],'Title recovery actions');
assert.equal(actionState.group.buttons[0].attrs['aria-label'],'Cover Recovery');
assert.equal(actionState.group.buttons[1].attrs['aria-label'],'Metadata Recovery');
assert.equal(actionState.group.buttons[2].attrs['aria-label'],'Recover Both');
assert.equal(actionState.group.buttons[1].innerHTML.includes('Metadata</span><span>Recovery'),true,
 'Metadata and Recovery must be separate visible words');
assert.equal(legacy.filter(x=>x.removed).length,3,'retire all legacy recovery actions');
assert.equal(legacy[3].removed,false,'Edit must be preserved');
assert.equal(legacy[4].removed,false,'Delete must be preserved');
ctx.libraryModalHtml({id:'test-200'});
assert.equal(editorGroup.buttons[1].attrs['aria-label'],'Metadata Recovery');
assert(editorGroup.classes.has('mf497-recovery-actions'));
assert.equal(draft.every(x=>x.disabled),true);
ctx.libraryModalHtml({});
assert.equal(draft[1].attrs['aria-label'],'Metadata Recovery — save title first');
assert.equal(draft.every(x=>x.disabled),true,'draft actions must remain disabled');
const before=api.status().details;
detailsEnabled=false;ctx.v181TitleDetailsHtml({id:'another-title'});
assert.equal(api.status().details,before+1,'hidden preference must remove legacy recovery controls');
assert.equal(actionState.group.buttons.length,3,'previously generated control is not duplicated');
assert.equal(writes,0,'never persist settings or launch jobs during markup');
assert(!/S\.library\s*=|S\.history\s*=|mf447StartCombined\s*\(/.test(code));
console.log('v497 recovery parity PASS: 3 actions, ID scope, labels, duplicates, Edit/Delete, disabled drafts');
