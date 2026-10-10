"""v353 Add Titles mobile/desktop regressions; real compiled application bundle."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'test-v350-responsive.html').read_text()
style='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',html))
style+='\n'+(R/'assets/css/177-v351-mobile-regression-repairs.css').read_text()
style+='\n'+(R/'assets/css/178-v352-collection-add-picker-views.css').read_text()
style+='\n'+(R/'assets/css/179-v353-mobile-add-titles-tools.css').read_text()
html=re.sub(r'<link[^>]+>','',html).replace('</head>','<style>'+style+'</style></head>')
bundle=(R/'assets/js/mediaflow-v353.bundle.js').read_text().rstrip()
assert bundle.endswith('})();')
bundle=bundle[:-5]+'''\nwindow.__v353={S,App,V274_UI,V353_PICKER_PANELS,v353PickerToggle};})();'''
SETUP='''()=>{
const T=window.__v353; T.S.settings=T.S.settings||{};
T.S.categories=[{id:'anime',name:'Anime Backlog',unit:'episodes',color:'#ff55aa',icon:'🌸'}];
T.S.library=Array.from({length:70},(_,i)=>({id:'t'+i,title:i===0?'A Long Title To Test Wrapping On A Narrow Android Phone':'Example media title '+String(i).padStart(3,'0'),categoryId:'anime',status:i%2?'completed':'active',priority:'medium',rating:8,progress:0,total:12}));
T.S.collections=[{id:'c1',title:'Test Collection',titleIds:[],order:[],createdAt:100,updatedAt:100}];T.V274_UI.activeId='c1';
T.App.v274OpenAddTitles('c1');
}'''
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for w,h in [(320,640),(360,740),(390,844),(430,932),(768,900),(820,1050),(1024,800),(1280,900)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(html)
        page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
        page.add_script_tag(content=bundle)
        page.evaluate(SETUP)
        modal=page.locator('#mf274-add-titles')
        assert modal.count()==1
        results=page.locator('#mf276-add-results')
        assert results.locator('.mf352-picker-item').count()==24,(w,'items missing')
        if w<1024:
            assert page.locator('.mf353-mobile-toggle:visible').count()==2,(w,'toggles missing')
            assert page.locator('.mf274-add-tools.mf353-filters-closed').count()==1
            assert page.locator('.mf352-picker-settings.mf353-display-closed').count()==1
            assert page.locator('#mf274-add-titles .mf274-add-tools select:visible').count()==0,(w,'filters visible while closed')
            assert page.locator('#mf274-add-titles .mf352-adjusters:visible').count()==0,(w,'sliders visible while closed')
            geom=page.evaluate('''()=>{const names=['.mf274-add-modal','.mf274-add-head','.mf274-add-tools','.mf352-picker-settings','#mf276-add-results','#mf276-add-footer','.modal-actions']; const modal=document.querySelector('#mf274-add-titles');return Object.fromEntries(names.map(s=>{let el=modal.querySelector(s);let r=el.getBoundingClientRect();return [s,{h:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),scroll:el.scrollHeight,client:el.clientHeight}]}))}''')
            assert geom['#mf276-add-results']['h']>=130,(w,'results too short',geom)
            assert geom['#mf276-add-results']['bottom'] <= geom['.modal-actions']['top']+2,(w,'results behind footer',geom)
            print('mobile',w,geom,flush=True)
            page.locator('.mf353-filter-toggle').click()
            assert page.locator('.mf274-add-tools.mf353-filters-open').count()==1
            assert page.locator('.mf274-add-tools select:visible').count()==4,(w,'filter fields missing')
            page.locator('.mf274-add-tools select').first.select_option('active')
            assert page.locator('.mf274-add-tools.mf353-filters-open').count()==1,(w,'filter state lost on rerender')
            page.locator('.mf353-filter-toggle').click()
            assert page.locator('.mf274-add-tools select:visible').count()==0
            page.locator('.mf353-display-toggle').click()
            assert page.locator('.mf352-adjusters:visible').count()==1,(w,'slider panel missing')
            page.locator('.mf352-adjuster input[aria-label="Title text size"]').fill('22')
            assert page.locator('#mf352-text-value').inner_text()=='22px'
            if w==320:
                page.locator('.mf353-filter-toggle').click()
                mix=page.evaluate("""()=>{let m=document.querySelector('#mf274-add-titles .mf274-add-modal'),foot=m.querySelector('.modal-actions'),r=m.querySelector('#mf276-add-results'),controls=m.querySelector('.mf274-add-tools');return {modal:m.getBoundingClientRect().bottom,footer:foot.getBoundingClientRect().bottom,results:r.getBoundingClientRect().height,filterH:controls.getBoundingClientRect().height}}""")
                print('SHORT PHONE filter expansion',mix,flush=True)
                assert mix['results']>=100,(w,'filter expansion starved title list',mix)
                assert page.locator('.mf352-adjusters:visible').count()==0,(w,'short viewport should close other expanded panel')
                page.locator('.mf353-filter-toggle').click()
                page.locator('.mf353-display-toggle').click()
            page.locator('.mf353-display-toggle').click()
            assert page.locator('.mf352-adjusters:visible').count()==0
            assert page.locator('#mf276-add-search').is_visible()
            assert page.locator('.mf352-view-mode:visible').count()==5,(w,'missing view modes in scroll row')
            if w in (390,820):page.screenshot(path=str(R/'tests'/f'v353-picker-mobile-{w}.png'))
        else:
            assert page.locator('.mf353-mobile-toggle:visible').count()==0,(w,'desktop gained mobile UI')
            assert page.locator('.mf274-add-tools select:visible').count()==4,(w,'desktop filters hidden')
            assert page.locator('.mf352-adjusters:visible').count()==1,(w,'desktop sizing hidden')
        page.locator('#mf276-add-search').fill('Example media title 020')
        page.wait_for_timeout(230)
        assert page.locator('.mf352-picker-item').count()==1,(w,'search not working')
        page.locator('.mf352-picker-item input').check()
        assert page.locator('#mf274-add-confirm').is_enabled(),(w,'selection broken')
        page.locator('.mf352-view-mode').filter(has_text='Cards').click()
        assert page.locator('.mf352-picker-item input').is_checked(),(w,'lost selection on mode change')
        assert not errors,(w,errors[:2])
        print('PASS',w,flush=True)
        page.close()
    browser.close()
print('PASS v353 compiled picker')
