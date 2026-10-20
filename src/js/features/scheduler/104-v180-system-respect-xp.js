/* ============================================================
   v180 SYSTEM RESPECT XP
   ------------------------------------------------------------
   Exact-title XP is now earned PER respected recommendation slot.
   For Movies/other per-title units, target 3 means Recommendations #1–#3
   can each independently earn exact-title XP.
   Rerolls after those slots are never penalized; they simply do not replace
   a missed earlier Respect slot.
   ============================================================ */

function v180LoggedTitleSet(entries,groupRows){
  const ids=new Set();
  const titles=new Set();

  const add=(libraryId,title,qty)=>{
    if(!(Number(qty)>0))return;

    const id=String(libraryId||'');
    const key=v165NormalizedTitle(title||'');

    if(id)ids.add(id);
    if(key)titles.add(key);
  };

  for(const e of (entries||[])){
    add(e?.libraryId,e?.title,e?.qty);
  }

  for(const s of (groupRows||[])){
    for(const t of (s?.titles||[])){
      add(t?.libraryId,t?.title,t?.qty);
    }
  }

  return {ids,titles};
}

/* Read-only version of v180EnsureRecommendationHistory. The preview must
 * never create IDs, append recommendation slots, or touch account state. */
function v180PeekRecommendationHistory(task){
  if(!task||!S.settings?.exactTitleRecommendations)return [];
  const previous=Array.isArray(task.v180RecommendationHistory)
    ?task.v180RecommendationHistory.filter(x=>x&&typeof x==='object').map((x,index)=>({
       libraryId:String(x.libraryId||''),title:cleanTitle(x.title||''),index
     }))
    :[];
  if(previous.length||( !task.libraryId&&!task.title))return previous;
  return [{libraryId:String(task.libraryId||''),title:cleanTitle(task.title||''),index:0}];
}
function v180RespectMatchInfo(task,entries,groupRows,readOnly=false){
  if(!S.settings?.exactTitleRecommendations){
    return {
      slotLimit:0,
      eligible:[],
      matched:[],
      matchedCount:0
    };
  }

  const history=readOnly?v180PeekRecommendationHistory(task):v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const eligible=history.slice(0,slotLimit);
  const logged=v180LoggedTitleSet(entries,groupRows);
  const matched=[];

  for(let index=0;index<eligible.length;index++){
    const rec=eligible[index];
    const ident=v180RecommendationIdentity(rec);

    const hit=
      (ident.id&&logged.ids.has(ident.id)) ||
      (ident.title&&logged.titles.has(ident.title));

    if(hit){
      matched.push({
        slot:index+1,
        libraryId:ident.id,
        title:cleanTitle(
          v180ResolveHistoryItem(rec)?.title||
          rec.title||
          ''
        )
      });
    }
  }

  return {
    slotLimit,
    eligible,
    matched,
    matchedCount:matched.length
  };
}

// Compatibility helper now means "at least one eligible recommendation was
// actually logged", not merely "the final title currently on the task".
v165RecommendedTitleLogged=function(task,entries,groupRows){
  return v180RespectMatchInfo(
    task,
    entries,
    groupRows
  ).matchedCount>0;
};

// FINAL respect reward implementation. It preserves v167's user-configurable
// category/title XP and streak multipliers, while changing exact-title credit
// from one boolean to a per-eligible-title count.
/* The final v180 award and the v537 estimate share this exact pure
 * calculation. Preview uses clones of Respect settings/streak state and a
 * read-only recommendation history. Only submit applies the streak changes. */
