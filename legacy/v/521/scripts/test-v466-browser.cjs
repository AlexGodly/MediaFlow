/* Reuse v459 Chromium regression with v462–v465 feature probes, then v466 UI. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v466.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='466'")
 .replaceAll("'v459-browser-smoke'","'v466-browser-smoke'");
const extract=(f,re)=>{const t=fs.readFileSync(path.join(__dirname,f),'utf8');
 const m=t.match(re);assert(m,'Required regression probe '+f);return m[1];};
const old462=extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/);
const old463=extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/);
const old464=extract('test-v464-browser.cjs',/const probe=`(   const rating464=[\s\S]*?)`;/);
const old465=extract('test-v465-browser.cjs',/const probe=`(   const label465=[\s\S]*?)`;/);
const next466=`   const auto466=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV466;if(!api)return {error:'v466 module missing'};const settings=api.settings();const card=api.status({id:'browser-test'});const shell=document.createElement('div');shell.className='mf419-recommend-card';shell.style.cssText='position:relative;width:min(100%,900px);box-sizing:border-box';shell.innerHTML=card;document.body.appendChild(shell);const node=shell.querySelector('.mf466-refresh'),outer=shell.getBoundingClientRect(),box=node.getBoundingClientRect();const result={version:api.version,button:!!node.querySelector('button.mf466-now'),status:!!node.querySelector('[role=status]'),defaultHours:api.prefs().hours,settings:settings.includes('Every 24 hours')&&settings.includes('Refresh verified external ratings'),inside:box.left>=outer.left-2&&box.right<=outer.right+2,overflow:document.documentElement.scrollWidth>innerWidth+6};shell.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v466 periodic metadata controls:',JSON.stringify(auto466));
   assert(!auto466.error&&auto466.version===466&&auto466.button&&auto466.status&&auto466.settings&&auto466.inside&&!auto466.overflow,
     'v466 automatic refresh UI must fit desktop and 360px mobile');
`;
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Historical Chromium regression insertion moved');
code=code.replace(marker,old462+'\n'+old463+'\n'+old464+'\n'+old465+'\n'+next466+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
