/* v462 deterministic bootstrap/render regression for Background Processes. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'462');
const modules=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(modules.at(-1),'components/346-v462-background-widget-first-paint.js');
const source=fs.readFileSync('src/js/components/346-v462-background-widget-first-paint.js','utf8');
const css=fs.readFileSync('assets/css/267-v462-background-widget-first-paint.css','utf8');
const html=fs.readFileSync('index.html','utf8');
let appReady=false,paintCount=0,shellCount=0,widget=null;
let frames=[],present=true;
const body={classList:{remove(){},add(){}}};
const fakeDocument={
 body,
 querySelector(s){return s==='#app .sidebar'&&appReady?{}:null},
 getElementById(id){return id==='mf441-process-widget'?widget:null}
};
const context={
 window:{},document:fakeDocument,requestAnimationFrame(fn){frames.push(fn)},
 AUTH_USER:{id:'account-1'},AUTH_READY:true,V115_STARTUP_GUARD:true,
 S:{loading:true,settings:null},MediaFlowRuntime:{},
 mf441RefreshSettingsStatus(){},
 mf441Paint(){
  paintCount++;
  if(this.S.settings.v441RecoveryUI.visibility==='hidden'){widget=null;return;}
  const prefs=this.S.settings.v441RecoveryUI;
  widget={classes:['mf441-position-'+prefs.position],removed:false,
   remove(){this.removed=true;widget=null},
   classList:{add(name){widget.classes.push(name)}}};
 },
 renderShell(){shellCount++;appReady=true;},
 async v115SafeBootstrap(){return true},
 async v115StartWithData(){return true},
 renderAuthScreen(){appReady=false;return 'auth'}
};
vm.createContext(context);vm.runInContext(source,context,{filename:'v462.js'});
const api=context.window.MediaFlowV462;
assert.equal(api.version,462);
assert.equal(api.isReady(),false,'Widget begins suspended');
context.mf441Paint();
assert.equal(widget,null,'Early recovery paint may not show fallback right widget');
assert.equal(paintCount,0,'Existing paint is blocked until hydration');
context.S.settings={v441RecoveryUI:{visibility:'hidden',position:'left',expanded:true}};
context.S.loading=false;context.V115_STARTUP_GUARD=false;
context.renderShell();
assert.equal(shellCount,1);
assert.equal(paintCount,0,'No paint in the shell rendering frame');
assert.equal(frames.length,1);
frames.shift()();
assert.equal(paintCount,0,'Still hidden after first animation frame');
assert.equal(frames.length,1);
frames.shift()();
assert.equal(api.isReady(),true);
assert.equal(paintCount,1);
assert.equal(widget,null,'Last saved Hidden preference must remain hidden');
context.S.settings.v441RecoveryUI.visibility='always';
context.mf441Paint();
assert.equal(paintCount,2);
assert(widget.classes.includes('mf441-position-left'));
assert(widget.classes.includes('mf462-ready'));
api.suspend();
assert.equal(widget,null,'Suspend removes widget immediately');
context.S.settings.v441RecoveryUI.position='right';
context.renderShell();
frames.shift()();
api.suspend();
frames.shift()();
assert.equal(api.isReady(),false,'Old reveal frame must not beat a new bootstrap');
assert.equal(widget,null);
context.S.settings.v441RecoveryUI.position='left';
context.renderShell();
frames.shift()();frames.shift()();
assert.equal(api.isReady(),true);
assert(widget.classes.includes('mf441-position-left'),'Restored position must apply before display');
assert(!widget.classes.includes('mf441-position-right'),'No fallback right-position paint');
assert.match(css,/#mf441-process-widget:not\(\.mf462-ready\)/);
assert(html.includes('assets/css/267-v462-background-widget-first-paint.css'));
assert(html.includes('mediaflow-v462.bundle.js'));
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,462);
assert(!source.includes('mf441SaveSetting('),'Bootstrap fix may not overwrite user preferences');
assert(!source.includes('MF424.job='),'Bootstrap fix may not change cover recovery jobs');
assert(!source.includes('MF439.job='),'Bootstrap fix may not change metadata recovery jobs');
console.log('PASS v462: no early flash, restored hidden/left prefs, deferred shell paint and race-safe bootstrap');
