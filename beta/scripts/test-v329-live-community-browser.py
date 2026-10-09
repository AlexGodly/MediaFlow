from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v329.bundle.js').read_text()
i=b.rfind('})();');assert i>0
b=b[:i]+r'''
window.__mf328Test={calls:[],records:{browse:[{provider:'mal',provider_id:'1234',title:'ORIGINAL CLOUD TITLE',users_count:2,average_rating:8.5,ratings_count:2,covers:['https://example.org/title.jpg'],statuses:{active:1,completed:1},metadata:{type:'anime'},total:24}],ratings:[{provider:'mal',provider_id:'1234',title:'ORIGINAL CLOUD TITLE',users_count:2,average_rating:8.5,ratings_count:2,covers:[],rank:1,match_count:1,total_ranked:1}],collections:[{id:'owner-collection',user_id:'owner-1',username:'creator',display_name:'Creator',title:'LIVE ORIGINAL COLLECTION',description:'Original only',items:[{title:'ORIGINAL CLOUD TITLE',coverUrl:''}],item_count:1,cover_url:'',updated_at:new Date().toISOString(),is_public:true}],users:[{user_id:'owner-1',username:'creator',display_name:'Creator',show_xp:true,xp_total:9090,xp_level:23,library_titles:128,usage_seconds:1200,show_usage_time:true,total_matches:1,rank:1}]},rpcCalls:[],tableWrites:[]};
window.__mf328TestSetup=function(){
 MF302.page='browse';MF302.renderId=0;MF302.catalogOffset=0;MF302.query=''; MF302.browseRows=[];MF312.users.query='';
 const q=window.__mf328Test;
 window.fetch=async input=>{const u=new URL(String(input));q.calls.push(u.toString());const action=u.searchParams.get('action');const data=q.records[action]||[];const response=action==='count'?{count:1}:action==='collection'?{collection:q.records.collections[0]}:{items:data,total:data.length};return {ok:true,json:async()=>response};};
 supabase={rpc(name){q.rpcCalls.push(name);return Promise.resolve({data:[],error:null})},from(name){return {select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:[],error:null})},insert(rows){q.tableWrites.push({name,rows});return Promise.resolve({error:null})},upsert(rows){q.tableWrites.push({name,rows});return Promise.resolve({error:null})},delete(){return this},then(cb){return Promise.resolve({data:[],error:null}).then(cb)}}}};
 };
window.__mf328Public=function(pg){MF302.page=pg;document.getElementById('mf302-content').innerHTML='';return mfRenderPublic();};
'''+b[i:]
checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1440,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':900});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content('<!doctype html><html><body><div id="app"></div><div id="view-root"></div></body></html>')
  page.evaluate('''() => {Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  Path('/mnt/data/_debug_injected_v329.js').write_text(b)
  page.add_script_tag(content=b)
  for css in ('155-v309-browse-views.css','157-v310-public-collections.css'):
   p=R/'assets/css'/css
   if p.exists():page.add_style_tag(path=str(p))
  page.evaluate('__mf328TestSetup()')
  for route,needle,action in [('browse','ORIGINAL CLOUD TITLE','browse'),('ratings','ORIGINAL CLOUD TITLE','ratings'),('collections','LIVE ORIGINAL COLLECTION','collections'),('users','Creator','users')]:
   page.evaluate('(r)=>__mf328Public(r)',route);page.wait_for_timeout(220)
   body=page.locator('#mf302-content').inner_text()
   assert needle in body,(width,route,body[:600],errs)
   checks+=1
   assert page.evaluate('(a)=>__mf328Test.calls.some(x=>x.includes("action="+a))',action);checks+=1
  assert not page.evaluate('__mf328Test.rpcCalls');checks+=1
  assert not page.evaluate('__mf328Test.tableWrites');checks+=1
  assert not errs,(width,errs);checks+=1
  print(width,'Community live views pass')
  page.close()
 browser.close()
print('v328 live Community browser checks:',checks)
