/* ============================================================
   MediaFlow v169 — Advanced Import / Export — Media Services
   ============================================================ */

const V169_ADVANCED_IMPORT={
  service:'anilist',
  mode:'single',             // single | map
  categoryId:'',
  file:null,
  fileName:'',
  records:null,
  normalized:null,
  recordTypeKeys:null,
  types:[],
  mappings:{},
  excludedTypes:{},          // v170: source-type key -> true means skip this type entirely
  scanning:false,
  scanProgress:0,
  scanMessage:'',
  parseError:''
};

const V169_TYPE_KEYS=[
  'series_type','anime_type','manga_type','media_type','mediatype',
  'mediaType','title_type','show_type','movie_type','content_type',
  'contentType','type','kind','format','subtype','list_type',
  'listType','category','__group'
];

function v169CategoryOptions(selectedId){
  const rows=(S.categories||[]).filter(Boolean);
  return rows.map(c=>{
    const id=String(c.id||'');
    const icon=typeof v144CategoryIconText==='function'
      ?v144CategoryIconText(c)
      :String(c.icon||'');
    const label=`${icon?icon+' ':''}${String(c.name||id)}`.trim();
    return `<option value="${escapeHtml(id)}" ${String(selectedId)===id?'selected':''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function v169EnsureAdvancedCategory(){
  const valid=new Set((S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean));
  if(!valid.has(String(V169_ADVANCED_IMPORT.categoryId||''))){
    V169_ADVANCED_IMPORT.categoryId=String(
      (S.categories||[]).find(c=>c?.enabled!==false)?.id ||
      S.categories?.[0]?.id ||
      ''
    );
  }
  return V169_ADVANCED_IMPORT.categoryId;
}

function v169NormalizeSourceType(value){
  let s=String(value??'').trim();
  if(!s)return '';

  s=s.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();

  const upper=s.toUpperCase();
  const special={
    'TV':'TV',
    'OVA':'OVA',
    'ONA':'ONA',
    'AMV':'AMV'
  };
  if(special[upper])return special[upper];

  return s.replace(/\b\w/g,ch=>ch.toUpperCase());
}

function v169NestedTypeObjects(raw){
  if(!raw||typeof raw!=='object')return [];

  const out=[raw];
  for(const key of [
    'show','movie','media','anime','manga','item','node','entry',
    'book','series','title','details','metadata'
  ]){
    const value=raw[key];
    if(value&&typeof value==='object'&&!Array.isArray(value))out.push(value);
  }
  return out;
}

function v169ExtractSourceType(raw){
  const objects=v169NestedTypeObjects(raw);

  for(const key of V169_TYPE_KEYS){
    for(const obj of objects){
      const value=obj?.[key];
      if(
        value!=null &&
        typeof value!=='object' &&
        String(value).trim()
      ){
        const label=v169NormalizeSourceType(value);
        if(label)return label;
      }
    }
  }

  // Structural fallbacks cover services whose export distinguishes media by
  // nested object/group rather than an explicit "type" field.
  if(raw?.movie)return 'Movie';
  if(raw?.show)return 'Show';
  if(raw?.anime)return 'Anime';
  if(raw?.manga)return 'Manga';
  if(raw?.book)return 'Book';

  const group=v169NormalizeSourceType(raw?.__group);
  if(group)return group;

  return 'Unspecified';
}

function v169TypeKey(label){
  return String(label||'Unspecified')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g,' ');
}

async function v169Yield(){
  await new Promise(resolve=>{
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(()=>resolve());
    }else{
      setTimeout(resolve,0);
    }
  });
}

async function v169ParseAdvancedFile(file){
  if(!file)throw new Error('Choose an export file first.');

  const text=await file.text();
  const name=String(file.name||'').toLowerCase();

  let records;
  if(name.endsWith('.xml')||/^\s*</.test(text)){
    records=mfXmlRecords(text);
  }else if(
    name.endsWith('.csv') ||
    (!name.endsWith('.json') && text.includes(','))
  ){
    records=mfCsvParse(text);
  }else{
    records=mfFlattenJson(JSON.parse(text));
  }

  if(!Array.isArray(records)||!records.length){
    throw new Error('No recognizable media records were found.');
  }

  return records;
}

function v169DefaultMappedCategory(normalized){
  const requested=String(normalized?.categoryId||'');if(S.categories.some(c=>String(c?.id||'')===requested))return requested;

  return String(
    (S.categories||[]).find(c=>c?.enabled!==false)?.id ||
    S.categories?.[0]?.id ||
    ''
  );
}

async function v169ScanAdvancedFile({force=false}={}){
  const state=V169_ADVANCED_IMPORT;
  if(!state.file)return;
  if(state.scanning)return;

  state.scanning=true;
  state.scanProgress=0;
  state.scanMessage='Reading export file…';
  state.parseError='';
  render();

  try{
    const records=await v169ParseAdvancedFile(state.file);
    const normalized=new Array(records.length);
    const recordTypeKeys=new Array(records.length);
    const typeMap=new Map();
    const priorMappings=Object.assign({},state.mappings||{});
    const priorExcluded=Object.assign({},state.excludedTypes||{});

    state.scanMessage=`Scanning ${records.length.toLocaleString()} records…`;
    state.scanProgress=2;
    v169UpdateScanDOM();

    const service=String(state.service||'json');

    for(let i=0;i<records.length;i++){
      const raw=records[i];
      const rec=v158NormalizeRecord(raw,service);
      normalized[i]=rec;

      if(rec){
        const label=v169ExtractSourceType(raw);
        const key=v169TypeKey(label);
        recordTypeKeys[i]=key;

        let row=typeMap.get(key);
        if(!row){
          row={
            key,
            label,
            count:0,
            defaultCategoryId:v169DefaultMappedCategory(rec)
          };
          typeMap.set(key,row);
        }
        row.count++;
      }else{
        recordTypeKeys[i]='';
      }

      if(i && i%400===0){
        state.scanProgress=Math.min(
          96,
          Math.round(((i+1)/records.length)*96)
        );
        state.scanMessage=
          `Scanning ${Math.min(i+1,records.length).toLocaleString()} / ${records.length.toLocaleString()} records…`;
        v169UpdateScanDOM();
        await v169Yield();
      }
    }

    const types=[...typeMap.values()].sort((a,b)=>
      b.count-a.count || a.label.localeCompare(b.label)
    );

    const mappings={};
    for(const row of types){
      const previous=priorMappings[row.key];
      const previousValid=S.categories.some(
        c=>String(c?.id||'')===String(previous||'')
      );
      mappings[row.key]=previousValid
        ?String(previous)
        :String(row.defaultCategoryId||v169EnsureAdvancedCategory());
    }

    state.records=records;
    state.normalized=normalized;
    state.recordTypeKeys=recordTypeKeys;
    state.types=types;
    state.mappings=mappings;
    state.excludedTypes=Object.fromEntries(
      types
        .filter(row=>priorExcluded[row.key]===true)
        .map(row=>[row.key,true])
    );
    state.scanProgress=100;
    state.scanMessage=
      `${records.length.toLocaleString()} records scanned · ${types.length.toLocaleString()} source type${types.length===1?'':'s'} detected`;
    state.parseError='';
  }catch(e){
    console.error('MediaFlow v169 advanced scan failed',e);
    state.records=null;
    state.normalized=null;
    state.recordTypeKeys=null;
    state.types=[];
    state.scanProgress=0;
    state.parseError=String(e?.message||e);
    state.scanMessage='Scan failed.';
  }finally{
    state.scanning=false;
    render();
  }
}

function v169UpdateScanDOM(){
  const state=V169_ADVANCED_IMPORT;
  const bar=document.getElementById('v169-scan-fill');
  if(bar)bar.style.width=`${Math.max(0,Math.min(100,state.scanProgress||0))}%`;

  const msg=document.getElementById('v169-scan-message');
  if(msg)msg.textContent=state.scanMessage||'';
}

function v169SetAdvancedService(value){
  const state=V169_ADVANCED_IMPORT;
  state.service=String(value||'json');
  state.records=null;
  state.normalized=null;
  state.recordTypeKeys=null;
  state.types=[];
  state.mappings={};
  state.excludedTypes={};
  state.parseError='';

  if(state.mode==='map'&&state.file){
    v169ScanAdvancedFile({force:true});
  }else{
    render();
  }
}

function v169SetAdvancedMode(value){
  const state=V169_ADVANCED_IMPORT;
  state.mode=value==='map'?'map':'single';

  if(state.mode==='map'&&state.file&&!state.records){
    v169ScanAdvancedFile({force:true});
  }else{
    render();
  }
}

function v169SetAdvancedCategory(value){
  if(!S.categories.some(c=>String(c?.id||'')===String(value||'')))return;
  V169_ADVANCED_IMPORT.categoryId=String(value);
}

function v169SetTypeMapping(typeKey,value){
  if(!S.categories.some(c=>String(c?.id||'')===String(value||'')))return;
  V169_ADVANCED_IMPORT.mappings[String(typeKey||'')]=String(value);
}

function v170TypeExcluded(typeKey){
  return V169_ADVANCED_IMPORT.excludedTypes?.[String(typeKey||'')]===true;
}

function v170SetTypeExcluded(typeKey,checked){
  const key=String(typeKey||'');
  if(!key)return;

  V169_ADVANCED_IMPORT.excludedTypes=
    V169_ADVANCED_IMPORT.excludedTypes||{};

  if(checked)V169_ADVANCED_IMPORT.excludedTypes[key]=true;
  else delete V169_ADVANCED_IMPORT.excludedTypes[key];

  render();
}

function v169PickAdvancedImport(){
  document.getElementById('v169-advanced-file')?.click();
}

function v169PickAdvancedPreset(service){
  V169_ADVANCED_IMPORT.service=String(service||'json');
  render();
  setTimeout(()=>document.getElementById('v169-advanced-file')?.click(),0);
}

function v169PrepareAdvancedImport(file){
  if(!file)return;

  const state=V169_ADVANCED_IMPORT;
  state.file=file;
  state.fileName=String(file.name||'export file');
  state.records=null;
  state.normalized=null;
  state.recordTypeKeys=null;
  state.types=[];
  state.mappings={};
  state.excludedTypes={};
  state.parseError='';

  if(state.mode==='map'){
    v169ScanAdvancedFile({force:true});
  }else{
    render();
  }
}

function v169ClearAdvancedFile(){
  const state=V169_ADVANCED_IMPORT;
  state.file=null;
  state.fileName='';
  state.records=null;
  state.normalized=null;
  state.recordTypeKeys=null;
  state.types=[];
  state.mappings={};
  state.scanning=false;
  state.scanProgress=0;
  state.scanMessage='';
  state.parseError='';
  render();
}

function v169ResolveMappedCategory(index,rec){
  const state=V169_ADVANCED_IMPORT;

  if(state.mode==='single'){
    return v169EnsureAdvancedCategory();
  }

  const key=String(state.recordTypeKeys?.[index]||'');
  const mapped=String(state.mappings?.[key]||'');

  if(mapped && S.categories.some(c=>String(c?.id||'')===mapped)){
    return mapped;
  }

  return v169DefaultMappedCategory(rec);
}

async function v169MergeAdvancedRecords(records,normalized,service){
  const list=Array.isArray(records)?records:[];
  const norm=Array.isArray(normalized)?normalized:[];
  const index=v158ImportIndex();
  const touched=new Map();

  let added=0,updated=0,skipped=0,blocked=0,covers=0;
  let startDates=0,finishDates=0,timestamps=0;

  const total=Math.max(1,list.length);

  for(let i=0;i<list.length;i++){
    let rec=norm[i]||v158NormalizeRecord(list[i],service);

    if(!rec){
      skipped++;
      continue;
    }

    // v170: Option 2 can exclude a whole source type. Check this before title
    // matching, Library mutation, metadata merging, or category routing.
    const recordTypeKey=String(
      V169_ADVANCED_IMPORT.recordTypeKeys?.[i]||''
    );
    if(
      V169_ADVANCED_IMPORT.mode==='map' &&
      recordTypeKey &&
      v170TypeExcluded(recordTypeKey)
    ){
      blocked++;
      skipped++;

      if(i && i%100===0){
        updateImportProgress(
          i+1,total,added,updated,skipped,
          `${blocked.toLocaleString()} blocked by type · ${startDates.toLocaleString()} starts · ${finishDates.toLocaleString()} finishes · ${timestamps.toLocaleString()} timestamps · ${covers.toLocaleString()} cover URLs`
        );
        await v169Yield();
      }
      continue;
    }

    // Clone because cached scan normalization should remain immutable if the
    // user changes category mappings before importing.
    rec=Object.assign({},rec,{
      externalIds:Object.assign({},rec.externalIds||{})
    });

    const targetCategory=v169ResolveMappedCategory(i,rec);
    if(!targetCategory){
      skipped++;
      continue;
    }

    // Setting the target before matching helps disambiguate same-title records.
    rec.categoryId=targetCategory;

    const existing=v158FindImportItem(rec,index);
    const result=v158ApplyNormalizedRecord(
      rec,
      service,
      index,
      touched
    );

    let item=existing;
    if(!item)item=v158FindImportItem(rec,index);

    // Advanced import is deliberately authoritative about category assignment:
    // both new and already-matched titles move to the chosen/mapped category.
    if(item){
      item.categoryId=targetCategory;
      item.modifiedAt=Date.now();
      touched.set(String(item.id),item);
      index.add(item);
    }

    if(result==='added')added++;
    else if(result==='updated')updated++;
    else skipped++;

    if(rec.coverUrl)covers++;
    if(rec.startedAt)startDates++;
    if(rec.completedAt)finishDates++;
    if(rec.sourceTimestamp)timestamps++;

    if(i && i%100===0){
      updateImportProgress(
        i+1,total,added,updated,skipped,
        `${startDates.toLocaleString()} starts · ${finishDates.toLocaleString()} finishes · ${timestamps.toLocaleString()} timestamps · ${covers.toLocaleString()} cover URLs`
      );
      await v169Yield();
    }
  }

  v158SyncCompletionTimeline(touched);
  normalizeSeasonalLibraryItems();
  v53InvalidateLibraryCache();

  return {
    added,updated,skipped,blocked,covers,startDates,finishDates,timestamps,touched
  };
}

async function v169RunAdvancedImport(){
  const state=V169_ADVANCED_IMPORT;
  if(!state.file){
    showToast('Choose an export file first.');
    return;
  }

  if(state.scanning){
    showToast('Wait for the file scan to finish.');
    return;
  }

  if(state.mode==='single'&&!v169EnsureAdvancedCategory()){
    showToast('Choose a destination category first.');
    return;
  }

  try{
    let records=state.records;
    let normalized=state.normalized;

    if(!records){
      showImportProgress(
        `Advanced ${mfServiceName(state.service)} import`,
        1
      );
      updateImportProgress(
        0,1,0,0,0,
        'Reading and normalizing export file…'
      );

      records=await v169ParseAdvancedFile(state.file);
      normalized=new Array(records.length);

      for(let i=0;i<records.length;i++){
        normalized[i]=v158NormalizeRecord(
          records[i],
          state.service
        );
        if(i&&i%500===0)await v169Yield();
      }

      // Mapping mode requires type keys. This normally exists because file
      // selection scans automatically, but keep the importer safe if called
      // programmatically.
      if(state.mode==='map'){
        state.records=records;
        state.normalized=normalized;
        await v169ScanAdvancedFile({force:true});
        records=state.records;
        normalized=state.normalized;
      }
    }

    if(state.mode==='map'){
      if(!state.types.length){
        throw new Error(
          'No recognizable media types were found in this file.'
        );
      }

      const unmapped=state.types.filter(row=>
        !v170TypeExcluded(row.key) &&
        !S.categories.some(
          c=>String(c?.id||'')===String(state.mappings?.[row.key]||'')
        )
      );

      if(unmapped.length){
        throw new Error(
          `Choose a destination category for every detected type (${unmapped.length} remaining).`
        );
      }
    }

    showImportProgress(
      `Advanced ${mfServiceName(state.service)} import`,
      records.length
    );

    mfBegin(
      `Advanced ${mfServiceName(state.service)} import`,
      state.fileName||state.file.name||'export'
    );

    const result=await v169MergeAdvancedRecords(
      records,
      normalized,
      state.service
    );

    mfCommit(
      `Advanced ${mfServiceName(state.service)} import`,
      `${result.added} added, ${result.updated} updated · ${result.blocked||0} blocked by type · ${state.mode==='single'?'one destination category':`${state.types.length} detected source types`}`
    );

    // mfCommit already queued the one complete state save. Await it rather than
    // queueing another duplicate cloud write.
    await saveQueue;

    updateImportProgress(
      records.length,
      records.length,
      result.added,
      result.updated,
      result.skipped,
      'Advanced category assignment saved.'
    );

    finishImportProgress(
      true,
      'Advanced import complete',
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} timestamps · ${result.covers.toLocaleString()} cover URLs${result.skipped?` · ${result.skipped.toLocaleString()} skipped`:''}.`
    );

    // Preserve the selected service/mode/category, but release the potentially
    // large File/record arrays immediately after completion.
    state.file=null;
    state.fileName='';
    state.records=null;
    state.normalized=null;
    state.recordTypeKeys=null;
    state.types=[];
    state.mappings={};
    state.scanProgress=0;
    state.scanMessage='';
    state.parseError='';

    render();
  }catch(e){
    console.error('MediaFlow v169 advanced import failed',e);

    // Restore pre-import core state if this failed after mfBegin.
    const last=S.undoStack?.[S.undoStack.length-1];
    if(
      last &&
      !last.after &&
      String(last.action||'').startsWith('Advanced ')
    ){
      S.undoStack.pop();
      mfRestoreCore(last.before);
    }

    finishImportProgress(
      false,
      'Advanced import failed',
      String(e?.message||e)
    );
  }
}

