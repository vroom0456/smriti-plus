/**
 * SMRITI+ — Translation Completeness Checker
 *
 * Runs across all locale files and ensures parity with en.json.
 */

const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '../src/i18n');
const enPath = path.join(i18nDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function extractKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(extractKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = extractKeys(en);
console.log(`\x1b[36mBase English keys found:\x1b[0m ${enKeys.length}`);

const locales = ['as', 'bodo'];

locales.forEach((loc) => {
  const locPath = path.join(i18nDir, `${loc}.json`);
  if (!fs.existsSync(locPath)) {
    console.log(`\x1b[31m[FAIL]\x1b[0m Missing file: ${loc}.json`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  const locKeys = new Set(extractKeys(data));

  let missing = [];
  enKeys.forEach((k) => {
    if (!locKeys.has(k)) {
      missing.push(k);
    }
  });

  const percentage = (((enKeys.length - missing.length) / enKeys.length) * 100).toFixed(1);

  if (missing.length === 0) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${loc}.json has 100% parity (${enKeys.length}/${enKeys.length})`);
  } else {
    console.log(
      `\x1b[33m[WARN]\x1b[0m ${loc}.json is ${percentage}% complete. (${missing.length} keys missing)`
    );
  }
});
