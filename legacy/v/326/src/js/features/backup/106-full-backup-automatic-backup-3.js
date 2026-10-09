/* ---------- Full Backup / Automatic Backup ---------- */

const v180BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v180BuildFullBackupBase();

  payload.backupSchemaVersion=V180_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V180_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v180 backup. Includes task-local same-category recommended-title reroll history, current recommendation state, and per-title System Respect XP audit data. Title rerolls never reset category Respect streaks. For per-title tasks such as Movies, the first required number of recommendations are independent exact-title Respect XP slots; later rerolls remain usable choices but do not replace missed earlier slots.';

  return payload;
};

const v180BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v180BackupManifestBase(
    state,
    extras
  );
  const audit=v180RespectHistoryAudit(state);
  const current=v180CurrentTaskAudit(state);

  manifest.schemaVersion=V180_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      sameCategoryTitleRerolls:true,
      currentTaskRerollHistory:true,
      recommendationHistoryCoversByLibraryReference:true,
      multiTitleSystemRespectXP:true,
      titleRerollsWithoutRespectPenalty:true,
      firstRequiredRecommendationsRespectSlots:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      v180RespectRewardSessions:audit.count,
      v180MatchedRecommendedTitles:audit.matched,
      v180HistoricalTitleRerolls:audit.rerolls,
      currentTaskRecommendationHistory:current.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.



