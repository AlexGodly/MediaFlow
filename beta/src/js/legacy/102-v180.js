/* ============================================================
   MediaFlow v180
   SAME-CATEGORY RECOMMENDED-TITLE REROLLS
   + TASK-LOCAL REROLL HISTORY
   + MULTI-TITLE SYSTEM RESPECT XP
   ============================================================ */

const V180_BACKUP_SCHEMA_VERSION=17;
const V180_RESPECT_XP_VERSION=180;

function v180HistoryEntry(item,index=0){
  return {
    libraryId:String(item?.id||''),
    title:cleanTitle(item?.title||''),
    shownAt:Date.now(),
    index:Math.max(0,Math.floor(Number(index)||0))
  };
}

function v180EnsureRecommendationHistory(task=S.currentTask){
  if(!task||!S.settings?.exactTitleRecommendations)return [];

  if(!Array.isArray(task.v180RecommendationHistory)){
    task.v180RecommendationHistory=[];
  }

  // Existing task from an older build: the title already on the task becomes
  // Recommendation #1 for this task.
  if(
    task.v180RecommendationHistory.length===0 &&
    (task.libraryId||task.title)
  ){
    const item=v50FindLibraryItem(task.libraryId,task.title);
    task.v180RecommendationHistory.push(
      v180HistoryEntry(
        item||{
          id:task.libraryId||'',
          title:task.title||''
        },
        0
      )
    );
  }

  // Normalize without destroying historical title text if the Library entry
  // was later removed.
  task.v180RecommendationHistory=
    task.v180RecommendationHistory
      .filter(x=>x&&typeof x==='object')
      .map((x,index)=>({
        libraryId:String(x.libraryId||''),
        title:cleanTitle(x.title||''),
        shownAt:Math.max(0,Number(x.shownAt)||0),
        index
      }));

  task.v180TitleRerolls=Math.max(
    0,
    task.v180RecommendationHistory.length-1
  );

  return task.v180RecommendationHistory;
}

function v180IsPerTitleUnit(task){
  const cat=getCategory(task?.categoryId||'');
  const unit=String(cat?.unit||task?.unit||'').toLowerCase();

  // These units represent separate Library titles, unlike episodes/chapters/
  // issues which normally belong to one series/title.
  return /(^|[^a-z])(movies?|films?|books?|titles?)([^a-z]|$)/i.test(unit);
}

function v180RespectSlotLimit(task){
  if(!S.settings?.exactTitleRecommendations)return 0;
  if(!task)return 0;

  if(v180IsPerTitleUnit(task)){
    return Math.max(
      1,
      Math.round(Number(task.targetMid)||1)
    );
  }

  // Episode/chapter/issue tasks still have one exact-title recommendation
  // opportunity, regardless of how many units the task asks the user to consume.
  return 1;
}

function v180RecommendationIdentity(entry){
  return {
    id:String(entry?.libraryId||''),
    title:v165NormalizedTitle(entry?.title||'')
  };
}

function v180ResolveHistoryItem(entry){
  if(!entry)return null;

  if(entry.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(entry.libraryId)
    );
    if(byId)return byId;
  }

  const key=v165NormalizedTitle(entry.title||'');
  return key
    ?(S.library||[]).find(
      item=>v165NormalizedTitle(item?.title||'')===key
    )||null
    :null;
}

function v180RecommendationCandidates(task=S.currentTask){
  if(!task)return [];

  const cat=getCategory(task.categoryId);
  let pool=(S.library||[]).filter(item=>
    item &&
    String(item.categoryId||'')===String(cat.id||'') &&
    item.status!=='completed' &&
    item.status!=='dropped'
  );

  if(!pool.length)return [];

  const seen=new Set(
    v180EnsureRecommendationHistory(task)
      .map(x=>String(x.libraryId||''))
      .filter(Boolean)
  );

  pool=pool.filter(item=>!seen.has(String(item.id||'')));
  if(!pool.length)return [];

  if(
    S.settings?.prioritizePersonalOrder &&
    Array.isArray(S.orderPlan?.titleIds)
  ){
    const rank=new Map(
      S.orderPlan.titleIds.map(
        (id,index)=>[String(id),index]
      )
    );

    pool.sort((a,b)=>{
      const ar=rank.has(String(a.id))
        ?rank.get(String(a.id))
        :Number.MAX_SAFE_INTEGER;
      const br=rank.has(String(b.id))
        ?rank.get(String(b.id))
        :Number.MAX_SAFE_INTEGER;

      if(ar!==br)return ar-br;
      return scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat);
    });

    return pool;
  }

  return pool.sort(
    (a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat)
  );
}

function v180RerollRecommendedTitle(){
  const task=S.currentTask;

  if(
    !task ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('Exact title recommendations are not active.');
    return;
  }

  v180EnsureRecommendationHistory(task);

  const next=v180RecommendationCandidates(task)[0];
  if(!next){
    showToast('No other eligible Library titles are available in this category.');
    return;
  }

  const history=task.v180RecommendationHistory;
  history.push(
    v180HistoryEntry(next,history.length)
  );

  task.libraryId=next.id;
  task.title=cleanTitle(next.title);
  task.v180TitleRerolls=history.length-1;
  task.v180RecommendationUpdatedAt=Date.now();

  // Deliberately DO NOT call v165RecordReroll().
  // This is a title reroll inside the SAME category task, not "Give me
  // something else". It never damages the no-Skip or first-category-pick
  // streaks by itself.
  persistTask();
  render();

  showToast(
    `Next recommended title · ${cleanTitle(next.title)}`
  );
}

