/* v482 — full-label assign trigger and safe class selection */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'482');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/369-v482-readable-class-assignments.js');
const v481=fs.readFileSync('src/js/components/368-v481-category-class-management.js','utf8');
const code=fs.readFileSync('src/js/components/369-v482-readable-class-assignments.js','utf8');
const css=fs.readFileSync('assets/css/282-v482-category-assignment-readability.css','utf8');
assert(v481.includes('mf482AssignmentControl(cat,owner)'), 'sidebar uses full-label button');
assert(!v481.includes('<select class="mf481-category-assign"'), 'clipped native select removed');
assert(v481.includes('mf481DragStart('), 'drag retained');
assert(v481.includes('mf481FilterSidebar('), 'search retained');
assert(v481.includes('mf481AssignCategory('), 'assignment action retained');
assert(css.includes('grid-column:2/-1'), 'narrow sidebar has separate assignment row');
assert(css.includes('min-width:395px'), 'wide sidebar may keep assignment inline');
assert(css.includes('white-space:normal;overflow-wrap:anywhere;overflow:visible;text-overflow:clip'),'long class names wrap instead of getting clipped');
assert(css.includes('.mf482-assignment-menu'), 'popup is independent of sidebar');
assert(css.includes('position:fixed!important'), 'portal menu does not clip inside sidebar');
assert(css.includes('.mf482-assign-label'));
assert(!code.includes('S.sessions=')&&!code.includes('S.library='), 'no user account data touched');
const events={},windowEvents={},calls=[];
const S={categories:[{id:'seasonal',name:'Seasonal Anime'}],settings:{}};
const prefs={classes:[{id:'anime',name:'Anime',categoryIds:['seasonal']},{id:'tv',name:'Television Shows',categoryIds:[]}]};
const document={
 addEventListener:(name,fn)=>events[name]=fn,
 getElementById:()=>null,
 activeElement:null
};
const window={addEventListener:(name,fn)=>windowEvents[name]=fn,innerWidth:320,innerHeight:700};
const App={mf481AssignCategory:(cat,group)=>{calls.push({cat,group});return true;}};
const ctx={S,App,document,window,MediaFlowRuntime:{version:481},escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
 v480Prefs:()=>prefs};
vm.runInNewContext(code,ctx,{filename:'v482-assignments.js'});
assert.equal(window.MediaFlowV482.version,482);
const html=window.MediaFlowV482.render(S.categories[0],prefs.classes[0]);
assert(html.includes('>Anime</span>'), 'complete assigned Class displayed');
assert(html.includes('aria-haspopup="listbox"'));
assert(html.includes('mf482-assign-chevron'));
assert(html.includes('mf482ToggleAssignment(this,event)'));
assert(!html.includes('<select'),'no generic select icon chrome');
assert(!html.includes('mf481-category-assign'));
const empty=window.MediaFlowV482.render({id:'tv',name:'TV Shows'},null);
assert(empty.includes('>Unassigned</span>'), 'complete unassigned label displayed');
const malicious=window.MediaFlowV482.render({id:'x',name:'<svg onload=x>'},{name:'<script>alert("x")</script>'});
assert(!malicious.includes('<script>')&&!malicious.includes('<svg onload=x>'), 'escapes user-provided labels');
assert.equal(typeof events.pointerdown,'function');
assert.equal(typeof events.keydown,'function');
assert.equal(typeof events.scroll,'function');
assert.equal(typeof windowEvents.resize,'function');
assert(!/App\.mf481AssignCategory\s*=/.test(code), 'old assignment behavior retained');
console.log('PASS v482: full Anime/Unassigned class labels, custom selector, safe options, responsive width, drag/search preserved, no data mutation');
