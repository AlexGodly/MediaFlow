/* Reuse the full v462 Chromium desktop/mobile recovery suite against the v463 bundle;
 * also validate a theme-aware, responsive fresh-episodes recommendation tile.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v462-browser.cjs');
let wrapper=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v462.bundle.js','mediaflow-v463.bundle.js')
 .replaceAll('"result?.v===\'462\'"','"result?.v===\'463\'"')
 .replaceAll("'v462-browser-smoke'","'v463-browser-smoke'");
const extra=`   const fresh463=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV463;if(!api)return {error:'v463 module missing'};const sample={status:'fresh',count:11,available:12,progress:1,source:'AniList'};const card=api.card(sample);const parent=document.createElement('div');parent.className='mf419-category-stats';parent.style.cssText='position:relative;width:min(100%,900px)';parent.innerHTML='<section class=mf419-stat>Category remaining</section><section class=mf419-stat>Verified fresh remaining</section>'+card;document.body.appendChild(parent);const tile=parent.querySelector('.mf463-fresh-stat'),computed=getComputedStyle(tile),p=parent.getBoundingClientRect(),t=tile.getBoundingClientRect();const result={version:api.version,count:tile.querySelector('strong')?.textContent,title:tile.querySelector('span')?.textContent,detail:tile.querySelector('small')?.textContent,inside:t.left>=p.left-1&&t.right<=p.right+1,overflow:document.documentElement.scrollWidth>innerWidth+6,columns:getComputedStyle(parent).gridTemplateColumns};parent.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v463 recommended fresh remaining:',JSON.stringify(fresh463));
   assert(!fresh463.error&&fresh463.version===463&&fresh463.count==='11'&&fresh463.inside&&!fresh463.overflow,
     'v463 must render the recommended-title fresh count on desktop and 360px mobile without clipping');
`;
assert(wrapper.includes('code=code.replace(marker,probe+marker);'),'Expected v462 browser injection point');
wrapper=wrapper.replace('code=code.replace(marker,probe+marker);','code=code.replace(marker,probe+'+JSON.stringify(extra)+'+marker);');
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(wrapper,filename);
