#!/usr/bin/env python3
"""Real Chromium layout regression for rerolls modal at multiple cover sizes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, base64
root=Path(__file__).resolve().parents[1]
idx=(root/'index.html').read_text()
css=[x for x in re.findall(r'<link[^>]+href="([^"]+\.css)"',idx) if (root/x).exists()]
fixture=root/'tests/v301-rerolls-fixture.html'
image_url="data:image/png;base64,"+base64.b64encode((root/"assets/category-icons/seasonal-anime.png").read_bytes()).decode()
rows=[]
for i in range(22):
    title=('A Very Long Seasonal Anime Recommendation Title That Continues to Be Readable '+str(i)+' And Still Contains Lots Of Words') if i%3==0 else ['Sono Bisque Doll wa Koi wo Suru','My Dress-Up Darling: Season Two','Kimino Kotoga Daidaidaidaisuki na 100-nin no Kanojo'][i%3]
    rows.append(f'''<div class="v180-history-row {'current' if i==21 else ''}"><img class="v180-history-cover" src="{image_url}" alt="cover"><div class="v180-history-copy"><b title="{title}">{title}</b><div class="v180-history-meta"><span>Recommendation #{i+1}</span><span>{'Initial pick' if i==0 else f'Reroll #{i}'}</span><span class="v180-history-badge {'eligible' if i==0 else 'extra'}">{'Respect slot 1/1' if i==0 else 'Extra reroll'}</span></div></div><div class="v180-history-actions"><button class="btn btn-sm btn-ghost">✎ Edit</button></div></div>''')
html=f'''<!doctype html><html data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>v301 reroll UI regression</title>{''.join(f'<link rel="stylesheet" href="../{x}">' for x in css)}</head><body class="v260-redesign"><div class="modal-overlay v301-rerolls-overlay" id="v180-reroll-history"><div class="modal v180-history-modal v301-rerolls-modal" role="dialog" aria-modal="true" aria-labelledby="v301-rerolls-heading"><div class="v180-history-head"><div><div class="modal-title" id="v301-rerolls-heading" style="margin:0;padding:0;background:none;">Current rerolls</div><div class="v180-history-summary">🌸 Seasonal Anime · 21 title rerolls · 22 recommendations shown</div></div><button class="btn btn-sm btn-ghost">✕ Close</button></div><div class="v180-respect-explain">This task can earn exact-title Respect XP from the <b>first 1 exact title</b> MediaFlow recommends. You can reroll as much as you want without a reroll penalty. Extra recommendations stay available to watch, but a title shown after the task's Respect slots does not retroactively replace a missed earlier recommendation.</div><div class="v180-history-list v301-rerolls-scroll" tabindex="0" role="region" aria-label="Current title reroll recommendations">{''.join(rows)}</div></div></div></body></html>'''
fixture.write_text(html)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    for width,height in [(1440,900),(800,720),(390,740),(320,640)]:
      page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
      page.set_content(html,wait_until='domcontentloaded')
      page.add_style_tag(content='\n'.join((root/x).read_text(errors='replace') for x in css))
      for scale in [1,2,4,8]:
        page.evaluate('(v)=>document.documentElement.style.setProperty("--v181-cover-reroll-history",v)',scale)
        page.locator('.v301-rerolls-scroll').evaluate('(el)=>el.scrollTop=0')
        metrics=page.evaluate('''() => {
          const o=document.querySelector('#v180-reroll-history'),m=document.querySelector('.v301-rerolls-modal'),l=document.querySelector('.v301-rerolls-scroll');
          const row=l.querySelector('.v180-history-row'),cover=row.querySelector('img'),title=row.querySelector('.v180-history-copy'),btn=row.querySelector('.v180-history-actions');
          const a=(e)=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height};};
          return {modal:a(m),row:a(row),cover:a(cover),copy:a(title),action:a(btn),list:{height:l.clientHeight,scrollHeight:l.scrollHeight,scrollTop:l.scrollTop,overflow:getComputedStyle(l).overflowY},horiz:document.documentElement.scrollWidth>innerWidth};
        }''')
        assert not metrics['horiz'],(width,scale,'overflow body',metrics)
        assert metrics['cover']['width'] <= (70.1 if width<=380 else 90.1 if width<=680 else 124.1),(width,scale,'cover not capped',metrics)
        assert metrics['cover']['right']<=metrics['copy']['x']+1,(width,scale,'cover overlaps title',metrics)
        if width>680: assert metrics['copy']['right']<=metrics['action']['x']+1,(width,scale,'title overlaps action',metrics)
        assert metrics['modal']['x']>=-1 and metrics['modal']['right']<=width+1,(width,scale,'modal outside viewport',metrics)
        assert metrics['modal']['bottom']<=height+1,(width,scale,'modal overflows vertically',metrics)
        assert metrics['list']['scrollHeight']>metrics['list']['height'],(width,scale,'not actually scrollable',metrics)
        page.locator('.v301-rerolls-scroll').hover()
        page.mouse.wheel(0,480)
        page.wait_for_timeout(140)
        after=page.locator('.v301-rerolls-scroll').evaluate('(el)=>el.scrollTop')
        assert after>0,(width,scale,'wheel scrolling failed',after)
        results.append(f'PASS {width}x{height} cover={scale}x; list scroll {metrics["list"]["height"]}→top {after}; no overlap/overflow')
        if scale==4 and width in (1440,390):
          page.locator('.v301-rerolls-scroll').evaluate('(el)=>el.scrollTop=0')
          page.screenshot(path=str(root/f'v301-rerolls-preview-{width}.png'),full_page=False)
      page.close()
    browser.close()
for line in results:print(line)
print(f'PASS all {len(results)} viewport+cover combinations')
