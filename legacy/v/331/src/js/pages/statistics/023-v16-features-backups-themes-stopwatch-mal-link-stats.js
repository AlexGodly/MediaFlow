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

function renderProfileStatHero(){const url=getAvatarUrl();return `<div class="profile-stat-hero"><div class="profile-stat-avatar">${url?`<img src="${escapeHtml(url)}" alt="Profile picture">`:escapeHtml(profileInitials())}</div><div><div style="font-family:var(--font-display);font-size:30px;font-weight:600;">${escapeHtml(getDisplayName())}</div><div style="color:var(--text-dim);font-size:13px;margin-top:5px;">${escapeHtml(AUTH_USER?.email||'')}</div><div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;"><span class="pill">${S.library.length} titles</span><span class="pill">${v331LogicalSessionCount(S.sessions)} sessions</span><span class="pill">${fmtMinutes(totalsForSessions(S.sessions).minutes)} consumed</span></div></div></div>`;}
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
 const avgDaily7=Math.round(last7.reduce((a,d)=>a+d.minutes,0)/7), avgSession=v331LogicalSessionCount(S.sessions)?Math.round(life.minutes/v331LogicalSessionCount(S.sessions)):0;
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
 ${(()=>{const r=v81RepeatTotals();const units=r.episodes+r.chapters+r.issues+r.movies;if(!units)return '';return `<div class="card" style="margin-bottom:24px"><div class="section-label">↻ REPEAT CONSUMPTION</div><div class="record-list"><div class="record-row"><span class="k">Repeat sessions</span><span class="v">${r.sessions.toLocaleString()}</span></div><div class="record-row"><span class="k">Episodes rewatched</span><span class="v">${r.episodes.toLocaleString()}</span></div><div class="record-row"><span class="k">Chapters reread</span><span class="v">${r.chapters.toLocaleString()}</span></div><div class="record-row"><span class="k">Issues reread</span><span class="v">${r.issues.toLocaleString()}</span></div><div class="record-row"><span class="k">Movies rewatched</span><span class="v">${r.movies.toLocaleString()}</span></div><div class="record-row"><span class="k">Repeat time</span><span class="v">${fmtMinutes(r.minutes)}</span></div></div></div>`;})()}<div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIBRARY HEALTH</div><div class="record-list"><div class="record-row"><span class="k">Library titles</span><span class="v">${S.library.length}</span></div><div class="record-row"><span class="k">Watching titles</span><span class="v">${S.library.filter(i=>i.status==='active').length}</span></div><div class="record-row"><span class="k">Completed titles</span><span class="v">${S.library.filter(i=>i.status==='completed').length}</span></div><div class="record-row"><span class="k">Total units logged</span><span class="v">${totalUnits.toLocaleString()}</span></div></div></div><div class="card"><div class="section-label">ADVANCED METRICS</div><div class="record-list"><div class="record-row"><span class="k">Average daily minutes (7d)</span><span class="v">${fmtMinutes(avgDaily7)}</span></div><div class="record-row"><span class="k">Average session</span><span class="v">${fmtMinutes(avgSession)}</span></div><div class="record-row"><span class="k">Most active day</span><span class="v">${escapeHtml(mostActiveDayLabel)}</span></div><div class="record-row"><span class="k">Peak day minutes</span><span class="v">${fmtMinutes(longestDay)}</span></div><div class="record-row"><span class="k">Lifetime sessions</span><span class="v">${v331LogicalSessionCount(S.sessions)}</span></div></div></div></div>`;
}
renderStats=renderStatsV14;


