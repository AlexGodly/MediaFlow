"""Simulated provider/selection tests, not an assertion of live-provider coverage."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v380.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v380={S,App,renderLogForm,v373OrderState,v373OrderedEntries,v380DraftUnitCount,v166AvailableEpisodeCount,V380_ADAPTERS,renderLogSuggestions,v166SeasonalSettingsHtml};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.evaluate("()=>{const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}")
 page.add_script_tag(content=js)
 result=page.evaluate('''async()=>{
  const m=window.__v380,s=m.S;
  s.settings=s.settings||{};
  s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,unit:'episodes'}];
  s.library=[{id:'one',title:'Example Anime',categoryId:'seasonal',status:'active',progress:3,externalIds:{mal:'1'}}];
  s.logDraft={entries:[],v369Interface:'itemized',v373Ordering:{sort:'draftUnits',dir:'desc',manualIds:[],randomSeed:1}};
  let calls=[];
  window.fetch=async function(url,opts){
   url=String(url);calls.push(url);
   let data=null, status=200;
   if(url.includes('api.ani.zip'))data={mappings:{mal_id:1},episodes:{'1':{episode:1,airdate:'2024-01-01'},'2':{episode:2,airdate:'2024-01-08'},'3':{episode:3,airdate:'2099-01-01'}}};
   else if(url.includes('graphql.anilist.co'))data={data:{Media:{id:1,idMal:1,status:'RELEASING',episodes:12,nextAiringEpisode:{episode:8,airingAt:4102444800},airingSchedule:{nodes:[{episode:7,airingAt:1704672000}]}}}};
   else if(url.includes('api.tvmaze.com/search'))data=[{show:{id:22,name:'Example Anime'}}];
   else if(url.includes('api.tvmaze.com/shows'))data=[{season:1,number:1,airstamp:'2024-01-01T04:00:00Z'},{season:1,number:2,airstamp:'2024-01-08T04:00:00Z'},{season:1,number:3,airstamp:'2099-01-01T04:00:00Z'}];
   else if(url.includes('kitsu.io/api/edge/mappings'))data={data:[{attributes:{externalId:'1',externalSite:'myanimelist/anime'},relationships:{item:{data:{type:'anime',id:'44'}}}}]};
   else if(url.includes('kitsu.io/api/edge/anime/44'))data={data:{attributes:{status:'current',episodeCount:12}}};
   else if(url.includes('kitsu.io/api/edge/episodes'))data={data:[{attributes:{number:1,airdate:'2024-01-01'}},{attributes:{number:2,airdate:'2024-01-08'}},{attributes:{number:3,airdate:'2099-01-01'}}]};
   else if(url.includes('tenrai.org'))status=404;
   else throw Error('Unexpected API request '+url);
   return {ok:status===200,status,headers:{get:()=>null},json:async()=>data};
  };
  const results={};
  for(const provider of ['anizip','anilist','tvmaze','kitsu']){
   s.settings.v380EpisodeProvider=provider;
   results[provider]=await m.v166AvailableEpisodeCount('1',true);
  }
  s.settings.v380EpisodeProvider='automatic';
  results.automatic=await m.v166AvailableEpisodeCount('1',true);
  results.urls=calls;
  results.units=[m.v380DraftUnitCount({v369Units:[{},{},{}]}),m.v380DraftUnitCount({qty:7}),m.v380DraftUnitCount({qty:0})];
  s.logDraft.entries=[{title:'A',v369Units:[{},{}]},{title:'B',v369Units:[{},{},{},{}]},{title:'C',v369Units:[]}];
  results.sorted=m.v373OrderedEntries().map(e=>e.entry.title);
  results.html=m.v166SeasonalSettingsHtml();
  return results;
 }''')
 assert result['anizip']==2,result
 assert result['anilist']==7,result
 assert result['tvmaze']==2,result
 assert result['kitsu']==2,result
 assert result['automatic']==2,result
 assert result['units']==[3,7,0],result
 assert result['sorted']==['B','A','C'],result
 assert 'Automatic Multi-Provider' in result['html'] and 'AniList' in result['html'] and 'TVmaze' in result['html'],result
 assert not errors,errors[:5]
 print('PASS provider mocks: AniZip, AniList, TVmaze, Kitsu, Automatic fallback; draft-unit sorting; settings selector')
 browser.close()
