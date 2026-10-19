#!/usr/bin/env python3
"""v420 production-CSS visual regression: visible fallback, centering and scaling.
Uses the last verified production bundle with precisely the next final component,
all stylesheets in actual index order, and synthetic read-only Library records.
"""
from pathlib import Path
import re,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='420'
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',(ROOT/'index.html').read_text(),re.I)
assert styles[-1]=='assets/css/231-v420-actual-cover-layout-repairs.css'
css='\n'.join((ROOT/s).read_text() for s in styles)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
module=(ROOT/'src/js/components/305-v420-covers-dashboard-sidebar-fixes.js').read_text()
# Module must execute inside the app scope, where actual renderer functions live.
extra='''
window.__mf420={
  setup(){
    S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    S.categories=[{id:'anime',name:'Finished Anime',color:'#12a568',icon:'🎬',unit:'episodes'},
      {id:'manga',name:'Manga',color:'#f45c90',icon:'🌸',unit:'chapters'}];
    S.library=[{id:'a',title:'Missing Anime',categoryId:'anime',coverUrl:'',status:'active',progress:3,total:24,rating:8},
       {id:'b',title:'Missing Manga',categoryId:'manga',coverUrl:'',status:'active',progress:3,total:21,rating:7}];
    S.collections=[v274NormalizeCollection({id:'series',title:'Series',titleIds:['a','b']})];
    S.settings.v200CategoryCovers={useCategoryDefault:true,modifiedAt:0};
  },
  collection(mode){
    let c=S.collections[0];if(!document.querySelector('#view-root'))document.body.insertAdjacentHTML('beforeend','<main id=\"view-root\"></main>');document.querySelector('#view-root').innerHTML=`<div class="mf274-page mf274-collection-detail" style="--mf276-cover-scale:var(--mf276-collection-cover-scale,1)"><div class="mf274-collection-items mode-${mode}">${S.library.map(x=>v274CollectionItemHtml(c,x,mode)).join('')}</div></div>`;
  },
  library(mode){
    const thumbs=S.library.map(x=>mode==='list'||mode==='compact'||mode==='cards'?`<div class="item-row">${v417LibraryThumbHtml(x,getCategory(x.categoryId))}</div>`:`<div class="v181-cover-tile">${v417LibraryTileCoverHtml(x,'v181-cover-tile-placeholder')}</div>`).join('');
    if(!document.querySelector('#view-root'))document.body.insertAdjacentHTML('beforeend','<main id=\"view-root\"></main>');document.querySelector('#view-root').innerHTML= mode==='list'||mode==='compact'||mode==='cards'?`<div class="library-view-${mode}">${thumbs}</div>`:`<div class="v181-dynamic-${mode}">${thumbs}</div>`;
  },
  replaceSrc(imgUrl){S.library[0].coverUrl=imgUrl},
  categoryDefault(url){S.categories[0].missingDefaultCoverUrl=url},
  coverUrl(){return S.library[0].coverUrl},
  normalCovers(mode){const tiles=S.library.map(x=>`<div class=\"item-row\" data-library-id=\"${x.id}\">${v417LibraryThumbHtml(x,getCategory(x.categoryId))}<div class=\"bal-icon\">${v144CategoryIconHtml(getCategory(x.categoryId))}</div></div>`).join('');document.querySelector('#view-root').innerHTML=`<div class=\"v177-library-cover-scope\"><div class=\"library-view-${mode}\"><div class=\"card\">${tiles}</div></div></div>`;},
};
'''
js=base[:-len('})();')]+(ROOT/'src/js/components/303-v418-collections-views-cover-parity.js').read_text()+'\n'+(ROOT/'src/js/components/304-v419-recommendations-cover-logging-sidebar.js').read_text()+'\n'+module+'\n'+extra+'\n})();'
METRICS='''() => [...document.querySelectorAll('.mf420-cover-stage')].map(stage=>{const f=stage.querySelector('.mf420-cover-fallback'),i=stage.querySelector('.v144-cat-icon-emoji'),g=stage.querySelector('.mf420-cover-glyph'); const s=stage.getBoundingClientRect(),a=f.getBoundingClientRect(),b=g.getBoundingClientRect(),c=i?.getBoundingClientRect(); const bg=getComputedStyle(f).backgroundColor;return {s:{x:s.x,y:s.y,w:s.width,h:s.height},f:{x:a.x,y:a.y,w:a.width,h:a.height},g:{x:b.x,y:b.y,w:b.width,h:b.height},fs:i?parseFloat(getComputedStyle(i).fontSize):0,visible:i?getComputedStyle(i).display!=='none':false,source:stage.dataset.mf420CoverSource,bg,display:getComputedStyle(stage).display}})'''

