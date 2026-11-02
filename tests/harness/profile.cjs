/* MediaFlow test harness: CPU profile an action and list the hottest functions. */
'use strict';
async function profile(page,action,top=25){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval',{interval:200});
  await cdp.send('Profiler.start');
  await action();
  await page.waitForTimeout(800);
  const {profile:prof}=await cdp.send('Profiler.stop');
  const byId=new Map(prof.nodes.map(n=>[n.id,n]));
  const self=new Map(),total=new Map();
  const dt=prof.timeDeltas;const counts=new Map();
  prof.samples.forEach((id,i)=>counts.set(id,(counts.get(id)||0)+(dt[i]||0)));
  const parent=new Map();for(const n of prof.nodes)for(const c of n.children||[])parent.set(c,n.id);
  const key=n=>{const f=n.callFrame;return (f.functionName||'(anon)')+' :'+(f.lineNumber+1)+' '+(f.url.split('/').pop()||'');};
  for(const [id,us] of counts){
    const n=byId.get(id);self.set(key(n),(self.get(key(n))||0)+us);
    const seen=new Set();let cur=id;
    while(cur){const k=key(byId.get(cur));if(!seen.has(k)){seen.add(k);total.set(k,(total.get(k)||0)+us);}cur=parent.get(cur);}
  }
  const fmt=m=>[...m].filter(([k])=>!/^\((idle|program|root|garbage collector)\)/.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,top).map(([k,v])=>(v/1000).toFixed(0).padStart(6)+'ms  '+k);
  await cdp.send('Profiler.disable');
  return {self:fmt(self),total:fmt(total)};
}
module.exports={profile};
