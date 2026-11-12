/* MediaFlow v384 — Theme-colored Logging Library header and future-proof About branding.
 * Branding and version strings intentionally derive from the application entry point,
 * not this module's release number. No cloud schema or user-data changes.
 */
const V384_RUNTIME_VERSION=384;
const V384_ABOUT_LOGO='assets/icons/mediaflow-192.png';

// A small amount of older FAQ copy still referred to "Personal Edition".
// The About page should now use the public-facing MediaFlow brand everywhere.
for(const faq of V383_FAQS){
  if(typeof faq.answer==='string')faq.answer=faq.answer.replace(/\s*[—–-]\s*Personal Edition\b/gi,'').replace(/\bPersonal Edition\b/gi,'').replace(/\s{2,}/g,' ').trim();
  if(typeof faq.question==='string')faq.question=faq.question.replace(/\bPersonal Edition\b/gi,'MediaFlow');
}

// `v161CurrentVersion()` reads the release-specific <meta> produced by build.py.
// This renderer intentionally has no hardcoded version displayed in About, so
// future releases will not require editing the v384 branding implementation.
function v384AboutCurrentVersion(){
  const value=String(v161CurrentVersion()).trim();
  return /^\d+(?:\.\d+)*$/.test(value)?value:'—';
}
const v384RenderAboutBase=renderAbout;
renderAbout=function(){
  const html=String(v384RenderAboutBase.apply(this,arguments)||'');
  const container=document.createElement('div');
  container.innerHTML=html;
  const root=container.querySelector('.mf383-about');
  if(!root)return html;
  root.classList.add('mf384-about');
  const label=root.querySelector('.mf383-hero-label');
  if(label)label.textContent='BY ALEX GODLY';
  const logo=root.querySelector('.mf383-about-brand .mf383-brand-mark');
  if(logo){
    logo.classList.add('mf384-brand-logo');
    logo.innerHTML=`<img src="${V384_ABOUT_LOGO}" alt="MediaFlow logo" width="64" height="64" decoding="async">`;
  }
  const version=v384AboutCurrentVersion();
  const heroVersion=root.querySelector('.mf383-brand-version');
  if(heroVersion)heroVersion.textContent=`VERSION ${version} · YOUR MEDIA UNIVERSE`;
  for(const tile of root.querySelectorAll('.mf383-stat')){
    const caption=tile.querySelector('span');
    if(/version/i.test(caption?.textContent||'')){
      const value=tile.querySelector('strong');
      if(value)value.textContent=`v${version}`;
    }
  }
  // Do not change historic facts, update controls, or feature functionality.
  // Other About copy is refreshed from source FAQ content above.
  return container.innerHTML;
};

App.v384AboutCurrentVersion=v384AboutCurrentVersion;
window.MediaFlowV384={version:V384_RUNTIME_VERSION,features:['Full-surface themed Logging Library header','Official About logo','Dynamic About versions','Simplified MediaFlow branding']};
MediaFlowRuntime.version=V384_RUNTIME_VERSION;
