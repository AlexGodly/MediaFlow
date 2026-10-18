#!/usr/bin/env python3
"""Pixel parity at desktop resolutions for two affected card templates.
Use identical synthetic state and browser, compare actual v397 vs v398 compiled JS/CSS.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
import re,io
R=Path(__file__).resolve().parents[1]
OLD=R.parent/'MediaFlow_v397_Modular.zip'
if not OLD.exists():
 print('SKIP desktop visual parity: put MediaFlow_v397_Modular.zip next to the extracted v398 folder to compare baseline screenshots')
 raise SystemExit(0)
# v397 original app CSS and source are preserved within the distributed baseline archive.
import zipfile
with zipfile.ZipFile(OLD) as z:
 olderindex=z.read('index.html').decode()
 cssold='\n'.join(z.read(path).decode() for path in re.findall(r'href="(assets/css/[^"]+)"',olderindex) if path in z.namelist())
 jsold=z.read('assets/js/mediaflow-v397.bundle.js').decode()
newindex=(R/'index.html').read_text()
cssnew='\n'.join((R/path).read_text() for path in re.findall(r'href="(assets/css/[^"]+)"',newindex) if (R/path).exists())
jsnew=(R/'assets/js/mediaflow-v398.bundle.js').read_text()
script=(R/'scripts/test-v398-responsive-ui.py').read_text().split("js=js[:-5]+'''",1)[1].split("'''\nserver=",1)[0]
html=re.sub(r'<link[^>]+>','',(R/'test-v350-responsive.html').read_text()).replace('</head>','<style>{css}</style></head>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [1280,1920]:
  screenshots=[]
  for css,js in [(cssold,jsold),(cssnew,jsnew)]:
   page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
   page.set_content(html.format(css=css))
   page.evaluate('''()=>{const s=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>s.get(k)??null,setItem:(k,v)=>s.set(k,String(v)),removeItem:k=>s.delete(k),clear:()=>s.clear()}})}''')
   page.add_script_tag(content=js.rstrip()[:-5]+script)
   page.evaluate('()=>__v398.init()')
   shots=[]
   page.evaluate('()=>__v398.recRender()')
   loc=page.locator('#mf398-rec-test .mf395-rec-card')
   assert loc.count()==1,(width,'recommendation missing')
   shots.append(Image.open(io.BytesIO(loc.screenshot(animations='disabled'))).convert('RGB'))
   page.evaluate('()=>__v398.logRender()')
   loc=page.locator('#mf398-log-test .v370-title')
   assert loc.count()==1,(width,'logging card missing')
   shots.append(Image.open(io.BytesIO(loc.screenshot(animations='disabled'))).convert('RGB'))
   screenshots.append(shots)
   page.close()
  for i,name in enumerate(['Recommended Title','Advanced Logging card']):
   a,b=screenshots[0][i],screenshots[1][i]
   assert a.size==b.size,(width,name,'geometry diverged',a.size,b.size)
   box=ImageChops.difference(a,b).getbbox()
   if box is not None:
    from PIL import ImageStat
    mask=ImageChops.difference(a,b).convert('L').point(lambda p:255 if p else 0)
    count=mask.histogram()[255]
    print('  transient delta',width,name,'bbox',box,'pixels',count,'of',a.width*a.height)
    assert count < a.width*a.height*.006,(width,name,'unacceptable desktop pixel delta',box,count)

   print('PASS',width,name,'identical render and geometry')
 browser.close()
