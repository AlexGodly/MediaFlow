#!/usr/bin/env python3
"""v407 focused, isolated browser checks. No live account/network access."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf8')
html=re.sub(r'<script[^>]*>[^<]*</script>','',html,flags=re.S|re.I)
html=re.sub(r'<link\b[^>]*>','',html,flags=re.I|re.S)
script=(root/'assets/js/mediaflow-v407.bundle.js').read_text(encoding='utf8')
assert script.rstrip().endswith('})();')
hook='''
window.__MF407TEST__={
  get S(){return S}, get App(){return App},
  fixture(){
    S.categories=[{id:'c1',name:'Seasonal Anime',icon:'🌸'},{id:'c2',name:'Anime Movies',icon:'🎬'},{id:'c3',name:'Movies',icon:'📽️'}];
    S.settings.v230ChoiceLayout={modifiedAt:0,
      setCategory:{source:'custom',order:['c3','c1','c2'],hidden:[]},
      setStatus:{source:'custom',order:['dropped','completed','active','paused','planned'],hidden:[]},
      setPriority:{source:'custom',order:['high','medium','low'],hidden:[]}};
    v230EnsureChoiceLayout(S.settings);
  },
  picker:(kind,scope)=>v406PickerHtml(kind,scope),
  bulk:(scope)=>v406UpgradeBatchMarkup(`<div class="mf-batchbar"><select onchange="App.${scope==='library'?'batchLibrary':'v274BatchCollection'}Status(this.value)"></select><select onchange="App.${scope==='library'?'batchLibrary':'v274BatchCollection'}Priority(this.value)"></select><select onchange="App.${scope==='library'?'batchLibrary':'v274BatchCollection'}Category(this.value)"></select></div>`,scope),
  order:(kind)=>v406ActionItems(kind).map(i=>i.id),
  iconName:(el)=>v225ButtonIconName(el)
};
'''
script=script.rstrip()[:-len('})();')]+hook+'\n})();\n'
css='\n'.join((root/'assets/css'/name).read_text(encoding='utf8') for name in ['218-v406-smart-filters-actions.css','219-v407-bulk-picker-cleanup.css'])
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in [320,390,820,1280]:
        page=browser.new_page(viewport={'width':width,'height':850})
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.set_content(html)
        page.add_style_tag(content=css)
        page.evaluate('''(()=>{let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}})})()''')
        page.add_script_tag(content=script)
        page.evaluate('__MF407TEST__.fixture()')
        for scope in ['library','collection']:
            page.evaluate('scope=>{document.body.innerHTML=`<main id="test">${__MF407TEST__.bulk(scope)}</main>`}',scope)
            page.wait_for_timeout(120)  # allow both icon mutation enhancers to run
            assert page.locator('.mf406-action-picker').count()==3
            for kind in ['status','priority','category']:
                selector=f'.mf407-{kind}'
                menu=page.locator(selector)
                assert menu.count()==1, (width,scope,kind)
                assert menu.locator('.mf406-picker-panel input').count()==(1 if kind=='category' else 0)
                assert menu.locator('.mf406-picker-option').count()==len(page.evaluate(f"__MF407TEST__.order('{kind}')"))
                assert menu.locator('.mf406-picker-option > .mf406-picker-icon').count()==menu.locator('.mf406-picker-option').count()
                assert menu.locator('.mf406-picker-option > .v225-btn-icon').count()==0
                assert menu.locator('.mf406-picker-option > .mf407-option-label').count()==menu.locator('.mf406-picker-option').count()
                assert menu.locator('.mf406-picker-option .v225-btn-icon').count()<=menu.locator('.mf406-picker-option').count()
                assert page.evaluate(f"__MF407TEST__.iconName(document.querySelector('{selector} .mf406-picker-option'))") is None
                menu.locator('summary').click()
                page.wait_for_timeout(50)
                loc=menu.locator('.mf406-picker-panel')
                bounding=loc.bounding_box()
                assert bounding and bounding['x']>=-1 and bounding['x']+bounding['width']<=width+1,(width,kind,bounding)
                results=menu.locator('.mf406-picker-option').evaluate_all('''rows=>rows.map(row=>{let icon=row.querySelector('.mf407-option-icon').getBoundingClientRect();let label=row.querySelector('.mf407-option-label').getBoundingClientRect();return {x:row.getBoundingClientRect().x,ix:icon.x,tx:label.x,icons:row.querySelectorAll('.v225-btn-icon').length,direct:row.querySelectorAll(':scope > .v225-btn-icon').length,justify:getComputedStyle(row).justifyContent,align:getComputedStyle(row).textAlign}})''')
                assert all(r['ix']<r['tx'] and r['direct']==0 and r['align']=='left' for r in results),(width,scope,kind,results)
                if kind=='status': assert [x.get_attribute('data-v406-value') for x in menu.locator('.mf406-picker-option').all()][:2]==['dropped','completed']
                if kind=='priority': assert [x.get_attribute('data-v406-value') for x in menu.locator('.mf406-picker-option').all()]==['high','medium','low']
                if kind=='category':
                    assert [x.get_attribute('data-v406-value') for x in menu.locator('.mf406-picker-option').all()]==['c3','c1','c2']
                    menu.locator('input').fill('movies')
                    assert menu.locator('.mf406-picker-option:visible').count()==2
                    menu.locator('input').fill('zzz')
                    assert menu.locator('.mf406-picker-empty:visible').count()==1
                # Picking an option must still call the original bulk-action handler.
                if kind=='category': menu.locator('input').fill('')
                method=(('batchLibrary' if scope=='library' else 'v274BatchCollection')+kind.title())
                page.evaluate('(method)=>{window.__v407Choice=null;__MF407TEST__.App[method]=(id)=>{window.__v407Choice=id}}',method)
                expected=menu.locator('.mf406-picker-option').first.get_attribute('data-v406-value')
                menu.locator('.mf406-picker-option').first.click()
                assert page.evaluate('window.__v407Choice')==expected,(scope,kind,expected)
                assert not menu.evaluate('el=>el.open'),(scope,kind)
            # no unexpected auto-added circled arrow, scoped to both batch locations
        assert not errors,(width,errors)
        print('PASS width',width,'library + collection; category search only; single icons; viewport; left alignment')
        page.close()
    browser.close()
print('v407 focused UI checks PASS')
