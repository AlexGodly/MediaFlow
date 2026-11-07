#!/usr/bin/env python3
"""Regression for actual MediaFlow #app root, NOT the nonexistent #view-root.
All production stylesheets (in index.html order) and the v188 DOM contract are tested.
"""
from pathlib import Path
from html import escape
import re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text()
assert '<div id="app">' in index and 'id="view-root"' not in index
css_paths=re.findall(r'<link[^>]+href="(assets/css/[^\"]+\.css)"',index,re.I)
assert css_paths[-1]=='assets/css/224-v412-library-overview-live-layout.css'
css='\n'.join((ROOT/path).read_text(encoding='utf-8') for path in css_paths)
source=(ROOT/'src/js/legacy/120-v188.js').read_text()
bundle=(ROOT/'assets/js/mediaflow-v412.bundle.js').read_text()
for token in ('mf412-overview-icon','mf412-overview-label','v188-library-overview-block'):
    assert token in source and token in bundle,token
assert 'class="ov-name"><span class="mf412-overview-icon"' in source

items=[
 ('🌸','Seasonal Anime','2,597 / ≈2,909 (~89%)',89),
 ('🕓','Missed Anime','492 / ≈3,358 (~15%)',15),
 ('🎞️','Finished Anime','295 / 833 (35%)',35),
 ('📚','Asian Comics','3,918 / ≈4,389 (~89%)',89),
 ('🎬','Anime Movies','5 / 22 (23%)',23),
 ('🎬','Movies','3 / 17 (18%)',18),
 ('📺','TV Series','313 / 600 (52%)',52),
 ('🌸','Anime Backlog','120 / ≈230 (52%)',52),
 ('🎬','Anime Movies Backlog','157,619 / 176,482 (~89%)',89),
 ('📚','Asian Comics Backlog','55,509 / 65,751 (~84%)',84),
 ('📺','TV Series Backlog','157 / ≈215 (~73%)',73),
 ('🎞️','Movies Backlog','1,920 / ≈2,400 (~80%)',80),
 ('📖','Novels','1,425 / 2,436 (59%)',59),
 ('📕','Books','0 / -',0),
 ('🌐','Online Media','2 / 192 (~1%)',1),
 ('🌀','Very Long Personal Category Name With Multiple Words and Metadata','12,345,678 / ≈123,456,789 (~10%)',10),
]
rows=''.join(f'''<div class="overview-row">
<div class="ov-name"><span class="mf412-overview-icon"><span class="cat-icon">{escape(icon)}</span></span><span class="mf412-overview-label">{escape(name)}</span></div>
<div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:{pct}%;background:linear-gradient(90deg,#d74871,#7360a2)"></div></div></div>
<div class="ov-num">{escape(amount)}</div></div>''' for icon,name,amount,pct in items)

fixture=f'''<!doctype html><html lang="en" data-mf262-library="1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style>
<style>:root{{--bg:#f6f6fb;--panel:#f2f0f1;--panel-raised:#f6edf0;--border-soft:#d4d4de;--text:#182033;--text-dim:#354057;--text-mute:#49556a;--flow:#e44b80}}body{{margin:0;background:#f6f6fb;color:#182033;font-family:Arial,sans-serif}}#app{{box-sizing:border-box;max-width:100%;padding:12px;}}.mock-layout{{margin:0 auto;max-width:1900px;min-width:0;width:100%;flex:1 1 auto;box-sizing:border-box}}.cat-icon{{display:inline-grid;place-items:center;min-width:30px;min-height:30px;font-size:20px;}}</style>
</head><body><div id="app"><div class="mock-layout"><div class="library-view-normal"><div class="v183-library-overview-toggle"><div class="v183-library-overview-toggle-copy"><b>Library overview</b><small>Use the same overview visibility in both Normal and Dynamic Library modes.</small></div><div class="v183-library-overview-toggle-actions"><span class="v183-library-overview-toggle-state">Shown</span><button type="button" aria-label="Hide Library overview">●</button></div></div><div class="v183-library-overview-block v188-library-overview-block"><div class="section-label">OVERVIEW · 91% OF KNOWN TRACKED TOTALS CLEARED <span>· ≈ means display-only estimate</span></div><div class="card">{rows}</div></div></div></div></div></body></html>'''

