/* MediaFlow v201 source fragment
 * Backups, stopwatch, analytics and library workflow foundations
 * Original HTML lines 11271-12359.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   V16 FEATURES: BACKUPS, THEMES, STOPWATCH, MAL LINK, STATS
   ============================================================ */
const BACKUP_DB='MediaFlowBackupDB';
let backupFolderHandle=null, backupTimer=null;
function applyTheme(theme){
  const t=['dark','light','amoled'].includes(theme)?theme:'dark';
  document.documentElement.dataset.theme=t;
  if(S.settings)S.settings.theme=t;
  try{localStorage.setItem('mf_theme',t);}catch(e){}
}
function initTheme(){try{applyTheme(S.settings?.theme||localStorage.getItem('mf_theme')||'dark');}catch(e){applyTheme('dark');}}
function backupSnapshot(){return JSON.parse(JSON.stringify(snapshot()));}
async function openBackupFolder(){
  if(!window.showDirectoryPicker){alert('Automatic file backups need a Chromium-based desktop browser with File System Access support.');return;}
  try{backupFolderHandle=await window.showDirectoryPicker({mode:'readwrite'}); await saveBackupNow(true); await configureBackupPersistence(); render();}
  catch(e){if(e?.name!=='AbortError')alert('Could not access that folder.');}
}
function idbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(BACKUP_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('handles');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function configureBackupPersistence(){if(!backupFolderHandle)return;try{const db=await idbOpen();const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(backupFolderHandle,'folder');await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();}catch(e){}}
async function restoreBackupFolder(){try{const db=await idbOpen();const tx=db.transaction('handles','readonly');const r=tx.objectStore('handles').get('folder');const h=await new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();if(h){const p=await h.queryPermission({mode:'readwrite'});if(p==='granted')backupFolderHandle=h;}}catch(e){}}
function backupFilename(){const d=new Date();const z=n=>String(n).padStart(2,'0');return `mediaflow-backup-${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.json`;}
async function saveBackupNow(manual=false){
  if(!S.settings?.backup?.enabled && !manual)return;
  if(!backupFolderHandle){if(manual)await openBackupFolder();return;}
  try{
    const filename=S.settings.backup.mode==='single'?(S.settings.backup.fileName||'mediaflow-backup.json'):backupFilename();
    const fh=await backupFolderHandle.getFileHandle(filename,{create:true});const w=await fh.createWritable();await w.write(JSON.stringify(backupSnapshot(),null,2));await w.close();
    S.settings.backup.lastBackup=Date.now(); if(!manual) await persistSettings();
    if(manual)showToast('Backup saved ✓');
  }catch(e){console.warn('Backup failed',e);if(manual)alert('Backup could not be written. Re-select the backup folder if needed.');}
}
function restartBackupTimer(){clearInterval(backupTimer);backupTimer=null;if(!S.settings?.backup?.enabled)return;const ms=Math.max(1,Number(S.settings.backup.interval)||60)*60000;backupTimer=setInterval(()=>saveBackupNow(false),ms);}
function showToast(msg){let t=document.getElementById('mf-toast');if(!t){t=document.createElement('div');t.id='mf-toast';t.style.cssText='position:fixed;right:18px;bottom:18px;background:var(--panel-raised);color:var(--text);border:1px solid var(--border);padding:10px 14px;border-radius:10px;z-index:2000;box-shadow:0 12px 30px #0005;font-size:12px;font-weight:700;';document.body.appendChild(t);}t.textContent=msg;clearTimeout(window.__mfToast);window.__mfToast=setTimeout(()=>t.remove(),2200);}
function stopwatchTick(){if(!S.stopwatch)return;const el=document.getElementById('stopwatch-display');if(!el)return;const elapsed=S.stopwatch.running?(S.stopwatch.elapsed+(Date.now()-S.stopwatch.startedAt)):S.stopwatch.elapsed;el.textContent=fmtStopwatch(elapsed);}
function fmtStopwatch(ms){const sec=Math.max(0,Math.floor((Number(ms)||0)/1000));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function stopwatchStart(){if(S.stopwatch.running)return;S.stopwatch.running=true;S.stopwatch.startedAt=Date.now();persistTask();render();clearInterval(window.__sw);window.__sw=setInterval(stopwatchTick,250);}
function stopwatchPause(){if(!S.stopwatch.running)return;S.stopwatch.elapsed+=Date.now()-S.stopwatch.startedAt;S.stopwatch.running=false;S.stopwatch.startedAt=0;persistTask();render();clearInterval(window.__sw);}
function stopwatchSetTime(){if(S.stopwatch.running)return;const h=Math.max(0,Math.min(999,Number(document.getElementById('sw-hours')?.value)||0));const m=Math.max(0,Math.min(59,Number(document.getElementById('sw-minutes')?.value)||0));const sec=Math.max(0,Math.min(59,Number(document.getElementById('sw-seconds')?.value)||0));const ms=Math.round((h*3600+m*60+sec)*1000);S.stopwatch.elapsed=ms;S.stopwatch.resetValue=ms;S.stopwatch.startedAt=0;persistTask();render();showToast(`Stopwatch set to ${fmtStopwatch(ms)} ✓`);}
function stopwatchReset(){if(S.stopwatch.running){S.stopwatch.running=false;S.stopwatch.startedAt=0;}S.stopwatch.elapsed=Math.max(0,Number(S.stopwatch.resetValue)||0);persistTask();render();clearInterval(window.__sw);}
function stopwatchClear(){S.stopwatch={running:false,startedAt:0,elapsed:0,resetValue:0};persistTask();render();clearInterval(window.__sw);}
function stopwatchUseMinutes(){const ms=S.stopwatch.running?(S.stopwatch.elapsed+Date.now()-S.stopwatch.startedAt):S.stopwatch.elapsed;S.logDraft.minutes=Math.max(0,Math.round(ms/60000));render();}
function stopwatchHtml(){const sw=S.stopwatch||{running:false,startedAt:0,elapsed:0,resetValue:0};const ms=sw.running?(sw.elapsed+Date.now()-sw.startedAt):(sw.elapsed||0);const base=Math.max(0,Number(sw.resetValue)||0);const baseSec=Math.floor(base/1000),bh=Math.floor(baseSec/3600),bm=Math.floor(baseSec%3600/60),bs=baseSec%60;return `<div class="card stopwatch-card"><div class="section-label">STOPWATCH</div><div class="stopwatch-display" id="stopwatch-display">${fmtStopwatch(ms)}</div><div class="stopwatch-custom"><div class="stopwatch-time-field"><label>HOURS</label><input id="sw-hours" class="input" type="number" min="0" max="999" step="1" value="${bh}" ${sw.running?'disabled':''}></div><div class="stopwatch-time-field"><label>MINUTES</label><input id="sw-minutes" class="input" type="number" min="0" max="59" step="1" value="${bm}" ${sw.running?'disabled':''}></div><div class="stopwatch-time-field"><label>SECONDS</label><input id="sw-seconds" class="input" type="number" min="0" max="59" step="1" value="${bs}" ${sw.running?'disabled':''}></div><button class="btn" onclick="App.stopwatchSetTime()" ${sw.running?'disabled':''}>Set time</button></div>${base>0?`<small class="hint stopwatch-custom-note" style="display:block">Custom starting time: ${fmtStopwatch(base)} · Reset returns here.</small>`:''}<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary" onclick="App.stopwatchStart()" ${sw.running?'disabled':''}>${sw.running?'Running…':'Start'}</button><button class="btn" onclick="App.stopwatchPause()" ${!sw.running?'disabled':''}>Pause</button><button class="btn btn-ghost" onclick="App.stopwatchReset()">Reset</button><button class="btn btn-ghost" onclick="App.stopwatchClear()">Clear to 00:00:00</button>${S.logging?'<button class="btn" onclick="App.stopwatchUseMinutes()">Use for minutes</button>':''}</div><small class="hint" style="display:block;text-align:center;margin-top:9px;">Set any starting time, press Start, and the stopwatch continues upward from there.</small></div>`;}
function priorityLabel(p){return (p||'medium')[0].toUpperCase()+(p||'medium').slice(1);}
function choosePriority(id){const item=S.library.find(i=>i.id===id);if(!item)return;S.modal={type:'priority',data:{id:item.id,title:cleanTitle(item.title),priority:item.priority||'medium'}};render();}
function priorityModalHtml(d){
  const current=d?.priority||'medium';
  const options=[
    {id:'low',label:'Low',icon:'▼',desc:'A lower-priority title. The scheduler will generally give it less weight.'},
    {id:'medium',label:'Medium',icon:'●',desc:'The normal priority level used by default.'},
    {id:'high',label:'High',icon:'▲',desc:'A title you want the scheduler to pay more attention to.'}
  ];
  return `<div class="priority-modal">
    <div class="modal-title">Set priority</div>
    <div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the priority for <b>${escapeHtml(d?.title||'this title')}</b>.</div>
    <div style="display:grid;gap:8px;">${options.map(o=>`<button type="button" class="priority-choice ${current===o.id?'selected':''}" onclick="App.setPriorityChoice('${escapeHtml(d.id)}','${o.id}')"><span class="priority-choice-icon">${o.icon}</span><span style="text-align:left;flex:1;"><b>${o.label}</b><small>${o.desc}</small></span><span class="priority-choice-check">${current===o.id?'✓':''}</span></button>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
}
function chooseStatusForLibrary(id){const item=S.library.find(i=>i&&i.id===id);if(!item)return;S.modal={type:'libraryStatus',data:{id:item.id,title:cleanTitle(item.title),status:item.status||'planned'}};render();}
function libraryStatusModalHtml(d){
  const current=d?.status||'planned';
  const options=[
    {id:'planned',label:'Plan to Watch',icon:'○',desc:'Planned for later, but not started yet.'},
    {id:'active',label:'Watching',icon:'▶',desc:'Currently being watched or read.'},
    {id:'paused',label:'On Hold',icon:'Ⅱ',desc:'Temporarily set aside without abandoning it.'},
    {id:'completed',label:'Completed',icon:'✓',desc:'Finished and kept as part of your history.'},
    {id:'dropped',label:'Dropped',icon:'×',desc:'Abandoned and excluded from recommendations.'}
  ];
  return `<div class="priority-modal"><div class="modal-title">Set status</div><div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the status for <b>${escapeHtml(d?.title||'this title')}</b>.</div><div class="choice-list">${options.map(o=>`<button type="button" class="status-choice ${current===o.id?'selected':''}" onclick="App.setLibraryStatus('${escapeHtml(d.id)}','${o.id}')"><span class="choice-icon">${o.icon}</span><span style="text-align:left;flex:1"><b>${o.label}</b><small style="display:block;color:var(--text-mute);font-size:11px;line-height:1.35;margin-top:2px">${o.desc}</small></span><span class="choice-check">${current===o.id?'✓':''}</span></button>`).join('')}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
}
function chooseCategoryForLibrary(id){const item=S.library.find(i=>i&&i.id===id);if(!item)return;S.modal={type:'libraryCategory',data:{id:item.id,title:cleanTitle(item.title),categoryId:item.categoryId}};render();}
function libraryCategoryModalHtml(d){
  const current=d?.categoryId;
  const cats=S.categories.filter(c=>c.enabled!==false);
  return `<div class="priority-modal"><div class="modal-title">Set category</div><div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the category for <b>${escapeHtml(d?.title||'this title')}</b>. The category controls its rotation, units, and scheduler behavior.</div><div class="choice-list">${cats.map(c=>`<button type="button" class="category-choice ${current===c.id?'selected':''}" onclick="App.setLibraryCategory('${escapeHtml(d.id)}','${escapeHtml(c.id)}')"><span class="choice-icon" style="color:${escapeHtml(c.color||'var(--flow)')}">${c.icon}</span><span style="text-align:left;flex:1"><b>${escapeHtml(c.name)}</b><small style="display:block;color:var(--text-mute);font-size:11px;line-height:1.35;margin-top:2px">${escapeHtml(unitLabel(c.unit,c.target))} · ${Number(c.minutesPerUnit)||0} min/unit</small></span><span class="choice-check">${current===c.id?'✓':''}</span></button>`).join('')}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
}
function emptyLibraryAdvanced(){
  if(!S.library.length){showToast('Library is already empty');return;}
  S.modal={type:'emptyLibrary',data:{count:S.library.length}};
  render();
}

async function confirmEmptyLibrary(mode){
  if(!S.library.length){S.modal=null;render();return;}
  S.library=[];
  if(mode==='clearTask'){S.currentTask=null;S.sessionActive=false;}
  S.modal=null;
  await saveState();
  render();
  showToast('Library emptied');
}
async function malFetchPage(username,type,page){
  const candidates=[
    `https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/${type}list?page=${page}&limit=300`,
    `https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/${type}list/full?page=${page}`
  ];
  let lastErr=null;
  for(const url of candidates){
    for(let attempt=0;attempt<5;attempt++){
      try{
        const r=await fetch(url,{headers:{Accept:'application/json'}});
        if(r.ok)return await r.json();
        lastErr=new Error(`MAL ${type} sync failed (${r.status})`);
        if(![408,429,500,502,503,504].includes(r.status))throw lastErr;
        const ra=Number(r.headers.get('Retry-After'))||0;
        await new Promise(resolve=>setTimeout(resolve,ra>0?ra*1000:Math.min(15000,1200*2**attempt)));
      }catch(e){
        lastErr=e;
        if(attempt<4)await new Promise(resolve=>setTimeout(resolve,Math.min(15000,1200*2**attempt)));
      }
    }
  }
  throw lastErr||new Error(`MAL ${type} sync failed`);
}
async function malSync(){
  const username=(S.malLink?.username||'').trim();
  if(!username){alert('Enter your MyAnimeList username first.');return;}
  const mode=S.malLink.mode||'anime', types=mode==='both'?['anime','manga']:[mode];
  showImportProgress('MAL sync',0);
  updateImportProgress(0,0,0,0,0,'Starting…');
  let total=0,added=0,updated=0;
  try{
    for(const type of types){
      let page=1,hasNext=true;
      while(hasNext){
        updateImportProgress(1,`Fetching ${type} page ${page}…`);
        const j=await malFetchPage(username,type,page), rows=Array.isArray(j.data)?j.data:[];
        const apiTotal=Number(j.pagination?.items?.total)||0;
        const knownTotal=Number.isFinite(apiTotal)&&apiTotal>0?apiTotal:0;
        const pageDoneBefore=total;
        for(let offset=0;offset<rows.length;offset+=20){
          const batch=rows.slice(offset,offset+20);
          for(const row of batch){
            const d=row.node||row||{}, my=row.list_status||row.listStatus||{}, title=cleanTitle(d.title);
            if(!title)continue;
            const catId=type==='manga'?'manga':(d.airing?'seasonal':'backlog');
            const prog=Number(my.num_episodes_watched??my.num_chapters_read??0)||0;
            const tot=Number(d.num_episodes??d.num_chapters??0)||null;
            let item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase()&&['backlog','seasonal','manga'].includes(i.categoryId));
            if(!item){
              item={id:uid(),title,categoryId:catId,progress:prog,total:tot,status:my.status==='completed'?'completed':(my.status==='watching'||my.status==='reading'?'active':'planned'),priority:'medium',estimatedMinutes:null,tags:['MAL'],source:'mal'};
              S.library.push(item);added++;
            }else{
              item.progress=Math.max(Number(item.progress)||0,prog);
              if(tot)item.total=tot;
              if(catId==='seasonal'&&item.status!=='completed')item.categoryId='seasonal';
              item.tags=[...new Set([...(item.tags||[]),'MAL'])]; item.source='mal'; updated++;
            }
          }
          total+=batch.length;
          const progressTotal=knownTotal>0?knownTotal:Math.max(total,1);
          const progressDone=knownTotal>0?Math.min(total,knownTotal):total;
          updateImportProgress(progressDone,progressTotal,added,updated,0,`Processed ${total.toLocaleString()} ${type} titles…`);
          await yieldToBrowser();
        }
        hasNext=!!j.pagination?.has_next; page++;
        await new Promise(resolve=>setTimeout(resolve,750));
      }
    }
    normalizeSeasonalLibraryItems(); await persistLibrary();
    finishImportProgress(true,'MAL sync complete',`Added ${added}, updated ${updated}, processed ${total} titles.`); render();
  }catch(e){console.error(e);finishImportProgress(false,'MAL sync failed',e.message||String(e));}
}

function renderProfileStatHero(){const url=getAvatarUrl();return `<div class="profile-stat-hero"><div class="profile-stat-avatar">${url?`<img src="${escapeHtml(url)}" alt="Profile picture">`:escapeHtml(profileInitials())}</div><div><div style="font-family:var(--font-display);font-size:30px;font-weight:600;">${escapeHtml(getDisplayName())}</div><div style="color:var(--text-dim);font-size:13px;margin-top:5px;">${escapeHtml(AUTH_USER?.email||'')}</div><div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;"><span class="pill">${S.library.length} titles</span><span class="pill">${S.sessions.length} sessions</span><span class="pill">${fmtMinutes(totalsForSessions(S.sessions).minutes)} consumed</span></div></div></div>`;}
function svgBarChart(data,labelFn,valueFn){
  const rows=Array.isArray(data)?data:[];
  const n=Math.max(1,rows.length);
  const values=rows.map(d=>Math.max(0,Number(valueFn(d))||0));
  const max=Math.max(1,...values);

  // v131: always fit every bar inside the SVG instead of forcing an 8px
  // minimum bar width that made 30/90-day charts overflow their viewBox.
  const w=1000,h=280,left=42,right=22,top=22,bottom=42;
  const plotW=w-left-right,plotH=h-top-bottom;
  const gap=n<=10?12:n<=35?5:2;
  const bw=Math.max(2,(plotW-gap*(n-1))/n);

  // Keep short charts fully labelled. Thin long-axis labels automatically.
  const labelStep=n<=10?1:n<=35?3:7;

  // For 90-day charts, showing a number above all 90 bars becomes unreadable.
  // Keep the strongest non-zero values visible and preserve exact values in tooltips.
  let visibleValues=null;
  if(n>35){
    visibleValues=new Set(
      values.map((v,i)=>({v,i}))
        .filter(x=>x.v>0)
        .sort((a,b)=>b.v-a.v)
        .slice(0,12)
        .map(x=>x.i)
    );
  }

  const bars=rows.map((d,i)=>{
    const v=values[i],bh=plotH*(v/max);
    const x=left+i*(bw+gap),y=top+plotH-bh;
    const rawLabel=String(labelFn(d)||'');
    const showLabel=!!rawLabel && (n<=10 || n>35 || i%labelStep===0 || i===n-1);
    const showValue=n<=10 ? true : n<=35 ? v>0 : visibleValues.has(i);
    const tooltip=[rawLabel||`Item ${i+1}`,String(Math.round(v))].join(' · ');

    return `<g>
      <title>${escapeHtml(tooltip)}</title>
      <rect class="chart-bar" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${Math.max(2,bh).toFixed(2)}" rx="${Math.min(4,bw/2).toFixed(2)}" fill="var(--flow)"/>
      ${showLabel?`<text x="${(x+bw/2).toFixed(2)}" y="${h-13}" text-anchor="middle" font-size="${n>35?10:11}" fill="currentColor" opacity=".72">${escapeHtml(rawLabel)}</text>`:''}
      ${showValue?`<text x="${(x+bw/2).toFixed(2)}" y="${Math.max(14,y-6).toFixed(2)}" text-anchor="middle" font-size="${n>35?9:11}" fill="currentColor" opacity=".86">${Math.round(v)}</text>`:''}
    </g>`;
  }).join('');

  return `<svg class="chart-svg v131-chart-svg" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">
    <line x1="${left}" y1="${top+plotH}" x2="${w-right}" y2="${top+plotH}" stroke="currentColor" opacity=".25"/>
    ${bars}
  </svg>`;
}
function weeklyStatsData(){const out=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);out.push({date:iso,label:d.toLocaleDateString(undefined,{weekday:'short'}),minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(s.minutes||0),0),tasks:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').length});}return out;}
function renderStatsV14(){
 const life=totalsForSessions(S.sessions), today=totalsForSessions(todaysSessions()), week=totalsForSessions(sessionsInRange(7)), month=totalsForSessions(sessionsInRange(30));
 const enabledCats=S.categories.filter(c=>c.enabled), last7=weeklyStatsData();
 const last30=[]; for(let i=29;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);last30.push({date:iso,label:d.toLocaleDateString(undefined,{month:'short',day:'numeric'}),minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0),tasks:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').length});}
 const last90=[]; for(let i=89;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);last90.push({date:iso,label:i%7===0?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'',minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0)});}
 const catData=enabledCats.map(c=>({c,m:S.sessions.filter(s=>s.categoryId===c.id&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0),tasks:S.sessions.filter(s=>s.categoryId===c.id&&s.status!=='skipped').length})).sort((a,b)=>b.m-a.m);
 const statusData=['planned','active','paused','completed','dropped'].map(k=>({label:v199StatusLabel(k),value:S.library.filter(i=>i.status===k).length}));
 const priorityData=['high','medium','low'].map(k=>({label:k[0].toUpperCase()+k.slice(1),value:S.library.filter(i=>i.priority===k).length}));
 const mediaMap={}; S.sessions.forEach(s=>{if(s.status==='skipped')return;const cat=S.categories.find(c=>c.id===s.categoryId);const type=cat?.type||'other';mediaMap[type]=(mediaMap[type]||0)+(Number(s.minutes)||0);});
 const mediaData=Object.entries(mediaMap).map(([label,value])=>({label,value}));
 const totalUnits=life.episodes+life.chapters+life.movies+life.issues;
 const avgDaily7=Math.round(last7.reduce((a,d)=>a+d.minutes,0)/7), avgSession=S.sessions.length?Math.round(life.minutes/S.sessions.length):0;
 const longestDay=Math.max(...last30.map(d=>d.minutes),0), mostActiveDay=last30.find(d=>d.minutes===longestDay)?.date;
 const mostActiveDayLabel=mostActiveDay?new Date(mostActiveDay+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}):'—';
 const maxCat=Math.max(1,...catData.map(x=>x.m));
 const bars=(data,val)=>svgBarChart(data,d=>d.label,d=>d[val]);
 const compactList=(data,unit='')=>data.length?data.map(x=>`<div class="record-row"><span class="k">${escapeHtml(x.label)}</span><span class="v">${Math.round(x.value)}${unit}</span></div>`).join(''):'<div class="empty-state">No data yet.</div>';
 const level=mediaFlowLevelInfo();
 return `<div class="view-head"><div><div class="view-title">Statistics</div><div class="view-desc">Your consumption, measured from every angle.</div></div></div>${renderProfileStatHero()}
 <div class="card stats-level-card" style="margin:0 0 24px;padding:18px 20px;"><div class="section-label">LEVELING</div><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;"><div><div style="font-family:var(--font-display);font-size:30px;font-weight:700;line-height:1;">Level ${level.level}</div><div class="hint" style="margin-top:6px;">${level.xp.toLocaleString()} lifetime XP</div></div><div style="min-width:220px;flex:1;max-width:600px;"><div class="stats-level-track"><div class="stats-level-fill" style="width:${level.pct}%"></div></div><div class="stats-level-meta"><span>${level.current.toLocaleString()} / ${level.needed.toLocaleString()} XP</span><span class="stats-level-percent">${level.pct}%</span></div><div class="stats-level-caption"><span>${level.needed-level.current===0?'Ready for the next level':'Progress toward Level '+(level.level+1)}</span><span>${level.needed-level.current===0?'':' '+(level.needed-level.current).toLocaleString()+' XP remaining'}</span></div></div></div><div class="record-list" style="margin-top:15px;"><div class="record-row"><span class="k">Consumption XP</span><span class="v">${S.sessions.reduce((a,s)=>a+sessionStoredXP(s),0).toLocaleString()}</span></div><div class="record-row"><span class="k">Library XP</span><span class="v">${libraryXPTotal().toLocaleString()}</span></div></div></div>
 <div class="grid-3" style="margin-bottom:24px;">${statCard('Today',today)}${statCard('This week',week)}${statCard('This month',month)}</div>
 <div class="grid-3" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIFETIME</div><div class="big-stat">${fmtMinutes(life.minutes)}</div><div class="hint">Total time consumed</div></div><div class="card"><div class="section-label">UNITS</div><div class="big-stat">${totalUnits.toLocaleString()}</div><div class="hint">Episodes, chapters, movies & issues</div></div><div class="card"><div class="section-label">STREAK</div><div class="big-stat">${computeDayStreak()} 🔥</div><div class="hint">Current consecutive days</div></div></div>
 <div class="two-col v131-stats-chart-stack" style="margin-bottom:24px;"><div class="card"><div class="section-label">7-DAY MINUTES</div>${bars(last7,'minutes')}</div><div class="card"><div class="section-label">7-DAY SESSIONS</div>${bars(last7,'tasks')}</div></div>
 <div class="two-col v131-stats-chart-stack" style="margin-bottom:24px;"><div class="card"><div class="section-label">30-DAY DAILY MINUTES</div>${svgBarChart(last30,d=>d.label,d=>d.minutes)}</div><div class="card"><div class="section-label">90-DAY ACTIVITY</div>${svgBarChart(last90,d=>d.label,d=>d.minutes)}</div></div>
 <div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">30-DAY CATEGORY MIX</div>${catData.map(x=>`<div class="bal-bar-row"><div class="bal-bar-label">${v144CategoryIconHtml(x.c)} ${escapeHtml(x.c.name)}</div><div class="bal-bar-track"><div class="bal-bar-fill" style="width:${Math.round(x.m/maxCat*100)}%;background:${x.c.color};"></div></div><div class="bal-bar-val">${fmtMinutes(x.m)}</div></div>`).join('')||'<div class="empty-state">No data yet.</div>'}</div><div class="card"><div class="section-label">MEDIA TYPE MIX</div>${compactList(mediaData.map(x=>({label:x.label,value:x.value})))}</div></div>
 <div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIBRARY STATUS</div>${compactList(statusData)}</div><div class="card"><div class="section-label">PRIORITY DISTRIBUTION</div>${compactList(priorityData)}</div></div>
 ${(()=>{const r=v81RepeatTotals();const units=r.episodes+r.chapters+r.issues+r.movies;if(!units)return '';return `<div class="card" style="margin-bottom:24px"><div class="section-label">↻ REPEAT CONSUMPTION</div><div class="record-list"><div class="record-row"><span class="k">Repeat sessions</span><span class="v">${r.sessions.toLocaleString()}</span></div><div class="record-row"><span class="k">Episodes rewatched</span><span class="v">${r.episodes.toLocaleString()}</span></div><div class="record-row"><span class="k">Chapters reread</span><span class="v">${r.chapters.toLocaleString()}</span></div><div class="record-row"><span class="k">Issues reread</span><span class="v">${r.issues.toLocaleString()}</span></div><div class="record-row"><span class="k">Movies rewatched</span><span class="v">${r.movies.toLocaleString()}</span></div><div class="record-row"><span class="k">Repeat time</span><span class="v">${fmtMinutes(r.minutes)}</span></div></div></div>`;})()}<div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIBRARY HEALTH</div><div class="record-list"><div class="record-row"><span class="k">Library titles</span><span class="v">${S.library.length}</span></div><div class="record-row"><span class="k">Watching titles</span><span class="v">${S.library.filter(i=>i.status==='active').length}</span></div><div class="record-row"><span class="k">Completed titles</span><span class="v">${S.library.filter(i=>i.status==='completed').length}</span></div><div class="record-row"><span class="k">Total units logged</span><span class="v">${totalUnits.toLocaleString()}</span></div></div></div><div class="card"><div class="section-label">ADVANCED METRICS</div><div class="record-list"><div class="record-row"><span class="k">Average daily minutes (7d)</span><span class="v">${fmtMinutes(avgDaily7)}</span></div><div class="record-row"><span class="k">Average session</span><span class="v">${fmtMinutes(avgSession)}</span></div><div class="record-row"><span class="k">Most active day</span><span class="v">${escapeHtml(mostActiveDayLabel)}</span></div><div class="record-row"><span class="k">Peak day minutes</span><span class="v">${fmtMinutes(longestDay)}</span></div><div class="record-row"><span class="k">Lifetime sessions</span><span class="v">${S.sessions.length}</span></div></div></div></div>`;
}
renderStats=renderStatsV14;


