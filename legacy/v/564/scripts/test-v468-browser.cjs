/* v468 Chromium runs all v462–v467 regressions then tests dual modes,
 * Advanced workspace rendering and desktop/360px mobile layout.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v468.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='468'")
 .replaceAll("'v459-browser-smoke'","'v468-browser-smoke'");
const extract=(f,re)=>{const text=fs.readFileSync(path.join(__dirname,f),'utf8');
 const m=text.match(re);assert(m,'Missing historical regression '+f);return m[1];};
const probes=[
 extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/),
 extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/),
 extract('test-v464-browser.cjs',/const probe=`(   const rating464=[\s\S]*?)`;/),
 extract('test-v465-browser.cjs',/const probe=`(   const label465=[\s\S]*?)`;/),
 extract('test-v466-browser.cjs',/const next466=`(   const auto466=[\s\S]*?)`;/),
 extract('test-v467-browser.cjs',/const probe=`(   const logos467=[\s\S]*?)`;/)
];
const newProbe=`   const engine468=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV468,ui=window.MediaFlowV468Interface;if(!api||!ui)return {error:'v468 APIs missing'};const picker=ui.picker('settings');const advanced=ui.settings();const workspace=ui.workspace();const el=document.createElement('div');el.style.cssText='width:min(100%,1000px);max-width:100%;box-sizing:border-box;position:relative';el.innerHTML=picker+advanced+workspace;document.body.appendChild(el);const pickerNode=el.querySelector('.mf468-engine-select'),advancedNode=el.querySelector('.mf468-options'),stats=el.querySelectorAll('.mf468-summary-stat'),buttons=el.querySelector('.mf468-workspace-actions'),bounds=el.getBoundingClientRect();const result={version:api.version,legacy:api.system()==='legacy',options:pickerNode?.querySelectorAll('input[type=radio]').length,advancedConfig:!!advancedNode,stats:stats.length,actions:!!buttons,inside:bounds.left>=-2&&bounds.right<=innerWidth+3,overflow:el.scrollWidth>el.clientWidth+4,screenOverflow:document.documentElement.scrollWidth>innerWidth+6};el.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v468 dual-engine UI:',JSON.stringify(engine468));
   assert(!engine468.error&&engine468.version===468&&engine468.legacy&&engine468.options===2&&engine468.advancedConfig&&engine468.stats===6&&engine468.actions&&engine468.inside&&!engine468.overflow&&!engine468.screenOverflow,
    'v468 Legacy/Advanced selectors, workspace and controls fit desktop and 360px mobile');
`;
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Chromium insertion point moved');
code=code.replace(marker,probes.join('\n')+'\n'+newProbe+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;
run.paths=Module._nodeModulePaths(path.dirname(filename));
run._compile(code,filename);
