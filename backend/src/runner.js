import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { buildExportableUserCode, generateTestCode } from './testGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpRoot = path.join(__dirname, '..', 'tmp');

export async function runGeneratedTests({ code, testCode }) {
  const id = nanoid(8);
  const dir = path.join(tmpRoot, id);
  await fs.mkdir(dir, { recursive: true });

  const userFile = path.join(dir, 'user-code.mjs');
  const testFile = path.join(dir, 'generated.test.mjs');
  const finalTestCode = testCode?.trim() ? testCode : generateTestCode(code);

  await fs.writeFile(userFile, buildExportableUserCode(code), 'utf8');
  await fs.writeFile(testFile, finalTestCode, 'utf8');

  const start = Date.now();
  const result = await executeNodeTest(testFile, dir);
  const durationMs = Date.now() - start;

  fs.rm(dir, { recursive: true, force: true }).catch(() => {});

  const stats = parseNodeTestOutput(result.output);
  const explanation = explainResult(result.output, result.exitCode, stats);

  return {
    ok: result.exitCode === 0,
    exitCode: result.exitCode,
    durationMs,
    output: result.output,
    stats,
    explanation,
    generatedTestCode: finalTestCode
  };
}

function executeNodeTest(testFile, cwd) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ['--test', testFile],
      {
        cwd,
        timeout: 10000,
        maxBuffer: 1024 * 1024
      },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error?.code ?? 0,
          output: `${stdout || ''}${stderr || ''}`.trim()
        });
      }
    );
  });
}

function parseNodeTestOutput(output = '') {
  const stats = { tests: 0, passed: 0, failed: 0, cancelled: 0, skipped: 0, todo: 0 };
  const map = {
    tests: /[ℹ#]\s*tests\s+(\d+)/i,
    passed: /[ℹ#]\s*pass\s+(\d+)/i,
    failed: /[ℹ#]\s*fail\s+(\d+)/i,
    cancelled: /[ℹ#]\s*cancelled\s+(\d+)/i,
    skipped: /[ℹ#]\s*skipped\s+(\d+)/i,
    todo: /[ℹ#]\s*todo\s+(\d+)/i
  };

  for (const [key, regex] of Object.entries(map)) {
    const match = output.match(regex);
    if (match) stats[key] = Number(match[1]);
  }
  return stats;
}

function explainResult(output, exitCode, stats) {
  if (exitCode === 0) {
    return 'All generated tests passed. The tested functions worked correctly for the selected sample and edge cases.';
  }

  if (/SyntaxError/i.test(output)) {
    return 'The test failed because the submitted JavaScript has a syntax error. Check brackets, commas, export statements, and function declarations.';
  }
  if (/ReferenceError/i.test(output)) {
    return 'The test failed because a variable or function name was not found. Make sure the function is named and accessible.';
  }
  if (/AssertionError/i.test(output)) {
    return `Some assertions failed. Passed: ${stats.passed}, Failed: ${stats.failed}. The function output did not match the expected result.`;
  }
  if (/timeout/i.test(output)) {
    return 'The test timed out. Your code may contain an infinite loop or a long-running async operation.';
  }
  return 'The test runner found an issue. Read the output log to identify the failing test and error details.';
}
