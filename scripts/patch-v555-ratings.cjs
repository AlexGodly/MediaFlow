#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const bundlePath = path.join(process.cwd(), 'assets/js/mediaflow-v554.bundle.js');
const indexPath = path.join(process.cwd(), 'index.html');
const source = fs.readFileSync(bundlePath, 'utf8');
const discoverOld = ` const variants=[...new Set(mf439TitleVariants(item).map(v=>String(v||'').trim()).filter(Boolean))].slice(0,5);
 const threshold=mf439Preferences().minimumConfidence;
 for(const provider of providers){
  if(signal?.aborted)break;
  onProgress(provider,results.length);
  const providerRows=new Map();`;
const discoverNew = ` const baseVariants=[...new Set(mf439TitleVariants(item).map(v=>String(v||'').trim()).filter(Boolean))];
 const threshold=mf439Preferences().minimumConfidence;
 for(const provider of providers){
  if(signal?.aborted)break;
  onProgress(provider,results.length);
  // Reuse verified aliases discovered from earlier providers, so a romanized
  // title found by AniList can help Jikan/Kitsu and vice versa.
  const discoveredAliases=results.flatMap(row=>[row?.title,...(Array.isArray(row?.aliases)?row.aliases:[])]);
  const variants=[...new Set([...baseVariants,...discoveredAliases].map(v=>String(v||'').trim()).filter(Boolean))].slice(0,10);
  const providerRows=new Map();`;
if (source.split(discoverOld).length !== 2) throw new Error('Expected exactly one v554 discovery block; refusing to patch.');
let patched = source.replace(discoverOld, discoverNew);
const providerOld = '}).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4).map(x=>x.p);';
const providerNew = '}).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.p);';
if (patched.split(providerOld).length !== 2) throw new Error('Expected exactly one four-provider cap; refusing to patch.');
patched = patched.replace(providerOld, providerNew);
if (patched === source || !patched.includes(discoverNew) || !patched.includes(providerNew)) throw new Error('Patch verification failed.');
const outBundle = path.join(process.cwd(), 'assets/js/mediaflow-v555.bundle.js');
fs.writeFileSync(outBundle, patched);
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('content="554"') || !html.includes('assets/js/mediaflow-v554.bundle.js')) throw new Error('index.html is not the expected v554 entry point.');
html = html.replace('content="554"', 'content="555"').replace('assets/js/mediaflow-v554.bundle.js', 'assets/js/mediaflow-v555.bundle.js');
fs.writeFileSync(indexPath, html);
console.log('Generated v555 bundle: alias propagation across providers; removed four-provider auto-rating cap.');
