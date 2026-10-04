import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const index = await readFile(resolve(root, 'index.html'), 'utf8');
const required = [
  'assets/css/00-core.css','assets/css/10-navigation-library.css','assets/css/20-features-v123-v160.css',
  'assets/css/30-features-v161-v176.css','assets/css/40-features-v177-v195.css','assets/css/50-body-statistics.css',
  'assets/css/90-platform-themes.css','assets/css/99-final-overrides.css','assets/js/mediaflow.js','manifest.json','sw.js'
];
for (const file of required) await access(resolve(root, file));
if (/<style\b/i.test(index)) throw new Error('index.html still contains inline <style>.');
const inlineScripts = [...index.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)];
if (inlineScripts.length) throw new Error('index.html still contains inline application JavaScript.');
if (!index.includes('mediaflow-version" content="201"')) throw new Error('v201 metadata is missing.');
const app = await readFile(resolve(root, 'assets/js/mediaflow.js'), 'utf8');
for (const token of ['renderDashboard','renderLibrary','renderSettings','MediaFlow v201','SUPABASE_URL','init();']) {
  if (!app.includes(token)) throw new Error(`Generated app is missing required token: ${token}`);
}
const syntax = spawnSync(process.execPath, ['--check', resolve(root, 'assets/js/mediaflow.js')], { encoding:'utf8' });
if (syntax.status !== 0) throw new Error(`JavaScript syntax check failed:\n${syntax.stderr}`);
console.log('MediaFlow project checks passed.');
