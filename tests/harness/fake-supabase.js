/* MediaFlow test harness: in-browser Supabase double.
 * Stores the single mediaflow_states row in window.__MF_CLOUD and records
 * every upload so tests can measure payload sizes and verify round trips.
 * Never shipped: index.html loads the real CDN client in production. */
(function(){
  'use strict';
  const user={id:'harness-user',email:'harness@example.test'};
  const session={access_token:'harness-token',user};
  const cloud=window.__MF_CLOUD=window.__MF_CLOUD||{row:null,uploads:[],reads:0,delayMs:0};
  const wait=()=>new Promise(r=>setTimeout(r,cloud.delayMs||0));
  function query(table){
    const q={table,filters:{},select(){return q;},eq(k,v){q.filters[k]=v;return q;},
      async maybeSingle(){await wait();cloud.reads++;
        if(table!=='mediaflow_states')return {data:null,error:null};
        // The harness server keeps the row, so it survives page reloads.
        const r=await fetch('/__harness/cloud',{cache:'no-store'});
        const row=r.status===200?await r.json():null;
        cloud.row=row;
        if(row&&q.cols&&/state_data->mf556/.test(q.cols))return {data:{updated_at:row.updated_at,mf556:row.state_data?.mf556??null},error:null};
        return {data:row?{...row}:null,error:null};},
      async single(){return q.maybeSingle();},
      async upsert(row){await wait();
        const size=JSON.stringify(row).length;
        cloud.uploads.push({at:Date.now(),size});
        cloud.row={...row};
        if(cloud.fail){const e=cloud.fail;return {data:null,error:typeof e==='object'?e:{message:String(e)}};}
        await fetch('/__harness/cloud',{method:'POST',body:JSON.stringify(row)});
        return {data:null,error:null};}};
    return q;
  }
  // Generic table emulation (mediaflow_records) backed by the harness server,
  // so rows survive reloads and can be shared by two "devices" (pages).
  function table(name){
    const st={name,filters:[],order:[],range:null,cols:'*',single:false,upsert:null,onConflict:'',returning:false};
    const run=async()=>{await wait();
      if(cloud.failRecords){const e=cloud.failRecords;return {data:null,error:typeof e==='object'?e:{message:String(e)}};}
      const r=await fetch('/__harness/db',{method:'POST',body:JSON.stringify(st)});const out=await r.json();
      if(st.upsert){cloud.recordUploads=(cloud.recordUploads||0)+st.upsert.length;cloud.recordBytes=(cloud.recordBytes||0)+JSON.stringify(st.upsert).length;}
      return out;};
    const b={
      select(c){st.cols=c||'*';if(st.upsert)st.returning=true;return b;},
      eq(c,v){st.filters.push(['eq',c,v]);return b;},gt(c,v){st.filters.push(['gt',c,v]);return b;},or(expr){st.filters.push(['or',expr]);return b;},gte(c,v){st.filters.push(['gte',c,v]);return b;},
      order(c,o){st.order.push([c,o?.ascending!==false]);return b;},range(a,z){st.range=[a,z];return b;},limit(n){st.range=[0,n-1];return b;},
      maybeSingle(){st.single=true;return run().then(o=>({data:(o.data||[])[0]||null,error:o.error||null}));},
      single(){return b.maybeSingle();},
      upsert(rows,opts){st.upsert=Array.isArray(rows)?rows:[rows];st.onConflict=opts?.onConflict||'';return b;},
      then(res,rej){return run().then(res,rej);}
    };
    return b;
  }
  window.supabase={createClient(){
    const listeners=[];
    return {
      auth:{
        async getSession(){return {data:{session},error:null};},
        async getUser(){return {data:{user},error:null};},
        onAuthStateChange(cb){listeners.push(cb);setTimeout(()=>cb('INITIAL_SESSION',session),0);
          return {data:{subscription:{unsubscribe(){}}},error:null};},
        async signOut(){return {error:null};},
        async signInWithPassword(){return {data:{session,user},error:null};},
        async updateUser(){return {data:{user},error:null};},
        async signUp(){return {data:{user},error:null};},
        async resetPasswordForEmail(){return {data:{},error:null};}
      },
      from(name){
        if(name!=='mediaflow_states')return table(name);
        const q=query(name);
        return {select:(cols,...a)=>{q.cols=cols;return q.select(cols,...a);},upsert:(row)=>q.upsert(row)};},
      async rpc(name,args){
        if(name!=='mediaflow_records_page')return {data:null,error:null};
        await wait();
        if(cloud.failRecords){const e=cloud.failRecords;return {data:null,error:typeof e==='object'?e:{message:String(e)}};}
        if(cloud.noRpc)return {data:null,error:{code:'PGRST202',message:'Could not find the function public.mediaflow_records_page'}};
        cloud.rpcCalls=(cloud.rpcCalls||0)+1;
        const r=await fetch('/__harness/db',{method:'POST',body:JSON.stringify({name:'mediaflow_records',rpcPage:args||{}})});
        return await r.json();}
    };
  }};
})();
