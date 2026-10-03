import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'src/js/parts-manifest.json'), 'utf8'));
const compat = manifest.at(-1);
const inner = manifest.slice(0, -1);

function stripFragmentHeader(source) {
  return source.replace(/^\/\* MediaFlow v201 source fragment[\s\S]*?\*\/\s*/u, '');
}

const pieces = [];
for (const part of inner) {
  pieces.push(stripFragmentHeader(await readFile(resolve(root, part.file), 'utf8')).trimEnd());
}
const compatSource = stripFragmentHeader(await readFile(resolve(root, compat.file), 'utf8')).trim();

const banner = `/* MediaFlow v201 — generated application bundle.\n * Source: src/js/**\n * Build: npm run build\n * Do not hand-edit this generated file.\n */`;
const output = `${banner}\n\n(function(){\n\n'use strict';\n\n${pieces.join('\n\n')}\n\n})();\n\n${compatSource}\n`;
const target = resolve(root, 'assets/js/mediaflow.js');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, output, 'utf8');
console.log(`Built ${target}`);
