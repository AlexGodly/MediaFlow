"""MediaFlow v360: real compiled-bundle tests for proportional Covers tiles
and content-sized Add Collections. Synthetic data (no live Supabase account)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for filename in ['180-v354-personal-order-quick-workspace.css','181-v355-personal-order-ui-refinement.css','182-v356-personal-order-dialog-browse-layout.css','183-v357-personal-order-dialogs-tabs-icons.css','184-v358-personal-order-rebuild.css','185-v359-picker-pagination-category-tabs.css','186-v360-adaptive-personal-order-pickers.css','187-v361-collection-picker-views-sizing.css']:
    styles+='\n'+(R/'assets/css'/filename).read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v361.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v361={S,App,renderOrder,v359PagePrefs,v359CollectionPageData};})();'''
prior=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",prior).group(1).replace("__v359","__v361").replace("S.collections=Array.from({length:121}","S.collections=Array.from({length:3}")
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for w,h in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html)
        page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
        page.add_script_tag(content=js)
        page.evaluate(fixture)
        quick=page.locator('#view-root .mf354-quickbar')
        quick.locator('.btn').filter(has_text='Add title').click()
        sheet=page.locator('.mf359-title-sheet')
        assert sheet.count()==1
        assert sheet.locator('.mf356-title-filters').count()==1
        sheet.locator('.mf358-mode-btn').filter(has_text='Covers').first.click()
        results=sheet.locator('.mf358-title-results')
        # A 36px cover must not be forced to use the old 110px minimum card.
        size_input=sheet.locator('input[aria-label="Add Titles cover size"]')
        size_input.evaluate("el=>{el.value='36';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        before=results.evaluate('''el=>{
          const a=el.querySelector('.v138-picker-row'),b=a.querySelector('.mf276-order-picker-cover'),n=el.querySelectorAll('.v138-picker-row')[1];
          const r=a.getBoundingClientRect(),c=b.getBoundingClientRect(),nr=n.getBoundingClientRect();
          return {row:r.width,cover:c.width,columnsOnLine:Math.abs(r.top-nr.top)<3,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
        }''')
        assert 35<=before['cover']<=37,(w,'cover setting ignored',before)
        assert before['row']<=70,(w,'tiny cover stuck in huge card',before)
        assert before['columnsOnLine'],(w,'gallery did not form columns',before)
        size_input.evaluate("el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        after=results.evaluate('''el=>({row:el.querySelector('.v138-picker-row').getBoundingClientRect().width,
          cover:el.querySelector('.mf276-order-picker-cover').getBoundingClientRect().width})''')
        assert 115<=after['cover']<=122,(w,'cover did not increase',after)
        assert after['row']>before['row']+40,(w,'tile did not respond to size',before,after)
        assert sheet.locator('.v138-picker-row').count()==50
        # On high-density mobile a large gallery remains scrollable; pager and
        # actions stay visible in the sheet despite the extra rows.
        assert sheet.locator('#v140-order-picker-pager').is_visible()
        assert sheet.locator('.v138-picker-actions').is_visible()
        if w==390:
            size_input.evaluate("el=>{el.value='36';el.dispatchEvent(new Event('input',{bubbles:true}));}")
            page.screenshot(path=str(R/'tests/v361-titles-390.png'))
        sheet.locator('.mf354-sheet-header button').click()
        # Only three Collections: dialog should be content-sized, and footer
        # should appear immediately beneath the 3 cards rather than at bottom.
        page.evaluate("()=>{window.__v361.S.collections=window.__v361.S.collections.slice(0,3)}")
        quick.locator('.btn').filter(has_text='Add Collection').click()
        coll=page.locator('.mf359-collection-sheet')
        assert coll.count()==1
        assert coll.locator('.mf287-picker-row').count()==3
        assert coll.evaluate("e=>e.classList.contains('mf360-collection-compact')"),(w,'compact class missing')
        dims=coll.evaluate('''e=>{
          const s=e.getBoundingClientRect(),rows=e.querySelectorAll('.mf287-picker-row'),r=rows[rows.length-1].getBoundingClientRect();
          const foot=e.querySelector('.mf359-collection-footer').getBoundingClientRect();
          return {height:s.height,lastRowBottom:r.bottom,footerTop:foot.top,footerBottom:foot.bottom,viewport:window.innerHeight};
        }''')
        assert dims['footerTop']-dims['lastRowBottom']<85,(w,'huge gap before results footer',dims)
        if w<=1023:assert dims['height']<=h-10,(w,'short modal overflow',dims)
        if w==390:
            assert dims['height']<760,(w,'mobile modal not content sized',dims)
            page.screenshot(path=str(R/'tests/v361-collections-390.png'))
        # Search narrows and expands results without lingering compact states.
        page.evaluate("()=>{window.__v361.S.collections=Array.from({length:20},(_,i)=>({id:'k'+i,title:'Extra Collection '+i,titleIds:['t1'],order:['t1']}))}")
        coll.locator('#mf287-collection-search').fill('Extra')
        assert coll.locator('.mf287-picker-row').count()==20
        assert coll.evaluate("e=>e.classList.contains('mf360-collection-many')"),(w,'did not restore large-list layout')
        coll.locator('#mf287-collection-search').fill('Extra Collection 1')
        assert coll.locator('.mf287-picker-row').count()==11
        coll.locator('#mf287-collection-search').fill('Extra Collection 19')
        assert coll.locator('.mf287-picker-row').count()==1
        assert coll.evaluate("e=>e.classList.contains('mf360-collection-compact')"),(w,'did not return to compact')
        if w==1920:page.screenshot(path=str(R/'tests/v361-collections-1920.png'))
        assert not errors,(w,'JS exceptions',errors[:5])
        horizontal=page.evaluate('()=>document.documentElement.scrollWidth-document.documentElement.clientWidth')
        assert horizontal<=3,(w,'horizontal document overflow',horizontal)
        print('PASS',w,'proportional cover tiles, title controls, compact Collection height, dynamic filtering, no overflow',flush=True)
        page.close()
    browser.close()
