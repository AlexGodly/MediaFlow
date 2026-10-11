"""v345 synthetic 30k Library / 8k ordered title tab switch performance smoke test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1]/'assets/js/mediaflow-v345.bundle.js').read_text().rstrip()
assert src.endswith('})();')
src=src[:-len('})();')]+'\nwindow.__v345Perf={S,renderOrder,v274RenderCollectionsPage,App};\n})();\n'
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1280,'height':840})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<main id="app"><div class="main"><div id="view-root"></div></div></main>')
  page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
  page.add_script_tag(content=src)
  timings=page.evaluate('''() => {
    const T=window.__v345Perf,S=T.S;
    S.view='order';
    S.categories=Array.from({length:22},(_,i)=>({id:'c'+i,name:'Category '+(i+1),unit:'episodes',color:'#88aaff',minutesPerUnit:24,target:2}));
    S.library=Array.from({length:30000},(_,i)=>({id:'t'+i,title:'Title '+i,categoryId:'c'+(i%22),status:'active',priority:'medium',progress:0,total:12}));
    S.collections=[];
    S.orderPlan={titleIds:S.library.slice(0,8000).map(x=>x.id),categoryMode:'default',viewMode:'category',categoryOrder:[],hiddenCategories:[],modifiedAt:123,
      collectionAssignments:[],categoryQueues:{},v288QueueView:{layoutMode:'tabs',collectionsBrowseMode:'tabs'}};
    const a=performance.now();
    const html=T.renderOrder();
    const rendering=performance.now()-a;
    (document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=html;
    const b=performance.now();T.App.v345SelectCategory('categories','c10');const switching=performance.now()-b;
    return {rendering,switching,tabCount:document.querySelectorAll('.mf345-subtab').length,rows:document.querySelectorAll('.v138-order-row').length};
  }''')
  assert timings['tabCount']==22,timings
  assert timings['rendering']<15000 and timings['switching']<8000,timings
  assert not errors,errors[:3]
  print('PASS large Library tab performance:', {k:round(v,2) if isinstance(v,float) else v for k,v in timings.items()})
  b.close()
