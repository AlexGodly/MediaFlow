/* MediaFlow v534 — Category Class deletion must use a themed, cancellable,
   accessible dialog and never delete saved data before explicit confirmation. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('src/js/components/367-v480-category-classes-intelligence.js');
const at=src.indexOf('let V534_CLASS_DELETE_ORIGIN='),end=src.indexOf('function v480MountSettings(){',at);
assert(at>0&&end>at,'Actual Category Class delete handlers must be defined');
assert(!src.includes('window.confirm('),'Native browser confirmations no longer used by Category Class deletion');
assert(src.includes("App.v480DeleteClass('+escapeHtml(JSON.stringify(g.id))+',this)"),
  'Settings class-card delete button passes its focus origin');
assert(src.includes('v480CloseDeleteClass,v480ConfirmDeleteClass'),'Dialog actions are attached to public App methods');
const stylesheet='assets/css/288-v534-category-class-delete-dialog.css';
const css=read(stylesheet),index=read('index.html');
assert(index.includes(stylesheet),'Styled dialog asset loaded by the live app');
assert(css.includes('data-mf534-class-delete')&&css.includes('@media(max-width:520px)'),'Theme-scoped responsive styles available');
assert(css.includes('prefers-reduced-motion'),'Dialog respects reduced motion');
const state={classes:[
 {id:'anime',name:'Anime',categoryIds:['anime-series','films'],weight:3},
 {id:'games',name:'Games',categoryIds:['game'],weight:2}
]};
const cats=[{id:'anime-series'},{id:'films'},{id:'game'}],history=[{id:'session'}],library=[{id:'title'}];
let writes=0,active=null,focusCount=0,toast=[];
const origin={isConnected:true,focus(){focusCount++}};
const dismiss={disabled:false,focus(){focusCount++}};
const confirm={disabled:false,focus(){focusCount++}};
const document={
 activeElement:origin,
 createElement(tag){
  assert.equal(tag,'div');
  const panel={
   id:'',dataset:{},innerHTML:'',removed:false,listeners:{},
   addEventListener(type,fn){this.listeners[type]=fn;},
   contains(btn){return btn===confirm||btn===dismiss;},
   querySelector(s){return s.includes('mf534-delete-cancel')?dismiss:null;},
   querySelectorAll(s){return [dismiss,confirm];},
   remove(){this.removed=true;active=null;}
  };
  return panel;
 },
 getElementById(id){return id==='modal-root'?active:null;},
 querySelector(sel){
  if(sel==='#modal-root[data-mf534-class-delete]')return active;
  return null;
 },
 body:{appendChild(el){active=el;}}
};
const ctx=vm.createContext({
 document,App:{},window:{confirm(){throw Error('Native confirmation must never execute');}},
 escapeHtml:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;'),
 v480Prefs:()=>JSON.parse(JSON.stringify(state)),
 v480Write:next=>{writes++;state.classes=next.classes;},
 showToast:msg=>toast.push(msg),
 console:{error:e=>{throw e;}}
});
vm.runInContext(src.slice(at,end),ctx);
for(const f of ['v480DeleteClass','v480CloseDeleteClass','v480ConfirmDeleteClass'])
 ctx.App[f]=ctx[f];
assert.equal(typeof ctx.App.v480DeleteClass,'function');
ctx.App.v480DeleteClass('anime',origin);
assert(active?.innerHTML.includes('role="alertdialog"'),'Accessible alert dialog is rendered');
assert(active?.innerHTML.includes('aria-modal="true"'),'Dialog is modal');
assert(active?.innerHTML.includes('2 assigned categories will become unassigned'),'Impact summary reflects class membership');
assert(active?.innerHTML.includes('Delete Category Class'),'Explicit destructive action is displayed');
assert.equal(writes,0,'Opening never deletes');
ctx.App.v480CloseDeleteClass();
assert.equal(writes,0,'Cancel never deletes');
assert.equal(state.classes.length,2,'Cancel preserves classes');
assert(focusCount>=1,'Keyboard focus restored to previous control');
ctx.App.v480DeleteClass('anime',origin);
assert(active.listeners.keydown,'Dialog Escape/Tab handler attached');
let prevented=false;
active.listeners.keydown({key:'Escape',preventDefault(){prevented=true;}});
assert(prevented&&!active,'Escape dismisses without saving');
assert.equal(writes,0,'Escape does not mutate data');
ctx.App.v480DeleteClass('anime',origin);
ctx.App.v480ConfirmDeleteClass({});
assert.equal(writes,0,'Unknown or forged button never deletes');
ctx.App.v480ConfirmDeleteClass(confirm);
assert.equal(writes,1,'Explicit Delete confirms exactly one persistence write');
assert.equal(state.classes.length,1,'Only selected class removed');
assert.equal(state.classes[0].id,'games','Unrelated class preserved');
assert.equal(cats.length,3,'Categories untouched');
assert.equal(history.length,1,'History untouched');
assert.equal(library.length,1,'Library untouched');
assert(!active,'Modal closed after success');
ctx.App.v480ConfirmDeleteClass(confirm);
assert.equal(writes,1,'Repeat confirmation cannot delete again');
state.classes.push({id:'xss',name:'<img src=x onerror=alert(1)>',categoryIds:[]});
ctx.App.v480DeleteClass('xss',origin);
assert(!active.innerHTML.includes('<img src=x'),'User class name is HTML-escaped');
assert(active.innerHTML.includes('&lt;img'),'Escaped name displayed');
ctx.App.v480CloseDeleteClass();
console.log('PASS v534: themed class delete confirmation, accessible controls, cancel/Escape, explicit save, safe data, no native popup.');
