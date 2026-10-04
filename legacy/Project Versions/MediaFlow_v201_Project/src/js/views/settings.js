/* MediaFlow v201 source fragment
 * Settings view
 * Original HTML lines 9533-9861.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   VIEW: SETTINGS

   ============================================================ */

function cloneDefaults(value){ return JSON.parse(JSON.stringify(value)); }
function resetSettingsSection(section){
  if(section==='daily'){
    S.settings.dailyMinutes=DEFAULT_SETTINGS.dailyMinutes;
    S.settings.tasksPerDay=DEFAULT_SETTINGS.tasksPerDay;
    S.settings.intensity=DEFAULT_SETTINGS.intensity;
  }else if(section==='titles'){
    S.settings.exactTitleRecommendations=DEFAULT_SETTINGS.exactTitleRecommendations;
    S.settings.prioritizePersonalOrder=DEFAULT_SETTINGS.prioritizePersonalOrder;
  }else if(section==='scheduler'){
    ['neglectRate','neglectCap','repetitionPenalty','consecutivePenalty','saturationWeight','seasonalBonus','randomness','seasonalFreshCount','seasonalFreshAuto','seasonalFreshSyncMinutes','seasonalFreshLastSyncAt','seasonalFreshLastProvider','seasonalFreshLastMatched','seasonalFreshLastEpisodeTotal'].forEach(k=>S.settings[k]=DEFAULT_SETTINGS[k]);
  }else if(section==='leveling'){
    S.settings.leveling=cloneDefaults(DEFAULT_SETTINGS.leveling);
  }else if(section==='appearance'){
    S.settings.theme=DEFAULT_SETTINGS.theme;
    S.settings.globalAppearanceEnabled=DEFAULT_SETTINGS.globalAppearanceEnabled;
    S.settings.appearanceMode=DEFAULT_SETTINGS.appearanceMode;
    S.settings.dynamicCoverTheme=DEFAULT_SETTINGS.dynamicCoverTheme;
    applyTheme(S.settings.theme);
  }else if(section==='backups'){
    S.settings.backup=cloneDefaults(DEFAULT_SETTINGS.backup);
  }else if(section==='mal'){
    S.malLink={username:'',mode:'anime'};
  }
  persistSettings();
  render();
  showToast('Section restored to defaults');
}
function resetAllSettings(){
  S.settings=cloneDefaults(DEFAULT_SETTINGS);
  S.malLink={username:'',mode:'anime'};
  persistSettings();
  restartBackupTimer();
  applyTheme(S.settings.theme);
  render();
  showToast('All settings restored to defaults');
}
function defaultButton(section){
  return `<button class="btn btn-sm btn-ghost" onclick="App.resetSettingsSection('${section}')" title="Restore this section's defaults">Default</button>`;
}

/* v74: ↑/↓ and drag ordering now persist an explicit categoryOrder to cloud. */
function v72MoveCategory(id, direction){
  const idx=S.categories.findIndex(c=>c.id===id);
  if(idx<0) return;
  const next=idx+Number(direction||0);
  if(next<0 || next>=S.categories.length) return;
  [S.categories[idx],S.categories[next]]=[S.categories[next],S.categories[idx]];
  persistCategories();
  render();
}

let V73_CAT_DRAG=null;
function v73CategoryDragStart(ev,id){
  if(!ev || ev.button>0) return;
  const row=ev.currentTarget?.closest('.cat-manage-row');
  if(!row) return;
  ev.preventDefault();
  V73_CAT_DRAG={id,row,pointerId:ev.pointerId};
  row.classList.add('v73-dragging');
  try{ev.currentTarget.setPointerCapture(ev.pointerId);}catch(_){ }
  document.addEventListener('pointermove',v73CategoryDragMove,{passive:false});
  document.addEventListener('pointerup',v73CategoryDragEnd,{once:true});
  document.addEventListener('pointercancel',v73CategoryDragEnd,{once:true});
}
function v73CategoryDragMove(ev){
  if(!V73_CAT_DRAG || ev.pointerId!==V73_CAT_DRAG.pointerId) return;
  ev.preventDefault();
  const el=document.elementFromPoint(ev.clientX,ev.clientY);
  const target=el?.closest?.('.cat-manage-row');
  const row=V73_CAT_DRAG.row;
  if(!target || target===row || target.parentElement!==row.parentElement) return;
  const r=target.getBoundingClientRect();
  target.parentElement.insertBefore(row,ev.clientY < r.top+r.height/2 ? target : target.nextSibling);
}
function v73CategoryDragEnd(ev){
  if(!V73_CAT_DRAG || (ev?.pointerId!=null && ev.pointerId!==V73_CAT_DRAG.pointerId)) return;
  document.removeEventListener('pointermove',v73CategoryDragMove);
  const row=V73_CAT_DRAG.row;
  row?.classList.remove('v73-dragging');
  const parent=row?.parentElement;
  if(parent){
    const ids=[...parent.querySelectorAll(':scope > .cat-manage-row[data-category-id]')].map(x=>x.dataset.categoryId);
    if(ids.length===S.categories.length){
      const byId=new Map(S.categories.map(c=>[c.id,c]));
      S.categories=ids.map(id=>byId.get(id)).filter(Boolean);
      persistCategories();
    }
  }
  V73_CAT_DRAG=null;
  render();
}

