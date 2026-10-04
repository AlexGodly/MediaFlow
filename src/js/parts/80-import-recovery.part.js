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



/* ============================================================
   MediaFlow v171 — Category Recovery & Default Identity
   ============================================================ */

const V171_BACKUP_SCHEMA_VERSION=9;
const V171_CATEGORY_RECOVERY_DEFAULT={
  lastDeletedCategory:null,
  lastDeletedIndex:-1,
  modifiedAt:0
};

function v171Clone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){
    try{return JSON.parse(JSON.stringify(fallback));}
    catch(__){return fallback;}
  }
}

function v171DefaultCategoryIds(){
  return new Set(DEFAULT_CATEGORIES.map(c=>String(c.id)));
}

function v171IsDefaultCategory(id){
  return v171DefaultCategoryIds().has(String(id||''));
}

function v171NormalizeCategoryRecovery(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cat=src.lastDeletedCategory&&typeof src.lastDeletedCategory==='object'
    ?v171Clone(src.lastDeletedCategory,null)
    :null;

  return {
    lastDeletedCategory:cat,
    lastDeletedIndex:Number.isFinite(Number(src.lastDeletedIndex))
      ?Math.max(-1,Math.floor(Number(src.lastDeletedIndex)))
      :-1,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v171EnsureCategoryState(){
  S.settings=S.settings||DEFAULT_SETTINGS;
  if(typeof S.settings.highlightDefaultCategories!=='boolean'){
    S.settings.highlightDefaultCategories=true;
  }
  S.categoryRecovery=v171NormalizeCategoryRecovery(S.categoryRecovery);
  return S.categoryRecovery;
}

v171EnsureCategoryState();

function v171MissingDefaultCategories(){
  const existing=new Set((S.categories||[]).map(c=>String(c?.id||'')));
  return DEFAULT_CATEGORIES.filter(c=>!existing.has(String(c.id)));
}

function v171LastDeletedStatus(){
  const rec=v171EnsureCategoryState();
  const cat=rec.lastDeletedCategory;
  if(!cat)return {cat:null,canRestore:false,exists:false};

  const exists=(S.categories||[]).some(
    c=>String(c?.id||'')===String(cat.id||'')
  );
  return {cat,canRestore:!exists,exists};
}

async function v171RestoreDefaultCategories(){
  const missing=v171MissingDefaultCategories();
  if(!missing.length){
    showToast('All default categories are already present.');
    return;
  }

  const existingIds=new Set((S.categories||[]).map(c=>String(c?.id||'')));
  let restored=0;

  // Append only missing canonical defaults. Existing default-ID categories are
  // never overwritten, so user edits/renames remain intact.
  for(const original of DEFAULT_CATEGORIES){
    const id=String(original.id);
    if(existingIds.has(id))continue;

    const restoredCategory=v171Clone(original,{});
    restoredCategory.id=id; // explicit invariant: canonical ID must survive.
    restoredCategory.custom=false;

    S.categories.push(restoredCategory);
    existingIds.add(id);
    restored++;
  }

  await persistCategories();
  try{v53InvalidateLibraryCache();}catch(_){}
  render();

  showToast(
    `${restored} default categor${restored===1?'y':'ies'} restored with original IDs`
  );
}

async function v171RestoreLastDeletedCategory(){
  const rec=v171EnsureCategoryState();
  const cat=rec.lastDeletedCategory;

  if(!cat){
    showToast('There is no deleted category to restore.');
    return;
  }

  if(
    (S.categories||[]).some(
      c=>String(c?.id||'')===String(cat.id||'')
    )
  ){
    showToast('That category ID already exists.');
    return;
  }

  const restored=v171Clone(cat,{});
  const index=Math.max(
    0,
    Math.min(
      S.categories.length,
      Number.isFinite(Number(rec.lastDeletedIndex))
        ?Math.floor(Number(rec.lastDeletedIndex))
        :S.categories.length
    )
  );

  S.categories.splice(index,0,restored);

  // Recovery slot is consumed only after a successful restoration.
  S.categoryRecovery={
    lastDeletedCategory:null,
    lastDeletedIndex:-1,
    modifiedAt:Date.now()
  };

  await persistCategories();
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
  showToast(`${restored.name||'Category'} restored`);
}

function v171ToggleDefaultCategoryHighlight(){
  v171EnsureCategoryState();
  S.settings.highlightDefaultCategories=
    S.settings.highlightDefaultCategories===false;

  persistSettings();
  render();
}

// Capture the full category record and original array position immediately
// before the existing deletion code removes it and saves the canonical state.
const v171ConfirmDeleteCategoryBase=App.confirmDeleteCategory;
App.confirmDeleteCategory=async function(id,button){
  const index=(S.categories||[]).findIndex(
    c=>String(c?.id||'')===String(id||'')
  );
  const cat=index>=0?S.categories[index]:null;

  if(cat){
    S.categoryRecovery={
      lastDeletedCategory:v171Clone(cat,null),
      lastDeletedIndex:index,
      modifiedAt:Date.now()
    };
  }

  return v171ConfirmDeleteCategoryBase.call(this,id,button);
};

// Keep the confirmation copy accurate now that one deleted category can be
// recovered from Settings.
const v171CategoryDeleteModalBase=categoryDeleteModalHtml;
categoryDeleteModalHtml=function(d){
  let h=v171CategoryDeleteModalBase(d);
  h=h.replace(
    '<b style="color:var(--text);">This cannot be undone.</b><br>Past history is kept, but entries that reference this category may show it as removed.',
    '<b style="color:var(--text);">Recovery available.</b><br>The most recently deleted category can be restored from Settings → Categories until another category is deleted. Past history is kept.'
  );
  return h;
};

function v171CategoryRowsHtml(){
  const highlight=S.settings?.highlightDefaultCategories!==false;

  return (S.categories||[]).map((c,index)=>{
    const isDefault=v171IsDefaultCategory(c.id);
    const highlighted=highlight&&isDefault;
    const icon=typeof v144CategoryIconHtml==='function'
      ?v144CategoryIconHtml(c)
      :escapeHtml(c.icon||'🗂️');

    return `<div class="cat-manage-row ${highlighted?'v171-default-category':''}" data-category-id="${escapeHtml(String(c.id))}">
      <div class="hero-icon" style="width:36px;height:36px;font-size:17px;background:${escapeHtml(String(c.color||'#555'))}22;color:${escapeHtml(String(c.color||'#555'))};">${icon}</div>

      <div class="name">
        ${escapeHtml(c.name)}
        ${highlighted?'<span class="v171-default-badge">DEFAULT</span>':''}
        <div class="meta">${c.target} ${unitLabel(c.unit,c.target)} target · weight ${c.weight} ${c.seasonal?'· seasonal':''}</div>
      </div>

      <div class="cat-order-controls" style="display:flex;gap:5px;align-items:center;">
        <input class="v157-position-input" type="number" min="1" max="${S.categories.length}" step="1" value="${index+1}"
          title="Set exact category position" aria-label="Set ${escapeHtml(c.name)} category position"
          onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()"
          onkeydown="if(event.key==='Enter'){this.blur();}"
          onchange="App.v157SetCategoryPosition('${escapeHtml(String(c.id))}',this.value)">
        <button type="button" class="btn btn-sm btn-ghost cat-drag-handle" title="Drag to reorder" aria-label="Drag ${escapeHtml(c.name)} to reorder" onpointerdown="App.v73CategoryDragStart(event,'${escapeHtml(String(c.id))}')">☰</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${escapeHtml(String(c.id))}',-1)" ${S.categories[0]?.id===c.id?'disabled':''} title="Move category up" aria-label="Move ${escapeHtml(c.name)} up">↑</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${escapeHtml(String(c.id))}',1)" ${S.categories[S.categories.length-1]?.id===c.id?'disabled':''} title="Move category down" aria-label="Move ${escapeHtml(c.name)} down">↓</button>
      </div>

      <button class="toggle ${c.enabled?'on':''}" onclick="App.toggleCategory('${escapeHtml(String(c.id))}')"></button>
      <button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App.openCategoryModal('${escapeHtml(String(c.id))}')">Edit</button>
      <button class="btn btn-sm btn-danger cat-delete-btn" onclick="App.deleteCategory('${escapeHtml(String(c.id))}')">Delete</button>
    </div>`;
  }).join('');
}

function v171CategoriesSectionHtml(){
  v171EnsureCategoryState();

  const missing=v171MissingDefaultCategories();
  const last=v171LastDeletedStatus();
  const highlight=S.settings.highlightDefaultCategories!==false;

  let lastLabel='Restore last deleted';
  if(last.cat){
    lastLabel=`Restore last deleted · ${escapeHtml(String(last.cat.name||last.cat.id||'category'))}`;}

  return `<div class="settings-categories-full">
    <div class="section-label">CATEGORIES</div>
    <div class="card">
      <div class="v171-category-tools">
        <div>
          <div style="font-size:11px;font-weight:850;color:var(--text)">Category recovery</div>
          <div class="v171-recovery-note">
            MediaFlow's ${DEFAULT_CATEGORIES.length} built-in categories are recognized by their original IDs. Restoring missing defaults never overwrites an existing category with the same default ID.
          </div>
        </div>

        <div class="v171-category-tool-actions">
          <button type="button" class="btn btn-sm"
            onclick="App.v171RestoreDefaultCategories()"
            ${missing.length?'':'disabled'}>
            Restore missing defaults${missing.length?` (${missing.length})`:''}
          </button>

          <button type="button" class="btn btn-sm btn-ghost"
            onclick="App.v171RestoreLastDeletedCategory()"
            ${last.canRestore?'':'disabled'}>
            ${lastLabel}
          </button>

          <label class="v171-highlight-toggle">
            <span>Highlight defaults</span>
            <button type="button"
              class="toggle ${highlight?'on':''}"
              onclick="event.preventDefault();App.v171ToggleDefaultCategoryHighlight()"
              aria-label="Toggle default category highlighting"></button>
          </label>
        </div>
      </div>

      ${v171CategoryRowsHtml()}

      <button class="btn btn-block" style="margin-top:14px;" onclick="App.openCategoryModal()">+ Add category</button>
    </div>
  </div>`;
}

// Replace only the original Categories block. All later Settings additions
// (themes, navigation, imports, XP, etc.) continue through the existing chain.
const v171RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v171RenderSettingsBase();
  const replacement=v171CategoriesSectionHtml();

  h=h.replace(
    /<div class="settings-categories-full">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="two-col")/,
    replacement
  );

  return h;
};

