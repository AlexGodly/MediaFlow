/* ============================================================
   MediaFlow v178 — Editable Rich Imported Metadata
   ------------------------------------------------------------
   v176 introduced source-provided rich title metadata. v178 exposes those
   fields in the normal Library editor and protects fields the user manually
   changes from later media-service imports.
   ============================================================ */

const V178_BACKUP_SCHEMA_VERSION=15;

const V178_EDITABLE_RICH_FIELDS=[
  'year',
  'mediaFormat',
  'durationMinutes',
  'releaseDate',
  'seasonLabel',
  'ageRating',
  'communityScore',
  'mediaSource',
  'demographic',
  'studios',
  'producers',
  'genres',
  'themes',
  'synopsis'
];

function v178ManualMap(item){
  const src=item?.richMetadataManual;
  if(!src||typeof src!=='object'||Array.isArray(src))return {};
  const out={};
  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(src[key]===true)out[key]=true;
  }
  return out;
}

function v178CommaText(value){
  return Array.isArray(value)
    ?value.filter(Boolean).join(', ')
    :'';
}

function v178CsvList(value){
  return [...new Set(
    String(value||'')
      .split(',')
      .map(x=>v176SafeText(x,120))
      .filter(Boolean)
  )].slice(0,40);
}

function v178FieldLockBadge(item,key){
  return v178ManualMap(item)[key]
    ?'<span class="v178-import-lock" title="You manually edited this field. Future imports will not overwrite it.">MANUAL</span>'
    :'';
}

function v178RichEditorHtml(d){
  const item=d&&typeof d==='object'?d:{};

  const n=value=>{
    const x=Number(value);
    return Number.isFinite(x)&&x>0?x:'';
  };

  return `<details class="v178-rich-editor" ${v176HasRichMetadata(item)||Number(item.year)>0?'open':''}>
    <summary>
      <span>Title details / imported metadata</span>
      <span class="hint" style="margin:0">Editable</span>
    </summary>

    <div class="v178-rich-editor-body">
      <div class="v178-rich-editor-note">
        These fields can be filled by supported imports when the source actually provides them. You can edit or clear them manually. A field you manually change becomes protected from later media-service imports so your edit is not silently overwritten.
      </div>

      <div class="v178-rich-grid">
        <div class="field"><label class="field-label">Year ${v178FieldLockBadge(item,'year')}</label>
          <input type="number" id="l-rich-year" min="0" max="9999" step="1"
            value="${n(item.year)}" placeholder="e.g. 2026">
        </div>

        <div class="field">
          <label class="field-label">Media format ${v178FieldLockBadge(item,'mediaFormat')}</label>
          <input type="text" id="l-rich-format"
            value="${escapeHtml(String(item.mediaFormat||''))}"
            placeholder="TV, Movie, OVA, Manga…">
        </div>

        <div class="field">
          <label class="field-label">Runtime / duration (minutes) ${v178FieldLockBadge(item,'durationMinutes')}</label>
          <input type="number" id="l-rich-duration" min="0" step="1"
            value="${n(item.durationMinutes)}"
            placeholder="e.g. 24">
        </div>

        <div class="field">
          <label class="field-label">Release date ${v178FieldLockBadge(item,'releaseDate')}</label>
          <input type="date" id="l-rich-release-date"
            value="${escapeHtml(String(item.releaseDate||''))}">
        </div>

        <div class="field">
          <label class="field-label">Season ${v178FieldLockBadge(item,'seasonLabel')}</label>
          <input type="text" id="l-rich-season"
            value="${escapeHtml(String(item.seasonLabel||''))}"
            placeholder="Fall 2026">
        </div>

        <div class="field">
          <label class="field-label">Content / age rating ${v178FieldLockBadge(item,'ageRating')}</label>
          <input type="text" id="l-rich-age-rating"
            value="${escapeHtml(String(item.ageRating||''))}"
            placeholder="PG-13, TV-MA, 16+…">
        </div>

        <div class="field">
          <label class="field-label">Community score (0–10) ${v178FieldLockBadge(item,'communityScore')}</label>
          <input type="number" id="l-rich-community-score"
            min="0" max="10" step="0.01"
            value="${n(item.communityScore)}"
            placeholder="Not available">
        </div>

        <div class="field">
          <label class="field-label">Source material ${v178FieldLockBadge(item,'mediaSource')}</label>
          <input type="text" id="l-rich-source"
            value="${escapeHtml(String(item.mediaSource||''))}"
            placeholder="Manga, Light novel, Original…">
        </div>

        <div class="field">
          <label class="field-label">Demographic ${v178FieldLockBadge(item,'demographic')}</label>
          <input type="text" id="l-rich-demographic"
            value="${escapeHtml(String(item.demographic||''))}"
            placeholder="Shounen, Seinen…">
        </div>

        <div class="field">
          <label class="field-label">Studios ${v178FieldLockBadge(item,'studios')}</label>
          <input type="text" id="l-rich-studios"
            value="${escapeHtml(v178CommaText(item.studios))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Producers ${v178FieldLockBadge(item,'producers')}</label>
          <input type="text" id="l-rich-producers"
            value="${escapeHtml(v178CommaText(item.producers))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Genres ${v178FieldLockBadge(item,'genres')}</label>
          <input type="text" id="l-rich-genres"
            value="${escapeHtml(v178CommaText(item.genres))}"
            placeholder="Action, Adventure, Fantasy…">
        </div>

        <div class="field">
          <label class="field-label">Themes ${v178FieldLockBadge(item,'themes')}</label>
          <input type="text" id="l-rich-themes"
            value="${escapeHtml(v178CommaText(item.themes))}"
            placeholder="Isekai, School, Detective…">
        </div>

        <div class="field v178-rich-wide">
          <label class="field-label">Synopsis / description ${v178FieldLockBadge(item,'synopsis')}</label>
          <textarea id="l-rich-synopsis"
            placeholder="Synopsis or description…">${escapeHtml(String(item.synopsis||''))}</textarea>
        </div>
      </div>
    </div>
  </details>`;
}

