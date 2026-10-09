/* MediaFlow v322 — sidebar avatar and username navigate to the signed-in user's public Community profile.
 * Account/settings access is preserved via App.openProfile and the Account navigation item.
 */
let mf322OpeningPublicProfile=false;
App.openSidebarPublicProfile=async function(){
  const accountId=AUTH_USER?.id;
  if(!accountId){
    try{mfLogin();}catch(_){showToast('Sign in to view your public profile.');}
    return;
  }
  if(mf322OpeningPublicProfile)return;
  mf322OpeningPublicProfile=true;
  try{
    // Read the authenticated user's profile by user_id; display names and email
    // addresses are not Community route identifiers.
    const profile=await mfMyProfile();
    if(AUTH_USER?.id!==accountId)return; // Ignore a stale response after account switching.
    const username=String(profile?.username||'').trim().toLowerCase();
    if(profile?.is_public===true && /^[a-z][a-z0-9_]{2,23}$/.test(username)){
      mfGo(username); // Existing public routing: /MediaFlow/<username> on GitHub Pages.
    }else{
      // No public/valid profile yet: open the Public Profile editor, NOT Account.
      mfWorkspaceView('mf302-profile');
      showToast('Enable and save your public profile to view it.');
    }
  }catch(error){
    console.warn('[MediaFlow v322] Could not open own public profile:',error);
    if(AUTH_USER?.id===accountId)showToast('Could not open your public profile. Please try again.');
  }finally{
    mf322OpeningPublicProfile=false;
  }
};
