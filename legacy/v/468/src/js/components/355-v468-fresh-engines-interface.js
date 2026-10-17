/* v468 — source selection, Advanced checker workspace, diagnostics and
 * cloud-backed mode preferences. Legacy markup remains byte-for-byte intact
 * when Legacy is selected, aside from the new switch above it.
 */
const MF468_UI={query:'',filter:'all',sort:'fresh',page:1,perPage:24,timer:null};
function mf468ModePickerHtml(location='fresh'){
 const active=mf468System(),head=location==='settings'?
  '<div class="mf468-mode-title"><strong>Fresh Episodes System</strong><small>Both systems keep their own detection settings and results.</small></div>':'';
 return '<section class="mf468-engine-select" data-mf468-system="'+escapeHtml(location)+'">'+head+
  '<div class="mf468-engine-choices" role="radiogroup" aria-label="Fresh Episodes System">'+
  [['legacy','Legacy','Your existing Fresh Episodes system · unchanged'],
   ['advanced','Advanced','Alex Godly\'s Smart Fresh Episodes Engine 2.0']].map(([key,name,description])=>
    '<label class="mf468-engine-choice '+(active===key?'mf468-selected':'')+'">'+
    '<input type="radio" name="mf468-system-'+escapeHtml(location)+'" value="'+key+'" '+
    (active===key?'checked ':'')+'onchange="App.mf468SelectSystem(this.value)">'+
    '<span><strong>'+name+'</strong><small>'+escapeHtml(description)+'</small></span></label>').join('')+
  '</div><small class="mf468-mode-footnote">'+(active==='legacy'?
   'Legacy uses the existing algorithms, provider selection and saved verification ledger.':
   'Advanced uses separate verification data. Legacy results remain available if you switch back.')+
  '</small></section>';
}
function mf468AdvancedSettingsHtml(){
 const p=mf468AdvancedPrefs(),switcher=(key,label)=>
  '<label class="mf468-preference-switch"><input type="checkbox" '+
  (p[key]?'checked ':'')+'onchange="App.mf468SetAdvanced(&#39;'+key+'&#39;,this.checked)">'+
  '<span>'+escapeHtml(label)+'</span></label>';
 const options=(values,selected)=>values.map(([id,label])=>
  '<option value="'+id+'" '+(selected===id?'selected':'')+'>'+escapeHtml(label)+'</option>').join('');
 return '<section class="mf468-options" aria-label="Advanced Fresh Episodes settings">'+
  '<div class="mf468-options-head"><strong>Advanced Engine Configuration</strong>'+
  '<small>Independent from your Legacy provider settings.</small></div>'+
  '<div class="mf468-options-grid">'+
  '<label>Advanced detection method<select onchange="App.mf468SetAdvanced(&#39;source&#39;,this.value)">'+
  options([['smart','Smart Multi-Provider · compare verified evidence'],
   ['automatic','Automatic Multi-Provider · verified comparisons'],
   ['anilist','AniList only'],['tenrai','Tenrai only'],['anizip','AniZip only'],
   ['kitsu','Kitsu only'],['tvmaze','TVmaze only'],['manual','Manual · no automatic verification']],p.source)+
  '</select></label>'+
  '<label>Verification depth<select onchange="App.mf468SetAdvanced(&#39;verification&#39;,this.value)">'+
  options([['balanced','Balanced · fewer airing-schedule requests'],
   ['maximum','Maximum · verify additional airing schedules']],p.verification)+
  '</select></label>'+
  '<label>Background checking<select onchange="App.mf468SetAdvanced(&#39;refresh&#39;,this.value)">'+
  options([['manual','Manual checks only'],['adaptive','Adaptive while app is open']],p.refresh)+
  '</select></label></div>'+
  '<details class="mf468-provider-priority"><summary>Advanced provider priority (used for fallback and tie-breaking)</summary>'+
  '<div class="mf468-provider-priority-rows">'+p.providerOrder.map((name,index)=>
   '<div class="mf468-provider-priority-row"><span><b>'+(index+1)+'.</b> '+
   escapeHtml(V380_NAMES[name]||name)+'</span>'+
   '<div><button type="button" class="btn btn-sm btn-ghost" aria-label="Move '+
   escapeHtml(name)+' earlier" '+(index===0?'disabled ':'')+
   'onclick="App.mf468Reorder(&#39;'+name+'&#39;,-1)">↑</button>'+
   '<button type="button" class="btn btn-sm btn-ghost" aria-label="Move '+
   escapeHtml(name)+' later" '+(index===p.providerOrder.length-1?'disabled ':'')+
   'onclick="App.mf468Reorder(&#39;'+name+'&#39;,1)">↓</button></div></div>').join('')+
  '</div><small>Legacy provider order is never modified. Smart compares every applicable source; Automatic uses the selected fallback order.</small></details>'+
  switcher('schedules','Show upcoming episodes when a verified schedule is available')+
  switcher('compare','Show provider disagreement and evidence')+
  switcher('includeUnknown','Keep Unknown titles eligible for fresh-only recommendations')+
  '<small class="mf468-caution">Unknown results never mean 0 episodes. '
  +'Multiple saved seasons are displayed as title-level counts until independently verified season mappings are available. '
  +'Provider checks follow existing API rate limits and recovery locks.</small></section>';
}
function mf468ProviderSummary(entry){
 const rows=(entry?.providers||[]).slice(0,10);
 if(!rows.length)return '<small>No verified provider evidence saved.</small>';
 return rows.map(r=>'<div class="mf468-provider-evidence"><b>'+
  escapeHtml(V380_NAMES[r.source]||r.source)+'</b><span>'+
  escapeHtml(r.status==='verified'?r.available+' aired':
   r.status+(r.reason?' · '+r.reason:''))+'</span></div>').join('');
}
function mf468Next(entry){
 if(!entry?.nextAt||!entry?.nextEpisode||entry.nextAt<=Date.now())return '';
 const when=new Date(entry.nextAt).toLocaleString(),time=Math.max(0,entry.nextAt-Date.now()),
  days=Math.floor(time/86400000),hours=Math.floor(time%86400000/3600000);
 return '<small class="mf468-upcoming">Next episode '+escapeHtml(String(entry.nextEpisode))+
  ' · '+escapeHtml(when)+' · in '+days+'d '+hours+'h</small>';
}
function mf468AdvancedRows(){
 const all=mf468Candidates(),q=MF468_UI.query.trim().toLocaleLowerCase();
 const filtered=all.filter(item=>{
  if(q&&!String(item.title||'').toLocaleLowerCase().includes(q))return false;
  const status=mf468Outcome(item),entry=mf468Entry(item);
  switch(MF468_UI.filter){
   case 'fresh':return status==='fresh';case 'caught':return status==='none';
   case 'unknown':return status==='unknown';case 'disagreement':return !!entry?.disagreement;
   case 'scheduled':return !!entry?.nextAt&&entry.nextAt>Date.now();
   case 'missingids':return !v166GetMalId(item)&&!item.externalIds?.anilist&&!item.externalIds?.kitsu;
   default:return true;
  }
 });
 const priority=i=>({high:3,medium:2,low:1}[String(i.priority||'').toLowerCase()]||0);
 const aired=i=>Math.max(0,(mf468Entry(i)?.available||0)-mf468Progress(i));
 const upcoming=i=>mf468Entry(i)?.nextAt||Number.MAX_SAFE_INTEGER;
 if(MF468_UI.sort==='fresh')filtered.sort((a,b)=>aired(b)-aired(a));
 else if(MF468_UI.sort==='upcoming')filtered.sort((a,b)=>upcoming(a)-upcoming(b));
 else if(MF468_UI.sort==='oldest')filtered.sort((a,b)=>(mf468Entry(a)?.at||0)-(mf468Entry(b)?.at||0));
 else if(MF468_UI.sort==='priority')filtered.sort((a,b)=>priority(b)-priority(a)||aired(b)-aired(a));
 else filtered.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
 return filtered;
}
function mf468RowsHtml(){
 const rows=mf468AdvancedRows(),pages=Math.max(1,Math.ceil(rows.length/MF468_UI.perPage));
 MF468_UI.page=Math.max(1,Math.min(pages,MF468_UI.page));
 const visible=rows.slice((MF468_UI.page-1)*MF468_UI.perPage,MF468_UI.page*MF468_UI.perPage);
 const cards=visible.map(item=>{
  const entry=mf468Entry(item),status=mf468Outcome(item),fresh=entry?
   Math.max(0,entry.available-mf468Progress(item)):null;
  const label=status==='fresh'?fresh+' fresh episodes':
   status==='none'?'Caught up':'Awaiting verification';
  const id=escapeHtml(JSON.stringify(String(item.id)));
  const summary=entry?entry.available+' verified aired · '+mf468Progress(item)+' logged':'No reliable current release count';
  const confidence=entry?.confidence||'unknown';
  return '<article class="mf468-title-card" data-mf468-title="'+escapeHtml(String(item.id))+'">'+
   '<div class="mf468-title-card-head"><strong>'+escapeHtml(item.title||'Untitled')+'</strong>'+
   '<span class="mf468-status mf468-'+status+'">'+escapeHtml(label)+'</span></div>'+
   '<small>'+escapeHtml(getCategory(item.categoryId)?.name||'Category')+' · '+
   escapeHtml(summary)+'</small>'+
   '<div class="mf468-card-meta"><span>Evidence: '+escapeHtml(confidence)+
   '</span><span>Last checked: '+(entry?escapeHtml(new Date(entry.at).toLocaleString()):'Never')+'</span></div>'+
   mf468Next(entry)+
   '<details class="mf468-evidence"><summary>Provider verification and season details</summary>'+
   '<small>'+escapeHtml(entry?.seasonEvidence||'No verified season mapping available.')+'</small>'+
   mf468ProviderSummary(entry)+'</details>'+
   '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf468RefreshOne('+id+')"'+
   (MF468_RUNTIME.working?' disabled':'')+'>Refresh this title</button></article>';
 }).join('');
 return '<div class="mf468-table-info">'+rows.length.toLocaleString()+' matching titles · page '+
  MF468_UI.page+' of '+pages+'</div>'+
  '<div class="mf468-cards">'+(cards||'<div class="mf468-empty">No titles match these filters.</div>')+'</div>'+
  '<div class="mf468-pagination"><button class="btn btn-sm" onclick="App.mf468Page(-1)" '+
   (MF468_UI.page===1?'disabled':'')+'>Previous</button><span>'+MF468_UI.page+' / '+pages+
   '</span><button class="btn btn-sm" onclick="App.mf468Page(1)" '+
   (MF468_UI.page===pages?'disabled':'')+'>Next</button></div>';
}
function mf468AdvancedWorkspaceHtml(){
 const counts=mf468Counts(),run=MF468_RUNTIME,progress=run.total?
  Math.round(run.checked/run.total*100):0;
 const tile=(n,label)=>'<div class="mf468-summary-stat"><strong>'+n.toLocaleString()+
  '</strong><small>'+escapeHtml(label)+'</small></div>';
 return '<section class="mf468-workspace" aria-label="Advanced Fresh Episodes Checker">'+
  '<div class="mf468-workspace-head"><div><small>SMART ENGINE 2.0</small>'+
  '<h3>Advanced Fresh Episodes Checker</h3><p>Verified releases, provider evidence, schedules, and title-by-title diagnostics.</p></div>'+
  '<div class="mf468-workspace-actions"><button type="button" class="btn btn-primary" '+
  (run.working||mf468AdvancedPrefs().source==='manual'?'disabled ':'')+
  'onclick="App.mf468RefreshAll()">Check Fresh Episodes</button>'+
  (run.working?'<button type="button" class="btn" onclick="App.mf468Stop()">Stop after current title</button>':'')+
  '</div></div>'+
  v401FilterControl('checker')+
  '<div class="mf468-overview">'+tile(counts.freshTitles,'Verified fresh titles')+
   tile(counts.freshEpisodes,'Fresh episodes remaining')+tile(counts.caughtUp,'Verified caught up')+
   tile(counts.unknown,'Unknown')+tile(counts.conflicts,'Provider disagreements')+
   tile(counts.scheduled,'Upcoming verified schedules')+'</div>'+
  '<div class="mf468-scan-progress" role="status" aria-live="polite">'+
   (run.working?'Checking '+run.checked+' / '+run.total+' titles · '+progress+'%'+(run.stopping?' · stopping safely':''):
    'Advanced results are separate from Legacy. Last check: '+
    (S.settings?.v468AdvancedLastCheck?.at?
      new Date(S.settings.v468AdvancedLastCheck.at).toLocaleString():'Never'))+
   '</div>'+
  '<div class="mf468-tools"><input id="mf468-search" type="search" placeholder="Search fresh episode titles" '+
   'value="'+escapeHtml(MF468_UI.query)+'" oninput="App.mf468Search(this.value)" aria-label="Search titles">'+
   '<label>Filter <select onchange="App.mf468Filter(this.value)">'+
   [['all','All'],['fresh','Fresh available'],['caught','Caught up'],['unknown','Unknown'],
    ['disagreement','Provider disagreements'],['scheduled','Upcoming'],
    ['missingids','Missing verified External IDs']].map(([id,name])=>
      '<option value="'+id+'" '+(MF468_UI.filter===id?'selected':'')+'>'+name+'</option>').join('')+
   '</select></label><label>Sort <select onchange="App.mf468Sort(this.value)">'+
   [['fresh','Most fresh episodes'],['upcoming','Next release'],
    ['oldest','Oldest verification'],['priority','Highest priority'],['alpha','Alphabetical']].map(([id,name])=>
      '<option value="'+id+'" '+(MF468_UI.sort===id?'selected':'')+'>'+name+'</option>').join('')+
   '</select></label></div>'+
  '<div id="mf468-list">'+mf468RowsHtml()+'</div>'+
  '<div class="mf468-workspace-note">Unknown is never zero. Verified provider identity and release dates are required. '+
  'Airing schedules and per-season information appear only when actual supporting evidence exists.</div>'+
  '</section>';
}
function mf468UpdateDashboard(){
 const list=document.getElementById('mf468-list');
 if(list)list.innerHTML=mf468RowsHtml();
 const progress=document.querySelector('.mf468-scan-progress');
 if(progress&&MF468_RUNTIME.working)progress.textContent='Checking '+
  MF468_RUNTIME.checked+' / '+MF468_RUNTIME.total+
  ' · '+(MF468_RUNTIME.total?Math.round(MF468_RUNTIME.checked/MF468_RUNTIME.total*100):0)+'%';
}
App.mf468Search=function(q){
 MF468_UI.query=String(q||'');MF468_UI.page=1;
 clearTimeout(MF468_UI.timer);MF468_UI.timer=setTimeout(mf468UpdateDashboard,180);
};
App.mf468Filter=function(value){MF468_UI.filter=value;MF468_UI.page=1;mf468UpdateDashboard();};
App.mf468Sort=function(value){MF468_UI.sort=value;MF468_UI.page=1;mf468UpdateDashboard();};
App.mf468Page=function(direction){MF468_UI.page+=direction;mf468UpdateDashboard();};
App.mf468RefreshAll=async function(){
 const result=await mf468Scan({force:true,notify:true});
 if(!result.ok)showToast(result.reason||result.error||'Advanced scan could not start');
};
App.mf468RefreshOne=async function(id){
 const result=await mf468Scan({ids:[id],force:true,notify:true});
 if(!result.ok)showToast(result.reason||result.error||'Title refresh unavailable');
};
App.mf468Reorder=async function(name,delta){
 if(!mf468Active()||MF468_RUNTIME.working)return;
 const current=mf468AdvancedPrefs(),old=S.settings.v468AdvancedFresh,
  list=current.providerOrder.slice(),idx=list.indexOf(String(name)),j=idx+Number(delta);
 if(idx<0||j<0||j>=list.length)return;
 [list[idx],list[j]]=[list[j],list[idx]];
 current.providerOrder=list;S.settings.v468AdvancedFresh=current;
 try{await persistSettings();}
 catch(e){S.settings.v468AdvancedFresh=old;showToast('Unable to save provider order.');}
 render();
};
App.mf468Stop=mf468RequestStop;
async function mf468SetSystem(mode){
 if(!MF468_SYSTEMS.includes(mode)||mode===mf468System())return;
 if(MF468_RUNTIME.working||V166_SEASONAL_SYNC_RUNNING||
  typeof MF442!=='undefined'&&MF442.process){
  showToast('Finish the current recovery or stop the Advanced scan before switching engines.');
  render();return;
 }
 const old=mf468System(),settings=S.settings||(S.settings={});
 settings.v468FreshEpisodesSystem=mode;
 try{await persistSettings();}
 catch(e){settings.v468FreshEpisodesSystem=old;showToast('Could not sync Fresh Episodes system preference.');}
 render();
}
async function mf468SetAdvanced(key,value){
 if(MF468_RUNTIME.working){showToast('Wait for the Advanced scan to finish before changing settings.');return;}
 const keys=['source','verification','refresh','schedules','compare','includeUnknown'];
 if(!keys.includes(key))return;
 const current=mf468AdvancedPrefs(),old=S.settings.v468AdvancedFresh;
 if(key==='source'){if(!MF468_SOURCES.includes(value))return;current.source=value;}
 else if(key==='verification'){current.verification=value==='maximum'?'maximum':'balanced';}
 else if(key==='refresh'){current.refresh=value==='adaptive'?'adaptive':'manual';}
 else current[key]=Boolean(value);
 S.settings.v468AdvancedFresh=current;
 try{await persistSettings();}
 catch(e){S.settings.v468AdvancedFresh=old;showToast('Unable to synchronize Advanced settings.');}
 render();
}
const mf468OldFreshToggle=App.v401ToggleFreshRecommendations;
App.v401ToggleFreshRecommendations=async function(){
 if(!mf468Active())return mf468OldFreshToggle.apply(this,arguments);
 if(!mf468AutoEnabled()){showToast('Choose an automatic Advanced source to enable fresh-only recommendations.');return;}
 const current=mf468AdvancedPrefs();
 const previous=S.settings.v468AdvancedFresh;
 current.freshOnly=!current.freshOnly;
 S.settings.v468AdvancedFresh=current;
 try{await persistSettings();}
 catch(e){S.settings.v468AdvancedFresh=previous;showToast('Unable to save the Advanced Fresh Episodes filter.');}
 render();
};
App.mf468SelectSystem=mf468SetSystem;
App.mf468SetAdvanced=mf468SetAdvanced;
// Fresh Episodes area: Legacy markup and controls remain untouched in Legacy,
// including the exact source selection, fresh-only toggle and diagnostics.
const mf468SeasonalBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
 return mf468ModePickerHtml('fresh')+
  (mf468Active()?mf468AdvancedSettingsHtml()+mf468AdvancedWorkspaceHtml():
   mf468SeasonalBase.apply(this,arguments));
};
// Settings Title Recommendations also exposes the system selection. The mode
// itself is saved once in existing cloud-backed Settings.
const mf468SettingsBase=V219_PAGE_RENDERERS.get('settings');
if(typeof mf468SettingsBase==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
 const html=String(mf468SettingsBase.call(this,ctx)||'');
 if(!html.includes('mf404-recommendations-card'))return html;
 const root=document.createElement('div');root.innerHTML=html;
 const card=root.querySelector('.mf404-recommendations-card');
 if(!card||card.querySelector('[data-mf468-system="settings"]'))return html;
 card.insertAdjacentHTML('beforeend',mf468ModePickerHtml('settings'));
 return root.innerHTML;
});
if(typeof v366RegisterSetting==='function'){
 v366RegisterSetting({id:'v468FreshEpisodesSystem',section:'title-recommendations',
  selector:'[data-mf468-system="settings"]',label:'Legacy or Advanced Fresh Episodes system',
  subgroup:'Title Recommendations',keywords:['legacy','advanced','fresh','episode','engine','switch']});
}
MF468_RUNTIME.nextTimer=setInterval(()=>{
 if(!mf468Active()||MF468_RUNTIME.working||
  mf468AdvancedPrefs().refresh!=='adaptive'||mf468AdvancedPrefs().source==='manual')return;
 const recent=S.settings?.v468AdvancedLastCheck?.at||0;
 if(Date.now()-Number(recent)<6*60*60*1000)return;
 void mf468Scan({force:false,notify:false});
},6*60*1000);
window.MediaFlowV468Interface=Object.freeze({version:468,picker:mf468ModePickerHtml,
 settings:mf468AdvancedSettingsHtml,workspace:mf468AdvancedWorkspaceHtml,
 select:mf468SetSystem,configure:mf468SetAdvanced,list:mf468RowsHtml});