Object.assign(App,{
  v171RestoreDefaultCategories,
  v171RestoreLastDeletedCategory,
  v171ToggleDefaultCategoryHighlight
});

// ---- Persistence / cloud / merge / import ----------------------------------

const v171PersistSettingsBase=persistSettings;
persistSettings=function(){
  v171EnsureCategoryState();
  return v171PersistSettingsBase.apply(this,arguments);
};

const v171SnapshotBase=snapshot;
snapshot=function(){
  v171EnsureCategoryState();
  const x=v171SnapshotBase();

  x.categoryRecovery=v171Clone(
    S.categoryRecovery,
    V171_CATEGORY_RECOVERY_DEFAULT
  );
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,171);

  return x;
};

const v171ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v171ApplyStateBase.apply(this,arguments);

  S.categoryRecovery=v171NormalizeCategoryRecovery(d?.categoryRecovery);
  v171EnsureCategoryState();

  return result;
};

const v171MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v171MergeStatesBase(a,b)||{};

  const ar=v171NormalizeCategoryRecovery(a?.categoryRecovery);
  const br=v171NormalizeCategoryRecovery(b?.categoryRecovery);

  out.categoryRecovery=v171Clone(
    (Number(ar.modifiedAt)||0)>=(Number(br.modifiedAt)||0)
      ?ar
      :br,
    V171_CATEGORY_RECOVERY_DEFAULT
  );

  out.settings=out.settings||{};
  if(typeof out.settings.highlightDefaultCategories!=='boolean'){
    const av=a?.settings?.highlightDefaultCategories;
    const bv=b?.settings?.highlightDefaultCategories;
    out.settings.highlightDefaultCategories=
      typeof av==='boolean'
        ?av
        :typeof bv==='boolean'
          ?bv
          :true;
  }

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    171
  );

  return out;
};

// ---- Protected Sync completeness + post-upload verification ----------------

const v171StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const base=v171StateCompletenessBase(state);
  const missing=[...(base?.missing||[])];

  if(!state?.categoryRecovery||typeof state.categoryRecovery!=='object'){
    missing.push('category recovery');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

function v171CategoryAudit(state){
  const rows=(Array.isArray(state?.categories)?state.categories:[]).map(c=>({
    id:String(c?.id||''),
    name:String(c?.name||''),
    icon:String(c?.icon||''),
    iconUrl:String(c?.iconUrl||''),
    type:String(c?.type||''),
    unit:String(c?.unit||''),
    target:Number(c?.target)||0,
    weight:Number(c?.weight)||0,
    minutesPerUnit:Number(c?.minutesPerUnit)||0,
    seasonal:!!c?.seasonal,
    color:String(c?.color||''),
    enabled:c?.enabled!==false,
    custom:!!c?.custom
  }));

  const rec=v171NormalizeCategoryRecovery(state?.categoryRecovery);

  return {
    rows,
    order:Array.isArray(state?.categoryOrder)
      ?state.categoryOrder.map(String)
      :[],
    highlight:state?.settings?.highlightDefaultCategories!==false,
    recovery:{
      lastDeletedCategory:rec.lastDeletedCategory,
      lastDeletedIndex:rec.lastDeletedIndex,
      modifiedAt:rec.modifiedAt
    }
  };
}

const v171VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v171VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudAudit=v171CategoryAudit(cloudState);
  const expectedAudit=v171CategoryAudit(expected);

  if(JSON.stringify(cloudAudit.rows)!==JSON.stringify(expectedAudit.rows)){
    problems.push('Categories');
  }

  if(JSON.stringify(cloudAudit.order)!==JSON.stringify(expectedAudit.order)){
    problems.push('Category order');
  }

  if(cloudAudit.highlight!==expectedAudit.highlight){
    problems.push('Default category highlight preference');
  }

  if(
    JSON.stringify(cloudAudit.recovery)!==
    JSON.stringify(expectedAudit.recovery)
  ){
    problems.push('Category recovery');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup / JSON import-export -------------------

const v171BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v171EnsureCategoryState();
  const payload=v171BuildFullBackupBase();

  payload.backupSchemaVersion=V171_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.categoryRecovery=v171Clone(
    S.categoryRecovery,
    V171_CATEGORY_RECOVERY_DEFAULT
  );
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V171_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v171 backup. Includes categories with stable IDs/order, default-category highlight preference, last-deleted category recovery state, advanced imports, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v171BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v171BackupManifestBase(state,extras);
  const missingIds=new Set(
    DEFAULT_CATEGORIES
      .map(c=>String(c.id))
      .filter(id=>!(state?.categories||[]).some(c=>String(c?.id||'')===id))
  );
  const rec=v171NormalizeCategoryRecovery(state?.categoryRecovery);

  manifest.schemaVersion=V171_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    stableDefaultCategoryIds:true,
    defaultCategoryHighlightPreference:true,
    lastDeletedCategoryRecovery:true,
    categoryRecoveryPosition:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    defaultCategoriesPresent:DEFAULT_CATEGORIES.length-missingIds.size,
    defaultCategoriesMissing:missingIds.size,
    recoverableDeletedCategory:rec.lastDeletedCategory?1:0
  });

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at runtime,
// so v171 recovery/highlight/category state is automatically included.
// Full JSON import applies categoryRecovery through the final v46ApplyState()
// chain above.



