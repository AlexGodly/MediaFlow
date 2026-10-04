/* ============================================================
   MediaFlow v147 — Dynamic Settings version/copyright footer
   ------------------------------------------------------------
   Version is read from <meta name="mediaflow-version"> so future releases
   only need to update normal MediaFlow version metadata.
   Copyright year comes from the user's current system year.
   ============================================================ */

function v147CurrentMediaFlowVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  const value=String(meta?.getAttribute('content')||'').trim();
  return value||'147';
}

function v147SettingsFooterHtml(){
  const version=v147CurrentMediaFlowVersion();
  const year=new Date().getFullYear();

  return `<footer class="v147-settings-footer" aria-label="MediaFlow version information">
    <div class="v147-settings-footer-brand">MediaFlow v${escapeHtml(version)}</div>
    <div class="v147-settings-footer-meta">by <b>Alex Godly</b> · © ${year} Alex Godly</div>
  </footer>`;
}

const v147RenderSettingsBase=renderSettings;
renderSettings=function(){
  const html=v147RenderSettingsBase();
  return html+v147SettingsFooterHtml();
};



