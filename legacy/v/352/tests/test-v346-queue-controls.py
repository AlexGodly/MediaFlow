"""MediaFlow v346 compiled-bundle tab icon/control + mixed queue pagination test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'assets/js/mediaflow-v346.bundle.js').read_text(encoding='utf-8').rstrip()
assert source.endswith('})();')
source=source[:-len('})();')]+'''
window.__v346Test={S,App,renderOrder,v345TabLayoutHtml,v345TitleQueuePanel,v345CollectionQueuePanel,v345RefreshTabs,v287EnsureOrderExtensions,v175OrderPageSize,v181CoverSize};
})();
'''
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1150,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<div id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></div>')
    page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
    page.add_script_tag(content=source)
    page.evaluate('''()=>{
      const T=window.__v346Test,S=T.S;
      S.view='order';
      S.categories=[{id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:24,color:'#88aaff',target:2},
        {id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:10,color:'#c78bf1',target:3}];
      S.library=[{id:'a1',title:'Attack on Titan',categoryId:'anime',status:'active',priority:'medium'},
        {id:'a2',title:'One Piece',categoryId:'anime',status:'active',priority:'medium'},
        {id:'m1',title:'Berserk',categoryId:'manga',status:'active',priority:'medium'}];
      S.collections=[{id:'col1',title:'Shonen list',titleIds:['a1','a2'],order:['a1','a2']}];
      S.orderPlan={titleIds:['a1','a2','m1'],viewMode:'category',categoryMode:'custom',categoryOrder:['manga','anime'],hiddenCategories:[],modifiedAt:1,
        collectionAssignments:[{id:'assign1',categoryId:'anime',collectionId:'col1',categoryRule:'match',completedRule:'skip',traversedTitleIds:[]}],
        categoryQueues:{anime:['t:a1','c:assign1','t:a2'],manga:['t:m1']},
        paginateOrderedTitles:true,orderedPageSize:1,
        v288QueueView:{layoutMode:'tabs',showCollectionsInRegularQueues:true,showRegularQueues:true,showCollectionQueues:true,sectionOrder:'regular-first'}
      };
      const host=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));
      host.innerHTML=T.renderOrder();
    }''')
    assert page.locator('.mf346-queue-controls').count()==1
    assert page.locator('.mf346-page-size input').input_value()=='1'
    assert page.locator('.mf346-pagination-tools button').get_attribute('aria-checked')=='true'
    assert page.locator('.mf346-cover-tool input[type=range]').count()==1
    assert page.locator('.mf345-main-tab .mf346-main-icon').count()==2
    assert page.locator('.mf345-subtab .mf345-tab-icon').count()==2
    page.wait_for_timeout(140)
    assert page.locator('.mf345-subtab .v225-btn-icon').count()==0,'duplicate category icons injected'
    assert page.locator('.mf345-main-tab .v225-btn-icon').count()==0,'generic main tab icons injected'
    # Page selected default Manga; switch to Anime's mixed queue and test only one token per page.
    page.locator('.mf345-subtab:has-text("Anime")').click()
    assert page.locator('.mf345-category-panel .mf346-tab-pager').count()==1,'mixed queue pager missing'
    assert page.locator('.mf345-category-panel .v138-order-list > *').count()==1
    # Select Collection Queues, whose mixed direct-title/assignment list also paginates.
    page.locator('.mf345-main-tab:has-text("Collection queues")').click()
    assert page.locator('.mf345-collection-panel .mf346-tab-pager').count()==1
    assert page.locator('.mf345-collection-panel .mf287-queue-list > *').count()==1
    page.locator('.mf345-collection-panel .mf346-tab-pager button:has-text("Next")').click()
    assert 'Page 2 / 3' in page.locator('.mf345-collection-panel .mf346-tab-pager').inner_text()
    assert 'Shonen list' in page.locator('.mf345-collection-panel').inner_text()
    # The collections page hosts the same controls and cover-size scope.
    page.evaluate('''()=>{const T=__v346Test; T.S.view='collections';
      const root=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));
      root.innerHTML='<section class="mf345-collections-queue-view">'+T.v345TabLayoutHtml()+'</section>';}''')
    assert page.locator('.mf345-collections-queue-view .mf346-queue-controls').count()==1
    assert page.locator('.mf345-collections-queue-view .v177-order-cover-scope').count()==1
    assert page.locator('.mf345-collections-queue-view .mf346-main-icon').count()==2
    assert page.locator('.mf345-collections-queue-view .mf345-subtab .v225-btn-icon').count()==0
    # Real onchange handlers reuse the canonical order pagination and cover settings.
    page.locator('.mf346-page-size input').fill('2')
    page.locator('.mf346-page-size input').press('Tab')
    assert page.evaluate('window.__v346Test.S.orderPlan.orderedPageSize')==2
    # Set value through the same control; the immediate scope remains correct.
    page.locator('.mf346-cover-tool input[type=number]').last.fill('195')
    page.locator('.mf346-cover-tool input[type=number]').last.press('Tab')
    assert page.evaluate('window.__v346Test.v181CoverSize("order")')==195
    assert not errors,errors[:6]
    print('PASS v346 compiled app: no duplicate category icons, semantic main icons, working controls, mixed queue pages, Collection queue pages')
    browser.close()
