"""v367 exhaustive section discovery & mobile overflow audit."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1];raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw) if (R/x).exists())
for n in range(351,368):
 for p in sorted((R/'assets/css').glob(f'*-v{n}-*.css')):
  if p.name not in raw:styles+='\n'+p.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v368.bundle.js').read_text().rstrip();js=js[:-5]+'''\nwindow.__v365Test={S,App,v348RenderSettingsPage,v219RunPageEnhancers};})();'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w in [320,390,820,1280,1920]:
  page=b.new_page(viewport={'width':w,'height':844});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html);page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
  page.add_script_tag(content=js)
  page.evaluate('''()=>{const {S,v348RenderSettingsPage,v219RunPageEnhancers}=window.__v365Test;document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';S.view='settings';S.categories=[{id:'a',name:'Anime',icon:'🍿',color:'#ff7788',target:2,weight:1,unit:'episodes'}];S.library=[];S.sessions=[];S.collections=[];document.querySelector('#view-root').innerHTML='<div class="fade-in">'+v348RenderSettingsPage()+'</div>';v219RunPageEnhancers('settings')}''')
  sections=page.locator('.mf365-section')
  groups=page.locator('.mf365-category-button')
  assert sections.count()==28 and groups.count()==10
  overflow=[]
  for i in range(28):
   info=sections.nth(i).evaluate('el=>[el.dataset.mf365Section,el.closest("[data-mf365-category]").dataset.mf365Category]')
   page.evaluate('''info=>{window.__v365Test.App.v365OpenCategory(info[1]);const target=document.querySelector(`[data-mf365-section="${info[0]}"]`);target.querySelector('.mf365-section-toggle').click();}''',info)
   bounds=page.evaluate('''()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]''')
   if bounds[0]>bounds[1]+3:overflow.append((info,bounds))
   page.evaluate('''info=>document.querySelector(`[data-mf365-section="${info[0]}"]`).querySelector('.mf365-section-toggle').click()''',info)
  print('audit',w,'expanded 28 original sections','overflow',overflow[:5], 'exceptions',errs[:3],flush=True)
  assert not errs,(w,errs[:3]);assert not overflow,(w,overflow[:10]);page.close()
 b.close()
