/**
 * Lemma Agent Workflow Notes
 *
 * This file documents how the project is designed for Lemma SDK integration.
 * The current offline version uses the same workflow without requiring a paid API key:
 *
 * 1. analyzeCode: detect named functions from user code
 * 2. planTests: decide test strategy based on function names and parameters
 * 3. generateTests: create node:test + test-extras test file
 * 4. executeTests: run the generated tests in Node.js
 * 5. explainResults: convert terminal output into a simple developer report
 *
 * For the hackathon live pod, connect these steps to Lemma SDK tools/agents.
 */

export const lemmaWorkflow = [
  'Analyze submitted JavaScript source code',
  'Plan useful test cases and edge cases',
  'Generate node:test test file with test-extras assertions',
  'Run tests safely in backend execution environment',
  'Explain pass/fail results and suggest next fixes'
];
