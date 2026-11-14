/* ---------- Ordered-title pagination amount ------------------- */

const v175RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v175RenderOrderBase();
  const p=v138EnsureOrderPlan();

  const controls=`<div class="v175-order-pagination-settings">
    <label class="v173-order-pagination-toggle">
      <span>Paginate ordered titles</span>
      <button type="button"
        class="toggle ${p.paginateOrderedTitles?'on':''}"
        onclick="event.preventDefault();App.v173ToggleOrderPagination()"
        aria-label="Toggle ordered-title pagination"></button>
      <span>${p.paginateOrderedTitles?`${v175OrderPageSize().toLocaleString()}/page`:'Off'}</span>
    </label>

    <label class="v175-page-size-control">
      <span>Ordered titles per page</span>
      <input type="number" min="1" max="${V175_MAX_PAGE_SIZE}" step="1"
        value="${v175OrderPageSize()}"
        onchange="App.v175SetOrderPageSize(this.value)"
        aria-label="Ordered titles per page">
    </label>
  </div>`;

  h=h.replace(
    /<label class="v173-order-pagination-toggle">[\s\S]*?<\/label>/,
    controls
  );

  return h;
};

// Update v173 toggle implementation so its feedback uses the configured size.
v173ToggleOrderPagination=function(){
  const p=v138EnsureOrderPlan();
  p.paginateOrderedTitles=!p.paginateOrderedTitles;

  const ui=v173OrderUI();
  ui.v173AllPage=0;
  ui.v173CategoryPages={};

  v138TouchOrderPlan();
  render();

  showToast(
    p.paginateOrderedTitles
      ?`Ordered-title pagination enabled · ${v175OrderPageSize().toLocaleString()} per page`
      :'Ordered-title pagination disabled'
  );
};
App.v173ToggleOrderPagination=v173ToggleOrderPagination;

