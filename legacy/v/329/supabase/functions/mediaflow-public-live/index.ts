// MediaFlow v327: live, read-only public profile projection.
// No state_data is returned. Never expose the service-role key to the browser.
import { createClient } from 'jsr:@supabase/supabase-js@2';
const url=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(url,service,{auth:{persistSession:false}});
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
const fail=(message:string,status=400)=>new Response(JSON.stringify({error:message}),{status,headers});
const str=(x:any,n=350)=>String(x??'').slice(0,n);
const num=(x:any)=>Number.isFinite(Number(x))?Number(x):0;
const allowedSections=new Set(['meta','library','history','collections','collection_titles','order','order_titles','order_collections','old','old_transactions','statistics','statistics_titles','statistics_sessions','statistics_timeline','statistics_activity']);
const tabFor=(s:string)=>s==='meta'?'meta':s.startsWith('statistics')?'statistics':s==='collection_titles'?'collections':s.startsWith('order')?'order':s==='old_transactions'?'old':s;
function title(t:any,forStats=false){const out:any={id:str(t.id,120),title:str(t.title),categoryId:str(t.categoryId,120),coverUrl:/^https:\/\//i.test(t.coverUrl||'')?str(t.coverUrl,2000):'',status:str(t.status,40),priority:str(t.priority,32),progress:num(t.progress),total:num(t.total),rating:t.rating==null?null:num(t.rating),createdAt:num(t.createdAt),completedAt:num(t.completedAt),startedAt:num(t.startedAt),seasons:Array.isArray(t.seasons)?t.seasons.slice(0,150).map((x:any)=>({name:str(x.name,120),number:num(x.number),progress:num(x.progress),total:num(x.total)})):[],runtimeMinutes:num(t.runtimeMinutes),year:num(t.year),genre:str(t.genre,120),source:str(t.source,40),tags:Array.isArray(t.tags)?t.tags.slice(0,60).map((x:any)=>str(x,100)):[],genres:Array.isArray(t.genres)?t.genres.slice(0,60).map((x:any)=>str(x,100)):[],format:str(t.format,60),type:str(t.type,60),releaseYear:num(t.releaseYear),lastViewedAt:num(t.lastViewedAt),updatedAt:num(t.updatedAt),externalIds:Object.fromEntries(Object.entries(t.externalIds||{}).filter(([k,v])=>/^(mal|simkl|anilist|kitsu|tmdb|tvdb|imdb)$/i.test(k)&&v!=null&&/^[A-Za-z0-9:_-]{1,120}$/.test(String(v))).map(([k,v])=>[k,str(v,120)]))};return out;}
function session(x:any){return {id:str(x.id,120),title:str(x.title||x.entries?.[0]?.title),categoryId:str(x.categoryId,120),assignedCategoryId:str(x.assignedCategoryId,120),timestamp:num(x.timestamp),date:str(x.date,20),actualAmount:num(x.actualAmount),targetAmount:num(x.targetAmount),minutes:num(x.minutes),status:str(x.status,40),unit:str(x.unit,30),source:str(x.source,30),healthStatus:str(x.healthStatus,40),xp:num(x.xp),entries:Array.isArray(x.entries)?x.entries.slice(0,150).map((e:any)=>({title:str(e.title,300),categoryId:str(e.categoryId,120),amount:num(e.amount),actualAmount:num(e.actualAmount),minutes:num(e.minutes),unit:str(e.unit,30),status:str(e.status,30)})):[]};}
function collection(c:any){return {id:str(c.id,120),title:str(c.title,220),description:str(c.description,1200),coverUrl:/^https:\/\//i.test(c.coverUrl||'')?str(c.coverUrl,2000):'',titleIds:Array.isArray(c.titleIds)?c.titleIds.slice(0,100000).map((x:any)=>str(x,120)):[],order:Array.isArray(c.order)?c.order.slice(0,100000).map((x:any)=>str(x,120)):[],autoBackground:!!c.autoBackground,createdAt:num(c.createdAt),updatedAt:num(c.updatedAt),lastViewedAt:0};}
const configKeys=['v175PageSizes','historyPageSize','v177CoverSizes','v181Library','v181CoverSizes','v274Collections','v254Overlays','v288PersonalOrder','v289PersonalOrder','v270History','v273History','v281Collections','v285Library','v287PersonalOrder','v291CategoryPicker','v186ControlCenter','leveling'];
async function decode(raw:any){if(raw?.__mediaflowCompressed!=='gzip')return raw;const binary=atob(raw.data||'');const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const ds=new DecompressionStream('gzip');const stream=new Blob([bytes]).stream().pipeThrough(ds);return JSON.parse(await new Response(stream).text());}

// v329: parity with v150ComputeStateMetrics + v149 day-streak + v316 time ledger.
function mf329CoreXP(s:any):number{
 const lib=Array.isArray(s.library)?s.library:[],sessions=Array.isArray(s.sessions)?s.sessions:[],ledger=s.xpLedger||{};
 const l=s.settings?.leveling||{},enabled=l.enabled!==false;
 const unit={episodes:20,chapters:3,issues:6,movies:30,...(l.unitXP||{})};
 const rotation={neglected:2,due:1.5,healthy:1,overused:.5,...(l.rotationMultiplier||{})};
 const categories=new Map((s.categories||[]).map((c:any)=>[String(c.id),c]));
 const day=(x:any)=>/^\d{4}-\d{2}-\d{2}$/.test(String(x.date||''))?x.date:(Number(x.timestamp)>0?new Date(Number(x.timestamp)).toISOString().slice(0,10):'');
 const keys=[...new Set(sessions.filter((x:any)=>x&&x.status!=='skipped').map(day).filter(Boolean))].sort();
 const streak=new Map<string,number>();for(const key of keys){const prev=new Date(key+'T12:00:00Z');prev.setUTCDate(prev.getUTCDate()-1);const before=prev.toISOString().slice(0,10);streak.set(key,(streak.get(before)||0)+1);}
 const mult=(n:number)=>!enabled||n<=1?1:Math.round((1+.1*Math.log2(n))*100)/100;
 const lastDate=new Map<string,{timestamp:number,key:string}>();let history=0;
 for(const row of sessions){if(!row||row.status==='skipped')continue;
  let raw=Number(row.xp);if(!Number.isFinite(raw)||raw<=0){const cat:any=categories.get(String(row.categoryId||''));raw=0;
    if(Number(row.actualAmount)>0&&Number(row.minutes)>0&&cat&&enabled){const r=Number(rotation[row.healthStatus||'healthy']||1);raw=Math.max(0,Math.round((Math.round(Number(row.minutes))*Math.max(0,Number(l.minuteXP??1))+Math.round(Number(row.actualAmount))*Math.max(0,Number(unit[String(cat.unit) as keyof typeof unit]||0)))*r));}
  }
  const key=day(row);history+=Math.max(0,Math.round(Math.max(0,raw)*mult(streak.get(key)||1)));
  for(const t of Array.isArray(row.titles)?row.titles:[]){const id=String(t?.libraryId||'');if(!id)continue;const timestamp=Number(row.timestamp)||0;const prev=lastDate.get(id);if(!prev||timestamp>=prev.timestamp)lastDate.set(id,{timestamp,key});}
 }
 const completed=(x:any)=>x&&(x.status==='completed'||(x.total!=null&&Number(x.total)>0&&Number(x.progress)>=Number(x.total))) ;
 const ledgerSum=(name:string)=>Object.values(ledger[name]||{}).reduce((a:number,x:any)=>a+(Number(x)||0),0);
 const fixed=(enabled?lib.length*Math.max(0,Math.round(Number(l.libraryAdditionXP??25)))+lib.filter(completed).length*Math.max(0,Math.round(Number(l.completionXP??50))):0)+ledgerSum('libraryEdits')+ledgerSum('manualCovers')+ledgerSum('logCompletions')+ledgerSum('ratings');
 const byId=new Map(lib.map((x:any)=>[String(x.id),x]));let completionBonus=0;
 for(const [id,v] of Object.entries(ledger.logCompletions||{})){const raw=Math.max(0,Number(v)||0);const title:any=byId.get(String(id));if(!title||!raw)continue;
  let key='';if(Number(title.completedAt)>0)key=new Date(Number(title.completedAt)).toISOString().slice(0,10);else key=lastDate.get(id)?.key||'';
  completionBonus+=Math.max(0,Math.round(raw*mult(streak.get(key)||0))-raw);
 }
 return Math.max(0,Math.round(history+fixed+completionBonus));
}

Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='GET')return fail('Method not allowed',405);
 try{const q=new URL(req.url).searchParams,owner=q.get('owner')||'',section=q.get('section')||'',page=Number(q.get('page')||0),limit=500;
 if(!/^[0-9a-f-]{36}$/i.test(owner)||!allowedSections.has(section)||!Number.isInteger(page)||page<0||page>100000)return fail('Invalid public view request');
 const {data:p,error:pe}=await db.from('mf_public_profiles').select('user_id,is_public,profile_v323,show_library,show_history,show_order,show_statistics,display_name,username,xp_total').eq('user_id',owner).maybeSingle();if(pe)throw pe;if(!p?.is_public)return fail('Profile unavailable',404);
 const tab=tabFor(section);if(tab!=='meta'){const tabs=Array.isArray(p.profile_v323?.tabs)?p.profile_v323.tabs:[];if(!tabs.some((x:any)=>x.id===tab&&x.visible===true))return fail('Section private',403);if(tab==='library'&&!p.show_library||tab==='history'&&!p.show_history||tab==='order'&&!p.show_order||tab==='statistics'&&!p.show_statistics)return fail('Section private',403);}
 const {data:r,error:e}=await db.from('mediaflow_states').select('state_data,updated_at').eq('user_id',owner).maybeSingle();if(e)throw e;if(!r)return fail('Cloud Workspace unavailable',404);
 const S=await decode(r.state_data),library=Array.isArray(S.library)?S.library:[],hist=Array.isArray(S.sessions)?S.sessions:[],collections=Array.isArray(S.collections)?S.collections:[],order=S.orderPlan||{},old=S.oldSystem||{};
 const historyById=new Map(library.map((x:any)=>[String(x.id),x]));
 const publicSession=(x:any)=>{const result:any=session(x);const refs=Array.isArray(x.titles)?x.titles:[];
 result.titles=refs.slice(0,150).map((t:any)=>{const match:any=historyById.get(String(t.libraryId||''));return {libraryId:str(t.libraryId,120),title:str(t.title||match?.title,350),coverUrl:match&&/^https:\/\//i.test(match.coverUrl||'')?str(match.coverUrl,2000):'',qty:num(t.qty),repeat:!!t.repeat,season:t.season&&typeof t.season==='object'?{number:num(t.season.number),episode:num(t.season.episode)}:undefined};});
 if(!result.titles.length){const match:any=historyById.get(String(x.libraryId||''));if(match||x.title)result.titles=[{libraryId:str(x.libraryId,120),title:str(x.title||match?.title,350),coverUrl:match&&/^https:\/\//i.test(match.coverUrl||'')?str(match.coverUrl,2000):'',qty:num(x.actualAmount)}];}
 return result;};
 const byId=new Map(library.map((x:any)=>[String(x.id),x]));const titlesFor=(ids:any[])=>[...new Set((ids||[]).map(String))].map(id=>byId.get(id)).filter(Boolean).map((x:any)=>title(x));
 const assigned=collections.filter((c:any)=>(order.collectionAssignments||[]).some((a:any)=>String(a.collectionId)===String(c.id)));
 const statsMeta=async()=>{const [{data:time},{data:days}]=await Promise.all([db.from('mf_time_xp_v316').select('xp_total,credited_seconds,remainder_seconds').eq('user_id',owner).maybeSingle(),db.from('mf_time_xp_days_v316').select('day,active_seconds,xp_earned').eq('user_id',owner).order('day',{ascending:false}).limit(31)]);const safeLedger:any={};for(const key of ['libraryAdditions','libraryEdits','manualCovers','logCompletions','titleStarts']){const obj=S.xpLedger?.[key];if(obj&&typeof obj==='object'&&!Array.isArray(obj))safeLedger[key]=Object.fromEntries(Object.entries(obj).slice(0,60000).map(([k,v])=>[str(k,120),Math.max(0,num(v))]));}return {settings:Object.fromEntries(configKeys.filter(k=>S.settings?.[k]!=null).map(k=>[k,S.settings[k]])),xpLedger:safeLedger,totalXP:mf329CoreXP(S)+num(time?.xp_total),profileName:str(S.profileName||p.display_name,150),statsHeatmapYear:num(S.statsHeatmapYear)||new Date().getFullYear(),statsRecapMonth:str(S.statsRecapMonth,8),time:{xp:num(time?.xp_total),seconds:num(time?.credited_seconds),pending:num(time?.remainder_seconds),days:days||[]},publishedAt:new Date(r.updated_at).getTime()};};
 let rows:any[]=[];
 switch(section){
 case 'meta': rows=[{categoryCounts:library.reduce((out:any,t:any)=>{const id=String(t.categoryId||'');out[id]=(out[id]||0)+1;return out;},{}),categories:(S.categories||[]).map((c:any)=>({id:str(c.id,120),name:str(c.name,200),color:/^#[a-f0-9]{3,8}$/i.test(c.color||'')?c.color:'#36b4d6',icon:str(c.icon,128),iconUrl:(/^https:\/\//i.test(c.iconUrl||'')||/^assets\/category-icons\/[a-z0-9-]+\.png$/i.test(c.iconUrl||''))?str(c.iconUrl,2000):'',iconType:str(c.iconType,32),type:str(c.type,40),unit:str(c.unit,40),target:num(c.target)||1,enabled:c.enabled!==false})),settings:Object.fromEntries(configKeys.filter(k=>S.settings?.[k]!=null).map(k=>[k,S.settings[k]])),publishedAt:new Date(r.updated_at).getTime()}];break;
 case 'library':rows=library.map((x:any)=>title(x));break;
 case 'history':rows=hist.map(publicSession);break;
 case 'collections':rows=collections.map(collection);break;
 case 'collection_titles':rows=titlesFor(collections.flatMap((c:any)=>c.titleIds||[]));break;
 case 'order':rows=[{orderPlan:{titleIds:(order.titleIds||[]).map(String),viewMode:'all',categoryMode:order.categoryMode||'default',categoryOrder:(order.categoryOrder||[]).map(String),hiddenCategories:(order.hiddenCategories||[]).map(String),collectionAssignments:(order.collectionAssignments||[]).map((a:any)=>({collectionId:String(a.collectionId||''),categoryId:String(a.categoryId||'')}))}}];break;
 case 'order_titles':rows=titlesFor([...(order.titleIds||[]),...assigned.flatMap((c:any)=>c.titleIds||[])]);break;
 case 'order_collections':rows=assigned.map(collection);break;
 case 'old':rows=[{enabledCategoryIds:(old.enabledCategoryIds||[]).map(String),balances:old.balances||{},rules:(old.rules||[]).map((x:any)=>({id:str(x.id),fromCategoryId:str(x.fromCategoryId),toCategoryId:str(x.toCategoryId),fromAmount:num(x.fromAmount)||1,toAmount:num(x.toAmount)||1,createdAt:num(x.createdAt)})),mode:'system'}];break;
 case 'old_transactions':rows=(old.transactions||[]).map((t:any)=>({id:str(t.id),timestamp:num(t.timestamp),type:str(t.type,40),categoryId:str(t.categoryId,120),amount:num(t.amount),label:str(t.label,250),deltas:(t.deltas||[]).map((d:any)=>({categoryId:str(d.categoryId,120),delta:num(d.delta)}))}));break;
 case 'statistics':rows=[await statsMeta()];break;
 case 'statistics_titles':rows=library.map((x:any)=>title(x,true));break;
 case 'statistics_sessions':rows=hist.map(publicSession);break;
 case 'statistics_timeline':rows=(S.completionTimeline||[]).map((t:any)=>({libraryId:str(t.libraryId),title:str(t.title),categoryId:str(t.categoryId),completedAt:num(t.completedAt)}));break;
 case 'statistics_activity':rows=(S.activityLog||[]).map((a:any)=>({id:str(a.id),title:str(a.title),categoryId:str(a.categoryId),timestamp:num(a.timestamp),date:str(a.date,20),type:str(a.type,50),minutes:num(a.minutes),amount:num(a.amount)}));break;
 }
 const start=page*limit;return new Response(JSON.stringify({items:rows.slice(start,start+limit),has_more:rows.length>start+limit,total:rows.length,updated_at:r.updated_at,section}),{status:200,headers});
 }catch(err){console.error('MediaFlow public live failure',err);return fail('Public Workspace temporarily unavailable',503);}
});
