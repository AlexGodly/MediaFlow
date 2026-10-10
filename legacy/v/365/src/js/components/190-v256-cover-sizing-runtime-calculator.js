/* ============================================================
   MediaFlow v256 — Cover Overlay Sizing + Dashboard Runtime Calculator
   --------------------------------------------------------------------------
   - Makes the cover progress bar use MediaFlow theme variables rather than a
     title/category color, so it stays readable across current themes.
   - Adds persistent per-overlay size controls for Status, Category, Rating and
     Progress in Covers / Covers+Titles for Normal and Dynamic Library.
   - Makes Stopwatch a collapsible Dashboard accordion.
   - Adds an independently show/hide Runtime Calculator directly under
     Stopwatch with collapsible header, chain-add and multi-row modes.
   - Runtime Calculator results can be used for logging minutes, matching the
     existing Stopwatch workflow.
   ============================================================ */
const V256_RUNTIME_VERSION=256;

/* -------------------------------------------------------------------------
   Library cover overlay sizing
   ------------------------------------------------------------------------- */
const V256_COVER_SIZE_DEFAULTS={status:100,category:100,rating:100,progress:100};

function v256ClampCoverSize(value){
  const n=Math.round(Number(value)||100);
  return Math.max(60,Math.min(180,n));
}

const v256NormalizeCoverOverlaySettingsBase=v254NormalizeCoverOverlaySettings;
v254NormalizeCoverOverlaySettings=function(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const out=v256NormalizeCoverOverlaySettingsBase(raw);
  const sizes=(src.sizes&&typeof src.sizes==='object')?src.sizes:{};
  out.sizes={
    status:v256ClampCoverSize(sizes.status),
    category:v256ClampCoverSize(sizes.category),
    rating:v256ClampCoverSize(sizes.rating),
    progress:v256ClampCoverSize(sizes.progress)
  };
  return out;
};

v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);

function v256SetCoverOverlaySize(key,value){
  if(!Object.prototype.hasOwnProperty.call(V256_COVER_SIZE_DEFAULTS,String(key)))return;
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  cfg.sizes=Object.assign({},V256_COVER_SIZE_DEFAULTS,cfg.sizes||{});
  cfg.sizes[key]=v256ClampCoverSize(value);
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v256PreviewCoverOverlaySize(key,value,input){
  if(!Object.prototype.hasOwnProperty.call(V256_COVER_SIZE_DEFAULTS,String(key)))return;
  const size=v256ClampCoverSize(value);
  if(input){
    const out=input.closest('.v256-cover-control')?.querySelector('[data-v256-size-value]');
    if(out)out.textContent=`${size}%`;
  }
  const prop=`--v256-${key}-scale`;
  document.querySelectorAll('.v254-cover-overlay-frame').forEach(el=>el.style.setProperty(prop,String(size/100)));
}

function v256CoverControlHtml(key,label,icon){
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  const on=!!cfg[key];
  const size=v256ClampCoverSize(cfg.sizes?.[key]);
  return `<div class="v256-cover-control">
    <button type="button"
      class="btn btn-sm v254-cover-overlay-toggle ${on?'active':''}"
      data-v225-icon="${escapeHtml(icon)}"
      aria-pressed="${on?'true':'false'}"
      title="${on?'Hide':'Show'} ${escapeHtml(label.toLowerCase())} on Library covers"
      onclick="App.v254ToggleCoverOverlay('${escapeHtml(key)}')">
      ${escapeHtml(label)} <span class="v254-cover-overlay-state">${on?'ON':'OFF'}</span>
    </button>
    <label class="v256-cover-size" title="Adjust ${escapeHtml(label.toLowerCase())} overlay size">
      <span>Size</span>
      <input type="range" min="60" max="180" step="5" value="${size}"
        aria-label="${escapeHtml(label)} overlay size"
        oninput="App.v256PreviewCoverOverlaySize('${escapeHtml(key)}',this.value,this)"
        onchange="App.v256SetCoverOverlaySize('${escapeHtml(key)}',this.value)">
      <output data-v256-size-value>${size}%</output>
    </label>
  </div>`;
}

v254CoverOverlayControlsHtml=function(){
  if(!v254IsCoverLibraryView())return '';
  return `<div class="v254-cover-overlay-controls v256-cover-overlay-controls" aria-label="Cover information visibility and sizing">
    <div class="v254-cover-overlay-label">
      <b>On cover</b>
      <span>Choose what appears over Covers and Covers+Titles, then adjust each overlay size.</span>
    </div>
    <div class="v254-cover-overlay-actions v256-cover-overlay-actions">
      ${v256CoverControlHtml('status','Status','watching')}
      ${v256CoverControlHtml('category','Category','category')}
      ${v256CoverControlHtml('rating','Rating','rating')}
      ${v256CoverControlHtml('progress','Progress','progressBar')}
    </div>
  </div>`;
};

const v256OverlayHtmlBase=v254OverlayHtml;
v254OverlayHtml=function(item){
  const html=v256OverlayHtmlBase.apply(this,arguments);
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  const sizes=Object.assign({},V256_COVER_SIZE_DEFAULTS,cfg.sizes||{});
  const style=[
    `--v256-status-scale:${v256ClampCoverSize(sizes.status)/100}`,
    `--v256-category-scale:${v256ClampCoverSize(sizes.category)/100}`,
    `--v256-rating-scale:${v256ClampCoverSize(sizes.rating)/100}`,
    `--v256-progress-scale:${v256ClampCoverSize(sizes.progress)/100}`
  ].join(';');
  return html.replace('class="v254-cover-overlay-frame"',`class="v254-cover-overlay-frame" style="${style}"`);
};

/* -------------------------------------------------------------------------
   Dashboard visibility setting: Runtime Calculator lives directly below the
   Stopwatch setting and is independently show/hide.
   ------------------------------------------------------------------------- */
const v256NormalizeDashboardSettingsBase=v192NormalizeDashboardSettings;
v192NormalizeDashboardSettings=function(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const out=v256NormalizeDashboardSettingsBase(raw);
  out.showRuntimeCalculator=src.showRuntimeCalculator!==false;
  return out;
};
DEFAULT_SETTINGS.v192Dashboard=v192NormalizeDashboardSettings(DEFAULT_SETTINGS.v192Dashboard);
v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);

