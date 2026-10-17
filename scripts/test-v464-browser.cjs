/* v464 runs all v463/v462 Chromium checks and extends source-score UI smoke. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v463-browser.cjs');
let script=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v463.bundle.js','mediaflow-v464.bundle.js')
 .replaceAll("result?.v==='463'","result?.v==='464'")
 .replaceAll("'v463-browser-smoke'","'v464-browser-smoke'");
const probe=`   const rating464=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV464;if(!api)return {error:'Missing MediaFlowV464'};const title={id:'demo',universalMetadata:{updatedAt:1,externalRatings:{imdb:{score:8.5,scale:10,votes:2500,source:'imdb'},goodreads:{score:4.5,scale:5,source:'manual'}},provenance:{'rating.imdb':{verified:true,source:'imdb'},'rating.goodreads':{verified:false,source:'manual'}}}};const ratings=api.ratings(title);const div=document.createElement('div');div.className='mf419-recommend-card';div.style.cssText='position:relative;width:min(100%,900px);box-sizing:border-box';div.innerHTML=api.tiles(title);document.body.appendChild(div);const card=div.querySelector('.mf464-recommend-ratings'),a=div.getBoundingClientRect(),b=card.getBoundingClientRect(),text=card.textContent;const result={version:api.version,verified:ratings.verifiedCount,normalized:Math.round(ratings.average),tiles:div.querySelectorAll('.mf464-rating-tile').length,labels:text.includes('Verified provider')&&text.includes('Manually entered'),scores:text.includes('8.5')&&text.includes('2,500 votes'),settings:api.settings().includes('Off · existing ranking unchanged'),inside:b.left>=a.left-2&&b.right<=a.right+2,overflow:document.documentElement.scrollWidth>innerWidth+6};div.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v464 external ratings:',JSON.stringify(rating464));
   assert(!rating464.error&&rating464.version===464&&rating464.verified===1&&rating464.normalized===85&&rating464.tiles===2&&rating464.labels&&rating464.scores&&rating464.settings&&rating464.inside&&!rating464.overflow,
     'External rating original scales/provenance must fit desktop and 360px mobile');
`;
const needle='const extra=`';
assert(script.includes(needle),'v463 browser layout injection changed');
script=script.replace(needle,'const extra464='+JSON.stringify(probe)+';\n'+needle);
const signature="'+JSON.stringify(extra)+'+marker);";
assert(script.includes(signature),'v463 regression chaining hook changed');
script=script.replace(signature,"'+JSON.stringify(extra)+'+JSON.stringify(extra464)+'+marker);");
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(script,filename);
