"""MediaFlow v386 real-theme regression: use the canonical --flow and actual
renderLogForm markup, not an injected --accent variable (v384/385 false pass).
No user data, network APIs, cloud writes, or deployment."""
from pathlib import Path
import re,time,subprocess
from playwright.sync_api import sync_playwright
from PIL import Image
R=Path(__file__).resolve().parents[1]
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index))
raw=(R/'test-v350-responsive.html').read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8766/"></head>')
js=(R/'assets/js/mediaflow-v386.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+ '\nwindow.__v386={S,App,renderLogForm};})();'
server=subprocess.Popen(['python','-m','http.server','8766','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280,1920):
   page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   data=page.evaluate('''()=>{
     const x=window.__v386;
     x.S.library=[{id:'demo-1',title:'Demo Anime',categoryId:'anime',status:'Watching',progress:4,total:12}];
     x.S.categories=[{id:'anime',name:'Anime',unit:'episodes'}];
     x.S.logDraft={entries:[],v369Interface:'itemized'};
     let root=document.querySelector('#view-root');if(!root){root=document.createElement('div');root.id='view-root';document.body.appendChild(root);}
     let log=x.renderLogForm({unit:'episodes',low:1,high:3,title:'Demo Anime',categoryId:'anime'},{id:'anime',name:'Anime',unit:'episodes'});root.innerHTML=log;
     return {length:log?.length||0, form:!!root.querySelector('.log-form'), section:!!root.querySelector('.mf383-logging-library'), accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),flow:getComputedStyle(document.documentElement).getPropertyValue('--flow').trim()};
   }''')
   assert data['form'] and data['section'], (width,'Real Logging renderer unavailable',data)
   assert not data['accent'],(width,'--accent unexpectedly defined; test would mask original bug',data)
   loc=page.locator('.log-form details.mf383-logging-library')
   header=loc.locator('summary.mf383-logging-summary')
   def measure(theme):
    page.evaluate('(c)=>document.documentElement.style.setProperty("--flow",c)',theme)
    return page.evaluate('''()=>{
     let el=document.querySelector('.mf383-logging-library'),h=el.querySelector('summary'),b=el.querySelector('.mf383-logging-body');
     let props=e=>{let c=getComputedStyle(e);return {image:c.backgroundImage,color:c.backgroundColor,border:c.borderColor}};
     return {root:props(el),header:props(h),body:props(b),accent:getComputedStyle(el).getPropertyValue('--accent').trim()};
    }''')
   blue=measure('#2184ff')
   red=measure('#eb4e8b')
   assert blue['accent'].startswith('#2184ff') or '33, 132, 255' in blue['accent'],(width,'real theme alias not applied',blue)
   for part in ('root','header','body'):
    assert 'linear-gradient' in blue[part]['image'],(width,part,'gradient missing',blue[part])
    assert blue[part]['image'] != red[part]['image'],(width,part,'unchanged on actual --flow theme',blue[part],red[part])
   # Capture real rendered pixels; CSS substring tests alone let previous releases falsely pass.
   measure('#2184ff')
   header.screenshot(path=str(R/'docs'/f'v386-header-blue-{width}.png')) if width in (390,1280) else None
   if width in (390,1280):
    image=Image.open(R/'docs'/f'v386-header-blue-{width}.png').convert('RGB')
    sample=image.getpixel((image.width//2, max(3,image.height//3)))
    assert sample[2]>sample[0]+18,(width,'real blue screenshot remains gray',sample)
   # Native collapse/expand preserves the tint in both states.
   assert not loc.get_attribute('open'),(width,'expected initially collapsed')
   header.click()
   assert loc.get_attribute('open') is not None,(width,'header toggle broken')
   assert loc.locator('.mf383-logging-body').count(),(width,'expanded controls missing')
   assert loc.locator('input').count()>0,(width,'search input missing after expansion')
   bodybg=loc.locator('.mf383-logging-body').evaluate('(e)=>getComputedStyle(e).backgroundImage')
   assert 'linear-gradient' in bodybg,(width,'expanded body lost colored theme')
   header.click()
   assert loc.get_attribute('open') is None,(width,'collapse broken')
   # Confirm theme switching works in collapsed + expanded state.
   measure('#da50af');header.click()
   assert loc.locator('.mf383-logging-body').evaluate('(e)=>getComputedStyle(e).backgroundImage')!=bodybg
   # Quick mode must render the exact same real theme surface.
   page.evaluate('''()=>{const a=window.__v386;a.S.logDraft.v369Interface='quick';document.querySelector('#view-root').innerHTML=a.renderLogForm({unit:'episodes',low:1,high:3,title:'Demo Anime',categoryId:'anime'},{id:'anime',name:'Anime',unit:'episodes'});document.documentElement.style.setProperty('--flow','#2184ff')}''')
   quick=page.locator('.log-form details.mf383-logging-library')
   assert quick.count()==1,(width,'Quick Logging Library missing')
   assert 'linear-gradient' in quick.locator('summary.mf383-logging-summary').evaluate('(e)=>getComputedStyle(e).backgroundImage'),(width,'Quick Logging header not colored')
   if quick.get_attribute('open') is None:
    quick.locator('summary.mf383-logging-summary').click()
   assert quick.get_attribute('open') is not None,(width,'Quick Logging expansion failed')
   assert 'linear-gradient' in quick.locator('.mf383-logging-body').evaluate('(e)=>getComputedStyle(e).backgroundImage'),(width,'Quick Logging body gray')
   if width==1280:
    page.evaluate("document.documentElement.dataset.theme='light'")
    light=quick.locator('summary.mf383-logging-summary')
    light.screenshot(path=str(R/'docs'/'v386-header-blue-light-1280.png'))
    image=Image.open(R/'docs'/'v386-header-blue-light-1280.png').convert('RGB')
    sample=image.getpixel((image.width//2,max(3,image.height//3)))
    assert sample[2]>sample[0]+18,(width,'light theme remains gray',sample)
   assert not errors,(width,errors[:3])
   print('PASS',width,'real-theme colors, blue pixels, Quick + Per Unit, expanded + collapsed',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