/* ============================================================
   MediaFlow v172 — Unified Media Services Import Interface
   ------------------------------------------------------------
   The old Normal and Advanced media-service cards are no longer rendered as
   two separate Settings sections. One shared section now exposes a switch:
     • Normal
     • Advanced (Recommended)

   The selected interface is an account Settings preference. Switching views
   does not discard the in-memory v169/v170 Advanced file scan workspace.
   ============================================================ */

const V172_BACKUP_SCHEMA_VERSION=10;

function v172NormalizeImportInterface(value){
  return String(value||'').toLowerCase()==='normal'
    ?'normal'
    :'advanced';
}

function v172EnsureImportInterfaceSettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.mediaServicesImportInterface=v172NormalizeImportInterface(
    settings.mediaServicesImportInterface
  );
  return settings;
}

v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);

function v172SetImportInterface(mode){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  S.settings.mediaServicesImportInterface=
    v172NormalizeImportInterface(mode);

  persistSettings();
  render();
}

function v172NormalMediaServicesBodyHtml(){
  return `<div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px;">
      Import library exports from other tracking services or export your MediaFlow Library into exchange files for those services. MediaFlow merges matching titles and preserves progress, status, ratings, dates and external IDs when the source contains them.
    </div>

    <div class="field-row">
      <div class="field">
        <label class="field-label">Service / format</label>
        <select id="exchange-service">${mfExchangeServiceOptions()}</select>
      </div>
      <div class="field">
        <label class="field-label">Import</label>
        <button class="btn" onclick="App.pickExchangeImport()">Choose export file</button>
        <input id="exchange-file" type="file"
          accept=".json,.csv,.xml,.txt,application/json,text/csv,text/xml,application/xml"
          style="display:none"
          onchange="App.prepareExchangeImport(this.files[0])">
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-primary" onclick="App.exportExchange()">Export for selected service</button>
      <button class="btn" onclick="document.getElementById('mal-file').click()">Quick MAL XML import</button>
      <input type="file" id="mal-file" accept=".xml,text/xml" style="display:none"
        onchange="App.prepareLegacyImport('mal',this.files[0])">
      <button class="btn" onclick="document.getElementById('simkl-file').click()">Quick Simkl JSON import</button>
      <input type="file" id="simkl-file" accept=".json,application/json" style="display:none"
        onchange="App.prepareLegacyImport('simkl',this.files[0])">
    </div>

    <small class="hint">
      AniList · AniSearch · AniWatch · BetaSeries · Criticker · Crunchyroll · EpisodeCalendar · HiAnime · IMDb · Letterboxd · LiveChart · Kitsu · MoviesFad · MyAnimeList · MAL-XML · Netflix · PrimeWire · SeriesFad · Stremio · trakt · TV Time · Tviso · Twee · CSV · JSON. Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data. v158 also imports Start Date, Finish Date, source timestamps and external cover URLs whenever the source includes them.
    </small>
  </div>`;
}

function v172AdvancedMediaServicesBodyHtml(){
  let h=v169AdvancedImportHtml();

  // Remove only the old Advanced section heading. The complete v169/v170
  // Advanced card remains authoritative, including type mapping/exclusions.
  h=h.replace(
    /^<div class="section-label settings-section-head"><span>ADVANCED IMPORT \/ EXPORT — MEDIA SERVICES<\/span><\/div>\s*/,
    ''
  );

  // Mark Advanced as the recommended workflow inside the chosen interface.
  h=h.replace(
    /(<div class="card v169-advanced-card"[^>]*>)/,
    `$1<div class="v172-advanced-recommendation"><strong>Recommended</strong><span>Use Advanced Import when you want explicit category routing, per-source-type mapping, or “Don’t import” exclusions before Library changes are applied.</span></div>`
  );

  // The shared shell owns vertical spacing now.
  h=h.replace(
    'class="card v169-advanced-card" style="margin-bottom:22px;"',
    'class="card v169-advanced-card" style="margin-bottom:0;"'
  );

  return h;
}

function v172MediaServicesSectionHtml(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const mode=S.settings.mediaServicesImportInterface;
  const advanced=mode==='advanced';

  return `<div class="section-label settings-section-head">
      <span>IMPORT / EXPORT — MEDIA SERVICES</span>
      ${defaultButton('mal')}
    </div>

    <div class="v172-import-interface-shell ${advanced?'is-advanced':'is-normal'}">
      <div class="v172-import-mode-bar">
        <div class="v172-import-mode-copy">
          <b>Import interface</b>
          <small>Use one interface at a time. You can switch whenever you need the extra routing controls.</small>
        </div>

        <div class="v172-import-switch" role="tablist" aria-label="Media services import interface">
          <button type="button"
            class="${advanced?'':'active'}"
            role="tab"
            aria-selected="${advanced?'false':'true'}"
            onclick="App.v172SetImportInterface('normal')">
            Normal
          </button>

          <button type="button"
            class="advanced-choice ${advanced?'active':''}"
            role="tab"
            aria-selected="${advanced?'true':'false'}"
            onclick="App.v172SetImportInterface('advanced')">
            Advanced
            <span class="v172-recommended-badge">RECOMMENDED</span>
          </button>
        </div>
      </div>

      ${advanced
        ?v172AdvancedMediaServicesBodyHtml()
        :v172NormalMediaServicesBodyHtml()}
    </div>`;
}

// Final Settings wrapper: collapse the legacy normal and separately-inserted
// advanced sections into one switchable section while preserving every section
// that may sit between them (for example Cover Maintenance).
const v172RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v172RenderSettingsBase();
  const placeholder='<!--MF_V172_MEDIA_SERVICES_INTERFACE-->';

  // Remove the old standard media-services section only.
  const normalPattern=/<div class="section-label settings-section-head"><span>IMPORT \/ EXPORT — MEDIA SERVICES<\/span>[\s\S]*?<small class="hint">AniList[\s\S]*?external cover URLs whenever the source includes them\.<\/small>\s*<\/div>/;

  if(normalPattern.test(h)){
    h=h.replace(normalPattern,placeholder);
  }else{
    // Backward-safe fallback for a build whose v158 descriptive suffix is absent.
    h=h.replace(
      /<div class="section-label settings-section-head"><span>IMPORT \/ EXPORT — MEDIA SERVICES<\/span>[\s\S]*?<small class="hint">AniList[\s\S]*?inventing missing data\.<\/small>\s*<\/div>/,
      placeholder
    );
  }

  // Remove the separately-rendered v169/v170 Advanced section.
  h=h.replace(
    /<div class="section-label settings-section-head"><span>ADVANCED IMPORT \/ EXPORT — MEDIA SERVICES<\/span><\/div>\s*<div class="card v169-advanced-card"[\s\S]*?parsed file is reused instead of being scanned again during import\.\s*<\/small>\s*<\/div>/,
    ''
  );

  // Insert one combined switchable interface at the original standard section.
  if(h.includes(placeholder)){
    h=h.replace(placeholder,v172MediaServicesSectionHtml());
  }

  return h;
};

Object.assign(App,{
  v172SetImportInterface
});

// ---- Persistence / cloud / Sync Now / backups ------------------------------

const v172PersistSettingsBase=persistSettings;
persistSettings=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  return v172PersistSettingsBase.apply(this,arguments);
};

