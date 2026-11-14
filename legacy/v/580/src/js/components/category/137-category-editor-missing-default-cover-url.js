/* ---------- Category editor: Missing default cover URL ---------- */
const v200CategoryModalHtmlBase=categoryModalHtml;
categoryModalHtml=function(d){
  let h=v200CategoryModalHtmlBase.apply(this,arguments);
  const url=v200CategoryMissingCoverUrl(d||{});
  const field=`<div class="field v200-category-default-cover-field">
    <label class="field-label">Missing default cover URL</label>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 62px;gap:10px;align-items:center">
      <div>
        <input type="url" id="m-missing-default-cover" value="${escapeHtml(url)}" placeholder="https://example.com/default-cover.jpg" oninput="App.v200PreviewCategoryDefaultCover(this.value)">
        <small class="hint">Used only when a title in this category has no cover URL of its own. If blank, MediaFlow falls back to the category icon.</small>
      </div>
      <div id="v200-category-default-cover-preview" style="width:54px;height:78px;border:1px solid var(--border-soft);border-radius:9px;overflow:hidden;display:grid;place-items:center;background:var(--panel-raised)">${url?`<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;width:100%;height:100%;place-items:center">${v144CategoryIconHtml(d)}</span>`:v144CategoryIconHtml(d)}</div>
    </div>
  </div>`;
  const colorMarker='<div class="field">\n      <label class="field-label">Color</label>';
  if(h.includes(colorMarker))h=h.replace(colorMarker,field+'\n\n    '+colorMarker);
  else h=h.replace('<label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;">',field+'<label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;">');
  return h;
};

function v200PreviewCategoryDefaultCover(raw){
  const box=document.getElementById('v200-category-default-cover-preview');
  if(!box)return;
  const url=v200SafeCategoryCoverUrl(raw);
  const cat=S.modal?.data||{};
  box.innerHTML=url
    ?`<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;width:100%;height:100%;place-items:center">${v144CategoryIconHtml(cat)}</span>`
    :v144CategoryIconHtml(cat);
}
App.v200PreviewCategoryDefaultCover=v200PreviewCategoryDefaultCover;

