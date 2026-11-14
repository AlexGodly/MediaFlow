#!/usr/bin/env python3
"""v415 full production-bundle coverage for category title/status overview.
Executes Normal & Dynamic renderLibrary, not isolated markup substitutes.
"""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='416'
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',html,re.I)
assert 'assets/css/226-v415-library-overview-status-totals.css' in styles
assert 'assets/css/227-v416-library-overview-hover.css' in styles
css='\n'.join((ROOT/x).read_text() for x in styles)
bundle=(ROOT/'assets/js/mediaflow-v416.bundle.js').read_text()
assert 'v415OverviewTitleCounts' in bundle
assert '--mf416-accent:' in bundle
assert 'mediaflow-pwa-v416-shell-v1' in (ROOT/'sw.js').read_text()
INJECT=r'''
window.__mf415Test={
  initialize(mode){
    const names=['Seasonal Anime','Missed Anime','Finished Anime','Asian Comics','Anime Movies','Movies','TV Series','Anime Backlog','Anime Movies Backlog','Asian Comics Backlog','TV Series Backlog','Movies Backlog','Novels','Books','Online Media'];
    S.categories=names.map((name,i)=>({id:'id'+i,name,color:['#d84f7b','#ba70e4','#3588e6'][i%3],icon:'flower',target:4,unit:'episodes',enabled:true}));
    S.categoryOrder=S.categories.map(c=>c.id);
    const sample=[['active',3],['paused',2],['completed',1],['dropped',1],['planned',4],['',1]];
    S.library=[];let idx=1;
    for(const [status,n] of sample){for(let k=0;k<n;k++)S.library.push({id:'l'+idx++,title:'Title '+idx,categoryId:'id0',status,progress:0,total:0,priority:'medium'});}
    S.library.push({id:'unknown',title:'Other title',categoryId:'id1',status:'archived',progress:0,total:0,priority:'medium'});
    S.sessions=[];
    S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    S.histFilters={category:'all',type:'all',range:'all',libStatus:'all',libCategory:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'};
    S.view='library'; S.libPage=0; S.v188OverviewPage=0;
    v183EnsureLibraryOverview(S.settings).showOverview=true;
    v188EnsureLibrarySettings(S.settings,S.categories).overview.perPage=15;
    const cfg=v181EnsureLibrarySettings(S.settings);
    cfg.mode=mode;
    if(mode==='dynamic'){cfg.activeCategoryId='id0';cfg.activeStatus='active';}
    try{v53InvalidateLibraryCache();}catch(_){}
    return this.render();
  },
  render(){
    const content=renderLibrary();
    const root=document.getElementById('app');root.innerHTML='<main id="view-root" style="width:100%;max-width:100%;min-width:0;"></main>';
    root.querySelector('#view-root').innerHTML=content;
    return content.length;
  },
  reorder(order){
    const cfg=v181EnsureLibrarySettings(S.settings);cfg.statusOrder=order;return this.render();
  },
  updateTitle(){
    S.library[0].status='completed';S.library[0].categoryId='id1';
    try{v53InvalidateLibraryCache();}catch(_){}
    return this.render();
  }
};
'''
assert bundle.rstrip().endswith('})();')
bundle=bundle.rstrip()[:-len('})();')]+INJECT+'\n})();'
JS_DATA='''() => {
const rows=[...document.querySelectorAll('.mf415-overview-item')];
return rows.map(card=>({
 category:card.getAttribute('data-category-id'),
 total:card.querySelector('.mf415-overview-total strong')?.textContent,
 breakdown:[...card.querySelectorAll('.mf415-status')].map(node=>({status:node.dataset.status,label:node.querySelector('.mf415-status-label').textContent,count:node.querySelector('strong').textContent})),
 title:card.querySelector('.mf413-overview-title')?.textContent,
 progress:card.querySelector('.mf413-overview-count')?.textContent,
 legacyRows:document.querySelectorAll('.overview-row').length
}));}'''
LAYOUT_JS='''() => {
const r=e=>{const {left,right,top,bottom,width,height}=e.getBoundingClientRect();return {left,right,top,bottom,width,height}};
return [...document.querySelectorAll('.mf415-overview-item')].map(c=>({
 box:r(c),heading:r(c.querySelector('.mf413-overview-heading')),
 total:r(c.querySelector('.mf415-overview-total')),
 statuses:r(c.querySelector('.mf415-overview-statuses')),
 progress:r(c.querySelector('.mf413-overview-count')),
 bar:r(c.querySelector('.mf413-overview-meter')),
 overflow:c.scrollWidth>c.clientWidth+2,
 chips:[...c.querySelectorAll('.mf415-status')].map(r)
}));}'''
def assert_geo(data,width):
 assert len(data)==15,len(data)
 for i,c in enumerate(data):
  assert not c['overflow'],('overflow',width,i,c)
  b=c['box'];assert b['left']>=-2 and b['right']<=width+2,('viewport',width,i,b)
  fields=['heading','total','statuses','progress','bar']
  for a,bname in zip(fields,fields[1:]):
   assert c[a]['bottom']<=c[bname]['top']+1,('vertical collision',width,i,a,bname,c)
  for field in fields:
   el=c[field];assert el['left']>=b['left']-2 and el['right']<=b['right']+2,('field outside',width,i,field,el,b)
  for chip in c['chips']:
   assert chip['left']>=c['statuses']['left']-2 and chip['right']<=c['statuses']['right']+2,('chip outside',width,i)
 for i,a in enumerate(data):
  for b in data[:i]:
   x=a['box'];y=b['box'];assert x['left']>=y['right']-1 or y['left']>=x['right']-1 or x['top']>=y['bottom']-1 or y['top']>=x['bottom']-1,('card overlap',width,i)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div></body></html>')
 page.evaluate('''() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})''')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_style_tag(content=css)
 page.add_style_tag(content='html,body{margin:0}#app{box-sizing:border-box;padding:12px;min-width:0}')
 page.add_script_tag(content=bundle)
 assert not errors,errors[:4]
 for mode in ('classic','dynamic'):
  for width,height in [(320,667),(360,720),(390,844),(480,880),(620,850),(768,1024),(820,1000),(1024,768),(1280,800),(1600,900),(1920,1080)]:
   page.set_viewport_size({'width':width,'height':height})
   page.evaluate('(mode)=>window.__mf415Test.initialize(mode)',mode)
   data=page.evaluate(JS_DATA)
   assert len(data)==15 and data[0]['legacyRows']==0,(mode,width,'not real v414+ cards',len(data))
   one=data[0];assert one['total']=='12', (mode,width,one)
   assert [x['status'] for x in one['breakdown']]==['active','paused','completed','dropped','planned'],one
   assert [int(x['count']) for x in one['breakdown']]==[3,2,1,1,5],one
   assert data[1]['total']=='1' and data[1]['breakdown'][-1]=={'status':'other','label':'Other','count':'1'},data[1]
   assert data[2]['total']=='0' and all(x['count']=='0' for x in data[2]['breakdown'])
   assert one['progress'].startswith('Progress · ')
   assert_geo(page.evaluate(LAYOUT_JS),width)
   if mode=='classic' and width in (390,820,1600):
    page.screenshot(path=str(ROOT/f'docs/v415-overview-{width}.png'),full_page=True)
   print('PASS',mode,width,'card counts + status order + geometry')
  custom=['planned','completed','active','dropped','paused']
  page.evaluate('(order)=>window.__mf415Test.reorder(order)',custom)
  result=page.evaluate(JS_DATA)
  assert [a['status'] for a in result[0]['breakdown']]==custom
  page.evaluate('()=>window.__mf415Test.updateTitle()')
  updated=page.evaluate(JS_DATA)
  assert updated[0]['total']=='11' and updated[1]['total']=='2'
  assert [x['status'] for x in updated[0]['breakdown']]==custom
  assert [x['count'] for x in updated[0]['breakdown']]==['5','1','2','1','2'],updated[0]
  assert updated[1]['breakdown'][1]['count']=='1',updated[1]
  print('PASS',mode,'live reordering and category/status changes')

 # Fine-pointer hover must visually highlight without touching stats, geometry or text.
 for appearance, palette in [('light',{'--text':'#1d2330','--panel':'#f5f6fa','--panel-raised':'#e7eaf0','--border-soft':'#c7cbd6','--flow':'#ca4e82'}),
                             ('dark',{'--text':'#f6f7fb','--panel':'#252b38','--panel-raised':'#323b49','--border-soft':'#5a6170','--flow':'#f58aa7'})]:
  page.evaluate('(v)=>{document.documentElement.setAttribute("data-appearance",v.appearance);for(const [k,w] of Object.entries(v.palette))document.documentElement.style.setProperty(k,w)}',{'appearance':appearance,'palette':palette})
  for width,height in [(390,844),(820,1000),(1600,900)]:
   page.set_viewport_size({'width':width,'height':height})
   page.evaluate('(mode)=>window.__mf415Test.initialize(mode)','classic')
   node=page.locator('.mf415-overview-item').first
   node.scroll_into_view_if_needed()
   state_js='''() => {const c=document.querySelector('.mf415-overview-item'),g=(s)=>getComputedStyle(c.querySelector(s));return {border:getComputedStyle(c).borderColor,shadow:getComputedStyle(c).boxShadow,transform:getComputedStyle(c).transform,chip:g('.mf415-status').backgroundColor,total:g('.mf415-overview-total').backgroundColor,accent:getComputedStyle(c).getPropertyValue('--mf416-accent').trim(),strip:getComputedStyle(c,'::before').opacity,rect:c.getBoundingClientRect().toJSON(),labels:[...c.querySelectorAll('.mf415-status-count')].map(x=>x.textContent)}}'''
   before=page.evaluate(state_js)
   assert before['accent']=='#d84f7b',('category accent missing',before)
   if width==1600:page.screenshot(path=str(ROOT/f'docs/v416-{appearance}-default.png'),full_page=True)
   node.hover()
   page.wait_for_timeout(350)
   after=page.evaluate(state_js)
   for attr in ('border','shadow','chip','total'):
    assert before[attr]!=after[attr],('hover did not change '+attr,width,appearance,before,after)
   assert before['strip']=='0' and float(after['strip'])>.7,(width,appearance,'accent sheen missing')
   assert before['labels']==after['labels'],(width,appearance,'status counts changed')
   assert before['transform']=='none' and after['transform']!='none',(width,appearance,'lift missing')
   assert after['rect']['top']<before['rect']['top']-1.5,(width,appearance,'lift position unchanged')
   if width==1600:page.screenshot(path=str(ROOT/f'docs/v416-{appearance}-hover.png'),full_page=True)
   page.mouse.move(0,0)
   page.wait_for_timeout(280)
   assert page.evaluate("() => getComputedStyle(document.querySelector('.mf415-overview-item')).transform")=='none','Card did not return to original position'
   assert_geo(page.evaluate(LAYOUT_JS),width)
   print('PASS',appearance,width,'hover elevation, accent, status counts unchanged')
 # Touch-only interactions and reduced motion must not move card.
 for touch_mode in (True,False):
  context=browser.new_context(viewport={'width':390,'height':844},is_mobile=touch_mode,has_touch=touch_mode,reduced_motion='reduce' if not touch_mode else 'no-preference')
  tp=context.new_page()
  tp.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div></body></html>')
  tp.evaluate('''() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})''')
  tp.add_style_tag(content=css)
  tp.add_script_tag(content=bundle)
  tp.evaluate("()=>window.__mf415Test.initialize('classic')")
  if touch_mode:
   assert tp.evaluate('matchMedia("(hover: none)").matches')
   tp.locator('.mf415-overview-item').first.tap()
  else:
   assert tp.evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches')
   tp.locator('.mf415-overview-item').first.hover()
  assert tp.evaluate("() => getComputedStyle(document.querySelector('.mf415-overview-item')).transform")=='none',('Unexpected card movement',touch_mode)
  context.close()
 print('PASS touch-only and reduced-motion no-elevation checks')
 browser.close()
print('PASS v416 full-bundle status contract and hover polish')