/* ============================================================
   V28 ANALYTICS / COVER / TIMELINE HELPERS
   ============================================================ */
function dayKeyLocal(d){ const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
function buildDailyActivity(days){
  const map=new Map();
  const cutoff=Date.now()-days*86400000;
  for(const s of S.sessions){ if(s.timestamp<cutoff||s.status==='skipped') continue; const k=s.date||dayKeyLocal(s.timestamp); let v=map.get(k); if(!v)v={minutes:0,sessions:0}; v.minutes+=Number(s.minutes)||0; v.sessions++; map.set(k,v); }
  return map;
}
function v119SessionDateKey(s){
  const raw=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ts=Number(s?.timestamp)||0;
  return ts>0 ? dayKeyLocal(ts) : '';
}
function v119HistoryTimes(){
  const times=[];
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(k){
      const t=new Date(k+'T12:00:00').getTime();
      if(Number.isFinite(t)) times.push(t);
    }
  }
  for(const i of (S.library||[])){
    const t=Number(i?.completedAt)||0;
    if(t>0) times.push(t);
  }
  for(const x of (S.completionTimeline||[])){
    const t=Number(x?.completedAt)||0;
    if(t>0) times.push(t);
  }
  return times;
}
function v119AvailableRecapMonths(){
  const now=new Date();
  const times=v119HistoryTimes();
  const minTime=times.length?Math.min(...times):now.getTime();
  const maxTime=Math.max(now.getTime(),times.length?Math.max(...times):0);
  const first=new Date(minTime), last=new Date(maxTime);
  const cursor=new Date(last.getFullYear(),last.getMonth(),1);
  const stop=new Date(first.getFullYear(),first.getMonth(),1);
  const out=[];
  while(cursor>=stop && out.length<1200){
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`);
    cursor.setMonth(cursor.getMonth()-1);
  }
  return out.length?out:[`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`];
}
function v119AvailableHeatmapYears(){
  const years=new Set([new Date().getFullYear()]);
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    const y=Number(k.slice(0,4));
    if(Number.isInteger(y)&&y>=1900&&y<=9999) years.add(y);
  }

  // v136: a year can now be meaningful even when it only contains title
  // lifecycle events and no consumption History.
  for(const item of (S.library||[])){
    for(const ts of [Number(item?.startedAt)||0,Number(item?.completedAt)||0]){
      if(!ts)continue;
      const d=new Date(ts);
      const y=d.getFullYear();
      if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
    }
  }
  for(const x of (S.completionTimeline||[])){
    const ts=Number(x?.completedAt)||0;
    if(!ts)continue;
    const d=new Date(ts),y=d.getFullYear();
    if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
  }

  return [...years].sort((a,b)=>b-a);
}
function renderConsumptionHeatmap(selectedYear){
  const year=Number(selectedYear)||new Date().getFullYear();
  const start=new Date(year,0,1), map=new Map();

  // Consumption remains the only source of heat/intensity.
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(!k || Number(k.slice(0,4))!==year) continue;
    let v=map.get(k);
    if(!v)v={minutes:0,sessions:0,started:[],finished:[]};
    v.minutes+=Number(s.minutes)||0;
    v.sessions++;
    map.set(k,v);
  }

  const lifecycleKey=ts=>{
    ts=Number(ts)||0;
    if(!ts)return '';
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?'':dayKeyLocal(d);
  };

  const ensure=k=>{
    let v=map.get(k);
    if(!v){v={minutes:0,sessions:0,started:[],finished:[]};map.set(k,v);}
    if(!Array.isArray(v.started))v.started=[];
    if(!Array.isArray(v.finished))v.finished=[];
    return v;
  };

  const seenStart=new Set(),seenFinish=new Set();

  // Per-title v135 dates are the primary lifecycle source.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const sk=lifecycleKey(item?.startedAt);
    if(sk && Number(sk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${sk}`;
      if(!seenStart.has(unique)){
        seenStart.add(unique);
        ensure(sk).started.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }

    const fk=lifecycleKey(item?.completedAt);
    if(fk && Number(fk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${fk}`;
      if(!seenFinish.has(unique)){
        seenFinish.add(unique);
        ensure(fk).finished.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }
  }

  // Keep legacy completion-timeline-only records visible too.
  for(const x of (S.completionTimeline||[])){
    const fk=lifecycleKey(x?.completedAt);
    if(!fk || Number(fk.slice(0,4))!==year)continue;
    const title=cleanTitle(x?.title||'');
    if(!title)continue;
    const unique=`${String(x.libraryId||title)}::${fk}`;
    if(seenFinish.has(unique))continue;
    seenFinish.add(unique);
    ensure(fk).finished.push({
      title,
      libraryId:x.libraryId||null,
      categoryId:x.categoryId||null
    });
  }

  const janDow=start.getDay();
  const lead=(janDow+6)%7;
  const max=Math.max(1,...[...map.values()].map(v=>Number(v.minutes)||0));
  const daysInYear=new Date(year,1,29).getMonth()===1?366:365;
  const cells=[];

  const names=(rows)=>{
    const unique=[...new Set((rows||[]).map(x=>cleanTitle(x?.title||'')).filter(Boolean))];
    const shown=unique.slice(0,6);
    return shown.join(', ')+(unique.length>shown.length?`, +${unique.length-shown.length} more`:'');
  };

  for(let i=0;i<lead;i++) cells.push('<div class="heat-cell heat-empty"></div>');

  for(let i=0;i<daysInYear;i++){
    const d=new Date(year,0,1);
    d.setDate(d.getDate()+i);
    const k=dayKeyLocal(d);
    const v=map.get(k)||{minutes:0,sessions:0,started:[],finished:[]};
    const m=Number(v.minutes)||0;
    const level=m===0?0:Math.min(4,Math.ceil((m/max)*4));

    const classes=[
      'heat-cell',
      `heat-${level}`,
      v.started?.length?'v136-heat-start':'',
      v.finished?.length?'v136-heat-finish':''
    ].filter(Boolean).join(' ');

    const info=[
      d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),
      `${Math.round(m)} min${v.sessions?` · ${v.sessions} session${v.sessions===1?'':'s'}`:''}`,
      v.started?.length?`Started (${v.started.length}): ${names(v.started)}`:'',
      v.finished?.length?`Finished (${v.finished.length}): ${names(v.finished)}`:''
    ].filter(Boolean).join(' · ');

    cells.push(`<div class="${classes}" title="${escapeHtml(info)}"></div>`);
  }

  return `<div class="heatmap-wrap">
    <div class="heatmap-grid">${cells.join('')}</div>
    <div class="heatmap-legend"><span>Less</span>${[0,1,2,3,4].map(x=>`<i class="heat-cell heat-${x}"></i>`).join('')}<span>More</span></div>
    <div class="v136-heat-legend">
      <span><i class="heat-cell heat-0 v136-heat-start"></i> Title started</span>
      <span><i class="heat-cell heat-0 v136-heat-finish"></i> Title finished</span>
      <span>Markers do not add fake minutes.</span>
    </div>
  </div>`;
}
function renderCompletionTimeline(){
  const map=new Map();
  for(const x of (S.completionTimeline||[])){ if(x?.completedAt) map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x); }
  for(const i of S.library.filter(i=>i.status==='completed'&&i.completedAt)){ if(!map.has(i.id))map.set(i.id,{libraryId:i.id,title:cleanTitle(i.title),categoryId:i.categoryId,completedAt:i.completedAt}); }
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  if(!arr.length) return '<div class="empty-state">No completed titles have a recorded completion date yet.</div>';
  return `<div class="completion-timeline">${arr.map(x=>{const c=getCategory(x.categoryId);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div>`}).join('')}</div>`;
}
function renderMonthlyRecap(){
  const now=new Date(), currentKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const months=v119AvailableRecapMonths();
  let selected=String(S.statsRecapMonth||currentKey);
  if(!months.includes(selected)) selected=months.includes(currentKey)?currentKey:months[0];
  const [y,m]=selected.split('-').map(Number);
  const start=new Date(y,m-1,1).getTime(), end=new Date(y,m,1).getTime();
  const ss=(S.sessions||[]).filter(s=>s && s.status!=='skipped' && v119SessionDateKey(s).startsWith(selected));
  const mins=ss.reduce((a,s)=>a+(Number(s.minutes)||0),0);
  const byCat={};
  ss.forEach(s=>byCat[s.categoryId]=(byCat[s.categoryId]||0)+(Number(s.minutes)||0));
  const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const finished=(S.library||[]).filter(i=>i.status==='completed'&&Number(i.completedAt)>=start&&Number(i.completedAt)<end).length;
  const days=[...new Set(ss.map(v119SessionDateKey).filter(Boolean))].sort();
  let longest=0,run=0,prev=null;
  for(const d of days){
    const cur=new Date(d+'T12:00:00');
    if(prev&&Math.round((cur-prev)/86400000)===1)run++;
    else run=1;
    longest=Math.max(longest,run);
    prev=cur;
  }
  const options=months.map(k=>{
    const [yy,mm]=k.split('-').map(Number);
    const d=new Date(yy,mm-1,1);
    return `<option value="${k}" ${k===selected?'selected':''}>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</option>`;
  }).join('');
  return `<div class="card" style="margin-bottom:24px;"><div class="section-label">MONTHLY RECAP</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setRecapMonth(this.value)" style="max-width:210px;">${options}</select></div><div class="recap-grid"><div><b>${fmtMinutes(mins)}</b><small>spent</small></div><div><b>${top?escapeHtml(getCategory(top[0])?.name||'—'):'—'}</b><small>top category · ${top?fmtMinutes(top[1]):'0m'}</small></div><div><b>${finished}</b><small>titles finished</small></div><div><b>${longest}</b><small>longest active-day streak</small></div></div></div>`;
}
function renderOnThisDay(){
  const now=new Date(); const matches=[]; for(const s of S.sessions){const d=new Date(s.timestamp); const years=now.getFullYear()-d.getFullYear(); if(years<1||d.getMonth()!==now.getMonth()||d.getDate()!==now.getDate())continue; for(const t of (s.titles||[])){ if(t.title) matches.push({years,title:t.title}); }}
  if(!matches.length)return ''; const x=matches.sort((a,b)=>a.years-b.years)[0]; return `<div class="on-this-day">On this day · ${x.years} year${x.years===1?'':'s'} ago you logged <b>${escapeHtml(x.title)}</b>.</div>`;
}
function renderSchedulerWhy(){
  if(!S.currentTask)return ''; const cat=getCategory(S.currentTask.categoryId); if(!cat)return ''; const scored=computeScores([...(S.currentTask.categoryId?[S.currentTask.categoryId]:[])]); const all=computeScores([]); const x=all.find(z=>z.cat.id===cat.id); if(!x)return '';
  const d=x.debug; const rows=[['Base weight',d.weightScore],['Neglect bonus',d.neglectBonus],['Seasonal bonus',d.seasonalBonus],['Repetition penalty',-d.repetitionPenalty],['Consecutive penalty',-d.consecutivePenalty],['Saturation penalty',-d.saturationPenalty]];return `<div class="reason-explain reason-breakdown"><b>Why this pick?</b><div class="score-grid">${rows.map(([k,v])=>`<div><span>${k}</span><strong>${v>=0?'+':''}${Math.round(v)}</strong></div>`).join('')}</div><small>Final score also includes controlled randomness. This breakdown is the scheduler's actual scoring inputs before the random jitter.</small></div>`;
}
renderReasonDetail=function(cat){ return renderSchedulerWhy(); };
const _renderDashboardV28=renderDashboard;
renderDashboard=function(){
  let h=_renderDashboardV28();
  const otd=renderOnThisDay(); const pos=h.indexOf('<div class="today-strip">'); return otd&&pos>0?h.slice(0,pos)+otd+h.slice(pos):h;
};

const _oldRenderSettings=renderSettings;
renderSettings=function(){
  let html=_oldRenderSettings();
  const themeCard=`<div class="section-label settings-section-head"><span>APPEARANCE</span>${defaultButton('appearance')}</div><div class="card" style="margin-bottom:22px;"><div class="field"><label class="field-label">UI look</label><select onchange="App.setTheme(this.value)"><option value="dark" ${S.settings.theme==='dark'?'selected':''}>Dark</option><option value="light" ${S.settings.theme==='light'?'selected':''}>Light</option><option value="amoled" ${S.settings.theme==='amoled'?'selected':''}>AMOLED</option></select><small class="hint">Choose the overall MediaFlow interface style.</small></div></div>`;
  const backupCard=`<div class="section-label settings-section-head"><span>AUTOMATIC BACKUPS</span>${defaultButton('backups')}</div><div class="card" style="margin-bottom:22px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px;"><div><b>Automatic local JSON backup</b><div class="profile-note">Choose a folder on this computer. MediaFlow can periodically write a backup while the app is open. Browsers cannot write to arbitrary paths while the app is closed.</div></div><button class="toggle ${S.settings.backup?.enabled?'on':''}" onclick="App.toggleBackup()"></button></div><div class="field-row" style="margin-top:14px;"><div class="field"><label class="field-label">Backup every</label><select onchange="App.updateBackup('interval',this.value)"><option value="5" ${Number(S.settings.backup?.interval)===5?'selected':''}>5 minutes</option><option value="15" ${Number(S.settings.backup?.interval)===15?'selected':''}>15 minutes</option><option value="30" ${Number(S.settings.backup?.interval)===30?'selected':''}>30 minutes</option><option value="60" ${Number(S.settings.backup?.interval)===60?'selected':''}>1 hour</option><option value="360" ${Number(S.settings.backup?.interval)===360?'selected':''}>6 hours</option><option value="1440" ${Number(S.settings.backup?.interval)===1440?'selected':''}>Daily</option></select></div><div class="field"><label class="field-label">File mode</label><select onchange="App.updateBackup('mode',this.value)"><option value="single" ${S.settings.backup?.mode==='single'?'selected':''}>One file (overwrite)</option><option value="multiple" ${S.settings.backup?.mode==='multiple'?'selected':''}>Multiple files</option></select></div></div><div class="field"><label class="field-label">Single-file name</label><input value="${escapeHtml(S.settings.backup?.fileName||'mediaflow-backup.json')}" onchange="App.updateBackup('fileName',this.value)"></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn" onclick="App.chooseBackupFolder()">Choose backup folder</button><button class="btn btn-ghost" onclick="App.backupNow()">Back up now</button></div><small class="hint">Folder permission is stored in this browser when supported. Multiple-file mode creates a timestamped JSON file each time.</small></div>`;
  const linksCard='';
  const offlineCard='';
  const emptyCard=`<div class="section-label">LIBRARY MAINTENANCE</div><div class="card" style="margin-bottom:22px;"><b>Empty library</b><div class="profile-note">Advanced clearing options. History is preserved.</div><button class="btn btn-danger" style="margin-top:12px" onclick="App.emptyLibraryAdvanced()">Empty library…</button></div>`;
const dataIdx=html.indexOf('<div class="section-label">DATA</div>'); if(dataIdx>=0) html=html.slice(0,dataIdx)+themeCard+backupCard+linksCard+offlineCard+emptyCard+html.slice(dataIdx); else html+=themeCard+backupCard+linksCard+offlineCard+emptyCard;
  return html;
};


const _renderStatsV27Base=renderStats;
renderStats=function(){
  let h=_renderStatsV27Base();
  const heatYears=v119AvailableHeatmapYears();
  let heatYear=Number(S.statsHeatmapYear)||new Date().getFullYear();
  if(!heatYears.includes(heatYear)) heatYear=heatYears[0]||new Date().getFullYear();
  const heatOptions=heatYears.map(y=>`<option value="${y}" ${y===heatYear?'selected':''}>${y}</option>`).join('');
  const heat=`<div class="card" style="margin-bottom:24px;"><div class="section-label">CONSUMPTION HEATMAP · ${heatYear}</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setHeatmapYear(this.value)" style="max-width:150px;">${heatOptions}</select></div>${renderConsumptionHeatmap(heatYear)}<div class="hint" style="margin-top:10px;">Each square is one day. Intensity is based on minutes logged that day; corner markers show titles started and finished.</div></div>`;
  const recap=renderMonthlyRecap();
  const timeline=`<div class="card" style="margin-bottom:24px;"><div class="section-label">TITLE COMPLETION TIMELINE</div>${renderCompletionTimeline()}</div>`;
  h=h.replace('<div class="grid-3" style="margin-bottom:24px;">', heat+recap+'<div class="grid-3" style="margin-bottom:24px;">'); const pos=h.lastIndexOf('</div>'); return pos>0?h.slice(0,pos)+timeline+h.slice(pos):h+timeline;
};
Object.assign(App,{
  setRecapMonth(v){S.statsRecapMonth=String(v||'');render();},
  setHeatmapYear(v){S.statsHeatmapYear=String(v||'');render();}
});

Object.assign(App,{setPriorityChoice(id,value){const item=S.library.find(i=>i && i.id===id);if(!item || !['low','medium','high'].includes(value)) return;item.priority=value;S.modal=null;persistLibrary();render();},setLibraryStatus(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!['planned','active','paused','completed','dropped'].includes(value))return;item.status=value;if(value==='completed'){item.completedAt=item.completedAt||Date.now();S.completionTimeline=S.completionTimeline||[];if(!S.completionTimeline.some(x=>x.libraryId===item.id))S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});}else if(value!=='completed'){item.completedAt=null;S.completionTimeline=(S.completionTimeline||[]).filter(x=>x.libraryId!==item.id);}normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setLibraryCategory(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!S.categories.some(c=>c.id===value))return;const old=item.categoryId;item.categoryId=value;normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setThemeCollection(kind){const isPlatform=V55_PLATFORM_THEMES.includes(S.settings.theme||'dark');if(kind==='platform'&&!isPlatform){S.settings.theme='platform-anilist-dark';applyTheme(S.settings.theme);persistSettings();render();return;}if(kind==='mediaflow'&&isPlatform){S.settings.theme='dark';applyTheme('dark');persistSettings();render();return;}render();},setTheme(theme){S.settings.theme=theme;applyTheme(theme);persistSettings();render();},toggleBackup(){S.settings.backup.enabled=!S.settings.backup.enabled;persistSettings();restartBackupTimer();render();},updateBackup(k,v){S.settings.backup=S.settings.backup||{};S.settings.backup[k]=k==='interval'?Number(v):v;persistSettings();restartBackupTimer();render();},chooseBackupFolder:openBackupFolder,backupNow:()=>saveBackupNow(true),setMalLink(k,v){S.malLink=S.malLink||{username:'',mode:'anime'};S.malLink[k]=v;persistTask();},syncMAL:malSync,emptyLibraryAdvanced,confirmEmptyLibrary,deleteCloudAccount,choosePriority,chooseStatusForLibrary,chooseCategoryForLibrary,stopwatchStart,stopwatchPause,stopwatchSetTime,stopwatchReset,stopwatchClear,stopwatchUseMinutes});


// Add profile name to state and keep it local/cloud.
const _oldSnapshot=snapshot;
snapshot=function(){const x=_oldSnapshot();x.profileName=String(S.profileName||'').trim();return x;};
const _oldLoadAll=loadAll;
loadAll=async function(){await _oldLoadAll();const d=await rawGet(STATE_KEY);S.profileName=String(d?.profileName||'').trim();S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},d?.stopwatch||{});S.malLink=Object.assign({username:'',mode:'anime'},d?.malLink||{});S.xpLedger=Object.assign({libraryAdditions:{}},d?.xpLedger||{});
S.completionTimeline=Array.isArray(d?.completionTimeline)?d.completionTimeline:[];S.xpLedger.libraryAdditions=Object.assign({},d?.xpLedger?.libraryAdditions||{});initTheme();await restoreBackupFolder();restartBackupTimer();clearInterval(window.__sw);window.__sw=null;if(S.stopwatch.running)window.__sw=setInterval(stopwatchTick,250);};


/* v40: Multi-service exchange hub + custom import confirmation */
const MF_EXCHANGE_SERVICES=[['anilist','AniList'],['anisearch','AniSearch'],['aniwatch','AniWatch'],['betaseries','BetaSeries'],['criticker','Criticker'],['crunchyroll','Crunchyroll'],['episodecalendar','EpisodeCalendar'],['hianime','HiAnime'],['imdb','IMDb'],['letterboxd','Letterboxd'],['livechart','LiveChart'],['kitsu','Kitsu'],['moviesfad','MoviesFad'],['simkl','Simkl'],['mal','MyAnimeList'],['malxml','MAL-XML'],['netflix','Netflix'],['primewire','PrimeWire'],['seriesfad','SeriesFad'],['stremio','Stremio'],['trakt','trakt'],['tvtime','TV Time'],['tviso','Tviso'],['twee','Twee'],['csv','Import .csv file'],['json','Import .json file']];
function mfExchangeServiceOptions(){return MF_EXCHANGE_SERVICES.map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}
function mfServiceName(id){return MF_EXCHANGE_SERVICES.find(x=>x[0]===id)?.[1]||id||'External service'}
function mfImportConfirmModalHtml(d){const backup=d?.mode==='backup';return `<div class="priority-modal"><div class="modal-title">Confirm import</div><div style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px">Import <b>${escapeHtml(d?.fileName||'file')}</b> from <b>${escapeHtml(d?.serviceName||'external data')}</b>?</div><div class="card" style="padding:13px;margin:0;background:var(--panel-2)"><div style="font-size:12px;line-height:1.55;color:var(--text-dim)">${backup?'This full MediaFlow backup will replace your current categories, Library, History and Settings.':'Recognized titles will be merged into your Library. Matching entries are updated before new titles are created. Missing fields are not fabricated.'}</div></div><div class="modal-actions"><button class="btn btn-ghost" onclick="App.cancelPendingImport()">Cancel</button><button class="btn btn-primary" onclick="App.confirmPendingImport()">${backup?'Replace & import':'Import data'}</button></div></div>`}
function mfPendingImport(kind,service,file){if(!file)return;S.pendingImport={kind,service,file};S.modal={type:'importConfirm',data:{mode:kind==='backup'?'backup':'merge',fileName:file.name,serviceName:kind==='backup'?'MediaFlow backup':mfServiceName(service)}};render()}
function mfCancelPendingImport(){S.pendingImport=null;S.modal=null;render()}
async function mfConfirmPendingImport(){const x=S.pendingImport;if(!x)return;S.pendingImport=null;S.modal=null;render();if(x.kind==='backup')return App.importJSON(x.file);if(x.kind==='legacy-mal')return App.importMalXml(x.file);if(x.kind==='legacy-simkl')return App.importSimklJson(x.file);if(['mal','malxml'].includes(String(x.service||''))&&/\.xml$/i.test(String(x.file?.name||'')))return App.importMalXml(x.file);return mfImportExchangeFile(x.service,x.file)}
function mfPickExchangeImport(){document.getElementById('exchange-file')?.click()}
function mfPrepareExchangeImport(file){if(file)mfPendingImport('exchange',document.getElementById('exchange-service')?.value||'json',file)}
function mfPrepareLegacyImport(service,file){if(file)mfPendingImport(service==='mal'?'legacy-mal':'legacy-simkl',service,file)}
function mfPrepareBackupImport(file){if(file)mfPendingImport('backup','mediaflow',file)}
function mfCsvParse(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(q&&n==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell);if(row.some(x=>x.trim()))rows.push(row)}if(!rows.length)return[];const h=rows[0].map(x=>x.trim().toLowerCase().replace(/^\ufeff/,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]??'').trim()]))) }
function mfFirst(o,keys){for(const k of keys)if(o&&o[k]!=null&&String(o[k]).trim()!=='')return o[k];return null}
function mfNormStatus(v){v=String(v||'').toLowerCase().replace(/[ _-]+/g,'');if(/completed|complete|watched|finished/.test(v))return'completed';if(/watching|reading|current|inprogress/.test(v))return'active';if(/hold|paused/.test(v))return'paused';if(/drop/.test(v))return'dropped';return'planned'}
function mfGuessCategory(o,service){const raw=String(mfFirst(o,['media_type','type','kind','format','category','list_type','content_type','__group'])||'').toLowerCase();if(/manga|manhwa|manhua|chapter/.test(raw))return/manhwa|manhua/.test(raw)?'manhwa':'manga';if(/anime/.test(raw)||['anilist','anisearch','aniwatch','hianime','livechart','kitsu','mal','malxml','crunchyroll'].includes(service))return/movie|film/.test(raw)?'animemovies':'backlog';if(/movie|film/.test(raw)||['letterboxd','criticker','moviesfad'].includes(service))return'movies';if(/comic|issue/.test(raw))return'comics';if(/animation|cartoon/.test(raw))return'otheranim';return'tv'}
function mfFlattenJson(data){if(Array.isArray(data))return data;const out=[];for(const k of ['anime','shows','movies','items','entries','library','watchlist','history','data','results'])if(Array.isArray(data?.[k]))for(const x of data[k])out.push(Object.assign({__group:k},x));return out.length?out:[data]}
function mfXmlRecords(text){const doc=new DOMParser().parseFromString(text,'text/xml');if(doc.querySelector('parsererror'))throw new Error('The XML file could not be parsed.');return[...doc.querySelectorAll('anime,manga,item,entry,movie,show,series')].map(n=>{const o={};for(const el of n.children)o[el.tagName.toLowerCase()]=el.textContent?.trim()||'';return o})}
function mfNormalizeRecord(rec,service){const nested=rec?.show||rec?.movie||rec?.media||rec?.anime||rec?.item||{};const o=Object.assign({},nested,rec),title=cleanTitle(String(mfFirst(o,['title','name','series_title','anime_title','movie_title','original_title','primary_title'])||''));if(!title)return null;const progress=Number(mfFirst(o,['progress','watched_episodes','watched_episodes_count','episodes_watched','episode','my_watched_episodes','chapters_read','my_read_chapters','watched'])||0)||0;let total=Number(mfFirst(o,['total','total_episodes','total_episodes_count','episodes_total','series_episodes','chapters_total','series_chapters'])||0)||null;const categoryId=mfGuessCategory(o,service);if(categoryId==='movies'||categoryId==='animemovies')total=total||1;const ids=o.ids||{};return{title,categoryId,progress,total,status:mfNormStatus(mfFirst(o,['status','list_status','my_status','state'])),rating:Number(mfFirst(o,['rating','user_rating','your_rating','score','my_score'])||0)||null,year:Number(mfFirst(o,['year','release_year','title_year'])||0)||null,externalIds:{simkl:ids.simkl||o.simkl_id||null,mal:ids.mal||o.mal_id||o.series_animedb_id||null,anilist:ids.anilist||o.anilist_id||null,tmdb:ids.tmdb||o.tmdb_id||null,imdb:ids.imdb||o.imdb_id||o.const||null,trakt:ids.trakt||o.trakt_id||null,kitsu:o.kitsu_id||null}}}
function mfMergeExchangeRecords(records,service){let added=0,updated=0,skipped=0;for(const raw of records){const r=mfNormalizeRecord(raw,service);if(!r){skipped++;continue}let item=S.library.find(i=>Object.entries(r.externalIds).some(([k,v])=>v&&i.externalIds?.[k]&&String(v)===String(i.externalIds[k])));if(!item)item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===r.title.toLowerCase()&&(!r.year||!i.year||Number(i.year)===Number(r.year)));if(item){item.progress=Math.max(Number(item.progress)||0,r.progress);if(r.total)item.total=r.total;item.status=r.status;item.rating=r.rating??item.rating;item.year=r.year||item.year;item.externalIds=Object.assign({},item.externalIds||{},r.externalIds);item.source=service;item.tags=[...new Set([...(item.tags||[]),mfServiceName(service)])];updated++}else{S.library.push({id:uid(),title:r.title,categoryId:S.categories.some(c=>c.id===r.categoryId)?r.categoryId:'tv',progress:r.progress,total:r.total,status:r.status,priority:'medium',estimatedMinutes:null,tags:[mfServiceName(service)],source:service,year:r.year,rating:r.rating,externalIds:r.externalIds,createdAt:Date.now(),completedAt:r.status==='completed'?Date.now():null});added++}}normalizeSeasonalLibraryItems();return{added,updated,skipped}}
async function mfImportExchangeFile(service,file){showImportProgress(`Importing ${mfServiceName(service)}`,1);try{const text=await file.text(),name=file.name.toLowerCase();let records;if(name.endsWith('.xml')||/^\s*</.test(text))records=mfXmlRecords(text);else if(name.endsWith('.csv')||(!name.endsWith('.json')&&text.includes(',')))records=mfCsvParse(text);else records=mfFlattenJson(JSON.parse(text));if(!records.length)throw new Error('No recognizable media records were found.');mfBegin(`${mfServiceName(service)} import`,file.name);const r=mfMergeExchangeRecords(records,service);mfCommit(`${mfServiceName(service)} import`,`${r.added} added, ${r.updated} updated`);updateImportProgress(records.length,records.length,r.added,r.updated,r.skipped,'Saving imported data…');await saveState();finishImportProgress(true,`${mfServiceName(service)} import complete`,`${r.added.toLocaleString()} titles added, ${r.updated.toLocaleString()} updated${r.skipped?`, ${r.skipped.toLocaleString()} skipped`:''}.`);render()}catch(e){console.error(e);finishImportProgress(false,'Import failed',e.message||'MediaFlow could not understand this export file.')}}
function mfCsvEscape(v){v=v==null?'':String(v);return/[",\n\r]/.test(v)?`"${v.replace(/"/g,'""')}"`:v}
function mfExchangeRows(){return S.library.map(i=>{const c=getCategory(i.categoryId);return{title:cleanTitle(i.title),media_type:c?.id||i.categoryId,status:i.status,progress:Number(i.progress)||0,total:i.total??'',rating:i.rating??'',year:i.year??'',start_date:i.startedAt?v135DateInputValue(i.startedAt):'',finish_date:i.completedAt?v135DateInputValue(i.completedAt):'',mal_id:i.externalIds?.mal??'',anilist_id:i.externalIds?.anilist??'',imdb_id:i.externalIds?.imdb??'',tmdb_id:i.externalIds?.tmdb??'',trakt_id:i.externalIds?.trakt??'',simkl_id:i.externalIds?.simkl??''}})}
function mfMalXmlExport(){const rows=mfExchangeRows().filter(r=>['seasonal','backlog','animemovies'].includes(r.media_type)),sm={active:'Watching',completed:'Completed',paused:'On-Hold',dropped:'Dropped',planned:'Plan to Watch'};return`<?xml version="1.0" encoding="UTF-8"?>\n<myanimelist>\n${rows.map(r=>`<anime><series_animedb_id>${r.mal_id||0}</series_animedb_id><series_title><![CDATA[${r.title.replace(/]]>/g,']]]]><![CDATA[>')}]]></series_title><series_type>${r.media_type==='animemovies'?'Movie':'TV'}</series_type><series_episodes>${r.total||0}</series_episodes><my_watched_episodes>${r.progress}</my_watched_episodes><my_start_date>${r.start_date||'0000-00-00'}</my_start_date><my_finish_date>${r.finish_date||'0000-00-00'}</my_finish_date><my_status>${sm[r.status]||'Plan to Watch'}</my_status><my_score>${r.rating||0}</my_score></anime>`).join('\n')}\n</myanimelist>`}
function mfExportExchange(){const service=document.getElementById('exchange-service')?.value||'json',rows=mfExchangeRows();let blob,name;if(['mal','malxml','aniwatch','hianime','livechart'].includes(service)){blob=new Blob([mfMalXmlExport()],{type:'application/xml'});name=`mediaflow-${service}-${todayISO()}.xml`}else if(['json','anilist','anisearch','kitsu','stremio','trakt'].includes(service)){blob=new Blob([JSON.stringify({source:'MediaFlow',target:mfServiceName(service),exportedAt:new Date().toISOString(),items:rows},null,2)],{type:'application/json'});name=`mediaflow-${service}-${todayISO()}.json`}else{const h=Object.keys(rows[0]||{title:'',media_type:'',status:'',progress:'',total:'',rating:'',year:''}),csv=[h.join(','),...rows.map(r=>h.map(k=>mfCsvEscape(r[k])).join(','))].join('\r\n');blob=new Blob([csv],{type:'text/csv'});name=`mediaflow-${service}-${todayISO()}.csv`}triggerDownload(blob,name);showDataProgress(`Exporting for ${mfServiceName(service)}`,'Creating exchange file...',70);setTimeout(()=>finishDataProgress(true,'Export complete',`${rows.length.toLocaleString()} Library titles exported for ${mfServiceName(service)}.`),100)}
Object.assign(App,{pickExchangeImport:mfPickExchangeImport,prepareExchangeImport:mfPrepareExchangeImport,prepareLegacyImport:mfPrepareLegacyImport,prepareBackupImport:mfPrepareBackupImport,cancelPendingImport:mfCancelPendingImport,confirmPendingImport:mfConfirmPendingImport,exportExchange:mfExportExchange});

/* ============================================================
   v42: Dedicated Library History tab
   - Library activity log moved out of Library
   - Undo/Redo controls moved to Library History
   ============================================================ */

/* ============================================================
   v37: Simkl JSON + bulk library tools + activity + undo/redo
   ============================================================ */
S.librarySelection=S.librarySelection||{};
S.activityLog=S.activityLog||[];
S.undoStack=S.undoStack||[];
S.redoStack=S.redoStack||[];

function mfDeep(v){return JSON.parse(JSON.stringify(v));}
function mfCoreSnapshot(){return {library:mfDeep(S.library||[]),sessions:mfDeep(S.sessions||[]),completionTimeline:mfDeep(S.completionTimeline||[]),xpLedger:mfDeep(S.xpLedger||{libraryAdditions:{}})};}
function mfRestoreCore(x){S.library=sanitizeLibrary(mfDeep(x.library||[]));S.sessions=mfDeep(x.sessions||[]);S.completionTimeline=mfDeep(x.completionTimeline||[]);S.xpLedger=mfDeep(x.xpLedger||{libraryAdditions:{}});normalizeSeasonalLibraryItems();}
function mfActivity(action,detail){S.activityLog=S.activityLog||[];S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:String(action||'Change'),detail:String(detail||'')});if(S.activityLog.length>1000)S.activityLog.length=1000;}
function mfBegin(action,detail){S.undoStack=S.undoStack||[];S.redoStack=[];S.undoStack.push({action,detail,before:mfCoreSnapshot()});if(S.undoStack.length>40)S.undoStack.shift();}
function mfCommit(action,detail){const x=S.undoStack[S.undoStack.length-1];if(x&&!x.after)x.after=mfCoreSnapshot();mfActivity(action,detail);saveState();}
async function mfUndo(){const x=(S.undoStack||[]).pop();if(!x){showToast('Nothing to undo');return;}x.after=x.after||mfCoreSnapshot();S.redoStack=S.redoStack||[];S.redoStack.push(x);mfRestoreCore(x.before);mfActivity('Undo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Undid '+x.action);}
async function mfRedo(){const x=(S.redoStack||[]).pop();if(!x){showToast('Nothing to redo');return;}S.undoStack=S.undoStack||[];S.undoStack.push(x);mfRestoreCore(x.after);mfActivity('Redo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Redid '+x.action);}
function mfSelectedIds(){return Object.keys(S.librarySelection||{}).filter(id=>S.librarySelection[id]&&S.library.some(i=>i.id===id));}
function mfToggleSelect(id,on){S.librarySelection=S.librarySelection||{};S.librarySelection[id]=!!on;render();}
function mfSelectVisible(on){document.querySelectorAll('.item-row [data-mf-select]').forEach(cb=>{cb.checked=!!on;S.librarySelection[cb.dataset.mfSelect]=!!on;});mfEnhanceLibraryDom();}
function mfClearSelection(){S.librarySelection={};render();}
function mfBatchStatus(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch status',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i){i.status=v;if(v==='completed'){i.completedAt=i.completedAt||Date.now();}else i.completedAt=null;}});normalizeSeasonalLibraryItems();mfCommit('Batch status',ids.length+' titles → '+v);render();}
function mfBatchPriority(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch priority',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.priority=v;});mfCommit('Batch priority',ids.length+' titles → '+v);render();}
function mfBatchCategory(v){const ids=mfSelectedIds();if(!ids.length||!S.categories.some(c=>c.id===v))return;mfBegin('Batch move',ids.length+' titles → '+getCategory(v).name);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.categoryId=v;});normalizeSeasonalLibraryItems();mfCommit('Batch move',ids.length+' titles → '+getCategory(v).name);render();}
function mfBatchDelete(){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch delete',ids.length+' titles');S.library=S.library.filter(i=>!ids.includes(i.id));S.librarySelection={};mfCommit('Batch delete',ids.length+' titles');render();showToast(ids.length+' titles deleted');}
function mfClearCategory(id){const cat=S.categories.find(c=>c.id===id);if(!cat)return;const n=S.library.filter(i=>i.categoryId===id).length;if(!n){showToast('That category is already empty');return;}mfBegin('Clear category',cat.name+' · '+n+' titles');S.library=S.library.filter(i=>i.categoryId!==id);mfCommit('Clear category',cat.name+' · '+n+' titles');render();showToast(cat.name+' cleared');}
/* MediaFlow v81 — Repeat Consumption (Rewatch / Reread) */
function v81RepeatTotals(){
  const byTitle=new Map(); let sessions=0,minutes=0,episodes=0,chapters=0,issues=0,movies=0;
  for(const sess of (S.sessions||[])){
    let sessionHadRepeat=false;
    for(const t of (sess.titles||[])){
      if(!t?.repeat) continue;
      sessionHadRepeat=true;
      const item=t.libraryId?S.library.find(i=>i.id===t.libraryId):null;
      const key=item?.id||t.libraryId; if(!key) continue;
      const unit=getCategory(item?.categoryId||sess.categoryId)?.unit||sess.unit||'units';
      const amount=Math.max(0,Number(t.qty)||0);
      const rec=byTitle.get(key)||{title:cleanTitle(t.title),amount:0,loggedAmount:0,manualAmount:0,unit,total:Number(item?.total)||0,completedRepeats:0};
      rec.loggedAmount+=amount; rec.amount+=amount; rec.total=Number(item?.total)||rec.total||0; rec.unit=unit;
      byTitle.set(key,rec);
      if(unit==='episodes')episodes+=amount; else if(unit==='chapters')chapters+=amount; else if(unit==='issues')issues+=amount; else if(unit==='movies')movies+=amount;
    }
    if(sessionHadRepeat){ sessions++; minutes+=Math.max(0,Number(sess.minutes)||0); }
  }
  // v83: manual past repeats live on the Library title. They count as lifetime repeat
  // consumption, but deliberately create no History session, XP, minutes, streak, or scheduler activity.
  for(const item of (S.library||[])){
    const manual=Math.max(0,Math.floor(Number(item.manualRepeatAmount)||0)); if(!manual) continue;
    const unit=getCategory(item.categoryId)?.unit||'units';
    const rec=byTitle.get(item.id)||{title:cleanTitle(item.title),amount:0,loggedAmount:0,manualAmount:0,unit,total:Number(item.total)||0,completedRepeats:0};
    rec.manualAmount=manual; rec.amount=(Number(rec.loggedAmount)||0)+manual; rec.total=Number(item.total)||0; rec.unit=unit; byTitle.set(item.id,rec);
    if(unit==='episodes')episodes+=manual; else if(unit==='chapters')chapters+=manual; else if(unit==='issues')issues+=manual; else if(unit==='movies')movies+=manual;
  }
  for(const rec of byTitle.values()) rec.completedRepeats=rec.total>0?Math.floor(rec.amount/rec.total):0;
  return {byTitle,sessions,minutes,episodes,chapters,issues,movies};
}
function v81RepeatLabel(item){
  const r=v81RepeatTotals().byTitle.get(item.id); if(!r||!r.amount)return '';
  const noun=(getCategory(item.categoryId)?.type==='reading')?'Reread':'Rewatched';
  const cycles=r.completedRepeats?` · ${r.completedRepeats} full ${r.completedRepeats===1?'repeat':'repeats'}`:'';
  return `${noun}: ${r.amount.toLocaleString()} ${unitLabel(r.unit,r.amount)}${cycles}`;
}
/* MediaFlow v82 — per-title Rewatch / Reread visibility */
function v82RepeatSummary(item,r){
  if(!r||!r.amount) return '';
  const reading=getCategory(item.categoryId)?.type==='reading';
  const action=reading?'Reread':'Rewatched';
  const total=Math.max(0,Number(r.total)||0);
  const full=total>0?Math.floor(r.amount/total):0;
  const current=total>0?(r.amount%total):r.amount;
  const unit=unitLabel(r.unit,r.amount);
  if(total>0){
    const cycleWord=reading?'reread':'rewatch';
    const parts=[`${action}: ${r.amount.toLocaleString()} ${unit}`];
    if(full) parts.push(`${full} full ${cycleWord}${full===1?'':'es'}`);
    if(current) parts.push(`${current.toLocaleString()} / ${total.toLocaleString()} toward ${cycleWord} #${full+1}`);
    else if(full) parts.push(`${cycleWord} #${full} complete`);
    return parts.join(' · ');
  }
  return `${action}: ${r.amount.toLocaleString()} ${unit} · total unknown`;
}
function v82RepeatDetailHtml(item){
  const r=v81RepeatTotals().byTitle.get(item.id)||{amount:0,loggedAmount:0,manualAmount:Math.max(0,Number(item.manualRepeatAmount)||0),unit:getCategory(item.categoryId)?.unit||'units',total:Number(item.total)||0,completedRepeats:0};
  const reading=getCategory(item.categoryId)?.type==='reading';
  const noun=reading?'Rereads':'Rewatches',verb=reading?'reread':'rewatched';
  const total=Math.max(0,Number(item.total)||0),full=total>0?Math.floor(r.amount/total):0,current=total>0?r.amount%total:r.amount;
  const currentText=total>0?(current===0&&full>0?`Re${reading?'read':'watch'} #${full} complete`:`${current.toLocaleString()} / ${total.toLocaleString()} toward ${reading?'reread':'rewatch'} #${full+1}`):`${r.amount.toLocaleString()} ${unitLabel(r.unit,r.amount)} ${verb} · title total unknown`;
  const manual=Math.max(0,Math.floor(Number(item.manualRepeatAmount)||0));
  const manualFull=total>0?Math.floor(manual/total):0,manualExtra=total>0?manual%total:manual;
  const editFields=total>0?`<div class="v83-repeat-edit-grid"><div class="field"><label class="field-label">Manual full ${reading?'rereads':'rewatches'}</label><input type="number" id="l-repeat-full" min="0" step="1" value="${manualFull}"></div><div class="field"><label class="field-label">Extra ${escapeHtml(unitLabel(r.unit,2))}</label><input type="number" id="l-repeat-extra" min="0" max="${Math.max(0,total-1)}" step="1" value="${manualExtra}"></div></div>`:`<div class="field"><label class="field-label">Manual ${escapeHtml(unitLabel(r.unit,2))} ${verb}</label><input type="number" id="l-repeat-extra" min="0" step="1" value="${manualExtra}"></div>`;
  return `<div class="v82-repeat-panel"><div class="v82-repeat-head">↻ REWATCH / REREAD</div><div class="v82-repeat-grid"><div><b>${full.toLocaleString()}</b><small>Full ${noun.toLowerCase()}</small></div><div><b>${r.amount.toLocaleString()}</b><small>${escapeHtml(unitLabel(r.unit,r.amount))} ${verb}</small></div></div><div class="v82-repeat-current"><b>Current repeat</b><span>${escapeHtml(currentText)}</span></div><div class="v83-repeat-source"><b>Logged in MediaFlow:</b> ${(Number(r.loggedAmount)||0).toLocaleString()} · <b>Manual past repeats:</b> ${manual.toLocaleString()} ${escapeHtml(unitLabel(r.unit,manual))}</div><div class="v83-repeat-edit"><div class="v83-repeat-edit-title">EDIT PAST REPEAT HISTORY</div>${editFields}<small class="hint">Use this for rewatches/rereads from before MediaFlow or corrections. Manual values affect repeat totals only. They do not create History sessions, XP, time, streaks, or scheduler activity.</small></div></div>`;
}

function mfLifetime(){const completed=new Set((S.library||[]).filter(i=>i.status==='completed').map(i=>i.id));let episodes=0,chapters=0,issues=0,movies=0,minutes=0;for(const s of S.sessions||[]){if(s.status==='skipped')continue;const n=Math.max(0,Number(s.actualAmount)||0);minutes+=Math.max(0,Number(s.minutes)||0);if(s.unit==='episodes')episodes+=n;else if(s.unit==='chapters')chapters+=n;else if(s.unit==='issues')issues+=n;else if(s.unit==='movies')movies+=n;}return {completed:completed.size,episodes,chapters,issues,movies,minutes};}
function mfAchievementsHtml(){const a=mfLifetime();return `<div class="card" style="margin-bottom:24px"><div class="section-label">LIFETIME ACHIEVEMENTS</div><div class="mf-achievements"><div class="mf-achievement"><b>${a.completed.toLocaleString()}</b><small>Completed titles</small></div><div class="mf-achievement"><b>${a.episodes.toLocaleString()}</b><small>Episodes watched</small></div><div class="mf-achievement"><b>${a.movies.toLocaleString()}</b><small>Movies completed / logged</small></div><div class="mf-achievement"><b>${a.chapters.toLocaleString()}</b><small>Chapters read</small></div><div class="mf-achievement"><b>${a.issues.toLocaleString()}</b><small>Issues read</small></div><div class="mf-achievement"><b>${Math.round(a.minutes).toLocaleString()}</b><small>Minutes consumed</small></div></div></div>`;}
function mfActivityHtml(){const rows=(S.activityLog||[]).slice(0,1000).map(x=>`<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="hint">${escapeHtml(x.detail)}</div>`:''}</div></div>`).join('')||'<div class="empty-state">No library activity recorded yet.</div>';return `<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>`;}
function renderLibraryHistory(){
  const undoCount=(S.undoStack||[]).length, redoCount=(S.redoStack||[]).length;
  return `<div class="view-head"><div><h1>Library History</h1><p>Review library changes and restore tracked operations.</p></div></div>
  <div class="mf-batchbar" style="margin-bottom:18px"><div class="mf-undo-group"><button class="btn btn-sm" onclick="App.undoChange()" ${undoCount?'':'disabled'}>↶ Undo</button><button class="btn btn-sm" onclick="App.redoChange()" ${redoCount?'':'disabled'}>↷ Redo</button></div><span class="hint">${undoCount} undo step${undoCount===1?'':'s'} · ${redoCount} redo step${redoCount===1?'':'s'}</span></div>
  ${mfActivityHtml()}`;
}
function mfBatchBar(){const n=mfSelectedIds().length;return `<div class="mf-batchbar"><label style="display:flex;gap:7px;align-items:center"><input class="mf-select" type="checkbox" onchange="App.selectVisibleLibrary(this.checked)"> Select visible</label><b>${n} selected</b><div class="spacer"></div><select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${S.categories.map(c=>`<option value="${c.id}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select><button class="btn btn-sm" onclick="App.clearLibrarySelection()">Clear selection</button><button class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button><button class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button></div>`;}
function mfEnhanceLibraryDom(){if(S.view!=='library')return;document.querySelectorAll('.item-row').forEach(row=>{if(row.querySelector('[data-mf-select]'))return;const del=[...row.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('deleteLibraryItem'));const m=(del?.getAttribute('onclick')||'').match(/deleteLibraryItem\('([^']+)'\)/);if(!m)return;const id=m[1],cb=document.createElement('input');cb.type='checkbox';cb.className='mf-select';cb.dataset.mfSelect=id;cb.checked=!!S.librarySelection?.[id];cb.addEventListener('change',()=>mfToggleSelect(id,cb.checked));row.insertBefore(cb,row.firstChild);});const count=document.querySelector('.mf-batchbar b');if(count)count.textContent=mfSelectedIds().length+' selected';}

async function mfImportSimklJson(file){if(!file)return;showImportProgress('Importing Simkl JSON',1);try{const data=JSON.parse(await file.text());if(!data||(!Array.isArray(data.anime)&&!Array.isArray(data.shows)&&!Array.isArray(data.movies)))throw new Error('This does not look like a Simkl JSON backup.');mfBegin('Simkl JSON import',file.name||'backup');const statusMap={watching:'active',plantowatch:'planned',completed:'completed',hold:'paused',onhold:'paused',dropped:'dropped'};let added=0,updated=0,historyAdded=0,processed=0;const groups=[['anime',data.anime||[]],['shows',data.shows||[]],['movies',data.movies||[]]],total=groups.reduce((a,g)=>a+g[1].length,0)||1;const seenSessions=new Set((S.sessions||[]).map(s=>s.importKey).filter(Boolean));for(const [kind,list] of groups){for(const rec of list){processed++;const media=rec.show||rec.movie||{};const title=cleanTitle(media.title||'');if(!title)continue;let catId;if(kind==='shows')catId='tv';else if(kind==='movies')catId='movies';else if(String(rec.anime_type||'').toLowerCase()==='movie')catId='animemovies';else catId=(Number(rec.not_aired_episodes_count)||0)>0?'seasonal':'backlog';if(!S.categories.some(c=>c.id===catId))catId=S.categories[0]?.id;if(!catId)continue;const ids=media.ids||{};const ext={simkl:ids.simkl??null,mal:ids.mal??null,anilist:ids.anilist??null,tmdb:ids.tmdb??ids.tmdbtv??null,imdb:ids.imdb??null};let item=S.library.find(i=>i.externalIds?.simkl&&ext.simkl&&String(i.externalIds.simkl)===String(ext.simkl));if(!item)item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase()&&((i.year||null)===(media.year||null)||!i.year||!media.year));const progress=Math.max(0,Number(rec.watched_episodes_count)||0);const totalUnits=Number(rec.total_episodes_count)>0?Number(rec.total_episodes_count):(kind==='movies'?1:null);const status=statusMap[String(rec.status||'').toLowerCase()]||'planned';if(item){item.title=title;item.categoryId=catId;item.progress=Math.max(Number(item.progress)||0,progress);if(totalUnits)item.total=totalUnits;item.status=status;item.source='simkl';item.externalIds=Object.assign({},item.externalIds||{},ext);item.year=media.year||item.year||null;item.rating=rec.user_rating??item.rating??null;item.simklAddedAt=rec.added_to_watchlist_at||item.simklAddedAt||null;updated++;}else{item={id:uid(),title,categoryId:catId,progress,total:totalUnits,status,priority:'medium',estimatedMinutes:Number(media.runtime)||null,tags:['simkl'],source:'simkl',createdAt:rec.added_to_watchlist_at?Date.parse(rec.added_to_watchlist_at):Date.now(),completedAt:status==='completed'?(rec.last_watched_at?Date.parse(rec.last_watched_at):Date.now()):null,externalIds:ext,year:media.year||null,rating:rec.user_rating??null,simklAddedAt:rec.added_to_watchlist_at||null};S.library.push(item);awardLibraryAdditionXP(item.id);added++;}
// Genuine timestamped episode history, grouped by title/day to keep cloud state manageable.
const dayCounts=new Map();for(const season of rec.seasons||[]){for(const ep of season.episodes||[]){if(!ep.watched_at)continue;const ts=Date.parse(ep.watched_at);if(!Number.isFinite(ts))continue;const day=new Date(ts).toISOString().slice(0,10);const key=day;const old=dayCounts.get(key)||{count:0,ts};old.count++;old.ts=Math.max(old.ts,ts);dayCounts.set(key,old);}}for(const [day,h] of dayCounts){const ik=`simkl:${ext.simkl||title}:${day}`;if(seenSessions.has(ik))continue;const cat=getCategory(item.categoryId);const amount=kind==='movies'?1:h.count;S.sessions.push({id:uid(),timestamp:h.ts,date:day,categoryId:item.categoryId,targetAmount:amount,actualAmount:amount,minutes:Math.max(0,Math.round((Number(media.runtime)||cat.minutesPerUnit||0)*amount)),note:`Imported from Simkl · ${title}`,status:'complete',unit:cat.unit,xp:0,healthStatus:'healthy',titles:[{title,libraryId:item.id,qty:amount}],source:'simkl',importKey:ik});seenSessions.add(ik);historyAdded++;}
if(processed%250===0){updateImportProgress(processed,total,added,updated,0,`Processing ${processed.toLocaleString()} of ${total.toLocaleString()}…`);await yieldToBrowser();}}
}normalizeSeasonalLibraryItems();mfCommit('Simkl JSON import',`${added} added, ${updated} updated, ${historyAdded} history groups`);updateImportProgress(total,total,added,updated,0,'Saving imported data…');await saveState();finishImportProgress(true,'Simkl import successful',`${added.toLocaleString()} titles added, ${updated.toLocaleString()} updated, ${historyAdded.toLocaleString()} timestamped history groups imported.`);render();}catch(e){console.error(e);if(S.undoStack?.length&&S.undoStack[S.undoStack.length-1]?.action==='Simkl JSON import'){const x=S.undoStack.pop();mfRestoreCore(x.before);}finishImportProgress(false,'Simkl import failed',e.message||'Could not read this Simkl JSON backup.');}}

const mfBaseRenderLibrary=renderLibrary;
renderLibrary=function(){let h=mfBaseRenderLibrary();h=h.replace('<div class="section-label">OVERVIEW',mfBatchBar()+'<div class="section-label">OVERVIEW');const catTools=`<div class="card" style="margin-bottom:22px"><div class="section-label">CATEGORY MAINTENANCE</div><div style="display:flex;gap:8px;flex-wrap:wrap">${S.categories.map(c=>`<button class="btn btn-sm" onclick="App.clearCategoryLibrary('${c.id}')">Clear ${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</button>`).join('')}</div><div class="hint" style="margin-top:9px">Clears titles only from the chosen category. History stays intact and the action can be undone from Library History.</div></div>`;const end=h.lastIndexOf('</div>');if(end>0)h=h.slice(0,end)+catTools+h.slice(end);return h;};
const mfBaseRenderStats=renderStats;
renderStats=function(){let h=mfBaseRenderStats();const needle='<div class="view-head">';const p=h.indexOf('</div>',h.indexOf(needle));return p>=0?h.slice(0,p+6)+mfAchievementsHtml()+h.slice(p+6):mfAchievementsHtml()+h;};
const mfBaseRenderHistory=renderHistory;
renderHistory=function(){let h=mfBaseRenderHistory();h=h.replace(/\$\{S\.sessions\.length[^}]+\}/g,'');return h;};
const mfBaseRenderView=renderView;renderView=function(){mfBaseRenderView();setTimeout(mfEnhanceLibraryDom,0);};

Object.assign(App,{importSimklJson:mfImportSimklJson,toggleLibrarySelect:mfToggleSelect,selectVisibleLibrary:mfSelectVisible,clearLibrarySelection:mfClearSelection,batchLibraryStatus:mfBatchStatus,batchLibraryPriority:mfBatchPriority,batchLibraryCategory:mfBatchCategory,batchDeleteLibrary:mfBatchDelete,clearCategoryLibrary:mfClearCategory,undoChange:mfUndo,redoChange:mfRedo});
// Track the important library mutations in v37.
for(const name of ['setPriorityChoice','setLibraryStatus','setLibraryCategory']){const old=App[name];if(old)App[name]=function(id,v){const item=S.library.find(i=>i.id===id);mfBegin(name==='setPriorityChoice'?'Change priority':name==='setLibraryStatus'?'Change status':'Move title',item?cleanTitle(item.title):'');old.call(App,id,v);mfCommit(name==='setPriorityChoice'?'Change priority':name==='setLibraryStatus'?'Change status':'Move title',item?cleanTitle(item.title):'');};}
const mfOldSaveLibrary=App.saveLibraryModal;App.saveLibraryModal=function(id){const before=id?S.library.find(i=>i.id===id):null;mfBegin(id?'Edit title':'Add title',before?cleanTitle(before.title):'');mfOldSaveLibrary.call(App,id);const after=id?S.library.find(i=>i.id===id):S.library[S.library.length-1];mfCommit(id?'Edit title':'Add title',after?cleanTitle(after.title):'');};
const mfOldConfirmDelete=App.confirmDeleteLibrary;App.confirmDeleteLibrary=async function(id){const item=S.library.find(i=>i.id===id);mfBegin('Delete title',item?cleanTitle(item.title):'');await mfOldConfirmDelete.call(App,id);mfCommit('Delete title',item?cleanTitle(item.title):'');};
const mfOldSubmit=App.submitLog;App.submitLog=function(){mfBegin('Log consumption',S.currentTask?getCategory(S.currentTask.categoryId).name:'');mfOldSubmit.call(App);mfCommit('Log consumption',S.sessions.length?`${S.sessions[S.sessions.length-1].actualAmount} ${S.sessions[S.sessions.length-1].unit}`:'');};
// v37 history deletion is undoable. Existing custom session edit modal remains available.
App.deleteSession=function(id){const x=S.sessions.find(s=>s.id===id);if(!x)return;mfBegin('Delete history',getCategory(x.categoryId).name);S.sessions=S.sessions.filter(s=>s.id!==id);S.histPage=0;mfCommit('Delete history',getCategory(x.categoryId).name);render();showToast('History entry deleted · Undo available');};
App.deleteSessionFromModal=function(id){S.modal=null;App.deleteSession(id);};

const mfSnap=snapshot;snapshot=function(){const x=mfSnap();x.activityLog=S.activityLog||[];return x;};
const mfLoad=loadAll;loadAll=async function(){await mfLoad();const d=await rawGet(STATE_KEY);S.activityLog=Array.isArray(d?.activityLog)?d.activityLog:[];S.undoStack=[];S.redoStack=[];S.librarySelection={};};


/* ============================================================
   v43: Library controls, themes, richer activity, balance insight
   ============================================================ */

/* ============================================================
   MediaFlow v63 — original 50 Theme Collection
   Originally 50 selectable MediaFlow themes; v133 expands the collection
   to 64 while retaining every prior theme and the customizable theme.
   ============================================================ */
/* Additional built-in themes + user-custom theme */
const V43_THEMES=['dark','light','amoled','midnight','ocean','forest','sunset','purple','rose','coffee','nord','cyber','slate','crimson','sakura','arctic','desert','emerald','volcano','lavender','gold','matrix','dracula','solarized','peach','mint','monochrome','cobalt','cherry','toxic','galaxy','coral','bronze','iceberg','bubblegum','terminal','paper','wine','sky','obsidian','retro','autumn','aqua','ivory','neon','moss','blueprint','candy','storm','porcelain','matcha-cream','lemon-sorbet','lilac-haze','coastal-breeze','terracotta-studio','notebook','rose-milk','seafoam-glass','morning-sky','pistachio','apricot','aurora-night','ink-neon','custom','platform-anilist-dark','platform-anilist-light','platform-anisearch-dark','platform-anisearch-light','platform-aniwatch-dark','platform-aniwatch-light','platform-betaseries-dark','platform-betaseries-light','platform-criticker-dark','platform-criticker-light','platform-crunchyroll-dark','platform-crunchyroll-light','platform-episodecalendar-dark','platform-episodecalendar-light','platform-hianime-dark','platform-hianime-light','platform-imdb-dark','platform-imdb-light','platform-letterboxd-dark','platform-letterboxd-light','platform-livechart-dark','platform-livechart-light','platform-kitsu-dark','platform-kitsu-light','platform-moviesfad-dark','platform-moviesfad-light','platform-myanimelist-dark','platform-myanimelist-light','platform-malxml-dark','platform-malxml-light','platform-netflix-dark','platform-netflix-light','platform-primewire-dark','platform-primewire-light','platform-seriesfad-dark','platform-seriesfad-light','platform-stremio-dark','platform-stremio-light','platform-tvtime-dark','platform-tvtime-light','platform-tviso-dark','platform-tviso-light','platform-twee-dark','platform-twee-light','platform-simkl-dark','platform-simkl-light','platform-trakt-old','platform-trakt-new-dark','platform-trakt-new-light'];
const V43_THEME_LABELS={'dark':'Dark','light':'Light','amoled':'AMOLED','midnight':'Midnight Blue','ocean':'Ocean','forest':'Forest','sunset':'Sunset','purple':'Purple','rose':'Rose','coffee':'Coffee','nord':'Nord','cyber':'Cyber','slate':'Slate','crimson':'Crimson Noir','sakura':'Sakura','arctic':'Arctic Ice','desert':'Desert Sand','emerald':'Emerald City','volcano':'Volcano','lavender':'Lavender Dream','gold':'Royal Gold','matrix':'Matrix','dracula':'Dracula','solarized':'Solarized','peach':'Peach Cream','mint':'Mint Paper','monochrome':'Monochrome','cobalt':'Cobalt','cherry':'Cherry Cola','toxic':'Toxic Lime','galaxy':'Galaxy','coral':'Coral Reef','bronze':'Bronze Age','iceberg':'Iceberg','bubblegum':'Bubblegum','terminal':'Terminal','paper':'Paper','wine':'Wine Cellar','sky':'Day Sky','obsidian':'Obsidian','retro':'Retro Arcade','autumn':'Autumn','aqua':'Aqua Glass','ivory':'Ivory','neon':'Neon Nights','moss':'Moss','blueprint':'Blueprint','candy':'Candy Pop','storm':'Storm','porcelain':'Porcelain Blue','matcha-cream':'Matcha Cream','lemon-sorbet':'Lemon Sorbet','lilac-haze':'Lilac Haze','coastal-breeze':'Coastal Breeze','terracotta-studio':'Terracotta Studio','notebook':'Notebook','rose-milk':'Rose Milk','seafoam-glass':'Seafoam Glass','morning-sky':'Morning Sky','pistachio':'Pistachio','apricot':'Apricot','aurora-night':'Aurora Night','ink-neon':'Ink & Neon','custom':'Custom','platform-anilist-dark':'AniList Dark','platform-anilist-light':'AniList Light','platform-anisearch-dark':'AniSearch Dark','platform-anisearch-light':'AniSearch Light','platform-aniwatch-dark':'AniWatch Dark','platform-aniwatch-light':'AniWatch Light','platform-betaseries-dark':'BetaSeries Dark','platform-betaseries-light':'BetaSeries Light','platform-criticker-dark':'Criticker Dark','platform-criticker-light':'Criticker Light','platform-crunchyroll-dark':'Crunchyroll Dark','platform-crunchyroll-light':'Crunchyroll Light','platform-episodecalendar-dark':'EpisodeCalendar Dark','platform-episodecalendar-light':'EpisodeCalendar Light','platform-hianime-dark':'HiAnime Dark','platform-hianime-light':'HiAnime Light','platform-imdb-dark':'IMDb Dark','platform-imdb-light':'IMDb Light','platform-letterboxd-dark':'Letterboxd Dark','platform-letterboxd-light':'Letterboxd Light','platform-livechart-dark':'LiveChart Dark','platform-livechart-light':'LiveChart Light','platform-kitsu-dark':'Kitsu Dark','platform-kitsu-light':'Kitsu Light','platform-moviesfad-dark':'MoviesFad Dark','platform-moviesfad-light':'MoviesFad Light','platform-myanimelist-dark':'MyAnimeList Dark','platform-myanimelist-light':'MyAnimeList Light','platform-malxml-dark':'MAL-XML Dark','platform-malxml-light':'MAL-XML Light','platform-netflix-dark':'Netflix Dark','platform-netflix-light':'Netflix Light','platform-primewire-dark':'PrimeWire Dark','platform-primewire-light':'PrimeWire Light','platform-seriesfad-dark':'SeriesFad Dark','platform-seriesfad-light':'SeriesFad Light','platform-stremio-dark':'Stremio Dark','platform-stremio-light':'Stremio Light','platform-tvtime-dark':'TV Time Dark','platform-tvtime-light':'TV Time Light','platform-tviso-dark':'Tviso Dark','platform-tviso-light':'Tviso Light','platform-twee-dark':'Twee Dark','platform-twee-light':'Twee Light','platform-simkl-dark':'Simkl Dark','platform-simkl-light':'Simkl Light','platform-trakt-old':'Trakt Old','platform-trakt-new-dark':'Trakt New Dark','platform-trakt-new-light':'Trakt New Light'};
const V55_PLATFORM_THEMES=["platform-anilist-dark", "platform-anilist-light", "platform-anisearch-dark", "platform-anisearch-light", "platform-aniwatch-dark", "platform-aniwatch-light", "platform-betaseries-dark", "platform-betaseries-light", "platform-criticker-dark", "platform-criticker-light", "platform-crunchyroll-dark", "platform-crunchyroll-light", "platform-episodecalendar-dark", "platform-episodecalendar-light", "platform-hianime-dark", "platform-hianime-light", "platform-imdb-dark", "platform-imdb-light", "platform-letterboxd-dark", "platform-letterboxd-light", "platform-livechart-dark", "platform-livechart-light", "platform-kitsu-dark", "platform-kitsu-light", "platform-moviesfad-dark", "platform-moviesfad-light", "platform-myanimelist-dark", "platform-myanimelist-light", "platform-malxml-dark", "platform-malxml-light", "platform-netflix-dark", "platform-netflix-light", "platform-primewire-dark", "platform-primewire-light", "platform-seriesfad-dark", "platform-seriesfad-light", "platform-stremio-dark", "platform-stremio-light", "platform-tvtime-dark", "platform-tvtime-light", "platform-tviso-dark", "platform-tviso-light", "platform-twee-dark", "platform-twee-light", "platform-simkl-dark", "platform-simkl-light", "platform-trakt-old", "platform-trakt-new-dark", "platform-trakt-new-light"];
const V55_MEDIAFLOW_THEMES=V43_THEMES.filter(t=>!V55_PLATFORM_THEMES.includes(t));

S.settings=S.settings||{};
S.settings.customTheme=S.settings.customTheme||{bg:'#0E111A',panel:'#161B2A',raised:'#1C2334',border:'#2B3448',text:'#F4F6FB',muted:'#8D98AD',accent:'#E8A94A'};
S.settings.libraryView=S.settings.libraryView||'list';

const v43ThemeCss=document.createElement('style');
v43ThemeCss.textContent=`
html[data-theme="midnight"]{--bg:#07111f;--panel:#0d1b2d;--panel-raised:#13243a;--border:#243a55;--border-soft:#192d46;--text:#edf5ff;--text-dim:#a9bfd8;--text-mute:#7189a4;--flow:#69a7ff}
html[data-theme="ocean"]{--bg:#07181d;--panel:#0d252b;--panel-raised:#123139;--border:#24505a;--border-soft:#193d46;--text:#effcfd;--text-dim:#a7d2d6;--text-mute:#6f9ea3;--flow:#55d6be}
html[data-theme="forest"]{--bg:#0c1610;--panel:#142219;--panel-raised:#1a2d21;--border:#31503b;--border-soft:#223b2b;--text:#f1f8f2;--text-dim:#b2cbb7;--text-mute:#7f9d86;--flow:#76c893}
html[data-theme="sunset"]{--bg:#1b1014;--panel:#28171d;--panel-raised:#352027;--border:#5a3540;--border-soft:#452831;--text:#fff4ef;--text-dim:#dfb8aa;--text-mute:#a77f76;--flow:#ff9f68}
html[data-theme="purple"]{--bg:#120e1d;--panel:#1c162b;--panel-raised:#261d39;--border:#463663;--border-soft:#34284c;--text:#f8f3ff;--text-dim:#c8b8df;--text-mute:#907da9;--flow:#b892ff}
html[data-theme="rose"]{--bg:#1a1016;--panel:#271720;--panel-raised:#341f2a;--border:#583647;--border-soft:#432936;--text:#fff4f8;--text-dim:#dfb5c6;--text-mute:#a47a8b;--flow:#f08fb3}
html[data-theme="coffee"]{--bg:#17120f;--panel:#241c17;--panel-raised:#30251e;--border:#514033;--border-soft:#3d3027;--text:#fbf4ec;--text-dim:#d0bba6;--text-mute:#97816e;--flow:#d6a56f}
html[data-theme="nord"]{--bg:#242933;--panel:#2e3440;--panel-raised:#3b4252;--border:#4c566a;--border-soft:#404858;--text:#eceff4;--text-dim:#d8dee9;--text-mute:#8892a5;--flow:#88c0d0}
html[data-theme="cyber"]{--bg:#080b10;--panel:#10151d;--panel-raised:#151d28;--border:#26394a;--border-soft:#1b2b39;--text:#eafffb;--text-dim:#9bcfc8;--text-mute:#608d88;--flow:#35f2c1}
html[data-theme="slate"]{--bg:#11151b;--panel:#19202a;--panel-raised:#212b37;--border:#344252;--border-soft:#283543;--text:#f3f6fa;--text-dim:#b7c1cd;--text-mute:#7f8b99;--flow:#8fb3d9}
html[data-theme="crimson"]{--bg:#120609;--panel:#210b10;--panel-raised:#321019;--border:#5b1d2b;--border-soft:#41141f;--text:#fff1f3;--text-dim:#e3a9b3;--text-mute:#a76572;--flow:#ff345f;--flow-dim:color-mix(in srgb,#ff345f 58%,#120609)}
html[data-theme="sakura"]{--bg:#fff4f7;--panel:#fffafd;--panel-raised:#ffe8f0;--border:#eab8ca;--border-soft:#f5cfdd;--text:#442b36;--text-dim:#80586a;--text-mute:#ad7c91;--flow:#e96f9d;--flow-dim:color-mix(in srgb,#e96f9d 58%,#fff4f7)}
html[data-theme="arctic"]{--bg:#eaf8ff;--panel:#f8fdff;--panel-raised:#dff3ff;--border:#9bcce3;--border-soft:#c4e5f3;--text:#102d3c;--text-dim:#416779;--text-mute:#6e95a7;--flow:#008fc7;--flow-dim:color-mix(in srgb,#008fc7 58%,#eaf8ff)}
html[data-theme="desert"]{--bg:#f3e2c2;--panel:#fff1d7;--panel-raised:#ead0a5;--border:#b98e58;--border-soft:#d5b27f;--text:#3e2c1b;--text-dim:#77583a;--text-mute:#a07e5a;--flow:#c76b29;--flow-dim:color-mix(in srgb,#c76b29 58%,#f3e2c2)}
html[data-theme="emerald"]{--bg:#061711;--panel:#0b251b;--panel-raised:#103426;--border:#235d45;--border-soft:#184833;--text:#effff7;--text-dim:#a9dbc4;--text-mute:#6da88d;--flow:#2ee59d;--flow-dim:color-mix(in srgb,#2ee59d 58%,#061711)}
html[data-theme="volcano"]{--bg:#120807;--panel:#24100c;--panel-raised:#36160f;--border:#6b2b1b;--border-soft:#4b2017;--text:#fff2e9;--text-dim:#e5b09b;--text-mute:#a86f5a;--flow:#ff5b21;--flow-dim:color-mix(in srgb,#ff5b21 58%,#120807)}
html[data-theme="lavender"]{--bg:#f3efff;--panel:#fbf9ff;--panel-raised:#e9e0ff;--border:#b8a4e5;--border-soft:#d3c5f3;--text:#2d2345;--text-dim:#675687;--text-mute:#9480b7;--flow:#7c52d9;--flow-dim:color-mix(in srgb,#7c52d9 58%,#f3efff)}
html[data-theme="gold"]{--bg:#100d05;--panel:#211a08;--panel-raised:#32270b;--border:#665017;--border-soft:#4a3a10;--text:#fff8dd;--text-dim:#dfcb83;--text-mute:#9e8849;--flow:#f5c542;--flow-dim:color-mix(in srgb,#f5c542 58%,#100d05)}
html[data-theme="matrix"]{--bg:#000500;--panel:#001000;--panel-raised:#001a04;--border:#0b4a17;--border-soft:#06330f;--text:#caffca;--text-dim:#6fe87d;--text-mute:#329c44;--flow:#00ff41;--flow-dim:color-mix(in srgb,#00ff41 58%,#000500)}
html[data-theme="dracula"]{--bg:#17141f;--panel:#211d2b;--panel-raised:#2b2638;--border:#514666;--border-soft:#3d354d;--text:#f8f8f2;--text-dim:#c7bed7;--text-mute:#81758f;--flow:#ff79c6;--flow-dim:color-mix(in srgb,#ff79c6 58%,#17141f)}
html[data-theme="solarized"]{--bg:#002b36;--panel:#073642;--panel-raised:#0b4652;--border:#315b63;--border-soft:#17434d;--text:#fdf6e3;--text-dim:#b7c5bd;--text-mute:#7d9895;--flow:#b58900;--flow-dim:color-mix(in srgb,#b58900 58%,#002b36)}
html[data-theme="peach"]{--bg:#fff1e8;--panel:#fff9f4;--panel-raised:#ffe1d1;--border:#efb69a;--border-soft:#f6cdb8;--text:#4b2d24;--text-dim:#87594b;--text-mute:#b27d6a;--flow:#ef7f5b;--flow-dim:color-mix(in srgb,#ef7f5b 58%,#fff1e8)}
html[data-theme="mint"]{--bg:#edfff8;--panel:#f9fffc;--panel-raised:#d9f7eb;--border:#9ed8c2;--border-soft:#c0ead9;--text:#173b30;--text-dim:#477566;--text-mute:#75a594;--flow:#1ca87a;--flow-dim:color-mix(in srgb,#1ca87a 58%,#edfff8)}
html[data-theme="monochrome"]{--bg:#111111;--panel:#1b1b1b;--panel-raised:#292929;--border:#4a4a4a;--border-soft:#353535;--text:#f4f4f4;--text-dim:#bcbcbc;--text-mute:#7d7d7d;--flow:#ffffff;--flow-dim:color-mix(in srgb,#ffffff 58%,#111111)}
html[data-theme="cobalt"]{--bg:#071229;--panel:#0b1c3d;--panel-raised:#102954;--border:#254c82;--border-soft:#183867;--text:#eef5ff;--text-dim:#abc5ed;--text-mute:#718fb9;--flow:#3b82f6;--flow-dim:color-mix(in srgb,#3b82f6 58%,#071229)}
html[data-theme="cherry"]{--bg:#16080d;--panel:#2a0d16;--panel-raised:#3c1220;--border:#6d2739;--border-soft:#511b2b;--text:#fff0f4;--text-dim:#e7a5b7;--text-mute:#a96378;--flow:#e3265f;--flow-dim:color-mix(in srgb,#e3265f 58%,#16080d)}
html[data-theme="toxic"]{--bg:#0a0d03;--panel:#151b05;--panel-raised:#202909;--border:#465a12;--border-soft:#34430d;--text:#f5ffd8;--text-dim:#c7e57a;--text-mute:#8fa840;--flow:#b6ff2e;--flow-dim:color-mix(in srgb,#b6ff2e 58%,#0a0d03)}
html[data-theme="galaxy"]{--bg:#080719;--panel:#12102b;--panel-raised:#1d1740;--border:#42396e;--border-soft:#30285a;--text:#f4f0ff;--text-dim:#bcb0e7;--text-mute:#8173b2;--flow:#8c6cff;--flow-dim:color-mix(in srgb,#8c6cff 58%,#080719)}
html[data-theme="coral"]{--bg:#10202a;--panel:#17313b;--panel-raised:#1e424b;--border:#397079;--border-soft:#2a5861;--text:#f2ffff;--text-dim:#b7d9da;--text-mute:#7aa9aa;--flow:#ff786d;--flow-dim:color-mix(in srgb,#ff786d 58%,#10202a)}
html[data-theme="bronze"]{--bg:#17100a;--panel:#271a10;--panel-raised:#382417;--border:#62442b;--border-soft:#4a321f;--text:#fff3e4;--text-dim:#d8b894;--text-mute:#9b7957;--flow:#cd7f32;--flow-dim:color-mix(in srgb,#cd7f32 58%,#17100a)}
html[data-theme="iceberg"]{--bg:#08171d;--panel:#10252d;--panel-raised:#173540;--border:#315b67;--border-soft:#244954;--text:#effcff;--text-dim:#acd8e3;--text-mute:#719fac;--flow:#74d7ef;--flow-dim:color-mix(in srgb,#74d7ef 58%,#08171d)}
html[data-theme="bubblegum"]{--bg:#fff0fb;--panel:#fff8fd;--panel-raised:#fbdcf3;--border:#e8a6d2;--border-soft:#f1c5e3;--text:#4d2944;--text-dim:#89587c;--text-mute:#b97da9;--flow:#ff58b0;--flow-dim:color-mix(in srgb,#ff58b0 58%,#fff0fb)}
html[data-theme="terminal"]{--bg:#050805;--panel:#0a100a;--panel-raised:#101910;--border:#244024;--border-soft:#193019;--text:#e6ffe6;--text-dim:#9dd39d;--text-mute:#5f9960;--flow:#64ff64;--flow-dim:color-mix(in srgb,#64ff64 58%,#050805)}
html[data-theme="paper"]{--bg:#eee9dd;--panel:#faf7ef;--panel-raised:#e5ded0;--border:#c4b9a6;--border-soft:#d5cbbc;--text:#2e2b27;--text-dim:#625d55;--text-mute:#8e867a;--flow:#4b6b88;--flow-dim:color-mix(in srgb,#4b6b88 58%,#eee9dd)}
html[data-theme="wine"]{--bg:#14090e;--panel:#251019;--panel-raised:#351722;--border:#623047;--border-soft:#492235;--text:#fff1f6;--text-dim:#d9aab9;--text-mute:#9a6879;--flow:#b94a70;--flow-dim:color-mix(in srgb,#b94a70 58%,#14090e)}
html[data-theme="sky"]{--bg:#dff3ff;--panel:#f7fcff;--panel-raised:#cbeaff;--border:#8bc6ea;--border-soft:#acd9f3;--text:#18364a;--text-dim:#47748f;--text-mute:#719bb2;--flow:#168ad0;--flow-dim:color-mix(in srgb,#168ad0 58%,#dff3ff)}
html[data-theme="obsidian"]{--bg:#07090c;--panel:#0d1117;--panel-raised:#151b23;--border:#2d3744;--border-soft:#202935;--text:#f1f4f8;--text-dim:#aeb9c7;--text-mute:#6f7c8b;--flow:#8aa4c2;--flow-dim:color-mix(in srgb,#8aa4c2 58%,#07090c)}
html[data-theme="retro"]{--bg:#160d24;--panel:#25143a;--panel-raised:#361c50;--border:#613579;--border-soft:#48285f;--text:#fff4d6;--text-dim:#e7bf76;--text-mute:#a47b47;--flow:#ff9f1c;--flow-dim:color-mix(in srgb,#ff9f1c 58%,#160d24)}
html[data-theme="autumn"]{--bg:#1a1008;--panel:#2a1a0d;--panel-raised:#3a2512;--border:#684422;--border-soft:#4e3319;--text:#fff4df;--text-dim:#d9b786;--text-mute:#9e774c;--flow:#e07a2d;--flow-dim:color-mix(in srgb,#e07a2d 58%,#1a1008)}
html[data-theme="aqua"]{--bg:#06191b;--panel:#0b282b;--panel-raised:#10383c;--border:#28636a;--border-soft:#1b4b50;--text:#efffff;--text-dim:#a8dfe2;--text-mute:#6da9ad;--flow:#25d6d9;--flow-dim:color-mix(in srgb,#25d6d9 58%,#06191b)}
html[data-theme="ivory"]{--bg:#f7f2e5;--panel:#fffdf7;--panel-raised:#ece4d2;--border:#c8bda6;--border-soft:#dbd1bd;--text:#302c24;--text-dim:#665e50;--text-mute:#918674;--flow:#9a7438;--flow-dim:color-mix(in srgb,#9a7438 58%,#f7f2e5)}
html[data-theme="neon"]{--bg:#090611;--panel:#130b20;--panel-raised:#1d1030;--border:#462260;--border-soft:#321846;--text:#fff2ff;--text-dim:#d4a6e9;--text-mute:#9565ad;--flow:#ff35e1;--flow-dim:color-mix(in srgb,#ff35e1 58%,#090611)}
html[data-theme="moss"]{--bg:#10150a;--panel:#1a2210;--panel-raised:#253017;--border:#465d2c;--border-soft:#344621;--text:#f5fae9;--text-dim:#c0cf9d;--text-mute:#87996a;--flow:#86a94f;--flow-dim:color-mix(in srgb,#86a94f 58%,#10150a)}
html[data-theme="blueprint"]{--bg:#06182b;--panel:#0a2744;--panel-raised:#0e365c;--border:#285b86;--border-soft:#1b4770;--text:#eef8ff;--text-dim:#a7c9e7;--text-mute:#6d9bc2;--flow:#48a9ff;--flow-dim:color-mix(in srgb,#48a9ff 58%,#06182b)}
html[data-theme="candy"]{--bg:#fff4ea;--panel:#fffafd;--panel-raised:#ffe3ef;--border:#f1b2ce;--border-soft:#f7cada;--text:#412c42;--text-dim:#795a7b;--text-mute:#a77ca7;--flow:#ff4f9a;--flow-dim:color-mix(in srgb,#ff4f9a 58%,#fff4ea)}
html[data-theme="storm"]{--bg:#0d1118;--panel:#171d27;--panel-raised:#222b38;--border:#414e61;--border-soft:#303b4b;--text:#f0f4f9;--text-dim:#b3becd;--text-mute:#778596;--flow:#6e8eaf;--flow-dim:color-mix(in srgb,#6e8eaf 58%,#0d1118)}
html[data-theme="crimson"] body{background:radial-gradient(circle at 15% 0%,#5a1025 0%,var(--bg) 48%);}
html[data-theme="sakura"] body{background:linear-gradient(145deg,#fff8fb 0%,var(--bg) 58%);}
html[data-theme="arctic"] body{background:radial-gradient(circle at 85% 0%,#ffffff 0%,var(--bg) 52%);}
html[data-theme="desert"] body{background:linear-gradient(160deg,#f8e7c7 0%,var(--bg) 62%);}
html[data-theme="emerald"] body{background:radial-gradient(circle at 15% 0%,#124c36 0%,var(--bg) 50%);}
html[data-theme="volcano"] body{background:radial-gradient(circle at 50% -20%,#702310 0%,var(--bg) 52%);}
html[data-theme="lavender"] body{background:linear-gradient(145deg,#fffaff 0%,var(--bg) 60%);}
html[data-theme="gold"] body{background:radial-gradient(circle at 50% -20%,#4a3908 0%,var(--bg) 52%);}
html[data-theme="matrix"] body{background:linear-gradient(180deg,#001500 0%,var(--bg) 48%);}
html[data-theme="dracula"] body{background:radial-gradient(circle at 80% 0%,#35264d 0%,var(--bg) 52%);}
html[data-theme="solarized"] body{background:linear-gradient(160deg,#073642 0%,var(--bg) 58%);}
html[data-theme="peach"] body{background:linear-gradient(150deg,#fff9f4 0%,var(--bg) 60%);}
html[data-theme="mint"] body{background:linear-gradient(150deg,#fbfffd 0%,var(--bg) 60%);}
html[data-theme="monochrome"] body{background:linear-gradient(160deg,#242424 0%,var(--bg) 55%);}
html[data-theme="cobalt"] body{background:radial-gradient(circle at 20% 0%,#173d80 0%,var(--bg) 52%);}
html[data-theme="cherry"] body{background:radial-gradient(circle at 20% 0%,#5a1530 0%,var(--bg) 52%);}
html[data-theme="toxic"] body{background:radial-gradient(circle at 50% -20%,#273a06 0%,var(--bg) 50%);}
html[data-theme="galaxy"] body{background:radial-gradient(circle at 75% 0%,#37235f 0%,var(--bg) 52%);}
html[data-theme="coral"] body{background:radial-gradient(circle at 15% 0%,#22555c 0%,var(--bg) 52%);}
html[data-theme="bronze"] body{background:linear-gradient(155deg,#382313 0%,var(--bg) 56%);}
html[data-theme="iceberg"] body{background:radial-gradient(circle at 75% 0%,#174b5c 0%,var(--bg) 52%);}
html[data-theme="bubblegum"] body{background:linear-gradient(145deg,#fffaff 0%,var(--bg) 60%);}
html[data-theme="terminal"] body{background:linear-gradient(180deg,#0d1a0d 0%,var(--bg) 48%);}
html[data-theme="paper"] body{background:linear-gradient(145deg,#faf7ef 0%,var(--bg) 62%);}
html[data-theme="wine"] body{background:radial-gradient(circle at 15% 0%,#4b1b31 0%,var(--bg) 52%);}
html[data-theme="sky"] body{background:linear-gradient(180deg,#f7fcff 0%,var(--bg) 64%);}
html[data-theme="obsidian"] body{background:radial-gradient(circle at 50% -20%,#1d2733 0%,var(--bg) 48%);}
html[data-theme="retro"] body{background:radial-gradient(circle at 80% 0%,#4c2366 0%,var(--bg) 54%);}
html[data-theme="autumn"] body{background:linear-gradient(155deg,#4b2b10 0%,var(--bg) 58%);}
html[data-theme="aqua"] body{background:radial-gradient(circle at 15% 0%,#14545a 0%,var(--bg) 52%);}
html[data-theme="ivory"] body{background:linear-gradient(145deg,#fffdf7 0%,var(--bg) 62%);}
html[data-theme="neon"] body{background:radial-gradient(circle at 80% 0%,#48105c 0%,var(--bg) 52%);}
html[data-theme="moss"] body{background:linear-gradient(155deg,#293718 0%,var(--bg) 58%);}
html[data-theme="blueprint"] body{background:linear-gradient(145deg,#123e67 0%,var(--bg) 58%);}
html[data-theme="candy"] body{background:linear-gradient(145deg,#fffafd 0%,var(--bg) 62%);}
html[data-theme="storm"] body{background:radial-gradient(circle at 50% -20%,#334154 0%,var(--bg) 52%);}

/* MediaFlow v133 — 14 additional built-in MediaFlow themes.
   12 are native-light designs; Aurora Night and Ink & Neon are dark. */
html[data-theme="porcelain"]{--bg:#f4f8fc;--panel:#ffffff;--panel-raised:#edf3f9;--border:#b9c9d9;--border-soft:#d8e2ec;--text:#182433;--text-dim:#52677c;--text-mute:#8193a5;--flow:#376f9f;--flow-dim:#9fc0da}
html[data-theme="matcha-cream"]{--bg:#f3f4e8;--panel:#fffef5;--panel-raised:#e5ead3;--border:#b7c29a;--border-soft:#d4dcc0;--text:#26301f;--text-dim:#5d6c4e;--text-mute:#879477;--flow:#718b52;--flow-dim:#b8c99c}
html[data-theme="lemon-sorbet"]{--bg:#fff9d8;--panel:#fffdf0;--panel-raised:#fff0a9;--border:#d5bf55;--border-soft:#eadb91;--text:#302b18;--text-dim:#6d6335;--text-mute:#988a50;--flow:#d19b00;--flow-dim:#efd46f}
html[data-theme="lilac-haze"]{--bg:#f6f1ff;--panel:#ffffff;--panel-raised:#eae0ff;--border:#c1afe8;--border-soft:#dbcef4;--text:#302542;--text-dim:#6d5a88;--text-mute:#9784b3;--flow:#8566cc;--flow-dim:#c4b2ea}
html[data-theme="coastal-breeze"]{--bg:#eef9fb;--panel:#ffffff;--panel-raised:#dff2f5;--border:#a8cfd6;--border-soft:#cce5e9;--text:#17343b;--text-dim:#4c7078;--text-mute:#7599a0;--flow:#1689a3;--flow-dim:#9bd0da}
html[data-theme="terracotta-studio"]{--bg:#fbf0e7;--panel:#fffaf6;--panel-raised:#f4d9c8;--border:#d2a184;--border-soft:#e7c5b0;--text:#3d2921;--text-dim:#765348;--text-mute:#a37667;--flow:#b95f3d;--flow-dim:#dfa98f}
html[data-theme="notebook"]{--bg:#f7f8f4;--panel:#fffef9;--panel-raised:#edf1f3;--border:#aebac2;--border-soft:#d5dde2;--text:#172630;--text-dim:#51636d;--text-mute:#7e8e97;--flow:#2f6db0;--flow-dim:#a9c7e7}
html[data-theme="rose-milk"]{--bg:#fff3f2;--panel:#fffdfc;--panel-raised:#f9dddd;--border:#e1afb1;--border-soft:#f0ced0;--text:#3c2529;--text-dim:#78545b;--text-mute:#a47b82;--flow:#d86f7e;--flow-dim:#edb6bd}
html[data-theme="seafoam-glass"]{--bg:#e9fbf7;--panel:#fafffd;--panel-raised:#d6f3ea;--border:#92cfbd;--border-soft:#bee5d9;--text:#12372e;--text-dim:#467466;--text-mute:#73a294;--flow:#1f9f7f;--flow-dim:#93d6c4}
html[data-theme="morning-sky"]{--bg:#f3f8ff;--panel:#ffffff;--panel-raised:#e5f0ff;--border:#afc9e9;--border-soft:#d1e0f3;--text:#1e3047;--text-dim:#58718f;--text-mute:#8298b2;--flow:#4d86c6;--flow-dim:#b2d0ef}
html[data-theme="pistachio"]{--bg:#f5f7e9;--panel:#fffef8;--panel-raised:#e7eccb;--border:#bdc98f;--border-soft:#d7dfb7;--text:#2e341d;--text-dim:#657047;--text-mute:#8e986c;--flow:#819a43;--flow-dim:#bfce8d}
html[data-theme="apricot"]{--bg:#fff3e6;--panel:#fffaf5;--panel-raised:#ffdfbd;--border:#e6b17e;--border-soft:#f1cfad;--text:#422b1d;--text-dim:#7d5a42;--text-mute:#aa7f61;--flow:#e57e38;--flow-dim:#f3b783}
html[data-theme="aurora-night"]{--bg:#071419;--panel:#0d2026;--panel-raised:#143039;--border:#2e5a62;--border-soft:#21464e;--text:#eefcff;--text-dim:#acd8dc;--text-mute:#719da2;--flow:#57e2b2;--flow-dim:#2d8d7b}
html[data-theme="ink-neon"]{--bg:#08090f;--panel:#0f111b;--panel-raised:#171a29;--border:#34394f;--border-soft:#262b3e;--text:#f6f7ff;--text-dim:#b5bad3;--text-mute:#777f9c;--flow:#50e3ff;--flow-dim:#734cff}

/* Native body treatments */
html[data-theme="porcelain"] body{background:linear-gradient(145deg,#ffffff 0%,var(--bg) 66%);}
html[data-theme="matcha-cream"] body{background:radial-gradient(circle at 10% 0%,#fffef5 0%,var(--bg) 56%);}
html[data-theme="lemon-sorbet"] body{background:linear-gradient(155deg,#fffef2 0%,var(--bg) 62%);}
html[data-theme="lilac-haze"] body{background:radial-gradient(circle at 85% 0%,#ffffff 0%,var(--bg) 55%);}
html[data-theme="coastal-breeze"] body{background:linear-gradient(180deg,#fbffff 0%,var(--bg) 68%);}
html[data-theme="terracotta-studio"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 64%);}
html[data-theme="notebook"] body{background-color:var(--bg);background-image:linear-gradient(#cfe0ee55 1px,transparent 1px),linear-gradient(90deg,#cfe0ee33 1px,transparent 1px);background-size:28px 28px;}
html[data-theme="rose-milk"] body{background:radial-gradient(circle at 78% 0%,#fffefd 0%,var(--bg) 58%);}
html[data-theme="seafoam-glass"] body{background:radial-gradient(circle at 16% 0%,#ffffff 0%,#e9fbf7 48%,var(--bg) 100%);}
html[data-theme="morning-sky"] body{background:linear-gradient(180deg,#ffffff 0%,#edf6ff 38%,var(--bg) 100%);}
html[data-theme="pistachio"] body{background:linear-gradient(150deg,#fffef7 0%,var(--bg) 64%);}
html[data-theme="apricot"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 62%);}
html[data-theme="aurora-night"] body{background:radial-gradient(circle at 18% 0%,#124f4b 0%,transparent 33%),radial-gradient(circle at 88% 15%,#37245f 0%,transparent 30%),var(--bg);}
html[data-theme="ink-neon"] body{background:linear-gradient(135deg,#08090f 0%,#101326 55%,#07161b 100%);}

/* Structural signatures — these are intentionally more than simple recolors. */
html[data-theme="porcelain"] .card,html[data-theme="porcelain"] .stat-box{border-radius:5px;box-shadow:0 3px 12px rgba(41,74,105,.05)}
html[data-theme="porcelain"] .btn,html[data-theme="porcelain"] select{border-radius:5px}
html[data-theme="matcha-cream"] .card,html[data-theme="matcha-cream"] .stat-box,html[data-theme="matcha-cream"] .hero{border-radius:18px}
html[data-theme="matcha-cream"] .btn{border-radius:12px}
html[data-theme="lemon-sorbet"] .card,html[data-theme="lemon-sorbet"] .stat-box{border:2px solid var(--border);border-radius:7px;box-shadow:4px 4px 0 color-mix(in srgb,var(--flow) 20%,transparent)}
html[data-theme="lemon-sorbet"] .btn-primary{color:#2d250b}
html[data-theme="lilac-haze"] .card,html[data-theme="lilac-haze"] .stat-box,html[data-theme="lilac-haze"] .hero{border-radius:22px}
html[data-theme="lilac-haze"] .btn,html[data-theme="lilac-haze"] .pill{border-radius:999px}
html[data-theme="coastal-breeze"] .card,html[data-theme="coastal-breeze"] .stat-box{border-top:3px solid color-mix(in srgb,var(--flow) 65%,var(--border))}
html[data-theme="coastal-breeze"] .section-label{color:var(--flow)}
html[data-theme="terracotta-studio"] .view-title,html[data-theme="terracotta-studio"] .hero-name{font-family:Georgia,"Times New Roman",serif}
html[data-theme="terracotta-studio"] .card{border-left:4px solid color-mix(in srgb,var(--flow) 55%,var(--border))}
html[data-theme="notebook"] .card,html[data-theme="notebook"] .stat-box{border-radius:2px;box-shadow:none}
html[data-theme="notebook"] .section-label,html[data-theme="notebook"] .record-row .v{font-family:"Courier New",monospace}
html[data-theme="rose-milk"] .card,html[data-theme="rose-milk"] .stat-box,html[data-theme="rose-milk"] .hero{border-radius:24px;box-shadow:0 12px 28px rgba(171,92,105,.07)}
html[data-theme="seafoam-glass"] .card,html[data-theme="seafoam-glass"] .stat-box,html[data-theme="seafoam-glass"] .hero{background:color-mix(in srgb,var(--panel) 78%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 14px 35px rgba(24,116,96,.08)}
html[data-theme="morning-sky"] .card,html[data-theme="morning-sky"] .stat-box{border-radius:14px;box-shadow:0 8px 24px rgba(55,100,150,.06)}
html[data-theme="morning-sky"] .section-label{letter-spacing:.09em;color:var(--flow)}
html[data-theme="pistachio"] .card{border-style:dashed}
html[data-theme="pistachio"] .btn{border-radius:14px}
html[data-theme="apricot"] .btn-primary{background:linear-gradient(135deg,#f29a58,var(--flow));border-color:var(--flow)}
html[data-theme="apricot"] .card,html[data-theme="apricot"] .stat-box{border-radius:16px}
html[data-theme="aurora-night"] .card,html[data-theme="aurora-night"] .hero{background:color-mix(in srgb,var(--panel) 86%,transparent);box-shadow:0 16px 44px rgba(0,0,0,.24)}
html[data-theme="aurora-night"] .btn-primary{background:linear-gradient(135deg,#57e2b2,#8a64ff);border-color:transparent;color:#071419}
html[data-theme="ink-neon"] .card,html[data-theme="ink-neon"] .stat-box{border-radius:3px;border-left:2px solid var(--flow)}
html[data-theme="ink-neon"] .section-label{font-family:"Courier New",monospace;color:var(--flow);text-transform:uppercase}
html[data-theme="ink-neon"] .btn-primary{background:linear-gradient(135deg,#50e3ff,#8b5cff);border-color:transparent;color:#071014}

/* v55 Platform Themes */
html[data-theme="platform-anilist-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#3db4f2;--flow-dim:color-mix(in srgb,#3db4f2 62%,#0b0d10)}
html[data-theme="platform-anilist-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#3db4f2;--flow-dim:color-mix(in srgb,#3db4f2 62%,#eef2f5)}
html[data-theme="platform-anisearch-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e86c2f;--flow-dim:color-mix(in srgb,#e86c2f 62%,#0b0d10)}
html[data-theme="platform-anisearch-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e86c2f;--flow-dim:color-mix(in srgb,#e86c2f 62%,#eef2f5)}
html[data-theme="platform-aniwatch-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ffbade;--flow-dim:color-mix(in srgb,#ffbade 62%,#0b0d10)}
html[data-theme="platform-aniwatch-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ffbade;--flow-dim:color-mix(in srgb,#ffbade 62%,#eef2f5)}
html[data-theme="platform-betaseries-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ff4f4f;--flow-dim:color-mix(in srgb,#ff4f4f 62%,#0b0d10)}
html[data-theme="platform-betaseries-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ff4f4f;--flow-dim:color-mix(in srgb,#ff4f4f 62%,#eef2f5)}
html[data-theme="platform-criticker-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f39c12;--flow-dim:color-mix(in srgb,#f39c12 62%,#0b0d10)}
html[data-theme="platform-criticker-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f39c12;--flow-dim:color-mix(in srgb,#f39c12 62%,#eef2f5)}
html[data-theme="platform-crunchyroll-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f47521;--flow-dim:color-mix(in srgb,#f47521 62%,#0b0d10)}
html[data-theme="platform-crunchyroll-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f47521;--flow-dim:color-mix(in srgb,#f47521 62%,#eef2f5)}
html[data-theme="platform-episodecalendar-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#4aa3df;--flow-dim:color-mix(in srgb,#4aa3df 62%,#0b0d10)}
html[data-theme="platform-episodecalendar-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#4aa3df;--flow-dim:color-mix(in srgb,#4aa3df 62%,#eef2f5)}
html[data-theme="platform-hianime-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#b9e36f;--flow-dim:color-mix(in srgb,#b9e36f 62%,#0b0d10)}
html[data-theme="platform-hianime-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#b9e36f;--flow-dim:color-mix(in srgb,#b9e36f 62%,#eef2f5)}
html[data-theme="platform-imdb-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f5c518;--flow-dim:color-mix(in srgb,#f5c518 62%,#0b0d10)}
html[data-theme="platform-imdb-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f5c518;--flow-dim:color-mix(in srgb,#f5c518 62%,#eef2f5)}
html[data-theme="platform-letterboxd-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00e054;--flow-dim:color-mix(in srgb,#00e054 62%,#0b0d10)}
html[data-theme="platform-letterboxd-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00e054;--flow-dim:color-mix(in srgb,#00e054 62%,#eef2f5)}
html[data-theme="platform-livechart-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e84c4c;--flow-dim:color-mix(in srgb,#e84c4c 62%,#0b0d10)}
html[data-theme="platform-livechart-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e84c4c;--flow-dim:color-mix(in srgb,#e84c4c 62%,#eef2f5)}
html[data-theme="platform-kitsu-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f75239;--flow-dim:color-mix(in srgb,#f75239 62%,#0b0d10)}
html[data-theme="platform-kitsu-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f75239;--flow-dim:color-mix(in srgb,#f75239 62%,#eef2f5)}
html[data-theme="platform-moviesfad-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e74c3c;--flow-dim:color-mix(in srgb,#e74c3c 62%,#0b0d10)}
html[data-theme="platform-moviesfad-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e74c3c;--flow-dim:color-mix(in srgb,#e74c3c 62%,#eef2f5)}
html[data-theme="platform-myanimelist-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#2e51a2;--flow-dim:color-mix(in srgb,#2e51a2 62%,#0b0d10)}
html[data-theme="platform-myanimelist-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#2e51a2;--flow-dim:color-mix(in srgb,#2e51a2 62%,#eef2f5)}
html[data-theme="platform-malxml-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#4f6bb5;--flow-dim:color-mix(in srgb,#4f6bb5 62%,#0b0d10)}
html[data-theme="platform-malxml-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#4f6bb5;--flow-dim:color-mix(in srgb,#4f6bb5 62%,#eef2f5)}
html[data-theme="platform-netflix-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e50914;--flow-dim:color-mix(in srgb,#e50914 62%,#0b0d10)}
html[data-theme="platform-netflix-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e50914;--flow-dim:color-mix(in srgb,#e50914 62%,#eef2f5)}
html[data-theme="platform-primewire-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#44c8f5;--flow-dim:color-mix(in srgb,#44c8f5 62%,#0b0d10)}
html[data-theme="platform-primewire-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#44c8f5;--flow-dim:color-mix(in srgb,#44c8f5 62%,#eef2f5)}
html[data-theme="platform-seriesfad-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#9b59b6;--flow-dim:color-mix(in srgb,#9b59b6 62%,#0b0d10)}
html[data-theme="platform-seriesfad-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#9b59b6;--flow-dim:color-mix(in srgb,#9b59b6 62%,#eef2f5)}
html[data-theme="platform-stremio-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#7b5cff;--flow-dim:color-mix(in srgb,#7b5cff 62%,#0b0d10)}
html[data-theme="platform-stremio-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#7b5cff;--flow-dim:color-mix(in srgb,#7b5cff 62%,#eef2f5)}
html[data-theme="platform-tvtime-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ff2d55;--flow-dim:color-mix(in srgb,#ff2d55 62%,#0b0d10)}
html[data-theme="platform-tvtime-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ff2d55;--flow-dim:color-mix(in srgb,#ff2d55 62%,#eef2f5)}
html[data-theme="platform-tviso-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00a7c4;--flow-dim:color-mix(in srgb,#00a7c4 62%,#0b0d10)}
html[data-theme="platform-tviso-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00a7c4;--flow-dim:color-mix(in srgb,#00a7c4 62%,#eef2f5)}
html[data-theme="platform-twee-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ec407a;--flow-dim:color-mix(in srgb,#ec407a 62%,#0b0d10)}
html[data-theme="platform-twee-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ec407a;--flow-dim:color-mix(in srgb,#ec407a 62%,#eef2f5)}
html[data-theme="platform-simkl-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00a9e0;--flow-dim:color-mix(in srgb,#00a9e0 62%,#0b0d10)}
html[data-theme="platform-simkl-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00a9e0;--flow-dim:color-mix(in srgb,#00a9e0 62%,#eef2f5)}
html[data-theme="platform-trakt-old"]{--bg:#111;--panel:#1a1a1a;--panel-raised:#222;--border:#3a3a3a;--border-soft:#292929;--text:#f4f4f4;--text-dim:#bbb;--text-mute:#777;--flow:#ed1c24;--flow-dim:#a91c22}
html[data-theme="platform-trakt-new-dark"]{--bg:#0c0d0f;--panel:#17191c;--panel-raised:#202226;--border:#3a3d42;--border-soft:#292c30;--text:#f7f7f7;--text-dim:#b9bcc1;--text-mute:#777c82;--flow:#ed1c24;--flow-dim:#a91c22}
html[data-theme="platform-trakt-new-light"]{--bg:#f4f5f6;--panel:#fff;--panel-raised:#fafafa;--border:#d5d7da;--border-soft:#e6e7e9;--text:#202124;--text-dim:#5f6368;--text-mute:#8a8d91;--flow:#ed1c24;--flow-dim:#d35b60}
html[data-theme="custom"]{--bg:var(--mf-custom-bg);--panel:var(--mf-custom-panel);--panel-raised:var(--mf-custom-raised);--border:var(--mf-custom-border);--border-soft:var(--mf-custom-border);--text:var(--mf-custom-text);--text-dim:var(--mf-custom-muted);--text-mute:var(--mf-custom-muted);--flow:var(--mf-custom-accent)}
.v43-view-switch{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.v43-view-switch .active{border-color:var(--flow);color:var(--text)}
.library-view-compact .item-row{padding:7px 10px;gap:8px}.library-view-compact .item-sub{font-size:10px}.library-view-compact .bal-icon{width:28px;height:28px}
.library-view-cards .card:has(.item-row){display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;background:transparent;border:0;padding:0}.library-view-cards .item-row{display:grid;grid-template-columns:auto 1fr;align-items:start;border:1px solid var(--border);background:var(--panel);border-radius:12px;padding:14px}.library-view-cards .item-row>button,.library-view-cards .item-row>.pill{margin-top:5px}.library-view-cards .item-row .mf-select{grid-row:1/3}
.v43-log-detail{font-size:11px;line-height:1.55;margin-top:4px;color:var(--text-dim)}.v43-log-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.v43-balance-guidance{grid-column:2/-1;font-size:11px;color:var(--text-dim);margin-top:2px}.v43-balance-guidance b{color:var(--text)}
.v43-custom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:12px}.v43-color-field input[type=color]{height:40px;padding:3px}
`;
document.head.appendChild(v43ThemeCss);

function v43ApplyCustomTheme(){
  const c=S.settings.customTheme||{};const r=document.documentElement.style;
  const pairs={bg:'--mf-custom-bg',panel:'--mf-custom-panel',raised:'--mf-custom-raised',border:'--mf-custom-border',text:'--mf-custom-text',muted:'--mf-custom-muted',accent:'--mf-custom-accent'};
  Object.entries(pairs).forEach(([k,v])=>r.setProperty(v,c[k]||DEFAULT_SETTINGS.customTheme?.[k]||'#111111'));
}
applyTheme=function(theme){const t=V43_THEMES.includes(theme)?theme:'dark';if(S.settings)S.settings.theme=t;v43ApplyCustomTheme();document.documentElement.dataset.theme=t;try{localStorage.setItem('mf_theme',t);}catch(e){}};
function v43SetCustomTheme(k,v){if(!/^#[0-9a-f]{6}$/i.test(v))return;S.settings.customTheme=S.settings.customTheme||{};S.settings.customTheme[k]=v;S.settings.theme='custom';applyTheme('custom');persistSettings();render();}
function v43ResetCustomTheme(){S.settings.customTheme={bg:'#0E111A',panel:'#161B2A',raised:'#1C2334',border:'#2B3448',text:'#F4F6FB',muted:'#8D98AD',accent:'#E8A94A'};S.settings.theme='custom';applyTheme('custom');persistSettings();render();}

/* Library selection + view modes */
function v43FilteredLibraryIds(){const f=S.histFilters||{};return v53FilteredLibrary(f.libCategory||'all',f.libStatus||'all',f.libPriority||'all',(f.libSearch||'').trim()).map(i=>i.id);}
function v43SelectAll(){S.librarySelection=S.librarySelection||{};v43FilteredLibraryIds().forEach(id=>S.librarySelection[id]=true);render();}
function v43DeselectAll(){S.librarySelection={};render();}
function v43SetLibraryView(v){if(!['list','compact','cards'].includes(v))return;S.settings.libraryView=v;persistSettings();render();}
const v43OriginalLibrary=mfBaseRenderLibrary;
renderLibrary=function(){let h=v43OriginalLibrary();const mode=S.settings.libraryView||'list';const controls=`<div class="mf-batchbar"><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn btn-sm" onclick="App.selectVisibleLibrary(true)">Select visible</button><button class="btn btn-sm" onclick="App.selectAllLibrary()">Select all matching</button><button class="btn btn-sm" onclick="App.deselectAllLibrary()">Deselect all</button><button class="btn btn-sm" ${mfSelectedIds().length?'':'disabled'} onclick="App.fixSelectedCompletedProgress()">Fix completed progress</button></div><b>${mfSelectedIds().length} selected</b><div class="spacer"></div><select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${S.categories.map(c=>`<option value="${c.id}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select><button class="btn btn-sm" ${mfSelectedIds().length?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button><button class="btn btn-sm btn-danger" ${mfSelectedIds().length?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button></div>`;
  const view=`<div class="v43-view-switch" style="margin:0 0 12px"><span class="hint">Display:</span>${[['list','List'],['compact','Compact'],['cards','Cards']].map(([v,l])=>`<button class="btn btn-sm ${mode===v?'active':''}" onclick="App.setLibraryView('${v}')">${l}</button>`).join('')}</div>`;
  h=h.replace('<div class="section-label">OVERVIEW',controls+'<div class="section-label">OVERVIEW');h=h.replace('<div class="lib-toolbar">',view+'<div class="lib-toolbar">');return `<div class="library-view-${mode}">${h}</div>`;
};

/* Category maintenance now lives in Settings */
const v43SettingsBase=renderSettings;
renderSettings=function(){let html=v43SettingsBase();const maintenance=`<div class="section-label">CATEGORY MAINTENANCE</div><div class="card" style="margin-bottom:22px"><div style="display:flex;gap:8px;flex-wrap:wrap">${S.categories.map(c=>`<button class="btn btn-sm" onclick="App.clearCategoryLibrary('${c.id}')">Clear ${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</button>`).join('')}</div><div class="hint" style="margin-top:9px">Clears titles only from the chosen category. Consumption history stays intact and the change can be undone from Library History.</div></div>`;
  const c=S.settings.customTheme||{};const currentTheme=S.settings.theme||'dark';const platformMode=V55_PLATFORM_THEMES.includes(currentTheme);const mfOptions=V55_MEDIAFLOW_THEMES.map(t=>`<option value="${t}" ${currentTheme===t?'selected':''}>${V43_THEME_LABELS[t]}</option>`).join('');const pfOptions=V55_PLATFORM_THEMES.map(t=>`<option value="${t}" ${currentTheme===t?'selected':''}>${V43_THEME_LABELS[t]}</option>`).join('');const custom=`<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px"><div class="field"><label class="field-label">Theme collection</label><select onchange="App.setThemeCollection(this.value)"><option value="mediaflow" ${!platformMode?'selected':''}>MediaFlow Themes</option><option value="platform" ${platformMode?'selected':''}>Platform Themes</option></select><small class="hint">Switch collections first. The selected collection gets its own theme dropdown.</small></div>${!platformMode?`<div class="field"><label class="field-label">MediaFlow theme</label><select onchange="App.setTheme(this.value)">${mfOptions}</select></div>`:`<div class="field"><label class="field-label">Platform theme</label><select onchange="App.setTheme(this.value)">${pfOptions}</select></div>`}<div class="v43-custom-grid">${[['bg','Background'],['panel','Panels'],['raised','Raised surfaces'],['border','Borders'],['text','Text'],['muted','Muted text'],['accent','Accent']].map(([k,l])=>`<div class="field v43-color-field"><label class="field-label">${l}</label><input type="color" value="${escapeHtml(c[k]||'#111111')}" onchange="App.setCustomTheme('${k}',this.value)"></div>`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" onclick="App.setTheme('custom')">Use custom theme</button><button class="btn btn-ghost" onclick="App.resetCustomTheme()">Reset custom colors</button></div></div>`;
  /* Remove the old 3-theme appearance card to avoid duplicate controls. */
  html=html.replace(/<div class="section-label settings-section-head"><span>APPEARANCE<\/span>[\s\S]*?<\/div><\/div>(?=<div class="section-label settings-section-head"><span>AUTOMATIC BACKUPS)/,'');
  const data=html.indexOf('<div class="section-label">DATA</div>');return data>=0?html.slice(0,data)+custom+maintenance+html.slice(data):html+custom+maintenance;
};

/* Richer activity entries. Existing entries remain readable. */
function v43DiffSnapshot(before,after){const b=new Map((before?.library||[]).map(i=>[i.id,i])),a=new Map((after?.library||[]).map(i=>[i.id,i]));const ids=new Set([...b.keys(),...a.keys()]),changes=[];for(const id of ids){const x=b.get(id),y=a.get(id);if(!x&&y)changes.push({id,title:cleanTitle(y.title),kind:'added'});else if(x&&!y)changes.push({id,title:cleanTitle(x.title),kind:'deleted'});else if(x&&y){const fields=[];for(const k of ['title','categoryId','status','priority','progress','total','rating'])if(JSON.stringify(x[k]??null)!==JSON.stringify(y[k]??null))fields.push(`${k}: ${x[k]??'—'} → ${y[k]??'—'}`);if(fields.length)changes.push({id,title:cleanTitle(y.title),kind:'changed',fields});}if(changes.length>=25)break;}return changes;}
function v50SnapshotXP(x){
  if(!x)return null;
  const sessions=Array.isArray(x.sessions)?x.sessions:[];
  const ledger=x.xpLedger||{};
  const sum=o=>Object.values(o||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const sessionXP=sessions.reduce((a,s)=>{
    if(!s||s.status==='skipped')return a;
    if(Number.isFinite(Number(s.xp)))return a+Math.max(0,Number(s.xp));
    const cat=getCategory(s.categoryId);
    return a+calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,'healthy').xp;
  },0);
  return sessionXP+sum(ledger.libraryAdditions)+sum(ledger.libraryEdits)+sum(ledger.manualCovers);
}
mfActivity=function(action,detail){
  S.activityLog=S.activityLog||[];
  const tx=(S.undoStack||[])[S.undoStack.length-1];
  const changes=tx?.before&&tx?.after?v43DiffSnapshot(tx.before,tx.after):[];
  let xpEarned=0;
  if(tx?.before&&tx?.after){
    const beforeXP=v50SnapshotXP(tx.before), afterXP=v50SnapshotXP(tx.after);
    if(beforeXP!=null&&afterXP!=null)xpEarned=Math.max(0,Math.round(afterXP-beforeXP));
  }
  const exactIds=[...new Set(changes.map(x=>x.id).filter(Boolean))];
  const titleSnapshot=exactIds.length===1?cleanTitle(S.library.find(i=>i.id===exactIds[0])?.title||changes[0]?.title||detail||''):'';
  S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:String(action||'Change'),detail:String(detail||''),changes,titleIds:exactIds,titleSnapshot,xpEarned});
  if(S.activityLog.length>1000)S.activityLog.length=1000;
};
function v50NormalizeHistoryTitle(v){
  return cleanTitle(String(v||'')).trim().toLocaleLowerCase();
}
function v50LibraryLookup(){
  const byId=new Map(), byTitle=new Map();
  for(const item of (S.library||[])){
    if(!item?.id)continue;
    byId.set(item.id,item);
    const key=v50NormalizeHistoryTitle(item.title);
    if(!key)continue;
    const list=byTitle.get(key)||[];
    list.push(item.id);
    byTitle.set(key,list);
  }
  return {byId,byTitle};
}
function v50LegacyHistoryTitle(x){
  const candidates=[];
  if(x?.titleSnapshot)candidates.push(x.titleSnapshot);
  if(x?.title)candidates.push(x.title);
  for(const c of (x?.changes||[])) if(c?.title)candidates.push(c.title);
  // Old transactions commonly stored the affected title directly as detail.
  if(x?.detail)candidates.push(x.detail);
  return [...new Set(candidates.map(v=>String(v||'').trim()).filter(Boolean))];
}
function v43FindLogTitles(x,lookup){
  lookup=lookup||v50LibraryLookup();
  // Modern records: IDs are authoritative. Never fall back to text if an ID exists.
  const stored=[...(x?.titleIds||[]),...(x?.libraryIds||[])].filter(Boolean);
  if(stored.length)return [...new Set(stored)].filter(id=>lookup.byId.has(id));

  // Legacy records: exact normalized title only, and only when unique.
  // No includes()/substring matching: "Ai" can never match "Sendokai Champions".
  const hits=[];
  for(const title of v50LegacyHistoryTitle(x)){
    const ids=lookup.byTitle.get(v50NormalizeHistoryTitle(title))||[];
    if(ids.length===1)hits.push(ids[0]);
  }
  return [...new Set(hits)];
}
function v50MigrateLibraryHistoryLinks(){
  if(!Array.isArray(S.activityLog)||!S.activityLog.length)return {linked:0,ambiguous:0};
  const lookup=v50LibraryLookup();
  let linked=0, ambiguous=0;
  for(const x of S.activityLog){
    if(!x||typeof x!=='object')continue;
    const existing=[...(x.titleIds||[]),...(x.libraryIds||[])].filter(id=>lookup.byId.has(id));
    if(existing.length){
      x.titleIds=[...new Set(existing)];
      if(!x.titleSnapshot && x.titleIds.length===1)x.titleSnapshot=cleanTitle(lookup.byId.get(x.titleIds[0])?.title||'');
      continue;
    }
    const matches=[];
    for(const title of v50LegacyHistoryTitle(x)){
      const ids=lookup.byTitle.get(v50NormalizeHistoryTitle(title))||[];
      if(ids.length===1)matches.push(ids[0]);
      else if(ids.length>1)ambiguous++;
    }
    const unique=[...new Set(matches)];
    if(unique.length===1){
      x.titleIds=unique;
      x.titleSnapshot=cleanTitle(lookup.byId.get(unique[0])?.title||'');
      x.linkMigratedV50=true;
      linked++;
    }
  }
  S.migrations=S.migrations||{};
  S.migrations.libraryHistoryExactIdsV50={done:true,at:Date.now(),linked};
  return {linked,ambiguous};
}
function v43ActivityHtml(){
  const lookup=v50LibraryLookup();
  const rows=(S.activityLog||[]).slice(0,1000).map(x=>{
    const ids=v43FindLogTitles(x,lookup);
    const change=(x.changes||[]).map(c=>`<div>• <b>${escapeHtml(c.title)}</b> ${escapeHtml(c.kind)}${c.fields?.length?`<div>${c.fields.map(escapeHtml).join('<br>')}</div>`:''}</div>`).join('');
    const earned=Math.max(0,Number(x.xpEarned)||0);
    const xp=earned?`<div class="mf-activity-xp" title="XP earned by this Library action"><strong>+${earned.toLocaleString()} XP</strong> earned</div>`:'';
    return `<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="v43-log-detail">${escapeHtml(x.detail)}</div>`:''}${xp}${change?`<div class="v43-log-detail">${change}</div>`:''}${ids.length?`<div class="v43-log-actions">${ids.slice(0,5).map(id=>{const i=S.library.find(z=>z.id===id);return i?`<button class="btn btn-sm btn-ghost" onclick="App.openLibraryModal('${id}')">Edit ${escapeHtml(cleanTitle(i.title))}</button>`:''}).join('')}</div>`:''}</div></div>`;
  }).join('')||'<div class="empty-state">No library activity recorded yet.</div>';
  return `<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>`;
}
mfActivityHtml=v43ActivityHtml;

/* Log imports and exports that are not already represented by a library transaction. */
function v43LogIO(action,detail){mfActivity(action,detail);saveState();}
for(const name of ['exportExchange','exportJSON','exportHistoryCSV']){const old=App[name];if(old)App[name]=function(...args){v43LogIO('Export',name.replace(/^export/,'')+(args[0]?` · ${args[0]}`:''));return old.apply(App,args);};}
for(const name of ['confirmPendingImport','syncMAL']){const old=App[name];if(old)App[name]=function(...args){v43LogIO('Import',name==='syncMAL'?'MyAnimeList sync':'Confirmed external/backup import');return old.apply(App,args);};}

/* Today's Balance mirrors the same dynamic amount engine used by recommendations. */
function v43BalanceGuidance(cat,status){const a=suggestedAmount(cat),mid=Math.max(1,Math.round((a.low+a.high)/2)),mins=Math.max(0,Math.round(mid*(Number(cat.minutesPerUnit)||0))),base=Math.max(1,Number(cat.target)||1),baseMin=Math.round(base*(Number(cat.minutesPerUnit)||0));if(status==='overused'||a.direction==='reduced'){const less=Math.max(0,base-mid),lessMin=Math.max(0,baseMin-mins);return `<b>Cool-down guidance:</b> if this rotates now, about ${mid} ${unitLabel(cat.unit,mid)} (~${mins} min), ${less} ${unitLabel(cat.unit,less)} / ~${lessMin} min less than the normal target.`;}if(status==='neglected'||status==='due'||a.direction==='increased'){return `<b>Catch-up guidance:</b> about ${a.low===a.high?a.low:`${a.low}–${a.high}`} ${unitLabel(cat.unit,mid)} (~${Math.round(a.low*(cat.minutesPerUnit||0))}${a.low===a.high?'':`–${Math.round(a.high*(cat.minutesPerUnit||0))}`} min) if selected now. This grows or shrinks with the scheduler's live balance calculation.`;}return `<b>Balanced guidance:</b> about ${a.low===a.high?a.low:`${a.low}–${a.high}`} ${unitLabel(cat.unit,mid)} (~${Math.round(a.low*(cat.minutesPerUnit||0))}${a.low===a.high?'':`–${Math.round(a.high*(cat.minutesPerUnit||0))}`} min) if selected now.`;}
const v43DashboardBase=renderDashboard;
renderDashboard=function(){let h=v43DashboardBase();for(const cat of (typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled))){const status=categoryStatus(cat),needle=`${escapeHtml(categoryStatusActionSummary(cat,status,overallCategoryStatus(cat)))}</div>`;const repl=`${escapeHtml(categoryStatusActionSummary(cat,status,overallCategoryStatus(cat)))}</div><div class="v43-balance-guidance">${v43BalanceGuidance(cat,status)}</div>`;h=h.replace(needle,repl);}return h;};

Object.assign(App,{selectAllLibrary:v43SelectAll,deselectAllLibrary:v43DeselectAll,setLibraryView:v43SetLibraryView,setCustomTheme:v43SetCustomTheme,resetCustomTheme:v43ResetCustomTheme});
