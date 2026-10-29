#!/usr/bin/env node
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(
  here,
  '..',
  '..',
  'dist',
  'iife',
  'emergency.iife.global.js'
);
const target = join(here, 'emergency.global.js');

if (!existsSync(source)) {
  console.error('Build the library first: pnpm run build');
  process.exit(1);
}

copyFileSync(source, target);

const map = source + '.map';
const targetMap = target + '.map';
copyFileSync(map, targetMap);
console.log(`Copied ${map} -> ${targetMap}`);
