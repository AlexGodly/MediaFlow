/* MediaFlow v428: no-network/no-user-data contract checks. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const mods=['312-v428-background-hub','313-v428-metadata-fixer','314-v428-fresh-releases'];
const root='src/js/components/';
const css=fs.readFileSync('assets/css/239-v428-background-recovery.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
const registry=JSON.parse(fs.readFileSync('src/js/providers/v428-provider-registry.json','utf8'));
assert.equal(registry.version,428);
assert(registry.providers.length>=45);
assert(registry.providers.every(p=>p.enabled===false&&p.publicUi===false));
assert(registry.providers.filter(p=>p.requiresSetup).length>=20);
assert(!JSON.stringify(registry).match(/(sk-|ghp_|eyJhbGciOi)/),'No credentials in registry');
const bodies=mods.map(name=>{const s=fs.readFileSync(root+name+'.js','utf8');new vm.Script(s,{filename:name});assert(order.includes('components/'+name+'.js'));return s;});
assert(css.includes('var(--flow'),'Inherit theme accent');
assert(css.includes('@media(max-width:380px)'),'Very narrow screen layout');
assert(css.includes('prefers-reduced-motion'),'Motion accessibility');
assert(index.includes('239-v428-background-recovery.css'),'Theme entry in HTML');
assert(bodies[0].includes('mf428-background:'),'Account-scoped queue');
assert(bodies[0].includes('leaseKey'),'Cross-tab coordination');
assert(bodies[0].includes('cooldownUntil'),'Inter-feature cooldown');
assert(bodies[0].includes('registerFresh'),'Fresh scanner registration');
assert(bodies[0].includes("runLegacyFresh"),'Original anime engine must remain usable');
assert(['hidden','auto','always'].every(x=>bodies[0].includes(x)));
assert(bodies[1].includes('mf428MetadataOpen'),'Per-title entry point');
assert(bodies[1].includes('mf428-library-metadata'),'Library bulk entry point');
assert(bodies[1].includes('mf428-settings-group'),'Settings group');
assert(bodies[1].includes('M.job.reviews'),'Queued human review');
assert(bodies[1].includes('await saveState()'),'Persist before reporting save');
assert(bodies[1].includes("account()!==M.job?.account"),'Prevent cross-account writes');
assert(bodies[2].includes('v401EpisodeOutcome'),'Keep existing anime Smart Engine evidence');
assert(bodies[2].includes('tvmaze')&&bodies[2].includes('episodate')&&bodies[2].includes('mangadex'));
assert(bodies[2].includes("status:'unknown'"),'No false zero for unsupported providers');
assert(bodies[2].includes('window.MediaFlowV428Hub?.registerFresh(worker)'));
const events=[];
const sandbox={
 window:{addEventListener(){},MediaFlowV428Hub:null},
 document:{readyState:'loading',body:null,addEventListener(n,fn){events.push(n);}},
 App:{},S:{settings:{},library:[],categories:[],librarySelection:{}},
 AUTH_USER:{id:'mock-account'},
 mf424Run:function(){},v377RunJikan:async function(){return {complete:true};},
 MF424:{job:null,running:false},
 MediaFlowRuntime:{registerPageEnhancer(){}},
 libraryModalHtml:()=>'<div class="mf425-editor-tools"><button>Cover</button></div>',
 renderLibrary:()=>'<div class="mf425-tools-button">Cover</div>',
 localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null;},setItem(k,v){this.data.set(k,v);},removeItem(k){this.data.delete(k);}},
 persistSettings:()=>Promise.resolve(),saveState:()=>Promise.resolve(),showToast:()=>{},
 setTimeout,clearTimeout,setInterval:()=>0,clearInterval:()=>{},
 indexedDB:{open(){throw Error('No DB in VM');}},Date,Math,JSON,console,Event:function(){}
};
sandbox.window.window=sandbox.window;
const context=vm.createContext(sandbox);
for(const source of bodies)vm.runInContext(source,context,{timeout:2500});
assert.equal(typeof sandbox.App.mf428Start,'function');
assert.equal(typeof sandbox.App.mf428MetadataOpen,'function');
assert.equal(typeof sandbox.App.mf428FreshOpen,'function');
assert.equal(typeof sandbox.window.MediaFlowV428Hub?.enqueue,'function');
assert.equal(typeof sandbox.window.MediaFlowV428Metadata?.progress,'function');
assert.equal(typeof sandbox.window.MediaFlowV428Fresh?.progress,'function');
sandbox.App.mf428SetVisibility('always');
assert.equal(sandbox.S.settings.v428Background.visibility,'always');
sandbox.App.mf428SetVisibility('hidden');
assert.equal(sandbox.S.settings.v428Background.visibility,'hidden');
const libraryHtml=sandbox.renderLibrary();
assert(libraryHtml.includes('mf428-library-metadata'));
const editorHtml=sandbox.libraryModalHtml();
assert(editorHtml.includes('mf428-edit-action'));
console.log('v428 contracts OK: source syntax, settings, private registry, Library/editor hooks, adapter architecture, Smart Engine preservation');
