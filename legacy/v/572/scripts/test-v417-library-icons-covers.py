#!/usr/bin/env python3
"""v417 production-bundle tests: Overview icons, one status icon, missing cover fallbacks.
Runs the actual Normal/Dynamic Library renderLibrary chains and semantic icon enhancer.
"""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='417'
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',html,re.I)
assert 'assets/css/228-v417-library-icons-covers.css' in styles
css='\n'.join((ROOT/x).read_text() for x in styles)
bundle=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text()
assert 'mediaflow-pwa-v417-shell-v1' in (ROOT/'sw.js').read_text()
assert 'v417LibraryThumbHtml' in bundle
INJECT=r'''
window.__mf417Test={
  initialize(mode,view,usingDefault=true){
    S.categories=[{id:'anime',name:'Anime',color:'#f06b9b',icon:'🎬',target:5,unit:'episodes',enabled:true,missingDefaultCoverUrl:'https://assets.example.com/anime-missing.png'},
     {id:'movies',name:'Movies',color:'#5b9fd5',icon:'📺',target:3,unit:'movies',enabled:true,missingDefaultCoverUrl:'https://assets.example.com/movie-missing.png'}];
    S.categoryOrder=S.categories.map(x=>x.id);
    S.library=[
      {id:'missing',title:'Missing Cover',categoryId:'anime',coverUrl:'',status:'active',priority:'medium',progress:1,total:12},
      {id:'own',title:'Original Cover',categoryId:'anime',coverUrl:'https://assets.example.com/title-original.png',status:'completed',priority:'medium',progress:12,total:12},
      {id:'missing2',title:'Other Missing Cover',categoryId:'movies',coverUrl:'',status:'paused',priority:'medium',progress:0,total:4}
    ];
    S.sessions=[];
    S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    S.settings.libraryView=view;
    S.settings.v200CategoryCovers={useCategoryDefault:usingDefault,modifiedAt:0};
    S.histFilters={libCategories:[],libStatus:'all',libCategory:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'};
    S.view='library'; S.libPage=0; S.v188OverviewPage=0;
    v183EnsureLibraryOverview(S.settings).showOverview=true;
    v188EnsureLibrarySettings(S.settings,S.categories).overview.perPage=15;
    const cfg=v181EnsureLibrarySettings(S.settings);cfg.mode=mode;
    cfg.activeCategoryId='anime';cfg.activeStatus='active';
    try{v53InvalidateLibraryCache();}catch(_){}
    return this.render();
  },
  render(){
    const html=renderLibrary();
    const root=document.getElementById('app');
    root.innerHTML='<main id="view-root"></main>';
    root.querySelector('#view-root').innerHTML=html;
    return html.length;
  },
  sources(){return S.library.map(x=>({id:x.id,coverUrl:x.coverUrl,type:v417LibraryCoverSource(x).type}))},
  enhance(){App.v262EnhanceLibrary();App.v264EnhanceLibrary();App.v265EnhanceLibrary();v225EnhanceButtonIcons(document);App.v226RefreshSemanticButtonIcons(document);},
  canonical(){return ['active','paused','completed','dropped','planned'].map(status=>v229StatusChoiceIcon(status));},
  renderAfterChange(){S.library[0].categoryId='movies';return this.render();}
};
'''
assert bundle.rstrip().endswith('})();')
bundle=bundle.rstrip()[:-len('})();')]+INJECT+'\n})();'

