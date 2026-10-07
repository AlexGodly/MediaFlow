/* ============================================================
   Library Display Modes
   ============================================================ */

function v181SetLibraryView(mode){
  const allowed=new Set([
    'list',
    'compact',
    'cards',
    'covers',
    'covers-title'
  ]);

  if(!allowed.has(String(mode)))return;

  S.settings.libraryView=String(mode);
  S.libPage=0;
  persistSettings();
  render();
}
App.setLibraryView=v181SetLibraryView;

function v181DisplaySwitchHtml(){
  const mode=S.settings.libraryView||'list';

  const modes=[
    ['list','List'],
    ['compact','Compact'],
    ['cards','Cards'],
    ['covers','Covers'],
    ['covers-title','Covers + titles']
  ];

  return `<div class="v181-display-switch">
    <span class="hint">Display:</span>
    ${modes.map(([id,label])=>`<button type="button"
      class="btn btn-sm ${mode===id?'active':''}"
      onclick="App.setLibraryView('${id}')">
      ${escapeHtml(label)}
    </button>`).join('')}
  </div>`;
}

