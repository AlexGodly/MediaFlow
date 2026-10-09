/* ---------- Dashboard controls beside the recommended title ---------- */

const v180RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v180RenderDashboardBase();
  const task=S.currentTask;

  if(
    !task?.title ||
    !S.settings?.exactTitleRecommendations
  ){
    return h;
  }

  const history=v180EnsureRecommendationHistory(task);
  const rerolls=Math.max(0,history.length-1);

  const controls=`<div class="v180-rec-actions">
    <button type="button"
      class="btn btn-sm"
      onclick="App.v180RerollRecommendedTitle()"
      title="Keep this category task and show the next MediaFlow-recommended title">
      Reroll title
    </button>

    <button type="button"
      class="btn btn-sm btn-ghost"
      onclick="App.v180OpenRerollHistory()"
      title="Show every title MediaFlow recommended for this current task">
      Rerolls history
      <span class="v180-reroll-count">${rerolls}</span>
    </button>
  </div>`;

  // v174 already adds Edit beside both cover-rich and plain recommendations.
  // Append v180 controls after that Edit button, still inside the same row.
  const editPattern=/(<button type="button"\s+class="btn btn-sm btn-ghost v174-recommended-edit"[\s\S]*?<\/button>)/;

  if(editPattern.test(h)){
    return h.replace(
      editPattern,
      `$1${controls}`
    );
  }

  // Safety fallback for an unexpected older dashboard representation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<\/div><\/div>)/;
  if(richPattern.test(h)){
    return h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${controls}</div>`
    );
  }

  return h;
};

