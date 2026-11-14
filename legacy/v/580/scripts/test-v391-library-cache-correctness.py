"""Check that v391 caching retains every canonical Dynamic Library sort/filter result."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
script=(R/'assets/js/mediaflow-v391.bundle.js').read_text().rstrip();assert script.endswith('})();')
script=script[:-5]+'''\nwindow.__test391=()=>{
 S.categories=[{id:'a',name:'Anime',unit:'episodes',type:'video',color:'#55aacc'},{id:'b',name:'Shows',unit:'episodes',type:'video',color:'#ab45cc'}];
 S.settings=S.settings||{};const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);cfg.mode='dynamic';cfg.activeCategoryId='a';cfg.activeStatus='active';
 S.library=Array.from({length:1800},(_,i)=>({id:'p'+i,title:'Title '+(1800-i),categoryId:i%5===0?'b':'a',status:i%3===0?'completed':'active',priority:['high','medium','low'][i%3],rating:i%11,progress:i%27,total:24,genres:['action'],tags:['hero'],createdAt:1700000000000+i,lastSeenAt:1710000000000+i,modifiedAt:1720000000000+i}));
 S.histFilters=S.histFilters||{};S.histFilters.libSearch='';S.histFilters.libPriority='all';S.histFilters.libRating='all';S.histFilters.libUnfinishedOnly=false;S.histFilters.libSort='title-asc';
 v53InvalidateLibraryCache();
 const samples=[];
 const check=(name)=>{
    const want=v391DynamicRowsBase().map(x=>x.id);
    const got=v181DynamicRows().map(x=>x.id);
    const cached=v181DynamicRows().map(x=>x.id);
    if(JSON.stringify(want)!==JSON.stringify(got)||JSON.stringify(got)!==JSON.stringify(cached))throw Error('mismatched '+name);
    samples.push([name,got.length]);
 };
 check('initial');
 for(const sort of ['title-desc','priority-desc','rating-asc','progress-desc','total-asc','logging-desc','edited-asc','seen-desc','added-asc','random']){
   S.histFilters.libSort=sort;S.histFilters.libRandomSeed=100;check('sort-'+sort);
 }
 S.histFilters.libSort='title-asc';S.histFilters.libSearch='title 8';check('search');
 S.histFilters.libSearch='';S.histFilters.libPriority='high';check('priority');
 S.histFilters.libPriority='all';S.histFilters.libRating='9+';check('rating');
 S.histFilters.libRating='all';S.histFilters.libUnfinishedOnly=true;check('unfinished');
 S.histFilters.libUnfinishedOnly=false;cfg.activeCategoryId='b';check('category');
 cfg.activeCategoryId='a';cfg.activeStatus='completed';check('status');
 cfg.activeStatus='active';S.library[1].title='Renamed for cache invalidation';v53InvalidateLibraryCache();S.histFilters.libSearch='renamed';check('modified');
 const audit=App.v391PerformanceAudit();if(audit.dynamicHits<samples.length)throw Error('cache misses '+JSON.stringify(audit));
 const cmp=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 for(const [a,b] of [['Title 10','Title 2'],['Épisode 12','episode 3'],['a','B'],['Foo - A','Foo - B'],['José 1','Jose 1']]){
   const left=a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
   const right=cmp.compare(a,b);
   if(Math.sign(left)!==Math.sign(right))throw Error('collation changed '+a+' / '+b);
 }
 return {samples,audit};
};})();'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page();page.set_content('<html><body><div id="app"></div></body></html>')
 page.evaluate('''()=>{let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
 page.add_script_tag(content=script)
 result=page.evaluate('()=>__test391()')
 print('PASS v391 Dynamic Library filter/sort parity',result,flush=True)
 b.close()
