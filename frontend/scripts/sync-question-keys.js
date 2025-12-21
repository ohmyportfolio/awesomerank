#!/usr/bin/env node
/**
 * Syncs question keys from questions.ts to all locale files.
 * Run: node scripts/sync-question-keys.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');
const questionsFile = path.join(__dirname, '../src/data/questions.ts');

// Read questions.ts and extract ids and categories
const questionsContent = fs.readFileSync(questionsFile, 'utf-8');

// Extract question ids
const idMatches = questionsContent.matchAll(/id:\s*["'`](.+?)["'`]/g);
const ids = [...idMatches].map(m => m[1]);

// Extract categories
const categoryMatches = questionsContent.matchAll(/category:\s*["'`](.+?)["'`]/g);
const categories = [...new Set([...categoryMatches].map(m => m[1]))];

const allKeys = [...ids, ...categories];

console.log(`Found ${ids.length} questions and ${categories.length} categories`);

// Get all locale files
const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of localeFiles) {
  const filePath = path.join(localesDir, file);
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let added = 0;
  for (const key of allKeys) {
    if (!(key in locale)) {
      // For en.json, value = key. For others, empty string.
      locale[key] = file === 'en.json' ? key : '';
      added++;
    }
  }

  // Sort keys alphabetically
  const sorted = Object.keys(locale).sort().reduce((obj, key) => {
    obj[key] = locale[key];
    return obj;
  }, {});

  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');

  if (added > 0) {
    console.log(`${file}: added ${added} keys`);
  }
}

console.log('Done!');