const v172LoadAllBase=loadAll;
loadAll=async function(){
  await v172LoadAllBase.apply(this,arguments);
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
};

const v172SnapshotBase=snapshot;
snapshot=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const x=v172SnapshotBase();

  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    172
  );

  return x;
};

const v172ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v172ApplyStateBase.apply(this,arguments);
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v172MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v172MergeStatesBase(a,b)||{};
  out.settings=out.settings||{};

  out.settings.mediaServicesImportInterface=
    v172NormalizeImportInterface(
      out.settings.mediaServicesImportInterface ??
      a?.settings?.mediaServicesImportInterface ??
      b?.settings?.mediaServicesImportInterface
    );

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    172
  );

  return out;
};

const v172VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v172VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudMode=v172NormalizeImportInterface(
    cloudState?.settings?.mediaServicesImportInterface
  );
  const wantedMode=v172NormalizeImportInterface(
    expected?.settings?.mediaServicesImportInterface
  );

  if(cloudMode!==wantedMode){
    problems.push('Media Services import interface preference');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v172BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v172BuildFullBackupBase();

  payload.backupSchemaVersion=V172_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V172_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v172 backup. Includes the unified Normal/Advanced media-services import interface preference, category recovery/default identity, advanced routing/exclusions, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v172BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v172BackupManifestBase(state,extras);

  manifest.schemaVersion=V172_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    unifiedMediaServicesImportInterface:true,
    mediaServicesImportInterfacePreference:true,
    advancedImportRecommended:true
  });

  return manifest;
};

// v152 Automatic Backup calls the final v148BuildFullBackup() dynamically, so
// the v172 interface preference is included automatically. Full JSON import
// restores Settings through the final v46ApplyState() chain above.



/* ============================================================
   MediaFlow v173
   - Order: direct Edit + optional pagination for All Titles / By Category
   - Old System: Date View mode with From / To range simulation
   - Themes: Recommended-only, On This Day-only, and selectable
     Recommendation + On This Day rotation collections
   ============================================================ */

const V173_BACKUP_SCHEMA_VERSION=11;
const V173_ORDER_PAGE_SIZE=50;

function v173Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){
    try{return JSON.parse(JSON.stringify(fallback));}
    catch(__){return fallback;}
  }
}

/* ============================================================
   ORDER — Edit buttons + optional ordered-title pagination
   ============================================================ */

const v173NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v173NormalizeOrderPlanBase(plan,library,categories);
  const raw=(plan&&typeof plan==='object')?plan:{};

  out.paginateOrderedTitles=
    typeof raw.paginateOrderedTitles==='boolean'
      ?raw.paginateOrderedTitles
      :true;

  return out;
};

function v173OrderUI(){
  v138EnsureOrderPlan();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};

  ui.v173AllPage=Math.max(0,Math.floor(Number(ui.v173AllPage)||0));

  if(!ui.v173CategoryPages||typeof ui.v173CategoryPages!=='object'){
    ui.v173CategoryPages={};
  }

  return ui;
}

function v173OrderPaginationHtml(page,totalPages,kind,catId=''){
  if(totalPages<=1)return '';

  page=Math.max(0,Math.min(totalPages-1,Number(page)||0));
  const id=String(catId||'').replace(/'/g,"\\'");
  const call=(target)=>kind==='category'
    ?`App.v173SetOrderPage('category',${target},'${id}')`
    :`App.v173SetOrderPage('all',${target})`;

  return `<div class="v173-order-pagination ${kind==='category'?'v173-category-pagination':''}">
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(0)}" ${page===0?'disabled':''}>«</button>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(page-1)}" ${page===0?'disabled':''}>‹ Prev</button>
    <span class="v173-page-label">Page ${(page+1).toLocaleString()} / ${totalPages.toLocaleString()}</span>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(page+1)}" ${page>=totalPages-1?'disabled':''}>Next ›</button>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(totalPages-1)}" ${page>=totalPages-1?'disabled':''}>»</button>
  </div>`;
}

function v173SetOrderPage(kind,page,catId=''){
  const ui=v173OrderUI();
  const target=Math.max(0,Math.floor(Number(page)||0));

  if(kind==='category'){
    ui.v173CategoryPages[String(catId||'')]=target;
  }else{
    ui.v173AllPage=target;
  }

  render();
  requestAnimationFrame(()=>{
    document.querySelector('.v138-order-main')?.scrollIntoView?.({
      behavior:'smooth',
      block:'start'
    });
  });
}

function v173ToggleOrderPagination(){
  const p=v138EnsureOrderPlan();
  p.paginateOrderedTitles=!p.paginateOrderedTitles;

  const ui=v173OrderUI();
  ui.v173AllPage=0;
  ui.v173CategoryPages={};

  v138TouchOrderPlan();
  render();

  showToast(
    p.paginateOrderedTitles
      ?`Ordered-title pagination enabled · ${v175OrderPageSize()} per page`
      :'Ordered-title pagination disabled'
  );
}

// FINAL Order row wrapper: ordered titles can now be edited directly from Order.
const v173OrderRowHtmlBase=v138OrderRowHtml;
v138OrderRowHtml=function(item,position,scopeCatId=''){
  let h=v173OrderRowHtmlBase(item,position,scopeCatId);
  const id=String(item?.id||'').replace(/'/g,"\\'");

  const removeNeedle=`<button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>`;

  const edit=`<button class="btn btn-sm btn-ghost" type="button"
    onclick="event.stopPropagation();App.openLibraryModal('${id}')"
    title="Edit this Library title">Edit</button>`;

  if(h.includes(removeNeedle)){
    h=h.replace(removeNeedle,edit+removeNeedle);
  }

  return h;
};

// FINAL All Titles renderer with optional pagination.
v138AllTitlesHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const items=st.orderedItems||[];

  if(!items.length){
    return `<div class="v138-order-empty"><b>Your Order is empty</b>Add Library titles from the picker, then arrange them in the exact sequence you want.</div>`;
  }

  if(!p.paginateOrderedTitles){
    return `<div class="v138-order-list">${
      items.map((item,i)=>v138OrderRowHtml(item,i+1,'')).join('')
    }</div>`;
  }

  const ui=v173OrderUI();
  const totalPages=Math.max(1,Math.ceil(items.length/v175OrderPageSize()));
  const page=Math.max(0,Math.min(totalPages-1,ui.v173AllPage||0));
  ui.v173AllPage=page;

  const start=page*v175OrderPageSize();
  const rows=items
    .slice(start,start+v175OrderPageSize())
    .map((item,i)=>v138OrderRowHtml(item,start+i+1,''))
    .join('');

  return `<div class="v138-order-list">${rows}</div>
    ${v173OrderPaginationHtml(page,totalPages,'all')}`;
};

// FINAL By Category renderer with independent page state per category.
v138ByCategoryHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const ui=v173OrderUI();
  const hidden=new Set(p.hiddenCategories.map(String));
  const order=v138CategoryDisplayOrder();
  const blocks=[];

  for(const catId of order){
    const cid=String(catId);
    if(hidden.has(cid))continue;

    const cat=v138OrderCategory(cid);
    if(!cat)continue;

    const ids=st.byCategory.get(cid)||[];
    if(!ids.length)continue;

    let page=0,totalPages=1,start=0,visibleIds=ids;

    if(p.paginateOrderedTitles){
      totalPages=Math.max(1,Math.ceil(ids.length/v175OrderPageSize()));
      page=Math.max(
        0,
        Math.min(
          totalPages-1,
          Math.floor(Number(ui.v173CategoryPages[cid])||0)
        )
      );
      ui.v173CategoryPages[cid]=page;
      start=page*v175OrderPageSize();
      visibleIds=ids.slice(start,start+v175OrderPageSize());
    }

    const rows=visibleIds.map((id,i)=>{
      const item=v138OrderItem(id);
      return item?v138OrderRowHtml(item,start+i+1,cid):'';
    }).join('');

    blocks.push(`<div class="card v138-category-card">
      <div class="v138-category-head">
        <div class="v138-category-head-copy">
          <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
          <small>Relative title order is shared with All Titles.${p.paginateOrderedTitles?` Showing up to ${v175OrderPageSize()} titles per page.`:''}</small>
        </div>
        <span class="v138-category-count">${ids.length}</span>
      </div>
      <div class="v138-order-list">${rows}</div>
      ${p.paginateOrderedTitles?v173OrderPaginationHtml(page,totalPages,'category',cid):''}
    </div>`);
  }

  if(!blocks.length){
    return `<div class="v138-order-empty"><b>No visible category groups</b>Add titles to Order or show a hidden category from Category display.</div>`;
  }

  return blocks.join('');
};

