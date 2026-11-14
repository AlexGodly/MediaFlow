#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v241 PERF FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1];BUNDLE=ROOT/'assets/js/mediaflow-v241.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:print('v241 PERF FAILED: Chromium unavailable');sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(x.read_text(encoding='utf-8') for x in css_files);bundle=BUNDLE.read_text(encoding='utf-8')
setup=r'''() => {
 const store={}; const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true}); Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'perf241-user',email:'perf241@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Performance Test'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true; window.alert=()=>{}; window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox']);page=b.new_page(viewport={'width':1600,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1300)
 page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__perf241__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__perf241__');}''');page.wait_for_timeout(60)
 prep=page.evaluate(r'''() => {const s=window.__mfState;if(!s?.categories?.length)return false;const before={libType:typeof s.library,arr:Array.isArray(s.library),same:window.__mfState===s};const cats=s.categories.slice(),statuses=['active','paused','completed','dropped','planned'],priorities=['high','medium','low'];const rows=[];for(let i=0;i<50000;i++){const c=cats[i%cats.length];rows.push({id:'p'+i,title:'Perf Title '+String(i).padStart(5,'0'),categoryId:String(c.id),status:statuses[i%5],priority:priorities[i%3],progress:i%20,total:i%9===0?null:24,rating:i%13===0?null:(i%10)+1,coverUrl:i%11===0?'':'https://example.com/'+i+'.jpg',createdAt:Date.now()-i});}s.library=rows;s.sessions=[];s.activityLog=[];s.histFilters={libSearch:'',libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libCover:'all',libSortBase:'title',libSortDir:'asc',libSort:'title-asc',category:'all',type:'all',range:'all',historyCategories:[]};s.settings.libraryPageSize=50;s.settings.libraryView='list';s.settings.v181Library=s.settings.v181Library||{};Object.assign(s.settings.v181Library,{mode:'classic',categoryOrder:cats.map(c=>String(c.id)),hiddenCategoryIds:[],activeCategoryId:String(cats[0].id),activeStatus:'active',statusOrder:['active','completed','paused','dropped','planned']});s.orderPlan=s.orderPlan||{titleIds:[],modifiedAt:1};s.orderPlan.titleIds=[];s.orderPlan.modifiedAt=1;s.orderPlannerUI={search:'',categories:[],status:'all',priority:'all',sort:'title-asc',page:0,picks:new Set()};return {n:rows.length,cat:String(cats[0].id),before,after:Array.isArray(s.library),same:window.__mfState===s,windowLen:window.__mfState?.library?.length};}''')
 if not prep:fails.append('prepare failed')
 # classic library render + category toggles
 t0=page.evaluate('performance.now()');page.evaluate("()=>App.setView('library')");page.wait_for_timeout(300);classic_render=page.evaluate('(t)=>performance.now()-t',t0)
 classic=page.evaluate(r'''() => {const ids=window.__mfState.categories.slice(0,5).map(c=>String(c.id)),times=[];for(const id of ids){let t=performance.now();App.v69ToggleLibraryCategory(id,true);times.push(performance.now()-t);}for(const id of ids){let t=performance.now();App.v69ToggleLibraryCategory(id,false);times.push(performance.now()-t);}return {max:Math.max(...times),avg:times.reduce((a,b)=>a+b,0)/times.length};}''')
 page.wait_for_timeout(250)
 # dynamic uses indexed bucket rather than full 50k scan
 page.evaluate("()=>{window.__mfState.settings.v181Library.mode='dynamic';App.setView('library')}");page.wait_for_timeout(250)
 dynamic=page.evaluate(r'''() => {const times=[];for(const s of ['active','completed','paused','dropped','planned','active']){const t=performance.now();App.v181SelectDynamicStatus(s);times.push(performance.now()-t);}return {max:Math.max(...times),avg:times.reduce((a,b)=>a+b,0)/times.length,rows:document.querySelectorAll('.item-row').length};}''')
 page.wait_for_timeout(200)
 # Dashboard queues: first pass may build one index, second render should reuse it.
 page.evaluate("()=>{window.__mfState.settings.v181Library.mode='classic';window.__mfState.sessionActive=false;window.__mfState.logging=false;}")
 t1=page.evaluate('performance.now()');page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(250);dash1=page.evaluate('(t)=>performance.now()-t',t1)
 t2=page.evaluate('performance.now()');page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(120);dash2=page.evaluate('(t)=>performance.now()-t',t2)
 # Personal Order repeated filtering/sorting should reuse result cache on identical state.
 page.evaluate("()=>App.setView('order')");page.wait_for_timeout(250)
 order=page.evaluate(r'''() => {const t1=performance.now();App.v140OrderSetFilter('status','active');const a=performance.now()-t1;const t2=performance.now();App.v140OrderSetFilter('status','active');const b=performance.now()-t2;return {first:a,second:b};}''')
 out={'prepared':prep,'classicRenderMs':classic_render,'classic':classic,'dynamic':dynamic,'dashboardFirstMs':dash1,'dashboardSecondMs':dash2,'order':order,'errors':errors};print(json.dumps(out,indent=2))
 if errors:fails.append('page errors '+repr(errors))
 if classic['max']>2500:fails.append('classic filter interaction too slow')
 if dynamic['max']>2500:fails.append('dynamic status interaction too slow')
 if dash2>3000:fails.append('dashboard cached render too slow')
 if order['second']>3000:fails.append('Personal Order cached refresh too slow')
 b.close()
if fails:
 print('v241 PERF FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v241 PERF OK')
