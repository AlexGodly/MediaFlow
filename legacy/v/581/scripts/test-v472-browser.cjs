/* v469 Chromium geometry checks for responsive Background Processes launcher.
 * Preserve all historical v462–v468 browser probes, then stress mobile layout.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v472.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='472'")
 .replaceAll("'v459-browser-smoke'","'v472-browser-smoke'");
const extract=(f,re)=>{const src=fs.readFileSync(path.join(__dirname,f),'utf8');
 const hit=src.match(re);assert(hit,'Missing historical regression '+f);return hit[1];};
const probes=[
 extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/),
 extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/),
 extract('test-v464-browser.cjs',/const probe=`(   const rating464=[\s\S]*?)`;/),
 extract('test-v465-browser.cjs',/const probe=`(   const label465=[\s\S]*?)`;/),
 extract('test-v466-browser.cjs',/const next466=`(   const auto466=[\s\S]*?)`;/),
 extract('test-v467-browser.cjs',/const probe=`(   const logos467=[\s\S]*?)`;/),
 extract('test-v468-browser.cjs',/const newProbe=`(   const engine468=[\s\S]*?)`;/)
];
const expression=`(()=>{try{
 const api=window.MediaFlowV469,prev=window.MediaFlowV441;
 if(!api||!prev)return {error:'Missing v469 or v441 browser module'};
 const oldWidget=document.getElementById('mf441-process-widget'),
  oldDock=document.getElementById('mf397-dock');
 if(oldWidget||oldDock)return {error:'Browser smoke requires isolated unsigned-in dock, cannot replace signed-in user controls'};
 const widgetMarkup=prev.widget({visibility:'always',position:'right',expanded:true,showFinished:false},
  {cover:null,metadata:null,coverPct:0,metaPct:0,activeCount:0});
 const container=document.createElement('div');
 container.id='mf469-test-elements';
 container.innerHTML=widgetMarkup+
  '<section class="mf397-dock" id="mf397-dock"><div class="mf397-plus-holder">'+
  '<button id="mf397-fab" class="mf397-fab" aria-label="Open quick actions">+</button>'+
  '<div class="mf397-fan" id="mf397-fan"></div></div>'+
  '<section id="mf397-progress" class="mf397-progress compact">'+
  '<div class="mf397-head">Task progress</div><div class="mf397-main">3 episodes logged</div>'+
  '<div class="mf397-bottom">Complete</div></section></section>';
 document.body.append(container);
 const widget=document.getElementById('mf441-process-widget');
 widget.classList.add('mf462-ready');
 const plus=document.getElementById('mf397-fab');
 const task=document.getElementById('mf397-progress'),fan=document.getElementById('mf397-fan');
 const intersect=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 const mobile=api.mobile();
 const compact=api.layout(),small=widget.getBoundingClientRect(),dock=document.getElementById('mf397-dock').getBoundingClientRect();
 const compactClear=!mobile||!intersect(small,dock);
 task.classList.remove('compact');task.style.minHeight='160px';
 const expanded=api.layout(),wide=widget.getBoundingClientRect(),taskBox=task.getBoundingClientRect();
 const hidden=widget.classList.contains('mf469-no-room');
 const expandedClear=!mobile||hidden||(!intersect(wide,taskBox)&&!intersect(wide,dock));
 const capped=hidden||!mobile||wide.bottom<=Math.min(dock.top,taskBox.top)-5;
 const scroller=widget.querySelector('.mf441-widget-content');
 const scrollable=!!scroller&&getComputedStyle(scroller).overflowY==='auto';
 fan.classList.add('open');api.layout();
 const menuHidden=!mobile||getComputedStyle(widget).visibility==='hidden';
 fan.classList.remove('open');api.layout();
 const menuReturn=!mobile||getComputedStyle(widget).visibility!=='hidden'||widget.classList.contains('mf469-no-room');
 widget.classList.replace('mf441-position-right','mf441-position-left');api.layout();
 const leftBox=widget.getBoundingClientRect();
 const leftPlacement=!mobile||leftBox.left<=18;
 const xoverflow=document.documentElement.scrollWidth>innerWidth+6;
 const actualTop=getComputedStyle(widget).top;
 const result={version:api.version,mobile,compactClear,expandedClear,capped,scrollable,menuHidden,menuReturn,
  leftPlacement,xoverflow,actualTop,room:expanded.room,hidden,compactTop:small.top,taskTop:taskBox.top};
 container.remove();
 document.body.classList.remove('mf469-actions-open');
 return result;
 }catch(e){document.getElementById('mf469-test-elements')?.remove();document.body.classList.remove('mf469-actions-open');return {error:String(e.stack||e)}}})()`;
const extra=`   const mobile469=await cdp.evaluate(${JSON.stringify(expression)});
   console.log(d.label+' v469 background processes clearance:',JSON.stringify(mobile469));
   assert(!mobile469.error&&mobile469.version===469&&mobile469.compactClear&&mobile469.expandedClear&&mobile469.capped&&mobile469.scrollable&&mobile469.menuHidden&&mobile469.menuReturn&&mobile469.leftPlacement&&!mobile469.xoverflow,
     'v469 background widget must not overlap mobile task/+ dock at '+d.width+'px');
`;
const extraWidths=`   if(d.label==='mobile') {
     for(const size of [{width:320,height:640},{width:390,height:760},{width:720,height:560},{width:360,height:420}]) {
       await cdp.send('Emulation.setDeviceMetricsOverride',{width:size.width,height:size.height,deviceScaleFactor:1,mobile:true});
       const row=await cdp.evaluate(${JSON.stringify(expression)});
       console.log('v469 mobile stress '+size.width+'x'+size.height,JSON.stringify(row));
       assert(!row.error&&row.version===469&&row.compactClear&&row.expandedClear&&row.capped&&row.scrollable&&row.menuHidden&&row.menuReturn&&row.leftPlacement&&!row.xoverflow,
         'v469 floating controls must not overlap at '+size.width+'x'+size.height);
     }
     await cdp.send('Emulation.setDeviceMetricsOverride',{width:d.width,height:d.height,deviceScaleFactor:1,mobile:true});
   }
`;
const showcase471="   const gallery471=await cdp.evaluate(\"(()=>{let mount=null;try{\\n const app=window.MediaFlowV471;\\n if(!app||typeof App?.mf471SyncShowcase!=='function')return {error:'Missing v471 Showcase runtime'};\\n mount=document.createElement('div');mount.className='mf274-collections-browser';\\n mount.style.cssText='position:fixed;left:0;top:-2000px;width:min(95vw,1060px);max-width:100%;z-index:-1;';\\n const posters=Array.from({length:12},(_,i)=>'<span class=\\\"mf471-showcase-poster\\\" data-cover-index=\\\"'+i+'\\\"><span class=\\\"mf471-showcase-fallback\\\">'+(i+1)+'</span></span>').join('');\\n mount.innerHTML='<article class=\\\"mf418-browser-entry mf418-browser-showcase mf471-showcase-entry\\\">'+\\n '<div class=\\\"mf276-showcase-cover mf471-showcase-frame\\\"><div class=\\\"mf471-showcase-strip\\\" style=\\\"--mf471-count:12\\\">'+posters+'</div>'+\\n '<button class=\\\"mf471-showcase-arrow mf471-prev\\\"></button><button class=\\\"mf471-showcase-arrow mf471-next\\\"></button></div>'+\\n '<div class=\\\"mf418-browser-copy\\\"><p>Showcase Collection</p></div><div class=\\\"mf418-browser-actions\\\"></div></article>';\\n document.body.appendChild(mount);\\n const frame=mount.querySelector('.mf471-showcase-frame'),strip=mount.querySelector('.mf471-showcase-strip');\\n App.mf471SyncShowcase(frame);\\n const slices=Array.from(mount.querySelectorAll('.mf471-showcase-poster'));\\n const a=frame.getBoundingClientRect(),s=strip.getBoundingClientRect();\\n const rectangles=slices.map(el=>el.getBoundingClientRect());\\n const allPresent=slices.length===12,edgeToEdge=rectangles.every((r,i)=>i===0||r.left-rectangles[i-1].right<1&&r.left-rectangles[i-1].right>-4);\\n const fullWidth=Math.abs(a.width-s.width)<3&&a.width>90;\\n const stripsHeight=s.height>=rectangles[0].height&&(s.height-rectangles[0].height)<26;\\n const overflow=strip.scrollWidth>strip.clientWidth+2;\\n const next=frame.querySelector('.mf471-next'),previous=frame.querySelector('.mf471-prev');\\n const nextReady=overflow&&!next.disabled&&previous.disabled;\\n const pageOverflow=document.documentElement.scrollWidth>window.innerWidth+6;\\n const gallery=mount.querySelector('.mf471-showcase-entry');\\n const stacked=window.innerWidth<=680?\\n   mount.querySelector('.mf418-browser-copy').getBoundingClientRect().top>=a.bottom-1:\\n   mount.querySelector('.mf418-browser-copy').getBoundingClientRect().left>=a.right-2;\\n const out={version:app.version,count:slices.length,fullWidth,edgeToEdge,stripsHeight,overflow,nextReady,stacked,\\n  pageOverflow,viewWidth:window.innerWidth,artWidth:a.width,scrollWidth:strip.scrollWidth};\\n mount.remove();\\n return out;\\n }catch(e){mount?.remove();return {error:String(e.stack||e)}}})()\");\n   console.log(d.label+' v471 Showcase collage:',JSON.stringify(gallery471));\n   assert(!gallery471.error&&gallery471.version===471&&gallery471.count===12&&gallery471.fullWidth&&gallery471.edgeToEdge&&gallery471.stripsHeight&&gallery471.overflow&&gallery471.nextReady&&gallery471.stacked&&!gallery471.pageOverflow,\n     'v471 Showcase art must be responsive, continuous, scrollable, and wider than 4 covers');\n";
const depth472="   const depth472=await cdp.evaluate(\"(()=>{try{\\n const previous=document.getElementById('mf472-hover-fixture');previous?.remove();\\n const host=document.createElement('div');host.id='mf472-hover-fixture';\\n host.className='mf274-collections-browser';\\n host.style.cssText='position:fixed;left:20px;top:120px;width:min(96vw,780px);z-index:2147483000;background:var(--panel);';\\n const posters=Array.from({length:10},(_,i)=>\\n   '<span class=\\\"mf471-showcase-poster\\\" title=\\\"Poster '+i+'\\\"><img alt=\\\"\\\" src=\\\"data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2232%22%20height=%2250%22%3E%3Crect%20width=%2232%22%20height=%2250%22%20fill=%22%23567%22/%3E%3C/svg%3E\\\"></span>').join('');\\n host.innerHTML='<article class=\\\"mf418-browser-entry mf418-browser-showcase mf471-showcase-entry\\\">'+\\n '<div class=\\\"mf276-showcase-cover mf471-showcase-frame\\\">'+\\n '<div class=\\\"mf471-showcase-strip\\\" style=\\\"--mf471-count:10\\\">'+posters+'</div></div>'+\\n '<div class=\\\"mf418-browser-copy\\\">Test collection</div></article>';\\n document.body.appendChild(host);\\n const strip=host.querySelector('.mf471-showcase-strip'),covers=[...host.querySelectorAll('.mf471-showcase-poster')];\\n const target=covers[2],r=target.getBoundingClientRect(),b=strip.getBoundingClientRect();\\n const css=getComputedStyle(target),shadow=getComputedStyle(target,'::after');\\n return {count:covers.length,shadow:css.boxShadow,edgeShadow:shadow.boxShadow,\\n    inset:getComputedStyle(strip).paddingTop,frameWidth:host.querySelector('.mf471-showcase-frame').getBoundingClientRect().width,\\n    innerWidth:strip.clientWidth,overflow:strip.scrollWidth>strip.clientWidth+2,\\n    center:{x:r.left+r.width/2,y:r.top+r.height/2},posterHeight:r.height,stripHeight:b.height};\\n }catch(e){return {error:String(e.stack||e)}}})()\");\n   console.log(d.label+' v472 Showcase shadows:',JSON.stringify(depth472));\n   assert(!depth472.error&&depth472.count===10&&depth472.posterHeight<depth472.stripHeight&&depth472.shadow!=='none'&&depth472.edgeShadow!=='none'&&depth472.overflow,\n     'v472 Showcase must have inset gutters, poster shadows and horizontal scrolling');\n   if(d.label==='desktop'){\n     await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:depth472.center.x,y:depth472.center.y,buttons:0,pointerType:'mouse'});\n     await sleep(330);\n     const hovered472=await cdp.evaluate(\"(()=>{try{\\n const host=document.getElementById('mf472-hover-fixture');\\n const posters=[...host.querySelectorAll('.mf471-showcase-poster')],target=posters[2],other=posters[3];\\n const s=getComputedStyle(target),neighbors=getComputedStyle(other);\\n const actual=target.matches(':hover')&&s.transform!=='none';\\n const scale=new DOMMatrixReadOnly(s.transform).a,vertical=new DOMMatrixReadOnly(s.transform).f;\\n return {hovered:target.matches(':hover'),transform:s.transform,scale,vertical,zIndex:s.zIndex,\\n  raisedShadow:s.boxShadow,neighborFilter:getComputedStyle(other.querySelector('img')).filter,\\n  frameShadow:getComputedStyle(host.querySelector('.mf471-showcase-frame')).boxShadow,\\n  cardShadow:getComputedStyle(host.querySelector('.mf471-showcase-entry')).boxShadow,\\n  count:posters.length};\\n }catch(e){return {error:String(e.stack||e)}}})()\");\n     console.log('desktop v472 individual cover hover:',JSON.stringify(hovered472));\n     assert(!hovered472.error&&hovered472.hovered&&hovered472.scale>1.04&&hovered472.scale<1.12&&hovered472.zIndex==='12'&&\n       hovered472.neighborFilter!=='none'&&hovered472.cardShadow!=='none',\n       'v472 hovered cover must lift forward with shadows and dim neighboring posters');\n     await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0,buttons:0,pointerType:'mouse'});\n   }\n   await cdp.evaluate(\"document.getElementById('mf472-hover-fixture')?.remove()\");\n";
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Missing insertion point in v459 browser smoke');
code=code.replace(marker,probes.join('\n')+'\n'+extra+'\n'+extraWidths+'\n'+showcase471+'\n'+depth472+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
