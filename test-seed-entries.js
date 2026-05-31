#!/usr/bin/env node

/**
 * Test script for seed entries - Task 2
 * Verifies that seed entries exist and can be read
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const requiredUtilityEntries = [
  'src/content/projects/intiface-central.md',
  'src/content/projects/buttplug-playground.md',
  'src/content/projects/toywebbridge.md',
];

let passed = 0;
let failed = 0;

console.log('Testing Task 2: Seed entries for utilities section\n');

// Test 1: Files exist
console.log('Test 1: Utility section entry files exist');
for (const file of requiredUtilityEntries) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
    passed++;
  } else {
    console.log(`  ✗ ${file} - NOT FOUND`);
    failed++;
  }
}

// Test 2: Files have required frontmatter fields
console.log('\nTest 2: Entry files have required frontmatter fields');
const requiredFields = ['title', 'url', 'section', 'tags', 'summary', 'readme_bullets'];

for (const file of requiredUtilityEntries) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);

    if (!match) {
      console.log(`  ✗ ${file} - no frontmatter found`);
      failed++;
      continue;
    }

    const frontmatter = match[1];
    let missingFields = [];

    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length === 0) {
      console.log(`  ✓ ${file}`);
      passed++;
    } else {
      console.log(`  ✗ ${file} - missing fields: ${missingFields.join(', ')}`);
      failed++;
    }
  }
}

// Test 3: Entries have section "applications/utilities"
console.log('\nTest 3: Entries have correct section');
for (const file of requiredUtilityEntries) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('section: "applications/utilities"')) {
      console.log(`  ✓ ${file}`);
      passed++;
    } else {
      console.log(`  ✗ ${file} - incorrect section`);
      failed++;
    }
  }
}

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
