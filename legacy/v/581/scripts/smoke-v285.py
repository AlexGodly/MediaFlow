#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v285.bundle.js').read_text(encoding='utf-8')
cat={'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#6c63e8','enabled':True}
item={'id':'i1','title':'Resume Show','categoryId':'anime','progress':5,'total':12,'status':'active','priority':'medium','coverUrl':'','rating':8.2,'createdAt':1,'modifiedAt':1}
task={'id':'task-285','categoryId':'anime','low':2,'high':4,'targetMid':3,'unit':'episodes','createdAt':1,'reasons':['test']}
state={
 'categories':[cat],'categoryOrder':['anime'],'library':[item],'sessions':[],
 'settings':{'theme':'light','v181Logging':{'defaultMode':'progress','modifiedAt':1},'v192Dashboard':{'showStopwatch':True,'showRuntimeCalculator':True},'sidebarCollapsed':False},
 'currentTask':task,'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},
 'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[],'savedAt':1
}

def setup_script(cloud_state,user_id):
    return f'''() => {{
      const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});
      const user={{id:{json.dumps(user_id)},email:'alex@example.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
      let cloud={json.dumps(cloud_state,separators=(',',':'))};
      const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
      window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};
      window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;window.__cloudState=()=>cloud;
    }}'''

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append('p1:'+str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup_script(state,'v285-user'));page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
    # Build an in-progress log and collapse both tools.
    page.evaluate("App.openLogForm(); App.selectLogTitle('i1'); App.v179UpdateEntryProgressDraft(8); App.addLogEntry(); App.updateLogDraft('note','resume me'); App.v256ToggleDashboardAccordion('stopwatch'); App.v256ToggleDashboardAccordion('runtimeCalculator');")
    page.wait_for_timeout(1100)
    first=page.evaluate("()=>App.v285AuditState()")
    encoded=page.evaluate("()=>window.__cloudState()")
    # New browser context = another device (no local resume cache), using only cloud state.
    page2=b.new_page(viewport={'width':1440,'height':900})
    page2.on('pageerror',lambda e:errors.append('p2:'+str(e)))
    page2.set_content('<!doctype html><html><body><div id=\"app\"></div></body></html>')
    page2.add_style_tag(content=css);page2.evaluate(setup_script(encoded,'v285-user'));page2.add_script_tag(content=bundle);page2.wait_for_timeout(1500)
    second=page2.evaluate("()=>App.v285AuditState()")
    page2.evaluate("App.cancelLogForm()");page2.wait_for_timeout(700)
    cancelled=page2.evaluate("()=>App.v285AuditState()")
    encoded2=page2.evaluate("()=>window.__cloudState()")
    page3=b.new_page(viewport={'width':1440,'height':900})
    page3.on('pageerror',lambda e:errors.append('p3:'+str(e)))
    page3.set_content('<!doctype html><html><body><div id=\"app\"></div></body></html>')
    page3.add_style_tag(content=css);page3.evaluate(setup_script(encoded2,'v285-user'));page3.add_script_tag(content=bundle);page3.wait_for_timeout(1300)
    after_cancel=page3.evaluate("()=>App.v285AuditState()")
    b.close()
res={'errors':errors,'first':first,'second':second,'cancelled':cancelled,'afterCancelReload':after_cancel}
print(json.dumps(res,indent=2))
ok=(
    not errors and first['loggingActive'] and first['loggingEntries']==1 and first['loggingEndProgress']==8 and first['loggingNote']=='resume me' and first['stopwatchCollapsed'] and first['runtimeCalculatorCollapsed'] and
    second['loggingActive'] and second['loggingEntries']==1 and second['loggingEndProgress']==8 and second['loggingNote']=='resume me' and second['currentTaskId']=='task-285' and second['stopwatchCollapsed'] and second['runtimeCalculatorCollapsed'] and second['stopwatchDomCollapsed'] and second['runtimeCalculatorDomCollapsed'] and second['snapshotResumePresent'] and second['backupResumePresent'] and second['presetDashboardPresent'] and second['version']==285 and (not cancelled['loggingActive']) and (not after_cancel['loggingActive'])
)
if not ok: sys.exit(1)
print('SMOKE V285 OK')
