"""Paired standalone render cost benchmark; v367 and v368 built bundles.
Synthetic account only; no network or authenticated cloud session.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import sys, json, statistics
ROOT=Path(__file__).resolve().parents[1]
release=int(sys.argv[1]) if len(sys.argv)>1 else 367
file=ROOT/f'assets/js/mediaflow-v{release}.bundle.js'
if not file.exists(): file=Path('/mnt/data/v367_work')/'assets/js/mediaflow-v367.bundle.js'
js=file.read_text().rstrip(); assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v368perf={S,App,renderOrder,v287ReconcileCategoryQueue,v287EnsureOrderExtensions,v274EnsureCollections};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for n in [30000,50000]:
  page=browser.new_page(viewport={'width':1280,'height':900})
  page.set_content('<body><div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div></body>')
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  result=page.evaluate('''n=>{
    let T=window.__v368perf,S=T.S;
    S.view='order';S.settings=S.settings||{};
    S.categories=Array.from({length:12},(_,i)=>({id:'cat'+i,name:'Category '+i,unit:'episodes',minutesPerUnit:24}));
    S.library=Array.from({length:n},(_,i)=>({id:'t'+i,title:'Media title '+i,categoryId:'cat'+i%12,status:'active',priority:'medium',progress:1,total:12,coverUrl:''}));
    S.collections=Array.from({length:36},(_,i)=>({id:'col'+i,title:'Collection '+i,description:'Example',titleIds:Array.from({length:16},(_,k)=>'t'+((i*16+k)%n)),order:Array.from({length:16},(_,k)=>'t'+((i*16+k)%n)),createdAt:1,updatedAt:2}));
    let assignments=Array.from({length:36},(_,i)=>({id:'a'+i,collectionId:'col'+i,categoryId:'cat'+i%12,categoryRule:'match',completedRule:'skip',traversedTitleIds:[],createdAt:1,modifiedAt:1}));
    S.orderPlan={titleIds:Array.from({length:800},(_,i)=>'t'+i),viewMode:'category',categoryMode:'default',categoryOrder:S.categories.map(c=>c.id),hiddenCategories:[],collectionAssignments:assignments,categoryQueues:{},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:false,sectionOrder:'regular-first'},modifiedAt:1};
    // warm up lazy Library index outside the timed operation
    T.v287EnsureOrderExtensions();
    const runs=[];let chars=0;
    for(let i=0;i<4;i++){
      S.orderPlan.v288QueueView.layoutMode=i%2===0?'tabs':'lists';
      let start=performance.now();let html=T.renderOrder();runs.push(+(performance.now()-start).toFixed(1));chars+=html.length;
    }
    let a=performance.now();for(let i=0;i<25;i++)T.v287ReconcileCategoryQueue('cat'+i%12);let reconcile=+(performance.now()-a).toFixed(1);
    return {release:__VERSION__,titles:n,renderMs:runs,reconcile25Ms:reconcile,htmlChars:chars,assignments:S.orderPlan.collectionAssignments.length};
  }'''.replace('__VERSION__',str(release)),n)
  print('PERF',json.dumps(result),flush=True)
  page.close()
 browser.close()
