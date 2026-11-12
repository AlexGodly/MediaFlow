/* MediaFlow v565 — fixes.
 *
 * 1. Library History: the "More · N titles" button had the same class as the
 *    More popup's full-screen backdrop (.mf562-more: position fixed, inset 0),
 *    so the button stretched over the whole log entry. The button now has its
 *    own class (.mf562-more-btn, in 405-v562 and its stylesheet).
 * 2. Automatic Backups: a browser only keeps a backup folder's permission for
 *    the session unless the person allows it on every visit. After a reload the
 *    permission is "prompt", the folder handle was dropped and the backup timer
 *    silently wrote nothing. MediaFlow now keeps the handle, says that backups
 *    are paused, and re-allows the folder with one click (a click is required
 *    by the browser).
 * 3. Fallback copy (mediaflow_states) after v556: the background copy was an
 *    unconditional write. If another device (the MediaFlow app or another
 *    browser) wrote a newer copy after this tab's last merge, this tab now
 *    merges the newer records first and only then writes, so an older tab can
 *    no longer replace a newer fallback copy. Per-record storage itself already
 *    merges record by record.
 */
const V565_RELEASE=565;
const MF565={backupHandle:null,backupNoticeShown:false,legacyGuards:0,legacyDeferred:0};

/* ---------- 2. Automatic Backups survive a reload ---------- */
async function mf565StoredBackupHandle(){
  try{
    const db=await idbOpen();
    const tx=db.transaction('handles','readonly');
    const r=tx.objectStore('handles').get('folder');
    const h=await new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
    db.close();
    return h||null;
  }catch(_){return null;}
}
const mf565RestoreBackupFolderBase=restoreBackupFolder;
restoreBackupFolder=async function(){
  await mf565RestoreBackupFolderBase.apply(this,arguments);
  if(backupFolderHandle)return;
  const h=await mf565StoredBackupHandle();
  if(!h||typeof h.queryPermission!=='function')return;
  try{
    const p=await h.queryPermission({mode:'readwrite'});
    if(p==='granted'){backupFolderHandle=h;return;}
    if(p==='prompt'){MF565.backupHandle=h;if(S.settings?.backup?.enabled)mf565BackupNotice();}
  }catch(_){}
};
function mf565BackupNotice(){
  if(MF565.backupNoticeShown||document.getElementById('mf565-backup-notice'))return;
  MF565.backupNoticeShown=true;
  const el=document.createElement('div');
  el.id='mf565-backup-notice';el.className='mf565-notice';el.setAttribute('role','status');
  el.innerHTML='<div><b>Automatic backups are paused</b><span>Your browser needs permission to write to the backup folder again.</span></div>'+
    '<button type="button" class="btn btn-sm btn-primary" onclick="App.mf565AllowBackupFolder()">Allow folder</button>'+
    '<button type="button" class="btn btn-sm btn-ghost" aria-label="Dismiss" onclick="this.parentElement.remove()">✕</button>';
  document.body.appendChild(el);
}
async function mf565AllowBackupFolder(){
  const h=MF565.backupHandle;
  document.getElementById('mf565-backup-notice')?.remove();
  if(!h){await openBackupFolder();return;}
  try{
    const p=await h.requestPermission({mode:'readwrite'});
    if(p==='granted'){
      backupFolderHandle=h;MF565.backupHandle=null;
      await saveBackupNow(true);
      return;
    }
  }catch(_){}
  await openBackupFolder();
}
const mf565SaveBackupNowBase=saveBackupNow;
saveBackupNow=async function(manual=false){
  if(!manual&&S.settings?.backup?.enabled&&!backupFolderHandle){
    if(MF565.backupHandle)mf565BackupNotice();
    return;
  }
  return mf565SaveBackupNowBase.apply(this,arguments);
};

/* ---------- 3. The fallback copy never goes backwards ---------- */
async function mf565LegacyMarker(){
  const {data,error}=await supabase.from('mediaflow_states').select('updated_at,state_data->mf556').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error||!data)return null;
  const marker=data.mf556||data['state_data->mf556']||null;
  return {marker,updatedAt:data.updated_at};
}
// Is the cloud copy newer than everything this tab has merged?
function mf565LegacyIsAhead(info){
  const m=info?.marker;
  if(!m||!m.device||m.device===mf556Device())return false;
  const merged=Date.parse(MF556.cursor||'')||0;
  return Number(m.at)>merged+5000;
}
const mf565WriteLegacyBase=mf556WriteLegacy;
mf556WriteLegacy=async function(){
  if(!MF556.legacyDirty||MF556.legacyBusy||!AUTH_USER||V115_STARTUP_GUARD)return;
  try{
    const info=await mf565LegacyMarker();
    if(mf565LegacyIsAhead(info)){
      MF565.legacyGuards++;
      const r=await mf556Pull();
      if(!r||r.skipped||r.error){
        // Couldn't merge yet (tab hidden, busy or offline): keep the change and try later.
        MF565.legacyDeferred++;MF556.legacyDirty=true;
        setTimeout(()=>mf556ScheduleLegacy(),MF556_LEGACY_INTERVAL);
        return;
      }
    }
  }catch(_){/* reading the marker failed: write as before */}
  return mf565WriteLegacyBase.apply(this,arguments);
};

Object.assign(App,{mf565AllowBackupFolder});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{stats:()=>({...MF565,backupHandle:!!MF565.backupHandle})});