def check_icons(page):
 result=page.evaluate('''() => [...document.querySelectorAll('.mf415-overview-item')].map(card=>({total:card.querySelector('.mf417-total-label .mf417-count-icon svg')?.outerHTML || '',statuses:[...card.querySelectorAll('.mf415-status')].map(item=>({status:item.dataset.status,icon:item.querySelector('.mf417-count-icon svg')?.outerHTML||'',count:item.querySelector('.mf415-status-count')?.textContent}))}))''')
 assert len(result)==2,('overview category count',result)
 assert result[0]['total'].startswith('<svg'),result[0]
 assert len(result[0]['statuses'])==5,result[0]
 assert [x['status'] for x in result[0]['statuses']]==['active','paused','completed','dropped','planned']
 assert all(x['icon'].startswith('<svg') for x in result[0]['statuses']),result[0]
 # Exact icon markup is the canonical Library status-choice icon, not a new SVG definition.
 canonical=page.evaluate('''() => window.__mf417Test.canonical().map(html=>{const el=document.createElement('div');el.innerHTML=html;return el.querySelector('svg').outerHTML})''')
 assert [x['icon'] for x in result[0]['statuses']]==canonical,(result[0]['statuses'],canonical)
 return result

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_style_tag(content=css)
 page.add_script_tag(content=bundle)
 assert not errors,errors[:5]
 for mode in ('classic','dynamic'):
  for view in ('list','compact','cards'):
   for default in (True,False):
    page.evaluate('([mode,view,defaultCover]) => window.__mf417Test.initialize(mode,view,defaultCover)',[mode,view,default])
    page.wait_for_timeout(90)
    icons=check_icons(page)
    src=page.evaluate('()=>window.__mf417Test.sources()')
    assert not src[0]['coverUrl'] and not src[2]['coverUrl'],'Rendered missing cover wrote to title data'
    assert src[1]['coverUrl']=='https://assets.example.com/title-original.png'
    assert src[0]['type']==('category-default' if default else 'category-icon'),src
    for width in (360,820,1600):
     page.set_viewport_size({'width':width,'height':850})
     thumbs=page.evaluate('''()=>[...document.querySelectorAll('.item-row')].map(row=>({id:row.dataset.libraryId,thumb:!!row.querySelector(':scope > .library-cover-thumb'),url:row.querySelector(':scope > img.library-cover-thumb')?.getAttribute('src')||'',fallback:!!row.querySelector(':scope > span.mf417-cover-placeholder'),rect:row.getBoundingClientRect().toJSON()}))''')
     if mode=='classic':
      assert len(thumbs)==3,(mode,view,thumbs)
      cover={x['id']:x for x in thumbs}
      assert cover['missing']['thumb'] and cover['missing']['fallback'],(mode,view,default,cover)
      assert cover['missing']['url']==('https://assets.example.com/anime-missing.png' if default else ''),cover
      assert cover['missing2']['url']==('https://assets.example.com/movie-missing.png' if default else ''),cover
      assert cover['own']['url']=='https://assets.example.com/title-original.png',cover
     else:
      assert all(x['thumb'] and x['fallback'] for x in thumbs),(mode,view,default,thumbs)
      # Dynamic Library filters active Anime only, currently one missing title.
      assert len(thumbs)==1 and thumbs[0]['id']=='missing',thumbs
      assert thumbs[0]['url']==('https://assets.example.com/anime-missing.png' if default else ''),thumbs
     assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 3'),(mode,view,width)
    if mode=='classic':
     page.evaluate('()=>window.__mf417Test.enhance()')
     buttons=page.evaluate('''()=>[...document.querySelectorAll('.mf262-status-row button.mf262-filter-chip')].map(b=>({markup:b.outerHTML,num:b.querySelectorAll(':scope>.mf265-status-icon').length,extra:b.querySelectorAll(':scope>.v225-btn-icon').length,flag:b.dataset.v225Iconified}))''')
     assert len(buttons)>=6,(mode,view,buttons)
     assert all(b['num']<=1 and b['extra']==0 and b['flag']=='1' for b in buttons),buttons
    print('PASS',mode,view,('category URL' if default else 'category icon'),'all viewport sizes, canonical icons & missing covers')
 # Covers and Covers+Titles remain functional and category-specific.
 for display in ('covers','covers-title'):
  for enabled in (True,False):
   page.evaluate('([display,enabled])=>window.__mf417Test.initialize("dynamic",display,enabled)',[display,enabled])
   tile=page.evaluate('''()=>{const el=document.querySelector('.v181-cover-tile');return {html:el?.outerHTML||'',src:el?.querySelector('img')?.getAttribute('src')||'',placeholder:!!el?.querySelector('.mf417-tile-placeholder')}}''')
   assert tile['placeholder'] and tile['src']==('https://assets.example.com/anime-missing.png' if enabled else ''),tile
   print('PASS dynamic',display,'correct cover fallback')
 # Missing cover URL should recalculate when category changes, without persisting a fake URL.
 page.evaluate('()=>window.__mf417Test.initialize("classic","list",true)')
 page.evaluate('()=>window.__mf417Test.renderAfterChange()')
 changed=page.evaluate('''()=>({cover:document.querySelector('[data-library-id="missing"] img.library-cover-thumb')?.getAttribute('src'),saved:window.__mf417Test.sources()[0].coverUrl})''')
 assert changed['cover']=='https://assets.example.com/movie-missing.png' and changed['saved']=='' ,changed
 assert not errors,errors[:8]
 browser.close()
print('PASS v417 real bundled Library status/count icons, duplicate prevention, missing covers, data safety')
