/* MediaFlow v201 source fragment
 * Modal rendering
 * Original HTML lines 9862-10164.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   MODALS

   ============================================================ */

function renderModal(){

  let el = document.getElementById('modal-root');

  if(!S.modal){ if(el) el.remove(); return; }
  // v77: there must only ever be one modal root. Replacing it prevents stacked popups.
  if(el) el.remove();

  const html = S.modal.type==='category' ? categoryModalHtml(S.modal.data)

    : S.modal.type==='session' ? sessionModalHtml(S.modal.data)

    : S.modal.type==='libraryDelete' ? libraryDeleteModalHtml(S.modal.data)

    : S.modal.type==='categoryDelete' ? categoryDeleteModalHtml(S.modal.data)

    : S.modal.type==='emptyLibrary' ? emptyLibraryModalHtml(S.modal.data)

    : S.modal.type==='priority' ? priorityModalHtml(S.modal.data)

    : S.modal.type==='libraryStatus' ? libraryStatusModalHtml(S.modal.data)

    : S.modal.type==='libraryCategory' ? libraryCategoryModalHtml(S.modal.data)

    : S.modal.type==='importConfirm' ? mfImportConfirmModalHtml(S.modal.data)
    : S.modal.type==='coverPicker' ? coverPickerModalHtml(S.modal.data)
    : libraryModalHtml(S.modal.data);

  const wrap = document.createElement('div');

  wrap.id = 'modal-root';

  wrap.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${html}</div></div>`;

  document.body.appendChild(wrap);

}

function libraryDeleteModalHtml(d){
  const title = cleanTitle(d?.title) || 'this title';
  const id = escapeHtml(d?.id || '');
  return `<div class="modal-title">Delete library title?</div>
    <div style="color:var(--text-dim); line-height:1.6; font-size:13px; margin-bottom:18px;">
      You are about to remove <b>${escapeHtml(title)}</b> from your Library.
      <br><br>Your existing history/session logs will remain.
      This action cannot be undone.
    </div>
    <div style="display:flex; justify-content:flex-end; gap:8px;">
      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.confirmDeleteLibrary('${id}')">Delete title</button>
    </div>`;
}

function categoryDeleteModalHtml(d){
  const name = String(d?.name || 'this category');
  const id = escapeHtml(d?.id || '');
  const icon = d?.iconUrl?v144CategoryIconHtml(d):escapeHtml(d?.icon||'🗂️');
  const assigned = S.library.filter(item=>item.categoryId===d?.id).length;
  return `<div class="category-delete-modal">
    <div class="v79-delete-head">
      <div class="v79-delete-icon">${icon}</div>
      <div><div class="modal-title" style="margin:0 0 4px;">Delete category?</div><div class="hint">MediaFlow category management</div></div>
    </div>
    <div style="color:var(--text-dim);line-height:1.65;font-size:13px;">
      You are about to permanently delete <b style="color:var(--text);">${escapeHtml(name)}</b>.
      ${assigned?`<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--panel-raised);border:1px solid var(--border-soft);"><b>${assigned}</b> Library title${assigned===1?' is':'s are'} currently assigned to this category.</div>`:''}
      <div class="v79-delete-warning"><b style="color:var(--text);">This cannot be undone.</b><br>Past history is kept, but entries that reference this category may show it as removed.</div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="App.confirmDeleteCategory('${id}',this)">Delete category</button>
    </div>
  </div>`;
}

function emptyLibraryModalHtml(d){
  const count=Number(d?.count)||0;
  return `<div class="empty-library-modal">
    <div class="empty-library-icon">${ICONS.library}</div>
    <div class="modal-title" style="margin-bottom:7px;">Empty your Library</div>
    <div class="empty-library-sub">You have <b>${count.toLocaleString()}</b> ${count===1?'title':'titles'} in your Library. Choose what should happen to your current task.</div>
    <div class="empty-library-options">
      <button class="empty-library-option" onclick="App.confirmEmptyLibrary('keep')">
        <span class="empty-option-icon">📚</span><span><b>Remove titles, keep current task</b><small>Delete all Library entries. Your history stays untouched and the current recommendation remains.</small></span>
      </button>
      <button class="empty-library-option danger-option" onclick="App.confirmEmptyLibrary('clearTask')">
        <span class="empty-option-icon">🗑️</span><span><b>Remove titles and clear current task</b><small>Delete all Library entries and also clear the currently assigned task.</small></span>
      </button>
    </div>
    <div class="empty-library-warning"><span>!</span><div><b>This cannot be undone</b><br><small>Consumption history and statistics will remain. Only the Library entries are removed.</small></div></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
}

