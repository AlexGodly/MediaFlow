"""v361 compiled bundle, real picker event handlers, synthetic auth-free state.
Exercises display-mode switching, live sizing, persisted preferences, pager and
Collection assignment control survival across browser viewport sizes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for n in range(354,362):
    for path in (R/'assets/css').glob(f'*-v{n}-*.css'):
        styles+='\n'+path.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v361.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v361={S,App,renderOrder,v361CollectionPrefs,v359PagePrefs,v361CollectionMode,v361CollectionSize};})();'''
fixture=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",fixture).group(1).replace('__v359','__v361')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html)
        page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
        page.add_script_tag(content=js)
        page.evaluate(fixture)
        quick=page.locator('#view-root .mf354-quickbar')
        quick.locator('.btn').filter(has_text='Add title').click()
        title=page.locator('.mf359-title-sheet')
        assert title.count()==1
        assert title.locator('.mf356-title-filters').count()==1
        if width>=1024:
            rng=title.locator('input[aria-label="Add Titles cover size"]')
            assert rng.evaluate('e=>e.getBoundingClientRect().width')>=100,(width,'desktop title slider still too small')
            assert title.locator('input[aria-label="Add Titles text size"]').evaluate('e=>e.getBoundingClientRect().width')>=100
        title.locator('.mf354-sheet-header button').click()
        quick.locator('.btn').filter(has_text='Add Collection').click()
        sheet=page.locator('.mf359-collection-sheet')
        assert sheet.count()==1
        assert sheet.locator('.mf361-collection-display').count()==1
        assert sheet.locator('.mf361-collection-mode').count()==5
        assert sheet.locator('input[aria-label="Add Collections text size"]').count()==1
        assert sheet.locator('input[aria-label="Add Collections cover size"]').count()==1
        results=sheet.locator('#mf287-collection-results')
        assert results.locator('.mf287-picker-row').count()==50
        assert results.locator('.mf287-picker-row > button.btn').count()==50
        assert 'mf361-mode-' in results.get_attribute('class')
        cover=sheet.locator('input[aria-label="Add Collections cover size"]')
        cover.evaluate("e=>{e.value='120';e.dispatchEvent(new Event('input',{bubbles:true}))}")
        assert '120px' in sheet.locator('output[data-size="cover"]').inner_text()
        for mode in ['list','compact','cards','covers','covers-title']:
            sheet.locator('.mf361-collection-mode').filter(has_text= {'list':'List','compact':'Compact','cards':'Cards','covers':'Covers','covers-title':'Covers+Titles'}[mode]).first.click()
            assert results.evaluate('(e,v)=>e.classList.contains(`mf361-mode-${v}`)',mode),(width,'mode switch',mode)
            assert results.locator('.mf287-picker-row').count()==50
            assert results.locator('.mf287-picker-row > button.btn').count()==50
            if mode=='covers-title':
                image_width=results.locator('.mf287-picker-cover').first.evaluate('e=>e.getBoundingClientRect().width')
                assert 115<=image_width<=121,(width,'cover width',image_width)
                break
        sheet.locator('input[aria-label="Add Collections text size"]').evaluate("e=>{e.value='22';e.dispatchEvent(new Event('input',{bubbles:true}))}")
        assert page.evaluate('()=>window.__v361.v361CollectionPrefs().text')==22
        assert page.evaluate('()=>window.__v361.v361CollectionPrefs().cover')==120
        sheet.locator('.mf359-collection-toolbar select').select_option('25')
        assert results.locator('.mf287-picker-row').count()==25
        assert results.evaluate("e=>e.classList.contains('mf361-mode-covers-title')")
        assert results.locator('.mf287-picker-row > button.btn').count()==25
        sheet.locator('.mf359-collection-pagination button').filter(has_text='2').click()
        assert results.locator('.mf287-picker-row').count()==25
        assert results.evaluate("e=>e.classList.contains('mf361-mode-covers-title')")
        if width in (390,1920):page.screenshot(path=str(R/f'tests/v361-collections-{width}.png'))
        sheet.locator('.mf354-sheet-header button').click()
        quick.locator('.btn').filter(has_text='Add Collection').click()
        sheet=page.locator('.mf359-collection-sheet')
        assert sheet.locator('.mf361-collection-display').count()==1
        assert sheet.locator('.mf361-collection-mode.active').count()==1
        assert sheet.locator('.mf361-collection-mode.active').inner_text()=='Covers+Titles'
        assert sheet.locator('output[data-size="text"]').inner_text()=='22px'
        assert sheet.locator('output[data-size="cover"]').inner_text()=='120px'
        assert sheet.locator('.mf359-collection-toolbar select').input_value()=='25'
        # Verify original Collection filter controls still present, and Add/Assigned actions still usable.
        filters=sheet.locator('.mf358-collection-filters')
        assert filters.count()==1
        filters.locator(':scope > summary').click()
        assert filters.locator('select[aria-label="Collection sort filter"]').count()==1
        assert filters.locator('.mf358-sort-direction').count()==1
        assert filters.locator('.mf358-cat-menu').count()==1
        assert not errors,(width,errors[:5])
        overflow=page.evaluate('()=>document.documentElement.scrollWidth-document.documentElement.clientWidth')
        assert overflow<=3,(width,'horizontal document overflow',overflow)
        print('PASS',width,'five Collection views, live sliders, title desktop sizing, pagination, reopen, existing controls',flush=True)
        page.close()
    browser.close()
