// Lists [logic] spec IDs with no test, and tests named with an ID no spec has
// (docs/testing.md section 5). Prints only; never fails.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SPEC_DIR = 'docs/specs';
const SRC_DIR = 'src';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const allIds = new Set();
const logicIds = new Set();
for (const file of readdirSync(SPEC_DIR).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(join(SPEC_DIR, file), 'utf8');
  for (const m of text.matchAll(/^- ([A-Z]{2}-\d+)\b(.*)$/gm)) {
    allIds.add(m[1]);
    if (m[2].includes('[logic]') && !/\bremoved\b/i.test(m[2])) logicIds.add(m[1]);
  }
}

const testedIds = new Set();
for (const file of walk(SRC_DIR).filter((f) => f.endsWith('.test.ts'))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\b(?:it|test)(?:\.each\([^)]*\))?\(\s*['"`]([A-Z]{2}-\d+)\b/g)) {
    testedIds.add(m[1]);
  }
}

const missing = [...logicIds].filter((id) => !testedIds.has(id));
const unknown = [...testedIds].filter((id) => !allIds.has(id));

console.log(`[logic] rules: ${logicIds.size}, with a test: ${logicIds.size - missing.length}`);
console.log(`No test yet (${missing.length}): ${missing.join(', ') || 'none'}`);
console.log(`Tests with unknown IDs (${unknown.length}): ${unknown.join(', ') || 'none'}`);
