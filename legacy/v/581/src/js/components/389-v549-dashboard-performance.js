/* MediaFlow v549 — Dashboard history aggregation and render-cost reduction.
 * One read-only pass over History supplies all Dashboard category health,
 * lifetime balance, recent balance windows and streak calculations.
 * Existing formulas are preserved; malformed dates fall back to the canonical
 * implementation. No Library, History, XP, cloud or Supabase data is changed.
 */
const MF549_VERSION=549;
const MF549_STATS={
  snapshotBuilds:0,totalSessionsScanned:0,lastSnapshotScanned:0,
  balanceCalculations:0,balanceCacheHits:0,legacyFallbacks:0,
  libraryLookupBuilds:0,libraryLookupHits:0,markupPassThroughs:0
};
let MF549_DASHBOARD_DEPTH=0;
let MF549_DASHBOARD_SNAPSHOT=null;
let MF549_LIBRARY_LOOKUP_CACHE={library:null,length:-1,token:-1,value:null};

function mf549EmptyCategoryStats(){
  return {
    last:null,minutes72:0,todayAmount:0,
    overallCount:0,overallMinutes:0,overallFirstTime:Infinity,
    overallLastTime:-Infinity,overallLastValue:null,overallInvalidDate:false,
    balance:{all:0,'3d':0,'7d':0,'30d':0}
  };
}
function mf549EnsureCategoryStats(snapshot,id){
  let row=snapshot.byCategory.get(id);
  if(!row){row=mf549EmptyCategoryStats();snapshot.byCategory.set(id,row);}
  return row;
}
function mf549BuildDashboardSnapshot(){
  const sessions=Array.isArray(S.sessions)?S.sessions:[];
  const now=Date.now();
  const today=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
  const cutoff72=now-72*3600000;
  const cutoff3=now-3*86400000;
  const cutoff7=now-7*86400000;
  const cutoff30=now-30*86400000;
  const snapshot={
    now,today,byCategory:new Map(),daySet:new Set(),balanceTotals:{all:0,'3d':0,'7d':0,'30d':0},
    balanceCache:new Map(),weightTotal:1,streak:0,scanned:0
  };
  try{
    const scoped=typeof v186ScopeCategories==='function'
      ?v186ScopeCategories('scheduler')
      :(Array.isArray(S.categories)?S.categories.filter(c=>c&&c.enabled):[]);
    const weight=(Array.isArray(scoped)?scoped:[]).reduce((sum,c)=>sum+Math.max(.25,Number(c?.weight)||1),0);
    snapshot.weightTotal=weight||1;
  }catch(_){snapshot.weightTotal=1;}

  for(const s of sessions){
    if(!s)continue;
    snapshot.scanned++;
    MF549_STATS.totalSessionsScanned++;
    const row=mf549EnsureCategoryStats(snapshot,s.categoryId);

    // Preserve lastSessionFor's original semantics, including skipped entries.
    if(!row.last||s.timestamp>row.last.timestamp)row.last=s;

    if(s.status!=='skipped'){
      snapshot.daySet.add(s.date);
      if(s.timestamp>=cutoff72)row.minutes72+=s.minutes||0;
      if(s.date===today)row.todayAmount+=s.actualAmount;

      if(Number(s.minutes)>0){
        const rawDate=s.timestamp||s.date;
        const time=new Date(rawDate).getTime();
        row.overallCount++;
        row.overallMinutes+=Number(s.minutes)||0;
        if(!Number.isFinite(time)){
          row.overallInvalidDate=true;
        }else{
          if(time<row.overallFirstTime)row.overallFirstTime=time;
          if(time>=row.overallLastTime){
            row.overallLastTime=time;
            row.overallLastValue=s;
          }
        }
      }
    }

    // Keep the scheduler's exact eligibility rule for categoryBalance().
    const eligible=s.status!=='skipped'&&
      ((Number(s.minutes)||0)>0||(Number(s.actualAmount)||0)>0);
    if(eligible){
      const minutes=Math.max(0,Number(s.minutes)||0);
      snapshot.balanceTotals.all+=minutes;
      row.balance.all+=minutes;
      if(s.timestamp>=cutoff3){
        snapshot.balanceTotals['3d']+=minutes;
        row.balance['3d']+=minutes;
      }
      if(s.timestamp>=cutoff7){
        snapshot.balanceTotals['7d']+=minutes;
        row.balance['7d']+=minutes;
      }
      if(s.timestamp>=cutoff30){
        snapshot.balanceTotals['30d']+=minutes;
        row.balance['30d']+=minutes;
      }
    }
  }

  let streak=0,cur=new Date();
  while(true){
    const iso=cur.toISOString().slice(0,10);
    if(snapshot.daySet.has(iso)){streak++;cur.setDate(cur.getDate()-1);}
    else break;
  }
  snapshot.streak=streak;
  MF549_STATS.snapshotBuilds++;
  MF549_STATS.lastSnapshotScanned=snapshot.scanned;
  return snapshot;
}
function mf549DashboardSnapshot(){
  if(!MF549_DASHBOARD_SNAPSHOT)MF549_DASHBOARD_SNAPSHOT=mf549BuildDashboardSnapshot();
  return MF549_DASHBOARD_SNAPSHOT;
}
function mf549DashboardCategoryBalance(cat){
  const snapshot=mf549DashboardSnapshot();
  const key=cat.id;
  if(snapshot.balanceCache.has(key)){
    MF549_STATS.balanceCacheHits++;
    return snapshot.balanceCache.get(key);
  }
  const row=snapshot.byCategory.get(key)||mf549EmptyCategoryStats();
  const desiredShare=Math.max(.25,Number(cat.weight)||1)/snapshot.weightTotal;
  const windows=[
    {days:3,weight:.35,minMinutes:60,key:'3d'},
    {days:7,weight:.25,minMinutes:120,key:'7d'},
    {days:30,weight:.20,minMinutes:240,key:'30d'},
    {days:null,weight:.20,minMinutes:1,key:'all'}
  ];
  let ratioSum=0,usedWeight=0;
  const detail={};
  for(const w of windows){
    const totalMinutes=snapshot.balanceTotals[w.key];
    const catMinutes=row.balance[w.key];
    const actualShare=totalMinutes>0?catMinutes/totalMinutes:0;
    const ratio=desiredShare>0?actualShare/desiredShare:1;
    detail[w.days==null?'lifetime':String(w.days)+'d']={totalMinutes,catMinutes,actualShare,ratio};
    if(totalMinutes>=w.minMinutes){ratioSum+=Math.min(6,ratio)*w.weight;usedWeight+=w.weight;}
  }
  const last=row.last;
  const result={
    desiredShare,
    consumptionRatio:usedWeight>0?ratioSum/usedWeight:1,
    daysIdle:daysSince(last?last.timestamp:null),
    detail
  };
  snapshot.balanceCache.set(key,result);
  MF549_STATS.balanceCalculations++;
  return result;
}

