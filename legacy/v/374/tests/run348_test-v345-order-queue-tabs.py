"""MediaFlow v345 — full bundle Personal Order queue tab regression test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'assets/js/mediaflow-v348.bundle.js').read_text(encoding='utf-8').rstrip()
assert source.endswith('})();')
source=source[:-len('})();')]+'''
window.__v345Test={S,App,renderOrder,v345VisibleCategoryIds,v345TabsData,v345ViewToggleHtml,v287Queue,v287EnsureOrderExtensions,v274RenderCollectionsPage,v142OrderExportPayload,v288NormalizeQueueView};
})();
'''
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1150,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div>')
    page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
    page.add_script_tag(content=source)
    assert page.evaluate('Boolean(window.__v345Test)'), 'bundle not initialized'
    payload=page.evaluate('''() => {
      const T=window.__v345Test,S=T.S;
      S.view='order';
      S.categories=[
        {id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:24,color:'#88aaff',target:2},
        {id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:10,color:'#c78bf1',target:3},
        {id:'movies',name:'Movies',unit:'movies',minutesPerUnit:120,color:'#e6b65c',target:1}
      ];
      S.library=[
        {id:'a1',title:'Attack on Titan',categoryId:'anime',status:'active',priority:'high',progress:1,total:50},
        {id:'m1',title:'Berserk',categoryId:'manga',status:'active',priority:'medium',progress:12,total:100},
        {id:'a2',title:'One Piece',categoryId:'anime',status:'active',priority:'medium',progress:3,total:100}
      ];
      S.collections=[{id:'col1',title:'Shonen list',description:'Anime collection',titleIds:['a1','a2'],order:['a1','a2'],createdAt:100,updatedAt:100,modifiedAt:100}];
      S.orderPlan={titleIds:['a1','m1','a2'],viewMode:'category',categoryMode:'custom',categoryOrder:['manga','anime','movies'],hiddenCategories:[],modifiedAt:123,
        collectionAssignments:[{id:'assign1',categoryId:'anime',collectionId:'col1',categoryRule:'match',completedRule:'skip',traversedTitleIds:[],createdAt:101,modifiedAt:101}],
        categoryQueues:{anime:['t:a1','c:assign1','t:a2'],manga:['t:m1']},
        v288QueueView:{layoutMode:'lists',sectionOrder:'regular-first',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:false}
      };
      return {html:T.renderOrder(),originalOrder:JSON.stringify(T.v287Queue('anime')),main:T.v287EnsureOrderExtensions().v288QueueView.layoutMode};
    }''')
    assert payload['main']=='lists'
    assert 'mf288-regular-section' in payload['html'] and 'mf288-collection-section' in payload['html']
    page.evaluate('''()=>{const T=window.__v345Test;T.v287EnsureOrderExtensions().v288QueueView.layoutMode='tabs'; const host=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));host.innerHTML=T.renderOrder();}''')
    assert page.locator('.mf345-order-tabs-mode').count()==1
    assert page.locator('.mf345-main-tab').count()==2
    assert page.locator('.mf345-main-panel .mf345-category-panel').count()==1
    labels=page.locator('.mf345-subtab .mf345-tab-label').all_inner_texts()
    assert labels[:2]==['Manga','Anime'],labels
    assert page.locator('.mf345-category-panel').inner_text().find('Berserk')>=0
    # tab switch should update panel without saving or changing order data
    page.locator('.mf345-subtab:has-text("Anime")').click()
    assert 'Attack on Titan' in page.locator('.mf345-category-content').inner_text()
    assert 'One Piece' in page.locator('.mf345-category-content').inner_text()
    page.locator('.mf345-main-tab:has-text("Collection queues")').click()
    assert page.locator('.mf345-main-panel .mf345-collection-panel').count()==1
    assert page.locator('.mf345-subtab .mf345-tab-label').all_inner_texts()==['Anime']
    assert 'Shonen list' in page.locator('.mf345-category-content').inner_text()
    after=page.evaluate("JSON.stringify(window.__v345Test.v287Queue('anime'))")
    assert payload['originalOrder']==after,(payload['originalOrder'],after)
    assert page.evaluate('window.__v345Test.v287EnsureOrderExtensions().v288QueueView.layoutMode')=='tabs'
    # title and assignment actions are still present and runnable
    assert page.locator('.mf345-collection-panel [onclick*="v287MoveAssignment"]').count()>0
    # Collections browser has its own Lists / Tabs view toggle; native list remains.
    collections_list=page.evaluate('window.__v345Test.v274RenderCollectionsPage()')
    assert 'mf345-collections-switch' in collections_list
    assert 'mf274-browser-toolbar' in collections_list
    assert 'mf345-collections-queue-view' not in collections_list
    collections_tabs=page.evaluate('''() => {
      const T=window.__v345Test;
      T.v287EnsureOrderExtensions().v288QueueView.collectionsBrowseMode='tabs';
      T.S.view='collections';
      const html=T.v274RenderCollectionsPage();
      document.getElementById('view-root').innerHTML=html;
      return html;
    }''')
    assert 'mf345-collections-queue-view' in collections_tabs
    assert 'mf274-browser-toolbar' not in collections_tabs
    assert page.locator('.mf345-collections-queue-view .mf345-main-tab').count()==2
    page.locator('.mf345-collections-queue-view .mf345-main-tab:has-text("Collection queues")').click()
    assert page.locator('.mf345-collections-queue-view .mf345-collection-panel').count()==1
    # Switches update the canonical persisted order-plan preference.
    saved=page.evaluate('''async () => {
      const T=window.__v345Test;
      await T.App.v345SetCollectionsMode('lists');
      const collections=T.S.orderPlan.v288QueueView.collectionsBrowseMode;
      T.S.view='order';
      await T.App.v345SetLayout('lists');
      return {collections,order:T.S.orderPlan.v288QueueView.layoutMode};
    }''')
    assert saved=={'collections':'lists','order':'lists'},saved
    preferences=page.evaluate('''() => {
      const T=window.__v345Test,p=T.S.orderPlan;
      p.v288QueueView.layoutMode='tabs';p.v288QueueView.collectionsBrowseMode='tabs';
      const exported=T.v142OrderExportPayload();
      const imported=T.v288NormalizeQueueView(exported.orderPlan.v288QueueView);
      return {exported:exported.orderPlan.v288QueueView,imported,format:exported.formatVersion};
    }''')
    assert preferences['exported']['layoutMode']=='tabs'
    assert preferences['exported']['collectionsBrowseMode']=='tabs'
    assert preferences['imported']['layoutMode']=='tabs'
    assert preferences['imported']['collectionsBrowseMode']=='tabs'
    assert preferences['format']==5
    assert not errors,errors[:5]
    print('PASS v345 full bundle: default Lists, ordered category tabs, Collection queue tabs, existing queue positions, Collections Lists/Tabs switch')
    browser.close()