function v169AdvancedExport(){
  const service=String(
    document.getElementById('v169-advanced-service')?.value ||
    V169_ADVANCED_IMPORT.service ||
    'json'
  );

  V169_ADVANCED_IMPORT.service=service;

  const rows=mfExchangeRows();
  let blob,name;

  if(['mal','malxml','aniwatch','hianime','livechart'].includes(service)){
    blob=new Blob([mfMalXmlExport()],{type:'application/xml'});
    name=`mediaflow-${service}-${todayISO()}.xml`;
  }else if(['json','anilist','anisearch','kitsu','stremio','trakt'].includes(service)){
    blob=new Blob([
      JSON.stringify({
        source:'MediaFlow',
        target:mfServiceName(service),
        exportedAt:new Date().toISOString(),
        items:rows
      },null,2)
    ],{type:'application/json'});
    name=`mediaflow-${service}-${todayISO()}.json`;
  }else{
    const headers=Object.keys(
      rows[0]||{
        title:'',
        media_type:'',
        status:'',
        progress:'',
        total:'',
        rating:'',
        year:''
      }
    );
    const csv=[
      headers.join(','),
      ...rows.map(r=>headers.map(k=>mfCsvEscape(r[k])).join(','))
    ].join('\r\n');

    blob=new Blob([csv],{type:'text/csv'});
    name=`mediaflow-${service}-${todayISO()}.csv`;
  }

  triggerDownload(blob,name);
  showDataProgress(
    `Advanced export for ${mfServiceName(service)}`,
    'Creating exchange file…',
    70
  );

  setTimeout(()=>finishDataProgress(
    true,
    'Export complete',
    `${rows.length.toLocaleString()} Library titles exported for ${mfServiceName(service)}.`
  ),100);
}

