"""v347 regression: Collections is native only; queue layout belongs to Personal Order."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'assets/js/mediaflow-v347.bundle.js').read_text(encoding='utf-8').rstrip()
assert source.endswith('})();')
source=source[:-len('})();')]+'''
window.__v347Test={S,App,renderOrder,v274RenderCollectionsPage,v287EnsureOrderExtensions,v345TabLayoutHtml,v142OrderExportPayload};
})();
'''
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1160,'height':960})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div>')
    page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
    page.add_script_tag(content=source)
    state=page.evaluate('''() => {
      const T=__v347Test,S=T.S;
      S.view='collections';
      S.categories=[{id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:24,color:'#88aaff',target:2},
        {id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:10,color:'#c78bf1',target:3}];
      S.library=[{id:'a1',title:'Attack on Titan',categoryId:'anime',status:'active',priority:'high',progress:1,total:50},
        {id:'m1',title:'Berserk',categoryId:'manga',status:'active',priority:'medium',progress:12,total:100}];
      S.collections=[{id:'col1',title:'Shonen list',description:'Anime collection',titleIds:['a1'],order:['a1'],createdAt:100,updatedAt:100,modifiedAt:100}];
      S.orderPlan={titleIds:['a1','m1'],viewMode:'category',categoryMode:'custom',categoryOrder:['manga','anime'],hiddenCategories:[],modifiedAt:123,
        collectionAssignments:[{id:'assign1',categoryId:'anime',collectionId:'col1',categoryRule:'match',completedRule:'skip',traversedTitleIds:[],createdAt:101,modifiedAt:101}],
        categoryQueues:{anime:['t:a1','c:assign1'],manga:['t:m1']},
        paginateOrderedTitles:true,orderedPageSize:1,
        v288QueueView:{layoutMode:'tabs',collectionsBrowseMode:'tabs',sectionOrder:'regular-first',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:false}
      };
      const root=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));
      const native=T.v274RenderCollectionsPage();root.innerHTML=native;
      return {native,pref:T.v287EnsureOrderExtensions().v288QueueView.collectionsBrowseMode};
    }''')
    # Even accounts carrying the obsolete v345/v346 Collections Tabs preference
    # MUST render the original Collections management page, with its actions.
    assert state['pref']=='tabs',state
    assert 'mf274-browser-toolbar' in state['native'],state['native'][:600]
    assert 'mf345-collections-switch' not in state['native']
    assert 'mf345-collections-queue-view' not in state['native']
    assert 'COLLECTIONS LAYOUT' not in state['native']
    assert page.locator('.mf274-browser-toolbar').count()==1
    assert page.locator('.mf345-layout-switch').count()==0
    assert page.locator('.mf345-main-tabs').count()==0
    # Original Collection should still be present in Collections.
    assert 'Shonen list' in state['native']
    # Personal Order still has the new controls and two queue tabs.
    page.evaluate('''() => {const T=__v347Test;
      T.S.view='order';
      (document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=T.renderOrder();
    }''')
    assert page.locator('.mf345-layout-switch').count()==1
    assert page.locator('.mf345-main-tab').count()==2
    assert page.locator('.mf346-queue-controls').count()==1
    assert page.locator('.mf346-cover-tool input[type=range]').count()==1
    assert page.locator('.mf346-page-size input').input_value()=='1'
    assert page.locator('.mf345-main-tab .mf346-main-icon').count()==2
    page.locator('.mf345-main-tab:has-text("Collection queues")').click()
    assert page.locator('.mf345-collection-panel .mf346-tab-pager').count()==1
    page.locator('.mf345-collection-panel .mf346-tab-pager button:has-text("Next")').click()
    assert 'Shonen list' in page.locator('.mf345-category-content').inner_text()
    # Switching back to the old Lists mode remains functional.
    lists=page.evaluate('''()=>{const T=__v347Test;
      T.v287EnsureOrderExtensions().v288QueueView.layoutMode='lists';
      return T.renderOrder();
    }''')
    assert 'mf288-regular-section' in lists and 'mf288-collection-section' in lists
    assert not errors,errors[:8]
    print('PASS v347: Collections native UI regardless old Tabs preference; Personal Order Lists/Tabs and tools intact')
    browser.close()
