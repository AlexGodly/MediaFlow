/* MediaFlow v436 — selection scope, floating actions, icons and XP defaults. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(read('VERSION').trim(),'436');
const constant=read('src/js/core/constants/001-constants.js');
const source=read('src/js/components/315-v436-selected-recovery-shortcut.js');
const runtime=read('src/js/runtime-order.json');
const editor=read('src/js/components/273-v377-ids-editor-jikan-recovery.js');
const ids=read('src/js/components/314-v434-provider-connection.js');
const scoped=read('src/js/components/310-v425-cover-recovery-integration.js');
const css=read('assets/css/245-v436-recovery-shortcut.css');
assert(constant.includes('rotationMultiplier: {neglected:10, due:8, healthy:5, overused:2}'),'XP rotation defaults updated');
assert(!editor.includes('onclick="App.v377VerifyMalId()"'),'Remove MAL Verify field button');
assert(ids.includes('mf436-find-ids" data-v225-icon="search" data-v225-iconified="1"'),'Find IDs search icon must render exactly once');
assert(scoped.includes("title:'COVER RECOVERY'"),'Settings title uses all-caps matching Library Maintenance');
assert(css.includes('font-size:13px;font-weight:800;text-transform:uppercase'),'Settings header matches existing section title scale');
assert(runtime.includes('315-v436-selected-recovery-shortcut.js'),'Runtime extension included');
assert(source.includes("MF425.locked=false"),'Selected titles are not forcibly locked in scope');
assert(source.includes("if(MF425.oneId)return initial"),'Single-title recovery remains locked');
assert(source.includes('data-action="coverRecovery"'),'Fourth floating shortcut added');
assert(source.includes("App.mf425OpenConfig('floating')"),'Shortcut launches existing recovery configuration, not a job');
assert(!source.includes('App.mf424Start()'),'Opening shortcut never starts recovery');
const fake={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,Promise,window:{},
 S:{library:[{id:'1',title:'One',coverUrl:''},{id:'2',title:'Two',coverUrl:'cover'},{id:'3',title:'Three',coverUrl:''}],librarySelection:{'1':true,'2':true}},
 MF425:{selected:[],oneId:'',locked:false},MF424:{ready:true},
 MF397:{open:false},AUTH_USER:{id:'test'},
 mfSelectedIds:()=>['1','2','1','orphan'],
 mf425InitialScope:(entry,id)=>{fake.MF425.oneId=id;fake.MF425.locked=!!id;return id?'single':'all';},
 mf425ScopeFields:()=>'<section><div class="mf425-categories" id="mf425-categories"></div></section>',
 mf425ScopeChange:()=>{},
 mf425Counts:(scope)=>({eligible:scope.ids?.filter(x=>x!=='2').length||0}),
 mf425Icon:()=>'<svg></svg>',mf425Esc:x=>String(x),
 mf397Markup:()=>'<div class="mf397-fan">\n      </div>\n      <button type="button" id="mf397-fab"></button>',
 mf397Action:()=>{},mf397SetMenu:()=>{},showToast:()=>{},
 App:{mf425OpenConfig:entry=>{fake.lastEntry=entry}},
 document:{getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null}
};
vm.createContext(fake);vm.runInContext(source,fake);
const evalJs=q=>vm.runInContext(q,fake);
assert.equal(evalJs('window.MediaFlowV436.version'),436);
assert.equal(evalJs('mf436SelectedLibraryIds().length'),2,'Duplicate and nonexistent IDs excluded');
assert.equal(evalJs("mf425InitialScope('floating','')"),'selected','Floating action detects checked titles');
assert.equal(fake.MF425.locked,false,'User may choose All Library');
assert.equal(evalJs('MF425.selected.length'),2);
assert(evalJs('mf425ScopeFields()').includes('2 selected titles'),'Selected count and review rendered');
assert(evalJs('mf397Markup()').includes('New Cover Recovery'),'Fourth action is actually rendered');
evalJs("mf397Action('coverRecovery')");assert.equal(fake.lastEntry,'floating','Shortcut opens existing popup');
assert.equal(evalJs("mf425InitialScope('editor','1')"),'single','Single title editor remains protected');
const large=Array.from({length:100000},(_,i)=>({id:String(i),title:'Work '+i,coverUrl:''}));
fake.S.library=large;fake.S.librarySelection={'99999':true,'99998':true,'bad':true};
fake.mfSelectedIds=()=>['99999','99999','99998'];
assert.equal(evalJs('mf436SelectedLibraryIds().length'),2,'100k Library IDs are deduplicated');
console.log('PASS v436: defaults, matching headings/icons, checked selections, manual scope override, floating shortcut, 100k titles');
