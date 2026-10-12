/* MediaFlow v371 — Theme-aware logging visual system, reliable settings,
 * canonical Library status icons and fast, state-preserving title toggles.
 * No changes to the canonical XP, History or Library commit contracts.
 */
const V371_RELEASE = 371;
const V371_LOGGING_SETTINGS_SELECTOR='[data-setting="v369-default-interface"]';

// Library owns these choices. Reuse exactly the same icon SVG markup used by
// its status-choice modal (v229), including all five canonical status types.
function v371LibraryStatusIcon(status){
  return typeof v229StatusChoiceIcon==='function'?v229StatusChoiceIcon(status):'';
}
v370TitleMeta=function(item){
  const cat=getCategory(item.categoryId),value=String(item.status||'planned');
  const label=typeof v274StatusLabel==='function'?v274StatusLabel(value):value;
  const priority=String(item.priority||'medium').toLowerCase();
  return '<div class="v370-title-tags">'+
    '<span class="v370-tag v370-status" data-status="'+escapeHtml(value)+'">'+v371LibraryStatusIcon(value)+escapeHtml(label)+'</span>'+
    '<span class="v370-tag v370-category">'+(cat?v144CategoryIconHtml(cat):'')+escapeHtml(cat?.name||'Uncategorized')+'</span>'+
    '<span class="v370-tag v370-priority" data-priority="'+escapeHtml(priority)+'">'+escapeHtml(priority.slice(0,1).toUpperCase()+priority.slice(1))+' priority</span></div>';
};

// The v370 quick selected-title cards are rendered by the existing v239
// title-list renderer. Add the canonical status icon as an actual element,
// without re-encoding or altering the underlying title status.
const v371LogFormBase=renderLogForm;
renderLogForm=function(){
  const html=String(v371LogFormBase.apply(this,arguments)||'');
  if(!S.logDraft)return html;
  try{
    const host=document.createElement('div');host.innerHTML=html;
    const form=host.querySelector('.log-form');if(!form)return html;
    form.classList.add('v371-logging');
    if(S.logDraft.v369Interface==='quick'){
      form.querySelectorAll('.v239-logged-title-card').forEach((card,index)=>{
        const entry=S.logDraft.entries?.[index];
        const item=entry?v369ItemTitle(entry):null;
        if(!item)return;
        const meta=card.querySelector('.v239-logged-title-copy');
        if(!meta)return;
        const status=String(item.status||'planned');
        const label=typeof v274StatusLabel==='function'?v274StatusLabel(status):status;
        // Existing v239 metadata already contains the status as plain text.
        // Present it once with its Library icon instead of duplicating it.
        const oldDescription=meta.querySelector('small');
        if(oldDescription){
          const fields=oldDescription.textContent.split(/\s*·\s*/).filter(part=>part.trim()!==label);
          oldDescription.textContent=fields.join(' · ');
        }
        // No copied icon definitions: v229 is the Library source of truth.
        const badge=document.createElement('span');
        badge.className='v371-quick-status v370-tag v370-status';badge.dataset.status=status;
        badge.innerHTML=v371LibraryStatusIcon(status)+escapeHtml(label);
        meta.appendChild(badge);
      });
    }
    // v239 Quick submode control and v370 mode toggles use the same active
    // appearance; the source retains the existing input handler names.
    form.querySelectorAll('.v239-log-mode-options button').forEach(button=>{
      const type=String(button.getAttribute('onclick')||'').includes("'progress'")?'progress':'amount';
      const icon=type==='progress'?V225_BUTTON_ICONS.lastProgress:V225_BUTTON_ICONS.amount;
      if(icon&&!button.querySelector('svg'))button.insertAdjacentHTML('afterbegin',icon);
      button.setAttribute('aria-pressed',String(button.classList.contains('active')));
    });
    return host.innerHTML;
  }catch(err){console.warn('v371 Logging decoration fallback',err);return html;}
};

