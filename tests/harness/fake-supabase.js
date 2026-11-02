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
      from(table){const q=query(table);
        return {select:(...a)=>q.select(...a),upsert:(row)=>q.upsert(row)};},
      async rpc(){return {data:null,error:null};}
    };
  }};
})();
