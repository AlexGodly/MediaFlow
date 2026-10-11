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

function v180RespectMatchInfo(task,entries,groupRows){
  if(!S.settings?.exactTitleRecommendations){
    return {
      slotLimit:0,
      eligible:[],
      matched:[],
      matchedCount:0
    };
  }

  const history=v180EnsureRecommendationHistory(task);
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
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const groupRows=v165GroupSessions(sessionGroupId);

  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===
      String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  // currentRerolls remains CATEGORY rerolls ("Give me something else").
  // v180 title rerolls never touch this value, therefore browsing next
  // recommended titles has no first-pick/no-Skip penalty.
  const hadCategoryReroll=st.currentRerolls>0;

  st.noSkipStreak++;

  if(hadCategoryReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(
    st.bestNoSkipStreak,
    st.noSkipStreak
  );
  st.bestNoRerollStreak=Math.max(
    st.bestNoRerollStreak,
    st.noRerollStreak
  );

  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const match=v180RespectMatchInfo(
    task,
    entries,
    groupRows
  );

  const categoryXP=Math.max(
    0,
    Math.round(Number(cfg.categoryBaseXP)||0)
  );

  const exactPerTitle=Math.max(
    0,
    Math.round(Number(cfg.exactTitleBaseXP)||0)
  );

  const exactTitleXP=exactEnabled
    ?exactPerTitle*match.matchedCount
    :0;

  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v165RespectMultipliers(
    st.noSkipStreak,
    st.noRerollStreak
  );
  const levelingEnabled=levelingSettings().enabled!==false;

  const bonus=levelingEnabled
    ?Math.max(
      0,
      Math.round(
        baseRespectXP*
        mult.noSkip*
        mult.noReroll
      )
    )
    :0;

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

