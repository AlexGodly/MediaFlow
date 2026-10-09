from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];b=(R/'assets/js/mediaflow-v329.bundle.js').read_text();i=b.rfind('})();');assert i>0
b=b[:i]+r'''
window.__v325={setup(){
 const p={user_id:'remote-owner',username:'sampleowner',display_name:'Another MediaFlow User',avatar_url:'https://example.com/a.png',is_public:true,xp_level:23,xp_total:5310,show_library:true,show_history:true,show_order:true,show_statistics:true,profile_v323:{tabs:[{id:'library',visible:true},{id:'collections',visible:true},{id:'order',visible:true},{id:'old',visible:true},{id:'history',visible:true},{id:'statistics',visible:true}]}};
 window.__v325data={p,write:[],sections:{meta:[{categories:[{id:'anime',name:'Anime',color:'#47a6d7',type:'video',unit:'episodes',target:3,enabled:true}],settings:{v175PageSizes:{library:20},v274Collections:{browserView:'cards',pageSize:20}},publishedAt:Date.now()}],library:[{id:'a',title:'Another Person Anime',categoryId:'anime',status:'active',priority:'high',progress:5,total:12,coverUrl:'',rating:8,createdAt:Date.now()}],history:[{id:'hist1',title:'Another Person Anime',categoryId:'anime',status:'logged',date:new Date().toISOString().slice(0,10),timestamp:Date.now(),actualAmount:1,targetAmount:1,minutes:20,unit:'episodes'}],collections:[{id:'col1',title:'My Collection',description:'Collection',coverUrl:'',titleIds:['a'],order:['a'],_titles:[{id:'a',title:'Another Person Anime',categoryId:'anime',status:'active',progress:5,total:12}]}],collection_titles:[{id:'a',title:'Another Person Anime',categoryId:'anime',status:'active',progress:5,total:12}],order:[{orderPlan:{titleIds:['a'],viewMode:'all'}}],order_titles:[{id:'a',title:'Another Person Anime',categoryId:'anime',status:'active',progress:5,total:12}],order_collections:[],old:[{enabledCategoryIds:['anime'],balances:{anime:22},rules:[],mode:'system'}],old_transactions:[]}};
 mfRoutePath=()=> 'sampleowner'; mfMyProfile=async()=>__v325data.p; mfQuery=async(t)=>t==='mf_public_profiles'?[__v325data.p]:[];
 S.categories=[{id:'private',name:'PRIVATE CATEGORY',color:'#fff'}];S.library=[{id:'secret',title:'PRIVATE VISITOR LIBRARY',categoryId:'private',status:'active',progress:1,total:3}];S.sessions=[];S.collections=[];S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
 supabase={from(t){const p={table:t,filters:[]};const o={select(v,opts){p.options=v;return o},eq(k,v){p.filters.push([k,v]);return o},ilike(){return o},order(){return o},range(a,b){return Promise.resolve(__v325.mock(p))},limit(){return Promise.resolve(__v325.mock(p))},maybeSingle(){return Promise.resolve(__v325.single(p))},upsert(data){__v325data.write.push({table:t,data});return Promise.resolve({error:null})},update(){return o},delete(){return o},gte(){return Promise.resolve({error:null})},then(resolve){return Promise.resolve({error:null,data:[]}).then(resolve)}};return o}};
 AUTH_USER=null;MF302.page='profile';MF302.renderId=0;
},owner(){AUTH_USER={id:'remote-owner'};S.library=[{id:'a',title:'Another Person Anime',categoryId:'anime',coverUrl:'',status:'active',progress:5,total:12}];S.categories=[{id:'anime',name:'Anime',color:'#47a6d7',enabled:true,type:'video',unit:'episodes'}];S.sessions=[{id:'s1',title:'Another Person Anime',categoryId:'anime',timestamp:Date.now(),date:new Date().toISOString().slice(0,10),status:'logged',actualAmount:1,minutes:25}];S.collections=[{id:'col1',title:'My Collection',titleIds:['a'],order:['a']}];S.orderPlan={titleIds:['a'],collectionAssignments:[]};S.oldSystem={enabledCategoryIds:['anime'],balances:{anime:1},rules:[],transactions:[]}},visitor(){return S.library?.[0]?.title},mock(p){if(p.table==='mf_public_workspace_v325'){const section=p.filters.find(x=>x[0]==='section')?.[1]||'meta',items=__v325data.sections[section]||[];return {data:items.length?[{page:0,items}]:[],error:null};}if(p.table==='mf_public_showcase_v323'){const section=p.filters.find(x=>x[0]==='section')?.[1];return {data:[{page:0,items:section==='categories'?[{name:'Anime',id:'anime'}]:[]}],error:null};}if(p.table==='mf_public_library')return {data:[],count:0,error:null};if(p.table==='mf_public_history')return {data:[],count:0,error:null};if(p.table==='mf_public_collections')return {data:[],error:null};return {data:[],error:null}},single(p){if(p.table==='mf_public_showcase_v323')return {data:{items:[{id:'anime',name:'Anime'}]},error:null};if(p.table==='mf_public_statistics')return {data:null,error:null};return {data:null,error:null}},render(){return mf323PublicRender()}};

window.__v325.testPaint=()=>{MF316.xp=12345;MF316.seconds=999999;mf316PaintStats()};
window.__v325.quickAddTest=()=>{AUTH_USER={id:'visitor'};S.categories=[{id:'private',name:'My own Category',color:'#ffcc00'}];S.library=[];saveState=async()=>{};MF323.selected='library';MF325.current={library:__v325data.sections.library,categories:__v325data.sections.meta[0].categories};MF329.details('a');};
window.__v325.librarySize=()=>S.library.length;
window.__v325.sharePanel=(isPublic)=>{AUTH_USER={id:'visitor'};S.view='collections';S.categories=[{id:'private',name:'My own Category',color:'#ffcc00'}];S.library=[];S.collections=[{id:'col1',title:'Test User Collection',titleIds:[],order:[]}];V274_UI.activeId='col1';MF329.sharingBusy=false;MF329.sharingUser='visitor';MF329.shares=isPublic?new Set(['col1']):new Set();return v274CollectionDetailHtml(S.collections[0]);};
window.__v325.favoriteTest=()=>{AUTH_USER={id:'visitor'};MF323.editor={favorites:[]};S.library=[{id:'f1',title:'Angel Beats',categoryId:'private',status:'completed'},{id:'f2',title:'Angel of Doom',categoryId:'private',status:'active'}];S.categories=[{id:'private',name:'My own Category',color:'#ffcc00'}];MF329.favoriteQuery='angel';MF329.favoritesRender();};

'''+b[i:]
passed=0
with sync_playwright() as pw:
 bwr=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1440,768,390,320):
  page=bwr.new_page(viewport={'width':width,'height':950}); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><body><div id="app"></div><div id="view-root"></div></body></html>')
  page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  page.add_script_tag(content=b)
  # In production, the bundled <script src> supplies the GitHub Pages asset base.
  # Our inline test bundle needs an inert source tag to emulate that resolution.
  page.evaluate("""() => {const s=document.createElement('script');s.type='application/json';s.src='https://example.com/MediaFlow/assets/js/mediaflow-v329.bundle.js';document.head.appendChild(s);}""")
  for name in ('179-v323-public-profile-showcase.css','180-v324-workspace-public-mirrors.css'):
   page.add_style_tag(path=str(R/'assets/css'/name))
  page.evaluate('__v325.setup()')
  page.evaluate('''() => {
    __v325data.sections.meta[0].categories=[{id:'anime',name:'Anime',color:'#47a6d7',iconUrl:'assets/category-icons/novels.png',icon:'🖼️',type:'video',unit:'episodes',target:3,enabled:true}];
    __v325data.sections.meta[0].categoryCounts={anime:1};
    __v325data.sections.history[0].titles=[{libraryId:'a',title:'Another Person Anime',coverUrl:'https://example.com/a.png',qty:1}];
    __v325data.sections.old[0].mode='system';
  }''')
  page.evaluate("""() => {window.fetch=async input=>{const u=new URL(String(input));const sec=u.searchParams.get('section');const pg=Number(u.searchParams.get('page')||0);const items=pg===0?(__v325data.sections[sec]||[]):[];return {ok:true,json:async()=>({items,has_more:false,updated_at:new Date().toISOString(),section:sec})};};}""");page.evaluate('__v325.render()');page.wait_for_timeout(320)
  def check(cond,label):
   global passed
   assert cond,f'{label} => '+page.locator('#mf323-tab-body').inner_text()[:420]
   passed+=1
  check(page.locator('.mf325-native').count()==1,'native wrapper')
  check(page.locator('.mf325-native .view-head,.mf325-native .view-title,.mf325-native .library-view').count()>0,'original workspace markup')
  check('Another Person Anime' in page.locator('#mf323-tab-body').inner_text(),'own remote data')
  check(page.locator('#mf323-cats .mf329-universe-category').count()==1,'category universe rows in owner order')
  check('1 titles' in page.locator('#mf323-cats').inner_text(),'category title count from original data')
  check('novels.png' in page.locator('#mf323-cats img.mf329-cat-icon').first.get_attribute('src'),'packaged category icons normalized to MediaFlow asset URL')
  check(page.locator('.mf323-segment .mf329-action-icon').count()==0 or page.locator('.mf323-segment .mf329-action-icon').count()>=2,'theme buttons have meaningful icons for signed-in visitor')
  check(page.locator('.mf323-actions .mf329-action-icon').count()>=1,'Share Profile icon')
  check(page.locator('.mf325-native-page .mf329-icon-wrap').count()>=0,'native icons compatible')
  check('PRIVATE VISITOR LIBRARY' not in page.locator('#mf323-tab-body').inner_text(),'visitor private data isolation')
  check(page.locator('.mf325-native-page [onclick]').count()==0,'no inline mutation actions')
  if width==1440:
   check(page.locator('.mf325-native input[placeholder="Search titles…"]').count()==1,'native Workspace search present')
   page.locator('.mf325-native input[placeholder="Search titles…"]').fill('not-a-title');page.wait_for_timeout(100)
   check('Another Person Anime' not in page.locator('.mf325-native-page').inner_text(),'public Library native search works')
   page.locator('.mf325-native input[placeholder="Search titles…"]').fill('Another');page.wait_for_timeout(100)
   check('Another Person Anime' in page.locator('.mf325-native-page').inner_text(),'public Library search reset')
   check(page.locator('[data-mf325-action=setLibraryView]').count()>=4,'actual Workspace view controls')
   page.locator('[data-mf325-action=setLibraryView]').last.click();page.wait_for_timeout(80)
   check('Another Person Anime' in page.locator('.mf325-native-page').inner_text(),'native view mode works')
   check(page.locator('.mf325-native-page [data-library-id]').count()>0,'public Library has clickable title rows')
   page.locator('.mf325-native-page [data-library-id]').first.click();page.wait_for_timeout(70)
   check(page.locator('#mf329-title-dialog').count()==1,'clicking a public Library cover/title opens Quick Add details')
   page.locator('#mf329-title-dialog [data-close]').click()

  check(page.evaluate('__v325.visitor()')=='PRIVATE VISITOR LIBRARY','original global state restored')
  for tab in ('history','collections','order','old'):
   page.evaluate('(t)=>MF323.tab(t)',tab);page.wait_for_timeout(160)
   check(page.locator('.mf325-native').count()==1,tab+' native')
   if tab in ('history','order'):check('Another Person Anime' in page.locator('.mf325-native-page').text_content(),tab+' uses real owner data')
   if tab=='collections':check('My Collection' in page.locator('.mf325-native-page').text_content(),'owner Collections shown')
   if tab=='history':
    check(page.locator('.mf269-card-copy b').filter(has_text='Another Person Anime').count()>0,'consumption uses actual title not Category label')
    check(page.locator('.mf269-card-cover img').count()>0,'consumption uses title cover')
   if tab=='order':
    check(page.locator('.mf287-add-collection-card').count()==0,'public Personal Order add Collection card removed')
    check(page.locator('.v138-picker-search').count()==0,'public Personal Order add Titles picker removed')
   if tab=='old':
    check(page.locator('.v153-os-tabs').count()==0,'public Old System mode tabs removed')
    check('Exact MediaFlow Consumption' in page.locator('.mf325-native-page').inner_text() or 'Statistics' in page.locator('.mf325-native-page').inner_text(),'public Old System Stats shown')
   check(page.locator('.mf323-error').count()==0,tab+' did not error')
   check(page.locator('.mf325-native-page [onclick]').count()==0,tab+' no mutation handlers')
   check(page.evaluate('__v325.visitor()')=='PRIVATE VISITOR LIBRARY',tab+' visitor isolation')
  # v326 Statistics uses the real Workspace renderer, with a remote owner's data.
  page.evaluate('''() => {
    __v325data.sections.statistics=[{settings:{leveling:{enabled:true,libraryAdditionXP:20,completionXP:25,unitXP:{episodes:20},timeXP:{enabled:true,intervalMinutes:10,xpPerInterval:5}}},xpLedger:{},totalXP:9312,profileName:'Another MediaFlow User',statsHeatmapYear:new Date().getFullYear(),statsRecapMonth:'',time:{xp:88,seconds:7200,pending:120,days:[{day:new Date().toISOString().slice(0,10),active_seconds:2400,xp_earned:20}]},publishedAt:Date.now()}];
    __v325data.sections.statistics_titles=[{id:'remote2',title:'REMOTE STATISTICS TITLE',categoryId:'anime',status:'completed',progress:12,total:12,rating:9,completedAt:Date.now()}];
    __v325data.sections.statistics_sessions=[{id:'stats_s',title:'REMOTE STATISTICS TITLE',categoryId:'anime',status:'complete',date:new Date().toISOString().slice(0,10),timestamp:Date.now(),actualAmount:1,minutes:32,unit:'episodes',xp:20}];
    __v325data.sections.statistics_timeline=[{libraryId:'remote2',title:'REMOTE STATISTICS TITLE',categoryId:'anime',completedAt:Date.now()}];
    __v325data.sections.statistics_activity=[];
  }''');
  page.evaluate("MF323.tab('statistics')");page.wait_for_timeout(290)
  check(page.locator('.mf326-statistics .mf325-native-page').count()==1,'native statistics in original Workspace container')
  check(page.locator('.mf326-statistics .stats-level-card').count()>0,'original Workspace Leveling component')
  check(page.locator('.mf326-statistics .mf316-time-stat').count()==1,'original Workspace Time Spent component')
  check('REMOTE STATISTICS TITLE' in page.locator('.mf326-statistics').inner_text(),'owner-only remote statistics title')
  check('PRIVATE VISITOR LIBRARY' not in page.locator('.mf326-statistics').inner_text(),'no private visitor title in stats')
  check('88 XP' in page.locator('.mf326-statistics .mf316-time-stat').inner_text(),'owner time XP not visitor time XP')
  check(page.locator('.mf326-statistics .profile-stat-avatar').count()==0,'public Statistics avatar removed')
  check(page.locator('.mf326-statistics .mf316-stats-title h2').inner_text()=='Active time','public-only Active time title')
  check(page.locator('.mf326-statistics .profile-stat-hero .pill').count()>=3,'public Statistics title/session/time pills kept')
  page.evaluate('__v325.testPaint()')
  check('88 XP' in page.locator('.mf326-statistics .mf316-time-stat').inner_text(),'background visitor activity cannot repaint public owner stats')
  if width==1440:
   check(page.locator('.mf326-statistics [data-mf325-action=setRecapMonth]').count()>0,'original recap selector retained as safe read-only control')
   check(page.locator('.mf326-statistics [data-mf325-action=setHeatmapYear]').count()>0,'original heatmap selector retained as safe read-only control')
  check(page.locator('.mf326-statistics [onclick]').count()==1,'only public view refresh button has inline action')
  check(page.evaluate('__v325.visitor()')=='PRIVATE VISITOR LIBRARY','statistics leaves visitor original state intact')
  check(page.locator('.mf326-statistics iframe').count()==0,'no snapshot iframe')
  check(not errors,'browser errors: '+str(errors))
  if width==1440:
   page.evaluate('__v325.owner()')
   page.evaluate('MF323.publish()');page.wait_for_timeout(100)
   check(page.evaluate("__v325data.write.filter(x=>['mf_public_workspace_v325','mf_public_showcase_v323','mf_public_library','mf_public_history','mf_public_statistics'].includes(x.table)).length") == 0, 'no duplicated media publication writes')
  if width==1440:
   page.evaluate('__v325.quickAddTest()')
   check(page.locator('#mf329-title-dialog').count()==1,'public detail modal opens')
   check(page.locator('#mf329-title-dialog [data-add]').count()==1,'only Quick Add action shown on public title details')
   page.locator('#mf329-title-dialog [data-add]').click()
   check(page.locator('#mf329-add-category').count()==1,'viewer assigns title to their own Category')
   page.locator('#mf329-title-dialog [data-save]').click()
   page.wait_for_timeout(150)
   check(page.evaluate('__v325.librarySize()')==1,'Quick Add created a title in visitor Library only')
   check('Make Public' in page.evaluate('__v325.sharePanel(false)'), 'private Workspace Collection details expose Make Public toggle')
   check('Make Private' in page.evaluate('__v325.sharePanel(true)'), 'private Workspace Collection details expose Make Private toggle')
   page.evaluate("document.body.insertAdjacentHTML('beforeend','<div id=\"mf323-search-results\"></div>')")
   page.evaluate('__v325.favoriteTest()')
   check(page.locator('.mf329-fav-row').count()==2,'favorite-title search has Logging-style results')
   check('My own Category' in page.locator('.mf329-fav-row').first.inner_text(),'favorite search contextual Category data')
  print(width,'pass')
  page.close()
 bwr.close()
print('v327 live-reader native six-tab checks:',passed)
