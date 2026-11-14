#!/usr/bin/env python3
"""Exercise the exact shipping v413 Overview template with all production CSS.
Unlike v411/v412 tests, this does not hand-write the category-card markup.
"""
import html
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'src/js/legacy/120-v188.js').read_text(encoding='utf-8')
start=source.index('v183LibraryOverviewHtml=function(){')
end=source.index('\n};\n\nfunction v188SetOverviewOrderMode',start)+3
renderer=source[start:end]
assert 'mf413-overview-grid' in renderer and 'mf413-overview-item' in renderer
assert 'class="overview-row"' not in renderer and 'class="card"' not in renderer
index=(ROOT/'index.html').read_text(encoding='utf-8')
assert '<div id="app">' in index
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',index,re.I)
assert styles[-1]=='assets/css/225-v413-library-overview-isolated.css',styles[-1]
css='\n'.join((ROOT/s).read_text(encoding='utf-8') for s in styles)
assert 'mediaflow-v413.bundle.js' in index and 'mf413-overview-grid' in (ROOT/'assets/js/mediaflow-v413.bundle.js').read_text()
colors=['#e755a5','#ff8655','#40b57e','#8557ed','#f8ae43','#f44c83','#378fe8']
names=['Seasonal Anime','Missed Anime','Finished Anime','Asian Comics','Anime Movies','Movies','TV Series','Anime Backlog','Anime Movies Backlog','Asian Comics Backlog','TV Series Backlog','Movies Backlog','Novels','Books','Online Media','An Exceptionally Long MediaFlow Category With Many Words & Other Labels']
script='''
var S={categories:[],settings:{},v188OverviewPage:0};
var DEFAULT_SETTINGS={};
var v183LibraryOverviewHtml;
function escapeHtml(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function v188EnsureLibrarySettings(){return {overview:{perPage:100}};}
function v188ClampOverviewPerPage(){return 100;}
function v188OverviewCategories(){return S.categories;}
function v188OverviewPager(){return '';}
function v144CategoryIconHtml(cat){return '<span class="fake-icon" aria-hidden="true">'+escapeHtml(cat.icon)+'</span>';}
function v53LibraryOverview(){return {byCat:window.overviewByCat};}
function v183LibraryOverviewEstimate(cat,x){return {total:x.total,pct:x.pct,estimated:x.estimated};}
'''+renderer
HTML='''<!doctype html><html lang="en" data-mf262-library="1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'''+css+'''</style><style>
:root{--panel:#f5edef;--panel-raised:#f9eff3;--text:#202538;--text-dim:#40485d;--border-soft:#d2ccd9;--flow:#bb3e78}
html,body{margin:0;background:#f5f6fb;color:#202538;font:14px Arial,sans-serif}#app{min-width:0;box-sizing:border-box;padding:12px}.mf413-test-shell{width:100%;min-width:0;max-width:1900px;margin:auto}.fake-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;background:#cbd7e7;font-size:17px}
</style></head><body><div id="app"><div class="mf413-test-shell"><div class="v183-library-overview-toggle"><div class="v183-library-overview-toggle-copy">Library overview</div></div><div class="library-host"></div></div></div></body></html>'''

