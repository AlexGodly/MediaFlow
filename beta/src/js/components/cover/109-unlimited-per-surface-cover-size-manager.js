/* ============================================================
   Unlimited per-surface Cover Size Manager
   ============================================================ */

function v181CoverSize(kind){
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v181ClampCoverSize(
    cfg[kind],
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );
}

function v181CoverScale(kind){
  return v181CoverSize(kind)/100;
}

function v181ApplyCoverVars(){
  const root=document.documentElement;
  const map={
    library:'--v181-cover-library',
    order:'--v181-cover-order',
    recommended:'--v181-cover-recommended',
    rating:'--v181-cover-rating',
    onThisDayFirst:'--v181-cover-otd-first',
    onThisDayList:'--v181-cover-otd-list',
    logging:'--v181-cover-logging',
    history:'--v181-cover-history',
    rerollHistory:'--v181-cover-reroll-history'
  };

  for(const [key,varName] of Object.entries(map)){
    root.style.setProperty(
      varName,
      String(v181CoverScale(key))
    );
  }

  // v177 Library / Order layout columns still use these local variables.
  document.querySelectorAll('[data-v177-cover-scope="library"]').forEach(el=>{
    el.style.setProperty(
      '--v177-library-scale',
      String(v181CoverScale('library'))
    );
  });document.querySelectorAll('[data-v177-cover-scope="order"]').forEach(el=>{
    el.style.setProperty(
      '--v177-order-scale',
      String(v181CoverScale('order'))
    );
  });
}

function v181PreviewCoverSize(kind,value){
  const next=v181ClampCoverSize(
    value,
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );

  const root=document.documentElement;
  const varMap={
    library:'--v181-cover-library',
    order:'--v181-cover-order',
    recommended:'--v181-cover-recommended',
    rating:'--v181-cover-rating',
    onThisDayFirst:'--v181-cover-otd-first',
    onThisDayList:'--v181-cover-otd-list',
    logging:'--v181-cover-logging',
    history:'--v181-cover-history',
    rerollHistory:'--v181-cover-reroll-history'
  };

  if(varMap[kind]){
    root.style.setProperty(
      varMap[kind],
      String(next/100)
    );
  }

  if(kind==='library'){
    document.querySelectorAll('[data-v177-cover-scope="library"]').forEach(el=>{
      el.style.setProperty(
        '--v177-library-scale',
        String(next/100)
      );
    });
  }

  if(kind==='order'){
    document.querySelectorAll('[data-v177-cover-scope="order"]').forEach(el=>{
      el.style.setProperty(
        '--v177-order-scale',
        String(next/100)
      );
    });
  }

  const number=document.getElementById(`v181-cover-number-${kind}`);
  if(number&&document.activeElement!==number){
    number.value=String(next);
  }

  const range=document.getElementById(`v181-cover-range-${kind}`);
  if(range&&Number(next)<=400){
    range.value=String(next);
  }
}

function v181SetCoverSize(kind,value){
  if(!Object.prototype.hasOwnProperty.call(V181_COVER_SIZE_DEFAULTS,kind))return;
  if(kind==='modifiedAt')return;

  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  cfg[kind]=v181ClampCoverSize(
    value,
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );
  cfg.modifiedAt=Date.now();

  // Keep the legacy v177 object aligned for old backups/builds that read it.
  if(kind==='library'||kind==='order'){
    S.settings.v177CoverSizes=S.settings.v177CoverSizes||{};
    S.settings.v177CoverSizes[kind]=cfg[kind];
    S.settings.v177CoverSizes.modifiedAt=cfg.modifiedAt;
  }

  v181ApplyCoverVars();
  v181PreviewCoverSize(kind,cfg[kind]);
  persistSettings();
}

function v181ResetCoverSizes(){
  S.settings.v181CoverSizes=Object.assign(
    {},
    V181_COVER_SIZE_DEFAULTS,
    {modifiedAt:Date.now()}
  );

  S.settings.v177CoverSizes=Object.assign(
    {},
    S.settings.v177CoverSizes||{},
    {
      library:100,
      order:100,
      modifiedAt:Date.now()
    }
  );

  v181ApplyCoverVars();
  persistSettings();
  render();
  showToast('Cover sizes reset to defaults.');
}

function v181InlineCoverControl(kind,label='Cover size'){
  const value=v181CoverSize(kind);

  return `<label class="v181-inline-cover-control">
    <span>${escapeHtml(label)}</span>

    <input type="range"
      id="v181-cover-range-${kind}"
      min="25"
      max="400"
      step="5"
      value="${Math.min(400,value)}"
      oninput="App.v181PreviewCoverSize('${kind}',this.value)"
      onchange="App.v181SetCoverSize('${kind}',this.value)"
      aria-label="${escapeHtml(label)} slider">

    <input type="number"
      id="v181-cover-number-${kind}"
      min="10"
      step="5"
      value="${value}"
      oninput="App.v181PreviewCoverSize('${kind}',this.value)"
      onchange="App.v181SetCoverSize('${kind}',this.value)"
      aria-label="${escapeHtml(label)} percentage"
      title="No maximum size">
  </label>`;
}

// Make the existing Library / Order page controls use v181's unlimited setting.
v177ClampCoverSize=function(value,fallback=100){
  return v181ClampCoverSize(value,fallback);
};
v177CoverSize=function(kind){
  return v181CoverSize(kind==='order'?'order':'library');
};
v177ScaleValue=function(kind){
  return String(
    v181CoverScale(kind==='order'?'order':'library')
  );
};
v177CoverSliderHtml=function(kind,label){
  return v181InlineCoverControl(
    kind==='order'?'order':'library',
    label
  );
};
App.v177SetCoverSize=function(kind,value){
  v181SetCoverSize(
    kind==='order'?'order':'library',
    value
  );
};
App.v177PreviewCoverSize=function(kind,value){
  v181PreviewCoverSize(
    kind==='order'?'order':'library',
    value
  );
};

Object.assign(App,{
  v181PreviewCoverSize,
  v181SetCoverSize,
  v181ResetCoverSizes
});

v181ApplyCoverVars();

