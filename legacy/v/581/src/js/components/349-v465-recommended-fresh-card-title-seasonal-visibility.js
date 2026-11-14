/* MediaFlow v465 — concise Fresh Episodes label and strict seasonal targeting.
 * This is a read-only presentation correction for the v463 recommendation card.
 * The category must explicitly have Seasonal checked in Category Details,
 * AND fresh episode checking must not be Manual. An ID named "seasonal" alone
 * is not sufficient, nor is the task's category if the recommended title
 * is associated with a different category.
 */
const MF465_VERSION=465;
function mf465EligibleRecommendedCategory(item){
 if(!item)return null;
 const category=getCategory(item.categoryId);
 if(!category||category.seasonal!==true)return null;
 if(!v401AutomaticEnabled()||
    (typeof v380Mode==='function'&&v380Mode()==='manual'))return null;
 return category;
}
const mf465FreshBase=mf463FreshForRecommendedTitle;
mf463FreshForRecommendedTitle=function(item,taskCategory){
 const category=mf465EligibleRecommendedCategory(item);
 if(!category)return null;
 // Pass the actual recommended title's category to v463's original verified
 // ledger calculation; keep all unknown / 0 / source / progress safeguards.
 return mf465FreshBase.call(this,item,category);
};
const mf465CardBase=mf463FreshCard;
mf463FreshCard=function(report){
 return mf465CardBase.apply(this,arguments)
  .replace('Recommended title · fresh episodes left','Fresh episodes left');
};
window.MediaFlowV465=Object.freeze({
 version:MF465_VERSION,
 eligibleCategory:mf465EligibleRecommendedCategory,
 freshForTitle:(item,cat)=>mf463FreshForRecommendedTitle(item,cat),
 card:report=>mf463FreshCard(report)
});
MediaFlowRuntime.version=MF465_VERSION;