// Add one global pagination toggle to the Order toolbar. It controls both views.
const v173RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v173RenderOrderBase();
  const p=v138EnsureOrderPlan();

  const toggle=`<label class="v173-order-pagination-toggle">
    <span>Paginate ordered titles</span>
    <button type="button"
      class="toggle ${p.paginateOrderedTitles?'on':''}"
      onclick="event.preventDefault();App.v173ToggleOrderPagination()"
      aria-label="Toggle ordered-title pagination"></button>
    <span>${p.paginateOrderedTitles?`${v175OrderPageSize()}/page`:'Off'}</span>
  </label>`;

  h=h.replace(
    /(<div class="v138-order-switch">[\s\S]*?<\/div>)(\s*<div class="v138-order-summary">)/,
    `$1${toggle}$2`
  );

  return h;
};

// Dedicated Order export/import keeps the pagination preference too.
const v173OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v173OrderExportPayloadBase();
  const p=v138EnsureOrderPlan();

  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,2);
  payload.mediaFlowVersion=173;
  payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.paginateOrderedTitles=!!p.paginateOrderedTitles;

  return payload;
};

const v173ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let importedPagination=null;

  try{
    if(file){
      const data=JSON.parse(await file.text());
      const raw=data?.orderPlan&&typeof data.orderPlan==='object'
        ?data.orderPlan
        :data;

      if(typeof raw?.paginateOrderedTitles==='boolean'){
        importedPagination=raw.paginateOrderedTitles;
      }
    }
  }catch(_){}

  await v173ImportOrderBase(file);

  if(importedPagination!==null){
    const p=v138EnsureOrderPlan();
    p.paginateOrderedTitles=importedPagination;
    v138TouchOrderPlan();
    render();
  }
};

Object.assign(App,{
  v173SetOrderPage,
  v173ToggleOrderPagination,
  v142ImportOrder
});

/* ============================================================
   OLD SYSTEM — Date View
   ============================================================ */

const v173NormalizeOldSystemBase=v153NormalizeOldSystem;
v153NormalizeOldSystem=function(raw){
  const out=v173NormalizeOldSystemBase(raw);
  const src=(raw&&typeof raw==='object')?raw:{};

  out.mode=['system','view','date','stats'].includes(String(src.mode))
    ?String(src.mode)
    :out.mode;

  const validDate=value=>{
    const s=String(value||'').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
  };

  out.dateFrom=validDate(src.dateFrom);
  out.dateTo=validDate(src.dateTo);

  return out;
};

function v173SessionDayKey(s){
  const direct=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(direct))return direct;

  const ts=Number(s?.timestamp)||0;
  if(!ts)return '';

  const d=new Date(ts);
  if(Number.isNaN(d.getTime()))return '';

  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function v173OldSystemDateRows(){
  const os=v153EnsureOldSystem();
  const from=String(os.dateFrom||'');
  const to=String(os.dateTo||'');

  return v153HistoryRows().filter(s=>{
    const day=v173SessionDayKey(s);
    if(!day)return false;
    if(from&&day<from)return false;
    if(to&&day>to)return false;
    return true;
  });
}

function v173BuildOldSystemCacheForRows(rows){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rules=v153ActiveRules();

  const rawTotals=new Map();
  const sessionCounts=new Map();
  const minuteTotals=new Map();
  const simulatedBalances=new Map();
  const simulatedSpent=new Map();

  for(const id of os.enabledCategoryIds)simulatedBalances.set(id,0);

  for(const s of rows){
    const id=String(s.categoryId||'');
    const amount=Math.max(0,Number(s.actualAmount)||0);
    const minutes=Math.max(0,Number(s.minutes)||0);

    rawTotals.set(id,(rawTotals.get(id)||0)+amount);
    sessionCounts.set(id,(sessionCounts.get(id)||0)+1);
    minuteTotals.set(id,(minuteTotals.get(id)||0)+minutes);

    if(!enabled.has(id))continue;

    simulatedBalances.set(id,(simulatedBalances.get(id)||0)+amount);

    for(const r of rules){
      if(String(r.toCategoryId)!==id)continue;

      const cost=
        amount*
        (Number(r.fromAmount)||1)/
        (Number(r.toAmount)||1);

      const fromId=String(r.fromCategoryId);
      simulatedBalances.set(
        fromId,
        (simulatedBalances.get(fromId)||0)-cost
      );
      simulatedSpent.set(
        fromId,
        (simulatedSpent.get(fromId)||0)+cost
      );
    }
  }

  return {
    rawTotals,
    sessionCounts,
    minuteTotals,
    simulatedBalances,
    simulatedSpent,
    activityRows:rows.length
  };
}

function v173SetOldSystemDate(key,value){
  if(!['dateFrom','dateTo'].includes(String(key)))return;

  const os=v153EnsureOldSystem();
  const s=String(value||'').trim();

  os[key]=/^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
  v153TouchOldSystem();
  render();
}

function v173ClearOldSystemDates(){
  const os=v153EnsureOldSystem();
  os.dateFrom='';
  os.dateTo='';
  v153TouchOldSystem();
  render();
}

