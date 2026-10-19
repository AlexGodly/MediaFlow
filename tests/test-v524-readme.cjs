/* MediaFlow v524 — public README presentation and integrity checks. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const text=fs.readFileSync(path.join(root,'README.md'),'utf8');
const includes=[
 'MediaFlow','by Alex Godly','A better way to experience your media',
 'Inside MediaFlow','A library for everything','Recommendations with purpose',
 'Logging built around real progress','Collections & Personal Order',
 'Designed to go with you','Get started','Project & resources',
 'MediaFlow Proprietary License','Supabase','Progressive Web App'
];
for(const phrase of includes)assert(text.includes(phrase),'README missing '+phrase);
assert(text.length>4500,'README requires complete professional product overview');
assert(!/open[ -]?source software|MIT license|Apache license/i.test(text),'Do not misstate proprietary licensing');
assert(!/v520|v521|v522|v523/.test(text),'General README must not advertise canceled actions or turn into a historical changelog');
for(const filename of ['icon.svg','v398-ui-preview-1280.png','v398-ui-preview-375.png','LICENSE','docs/ARCHITECTURE.md'])
 assert(fs.existsSync(path.join(root,filename)),'README references missing asset '+filename);
assert.equal((text.match(/<table>/g)||[]).length,(text.match(/<\/table>/g)||[]).length,'Unbalanced HTML tables');
assert.equal((text.match(/<div\b/g)||[]).length,(text.match(/<\/div>/g)||[]).length,'Unbalanced HTML divs');
assert(!/<p>\s*<h[1-6]/.test(text),'Invalid headings nested inside paragraphs');
console.log('PASS v524: professional README, branded assets, features, links, license, and HTML structure');
