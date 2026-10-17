/* Browser v464 includes the full v463/v462/v459 Chromium regression suite. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v463-browser.cjs');
let wrapper=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v463.bundle.js','mediaflow-v464.bundle.js')
 .replaceAll("\"result?.v==='463'\"","\"result?.v==='464'\"")
 .replaceAll("'v463-browser-smoke'","'v464-browser-smoke'");
const extra=`   const ext464=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV464;if(!api)return {error:'Missing MediaFlowV464'};const examples=[{key:'imdb',score:7.8,scale:10,votes:2354,source:'manual',attribution:'Entered manually'},{key:'rottentomatoes_critics',score:91,scale:100,votes:96,attribution:'Verified provider rating'},{key:'mal',score:8.4,scale:10,votes:999,attribution:'Verified match · jikan'}];const grid=document.createElement('div');grid.className='mf464-rating-grid';grid.style.cssText='position:relative;width:min(100%,900px)';grid.innerHTML=examples.map(api.score).join('');document.body.appendChild(grid);const box=grid.getBoundingClientRect();const tiles=[...grid.querySelectorAll('.mf464-rating')];const ok=tiles.every(el=>{const r=el.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.width>70});const sample={v:api.version,cards:tiles.length,scales:tiles.map(t=>t.querySelector('.mf464-rating-value')?.textContent.trim()),marks:grid.querySelectorAll('.mf450-source-mark').length,inside:ok,overflow:document.documentElement.scrollWidth>innerWidth+5};grid.remove();return sample}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v464 recommendation external ratings:',JSON.stringify(ext464));
   assert(!ext464.error&&ext464.v===464&&ext464.cards===3&&ext464.marks===3&&ext464.inside&&!ext464.overflow,
     'v464 provider ratings must preserve separate icons and responsive tiles on desktop and 360px phones');
`;
assert(wrapper.includes('wrapper=wrapper.replace('),'v463 browser adapter changed');
wrapper=wrapper.replace('wrapper=wrapper.replace(', 'wrapper=wrapper.replace('); // preserve nested v463 checks
assert(wrapper.includes('const extra='),'Expected v463 browser probe');
wrapper=wrapper.replace('const extra=', 'const extra='+JSON.stringify(extra)+'+');
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(wrapper,filename);