const mf549CategoryStatusBase=categoryStatus;
categoryStatus=function(cat){
  if(!MF549_DASHBOARD_DEPTH||!cat)return mf549CategoryStatusBase.apply(this,arguments);
  const snapshot=mf549DashboardSnapshot();
  const row=snapshot.byCategory.get(cat.id)||mf549EmptyCategoryStats();
  const dSince=daysSince(row.last?row.last.timestamp:null);
  const expected3d=cat.target*cat.minutesPerUnit*2.2;
  const satRatio=expected3d>0?row.minutes72/expected3d:0;
  if(row.todayAmount>0&&satRatio>=1.6)return 'overused';
  if(dSince>=6)return 'neglected';
  if(dSince>=2.2)return 'due';
  return 'healthy';
};

const mf549OverallCategoryStatusBase=overallCategoryStatus;
overallCategoryStatus=function(cat){
  if(!MF549_DASHBOARD_DEPTH||!cat)return mf549OverallCategoryStatusBase.apply(this,arguments);
  const snapshot=mf549DashboardSnapshot();
  const row=snapshot.byCategory.get(cat.id);
  if(!row||!row.overallCount)return 'healthy';
  // Invalid legacy timestamps keep the original stable-sort behavior.
  if(row.overallInvalidDate||!Number.isFinite(row.overallFirstTime)||!Number.isFinite(row.overallLastTime)){
    MF549_STATS.legacyFallbacks++;
    return mf549OverallCategoryStatusBase.apply(this,arguments);
  }
  const spanDays=Math.max(3,(row.overallLastTime-row.overallFirstTime)/86400000);
  const expectedPerDay=(cat.target*cat.minutesPerUnit*2.2)/3;
  const expectedOverall=expectedPerDay*spanDays;
  const ratio=expectedOverall>0?row.overallMinutes/expectedOverall:0;
  const dSince=daysSince(row.overallLastValue?.timestamp||row.overallLastValue?.date);
  if(dSince>=6)return 'neglected';
  if(ratio>=1.6)return 'overused';
  if(dSince>=2.2)return 'due';
  return 'healthy';
};