// v370's handler used persistSettings()+render(), rebuilding the Settings
// Center through an older renderer, which could drop its dynamic v369 choice.
// A preference change needs only a settings write and button-state update.
App.v369SetDefaultInterface=function(value){
  const mode=value==='quick'?'quick':'itemized';
  S.settings=S.settings||{};
  S.settings.v369Logging={...(S.settings.v369Logging||{}),defaultInterface:mode};
  const group=document.querySelector('.v370-settings-modes');
  if(group){
    group.querySelectorAll('button').forEach(btn=>{
      const choice=String(btn.getAttribute('onclick')||'').includes("'quick'")?'quick':'itemized';
      const active=choice===mode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
  }
  persistSettings();
  showToast('Default interface: '+(mode==='quick'?'Quick logging':'Per unit'));
};

// Any later full Settings render must still include the default chooser.
// Do not create duplicate settings; reuse the canonical v369 registration.
const v371SettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof v371SettingsRenderer==='function'){
  MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
    const html=String(v371SettingsRenderer.call(this,ctx)||'');
    try{
      const host=document.createElement('div');host.innerHTML=html;
      let choice=host.querySelector(V371_LOGGING_SETTINGS_SELECTOR);
      if(!choice){
        const marker=[...host.querySelectorAll('.section-label')].find(el=>/LOGGING METHOD/i.test(el.textContent||''));
        if(marker){
          marker.insertAdjacentHTML('afterend','<div class="v369-settings-control" data-setting="v369-default-interface"><div class="field-label"><strong>Default Logging Interface</strong></div><p class="hint">Choose the default for a new Dashboard logging session.</p><div class="v369-settings-choice"></div></div>');
          choice=host.querySelector(V371_LOGGING_SETTINGS_SELECTOR);
        }
      }
      if(choice){
        const group=choice.querySelector('.v369-settings-choice');
        if(group){
          const mode=v369DefaultInterface();
          group.classList.add('v370-settings-modes');
          group.setAttribute('role','group');group.setAttribute('aria-label','Default Logging Interface');
          group.innerHTML='<button type="button" class="btn v370-icon-btn '+(mode==='itemized'?'active':'')+'" aria-pressed="'+(mode==='itemized')+'" onclick="App.v369SetDefaultInterface(\'itemized\')">'+v370Icon('list')+'Per unit <span class="v369-recommended">Recommended</span></button>'+
            '<button type="button" class="btn v370-icon-btn '+(mode==='quick'?'active':'')+'" aria-pressed="'+(mode==='quick')+'" onclick="App.v369SetDefaultInterface(\'quick\')">'+v370Icon('quick')+'Quick logging</button>';
        }
      }
      return host.innerHTML;
    }catch(_){return html;}
  });
}

// Maintain the canonical title entry fields in memory and just change the
// particular panel's visibility. Do not rebuild the form, recalculate XP or
// touch every title on each press. Lazy expansion renders ONE title once.
let v371DraftPersistTimer=0;
function v371ScheduleCollapsePersistence(){
  if(v371DraftPersistTimer)clearTimeout(v371DraftPersistTimer);
  v371DraftPersistTimer=setTimeout(()=>{
    v371DraftPersistTimer=0;
    try{v369Touch();}catch(err){console.warn('v371 panel state cache deferred',err);}
  },240);
}
App.v369ToggleTitle=function(index){
  const idx=Number(index),draft=S.logDraft,e=draft?.entries?.[idx];
  if(!e)return;
  const panel=[...document.querySelectorAll('.v370-panels [data-v369-title]')]
    .find(el=>Number(el.getAttribute('data-v369-title'))===idx);
  const old=!!e.v369Collapsed;
  e.v369Collapsed=!old;
  if(panel){
    let content=panel.querySelector(':scope > .v370-title-content');
    if(old&&!content){
      const scratch=document.createElement('div');
      scratch.innerHTML=v370TitlePanelHtml(e,idx,true);
      content=scratch.querySelector('.v370-title-content');
      if(content)panel.appendChild(content);
    }
    if(content)content.hidden=e.v369Collapsed;
    panel.classList.toggle('v371-collapsed',e.v369Collapsed);
    const button=panel.querySelector('.v370-title-actions button[aria-expanded]');
    if(button){
      button.setAttribute('aria-expanded',String(!e.v369Collapsed));
      button.innerHTML=v370Icon(e.v369Collapsed?'expand':'collapse')+(e.v369Collapsed?'Expand':'Collapse');
    }
  }
  v371ScheduleCollapsePersistence();
};

