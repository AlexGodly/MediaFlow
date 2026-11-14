#!/usr/bin/env python3
"""v418: execute real production bundle + final renderer in both Collections pages.
Test original app code and post-v417 patches, CSS view geometry, configured categories,
status counts, control handlers, poster removal, and cover-size extremes.
"""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='419'
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',html,re.I)
assert 'assets/css/229-v418-collections-display-polish.css' in styles
css='\n'.join((ROOT/x).read_text() for x in styles)
# Use true v417 artifact plus v418 module so we are not relying on an old legacy file
bundle=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text()
module=(ROOT/'src/js/components/303-v418-collections-views-cover-parity.js').read_text()
assert bundle.rstrip().endswith('})();')
INJECT=r'''
window.__mf418={
  setup(mode){
    S.library=[
      {id:'a',title:'Toaru Majutsu no Index with an especially long title',categoryId:'anime',coverUrl:'',status:'active',priority:'medium',progress:6,total:24,rating:8},
      {id:'b',title:'Other title',categoryId:'anime',coverUrl:'https://example.com/image.jpg',status:'completed',priority:'high',progress:12,total:12,rating:7},
      {id:'c',title:'Unstarted short',categoryId:'film',coverUrl:'',status:'planned',priority:'low',progress:0,total:10,rating:0}
    ];
    S.categories=[{id:'anime',name:'Finished Anime',color:'#15b979',icon:'🎬',unit:'episodes',missingDefaultCoverUrl:'https://example.com/default.jpg'},{id:'film',name:'Movies',color:'#e16d70',icon:'🍿',unit:'movies'}];
    S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    S.settings.v200CategoryCovers={useCategoryDefault:true,modifiedAt:0};
    v274EnsureSettings(S.settings).detailView=mode;
    v274EnsureSettings(S.settings).browserView='cards';
    S.librarySelection={};
    S.collections=[v274NormalizeCollection({id:'series',title:'Toaru Series',description:'My franchise collection with a longer description',titleIds:['a','b','c'],createdAt:1690000000000,updatedAt:1720000000000})];
    V274_UI.activeId='series';V274_UI.orderView=false;
    V274_UI.filters={search:'',categories:[],status:'all',priority:'all',rating:'all',cover:'all',sort:'order',dir:'asc',yearMin:'',yearMax:'',runtimeMin:'',runtimeMax:'',seasonMin:'',seasonMax:'',episodeMin:'',episodeMax:'',limit:0,moderator:'all'};
    S.view='collections';
    return this.render(mode);
  },
  render(mode){
    const c=S.collections[0]; let root=document.getElementById('view-root'); if(!root){document.getElementById('app').innerHTML='<main id="view-root"></main>';root=document.getElementById('view-root');}
    root.innerHTML=mode==='main'?v274CollectionsBrowserHtml():`<div class="mf274-page mf274-collection-detail" style="--mf276-cover-scale:var(--mf276-collection-cover-scale,1)"><div class="mf274-collection-items mode-${mode}">${S.library.map(x=>v274CollectionItemHtml(c,x,mode)).join('')}</div></div>`;
  },
  mode(mode){v274EnsureSettings(S.settings).browserView=mode;return this.render('main');},
  status(){return S.library.map(x=>({id:x.id,url:x.coverUrl,status:x.status}));},
  editCall(){return !!App.openLibraryModal;}
};
'''
bundle=bundle.rstrip()[:-len('})();')]+module+'\n'+INJECT+'\n})();'
RECT='''() => {const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height}};return [...document.querySelectorAll('.mf418-detail-card')].map(el=>({card:box(el),cover:box(el.querySelector('.mf418-title-cover')),copy:box(el.querySelector('.mf418-title-copy')),actions:box(el.querySelector('.mf418-title-actions')),progress:box(el.querySelector('.mf418-title-progress')),border:el.scrollWidth>el.clientWidth+2, overlay:el.querySelectorAll('.v254-cover-rating').length}));}'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1600,'height':900})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app" style="padding:12px"><main id="view-root"></main></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 page.add_style_tag(content=css)
 page.add_script_tag(content=bundle)
 assert not errs,errs[:3]
 for mode in ('list','compact','cards','covers','covers-title'):
  page.evaluate('(m)=>window.__mf418.setup(m)',mode)
  for scale in (.25,1,2.5,4):
   page.evaluate('(x)=>document.querySelector(".mf274-collection-detail").style.setProperty("--mf276-collection-cover-scale",String(x))',scale)
   for width in (320,390,620,820,1280,1600):
    page.set_viewport_size({'width':width,'height':950})
    assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+3'),(mode,scale,width,'document overflow')
    if mode in ('list','compact','cards'):
     data=page.evaluate(RECT)
     assert len(data)==3,(mode,scale,width,len(data))
     for row in data:
      assert not row['border'],('card overflow',mode,scale,width,row)
      a,b=row['cover'],row['copy'];assert a['right']<=b['left']+2 or a['bottom']<=b['top']+2,('cover collides with copy',mode,scale,width,row)
      assert row['actions']['left']>=row['card']['left']-1 and row['actions']['right']<=row['card']['right']+2,('actions outside',mode,scale,width,row)
      assert row['progress']['right']<=row['card']['right']+2,('progress outside',mode,scale,width,row)
      assert row['overlay']==0,('rating overlay appeared',mode,scale,width,row)
     assert page.locator('.mf418-title-actions button').count()==9,(mode,scale,width)
     assert page.locator('.mf418-info-pill.mf418-category').count()==3
     assert page.locator('.mf418-info-pill.mf418-status svg').count()==3
     assert page.locator('.mf418-progress-track').count()==3
    else:
     assert page.locator('.mf418-poster-tile').count()==3
     assert page.locator('.v254-cover-rating').count()>=2,(mode,scale,width,'missing cover mode rating')
     for x in page.evaluate('''() => [...document.querySelectorAll('.mf418-poster-tile')].map(el=>{const a=el.querySelector('.mf418-remove-poster').getBoundingClientRect(),b=el.querySelector('.mf280-cover-frame').getBoundingClientRect();return {center:a.left+a.width/2,expected:b.left+b.width/2}})'''):
      assert abs(x['center']-x['expected'])<3,(mode,scale,width,x)
   print('PASS detail',mode,'scale',scale)
  if mode in ('list','compact','cards'):
   assert page.locator('.mf418-detail-card [onclick*="App.openLibraryModal"]').count()==3
   assert page.locator('.mf418-detail-card [onclick*="App.v274OpenTitle"]').count()>=3
  assert page.evaluate('window.__mf418.status().map(x=>x.url)')==['','https://example.com/image.jpg','']
  if mode=='list':
   # Actual selection remains available.
   assert page.locator('.mf274-select-title input[type="checkbox"]').count()==3
 for mode in ('compact','list','cards','showcase','covers'):
  page.evaluate('(m)=>{window.__mf418.mode(m)}',mode)
  for width in (320,390,820,1600):
   page.set_viewport_size({'width':width,'height':900})
   assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+3'),('main overflow',mode,width)
   assert page.locator('#mf276-collections-results').count()<=1
   assert page.locator('.mf418-browser-progress').count()==1
   assert page.locator('.mf418-browser-facts').count()==1
   assert page.locator('.mf418-browser-entry .mf418-browser-actions button').count()==(0 if mode=='covers' else 2)
  print('PASS main',mode)
 page.evaluate("()=>window.__mf418.mode('list')")
 buttons=page.locator('.mf418-view-switch button').all_inner_texts()
 assert buttons==['Compact','List','Cards','Showcase','Covers'],buttons
 # Visual snapshots use the actual final renderer and all production CSS layers.
 docs=ROOT/'docs';docs.mkdir(exist_ok=True)
 page.set_viewport_size({'width':1600,'height':900})
 page.evaluate('()=>window.__mf418.setup("list")')
 page.screenshot(path=str(docs/'v419-regression-collection-list-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate('()=>window.__mf418.setup("cards")')
 page.screenshot(path=str(docs/'v419-regression-collection-cards-mobile.png'),full_page=True)
 page.set_viewport_size({'width':1280,'height':900})
 page.evaluate('()=>window.__mf418.setup("list")')
 page.evaluate('()=>window.__mf418.mode("cards")')
 page.screenshot(path=str(docs/'v419-regression-collections-main-cards.png'),full_page=True)
 assert not errs,errs[:7]
 browser.close()
print('PASS v418 all modes, scaling extremes, source rules & responsive tests')
