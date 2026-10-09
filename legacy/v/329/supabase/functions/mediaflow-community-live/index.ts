// MediaFlow v328 — Community reads the authoritative, compressed Workspace state.
// No persisted title/ratings/collections/Statistics mirrors. Public opt-in gates apply.
import { createClient } from 'jsr:@supabase/supabase-js@2';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
const reply=(obj:any,status=200)=>new Response(JSON.stringify(obj),{status,headers});
const error=(msg:string,status=400)=>reply({error:msg},status);
const str=(s:any,n=500)=>String(s??'').slice(0,n);
const num=(n:any)=>Number.isFinite(Number(n))?Number(n):0;
const flag=(v:any)=>v===true||v==='true';
const safeImg=(v:any)=>/^https:\/\//i.test(String(v||''))?str(v,2048):'';
const providers=new Set(['mal','simkl','anilist','tmdb','imdb','trakt','kitsu','isbn']);
const bnd=(v:any,max:number,def:number)=>Math.min(max,Math.max(0,Number.isFinite(Number(v))?Math.floor(Number(v)):def));
const statusMap=(v:any)=>{const s=str(v,35).toLowerCase();return ({watching:'active',reading:'active',active:'active',completed:'completed',complete:'completed',planned:'planned',plan:'planned',plantowatch:'planned',paused:'paused',onhold:'paused',dropped:'dropped'} as Record<string,string>)[s]||s;};
const getId=(t:any)=>Object.entries(t?.externalIds||{}).filter(([k,v])=>providers.has(k.toLowerCase())&&typeof v!=='object'&&/^[a-z0-9:_-]{1,120}$/i.test(String(v||''))).map(([k,v])=>[k.toLowerCase(),String(v)] as const);
async function decode(raw:any){if(raw?.__mediaflowCompressed!=='gzip')return raw;const bin=atob(raw.data||'');const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));const decompressed=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(decompressed).text());}
async function profiles(){const all:any[]=[];for(let page=0;page<25;page++){const {data,error}=await db.from('mf_public_profiles').select('user_id,username,display_name,bio,avatar_url,is_public,show_library,show_xp,show_usage_time,profile_v323').eq('is_public',true).range(page*100,(page+1)*100-1);if(error)throw error;all.push(...(data||[]));if((data||[]).length<100)return all;}throw Error('Community too large for unindexed live enumeration; switch to an authoritative normalized media schema before expanding further.');}
async function source(ids:string[]){const out=new Map<string,any>();for(let i=0;i<ids.length;i+=10){const {data,error}=await db.from('mediaflow_states').select('user_id,state_data,updated_at').in('user_id',ids.slice(i,i+10));if(error)throw error;for(const r of data||[]){const s=await decode(r.state_data);out.set(r.user_id,{state:s,updated_at:r.updated_at});}}return out;}
async function live(){const people=await profiles(),states=await source(people.map(x=>x.user_id));return {people,states};}
function identity(t:any,profile:any){const ext=getId(t);return ext.map(([provider,id])=>({provider,provider_id:id,title:str(t.title,500),rating:t.rating==null?null:Number(t.rating),status:statusMap(t.status),cover:safeImg(t.coverUrl),total:num(t.total),metadata:{type:str(t.type||t.format,90),year:num(t.year||t.releaseYear),genres:Array.isArray(t.genres)?t.genres.slice(0,16).map((x:any)=>str(x,60)):[]},owner:profile.user_id}));}
function publicCatalog(people:any[],states:Map<string,any>){const result=new Map<string,any>();for(const p of people){if(!p.show_library)continue;const data=states.get(p.user_id)?.state;if(!data||!Array.isArray(data.library))continue;const seen=new Set<string>();for(const t of data.library){for(const item of identity(t,p)){const key=item.provider+'|'+item.provider_id;if(seen.has(key))continue;seen.add(key);let row=result.get(key);if(!row){row={provider:item.provider,provider_id:item.provider_id,title:item.title,users_count:0,ratings_count:0,rating_sum:0,average_rating:null,covers:[],statuses:{},total:item.total,metadata:item.metadata};result.set(key,row);}row.users_count++;row.statuses[item.status]=(row.statuses[item.status]||0)+1;if(item.rating!==null&&Number.isFinite(item.rating)&&item.rating>=0&&item.rating<=10){row.ratings_count++;row.rating_sum+=item.rating;}if(item.cover&&!row.covers.includes(item.cover)&&row.covers.length<8)row.covers.push(item.cover);}}}return [...result.values()].map(x=>{x.average_rating=x.ratings_count?x.rating_sum/x.ratings_count:null;delete x.rating_sum;return x;});}
function coll(t:any,p:any,state:any){const titles=new Map((state.library||[]).map((x:any)=>[String(x.id),x]));const items=(Array.isArray(t.titleIds)?t.titleIds:[]).map((id:any)=>titles.get(String(id))).filter(Boolean).map((x:any)=>({title:str(x.title,350),coverUrl:safeImg(x.coverUrl),status:statusMap(x.status),rating:x.rating==null?null:num(x.rating)}));return {id:str(t.id,255),user_id:p.user_id,username:p.username,display_name:p.display_name,avatar_url:p.avatar_url,title:str(t.title,220),description:str(t.description,1200),cover_url:safeImg(t.coverUrl),items,item_count:items.length,is_public:true,updated_at:new Date(num(t.updatedAt)||num(t.createdAt)||Date.now()).toISOString()};}
function xpOf(s:any){return mf329CoreXP(s);}
function levelOf(xp:number){let level=1,spent=0,need=100;while(xp>=spent+need&&level<100000){spent+=need;level++;need=Math.round(100*Math.pow(level,1.35));}return level;}
const validUUID=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
async function sharedRecords(){const rows:any[]=[];for(let page=0;page<20;page++){const {data,error}=await db.from('mf_collection_shares_v328').select('user_id,collection_id').range(page*100,(page+1)*100-1);if(error)throw error;rows.push(...(data||[]));if((data||[]).length<100)return rows;}throw Error('Shared Collection directory exceeds live enumeration limit.');}

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

Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='GET')return error('Method not allowed',405);
try{
const q=new URL(req.url).searchParams,action=str(q.get('action')||'browse',40),search=str(q.get('search')||'',160).trim().toLowerCase(),offset=bnd(q.get('offset'),100000,0),limit=bnd(q.get('limit'),60,40)||40;
if(!['browse','ratings','count','users','collections','collection','profile_metrics','favorites'].includes(action))return error('Invalid Community route');
if(action==='collection'){
 const owner=str(q.get('owner'),60),id=str(q.get('id'),255);if(!validUUID(owner)||!id)return error('Invalid Collection request');
 const [{data:share,error:se},{data:p,error:pe}]=await Promise.all([db.from('mf_collection_shares_v328').select('collection_id').eq('user_id',owner).eq('collection_id',id).maybeSingle(),db.from('mf_public_profiles').select('user_id,username,display_name,avatar_url,is_public').eq('user_id',owner).maybeSingle()]);if(se||pe)throw se||pe;if(!share||!p?.is_public)return error('Collection is not public',404);
 const states=await source([owner]),state=states.get(owner)?.state||{},c=(state.collections||[]).find((c:any)=>String(c.id)===id);return c?reply({collection:coll(c,p,state)}):error('Collection unavailable',404);
}
const {people,states}=await live();
if(action==='favorites'){
 const owner=str(q.get('owner'),60),p=people.find(x=>x.user_id===owner),state=states.get(owner)?.state;if(!p||!state)return error('Profile unavailable',404);
 const favoriteIds=(p.profile_v323?.favorites||[]).map((v:any)=>String(v?.id||'')).filter(Boolean).slice(0,40);const byId=new Map((state.library||[]).map((x:any)=>[String(x.id),x]));
 return reply({items:favoriteIds.map((id:string)=>byId.get(id)).filter(Boolean).map((x:any)=>({title:str(x.title,350),coverUrl:safeImg(x.coverUrl)}))});
}
if(action==='profile_metrics'){
 const owner=str(q.get('owner'),60),p=people.find(x=>x.user_id===owner),state=states.get(owner)?.state;if(!p||!state)return error('Profile unavailable',404);
 const {data:time}=await db.from('mf_time_xp_v316').select('xp_total').eq('user_id',owner).maybeSingle();const xp=xpOf(state)+num(time?.xp_total),result:any={user_id:owner};if(p.show_xp){result.xp_total=xp;result.xp_level=levelOf(xp);}if(p.show_library)result.library_titles=(state.library||[]).length;return reply(result);
}
if(action==='users'){
 const accountIds=people.map(p=>p.user_id);const ids=accountIds.length?accountIds:['00000000-0000-0000-0000-000000000000'];
 const [{data:usage,error:ue},{data:time,error:te}]=await Promise.all([db.from('mf_app_usage').select('user_id,seconds').in('user_id',ids),db.from('mf_time_xp_v316').select('user_id,xp_total').in('user_id',ids)]);if(ue||te)throw ue||te;const usageByUser=new Map((usage||[]).map((r:any)=>[r.user_id,num(r.seconds)]));const timeByUser=new Map<string,number>((time||[]).map((r:any)=>[String(r.user_id),num(r.xp_total)]));
 let rows=people.map(p=>{const state=states.get(p.user_id)?.state||{},xp=xpOf(state)+(timeByUser.get(p.user_id)||0),show=p.show_xp,publicCount=p.show_library?(state.library||[]).length:null;return {user_id:p.user_id,username:p.username,display_name:p.display_name,bio:p.bio,avatar_url:p.avatar_url,show_xp:show,show_usage_time:p.show_usage_time,xp_total:show?xp:null,xp_level:show?levelOf(xp):null,xp_default_verified:null,library_titles:publicCount,usage_seconds:p.show_usage_time?usageByUser.get(p.user_id)||0:null};});
 const tab=q.get('tab')||'discover',sort=q.get('sort')||'name',verified=q.get('verified')||'all',minLevel=bnd(q.get('minLevel'),1e5,0),minTitles=bnd(q.get('minTitles'),1e7,0);
 rows=rows.filter(p=>(!search||[p.username,p.display_name].join(' ').toLowerCase().includes(search))&&(!minLevel||num(p.xp_level)>=minLevel)&&(!minTitles||num(p.library_titles)>=minTitles)&&(tab!=='ranking'||p.show_xp)&&(verified==='all'||(verified==='verified'&&p.xp_default_verified===true)||(verified==='unverified'&&p.xp_default_verified!==true)));
 const desc=flag(q.get('desc'));const key=(r:any)=>sort==='level'?num(r.xp_level):sort==='xp'?num(r.xp_total):sort==='library'?num(r.library_titles):sort==='usage'?num(r.usage_seconds):String(r.display_name||r.username).toLowerCase();rows.sort((a,b)=>{const av=key(a),bv=key(b),delta=typeof av==='number'?av-Number(bv):String(av).localeCompare(String(bv));return (desc?-1:1)*(delta||a.username.localeCompare(b.username));});rows.forEach((r,i)=>{(r as any).rank=i+1;});return reply({items:rows.slice(offset,offset+Math.min(limit,40)).map(r=>({...r,total_matches:rows.length})),total:rows.length});
}
if(action==='collections'){
 const share=await sharedRecords(),byUser=new Map<string,Set<string>>();for(const s of share){if(!byUser.has(s.user_id))byUser.set(s.user_id,new Set());byUser.get(s.user_id)!.add(String(s.collection_id));}
 let rows:any[]=[];for(const p of people){const state=states.get(p.user_id)?.state,ids=byUser.get(p.user_id);if(!state||!ids)continue;for(const c of state.collections||[])if(ids.has(String(c.id)))rows.push(coll(c,p,state));}
 const sort=q.get('sort')||'updated',desc=flag(q.get('desc')),minItems=bnd(q.get('minItems'),100000,0),withCover=flag(q.get('withCover'));
 rows=rows.filter(c=>(!search||[c.title,c.description,c.username,c.display_name].join(' ').toLowerCase().includes(search))&&c.item_count>=minItems&&(!withCover||Boolean(c.cover_url||c.items.find((t:any)=>t.coverUrl))));
 const key=(r:any)=>sort==='count'?r.item_count:sort==='title'?r.title.toLowerCase():sort==='creator'?r.username.toLowerCase():Date.parse(r.updated_at)||0;rows.sort((a,b)=>{const va=key(a),vb=key(b);const d=typeof va==='number'?va-Number(vb):String(va).localeCompare(String(vb));return(desc?-1:1)*(d||String(a.id).localeCompare(String(b.id)));});return reply({items:rows.slice(offset,offset+Math.min(limit,40)),total:rows.length});
}
const catalog=publicCatalog(people,states);
if(action==='count')return reply({count:catalog.length});
let rows=catalog.filter(t=>(!search||t.title.toLowerCase().includes(search))&&(!q.get('provider')||t.provider===q.get('provider')));
if(action==='ratings'){
 const minVotes=bnd(q.get('minVotes'),100000,1),minLibraries=bnd(q.get('minLibraries'),100000,0),minRating=num(q.get('minRating'));
 rows=rows.filter(t=>t.ratings_count>=minVotes&&t.users_count>=minLibraries&&(t.average_rating??-1)>=minRating);
 const sort=q.get('sort')||'rating',desc=q.has('desc')?flag(q.get('desc')):true;
 const key=(r:any)=>sort==='votes'?r.ratings_count:sort==='libraries'?r.users_count:sort==='title'?r.title.toLowerCase():r.average_rating;
 rows.sort((a,b)=>{const av=key(a),bv=key(b),d=typeof av==='number'?av-Number(bv):String(av).localeCompare(String(bv));return (desc?-1:1)*(d||b.ratings_count-a.ratings_count||b.users_count-a.users_count||a.title.localeCompare(b.title));});const total=rows.length;rows.forEach((x,i)=>x.rank=i+1);return reply({items:rows.slice(offset,offset+Math.min(limit,60)).map(r=>({...r,total_ranked:total,match_count:total})),total});
}
const minUsers=bnd(q.get('minUsers'),100000,0),minRating=num(q.get('minRating')),status=q.get('status')||'',sort=q.get('sort')||'libraries',desc=q.has('desc')?flag(q.get('desc')):true;
rows=rows.filter(x=>x.users_count>=minUsers&&(!minRating||(x.average_rating??-1)>=minRating)&&(!status||num(x.statuses[status])>0));
const key=(r:any)=>sort==='title'?r.title.toLowerCase():sort==='ratings'?r.average_rating??-1:sort==='rating_count'?r.ratings_count:r.users_count;
rows.sort((a,b)=>{const av=key(a),bv=key(b),d=typeof av==='number'?av-Number(bv):String(av).localeCompare(String(bv));return (desc?-1:1)*(d||a.title.localeCompare(b.title));});return reply({items:rows.slice(offset,offset+Math.min(limit,60)),total:rows.length});
}catch(e){console.error('[mf328] Live Community request failed',e);return error('Live Community temporarily unavailable',503);}
});
