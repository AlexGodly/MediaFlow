/* ============================================================
   MediaFlow v224 — Recommended Title Action Bar
   ------------------------------------------------------------
   Edit / Reroll title / Rerolls history are visually grouped under
   the recommended title and receive clear icons.
   ============================================================ */
const V224_ICON_EDIT=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
const V224_ICON_REROLL=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-5V2"/><path d="M20 7a8 8 0 1 0 1.5 8"/></svg>`;
const V224_ICON_HISTORY=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l4 2"/></svg>`;

const v224RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v224RenderDashboardBase.apply(this,arguments);
  const task=S.currentTask;
  if(!task?.title||!S.settings?.exactTitleRecommendations)return h;

  h=h.replace(
    /<button type="button"\s+class="btn btn-sm btn-ghost v174-recommended-edit"[\s\S]*?<\/button>/,
    `<button type="button" class="btn btn-sm btn-ghost v174-recommended-edit v224-rec-action" onclick="App.v174EditRecommendedTitle()" title="Edit this recommended Library title">${V224_ICON_EDIT}<span>Edit</span></button>`
  );

  const history=v180EnsureRecommendationHistory(task);
  const rerolls=Math.max(0,history.length-1);
  const controls=`<div class="v180-rec-actions v224-rec-actions">
    <button type="button" class="btn btn-sm v224-rec-action" onclick="App.v180RerollRecommendedTitle()" title="Keep this category task and show the next MediaFlow-recommended title">${V224_ICON_REROLL}<span>Reroll title</span></button>
    <button type="button" class="btn btn-sm btn-ghost v224-rec-action" onclick="App.v180OpenRerollHistory()" title="Show every title MediaFlow recommended for this current task">${V224_ICON_HISTORY}<span>Rerolls history</span><span class="v180-reroll-count">${rerolls}</span></button>
  </div>`;
  h=h.replace(/<div class="v180-rec-actions">[\s\S]*?<\/div>/,controls);
  return h;
};

MediaFlowRuntime.version=V224_RUNTIME_VERSION;
