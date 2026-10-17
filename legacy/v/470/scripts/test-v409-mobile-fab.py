#!/usr/bin/env python3
"""Local mobile Quick Actions regression using actual v409 CSS and markup.
No network, login, production data, or deployment needed.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'src/js/components/290-v397-floating-dock.js').read_text(encoding='utf-8')
markup=source.split('function mf397HasBlockingDialog()',1)[0]
set_menu='function mf397SetMenu'+source.split('function mf397SetMenu',1)[1].split('function mf397ReadState()',1)[0]
styles=['00-foundation.css','10-navigation-core-ui.css','210-v397-floating-task-quick-actions.css','211-v398-mobile-tablet-responsive-repair.css','217-v405-floating-settings-layering.css','221-v409-mobile-floating-actions.css']
with TemporaryDirectory(dir=ROOT) as td:
    html=Path(td)/'dock-fixture.html'
    links='\n'.join(f'<style>{(ROOT/'assets/css'/name).read_text(encoding="utf-8")}</style>' for name in styles)
    html.write_text(f'''<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta charset="utf-8">{links}<style>body{{background:#0e111a;color:#f2f5fc;min-height:120vh}}:root{{--flow:#36d1f1;--accent:#36d1f1;--panel:#171c29;--panel-raised:#1d2734;--text:#effaff;--text-dim:#aab7c7;--border:#253e48;--border-soft:#304853;--bg:#0e111a;}}</style></head><body><main id="app"><aside class="sidebar"></aside><article>Dashboard fixture</article></main><script>{markup}\n{set_menu}\ndocument.body.insertAdjacentHTML('beforeend',mf397Markup());
 document.getElementById('mf397-fab').addEventListener('click',()=>mf397SetMenu(!MF397.open));
 document.getElementById('mf397-dimmer').addEventListener('click',()=>mf397SetMenu(false));
 document.addEventListener('keydown',e=>{{if(e.key==='Escape')mf397SetMenu(false);}});
 document.addEventListener('click',e=>{{if(MF397.open&&!e.target.closest('.mf397-plus-holder'))mf397SetMenu(false);}});
 </script></body></html>''',encoding='utf-8')
    cases=[(320,667),(344,640),(390,844),(480,880),(640,360),(720,1050),(820,1000),(1280,800)]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        for width,height in cases:
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            page.set_content(html.read_text(encoding="utf-8"),wait_until="load")
            page.locator('#mf397-fab').click()
            page.wait_for_timeout(440)
            info=page.evaluate('''() => {
              const rect = x => {const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
              return {vw:innerWidth, vh:innerHeight, cards:[...document.querySelectorAll('.mf397-fan-action')].map(rect), fab:rect(document.getElementById('mf397-fab')), fan:rect(document.getElementById('mf397-fan')), visible:getComputedStyle(document.getElementById('mf397-fan')).visibility, over:document.documentElement.scrollWidth>innerWidth};
            }''')
            assert info['visible']=='visible',f'{width} menu not visible'
            assert not info['over'],f'{width}: horizontal page overflow'
            for idx,card in enumerate(info['cards']):
                assert card['left']>=-0.5 and card['right']<=width+0.5, f'{width}: action {idx} clipped: {card}'
                assert card['width']>=180, f'{width}: action too narrow {card}'
                if height>=540:assert 0<=card['top']<=height and card['bottom']<=height, f'{width}: vertical clipping {card}'
            if width<=720:
                assert info['fab']['right']>width-30,f'{width}: fab moved away from right viewport edge'
                assert info['fan']['right']<=width+.5, f'{width}: menu outer overflow'
            if width in (320,390,480,820):
                page.screenshot(path=str(ROOT/f'v409-preview-{width}.png'))
            # Test actual click toggling, outside/escape/dimmer dismissal.
            page.keyboard.press('Escape')
            assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='false'
            # Progress mode must not push fab sideways on phones and must
            # not display progress over an open menu.
            page.locator('#mf397-progress').evaluate('(el)=>el.hidden=false')
            page.locator('#mf397-fab').click()
            assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='true'
            if width<=720:
                assert page.locator('#mf397-progress').evaluate('(el)=>getComputedStyle(el).display')=='none'
            page.mouse.click(20,20)
            assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='false'
            page.close()
            print(f'PASS {width}x{height}: 3 fully visible actions; right FAB; menu open/close; no document overflow')
        browser.close()
print('PASS: v409 responsive floating quick actions')
