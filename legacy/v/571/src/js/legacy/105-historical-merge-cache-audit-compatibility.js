/* ---------- Historical merge + cache/audit compatibility ---------- */

const v180MergeSessionRespectFieldsBase=v165MergeSessionRespectFields;
v165MergeSessionRespectFields=function(target,...sources){
  const result=v180MergeSessionRespectFieldsBase(
    target,
    ...sources
  );

  const keys=[
    'v180RespectXPVersion',
    'v180TitleRerollsBeforeLog',
    'v180RespectSlotLimit',
    'v180RespectEligibleShown',
    'v180RespectMatchedCount',
    'v180RecommendationHistory',
    'v180RespectMatchedRecommendations',
    'v180ExactTitleXPPerMatch'
  ];

  for(const src of sources){
    if(!src||typeof src!=='object')continue;

    for(const key of keys){
      if(
        Object.prototype.hasOwnProperty.call(src,key) &&
        src[key]!==undefined &&
        src[key]!==null
      ){
        result[key]=(
          typeof src[key]==='object'
            ?JSON.parse(JSON.stringify(src[key]))
            :src[key]
        );
      }
    }
  }

  return result;
};

// When the live XP cache is rebuilt, make the old
// recommendedTitleFollowedRewards statistic count individual v180 matches
// instead of only rewarded sessions.
const v180BuildLiveXPCacheBase=v150BuildLiveXPCache;
v150BuildLiveXPCache=function(){
  const c=v180BuildLiveXPCacheBase();

  let matchedTitles=0;

  for(const s of (S.sessions||[])){
    if(Number(s?.v180RespectXPVersion)>=V180_RESPECT_XP_VERSION){
      matchedTitles+=Math.max(
        0,
        Math.floor(Number(s.v180RespectMatchedCount)||0)
      );
    }else if(s?.v165RecommendedTitleFollowed){
      matchedTitles++;
    }
  }

  c.recommendedTitleFollowedRewards=matchedTitles;
  return c;
};

function v180RespectHistoryAudit(state){
  let count=0;
  let matched=0;
  let rerolls=0;
  let xor=0;
  let sum=0;

  for(const s of (state?.sessions||[])){
    if(Number(s?.v180RespectXPVersion)<V180_RESPECT_XP_VERSION)continue;

    count++;
    matched+=Math.max(
      0,
      Math.floor(Number(s.v180RespectMatchedCount)||0)
    );
    rerolls+=Math.max(
      0,
      Math.floor(Number(s.v180TitleRerollsBeforeLog)||0)
    );

    const hash=v176Fnv(
      JSON.stringify({
        id:String(s.id||''),
        slots:Number(s.v180RespectSlotLimit)||0,
        matched:Number(s.v180RespectMatchedCount)||0,
        history:Array.isArray(s.v180RecommendationHistory)
          ?s.v180RecommendationHistory
          :[],
        matches:Array.isArray(s.v180RespectMatchedRecommendations)
          ?s.v180RespectMatchedRecommendations
          :[]
      })
    );

    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,matched,rerolls,xor,sum};
}

function v180CurrentTaskAudit(state){
  const task=state?.currentTask;
  if(!task)return {id:'',count:0,xor:0};

  const history=Array.isArray(task.v180RecommendationHistory)
    ?task.v180RecommendationHistory
    :[];

  return {
    id:String(task.id||''),
    count:history.length,
    xor:v176Fnv(JSON.stringify(history))
  };
}

/* ---------- Protected Sync Now verification ---------- */

const v180VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v180VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const ca=v180RespectHistoryAudit(cloudState);
  const ea=v180RespectHistoryAudit(expected);

  if(
    ca.count!==ea.count ||
    ca.matched!==ea.matched ||
    ca.rerolls!==ea.rerolls ||
    ca.xor!==ea.xor ||
    ca.sum!==ea.sum
  ){
    problems.push('Title-reroll Respect XP History');
  }

  const ct=v180CurrentTaskAudit(cloudState);
  const et=v180CurrentTaskAudit(expected);

  if(
    ct.id!==et.id ||
    ct.count!==et.count ||
    ct.xor!==et.xor
  ){
    problems.push('Current task reroll history');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Apply loaded state ---------- */

const v180ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v180ApplyStateBase.apply(this,arguments);

  if(
    S.currentTask &&
    S.settings?.exactTitleRecommendations
  ){
    v180EnsureRecommendationHistory(S.currentTask);
  }

  return result;
};

