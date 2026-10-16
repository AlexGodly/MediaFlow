/* ============================================================
   MediaFlow v251 — Covers+Titles Display Label + Semantic Icon
   ------------------------------------------------------------
   - Renames the shared Library display mode from "Cover+Titles"
     to "Covers+Titles" in both Normal and Dynamic Library.
   - Gives the mode an explicit cover-grid + title-lines icon so it
     never falls back to the generic action-arrow icon.
   ============================================================ */

const V251_RUNTIME_VERSION=251;

// A small two-cover grid with title lines underneath each cover.
// This visually describes the combined covers + titles Library mode.
V225_BUTTON_ICONS.coversTitles=v225IconSvg(
  '<rect x="3" y="3" width="8" height="10" rx="1"/>'+
  '<rect x="13" y="3" width="8" height="10" rx="1"/>'+
  '<path d="M4 16h6M14 16h6M4 20h5M14 20h5"/>'
);

const v251DisplaySwitchHtmlBase=v181DisplaySwitchHtml;
v181DisplaySwitchHtml=function(){
  return v251DisplaySwitchHtmlBase.apply(this,arguments)
    .replace(/Cover\+Titles/g,'Covers+Titles')
    .replace(/Covers \+ titles/g,'Covers+Titles')
    .replace(/Covers \+ Titles/g,'Covers+Titles')
    .replace(
      /onclick="App\.setLibraryView\('covers-title'\)"/g,
      'data-v225-icon="coversTitles" onclick="App.setLibraryView(\'covers-title\')"'
    );
};

// Keep text-based icon detection compatible with the new compact label too.
const v251ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  if(t==='covers+titles'||t==='covers + titles'||t==='covers titles')return 'coversTitles';
  return v251ButtonIconNameBase.apply(this,arguments);
};

App.v251DisplaySwitchHtml=v181DisplaySwitchHtml;
MediaFlowRuntime.version=V251_RUNTIME_VERSION;
