#!/usr/bin/env python3
from pathlib import Path
import re, json, shutil, sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
html='''<!doctype html><html><body class="v260-redesign"><div id="app"><aside class="sidebar"></aside><main class="main"></main><nav class="mobile-tabbar"><button class="mtab active"><svg viewBox="0 0 24 24"></svg><span>Dashboard</span></button><button class="mtab"><svg viewBox="0 0 24 24"></svg><span>Library</span></button><button class="mtab"><svg viewBox="0 0 24 24"></svg><span>History</span></button><div class="mobile-more-wrap"><button class="mtab"><svg viewBox="0 0 24 24"></svg><span>More</span></button></div></nav></div></body></html>'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
rows=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 pg=b.new_page(viewport={'width':1080,'height':820})
 pg.set_content(html); pg.add_style_tag(content=css)
 for w in [1280,1081,1080,1024,900,861,860,600,360,320]:
  pg.set_viewport_size({'width':w,'height':820});pg.wait_for_timeout(20)
  rows.append(pg.evaluate('''()=>{const bar=document.querySelector('.mobile-tabbar'),tab=bar.querySelector('.mtab'),side=document.querySelector('.sidebar'),r=bar.getBoundingClientRect(),s=getComputedStyle(tab),bs=getComputedStyle(bar);return {w,side:getComputedStyle(side).display,bar:bs.display,pos:bs.position,h:r.height,bottom:r.bottom,border:s.borderTopWidth,shadow:s.boxShadow,bg:s.backgroundColor,barBg:bs.backgroundColor,barBorder:bs.borderTopWidth,tabRadius:s.borderRadius,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}}'''.replace('{w,','{w:'+str(w)+',')))
 b.close()
print(json.dumps(rows,indent=2))
ok=True
for r in rows:
 if r['w']>=1081:
  ok &= r['side']!='none' and r['bar']=='none'
 else:
  ok &= r['side']=='none' and r['bar']!='none' and r['pos']=='fixed' and 0<r['h']<=100 and abs(r['bottom']-820)<=2 and r['border']=='0px' and r['shadow']=='none' and r['overflow']<=2
if not ok: sys.exit('RESPONSIVE V278 CSS FAILED')
print('RESPONSIVE V278 CSS OK')
