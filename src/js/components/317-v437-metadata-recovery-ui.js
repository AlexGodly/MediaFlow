/* MediaFlow v437 — metadata recovery interface, Settings Center section and quick actions.
 * Follows the Cover Recovery visual language; independent job / provider settings. */
const MF437_UI={source:'settings',oneId:'',draft:null,tests:{},painting:false};
function mf437Icon(name,size=18){return mf425Icon(({database:'database',settings:'settings',play:'play',pause:'pause',stop:'stop',search:'search',check:'check',x:'x',layers:'layers',spark:'spark'})[name]||'database',size);}
function mf437Options(list,selected){return list.map(x=>'<option value="'+mf437Escape(x[0])+'" '+(String(selected)===String(x[0])?'selected':'')+'>'+mf437Escape(x[1])+'</option>').join('');}
function mf437ProvidersMarkup(settingsOnly=false){
 const pref=mf437Prefs();
 return '<div class="mf437-providers">'+MF437_PROVIDERS.map(p=>{
 const selected=p.live&&pref.providers.includes(p.id);
 const tested=MF437_UI.tests[p.id];
 return '<div class="mf437-provider" data-mf437-provider="'+mf437Escape(p.id)+'"><label>'+
 '<input type="checkbox" value="'+mf437Escape(p.id)+'" data-mf437-enabled '+(selected?'checked':'')+(p.live?'':' disabled')+(settingsOnly?' onchange="App.mf437SaveProvidersFromSettings()"':'')+'>'+
 '<span><strong>'+mf437Escape(p.name)+'</strong><small>'+mf437Escape(p.group)+' · '+(p.live?'Public metadata adapter':'Integration pending verification')+'</small></span></label>'+
 (p.live?'<button class="btn btn-ghost" type="button" onclick="App.mf437Test(\''+mf437Escape(p.id)+'\')">Test Metadata</button>':'<span class="mf437-pending">Not active</span>')+
 '<small class="mf437-test-status" id="mf437-test-'+mf437Escape(p.id)+'">'+mf437Escape(tested||'')+'</small></div>';
 }).join('')+'</div>';
}
function mf437PopupMarkup(entry='settings',id=''){
 const prefs=mf437Prefs(),selection=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 const single=entry==='single'&&id;
 const scope=single?'single':selection.length?'selected':'all';
 const cats=(S.categories||[]).filter(x=>x.id).map(c=>[String(c.id),c.name]);
 const available=MF437_PROVIDERS.filter(x=>x.live).length;
 const modeOptions=[['missing','Fill missing metadata (safe)'],['refresh','Refresh ratings and missing fields (existing metadata protected)']];
 return '<div class="mf437-dialog" id="mf437-modal" role="dialog" aria-modal="true" aria-label="Metadata Recovery configuration">'+
 '<div class="mf437-panel"><header class="mf437-header"><div>'+mf437Icon('database',23)+'<div><small>RECOVERY WORKSPACE</small><h2>Metadata Recovery</h2></div></div><button class="btn btn-ghost" onclick="App.mf437Close()" aria-label="Close metadata recovery">'+mf437Icon('x')+'</button></header>'+
 '<div class="mf437-scroll">'+
 '<section><h3>'+mf437Icon('layers')+' 1. RECOVERY SCOPE</h3><label>Choose titles<select id="mf437-scope" '+(single?'disabled':'')+' onchange="App.mf437ScopeChange()">'+mf437Options([['all','All Library'],['selected','Selected Titles ('+selection.length+')'],['category','By Category'],['single','This Title']],scope)+'</select></label>'+
 (single?'<p>Selected title: '+mf437Escape(mf437Find(id)?.title||'Unknown')+'</p>':'')+
 '<label id="mf437-category-row">Category<select id="mf437-category" onchange="App.mf437ScopeChange()">'+mf437Options(cats,cats[0]?.[0])+'</select></label>'+
 '<p class="mf437-sub" id="mf437-count"></p></section>'+
 '<section><h3>'+mf437Icon('settings')+' 2. PROCESSING & DATA PROTECTION</h3><div class="mf437-grid">'+
 '<label>Recovery mode<select id="mf437-mode">'+mf437Options(modeOptions,prefs.mode)+'</select></label>'+
 '<label>Titles per part<input id="mf437-part-size" type="number" min="1" max="1000" value="'+Math.max(1,Math.min(1000,Number(prefs.partSize)||100))+'"></label></div>'+
 '<label>After each part<select id="mf437-continuation">'+mf437Options([['automatic','Continue automatically'],['manual','Wait for confirmation']],prefs.continuation||'automatic')+'</select></label>'+
 '<p class="mf437-sub">'+mf437Icon('check')+' Personal ratings, playback progress, History, XP, manual metadata and conflicting IDs are protected. Existing fields are never overwritten automatically.</p></section>'+
 '<section><h3>'+mf437Icon('database')+' 3. METADATA PROVIDERS & VERIFIED CONNECTIONS</h3><p class="mf437-sub">'+available+' implemented public adapters. Additional public and configured Supabase sources stay visible but inactive until their metadata adapters and permissions are verified.</p>'+
 '<label>Verification test title<input id="mf437-test-title" placeholder="Naruto / Breaking Bad / Pride and Prejudice" value="Naruto" maxlength="120"></label>'+
 mf437ProvidersMarkup()+'</section>'+
 '</div><footer class="mf437-footer"><button class="btn btn-ghost" onclick="App.mf437Close()">Cancel</button><button class="btn btn-primary" onclick="App.mf437Start()">'+mf437Icon('play')+' Start Recovery</button></footer></div></div>';
}
function mf437Styles(){
 if(document.getElementById('mf437-styles'))return;
 const style=document.createElement('style');style.id='mf437-styles';
 style.textContent=
 '.mf437-dialog{position:fixed;inset:0;z-index:110000;display:grid;place-items:center;background:rgba(0,0,0,.65);padding:12px}.mf437-panel{width:min(850px,100%);max-height:min(90vh,960px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border,rgba(180,180,180,.3));border-radius:var(--radius-lg,18px);background:var(--card-bg,var(--surface,var(--bg,#141923)));color:var(--text,var(--fg,#fff));box-shadow:0 25px 90px rgba(0,0,0,.4)}'+
 '.mf437-header,.mf437-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px}.mf437-header>div{display:flex;align-items:center;gap:12px}.mf437-header small{font-size:.68rem;letter-spacing:.11em;font-weight:700;opacity:.65}.mf437-header h2{font-size:1.2rem;margin:0}.mf437-scroll{overflow:auto;min-height:0;padding:0 20px 12px}.mf437-scroll section{padding:14px 0;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent)}.mf437-scroll h3{font-size:.86rem;letter-spacing:.045em;display:flex;align-items:center;gap:8px;margin:0 0 12px}.mf437-scroll label{display:block;margin:9px 0;font-size:.81rem;font-weight:700}.mf437-scroll input:not([type=checkbox]),.mf437-scroll select{width:100%;min-width:0;display:block;margin-top:5px;padding:10px;border-radius:9px;background:var(--input-bg,var(--surface-2,transparent));color:inherit;border:1px solid color-mix(in srgb,currentColor 28%,transparent)}'+
 '.mf437-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}.mf437-sub{font-size:.78rem;line-height:1.6;opacity:.75}.mf437-providers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.mf437-provider{min-width:0;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:11px;padding:10px;display:flex;align-items:center;flex-wrap:wrap;gap:8px}.mf437-provider label{display:flex;flex:1;min-width:140px;align-items:center;gap:8px;margin:0}.mf437-provider label input{flex-shrink:0}.mf437-provider strong{display:block;font-size:.79rem}.mf437-provider small{display:block;font-size:.7rem;font-weight:400;opacity:.7}.mf437-provider button{font-size:.7rem}.mf437-pending{font-size:.68rem;opacity:.65}.mf437-test-status{width:100%}.mf437-footer{border-top:1px solid color-mix(in srgb,currentColor 18%,transparent)}'+
 '.mf437-job-indicator{position:fixed;bottom:105px;right:16px;width:min(335px,calc(100vw - 32px));z-index:85000;border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:15px;background:var(--card-bg,var(--surface,var(--bg,#141923)));color:var(--text,var(--fg,#fff));box-shadow:0 15px 45px rgba(0,0,0,.3);padding:14px}.mf437-job-indicator header{display:flex;justify-content:space-between;gap:10px;align-items:center}.mf437-job-indicator strong{font-size:.84rem}.mf437-job-indicator p{font-size:.74rem;opacity:.78}.mf437-track{height:8px;border-radius:8px;background:color-mix(in srgb,currentColor 18%,transparent);overflow:hidden}.mf437-track span{display:block;height:100%;background:currentColor}.mf437-job-controls{display:flex;gap:7px;flex-wrap:wrap}.mf437-job-controls button{font-size:.72rem}.mf437-settings-card{font-size:.84rem}.mf437-settings-card .mf437-providers{grid-template-columns:repeat(2,minmax(0,1fr))}.mf437-settings-card h3{font-size:.8rem}.mf437-settings-card .mf437-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.mf437-rating-grid{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.mf437-rating{display:inline-flex;gap:5px;align-items:center;padding:6px 9px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:8px;font-size:.77rem}.mf437-rating b{font-variant-numeric:tabular-nums}'+
 '@media(max-width:640px){.mf437-dialog{padding:0;align-items:end}.mf437-panel{max-height:96dvh;border-radius:17px 17px 0 0}.mf437-providers,.mf437-grid,.mf437-settings-card .mf437-providers{grid-template-columns:1fr}.mf437-header,.mf437-footer{padding:12px 14px}.mf437-scroll{padding:0 14px 12px}.mf437-job-indicator{bottom:120px;right:8px}}';
 document.head.appendChild(style);
}
function mf437Open(entry='settings',id=''){
 if(!AUTH_USER){showToast('Sign in before using Metadata Recovery.');return;}
 mf437Styles();
 MF437_UI.source=entry;MF437_UI.oneId=String(id||'');
 document.getElementById('mf437-modal')?.remove();
 document.body.insertAdjacentHTML('beforeend',mf437PopupMarkup(entry,id));
 MF437.modalOpen=true;mf437ScopeChange();document.getElementById('mf437-modal')?.querySelector('button')?.focus();
}
function mf437Close(){document.getElementById('mf437-modal')?.remove();MF437.modalOpen=false;}
function mf437OpenEditor(){const id=String(S.modal?.data?.id||'');if(!id||!mf437Find(id)){showToast('Save this title first to recover metadata.');return;}mf437Open('single',id);}
function mf437ScopeChange(){
 const select=document.getElementById('mf437-scope'),cat=document.getElementById('mf437-category-row'),label=document.getElementById('mf437-count');if(!select)return;
 cat.hidden=select.value!=='category';
 const ids=mf437SelectedIds(select.value,document.getElementById('mf437-category')?.value,MF437_UI.oneId);
 if(label)label.textContent=ids.length.toLocaleString()+' Library titles in this recovery scope.';
}
function mf437Selections(){return [...document.querySelectorAll('#mf437-modal input[data-mf437-enabled]:checked')].map(x=>x.value);}
async function mf437Start(){
 const root=document.getElementById('mf437-modal');if(!root)return;
 const scope=root.querySelector('#mf437-scope')?.value||'all',providers=mf437Selections();
 await mf437Restore();
 const config={scope,id:MF437_UI.oneId,category:root.querySelector('#mf437-category')?.value,mode:root.querySelector('#mf437-mode')?.value,
  partSize:Number(root.querySelector('#mf437-part-size')?.value)||100,continuation:root.querySelector('#mf437-continuation')?.value||'automatic',providers};
 const buttons=[...root.querySelectorAll('footer button')];buttons.forEach(b=>b.disabled=true);
 try{
  S.settings=S.settings||{};S.settings.v437Metadata={...mf437Prefs(),mode:config.mode,partSize:config.partSize,continuation:config.continuation,providers};
  await saveState();await mf437StartJob(config);mf437Close();mf437Paint();
 }catch(e){showToast('Metadata Recovery: '+String(e.message||e));}
 finally{buttons.forEach(b=>b.disabled=false);}
}
async function mf437Test(id){
 const provider=MF437_PROVIDERS.find(p=>p.id===id);if(!provider?.live)return;
 const root=document.getElementById('mf437-modal')||document.querySelector('[data-mf-setting-id="metadata-recovery"]');
 const title=String(root?.querySelector('#mf437-test-title')?.value||'').trim();const node=root?.querySelector('#mf437-test-'+id);
 if(title.length<2){showToast('Enter a real test title first.');return;}
 // Testing verifies returned metadata. API availability alone is not a successful match.
 const samples={jikan:'anime',anilist:'anime',kitsu:'anime',tvmaze:'tv',openlibrary:'book',itunes:'movie',vndb:'visual novel'};
 if(node)node.textContent='Checking metadata…';
 try{
  const data=await mf437Discover({title,mediaFormat:samples[id],externalIds:{}},id);
  if(!data||!(Object.keys(data.fields||{}).some(k=>Boolean(data.fields[k]))||Object.values(data.ratings||{}).some(Boolean)))throw Error('No matching metadata; try a title from this provider');
  const info='Verified · '+new Date().toLocaleDateString();
  MF437_UI.tests[id]=info;if(node)node.textContent=info;
 }catch(e){if(node)node.textContent='Not verified · '+String(e.message||e).slice(0,85);}
}
async function mf437Control(action){
 const job=MF437.job;if(!job||job.account!==mf424Account())return;
 if(action==='pause'){MF437.pause=true;job.status=MF437.running?'pausing':'paused';}
 if(action==='stop'){MF437.stop='stop';job.status=MF437.running?'stopping':'stopped';}
 if(action==='part'){MF437.stop='part';job.status=MF437.running?'stopping-after-part':'stopped';}
 if(action==='resume'){
  if(MF437.running)return;MF437.pause=false;MF437.stop='';void mf437Process();
 }
 if(action==='dismiss'){if(MF437.running)return;document.getElementById('mf437-job')?.remove();return;}
 await mf437SaveJob();mf437Paint();
}
function mf437Paint(){
 mf437Styles();const job=MF437.job;const old=document.getElementById('mf437-job');
 if(!job||!AUTH_USER||job.account!==mf424Account()){old?.remove();return;}
 if(!old&&['complete','stopped'].includes(job.status))return;
 const pct=job.ids.length?Math.round(job.cursor/job.ids.length*100):0,active=['running','pausing','stopping'].includes(job.status),canResume=!MF437.running&&['paused','waiting-part','stopped'].includes(job.status)&&job.cursor<job.ids.length;
 const html='<aside id="mf437-job" class="mf437-job-indicator" aria-label="Metadata Recovery progress">'+
 '<header><strong>'+mf437Icon('database')+' Metadata Recovery</strong><span>'+mf437Escape(job.status)+'</span></header>'+
 '<p>'+job.cursor.toLocaleString()+' / '+job.ids.length.toLocaleString()+' titles · '+pct+'%</p>'+
 '<div class="mf437-track" role="progressbar" aria-label="Metadata progress" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+pct+'%"></span></div>'+
 '<p>Updated '+job.updated+' · Skipped '+job.skipped+' · Provider errors '+job.errors+'</p>'+
 (job.lastError?'<p title="'+mf437Escape(job.lastError)+'">'+mf437Escape(job.lastError)+'</p>':'')+
 '<div class="mf437-job-controls">'+(active?'<button class="btn btn-ghost" onclick="App.mf437Control(\'pause\')">Pause</button><button class="btn btn-ghost" onclick="App.mf437Control(\'stop\')">Stop after current title</button><button class="btn btn-ghost" onclick="App.mf437Control(\'part\')">Stop after current part</button>':'')+
 (canResume?'<button class="btn btn-primary" onclick="App.mf437Control(\'resume\')">Resume</button>':'')+
 (!active?'<button class="btn btn-ghost" onclick="App.mf437Control(\'dismiss\')">Dismiss</button>':'')+'</div></aside>';
 if(old)old.outerHTML=html;else document.body.insertAdjacentHTML('beforeend',html);
}
function mf437SavePref(key,value){
 S.settings=S.settings||{};S.settings.v437Metadata={...mf437Prefs(),[key]:value};
 Promise.resolve(saveState()).catch(e=>showToast('Could not save Metadata Recovery settings: '+e.message));
}
function mf437SettingsMarkup(){
 const pref=mf437Prefs();
 return '<div class="mf437-settings-card" data-mf-setting-id="metadata-recovery">'+
 '<p>Metadata Recovery has independent settings and verified metadata retrieval. Public and configured API credentials are never copied into the browser.</p>'+
 '<div class="mf425-settings-grid"><label>Default recovery mode<select onchange="App.mf437SavePref(\'mode\',this.value)">'+mf437Options([['missing','Fill missing fields'],['refresh','Review updates (never overwrite existing values automatically)']],pref.mode)+'</select></label>'+
 '<label>Titles per part<input type="number" min="1" max="1000" value="'+pref.partSize+'" onchange="App.mf437SavePref(\'partSize\',Math.max(1,Math.min(1000,Number(this.value)||100)))"></label></div>'+
 '<label class="mf425-settings-check"><input type="checkbox" '+(pref.ratingRefresh?'checked':'')+' onchange="App.mf437SavePref(\'ratingRefresh\',this.checked)"> Refresh previously retrieved external ratings</label>'+
 '<p class="mf437-sub">Your personal rating is never changed. Unverified or restricted providers remain disabled until a real metadata adapter has been tested.</p>'+
 '<h3>'+mf437Icon('database')+' VERIFIED METADATA API CONNECTIONS</h3><p class="mf437-sub">Test each public metadata endpoint independently. A cover-only connection does not verify metadata support. Restricted and unimplemented adapters remain disabled.</p><label>Verification test title<input id="mf437-test-title" type="text" maxlength="120" value="Naruto" placeholder="Enter a title supported by the chosen provider"></label>'+mf437ProvidersMarkup(true)+'<div class="mf437-actions"><button class="btn btn-primary" onclick="App.mf437Open()">Configure & Start Metadata Recovery</button><button class="btn btn-ghost" onclick="App.mf437Reset()">Restore Metadata Recovery defaults</button></div></div>';
}
function mf437SettingsEnhance(){
 if(S.view!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(AUTH_USER&&!MF437.job)void mf437Restore().then(mf437Paint);
 if(document.querySelector('[data-mf365-section="v437-metadata-recovery"]'))return;
 const body=document.createElement('div');body.innerHTML=mf437SettingsMarkup();
 MediaFlowSettingsCenter.mountSection({id:'v437-metadata-recovery',title:'METADATA RECOVERY',category:'library',subgroup:'Library maintenance',
  keywords:['metadata','recovery','ratings','providers','external ids','API'],nodes:[body]});
 const section=document.querySelector('[data-mf365-section="v437-metadata-recovery"]');
 const cover=document.querySelector('[data-mf365-section="v221-settings-cover-recovery"]');
 if(section&&cover)cover.after(section);
}
function mf437Reset(){mf437SavePref('providers',MF437_DEFAULTS.providers.slice());S.settings.v437Metadata={...MF437_DEFAULTS,providers:MF437_DEFAULTS.providers.slice()};saveState().then(()=>render());}
function mf437ExtrasMarkup(item){
 const fields=Object.entries(item?.mediaMetadata||{}).filter(([,v])=>v!==null&&v!==undefined&&v!==''&&(!Array.isArray(v)||v.length));
 if(!fields.length)return '';
 const labels={originalTitle:'Original title',episodeCount:'Episodes',chapterCount:'Chapters',volumeCount:'Volumes',
 pageCount:'Pages',trackCount:'Tracks',authors:'Authors',artists:'Artists',platforms:'Platforms',publishers:'Publishers',
 developers:'Developers',language:'Language',network:'Network',isbn:'ISBN',originalLanguage:'Original language',
 officialSite:'Official website',visualNovelLength:'Visual novel length'};
 return '<div class="v181-detail-section-label" style="margin-top:14px;">More media metadata</div><div class="v181-detail-grid">'+
 fields.map(([key,val])=>v181ReadonlyDetail(labels[key]||key,Array.isArray(val)?val.join(', '):val)).join('')+'</div>';
}
function mf437RatingsMarkup(item){
 const ratings=Object.entries(item?.externalRatings||{}).filter(([,r])=>r&&Number.isFinite(r.value)&&Number.isFinite(r.scale));
 if(!ratings.length)return '';
 return '<section class="mf437-rating-panel"><h3>EXTERNAL RATINGS</h3><div class="mf437-rating-grid">'+ratings.map(([id,r])=>'<span class="mf437-rating"><strong>'+mf437Escape(id.toUpperCase())+'</strong> <b>'+Number(r.value).toLocaleString()+' / '+Number(r.scale)+'</b></span>').join('')+'</div><p class="mf437-sub">Provider scores are separate from your personal MediaFlow rating.</p></section>';
}
const mf437OldEditor=libraryModalHtml;
libraryModalHtml=function(data){const html=String(mf437OldEditor.apply(this,arguments)||'');const item=data?.id?mf437Find(data.id):data||{};
 const block='<div class="mf425-editor-tools mf437-editor-tools"><button type="button" class="btn btn-ghost" onclick="App.mf437OpenEditor()">'+mf437Icon('database')+' Fix Metadata</button></div>'+mf437RatingsMarkup(item);
 const anchor='<div class="modal-actions" style="justify-content:space-between;">';
 return html.includes(anchor)?html.replace(anchor,block+anchor):html;
};
const mf437OldLibrary=renderLibrary;
renderLibrary=function(){if(AUTH_USER&&!MF437.job)void mf437Restore().then(mf437Paint);
 const html=String(mf437OldLibrary.apply(this,arguments)||'');
 const button='<button type="button" class="btn btn-sm mf425-tools-button mf437-library-button" onclick="App.mf437Open(\'library\')">'+mf437Icon('database')+' Fix Metadata</button>';
 if(html.includes('mf437-library-button'))return html;
 if(html.includes('mf425-tools-button'))return html.replace(/(<button\b[^>]*mf425-tools-button[^>]*>[\s\S]*?<\/button>)/,'$1'+button);
 return html;
};
const mf437OldQuick=mf397Markup;
mf397Markup=function(){
 const html=String(mf437OldQuick.apply(this,arguments)||'');
 const anchor='      </div>\n      <button type="button" id="mf397-fab"';
 if(!html.includes(anchor))return html;
 const btn='        <button type="button" class="mf397-fan-action a5 mf437-metadata-action" data-action="metadataRecovery"><span class="mf397-action-symbol">'+mf437Icon('database',20)+'</span><span><strong>New Metadata Recovery</strong><small>Configure & start metadata recovery</small></span><em>05</em></button>\n';
 return html.replace(anchor,btn+anchor);
};
const mf437OldQuickAction=mf397Action;
mf397Action=function(action){
 if(action==='metadataRecovery'){mf397SetMenu(false);App.mf437Open('floating');return;}
 return mf437OldQuickAction.apply(this,arguments);
};
MediaFlowRuntime.registerPageEnhancer('settings',mf437SettingsEnhance);
function mf437Boot(){mf437Styles();void mf437Restore().then(mf437Paint);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mf437Boot,{once:true});else mf437Boot();
const mf437OriginalDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 let html=String(mf437OriginalDetails.apply(this,arguments)||'');
 const editButton='<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf437Open(\'single\',\''+mf437Escape(String(item?.id||''))+'\')">'+mf437Icon('database')+' Fix Metadata</button>';
 html=html.replace('<div class="v181-detail-actions" style="margin:0;">','<div class="v181-detail-actions" style="margin:0;">'+editButton);
 const anchor='<div class="v181-detail-section-label" style="margin-top:14px;">Dates & source</div>';
 if(html.includes(anchor))html=html.replace(anchor,mf437RatingsMarkup(item)+mf437ExtrasMarkup(item)+anchor);
 return html;
};
function mf437SaveProvidersFromSettings(){
 const root=document.querySelector('[data-mf-setting-id="metadata-recovery"]');
 if(!root)return;
 const providers=[...root.querySelectorAll('input[data-mf437-enabled]:checked')].map(x=>x.value);
 mf437SavePref('providers',providers);
}
Object.assign(App,{mf437Open,mf437Close,mf437OpenEditor,mf437ScopeChange,mf437Start,mf437Test,mf437Control,mf437SavePref,mf437Reset,mf437SaveProvidersFromSettings});
