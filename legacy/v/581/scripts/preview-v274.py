from pathlib import Path
import json,re,shutil,time,urllib.parse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v274.bundle.js').read_text(encoding='utf-8')
def cover(text,color):
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect width="100%" height="100%" fill="{color}"/><rect x="14" y="14" width="292" height="452" rx="20" fill="none" stroke="white" stroke-opacity=".35" stroke-width="3"/><text x="160" y="245" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="700">{text}</text></svg>'''
    return 'data:image/svg+xml,'+urllib.parse.quote(svg)
cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga Backlog','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
 {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True},
]
colors=['#375a7f','#854d71','#6d597a','#355070','#52796f','#9c6644','#5e548e','#7f5539','#3d405b','#6b705c','#8d5a97','#4a6fa5']
lib=[]
for i in range(36):
 c=cats[i%4]
 lib.append({'id':f'i{i}','title':['Arcane Legacy','Crimson Season','Night Protocol','Paper Kingdom','Solar Divide','Forgotten Signal','Silent Crown','Blue Horizon','Last Chapter','Echo Station','Glass City','Velvet Code'][i%12]+f' {i//12+1}','categoryId':c['id'],'progress':(i*3)%24,'total':24 if c['unit']!='movies' else 1,'status':['active','planned','completed','paused'][i%4],'priority':['high','medium','low'][i%3],'coverUrl':cover(f'TITLE {i+1}',colors[i%len(colors)]),'year':1995+(i%30),'rating':5+(i%6),'source':'simkl','simklId':str(2000+i),'runtimeMinutes':22+(i%95),'seasonCount':1+(i%6),'modifiedAt':i})
base=int(time.time()*1000)
collections=[]
for idx,(title,desc,count) in enumerate([
 ('Bridget Jones Franchise','A complete watch-through of the franchise, kept in release order.',8),
 ('Final Destination Franchise','Every entry together with progress, ratings and collection order.',12),
 ('James Bond Essentials','A curated selection spanning different Bond eras.',16),
]):
 ids=[f'i{(idx*8+j)%len(lib)}' for j in range(count)]
 collections.append({'id':f'c{idx+1}','title':title,'description':desc,'coverUrl':'','titleIds':ids,'order':ids,'autoBackground':True,'createdAt':base-(idx+4)*86400000,'updatedAt':base-idx*3600000,'lastViewedAt':base-idx*7200000})
state={'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':[],'collections':collections,'collectionTombstones':[],'settings':{'theme':'default','v238DeviceLayout':'desktop','autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{ const store={{}};const fakeStore={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>{{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fakeStore}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore}});const user={{id:'preview',email:'preview@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1500,'height':920},device_scale_factor=1)
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css); page.evaluate(setup); page.add_script_tag(content=bundle); page.wait_for_timeout(1200)
 page.evaluate("App.setView('collections')");page.wait_for_timeout(150)
 page.screenshot(path='/mnt/data/v274-collections-preview.png',full_page=True)
 page.evaluate("App.v274OpenCollection('c1')");page.wait_for_timeout(120)
 page.screenshot(path='/mnt/data/v274-collection-detail-preview.png',full_page=True)
 b.close()
print('previews ready')