const v256ToggleDashboardSectionBase=v192ToggleDashboardSection;
v192ToggleDashboardSection=function(key){
  if(key!=='showRuntimeCalculator')return v256ToggleDashboardSectionBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  cfg.showRuntimeCalculator=!cfg.showRuntimeCalculator;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(`Runtime Calculator ${cfg.showRuntimeCalculator?'shown':'hidden'} on Dashboard`);
};
App.v192ToggleDashboardSection=v192ToggleDashboardSection;

v192DashboardVisibilitySettingsHtml=function(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const row=(key,title,desc)=>`<div class="v192-dashboard-toggle-row"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(desc)}</div></div><button type="button" class="toggle ${cfg[key]!==false?'on':''}" onclick="App.v192ToggleDashboardSection('${key}')" aria-label="Toggle ${escapeHtml(title)}"></button></div>`;
  return `<div class="card v192-dashboard-settings-card">
    <div class="v192-dashboard-settings-head"><div><b>Dashboard sections</b><div class="hint">Choose which optional Dashboard sections MediaFlow shows. Hiding a section never deletes its Library, History or settings data.</div></div></div>
    <div class="v192-dashboard-toggle-list">
      ${row('showTodayBalance',"Today's Balance",'Show or hide the Today’s Balance category section.')}
      ${row('showOnThisDay','On This Day','Show or hide the On This Day activity section on Dashboard.')}
      ${row('showRatingQueue','Rate Your Library','Show or hide the unrated-title queue on Dashboard.')}
      ${row('showMissingCovers','Missing Covers','Show or hide the queue for Library titles that do not have a cover URL.')}
      ${row('showStopwatch','Stopwatch','Show or hide the Stopwatch card on Dashboard. Its current timer state is preserved while hidden.')}
      ${row('showRuntimeCalculator','Runtime Calculator','Show or hide the Runtime Calculator directly below Stopwatch. Calculator visibility is independent from Stopwatch.')}
    </div>
  </div>`;
};

/* -------------------------------------------------------------------------
   Shared Dashboard accordion behavior
   ------------------------------------------------------------------------- */
S.v256DashboardAccordions=S.v256DashboardAccordions||{stopwatch:false,runtimeCalculator:false};

function v256AccordionCollapsed(key){
  S.v256DashboardAccordions=S.v256DashboardAccordions||{};
  return S.v256DashboardAccordions[key]===true;
}

