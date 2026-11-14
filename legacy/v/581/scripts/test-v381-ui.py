"""v381 compiled application: provider labels, one semantic icon per action, screen widths; synthetic local state."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v381.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v381test={S,App,v166SeasonalSettingsHtml,v166SeasonalStatusText,v381UnifyIcons,v377EnsureJikanState,v377ShowUnmatchedReport};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,1280):
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  result=page.evaluate('''()=>{
    const d=window.__v381test,s=d.S;
    s.settings=s.settings||{};
    s.settings.seasonalFreshAuto=true;
    s.settings.seasonalFreshCount=70;
    s.categories=[{id:'anime',name:'Seasonal Anime',seasonal:true}];
    s.library=[{id:'a',title:'Test Anime',categoryId:'anime',progress:2,total:12,externalIds:{mal:'123'}}];
    const result={};
    for(const mode of ['automatic','tenrai','anizip','anilist','tvmaze','kitsu']){
      s.settings.v380EpisodeProvider=mode;
      const shell=document.createElement('div');shell.innerHTML=d.v166SeasonalSettingsHtml();
      const label=shell.querySelector('.v166-seasonal-auto-actions .pill')?.textContent||'';
      result[mode]={label,select:shell.querySelector('.mf380-provider-select select')?.value,buttons:shell.querySelectorAll('.mf377-jikan-report-actions button').length,
       icons:Array.from(shell.querySelectorAll('.mf377-jikan-report-actions button')).map(b=>b.querySelectorAll(':scope > .mf380-icon,:scope > .v225-btn-icon').length)};
    }
    return result;
  }''')
  for mode, expected in [('automatic','Multi-Provider'),('tenrai','Tenrai'),('anizip','AniZip'),('anilist','AniList'),('tvmaze','TVmaze'),('kitsu','Kitsu')]:
   d=result[mode]
   assert expected in d['label'],(width,mode,'bad label',d,errors)
   assert d['select']==mode,(width,mode,'bad selection',d,errors)
   assert d['buttons']==3,(width,mode,'buttons missing',d,errors)
   assert d['icons']==[1,1,1],(width,mode,'duplicate icons',d,errors)
  # Rerender same generated button row with the global semantic renderer active.
  page.evaluate('''()=>{
   const d=window.__v381test;
   document.querySelector('#app').innerHTML='<div id="view-root"></div>';
   const shell=document.createElement('div');shell.innerHTML=d.v166SeasonalSettingsHtml();
   document.getElementById('view-root').appendChild(shell);
  }''')
  page.wait_for_timeout(250)
  icons=page.evaluate('''()=>Array.from(document.querySelectorAll('.mf377-jikan-report-actions button')).map(b=>b.querySelectorAll(':scope > .mf380-icon,:scope > .v225-btn-icon').length)''')
  assert icons==[1,1,1],(width,'global icon pass added duplicates',icons,errors)
  assert not errors,(width,'uncaught browser errors',errors[:4])
  print('PASS',width,'provider selection/initial label, action icons remain single after rerender',flush=True)
  page.close()
 browser.close()
