/* MediaFlow v428 Phase 5 — floating Background Processes integration (offline). */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('src/js/components/312-v428-background-hub.js','utf8');
const css=fs.readFileSync('assets/css/239-v428-background-recovery.css','utf8');
new vm.Script(source,{filename:'v428-background-hub.js'});
for(const pattern of ['var(--mf428-card)','var(--mf428-primary)','data-size="compact"','@media(max-width:400px)','prefers-reduced-motion','safe-area-inset-bottom','mf428-notice-count']){
 assert(css.includes(pattern),'Widget CSS must support '+pattern);
}
const settings=[];
const localStore=new Map(),store={getItem:k=>localStore.get(k)||null,setItem:(k,v)=>localStore.set(k,v),removeItem:k=>localStore.delete(k)};
const App={},S={settings:{v428Background:{visibility:'always',compact:false,position:'right',notifications:true}}},callbacks={};
let el=null,seenToast=[];
const fakeNode=()=>({
 id:'',className:'',dataset:{},style:{data:{},setProperty(k,v){this.data[k]=v;}},inert:false,attributes:{},
 innerHTML:'',scrollTop:0,
 classList:{toggle(){},contains(){return false;}},
 setAttribute(k,v){this.attributes[k]=v;},
 querySelector(){return null;},querySelectorAll(){return [];},contains(){return false;}
});
const document={
 body:{appendChild(node){el=node;},querySelector(){return null;}},
 readyState:'loading',addEventListener(n,fn){callbacks[n]=fn;},getElementById(id){return id==='mf428-hub'?el:null;},
 createElement(){return fakeNode();},activeElement:null
};
const window={innerHeight:900,innerWidth:1300,addEventListener(n,fn){callbacks[n]=fn;}};
const context=vm.createContext({
 window,document,App,S,localStorage:store,AUTH_USER:{id:'mock'},
 v405FloatingSettingsHtml:()=>'<div class="card mf405-floating-settings" data-mf405-group="floating-controls"><p>Existing Add / Progress controls</p></div>',
 v366RegisterSetting:row=>settings.push(row),
 mf424Run:async()=>{},v377RunJikan:async()=>{},MF424:{running:false,job:null},
 showToast:text=>seenToast.push(String(text)),persistSettings:async()=>{},saveState:async()=>{},
 Date,Math,JSON,console,URL,Promise,setInterval:fn=>{callbacks.timer=fn;return 1;},
 clearInterval(){},setTimeout,clearTimeout
});
vm.runInContext(source,context,{timeout:5000});
const hub=window.MediaFlowV428Hub;
assert(hub,'Exports widget controller');
assert.equal(typeof App.mf428ToggleSize,'function');
assert.equal(typeof App.mf428SetNotifications,'function');
assert.equal(typeof App.mf428ReadNotices,'function');
assert.equal(typeof App.mf428SetPosition,'function');
assert.equal(typeof App.mf428ClearNotices,'function');
const html=context.v405FloatingSettingsHtml();
assert(html.includes('Existing Add / Progress controls'),'Existing widget settings remain intact');
assert(html.includes('mf428-visibility')&&html.includes('mf428-size')&&html.includes('mf428-notify'));
assert(html.indexOf('mf428-widget-settings')<html.lastIndexOf('</div>'),'Settings embedded inside native existing card');
assert(settings.some(s=>s.label==='Background Processes Widget'),'Registered with Settings Center');
assert(settings.some(s=>s.label==='Background Process Notifications'));
App.mf428SetVisibility('always');
assert(el&&el.innerHTML.includes('Background Processes'));
App.mf428Toggle();
assert(el.innerHTML.includes('Cover Recovery')&&el.innerHTML.includes('Metadata Recovery')&&el.innerHTML.includes('Fresh Releases'),'All three independently launchable');
assert(el.innerHTML.includes('Recent activity'),'Widget contains process notification center');
assert(el.innerHTML.includes('Start'),'Idle widget remains a quick launcher');
App.mf428ToggleSize();
assert.equal(S.settings.v428Background.compact,true);
assert.equal(el.dataset.size,'compact');
App.mf428SetPosition('left');
assert.equal(el.dataset.position,'left');
assert.equal(S.settings.v428Background.position,'left');
App.mf428SetNotifications(false);
assert.equal(S.settings.v428Background.notifications,false);
App.mf428SetNotifications(true);
App.mf428SetVisibility('hidden');
assert.equal(el,null,'Hidden mode removes widget without altering jobs');
App.mf428SetVisibility('auto');
assert.equal(el,null,'Automatic hides when no work requires attention');
App.mf428SetVisibility('always');
assert(el,'Always Show restores idle widget');
const stored=JSON.parse(store.getItem('mf428-background:mock')||'{}');
assert.equal(typeof stored,'object');
console.log('v428 Widget Phase 5 contracts passed: existing Settings grouping, visibility, responsive theme CSS, launcher, compact sizing, position, notification options');
