#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v242 PERF FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1];BUNDLE=ROOT/'assets/js/mediaflow-v242.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:print('v242 PERF FAILED: Chromium unavailable');sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(x.read_text(encoding='utf-8') for x in css_files);bundle=BUNDLE.read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fake={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>{},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fake,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fake,configurable:true});
 const user={id:'perf',email:'perf@example.com',created_at:new Date().toISOString(),user_metadata:{}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}})},from:db}}};window.confirm=()=>true;window.alert=()=>{};
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(800)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__perf242__',({state})=>{window.__s=state;return '<div>perf</div>';});App.setView('__perf242__');const s=window.__s,c=s.categories[0];s.library=Array.from({length:50000},(_,i)=>({id:'t'+i,title:(i%100===0?'Naruto Special ':'Series ')+String(i).padStart(5,'0'),categoryId:c.id,status:i%5===0?'completed':'active',priority:i%3===0?'high':i%3===1?'medium':'low',progress:i%24,total:24,rating:i%11,coverUrl:''}));}''')
    stats=page.evaluate(r'''() => {const one=(q)=>{const a=performance.now(),r=App.v242LogTitleCandidates(q),b=performance.now();return {ms:b-a,n:r.length}};const cold=one('nar');const warm=one('naru');const exact=one('naruto');const cached=one('naruto');return {cold,warm,exact,cached,indexSize:App.v242EnsureLoggingIndex().titleLower.size};}''')
    runtime=page.evaluate('()=>MediaFlowRuntime.version');b.close()
if errors:fails.extend(errors)
if runtime!=242:fails.append(f'runtime {runtime}')
if stats['indexSize']!=50000:fails.append(f'logging index incomplete: {stats}')
if stats['cached']['ms']>15:fails.append(f'cached logging search too slow: {stats}')
if stats['warm']['ms']>stats['cold']['ms']*1.5+20:fails.append(f'prefix narrowing regressed: {stats}')
print(json.dumps({'runtime':runtime,'stats':stats,'pageErrors':errors},indent=2))
if fails:
    print('v242 PERF FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v242 PERF OK')