function v173RenderDateViewMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();

  if(!enabled.length){
    return `<div class="v153-os-empty">No categories are configured for the Old System yet. Open <b>System</b> and add the categories you want to simulate.</div>`;
  }

  const rows=v173OldSystemDateRows();
  const cache=v173BuildOldSystemCacheForRows(rows);const cards=enabled.map(cat=>{
    const id=String(cat.id);
    const balance=cache.simulatedBalances.get(id)||0;
    const consumed=cache.rawTotals.get(id)||0;
    const spent=cache.simulatedSpent.get(id)||0;

    const extra=`<div class="v153-os-stat-line"><span>MediaFlow consumed</span><b>${v153FmtQty(consumed)}</b></div>
      <div class="v153-os-stat-line"><span>Spent as source</span><b>${v153FmtQty(spent)}</b></div>`;

    return v153SystemBalanceCard(cat,balance,extra);
  }).join('');

  const from=os.dateFrom||'Beginning';
  const to=os.dateTo||'Today';

  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Date-range Old System Simulation</div>
      <div class="v153-os-card-sub">Same read-only simulation as View, but only genuine MediaFlow History inside the date range below is replayed through your Old System conversion rules.</div>

      <div class="v173-date-view-controls">
        <div class="field" style="margin:0">
          <label class="field-label">From</label>
          <input type="date" value="${escapeHtml(os.dateFrom||'')}"
            onchange="App.v173SetOldSystemDate('dateFrom',this.value)">
        </div>

        <div class="field" style="margin:0">
          <label class="field-label">To</label>
          <input type="date" value="${escapeHtml(os.dateTo||'')}"
            onchange="App.v173SetOldSystemDate('dateTo',this.value)">
        </div>

        <button class="btn btn-ghost" type="button"
          onclick="App.v173ClearOldSystemDates()"
          ${(!os.dateFrom&&!os.dateTo)?'disabled':''}>
          Clear dates
        </button>
      </div>

      <div class="v173-date-view-summary">
        ${cache.activityRows.toLocaleString()} consumption record${cache.activityRows===1?'':'s'} analyzed · ${escapeHtml(from)} → ${escapeHtml(to)}
      </div>
    </div>

    <div class="section-label">OLD SYSTEM FOR SELECTED DATES</div>
    <div class="v153-os-grid">${cards}</div>`;
}

// FINAL Old System mode tabs: add fourth Date View tab.
v153RenderModeTabs=function(){
  const mode=v153EnsureOldSystem().mode;

  return `<div class="v153-os-tabs">
    <button class="v153-os-tab ${mode==='system'?'active':''}" onclick="App.v153SetOldSystemMode('system')">System</button>
    <button class="v153-os-tab ${mode==='view'?'active':''}" onclick="App.v153SetOldSystemMode('view')">View</button>
    <button class="v153-os-tab ${mode==='date'?'active':''}" onclick="App.v153SetOldSystemMode('date')">Date View</button>
    <button class="v153-os-tab ${mode==='stats'?'active':''}" onclick="App.v153SetOldSystemMode('stats')">Stats</button>
  </div>`;
};

// FINAL Old System renderer: route the fourth mode.
const v173RenderOldSystemBase=renderOldSystem;
renderOldSystem=function(){
  const os=v153EnsureOldSystem();

  if(os.mode!=='date'){
    return v173RenderOldSystemBase();
  }

  return `<div class="v153-old-system">
    <div class="v153-os-head">
      <div>
        <div class="section-label">OLD SYSTEM</div>
        <h1 style="margin:4px 0 7px">Old System</h1>
        <div class="v153-os-sub">Your original category-conversion system, kept completely separate from MediaFlow's main scheduler. Date View lets you replay only a chosen History period.</div>
      </div>
    </div>
    ${v153RenderModeTabs()}
    ${v173RenderDateViewMode()}
  </div>`;
};

// FINAL mode setter accepts date mode.
const v173SetOldSystemModeBase=v153SetMode;
v153SetMode=function(mode){
  const next=String(mode||'');
  if(next==='date'){
    const os=v153EnsureOldSystem();
    os.mode='date';
    os.modifiedAt=Date.now();
    saveState();
    render();
    return;
  }
  return v173SetOldSystemModeBase(next);
};

App.v153SetOldSystemMode=v153SetMode;

Object.assign(App,{
  v173SetOldSystemDate,
  v173ClearOldSystemDates
});

/* ============================================================
   THEMES — 3 new adaptive cover collections
   ============================================================ */

for(const mode of ['recommended-only','onthisday-only','source-picker']){
  V162_THEME_MODES.add(mode);
}

V162_ROTATION_INDEX['recommended-only']=0;
V162_ROTATION_INDEX['onthisday-only']=0;
V162_ROTATION_INDEX['source-picker']=0;

function v173NormalizeThemeCollectionConfig(raw,kind){
  const src=(raw&&typeof raw==='object')?raw:{};

  if(kind==='picker'){
    return {
      intervalSec:v162ClampInterval(src.intervalSec),
      selectedKeys:[...new Set(
        (Array.isArray(src.selectedKeys)?src.selectedKeys:['recommended'])
          .map(String)
          .filter(Boolean)
      )],
      modifiedAt:Number(src.modifiedAt)||0
    };
  }

  return {
    intervalSec:v162ClampInterval(src.intervalSec),
    modifiedAt:Number(src.modifiedAt)||0
  };
}

const v173EnsureThemeSettingsObjectBase=v162EnsureThemeSettingsObject;
v162EnsureThemeSettingsObject=function(settings){
  const target=v173EnsureThemeSettingsObjectBase(settings);

  target.v173RecommendedTheme=v173NormalizeThemeCollectionConfig(
    target.v173RecommendedTheme,
    'simple'
  );
  target.v173OnThisDayTheme=v173NormalizeThemeCollectionConfig(
    target.v173OnThisDayTheme,
    'simple'
  );
  target.v173SourcePickerTheme=v173NormalizeThemeCollectionConfig(
    target.v173SourcePickerTheme,
    'picker'
  );

  return target;
};

v162EnsureThemeSettings();

function v173RecommendedThemeSources(){
  const rec=v160RecommendedCoverSource();
  return rec?[rec]:[];
}

function v173OnThisDayThemeSources(){
  return v159OnThisDayThemeSources();
}

function v173PickerSourceKey(source){
  if(String(source?.source)==='recommended')return 'recommended';

  const id=String(source?.libraryId||'');
  if(id)return `otd:${id}`;

  return `otd-url:${String(source?.url||'')}`;
}

function v173PickerAvailableSources(){
  const rows=[];
  const seen=new Set();

  const add=source=>{
    if(!source)return;
    const key=v173PickerSourceKey(source);
    if(!key||seen.has(key))return;
    seen.add(key);
    rows.push({key,source});
  };

  add(v160RecommendedCoverSource());
  for(const source of v159OnThisDayThemeSources())add(source);

  return rows;
}

function v173SelectedPickerSources(){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const selected=new Set(cfg.selectedKeys.map(String));

  return v173PickerAvailableSources()
    .filter(row=>selected.has(row.key))
    .map(row=>row.source);
}

function v173RotatedSourceRows(mode,rows){
  if(!rows.length)return [];

  const index=(
    (Number(V162_ROTATION_INDEX[mode])||0)%rows.length+
    rows.length
  )%rows.length;

  const first=rows[index];
  return [first,...rows.filter((_,i)=>i!==index)];
}

const v173ThemeSourcesBase=v162ThemeSources;
v162ThemeSources=function(){
  const mode=v162ThemeMode();

  if(mode==='recommended-only'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173RecommendedThemeSources()
    );
  }

  if(mode==='onthisday-only'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173OnThisDayThemeSources()
    );
  }

  if(mode==='source-picker'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173SelectedPickerSources()
    );
  }

  return v173ThemeSourcesBase();
};

// These three collections are still direct recommendation/OTD adaptive themes,
// so keep the expressive Dynamic palette rather than the softer Library/Image
// collection palette.
const v173SoftPaletteBase=v162SoftPalette;
v162SoftPalette=function(themeData,appearance){
  const mode=v162ThemeMode();

  if(
    mode==='recommended-only'||
    mode==='onthisday-only'||
    mode==='source-picker'
  ){
    return v159CoverPalette(themeData,appearance);
  }

  return v173SoftPaletteBase(themeData,appearance);
};

function v173ThemeIntervalForMode(mode){
  const s=v162EnsureThemeSettings();

  if(mode==='recommended-only'){
    return v162ClampInterval(s.v173RecommendedTheme.intervalSec);
  }
  if(mode==='onthisday-only'){
    return v162ClampInterval(s.v173OnThisDayTheme.intervalSec);
  }
  if(mode==='source-picker'){
    return v162ClampInterval(s.v173SourcePickerTheme.intervalSec);
  }

  return 30;
}

function v173RowsForMode(mode){
  if(mode==='recommended-only')return v173RecommendedThemeSources();
  if(mode==='onthisday-only')return v173OnThisDayThemeSources();
  if(mode==='source-picker')return v173SelectedPickerSources();
  return [];
}

// FINAL collection timer: existing Library/Image behavior is preserved;
// v173 collections use their own interval and refresh even with one current
// source so changing recommendations/date context can be detected.
const v173EnsureRotationTimerBase=v162EnsureRotationTimer;
v162EnsureRotationTimer=function(reset=false){
  const mode=v162ThemeMode();
  const isV173=[
    'recommended-only',
    'onthisday-only',
    'source-picker'
  ].includes(mode);

  if(!isV173){
    return v173EnsureRotationTimerBase(reset);
  }

  if(reset||mode!==V162_ROTATION_MODE){
    v162StopRotation();
  }

  if(V162_ROTATION_TIMER)return;

  V162_ROTATION_MODE=mode;
  const delay=v173ThemeIntervalForMode(mode)*1000;

  V162_ROTATION_TIMER=setTimeout(()=>{
    V162_ROTATION_TIMER=null;

    if(v162ThemeMode()!==mode){
      v162EnsureRotationTimer(true);
      return;
    }

    const rows=v173RowsForMode(mode);

    if(rows.length>1){
      V162_ROTATION_INDEX[mode]=
        ((Number(V162_ROTATION_INDEX[mode])||0)+1)%rows.length;
    }else{
      V162_ROTATION_INDEX[mode]=0;
    }

    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(false);
  },delay);
};

function v173SetThemeInterval(mode,value){
  const s=v162EnsureThemeSettings();
  const sec=v162ClampInterval(value);
  let cfg=null;

  if(mode==='recommended-only')cfg=s.v173RecommendedTheme;
  else if(mode==='onthisday-only')cfg=s.v173OnThisDayTheme;
  else if(mode==='source-picker')cfg=s.v173SourcePickerTheme;
  else return;

  cfg.intervalSec=sec;
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX[mode]=0;

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
  v146ScheduleDynamicTheme();
}

function v173TogglePickerSource(key,checked){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const k=String(key||'');
  if(!k)return;

  const set=new Set(cfg.selectedKeys.map(String));
  if(checked)set.add(k);
  else set.delete(k);

  cfg.selectedKeys=[...set];
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX['source-picker']=0;

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
  v146ScheduleDynamicTheme();
}

function v173PickerListHtml(){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const selected=new Set(cfg.selectedKeys.map(String));
  const rows=v173PickerAvailableSources();

  if(!rows.length){
    return `<div class="v173-source-picker-empty">
      There is currently no recommended-title cover or On This Day cover available. The selected fallback theme stays active until a source becomes available.
    </div>`;
  }

  return `<div class="v173-source-picker-list">${
    rows.map(({key,source})=>{
      const checked=selected.has(key);
      const kind=source.source==='recommended'
        ?'Current MediaFlow recommendation'
        :'On This Day';

      return `<div class="v173-source-picker-row">
        <img src="${escapeHtml(source.url)}" alt="" loading="lazy"
          onerror="this.style.visibility='hidden'">
        <div class="v173-source-picker-copy">
          <b>${escapeHtml(String(source.label||'Cover source'))}</b>
          <small>${escapeHtml(kind)}</small>
        </div>
        <label>
          <input type="checkbox" ${checked?'checked':''}
            onchange="App.v173TogglePickerSource('${escapeHtml(key)}',this.checked)">
          Rotate
        </label>
      </div>`;
    }).join('')
  }</div>`;
}

const v173CollectionPanelHtmlBase=v162CollectionPanelHtml;
v162CollectionPanelHtml=function(mode){
  const s=v162EnsureThemeSettings();

  if(mode==='recommended-only'){
    const rec=v160RecommendedCoverSource();

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Recommended Title Cover Theme</div>
          <div class="hint">Uses only the current title recommended by MediaFlow. On This Day covers are never used by this collection.</div>
        </div>
        <span class="v162-cover-theme-badge">Recommendation only</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate / refresh every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173RecommendedTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('recommended-only',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        The interval controls how often MediaFlow re-checks the active recommendation. If the recommended title changes, the next refresh can switch the theme to its cover.
      </div>

      ${rec
        ?`<div class="v162-theme-status"><span>${escapeHtml(rec.label)}</span></div>`
        :`<div class="v162-theme-empty">No current recommended title with a usable cover.</div>`}

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing recommended-title theme…</span></div>
    </div>`;
  }

  if(mode==='onthisday-only'){
    const rows=v173OnThisDayThemeSources();

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">On This Day Cover Theme</div>
          <div class="hint">Uses only titles available in On This Day. MediaFlow recommendations are never used by this collection.</div>
        </div>
        <span class="v162-cover-theme-badge">On This Day only</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173OnThisDayTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('onthisday-only',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        ${rows.length.toLocaleString()} usable On This Day cover${rows.length===1?'':'s'} currently available. Multiple covers rotate sequentially on the interval above.
      </div>

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing On This Day theme…</span></div>
    </div>`;
  }

  if(mode==='source-picker'){
    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Recommendation + On This Day Picks</div>
          <div class="hint">Choose exactly which currently available recommendation / On This Day cover sources are allowed into this rotation.</div>
        </div>
        <span class="v162-cover-theme-badge">Choose sources</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173SourcePickerTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('source-picker',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        “Recommended” is a live slot: when selected, it follows MediaFlow's current recommendation. On This Day selections refer to the currently available titles shown below.
      </div>

      ${v173PickerListHtml()}

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing selected cover rotation…</span></div>
    </div>`;
  }

  return v173CollectionPanelHtmlBase(mode);
};

