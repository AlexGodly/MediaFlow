/* MediaFlow v448 — Smart Auto-Fill & Automatic Recovery.
 * Existing v424/v439/v442 jobs retain control of API calls, locks, safe writes,
 * confirmation dialogs and checkpoints. v448 adds opt-in safety policies,
 * confidence labels and a bounded evidence-review queue.
 */
const MF448_VERSION=448;
const MF448_DEFAULT={coverPolicy:'original',coverConfidence:98,
 metadataPolicy:'original',metadataConfidence:94,collectReviews:true};
const MF448={reviewQueue:null,reviewAccount:'',window:null,policyActive:false};
function mf448Prefs(){
 const data=S.settings?.v448SmartRecovery||{};
 const cp=['original','strict','review'].includes(data.coverPolicy)?data.coverPolicy:'original';
 const mp=['original','review'].includes(data.metadataPolicy)?data.metadataPolicy:'original';
 const int=(n,floor,ceil,def)=>Number.isFinite(Number(n))?Math.max(floor,Math.min(ceil,Math.floor(Number(n)))):def;
 return {...MF448_DEFAULT,...data,coverPolicy:cp,metadataPolicy:mp,
  coverConfidence:int(data.coverConfidence,95,99,98),
  metadataConfidence:int(data.metadataConfidence,94,99,
   Math.round(Math.max(.94,Math.min(.99,Number(S.settings?.v439Metadata?.minimumConfidence)||.94))*100)),
  collectReviews:data.collectReviews!==false,
  dashboardAutoSave:!!S.settings?.v430MissingCoversAutoSave};
}
function mf448Set(key,value){
 const valid=['coverPolicy','coverConfidence','metadataPolicy','metadataConfidence','collectReviews','dashboardAutoSave'];
 if(!valid.includes(key))return;
 if(key==='dashboardAutoSave'){
  const checked=!!value;
  if(typeof App.mf430SetMissingAutoSave==='function')App.mf430SetMissingAutoSave(checked);
  else{S.settings=S.settings||{};S.settings.v430MissingCoversAutoSave=checked;}
 }else{
  S.settings=S.settings||{};
  S.settings.v448SmartRecovery={...(S.settings.v448SmartRecovery||{}),[key]:value};
 }
 mf448Persist();
 if(document.getElementById('mf445-workspace'))mf445Panel(MF447.active==='both'?'both':MF445.mode);
 mf441Paint();
}
function mf448Persist(){
 Promise.resolve(saveState()).catch(error=>{console.warn('Smart recovery settings save failed',error);showToast('Smart Recovery settings could not be saved.');});
}
function mf448PolicyCover(){
 return MF424.job?.mf448Options?.coverPolicy?MF424.job.mf448Options:mf448Prefs();
}
function mf448PolicyMetadata(){
 return MF439.job?.mf448Options?.metadataPolicy?MF439.job.mf448Options:mf448Prefs();
}
function mf448MetaAccount(){return String(mf439Account());}
function mf448ReviewKey(){return 'mediaflow-v448-review:'+mf448MetaAccount();}
function mf448ReadReviews(){
 const account=mf448MetaAccount();
 if(MF448.reviewAccount!==account){
  MF448.reviewAccount=account;MF448.reviewQueue=[];
  try{
   const rows=JSON.parse(localStorage.getItem(mf448ReviewKey())||'[]');
   if(Array.isArray(rows))MF448.reviewQueue=rows.filter(x=>
    x&&typeof x.id==='string'&&Number.isFinite(Number(x.at))&&
    ['low-confidence','conflict','manual-review'].includes(x.reason)).slice(-250);
  }catch(error){console.warn('Could not read metadata review index',error);}
 }
 return MF448.reviewQueue;
}
function mf448StoreReviews(){
 try{localStorage.setItem(mf448ReviewKey(),JSON.stringify(mf448ReadReviews().slice(-250)));}
 catch(error){console.warn('Could not persist metadata review index',error);}
}
function mf448QueueReview(preview){
 if(!mf448PolicyMetadata().collectReviews||!MF439.working||!MF439.job||!preview?.titleId)return;
 const pending=(preview.proposals||[]).filter(p=>
  !p.protected&&!p.same&&!p.hasOriginal&&
  (p.status==='conflict'||p.status==='review'||mf448PolicyMetadata().metadataPolicy==='review'));
 if(!pending.length)return;
 const conflicts=pending.filter(x=>x.disagree).length;
 const reason=mf448PolicyMetadata().metadataPolicy==='review'?'manual-review':
  conflicts?'conflict':'low-confidence';
 const id=String(preview.titleId),queue=mf448ReadReviews();
 const existing=queue.findIndex(row=>row.id===id);
 if(existing>=0)queue.splice(existing,1);
 queue.push({id,at:Date.now(),reason,fields:Math.min(100,pending.length),
  providers:Math.min(50,Number(preview.providers?.length)||0)});
 if(queue.length>250)queue.splice(0,queue.length-250);
 mf448StoreReviews();
}
const mf448OriginalProposals=mf439Proposals;
mf439Proposals=function(item,results){
 const preview=mf448OriginalProposals.apply(this,arguments);
 mf448QueueReview(preview);
 return preview;
};
const mf448OriginalMetaPreferences=mf439Preferences;
mf439Preferences=function(){
 const prefs=mf448OriginalMetaPreferences.apply(this,arguments),policy=mf448PolicyMetadata();
 const configured=S.settings?.v448SmartRecovery?.metadataConfidence;
 const explicit=configured!==null&&configured!==undefined&&Number.isFinite(Number(configured));
 return {...prefs,minimumConfidence:explicit||MF439.job?.mf448Options?.metadataConfidence!=null?
  policy.metadataConfidence/100:Math.max(.94,Number(prefs.minimumConfidence)||.94)};
};
const mf448OriginalMetaApply=mf439Apply;
mf439Apply=function(item,preview,mode='review'){
 if(mode==='automatic'&&mf448PolicyMetadata().metadataPolicy==='review'){
  // The job still advances with a checkpoint and review index, but never
  // commits any proposed metadata without the user's per-title preview.
  return {changed:0,legacy:0,fields:0,ratings:0,reviewOnly:true};
 }
 return mf448OriginalMetaApply.apply(this,arguments);
};
const mf448OriginalCoverSaveJob=mf424SaveJob;
mf424SaveJob=async function(){
 if(MF424.job&&!MF424.job.mf448Options)
  MF424.job.mf448Options={coverPolicy:mf448Prefs().coverPolicy,coverConfidence:mf448Prefs().coverConfidence};
 return mf448OriginalCoverSaveJob.apply(this,arguments);
};
const mf448OriginalMetaSaveJob=mf439SaveJob;
mf439SaveJob=function(){
 if(MF439.job&&!MF439.job.mf448Options)
  MF439.job.mf448Options={metadataPolicy:mf448Prefs().metadataPolicy,
   metadataConfidence:mf448Prefs().metadataConfidence,collectReviews:mf448Prefs().collectReviews};
 return mf448OriginalMetaSaveJob.apply(this,arguments);
};
const mf448OriginalCoverProcess=mf424Process;
mf424Process=async function(item){
 const policy=mf448PolicyCover();
 if(policy.coverPolicy==='original')return mf448OriginalCoverProcess.apply(this,arguments);
 if(!mf424Missing(item)){MF424.job.skipped++;return;}
 const expected=Number(item.modifiedAt)||0,candidates=await mf424Candidates(item);
 if(!candidates.length){MF424.job.unresolved++;mf424Note('unresolved','No verified cover found',item.id);return;}
 const selected=candidates.slice().sort((a,b)=>Number(b.confidence)-Number(a.confidence));
 const best=selected[0],threshold=Math.max(.95,policy.coverConfidence/100);
 const trusted=best.idMatch===true&&Number(best.confidence)>=threshold;
 const alternatives=selected.filter(x=>x.idMatch===true&&Number(x.confidence)>=threshold&&x.url!==best.url);
 // The strict policy is stronger than the original engine. Conflicting
 // verified artworks or anything without saved direct-ID evidence stay manual.
 if(policy.coverPolicy==='review'||!trusted||alternatives.length){
  mf424QueueReview(item,candidates);
  if(alternatives.length)mf424Note('review','Conflicting verified cover candidates; manual decision required',item.id);
  return;
 }
 if(await mf424Apply(item,best,expected)){
  MF424.job.fixed++;mf424Note('recovered','Strict verified auto-fill: '+best.provider,item.id);
 }else{
  MF424.job.unresolved++;mf424Note('conflict','Title changed or cover validation failed',item.id);
 }
};
const mf448OriginalInstantCandidates=mf425CandidatesHtml;
mf425CandidatesHtml=function(candidates,item){
 let raw=mf448OriginalInstantCandidates.apply(this,arguments);
 let card=0;
 raw=raw.replace(/(<article class="mf425-candidate"[^>]*>)/g,match=>{
  const candidate=candidates[card++];if(!candidate)return match;
  const verified=candidate.idMatch===true&&Number(candidate.confidence)>=.95;
  const pct=Math.round(Math.max(0,Math.min(1,Number(candidate.confidence)||0))*100);
  return match+'<span class="mf448-candidate-confidence '+(verified?'verified':'review')+'">'+
   mf425Icon(verified?'shield':'search',13)+' '+pct+'% · '+(verified?'Direct ID match':'Manual review')+'</span>';
 });
 const policy=mf448Prefs();
 // Candidate cards remain interactive. Evidence is explanatory only: a
 // title-only match never becomes auto-verified from this badge.
 return raw.replace(/(<div class="mf425-found-count"[^>]*>)/,
  '$1<span class="mf448-evidence-caption">Manual review for ambiguous matches · saved external IDs required for automatic recovery.</span>')+
  '<div class="mf448-instant-policy">'+mf425Icon('shield',15)+
  (policy.dashboardAutoSave?
  ' Dashboard: auto-save and go next only for one uniquely verified image.':
  ' Dashboard: Save cover & Next remains manual until enabled in Smart Recovery.')+'</div>';
};
function mf448ConfigHtml(kind='both'){
 const p=mf448Prefs(),isCover=kind==='cover'||kind==='both',isMeta=kind==='metadata'||kind==='both';
 const select=(key,rows,val)=>'<select data-mf448-key="'+key+'" onchange="App.mf448Set(\''+key+'\',this.value)">'+
  rows.map(([id,label])=>'<option value="'+id+'" '+(id===val?'selected':'')+'>'+mf424Escape(label)+'</option>').join('')+'</select>';
 const number=(key,val,low,high)=>'<input type="number" data-mf448-key="'+key+'" inputmode="numeric" min="'+low+'" max="'+high+'" step="1" value="'+val+
  '" onchange="App.mf448Set(\''+key+'\',Math.max('+low+',Math.min('+high+',Number(this.value)||'+low+')))">';
 const check=(key,on,title)=>'<label class="mf448-checkbox"><input type="checkbox" data-mf448-key="'+key+'" '+(on?'checked ':'')+
  'onchange="App.mf448Set(\''+key+'\',this.checked)">'+title+'</label>';
 return '<section class="mf448-settings" data-mf-setting-id="smart-recovery" aria-label="Smart Auto-Fill Recovery">'+
  '<header><span>'+mf425Icon('shield',19)+'</span><div><strong>Smart Auto-Fill & Automatic Recovery</strong>'+
  '<small>Confidence gates, opt-in automation and protected manual review</small></div></header>'+
  '<div class="mf448-grid">'+
  (isCover?'<div class="mf448-policy"><strong>'+mf425Icon('images',16)+' Cover auto-fill</strong>'+
    '<label>Automatic selection policy'+select('coverPolicy',[
     ['original','Verified ID matching (existing behavior)'],
     ['strict','Strict ID-verified / no competing artwork'],
     ['review','Manual review for every candidate']],p.coverPolicy)+'</label>'+
    '<label>Strict minimum confidence (%)'+number('coverConfidence',p.coverConfidence,95,99)+'</label>'+
    check('dashboardAutoSave',p.dashboardAutoSave,'Dashboard: automatically save one uniquely ID-verified cover and advance to next title')+
    '<small>Existing covers are never automatically replaced. Manual matches remain available.</small></div>':'')+
  (isMeta?'<div class="mf448-policy"><strong>'+mf425Icon('database',16)+' Metadata auto-fill</strong>'+
    '<label>Batch behavior'+select('metadataPolicy',[
     ['original','Fill verified missing fields (existing behavior)'],
     ['review','Review all candidates manually; no batch writes']],p.metadataPolicy)+'</label>'+
    '<label>Minimum evidence confidence (%)'+number('metadataConfidence',p.metadataConfidence,94,99)+'</label>'+
    check('collectReviews',p.collectReviews,'Remember ambiguous / conflicting title matches for manual review')+
    '<small>Only empty, unprotected, agreed-upon fields can auto-fill. Personal ratings, progress and existing values remain protected.</small></div>':'')+
  '</div><div class="mf448-tools"><button class="btn btn-ghost" type="button" onclick="App.mf448OpenReviews()">'+
  mf425Icon('search',15)+' Metadata review queue ('+mf448ReadReviews().length+')</button>'+
  '<small>Saved per account in this browser · up to 250 review references</small></div></section>';
}
const mf448OriginalPanel=mf445Panel;
mf445Panel=function(mode){
 const result=mf448OriginalPanel.apply(this,arguments);
 const root=document.getElementById('mf445-workspace'),panel=root?.querySelector('[data-mf445-panel]');
 if(panel&&!panel.querySelector('.mf448-settings')){
  const anchor=panel.querySelector('.mf445-actions');
  if(anchor)anchor.insertAdjacentHTML('beforebegin',mf448ConfigHtml(mode==='both'?'both':mode));
 }
 return result;
};
App.mf445Panel=mf445Panel;
const mf448OriginalWorkspace=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=mf448OriginalWorkspace.apply(this,arguments),anchor='<fieldset class="mf447-settings-shortcuts">';
 return html.includes(anchor)?html.replace(anchor,mf448ConfigHtml('both')+anchor):html+mf448ConfigHtml('both');
};
const mf448OriginalMetadataSettings=mf439SettingsHtml;
mf439SettingsHtml=function(){
 const html=mf448OriginalMetadataSettings.apply(this,arguments);
 return html.replace('<div id="mf439-batch-status"',mf448ConfigHtml('metadata')+'<div id="mf439-batch-status"');
};
function mf448OpenReviews(){
 document.getElementById('mf448-review-dialog')?.remove();
 const catalog=new Map((S.library||[]).filter(item=>item?.id!=null).map(item=>[String(item.id),item]));
 const rows=mf448ReadReviews().slice().reverse().filter(x=>catalog.has(x.id));
 const root=document.createElement('div');root.id='mf448-review-dialog';root.className='mf424-modal mf425-themed mf448-review-overlay';
 root.innerHTML='<div class="mf424-shade" data-mf448-close></div>'+
  '<section class="mf424-dialog mf448-dialog" role="dialog" aria-modal="true" aria-label="Metadata candidates requiring manual review">'+
  '<header><div><small>SMART RECOVERY</small><h2>'+mf425Icon('search',20)+' Metadata review queue</h2>'+
  '<p>Low-confidence, conflicting or manual-review candidates. Nothing in this list is automatically written.</p></div>'+
  '<button type="button" class="btn btn-ghost" data-mf448-close>'+mf425Icon('x',17)+' Close</button></header>'+
  '<div class="mf448-review-list">'+(rows.length?rows.map(x=>{
   const item=catalog.get(x.id);
   return '<div class="mf448-review-row"><span><strong>'+mf424Escape(item?.title||x.id)+'</strong>'+
    '<small>'+mf424Escape(x.reason.replace(/-/g,' '))+' · '+Number(x.fields)+' fields · '+new Date(x.at).toLocaleString()+'</small></span>'+
    '<button type="button" class="btn btn-sm" onclick="App.mf448PreviewReview('+mf424Escape(JSON.stringify(x.id))+')">'+
    mf425Icon('search',15)+' Preview</button></div>';
  }).join(''):'<p class="mf448-empty">No titles need manual metadata review yet.</p>')+'</div>'+
  '<div class="mf448-review-footer"><button type="button" class="btn btn-ghost" onclick="App.mf448ClearReviews()">'+mf425Icon('x',15)+' Clear review list</button></div></section>';
 root.querySelectorAll('[data-mf448-close]').forEach(el=>el.addEventListener('click',()=>mf448CloseReviews()));
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();mf448CloseReviews();}});
 document.body.appendChild(root);root.querySelector('[data-mf448-close]')?.focus();
}
function mf448CloseReviews(){document.getElementById('mf448-review-dialog')?.remove();}
function mf448PreviewReview(id){
 const record=mf448ReadReviews().find(x=>x.id===String(id));
 if(!record||(S.library||[]).every(x=>String(x?.id)!==String(id))){showToast('The selected Library title is no longer available.');return;}
 mf448CloseReviews();mf445Close();
 return mf445OriginalMetadataOpen(String(id)); // Original single-title evidence preview.
}
async function mf448ClearReviews(){
 const count=mf448ReadReviews().length;
 if(count&&!await mf444Confirm('Clear metadata review references?',
  'Remove '+count+' review shortcuts from this browser. Saved metadata and ongoing recovery checkpoints will not change.',
  'Clear review list',true,count,'metadata'))return;
 MF448.reviewQueue=[];mf448StoreReviews();mf448OpenReviews();
}
Object.assign(App,{mf448Set,mf448OpenReviews,mf448CloseReviews,mf448PreviewReview,mf448ClearReviews});
window.MediaFlowV448=Object.freeze({version:448,prefs:mf448Prefs,
 settings:mf448ConfigHtml,review:mf448ReadReviews,strictPolicy:mf448PolicyCover,
 metadataPolicy:mf448PolicyMetadata});
