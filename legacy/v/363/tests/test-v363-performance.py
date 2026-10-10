"""Large synthetic Library timing smoke: no live Supabase, measures real runtime."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
js=(R/'assets/js/mediaflow-v363.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v363perf={S,App,renderOrder,v363Enhance};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for count in [30000,50000]:
  p=browser.new_page(viewport={'width':1280,'height':900})
  errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
  p.set_content('<html><body><div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div></body></html>')
  p.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  p.add_script_tag(content=js)
  p.evaluate("""()=>{document.body.innerHTML='<div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div>'}""")
  timings=p.evaluate('''(count)=>{
    const T=window.__v363perf,S=T.S;
    S.view='order';S.settings=S.settings||{};
    S.categories=[{id:'a',name:'Anime',icon:'🌸',unit:'episodes',minutesPerUnit:24},{id:'b',name:'Books',icon:'📚',unit:'pages',minutesPerUnit:5}];
    S.library=Array.from({length:count},(_,i)=>({id:'t'+i,title:'Library title '+i,categoryId:i%2?'a':'b',status:'active',priority:'medium',progress:1,total:12}));
    S.collections=[{id:'col1',title:'My Collection',titleIds:['t1','t2'],order:['t1','t2']}];
    S.orderPlan={titleIds:Array.from({length:100},(_,i)=>'t'+i),viewMode:'category',categoryMode:'default',categoryOrder:['a','b'],hiddenCategories:[],collectionAssignments:[{id:'ass1',collectionId:'col1',categoryId:'a',createdAt:1,modifiedAt:1}],categoryQueues:{a:['t:t1','c:ass1'],b:[]},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',sectionOrder:'regular-first',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true}};
    const a=performance.now(),h=T.renderOrder(),b=performance.now();
    document.querySelector('#view-root').innerHTML=h;T.v363Enhance();const c=performance.now();
    const tab=T.App.v345SelectMain;
    for(let i=0;i<5;i++){tab('collections');tab('categories');}
    const d=performance.now();
    return {count,renderMs:Math.round(b-a),mountMs:Math.round(c-b),switchTenMs:Math.round(d-c),panels:document.querySelectorAll('.mf345-main-panel').length};
  }''',count)
  assert timings['panels']==1,timings
  assert not errs,(count,errs[:4])
  print('BENCHMARK',timings,flush=True)
  p.close()
 browser.close()
