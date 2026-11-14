/* Reuse v460 Chromium recovery regression, plus a live semantic-icon/layout probe. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v460-browser.cjs');
let wrapper=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v460.bundle.js','mediaflow-v461.bundle.js')
 .replaceAll('"result?.v===\'460\'"','"result?.v===\'461\'"')
 .replaceAll("'v460-browser-smoke'","'v461-browser-smoke'");
const extra=`   const widget461=await cdp.evaluate("(()=>{try{const root=document.createElement('div');root.innerHTML=window.MediaFlowV460.menuMarkup();const btn=root.querySelector('.mf460-widget-action');if(!btn)return {error:'Widget action unavailable'};const sheet=document.createElement('div');sheet.className='mf397-fan open';sheet.style.cssText='position:fixed;left:8px;top:8px;bottom:auto;right:auto;width:min(318px,calc(100vw - 16px));height:auto;max-height:none;transform:none;overflow:visible;visibility:visible;z-index:9999';sheet.appendChild(btn);document.body.appendChild(sheet);App.v225EnhanceButtonIcons(sheet);App.v226RefreshSemanticButtonIcons(sheet);const count=btn.querySelectorAll(':scope > .v225-btn-icon').length,eye=btn.querySelectorAll(':scope > .mf397-action-symbol svg').length,overflow=btn.scrollWidth>btn.clientWidth+2,text=btn.querySelector('strong')?.textContent||'';const noDuplicate=window.MediaFlowV461?.version===461;sheet.remove();return {count,eye,overflow,text,noDuplicate}}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v461 background shortcut:',JSON.stringify(widget461));
   assert(!widget461.error&&widget461.noDuplicate&&widget461.count===0&&widget461.eye===1&&!widget461.overflow,'Shortcut must have one eye, an unclipped action label and no extra semantic icon');
`;
assert(wrapper.includes('code=code.replace(marker,probe+marker);'),'v460 browser regression injection point');
wrapper=wrapper.replace('code=code.replace(marker,probe+marker);','code=code.replace(marker,probe+'+JSON.stringify(extra)+'+marker);');
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(wrapper,filename);
