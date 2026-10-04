/* ============================================================
   MediaFlow v177 — Adjustable Library & Order Cover Size
   ============================================================ */

const V177_BACKUP_SCHEMA_VERSION=14;
const V177_COVER_SIZE_DEFAULTS={
  library:100,
  order:100,
  modifiedAt:0
};

function v177ClampCoverSize(value,fallback=100){
  const n=Math.round(Number(value));
  if(!Number.isFinite(n)){
    return Math.max(50,Math.min(180,Math.round(Number(fallback)||100)));
  }
  return Math.max(50,Math.min(180,n));
}

function v177NormalizeCoverSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};

  return {
    library:v177ClampCoverSize(
      src.library,
      V177_COVER_SIZE_DEFAULTS.library
    ),
    order:v177ClampCoverSize(
      src.order,
      V177_COVER_SIZE_DEFAULTS.order
    ),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v177EnsureCoverSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v177CoverSizes=v177NormalizeCoverSizes(
    settings.v177CoverSizes
  );
  return settings.v177CoverSizes;
}

function v177CoverSize(kind){
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return kind==='order'?cfg.order:cfg.library;
}

function v177ScaleValue(kind){
  return (v177CoverSize(kind)/100).toFixed(2);
}

function v177CoverSliderHtml(kind,label){
  const value=v177CoverSize(kind);
  const safeKind=kind==='order'?'order':'library';

  return `<label class="v177-cover-size-control">
    <span>${escapeHtml(label)}</span>
    <input type="range"
      min="50"
      max="180"
      step="5"
      value="${value}"
      oninput="App.v177PreviewCoverSize('${safeKind}',this.value)"
      onchange="App.v177SetCoverSize('${safeKind}',this.value)"
      aria-label="${escapeHtml(label)}">
    <span id="v177-${safeKind}-cover-value"
      class="v177-cover-size-value">${value}%</span>
  </label>`;
}

function v177PreviewCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const pct=v177ClampCoverSize(value,100);
  const scale=(pct/100).toFixed(2);

  const scope=document.querySelector(
    `[data-v177-cover-scope="${safeKind}"]`
  );

  if(scope){
    scope.style.setProperty(
      safeKind==='order'
        ?'--v177-order-scale'
        :'--v177-library-scale',
      scale
    );
  }

  const label=document.getElementById(
    `v177-${safeKind}-cover-value`
  );
  if(label)label.textContent=`${pct}%`;
}

function v177SetCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=v177ClampCoverSize(value,100);
  cfg.modifiedAt=Date.now();

  persistSettings();

  // Keep the live preview instant; no heavy Library rerender is required just
  // to move the slider. A normal navigation/render will read the saved value.
  v177PreviewCoverSize(safeKind,cfg[safeKind]);
}

v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

Object.assign(App,{
  v177PreviewCoverSize,
  v177SetCoverSize
});

/* ---------- Library slider ----------------------------------- */

const v177RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v177RenderLibraryBase();
  const slider=v177CoverSliderHtml(
    'library',
    'Cover size'
  );

  const pageControl=v175PageSizeControlHtml(
    'library',
    'Titles per page'
  );

  if(h.includes(pageControl)){
    h=h.replace(
      pageControl,
      pageControl+slider
    );
  }else{
    // Fallback: place it next to the priority filter if a future build changes
    // the page-size control's exact markup.
    h=h.replace(
      /(<select onchange="App\.setLibFilter\('libPriority', this\.value\)">[\s\S]*?<\/select>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-library-cover-scope"
    data-v177-cover-scope="library"
    style="--v177-library-scale:${v177ScaleValue('library')}">
      ${h}
    </div>`;
};

/* ---------- Order slider ------------------------------------- */

const v177RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v177RenderOrderBase();

  const slider=`<div class="v177-order-cover-tools">
    ${v177CoverSliderHtml('order','Cover size')}
  </div>`;

  if(h.includes('class="v175-order-pagination-settings"')){
    h=h.replace(
      /(<div class="v175-order-pagination-settings">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }else{
    h=h.replace(
      /(<div class="v138-order-switch">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-order-cover-scope"
    data-v177-cover-scope="order"
    style="--v177-order-scale:${v177ScaleValue('order')}">
      ${h}
    </div>`;
};

