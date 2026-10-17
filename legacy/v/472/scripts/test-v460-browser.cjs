/* v460 Chromium checks: reuse v459's extensive regression and add dock-shortcut verification. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v460.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='460'")
 .replaceAll("'v459-browser-smoke'","'v460-browser-smoke'");
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Original smoke test insertion point must exist');
const probe=`   const quick460=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV460;if(!api)return {error:'v460 module missing'};const root=document.createElement('div');root.innerHTML=api.menuMarkup();const fan=root.querySelector('#mf397-fan'),buttons=[...fan.querySelectorAll('button[data-action]')];const names=buttons.map(b=>b.dataset.action),meta=buttons.filter(b=>b.dataset.action==='metadataRecovery'),widget=buttons.filter(b=>b.dataset.action==='backgroundProcessesVisibility');return {version:api.version,total:buttons.length,meta:meta.length,widget:widget.length,order:names,unified:meta[0]?.textContent.includes('New Metadata Recovery'),text:widget[0]?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+6}}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v460 floating actions:',JSON.stringify(quick460));
   assert(!quick460.error&&quick460.version===460&&quick460.meta===1&&quick460.widget===1&&quick460.total===7,
     'v460 must have exactly one Metadata Recovery and one widget visibility shortcut');
   assert(quick460.order.join(',')==='logging,library,collection,coverRecovery,metadataRecovery,bothRecovery,backgroundProcessesVisibility'&&quick460.unified&&!quick460.overflow,
     'Floating shortcut order and layout must remain correct on desktop and narrow mobile');
`;
code=code.replace(marker,probe+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
