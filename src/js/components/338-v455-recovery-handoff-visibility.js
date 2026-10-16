/* MediaFlow v455 — completion handoff, settings and visible job progress. */
const MF455_STAGE={lastKind:'',metadataIds:[]};
const mf455OldWorkspaceSettings=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=String(mf455OldWorkspaceSettings.apply(this,arguments)||'');
 if(html.includes('data-mf455-settings'))return html;
 const settings='<section class="mf455-recovery-settings" data-mf455-settings>'+
 '<header><strong>'+mf425Icon('sliders',19)+' Universal Recovery Processing</strong>'+
 '<p>Independent processing and provider configurations for Cover, Metadata and Recover Both. All engine limits remain enforced.</p></header>'+
 ['cover','metadata','both'].map(mode=>'<details class="mf455-settings-mode"><summary>'+
 mf425Icon(mode==='cover'?'images':mode==='metadata'?'database':'layers',17)+
 ' '+(mode==='cover'?'Cover Recovery':mode==='metadata'?'Metadata Recovery':'Recover Both')+
 ' processing options</summary>'+mf455ProcessingHtml(mode)+
 '<div class="mf455-settings-providers"><strong>Enabled '+(mode==='metadata'?'metadata':mode==='both'?'cover & metadata':'cover')+' providers</strong>'+
 (mode==='both'?'<p>Cover and Metadata providers can be enabled independently through the unified workspace.</p>':'')+
 '<button type="button" class="btn btn-ghost" onclick="App.mf447Open('+mf424Escape(JSON.stringify(mode))+',{entry:&#39;settings&#39;})">'+
 mf425Icon('sliders',15)+' Open provider selection</button></div></details>').join('')+'</section>';
 return html+settings;
};
const mf455OrigCoverPrefs=mf424Defaults;
mf424Defaults=function(){
 const x=mf455OrigCoverPrefs.apply(this,arguments),j=MF424.job;
 if(!j?.v455Providers)return x;
 return {...x,autoResume:j.autoResume,protection:j.v455Protection||x.protection};
};
const mf455OldRunMetadata=mf439RunBatch;
mf439RunBatch=async function(){
 const job=MF439.job;
 if(job?.v455Providers&&job.v455Selection==='manual'&&job.status==='waiting-review'){
  showToast('Review or skip the pending metadata title before resuming this job.');return;
 }
 return mf455OldRunMetadata.apply(this,arguments);
};
function mf455MetadataOptions(kind,ids,providers,source='direct'){
 const p=mf455Settings(kind);
 const partSize=p.partMode==='automatic'?Math.max(1,Math.min(250,Math.ceil(ids.length/10))):Math.max(1,Math.min(250,p.partSize));
 return {schema:1,account:mf439Account(),ids,cursor:0,changed:0,completed:0,
  errors:[],startedAt:Date.now(),status:'running',mode:p.mode,partSize,
  continuation:p.continuation,stopRequested:false,autoResume:p.autoResume,
  v455Providers:providers,v455Selection:p.selection,
  v455Protection:p.protection,v455Source:source};
}
const mf455OriginalContinue=mf447ContinueCombined;
mf447ContinueCombined=async function(){
 const combo=mf447Combo();
 if(!combo?.v455Direct)return mf455OriginalContinue.apply(this,arguments);
 if(combo.stage!=='ready-metadata')return;
 if(MF439.working||MF424.running)return;
 if(combo.coverId&&(MF424.job?.id!==combo.coverId||MF424.job.status!=='complete'))return;
 const ids=mf447AllowedIds(combo.ids).slice(0,mf439Preferences().maxBatch);
 if(!ids.length){showToast('Combined recovery has no eligible titles for metadata.');return;}
 const available=mf455BaseProviders('metadata').filter(p=>p.available).map(p=>p.id);
 const providers=(combo.v455MetaProviders||[]).filter(id=>available.includes(id));
 if(!providers.length){showToast('Metadata stage needs a working provider; configure access before continuing.');return;}
 try{
  MF439.job=mf455MetadataOptions('both',ids,providers,'combined');
  mf439SaveJob();
  mf447WriteCombo({...combo,stage:'metadata',metadataAt:MF439.job.startedAt});
  mf441Paint();
  await mf439RunBatch();
 }catch(e){
  showToast('Metadata continuation failed; cover checkpoint is safe: '+String(e?.message||e).slice(0,110));
 }
};
App.mf447ContinueCombined=mf447ContinueCombined;
// Progress labels report actual cursor and active process stage. Never show a
// fictitious percentage just to make a stalled API call look successful.
function mf455ProcessStatus(kind,state){
 const j=kind==='cover'?state.cover:state.metadata;
 if(!j||!j.ids?.length)return '';
 const running=kind==='cover'?MF424.running:MF439.working;
 const finished=Math.max(0,Math.min(j.ids.length,Number(j.cursor)||0));
 const step=running?Math.min(j.ids.length,finished+1):finished;
 const msg=running?'Processing title '+step.toLocaleString()+' of '+j.ids.length.toLocaleString():
  j.status==='waiting-part'?'Waiting for next part':j.status==='paused'?'Paused with saved checkpoint':
  j.status==='complete'||j.status==='completed'?'All titles processed':'Ready';
 return '<p class="mf455-live-progress" role="status" aria-live="polite">'+
 (running?mf425Icon('activity',15):mf425Icon('layers',15))+' '+mf424Escape(msg)+
 ' · '+finished.toLocaleString()+' completed</p>';
}
const mf455OldCoverRow=mf441CoverRow;
mf441CoverRow=function(s){
 let html=String(mf455OldCoverRow.apply(this,arguments)||'');
 return html.replace('</article>',mf455ProcessStatus('cover',s)+'</article>');
};
const mf455OldMetadataRow=mf441MetadataRow;
mf441MetadataRow=function(s){
 let html=String(mf455OldMetadataRow.apply(this,arguments)||'');
 return html.replace('</article>',mf455ProcessStatus('metadata',s)+'</article>');
};
const mf455OldWidget=mf441WidgetHtml;
mf441WidgetHtml=function(){
 const html=String(mf455OldWidget.apply(this,arguments)||'');
 return html.replace('class="mf441-widget ', 'class="mf441-widget mf455-readable-widget ');
};
window.MediaFlowV455Stages=Object.freeze({version:455,metadata:mf455MetadataOptions,
 progress:mf455ProcessStatus,continue:mf447ContinueCombined,settings:()=>mf441WorkspaceHtml()});
