/* MediaFlow v439 — Smart Multi-Provider Metadata Recovery.
 * A read-only recovery proposal becomes a write ONLY by explicit review or
 * optional safe auto-fill with independently verified exact identity.
 * No category guesses, invented provider scores, personal-rating writes,
 * user-progress changes, XP awards, or automatic replacement of manual data.
 */
const MF439_RELEASE=439;
const MF439={busy:false,running:false,pause:false,stop:false,account:'',job:null,preview:null,
 results:[],errors:[],activeId:'',selected:new Set(),confirm:new Set(),picked:{},mode:'manual',
 status:'idle',requestToken:0,lockToken:'',lockTimer:null};
const MF439_FIELDS_LABELS=new Map(MF437_FIELDS.flatMap(g=>g[2].map(f=>[f[0],f[1]])));
for(const [key,label] of [['synopsis','Synopsis / description'],['genres','Genres'],
 ['studios','Studios'],['producers','Producers'],['themes','Themes'],
 ['year','Year'],['releaseDate','Release date'],['durationMinutes','Runtime (minutes)'],
 ['mediaFormat','Media format'],['mediaSource','Source material'],['ageRating','Age rating'],
 ['demographic','Demographic']])MF439_FIELDS_LABELS.set(key,label);
const mf439E=v=>mf424Escape(String(v??''));
const mf439Account=()=>String(AUTH_USER?.id||'');
function mf439Settings(){
 const saved=S.settings?.v439MetadataRecovery||{};
 return {autoFill: saved.autoFill===true,maxTitles:Math.min(100,Math.max(1,Number(saved.maxTitles)||20)),
  sources:Array.isArray(saved.sources)?saved.sources.filter(id=>MF439_PUBLIC.some(x=>x[0]===id)||MF439_GATEWAY.has(id)):
   MF439_PUBLIC.map(x=>x[0]).concat([...MF439_GATEWAY])};
}
async function mf439SavePref(key,value){
 if(!['autoFill','maxTitles','sources'].includes(key))return;
 const old=mf439Settings();
 const next={...old,[key]:key==='autoFill'?value===true:key==='maxTitles'?Math.max(1,Math.min(100,Number(value)||20)):
  [...new Set((Array.isArray(value)?value:[]).map(String))].filter(p=>MF439_PUBLIC.some(x=>x[0]===p)||MF439_GATEWAY.has(p))};
 S.settings=S.settings||{};S.settings.v439MetadataRecovery=next;
 await saveState();
}
const mf439ValueEmpty=v=>v==null||v===''||Array.isArray(v)&&!v.length;
function mf439Current(item,key){
 if(V178_EDITABLE_RICH_FIELDS.includes(key))return item[key];
 return item.universalMetadata?.fields?.[key];
}
function mf439Protected(item,token){
 if(token.startsWith('rating.'))return item.universalMetadata?.locks?.[token]===true;
 const key=token.slice(6);
 return (V178_EDITABLE_RICH_FIELDS.includes(key)&&item.richMetadataManual?.[key]===true)||
  item.universalMetadata?.locks?.[token]===true;
}
function mf439Equal(a,b){
 const norm=x=>Array.isArray(x)?x.map(v=>String(v).toLocaleLowerCase().trim()).sort():typeof x==='string'?x.toLocaleLowerCase().trim():x;
 return JSON.stringify(norm(a))===JSON.stringify(norm(b));
}
function mf439Propose(item,rows,{manualApproval=[]}={}){
 const approvals=new Set(manualApproval);
 const candidates=new Map();
 const identity=[];let rejected=0;
 for(const rec of rows||[]){
  const match=rec.identity||mf439Identity(item,rec);
  if(!match.score){rejected++;continue;}
  const approved=match.verified||approvals.has(rec.provider+':'+rec.id);
  identity.push({provider:rec.provider,id:rec.id,name:rec.name,year:rec.year,
   score:match.score,verified:match.verified,approved,reason:match.reason});
  for(const [key,value] of Object.entries(rec.fields||{})){
   if(mf439ValueEmpty(value)||!MF439_FIELDS_LABELS.has(key))continue;
   const token='field.'+key;
   if(!candidates.has(token))candidates.set(token,[]);
   candidates.get(token).push({token,provider:rec.provider,recordId:rec.id,
    identityVerified:match.verified,approved,value,
    evidence:match.reason,sourceName:rec.name,sourceYear:rec.year});
  }
  for(const [key,rating] of Object.entries(rec.ratings||{})){
   if(!MF437_RATING_MAP.has(key)||rating.score==null)continue;
   const token='rating.'+key;
   if(!candidates.has(token))candidates.set(token,[]);
   candidates.get(token).push({token,provider:rec.provider,recordId:rec.id,
    identityVerified:match.verified,approved,value:rating,
    evidence:match.reason,sourceName:rec.name,sourceYear:rec.year});
  }
 }
 const proposals=[];
 for(const [token,options] of candidates){
  const rating=token.startsWith('rating.'),key=token.slice(token.indexOf('.')+1);
  const existing=rating?item.universalMetadata?.externalRatings?.[key]:mf439Current(item,key);
  const protectedField=mf439Protected(item,token);
  const approved=options.filter(x=>x.approved);
  const verified=approved.filter(x=>x.identityVerified);
  const conflict=approved.length>1&&approved.some(p=>!mf439Equal(p.value,approved[0].value));
  const label=rating?(MF437_RATING_MAP.get(key)?.[1]||key)+' rating':MF439_FIELDS_LABELS.get(key)||key;
  proposals.push({token,key,label,rating,existing,protected:protectedField,options,conflict,
   initial:Math.max(0,options.findIndex(o=>o.identityVerified)),
   safeAuto:!protectedField&&mf439ValueEmpty(existing)&&verified.length>0&&!conflict,
   missing:mf439ValueEmpty(existing)});
 }
 proposals.sort((a,b)=>
  Number(a.protected)-Number(b.protected)||
  Number(a.rating)-Number(b.rating)||
  Number(a.missing?0:1)-Number(b.missing?0:1)||
  a.label.localeCompare(b.label));
 return {itemId:String(item.id),expectedModified:Number(item.modifiedAt)||0,
  checkedAt:Date.now(),sources:identity,proposals,rejected};
}
function mf439PlanChosen(plan,selected={},manualApproval=[]){
 const approvals=new Set(manualApproval),choices=[];
 for(const prop of plan.proposals||[]){
  const selectedIndex=Number(selected[prop.token]??prop.initial);
  const opt=prop.options[selectedIndex];
  if(!opt||prop.protected)continue;
  const approved=opt.identityVerified||approvals.has(opt.provider+':'+opt.recordId);
  if(!approved)continue;
  choices.push({...prop,selectedIndex,option:opt});
 }
 return choices;
}
function mf439Write(item,plan,selected={},manualApproval=[],{automatic=false}={}){
 if(!item||!plan||String(item.id)!==plan.itemId||Number(item.modifiedAt||0)!==plan.expectedModified)
  return {changed:false,reason:'Title was edited after preview; scan again'};
 if(!AUTH_USER||mf439Account()!==MF439.account)return {changed:false,reason:'Account changed'};
 const ops=mf439PlanChosen(plan,selected,manualApproval);
 const next=JSON.parse(JSON.stringify(item)),env=mf437Normalized(next.universalMetadata);
 let changed=0;const now=Date.now();
 for(const p of ops){
  const opt=p.option,token=p.token;
  if(automatic&&(!p.safeAuto||!opt.identityVerified||p.conflict))continue;
  if(mf439Protected(next,token))continue;
  // No overwrite unless user explicitly opted into the selected conflict.
  const old=p.rating?next.universalMetadata?.externalRatings?.[p.key]:mf439Current(next,p.key);
  if(!mf439ValueEmpty(old)&&!(!automatic&&selected[token]!=null))continue;
  if(p.rating){
   if(mf437SetRating(env,p.key,opt.value,{source:opt.provider,verified:true,
    force:!automatic&&selected[token]!=null,updatedAt:now}))changed++;
  }else if(V178_EDITABLE_RICH_FIELDS.includes(p.key)){
   if(p.key==='year'||p.key==='durationMinutes'){
    if(!Number.isFinite(Number(opt.value))||Number(opt.value)<=0)continue;
   }
   let value=opt.value;
   if(Array.isArray(value))value=[...new Set(value.map(x=>mf439Text(String(x),120)))].filter(Boolean).slice(0,40);
   else value=mf439Text(String(value),p.key==='synopsis'?6000:160);
   if(mf439ValueEmpty(value)||mf439Equal(old,value))continue;
   next[p.key]=value;
   next.metadataRecoveryProvenance={...(next.metadataRecoveryProvenance||{}),
    [p.key]:{source:opt.provider,recordId:opt.recordId,
     matchedBy:opt.identityVerified?'verified-identity':'user-approved-identity',updatedAt:now}};
   changed++;
  }else if(mf437SetField(env,p.key,opt.value,{source:opt.provider,verified:true,
   force:!automatic&&selected[token]!=null,updatedAt:now}))changed++;
 }
 if(!changed)return {changed:false,reason:'No eligible metadata changes'};
 if(Object.keys(env.provenance).length)next.universalMetadata=env;
 next.modifiedAt=Math.max(Number(item.modifiedAt)||0,now);
 return {changed:true,next,count:changed};
}
async function mf439Commit(item,plan,selected,approvals,opts={}){
 if(MF439.busy)return {changed:false,reason:'Another metadata save is in progress'};
 if(!mf439Account()||mf439Account()!==MF439.account)return {changed:false,reason:'Sign in to save metadata'};
 const result=mf439Write(item,plan,selected,approvals,opts);
 if(!result.changed)return result;
 MF439.busy=true;
 const before=JSON.parse(JSON.stringify(item));
 try{
  // Reject an account/snapshot race immediately before writing.
  if(!AUTH_USER||mf439Account()!==MF439.account||Number(item.modifiedAt||0)!==plan.expectedModified)
   return {changed:false,reason:'Account or title changed'};
  Object.assign(item,result.next);
  if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
  await saveState();
  // Keep current app UI coherent without mutating progress, History or XP.
  return {changed:true,count:result.count};
 }catch(e){
  for(const key of Object.keys(item))if(!(key in before))delete item[key];
  Object.assign(item,before);
  return {changed:false,reason:'Save failed; original metadata restored: '+String(e.message||e)};
 }finally{MF439.busy=false;}
}
function mf439Key(){return 'mf439:job:'+mf439Account();}
function mf439LeaseKey(){return 'mf439:lease:'+mf439Account();}
function mf439LeaseOwn(){try{return JSON.parse(localStorage.getItem(mf439LeaseKey())||'null')?.token===MF439.lockToken;}catch(_){return false;}}
function mf439Lease(){
 if(!mf439Account())return false;
 try{
  const other=JSON.parse(localStorage.getItem(mf439LeaseKey())||'null');
  if(other?.expires>Date.now()&&other.token!==MF439.lockToken)return false;
  if(!MF439.lockToken)MF439.lockToken=String(Date.now())+':'+Math.random().toString(36).slice(2);
  localStorage.setItem(mf439LeaseKey(),JSON.stringify({token:MF439.lockToken,expires:Date.now()+18000}));
  clearInterval(MF439.lockTimer);
  MF439.lockTimer=setInterval(()=>{
   if(!mf439LeaseOwn()){MF439.stop=true;clearInterval(MF439.lockTimer);return;}
   localStorage.setItem(mf439LeaseKey(),JSON.stringify({token:MF439.lockToken,expires:Date.now()+18000}));
  },5000);
  return true;
 }catch(_){return false;}
}
function mf439Unlock(){
 clearInterval(MF439.lockTimer);MF439.lockTimer=null;
 if(mf439LeaseOwn())try{localStorage.removeItem(mf439LeaseKey());}catch(_){}
 MF439.lockToken='';
}
function mf439Checkpoint(){
 if(!MF439.job||!mf439Account())return;
 try{
  const j=MF439.job;
  localStorage.setItem(mf439Key(),JSON.stringify({v:1,account:MF439.account,
   ids:j.ids.slice(0,100),cursor:j.cursor,mode:j.mode,providers:j.providers,
   done:j.done,skipped:j.skipped,errors:j.errors,status:j.status,
   updatedAt:Date.now()}));
 }catch(e){console.warn('Metadata recovery checkpoint unavailable',e);}
}
function mf439Restore(){
 try{
  const d=JSON.parse(localStorage.getItem(mf439Key())||'null');
  if(d?.v!==1||d?.account!==mf439Account()||!Array.isArray(d.ids)||d.ids.length>100)return null;
  return {...d,ids:d.ids.filter(id=>typeof id==='string'),cursor:Math.max(0,Math.min(d.ids.length,Number(d.cursor)||0))};
 }catch(_){return null;}
}
function mf439SelectedIds(){
 const checked=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 return new Set(checked.map(String));
}
function mf439Sources(){
 return mf439Settings().sources.filter(id=>MF439_ADAPTERS[id]||MF439_GATEWAY.has(id)&&
  mf434ProviderStatus(id)?.configured&&mf434SavedTests().includes(id));
}
async function mf439Discover(item,providers){
 const rows=[],errors=[];
 for(const id of providers){
  if(MF439.stop||MF439.pause||!mf439Account()||MF439.account!==mf439Account())break;
  try{
   const found=await mf439Fetch(item,id);
   rows.push(...found);
  }catch(e){
   errors.push({provider:id,message:String(e?.name==='AbortError'?'Connection timed out':e?.message||e).slice(0,140)});
  }
 }
 return {rows,errors};
}
function mf439AutoSelection(plan){
 const out={};
 for(const p of plan.proposals)if(p.safeAuto){
  const index=p.options.findIndex(opt=>opt.identityVerified);
  if(index>=0)out[p.token]=index;
 }
 return out;
}
async function mf439Scan(item){
 if(!item?.id||!item.title)return null;
 MF439.activeId=String(item.id);
 const {rows,errors}=await mf439Discover(item,MF439.job?.providers||mf439Sources());
 MF439.errors.push(...errors.slice(0,20).map(e=>({id:String(item.id),...e})));
 MF439.errors=MF439.errors.slice(-80);
 const plan=mf439Propose(item,rows);
 return {plan,rows,errors};
}
async function mf439Start(ids,mode='manual'){
 if(MF439.running)return;
 const account=mf439Account();
 if(!account){showToast('Sign in before starting Metadata Recovery');return;}
 const all=new Set((S.library||[]).filter(x=>x?.id&&x.title).map(x=>String(x.id)));
 const unique=[...new Set((ids||[]).map(String).filter(x=>all.has(x)))].slice(0,mf439Settings().maxTitles);
 if(!unique.length){showToast('No eligible titles in the selected scope');return;}
 if(MF439.job&&MF439.job.status!=='completed'&&MF439.job.status!=='stopped'){
  if(!window.confirm('Replace the previous metadata recovery checkpoint?'))return;
 }
 if(!mf439Lease()){showToast('Metadata Recovery is active in another tab');return;}
 MF439.account=account;MF439.stop=false;MF439.pause=false;MF439.preview=null;
 MF439.errors=[];MF439.job={ids:unique,cursor:0,mode:mode==='auto'?'auto':'manual',
  providers:mf439Sources(),done:0,skipped:0,errors:0,status:'running'};
 if(!MF439.job.providers.length){MF439.job.status='paused';mf439Unlock();showToast('No configured or usable metadata provider');return;}
 mf439Checkpoint();mf439Run();
}
async function mf439Run(){
 if(MF439.running||!MF439.job||!mf439Account()||mf439Account()!==MF439.account)return;
 if(!mf439Lease()){MF439.job.status='other-tab';mf439Paint();return;}
 MF439.running=true;MF439.job.status='running';
 try{
  while(MF439.job.cursor<MF439.job.ids.length&&!MF439.stop&&!MF439.pause){
   if(!mf439LeaseOwn()||!mf439Account()||mf439Account()!==MF439.account){MF439.stop=true;break;}
   const id=MF439.job.ids[MF439.job.cursor];
   const item=(S.library||[]).find(x=>String(x?.id)===id);
   if(!item){MF439.job.skipped++;MF439.job.cursor++;mf439Checkpoint();continue;}
   const result=await mf439Scan(item);
   if(!result){MF439.job.skipped++;MF439.job.cursor++;mf439Checkpoint();continue;}
   MF439.job.errors+=result.errors.length;
   const plan=result.plan;
   if(!plan.proposals.length){
    MF439.job.skipped++;MF439.job.cursor++;mf439Checkpoint();mf439Paint();continue;
   }
   if(MF439.job.mode==='auto'){
    const chosen=mf439AutoSelection(plan);
    if(Object.keys(chosen).length){
     const saved=await mf439Commit(item,plan,chosen,[],{automatic:true});
     if(saved.changed)MF439.job.done++;else MF439.job.skipped++;
    }else MF439.job.skipped++;
    MF439.job.cursor++;mf439Checkpoint();mf439Paint();continue;
   }
   // Manual mode suspends the queue at the first preview. Do not scan ahead,
   // save anything, or treat title-only matches as verified.
   MF439.preview=result;MF439.selected=new Set();
   MF439.confirm=new Set();MF439.picked={};
   for(const p of plan.proposals){
    const index=p.options.findIndex(o=>o.identityVerified);
    if(p.missing&&!p.protected&&!p.conflict&&index>=0){
     MF439.selected.add(p.token);MF439.picked[p.token]=index;
    }
   }
   MF439.job.status='review';mf439Checkpoint();mf439Paint();return;
  }
  MF439.job.status=MF439.stop?'stopped':MF439.pause?'paused':'completed';
  mf439Checkpoint();
 }catch(e){
  MF439.job.status='paused';MF439.errors.push({provider:'engine',message:String(e.message||e)});
  mf439Checkpoint();
 }finally{MF439.running=false;mf439Unlock();mf439Paint();}
}
async function mf439Advance(save=false){
 const data=MF439.preview,job=MF439.job;
 if(!data||!job||job.status!=='review')return;
 const item=(S.library||[]).find(x=>String(x?.id)===data.plan.itemId);
 if(save&&item){
  const choice={};for(const id of MF439.selected)choice[id]=MF439.picked[id]??data.plan.proposals.find(p=>p.token===id)?.initial??0;
  const saved=await mf439Commit(item,data.plan,choice,[...MF439.confirm]);
  if(saved.changed)job.done++;else{job.skipped++;showToast(saved.reason||'Nothing eligible to save');}
 }else job.skipped++;
 job.cursor++;MF439.preview=null;job.status='paused';mf439Checkpoint();
 mf439Paint();
 if(!MF439.stop&&!MF439.pause)mf439Resume();
}
function mf439Pause(){
 MF439.pause=true;
 if(MF439.job&&MF439.job.status==='review')MF439.job.status='review';
 mf439Checkpoint();mf439Paint();
}
function mf439Stop(){
 MF439.stop=true;MF439.pause=true;
 if(MF439.job){MF439.job.status='stopped';mf439Checkpoint();}
 mf439Paint();
}
function mf439Resume(){
 if(!MF439.job||MF439.running||MF439.job.status==='completed'||MF439.job.status==='stopped')return;
 if(MF439.job.status==='review'&&MF439.preview){mf439Paint();return;}
 MF439.pause=false;MF439.stop=false;MF439.account=mf439Account();
 mf439Run();
}
window.MediaFlowV439Core=Object.freeze({version:439,
 propose:mf439Propose,identity:mf439Identity,
 write:mf439Write,settings:mf439Settings,restore:mf439Restore,
 selectedIds:mf439SelectedIds});
