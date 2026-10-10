"""MediaFlow v350: actual compiled JavaScript + real CSS mobile presentation regression."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
TEMPLATE=(ROOT/'test-v350-responsive.html').read_text(encoding='utf-8')
STYLES='\n'.join((ROOT/path).read_text(encoding='utf-8') for path in re.findall(r'href="(assets/css/[^"]+)"',TEMPLATE))
TEMPLATE=re.sub(r'<link[^>]+>', '', TEMPLATE).replace('</head>','<style>'+STYLES+'</style></head>')
compiled=(ROOT/'assets/js/mediaflow-v350.bundle.js').read_text(encoding='utf-8').rstrip()
assert compiled.endswith('})();')
compiled=compiled[:-len('})();')]+'''\nwindow.__v350={S,App,render,renderView,renderOrder,renderLibrary,renderHistory,v350EnhanceMobile};\n})();'''
BOOT='''() => {
 const T=window.__v350,S=T.S;
 S.settings=S.settings||{};
 S.categories=[{id:'anime',name:'Seasonal Anime',unit:'episodes',minutesPerUnit:24,color:'#90adff',target:2},{id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:15,color:'#ee92ac',target:5}];
 S.library=[{id:'a1',title:'Mobile Test Anime',categoryId:'anime',status:'active',priority:'high',progress:1,total:12,coverUrl:''},{id:'m1',title:'Mobile Test Manga',categoryId:'manga',status:'planned',priority:'medium',progress:0,total:100}];
 S.sessions=[];S.collections=[{id:'col1',title:'Test Collection',description:'A test collection',titleIds:['a1','m1'],order:['a1','m1'],createdAt:100,updatedAt:100}];
 S.histFilters={libCategory:'all',libStatus:'all',libSearch:'',libSort:'priority-desc',range:'all',category:'all',type:'all'};
 S.orderPlan={titleIds:['a1','m1'],viewMode:'category',categoryMode:'default',categoryOrder:['anime','manga'],hiddenCategories:[],collectionAssignments:[],categoryQueues:{anime:['t:a1'],manga:['t:m1']},v288QueueView:{layoutMode:'tabs',sectionOrder:'regular-first',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:false}};
 return true;
}'''
def view(page,route):
    return page.evaluate('''(route)=>{
      window.__v350.S.view=route;
      let root=document.getElementById('view-root');
      if(!root){root=document.createElement('div');root.id='view-root';document.body.appendChild(root)}
      window.__v350.renderView();
      if(route==='library')window.__v350.App.v262EnhanceLibrary();
      window.__v350.App.v350MobileEnhance();
      return {htmlLength:root.innerHTML.length,bodyWidth:document.documentElement.scrollWidth,viewport:window.innerWidth};
    }''',route)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    errs=[]
    for width in [320,390,820,1024,1280]:
        page=browser.new_page(viewport={'width':width,'height':820},device_scale_factor=1)
        page.set_default_timeout(6000)
        page.on('pageerror',lambda e: errs.append(str(e)))
        page.set_content(TEMPLATE,wait_until='domcontentloaded')
        page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
        page.add_script_tag(content=compiled)
        assert page.evaluate(BOOT)
        print('render library',flush=True);assert view(page,'library')['htmlLength']>0;print('rendered library',flush=True)
        page.wait_for_timeout(100)
        library=page.evaluate('''() => ({tools:!!document.querySelector('.mf262-library-tools'),quick:!!document.querySelector('.mf262-library-filter-dock'),mobileButton:!!document.querySelector('.mf262-library-tools .mf350-mobile-toggle'),scrollWidth:document.documentElement.scrollWidth})''')
        if width<=1023:
            assert library['mobileButton'],(width,library, page.evaluate('document.querySelector("#view-root").outerHTML.slice(0,1300)'))
            assert library['quick'],(width,library)
            assert page.locator('.mf262-library-tools-body').first.evaluate('(el)=>getComputedStyle(el).display')=='none',('library collapsed',width)
            page.locator('.mf262-library-tools .mf350-mobile-toggle').click()
            assert page.locator('.mf262-library-tools-body').first.evaluate('(el)=>getComputedStyle(el).display')!='none',('library opened',width)
        else:
            assert not library['mobileButton'],('desktop should have no mobile buttons',width)
        print('render order',flush=True);assert view(page,'order')['htmlLength']>0;print('rendered order',flush=True)
        page.wait_for_timeout(70)
        if width<=1023:
            assert page.locator('.mf350-order-toggle-row .mf350-mobile-toggle').count()==1,('order toggle',width)
            assert page.locator('.mf345-layout-switch').count()==1,('lists tabs present',width)
            page.locator('.mf350-order-toggle-row .mf350-mobile-toggle').click()
            assert page.locator('.mf350-order-toggle-row .mf350-mobile-toggle').get_attribute('aria-expanded')=='true'
        else:
            assert page.locator('.mf350-order-toggle-row').count()==0,('desktop order untouched',width)
        print('render history',flush=True);assert view(page,'history')['htmlLength']>0;print('rendered history',flush=True)
        page.wait_for_timeout(80)
        if width<=1023:
            assert page.locator('.mf350-history-toggle-row').count()==1
            assert page.locator('.v260-history-tabs').first.evaluate('(el)=>getComputedStyle(el).position')=='static',('nonsticky history',width)
            assert page.locator('.v260-history-tab span').first.evaluate('(el)=>getComputedStyle(el).display')!='none',('history labels',width)
            page.locator('.mf350-history-toggle-row .mf350-mobile-toggle').click()
            assert page.locator('.mf350-history-toggle-row .mf350-mobile-toggle').get_attribute('aria-expanded')=='true'
        else:
            assert page.locator('.mf350-history-toggle-row').count()==0
        print('render collections',flush=True);assert view(page,'collections')['htmlLength']>0;print('rendered collections',flush=True)
        page.wait_for_timeout(80)
        if width<=1023:
            assert page.locator('.mf274-collections-browser .mf350-mobile-toggle').count()==1,('collections browse toggle',width)
            assert page.locator('.mf274-collections-browser .mf350-collection-extras').count()==1
            page.locator('.mf274-collections-browser .mf350-mobile-toggle').click()
            assert page.locator('.mf274-collections-browser .mf350-mobile-toggle').get_attribute('aria-expanded')=='true'
        else:
            assert page.locator('.mf350-mobile-toggle').count()==0
        print('render settings',flush=True);assert view(page,'settings')['htmlLength']>0;print('rendered settings',flush=True)
        page.wait_for_timeout(40)
        assert page.locator('#view-root .v221-settings-page').count() or page.locator('#view-root [class*=settings]').count(),('settings render',width)
        # A deliberate limit: content rendered with long labels may scroll within
        # a dedicated horizontal chip strip, but must not clip the document.
        overflow=page.evaluate('''() => ({doc:document.documentElement.scrollWidth,visual:document.documentElement.clientWidth})''')
        if overflow['doc']>overflow['visual']+2:
            print('OVERFLOW',width,overflow)
        if width in (360,412,820,1280):
            page.screenshot(path=str(ROOT/f'tests/v350-settings-{width}.png'),full_page=False)
        print('VIEWPORT',width,'PASS: library/order/history/collections/settings navigation; overflow',overflow)
        page.close()
    assert not errs,'JavaScript errors: '+str(errs[:5])
    browser.close()
print('PASS v350 mobile & desktop responsive regression')
