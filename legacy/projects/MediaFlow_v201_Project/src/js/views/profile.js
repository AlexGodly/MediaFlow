/* MediaFlow v201 source fragment
 * Profile settings view
 * Original HTML lines 9449-9532.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   VIEW: PROFILE SETTINGS

   ============================================================ */

async function deleteCloudAccount(){
  if(!AUTH_USER||!supabase){alert('No cloud account is currently signed in.');return;}
  const email=AUTH_USER.email||'';
  if(!confirm(`Delete your MediaFlow account${email?` (${email})`:''}?\n\nThis permanently deletes the account and MediaFlow cloud data.`))return;
  if(prompt('Type DELETE to permanently confirm account deletion.','')!=='DELETE'){alert('Account deletion cancelled.');return;}
  try{
    const {error}=await supabase.rpc('delete_my_account');
    if(error)throw error;
    AUTH_USER=null; AUTH_READY=false;
    try{localStorage.removeItem(STATE_KEY);}catch(e){}
    renderAuthScreen('login','Your account and MediaFlow cloud data were deleted.');
  }catch(e){console.error(e);alert('Account deletion was not completed. Add the delete_my_account Supabase RPC function first. Your account was not deleted.');}
}

function renderProfile(){
  const email=escapeHtml(AUTH_USER?.email||'');
  return `
    <div class="view-head"><div><button class="btn btn-ghost btn-sm" onclick="App.backFromProfile()">← Back</button><div class="view-title" style="margin-top:12px;">Profile settings</div><div class="view-desc">Manage your MediaFlow account and profile.</div></div></div>
    <div class="profile-card">
      <div class="section-label">PROFILE PICTURE</div>
      <div class="card profile-section">
        <div class="profile-avatar-wrap">
          <button class="account-avatar-btn" style="width:88px;height:88px;" onclick="document.getElementById('profile-picture-input')?.click()" title="Change profile picture">${renderProfileAvatar()}</button>
          <div><div style="font-weight:700;">Your profile picture</div><div class="profile-note">Images are resized and prepared for cloud storage. Choose a picture, then click Save picture.</div></div>
        </div>
        <div class="profile-avatar-actions">
          <label class="btn btn-primary" style="cursor:pointer;">Choose picture<input id="profile-picture-input" type="file" accept="image/*" style="display:none" onchange="window.MediaFlowProfile.chooseAvatar(this.files[0])"></label>
          <button id="save-profile-picture" class="btn btn-primary" onclick="window.MediaFlowProfile.saveAvatar()" ${getAvatarUrl()?'':'disabled'}>Save picture</button>
          ${getAvatarUrl()?'<button class="btn btn-danger" onclick="window.MediaFlowProfile.removeAvatar()">Remove picture</button>':''}
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-soft)">
          <div class="field">
            <label class="field-label">Or use an image URL</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <input id="profile-picture-url" type="url" inputmode="url" placeholder="https://example.com/avatar.jpg" style="flex:1;min-width:220px">
              <button id="use-profile-picture-url" class="btn btn-primary" onclick="window.MediaFlowProfile.useAvatarUrl()">Use URL</button>
            </div>
            <div class="profile-note">Use a direct public http:// or https:// image URL. The URL is saved with your MediaFlow cloud state.</div>
          </div>
        </div>
      </div>

      <div class="section-label">NAME</div>
      <div class="card profile-section">
        <div class="field"><label class="field-label">Display name</label><input id="profile-name" type="text" autocomplete="name" maxlength="80" value="${escapeHtml(AUTH_USER?String(AUTH_USER?.user_metadata?.display_name||''):String(S.profileName||''))}" placeholder="Your name"></div>
        <div class="profile-note">If you leave your name empty, MediaFlow will show your account email instead.</div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updateName()">Save name</button></div>
      </div>

      <div class="section-label">EMAIL</div>
      <div class="card profile-section">
        <div class="field"><label class="field-label">Email address</label><input id="profile-email" type="email" autocomplete="email" value="${email}"></div>
        <div class="profile-note">Changing your email may require confirmation from the new address before it becomes active.</div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updateEmail()">Change email</button></div>
      </div>

      <div class="section-label">PASSWORD</div>
      <div class="card profile-section">
        <div class="field-row">
          <div class="field"><label class="field-label">New password</label><input id="profile-password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"></div>
          <div class="field"><label class="field-label">Confirm new password</label><input id="profile-password-confirm" type="password" autocomplete="new-password" minlength="6" placeholder="Repeat password"></div>
        </div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updatePassword()">Change password</button></div>
      </div>

      <div class="section-label">ACCOUNT</div>
      <div class="card">
        <div style="font-weight:700;">Cloud account</div>
        <div class="profile-note">Your MediaFlow library, history, settings and progress are synced to this Supabase account. Signing out does not delete your cloud data.</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
          <button class="btn" onclick="window.MediaFlowAuth.logout()">Log out</button>
          <button class="btn btn-danger" onclick="App.deleteCloudAccount()">Delete account</button>
        </div>
        <div class="profile-note" style="margin-top:8px;">Log out keeps your cloud data safe. Delete account permanently removes your cloud account and MediaFlow data after confirmation.</div>
      </div>
    </div>`;
}
