/** MediaFlow v374 tracking backend. OAuth tokens NEVER reach browsers.
 * Secrets: MAL_CLIENT_ID, MAL_CLIENT_SECRET, SIMKL_CLIENT_ID, SIMKL_CLIENT_SECRET,
 * MEDIAFLOW_TRACKING_REDIRECT, TRACKING_TOKEN_KEY (base64 of 32 random bytes).
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const adminKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
const ANON=Deno.env.get('SUPABASE_ANON_KEY')||JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
const REDIRECT=Deno.env.get('MEDIAFLOW_TRACKING_REDIRECT')||'';
const providers=['mal','simkl'];
const conf=(p:string)=>({id:Deno.env.get(p==='mal'?'MAL_CLIENT_ID':'SIMKL_CLIENT_ID')||'',secret:Deno.env.get(p==='mal'?'MAL_CLIENT_SECRET':'SIMKL_CLIENT_SECRET')||''});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
function output(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}})}
function fail(s:string,status=400){return output({error:s},status)}
function rand(n=32){const b=crypto.getRandomValues(new Uint8Array(n));return [...b].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function cipherKey(){const raw=Deno.env.get('TRACKING_TOKEN_KEY')||'';const x=Uint8Array.from(atob(raw),x=>x.charCodeAt(0));if(x.length!==32)throw Error('TRACKING_TOKEN_KEY must be 32 random bytes, base64 encoded');return crypto.subtle.importKey('raw',x,'AES-GCM',false,['encrypt','decrypt'])}
async function encrypt(s:string){const iv=crypto.getRandomValues(new Uint8Array(12)),key=await cipherKey();const b=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(s)));return btoa(String.fromCharCode(...iv,...b))}
async function decrypt(v:string){const bytes=Uint8Array.from(atob(v),x=>x.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},await cipherKey(),bytes.slice(12)))}
async function requestApi(url:string,options:RequestInit={},timeout=12000){const res=await fetch(url,{...options,signal:AbortSignal.timeout(timeout)});const body=await res.text();let data:any;try{data=JSON.parse(body)}catch{data={error:body.slice(0,220)}}if(!res.ok)throw Error(`${res.status} ${data?.error_description||data?.error||data?.message||'External service request failed'}`);return data}
function only(s:unknown,n=200){return String(s||'').slice(0,n)}
const tokenBase=(p:string)=>p==='mal'?'https://myanimelist.net/v1/oauth2/token':'https://api.simkl.com/oauth2/token';
async function pkceChallenge(verifier:string){
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
 return btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function hasWriteScope(scope:unknown){
 const scopes=Array.isArray(scope)?scope.map(String):String(scope||'').split(/[\s,]+/);
 return scopes.includes('media:write');
}
const apiHeaders=(p:string,t:string)=>p==='mal'?{Authorization:`Bearer ${t}`}:{Authorization:`Bearer ${t}`,'simkl-api-key':conf('simkl').id,'User-Agent':'MediaFlow/374'};
const malStatus:Record<string,string>={active:'watching',planned:'plan_to_watch',paused:'on_hold',completed:'completed',dropped:'dropped'};
const malMangaStatus:Record<string,string>={...malStatus,active:'reading',planned:'plan_to_read'};
const simklStatus:Record<string,string>={active:'watching',planned:'plantowatch',paused:'hold',completed:'completed',dropped:'dropped'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return fail('Method not allowed',405);
 if(!SUPABASE_URL||!adminKey||!ANON)return fail('Supabase function configuration missing',503);
 const db=createClient(SUPABASE_URL,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
 let b:any;try{b=await req.json()}catch{return fail('Invalid request body')}
 const action=only(b?.action,40),provider=only(b?.provider,20);
 // Mobile WebViews and external browsers do not share an auth session.
 // The 192-bit, short-lived, one-use OAuth state authorizes only this exchange.
 if(action==='complete'){
   try{
    const state=only(b.state,128),code=only(b.code,2048);
    if(!state||!code)throw Error('Missing authorization response');
    const {data:a,error}=await db.from('mf_tracking_oauth_v374').select('*').eq('state',state).maybeSingle();
    if(error)throw error;if(!a)throw Error('Authorization expired, invalid, or already used');
    if(Date.now()-new Date(a.created_at).getTime()>600000)throw Error('Authorization expired. Start again.');
    const p=a.provider,c=conf(p),form=new URLSearchParams({client_id:c.id,client_secret:c.secret,code,redirect_uri:REDIRECT,grant_type:'authorization_code'});
    // SIMKL AUTH V2 requires S256 PKCE even for confidential server applications.
    if(a.verifier_ciphertext)form.set('code_verifier',await decrypt(a.verifier_ciphertext));
    const response=await requestApi(tokenBase(p),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
    if(!response.access_token)throw Error('Service did not return an access token');
    if(p==='simkl'&&!hasWriteScope(response.scope))throw Error('SIMKL did not grant media:write. Reconnect and approve tracking permissions.');
    const {error:upErr}=await db.from('mf_tracking_accounts_v374').upsert({user_id:a.user_id,provider:p,token_ciphertext:await encrypt(response.access_token),refresh_ciphertext:response.refresh_token?await encrypt(response.refresh_token):null,expires_at:response.expires_in?new Date(Date.now()+Number(response.expires_in)*1000).toISOString():null,connected_at:new Date().toISOString()});
    if(upErr)throw upErr;
    await db.from('mf_tracking_oauth_v374').delete().eq('state',state);
    return output({connected:true,provider:p});
   }catch(e){return fail(String((e as Error).message||e),400)}
 }
 const header=req.headers.get('Authorization')||'';
 if(!/^Bearer\s+\S+/i.test(header))return fail('Authentication required',401);
 const userClient=createClient(SUPABASE_URL,ANON,{global:{headers:{Authorization:header}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await userClient.auth.getUser();if(authError||!user)return fail('Invalid MediaFlow session',401);
 const uid=user.id;
 try{

  const assertProvider=()=>{if(!providers.includes(provider))throw Error('Choose MAL or SIMKL');};
  async function account(p:string){const {data,error}=await db.from('mf_tracking_accounts_v374').select('*').eq('user_id',uid).eq('provider',p).maybeSingle();if(error)throw error;if(!data)throw Error(`${p.toUpperCase()} account is not connected`);return data;}
  async function token(p:string){
    const a=await account(p);
    if(a.expires_at&&new Date(a.expires_at).getTime()<=Date.now()+30000){
      if(!a.refresh_ciphertext)throw Error('Account authorization expired. Reconnect the service.');
      const c=conf(p);
      const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:await decrypt(a.refresh_ciphertext),client_id:c.id,client_secret:c.secret});
      const updated=await requestApi(tokenBase(p),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
      if(!updated.access_token)throw Error('Account refresh failed. Reconnect the service.');
      if(p==='simkl'&&!hasWriteScope(updated.scope))throw Error('SIMKL tracking permission was not renewed. Reconnect the service.');
      const {error:refreshError}=await db.from('mf_tracking_accounts_v374').update({
        token_ciphertext:await encrypt(updated.access_token),
        refresh_ciphertext:updated.refresh_token?await encrypt(updated.refresh_token):a.refresh_ciphertext,
        expires_at:updated.expires_in?new Date(Date.now()+Number(updated.expires_in)*1000).toISOString():null
      }).eq('user_id',uid).eq('provider',p);
      if(refreshError)throw refreshError;
      return updated.access_token;
    }
    return decrypt(a.token_ciphertext);
  }
  async function links(library?:string){let q=db.from('mf_tracking_links_v374').select('id,library_id,season_id,provider,remote_id,remote_type,remote_title,enabled,sync_progress,sync_status,sync_rating,last_synced_at,last_error').eq('user_id',uid).order('created_at',{ascending:true});if(library)q=q.eq('library_id',library);const {data,error}=await q;if(error)throw error;return data||[]}
  if(action==='accounts'){const {data,error}=await db.from('mf_tracking_accounts_v374').select('provider,connected_at').eq('user_id',uid);if(error)throw error;return output({accounts:data||[],links:await links()})}
  if(action==='start'){
    assertProvider();const c=conf(provider);if(!c.id||!c.secret||!REDIRECT)throw Error(`${provider.toUpperCase()} developer configuration or redirect URL is missing`);
    await db.from('mf_tracking_oauth_v374').delete().lt('created_at',new Date(Date.now()-600000).toISOString());
    const state=rand(24),verifier=rand(40);
    const {error}=await db.from('mf_tracking_oauth_v374').insert({user_id:uid,state,provider,verifier_ciphertext:await encrypt(verifier)});if(error)throw error;
    const u=new URL(provider==='mal'?'https://myanimelist.net/v1/oauth2/authorize':'https://simkl.com/oauth2/authorize');
    u.searchParams.set('response_type','code');u.searchParams.set('client_id',c.id);u.searchParams.set('redirect_uri',REDIRECT);u.searchParams.set('state',state);
    if(provider==='mal'){
      u.searchParams.set('code_challenge',verifier);u.searchParams.set('code_challenge_method','plain');
    }else{
      u.searchParams.set('code_challenge',await pkceChallenge(verifier));
      u.searchParams.set('code_challenge_method','S256');
      u.searchParams.set('scope','media:read media:write');
    }
    return output({authorization_url:u.toString()});
  }
  if(action==='disconnect'){
    assertProvider();const {error:de}=await db.from('mf_tracking_links_v374').delete().eq('user_id',uid).eq('provider',provider);if(de)throw de;
    const {error:ae}=await db.from('mf_tracking_accounts_v374').delete().eq('user_id',uid).eq('provider',provider);if(ae)throw ae;
    return output({disconnected:true});
  }
  if(action==='search'){
    assertProvider();await account(provider);const q=only(b.query,120).trim(),type=only(b.type,12);if(q.length<2)throw Error('Enter at least two characters');const c=conf(provider);
    if(provider==='mal'){
      const media=type==='manga'?'manga':'anime';const url=`https://api.myanimelist.net/v2/${media}?q=${encodeURIComponent(q)}&limit=16&fields=alternative_titles,main_picture,start_date,media_type,num_episodes,num_chapters,num_volumes`;
      const data=await requestApi(url,{headers:{'X-MAL-CLIENT-ID':c.id}});
      return output({results:(data.data||[]).map((r:any)=>({id:String(r.node.id),title:r.node.title||'',type:media,year:String(r.node.start_date||'').slice(0,4),cover:r.node.main_picture?.medium||'',count:r.node.num_episodes||r.node.num_chapters||null})).slice(0,16)});
    }
    if(type==='manga')throw Error('SIMKL does not track manga');
    const simtype=['movie','tv','anime'].includes(type)?type:'anime';const data=await requestApi(`https://api.simkl.com/search/${simtype}?q=${encodeURIComponent(q)}&extended=full&client_id=${encodeURIComponent(c.id)}&app-name=MediaFlow&app-version=374`,{headers:{'User-Agent':'MediaFlow/374'}});
    return output({results:(Array.isArray(data)?data:[]).map((r:any)=>({id:String(r.ids?.simkl||r.id||''),title:r.title||r.name||'',type:simtype,year:r.year||'',cover:r.poster?r.poster.startsWith('http')?r.poster:`https://simkl.in/posters/${r.poster}_m.jpg`:'',count:r.total_episodes||null})).filter((x:any)=>x.id).slice(0,16)});
  }
  if(action==='remote'){
    assertProvider();const t=await token(provider),type=only(b.type,12),id=only(b.id,32);if(!/^\d+$/.test(id))throw Error('Invalid external title ID');
    if(provider==='mal'){
      const media=type==='manga'?'manga':'anime';const data=await requestApi(`https://api.myanimelist.net/v2/${media}/${id}?fields=my_list_status`,{headers:apiHeaders(provider,t)});
      const status=data.my_list_status||{};return output({progress:status.num_episodes_watched??status.num_chapters_read??0,status:status.status||null,score:status.score??null,known:!!data.my_list_status});
    }
    // Deliberately do not pull the entire SIMKL account for one-title comparison.
    return output({known:false,reason:'SIMKL individual-list comparison unavailable; choose Keep both or MediaFlow as source.'});
  }
  if(action==='assign'){
    assertProvider();await account(provider);
    const library=only(b.libraryId,160),season=only(b.seasonId,160),id=only(b.remoteId,40),type=only(b.remoteType,12),title=only(b.remoteTitle,180);
    if(!library||!/^\d+$/.test(id)||!title||!['anime','manga','tv','movie'].includes(type))throw Error('Incomplete title association');
    if(provider==='mal'&&!['anime','manga'].includes(type))throw Error('Invalid MAL media type');
    if(provider==='simkl'&&type==='manga')throw Error('SIMKL does not track manga');
    const {data:existing,error:exErr}=await db.from('mf_tracking_links_v374').select('id').eq('user_id',uid).eq('library_id',library).eq('season_id',season).eq('provider',provider).maybeSingle();if(exErr)throw exErr;
    if(provider==='mal'){const {data:dupe,error:de}=await db.from('mf_tracking_links_v374').select('id').eq('user_id',uid).eq('provider',provider).eq('remote_type',type).eq('remote_id',id).maybeSingle();if(de)throw de;if(dupe&&dupe.id!==existing?.id)throw Error('This MAL entry is already assigned to another title or season');}
    if(existing){const {data,error}=await db.from('mf_tracking_links_v374').update({remote_id:id,remote_type:type,remote_title:title,enabled:false,last_synced_at:null,last_error:null}).eq('user_id',uid).eq('id',existing.id).select('id').single();if(error)throw error;const {error:clear}=await db.from('mf_tracking_jobs_v374').delete().eq('user_id',uid).eq('link_id',existing.id);if(clear)throw clear;return output({linked:true,id:data.id,enabled:false});}
    const {data,error}=await db.from('mf_tracking_links_v374').insert({user_id:uid,library_id:library,season_id:season,provider,remote_id:id,remote_type:type,remote_title:title,enabled:false}).select('id').single();if(error)throw error;
    return output({linked:true,id:data.id,enabled:false});
  }
  if(['unlink','pause','options'].includes(action)){
    const id=only(b.linkId,80);const {data:link,error:e}=await db.from('mf_tracking_links_v374').select('*').eq('id',id).eq('user_id',uid).maybeSingle();if(e)throw e;if(!link)throw Error('Tracking association not found');
    if(action==='unlink'){const {error}=await db.from('mf_tracking_links_v374').delete().eq('id',id).eq('user_id',uid);if(error)throw error;return output({unlinked:true});}
    const changes=action==='pause'?{enabled:false}:{enabled:!!b.enabled,sync_progress:b.progress!==false,sync_status:!!b.status,sync_rating:!!b.rating};
    const {error}=await db.from('mf_tracking_links_v374').update(changes).eq('id',id).eq('user_id',uid);if(error)throw error;return output({updated:true});
  }
  if(action==='publish'){
    const libraryId=only(b.libraryId,160),seasonId=only(b.seasonId,160),event=only(b.eventKey,180),payload=b.payload||{};
    if(!libraryId||!event||!payload||typeof payload!=='object')throw Error('Invalid tracking update');
    const found=(await links(libraryId)).filter((l:any)=>l.enabled&&String(l.season_id||'')===seasonId);let queued=0,skipped=0;
    for(const l of found){const f={progress:l.sync_progress&&payload.progress!=null?Number(payload.progress):null,status:l.sync_status?only(payload.status,20):null,rating:l.sync_rating&&payload.rating!=null?Number(payload.rating):null,units:l.sync_progress&&Array.isArray(payload.units)?payload.units.filter((n:unknown)=>Number.isSafeInteger(Number(n))&&Number(n)>0).slice(0,60):[],seasonNumber:Number.isSafeInteger(Number(payload.seasonNumber))&&Number(payload.seasonNumber)>0?Number(payload.seasonNumber):0,repeat:!!payload.repeat};
      if(!Number.isFinite(f.progress)||f.progress<0)f.progress=null;
      if(!Number.isFinite(f.rating)||f.rating<0||f.rating>10)f.rating=null;
      if(f.progress===null&&!f.status&&f.rating===null)continue;
      if(l.provider==='simkl'&&l.remote_type!=='movie'&&(!f.units.length||f.repeat)&&!f.status&&f.rating===null){skipped++;continue;}
      const {error}=await db.from('mf_tracking_jobs_v374').upsert({user_id:uid,link_id:l.id,event_key:event,payload:f,status:'pending',attempts:0,next_attempt_at:new Date().toISOString()},{onConflict:'user_id,link_id,event_key',ignoreDuplicates:true});if(error)throw error;queued++;
    }return output({queued,skipped});
  }
  if(action==='process'){
    const {data:jobs,error}=await db.from('mf_tracking_jobs_v374').select('id,link_id,event_key,payload,attempts,created_at').eq('user_id',uid).in('status',['pending','failed']).lte('next_attempt_at',new Date().toISOString()).order('created_at',{ascending:true}).limit(8);if(error)throw error;
    let succeeded=0,failed=0;
    for(const job of jobs||[]){
      const {data:l}=await db.from('mf_tracking_links_v374').select('*').eq('user_id',uid).eq('id',job.link_id).maybeSingle();
      if(!l||!l.enabled){await db.from('mf_tracking_jobs_v374').delete().eq('id',job.id).eq('user_id',uid);continue;}
      // MAL accepts absolute fields: an older queued snapshot must not overwrite
      // a later one if multiple logs were saved while offline.
      if(l.provider==='mal'){
        const {data:newer,error:orderErr}=await db.from('mf_tracking_jobs_v374')
          .select('id').eq('user_id',uid).eq('link_id',l.id)
          .in('status',['pending','failed']).gt('created_at',job.created_at).limit(1);
        if(orderErr)throw orderErr;
        if(newer?.length){
          await db.from('mf_tracking_jobs_v374').delete().eq('id',job.id).eq('user_id',uid);
          continue;
        }
      }
      const {data:locked}=await db.from('mf_tracking_jobs_v374').update({status:'processing',attempts:job.attempts+1}).eq('id',job.id).eq('user_id',uid).in('status',['pending','failed']).select('id').maybeSingle();if(!locked)continue;
      try{
        const t=await token(l.provider),p=job.payload||{},n=p.progress==null?NaN:Math.trunc(Number(p.progress)),rating=p.rating==null?NaN:Number(p.rating),id=l.remote_id;
        if(l.provider==='mal'){
          const fields=new URLSearchParams();if(l.sync_progress&&!p.repeat&&Number.isFinite(n)&&n>=0)fields.set(l.remote_type==='manga'?'num_chapters_read':'num_watched_episodes',String(n));
          const targetStatus=(l.remote_type==='manga'?malMangaStatus:malStatus)[p.status];if(l.sync_status&&targetStatus)fields.set('status',targetStatus);if(l.sync_rating&&Number.isFinite(rating)&&rating>=0&&rating<=10)fields.set('score',String(Math.round(rating)));
          if(fields.toString())await requestApi(`https://api.myanimelist.net/v2/${l.remote_type}/${id}/my_list_status`,{method:'PATCH',headers:{...apiHeaders('mal',t),'Content-Type':'application/x-www-form-urlencoded'},body:fields});
        }else{
          const base='https://api.simkl.com',h={...apiHeaders('simkl',t),'Content-Type':'application/json'},bucket=l.remote_type==='tv'?'shows':l.remote_type==='movie'?'movies':'anime';
          // Never generate a watched history from an ambiguous absolute progress number.
          let wrote=false;const units=(Array.isArray(p.units)?p.units:[]).filter((n:unknown)=>Number.isInteger(Number(n))&&Number(n)>0);
          if(l.sync_progress&&!p.repeat&&units.length&&(l.remote_type!=='tv'||p.seasonNumber>0)){const group={ids:{simkl:Number(id)},seasons:[{number:l.remote_type==='tv'?p.seasonNumber:1,episodes:units.map((x:number)=>({number:Number(x)}))}]};await requestApi(`${base}/sync/history?skip_auto_watching=yes`,{method:'POST',headers:h,body:JSON.stringify({[bucket]:[group]})});wrote=true;}
          if(l.sync_progress&&!p.repeat&&l.remote_type==='movie'&&n>0){await requestApi(`${base}/sync/history`,{method:'POST',headers:h,body:JSON.stringify({movies:[{ids:{simkl:Number(id)}}]})});wrote=true;}
          if(l.sync_status&&simklStatus[p.status]){await requestApi(`${base}/sync/add-to-list`,{method:'POST',headers:h,body:JSON.stringify({to:simklStatus[p.status],[bucket]:[{ids:{simkl:Number(id)}}]})});wrote=true;}
          if(l.sync_rating&&Number.isFinite(rating)&&rating>0&&rating<=10){await requestApi(`${base}/sync/ratings`,{method:'POST',headers:h,body:JSON.stringify({[bucket]:[{ids:{simkl:Number(id)},rating:Math.round(rating)}]})});wrote=true;}
          if(!wrote)throw Error('No unambiguous SIMKL episode events or enabled field changes to send');
        }
        await db.from('mf_tracking_links_v374').update({last_synced_at:new Date().toISOString(),last_error:null}).eq('id',l.id).eq('user_id',uid);
        await db.from('mf_tracking_jobs_v374').delete().eq('id',job.id).eq('user_id',uid);succeeded++;
      }catch(err){failed++;const msg=String((err as Error).message||err).slice(0,240);await db.from('mf_tracking_links_v374').update({last_error:msg}).eq('id',l.id).eq('user_id',uid);const attempts=job.attempts+1;await db.from('mf_tracking_jobs_v374').update({status:'failed',next_attempt_at:new Date(Date.now()+Math.min(86400,60*2**Math.min(attempts,10))*1000).toISOString()}).eq('id',job.id).eq('user_id',uid);}
      if(l.provider==='simkl')await new Promise(r=>setTimeout(r,1100));
    }return output({processed:succeeded,failed});
  }
  throw Error('Unknown tracking action');
 }catch(e){console.error('MediaFlow tracking error',String((e as Error).message||e));return fail(String((e as Error).message||e).slice(0,250),400)}
});