function v256ToggleDashboardAccordion(key){
  if(!['stopwatch','runtimeCalculator'].includes(String(key)))return;
  S.v256DashboardAccordions=S.v256DashboardAccordions||{};
  S.v256DashboardAccordions[key]=!S.v256DashboardAccordions[key];
  render();
}

function v256DecorateStopwatchAccordion(card){
  if(!card||card.querySelector(':scope > .v256-accordion-head'))return;
  const section=card.querySelector(':scope > .section-label');
  const collapsed=v256AccordionCollapsed('stopwatch');
  const body=document.createElement('div');
  body.className='v256-accordion-body';
  const children=[...card.childNodes];
  for(const node of children){
    if(node===section)continue;
    body.appendChild(node);
  }
  const head=document.createElement('div');
  head.className='v256-accordion-head';
  head.setAttribute('role','button');
  head.setAttribute('tabindex','0');
  head.setAttribute('aria-expanded',collapsed?'false':'true');
  head.setAttribute('onclick',"App.v256ToggleDashboardAccordion('stopwatch')");
  head.setAttribute('onkeydown',"if(event.key==='Enter'||event.key===' '){event.preventDefault();App.v256ToggleDashboardAccordion('stopwatch')}");
  head.innerHTML=`<div class="v256-accordion-heading"><div class="section-label">STOPWATCH</div><span>Track a runtime live or build a custom starting time.</span></div><button type="button" class="v256-accordion-toggle" data-v225-icon="stopwatch" data-v225-iconified="1" aria-label="${collapsed?'Expand':'Collapse'} Stopwatch" onclick="event.stopPropagation();App.v256ToggleDashboardAccordion('stopwatch')">${v225IconSvg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>')}</button>`;
  card.innerHTML='';
  card.classList.add('v256-accordion-card');
  if(collapsed)card.classList.add('is-collapsed');
  card.appendChild(head);
  card.appendChild(body);
}

/* -------------------------------------------------------------------------
   Runtime Calculator state + arithmetic
   ------------------------------------------------------------------------- */
function v256BlankTime(){return {h:0,m:0,s:0};}
function v256NormalizeTime(row){
  row=(row&&typeof row==='object')?row:{};
  return {
    h:Math.max(0,Math.min(99999,Math.floor(Number(row.h)||0))),
    m:Math.max(0,Math.min(59,Math.floor(Number(row.m)||0))),
    s:Math.max(0,Math.min(59,Math.floor(Number(row.s)||0)))
  };
}
function v256TimeToSeconds(row){const r=v256NormalizeTime(row);return r.h*3600+r.m*60+r.s;}
function v256SecondsToTime(total){
  const sec=Math.max(0,Math.floor(Number(total)||0));
  return {h:Math.floor(sec/3600),m:Math.floor(sec%3600/60),s:sec%60};
}
function v256FormatRuntime(total){
  const t=v256SecondsToTime(total);
  return `${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}`;
}
function v256RuntimeDefault(){
  return {
    mode:'chain',
    chain:[v256BlankTime(),v256BlankTime()],
    rows:[v256BlankTime(),v256BlankTime()],
    resultSeconds:0,
    hasResult:false,
    resultCount:0,
    carryCount:0,
    previousAccumulatorSeconds:0,
    previousAccumulatorCount:0
  };
}
function v256EnsureRuntimeState(){
  const current=(S.v256RuntimeCalculator&&typeof S.v256RuntimeCalculator==='object')?S.v256RuntimeCalculator:{};
  const base=v256RuntimeDefault();
  const chain=Array.isArray(current.chain)?current.chain.slice(0,2).map(v256NormalizeTime):base.chain;
  while(chain.length<2)chain.push(v256BlankTime());
  const rows=Array.isArray(current.rows)?current.rows.map(v256NormalizeTime):base.rows;
  while(rows.length<2)rows.push(v256BlankTime());
  S.v256RuntimeCalculator={
    mode:current.mode==='multi'?'multi':'chain',
    chain,
    rows,
    resultSeconds:Math.max(0,Math.floor(Number(current.resultSeconds)||0)),
    hasResult:current.hasResult===true,
    resultCount:Math.max(0,Math.floor(Number(current.resultCount)||0)),
    carryCount:Math.max(0,Math.floor(Number(current.carryCount)||0)),
    previousAccumulatorSeconds:Math.max(0,Math.floor(Number(current.previousAccumulatorSeconds)||0)),
    previousAccumulatorCount:Math.max(0,Math.floor(Number(current.previousAccumulatorCount)||0))
  };
  return S.v256RuntimeCalculator;
}

