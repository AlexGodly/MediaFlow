#!/usr/bin/env python3
"""v411 regression: Library Overview geometry under real v410/v411 cascade.
Fixture uses production Overview class names and the real stylesheet order.
No user data, network, or Supabase access is required.
"""
from pathlib import Path
from html import escape
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
assets = re.findall(r'<link[^>]+href="(assets/css/[^"]+\.css)"', (ROOT / 'index.html').read_text(), re.I)
styles = '\n'.join(f'<style>{(ROOT / asset).read_text(encoding="utf-8")}</style>' for asset in assets)
categories = [
 ('🌸','Seasonal Anime','2,597 / ≈2,909 (~89%)',89),
 ('🕓','Missed Anime','351 / ≈2,107 (~17%)',17),
 ('🎞️','Finished Anime','295 / 833 (35%)',35),
 ('📚','Asian Comics','3,918 / ≈4,389 (~89%)',89),
 ('🎬','Anime Movies','5 / 22 (23%)',23),
 ('🎬','Movies','3 / 17 (18%)',18),
 ('📺','TV Series','313 / 600 (52%)',52),
 ('🌸','Anime Backlog','120 / ≈230 (52%)',52),
 ('🎬','Anime Movies Backlog','157,619 / 176,440 (~89%)',89),
 ('📚','Asian Comics Backlog','55,509 / 65,751 (~84%)',84),
 ('📺','TV Series Backlog','157 / ≈215 (~73%)',73),
 ('🎞️','Movies Backlog','1,920 / ≈2,400 (~80%)',80),
 ('📖','Novels','1,425 / 2,436 (59%)',59),
 ('📕','Books','0 / -',0),
 ('🌐','Online Media','2 / 192 (~1%)',1),
 ('🎭','A Very Long Configured Category Name That Must Wrap Without Colliding','8,888,888 / ≈12,345,678 (~72%)',72),
]
rows = ''.join(f'''<div class="overview-row">
  <div class="ov-name"><span class="cat-icon">{escape(icon)}</span> {escape(name)}</div>
  <div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:{pct}%; background:linear-gradient(90deg,#df4d7c,#8660a4)"></div></div></div>
  <div class="ov-num">{escape(amount)}</div></div>''' for icon,name,amount,pct in categories)

html=f'''<!doctype html><html lang="en" data-mf262-library="1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{styles}
<style> :root{{--bg:#f6f6fb;--panel:#f2f0f1;--panel-raised:#f6edf0;--border-soft:#d4d4de;--text:#182033;--text-dim:#354057;--text-mute:#49556a;--flow:#e44b80}}body{{margin:0;background:#f6f6fb;color:#182033;font-family:Manrope,Arial,sans-serif}}#view-root{{width:100%;box-sizing:border-box;padding:12px}}.mock-layout{{margin:auto;max-width:1600px}} .test-constrained{{width:580px;max-width:100%}} .cat-icon{{font-size:24px;display:grid;place-items:center;min-width:32px;min-height:32px}} </style></head>
<body class="v260-redesign"><main id="view-root"><div class="mock-layout"><div class="v183-library-overview-toggle"><div class="v183-library-overview-toggle-copy"><b>Library overview</b><small>Use the same overview visibility in both Normal and Dynamic Library modes.</small></div><div class="v183-library-overview-toggle-actions"><span class="v183-library-overview-toggle-state">Shown</span><button type="button" aria-label="Hide Library overview">●</button></div></div>
<div class="v183-library-overview-block v188-library-overview-block"><div class="section-label">OVERVIEW · 91% OF KNOWN TRACKED TOTALS CLEARED · ≈ means display-only estimate</div><div class="card">{rows}</div></div></div></main></body></html>'''
FIXTURE = ROOT / 'scripts' / '.test-v411-overview.fixture.html'
FIXTURE.write_text(html,encoding='utf-8')

cases=[(320,667),(360,740),(390,844),(480,880),(600,900),(768,1024),(820,1000),(1024,768),(1280,800),(1600,900)]
try:
  with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in cases:
      page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
      page.set_content(html,wait_until='load')
      page.wait_for_timeout(120)
      result=page.evaluate('''() => {
        const rect = e => {const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}};
        const cards=[...document.querySelectorAll('.v188-library-overview-block .overview-row')].map(row=>({
          card:rect(row),name:rect(row.querySelector('.ov-name')),num:rect(row.querySelector('.ov-num')),track:rect(row.querySelector('.ov-track')),fill:rect(row.querySelector('.progress-track')),
          overflow:row.scrollWidth>row.clientWidth+2,
          display:getComputedStyle(row).display
        }));
        return {cards,viewport:document.documentElement.scrollWidth,container:rect(document.querySelector('.v188-library-overview-block>.card')),
          toggle:rect(document.querySelector('.v183-library-overview-toggle')),columns:getComputedStyle(document.querySelector('.v188-library-overview-block>.card')).gridTemplateColumns.split(' ').length,
          brokenNames:cards.filter(c=>c.name.w<80)};
      }''')
      assert result['viewport']<=width+1,(width,'page horizontal overflow',result['viewport'])
      assert len(result['cards'])==len(categories),(width,'missing cards')
      assert result['columns']<=5,(width,'excessive columns',result['columns'])
      if width<601: assert result['columns']==1,(width,'expected one mobile column',result['columns'])
      for i,card in enumerate(result['cards']):
        c=card['card']; assert card['display']=='grid',(width,'old layout still active',i)
        assert c['l']>=-1 and c['r']<=width+1,(width,'clipped row',i,c)
        assert not card['overflow'],(width,'overflow inside category card',i)
        for target in ('name','num','track','fill'):
          r=card[target]
          assert r['l']>=c['l']-1 and r['r']<=c['r']+1,(width,'horizontal content overlap',i,target,r,c)
          assert r['t']>=c['t']-1 and r['b']<=c['b']+1,(width,'vertical content clipped',i,target,r,c)
        assert card['name']['b']<=card['num']['t']+1,(width,'name/count colliding',i)
        assert card['num']['b']<=card['track']['t']+1,(width,'count/track colliding',i)
        for j in range(i):
          d=result['cards'][j]['card']
          assert (c['l']>=d['r']-1 or d['l']>=c['r']-1 or c['t']>=d['b']-1 or d['t']>=c['b']-1),(width,'cards collide',i,j,c,d)
      if width in (390,820,1600):
        path=ROOT/f'docs/v411-overview-{width}.png'
        page.screenshot(path=str(path),full_page=True)
      print(f'PASS {width}×{height}: {len(categories)} cards, {result["columns"]} columns, names/counts/bars separated, no overflow')
      page.close()
    # Desktop sidebar/split pane: Layout should adjust to CONTAINER not window.
    page=browser.new_page(viewport={'width':1400,'height':900})
    page.set_content(html);page.locator('.mock-layout').evaluate('(el)=>el.classList.add("test-constrained")')
    assert page.evaluate('getComputedStyle(document.querySelector(".v188-library-overview-block>.card")).gridTemplateColumns.split(" ").length')==1
    assert page.evaluate('document.documentElement.scrollWidth')<=1400
    print('PASS constrained 580px Library pane at 1400px viewport')
    page.close();browser.close()
finally:
  FIXTURE.unlink(missing_ok=True)
print('PASS v411 responsive Library Overview checks')
