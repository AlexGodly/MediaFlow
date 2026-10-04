/* MediaFlow v201 source fragment
 * Public App actions and event surface
 * Original HTML lines 10165-11192.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   APP — public actions (bound to window)

   ============================================================ */

const App = {
  v72MoveCategory,
  v73CategoryDragStart,
  v69RepairAllCompleted,
  v69RepairSelectedCompleted,
  v69ToggleLibraryCategory,
  v69ClearLibraryCategories,
  v69SetLibrarySort,

  setView(v){ S.view=v; render(); },
  mobileNav, toggleMobileMore,
  openProfile(){ S.profileReturnView=S.view==='profile'?'dashboard':S.view; S.view='profile'; render(); },
  backFromProfile(){ S.view=S.profileReturnView||'dashboard'; render(); },

  startSession, endSession, rotateTask, skipTask, openLogForm, cancelLogForm, submitLog,
  addBatchRow, removeBatchRow, updateBatchRow, updateBatchSearch, renderBatchSuggestions, selectBatchTitle, clearBatchLog, submitBatchLog,

  toggleReasonDetail(){ S.showReasonDetail=!S.showReasonDetail; render(); },

  updateLogDraft(k,v){ S.logDraft[k]=v; if(k==='amount'||k==='minutes') refreshXPPreview(); },

  updateEntryDraft(k,v){ S.entryDraft[k]=v; if(k==='title') renderLogSuggestions(); },

  selectLogTitle(id){
    const item=S.library.find(i=>i.id===id);
    if(!item || item.status==='dropped') return;
    S.entryDraft.title=cleanTitle(item.title);
    S.entryDraft.libraryId=item.id;
    render();
  },

  addLogEntry(){

    const title=(S.entryDraft.title||'').trim();
    if(!title) return;

    const qty=Math.max(1,Number(S.entryDraft.qty)||1);
    const cat=getCategory(S.currentTask.categoryId);
    let match=S.entryDraft.libraryId ? S.library.find(i=>i.id===S.entryDraft.libraryId) : null;
    if(!match) match=findLibraryMatch(cat.id,title);
    // If the title exists in another category, use that Library entry instead
    // of creating a duplicate. This is especially important for Manga, TV,
    // Movies, Manhwa, Comics, and custom categories.
    if(!match){
      const normalized=cleanTitle(title).toLowerCase();
      match=S.library.find(i=>i && i.status!=='dropped' && cleanTitle(i.title).toLowerCase()===normalized) || null;
    }
    let isNew=false;

    if(!match){
      match={
        id:uid(),
        title,
        categoryId:cat.id,
        progress:0,
        total:null,
        status:'active',
        priority:'medium',
        estimatedMinutes:null,
        tags:['manual'],
        source:'manual', createdAt:Date.now(), completedAt:null
      };
      S.library.push(match);
      isNew=true;
      awardLibraryAdditionXP(match.id);
      persistLibrary();
    }

    S.logDraft.entries=S.logDraft.entries||[];
    const isRepeat=match.status==='completed' || (Number(match.total)>0 && Number(match.progress)>=Number(match.total));
    S.logDraft.entries.push({title,qty,libraryId:match.id,isNew,isRepeat});
    S.entryDraft={title:'',qty:1,libraryId:null};
    render();

  },

  removeLogEntry(idx){

    S.logDraft.entries.splice(idx,1); render();

  },

  updateLogEntryDetail(idx,key,value){

    const entry=(S.logDraft.entries||[])[idx];
    if(!entry||!entry.libraryId) return;

    const item=S.library.find(i=>i.id===entry.libraryId);
    if(!item) return;

    if(key==='title'){
      const title=String(value||'').trim();
      if(title){ item.title=title; entry.title=title; }
    }else if(key==='progress'){
      item.progress=Math.max(0,Number(value)||0);
    }else if(key==='total'){
      item.total=value===''?null:Math.max(0,Number(value)||0);
    }else if(key==='status'){
      item.status=value;
    }else if(key==='priority'){
      item.priority=value;
    }else if(key==='estimatedMinutes'){
      item.estimatedMinutes=value===''?null:Math.max(0,Number(value)||0);
    }else if(key==='tags'){
      item.tags=String(value||'').split(',').map(t=>t.trim()).filter(Boolean);
    }

    normalizeSeasonalLibraryItems();
    persistLibrary();

  },

  syncAmountFromEntries(){
    const entries=S.logDraft.entries||[];
    const amount=entriesTotal(entries);
    S.logDraft.amount=amount;
    const cat=getCategory(S.logDraft.categoryId||S.currentTask?.categoryId||'');
    if(cat) S.logDraft.minutes=Math.round(amount*(Number(cat.minutesPerUnit)||0));
    render();
  },

  toggleUpdateLibrary(v){ S.logDraft.updateLibrary = v; },

  setHistFilter(k,v){ S.histFilters[k]=v; S.histPage=0; render(); },

  setHistPage(page){ S.histPage=Math.max(0, Number(page)||0); render(); },

  searchLibrary(v){ v53DebouncedLibrarySearch(v); },
  setLibFilter(k,v,live){
    S.histFilters[k]=v;
    S.libPage=0;
    render();
  },
  setLibPage(page){
    S.libPage=Math.max(0, Number(page)||0);
    render();
    const anchor=document.querySelector('.lib-search');
    if(anchor && document.activeElement!==anchor){}
  },

  setIntensity(k){

    const p = INTENSITY_PRESETS[k];

    S.settings.intensity=k; S.settings.tasksPerDay=p.tasksPerDay; S.settings.dailyMinutes=p.dailyMinutes;

    persistSettings(); render();

  },

  toggleExactTitleRecommendations(){
    S.settings.exactTitleRecommendations=!S.settings.exactTitleRecommendations;
    if(S.sessionActive && S.currentTask){
      const cat=getCategory(S.currentTask.categoryId);
      const picked=S.settings.exactTitleRecommendations ? pickLibraryTitle(cat) : null;
      S.currentTask.libraryId=picked?picked.id:null;
      S.currentTask.title=picked?cleanTitle(picked.title):null;
      persistTask();
    }
    persistSettings(); render();
  },

  resetSettingsSection(section){ resetSettingsSection(section); },
  resetAllSettings(){ resetAllSettings(); },

  updateSetting(key, val){

    const num = Number(val);

    S.settings[key] = isNaN(num) ? val : num;

    persistSettings(); render();

  },

  updateLeveling(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    if(key==='enabled') S.settings.leveling.enabled=!!val;
    else S.settings.leveling[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },
  updateLevelingUnit(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    S.settings.leveling.unitXP=S.settings.leveling.unitXP||{};
    S.settings.leveling.unitXP[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },
  updateLevelingRotation(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    S.settings.leveling.rotationMultiplier=S.settings.leveling.rotationMultiplier||{};
    S.settings.leveling.rotationMultiplier[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },

  toggleCategory(id){

    const c = S.categories.find(c=>c.id===id); if(!c) return;

    c.enabled = !c.enabled; persistCategories(); render();

  },

  openCategoryModal(id){

    const data = id ? Object.assign({}, getCategory(id)) : {name:'', icon:'✨', type:'video', unit:'episodes', target:5, weight:3, minutesPerUnit:20, color:COLOR_CHOICES[0], enabled:true, seasonal:false};

    S.modal = {type:'category', data}; render();

  },

  pickIcon(ic){
    const input=document.getElementById('m-icon'); if(input) input.value=ic;
    if(S.modal?.type==='category') S.modal.data.icon=ic;
    document.querySelectorAll('#modal-root [data-icon-swatch]').forEach(el=>{
      el.style.borderColor=(el.textContent.trim()===ic)?'var(--flow)':'var(--border-soft)';
    });
  },

  pickColor(c){
    const input=document.getElementById('m-color'); if(input) input.value=c;
    if(S.modal?.type==='category') S.modal.data.color=c;
    document.querySelectorAll('#modal-root [data-color-swatch]').forEach(el=>{
      el.style.borderColor=(el.style.background===c || el.style.backgroundColor===c)?'#fff':'transparent';
    });
  },

  saveCategoryModal(id,button){

    // v77: guard against accidental double submission while the cloud save starts.
    if(button?.dataset?.saving==='1') return;
    if(button){button.dataset.saving='1';button.disabled=true;}
    const data = {

      id: id || uid(),

      name: document.getElementById('m-name').value.trim() || 'Untitled category',

      icon: document.getElementById('m-icon').value || '✨',

      type: document.getElementById('m-type').value,

      unit: document.getElementById('m-unit').value,

      target: Math.max(1, Number(document.getElementById('m-target').value)||1),

      weight: clamp(Number(document.getElementById('m-weight').value)||3,1,5),

      minutesPerUnit: Math.max(1, Number(document.getElementById('m-mpu').value)||20),

      seasonal: document.getElementById('m-seasonal').checked,

      color: document.getElementById('m-color').value,

      enabled: document.getElementById('m-enabled').checked,

      custom: true,

    };

    const idx = S.categories.findIndex(c=>c.id===id);

    if(idx>=0) S.categories[idx] = Object.assign({}, S.categories[idx], data);

    else S.categories.push(data);

    persistCategories(); S.modal=null; render();

  },

  deleteCategory(id){
    const c=S.categories.find(c=>c.id===id); if(!c) return;
    // v79: open the MediaFlow confirmation directly in the DOM. Do not use browser confirm().
    const existing=document.getElementById('modal-root'); if(existing) existing.remove();
    const wrap=document.createElement('div');
    wrap.id='modal-root';
    wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${categoryDeleteModalHtml({id:c.id,name:c.name,icon:c.icon,iconUrl:c.iconUrl||''})}</div></div>`;
    document.body.appendChild(wrap);
  },

  async confirmDeleteCategory(id,button){
    if(button?.dataset?.deleting==='1') return;
    if(button){button.dataset.deleting='1';button.disabled=true;}
    const c=S.categories.find(c=>c.id===id);
    if(!c){S.modal=null;render();return;}
    S.categories=S.categories.filter(c=>c.id!==id);
    if(Array.isArray(S.categoryOrder)) S.categoryOrder=S.categoryOrder.filter(cid=>cid!==id);
    S.modal=null;
    await persistCategories();
    render();
    showToast(`${c.name} deleted`);
  },

  openLibraryModal(id){

    const data = id ? Object.assign({}, S.library.find(i=>i.id===id)) : {categoryId:S.categories[0]?.id, progress:0, status:'planned', priority:'medium', tags:[]};

    S.modal = {type:'library', data}; render();

  },

  saveLibraryModal(id){

    const tagsRaw = document.getElementById('l-tags').value;

    const data = {

      id: id || uid(),

      title: cleanTitle(document.getElementById('l-title').value) || 'Untitled',

      categoryId: document.getElementById('l-category').value,

      progress: Math.max(0, Number(document.getElementById('l-progress').value)||0),

      total: document.getElementById('l-total').value ? Math.max(0, Number(document.getElementById('l-total').value)) : null,

      status: document.getElementById('l-status').value,

      priority: document.getElementById('l-priority').value,

      estimatedMinutes: document.getElementById('l-est').value ? Number(document.getElementById('l-est').value) : null,

      tags: tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
      createdAt: id ? (S.library.find(i=>i.id===id)?.createdAt||Date.now()) : Date.now(),
      completedAt: id ? (S.library.find(i=>i.id===id)?.completedAt||null) : null,

    };

    const existingBefore = id ? S.library.find(i=>i.id===id) : null;
    const idx = S.library.findIndex(i=>i.id===id);

    if(data.status==='completed' && !data.completedAt) data.completedAt=Date.now();
    if(data.status==='completed'){ S.completionTimeline=S.completionTimeline||[]; if(!S.completionTimeline.some(x=>x.libraryId===data.id)){ S.completionTimeline.push({libraryId:data.id,title:data.title,categoryId:data.categoryId,completedAt:data.completedAt}); } }
    if(idx>=0) S.library[idx] = data; else { S.library.push(data); awardLibraryAdditionXP(data.id); }

    // Completed seasonal titles are always normalized into the Anime Backlog.
    normalizeSeasonalLibraryItems();
    persistLibrary(); S.modal=null; render();

  },

  deleteLibraryItem(id){
    const item=S.library.find(i=>i && i.id===id);
    if(!item) return;
    S.modal={type:'libraryDelete', data:{id:item.id, title:cleanTitle(item.title)||'this title'}};
    render();
  },

  async confirmDeleteLibrary(id){
    const index=S.library.findIndex(i=>i && i.id===id);
    if(index<0){ S.modal=null; render(); return; }

    S.library.splice(index,1);
    if(S.modal && S.modal.type==='libraryDelete') S.modal=null;

    await persistLibrary();

    const maxPage=Math.max(0,Math.ceil(S.library.length/50)-1);
    S.libPage=clamp(S.libPage||0,0,maxPage);
    render();
    showToast('Library title deleted');
  },

  closeModal(){ S.modal=null; render(); },

  openSessionModal(id){

    const sess = S.sessions.find(s=>s.id===id); if(!sess) return;

    S.modal = {type:'session', data: Object.assign({}, sess)}; render();

  },

  saveSessionModal(id){

    const idx = S.sessions.findIndex(s=>s.id===id); if(idx<0) return;

    const orig = S.sessions[idx];

    const updated = Object.assign({}, orig, {

      categoryId: document.getElementById('s-category').value,

      date: document.getElementById('s-date').value.trim() || orig.date,

      status: document.getElementById('s-status').value,

      targetAmount: Math.max(0, Number(document.getElementById('s-target').value)||0),

      actualAmount: Math.max(0, Number(document.getElementById('s-actual').value)||0),

      minutes: Math.max(0, Number(document.getElementById('s-minutes').value)||0),

      note: document.getElementById('s-note').value.trim(),

    });

    updated.unit = getCategory(updated.categoryId).unit;
    const editCat=getCategory(updated.categoryId);
    const editHealth=categoryStatus(editCat).status;
    updated.healthStatus=editHealth;
    updated.xp=calculateConsumptionXP(editCat,updated.actualAmount,updated.minutes,editHealth).xp;

    S.sessions[idx] = updated;

    persistSessions(); S.modal=null; render();

  },

  deleteSessionFromModal(id){

    if(!confirm('Delete this history entry? The scheduler will recalculate as if it never happened.')) return;

    S.sessions = S.sessions.filter(s=>s.id!==id);
    S.histPage=0;

    persistSessions(); S.modal=null; render();

  },

  deleteSession(id){

    if(!confirm('Delete this history entry?')) return;

    S.sessions = S.sessions.filter(s=>s.id!==id);
    S.histPage=0;

    persistSessions(); render();

  },

  undoLastEntry(){

    if(S.sessions.length===0) return;

    const latest = S.sessions.reduce((a,b)=> a.timestamp>b.timestamp ? a : b);

    if(!confirm(`Undo your last logged entry (${getCategory(latest.categoryId).name}, ${latest.actualAmount} ${latest.unit})? It will be removed from history and given back to you as the next task.`)) return;

    S.sessions = S.sessions.filter(s=>s.id!==latest.id);

    // hand it back as the current task so nothing is lost

    const cat = getCategory(latest.categoryId);

    const {low, high} = suggestedAmount(cat);

    S.currentTask = { id: uid(), categoryId: cat.id, low, high, targetMid: latest.targetAmount || cat.target, unit: cat.unit, createdAt: Date.now(), reasons: ['Restored from undo'] };

    S.sessionActive = true; S.logging = false;

    persistSessions(); persistTask(); render();

  },

  exportJSON(){
    showDataProgress('Exporting complete MediaFlow backup', 'Preparing all portable app data...', 15);
    setTimeout(()=>{
      try{
        const now=new Date();
        const pad=n=>String(n).padStart(2,'0');
        const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        // v98: snapshot() is MediaFlow's canonical persisted account state.
        // Export that complete portable state instead of a hand-picked subset.
        const payload=Object.assign({},snapshot(),{
          backupFormat:'MediaFlow_Full_Backup',
          backupVersion:98,
          exportedAt:now.toISOString()
        });
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
        updateDataProgress(70,'Creating complete backup download...');
        triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);
        finishDataProgress(true,'Export successful','Your complete MediaFlow backup was downloaded.');
      }catch(e){ console.error(e); finishDataProgress(false,'Export failed','MediaFlow could not create the backup file.'); }
    },40);
  },

  importJSON(file){
    if(!file) return;
    showDataProgress('Importing MediaFlow backup','Reading backup file...',10);
    const reader=new FileReader();
    reader.onprogress=e=>{ if(e.lengthComputable) updateDataProgress(Math.round((e.loaded/e.total)*60),'Reading backup...'); };
    reader.onload=async ()=>{
      try{
        const data=JSON.parse(reader.result);

        updateDataProgress(70,'Applying imported data...');
        if(data.categories) S.categories=data.categories;
        if(Array.isArray(data.categoryOrder)){
          S.categoryOrder=data.categoryOrder.slice();
          v74ApplyCategoryOrder(S.categoryOrder);
        }
        if(data.library) S.library=sanitizeLibrary(data.library);
        if(data.sessions) S.sessions=data.sessions;
        if(data.settings){
          S.settings=Object.assign({},DEFAULT_SETTINGS,data.settings);
          S.settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,data.settings?.backup||{});
          S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,data.settings?.leveling||{});
          S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,data.settings?.leveling?.unitXP||{});
          S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,data.settings?.leveling?.rotationMultiplier||{});
        }
        // v98 full-backup fields. Old backups remain compatible because each field is optional.
        if(Object.prototype.hasOwnProperty.call(data,'currentTask')) S.currentTask=data.currentTask||null;
        if(Object.prototype.hasOwnProperty.call(data,'sessionActive')) S.sessionActive=!!data.sessionActive;
        if(Object.prototype.hasOwnProperty.call(data,'profilePicture')) S.profilePicture=String(data.profilePicture||'').trim();
        if(data.stopwatch&&typeof data.stopwatch==='object') S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},data.stopwatch);
        if(data.malLink&&typeof data.malLink==='object') S.malLink=Object.assign({username:'',mode:'anime'},data.malLink);
        if(data.xpLedger&&typeof data.xpLedger==='object') S.xpLedger=Object.assign({libraryAdditions:{}},data.xpLedger);
        if(Array.isArray(data.completionTimeline)) S.completionTimeline=data.completionTimeline;
        if(Array.isArray(data.activityLog)) S.activityLog=data.activityLog.slice(0,1000);
        if(Object.prototype.hasOwnProperty.call(data,'orderPlan')) S.orderPlan=v138NormalizeOrderPlan(data.orderPlan,S.library,S.categories);
        if(data.migrations&&typeof data.migrations==='object') S.migrations=data.migrations;
        normalizeSeasonalLibraryItems();
        v53InvalidateLibraryCache();
        v53InvalidateSessionCache();
        await saveState();
        render();
        finishDataProgress(true,'Import successful','Your MediaFlow backup was imported successfully.');
      }catch(e){ console.error(e); finishDataProgress(false,'Import failed','Could not read that file. Make sure it is a valid MediaFlow JSON backup.'); }
    };
    reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.');
    reader.readAsText(file);
  },

  importMalXml(file){
    if(!file) return;

    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const text=reader.result||'';
        const isManga=/<manga(?:\s|>)/i.test(text);
        const tag=isManga?'manga':'anime';

        // Keep the low-memory streaming-style parser used by MediaFlow.
        const re=new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,'gi');
        const blocks=[];
        let m;
        while((m=re.exec(text))!==null) blocks.push(m[1]);

        if(blocks.length===0){
          finishImportProgress(false,'Import failed','No entries found. Make sure this is a MAL list export XML.');
          return;
        }

        const statusMap={
          'Watching':'active','Reading':'active','Completed':'completed',
          'On-Hold':'paused','Dropped':'dropped',
          'Plan to Watch':'planned','Plan to Read':'planned'
        };

        const getTag=(block,name)=>{
          const x=block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`,'i'));
          return x?cleanTitle(x[1]):'';
        };

        const parseMalDate=(raw)=>{
          raw=String(raw||'').trim().slice(0,10);
          if(!/^\d{4}-\d{2}-\d{2}$/.test(raw) || raw==='0000-00-00')return 0;
          return Number(v135ParseDateInput(raw))||0;
        };

        const animeFamily=new Set(['seasonal','backlog','animemovies']);
        const mangaFamily=new Set(['manga','manhwa']);

        // v136 indexes the existing Library once. This avoids repeatedly scanning
        // a very large Library for every MAL row.
        const byMalId=new Map();
        const byTitle=new Map();
        for(const item of (S.library||[])){
          const mal=String(item?.externalIds?.mal??'').trim();
          if(mal && !byMalId.has(mal))byMalId.set(mal,item);

          const key=cleanTitle(item?.title||'').toLowerCase();
          if(key){
            let arr=byTitle.get(key);
            if(!arr){arr=[];byTitle.set(key,arr);}
            arr.push(item);
          }
        }

        showImportProgress(`Importing MyAnimeList ${isManga?'manga':'anime'}`,blocks.length);

        let added=0,updated=0,skipped=0,startDates=0,finishDates=0;
        const touched=new Map();
        const BATCH=30;
        const SAVE_EVERY=210;

        for(let r=0;r<blocks.length;r+=BATCH){
          const endBatch=Math.min(r+BATCH,blocks.length);

          for(let j=r;j<endBatch;j++){
            const block=blocks[j];
            const title=getTag(block,isManga?'manga_title':'series_title');
            if(!title){skipped++;continue;}const malId=String(
              getTag(block,isManga?'manga_mangadb_id':'series_animedb_id') ||
              getTag(block,'series_animedb_id') ||
              getTag(block,'manga_mangadb_id') ||
              getTag(block,'series_mangadb_id') ||
              ''
            ).trim();

            const seriesType=getTag(block,isManga?'manga_type':'series_type').toLowerCase();
            const progress=Number(getTag(block,isManga?'my_read_chapters':'my_watched_episodes'))||0;
            const total=Number(getTag(block,isManga?'manga_chapters':'series_episodes') || getTag(block,isManga?'series_chapters':'series_episodes'))||null;
            const malStatus=getTag(block,'my_status');
            const status=statusMap[malStatus]||'planned';
            const score=Math.max(0,Math.min(10,Number(getTag(block,'my_score'))||0));

            const startedAt=parseMalDate(getTag(block,'my_start_date'));
            const finishAt=parseMalDate(getTag(block,'my_finish_date'));

            let categoryId=isManga?'manga':'backlog';
            if(isManga&&/manhwa|manhua/.test(seriesType))categoryId='manhwa';
            if(!isManga){
              if(seriesType==='movie')categoryId='animemovies';
              else if(seriesType==='tv'&&/currently airing/i.test(getTag(block,'series_status')))categoryId='seasonal';
            }
            if(!S.categories.find(c=>c.id===categoryId))categoryId=isManga?'manga':'backlog';

            let existing=malId?byMalId.get(malId)||null:null;

            if(!existing){
              const candidates=byTitle.get(title.toLowerCase())||[];
              existing=
                candidates.find(i=>String(i.categoryId||'')===String(categoryId)) ||
                candidates.find(i=>(isManga?mangaFamily:animeFamily).has(String(i.categoryId||''))) ||
                (candidates.length===1?candidates[0]:null);
            }

            if(existing){
              existing.title=title;
              existing.progress=progress;
              if(total)existing.total=total;
              existing.status=status;
              existing.source='mal';
              existing.tags=[...new Set([...(Array.isArray(existing.tags)?existing.tags:[]),'MAL'])];
              existing.externalIds=Object.assign({},existing.externalIds||{},malId?{mal:malId}:{});

              // Only move a title automatically inside the compatible MAL family.
              const family=isManga?mangaFamily:animeFamily;
              if(family.has(String(existing.categoryId||'')))existing.categoryId=categoryId;

              if(score>0)existing.rating=score;

              // Blank/0000 MAL dates never erase a real local Start/Finish Date.
              if(startedAt){
                existing.startedAt=startedAt;
                existing.startedAtSource='mal';
                startDates++;
              }

              if(status==='completed'){
                if(finishAt){
                  existing.completedAt=finishAt;
                  finishDates++;
                }
                // If MAL has no finish date, preserve an existing local completedAt.
              }else{
                // Keep MediaFlow's status/date invariant when MAL says the title is
                // not completed.
                existing.completedAt=null;
              }

              existing.modifiedAt=Date.now();
              touched.set(String(existing.id),existing);
              if(malId)byMalId.set(malId,existing);
              updated++;
            }else{
              const item={
                id:uid(),
                title,categoryId,progress,total,status,
                priority:'medium',
                estimatedMinutes:null,
                tags:['MAL'],
                source:'mal',
                rating:score>0?score:null,
                externalIds:malId?{mal:malId}:{},
                startedAt:startedAt||null,
                startedAtSource:startedAt?'mal':null,
                completedAt:status==='completed'?(finishAt||null):null,
                createdAt:Date.now(),
                modifiedAt:Date.now()
              };

              S.library.push(item);
              touched.set(String(item.id),item);
              if(startedAt)startDates++;
              if(item.completedAt)finishDates++;

              if(malId)byMalId.set(malId,item);
              const key=title.toLowerCase();
              let arr=byTitle.get(key);
              if(!arr){arr=[];byTitle.set(key,arr);}
              arr.push(item);
              added++;
            }
          }

          const done=endBatch;
          updateImportProgress(
            done,blocks.length,added,updated,skipped,
            `Processing ${done.toLocaleString()} of ${blocks.length.toLocaleString()} · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates`
          );

          // Keep periodic safety saves without doing an unnecessary final save
          // before the completion timeline has been synchronized.
          if(done%SAVE_EVERY===0 && done<blocks.length)await saveState();
          await yieldToBrowser();
        }

        // Update completion timeline in one pass instead of filtering it once per
        // imported title.
        const touchedIds=new Set(touched.keys());
        S.completionTimeline=(S.completionTimeline||[]).filter(
          x=>!touchedIds.has(String(x?.libraryId||''))
        );
        for(const item of touched.values()){
          if(item?.status==='completed' && Number(item.completedAt)>0){
            S.completionTimeline.push({
              libraryId:item.id,
              title:cleanTitle(item.title),
              categoryId:item.categoryId,
              completedAt:Number(item.completedAt)
            });
          }
        }

        normalizeSeasonalLibraryItems();
        await saveState();

        finishImportProgress(
          true,
          'MyAnimeList merge complete',
          `${added.toLocaleString()} added · ${updated.toLocaleString()} updated · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates${skipped?` · ${skipped.toLocaleString()} skipped`:''}.`
        );
        render();
      }catch(e){
        console.error('MAL import failed',e);
        closeImportProgress();
        alert("Couldn't parse that file as a MAL export XML.");
      }
    };
    reader.readAsText(file);
  },

  importCsv(file){
    if(!file) return;

    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const text=reader.result||'';
        if(!text.trim()){alert('That CSV looks empty.');return;}

        // Incremental CSV parser: it keeps its cursor and yields between batches,
        // so a very large file does not monopolize the main UI thread.
        const parser={i:0,row:[],field:'',inQuotes:false,done:false};
        const nextRows=(maxRows)=>{
          const out=[];
          while(parser.i<text.length&&out.length<maxRows){
            const c=text[parser.i++];
            if(parser.inQuotes){
              if(c==='"'){
                if(text[parser.i]==='"'){parser.field+='"';parser.i++;}
                else parser.inQuotes=false;
              }else parser.field+=c;
            }else{
              if(c==='"') parser.inQuotes=true;
              else if(c===','){parser.row.push(parser.field);parser.field='';}
              else if(c==='\\n'){
                parser.row.push(parser.field);parser.field='';
                if(parser.row.some(f=>f&&f.trim())) out.push(parser.row);
                parser.row=[];
              }else if(c==='\\r'){
                // Ignore CR. LF terminates the row.
              }else parser.field+=c;
            }
          }

          if(parser.i>=text.length&&!parser.done){
            if(parser.field.length||parser.row.length){
              parser.row.push(parser.field);
              if(parser.row.some(f=>f&&f.trim())) out.push(parser.row);
            }
            parser.row=[];parser.field='';parser.done=true;
          }
          return out;
        };

        const first=nextRows(1);
        if(first.length===0){alert('That CSV looks empty.');return;}

        const header=first[0].map(h=>h.trim().toLowerCase());
        const find=(...names)=>header.findIndex(h=>names.some(n=>h.includes(n)));
        const iTitle=find('title','name');
        const iProgress=find('progress','watched','read','chapters_read','episodes_watched');
        const iTotal=find('total','episodes','chapters');
        const iStatus=find('status');

        if(iTitle<0){alert('Could not find a "title" column in that CSV.');return;}

        // Newline count is an intentionally cheap estimate for the progress bar.
        const estimatedTotal=Math.max(1,(text.match(/\\n/g)||[]).length);
        showImportProgress('Importing CSV',estimatedTotal);

        let processed=0,added=0,updated=0,skipped=0;
        const BATCH=40;
        const SAVE_EVERY=200;

        while(!parser.done){
          const rows=nextRows(BATCH);
          if(rows.length===0){await yieldToBrowser();continue;}

          for(const row of rows){
            processed++;
            if(!row||!row[iTitle]){skipped++;continue;}

            const title=cleanTitle(row[iTitle]);
            if(!title){skipped++;continue;}

            const progress=iProgress>=0?Number(row[iProgress])||0:0;
            const total=iTotal>=0&&row[iTotal]?Number(row[iTotal])||null:null;
            const rawStatus=iStatus>=0?row[iStatus].trim().toLowerCase():'';
            const status=/complet/.test(rawStatus)?'completed':
              /watch|read|active|progress/.test(rawStatus)?'active':
              /hold|pause/.test(rawStatus)?'paused':
              /drop/.test(rawStatus)?'dropped':'planned';

            const categoryId=S.categories.find(c=>c.enabled)?.id||S.categories[0]?.id;
            if(!categoryId){skipped++;continue;}

            const existing=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase());
            if(existing){
              existing.progress=progress;
              if(total) existing.total=total;
              existing.status=status;
              existing.source='simkl';
              updated++;
            }else{
              S.library.push({
                id:uid(),title,categoryId,progress,total,status,
                priority:'medium',estimatedMinutes:null,tags:['imported'],source:'simkl'
              });
              added++;
            }
          }

          updateImportProgress(processed,estimatedTotal,added,updated,skipped,`Processing rows... ${processed.toLocaleString()} processed`);
          if(processed%SAVE_EVERY<BATCH) await saveState();
          await yieldToBrowser();
        }

        await saveState();
        finishImportProgress(true,`Import successful`,`Imported ${added} added, ${updated} updated${skipped?', '+skipped+' skipped':''}.`);
        render();
      }catch(e){
        console.error('CSV import failed',e);
        finishImportProgress(false,'Import failed',"Couldn't parse that CSV file.");
      }
    };
    reader.readAsText(file);
  },

  exportCSV(){

    const header = ['date','time','category','target','actual','unit','minutes','status','note'];

    const rows = S.sessions.slice().sort((a,b)=>a.timestamp-b.timestamp).map(s=>{

      const cat = getCategory(s.categoryId);

      const d = new Date(s.timestamp);

      return [s.date, d.toLocaleTimeString(), cat.name, s.targetAmount, s.actualAmount, s.unit, s.minutes, s.status, (s.note||'').replace(/,/g,';')];

    });

    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');

    triggerDownload(new Blob([csv],{type:'text/csv'}), `mediaflow-history-${todayISO()}.csv`);

  },

  resetAll(){

    if(!confirm('This deletes ALL MediaFlow data — categories, library, history, settings. This cannot be undone. Continue?')) return;

    S.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));

    S.library = []; S.sessions = []; S.settings = Object.assign({}, DEFAULT_SETTINGS);

    S.currentTask = null; S.sessionActive = false;

    persistCategories(); persistLibrary(); persistSessions(); persistSettings(); persistTask();

    render();

  },

};

