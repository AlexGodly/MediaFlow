#!/usr/bin/env python3
"""Chromium synthetic performance comparison, same fixture on v407 vs v408.
Not equivalent to authenticated full UI or physical-device performance."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import zipfile,json,time
root=Path(__file__).resolve().parents[1]
base=root.parent/'MediaFlow_v407_Modular.zip'
with zipfile.ZipFile(base) as f:
    prior=f.read('assets/js/mediaflow-v407.bundle.js').decode('utf8')
current=(root/'assets/js/mediaflow-v408.bundle.js').read_text()
bridge='''
window.__PERF408__={
 setup(N,M){
  S.categories=[{id:'a',name:'Anime',unit:'episodes',color:'#f60',target:1},{id:'b',name:'Books',unit:'chapters',color:'#a6f',target:1}];
  S.library=Array.from({length:N},(_,i)=>({id:'t'+i,title:'Title '+String(i).padStart(6,'0'),categoryId:i%2?'b':'a',status:'active',priority:'medium',progress:0,total:12,createdAt:Date.now()-i*1000,manualRepeatAmount:0}));
  S.sessions=Array.from({length:M},(_,i)=>({id:'s'+i,timestamp:Date.now()-i*10000,categoryId:'a',minutes:30,titles:[{title:'Title '+i,libraryId:'t'+((i*17)%N),repeat:true,qty:2}]}));
  S.histFilters={libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'};
  S.view='library';S.libPage=0;S.librarySelection={};
  S.logDraft={entries:[]};S.entryDraft={title:''};
  v53InvalidateLibraryCache();v53InvalidateSessionCache();
 },
 run(N,M){
  this.setup(N,M);
  const time=(action)=>{let t=performance.now(),result=action();return {ms:Math.round((performance.now()-t)*10)/10,result};};
  const rep=time(()=>{let r;for(let i=0;i<10;i++)r=v81RepeatTotals();return {sessions:r.sessions,episodes:r.episodes,entries:r.byTitle.size};});
  const lib=time(()=>renderLibrary().length);
  const log=time(()=>{const a=logTitleCandidates('');const b=logTitleCandidates('');return {length:a.length,same:a===b,first:a[0]?.id};});
  return {N,M,repeat:rep,library:lib,logging:log,audit:window.MediaFlowV408?.audit?.()||null};
 }
};
'''
html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="app"></div></body></html>'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    results=[]
    for version,script in [(407,prior),(408,current)]:
        page=browser.new_page(viewport={'width':1280,'height':900})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html)
        page.evaluate('''(()=>{let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}})})()''')
        assert script.rstrip().endswith('})();')
        page.add_script_tag(content=script.rstrip()[:-len('})();')]+bridge+'\n})();\n')
        result=page.evaluate('__PERF408__.run(30000,1200)')
        assert not errors,(version,errors)
        print('v'+str(version),json.dumps(result,ensure_ascii=False))
        results.append(result)
        page.close()
    assert results[0]['repeat']['result']==results[1]['repeat']['result'],'repeat totals regression'
    assert results[0]['logging']['result']['length']==results[1]['logging']['result']['length'],'logging candidates regression'
    page=browser.new_page()
    page.set_content(html)
    page.evaluate('''(()=>{let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}})})()''')
    page.add_script_tag(content=current.rstrip()[:-len('})();')]+bridge+'\n})();\n')
    result=page.evaluate('__PERF408__.run(100000,2000)')
    print('v408 100k',json.dumps(result,ensure_ascii=False))
    page.close()
    browser.close()
print('v408 source performance and parity checks PASSED')
