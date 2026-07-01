import express from 'express';
import cors from 'cors';
import { generateTestCode, extractFunctions } from './testGenerator.js';
import { runGeneratedTests } from './runner.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'TestMate AI Backend' });
});

app.post('/api/analyze', (req, res) => {
  const code = String(req.body.code || '');
  res.json({ functions: extractFunctions(code) });
});

app.post('/api/generate', (req, res) => {
  const code = String(req.body.code || '');
  const functions = extractFunctions(code);
  const testCode = generateTestCode(code);
  res.json({ functions, testCode });
});

app.post('/api/run', async (req, res) => {
  try {
    const code = String(req.body.code || '');
    const testCode = req.body.testCode ? String(req.body.testCode) : undefined;
    if (!code.trim()) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const result = await runGeneratedTests({ code, testCode });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to run tests',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`TestMate AI backend running on http://localhost:${PORT}`);
});