function v180CalculateRespectAward(task,entries,groupRows,readOnly=false){
  const st=readOnly?v165NormalizeRespectState(S.respectState):v165EnsureRespectState();
  const cfg=readOnly?v167NormalizeRespectConfig(S.settings?.systemRespectXP):v167RespectConfig();
  const respected=groupRows.some(s=>s&&s.status!=='skipped'&&
    String(s.categoryId||'')===String(task?.categoryId||'')&&Number(s.actualAmount)>0);
  const hadCategoryReroll=st.currentRerolls>0;
  const noSkipStreak=respected?st.noSkipStreak+1:0;
  const noRerollStreak=respected?(hadCategoryReroll?0:st.noRerollStreak+1):0;
  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const match=respected?v180RespectMatchInfo(task,entries,groupRows,readOnly):
    {slotLimit:0,eligible:[],matched:[],matchedCount:0};
  const categoryXP=respected?Math.max(0,Math.round(Number(cfg.categoryBaseXP)||0)):0;
  const exactPerTitle=Math.max(0,Math.round(Number(cfg.exactTitleBaseXP)||0));
  const exactTitleXP=respected&&exactEnabled?exactPerTitle*match.matchedCount:0;
  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v167RespectMultipliersFromConfig(cfg,noSkipStreak,noRerollStreak);
  const bonus=respected&&levelingSettings().enabled!==false
    ?Math.max(0,Math.round(baseRespectXP*mult.noSkip*mult.noReroll)):0;
  return {respected,hadCategoryReroll,noSkipStreak,noRerollStreak,exactEnabled,
    cfg,match,categoryXP,exactPerTitle,exactTitleXP,baseRespectXP,mult,bonus};
}

// FINAL Respect reward implementation. Historic stored rewards are immutable.
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const groupRows=v165GroupSessions(sessionGroupId);
  const award=v180CalculateRespectAward(task,entries,groupRows,false);
  const st=v165EnsureRespectState();
  if(!award.respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }
  st.noSkipStreak=award.noSkipStreak;
  st.noRerollStreak=award.noRerollStreak;
  st.bestNoSkipStreak=Math.max(st.bestNoSkipStreak,st.noSkipStreak);
  st.bestNoRerollStreak=Math.max(st.bestNoRerollStreak,st.noRerollStreak);
  const {cfg,match,categoryXP,exactPerTitle,exactTitleXP,baseRespectXP,
    mult,bonus,exactEnabled}=award;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=categoryXP;
    target.v165RecommendedTitleBaseXP=exactTitleXP;
    target.v165RecommendedTitleFollowed=match.matchedCount>0;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;

    // Keep legacy single-title fields populated with the INITIAL recommendation
    // for older views/backups that know only one title.
    const initial=match.eligible[0]||
      v180EnsureRecommendationHistory(task)[0]||
      null;

    target.v165RecommendedLibraryId=exactEnabled
      ?String(initial?.libraryId||task?.libraryId||'')
      :'';
    target.v165RecommendedTitle=exactEnabled
      ?cleanTitle(initial?.title||task?.title||'')
      :'';

    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;

    // v180 audit fields.
    target.v180RespectXPVersion=V180_RESPECT_XP_VERSION;
    target.v180TitleRerollsBeforeLog=Math.max(
      0,
      v180EnsureRecommendationHistory(task).length-1
    );
    target.v180RespectSlotLimit=match.slotLimit;
    target.v180RespectEligibleShown=match.eligible.length;
    target.v180RespectMatchedCount=match.matchedCount;
    target.v180RespectMatchedRecommendations=
      match.matched.map(x=>Object.assign({},x));
    target.v180RecommendationHistory=
      v180EnsureRecommendationHistory(task)
        .map(x=>Object.assign({},x));
    target.v180ExactTitleXPPerMatch=exactPerTitle;

    // Preserve the exact configurable reward settings that produced this row.
    target.v167RespectConfigAtLog={
      categoryBaseXP:categoryXP,
      exactTitleBaseXP:exactPerTitle,
      noSkipGrowthPercent:cfg.noSkipGrowthPercent,
      noSkipCapPercent:cfg.noSkipCapPercent,
      firstPickGrowthPercent:cfg.firstPickGrowthPercent,
      firstPickCapPercent:cfg.firstPickCapPercent
    };
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=exactEnabled
      ?` · ${match.matchedCount}/${match.slotLimit} recommended title${match.slotLimit===1?'':'s'} respected`
      :'';

    setTimeout(()=>showToast(
      `System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`
    ),0);
  }

  return bonus;
};

