const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
const arrowPattern = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?([^=;()]*)\)?\s*=>/g;

export function extractFunctions(code = '') {
  const found = [];
  for (const match of code.matchAll(functionPattern)) {
    found.push({ name: match[1], params: parseParams(match[2]) });
  }
  for (const match of code.matchAll(arrowPattern)) {
    if (!found.some((item) => item.name === match[1])) {
      found.push({ name: match[1], params: parseParams(match[2]) });
    }
  }
  return found;
}

function parseParams(raw = '') {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/=.*/, '').trim());
}

export function buildExportableUserCode(code = '') {
  const functions = extractFunctions(code);
  const names = functions.map((item) => item.name);
  const alreadyHasExport = /\bexport\b/.test(code);
  if (alreadyHasExport || names.length === 0) return code;
  return `${code}\n\nexport { ${names.join(', ')} };\n`;
}

function safeFunctionAccess(name) {
  return `user.${name}`;
}

function testForFunction(fn) {
  const name = fn.name;
  const lower = name.toLowerCase();
  const access = safeFunctionAccess(name);

  const lines = [];
  lines.push(`test('${name} exists and is a function', () => {`);
  lines.push(`  assert.equal(typeof ${access}, 'function');`);
  lines.push(`});`);

  if (['add', 'sum', 'addition'].some((key) => lower.includes(key))) {
    lines.push(`test('${name} adds numbers correctly', () => {`);
    lines.push(`  assert.equal(${access}(2, 3), 5);`);
    lines.push(`  assert.equal(${access}(-1, 1), 0);`);
    lines.push(`  closeTo(${access}(0.1, 0.2), 0.3, 0.000001);`);
    lines.push(`});`);
  } else if (['multiply', 'mul', 'product'].some((key) => lower.includes(key))) {
    lines.push(`test('${name} multiplies numbers correctly', () => {`);
    lines.push(`  assert.equal(${access}(4, 5), 20);`);
    lines.push(`  assert.equal(${access}(10, 0), 0);`);
    lines.push(`});`);
  } else if (lower.includes('total') || lower.includes('price') || lower.includes('amount')) {
    lines.push(`test('${name} calculates a total-like numeric result', () => {`);
    lines.push(`  assert.equal(${access}(100, 2), 200);`);
    lines.push(`  inRange(${access}(50, 3), 100, 200);`);
    lines.push(`});`);
  } else if (lower.includes('even')) {
    lines.push(`test('${name} detects even numbers', () => {`);
    lines.push(`  assert.equal(${access}(4), true);`);
    lines.push(`  assert.equal(${access}(5), false);`);
    lines.push(`});`);
  } else if (lower.includes('odd')) {
    lines.push(`test('${name} detects odd numbers', () => {`);
    lines.push(`  assert.equal(${access}(5), true);`);
    lines.push(`  assert.equal(${access}(4), false);`);
    lines.push(`});`);
  } else if (lower.includes('reverse')) {
    lines.push(`test('${name} reverses text-like input', () => {`);
    lines.push(`  assert.equal(${access}('hello'), 'olleh');`);
    lines.push(`});`);
  } else if (lower.includes('include') || lower.includes('contains')) {
    lines.push(`test('${name} works with collection values', () => {`);
    lines.push(`  assert.equal(${access}([1, 2, 3], 2), true);`);
    lines.push(`});`);
  } else {
    lines.push(`test('${name} can be called safely with sample values', () => {`);
    lines.push(`  assert.doesNotThrow(() => ${access}(${sampleArgs(fn.params.length)}));`);
    lines.push(`});`);
  }

  return lines.join('\n');
}

function sampleArgs(count) {
  const samples = ['1', '2', "'test'", '[1, 2, 3]', '{ id: 1, name: \'demo\' }'];
  return samples.slice(0, Math.max(count, 0)).join(', ');
}

export function generateTestCode(code = '') {
  const functions = extractFunctions(code);
  if (functions.length === 0) {
    return `import test from 'node:test';\nimport assert from 'node:assert/strict';\n\ntest('source code should expose at least one named function', () => {\n  assert.fail('No named JavaScript functions were detected. Try function add(a, b) { return a + b; }');\n});\n`;
  }

  const tests = functions.map(testForFunction).join('\n\n');
  return `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { closeTo, inRange, matches, includes } from 'test-extras';\nimport * as user from './user-code.mjs';\n\n${tests}\n\ntest('exported function list matches detected functions', () => {\n  matches(Object.keys(user).sort(), ${JSON.stringify(functions.map((f) => f.name).sort())});\n});\n`;
}
