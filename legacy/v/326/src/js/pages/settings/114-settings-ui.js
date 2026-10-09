/* ============================================================
   Settings UI
   ============================================================ */

function v181DynamicLibrarySettingsHtml(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  const categoryRows=cfg.categoryOrder.map((id,index)=>{
    const cat=S.categories.find(
      c=>String(c.id)===String(id)
    );
    if(!cat)return '';

    const visible=!cfg.hiddenCategoryIds.includes(String(id));

    return `<div class="v181-config-row">
      <div class="v181-config-copy">
        <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
        <small>
          Dynamic row position ${index+1} ·
          ${visible?'shown':'hidden'}
        </small>
      </div>

      <div class="v181-order-buttons">
        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===0?'disabled':''}
          onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',-1)">
          ↑
        </button>

        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===cfg.categoryOrder.length-1?'disabled':''}
          onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',1)">
          ↓
        </button>
      </div>

      <button type="button"
        class="toggle ${visible?'on':''}"
        onclick="App.v181ToggleDynamicCategory('${escapeHtml(String(id))}',${visible?'false':'true'})"
        aria-label="${visible?'Hide':'Show'} ${escapeHtml(cat.name)} in Dynamic Library">
      </button>
    </div>`;
  }).join('');

  const statusRows=cfg.statusOrder.map((status,index)=>{
    const label=v199StatusLabel(status);

    return `<div class="v181-config-row">
      <div class="v181-config-copy">
        <b>${escapeHtml(label)}</b>
        <small>Status row position ${index+1}</small>
      </div>

      <div class="v181-order-buttons">
        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===0?'disabled':''}
          onclick="App.v181MoveDynamicStatus('${status}',-1)">
          ↑
        </button>

        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===cfg.statusOrder.length-1?'disabled':''}
          onclick="App.v181MoveDynamicStatus('${status}',1)">
          ↓
        </button>
      </div>

      <span></span>
    </div>`;
  }).join('');

  return `<div class="section-label">LIBRARY EXPERIENCE</div>

  <div class="card v181-settings-card">
    <div class="v181-setting-head">
      <div>
        <b>Default Library mode</b>
        <div class="hint">
          Current keeps the existing Library workflow. Dynamic uses category → status navigation.
        </div>
      </div>

      ${v181LibraryModeSwitchHtml()}
    </div>

    <div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>

    <div class="hint">
      Reorder the category row independently from the normal category order.
      Toggle a category off to hide it from Dynamic Library. New categories are
      automatically added to this configuration.
    </div>

    <div class="v181-config-list">
      ${categoryRows}
    </div>

    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">
      <button type="button"
        class="btn btn-sm"
        onclick="App.openCategoryModal()">
        + Add category
      </button>

      <button type="button"
        class="btn btn-sm btn-ghost"
        onclick="App.v181ResetDynamicLibrary()">
        Reset Dynamic Library layout
      </button>
    </div>

    <div class="section-label" style="margin-top:16px;">DYNAMIC STATUS ROW</div>

    <div class="hint">
      Arrange the order used under every Dynamic Library category.
      Default: Watching → On Hold → Completed → Dropped → Plan to Watch.
    </div>

    <div class="v181-config-list">
      ${statusRows}
    </div>
  </div>`;
}

function v181LoggingSettingsHtml(){
  const cfg=v181EnsureLogging(S.settings||DEFAULT_SETTINGS);

  return `<div class="section-label">DEFAULT LOGGING METHOD</div>

  <div class="card v181-settings-card">
    <div class="field" style="margin:0;">
      <label class="field-label">When a Logging page first opens</label>

      <select onchange="App.v181SetDefaultLoggingMode(this.value)">
        <option value="progress" ${cfg.defaultMode==='progress'?'selected':''}>
          Last progress — Recommended
        </option>

        <option value="amount" ${cfg.defaultMode==='amount'?'selected':''}>
          Amount consumed
        </option>
      </select>

      <small class="hint">
        This only chooses the initial mode when Dashboard Logging or Batch Log
        first opens. You can still switch modes inside either page; that
        temporary switch does not change this Settings default.
      </small>
    </div>
  </div>`;
}

function v181CoverSettingsHtml(){
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const rows=Object.keys(V181_COVER_LABELS).map(kind=>`
    <div class="v181-cover-setting">
      <label>${escapeHtml(V181_COVER_LABELS[kind])}</label>

      <div class="v181-cover-inputs">
        <input type="range"
          id="v181-cover-range-${kind}"
          min="25"
          max="400"
          step="5"
          value="${Math.min(400,cfg[kind])}"
          oninput="App.v181PreviewCoverSize('${kind}',this.value)"
          onchange="App.v181SetCoverSize('${kind}',this.value)">

        <input type="number"
          id="v181-cover-number-${kind}"
          min="10"
          step="5"
          value="${cfg[kind]}"
          oninput="App.v181PreviewCoverSize('${kind}',this.value)"
          onchange="App.v181SetCoverSize('${kind}',this.value)"
          title="No maximum">
      </div>
    </div>
  `).join('');

  return `<div class="section-label">COVER SIZE ADJUSTMENT</div>

  <div class="card v181-settings-card">
    <div class="v181-setting-head">
      <div>
        <b>Cover sizes by location</b>
        <div class="hint">
          Configure every major title-cover surface independently.
        </div>
      </div>

      <button type="button"
        class="btn btn-sm btn-ghost"
        onclick="App.v181ResetCoverSizes()">
        Reset to default
      </button>
    </div>

    <div class="v181-cover-settings-grid">
      ${rows}
    </div>

    <div class="v181-cover-unlimited-note">
      The slider provides a practical 25–400% range. The numeric field has
      <b>no upper maximum</b>, so values above 400% are supported too.
      100% is the original default size for that surface.
    </div>
  </div>`;
}

const v181RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v181RenderSettingsBase();

  const sections=
    v181DynamicLibrarySettingsHtml()+
    v181LoggingSettingsHtml()+
    v181CoverSettingsHtml();

  const marker='<div class="section-label">🛠 LIBRARY INTEGRITY</div>';

  if(h.includes(marker)){
    h=h.replace(
      marker,
      sections+marker
    );
  }else{
    h=sections+h;
  }

  return h;
};

/* ============================================================
   Render hook — cover vars + global clickable cover discovery
   ============================================================ */

const v181RenderBase=render;
render=function(){
  const result=v181RenderBase.apply(this,arguments);

  v181ApplyCoverVars();

  setTimeout(()=>{
    v181MarkClickableCovers();
  },0);

  return result;
};

setTimeout(()=>{
  v181ApplyCoverVars();
  v181MarkClickableCovers();
},0);