window.App = App;

function parseCsvText(text){

  const rows = []; let row=[]; let field=''; let inQuotes=false;

  for(let i=0;i<text.length;i++){

    const c = text[i];

    if(inQuotes){

      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }

      else field+=c;

    } else {

      if(c==='"') inQuotes=true;

      else if(c===','){ row.push(field); field=''; }

      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }

      else if(c==='\r'){ /* skip */ }

      else field+=c;

    }

  }

  if(field.length || row.length){ row.push(field); rows.push(row); }

  return rows.filter(r=>r.some(f=>f&&f.trim()));

}


function showDataProgress(title, subtitle, pct){
  let el=document.getElementById('mediaflow-data-progress');
  if(!el){el=document.createElement('div');el.id='mediaflow-data-progress';document.body.appendChild(el);}
  el.className='import-overlay';
  el.innerHTML=`<div class="import-card"><div class="import-title" id="data-progress-title">${escapeHtml(title)}</div><div class="import-sub" id="data-progress-sub">${escapeHtml(subtitle||'Working...')}</div><div class="import-track"><div class="import-fill" id="data-progress-fill" style="width:${pct||0}%"></div></div><div class="import-meta"><span>MediaFlow data</span><span id="data-progress-pct">${pct||0}%</span></div></div>`;
}
function updateDataProgress(pct,subtitle){
  const p=Math.max(0,Math.min(100,Number(pct)||0));
  const fill=document.getElementById('data-progress-fill');if(fill)fill.style.width=p+'%';
  const pe=document.getElementById('data-progress-pct');if(pe)pe.textContent=p+'%';
  const sub=document.getElementById('data-progress-sub');if(sub&&subtitle)sub.textContent=subtitle;
}
function finishDataProgress(success,title,subtitle){
  const el=document.getElementById('mediaflow-data-progress');if(!el)return;
  const t=document.getElementById('data-progress-title');if(t)t.textContent=(success?'✓ ':'✕ ')+title;
  const sub=document.getElementById('data-progress-sub');if(sub)sub.textContent=subtitle||'';
  updateDataProgress(100,subtitle);
  setTimeout(()=>el.remove(),1200);
}
function closeDataProgress(){const el=document.getElementById('mediaflow-data-progress');if(el)el.remove();}

