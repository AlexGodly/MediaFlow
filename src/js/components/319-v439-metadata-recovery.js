/* MediaFlow v439 — evidence-based, per-field metadata recovery.
 * Never infer a provider from custom Library categories. Recovery never changes
 * personal rating, Library progress/total, tracking status, History, XP or cover.
 * Single-title preview and bounded, resumable missing-field batches. */
const MF439_VERSION=439;
const MF439_DEFAULT={
 enabled:['jikan','anilist','kitsu','tvmaze','openlibrary','gutendex','itunes','steam','vndb','musicbrainz',...MF439_GATEWAY],
 batchSize:25,maxBatch:250,minimumConfidence:0.94,manualReview:true
};
const MF439={preview:null,job:null,working:false,cancel:false,pane:'',account:'',results:[],lastError:'',startedAt:0};
const mf439Esc=value=>mf424Escape(String(value??''));
const mf439Has=v=>v!=null&&v!==''&&!(Array.isArray(v)&&!v.length);
function mf439Preferences(){
 const data=S.settings?.v439Metadata||{};
 return {...MF439_DEFAULT,...data,
  enabled:Array.isArray(data.enabled)?data.enabled.filter(x=>typeof x==='string'):MF439_DEFAULT.enabled.slice(),
  batchSize:Math.max(1,Math.min(100,Math.floor(Number(data.batchSize)||25))),
  maxBatch:Math.max(1,Math.min(250,Math.floor(Number(data.maxBatch)||250)))};
}
function mf439Item(id){return (S.library||[]).find(x=>String(x?.id)===String(id))||null;}
function mf439Account(){return String(AUTH_USER?.id||'local');}
function mf439StateKey(){return 'mediaflow-v439-job:'+mf439Account();}
function mf439LeaseKey(){return 'mediaflow-v439-lock:'+mf439Account();}
function mf439SaveJob(){
 if(!MF439.job)return;
 try{localStorage.setItem(mf439StateKey(),JSON.stringify(MF439.job));}
 catch(e){console.warn('Metadata checkpoint could not be stored',e);}
}
function mf439ReadJob(){
 try{const x=JSON.parse(localStorage.getItem(mf439StateKey())||'null');
  if(!x||x.schema!==1||x.account!==mf439Account()||!Array.isArray(x.ids)||x.ids.length>250)return null;
  return x;
 }catch(_){return null;}
}
function mf439AcquireLease(){
 try{const current=JSON.parse(localStorage.getItem(mf439LeaseKey())||'null');
  if(current&&current.expires>Date.now()&&current.token!==MF439.lease)return false;
  const token=MF439.lease||('mf439-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  MF439.lease=token;
  localStorage.setItem(mf439LeaseKey(),JSON.stringify({token,expires:Date.now()+45000}));
  const check=JSON.parse(localStorage.getItem(mf439LeaseKey())||'null');
  return check?.token===token;
 }catch(_){return false;}
}
function mf439ReleaseLease(){
 try{const state=JSON.parse(localStorage.getItem(mf439LeaseKey())||'null');
  if(state?.token===MF439.lease)localStorage.removeItem(mf439LeaseKey());
 }catch(_){}
 MF439.lease='';
}
function mf439Evidence(item,result){
 if(!result?.recordId||!result.title)return {confidence:0,reason:'No verified provider record'};
 const names=mf439TitleVariants(item).map(mf439Norm).filter(Boolean);
 const recordNames=[result.title,...(result.aliases||[])].map(mf439Norm).filter(Boolean);
 const exact=names.some(t=>recordNames.includes(t));
 const ids=item.externalIds||{};
 let idMatch=false,idConflict=false;
 for(const [key,v] of Object.entries(result.externalIds||{})){
  if(!v||!ids[key])continue;
  if(String(ids[key]).toLowerCase()===String(v).toLowerCase())idMatch=true;
  else idConflict=true;
 }
 if(idConflict)return {confidence:0,reason:'Saved External ID conflicts with provider result'};
 const userYear=mf439Year(item.year||item.releaseDate),recordYear=mf439Year(result.year);
 if(userYear&&recordYear&&userYear!==recordYear)
  return {confidence:idMatch?0.78:0.48,reason:'Conflicting release years · manual review'};
 if(!exact)return {confidence:idMatch?0.78:0,reason:idMatch?'Matching saved ID, but title differs · manual review':'Title did not match'};
 if(idMatch)return {confidence:1,reason:'Exact title and confirmed external ID'};
 if(userYear&&recordYear&&userYear===recordYear)return {confidence:0.97,reason:'Exact title and release year'};
 return {confidence:0.89,reason:'Exact title only · manual review'};
}
const MF439_LEGACY_FIELDS={
 synopsis:{label:'Synopsis / Description',kind:'text'},
 genres:{label:'Genres',kind:'list'},studios:{label:'Studios',kind:'list'},
 producers:{label:'Producers',kind:'list'},themes:{label:'Themes',kind:'list'},
 year:{label:'Release year',kind:'number'},releaseDate:{label:'Release date',kind:'text'},
 mediaFormat:{label:'Media format',kind:'text'},durationMinutes:{label:'Duration (minutes)',kind:'number'},
 seasonLabel:{label:'Season',kind:'text'},ageRating:{label:'Age rating',kind:'text'},
 demographic:{label:'Demographic',kind:'text'},mediaSource:{label:'Source material',kind:'text'}
};
function mf439FieldDefinition(token){
 if(token.startsWith('legacy.'))return MF439_LEGACY_FIELDS[token.slice(7)]||null;
 if(token.startsWith('field.')){
  const row=MF437_FIELD_MAP.get(token.slice(6));return row?{label:row[1],kind:row[2]||'text'}:null;
 }
 if(token.startsWith('rating.')){
  const row=MF437_RATING_MAP.get(token.slice(7));return row?{label:row[1]+' rating',kind:'rating'}:null;
 }
 return null;
}
function mf439FieldValue(item,token){
 if(token.startsWith('legacy.'))return item[token.slice(7)];
 const env=item.universalMetadata||{};
 if(token.startsWith('field.'))return env.fields?.[token.slice(6)];
 if(token.startsWith('rating.'))return env.externalRatings?.[token.slice(7)];
}
function mf439IsProtected(item,token){
 if(token.startsWith('legacy.'))return item.richMetadataManual?.[token.slice(7)]===true;
 return item.universalMetadata?.locks?.[token]===true||
  item.universalMetadata?.provenance?.[token]?.source==='manual';
}
function mf439Value(token,input){
 const def=mf439FieldDefinition(token);
 if(!def)return null;
 if(def.kind==='rating'){
  const x=input&&typeof input==='object'?input:null;
  if(!x||x.score==null)return null;
  const scale=Number(x.scale),score=Number(x.score);
  if(!Number.isFinite(score)||!Number.isFinite(scale)||scale<=0||scale>100||score<0||score>scale)return null;
  const votes=x.votes==null?null:Number(x.votes);
  return {score,scale,votes:Number.isSafeInteger(votes)&&votes>=0?votes:null};
 }
 if(def.kind==='number'){
  const n=Number(input);return Number.isFinite(n)&&n>0&&n<1e9?n:null;
 }
 if(def.kind==='list'){
  const arr=Array.isArray(input)?input:String(input||'').split(',');
  const rows=mf439StringList(arr,40);
  return rows.length?rows:null;
 }
 const s=mf439Plain(input,token==='legacy.synopsis'?6000:750);
 return s||null;
}
function mf439ValueKey(value){
 if(value&&typeof value==='object'&&!Array.isArray(value))
  return JSON.stringify([value.score,value.scale,value.votes]);
 if(Array.isArray(value))return JSON.stringify(value.map(mf439Norm).sort());
 return String(value??'').trim().toLocaleLowerCase();
}
function mf439Proposals(item,results){
 const bucket=new Map(),errors=[];
 for(const row of results){
  const evidence=mf439Evidence(item,row);
  if(evidence.confidence<0.7){errors.push({provider:row.provider,reason:evidence.reason});continue;}
  const source={provider:row.provider,recordId:row.recordId,recordTitle:row.title,
   evidence:evidence.reason,confidence:evidence.confidence,year:row.year};
  for(const [scope,values] of [['legacy',row.legacy],['field',row.fields],['rating',row.ratings]]){
   for(const [key,original] of Object.entries(values||{})){
    const token=scope+'.'+key,value=mf439Value(token,original);
    if(!mf439Has(value))continue;
    if(!bucket.has(token))bucket.set(token,new Map());
    const choices=bucket.get(token),fingerprint=mf439ValueKey(value);
    const prev=choices.get(fingerprint);
    if(prev){prev.sources.push(source);prev.confidence=Math.max(prev.confidence,source.confidence);}
    else choices.set(fingerprint,{value,sources:[source],confidence:source.confidence});
   }
  }
 }
 const proposals=[];
 for(const [token,map] of bucket){
  const options=[...map.values()].sort((a,b)=>b.confidence-a.confidence||b.sources.length-a.sources.length);
  const old=mf439FieldValue(item,token),present=mf439Has(old?.score??old);
  const protectedField=mf439IsProtected(item,token);
  const same=options.every(opt=>mf439ValueKey(opt.value)===mf439ValueKey(old));
  const disagree=options.length>1;
  const best=options[0];
  // NEVER automatically modify any populated value, protected field,
  // ambiguous source disagreement, or exact-title-only match.
  const auto=!present&&!protectedField&&!disagree&&best.confidence>=mf439Preferences().minimumConfidence;
  proposals.push({token,label:mf439FieldDefinition(token)?.label||token,options,
   original:old,hasOriginal:present,protected:protectedField,disagree,same,
   selected:!same&&auto,choice:0,status:protectedField?'protected':same?'unchanged':
    present?'existing':disagree?'conflict':auto?'ready':'review'});
 }
 proposals.sort((a,b)=>a.token==='legacy.synopsis'?-1:b.token==='legacy.synopsis'?1:a.token.localeCompare(b.token));
 return {titleId:String(item.id),title:item.title,createdAt:Date.now(),proposals,errors,
  providers:[...new Set(results.map(r=>r.provider))],results:results.length};
}
async function mf439Discover(item,providers,onProgress=()=>{},signal){
 const results=[],failures=[];
 for(const provider of providers){
  if(signal?.aborted)break;
  onProgress(provider,results.length);
  try{
   const found=MF439_GATEWAY.includes(provider)?
     await mf439LookupGateway(provider,item):await mf439LookupPublic(provider,item,signal);
   for(const row of found||[])results.push(row);
  }catch(e){failures.push({provider,reason:String(e?.message||e).slice(0,180)});}
 }
 return {results,failures,preview:mf439Proposals(item,results)};
}
function mf439Apply(item,preview,mode='review'){
 if(!item||!preview||String(preview.titleId)!==String(item.id))return {changed:0,reason:'Title changed'};
 if(mf439Account()!==MF439.account&&MF439.account)return {changed:0,reason:'Account changed'};
 let count=0,legacy=0,fields=0,ratings=0;
 const env=mf437Normalized(item.universalMetadata);
 const timestamp=Date.now();
 for(const prop of preview.proposals||[]){
  if(!prop.selected||prop.same||prop.protected||mf439IsProtected(item,prop.token))continue;
  const choice=prop.options?.[prop.choice]||prop.options?.[0],src=choice?.sources?.[0];
  if(!choice||!src||src.confidence<0.7)continue;
  if(mode==='automatic'&&(prop.hasOriginal||prop.disagree||src.confidence<mf439Preferences().minimumConfidence))continue;
  // Even an explicit review must never silently replace a preexisting value.
  if(prop.hasOriginal)continue;
  const current=mf439FieldValue(item,prop.token);
  if(mf439Has(current?.score??current))continue;
  let applied=false;
  if(prop.token.startsWith('legacy.')){
   const key=prop.token.slice(7);
   if(!MF439_LEGACY_FIELDS[key])continue;
   item[key]=JSON.parse(JSON.stringify(choice.value));
   legacy++;
   count++;applied=true;
  }else if(prop.token.startsWith('field.')){
   if(mf437SetField(env,prop.token.slice(6),choice.value,{source:src.provider,verified:true,updatedAt:timestamp})){
    fields++;count++;applied=true;
   }
  }else if(prop.token.startsWith('rating.')){
   if(mf437SetRating(env,prop.token.slice(7),choice.value,{source:src.provider,verified:true,updatedAt:timestamp})){
    ratings++;count++;applied=true;
   }
  }
  if(applied) {
   env.provenance[prop.token]={source:src.provider,verified:true,
    recordId:src.recordId,evidence:src.evidence,updatedAt:timestamp};
  }
 }
 if(count){
  item.universalMetadata=env;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,timestamp);
  item.v439RecoveryHistory=(Array.isArray(item.v439RecoveryHistory)?item.v439RecoveryHistory:[]).slice(-24);
  item.v439RecoveryHistory.push({at:timestamp,legacy,fields,ratings,
   providers:[...new Set(preview.proposals.filter(p=>p.selected).flatMap(p=>p.options[p.choice]?.sources?.map(s=>s.provider)||[]))].slice(0,20)});
 }
 return {changed:count,legacy,fields,ratings};
}
function mf439DescribeValue(token,val){
 if(val==null||val==='')return '—';
 if(token.startsWith('rating.'))return String(val.score)+' / '+String(val.scale)+(val.votes!=null?' · '+Number(val.votes).toLocaleString()+' votes':'');
 if(Array.isArray(val))return val.join(', ');
 return String(val).slice(0,3200);
}
function mf439PreviewHtml(){
 const state=MF439.preview;
 if(!state)return '';
 const panel=state.preview;
 return '<div class="mf439-recovery-preview"><div class="mf439-summary"><strong>'+mf439Esc(panel.title)+'</strong><small>'+
  panel.results+' source records · '+panel.proposals.length+' fields · '+panel.providers.length+' responding providers</small></div>'+
  '<p class="mf439-copy">Only previously empty, unprotected fields can be saved. Conflicting values require your choice; metadata already in your Library is never overwritten. Scores remain separate from your personal rating.</p>'+
  (state.failures?.length?'<details class="mf439-errors"><summary>'+state.failures.length+' provider issue(s)</summary>'+state.failures.map(x=>'<p>'+mf439Esc(x.provider)+': '+mf439Esc(x.reason)+'</p>').join('')+'</details>':'')+
  (panel.errors.length?'<details class="mf439-errors"><summary>'+panel.errors.length+' unconfirmed title match(es)</summary>'+panel.errors.map(x=>'<p>'+mf439Esc(x.provider)+' · '+mf439Esc(x.reason)+'</p>').join('')+'</details>':'')+
  (panel.proposals.length?'<div class="mf439-fields">'+panel.proposals.map((p,i)=>{
   const opt=p.options[p.choice]||p.options[0],source=opt?.sources||[];
   const chooser=p.options.length>1?'<select aria-label="Source for '+mf439Esc(p.label)+'" onchange="App.mf439Choose('+i+',this.value)">'+p.options.map((o,j)=>'<option value="'+j+'" '+(j===p.choice?'selected':'')+'>'+mf439Esc(o.sources.map(s=>s.provider).join(' + '))+' · '+mf439Esc(mf439DescribeValue(p.token,o.value)).slice(0,100)+'</option>').join('')+'</select>':'';
   return '<div class="mf439-proposal" data-mf439-token="'+mf439Esc(p.token)+'">'+
    '<div class="mf439-proposal-head"><label><input type="checkbox" '+(p.selected?'checked':'')+
    (p.protected||p.same||p.hasOriginal?' disabled':'')+
    ' onchange="App.mf439Toggle('+i+',this.checked)"><strong>'+mf439Esc(p.label)+'</strong></label>'+
    '<span class="mf439-proposal-status mf439-status-'+mf439Esc(p.status)+'">'+mf439Esc(p.status)+'</span></div>'+
    '<small>Current: '+mf439Esc(mf439DescribeValue(p.token,p.original)).slice(0,270)+'</small>'+
    '<div class="mf439-candidate">'+mf439Esc(mf439DescribeValue(p.token,opt?.value))+'</div>'+
    '<div class="mf439-evidence">'+mf439Esc(source.map(s=>s.provider+' · '+s.evidence).join(' / '))+'</div>'+
    chooser+'</div>';
  }).join('')+'</div>':'<p class="mf439-empty">No usable confirmed metadata fields were returned.</p>')+
  '<div class="mf439-preview-actions"><button type="button" class="btn btn-ghost" onclick="App.mf439Close()">Close</button>'+
   '<button type="button" class="btn btn-primary" onclick="App.mf439Save()" '+(panel.proposals.some(p=>p.selected)?'':'disabled')+'>'+mf425Icon('check')+' Save selected missing fields</button></div></div>';
}
function mf439Dialog(title,body){
 let root=document.getElementById('mf439-recovery-modal');
 if(!root){root=document.createElement('div');root.id='mf439-recovery-modal';root.className='mf424-modal mf439-modal mf425-themed';
  document.body.appendChild(root);}
 root.innerHTML='<div class="mf424-shade" onclick="App.mf439Close()"></div>'+
  '<section class="mf424-dialog mf439-dialog" role="dialog" aria-modal="true" aria-label="Metadata Recovery">'+
  '<header class="mf439-head"><div><small>METADATA RECOVERY</small><h2>'+mf425Icon('database',23)+' '+mf439Esc(title)+'</h2></div>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf439Close()">'+mf425Icon('x')+' Close</button></header>'+
  '<div class="mf439-dialog-body" id="mf439-dialog-body">'+body+'</div></section>';
}
function mf439Close(){MF439.controller?.abort();document.getElementById('mf439-recovery-modal')?.remove();}
async function mf439Open(id){
 const item=mf439Item(id);
 if(!item){showToast('Select an existing Library title for Metadata Recovery.');return;}
 if(MF439.working){showToast('A recovery operation is already running.');return;}
 MF439.account=mf439Account();MF439.preview=null;
 mf439Dialog('Recover metadata · '+item.title,'<div class="mf439-loading">'+mf425Icon('search')+' Finding verified metadata sources…</div><p id="mf439-probe-status" role="status">Preparing source matches.</p>');
 const enabled=mf439Preferences().enabled;
 const controller=new AbortController();MF439.controller=controller;MF439.working=true;
 try{
  const data=await mf439Discover(item,enabled,provider=>{
   const label=document.getElementById('mf439-probe-status');
   if(label)label.textContent='Checking '+(MF438_EXTRA_CATALOG.find(x=>x[0]===provider)?.[1]||provider)+'…';
  },controller.signal);
  if(controller.signal.aborted||MF439.account!==mf439Account())return;
  MF439.preview={...data,itemId:String(item.id)};
  const body=document.getElementById('mf439-dialog-body');
  if(body)body.innerHTML=mf439PreviewHtml();
 }catch(e){
  const body=document.getElementById('mf439-dialog-body');
  if(body)body.textContent='Metadata recovery failed: '+String(e?.message||e);
 }finally{MF439.working=false;MF439.controller=null;}
}
function mf439Toggle(index,on){
 const p=MF439.preview?.preview?.proposals?.[Number(index)];
 if(!p||p.protected||p.same||p.hasOriginal)return;
 p.selected=Boolean(on);
 document.querySelector('.mf439-preview-actions button.btn-primary')?.toggleAttribute('disabled',!MF439.preview.preview.proposals.some(x=>x.selected));
}
function mf439Choose(index,value){
 const p=MF439.preview?.preview?.proposals?.[Number(index)],i=Number(value);
 if(!p||!Number.isInteger(i)||i<0||i>=p.options.length)return;
 p.choice=i;p.selected=false;
 const body=document.getElementById('mf439-dialog-body');if(body)body.innerHTML=mf439PreviewHtml();
}
function mf439Save(){
 const item=mf439Item(MF439.preview?.itemId);
 if(!item||!MF439.preview)return;
 if(mf439Account()!==MF439.account){showToast('Account changed; reopen recovery.');return;}
 const result=mf439Apply(item,MF439.preview.preview,'review');
 if(result.changed){
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();render();
  showToast(result.changed+' metadata field'+(result.changed===1?'':'s')+' recovered safely.');
 }else showToast('No eligible missing fields selected. Existing metadata was preserved.');
 mf439Close();
}
function mf439Available(){
 return [...new Set([...Object.keys(MF439_PUBLIC),...MF439_GATEWAY])];
}
function mf439SettingsHtml(){
 const prefs=mf439Preferences();
 return '<div class="mf439-settings" data-mf-setting-id="metadata-recovery">'+
  '<div class="mf439-settings-head">'+mf425Icon('database',22)+'<div><strong>Metadata Recovery</strong><p>Fill missing fields from verified providers without overwriting existing metadata.</p></div></div>'+
  '<p>Each provider contributes only the fields it actually returns. Conflicts and uncertain matches are reviewed rather than guessed. Custom Library categories never restrict available sources.</p>'+
  '<fieldset><legend>Metadata providers</legend><div class="mf439-provider-list">'+mf439Available().map(id=>{
   const gateway=MF439_GATEWAY.includes(id),status=gateway?mf434ProviderStatus(id):null;
   const ready=!gateway||Boolean(status?.configured&&status?.testable);
   return '<label><input type="checkbox" value="'+mf439Esc(id)+'" data-mf439-provider '+(prefs.enabled.includes(id)?'checked':'')+
    ' onchange="App.mf439SaveSettings()"><span><strong>'+mf439Esc(id)+'</strong><small>'+
    (gateway?(ready?'Configured gateway · ready without testing':status&&!status.testable?'Integration unavailable / under review':status&&!status.configured?'Credential missing · setup needed':'Gateway status pending · automatically checked at recovery'):'Public · ready without testing; browser CORS/quotas apply')+
    '</small></span></label>';
  }).join('')+'</div></fieldset>'+
  '<label>Maximum titles per manual batch (up to 250)<input id="mf439-max-batch" type="number" min="1" max="250" step="1" value="'+prefs.maxBatch+'" onchange="App.mf439SaveSettings()"></label>'+
  '<div class="mf439-settings-actions"><button type="button" class="btn btn-ghost" onclick="App.mf439OpenSelected()">Preview selected Library title</button>'+
  '<button type="button" class="btn btn-primary" onclick="App.mf439ConfirmBatch()">Start safe missing-field batch</button></div>'+
  '<p class="mf439-settings-tip">Batch fills only missing fields with high-confidence, nonconflicting evidence. Existing fields, manually protected descriptions and personal ratings are never replaced. Start with a small selection; API rate limits apply.</p>'+
  '<div id="mf439-batch-status" role="status" aria-live="polite"></div>'+
  '</div>';
}
function mf439SettingsEnhance(){
 if(String(S.view||'')!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('[data-mf365-section="v221-settings-metadata-recovery"]'))return;
 const body=document.createElement('div');body.innerHTML=mf439SettingsHtml();
 window.MediaFlowSettingsRegistry?.registerSetting?.({id:'metadata-recovery',section:'v221-settings-metadata-recovery',selector:'[data-mf-setting-id="metadata-recovery"]',
  label:'Metadata Recovery options and safe batch',keywords:['synopsis description external ratings protection providers']});
 window.MediaFlowSettingsCenter.mountSection({id:'v221-settings-metadata-recovery',title:'METADATA RECOVERY',category:'library',
  subgroup:'Library maintenance',keywords:['metadata','synopsis','genres','ratings','recovery'],nodes:[body]});
 mf439PaintJob();
}
function mf439SaveSettings(){
 const allowed=new Set(mf439Available()),checked=[...document.querySelectorAll('[data-mf439-provider]:checked')]
  .map(x=>x.value).filter(x=>allowed.has(x));
 const max=Math.max(1,Math.min(250,Number(document.getElementById('mf439-max-batch')?.value)||250));
 S.settings=S.settings||{};S.settings.v439Metadata={...mf439Preferences(),enabled:checked,maxBatch:Math.floor(max)};
 Promise.resolve(saveState()).catch(e=>console.warn('Metadata settings save failed',e));
}
function mf439OpenSelected(){
 const ids=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 if(ids.length===1){mf439Open(ids[0]);return;}
 showToast(ids.length?'Select exactly one Library title to preview.':'Select a Library title, then open Metadata Recovery.');
}
function mf439BatchCandidates(){
 const selected=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 if(!selected.length)return [];
 const known=new Set(selected.map(String)),max=mf439Preferences().maxBatch;
 return (S.library||[]).filter(x=>x?.id!=null&&known.has(String(x.id))).slice(0,max).map(x=>String(x.id));
}
function mf439ConfirmBatch(){
 if(MF439.working){showToast('Metadata Recovery already running.');return;}
 const ids=mf439BatchCandidates();
 if(!ids.length){showToast('Check Library titles first. Batches require an explicit selection.');return;}
 if(!mf439Preferences().enabled.length){showToast('Enable at least one metadata provider.');return;}
 if(!confirm('Recover missing metadata for '+ids.length+' selected title(s)? Existing values and protected fields will be preserved. This may take time due to public API rate limits.'))return;
 MF439.job={schema:1,account:mf439Account(),ids,cursor:0,changed:0,completed:0,errors:[],startedAt:Date.now(),status:'running'};
 mf439SaveJob();mf439RunBatch();
}
async function mf439RunBatch(){
 if(MF439.working||!MF439.job||!['running','paused'].includes(MF439.job.status))return;
 if(!mf439AcquireLease()){showToast('Another MediaFlow tab is already recovering metadata.');return;}
 MF439.account=mf439Account();MF439.working=true;MF439.cancel=false;
 MF439.job.status='running';mf439SaveJob();mf439PaintJob();
 try{
  while(MF439.job.cursor<MF439.job.ids.length&&!MF439.cancel){
   if(MF439.account!==mf439Account()){MF439.job.status='paused';break;}
   if(!mf439AcquireLease()){MF439.job.status='paused';break;}
   const id=MF439.job.ids[MF439.job.cursor],item=mf439Item(id);
   if(item){
    const {preview,failures}=await mf439Discover(item,mf439Preferences().enabled,()=>{},null);
    const result=mf439Apply(item,preview,'automatic');
    if(result.changed){MF439.job.changed+=result.changed;persistLibrary();}
    if(failures.length)MF439.job.errors.push({titleId:id,failures:failures.slice(0,5)});
    if(MF439.job.errors.length>50)MF439.job.errors=MF439.job.errors.slice(-50);
   }
   MF439.job.completed++;MF439.job.cursor++;
   mf439SaveJob();mf439PaintJob();
  }
  if(MF439.job.cursor===MF439.job.ids.length)MF439.job.status='completed';
  else MF439.job.status='paused';
 }catch(e){MF439.job.status='paused';MF439.job.errors.push({reason:String(e?.message||e)});}
 finally{
  MF439.working=false;mf439ReleaseLease();mf439SaveJob();mf439PaintJob();
  if(MF439.job?.changed)try{v53InvalidateLibraryCache();render();}catch(_){}
 }
}
function mf439Pause(){MF439.cancel=true;MF439.controller?.abort();if(MF439.job)MF439.job.status='paused';mf439SaveJob();mf439PaintJob();}
function mf439Resume(){
 if(MF439.working)return;
 MF439.job=mf439ReadJob();
 if(!MF439.job||MF439.job.status==='completed')return;
 MF439.job.status='running';mf439RunBatch();
}
function mf439Discard(){
 if(MF439.working){showToast('Pause recovery first.');return;}
 if(!confirm('Clear the saved metadata recovery checkpoint? Previously recovered fields will remain saved.'))return;
 MF439.job=null;
 try{localStorage.removeItem(mf439StateKey());}catch(_){}
 mf439PaintJob();
}
function mf439PaintJob(){
 const root=document.getElementById('mf439-batch-status');
 if(!root)return;
 const job=MF439.job||mf439ReadJob();
 if(!job){root.innerHTML='';return;}
 const pct=job.ids.length?Math.floor(job.cursor/job.ids.length*100):100;
 root.innerHTML='<div class="mf439-job"><strong>Metadata batch · '+mf439Esc(job.status)+'</strong>'+
  '<p>'+job.cursor+' / '+job.ids.length+' titles · '+job.changed+' missing fields recovered</p>'+
  '<progress max="100" value="'+pct+'">'+pct+'%</progress>'+
  (job.errors.length?'<small>'+job.errors.length+' title(s) with provider warnings. Completed metadata remains saved.</small>':'')+
  '<div class="mf439-job-actions">'+(MF439.working?'<button class="btn btn-ghost" onclick="App.mf439Pause()">Pause after current title</button>':
   job.status==='completed'?'':'<button class="btn btn-primary" onclick="App.mf439Resume()">Resume</button>')+
  (MF439.working?'':'<button class="btn btn-ghost" onclick="App.mf439Discard()">Clear checkpoint</button>')+'</div></div>';
}
/* Per-title UI shortcuts are additive; no changes to standard title saving. */
const mf439EditorBase=libraryModalHtml;
libraryModalHtml=function(item){
 const html=mf439EditorBase.apply(this,arguments);
 if(!item?.id)return html;
 return html.replace('<section class="mf437-editor"', '<div class="mf439-editor-action"><button type="button" class="btn btn-ghost" onclick="App.mf439Open(\''+
  mf439Esc(String(item.id)).replace(/'/g,'&#39;')+'\')">'+mf425Icon('search')+' Fix Metadata</button></div><section class="mf437-editor"');
};
const mf439DetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=mf439DetailsBase.apply(this,arguments);
 if(!item?.id)return html;
 const marker='class="v181-detail-actions"';
 const action='<button type="button" class="btn btn-ghost" onclick="App.mf439Open(\''+
   mf439Esc(String(item.id)).replace(/'/g,'&#39;')+'\')">'+mf425Icon('search')+' Fix Metadata</button>';
 return html.includes(marker)?html.replace(marker,marker+' data-mf439-details-action="1"') .replace(/(<div class="v181-detail-actions"[^>]*>)/,'$1'+action):html;
};
Object.assign(App,{mf439Open,mf439Close,mf439Save,mf439Toggle,mf439Choose,
 mf439SaveSettings,mf439OpenSelected,mf439ConfirmBatch,mf439Pause,mf439Resume,mf439Discard});
MediaFlowRuntime.registerPageEnhancer('settings',mf439SettingsEnhance);
const mf439BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const backup=mf439BackupBase.apply(this,arguments);
 if(backup){
  backup.mediaFlowVersion=439;backup.backupVersion=439;
  const manifest=backup.backupManifest||(backup.backupManifest={});
  manifest.includes={...(manifest.includes||{}),metadataRecoveryProvenance:true,metadataRecoveryHistory:true};
  manifest.v439={schemaVersion:1,metadataRecoveredFieldsProtected:true,
    explicitBatchCheckpointsStoredLocally:true,synopsisUsesExistingField:true};
 }
 return backup;
};
window.MediaFlowV439=Object.freeze({
 version:439,renderSettings:mf439SettingsHtml,renderPreview:mf439PreviewHtml,match:mf439Evidence,plan:mf439Proposals,apply:mf439Apply,
 getProviders:mf439Available,discover:mf439Discover,
 preview:()=>MF439.preview,job:()=>MF439.job||mf439ReadJob()
});
