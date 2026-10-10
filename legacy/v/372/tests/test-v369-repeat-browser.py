#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json
root=Path(__file__).resolve().parents[1]
bundle=(root/'assets/js/mediaflow-v369.bundle.js').read_text()
assert bundle.endswith('})();\n')
bundle=bundle[:-6]+'''window.__test369={S,App};
render=function(){};renderView=function(){};
persistCategories=function(){};persistSessions=function(){};persistTask=function(){};persistLibrary=function(){};
})();\n'''
exe=shutil.which('chromium') or shutil.which('google-chrome')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=exe,args=['--no-sandbox','--disable-dev-shm-usage'])
 pg=browser.new_page();pg.set_content('<html><head></head><body></body></html>')
 pg.evaluate("Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});")
 pg.add_script_tag(content=bundle)
 result=pg.evaluate('''() => {
 const {S,App}=window.__test369;
 S.settings=S.settings||{};
 S.categories=[{id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:24,secondsPerUnit:1455,enabled:true,weight:1}];
 S.library=[{id:'a',title:'Example',categoryId:'anime',status:'active',priority:'medium',progress:11,total:24}];
 S.sessions=[];S.currentTask={categoryId:'anime',targetMid:1};S.sessionActive=true;S.logging=true;
 S.logDraft={v369Interface:'itemized',v179Mode:'amount',v369CommitId:'browser-mixed',categoryId:'anime',entries:[
 {title:'Example',libraryId:'a',qty:0,v179StartProgress:11,v369Units:[]}
 ],amount:0,minutes:0,note:'',updateLibrary:true};
 S.entryDraft={title:'',qty:1,libraryId:null};
 App.v369AddUnit(0);App.v369SetNext(0,11);App.v369AddUnit(0,true);
 const logged=S.logDraft.entries[0].v369Units.map(x=>({number:x.number,repeat:x.isRepeat}));
 let error='';try{App.submitLog()}catch(e){error=e.message}
 const s=S.sessions.find(x=>x.v369Itemized);
 return {logged,error,actualAmount:s?.actualAmount,repeatUnits:s?.repeatUnits,repeatBonusXP:s?.repeatBonusXP,
 savedUnits:s?.titles?.[0]?.v369Units?.length,libraryProgress:S.library[0].progress,xp:s?.xp};
 }''')
 print(json.dumps(result,indent=2))
 assert result['error']=='',result
 assert result['actualAmount']==2,result
 assert result['repeatUnits']==1,result
 assert result['repeatBonusXP']>0,result
 assert result['libraryProgress']==12,result
 browser.close()
print('PASS v369: mixed repeat unit earns repeat XP without inflating Library progress')
