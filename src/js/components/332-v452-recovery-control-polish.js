/* MediaFlow v452 — recovery provider bulk controls, clean title editor actions,
 * and complete semantic stopping actions in the Background Processes widget.
 * Reuses all v424/v439/v442/v447/v451 checkpoint and provider safety systems. */
const MF452_VERSION=452;
const MF452_ICON_PATHS=Object.freeze({
  selectAll:'<rect x="3" y="3" width="7" height="7" rx="1"/><path d="m4.5 6.5 1.3 1.3L8 5.3"/><rect x="14" y="3" width="7" height="7" rx="1"/><path d="m15.5 6.5 1.3 1.3L19 5.3"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="m4.5 17.5 1.3 1.3L8 16.3"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="m15.5 17.5 1.3 1.3L19 16.3"/>',
  deselectAll:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M5 6.5h3M16 6.5h3M5 17.5h3M16 17.5h3"/>',
  stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  stopTitle:'<rect x="3" y="4" width="11" height="16" rx="2"/><path d="M6 9h5M6 13h5"/><rect x="17" y="9" width="5" height="6" rx="1"/>',
  stopPart:'<rect x="3" y="4" width="10" height="7" rx="1"/><rect x="3" y="14" width="10" height="7" rx="1"/><rect x="17" y="9" width="5" height="6" rx="1"/>',
  stopAll:'<rect x="2" y="5" width="8" height="14" rx="1"/><rect x="14" y="5" width="8" height="14" rx="1"/>',
  discard:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'
});
function mf452Icon(type,size=16){
 const paths=MF452_ICON_PATHS[type]||MF452_ICON_PATHS.stop;
 return '<svg class="mf452-icon mf452-icon-'+type+'" viewBox="0 0 24 24" width="'+size+'" height="'+size+
  '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
}
function mf452Button(action,label,icon,cls='',title=''){
 return '<button type="button" data-v225-iconified="1" class="mf452-control '+cls+
  '" onclick="'+mf424Escape(action)+'"'+(title?' title="'+mf424Escape(title)+'"':'')+
  '>'+mf452Icon(icon,15)+' <span>'+mf424Escape(label)+'</span></button>';
}
function mf452ProviderToolbar(mode){
 const kind=mode==='metadata'?'metadata':'cover',q=JSON.stringify(kind);
 return '<div class="mf446-provider-tools mf452-provider-tools" role="group" aria-label="'+
  (kind==='cover'?'Cover':'Metadata')+' provider bulk selection">'+
  mf452Button('App.mf446ProviderAll('+q+',true)','Select All','selectAll','mf452-provider-select','Enable every available '+kind+' provider')+
  mf452Button('App.mf446ProviderAll('+q+',false)','Deselect All','deselectAll','mf452-provider-deselect','Disable every '+kind+' provider')+'</div>';
}
// The "Both" tab uses mf446SourceHtml twice; keep the intended panel when
// selecting cover providers OR metadata providers.
const mf452BaseSource=mf446SourceHtml;
mf446SourceHtml=function(mode){
 const html=String(mf452BaseSource.apply(this,arguments)||'');
 return html.replace(/<div class="mf446-provider-tools">[\s\S]*?<\/div>/,
  mf452ProviderToolbar(mode));
};
function mf452SaveProviders(mode,enabled){
 if(!['cover','metadata'].includes(mode))return false;
 S.settings=S.settings||{};
 const prop=mode==='cover'?'v424Covers':'v439Metadata';
 S.settings[prop]={...(S.settings[prop]||{}),enabled};
 Promise.resolve(saveState()).catch(e=>console.warn('Provider preference persistence failed',e));
 const current=document.getElementById('mf445-workspace');
 if(current){
  const active=MF447?.active==='both'||current.querySelector('[data-mf445-tab="both"][aria-selected="true"]')?'both':(MF445.mode||mode);
  mf445Panel(active);
 }
 return true;
}
mf446ProviderAll=function(mode,on){
 if(!['cover','metadata'].includes(mode))return;
 const candidates=mf445Providers(mode).filter(row=>row.available);
 const enabled=on?candidates.map(row=>row.id):[];
 mf452SaveProviders(mode,enabled);
};
mf446ToggleProvider=function(mode,id,on){
 if(!['cover','metadata'].includes(mode))return;
 const rows=mf445Providers(mode),candidate=rows.find(row=>row.id===id);
 if(!candidate||!candidate.available){
  showToast('This provider is unavailable. Configure its credentials in API Setup.');return;
 }
 const existing=new Set((mode==='cover'?mf424Defaults():mf439Preferences()).enabled);
 if(on)existing.add(id);else existing.delete(id);
 mf452SaveProviders(mode,[...existing]);
};
App.mf446ProviderAll=mf446ProviderAll;
App.mf446ToggleProvider=mf446ToggleProvider;
// Eliminate the redundant one-off Fix Metadata action, but never hide the
// functional Metadata Recovery (and Recover Both) actions.
function mf452CleanTitleRecovery(raw){
 if(!String(raw).includes('Fix Metadata'))return raw;
 try{
  const host=document.createElement('div');host.innerHTML=raw;
  const buttons=host.querySelectorAll(
   '.mf449-editor-recovery-toolbar button,.mf449-editor-draft-actions button,'+
   '.mf439-editor-action button,.v181-detail-actions button');
  for(const button of buttons){
   const isFix=/^\s*Fix Metadata\s*$/i.test(button.textContent.trim());
   const rawClick=button.getAttribute('onclick')||'';
   if(isFix&&(!rawClick||rawClick.includes('mf439Open')))button.remove();
  }
  host.querySelectorAll('.mf439-editor-action').forEach(el=>{
   if(!el.querySelector('button,input,select,textarea'))el.remove();
  });
  return host.innerHTML;
 }catch(e){console.warn('v452 title recovery cleanup skipped',e);return raw;}
}
const mf452BaseEditor=libraryModalHtml;
libraryModalHtml=function(){return mf452CleanTitleRecovery(String(mf452BaseEditor.apply(this,arguments)||''));};
const mf452BaseDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(){return mf452CleanTitleRecovery(String(mf452BaseDetails.apply(this,arguments)||''));};
// The draft title has no stable ID. It should display exactly the three
// existing recovery routes, disabled until the title is saved.
const mf452BaseDraft=mf449DraftButtons;
mf449DraftButtons=function(){
 return mf452CleanTitleRecovery(mf452BaseDraft.apply(this,arguments));
};
// Metadata jobs use their EXISTING configured batchSize (normally 25) to
// define one part. The durable stop boundary is saved with the job.
function mf452StopBoundary(job){
 if(!job||!job.stopRequested&&!(job.stopAfterTitle||job.stopAtCursor))return false;
 if(!job.stopRequested&&(job.stopAfterTitle||
   Number(job.stopAtCursor)>0&&job.cursor>=Number(job.stopAtCursor))){
  job.stopRequested=true;
  job.stopAfterTitle=false;job.stopAtCursor=0;
  mf439SaveJob();
 }
 return Boolean(job.stopRequested);
}
async function mf452CoverStopAfter(kind){
 const j=MF424.job;
 if(!j||['complete','stopped'].includes(j.status))return;
 if(!MF424.running){
  j.stopRequested=true;j.status='stopped';
 }else if(kind==='title'){
  j.stopAfterTitle=true;j.stopAfterPart=false;
 }else{
  j.stopAfterPart=true;j.stopAfterTitle=false;
 }
 await mf424SaveJob();mf424Paint();mf441Paint();
 showToast(MF424.running?'Cover Recovery will stop after the current '+(kind==='title'?'title.':'part.'):'Cover Recovery stopped; checkpoint preserved.');
}
function mf452MetadataStopAfter(kind){
 const j=MF439.job;
 if(!j||['completed','stopped'].includes(j.status))return;
 if(!MF439.working){
  j.stopRequested=true;j.status='stopped';
 }else if(kind==='title'){
  j.stopAfterTitle=true;j.stopAtCursor=0;
 }else{
  const partSize=mf439Preferences().batchSize;
  j.stopAfterTitle=false;j.stopAtCursor=Math.min(j.ids.length,(Math.floor(j.cursor/partSize)+1)*partSize);
  j.stopPartSize=partSize;
 }
 mf439SaveJob();mf439PaintJob();mf441Paint();
 showToast(MF439.working?'Metadata Recovery will stop after the current '+(kind==='title'?'title.':'part.'):'Metadata Recovery stopped; checkpoint preserved.');
}
const mf452BaseResumeCover=App.mf424Resume;
App.mf424Resume=async function(){
 if(MF424.job){
  MF424.job.stopAfterTitle=false;
  MF424.job.stopAfterPart=false;
  MF424.job.stopRequested=false;
  MF424.job.hardStop=false;
  await mf424SaveJob();
 }
 return mf452BaseResumeCover.apply(this,arguments);
};
const mf452BaseResumeMeta=App.mf439Resume;
App.mf439Resume=function(){
 if(MF439.job){
  MF439.job.stopAfterTitle=false;MF439.job.stopAtCursor=0;
  MF439.job.stopRequested=false;mf439SaveJob();
 }
 return mf452BaseResumeMeta.apply(this,arguments);
};
function mf452StopRow(raw,kind,j){
 const html=String(raw||''),active=kind==='cover'?Boolean(MF424.running):Boolean(MF439.working&&j?.status==='running');
 // v451 uses a missing 'square' icon alias (renders as Images): rebuild the
 // Stop button with a dedicated square, and add explicit stop boundaries.
 const clean=html.replace(/<button\b[^>]*class="mf451-stop"[\s\S]*?<\/button>/g,'');
 if(!j||['complete','completed','stopped'].includes(j.status))return clean;
 const stop=mf452Button("App.mf451Stop('"+kind+"')",'Stop Now','stop','mf451-stop mf452-stop-now');
 const title=active?mf452Button("App.mf452StopAfter('"+kind+"','title')",
  'Stop After Title','stopTitle','mf452-after-title'):'';
 const part=active?mf452Button("App.mf452StopAfter('"+kind+"','part')",
  'Stop After Part','stopPart','mf452-after-part',
  kind==='metadata'?'Finish the current '+mf439Preferences().batchSize+'-title metadata part before stopping':'Finish the current cover part before stopping'):'';
 return clean.replace('</div></article>',stop+title+part+'</div></article>');
}
const mf452BaseCoverRow=mf441CoverRow;
mf441CoverRow=function(s){return mf452StopRow(mf452BaseCoverRow.apply(this,arguments),'cover',s.cover);};
const mf452BaseMetaRow=mf441MetadataRow;
mf441MetadataRow=function(s){return mf452StopRow(mf452BaseMetaRow.apply(this,arguments),'metadata',s.metadata);};
// Both fixed 'square' and 'trash2' failed in the v425 icon map. Replace the
// entire icon inside these controls, in both floating and Settings workspaces.
function mf452ReplaceStopIcons(raw){
 const host=document.createElement('div');host.innerHTML=raw;
 host.querySelectorAll('button.mf451-stop,button.mf451-discard').forEach(button=>{
  const click=button.getAttribute('onclick')||'';
  const stopAll=click.includes("mf451Stop('all')")||click.includes('mf451Stop(&#39;all&#39;)');
  const discard=click.includes('mf451ClearAll()');
  if(!stopAll&&!discard)return;
  const label=(button.textContent||'').trim();
  button.dataset.v225Iconified='1';
  button.querySelectorAll('svg.mf425-icon,.v225-btn-icon').forEach(icon=>icon.remove());
  button.insertAdjacentHTML('afterbegin',mf452Icon(discard?'discard':'stopAll',15));
  button.setAttribute('aria-label',label);
 });
 return host.innerHTML;
}
const mf452BaseWidget=mf441WidgetHtml;
mf441WidgetHtml=function(){return mf452ReplaceStopIcons(mf452BaseWidget.apply(this,arguments));};
const mf452BaseWorkspace=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){return mf452ReplaceStopIcons(mf452BaseWorkspace.apply(this,arguments));};
App.mf452StopAfter=function(kind,which){
 if(!['cover','metadata'].includes(kind)||!['title','part'].includes(which))return;
 return kind==='cover'?mf452CoverStopAfter(which):mf452MetadataStopAfter(which);
};
window.MediaFlowV452=Object.freeze({
 version:452,sourceHtml:mf446SourceHtml,toolbar:mf452ProviderToolbar,icon:mf452Icon,
 clean:mf452CleanTitleRecovery,boundary:mf452StopBoundary,
 stopAfter:App.mf452StopAfter,coverRow:mf441CoverRow,metadataRow:mf441MetadataRow,
 widget:mf441WidgetHtml
});
