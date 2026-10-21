#!/usr/bin/env node
/* Static checks for the museum, with no dependencies: `node tools/check.js`
 *
 *  1. every script referenced by index.html exists and parses
 *  2. no two plain (non-IIFE) scripts declare the same top-level name —
 *     they share one global scope, so a duplicate `const` stops the later
 *     file from running at all, and the page hangs on its loading bar
 *  3. every model the props module asks for is present in assets/
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
let failed = 0;
const fail = msg => { failed++; console.log('  ✗ ' + msg); };

console.log('Scripts (' + scripts.length + ')');
const globals = new Map();
const decl = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
for (const rel of scripts) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { fail(rel + ' is missing'); continue; }
  const src = fs.readFileSync(file, 'utf8');
  try { new Function(src); } catch (e) { fail(rel + ': ' + e.message); continue; }
  if (/^\s*(\/\*[\s\S]*?\*\/\s*)*\(function/.test(src)) continue;   /* wrapped: names stay local */
  for (const m of src.matchAll(decl)) {
    const name = m[1] || m[2];
    if (globals.has(name)) fail(`"${name}" is declared in both ${globals.get(name)} and ${rel}`);
    else globals.set(name, rel);
  }
}

console.log('Models');
const props = fs.readFileSync(path.join(root, 'js/world/props.js'), 'utf8');
for (const m of props.matchAll(/'((?:robot|furniture|food)\/[^']+\.glb)'/g)) {
  if (!fs.existsSync(path.join(root, 'assets/models', m[1]))) fail('assets/models/' + m[1] + ' is missing');
}

console.log(failed ? `\n${failed} problem(s) found.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
