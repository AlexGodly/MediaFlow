"""v391 large-Library performance regression, synthetic data in Chromium."""
from pathlib import Path
import re, sys, statistics, subprocess, time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
version=sys.argv[1] if len(sys.argv)>1 else '390'
index=(R/'index.html').read_text()
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>', '',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/f'assets/js/mediaflow-v{version}.bundle.js').read_text().rstrip();assert js.endswith('})();');js=js[:-5]+'''\nwindow.__perf={S,App,render,renderView,renderLibrary,v181DynamicRows,v53FilteredLibrary,v241EnsureLibraryIndex,v53InvalidateLibraryCache,renderDashboard,run:(size)=>{
const cat={id:'anime',name:'Anime',type:'video',unit:'episodes',target:2,weight:1,color:'#4e88cd',enabled:true};
S.categories=[cat];S.sessions=[];S.activityLog=[];S.completionTimeline=[];S.view='library';S.logging=false;S.modal=null;S.sessionActive=true;
S.settings=S.settings||{};const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);cfg.mode='dynamic';cfg.activeCategoryId='anime';cfg.activeStatus='active';
S.library=Array.from({length:size},(_,i)=>({id:'p-'+i,title:'Video title '+String(i).padStart(7,'0')+(i%401===0?' hotel inhumans':''),categoryId:'anime',status:'active',priority:['high','low','medium'][i%3],progress:i%22,total:24,genres:['Adventure','Comedy'],tags:['anime','fun'],rating:(i%10)+1,addedAt:1700000000000+i,coverUrl:''}));
S.histFilters=S.histFilters||{};S.histFilters.libSearch='';S.histFilters.libPriority='all';S.histFilters.libSort='title-asc';S.libPage=0;
v53InvalidateLibraryCache();/* no-op */
const measure=(fn)=>{const a=performance.now();const res=fn();return [Math.round((performance.now()-a)*10)/10,res?.length||0]};
const first=measure(()=>v181DynamicRows());
const repeat=Array.from({length:5},()=>measure(()=>v181DynamicRows())[0]);
S.histFilters.libSearch='hotel';const search=measure(()=>v181DynamicRows());
const repeated=Array.from({length:6},()=>measure(()=>v181DynamicRows())[0]);
S.histFilters.libSearch='';const emptyAgain=measure(()=>v181DynamicRows());
const normal=measure(()=>v53FilteredLibrary('all','all','all',''));
const normalWarm=measure(()=>v53FilteredLibrary('all','all','all',''));
return {first,repeat,search,repeated,emptyAgain,normal,normalWarm};
}};})();'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1280,'height':900});page.set_default_timeout(60000)
 page.set_content(html)
 page.evaluate('''()=>{let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
 page.add_script_tag(content=js)
 for size in [3000,30000]:
  print('RESULT',version,size,page.evaluate('(size)=>__perf.run(size)',size),flush=True)
 page.close();b.close()