function categoryModalHtml(d){

  const isNew = !d.id;

   return `

    <div class="modal-title">${isNew?'Add category':'Edit category'}</div>

    <div class="field"><label class="field-label">Name</label><input type="text" id="m-name" value="${escapeHtml(d.name||'')}"></div>

    <div class="field"><label class="field-label">Icon</label>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">

        ${ICON_CHOICES.map(ic=>`<div onclick="App.pickIcon('${ic}')" style="cursor:pointer; padding:6px 9px; border-radius:8px; border:1px solid ${d.icon===ic?'var(--flow)':'var(--border-soft)'}; background:var(--panel-raised); font-size:16px;" data-icon-swatch>${ic}</div>`).join('')}

      </div>

      <input type="hidden" id="m-icon" value="${d.icon||'✨'}">

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Type</label>

        <select id="m-type"><option value="video" ${d.type==='video'?'selected':''}>Video</option><option value="reading" ${d.type==='reading'?'selected':''}>Reading</option></select>

      </div>

      <div class="field"><label class="field-label">Unit</label>

        <select id="m-unit">${Object.keys(UNITS).map(u=>`<option value="${u}" ${d.unit===u?'selected':''}>${UNITS[u].label}</option>`).join('')}</select>

      </div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Suggested target</label><input type="number" id="m-target" min="1" value="${d.target||1}"></div>

      <div class="field"><label class="field-label">Weight (1–5)</label><input type="number" id="m-weight" min="1" max="5" value="${d.weight||3}"></div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Minutes per unit</label><input type="number" id="m-mpu" min="1" value="${d.minutesPerUnit||20}"></div>

      <div class="field" style="display:flex; align-items:flex-end; gap:16px; padding-bottom:9px;">

        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="m-seasonal" ${d.seasonal?'checked':''}> Time-sensitive (seasonal)</label>

      </div>

    </div>

    <div class="field"><label class="field-label">Color</label>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">

        ${COLOR_CHOICES.map(c=>`<div onclick="App.pickColor('${c}')" style="cursor:pointer; width:26px; height:26px; border-radius:7px; background:${c}; border:2px solid ${d.color===c?'#fff':'transparent'};" data-color-swatch></div>`).join('')}

      </div>

      <input type="hidden" id="m-color" value="${d.color||COLOR_CHOICES[0]}">

    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;"><input type="checkbox" id="m-enabled" ${d.enabled!==false?'checked':''}> Enabled</label>

    <div class="modal-actions">

      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>

      <button type="button" class="btn btn-primary" onclick="App.saveCategoryModal('${d.id||''}',this)">Save category</button>

    </div>

  `;

}

function sessionModalHtml(d){

  const cat = getCategory(d.categoryId);

   return `

    <div class="modal-title">Edit logged entry</div>

    <div class="field"><label class="field-label">Category</label>

      <select id="s-category">${S.categories.map(c=>`<option value="${c.id}" ${d.categoryId===c.id?'selected':''}>${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Date</label><input type="text" id="s-date" value="${d.date}" placeholder="YYYY-MM-DD"></div>

      <div class="field"><label class="field-label">Status</label>

        <select id="s-status">

          ${['complete','partial','over','skipped','logged'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}

        </select>

      </div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Target amount</label><input type="number" min="0" id="s-target" value="${d.targetAmount}"></div>

      <div class="field"><label class="field-label">Actual amount</label><input type="number" min="0" id="s-actual" value="${d.actualAmount}"></div>

    </div>

    <div class="field"><label class="field-label">Minutes</label><input type="number" min="0" id="s-minutes" value="${d.minutes}"></div>

    <div class="field"><label class="field-label">Note</label><input type="text" id="s-note" value="${escapeHtml(d.note||'')}"></div>

    <small class="hint">Editing history updates the scheduler's picture of your recent consumption immediately — recency, saturation and streaks are recalculated from this log the next time a task is generated.</small>

    <div class="modal-actions">

      <button class="btn btn-danger" style="margin-right:auto;" onclick="App.deleteSessionFromModal('${d.id}')">Delete entry</button>

      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>

      <button class="btn btn-primary" onclick="App.saveSessionModal('${d.id}')">Save</button>

    </div>

  `;

}

function libraryModalHtml(d){

  const isNew = !d.id;

   return `

    <div class="modal-title">${isNew?'Add title':'Edit title'}</div>

    <div class="field"><label class="field-label">Title</label><input type="text" id="l-title" value="${escapeHtml(d.title||'')}"></div>

    <div class="field"><label class="field-label">Category</label>

      <select id="l-category">${S.categories.map(c=>`<option value="${c.id}" ${d.categoryId===c.id?'selected':''}>${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Progress</label><input type="number" id="l-progress" min="0" value="${d.progress||0}"></div>

      <div class="field"><label class="field-label">Total (optional)</label><input type="number" id="l-total" min="0" value="${d.total||''}"></div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Status</label>

        <select id="l-status">${['planned','active','paused','completed','dropped'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${v199StatusLabel(s)}</option>`).join('')}</select>

      </div>

      <div class="field"><label class="field-label">Priority</label>

        <select id="l-priority">${['low','medium','high'].map(s=>`<option value="${s}" ${d.priority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select>

      </div>

    </div>

    <div class="field"><label class="field-label">Estimated minutes (optional)</label><input type="number" id="l-est" min="0" value="${d.estimatedMinutes||''}"></div>

    <div class="field"><label class="field-label">Tags (comma separated)</label><input type="text" id="l-tags" value="${(d.tags||[]).join(', ')}"></div>

    <div class="modal-actions" style="justify-content:space-between;">

      <div>
        ${!isNew ? `<button type="button" class="btn btn-danger" onclick="event.preventDefault(); event.stopPropagation(); App.deleteLibraryItem('${d.id}')">Delete title</button>` : ''}
      </div>

      <div style="display:flex; gap:8px;">
        <button type="button" class="btn btn-ghost" onclick="event.preventDefault(); App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="event.preventDefault(); App.saveLibraryModal('${d.id||''}')">Save title</button>
      </div>

    </div>

  `;

}
