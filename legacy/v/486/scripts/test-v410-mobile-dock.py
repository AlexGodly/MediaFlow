#!/usr/bin/env python3
"""Offline browser fixture using the actual v410 floating dock markup, handlers and CSS."""
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'src/js/components/290-v397-floating-dock.js').read_text(encoding='utf-8')
js=source.split('function mf397ReadState()',1)[0]
style_list=['00-foundation.css','10-navigation-core-ui.css','210-v397-floating-task-quick-actions.css','211-v398-mobile-tablet-responsive-repair.css','217-v405-floating-settings-layering.css','221-v409-mobile-floating-actions.css','222-v410-mobile-dock-sheet.css']
styles='\n'.join(f'<style>{(ROOT/"assets/css"/name).read_text(encoding="utf-8")}</style>' for name in style_list)
html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">{styles}
<style>
:root{{--flow:#ff3138;--accent:#ff3138;--panel:#303437;--panel-raised:#282d34;--text:#f5ebed;--text-dim:#ced1d3;--border:#66525e;--border-soft:#675e60;--bg:#210f18;}}
body{{background:#210f18;color:white;min-height:110vh;margin:0;font-family:Manrope,system-ui,sans-serif}}
.mock-dashboard{{width:min(100%,480px);padding:10px 8px;box-sizing:border-box;margin:0 auto}}
.mock-dashboard h1{{font:700 31px Georgia,serif;margin:14px 0}}
.mock-card{{height:154px;margin:12px 0;border-radius:14px;background:#33373c;padding:18px;box-sizing:border-box}}
.mock-card.progress-area{{height:88px}}.mock-card.next-task{{height:420px;background:linear-gradient(125deg,#89533a,#23393d);}}
.mock-nav{{position:fixed;bottom:0;left:0;right:0;height:63px;background:#130f17;z-index:950;display:flex;align-items:center;justify-content:space-around;font-size:11px;color:#b9b9ce}}
</style></head><body><main id="app"><aside class="sidebar"></aside><article class="mock-dashboard"><div class="mock-card" style="height:50px">Dashboard • Sync Now</div><h1>Today</h1><div class="mock-card">Inuyashiki</div><div class="mock-card progress-area">3 / 8 tasks complete</div><div class="mock-card progress-area">11h 58m / 5h</div><div class="mock-card progress-area">31 day streak</div><div class="mock-card next-task">NEXT TASK<br><h1>TV Series</h1>Consume 4–6 episodes</div></article></main><nav class="mock-nav">Dashboard　 Library　Collections　Personal Order　 More</nav>
<script>{js}
function mf397Update(){{document.getElementById('mf397-progress')?.classList.toggle('compact',MF397.compact);}}
function mf397Action(action){{window.lastAction=action;mf397SetMenu(false);}}
mf397Ensure();mf397Update();
document.getElementById('mf397-progress').hidden=false;
</script></body></html>'''

cases=[(320,667),(344,640),(390,844),(480,880),(640,360),(720,1050),(820,1000),(1280,800)]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in cases:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.set_content(html,wait_until='load')
        page.wait_for_timeout(150)
        info=page.evaluate('''() => { const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,r:r.right,b:r.bottom}};
          return {dock:rect(document.getElementById('mf397-dock')),fab:rect(document.getElementById('mf397-fab')),progress:rect(document.getElementById('mf397-progress')),compact:MF397.compact,scrollWidth:document.documentElement.scrollWidth};}''')
        assert info['scrollWidth'] <=width+1,(width,'document overflow',info)
        if width<=720:
            assert info['compact'],(width,'mobile progress should start minimized')
            assert abs(info['progress']['y'] - info['fab']['y'])<12,(width,'non-row dock',info)
            assert info['progress']['r'] <=info['fab']['x']+3,(width,'progress collides with Add',info)
            assert info['progress']['w']<=125 and info['fab']['w']<=48,(width,'controls too bulky',info)
            assert info['fab']['r']<=width and info['fab']['r']>=width-30,(width,'fab off right edge',info)
        if width in (320,390,480):
            page.screenshot(path=str(ROOT/f'v410-closed-{width}.png'))
        page.locator('#mf397-fab').click()
        page.wait_for_timeout(280)
        cards=page.evaluate('''() => { const r=x=>{const v=x.getBoundingClientRect();return {l:v.left,r:v.right,t:v.top,b:v.bottom,h:v.height}};
         return {fan:r(document.getElementById('mf397-fan')),cards:[...document.querySelectorAll('.mf397-fan-action')].map(r),visible:getComputedStyle(document.getElementById('mf397-fan')).visibility,expanded:document.getElementById('mf397-fab').getAttribute('aria-expanded'),scrollWidth:document.documentElement.scrollWidth,progressDisplay:getComputedStyle(document.getElementById('mf397-progress')).display}; }''')
        assert cards['visible']=='visible' and cards['expanded']=='true',(width,'menu did not open')
        assert cards['scrollWidth']<=width+1,(width,'menu caused horizontal overflow',cards)
        for c in cards['cards']:
            assert 0<=c['l'] and c['r']<=width+0.5,(width,'clipped card',c)
            assert c['h']>40,(width,'tap target too small',c)
            if height>540:assert c['t']>=0 and c['b']<=height,(width,'vertical clip',c)
        if width<=720:
            assert cards['progressDisplay']=='none',(width,'task progress covers open sheet')
            assert cards['fan']['r']<=width+0.5 and cards['fan']['l']>=-0.5,(width,'sheet width problem')
            if width in (320,390,480):page.screenshot(path=str(ROOT/f'v410-preview-{width}.png'))
        else:
            assert not info['compact'],(width,'desktop default changed')
        page.keyboard.press('Escape')
        assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='false',(width,'escape close')
        page.locator('#mf397-collapse').click()
        page.wait_for_timeout(390)
        if width<=720:
            expanded=page.locator('#mf397-progress').bounding_box()
            assert expanded['width']>200 and expanded['y']+expanded['height'] < info['fab']['y'] + 5,(width,'progress expansion',expanded)
        page.locator('#mf397-fab').click()
        page.locator('#mf397-dimmer').click(position={'x':16,'y':16},force=True)
        assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='false',(width,'backdrop close')
        page.close()
        print(f'PASS {width}×{height}: closed dock / mobile sheet / 3 actions / progress expansion / Escape and backdrop / no overflow')
    browser.close()
print('PASS v410 mobile controls and desktop regression')