function showImportProgress(title, total){
  let el=document.getElementById('mediaflow-import-progress');
  if(!el){ el=document.createElement('div'); el.id='mediaflow-import-progress'; document.body.appendChild(el); }
  el.className='import-overlay';
  el.innerHTML=`
    <div class="import-card">
      <div class="import-title">${escapeHtml(title)}</div>
      <div class="import-sub" id="import-progress-sub">Reading your file without freezing the page...</div>
      <div class="import-track"><div class="import-fill" id="import-progress-fill"></div></div>
      <div class="import-meta"><span id="import-progress-count">0 / ${total.toLocaleString()}</span><span id="import-progress-pct">0%</span></div>
      <div class="import-stats">
        <div class="import-stat"><b id="import-added">0</b><span>Added</span></div>
        <div class="import-stat"><b id="import-updated">0</b><span>Updated</span></div>
        <div class="import-stat"><b id="import-skipped">0</b><span>Skipped</span></div>
      </div>
    </div>`;
}
function updateImportProgress(done,total,added,updated,skipped,phase){
  const d=Number.isFinite(Number(done))?Number(done):0;
  const t=Number.isFinite(Number(total))?Number(total):0;
  const aNum=Number.isFinite(Number(added))?Number(added):0;
  const uNum=Number.isFinite(Number(updated))?Number(updated):0;
  const sNum=Number.isFinite(Number(skipped))?Number(skipped):0;
  const pct=t>0?Math.min(100,Math.round(d/t*100)):0;
  const fill=document.getElementById('import-progress-fill'); if(fill) fill.style.width=pct+'%';
  const count=document.getElementById('import-progress-count'); if(count) count.textContent=t>0?`${d.toLocaleString()} / ${t.toLocaleString()}`:`${d.toLocaleString()} processed`;
  const pctEl=document.getElementById('import-progress-pct'); if(pctEl) pctEl.textContent=pct+'%';
  const sub=document.getElementById('import-progress-sub'); if(sub) sub.textContent=phase||'Importing...';
  const a=document.getElementById('import-added'); if(a) a.textContent=aNum.toLocaleString();
  const u=document.getElementById('import-updated'); if(u) u.textContent=uNum.toLocaleString();
  const s=document.getElementById('import-skipped'); if(s) s.textContent=sNum.toLocaleString();
}
function closeImportProgress(){
  const el=document.getElementById('mediaflow-import-progress'); if(el) el.remove();
}
function finishImportProgress(success,title,message){
  const el=document.getElementById('mediaflow-import-progress');
  if(!el) return;
  const sub=document.getElementById('import-progress-sub'); if(sub) sub.textContent=message||'';
  const pct=document.getElementById('import-progress-pct'); if(pct) pct.textContent='100%';
  const fill=document.getElementById('import-progress-fill'); if(fill) fill.style.width='100%';
  const heading=el.querySelector('.import-title'); if(heading) heading.textContent=(success?'✓ ':'✕ ')+title;
  setTimeout(()=>el.remove(),1200);
}
function yieldToBrowser(){
  return new Promise(resolve=>setTimeout(resolve,0));
}

function triggerDownload(blob, filename){

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename; document.body.appendChild(a); a.click();

  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200);

}