function v256UpdateRuntimeField(scope,index,unit,value){
  const st=v256EnsureRuntimeState();
  if(!['h','m','s'].includes(String(unit)))return;
  const max=unit==='h'?99999:59;
  const n=Math.max(0,Math.min(max,Math.floor(Number(value)||0)));
  if(scope==='chain'){
    if(index<0||index>1)return;
    st.chain[index][unit]=n;
  }else if(scope==='multi'){
    if(index<0||index>=st.rows.length)return;
    st.rows[index][unit]=n;
  }
}

function v256CalculateRuntime(){
  const st=v256EnsureRuntimeState();
  if(st.mode==='multi'){
    const values=st.rows.map(v256TimeToSeconds);
    const count=values.filter(v=>v>0).length;
    if(!count){showToast('Enter at least one runtime to calculate.');return;}
    st.resultSeconds=values.reduce((a,b)=>a+b,0);
    st.resultCount=count;
    st.hasResult=true;
    st.carryCount=0;
    st.previousAccumulatorSeconds=0;
    st.previousAccumulatorCount=0;
    render();
    return;
  }
  const a=v256TimeToSeconds(st.chain[0]);
  const b=v256TimeToSeconds(st.chain[1]);
  if(a<=0&&b<=0){showToast('Enter at least one runtime to calculate.');return;}
  const firstCount=st.carryCount>0?st.carryCount:(a>0?1:0);
  const secondCount=b>0?1:0;
  st.previousAccumulatorSeconds=a;
  st.previousAccumulatorCount=firstCount;
  st.resultSeconds=a+b;
  st.resultCount=firstCount+secondCount;
  st.hasResult=true;
  render();
}

function v256ContinueRuntimeResult(){
  const st=v256EnsureRuntimeState();
  if(!st.hasResult){showToast('Calculate a result first.');return;}
  st.mode='chain';
  st.chain=[v256SecondsToTime(st.resultSeconds),v256BlankTime()];
  st.carryCount=Math.max(1,st.resultCount||1);
  render();
  showToast(`${v256FormatRuntime(st.resultSeconds)} moved to Runtime 1. Add the next runtime.`);
}

function v256RestorePreviousRuntime(){
  const st=v256EnsureRuntimeState();
  if(!st.hasResult||st.previousAccumulatorSeconds<=0){showToast('No previous accumulated runtime is available yet.');return;}
  const prev=st.previousAccumulatorSeconds;
  const prevCount=Math.max(1,st.previousAccumulatorCount||1);
  st.mode='chain';
  st.chain=[v256SecondsToTime(prev),v256BlankTime()];
  st.resultSeconds=prev;
  st.resultCount=prevCount;
  st.carryCount=prevCount;
  st.hasResult=true;
  render();
  showToast(`Restored previous total ${v256FormatRuntime(prev)}.`);
}

function v256SetRuntimeMode(mode){
  const st=v256EnsureRuntimeState();
  const next=mode==='multi'?'multi':'chain';
  if(next===st.mode)return;
  if(next==='multi'){
    const seed=st.chain.map(v256NormalizeTime);
    st.rows=seed.some(x=>v256TimeToSeconds(x)>0)?seed:[v256BlankTime(),v256BlankTime()];
  }else if(st.rows.length){
    st.chain=[v256NormalizeTime(st.rows[0]),v256NormalizeTime(st.rows[1]||v256BlankTime())];
  }
  st.mode=next;
  render();
}

function v256AddRuntimeRow(){
  const st=v256EnsureRuntimeState();
  st.mode='multi';
  st.rows.push(v256BlankTime());
  render();
}
function v256RemoveRuntimeRow(index){
  const st=v256EnsureRuntimeState();
  if(st.rows.length<=2){showToast('Multi-row mode keeps at least two runtime rows.');return;}
  const i=Math.max(0,Math.min(st.rows.length-1,Number(index)||0));
  st.rows.splice(i,1);
  render();
}
function v256ClearRuntimeCalculator(){
  S.v256RuntimeCalculator=v256RuntimeDefault();
  render();
}
function v256RuntimeUseMinutes(){
  const st=v256EnsureRuntimeState();
  if(!st.hasResult){showToast('Calculate a runtime result first.');return;}
  S.logDraft=S.logDraft||{};
  S.logDraft.minutes=Math.max(0,Math.round(st.resultSeconds/60));
  render();
  showToast(`${S.logDraft.minutes} minutes copied to the current log.`);
}

