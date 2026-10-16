/* v437 independent Cover Recovery connection tests.
 * A registered name is not a connection; only a returned image candidate can be verified. */
const MF437_COVER_TESTS={};
const mf437CoverSettingsBase=mf425SettingsMarkup;
mf425SettingsMarkup=function(){
 const html=String(mf437CoverSettingsBase.apply(this,arguments)||'');
 const rows=MF437_COVER_CATALOG.map(([id,name])=>{
  const active=Boolean(mf424Provider(id)?.limit);
  return '<div class="mf437-provider"><strong>'+mf437Escape(name)+'</strong>'+
   (active?'<button type="button" class="btn btn-ghost" onclick="App.mf437TestCover(\\''+mf437Escape(id)+'\\')">Test Cover</button>':
    '<small>Provider unavailable or awaiting access review</small>')+
   '<small id="mf437-cover-result-'+mf437Escape(id)+'">'+mf437Escape(MF437_COVER_TESTS[id]||'')+'</small></div>';
 }).join('');
 const extra='<details class="mf437-settings-cover-checks" data-mf-setting-id="cover-v437-verification"><summary><strong>Verify new public cover providers</strong></summary>'+
 '<p>These are real image tests. A provider may require an exact saved external ID, such as a Steam App ID or a MusicBrainz release ID.</p>'+
 '<label>Test title<input type="search" id="mf437-cover-test-title" maxlength="120" placeholder="Enter a matching title" value="Portal 2"></label>'+
 '<div class="mf437-providers">'+rows+'</div></details>';
 const target='<div class="mf425-settings-actions">';
 return html.includes(target)?html.replace(target,extra+target):html+extra;
};
async function mf437TestCover(provider){
 const src=MF437_COVER_CATALOG.find(x=>x[0]===provider),node=document.getElementById('mf437-cover-result-'+provider);
 if(!src||!mf424Provider(provider)?.limit)return;
 const title=String(document.getElementById('mf437-cover-test-title')?.value||'').trim();
 if(title.length<2){showToast('Enter a real title to test this cover provider.');return;}
 const saved=(S.library||[]).find(x=>mf437Name(x.title)===mf437Name(title));
 const item=saved||{title,externalIds:{},mediaMetadata:{}};
 if(node)node.textContent='Checking actual cover results…';
 try{
  const matches=(await mf424Discover(item,provider)).filter(c=>c?.url).slice(0,8);
  if(!matches.length)throw Error('No cover returned for this title or its IDs');
  const candidate=matches.find(c=>c.idMatch)||matches[0];
  if(typeof mf424Image==='function'&&!(await mf424Image(candidate.url,provider)))throw Error('Image URL failed actual validation');
  const msg='Verified image returned · '+new Date().toLocaleDateString();
  MF437_COVER_TESTS[provider]=msg;if(node)node.textContent=msg;
  S.settings=S.settings||{};S.settings.v437VerifiedCoverProviders=[...new Set([...(S.settings.v437VerifiedCoverProviders||[]),provider])];
  await saveState();
 }catch(e){const msg='Not verified · '+String(e.message||e).slice(0,105);MF437_COVER_TESTS[provider]=msg;if(node)node.textContent=msg;}
}
Object.assign(App,{mf437TestCover});
