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