function v256TimeInputsHtml(scope,index,row,label){
  const r=v256NormalizeTime(row);
  return `<div class="v256-runtime-row">
    <div class="v256-runtime-row-label">${escapeHtml(label)}</div>
    <div class="v256-runtime-time-fields">
      <label><span>Hours</span><input class="input" type="number" min="0" max="99999" step="1" value="${r.h}" oninput="App.v256UpdateRuntimeField('${scope}',${index},'h',this.value)"></label>
      <span class="v256-runtime-colon">:</span>
      <label><span>Minutes</span><input class="input" type="number" min="0" max="59" step="1" value="${r.m}" oninput="App.v256UpdateRuntimeField('${scope}',${index},'m',this.value)"></label>
      <span class="v256-runtime-colon">:</span>
      <label><span>Seconds</span><input class="input" type="number" min="0" max="59" step="1" value="${r.s}" oninput="App.v256UpdateRuntimeField('${scope}',${index},'s',this.value)"></label>
    </div>
    ${scope==='multi'?`<button type="button" class="btn btn-sm btn-ghost v256-runtime-remove" onclick="App.v256RemoveRuntimeRow(${index})" ${v256EnsureRuntimeState().rows.length<=2?'disabled':''}>Remove</button>`:''}
  </div>`;
}

function v256RuntimeResultHtml(st){
  const r=v256SecondsToTime(st.resultSeconds);
  return `<div class="v256-runtime-result ${st.hasResult?'has-result':''}">
    <div class="v256-runtime-result-head">
      <div><span>Result</span><b>${st.hasResult?v256FormatRuntime(st.resultSeconds):'00:00:00'}</b></div>
      <span class="v256-runtime-count">${st.hasResult?`${st.resultCount} runtime${st.resultCount===1?'':'s'} calculated`:'Waiting for calculation'}</span>
    </div>
    <div class="v256-runtime-result-fields" aria-label="Calculated runtime result">
      <div><span>Hours</span><output>${r.h}</output></div>
      <div><span>Minutes</span><output>${r.m}</output></div>
      <div><span>Seconds</span><output>${r.s}</output></div>
    </div>
  </div>`;
}

function v256RuntimeCalculatorHtml(){
  const st=v256EnsureRuntimeState();
  const collapsed=v256AccordionCollapsed('runtimeCalculator');
  const chain=st.mode==='chain';
  return `<div class="card v256-runtime-card v256-accordion-card ${collapsed?'is-collapsed':''}">
    <div class="v256-accordion-head" role="button" tabindex="0" aria-expanded="${collapsed?'false':'true'}" onclick="App.v256ToggleDashboardAccordion('runtimeCalculator')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.v256ToggleDashboardAccordion('runtimeCalculator')}">
      <div class="v256-accordion-heading"><div class="section-label">RUNTIME CALCULATOR</div><span>Add runtimes together, carry totals forward, or sum as many rows as you need.</span></div>
      <button type="button" class="v256-accordion-toggle" data-v225-icon="clock" data-v225-iconified="1" aria-label="${collapsed?'Expand':'Collapse'} Runtime Calculator" onclick="event.stopPropagation();App.v256ToggleDashboardAccordion('runtimeCalculator')">${v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</button>
    </div>
    <div class="v256-accordion-body">
      <div class="v256-runtime-mode-tabs" role="tablist" aria-label="Runtime Calculator mode">
        <button type="button" class="btn btn-sm ${chain?'btn-primary':''}" aria-pressed="${chain?'true':'false'}" onclick="App.v256SetRuntimeMode('chain')">Carry-forward</button>
        <button type="button" class="btn btn-sm ${!chain?'btn-primary':''}" aria-pressed="${!chain?'true':'false'}" onclick="App.v256SetRuntimeMode('multi')">Multi-row</button>
      </div>
      ${chain?`<div class="v256-runtime-chain">
          ${v256TimeInputsHtml('chain',0,st.chain[0],'Runtime 1')}
          <div class="v256-runtime-operator">+</div>
          ${v256TimeInputsHtml('chain',1,st.chain[1],'Runtime 2')}
        </div>`:`<div class="v256-runtime-multi">
          ${st.rows.map((row,index)=>`${index?'<div class="v256-runtime-operator">+</div>':''}${v256TimeInputsHtml('multi',index,row,`Runtime ${index+1}`)}`).join('')}
          <button type="button" class="btn btn-sm v256-add-runtime-row" onclick="App.v256AddRuntimeRow()">+ Add runtime row</button>
        </div>`}
      <div class="v256-runtime-equals">=</div>
      ${v256RuntimeResultHtml(st)}
      <div class="v256-runtime-actions">
        <button type="button" class="btn btn-primary" onclick="App.v256CalculateRuntime()">Calculate</button>
        ${chain?`<button type="button" class="btn" onclick="App.v256ContinueRuntimeResult()" ${st.hasResult?'':'disabled'}>Continue with result</button>
        <button type="button" class="btn btn-ghost" onclick="App.v256RestorePreviousRuntime()" ${(st.hasResult&&st.previousAccumulatorSeconds>0)?'':'disabled'} title="Restore the accumulated value that was Runtime 1 in the latest calculation">Previous total</button>`:''}
        ${S.logging?`<button type="button" class="btn" onclick="App.v256RuntimeUseMinutes()" ${st.hasResult?'':'disabled'}>Use for minutes</button>`:''}
        <button type="button" class="btn btn-ghost" onclick="App.v256ClearRuntimeCalculator()">Clear</button>
      </div>
      ${chain?`<div class="v256-runtime-help">After calculating, <b>Continue with result</b> moves the result into Runtime 1 and clears Runtime 2. <b>Previous total</b> restores the accumulator from before the latest addition.</div>`:`<div class="v256-runtime-help">Add or remove runtime rows, then calculate their combined duration. Only non-zero rows count toward the “runtimes calculated” total.</div>`}
    </div>
  </div>`;
}