const mf549CategoryBalanceBase=categoryBalance;
categoryBalance=function(cat){
  if(!MF549_DASHBOARD_DEPTH||!cat)return mf549CategoryBalanceBase.apply(this,arguments);
  return mf549DashboardCategoryBalance(cat);
};

const mf549DayStreakBase=computeDayStreak;
computeDayStreak=function(){
  if(!MF549_DASHBOARD_DEPTH)return mf549DayStreakBase.apply(this,arguments);
  return mf549DashboardSnapshot().streak;
};

/* The On This Day model rebuilds after History edits. Its title lookup only
 * depends on Library content, so reuse the 30K-title lookup while History alone
 * changes; the authoritative Library invalidation/token clears it immediately.
 */
if(typeof v159LibraryLookup==='function'){
  const mf549LibraryLookupBase=v159LibraryLookup;
  v159LibraryLookup=function(){
    const library=Array.isArray(S.library)?S.library:[];
    const token=typeof V53_LIB!=='undefined'?Number(V53_LIB.libraryToken)||0:0;
    const cache=MF549_LIBRARY_LOOKUP_CACHE;
    if(cache.library===library&&cache.length===library.length&&cache.token===token&&cache.value){
      MF549_STATS.libraryLookupHits++;
      return cache.value;
    }
    const value=mf549LibraryLookupBase.apply(this,arguments);
    MF549_LIBRARY_LOOKUP_CACHE={library,length:library.length,token,value};
    MF549_STATS.libraryLookupBuilds++;
    return value;
  };
}
function mf549ClearLibraryLookup(){
  MF549_LIBRARY_LOOKUP_CACHE={library:null,length:-1,token:-1,value:null};
}
if(typeof v53InvalidateLibraryCache==='function'){
  const mf549InvalidateLibraryBase=v53InvalidateLibraryCache;
  v53InvalidateLibraryCache=function(){
    mf549ClearLibraryLookup();
    return mf549InvalidateLibraryBase.apply(this,arguments);
  };
}
if(typeof v46ApplyState==='function'){
  const mf549ApplyStateBase=v46ApplyState;
  v46ApplyState=function(){
    mf549ClearLibraryLookup();
    return mf549ApplyStateBase.apply(this,arguments);
  };
}

/* v268's detached-DOM pass parses and serializes the entire Dashboard HTML
 * before it is mounted. The same Balance finalizer already runs synchronously
 * after render() mounts the Dashboard, before paint. Skip the redundant round
 * trip only during this render path; keep the original helper for other calls.
 */
if(typeof v268UpgradeBalanceHtml==='function'){
  const mf549UpgradeBalanceBase=v268UpgradeBalanceHtml;
  v268UpgradeBalanceHtml=function(html){
    if(MF549_DASHBOARD_DEPTH>0){
      MF549_STATS.markupPassThroughs++;
      return String(html||'');
    }
    return mf549UpgradeBalanceBase.apply(this,arguments);
  };
}

const mf549RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  const outer=MF549_DASHBOARD_DEPTH===0;
  MF549_DASHBOARD_DEPTH++;
  if(outer)MF549_DASHBOARD_SNAPSHOT=null;
  try{return mf549RenderDashboardBase.apply(this,arguments);}
  finally{
    MF549_DASHBOARD_DEPTH--;
    if(!MF549_DASHBOARD_DEPTH)MF549_DASHBOARD_SNAPSHOT=null;
  }
};

window.MediaFlowV549=Object.freeze({
  version:MF549_VERSION,
  inspect:()=>({
    ...MF549_STATS,
    dashboardRenderActive:MF549_DASHBOARD_DEPTH>0,
    cachedLibraryLookup:!!MF549_LIBRARY_LOOKUP_CACHE.value
  })
});
MediaFlowRuntime.version=MF549_VERSION;
