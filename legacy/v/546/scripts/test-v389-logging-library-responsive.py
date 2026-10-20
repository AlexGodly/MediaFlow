"""v389 real Logging renderer responsive layout test; synthetic data only.
Checks that controls cannot overlap or escape Browse Library at narrow widths,
in Quick/Per Unit and in a constrained tablet panel.
"""
from pathlib import Path
import re, subprocess, time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
raw=(R/'test-v350-responsive.html').read_text()
html=re.sub(r'<link[^>]+>', '',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8790/"></head>')
js=(R/'assets/js/mediaflow-v389.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+ '\nwindow.__v389={S,App,renderLogForm,V378_LOG_UI,setOpen:(v)=>{V238_LOG_LIBRARY_OPEN=!!v;}};})();'
server=subprocess.Popen(['python','-m','http.server','8790','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,360,390,481,600,820,1280,1920):
   for mode in ('quick','itemized'):
    page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html)
    page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
    page.add_script_tag(content=js)
    page.evaluate('''(width)=>{document.body.classList.add('v260-redesign');document.documentElement.dataset.v238Layout=width<=600?'mobile':width<=950?'tablet':'desktop';}''',width)
    data=page.evaluate('''(mode)=>{
      const x=__v389;
      x.S.library=Array.from({length:17},(_,i)=>({id:'demo-'+i,title:'MediaFlow Sample Movie '+i,categoryId:'movie',status:'planned',priority:'medium',progress:0,total:12}));
      x.S.categories=[{id:'movie',name:'Movies',unit:'episodes'}];
      x.S.logDraft={entries:[],v369Interface:mode}; x.S.entryDraft={title:"",qty:1,libraryId:null,endProgress:""};x.setOpen(true);
      const root=document.querySelector('#view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));
      root.innerHTML=x.renderLogForm({unit:'episodes',low:1,high:3,title:'Demo title',categoryId:'movie'},{id:'movie',name:'Movies',unit:'episodes'});
      const details=root.querySelector('.mf383-logging-library'); details.open=true;
      return {details:!!details,actions:details.querySelectorAll('.mf378-library-actions button').length,filter:!!details.querySelector('.v224-log-tools')};
    }''',mode)
    assert data['details'] and data['actions']==3 and data['filter'],(width,mode,'missing UI',data)
    checks=page.evaluate('''()=>{
     const detail=document.querySelector('.mf383-logging-library');
     const tools=detail.querySelector('.v224-log-tools'),actions=detail.querySelector('.mf378-library-actions');
     const get=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height,display:getComputedStyle(e).display};};
     const measure=(node)=>{
       const parent=get(node);const items=[...node.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>({...get(e),name:(e.getAttribute('aria-label')||e.innerText||e.className).trim().slice(0,44)}));
       const escape=items.filter(e=>e.x<parent.x-2||e.r>parent.r+2);
       const overlap=[];
       for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
        const a=items[i],b=items[j]; const intersection=(Math.min(a.r,b.r)-Math.max(a.x,b.x))*(Math.min(a.b,b.b)-Math.max(a.y,b.y));
        if(Math.min(a.r,b.r)-Math.max(a.x,b.x)>2&&Math.min(a.b,b.b)-Math.max(a.y,b.y)>2)overlap.push([a.name,b.name]);
       }
       return {parent,items,escape,overlap,columns:getComputedStyle(node).gridTemplateColumns};
     };
     const inner=actions.querySelector('label:first-child select');
     return {filter:measure(tools),actions:measure(actions),body:get(detail.querySelector('.mf383-logging-body')),docWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,
       select:get(inner), buttons:[...actions.querySelectorAll('button')].map(get)};
    }''')
    assert not checks['filter']['escape'],(width,mode,'filter escapes',checks['filter'])
    assert not checks['actions']['escape'],(width,mode,'action escapes',checks['actions'])
    assert not checks['filter']['overlap'],(width,mode,'filter overlap',checks['filter'])
    assert not checks['actions']['overlap'],(width,mode,'action overlap',checks['actions'])
    assert checks['select']['w']>=75,(width,mode,'display selector too small',checks['select'])
    assert all(b['h']>=32 for b in checks['buttons']),(width,mode,'button too small',checks['buttons'])
    assert not errors,(width,mode,'page errors',errors[:3])
    if width in (320,390,820,1280) and mode=='quick':
      detail=page.locator('.mf383-logging-library')
      detail.screenshot(path=str(R/'docs'/f'v389-logging-library-{width}.png'))
    # All five Library display modes must remain interactive and inside the panel.
    for layout in ('list','compact','cards','covers','covers-titles'):
     page.evaluate('(layout)=>__v389.App.v378LogView(layout)',layout)
     card=page.evaluate('''()=>{const container=document.querySelector('.mf378-picker'); const r=container?.getBoundingClientRect();const items=container?[...container.querySelectorAll(':scope>.log-suggestion')].map(e=>e.getBoundingClientRect()):[];return {view:container?.className, overflow:items.some(b=>b.x < r.x-2||b.right>r.right+2),count:items.length};}''')
     assert card['count']>0 and not card['overflow'],(width,mode,layout,'card overflow or missing',card)
    print('PASS',width,mode,'5 views, no overlap/overflow, select',round(checks['select']['w']), 'px',flush=True)
    page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=10)