/* Stopwatch is already responsible for placing Rate Your Library / Missing
   Covers through legacy wrappers. Insert Runtime Calculator immediately after
   the actual stopwatch card without disturbing those sections. */
const v256StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){
  const html=v256StopwatchHtmlBase.apply(this,arguments);
  const host=document.createElement('div');
  host.innerHTML=html;
  const sw=host.querySelector('.stopwatch-card');
  if(sw)v256DecorateStopwatchAccordion(sw);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showRuntimeCalculator!==false){
    const runtimeHtml=v256RuntimeCalculatorHtml();
    if(sw)sw.insertAdjacentHTML('afterend',runtimeHtml);
    else host.insertAdjacentHTML('afterbegin',runtimeHtml);
  }
  return host.innerHTML;
};

/* Explicit cloud verification for the new Dashboard visibility setting. */
const v256VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v256VerifyCloudStateBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  const cloudCfg=v192NormalizeDashboardSettings(cloudState?.settings?.v192Dashboard);
  const wantedCfg=v192NormalizeDashboardSettings(expected?.settings?.v192Dashboard);
  if(cloudCfg.showRuntimeCalculator!==wantedCfg.showRuntimeCalculator)problems.push('v256 Runtime Calculator Dashboard visibility');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

/* Keep backup/preset manifests explicit about the new persistent presentation
   settings. Calculator arithmetic state itself is intentionally session UI,
   like an in-progress logging draft, while visibility + overlay sizes persist. */
const v256BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v256BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    coverOverlaySizesV256:true,
    dashboardRuntimeCalculatorVisibilityV256:true
  });
  return preset;
};
const v256BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v256BuildFullBackupBase.apply(this,arguments);
  payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
    coverOverlaySizesV256:true,
    dashboardRuntimeCalculatorVisibilityV256:true
  });
  payload.backupManifest.note='Complete MediaFlow v256 backup. Adds persistent cover-overlay sizing and Runtime Calculator Dashboard visibility while preserving Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, Personal Order Export v4 and all v255 account data.';
  return payload;
};

Object.assign(App,{
  v256SetCoverOverlaySize,
  v256PreviewCoverOverlaySize,
  v256ToggleDashboardAccordion,
  v256UpdateRuntimeField,
  v256CalculateRuntime,
  v256ContinueRuntimeResult,
  v256RestorePreviousRuntime,
  v256SetRuntimeMode,
  v256AddRuntimeRow,
  v256RemoveRuntimeRow,
  v256ClearRuntimeCalculator,
  v256RuntimeUseMinutes,
  v256RuntimeState:()=>v256EnsureRuntimeState()
});

MediaFlowRuntime.version=V256_RUNTIME_VERSION;