function renderSettings(){

  const st = S.settings;

   const catRows = S.categories.map((c,index)=>`

    <div class="cat-manage-row" data-category-id="${c.id}">

      <div class="hero-icon" style="width:36px;height:36px;font-size:17px;background:${c.color}22; color:${c.color};">${c.icon}</div>

      <div class="name">${escapeHtml(c.name)}<div class="meta">${c.target} ${unitLabel(c.unit,c.target)} target · weight ${c.weight} ${c.seasonal?'· seasonal':''}</div></div>

      <div class="cat-order-controls" style="display:flex;gap:5px;align-items:center;">
        <input class="v157-position-input" type="number" min="1" max="${S.categories.length}" step="1" value="${index+1}"
          title="Set exact category position" aria-label="Set ${escapeHtml(c.name)} category position"
          onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()"
          onkeydown="if(event.key==='Enter'){this.blur();}"
          onchange="App.v157SetCategoryPosition('${c.id}',this.value)">
        <button type="button" class="btn btn-sm btn-ghost cat-drag-handle" title="Drag to reorder" aria-label="Drag ${escapeHtml(c.name)} to reorder" onpointerdown="App.v73CategoryDragStart(event,'${c.id}')">☰</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${c.id}',-1)" ${S.categories[0]?.id===c.id?'disabled':''} title="Move category up" aria-label="Move ${escapeHtml(c.name)} up">↑</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${c.id}',1)" ${S.categories[S.categories.length-1]?.id===c.id?'disabled':''} title="Move category down" aria-label="Move ${escapeHtml(c.name)} down">↓</button>
      </div>

      <button class="toggle ${c.enabled?'on':''}" onclick="App.toggleCategory('${c.id}')"></button>

      <button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App.openCategoryModal('${c.id}')">Edit</button>

      <button class="btn btn-sm btn-danger cat-delete-btn" onclick="App.deleteCategory('${c.id}')">Delete</button>

    </div>`).join('');

   return `

    <div class="view-head"><div><div class="view-title">Settings</div><div class="view-desc">Tune the rotation to fit your life.</div></div><button class="btn btn-ghost" onclick="App.resetAllSettings()">Restore all defaults</button></div>

    <div class="section-label">🛠 LIBRARY INTEGRITY</div>
    <div class="card" style="margin-bottom:22px;border:1px solid var(--flow);">
      <div style="font-weight:800;font-size:15px;">Repair Completed title progress</div>
      <div class="v66-note">Scans the whole Library. A Completed title with a known total is set to full progress, for example 0 / 1 → 1 / 1 or 8 / 12 → 12 / 12. Titles with no known total are ignored.</div>
      <button class="btn btn-primary" style="margin-top:12px" onclick="App.v69RepairAllCompleted()">Scan & fix whole Library</button>
    </div>

    <div class="settings-categories-full">
      <div class="section-label">CATEGORIES</div>
      <div class="card">
        ${catRows}
        <button class="btn btn-block" style="margin-top:14px;" onclick="App.openCategoryModal()">+ Add category</button>
      </div>
    </div>

    <div class="two-col" style="align-items:start;">

      <div>

        <div class="section-label settings-section-head"><span>DAILY GOAL</span>${defaultButton('daily')}</div>

        <div class="card" style="margin-bottom:22px;">

          <div class="intensity-row">

             ${Object.entries(INTENSITY_PRESETS).map(([k,p])=>`

              <div class="intensity-opt ${st.intensity===k?'active':''}" onclick="App.setIntensity('${k}')">

                <div class="t">${p.label}</div><div class="d">${p.desc}</div>

              </div>`).join('')}

          </div>

          <div class="field-row" style="margin-top:16px;">

            <div class="field">

              <label class="field-label">Daily minutes</label>

              <input type="number" min="0" value="${st.dailyMinutes}" onchange="App.updateSetting('dailyMinutes', this.value)">

            </div>

            <div class="field">

              <label class="field-label">Tasks per day</label>

              <input type="number" min="1" value="${st.tasksPerDay}" onchange="App.updateSetting('tasksPerDay', this.value)">

            </div>

          </div>

        </div>

        <div class="section-label settings-section-head"><span>TITLE RECOMMENDATIONS</span>${defaultButton('titles')}</div>

        <div class="card" style="margin-bottom:22px;">
          <div class="settings-toggle-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
            <div>
              <div style="font-weight:700;">Let MediaFlow choose the exact title</div>
              <small class="hint">When enabled, the scheduler uses your Library and its scoring signals to recommend a specific title inside the category it selected. You can still skip or rotate.</small>
            </div>
            <button class="toggle ${st.exactTitleRecommendations?'on':''}" onclick="App.toggleExactTitleRecommendations()" aria-label="Toggle exact title recommendations"></button>
          </div>
          <div style="margin-top:10px; color:var(--text-mute); font-size:12px;">${st.exactTitleRecommendations?'ON — MediaFlow picks category + amount + title.':'OFF — MediaFlow picks category + amount; you pick the title.'}</div>

          <div style="height:1px;background:var(--border-soft);margin:16px 0;"></div>

          <div class="settings-toggle-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
            <div>
              <div style="font-weight:700;">Prioritize Personal Order</div>
              <small class="hint">When enabled, MediaFlow still chooses the category, amount, balance, reasons and task exactly as before. For the exact title only, it first checks your Order and recommends the first eligible ordered title in that task's category. If none is available, the normal MediaFlow title scoring is used.</small>
            </div>
            <button class="toggle ${st.prioritizePersonalOrder?'on':''}" onclick="App.togglePrioritizePersonalOrder()" aria-label="Toggle Personal Order priority"></button>
          </div>
          <div style="margin-top:10px; color:var(--text-mute); font-size:12px;">
            ${st.prioritizePersonalOrder
              ? (st.exactTitleRecommendations
                  ? 'ON — Personal Order gets first priority for the recommended title.'
                  : 'ON — Saved, but it only applies while exact title recommendations are enabled.')
              : 'OFF — MediaFlow uses its normal title scoring.'}
          </div>
        </div>

        <div class="section-label settings-section-head"><span>SCHEDULER TUNING</span>${defaultButton('scheduler')}</div>

        <div class="card" style="margin-bottom:22px;">

          ${sliderField('Neglect sensitivity','neglectRate',1,15,st.neglectRate,'How fast an ignored category climbs in priority.')}

          ${sliderField('Variety strength','repetitionPenalty',2,30,st.repetitionPenalty,'How strongly recent repeats are discouraged.')}

          ${sliderField('Saturation weight','saturationWeight',0,40,st.saturationWeight,'How hard the app pulls back after heavy recent use.')}

          ${sliderField('Seasonal urgency','seasonalBonus',0,35,st.seasonalBonus,'Base priority boost for time-sensitive seasonal anime.')}

          ${sliderField('Randomness','randomness',0,0.6,st.randomness,'Controlled unpredictability in category selection.', true)}<div class="field" style="margin-top:4px;">

            <label class="field-label">Seasonal — titles with fresh episodes waiting</label>

            <input type="number" min="0" value="${st.seasonalFreshCount}" onchange="App.updateSetting('seasonalFreshCount', this.value)">

            <small class="hint">Manual for now — update this yourself when new episodes drop. AniList auto-sync can slot in here later without changing the scheduler.</small>

          </div>

        </div>

        <div class="section-label settings-section-head"><span>LEVELING &amp; XP</span>${defaultButton('leveling')}</div>

        <div class="card" style="margin-bottom:22px;">
          <div class="settings-toggle-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
            <div>
              <div style="font-weight:700;">XP leveling system</div>
              <small class="hint">Control how much XP you earn from time, media units, Library additions, completions, and rotation health.</small>
            </div>
            <button class="toggle ${st.leveling?.enabled!==false?'on':''}" onclick="App.updateLeveling('enabled', ${st.leveling?.enabled!==false?'false':'true'})"></button>
          </div>
          <div class="field-row" style="margin-top:16px;">
            <div class="field"><label class="field-label">XP per minute</label><input type="number" min="0" step="0.1" value="${st.leveling?.minuteXP??1}" onchange="App.updateLeveling('minuteXP',this.value)"></div>
            <div class="field"><label class="field-label">New Library title XP</label><input type="number" min="0" value="${st.leveling?.libraryAdditionXP??25}" onchange="App.updateLeveling('libraryAdditionXP',this.value)"></div>
          </div>
          <div class="field"><label class="field-label">Completion bonus XP</label><input type="number" min="0" value="${st.leveling?.completionXP??50}" onchange="App.updateLeveling('completionXP',this.value)"></div>
          <div style="font-weight:700;font-size:12px;margin:14px 0 8px;">UNIT XP</div>
          <div class="field-row">
            <div class="field"><label class="field-label">Episode</label><input type="number" min="0" value="${st.leveling?.unitXP?.episodes??10}" onchange="App.updateLevelingUnit('episodes',this.value)"></div>
            <div class="field"><label class="field-label">Chapter</label><input type="number" min="0" value="${st.leveling?.unitXP?.chapters??3}" onchange="App.updateLevelingUnit('chapters',this.value)"></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label">Issue</label><input type="number" min="0" value="${st.leveling?.unitXP?.issues??6}" onchange="App.updateLevelingUnit('issues',this.value)"></div>
            <div class="field"><label class="field-label">Movie</label><input type="number" min="0" value="${st.leveling?.unitXP?.movies??30}" onchange="App.updateLevelingUnit('movies',this.value)"></div>
          </div>
          <div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>
          <div class="field-row">
            <div class="field"><label class="field-label">Neglected</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.neglected??2}" onchange="App.updateLevelingRotation('neglected',this.value)"></div>
            <div class="field"><label class="field-label">Due</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.due??1.5}" onchange="App.updateLevelingRotation('due',this.value)"></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label">Healthy</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.healthy??1}" onchange="App.updateLevelingRotation('healthy',this.value)"></div>
            <div class="field"><label class="field-label">Overused</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.overused??0.5}" onchange="App.updateLevelingRotation('overused',this.value)"></div>
          </div>
        </div>

        <div class="section-label settings-section-head"><span>IMPORT / EXPORT — MEDIA SERVICES</span>${defaultButton('mal')}</div>

        <div class="card" style="margin-bottom:22px;">
<div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px;">Import library exports from other tracking services or export your MediaFlow Library into exchange files for those services. MediaFlow merges matching titles and preserves progress, status, ratings, dates and external IDs when the source contains them.</div>
<div class="field-row"><div class="field"><label class="field-label">Service / format</label><select id="exchange-service">${mfExchangeServiceOptions()}</select></div><div class="field"><label class="field-label">Import</label><button class="btn" onclick="App.pickExchangeImport()">Choose export file</button><input id="exchange-file" type="file" accept=".json,.csv,.xml,.txt,application/json,text/csv,text/xml,application/xml" style="display:none" onchange="App.prepareExchangeImport(this.files[0])"></div></div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-primary" onclick="App.exportExchange()">Export for selected service</button><button class="btn" onclick="document.getElementById('mal-file').click()">Quick MAL XML import</button><input type="file" id="mal-file" accept=".xml,text/xml" style="display:none" onchange="App.prepareLegacyImport('mal',this.files[0])"><button class="btn" onclick="document.getElementById('simkl-file').click()">Quick Simkl JSON import</button><input type="file" id="simkl-file" accept=".json,application/json" style="display:none" onchange="App.prepareLegacyImport('simkl',this.files[0])"></div>
<small class="hint">AniList · AniSearch · AniWatch · BetaSeries · Criticker · Crunchyroll · EpisodeCalendar · HiAnime · IMDb · Letterboxd · LiveChart · Kitsu · MoviesFad · MyAnimeList · MAL-XML · Netflix · PrimeWire · SeriesFad · Stremio · trakt · TV Time · Tviso · Twee · CSV · JSON. Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data.</small>
</div>

        <div class="section-label">DATA</div>

        <div class="card">

          <div style="display:flex; gap:10px; flex-wrap:wrap;">

            <button class="btn" onclick="App.exportJSON()">Export JSON backup</button>

            <button class="btn" onclick="document.getElementById('import-file').click()">Import JSON backup</button>

            <input type="file" id="import-file" accept="application/json" style="display:none" onchange="App.prepareBackupImport(this.files[0])">

            <button class="btn btn-danger" onclick="App.resetAll()">Reset all data</button>

          </div>

        </div>

      </div>

    </div>

  `;

}

function sliderField(label, key, min, max, val, hint, isFloat){

  return `<div class="field">

    <label class="field-label">${label}: ${isFloat? Math.round(val*100)+'%' : val}</label>

    <input type="range" min="${min}" max="${max}" step="${isFloat?0.02:1}" value="${val}" oninput="App.updateSetting('${key}', this.value)">

    <small class="hint">${hint}</small>

  </div>`;

}
