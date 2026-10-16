/* ============================================================
   MediaFlow v181
   - Classic / Dynamic Library experience
   - Two new Library display modes: Cover Only / Cover + Title
   - Global click-any-title-cover details popup + quick detail editing
   - One default Logging method (Last Progress recommended/default)
   - Unlimited per-surface cover sizing from Settings
   ============================================================ */

const V181_BACKUP_SCHEMA_VERSION=18;

const V181_LIBRARY_DEFAULT={
  mode:'classic',
  categoryOrder:[],
  hiddenCategoryIds:[],
  statusOrder:['active','paused','completed','dropped','planned'],
  activeCategoryId:'',
  activeStatus:'active',
  modifiedAt:0
};

const V181_LOGGING_DEFAULT={
  defaultMode:'progress',
  modifiedAt:0
};

const V181_COVER_SIZE_DEFAULTS={
  library:100,
  order:100,
  recommended:100,
  rating:100,
  onThisDayFirst:100,
  onThisDayList:100,
  logging:100,
  history:100,
  rerollHistory:100,
  modifiedAt:0
};

const V181_COVER_LABELS={
  library:'Library covers',
  order:'Ordered titles',
  recommended:'Recommended title',
  rating:'Rating Queue title',
  onThisDayFirst:'First On This Day cover',
  onThisDayList:'On This Day list covers',
  logging:'Logging / Batch Log results',
  history:'History / timeline title covers',
  rerollHistory:'Rerolls history covers'
};

function v181UniqueStrings(values){
  const out=[];
  const seen=new Set();

  for(const value of (Array.isArray(values)?values:[])){
    const key=String(value||'');
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(key);
  }

  return out;
}

function v181NormalizeLibrarySettings(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cats=Array.isArray(categories)?categories:[];
  const validIds=new Set(cats.filter(Boolean).map(c=>String(c.id||'')).filter(Boolean));

  let categoryOrder=v181UniqueStrings(src.categoryOrder)
    .filter(id=>validIds.has(id));

  for(const cat of cats){
    const id=String(cat?.id||'');
    if(id&&!categoryOrder.includes(id))categoryOrder.push(id);
  }

  const hiddenCategoryIds=v181UniqueStrings(src.hiddenCategoryIds)
    .filter(id=>validIds.has(id));

  const validStatuses=['active','paused','completed','dropped','planned'];
  let statusOrder=v181UniqueStrings(src.statusOrder)
    .filter(x=>validStatuses.includes(x));

  for(const status of validStatuses){
    if(!statusOrder.includes(status))statusOrder.push(status);
  }

  const visible=categoryOrder.filter(id=>!hiddenCategoryIds.includes(id));
  const requestedCat=String(src.activeCategoryId||'');
  const activeCategoryId=visible.includes(requestedCat)
    ?requestedCat
    :(visible[0]||categoryOrder[0]||'');

  const requestedStatus=String(src.activeStatus||'');
  const activeStatus=statusOrder.includes(requestedStatus)
    ?requestedStatus
    :'active';

  return {
    mode:src.mode==='dynamic'?'dynamic':'classic',
    categoryOrder,
    hiddenCategoryIds,
    statusOrder,
    activeCategoryId,
    activeStatus,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v181EnsureLibrarySettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v181Library=v181NormalizeLibrarySettings(
    settings.v181Library,
    S.categories
  );
  return settings.v181Library;
}

function v181NormalizeLogging(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    defaultMode:src.defaultMode==='amount'?'amount':'progress',
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v181EnsureLogging(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v181Logging=v181NormalizeLogging(settings.v181Logging);
  return settings.v181Logging;
}

function v181ClampCoverSize(value,fallback=100){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0){
    return Math.max(10,Number(fallback)||100);
  }

  // Intentionally NO upper clamp in v181.
  return Math.max(10,Math.round(n*100)/100);
}

function v181NormalizeCoverSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const out={};

  for(const key of Object.keys(V181_COVER_SIZE_DEFAULTS)){
    if(key==='modifiedAt')continue;
    out[key]=v181ClampCoverSize(
      src[key],
      V181_COVER_SIZE_DEFAULTS[key]
    );
  }

  out.modifiedAt=Math.max(0,Number(src.modifiedAt)||0);
  return out;
}

function v181EnsureCoverSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};

  const normalized=v181NormalizeCoverSizes(
    settings.v181CoverSizes
  );

  // First-time migration from v177's Library / Order scale settings.
  if(!settings.v181CoverSizes){
    const old=settings.v177CoverSizes||{};
    normalized.library=v181ClampCoverSize(
      old.library,
      normalized.library
    );
    normalized.order=v181ClampCoverSize(
      old.order,
      normalized.order
    );
  }

  settings.v181CoverSizes=normalized;
  return normalized;
}

v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