// The designed v336 confirmation is shared with all three logging methods.
// Keep the original confirmation promise and deletion safety, but give its
// non-destructive cancel action a clear, visually meaningful Library-style icon.
const v371ClearConfirmBase=App.v370ConfirmClearTitles;
App.v370ConfirmClearTitles=function(){
  const pending=v371ClearConfirmBase.apply(this,arguments);
  const cancel=document.querySelector('#v336-dialog-root [data-v336-dialog-cancel]');
  if(cancel){
    cancel.classList.add('v371-keep-titles','v370-icon-btn');
    cancel.querySelectorAll('.v225-btn-icon').forEach(icon=>icon.remove());
    cancel.insertAdjacentHTML('afterbegin',v370Icon('shield'));
  }
  return pending;
};

const v371Style=document.createElement('style');
v371Style.id='v371-logging-style';
v371Style.textContent=/*css*/`
/* Purposeful color accents that inherit existing user-selected theme tokens. */
.v371-logging{--v371-accent:var(--flow,var(--primary,#879cff));--v371-warm:var(--overused,var(--flow,#879cff));--v371-base:var(--panel-raised,var(--panel,var(--surface)))}
.v371-logging .v370-interface{border:1px solid color-mix(in srgb,var(--v371-accent) 27%,var(--border));background:linear-gradient(105deg,color-mix(in srgb,var(--v371-accent) 8%,var(--v371-base)),var(--v371-base) 70%);box-shadow:inset 3px 0 0 color-mix(in srgb,var(--v371-accent) 65%,transparent)}
.v371-logging .v370-mode-switch button,.v371-logging .v239-log-mode-options button,.v370-settings-modes button{border:1px solid var(--border-soft,var(--border));background:var(--panel,var(--surface));color:var(--text);transition:border-color .12s ease,background-color .12s ease,box-shadow .12s ease}
.v371-logging .v370-mode-switch button.active,.v371-logging .v239-log-mode-options button.active,.v370-settings-modes button.active{background:color-mix(in srgb,var(--flow) 17%,var(--panel,var(--surface)))!important;border-color:color-mix(in srgb,var(--flow) 65%,var(--border))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--flow) 28%,transparent),0 0 0 2px color-mix(in srgb,var(--flow) 10%,transparent);color:var(--text)!important;font-weight:750}
.v371-logging .v370-mode-switch button.active .v370-icon,.v371-logging .v239-log-mode-options button.active .v225-btn-icon,.v370-settings-modes button.active .v370-icon{color:var(--flow)}
.v371-logging .v370-mode-switch button:hover:not(.active),.v371-logging .v239-log-mode-options button:hover:not(.active),.v370-settings-modes button:hover:not(.active){border-color:color-mix(in srgb,var(--flow) 36%,var(--border));background:color-mix(in srgb,var(--flow) 6%,var(--panel,var(--surface)))}
.v371-logging .v370-mode-switch button:focus-visible,.v371-logging .v239-log-mode-options button:focus-visible,.v370-settings-modes button:focus-visible,.v371-logging .v370-title-actions button:focus-visible{outline:2px solid var(--flow);outline-offset:3px}
.v371-logging .v370-title{border-color:color-mix(in srgb,var(--flow) 20%,var(--border));background:linear-gradient(145deg,color-mix(in srgb,var(--flow) 4%,var(--panel-raised,var(--surface))),var(--panel-raised,var(--surface)) 68%)}
.v371-logging .v370-title-head{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--flow) 55%,transparent)}
.v371-logging .v370-title-stats{color:color-mix(in srgb,var(--flow) 48%,var(--text))}
.v371-logging .v370-status,.v371-logging .v371-quick-status{gap:5px;background:color-mix(in srgb,var(--flow) 9%,var(--panel,var(--surface)));border-color:color-mix(in srgb,var(--flow) 25%,var(--border))}
.v371-logging .v370-status .v225-btn-icon,.v371-logging .v371-quick-status .v225-btn-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:14px;height:14px}
.v371-logging .v370-status .v225-btn-icon svg,.v371-logging .v371-quick-status .v225-btn-icon svg{width:14px;height:14px;fill:none;stroke:currentColor}
.v371-logging .v370-status[data-status=completed],.v371-logging .v371-quick-status[data-status=completed]{color:#4da3ff;background:color-mix(in srgb,#4da3ff 10%,var(--panel));border-color:color-mix(in srgb,#4da3ff 22%,var(--border))}
.v371-logging .v370-status[data-status=paused],.v371-logging .v371-quick-status[data-status=paused]{color:color-mix(in srgb,var(--v371-warm) 60%,var(--text))}
.v371-logging .v370-status[data-status=dropped],.v371-logging .v371-quick-status[data-status=dropped]{color:var(--overused,var(--text))}
.v371-logging .v370-priority[data-priority=high]{background:color-mix(in srgb,var(--v371-warm) 10%,var(--panel));border-color:color-mix(in srgb,var(--v371-warm) 26%,var(--border))}
.v371-logging .v370-unit{border-color:color-mix(in srgb,var(--flow) 13%,var(--border));background:color-mix(in srgb,var(--flow) 3%,var(--panel,var(--surface)))}
.v371-logging .v370-unit:has(.v370-unit-repeat-state){border-left:3px solid color-mix(in srgb,var(--flow) 66%,transparent);background:color-mix(in srgb,var(--flow) 6%,var(--panel))}
.v371-logging .v370-unit-top strong{color:var(--text)}.v371-logging .v370-unit-repeat-state{padding:3px 7px;border-radius:7px;background:color-mix(in srgb,var(--flow) 14%,var(--panel));color:var(--flow)}
.v371-logging .v370-unit-runtime{padding:5px;border-radius:9px;background:color-mix(in srgb,var(--flow) 4%,transparent)}
.v371-logging .v370-auto-totals>div{border-color:color-mix(in srgb,var(--flow) 22%,var(--border));background:color-mix(in srgb,var(--flow) 8%,var(--panel-raised,var(--surface)))}
.v371-logging .v370-auto-totals strong{color:var(--text)}
.v371-logging .v370-add-row{border-color:color-mix(in srgb,var(--flow) 30%,var(--border));background:color-mix(in srgb,var(--flow) 6%,var(--panel-raised,var(--surface)))}
.v371-logging .v370-add-title .v370-icon{color:var(--flow)}
.v371-logging .v239-logged-title-card{border-color:color-mix(in srgb,var(--flow) 20%,var(--border));background:color-mix(in srgb,var(--flow) 5%,var(--panel-raised,var(--surface)))}
.v371-logging .v239-logged-title-copy{min-width:0}.v371-logging .v371-quick-status{width:max-content;max-width:100%;margin-top:6px}
.v371-logging .v239-log-mode-options{display:flex;flex-wrap:wrap;gap:8px}.v371-logging .v239-log-mode-options button{display:inline-flex;gap:6px;align-items:center;justify-content:center}
.v371-logging [class*=xp-preview],.v371-logging .v179-log-mode-help{border-color:color-mix(in srgb,var(--flow) 18%,var(--border))}
.v371-logging .v370-title-content[hidden]{display:none!important}
#v336-dialog-root .v371-keep-titles{gap:7px!important}
#v336-dialog-root .v371-keep-titles .v370-icon{color:var(--flow)}
@media(max-width:720px){.v371-logging .v370-interface{box-shadow:inset 0 3px 0 color-mix(in srgb,var(--flow) 55%,transparent)}.v371-logging .v370-title-head{box-shadow:inset 2px 0 0 color-mix(in srgb,var(--flow) 55%,transparent)}.v371-logging .v239-log-mode-options button{flex:1 1 135px;min-height:39px}.v371-logging .v370-status .v225-btn-icon{width:13px;height:13px}}
@media(prefers-reduced-motion:reduce){.v371-logging .v370-mode-switch button,.v371-logging .v239-log-mode-options button,.v370-settings-modes button{transition:none!important}}
`;
document.head.appendChild(v371Style);
MediaFlowRuntime.version=V371_RELEASE;
window.MediaFlowV371={version:371,features:['Theme-aware logging accents and active modes','Default logging setting stable in-place updates','Canonical Library status icons','Deferred, localized collapse/expand','Keep titles icon']};
