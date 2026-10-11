"""Compare full synthetic Personal Order markup and queue state against the v367 baseline.
Strict content equality, not only lengths. No live account/network.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
BUNDLES={367:Path('/mnt/data/v367_work/assets/js/mediaflow-v367.bundle.js'),368:ROOT/'assets/js/mediaflow-v368.bundle.js'}

def run(browser, version):
    bundle=BUNDLES[version].read_text().rstrip()
    assert bundle.endswith('})();')
    bundle=bundle[:-5]+'''\nwindow.__parity={S,App,renderOrder,v287ReconcileCategoryQueue,v287Assignment,v287Collections,v287EnsureOrderExtensions,v274LibraryItem,v363Prefs};})();'''
    p=browser.new_page(viewport={'width':1280,'height':900})
    errors=[]; p.on('pageerror',lambda e:errors.append(str(e)))
    p.set_content('<body><div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div></body>')
    p.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
    p.add_script_tag(content=bundle)
    result=p.evaluate('''()=>{
      const T=window.__parity,S=T.S;
      S.view='order';S.settings=S.settings||{};
      S.categories=Array.from({length:7},(_,i)=>({id:'cat'+i,name:'Category '+i,unit:'episodes',minutesPerUnit:24}));
      S.library=Array.from({length:750},(_,i)=>({id:'t'+i,title:'Title '+i,categoryId:'cat'+i%7,status:(i%4?'active':'completed'),priority:'medium',progress:1,total:12,coverUrl:''}));
      S.collections=Array.from({length:14},(_,i)=>({id:'col'+i,title:'Collection '+i,titleIds:Array.from({length:7},(_,k)=>'t'+(i*7+k)),order:Array.from({length:7},(_,k)=>'t'+(i*7+k)),createdAt:1,updatedAt:2}));
      S.orderPlan={titleIds:Array.from({length:190},(_,i)=>'t'+i),viewMode:'category',categoryMode:'default',categoryOrder:S.categories.map(c=>c.id),hiddenCategories:[],collectionAssignments:Array.from({length:14},(_,i)=>({id:'a'+i,collectionId:'col'+i,categoryId:'cat'+i%7,categoryRule:'match',completedRule:'skip',traversedTitleIds:[],createdAt:1,modifiedAt:1})),categoryQueues:{},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'},modifiedAt:1};
      const out=[];
      for(const layout of ['tabs','lists']){
        S.orderPlan.v288QueueView.layoutMode=layout;
        const markup=T.renderOrder();
        out.push({layout,markup,queues:JSON.stringify(S.orderPlan.categoryQueues),assignmentCount:S.orderPlan.collectionAssignments.length});
      }
      const ref=S.library[10];
      const lookedUp=T.v274LibraryItem('t10')===ref;
      // Mutate in place and immediately re-read. The same title objects must be used.
      ref.title='Edited title in place';
      const changed=T.v274LibraryItem('t10')?.title==='Edited title in place';
      const missing=T.v274LibraryItem('missing')===null;
      // Replace the Library entirely; cached IDs must invalidate.
      S.library=[{id:'replacement',title:'New Title',categoryId:'cat1'}];
      const replaced=T.v274LibraryItem('replacement')===S.library[0] && T.v274LibraryItem('t10')===null;
      return {out,lookedUp,changed,missing,replaced};
    }''')
    p.close()
    assert not errors,(version,errors[:5])
    return result

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    base=run(browser,367)
    fresh=run(browser,368)
    browser.close()
    for k in ['lookedUp','changed','missing','replaced']:
        assert base[k] is True and fresh[k] is True,(k,base[k],fresh[k])
    for older,newer in zip(base['out'],fresh['out']):
        assert older['layout']==newer['layout']
        assert older['markup']==newer['markup'],(older['layout'],'rendered HTML changed',len(older['markup']),len(newer['markup']))
        assert older['queues']==newer['queues'],(older['layout'],'queue positions changed')
        assert older['assignmentCount']==newer['assignmentCount']
        print('PASS exact HTML and queue-state equivalence:',older['layout'],f"({len(older['markup']):,} chars)",flush=True)
    print('PASS in-place Library edits, full Library replacement, missing IDs, no browser errors')
