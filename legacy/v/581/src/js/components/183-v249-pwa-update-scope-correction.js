/* ============================================================
   MediaFlow v249 — PWA / App Update Scope Correction
   --------------------------------------------------------------------------
   v248 introduced the managed application-update experience. Those controls
   belong to APP UPDATES / Automatic update checking, not to the separate PWA
   installation card.

   v249 restores the Install MediaFlow PWA card to the v247 layout/behavior:
   - Install app
   - Reload app / Reload update
   - Check PWA update
   - PWA Diagnostics

   The v248 managed-update UI remains in the application-update surfaces and no
   longer duplicates itself inside the PWA card.
   ============================================================ */
const V249_RUNTIME_VERSION=249;

function v249PwaStatus(){
  const current=Number(v161CurrentVersion())||V249_RUNTIME_VERSION;
  if(!v244PwaSupported())return 'Install unavailable — MediaFlow must run over HTTPS or localhost.';
  if(V244_PWA_STATE.updateReady)return `MediaFlow v${current} app update is ready. Reload the app to apply it.`;
  if(v244PwaStandalone()||V244_PWA_STATE.installed)return V244_PWA_STATE.offlineReady?'Installed · service worker active and app shell available.':'Installed as an app.';
  if(V244_PWA_STATE.installPrompt)return V244_PWA_STATE.offlineReady?'Ready to install · Chrome/browser native install prompt is available.':'Ready to install.';
  if(V247_PWA_DIAGNOSTICS.running)return 'Checking manifest, service worker, app-shell cache and deployed PWA assets…';
  if(V247_PWA_DIAGNOSTICS.report?.status==='fail')return `Install needs attention — ${V247_PWA_DIAGNOSTICS.report.summary||'one or more PWA checks failed'}.`;
  if(V244_PWA_STATE.error)return `PWA setup could not finish: ${String(V244_PWA_STATE.error)}`;
  if(V247_PWA_DIAGNOSTICS.report?.status==='pass')return 'PWA technical checks passed. If Chrome still does not show Install, reload once or use the browser Install app menu.';
  if(V247_PWA_DIAGNOSTICS.report?.status==='warn')return 'PWA core checks passed with warnings. Open PWA Diagnostics for the exact install/cache state.';
  if(V244_PWA_STATE.offlineReady)return 'PWA service worker is ready, but the browser has not exposed a native install prompt yet. Run PWA Test for the exact reason.';
  return 'Preparing installable app support…';
}

v247PwaStatus=v249PwaStatus;
v244PwaStatus=v249PwaStatus;

function v249PwaSettingsHtml(){
  const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
  const state=v247PwaStateLabel();
  const open=V247_PWA_DIAGNOSTICS.report?.status==='fail'||!!V247_PWA_DIAGNOSTICS.error;
  return `<div class="card v244-pwa-card v246-pwa-card v247-pwa-card" style="margin-bottom:22px">
    <div class="v244-pwa-card-main">
      <div class="v244-pwa-mark v246-pwa-mark" aria-hidden="true"><img src="assets/icons/mediaflow-192.png" alt=""></div>
      <div class="v244-pwa-copy">
        <div class="v247-pwa-title-row"><b>Install MediaFlow</b>${v247DiagBadge(state.tone,state.text)}</div>
        <div class="hint">Install MediaFlow as a Progressive Web App on desktop, tablet or mobile. PWA diagnostics can test the live manifest, worker and every app-shell URL when the browser refuses installation.</div>
        <div id="v244-pwa-status" class="v244-pwa-status">${escapeHtml(v249PwaStatus())}</div>
      </div>
    </div>
    <div class="v244-pwa-actions v246-pwa-actions">
      <button id="v244-pwa-install" class="btn btn-sm btn-primary" data-v225-iconified="1" ${installed?'disabled':''} onclick="App.v244InstallPwa()">${V246_PWA_ICONS.install}<span>${installed?'Installed':'Install app'}</span></button>
      <button id="v244-pwa-update" class="btn btn-sm" data-v225-iconified="1" onclick="App.v246ReloadPwa()">${V246_PWA_ICONS.reload}<span>${V244_PWA_STATE.updateReady?'Reload update':'Reload app'}</span></button>
      <button id="v246-pwa-check" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.v244CheckPwaUpdate(true)">${V246_PWA_ICONS.update}<span>Check PWA update</span></button>
    </div>
    <details id="v247-pwa-diagnostics" class="v247-pwa-diagnostics" ${open?'open':''}>
      <summary>PWA Diagnostics <span>manifest · service worker · cache · assets</span></summary>
      <div id="v247-pwa-diagnostics-body" class="v247-pwa-diagnostics-body">${v247DiagnosticsBodyHtml()}</div>
    </details>
  </div>`;
}

v244PwaSettingsHtml=v249PwaSettingsHtml;
App.v244PwaSettingsHtml=v244PwaSettingsHtml;
Object.assign(window.MediaFlowPWA||{}, {status:v249PwaStatus});

MediaFlowRuntime.version=V249_RUNTIME_VERSION;