function v180HistoryCoverHtml(entry){
  const item=v180ResolveHistoryItem(entry);
  const cat=getCategory(
    item?.categoryId||S.currentTask?.categoryId||''
  );
  const title=cleanTitle(item?.title||entry?.title||'');

  if(item?.coverUrl){
    return `<img class="v180-history-cover"
      src="${escapeHtml(item.coverUrl)}"
      alt="${escapeHtml(title)} cover"
      loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="v180-history-cover-ph" style="display:none">
        ${v144CategoryIconHtml(cat)}
      </div>`;
  }

  return `<div class="v180-history-cover-ph">
    ${v144CategoryIconHtml(cat)}
  </div>`;
}

function v180RerollHistoryHtml(){
  const task=S.currentTask;
  const history=v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const rerolls=Math.max(0,history.length-1);
  const cat=getCategory(task?.categoryId||'');

  const rows=history.map((entry,index)=>{
    const item=v180ResolveHistoryItem(entry);
    const title=cleanTitle(
      item?.title||entry.title||'Unavailable title'
    );
    const eligible=index<slotLimit;
    const current=
      String(task?.libraryId||'')===
      String(entry.libraryId||'') &&
      index===history.length-1;

    return `<div class="v180-history-row ${current?'current':''}">
      ${v180HistoryCoverHtml(entry)}

      <div class="v180-history-copy">
        <b>${escapeHtml(title)}</b>

        <div class="v180-history-meta">
          <span>Recommendation #${index+1}</span>

          ${
            index===0
              ?'<span>Initial pick</span>'
              :`<span>Reroll #${index}</span>`
          }

          <span class="v180-history-badge ${eligible?'eligible':'extra'}">
            ${
              eligible
                ?`Respect slot ${index+1}/${slotLimit}`
                :'Extra reroll'
            }
          </span>

          ${
            current
              ?'<span class="v180-history-badge current">Current</span>'
              :''
          }
        </div>
      </div>

      <div class="v180-history-actions">
        ${
          item?.id
            ?`<button type="button"
                class="btn btn-sm btn-ghost"
                onclick="App.v180EditHistoryTitle('${escapeHtml(String(item.id))}')">
                Edit
              </button>`
            :''
        }
      </div>
    </div>`;
  }).join('');

  const targetText=v180IsPerTitleUnit(task)
    ?`${slotLimit} title${slotLimit===1?'':'s'}`
    :'1 exact title';

  return `<div class="modal-overlay"
      id="v180-reroll-history"
      onclick="if(event.target===this)App.v180CloseRerollHistory()">

    <div class="modal v180-history-modal">
      <div class="v180-history-head">
        <div>
          <div class="modal-title" style="margin:0;padding:0;background:none;">
            Current rerolls
          </div>

          <div class="v180-history-summary">
            ${v144CategoryIconHtml(cat)}
            ${escapeHtml(cat?.name||'Task')} ·
            ${rerolls} title reroll${rerolls===1?'':'s'} ·
            ${history.length} recommendation${history.length===1?'':'s'} shown
          </div>
        </div>

        <button type="button"
          class="btn btn-sm btn-ghost"
          onclick="App.v180CloseRerollHistory()">
          Close
        </button>
      </div>

      <div class="v180-respect-explain">
        This task can earn exact-title Respect XP from the <b>first ${targetText}</b>
        MediaFlow recommends. You can reroll as much as you want without a reroll
        penalty. Extra recommendations stay available to watch, but a title shown
        after the task's Respect slots does not retroactively replace a missed
        earlier recommendation.
      </div>

      <div class="v180-history-list">
        ${rows||'<div class="hint">No recommendation history yet.</div>'}
      </div>
    </div>
  </div>`;
}

function v180OpenRerollHistory(){
  if(
    !S.currentTask ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('There is no current title-reroll history.');
    return;
  }

  v180EnsureRecommendationHistory(S.currentTask);
  document.getElementById('v180-reroll-history')?.remove();
  document.body.insertAdjacentHTML(
    'beforeend',
    v180RerollHistoryHtml()
  );
}

function v180CloseRerollHistory(){
  document.getElementById('v180-reroll-history')?.remove();
}

function v180EditHistoryTitle(id){
  v180CloseRerollHistory();

  if(!id)return;
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );

  if(!item){showToast('That Library title is no longer available.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v180RerollRecommendedTitle,
  v180OpenRerollHistory,
  v180CloseRerollHistory,
  v180EditHistoryTitle
});

/* ---------- Every NEW category task gets a fresh title history ---------- */

const v180GenerateTaskBase=generateTask;
generateTask=function(excludeIds){
  const task=v180GenerateTaskBase.apply(this,arguments);

  if(
    task &&
    S.settings?.exactTitleRecommendations &&
    (task.libraryId||task.title)
  ){
    task.v180RecommendationHistory=[];
    task.v180TitleRerolls=0;
    v180EnsureRecommendationHistory(task);
  }

  return task;
};

