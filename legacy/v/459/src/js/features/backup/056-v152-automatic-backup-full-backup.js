/* ============================================================
   MediaFlow v152 — Automatic Backup = Full Backup
   ------------------------------------------------------------
   Before v152, automatic folder backups still serialized snapshot()
   directly. That covered the core account state but skipped newer
   portable extras introduced by the modern Full Backup pipeline,
   such as the saved Rating Queue and portable UI preferences.

   v152 routes BOTH scheduled automatic backups and the manual
   "Save backup now" folder backup through the FINAL full-backup
   builder chain (v148 -> v149 -> v150), so folder backups and the
   normal Export JSON backup now carry the same complete data model.
   ============================================================ */

backupSnapshot=function(){
  // v148BuildFullBackup is intentionally resolved at call time.
  // At this point it is the FINAL wrapped builder, including:
  // - v148 complete-data backup + Rating Queue / portable UI prefs
  // - v149 streak-XP schema/metadata
  // - v150 performance-model compatibility metadata
  return v148BuildFullBackup();
};



