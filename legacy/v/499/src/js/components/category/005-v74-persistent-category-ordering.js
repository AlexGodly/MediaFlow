/* MediaFlow v74 — persistent category ordering */
function v74SyncCategoryOrder(){
  S.categoryOrder=(S.categories||[]).map(c=>c.id);
  return S.categoryOrder;
}
function v74ApplyCategoryOrder(order){
  if(!Array.isArray(S.categories) || !Array.isArray(order) || !order.length) return;
  const rank=new Map(order.map((id,i)=>[id,i]));
  const original=new Map(S.categories.map((c,i)=>[c.id,i]));
  S.categories=S.categories.slice().sort((a,b)=>{
    const ar=rank.has(a.id)?rank.get(a.id):Number.MAX_SAFE_INTEGER;
    const br=rank.has(b.id)?rank.get(b.id):Number.MAX_SAFE_INTEGER;
    return ar-br || (original.get(a.id)||0)-(original.get(b.id)||0);
  });
  v74SyncCategoryOrder();
}

async function loadAll(){
 STORAGE_MODE='cloud'; let data=await rawGet(STATE_KEY);
 data=data||{};S.categories=data.categories||JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));v74ApplyCategoryOrder(data.categoryOrder||data.settings?.categoryOrder||[]);S.library=sanitizeLibrary(data.library||[]);S.orderPlan=v138NormalizeOrderPlan(data.orderPlan,S.library,S.categories);S.sessions=data.sessions||[];S.settings=Object.assign({},DEFAULT_SETTINGS,data.settings||{});
S.settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,data.settings?.backup||{});
S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,data.settings?.leveling||{});
S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,data.settings?.leveling?.unitXP||{});
S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,data.settings?.leveling?.rotationMultiplier||{});S.currentTask=data.currentTask||null;S.sessionActive=!!data.sessionActive;S.profilePicture=String(data.profilePicture||AUTH_USER?.user_metadata?.avatar_url||'').trim();S.activityLog=Array.isArray(data.activityLog)?data.activityLog:[];S.migrations=(data.migrations&&typeof data.migrations==='object')?data.migrations:{};v53InvalidateLibraryCache();v53InvalidateSessionCache();S.loading=false;
}

// All mutations funnel through these — each persists the FULL state in one write.

function persistCategories(){ v74SyncCategoryOrder(); S.settings=S.settings||{}; S.settings.categoryOrder=S.categoryOrder.slice(); return saveState(); }

function persistLibrary(){ v53InvalidateLibraryCache(); return saveState(); }

function persistSessions(){ return saveState(); }

function persistSettings(){ return saveState(); }

function persistTask(){ return saveState(); }

