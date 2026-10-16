/* v462 runs the full v459 browser recovery regression against v462,
 * with additional first-paint and saved placement verification.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v462.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='462'")
 .replaceAll("'v459-browser-smoke'","'v462-browser-smoke'");
const marker='   const dock=await cdp.evaluate(';
const probe=`   const fresh462=await cdp.evaluate("(async()=>{const api=window.MediaFlowV462;if(!api)return {error:'v462 module missing'};let result={};const prev={auth:AUTH_USER,ready:AUTH_READY,loading:S.loading,settings:S.settings,guard:V115_STARTUP_GUARD};const app=document.getElementById('app');const fake=document.createElement('div');fake.className='sidebar';try{api.suspend();AUTH_USER={id:'v462-test'};AUTH_READY=true;S.loading=true;V115_STARTUP_GUARD=true;S.settings=null;app.appendChild(fake);mf441Paint();result.early=document.getElementById('mf441-process-widget')===null&&!api.isReady();S.settings={v441RecoveryUI:{visibility:'hidden',position:'left',expanded:false,showFinished:false}};S.loading=false;V115_STARTUP_GUARD=false;api.reveal();await new Promise(ok=>setTimeout(ok,110));result.hidden=document.getElementById('mf441-process-widget')===null&&api.isReady();S.settings.v441RecoveryUI.visibility='always';mf441Paint();let node=document.getElementById('mf441-process-widget');result.left=!!node&&node.classList.contains('mf441-position-left')&&node.classList.contains('mf462-ready');result.position=(node&&getComputedStyle(node).left!=='auto'&&getComputedStyle(node).right==='auto');result.overflow=document.documentElement.scrollWidth>innerWidth+6;return result}catch(e){return {error:String(e.stack||e)}}finally{api.suspend();AUTH_USER=prev.auth;AUTH_READY=prev.ready;S.loading=prev.loading;S.settings=prev.settings;V115_STARTUP_GUARD=prev.guard;fake.remove()}})()");
   console.log(d.label+' v462 first-paint recovery widget:',JSON.stringify(fresh462));
   assert(!fresh462.error&&fresh462.early&&fresh462.hidden&&fresh462.left&&fresh462.position&&!fresh462.overflow,
     'v462 must suppress pre-hydration widget and honor Hidden/Left prefs on its first visible paint');
`;
assert(code.includes(marker));
code=code.replace(marker,probe+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
