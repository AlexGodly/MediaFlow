"""v385 browser contract: theme-integrated Library, logo baseline, reactive XP UI.
No real Supabase write; production access requires separate authenticated verification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,subprocess,time
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8769/"></head>')
js=(R/'assets/js/mediaflow-v385.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v385={S,App,renderAbout,v383LoggingHeader,renderLevelBlock,mediaFlowLevelInfo,v385RefreshXPViews,v385ScheduleXP,renderStats,renderShell,computeDayStreak,v149MarkStreakDirty,saveState,AUTH:()=>AUTH_READY,authenticate:()=>{AUTH_READY=true},mockSave:(fail=false)=>{V115_STARTUP_GUARD=false;rawSet=async()=>{if(fail)throw new Error('test cloud failure');return true;};lastSaveFailed=false}};})();'''
server=subprocess.Popen(['python','-m','http.server','8769','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.6)
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280,1920):
   p=b.new_page(viewport={'width':width,'height':900})
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(html)
   p.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   p.add_script_tag(content=js)
   p.evaluate('''()=>{
     const a=window.__v385;a.authenticate();
     a.S.library=[{id:'a1',title:'Anime1',categoryId:'seasonal',progress:1,total:12}];
     a.S.categories=[{id:'seasonal',name:'Seasonal Anime',unit:'episodes'}];
     a.S.sessions=[{id:'log1',status:'done',date:new Date().toISOString().slice(0,10),xp:60,categoryId:'seasonal'}];
     a.S.xpLedger={libraryAdditions:{a1:50}};
     a.S.view='stats';a.S.loading=false;
     let root=document.querySelector('#view-root');if(!root){root=document.createElement('div');root.id='view-root';document.body.append(root);}root.innerHTML=a.renderAbout();
     const about=document.querySelector('.mf384-about .mf383-about-brand');about.id='logo-test';
     const shell=document.createElement('div');shell.className='log-form';shell.innerHTML='<details open class="mf383-logging-library"><summary class="mf383-logging-summary">'+a.v383LoggingHeader()+'</summary><div class="mf383-logging-body"><div class="v238-log-library-head">Controls</div><input aria-label="Library filter"></div></details>';document.querySelector('#view-root').append(shell);
     const sidebar=document.createElement('div');sidebar.className='sidebar';sidebar.innerHTML='<div class="sidebar-foot">'+a.renderLevelBlock()+'<div class="k">Day streak</div><div class="v">0 🔥 <span class="v149-sidebar-streak-xp">×1.00 XP</span></div><div>● Saved to cloud storage</div></div>';document.body.append(sidebar);
     document.querySelector('#view-root').insertAdjacentHTML('beforeend','<div class="card stats-level-card"><div class="section-label">LEVELING</div><div><div style="font-family:var(--font-display)">Level 1</div><div class="hint">0 lifetime XP</div></div><div class="stats-level-track"><div class="stats-level-fill" style="width:0%"></div></div><div class="stats-level-meta"><span>0 / 100 XP</span><span class="stats-level-percent">0%</span></div><div class="stats-level-caption"><span>Progress toward Level 2</span><span>100 XP remaining</span></div><div class="record-list"><div class="record-row"><span class="k">Consumption XP</span><span class="v">0</span></div><div class="record-row"><span class="k">Library XP</span><span class="v">0</span></div></div></div>');
     a.v149MarkStreakDirty();a.v385RefreshXPViews(true);
   }''')
   brand=p.locator('#logo-test')
   mark=brand.locator('.mf384-brand-logo');heading=brand.locator('h1')
   assert mark.count() and heading.count(),(width,'logo/heading not found')
   a=mark.bounding_box();h=heading.bounding_box()
   assert abs((a['y']+a['height']/2)-(h['y']+h['height']/2))<5,(width,'logo does not align with wordmark headline',a,h)
   outer=p.locator('.log-form .mf383-logging-library');body=p.locator('.log-form .mf383-logging-body')
   bg1=outer.evaluate('(el)=>getComputedStyle(el).backgroundImage');body1=body.evaluate('(el)=>getComputedStyle(el).backgroundImage')
   p.evaluate("document.documentElement.style.setProperty('--accent','#1c7aff')")
   bg2=outer.evaluate('(el)=>getComputedStyle(el).backgroundImage');body2=body.evaluate('(el)=>getComputedStyle(el).backgroundImage')
   assert bg1!=bg2 and body1!=body2,(width,'header/body not themed')
   before=p.locator('.stats-level-card [style*="font-family"]').inner_text()
   old_total=int(p.locator('.sidebar-foot .xp-line span').first.inner_text().split(' XP')[0].replace(',',''))
   p.evaluate('''()=>{const a=window.__v385;a.S.sessions.push({id:'log2',status:'done',date:new Date().toISOString().slice(0,10),xp:150,categoryId:'seasonal'});a.v149MarkStreakDirty()}''')
   p.wait_for_timeout(190)
   after=p.locator('.stats-level-card [style*="font-family"]').inner_text()
   sidebar_xp=p.locator('.sidebar-foot .xp-line').inner_text()
   stat_xp=p.locator('.stats-level-card .stats-level-meta').inner_text()
   assert before!=after or '260' in sidebar_xp,(width,before,after,sidebar_xp)
   new_total=int(p.locator('.sidebar-foot .xp-line span').first.inner_text().split(' XP')[0].replace(',',''))
   assert new_total>old_total,(width,old_total,new_total,sidebar_xp,stat_xp)
   cloud=p.locator('.mf385-cloud-state')
   assert cloud.count() and cloud.inner_text()=='Cloud status not verified',(width,'cloud incorrectly claims confirmed save')
   if width==390:
    p.evaluate('''async()=>{const a=window.__v385;a.mockSave(false);await a.saveState();await new Promise(r=>setTimeout(r,25))}''')
    assert cloud.inner_text()=='Saved to cloud storage',(width,'success label not based on save result',cloud.inner_text())
    p.evaluate('''async()=>{const a=window.__v385;a.mockSave(true);await a.saveState();await new Promise(r=>setTimeout(r,25))}''')
    assert cloud.inner_text()=='Cloud save failed',(width,'failure label not based on save result',cloud.inner_text())
   assert not errors,(width,errors[:3])
   print('PASS',width,'logo aligned, full theme recolor, live XP patch, cloud unknown state')
   p.close()
  b.close()
finally:
 server.terminate();server.wait(timeout=5)