JS='''() => {
 const rect=e=>{let x=e.getBoundingClientRect();return {x:x.x,y:x.y,left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}};
 let grid=document.querySelector('.mf413-overview-grid');
 let cards=[...document.querySelectorAll('.mf413-overview-item')];
 return {bodyOverflow:document.documentElement.scrollWidth>innerWidth+2,gridColumns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,gridDisplay:getComputedStyle(grid).display,
 itemCount:cards.length,
 cards:cards.map(c=>{let head=c.querySelector('.mf413-overview-heading'),title=c.querySelector('.mf413-overview-title'),count=c.querySelector('.mf413-overview-count'),meter=c.querySelector('.mf413-overview-meter');return {card:rect(c),head:rect(head),title:rect(title),count:rect(count),meter:rect(meter),overflow:c.scrollWidth>c.clientWidth+2,display:getComputedStyle(c).display,cols:getComputedStyle(c).gridTemplateColumns.split(' ').length}})};
}'''
def verify(result,mode,width):
 assert result['gridDisplay']=='grid',(mode,width,'not grid')
 assert not result['bodyOverflow'],(mode,width,'horizontal overflow')
 assert result['itemCount']==len(names),(mode,width,'missing cards')
 for i,c in enumerate(result['cards']):
  b=c['card']
  assert c['display']=='grid' and c['cols']==1,(mode,width,i,'uncontained legacy grid',c)
  assert not c['overflow'],(mode,width,i,'card overflow')
  assert b['left']>=-1 and b['right']<=width+1,(mode,width,i,'card outside screen')
  assert c['head']['bottom']<=c['count']['top']+1,(mode,width,i,'title/count collide')
  assert c['count']['bottom']<=c['meter']['top']+1,(mode,width,i,'count/meter collide')
  for elem in ('title','head','count','meter'):
   r=c[elem]
   assert r['left']>=b['left']-2 and r['right']<=b['right']+2,(mode,width,i,elem,'overflow')
   assert r['top']>=b['top']-2 and r['bottom']<=b['bottom']+2,(mode,width,i,elem,'vertical overflow')
 for i,c in enumerate(result['cards']):
  a=c['card']
  for z in result['cards'][:i]:
   b=z['card']
   assert a['left']>=b['right']-1 or b['left']>=a['right']-1 or a['top']>=b['bottom']-1 or b['top']>=a['bottom']-1,(mode,width,i,'card collision')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for mode in ('normal','dynamic'):
  for width,height in [(320,667),(360,740),(390,844),(480,850),(620,760),(768,1024),(820,1000),(1024,768),(1280,850),(1600,900),(1920,1080)]:
   page=browser.new_page(viewport={'width':width,'height':height})
   page.set_content(HTML.replace('class="mf413-test-shell"','class="mf413-test-shell" data-mode="'+mode+'"'))
   page.add_script_tag(content=script)
   page.evaluate('''([names,colors])=>{S.categories=names.map((name,i)=>({id:'id'+i,name,color:colors[i%colors.length],icon:['🌸','🎞️','📺','📚'][i%4]}));window.overviewByCat=new Map(S.categories.map((x,i)=>[x.id,{items:100,done:i+10,total:(i+20)*100,pct:Math.min(98,Math.floor((i+10)/(i+20)*100)),estimated:i%3===0,knownDone:10}]));document.querySelector('.library-host').innerHTML=v183LibraryOverviewHtml();}''',[names,colors])
   result=page.evaluate(JS)
   verify(result,mode,width)
   if mode=='normal' and width in (390,820,1600):
    page.screenshot(path=str(ROOT/f'docs/v413-overview-{width}.png'),full_page=True)
   print(f'PASS real renderer {mode} {width}x{height} ({result["gridColumns"]} columns; title/count/progress separate)')
   page.close()
 # Verify isolation survives missing new CSS by removing the final stylesheet;
 # renderer inline constraints must still isolate the three rows.
 no_css=css.replace((ROOT/'assets/css/225-v413-library-overview-isolated.css').read_text(), '')
 page=browser.new_page(viewport={'width':1600,'height':900})
 page.set_content(HTML.replace(css,no_css));page.add_script_tag(content=script)
 page.evaluate('''([names,colors])=>{S.categories=names.map((name,i)=>({id:'id'+i,name,color:colors[i%colors.length],icon:'📚'}));window.overviewByCat=new Map(S.categories.map((x,i)=>[x.id,{items:3,done:2,total:4,pct:50,estimated:false}]));document.querySelector('.library-host').innerHTML=v183LibraryOverviewHtml();}''',[names,colors])
 verify(page.evaluate(JS),'inline-layout-fallback',1600)
 print('PASS real renderer without v413 stylesheet (inline positioning fallback)')
 page.close()
 browser.close()
print('PASS MediaFlow v413 Library Overview renderer/browser regression')
