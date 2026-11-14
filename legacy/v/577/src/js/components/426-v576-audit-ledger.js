/* MediaFlow v576 — the persistence audit no longer reports false problems.
 *
 * Settings → Data audit (v507) compared the account with the full backup and
 * the automatic export. Building those fills in the XP ledger's empty
 * sections (libraryEdits, manualCovers, logCompletions, ratings) the first
 * time, so a fresh account showed "xpLedger backup / automatic export
 * mismatch" and "Read-only audit changed account data" although nothing was
 * missing or lost. The ledger is now completed before the comparison, so the
 * report only lists real differences.
 */
const mf576AuditBase=mf507AuditPersistence;
mf507AuditPersistence=function(){
  // Same normalisation the exports do (empty ledger sections), done first.
  try{if(typeof v348Ledger==='function')v348Ledger();}catch(_){}
  try{v148BuildFullBackup();backupSnapshot();}catch(_){}
  return mf576AuditBase.apply(this,arguments);
};
App.v507AuditPersistence=mf507AuditPersistence;
window.MediaFlowV576={version:576};
