"""v362: compiled runtime + actual dialogs against synthetic local MediaFlow state.
No authentication or live cloud API involved."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for n in range(354,363):
    for path in sorted((R/'assets/css').glob(f'*-v{n}-*.css')):styles+='\n'+path.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v362.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v362={S,App,renderOrder,v361CollectionPrefs,v359PagePrefs,v362CollectionMobileTools};})();'''
prior=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",prior).group(1).replace('__v359','__v362').replace("document.querySelector('#view-root').innerHTML=window.__v362.renderOrder();","S.collections=S.collections.slice(0,3);document.querySelector('#view-root').innerHTML=window.__v362.renderOrder();")
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(320,720),(390,844),(430,932),(820,1024),(1280,900),(1920,1080)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html)
        page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
        page.add_script_tag(content=js)
        page.evaluate(fixture)
        quick=page.locator('#view-root .mf354-quickbar')
        quick.locator('.btn').filter(has_text='Add Collection').click()
        sheet=page.locator('.mf359-collection-sheet')
        filters=sheet.locator('details.mf358-collection-filters')
        rows=sheet.locator('#mf287-collection-results .mf287-picker-row')
        assert rows.count()==3,(width,'three Collection cards not found')
        assert filters.count()==1
        assert sheet.locator('.mf359-page-size-field select').count()==1
        assert sheet.locator('input[aria-label="Add Collections text size"]').count()==1
        assert sheet.locator('input[aria-label="Add Collections cover size"]').count()==1
        mobile=width<=1023
        assert filters.locator('.mf359-page-size-field select').count()==(1 if mobile else 0),(width,'page size location')
        assert filters.locator('.mf361-collection-size-controls').count()==(1 if mobile else 0),(width,'slider location')
        if mobile:
            assert not filters.evaluate('(e)=>e.open'),(width,'filters should start closed')
            assert not sheet.locator('input[aria-label="Add Collections text size"]').is_visible(),(width,'sizing visible when collapsed')
            assert sheet.locator('.mf361-collection-mode-buttons').is_visible()
            assert not sheet.locator('.mf359-page-size-field select').is_visible()
            filters.locator(':scope>summary').click()
            assert filters.evaluate('(e)=>e.open')
            assert sheet.locator('input[aria-label="Add Collections text size"]').is_visible()
            assert sheet.locator('input[aria-label="Add Collections cover size"]').is_visible()
            assert sheet.locator('.mf359-page-size-field select').is_visible()
            sheet.locator('.mf359-page-size-field select').select_option('25')
            assert page.evaluate('window.__v362.v359PagePrefs().collections')==25
            sheet.locator('input[aria-label="Add Collections cover size"]').evaluate("e=>{e.value='70';e.dispatchEvent(new Event('input',{bubbles:true}))}")
            filters.locator(':scope>summary').click()
            assert not filters.evaluate('(e)=>e.open')
            assert sheet.locator('.mf361-collection-mode-buttons').is_visible()
        else:
            assert sheet.locator('.mf359-collection-toolbar select').is_visible()
            assert sheet.locator('.mf361-collection-size-controls').is_visible()
        outcome=[]
        for mode,label in [('cards','Cards'),('covers','Covers'),('covers-title','Covers+Titles')]:
            sheet.locator('.mf361-collection-mode').filter(has_text=label).first.click()
            result=sheet.locator('#mf287-collection-results')
            assert result.evaluate('(e,m)=>e.classList.contains("mf361-mode-"+m)',mode)
            geom=result.evaluate('''e=>{
                const rows=[...e.querySelectorAll('.mf287-picker-row')];
                const first=rows[0].getBoundingClientRect(),next=rows[1].getBoundingClientRect();
                const cover=rows[0].querySelector('.mf287-picker-cover').getBoundingClientRect();
                const btn=rows[0].querySelector(':scope > .btn').getBoundingClientRect();
                return {count:rows.length,rowWidth:first.width,rowHeight:first.height,coverWidth:cover.width,
                    sameLine:Math.abs(first.top-next.top)<4,btnTop:btn.top,coverBottom:cover.bottom,
                    cols:getComputedStyle(e).gridTemplateColumns,
                    client:e.clientHeight,scroll:e.scrollHeight,
                    sheetHeight:e.closest('.mf359-collection-sheet').getBoundingClientRect().height};
            }''')
            assert geom['coverBottom']<=geom['btnTop']+2,(width,mode,'cover overlaps action',geom)
            if 390<=width<=820:
                assert geom['sameLine'],(width,mode,'two-column mobile gallery expected',geom)
            if mode in ('covers','covers-title') and mobile:
                assert geom['rowWidth']<=260,(width,mode,'old full-width mobile covers card',geom)
            outcome.append((mode,round(geom['rowWidth']),round(geom['rowHeight']),geom['sameLine']))
            if width in (390,1280):page.screenshot(path=str(R/'tests'/f'v362-{mode}-{width}.png'))
            assert rows.count()==3
            assert result.locator(':scope > .mf287-picker-row > .btn').count()==3
        # Change viewport in-place to prove controls return to their original
        # DOM positions; no duplicate select/ranges may appear.
        if width==390:
            page.set_viewport_size({'width':1280,'height':900})
            page.wait_for_timeout(80)
            assert filters.locator('.mf359-page-size-field select').count()==0,'per-page not restored on resize'
            assert sheet.locator('.mf359-collection-toolbar select').count()==1
            assert sheet.locator('.mf361-collection-display .mf361-collection-size-controls').count()==1
            page.set_viewport_size({'width':390,'height':844})
            page.wait_for_timeout(80)
            assert filters.locator('.mf359-page-size-field select').count()==1
            assert filters.locator('.mf361-collection-size-controls').count()==1
        sheet.locator('.mf354-sheet-header button').click()
        quick.locator('.btn').filter(has_text='Add Collection').click()
        sheet=page.locator('.mf359-collection-sheet')
        assert sheet.locator('.mf359-page-size-field select').count()==1
        assert sheet.locator('input[aria-label="Add Collections cover size"]').count()==1
        assert sheet.locator('.mf358-collection-filters').count()==1
        if width==390:
            # A larger Library validates that relocated page-size controls still
            # drive the actual 25-item paged renderer, not just a saved setting.
            page.evaluate("""()=>{window.__v362.S.collections=Array.from({length:121},(_,i)=>({id:'new'+i,title:'Large Set '+i,titleIds:['t1'],order:['t1']}));}""")
            sheet.locator('#mf287-collection-search').fill('Large Set')
            result=sheet.locator('#mf287-collection-results')
            assert result.locator('.mf287-picker-row').count()==25
            assert 'Page 1 of 5' in sheet.locator('.mf359-collection-page-info').inner_text()
            sheet.locator('.mf359-collection-pagination button[aria-label="Collection page 2"]').click()
            assert result.locator('.mf287-picker-row').count()==25
            assert 'Showing 26–50' in sheet.locator('.mf359-collection-page-info').inner_text()
            sheet.locator('.mf358-collection-filters > summary').click()
            assert sheet.locator('.mf358-cat-menu').count()==1
            assert sheet.locator('select[aria-label="Collection sort filter"]').count()==1
            assert sheet.locator('input[aria-label="Add Collections cover size"]').count()==1
        assert not errors,(width,errors[:3])
        x=page.evaluate('()=>document.documentElement.scrollWidth-document.documentElement.clientWidth')
        assert x<=3,(width,'document overflows',x)
        print('PASS',width,'responsive cards/galleries:',outcome,'mobile collapsing & desktop restoration, no duplicates',flush=True)
        page.close()
    browser.close()
