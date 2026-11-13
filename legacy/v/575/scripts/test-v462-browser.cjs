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
const probe=`   const fresh462=await cdp.evaluate("(()=>{const api=window.MediaFlowV462,workspace=window.MediaFlowV441;if(!api||!workspace)return {error:'Recovery widget modules missing'};const result={};let fake;try{api.suspend();workspace.paint();result.early=document.getElementById('mf441-process-widget')===null&&!api.isReady()&&!api.canDisplay();const state={activeCount:0,cover:null,metadata:null,coverPct:0,metaPct:0};const source=workspace.widget({visibility:'always',position:'left',expanded:false,showFinished:false},state);const shell=document.createElement('div');shell.innerHTML=source;fake=shell.firstElementChild;document.body.appendChild(fake);result.before=getComputedStyle(fake).visibility==='hidden';fake.classList.add('mf462-ready');const style=getComputedStyle(fake);result.left=fake.classList.contains('mf441-position-left')&&style.visibility==='visible';result.position=Math.abs(fake.getBoundingClientRect().left-(innerWidth<=450?9:16))<5;result.overflow=document.documentElement.scrollWidth>innerWidth+6;return result}catch(e){return {error:String(e.stack||e)}}finally{fake?.remove()}})()");
   console.log(d.label+' v462 first-paint recovery widget:',JSON.stringify(fresh462));
   assert(!fresh462.error&&fresh462.early&&fresh462.before&&fresh462.left&&fresh462.position&&!fresh462.overflow,
     'v462 must hide any premature paint and apply the restored position before the widget becomes visible');
`;
assert(code.includes(marker));
code=code.replace(marker,probe+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
