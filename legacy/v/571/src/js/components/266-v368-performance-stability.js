/* MediaFlow v368 — Low-end performance pass (no schema or visual redesign).
 * The existing v156 light Library index already tracks Library replacement,
 * length and V53_LIB.libraryToken. Reuse it for Collection title lookup: the
 * older v274 -> v270 -> v241 path built a second, expensive full-text index
 * just to fetch a single title by id.
 *
 * Render-scoped queue normalization: the canonical normalizers still run
 * for all mutations and whenever a new render begins. During one synchronous
 * render, repeated read-only calls can use the already normalized objects.
 * The scope always exits in finally; no stale cross-event data is retained.
 */
const V368_RELEASE=368;
const V368_STATS={lookups:0,framePlanReuses:0,frameCollectionReuses:0,frames:0};

// Collection views (progress, cover collage and queue previews) already rely
// on the same title identity as v156 / v241. An O(1) lookup does not alter
// title objects or how updates are saved; index invalidation stays with v156.
const v368CollectionLibraryBase=v274LibraryItem;
v274LibraryItem=function(id){
  if(id==null||id==='')return null;
  try{
    const item=v156EnsureOrderIndexes().libraryById.get(String(id));
    V368_STATS.lookups++;
    return item||null;
  }catch(err){return v368CollectionLibraryBase.apply(this,arguments);}
};

let V368_RENDER_SCOPE=0;
let V368_PLAN_REF=null;
let V368_COLLECTION_REF=null;
const v368EnsureOrderBase=v287EnsureOrderExtensions;
v287EnsureOrderExtensions=function(){
  // Outside a synchronous render, always keep the canonical normalization.
  // This includes editing, moving, importing and deleting queue entries.
  if(V368_RENDER_SCOPE&&V368_PLAN_REF&&V368_PLAN_REF===S.orderPlan){
    V368_STATS.framePlanReuses++;
    return V368_PLAN_REF;
  }
  const result=v368EnsureOrderBase.apply(this,arguments);
  if(V368_RENDER_SCOPE)V368_PLAN_REF=result;
  return result;
};
const v368EnsureCollectionsBase=v274EnsureCollections;
v274EnsureCollections=function(){
  // Preserve original semantics for writes: Collection actions work outside
  // this scope. Guard a render against a Collection array replacement.
  if(V368_RENDER_SCOPE&&V368_COLLECTION_REF&&V368_COLLECTION_REF===S.collections){
    V368_STATS.frameCollectionReuses++;
    return V368_COLLECTION_REF;
  }
  const result=v368EnsureCollectionsBase.apply(this,arguments);
  if(V368_RENDER_SCOPE)V368_COLLECTION_REF=result;
  return result;
};
function v368WithinRender(callback){
  const outer=V368_RENDER_SCOPE===0;
  V368_RENDER_SCOPE++;
  if(outer){V368_PLAN_REF=null;V368_COLLECTION_REF=null;V368_STATS.frames++;}
  try{return callback();}
  finally{
    V368_RENDER_SCOPE--;
    if(!V368_RENDER_SCOPE){V368_PLAN_REF=null;V368_COLLECTION_REF=null;}
  }
}
// RenderOrder returns HTML synchronously. Both Lists and Tabs use the same
// canonical handlers and output strings, without extra post-render DOM work.
const v368RenderOrderBase=renderOrder;
renderOrder=function(){
  const self=this,args=arguments;
  return v368WithinRender(()=>v368RenderOrderBase.apply(self,args));
};
// Fast Tabs mode swaps only its panel, not the whole page. Those renderers
// also benefit from this scoped normalization on 30k–50k title libraries.
const v368TabsBase=v345CategoryTabs;
v345CategoryTabs=function(){
  const self=this,args=arguments;
  return v368WithinRender(()=>v368TabsBase.apply(self,args));
};
const v368QueuePanelBase=v345CollectionQueuePanel;
v345CollectionQueuePanel=function(){
  const self=this,args=arguments;
  return v368WithinRender(()=>v368QueuePanelBase.apply(self,args));
};

window.MediaFlowV368={version:V368_RELEASE,getDiagnostics(){return {...V368_STATS};},features:[
  'Shared low-cost indexed Collection title lookup',
  'Render-scoped Personal Order queue normalization',
  'Avoid duplicate Collection normalizations during one render',
  'Linear-time queued-token membership repair',
  'Existing UI, persistence, XP and cloud formats preserved'
]};
MediaFlowRuntime.version=V368_RELEASE;
