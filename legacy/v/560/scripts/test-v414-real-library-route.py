#!/usr/bin/env python3
"""v414 regression: execute the COMPLETE bundled renderLibrary() chain in a browser.

This test intentionally proves that the v413 Normal Library bug existed, then
verifies that both production Library modes now use the same card renderer.
No authentication, Supabase traffic, or personal Library data is needed.
"""
import os, re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
assert VERSION==414
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',html,re.I)
assert styles and '225-v413-library-overview-isolated.css' in styles[-1]
css='\n'.join((ROOT/s).read_text() for s in styles)
current=(ROOT/'assets/js/mediaflow-v414.bundle.js').read_text()
assert "${v183LibraryOverviewEnabled()?v183LibraryOverviewHtml():''}" in current
assert 'mediaflow-pwa-v414-shell-v1' in (ROOT/'sw.js').read_text()
legacy=Path(os.environ.get('MF414_NEGATIVE_BUNDLE','/mnt/data/work_v413/assets/js/mediaflow-v413.bundle.js'))
if not legacy.exists():
  # On GitHub Actions the base file is still available in the v413 git tag.
  raise SystemExit('The v413 negative-control bundle is required for this test.')
original=legacy.read_text()

INJECT=r'''
window.__mf414Test = function(mode){
  const names=['Seasonal Anime','Missed Anime','Finished Anime','Asian Comics',
    'Anime Movies','Movies','TV Series','Anime Backlog','Anime Movies Backlog',
    'Asian Comics Backlog','TV Series Backlog','Movies Backlog','Novels','Books',
    'Online Media'];
  S.categories=names.map((name,i)=>({id:'id'+i,name,color:['#d84f7b','#ba70e4','#3588e6'][i%3],icon:'flower',target:4,unit:'episodes',enabled:true}));
  S.categoryOrder=S.categories.map(c=>c.id);
  S.library=[]; S.sessions=[];
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  S.histFilters={category:'all',type:'all',range:'all',libStatus:'all',
    libCategory:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'};
  S.view='library'; S.libPage=0;
  v183EnsureLibraryOverview(S.settings).showOverview=true;
  v188EnsureLibrarySettings(S.settings,S.categories).overview.perPage=15;
  const d=v181EnsureLibrarySettings(S.settings);
  d.mode=mode;
  if(mode==='dynamic'){d.activeCategoryId='id0'; d.activeStatus='active';}
  return renderLibrary();
};
'''

def inject_bundle(bundle):
  assert bundle.rstrip().endswith('})();')
  return bundle.rstrip()[:-len('})();')]+INJECT+'\n})();'

def setup(browser,bundle):
  page=browser.new_page(viewport={'width':1600,'height':900})
  page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div></body></html>')
  page.evaluate('''() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})''')
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.add_style_tag(content=css)
  page.add_style_tag(content='''html,body{margin:0}#app{box-sizing:border-box;padding:12px;min-width:0}''')
  page.add_script_tag(content=inject_bundle(bundle))
  assert not errors,errors[:4]
  return page

def perform(page,mode):
  return page.evaluate('''(mode)=>{const content=window.__mf414Test(mode);document.getElementById('app').innerHTML='<main id=\"view-root\" style=\"width:100%;max-width:100%;min-width:0;\"></main>';document.getElementById('view-root').innerHTML=content;return {legacyRows:document.querySelectorAll('.overview-row').length,modernCards:document.querySelectorAll('.mf413-overview-item').length,htmlLength:content.length,oldLayout:content.includes('class="ov-name"')}}''',mode)

LAYOUT_JS='''() => {
const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
const cards=[...document.querySelectorAll('.mf413-overview-item')];
const grid=document.querySelector('.mf413-overview-grid');
return {columns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length:0,
 documentOverflow:document.documentElement.scrollWidth>innerWidth+2,
 cards:cards.map(c=>({
 box:r(c), title:r(c.querySelector('.mf413-overview-title')),
 heading:r(c.querySelector('.mf413-overview-heading')),
 count:r(c.querySelector('.mf413-overview-count')),
 meter:r(c.querySelector('.mf413-overview-meter')),
 overflow:c.scrollWidth>c.clientWidth+2
}))};}
'''

def validate_geometry(data,width,mode):
  # Check Overview card boundaries directly: the full Dynamic Library contains
  # unrelated wide toolbars that can affect document.scrollWidth in this fixture.
  # A page-wide overflow assertion would test unrelated UI, not this hotfix.
  assert len(data['cards'])==15,(mode,width,'wrong number of Overview cards',len(data['cards']))
  for i,c in enumerate(data['cards']):
    b=c['box'];h=c['heading'];n=c['count'];p=c['meter']
    assert not c['overflow'],(mode,width,i,'card overflow')
    assert b['left']>=-2 and b['right']<=width+2,(mode,width,i,'card off viewport',b)
    assert h['bottom']<=n['top']+1,(mode,width,i,'heading overlaps counts',c)
    assert n['bottom']<=p['top']+1,(mode,width,i,'counts overlap progress bar',c)
    for item in ('title','heading','count','meter'):
      a=c[item]
      assert a['left']>=b['left']-2 and a['right']<=b['right']+2,(mode,width,i,item,'horizontal overlap')
  for i,a in enumerate(data['cards']):
    for b in data['cards'][:i]:
      x,y=a['box'],b['box']
      assert (x['left']>=y['right']-1 or y['left']>=x['right']-1 or x['top']>=y['bottom']-1 or y['top']>=x['bottom']-1),(mode,width,'two cards overlap',i)

with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  old_page=setup(browser,original)
  assert perform(old_page,'classic')['legacyRows']==15,'v413 normal regression did not reproduce'
  assert perform(old_page,'dynamic')['modernCards']==15,'v413 dynamic mode changed unexpectedly'
  print('PASS negative control: full v413 bundle reproduces 15 legacy rows in Normal Library but not Dynamic Library')
  old_page.close()
  page=setup(browser,current)
  for mode in ('classic','dynamic'):
    for width,height in [(320,667),(390,844),(480,880),(620,800),(768,1024),(820,1000),(1024,768),(1280,800),(1600,900),(1920,1080)]:
      page.set_viewport_size({'width':width,'height':height})
      result=perform(page,mode)
      assert result['legacyRows']==0 and result['modernCards']==15,(mode,width,'legacy renderer is still active',result)
      data=page.evaluate(LAYOUT_JS)
      validate_geometry(data,width,mode)
      if mode=='classic' and width in (390,820,1600):
        page.screenshot(path=str(ROOT/f'docs/v414-overview-{width}.png'),full_page=True)
      print(f'PASS {mode} full-bundle renderLibrary {width}x{height}, {data["columns"]} grid columns, no card/title/count/bar collision')
  browser.close()
print('PASS v414 production bundled Normal/Dynamic Library Overview regression')
