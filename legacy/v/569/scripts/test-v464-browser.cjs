/* Run the historical v459 Chromium browser suite directly against v464,
 * adding v462 startup, v463 fresh episodes, and v464 rating checks.
 * Avoid nested version-wrapper substitutions: every old version assertion must
 * resolve to v464 at the outermost base script.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v464.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='464'")
 .replaceAll("'v459-browser-smoke'","'v464-browser-smoke'");
const extract=(filepath,expression)=>{
 const text=fs.readFileSync(path.join(__dirname,filepath),'utf8');
 const match=text.match(expression);
 assert(match,filepath+' historical probe must exist');
 return match[1];
};
const early462=extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/);
const title463=extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/);
const probe=`   const rating464=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV464;if(!api)return {error:'Missing MediaFlowV464'};const title={id:'demo',universalMetadata:{updatedAt:1,externalRatings:{imdb:{score:8.5,scale:10,votes:2500,source:'imdb'},goodreads:{score:4.5,scale:5,source:'manual'}},provenance:{'rating.imdb':{verified:true,source:'imdb'},'rating.goodreads':{verified:false,source:'manual'}}}};const ratings=api.ratings(title);const div=document.createElement('div');div.className='mf419-recommend-card';div.style.cssText='position:relative;width:min(100%,900px);box-sizing:border-box';div.innerHTML=api.tiles(title);document.body.appendChild(div);const card=div.querySelector('.mf464-recommend-ratings'),a=div.getBoundingClientRect(),b=card.getBoundingClientRect(),text=card.textContent;const result={version:api.version,verified:ratings.verifiedCount,normalized:Math.round(ratings.average),tiles:div.querySelectorAll('.mf464-rating-tile').length,labels:text.includes('Verified provider')&&text.includes('Manually entered'),scores:text.includes('8.5')&&text.includes('2,500 votes'),settings:api.settings().includes('Off · existing ranking unchanged'),inside:b.left>=a.left-2&&b.right<=a.right+2,overflow:document.documentElement.scrollWidth>innerWidth+6};div.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v464 external ratings:',JSON.stringify(rating464));
   assert(!rating464.error&&rating464.version===464&&rating464.verified===1&&rating464.normalized===85&&rating464.tiles===2&&rating464.labels&&rating464.scores&&rating464.settings&&rating464.inside&&!rating464.overflow,
     'External rating original scales/provenance must fit desktop and 360px mobile');
`;
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Historical browser insertion point changed');
code=code.replace(marker,early462+'\n'+title463+'\n'+probe+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