function v169AdvancedImportHtml(){
  const state=V169_ADVANCED_IMPORT;
  v169EnsureAdvancedCategory();

  const serviceOptions=MF_EXCHANGE_SERVICES.map(([id,name])=>
    `<option value="${escapeHtml(id)}" ${state.service===id?'selected':''}>${escapeHtml(name)}</option>`
  ).join('');

  const modeSingle=state.mode!=='map';

  const typeRows=state.types.map(row=>{
    const selected=state.mappings?.[row.key]||row.defaultCategoryId||'';
    const excluded=v170TypeExcluded(row.key);
    return `<div class="v169-type-row ${excluded?'v170-type-excluded':''}">
      <div class="v169-type-name" title="${escapeHtml(row.label)}">${escapeHtml(row.label)}</div>
      <div class="v169-type-count">${row.count.toLocaleString()} title${row.count===1?'':'s'}</div>
      <select ${excluded?'disabled':''} onchange="App.v169SetTypeMapping('${escapeHtml(row.key)}',this.value)">
        ${v169CategoryOptions(selected)}
      </select>
      <label class="v170-dont-import">
        <input type="checkbox" ${excluded?'checked':''}
          onchange="App.v170SetTypeExcluded('${escapeHtml(row.key)}',this.checked)">
        <span>Don't import</span>
      </label>
    </div>`;
  }).join('');

  let scanBox='';
  if(state.mode==='map'){
    if(state.scanning){
      scanBox=`<div class="v169-scan-box">
        <div class="v169-scan-head">
          <b>Scanning source types…</b>
          <span class="hint">${Math.round(state.scanProgress||0)}%</span>
        </div>
        <div id="v169-scan-message" class="hint">${escapeHtml(state.scanMessage||'Scanning…')}</div>
        <div class="v169-scan-progress"><span id="v169-scan-fill" style="width:${Math.round(state.scanProgress||0)}%"></span></div>
      </div>`;
    }else if(state.parseError){
      scanBox=`<div class="v169-scan-box">
        <b>Could not scan this file</b>
        <div class="v169-ready">${escapeHtml(state.parseError)}</div>
      </div>`;
    }else if(state.file&&state.types.length){
      scanBox=`<div class="v169-scan-box">
        <div class="v169-scan-head">
          <div>
            <b>Detected source types</b>
            <div class="hint">${(state.records?.length||0).toLocaleString()} records · ${state.types.length.toLocaleString()} unique type${state.types.length===1?'':'s'}. Route each type to a MediaFlow category, or mark a type <b>Don't import</b> to skip every title of that type.</div>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" onclick="App.v169RescanAdvancedImport()">Rescan</button>
        </div>
        <div class="v169-type-list">${typeRows}</div>
      </div>`;
    }else if(state.file){
      scanBox=`<div class="v169-scan-box">
        <div class="v169-ready">No recognizable source types have been detected yet.</div>
      </div>`;
    }
  }

  return `<div class="section-label settings-section-head"><span>ADVANCED IMPORT / EXPORT — MEDIA SERVICES</span></div>
    <div class="card v169-advanced-card" style="margin-bottom:22px;">
      <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px;">
        Advanced category routing for the same MediaFlow service/format exchange system. Choose one destination category for the entire import, or let MediaFlow scan the file's own media types and map each detected type to a category before anything is imported.
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label">Service / format</label>
          <select id="v169-advanced-service" onchange="App.v169SetAdvancedService(this.value)">
            ${serviceOptions}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Import routing</label>
          <select onchange="App.v169SetAdvancedMode(this.value)">
            <option value="single" ${modeSingle?'selected':''}>Option 1 — All titles → one category</option>
            <option value="map" ${!modeSingle?'selected':''}>Option 2 — Scan source types → map categories</option>
          </select>
        </div>
      </div>

      ${modeSingle?`
        <div class="field" style="margin-top:4px">
          <label class="field-label">Destination category for every imported title</label>
          <select onchange="App.v169SetAdvancedCategory(this.value)">
            ${v169CategoryOptions(state.categoryId)}
          </select>
          <small class="hint">New titles and matching Library titles updated by this advanced import are assigned to this category.</small>
        </div>
      `:`
        <div class="hint" style="margin-top:4px">
          Choose the export file first. MediaFlow dynamically reads that service's actual type fields — for example MAL TV / Movie / OVA / ONA / Special, AniList formats, Simkl groups, or whatever type values the selected export really contains.
        </div>
      `}

      <div class="v169-file-row">
        <button type="button" class="btn" onclick="App.v169PickAdvancedImport()">Choose export file</button>
        <input id="v169-advanced-file" type="file"
          accept=".json,.csv,.xml,.txt,application/json,text/csv,text/xml,application/xml"
          style="display:none"
          onchange="App.v169PrepareAdvancedImport(this.files[0]);this.value=''">
        ${state.fileName?`
          <span class="v169-file-name" title="${escapeHtml(state.fileName)}">${escapeHtml(state.fileName)}</span>
          <button type="button" class="btn btn-sm btn-ghost" onclick="App.v169ClearAdvancedFile()">Clear</button>
        `:''}
      </div>

      ${scanBox}

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button type="button" class="btn btn-primary"
          onclick="App.v169RunAdvancedImport()"
          ${!state.file||state.scanning?'disabled':''}>
          Import with advanced routing
        </button>
        <button type="button" class="btn" onclick="App.v169AdvancedExport()">Export for selected service</button>
        <button type="button" class="btn" onclick="App.v169PickAdvancedPreset('malxml')">Quick MAL XML import</button>
        <button type="button" class="btn" onclick="App.v169PickAdvancedPreset('simkl')">Quick Simkl JSON import</button>
      </div>

      <small class="hint">
        Supports every service/format already available in MediaFlow. Type mapping is dynamic rather than hard-coded: MediaFlow inspects the selected file's own type/format/group fields, so service-specific values are discovered from the export itself. In Option 2 each detected type can either be routed to a category or blocked with <b>Don't import</b>. Scanning and importing are batched with browser yields, and the parsed file is reused instead of being scanned again during import.
      </small>
    </div>`;
}