JS='''() => {
 const r=e=>{const x=e.getBoundingClientRect();return {l:x.left,t:x.top,r:x.right,b:x.bottom,w:x.width,h:x.height}};
 const inside=(inner,outer)=>inner.l>=outer.l-1&&inner.r<=outer.r+1&&inner.t>=outer.t-1&&inner.b<=outer.b+1;
 const cards=[...document.querySelectorAll('.v188-library-overview-block .overview-row')].map(el=>({
 card:r(el),name:r(el.querySelector('.ov-name')),icon:r(el.querySelector('.mf412-overview-icon')),
 label:r(el.querySelector('.mf412-overview-label')),num:r(el.querySelector('.ov-num')),
 track:r(el.querySelector('.ov-track')),progress:r(el.querySelector('.progress-track')),
 display:getComputedStyle(el).display,columns:getComputedStyle(el).gridTemplateColumns,
 overflow:el.scrollWidth>el.clientWidth+2
 }));
 return {cards,container:r(document.querySelector('.v188-library-overview-block>.card')),
 gridDisplay:getComputedStyle(document.querySelector('.v188-library-overview-block>.card')).display,
 root:!!document.getElementById('app'),fakeRoot:!!document.getElementById('view-root'),
 pageWidth:document.documentElement.scrollWidth,inside:inside,
 cols:getComputedStyle(document.querySelector('.v188-library-overview-block>.card')).gridTemplateColumns.split(' ').length};
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 cases=[(320,667),(360,740),(390,844),(480,880),(620,850),(768,1024),(820,1000),(1024,768),(1280,800),(1600,900),(1920,1080)]
 for mode in ('normal','dynamic'):
  for width,height in cases:
   page=browser.new_page(viewport={'width':width,'height':height})
   page.set_content(fixture.replace('library-view-normal',f'library-view-{mode}'),wait_until='load')
   result=page.evaluate(JS);cards=result['cards']
   assert result['root'] and not result['fakeRoot'],(mode,width,'wrong DOM root')
   assert result['gridDisplay']=='grid',(mode,width,'grid CSS not active')
   assert len(cards)==len(items),(mode,width,'missing category')
   assert result['pageWidth']<=width+2,(mode,width,'horizontal page overflow',result['pageWidth'])
   assert (result['cols']==1 if width<=480 else (result['cols']>=2 if width>=1024 else result['cols']<=3)),(mode,width,'unexpected cols',result['cols'])
   for i,c in enumerate(cards):
    box=c['card']
    assert c['display']=='grid',(mode,width,i,'row not grid')
    assert len(c['columns'].split(' '))==1,(mode,width,i,'legacy columns leaking',c['columns'])
    assert not c['overflow'],(mode,width,i,'row has scroll overflow')
    assert box['l']>=-1 and box['r']<=width+2,(mode,width,i,'off screen')
    for x in ('name','num','track','progress','label','icon'):
     v=c[x]
     assert v['l']>=box['l']-1 and v['r']<=box['r']+1,(mode,width,i,x,'horizontal intrusion',v,box)
     assert v['t']>=box['t']-1 and v['b']<=box['b']+1,(mode,width,i,x,'vertical intrusion',v,box)
    assert c['name']['b']<=c['num']['t']+1,(mode,width,i,'title/count collided')
    assert c['num']['b']<=c['track']['t']+1,(mode,width,i,'count/bar collided')
    for j in range(i):
     d=cards[j]['card']
     assert (box['l']>=d['r']-1 or d['l']>=box['r']-1 or box['t']>=d['b']-1 or d['t']>=box['b']-1),(mode,width,i,j,'cards collided')
   if mode=='normal' and width in (390,820,1600):
    page.screenshot(path=str(ROOT/f'docs/v412-overview-{width}.png'),full_page=True)
   print(f'PASS {mode} {width}×{height}: {len(cards)} cards, {result["cols"]} columns, no title/count/bar collision')
   page.close()
 # Check narrow Library panel *inside* desktop viewport and zoomed page.
 page=browser.new_page(viewport={'width':1400,'height':900})
 page.set_content(fixture)
 page.locator('.mock-layout').evaluate('(e)=>{e.style.width="540px";e.style.maxWidth="100%";e.style.flex="0 0 540px";}')
 assert page.evaluate(JS)['cols']==1,'container should drive one-column layout'
 page.close()
 page=browser.new_page(viewport={'width':1280,'height':900})
 page.set_content(fixture)
 page.evaluate('document.body.style.zoom="1.75"')
 rr=page.evaluate(JS)
 assert rr['pageWidth']<=1282 and rr['gridDisplay']=='grid','zoom regression'
 page.close()
 # Negative control: the exact v411 selector must FAIL on #app, proving the test
 # would have caught the previously shipped UI issue.
 page=browser.new_page(viewport={'width':1600,'height':900})
 broken_css='\n'.join((ROOT/path).read_text(encoding='utf-8') for path in css_paths[:-1])
 broken_fixture=fixture.replace(f'<style>{css}</style>',f'<style>{broken_css}</style>')
 page.set_content(broken_fixture)
 old=page.evaluate(JS)
 assert old['cards'][0]['display']=='grid' and len(old['cards'][0]['columns'].split(' '))>1, 'negative control did not reproduce broken legacy grid'
 print('PASS negative control: v411-only CSS reproduces broken multi-column row under the actual #app root')
 page.close()
 browser.close()
print('PASS v412 real #app Library Overview regression tests')
