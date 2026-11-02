/* v555: stylesheets ship in one bundle built from src/css-order.json.
 * A stylesheet is "loaded by the live app" when index.html links it directly,
 * or when it is listed in css-order.json and index.html links the bundle. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','..');
function stylesheetLoaded(rel){
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  if(index.includes(rel))return true;
  const orderPath=path.join(root,'src/css-order.json');
  if(!fs.existsSync(orderPath))return false;
  const order=JSON.parse(fs.readFileSync(orderPath,'utf8'));
  const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
  return order.some(row=>row.path===rel)&&index.includes(`assets/css/mediaflow-v${version}.bundle.css`);
}
module.exports={stylesheetLoaded};
