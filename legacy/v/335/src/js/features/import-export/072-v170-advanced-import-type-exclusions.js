/* ============================================================
   MediaFlow v170 — Advanced import type exclusions
   ------------------------------------------------------------
   Option 2 now lets each detected source type be either:
   - routed to a MediaFlow category; or
   - marked "Don't import", which skips every record of that type before any
     Library matching or mutation happens.

   Exclusion choices are intentionally temporary import-workspace state.
   The resulting Library remains fully covered by the existing cloud, Sync Now,
   Full Backup, Automatic Backup and JSON backup pipelines.
   ============================================================ */

const v170BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v170BuildFullBackupBase();
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v170 backup. Advanced Option 2 can block selected source types from an import; temporary type-routing/exclusion choices are runtime-only, while all imported Library results and existing account data remain preserved through the normal backup/cloud pipelines.';
  }

  return payload;
};



