/* v469 Chromium geometry checks for responsive Background Processes launcher.
 * Preserve all historical v462–v468 browser probes, then stress mobile layout.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v469.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='469'")
 .replaceAll("'v459-browser-smoke'","'v469-browser-smoke'");
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
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Missing insertion point in v459 browser smoke');
code=code.replace(marker,probes.join('\n')+'\n'+extra+'\n'+extraWidths+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
