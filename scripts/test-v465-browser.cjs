/* Run v459 desktop/mobile Chromium recovery suite and preserve v462-v464
 * dedicated probes, plus v465 label + Seasonal-only visibility regression.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v465.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='465'")
 .replaceAll("'v459-browser-smoke'","'v465-browser-smoke'");
const extract=(file,re)=>{const s=fs.readFileSync(path.join(__dirname,file),'utf8'),hit=s.match(re);
 assert(hit,'Missing previous version probe: '+file);return hit[1];};
const early462=extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/);
const title463=extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/);
const rating464=extract('test-v464-browser.cjs',/const probe=`(   const rating464=[\s\S]*?)`;/);
const probe=`   const label465=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV465;if(!api)return {error:'v465 module missing'};const fake={status:'fresh',count:1,available:2,progress:1,source:'Tenrai'};const markup=api.card(fake);const parent=document.createElement('div');parent.className='mf419-category-stats';parent.style.cssText='position:relative;width:min(100%,900px)';parent.innerHTML=markup;document.body.appendChild(parent);const tile=parent.querySelector('.mf463-fresh-stat'),p=parent.getBoundingClientRect(),t=tile.getBoundingClientRect(),label=tile.querySelector('span')?.textContent.trim();const result={version:api.version,label,count:tile.querySelector('strong')?.textContent,details:tile.querySelector('small')?.textContent,inside:t.left>=p.left-1&&t.right<=p.right+1,overflow:document.documentElement.scrollWidth>innerWidth+6};parent.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v465 fresh card:',JSON.stringify(label465));
   assert(!label465.error&&label465.version===465&&label465.label==='Fresh episodes left'&&label465.count==='1'&&label465.details.includes('Tenrai')&&label465.inside&&!label465.overflow,
     'v465 fresh card must use short text and fit both desktop/mobile');
`;
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'v459 historical browser insertion point changed');
code=code.replace(marker,early462+'\n'+title463+'\n'+rating464+'\n'+probe+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
