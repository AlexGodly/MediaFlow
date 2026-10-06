/* ============================================================
   MediaFlow v224 — Page Naming Cleanup
   ------------------------------------------------------------
   Order -> Personal Order
   Profile settings -> Account
   IDs stay unchanged for complete navigation/data compatibility.
   ============================================================ */
const v224OrderNavItem=NAV_ITEMS.find(n=>n.id==='order');
if(v224OrderNavItem)v224OrderNavItem.label='Personal Order';
const v224ProfileNavItem=NAV_ITEMS.find(n=>n.id==='profile');
if(v224ProfileNavItem)v224ProfileNavItem.label='Account';

const v224RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v224RenderOrderBase.apply(this,arguments);
  h=h.replace('<h1>Order</h1>','<h1>Personal Order</h1>');
  h=h.replace('Titles added to Order','Titles added to Personal Order');
  return h;
};

const v224RenderProfileBase=renderProfile;
renderProfile=function(){
  let h=v224RenderProfileBase.apply(this,arguments);
  h=h.replace('>Profile settings<','>Account<');
  h=h.replace('Manage your MediaFlow account and profile.','Manage your MediaFlow account and profile.');
  return h;
};
