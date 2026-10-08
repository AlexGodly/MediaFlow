/* ============================================================
   MediaFlow v168 — Settings cleanup
   ------------------------------------------------------------
   Removed the visible MyAnimeList username/list-sync card from Settings.
   MAL XML import, imported MAL metadata, Jikan seasonal detection and legacy
   internal helpers remain intact for compatibility.
   ============================================================ */

const v168BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v168BuildFullBackupBase();

  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v168 backup. The old MyAnimeList username/list-sync Settings card is no longer shown; persistent account data, MAL-imported metadata, automatic Seasonal/Jikan state, System Respect XP, themes, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences remain preserved.';
  }

  return payload;
};



