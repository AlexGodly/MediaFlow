#!/usr/bin/env python3
"""Actual Settings Center mount test, not merely a legacy renderSettings() snapshot."""
from pathlib import Path
import subprocess,time,re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text();index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<meta name="mediaflow-version" content="405"><style>'+css+'</style><base href="http://127.0.0.1:8835/"></head>')
js=(R/'assets/js/mediaflow-v405.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__settingsV405={S,App,mount:()=>{
 V115_STARTUP_GUARD=false;AUTH_USER={id:'v405-settings-test',email:'test@local'};
 S.view='settings';S.logging=false;S.modal=null;S.sessionActive=false;
 S.categories=[{id:'seasonal',name:'Seasonal Anime',unit:'episodes',seasonal:true,enabled:true,target:2,weight:3}];
 S.library=[];S.sessions=[];S.activityLog=[];S.collections=[];S.orderPlan={};S.completionTimeline=[];
 S.settings=S.settings||{};S.settings.v380EpisodeProvider='automatic2';S.settings.seasonalFreshAuto=true;
 S.settings.exactTitleRecommendations=true;S.settings.v401RecommendFreshOnly=false;
 S.xpLedger={};renderShell();
}};})();'''
server=subprocess.Popen(['python','-m','http.server','8835','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280]:
   page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('()=>__settingsV405.mount()')
   status=page.evaluate('''()=>{
     const settings=document.querySelector('#view-root .mf365-settings-center');
     const rec=settings?.querySelector('[data-mf401-filter="recommendations"]');
     const section=rec?.closest('.mf365-section');
     return {settings:!!settings,rec:!!rec,section:section?.dataset.mf365Section,neighbor:rec?.previousElementSibling?.className};
   }''')
   assert status['settings'] and status['rec'] and 'mf404-recommend-divider' in status['neighbor'],(width,status,errors)
   result=page.evaluate('''()=>{
      const s=document.querySelector('.mf365-settings-center');const rows=[...s.querySelectorAll('[data-mf405-setting]')];const dock=document.getElementById('mf397-dock');
      return {rows:rows.map(r=>r.dataset.mf405Setting),section:rows[0]?.closest('.mf365-section')?.dataset.mf365Section,category:rows[0]?.closest('.mf365-detail')?.dataset.mf365Category,dock:!!dock,
        menu:!!document.getElementById('mobile-more-menu'),count:rows.length,addVisible:document.querySelector('.mf397-plus-holder')?.offsetParent!==null};
   }''')
   assert result['count']==2 and set(result['rows'])=={'add','progress'},(width,result,errors)
   assert result['section']=='v221-settings-floating-controls' and result['category']=='appearance',(width,result)
   if width<=820: assert result['menu'],(width,'The real responsive More menu was not rendered',result)
   page.evaluate('()=>App.v405ToggleFloating("add")')
   toggled=page.evaluate('''()=>({on:S.settings.v405ShowFloatingAdd,addHidden:document.getElementById('mf397-dock')?.classList.contains('mf405-hide-add'),pressed:document.querySelector('[data-mf405-setting="add"] [role="switch"]')?.getAttribute('aria-checked')})''') if False else None
   toggled=page.evaluate('''()=>({pressed:document.querySelector('[data-mf405-setting="add"] [role="switch"]')?.getAttribute('aria-checked'),cls:document.getElementById('mf397-dock')?.classList.contains('mf405-hide-add'),audit:window.MediaFlowV405.audit()})''')
   assert toggled['pressed']=='false' and toggled['cls'],(width,toggled)
   assert toggled['audit']['ok'],(width,toggled['audit']['issues'])
   page.evaluate("""()=>{
      const menu=document.getElementById('mobile-more-menu');
      if(!menu){const node=document.createElement('div');node.id='mobile-more-menu';node.className='mobile-more-menu v296-more-menu hide';document.body.append(node);}
      const m=document.getElementById('mobile-more-menu');m.classList.remove('hide');window.MediaFlowV405.syncDock();
   }""")
   menu=page.evaluate("""()=>({hidden:document.getElementById('mf397-dock').classList.contains('mf405-more-obscured'),inert:document.getElementById('mf397-dock').inert})""")
   assert menu['hidden'] and menu['inert'],(width,menu)
   page.evaluate("""()=>{document.getElementById('mobile-more-menu').classList.add('hide');window.MediaFlowV405.syncDock();}""")
   assert not page.evaluate("""()=>document.getElementById('mf397-dock').inert"""),(width,'dock failed to restore')
   page.evaluate("""()=>App.v405ToggleFloating('progress')""")
   assert page.evaluate("""()=>document.querySelector('#mf397-dock').classList.contains('mf405-hide-progress')"""),width
   page.evaluate("""()=>{const rows=document.querySelectorAll('[data-mf405-setting]');if(rows.length!==2)throw Error('Settings missing');__settingsV405.S.settings.v405ShowFloatingAdd=true;window.MediaFlowV405.syncDock();}""")
   assert not page.evaluate("""()=>document.querySelector('#mf397-dock').classList.contains('mf405-hide-add')"""),width
   assert not errors,(width,errors[:2]);print('PASS',width,'floating controls mounted, classified and hidden; transfer audit OK',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
