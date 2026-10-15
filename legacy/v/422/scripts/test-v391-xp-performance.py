"""v391 XP cache correctness: active-time increments equal canonical full recompute."""
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
code=(R/'assets/js/mediaflow-v391.bundle.js').read_text().rstrip()
assert code.endswith('})();')
code=code[:-5]+'''\nwindow.__xp391={run:()=>{
  let m=new Map(); // localStorage is provided by harness
  AUTH_READY=true;AUTH_USER={id:'perf-user'};
  S.library=Array.from({length:30000},(_,i)=>({id:'perf-'+i,title:'Media title '+i,categoryId:'anime',status:i%5===0?'completed':'active',progress:i%25,total:24}));
  S.categories=[{id:'anime',name:'Anime',type:'video',unit:'episodes',color:'#438cff'}];
  S.sessions=Array.from({length:13000},(_,i)=>({id:'session-'+i,date:'2026-10-'+String(1+i%12).padStart(2,'0'),timestamp:1750000000000+i*20000,categoryId:'anime',status:'completed',actualAmount:2,minutes:48,xp:80,titles:[{libraryId:'perf-'+(i%30000),title:'Media title '+(i%30000)}]}));
  S.xpLedger={v334ActiveTimeDays:{},v334StartedTitles:{},v334CollectionCreates:{},v334CollectionEdits:{}};
  S.settings=S.settings||{};S.settings.leveling={...DEFAULT_SETTINGS.leveling,enabled:true};
  v149MarkStreakDirty();
  const first=performance.now(),start=v150EnsureLiveXPCache().totalXP,firstCost=performance.now()-first;
  const t=performance.now();v334EarnTime(60000,'2026-10-12');const fastCost=performance.now()-t;
  const fast=mediaFlowXP(),isClean=!V150_XP_CACHE_DIRTY&&!V149_STREAK_DIRTY;
  const audit=App.v391PerformanceAudit();
  v149MarkStreakDirty();const fullStart=performance.now(),recomputed=mediaFlowXP(),fullCost=performance.now()-fullStart;
  const timeBefore=App.v391PerformanceAudit().timeFastUpdates;
  // A non-time XP mutation MUST still trigger a full cache recomputation.
  S.xpLedger.v334StartedTitles['new-title']=40;v334InvalidateXP();
  const fallbackDirty=V150_XP_CACHE_DIRTY&&V149_STREAK_DIRTY;
  v334EarnTime(60000,'2026-10-12');
  const next=mediaFlowXP();const canonical=v150ComputeStateMetrics({sessions:S.sessions,library:S.library,xpLedger:S.xpLedger},false).totalXP;
  return {firstCost:Math.round(firstCost),fastCost:Math.round(fastCost*100)/100,fullCost:Math.round(fullCost),start,fast,recomputed,next,canonical,isClean,fallbackDirty,audit,timeBefore};
}};})();'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page();page.set_default_timeout(60000);page.set_content('<html><body><div id="app"></div></body></html>')
 page.evaluate('''()=>{let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
 page.add_script_tag(content=code)
 result=page.evaluate('()=>__xp391.run()')
 print(result,flush=True)
 assert result['isClean'] and result['fast']==result['recomputed'] and result['next']==result['canonical'] and result['fallbackDirty'] and result['audit']['timeFastUpdates']>0,result
 b.close()