def assert_visible(rows,label):
 assert rows,label
 for x in rows:
  assert x['visible'],(label,'glyph invisible',x)
  assert x['fs']>=12,(label,'glyph tiny',x)
  assert x['g']['w']>=10,(label,'glyph zero sized',x)
  assert abs((x['s']['x']+x['s']['w']/2)-(x['g']['x']+x['g']['w']/2))<3,(label,'horizontal offset',x)
  assert abs((x['s']['y']+x['s']['h']/2)-(x['g']['y']+x['g']['h']/2))<3,(label,'vertical offset',x)

with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1280,'height':900})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="v260-redesign"><div id="app"><main id="view-root"></main></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 page.add_style_tag(content=css);page.add_script_tag(content=js)
 page.evaluate('window.__mf420.setup()')
 # Real Collections renderer in all five modes: neither white rectangles nor tiny top-left badges.
 for mode in ('list','compact','cards','covers','covers-title'):
  for width in (320,390,820,1280,1600):
   page.set_viewport_size({'width':width,'height':850})
   page.evaluate('(m)=>window.__mf420.collection(m)',mode)
   dims=page.evaluate(METRICS);assert len(dims)==2,(mode,width,len(dims));assert_visible(dims,(mode,width))
   if width==1280:
    small=dims[0];page.evaluate('document.querySelector(".mf274-collection-detail").style.setProperty("--mf276-cover-scale","2.1")');large=page.evaluate(METRICS)[0]
    assert large['s']['w']>small['s']['w']+15,(mode,'cover not resized',small,large)
    assert large['fs']>small['fs']+3,(mode,'icon not resized',small,large)
  print('PASS Collections cover fallback',mode)
 # Normal & Dynamic Library use the same two underlying real renderer functions.
 for mode in ('list','compact','cards','covers','covers-title'):
  page.set_viewport_size({'width':1280,'height':900});page.evaluate('(m)=>window.__mf420.library(m)',mode)
  rows=page.evaluate(METRICS);assert_visible(rows,('library',mode))
  if mode in ('covers','covers-title'):
   small=rows[0];page.evaluate("document.documentElement.style.setProperty('--v177-library-scale','1.8')");big=page.evaluate(METRICS)[0]
   assert big['s']['w']>small['s']['w']+25,(mode,small,big)
   assert big['fs']>small['fs']+3,(mode,small,big)
   page.evaluate("document.documentElement.style.removeProperty('--v177-library-scale')")
  print('PASS Library cover fallback',mode)
 # Normal Library uses v417LibraryThumbHtml inside the item-row poster grid,
 # not the Dynamic Library tile wrapper.
 for mode in ('covers','covers-title'):
  page.evaluate('(m)=>window.__mf420.normalCovers(m)',mode)
  small=page.evaluate(METRICS);assert_visible(small,('normal',mode))
  page.evaluate("document.querySelector('.v177-library-cover-scope').style.setProperty('--v177-library-scale','1.8')")
  large=page.evaluate(METRICS);assert_visible(large,('normal large',mode))
  assert large[0]['s']['w']>small[0]['s']['w']+25,(mode,small,large)
  assert large[0]['fs']>small[0]['fs']+3,(mode,small,large)
  page.evaluate("document.querySelector('.v177-library-cover-scope').style.removeProperty('--v177-library-scale')")
  print('PASS Normal Library',mode)
 # Fallback URL and broken source: don't overwrite actual title URL.
 page.evaluate("window.__mf420.categoryDefault('https://example.invalid/not-found.jpg')")
 page.evaluate("window.__mf420.library('covers')")
 assert page.locator('.mf420-cover-image').count()>=1
 # A failed image source must expose the original inline category icon.
 page.locator('.mf420-library-poster .mf420-cover-image').first.evaluate("(el)=>el.dispatchEvent(new Event('error'))")
 assert page.evaluate('''() => {const el=document.querySelector('.mf420-library-poster');return el.classList.contains('mf420-cover-missing')&&getComputedStyle(el.querySelector('.mf420-cover-fallback')).display==='grid'}''')
 page.evaluate("window.__mf420.replaceSrc('https://example.invalid/original-not-found.jpg')")
 page.evaluate("window.__mf420.library('covers')")
 assert page.evaluate('window.__mf420.coverUrl()')=='https://example.invalid/original-not-found.jpg'
 assert not errs,errs[:4]
 # Snapshot of actual v420 Collections markup (no static mock card).
 page.evaluate("window.__mf420.replaceSrc('')");page.evaluate("window.__mf420.categoryDefault('')");page.set_viewport_size({'width':1280,'height':900});page.evaluate("window.__mf420.collection('cards')")
 page.screenshot(path=str(ROOT/'docs/v420-collection-cover-fallback.png'),full_page=True)
 b.close()
print('PASS v420 visible cover fallback, source priority, scaling and centering')