// FINAL collection selector action.
const v173SetThemeCollectionBase=App.setThemeCollection;
App.setThemeCollection=function(kind){
  const k=String(kind||'');
  const map={
    'recommended-cover':'recommended-only',
    'on-this-day-cover':'onthisday-only',
    'recommendation-day-picker':'source-picker'
  };

  if(map[k]){
    S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
    S.settings.dynamicCoverTheme=true;
    S.settings.v162ThemeCollection=map[k];

    V162_ROTATION_INDEX[map[k]]=0;
    v162StopRotation();

    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(true);
    return;
  }

  return v173SetThemeCollectionBase.call(this,k);
};

// FINAL Settings selector includes the three new collections.
const v173RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v173RenderSettingsBase();
  const s=v162EnsureThemeSettings();
  const mode=v162ThemeMode();

  const current=s.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);

  let collection='mediaflow';

  if(s.dynamicCoverTheme){
    collection=
      mode==='library'?'library-cover':
      mode==='image'?'image-url':
      mode==='recommended-only'?'recommended-cover':
      mode==='onthisday-only'?'on-this-day-cover':
      mode==='source-picker'?'recommendation-day-picker':
      'dynamic';
  }else{
    collection=isFull?'fullstyle':isPlatform?'platform':'mediaflow';
  }

  const selector=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
    <option value="recommended-cover" ${collection==='recommended-cover'?'selected':''}>Recommended Title Covers</option>
    <option value="on-this-day-cover" ${collection==='on-this-day-cover'?'selected':''}>On This Day Covers</option>
    <option value="recommendation-day-picker" ${collection==='recommendation-day-picker'?'selected':''}>Recommendation + On This Day Picks</option>
    <option value="library-cover" ${collection==='library-cover'?'selected':''}>Library Cover Themes</option>
    <option value="image-url" ${collection==='image-url'?'selected':''}>Image URL Themes</option>
  </select>`;

  h=h.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    selector
  );

  return h;
};

Object.assign(App,{
  v173SetThemeInterval,
  v173TogglePickerSource
});

/* ============================================================
   v173 persistence / merge / Sync Now / backups
   ============================================================ */

const v173PersistSettingsBase=persistSettings;
persistSettings=function(){
  v162EnsureThemeSettings();
  return v173PersistSettingsBase.apply(this,arguments);
};

const v173SnapshotBase=snapshot;
snapshot=function(){
  v162EnsureThemeSettings();
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);

  const x=v173SnapshotBase();

  x.orderPlan=v173Clone(S.orderPlan,{});
  x.oldSystem=v173Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,173);

  return x;
};

const v173ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v173ApplyStateBase.apply(this,arguments);

  S.orderPlan=v138NormalizeOrderPlan(d?.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  v162EnsureThemeSettings();

  V162_ROTATION_INDEX['recommended-only']=0;
  V162_ROTATION_INDEX['onthisday-only']=0;
  V162_ROTATION_INDEX['source-picker']=0;
  v162StopRotation();

  return result;
};

function v173ChooseModifiedConfig(a,b,normalizer,kind){
  const aa=normalizer(a,kind);
  const bb=normalizer(b,kind);

  return (Number(aa.modifiedAt)||0)>=(Number(bb.modifiedAt)||0)
    ?aa
    :bb;
}

const v173MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v173MergeStatesBase(a,b)||{};

  // Order plan is still chosen by the existing modifiedAt merge. Normalize the
  // final choice so pagination preference survives old/new devices.
  out.orderPlan=v138NormalizeOrderPlan(
    out.orderPlan,
    out.library||S.library,
    out.categories||S.categories
  );

  // Old System's existing modifiedAt merge remains authoritative; the final
  // normalizer now also preserves Date View fields/mode.
  out.oldSystem=v153NormalizeOldSystem(out.oldSystem);

  out.settings=v162EnsureThemeSettingsObject(out.settings||{});

  const choose=(key,kind)=>{
    const ac=a?.settings?.[key];
    const bc=b?.settings?.[key];

    out.settings[key]=v173ChooseModifiedConfig(
      ac,
      bc,
      v173NormalizeThemeCollectionConfig,
      kind
    );
  };

  choose('v173RecommendedTheme','simple');
  choose('v173OnThisDayTheme','simple');
  choose('v173SourcePickerTheme','picker');

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    173
  );

  return out;
};

const v173StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const base=v173StateCompletenessBase(state);
  const missing=[...(base?.missing||[])];

  if(!state?.orderPlan||typeof state.orderPlan!=='object'){
    missing.push('Personal Order');
  }
  if(!state?.oldSystem||typeof state.oldSystem!=='object'){
    missing.push('Old System');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

const v173VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v173VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudOrder=v138NormalizeOrderPlan(
    cloudState?.orderPlan,
    cloudState?.library||[],
    cloudState?.categories||[]
  );
  const wantedOrder=v138NormalizeOrderPlan(
    expected?.orderPlan,
    expected?.library||[],
    expected?.categories||[]
  );

  if(
    !!cloudOrder.paginateOrderedTitles!==
    !!wantedOrder.paginateOrderedTitles
  ){
    problems.push('Order pagination preference');
  }

  const cloudOld=v153NormalizeOldSystem(cloudState?.oldSystem);
  const wantedOld=v153NormalizeOldSystem(expected?.oldSystem);

  for(const key of ['mode','dateFrom','dateTo','modifiedAt']){
    if(String(cloudOld[key]??'')!==String(wantedOld[key]??'')){
      problems.push('Old System Date View');
      break;
    }
  }

  const cloudSettings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wantedSettings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  for(const key of [
    'v162ThemeCollection',
    'v173RecommendedTheme',
    'v173OnThisDayTheme',
    'v173SourcePickerTheme'
  ]){
    if(
      JSON.stringify(cloudSettings[key])!==
      JSON.stringify(wantedSettings[key])
    ){
      problems.push(`v173 Theme collection: ${key}`);
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// Full Backup / Automatic Backup / JSON import-export.
const v173BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v162EnsureThemeSettings();
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);

  const payload=v173BuildFullBackupBase();

  payload.backupSchemaVersion=V173_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.orderPlan=v173Clone(S.orderPlan,{});
  payload.oldSystem=v173Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V173_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v173 backup. Includes Order edit/pagination preference, Old System Date View range, three new recommendation/On This Day adaptive theme collections and their rotation settings/source selections, category recovery/default identity, advanced media-service import routing/exclusions, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v173BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v173BackupManifestBase(state,extras);
  const settings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );
  const os=v153NormalizeOldSystem(state?.oldSystem);
  const order=v138NormalizeOrderPlan(
    state?.orderPlan,
    state?.library||[],
    state?.categories||[]
  );

  manifest.schemaVersion=V173_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    orderDirectEditing:true,
    orderPaginationPreference:true,
    oldSystemDateView:true,
    oldSystemDateRange:true,
    recommendedOnlyCoverTheme:true,
    onThisDayOnlyCoverTheme:true,
    recommendationOnThisDayPickerTheme:true,
    v173ThemeRotationIntervals:true,
    v173SelectedThemeSources:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    selectedRecommendationOnThisDaySources:
      settings.v173SourcePickerTheme.selectedKeys.length,
    orderPaginationEnabled:order.paginateOrderedTitles?1:0,
    oldSystemDateRangeActive:(os.dateFrom||os.dateTo)?1:0
  });

  return manifest;
};

// v152 Automatic Backup resolves final v148BuildFullBackup() at call time, so
// every v173 field above is automatically included.



/* ============================================================
   MediaFlow v174 — Edit Recommended Title From Dashboard
   ------------------------------------------------------------
   When Exact Title Recommendations is active and MediaFlow has picked a
   Library title, the Dashboard now exposes Edit directly beside that
   recommendation. It reuses the normal Library editor; there is no duplicate
   editor/state path.
   ============================================================ */

function v174RecommendedLibraryItem(){
  const t=S.currentTask;
  if(!t?.title || !S.settings?.exactTitleRecommendations)return null;

  if(t.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(t.libraryId)
    );
    if(byId)return byId;
  }

  return v50FindLibraryItem(t.libraryId,t.title);
}

function v174EditRecommendedTitle(){
  const item=v174RecommendedLibraryItem();

  if(!item?.id){
    showToast('This recommended title is not available in your Library.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v174EditRecommendedTitle
});

// FINAL Dashboard wrapper. This runs after the existing v50 cover-aware
// recommendation renderer, so both rich-cover and plain recommendation states
// receive the same Edit action.
const v174RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v174RenderDashboardBase();
  const t=S.currentTask;

  if(
    !t?.title ||
    !S.settings?.exactTitleRecommendations ||
    !v174RecommendedLibraryItem()?.id
  ){
    return h;
  }

  const editButton=`<button type="button"
    class="btn btn-sm btn-ghost v174-recommended-edit"
    onclick="App.v174EditRecommendedTitle()"
    title="Edit this recommended Library title">
    Edit
  </button>`;

  // Cover-aware v50 recommendation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<b>[^<]*<\/b><\/div><\/div>)/;
  if(richPattern.test(h)){
    h=h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${editButton}</div>`
    );
    return h;
  }

  // Plain recommendation when the Library title has no cover.
  const plain=`<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>`;
  if(h.includes(plain)){
    h=h.replace(
      plain,
      `<div class="v174-recommended-title-row">${plain}${editButton}</div>`
    );
  }

  return h;
};

// If the user edits the recommended title's name from the reused Library
// editor, keep the active task label aligned with that Library item.
const v174SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const wasRecommended=
    !!id &&
    !!S.currentTask &&
    String(S.currentTask.libraryId||'')===String(id);

  const result=v174SaveLibraryModalBase.apply(this,arguments);

  if(wasRecommended){
    const item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
    if(item){
      S.currentTask.title=cleanTitle(item.title);
      persistTask();
    }
  }

  return result;
};

// No new persistent user data is introduced in v174. The edit action writes
// through the existing Library persistence pipeline, which is already included
// in cloud state, Sync Now verification, Full Backup, Automatic Backup and JSON
// backup import/export.

const v174BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v174BuildFullBackupBase();
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v174 backup. Dashboard recommended-title editing reuses the normal Library data path, so edited recommendation title metadata is preserved through the existing cloud, Sync Now, Full Backup, Automatic Backup and JSON backup pipelines.';
  }

  return payload;
};