// Insert the new section immediately after the existing media-service exchange
// card and before DATA, without changing the standard importer.
const v169RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v169RenderSettingsBase();
  const dataMarker='<div class="section-label">DATA</div>';

  if(h.includes(dataMarker) && !h.includes('ADVANCED IMPORT / EXPORT — MEDIA SERVICES')){
    h=h.replace(dataMarker,v169AdvancedImportHtml()+dataMarker);
  }

  return h;
};

Object.assign(App,{
  v169SetAdvancedService,
  v169SetAdvancedMode,
  v169SetAdvancedCategory,
  v169SetTypeMapping,
  v170SetTypeExcluded,
  v169PickAdvancedImport,
  v169PickAdvancedPreset,
  v169PrepareAdvancedImport,
  v169ClearAdvancedFile,
  v169RunAdvancedImport,
  v169AdvancedExport,
  v169RescanAdvancedImport(){
    return v169ScanAdvancedFile({force:true});
  }
});

// v169 adds no durable account structure: routing/file scans are intentionally
// runtime-only. Imported category assignments are normal Library categoryIds,
// so cloud sync, Full Backup, Automatic Backup and JSON import/export already
// preserve the result through the existing complete-state pipelines.
const v169BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v169BuildFullBackupBase();
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v169 backup. Advanced media-service imports persist their resulting Library category assignments as normal Library data; temporary file scans/type mappings are intentionally runtime-only. All existing account data, automatic Seasonal/Jikan state, System Respect XP, themes, navigation, Personal Order, Old System, Rating Queue and portable preferences remain preserved.';
  }

  return payload;
};



