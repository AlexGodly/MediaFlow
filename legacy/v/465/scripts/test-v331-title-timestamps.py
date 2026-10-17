#!/usr/bin/env python3
"""Exercise the actual v331 bundle's Dashboard and Batch Log flows in Chromium.
This uses a disposable in-memory state; no network or Supabase credentials.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
bundle=(R/'assets/js/mediaflow-v331.bundle.js').read_text()
assert bundle.endswith('})();\n')
bundle=bundle[:-6]+'''window.__v331test={S,App,v331LogicalSessionCount,v331HistoryTime,v331BatchTitleTimestamp,v331EventDate,v331ValidTimestamp,renderLogForm,renderBatchLog,v272LogTitleRailHtml,setup(){
  render=function(){};
  persistLibrary=function(){};persistSessions=function(){};persistTask=function(){};
  calculateConsumptionXP=function(){return {xp:1}};
  estimateCurrentLogXP=function(){return {xp:1,base:1,multiplier:1,streak:0,streakMultiplier:1,label:'fixture'}};
  categoryStatus=function(){return {status:'healthy'}};
  generateTask=function(){return {categoryId:'anime',targetMid:1,unit:'episodes'}};
  v165ApplyRespectReward=function(){};
  S.library=[{id:'anime1',title:'Anime A',categoryId:'anime',status:'active',priority:'medium',progress:0,total:24},
    {id:'manga1',title:'Manga B',categoryId:'manga',status:'active',priority:'medium',progress:0,total:90}];
  S.categories=[{id:'anime',name:'Anime',unit:'episodes',enabled:true,minutesPerUnit:22,weight:1},
    {id:'manga',name:'Manga',unit:'chapters',enabled:true,minutesPerUnit:5,weight:1}];
  S.sessions=[]; S.settings=S.settings||{};
  S.sessionActive=true;S.currentTask={categoryId:'anime',targetMid:1,unit:'episodes',low:1,high:1};
  S.logDraft={categoryId:'anime',amount:2,minutes:30,note:'',entries:[],updateLibrary:true,v179Mode:'amount'};
  S.entryDraft={title:'',qty:1,libraryId:null}; S.view='dashboard';S.logging=true;
  S.batchDraft={rows:[],note:'',date:todayISO(),v179Mode:'amount'};
}};})();
'''
assert 'window.__v331test' in bundle
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 page=browser.new_page()
 page.add_init_script("Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});")
 page.set_content('<!DOCTYPE html><html><head></head><body><div id="app"></div><div id="view-root"></div></body></html>')
 page.evaluate("Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});")
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.add_script_tag(content=bundle)
 result=page.evaluate('''() => {
  const t=window.__v331test;if(!t)throw Error('test API missing');t.setup();
  const start=Date.now();const base=Date.now;
  Date.now=()=>start;
  const a=t.S.library[0],b=t.S.library[1];
  t.S.entryDraft={title:a.title,qty:1,libraryId:a.id};t.App.addLogEntry();
  const time1=t.S.logDraft.entries[0]?.loggedAt; if(!t.S.logDraft.entries.length)throw Error('first title not added '+JSON.stringify({entry:t.S.entryDraft,log:t.S.logDraft,mode:t.S.settings.v179LoggingModes}));
  Date.now=()=>start+22*60000;
  t.S.entryDraft={title:b.title,qty:2,libraryId:b.id};t.App.addLogEntry();
  const time2=t.S.logDraft.entries[1]?.loggedAt;
  // Editing quantity must never touch the captured moment.
  t.S.logDraft.entries[0].qty=3;
  const cards=renderProbe(t.S.logDraft.entries);
  let logMarkup='';try{logMarkup=t.renderLogForm(t.S.currentTask,t.S.categories[0])}catch(e){logMarkup='ERROR: '+e.message}

  Date.now=()=>start+28*60000;
  try{t.App.submitLog();}catch(e){throw Error('dashboard commit: '+e.stack)}
  const saved=t.S.sessions.filter(s=>s.sessionGroupId);
  const logical=t.v331LogicalSessionCount(saved);
  const savedRows=saved.flatMap(x=>x.titles||[]);
  let logsMarkup='';try{logsMarkup=saved.map(x=>t.v272LogTitleRailHtml(x)).join('')}catch(e){logsMarkup='ERROR: '+e.message}
  const displayedTimes=savedRows.map(row=>t.v331HistoryTime({timestamp:start+28*60000},row));
  const dashboard={time1,time2,start,savedRows,logical,cards,logMarkup,logsMarkup,displayedTimes,sessionCount:saved.length};
  // Batch titles capture timestamp on selection, not on blank row creation.
  t.S.sessions=[];
  t.S.batchDraft={rows:[],note:'',date:new Date().toISOString().slice(0,10),v179Mode:'amount'};
  Date.now=()=>start+60*60000;
  t.App.addBatchRow();
  const empty=t.S.batchDraft.rows[0]?.loggedAt||null;
  t.App.selectBatchTitle(0,'anime1');
  const batchA=t.S.batchDraft.rows[0]?.loggedAt;
  Date.now=()=>start+75*60000;
  t.App.addBatchRow();t.App.selectBatchTitle(1,'manga1');
  const batchB=t.S.batchDraft.rows[1]?.loggedAt;
  t.S.batchDraft.v331DateOverride=true;
  t.S.batchDraft.date='2025-04-08';
  let batchMarkup='';try{batchMarkup=t.renderBatchLog()}catch(e){batchMarkup='ERROR: '+e.message}
  Date.now=()=>start+95*60000;
  try{t.App.submitBatchLog();}catch(e){throw Error('batch commit: '+e.stack)}
  const batches=t.S.sessions.filter(s=>s.batchGroupId);
  const batchRows=batches.flatMap(s=>s.titles||[]);
  Date.now=base;
  return {dashboard,empty,batchA,batchB,batchRows,batchMarkup,logicalBatch:t.v331LogicalSessionCount(batches),
    oldLabel:t.v331HistoryTime({timestamp:start},{}),explicitLabel:t.v331HistoryTime({timestamp:start},{loggedAt:time1}),
    v331DateFromOld:t.v331EventDate({timestamp:start,date:'2025-01-03'},{}).getFullYear()};
  function renderProbe(entries){return entries.map(x=>String(x.loggedAt)).join(',')}
}''')
 d=result['dashboard']; assert d['time1']==d['start'],d
 assert d['time2']==d['start']+22*60000,d
 assert d['logMarkup'].count('mf331-added-at')==2,d['logMarkup'][:450]
 assert len(set(d['displayedTimes']))==2,d['displayedTimes']
 assert d['logsMarkup'].count('mf331-row-time')==2,d['logsMarkup'][:450]
 assert d['logical']==1,d
 assert len(d['savedRows'])==2 and d['sessionCount']>=1,d
 assert [x['loggedAt'] for x in d['savedRows']]==[d['time1'],d['time2']],d
 assert result['empty'] is None,result
 assert result['batchA']==d['start']+60*60000,result
 assert result['batchB']==d['start']+75*60000,result
 assert len(result['batchRows'])==2,result
 assert result['batchMarkup'].count('mf331-batch-added')==2,result['batchMarkup'][-500:]
 assert result['logicalBatch']==1,result
 assert len(set(x['loggedAt'] for x in result['batchRows']))==2,result
 assert all(__import__('datetime').datetime.fromtimestamp(x['loggedAt']/1000).date().isoformat()=='2025-04-08' for x in result['batchRows']),result
 assert result['v331DateFromOld']==2025,result
 assert not errors,errors[:5]
 print('PASS Dashboard captures two distinct add moments, renders both labels, persists both rows, and counts one logical session')
 print('PASS Batch Log timestamps at selection (not blank row), displays both labels, overrides day and retains individual clock times')
 print('PASS original History without per-title stamps uses the old session date')
 print('PASS no page JS errors')
 browser.close()
