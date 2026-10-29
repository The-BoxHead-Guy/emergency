#!/usr/bin/env node
/**
 * The IIFE bundle targets a plain <script> tag, so it cannot start with an
 * `import './style.css'` statement. tsdown's `css.inject` option preserves that
 * import rather than inlining the stylesheet, so this step embeds the emitted
 * CSS as a global string and lets src/iife.ts inject and remove a <style> tag.
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const bundlePath = fileURLToPath(
  new URL('../dist/iife/emergency.iife.global.js', import.meta.url),
);
const cssPath = fileURLToPath(
  new URL('../dist/iife/style.css', import.meta.url),
);

const css = await readFile(cssPath, 'utf8');
const source = await readFile(bundlePath, 'utf8');
const withoutImport = source.replace(/^import\s+['"][^'"]+\.css['"];\s*/, '');

if (withoutImport === source) {
  throw new Error(
    'No leading CSS import found in the IIFE bundle; check the pack config.',
  );
}

if (/^\s*import\s/m.test(withoutImport)) {
  throw new Error(
    'The IIFE bundle still contains import statements and cannot run as a classic script.',
  );
}

if (!css.includes('de-emergency-emergency-panel')) {
  throw new Error(
    'The emitted IIFE stylesheet does not contain the panel styles.',
  );
}

const banner = `globalThis.__DE_EMERGENCY_CSS_TEXT__ = ${JSON.stringify(css)};\n`;
await writeFile(bundlePath, banner + withoutImport);

// The banner is prepended, so every mapped line shifts by one and the source
// map needs the same leading break to stay valid.
const rawMap = await readFile(`${bundlePath}.map`, 'utf8');
const map = JSON.parse(rawMap);
map.mappings = ';' + map.mappings;
await writeFile(`${bundlePath}.map`, JSON.stringify(map));

await rm(cssPath, { force: true });
await rm(`${cssPath}.map`, { force: true });

console.log(`Embedded the stylesheet in ${bundlePath}`);
