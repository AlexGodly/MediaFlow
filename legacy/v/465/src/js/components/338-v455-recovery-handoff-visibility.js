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

const mf455OriginalCoverSettings=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
 const html=String(mf455OriginalCoverSettings.apply(this,arguments)||'');
 return html.replace('<div class="mf425-settings-actions">',
  '<details class="mf455-native-processing"><summary>Advanced Cover Processing & Matching</summary>'+
  mf455ProcessingHtml('cover')+'</details><div class="mf425-settings-actions">');
};
const mf455OriginalMetaSettings=mf439SettingsHtml;
mf439SettingsHtml=function(){
 const html=String(mf455OriginalMetaSettings.apply(this,arguments)||'');
 return html.replace('<div class="mf439-settings-actions">',
  '<details class="mf455-native-processing"><summary>Advanced Metadata Processing & Matching</summary>'+
  mf455ProcessingHtml('metadata')+'</details><div class="mf439-settings-actions">');
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
 if(job?.v455Providers&&job.v455Selection==='manual'&&job.manualReviewId){
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

function mf455ReviewPendingMetadata(){
 const job=MF439.job||mf439ReadJob();
 if(!job?.manualReviewId||MF439.working)return;
 return App.mf453OpenQuick('metadata',String(job.manualReviewId));
}
async function mf455FinishManualTitle(action='skip',id=''){
 const job=MF439.job;
 if(!job?.manualReviewId||MF439.working)return false;
 if(id&&String(job.manualReviewId)!==String(id))return false;
 if(action==='skip'&&!await mf444Confirm('Skip this metadata title?',
  'Skip the pending manual review and continue from the next saved title. Already saved metadata will not change.',
  'Skip Title',false,1,'metadata'))return false;
 const current=String(job.ids[job.cursor]||'');
 if(current!==String(job.manualReviewId))return false;
 job.manualReviewId='';
 job.cursor++;job.completed=job.cursor;job.status=job.cursor>=job.ids.length?'completed':'paused';
 mf439SaveJob();mf439PaintJob();mf441Paint();
 showToast(job.status==='completed'?'Metadata manual recovery complete.':'Manual review checkpoint saved. Resume for the next title.');
 return true;
}
const mf455OldQuickApply=App.mf453ApplyQuick;
App.mf453ApplyQuick=async function(){
 const quick=window.MediaFlowV454?.active?.(),id=quick?.id;
 const title=quick&&mf439Item(id);
 const before=title&&JSON.stringify(title);
 const result=await mf455OldQuickApply.apply(this,arguments);
 if(id&&MF439.job?.manualReviewId===String(id)&&!window.MediaFlowV454?.active?.()&&
  title&&JSON.stringify(title)!==before)await mf455FinishManualTitle('saved',id);
 return result;
};
const mf455OldMetadataRowReview=mf441MetadataRow;
mf441MetadataRow=function(state){
 let html=String(mf455OldMetadataRowReview.apply(this,arguments)||'');
 const job=state.metadata;
 if(job?.manualReviewId){
  const controls='<div class="mf455-manual-review"><strong>'+
   mf425Icon('search',15)+' Manual metadata selection</strong>'+
   '<small>Title '+(Number(job.cursor)+1)+' / '+job.ids.length+
   ' needs confirmation before progressing.</small>'+
   '<button type="button" data-v225-iconified="1" onclick="App.mf455ReviewPendingMetadata()">'+
   mf425Icon('database',15)+' Review title</button>'+
   '<button type="button" data-v225-iconified="1" onclick="App.mf455FinishManualTitle(&#39;skip&#39;)">'+
   mf425Icon('x',15)+' Skip title</button></div>';
  return html.replace('</article>',controls+'</article>');
 }
 return html;
};
App.mf455ReviewPendingMetadata=mf455ReviewPendingMetadata;
App.mf455FinishManualTitle=mf455FinishManualTitle;
window.MediaFlowV455Stages=Object.freeze({version:455,metadata:mf455MetadataOptions,
 progress:mf455ProcessStatus,continue:mf447ContinueCombined,settings:()=>mf441WorkspaceHtml()});
