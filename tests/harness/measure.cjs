/* MediaFlow test harness: per-action timings and main-thread freezes. */
'use strict';
async function measure(page,label,action,settle=600){
  await page.evaluate(()=>{window.__MF_LONG.length=0;});
  const t=Date.now();
  await action();
  // Wait until the main thread is quiet for `settle` ms (or 120s).
  await page.evaluate(async settle=>{
    const start=performance.now();
    while(performance.now()-start<120000){
      const n=__MF_LONG.length;await new Promise(r=>setTimeout(r,settle));
      if(__MF_LONG.length===n)break;
    }
  },settle);
  const res=await page.evaluate(()=>({count:__MF_LONG.length,max:Math.round(Math.max(0,...__MF_LONG.map(x=>x.ms))),total:Math.round(__MF_LONG.reduce((a,b)=>a+b.ms,0))}));
  res.wallMs=Date.now()-t-settle;res.label=label;
  return res;
}
const nav=(page,view)=>page.evaluate(v=>{const b=[...document.querySelectorAll('#app .sidebar button,#app .sidebar a,[data-view]')].find(x=>(x.dataset.view===v)||x.textContent.trim().toLowerCase()===v);if(b){b.click();return true;}__MF.S().view=v;__MF.App.render?.();return false;},view);
module.exports={measure,nav};
