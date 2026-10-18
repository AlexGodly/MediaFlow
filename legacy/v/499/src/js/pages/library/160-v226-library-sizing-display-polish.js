/* ============================================================
   MediaFlow v226 — Library Sizing + Display Polish
   ------------------------------------------------------------
   - Renames "Covers + titles" to "Cover+Titles".
   - Marks Dynamic Library output with a stable v226 class.
   - Guarantees Library cover/title-size controls remain available in
     Dynamic Library and across every display mode.
   ============================================================ */

const v226DisplaySwitchHtmlBase=v181DisplaySwitchHtml;
v181DisplaySwitchHtml=function(){
  return v226DisplaySwitchHtmlBase.apply(this,arguments)
    .replace(/Covers \+ titles/g,'Cover+Titles')
    .replace(/Covers \+ Titles/g,'Cover+Titles');
};

const v226RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v226RenderLibraryBase.apply(this,arguments);
  const dynamic=h.includes('class="v181-dynamic-nav"');

  if(dynamic){
    h=h.replace(
      /class="v177-library-cover-scope(?![^\"]*v226-dynamic-library)/,
      'class="v177-library-cover-scope v226-dynamic-library'
    );

    // Defensive compatibility: older wrapper chains could omit one of the
    // sizing controls in Dynamic mode. Reinsert it beside the existing tools.
    if(!h.includes('id="v181-cover-range-library"')){
      const control=v181InlineCoverControl('library','Cover size');
      h=h.replace('<span class="spacer"></span>',control+'<span class="spacer"></span>');
    }
    if(!h.includes('class="v188-title-text-control"')){
      const control=v188TitleTextControlHtml();
      const coverNeedle='</label><span class="spacer"></span>';
      if(h.includes(coverNeedle))h=h.replace(coverNeedle,`</label>${control}<span class="spacer"></span>`);
      else h=h.replace('<span class="spacer"></span>',control+'<span class="spacer"></span>');
    }
  }

  return h;
};

MediaFlowRuntime.version=V226_RUNTIME_VERSION;
