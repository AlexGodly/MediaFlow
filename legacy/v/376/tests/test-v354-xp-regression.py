"""v348 action reward and streak-source regression on the compiled bundle."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
src=(R/'assets/js/mediaflow-v354.bundle.js').read_text().rstrip()
assert src.endswith('})();')
src=src[:-len('})();')]+'''\nwindow.__v348Actions={S,App,v274TouchCollection,v348SeedCollections,v348SeedOrder,v348CompareOrder,v348OrderSnapshot,v348Award,v348HistoryEntries,v348Multiplier,v348Ledger,mergeStates,mediaFlowXP,v120XPBreakdown};\n})();\n'''
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
    page.add_script_tag(content=src)
    data=page.evaluate('''()=>{
      const T=__v348Actions, S=T.S;
      S.settings.leveling={enabled:true,globalStreakMultiplierEnabled:true};
      S.view='collections'; S.sessions=[];
      S.categories=[{id:'anime',name:'Anime',unit:'episodes',color:'#87acff'}];
      S.library=[{id:'a',title:'A',categoryId:'anime'},{id:'b',title:'B',categoryId:'anime'},{id:'c',title:'C',categoryId:'anime'}];
      S.collections=[{id:'col',title:'Collection One',titleIds:['a','b'],order:['a','b'],createdAt:1,updatedAt:1}];
      S.orderPlan={titleIds:[],collectionAssignments:[],categoryQueues:{},viewMode:'all',categoryMode:'default',categoryOrder:[],hiddenCategories:[]};
      S.xpLedger={};T.v348SeedCollections();
      const c=S.collections[0];c.titleIds.push('c');c.order=c.titleIds.slice();T.v274TouchCollection(c);
      c.titleIds=['c','b','a'];c.order=c.titleIds.slice();T.v274TouchCollection(c);
      S.view='order';T.v348SeedOrder();S.orderPlan.titleIds=['a'];T.v348CompareOrder();
      S.orderPlan.titleIds=['a','b'];T.v348CompareOrder();
      S.orderPlan.titleIds=['b','a'];T.v348CompareOrder();
      S.orderPlan.collectionAssignments=[{id:'as1',collectionId:'col',categoryId:'anime'}];S.orderPlan.categoryQueues={anime:['t:b','c:as1','t:a']};T.v348CompareOrder();
      S.orderPlan.categoryQueues.anime=['c:as1','t:b','t:a'];T.v348CompareOrder();
      const keys=Object.keys(S.xpLedger.v348ActionEvents||{}).map(k=>k.split(':')[0]);
      const before=JSON.parse(JSON.stringify(S.xpLedger));
      const merged=T.mergeStates({xpLedger:before},{xpLedger:before});
      return {keys,details:T.v348HistoryEntries().filter(x=>x.id.startsWith('event:')).map(x=>x.details),equal:JSON.stringify(merged?.xpLedger?.v348ActionEvents)===JSON.stringify(S.xpLedger.v348ActionEvents),total:Object.values(S.xpLedger.v348ActionEvents||{}).reduce((a,b)=>a+b,0),currentXP:T.mediaFlowXP(),breakdownTotal:T.v120XPBreakdown().total};
    }''')
    print(data)
    for key in ['collectionAddTitleXP','collectionReorderTitleXP','orderAddTitleXP','orderReorderTitleXP','orderAddCollectionXP','orderReorderCollectionXP']:
        assert key in data['keys'],(key,data)
    assert data['equal'],data
    assert data['currentXP']==data['breakdownTotal'], ('XP breakdown double-count',data)
    assert not errors,errors[:5]
    print('PASS v348 actual Collection and Personal Order action awards, detailed metadata and merge-safe IDs')
    b.close()
