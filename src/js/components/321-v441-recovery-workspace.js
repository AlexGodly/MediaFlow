/* MediaFlow v441 — Recovery Workspace & Background Processes.
 * This is presentation/orchestration only. v424 and v439 remain the owners
 * of job checkpoints, verified candidates, cloud saves and provider access.
 */
const MF441_VERSION=441;
const MF441_DEFAULT={visibility:'auto',position:'right',expanded:false,showFinished:false};
const MF441={opening:false,previewFilter:'all',lastFocused:null};
const mf441Esc=v=>mf424Escape(String(v??''));
function mf441Prefs(){
 const current=S.settings?.v441RecoveryUI||{};
 return {...MF441_DEFAULT,...current,
  visibility:['auto','always','hidden'].includes(current.visibility)?current.visibility:'auto',
  position:['left','right'].includes(current.position)?current.position:'right',
  expanded:Boolean(current.expanded),showFinished:Boolean(current.showFinished)};
}
function mf441State(){
 const cover=MF424?.job||null,metadata=MF439?.job||mf439ReadJob()||null;
 const coverActive=!!cover&&!['complete','stopped'].includes(cover.status);
 const metadataActive=!!metadata&&!['completed'].includes(metadata.status);
 const coverPct=cover?.ids?.length?Math.min(100,Math.max(0,Math.floor((cover.cursor||0)/cover.ids.length*100))):0;
 const metaPct=metadata?.ids?.length?Math.min(100,Math.max(0,Math.floor((metadata.cursor||0)/metadata.ids.length*100))):0;
 return {cover,metadata,coverActive,metadataActive,coverPct,metaPct,
  activeCount:Number(coverActive)+Number(metadataActive)};
}
function mf441Show(prefs,state){
 if(prefs.visibility==='hidden')return false;
 if(prefs.visibility==='always')return true;
 return Boolean(state.coverActive||state.metadataActive||
  prefs.showFinished&&(state.cover||state.metadata));
}
function mf441CoverRow(s){
 const j=s.cover,status=j?.status||'idle',pct=s.coverPct;
 const running=Boolean(j&&['running','cooldown','ready'].includes(status));
 const suspended=Boolean(j&&['paused','waiting-part','other-tab','stopped'].includes(status));
 return '<article class="mf441-process" data-mf441-process="cover">'+
  '<div class="mf441-process-heading"><span class="mf441-process-icon">'+mf425Icon('images',18)+'</span>'+
  '<div><strong>Cover Recovery</strong><small>'+mf441Esc(j?mf424StatusText(status):'No active job')+'</small></div>'+
  '<b class="mf441-process-number">'+pct+'%</b></div>'+
  '<div class="mf441-track" role="progressbar" aria-label="Cover Recovery progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><span style="width:'+pct+'%"></span></div>'+
  '<div class="mf441-process-stats">'+(j?(j.cursor||0).toLocaleString()+' / '+j.ids.length.toLocaleString()+' titles · '+(j.fixed||0)+' recovered'+
   (j.pending?' · '+j.pending+' awaiting review':''):'Ready to find missing covers')+'</div>'+
  '<div class="mf441-process-actions"><button type="button" onclick="App.mf441OpenCover()">'+mf425Icon('settings',15)+' Setup</button>'+
  (running?'<button type="button" onclick="App.mf424Pause()">'+mf425Icon('pause',15)+' Pause</button>':'')+
  (suspended?'<button type="button" onclick="App.mf424Resume()">'+mf425Icon('play',15)+' Resume</button>':'')+
  (j?.pending?'<button type="button" onclick="App.mf424Review()">'+mf425Icon('search',15)+' Review ('+j.pending+')</button>':'')+
  '</div></article>';
}
function mf441MetadataRow(s){
 const j=s.metadata,pct=s.metaPct,status=j?.status||'idle';
 const active=Boolean(j&&status==='running'&&MF439.working),paused=Boolean(j&&['paused','running'].includes(status)&&!MF439.working);
 return '<article class="mf441-process" data-mf441-process="metadata">'+
  '<div class="mf441-process-heading"><span class="mf441-process-icon">'+mf425Icon('database',18)+'</span>'+
  '<div><strong>Metadata Recovery</strong><small>'+mf441Esc(j?active?'Recovering missing fields':status==='paused'?'Paused · checkpoint preserved':status==='completed'?'Recovery complete':status:'No active job')+'</small></div>'+
  '<b class="mf441-process-number">'+pct+'%</b></div>'+
  '<div class="mf441-track" role="progressbar" aria-label="Metadata Recovery progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><span style="width:'+pct+'%"></span></div>'+
  '<div class="mf441-process-stats">'+(j?(j.cursor||0).toLocaleString()+' / '+j.ids.length.toLocaleString()+
   ' titles · '+(j.changed||0)+' missing fields recovered'+(j.errors?.length?' · '+j.errors.length+' warnings':''):
   'Select Library titles to preview or recover')+'</div>'+
  '<div class="mf441-process-actions"><button type="button" onclick="App.mf441OpenMetadata()">'+mf425Icon('search',15)+' New Recovery</button>'+
  (active?'<button type="button" onclick="App.mf439Pause()">'+mf425Icon('pause',15)+' Pause after title</button>':'')+
  (paused?'<button type="button" onclick="App.mf439Resume()">'+mf425Icon('play',15)+' Resume</button>':'')+
  '</div></article>';
}
function mf441WidgetHtml(prefs,state){
 const expanded=prefs.expanded;
 return '<aside class="mf441-widget mf441-position-'+prefs.position+(expanded?' mf441-expanded':'')+
  '" id="mf441-process-widget" aria-label="MediaFlow background recovery processes">'+
  '<button type="button" class="mf441-widget-toggle" onclick="App.mf441Toggle()" aria-expanded="'+expanded+'" aria-controls="mf441-process-content">'+
  '<span class="mf441-widget-symbol">'+mf425Icon('layers',18)+'</span>'+
  '<span class="mf441-widget-name"><strong>Background Processes</strong><small>'+
  (state.activeCount?state.activeCount+' active recovery process'+(state.activeCount===1?'':'es'):'Cover & metadata recovery')+'</small></span>'+
  '<span class="mf441-widget-percent">'+Math.max(state.coverPct,state.metaPct)+'%</span>'+
  mf425Icon(expanded?'chevronDown':'chevronUp',15)+'</button>'+
  '<div class="mf441-widget-content" id="mf441-process-content" '+(expanded?'':'hidden')+'>'+
  mf441CoverRow(state)+mf441MetadataRow(state)+
  '<div class="mf441-widget-foot"><button type="button" onclick="App.mf441Settings()">'+mf425Icon('settings',15)+' Recovery Settings</button>'+
  '<button type="button" onclick="App.mf441Hide()">'+mf425Icon('x',15)+' Hide widget</button></div></div></aside>';
}
function mf441Paint(){
 if(!document.body)return;
 const prefs=mf441Prefs(),state=mf441State(),visible=mf441Show(prefs,state);
 // A single combined widget replaces the previous cover-only floating
 // indicator when shown; the original v424 indicator remains intact.
 document.body.classList.toggle('mf441-recovery-widget-active',visible);
 const old=document.getElementById('mf441-process-widget');
 if(!visible){old?.remove();mf441RefreshSettingsStatus(state);return;}
 const markup=mf441WidgetHtml(prefs,state);
 if(old){
  // Avoid shifting keyboard focus when progress advances.
  const active=document.activeElement;
  const focusKey=active?.closest?.('#mf441-process-widget')&&active?.getAttribute('onclick');
  const slot=document.createElement('div');slot.innerHTML=markup;
  old.replaceWith(slot.firstElementChild);
  if(focusKey){const target=[...document.querySelectorAll('#mf441-process-widget button')].find(b=>b.getAttribute('onclick')===focusKey);
   target?.focus?.({preventScroll:true});}
 }else document.body.insertAdjacentHTML('beforeend',markup);
 mf441RefreshSettingsStatus(state);
}
function mf441Toggle(){
 S.settings=S.settings||{};
 S.settings.v441RecoveryUI={...mf441Prefs(),expanded:!mf441Prefs().expanded};
 mf441Paint();mf441Persist();
}
function mf441Hide(){
 S.settings=S.settings||{};
 S.settings.v441RecoveryUI={...mf441Prefs(),visibility:'hidden',expanded:false};
 mf441Paint();mf441Persist();
 showToast('Background Processes widget hidden. You can restore it in Recovery Workspace settings.');
}
function mf441SaveSetting(key,value){
 if(!['visibility','position','expanded','showFinished'].includes(key))return;
 const p={...mf441Prefs(),[key]:value};
 S.settings=S.settings||{};S.settings.v441RecoveryUI=p;
 mf441Paint();mf441Persist();
}
function mf441Persist(){
 Promise.resolve(saveState()).catch(e=>console.warn('Recovery workspace setting save failed:',e));
}
function mf441OpenCover(){
 if(!AUTH_USER||!MF424.ready){showToast('Sign in and wait for Cover Recovery storage to initialize.');return;}
 if(typeof App.mf425OpenConfig==='function')App.mf425OpenConfig('floating');
 else App.mf424OpenConfig?.();
}
function mf441OpenMetadata(){
 // No metadata provider call is issued by opening this setup surface.
 const selected=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds().length:0;
 const existing=document.getElementById('mf441-start-dialog');existing?.remove();
 const root=document.createElement('div');root.id='mf441-start-dialog';root.className='mf424-modal mf441-start-overlay mf425-themed';
 root.innerHTML='<div class="mf424-shade" data-mf441-close="1"></div>'+
 '<section class="mf424-dialog mf441-start-dialog" role="dialog" aria-modal="true" aria-labelledby="mf441-start-title">'+
 '<header class="mf441-start-head"><span>'+mf425Icon('database',21)+'</span><div><small>NEW METADATA RECOVERY</small><h2 id="mf441-start-title">Choose a recovery action</h2></div>'+
 '<button class="btn btn-ghost" type="button" onclick="App.mf441CloseStart()" aria-label="Close Metadata Recovery">'+mf425Icon('x',18)+'</button></header>'+
 '<div class="mf441-start-body">'+
 '<p>MediaFlow combines matching metadata from multiple APIs, fills missing fields only, and protects existing values. Review changes before saving.</p>'+
 '<div class="mf441-scope"><strong>'+selected.toLocaleString()+' Library titles selected</strong><small>'+
  (selected?'Selected checkboxes will define the recovery scope.':'Select titles in Library for a targeted recovery.')+'</small></div>'+
 '<div class="mf441-start-options">'+
 '<button type="button" '+(selected===1?'':'disabled')+' onclick="App.mf441StartPreview()">'+mf425Icon('search',21)+
  '<span><strong>Preview one title</strong><small>Compare fields and provider evidence before saving</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" '+(selected?'':'disabled')+' onclick="App.mf441StartBatch()">'+mf425Icon('layers',21)+
  '<span><strong>Recover selected titles</strong><small>Confirm safe, missing-field-only batch · '+selected+' selected</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" onclick="App.mf441Settings()">'+mf425Icon('settings',21)+
  '<span><strong>Metadata Recovery settings</strong><small>Provider selection, batch limits, progress and shortcuts</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '</div><small class="mf441-start-note">Opening this window never starts a background process or makes an API request.</small></div></section>';
 document.body.appendChild(root);
 MF441.lastFocused=document.activeElement;
 root.querySelector('.mf441-start-head button')?.focus();
 root.querySelector('[data-mf441-close]')?.addEventListener('click',mf441CloseStart);
}
function mf441CloseStart(){
 document.getElementById('mf441-start-dialog')?.remove();
 try{MF441.lastFocused?.focus?.({preventScroll:true});}catch(_){}
 MF441.lastFocused=null;
}
function mf441StartPreview(){
 const ids=mf436SelectedLibraryIds();
 if(ids.length!==1){showToast('Select exactly one Library title for a preview.');return;}
 mf441CloseStart();App.mf439Open(ids[0]);
}
function mf441StartBatch(){
 if(!mf436SelectedLibraryIds().length){showToast('Select Library titles before starting.');return;}
 mf441CloseStart();App.mf439ConfirmBatch();
}
function mf441Settings(section='v221-settings-recovery-workspace'){
 mf441CloseStart();
 if(S.view!=='settings'){
  if(typeof App.setView!=='function'){showToast('Open Settings → Recovery Workspace.');return;}
  App.setView('settings');
  // Settings Center's page enhancer registers sections after page render.
  // Wait until it exists instead of opening a stale section on the prior page.
  const tryOpen=(attempt=0)=>{
   if(S.view==='settings'&&document.querySelector('.mf365-section[data-mf365-section="'+section+'"]')){
    App.v365OpenSection?.(section);return;
   }
   if(attempt<8)setTimeout(()=>tryOpen(attempt+1),80);
   else showToast('In Settings, open Recovery Workspace.');
  };
  tryOpen();return;
 }
 App.v365OpenSection?.(section);
}
function mf441RefreshSettingsStatus(state=mf441State()){
 const root=document.getElementById('mf441-settings-status');
 if(!root)return;
 const summarize=(job,kind)=>{
  if(!job)return kind+': No saved job';
  return kind+': '+String(job.status||'ready')+' · '+(job.cursor||0)+' / '+(job.ids?.length||0)+' titles';
 };
 root.textContent=summarize(state.cover,'Cover')+'   •   '+summarize(state.metadata,'Metadata');
}
function mf441WorkspaceHtml(){
 const prefs=mf441Prefs(),state=mf441State();
 const opt=(id,label,val)=>'<option value="'+id+'" '+(val===id?'selected':'')+'>'+label+'</option>';
 return '<section class="mf441-settings" data-mf-setting-id="recovery-workspace">'+
 '<div class="mf441-settings-hero"><span>'+mf425Icon('layers',23)+'</span><div><h3>Recovery Workspace</h3><p>Cover artwork, metadata and their background processes in one place.</p></div></div>'+
 '<div class="mf441-settings-status" id="mf441-settings-status" role="status">'+
 'Cover: '+mf441Esc(state.cover?.status||'No saved job')+' · Metadata: '+mf441Esc(state.metadata?.status||'No saved job')+'</div>'+
 '<div class="mf441-settings-links">'+
 '<button type="button" onclick="App.mf445Open(&#39;cover&#39;)">'+mf425Icon('images',19)+
 '<span><strong>New Cover Recovery</strong><small>Scope, cover providers, rate protection and previews</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" onclick="App.mf445Open(&#39;metadata&#39;)">'+mf425Icon('database',19)+
 '<span><strong>New Metadata Recovery</strong><small>Selected titles, field evidence and safe merging</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" onclick="App.v365OpenSection(\'v221-settings-cover-recovery\')">'+mf425Icon('settings',19)+
 '<span><strong>Cover Recovery preferences</strong><small>Enabled sources, priority and automation</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" onclick="App.v365OpenSection(\'v221-settings-metadata-recovery\')">'+mf425Icon('settings',19)+
 '<span><strong>Metadata Recovery preferences</strong><small>Provider selection, batch limits and protection</small></span>'+mf425Icon('chevronRight',16)+'</button>'+
 '<button type="button" onclick="App.v365OpenSection(\'v221-settings-api-providers\')">'+mf425Icon('plug',19)+
 '<span><strong>API Providers & Testing</strong><small>Verify public and configured services in the shared registry</small></span>'+mf425Icon('chevronRight',16)+'</button></div>'+
 '<fieldset class="mf441-widget-preferences"><legend>'+mf425Icon('layers',16)+' Background Processes widget</legend>'+
 '<p>The unified floating widget displays the two recovery processes without creating duplicate jobs. Visibility and placement follow the current MediaFlow theme.</p>'+
 '<div class="mf441-control-grid">'+
 '<label data-mf-setting-id="recovery-widget-visibility">Visibility<select onchange="App.mf441SaveSetting(\'visibility\',this.value)">'+
 opt('auto','Automatic · only with active processes',prefs.visibility)+opt('always','Always show',prefs.visibility)+opt('hidden','Hidden',prefs.visibility)+'</select></label>'+
 '<label data-mf-setting-id="recovery-widget-position">Position<select onchange="App.mf441SaveSetting(\'position\',this.value)">'+
 opt('right','Bottom right',prefs.position)+opt('left','Bottom left',prefs.position)+'</select></label></div>'+
 '<label class="mf441-settings-check"><input type="checkbox" '+(prefs.showFinished?'checked':'')+
 ' onchange="App.mf441SaveSetting(\'showFinished\',this.checked)"> Show finished processes in Automatic mode</label>'+
 '</fieldset>'+
 '<p class="mf441-settings-foot">Recovery work continues under its original checkpoint and safety rules. Hiding the widget never stops recovery; closing MediaFlow pauses browser-only work until the app is reopened.</p>'+
 '</section>';
}
function mf441SettingsEnhance(){
 if(String(S.view||'')!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf365-section[data-mf365-section="v221-settings-recovery-workspace"]'))return;
 const body=document.createElement('div');body.innerHTML=mf441WorkspaceHtml();
 const reg=window.MediaFlowSettingsRegistry;
 for(const [id,label] of [['recovery-workspace','Cover and Metadata Recovery workspace'],
  ['recovery-widget-visibility','Background Processes visibility'],
  ['recovery-widget-position','Background Processes position']]){
  reg?.registerSetting?.({id,section:'v221-settings-recovery-workspace',
   selector:'[data-mf-setting-id="'+id+'"]',label,keywords:['cover','metadata','recovery','background','widget','visibility']});
 }
 window.MediaFlowSettingsCenter.mountSection({id:'v221-settings-recovery-workspace',
  title:'RECOVERY WORKSPACE',category:'library',subgroup:'Library maintenance',
  keywords:['cover','metadata','smart recovery','background processes','shortcut','API'],
  nodes:[body]});
 mf441RefreshSettingsStatus();
}
const mf441PrevMarkup=mf397Markup;
mf397Markup=function(){
 const html=mf441PrevMarkup.apply(this,arguments);
 const anchor='      </div>\n      <button type="button" id="mf397-fab"';
 if(!html.includes(anchor))return html;
 const btn='        <button type="button" class="mf397-fan-action a5 mf441-metadata-action" data-action="metadataRecovery">'+
  '<span class="mf397-action-symbol">'+mf425Icon('database',20)+'</span>'+
  '<span><strong>New Metadata Recovery</strong><small>Preview or recover selected titles</small></span><em>05</em></button>\n';
 return html.replace(anchor,btn+anchor);
};
const mf441PrevQuickAction=mf397Action;
mf397Action=function(action){
 if(action==='metadataRecovery'){mf397SetMenu(false);mf441OpenMetadata();return;}
 return mf441PrevQuickAction.apply(this,arguments);
};
// Existing cover and metadata recovery engines still own processing. The
// shared widget updates when either engine publishes progress, even off Settings.
const mf441PrevCoverPaint=mf424Paint;
mf424Paint=function(){const result=mf441PrevCoverPaint.apply(this,arguments);mf441Paint();return result;};
const mf441PrevMetadataPaint=mf439PaintJob;
mf439PaintJob=function(){const result=mf441PrevMetadataPaint.apply(this,arguments);mf441Paint();return result;};
const mf441PrevPreviewHtml=mf439PreviewHtml;
mf439PreviewHtml=function(){
 const base=mf441PrevPreviewHtml.apply(this,arguments);
 if(!base.includes('class="mf439-fields"'))return base;
 const fields=MF439.preview?.preview?.proposals||[];
 const totals=['ready','review','conflict','existing','protected'].map(x=>[x,fields.filter(p=>p.status===x).length]);
 const top='<div class="mf441-preview-summary" role="status">'+
 totals.map(([k,n])=>'<span><strong>'+n+'</strong> '+mf441Esc(k)+'</span>').join('')+'</div>'+
 '<label class="mf441-preview-filter">Show fields<select aria-label="Filter recovery preview fields" onchange="App.mf441FilterPreview(this.value)">'+
 [['all','All fields'],['ready','Ready to fill'],['review','Needs review'],['conflict','Conflicts'],['existing','Existing'],['protected','Protected']].map(([k,label])=>
 '<option value="'+k+'" '+(MF441.previewFilter===k?'selected':'')+'>'+label+'</option>').join('')+'</select></label>';
 return base.replace('<div class="mf439-fields">',top+'<div class="mf439-fields" data-mf441-filter="'+mf441Esc(MF441.previewFilter)+'">');
};
function mf441FilterPreview(value){
 const choices=['all','ready','review','conflict','existing','protected'];
 MF441.previewFilter=choices.includes(value)?value:'all';
 const grid=document.querySelector('#mf439-recovery-modal .mf439-fields');
 if(grid)grid.dataset.mf441Filter=MF441.previewFilter;
}
// Keep the original Metadata Recovery Settings panel; make selected scope
// visible before the user commits to a batch.
const mf441PrevMetadataSettings=mf439SettingsHtml;
mf439SettingsHtml=function(){
 const html=mf441PrevMetadataSettings.apply(this,arguments);
 const ids=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 const banner='<div class="mf441-metadata-scope" role="note">'+mf425Icon('check',17)+
  '<span><strong>'+ids.length.toLocaleString()+' selected Library titles</strong><small>'+
  (ids.length?'Use Preview for one title, or start a confirmed safe batch.':'Check titles in Library to set the recovery scope.')+'</small></span></div>';
 return html.replace('<div class="mf439-settings-head">',banner+'<div class="mf439-settings-head">');
};
for(const page of ['settings','library','dashboard','history','order','collections']){
 MediaFlowRuntime.registerPageEnhancer(page,()=>{if(page==='settings')mf441SettingsEnhance();mf441Paint();});
}
const mf441PrevBackup=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const out=mf441PrevBackup.apply(this,arguments);
 if(out){out.mediaFlowVersion=441;out.backupVersion=441;
  const m=out.backupManifest||(out.backupManifest={});
  m.includes={...(m.includes||{}),recoveryWorkspacePreferences:true};
  m.v441={release:441,preservedRecoveryCheckpoints:true,sharedBackgroundProcessUI:true};}
 return out;
};
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||!document.getElementById('mf441-start-dialog'))return;
 event.preventDefault();mf441CloseStart();
});
Object.assign(App,{mf441OpenMetadata,mf441OpenCover,mf441CloseStart,mf441StartPreview,
 mf441StartBatch,mf441Settings,mf441Toggle,mf441Hide,mf441SaveSetting,mf441FilterPreview});
window.MediaFlowV441=Object.freeze({version:441,settings:mf441WorkspaceHtml,
 widget:mf441WidgetHtml,state:mf441State,paint:mf441Paint,quickMarkup:()=>mf397Markup(),openMetadata:mf441OpenMetadata,
 providers:()=>({cover:MF424_PROVIDER_META.filter(p=>p.limit).length,
  metadata:mf439Available().length})});
