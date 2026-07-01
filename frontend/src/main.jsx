import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Sparkles, Bug, CheckCircle2, XCircle, Copy, Download, Github, Zap } from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const sampleCode = `function add(a, b) {
  return a + b;
}

function calculateTotal(price, quantity) {
  return price * quantity;
}

function isEven(n) {
  return n % 2 === 0;
}`;

function App() {
  const [code, setCode] = useState(sampleCode);
  const [testCode, setTestCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('ready');
  const [error, setError] = useState('');

  const healthScore = useMemo(() => {
    if (!result?.stats?.tests) return 0;
    return Math.round((result.stats.passed / result.stats.tests) * 100);
  }, [result]);

  async function generateTests() {
    setLoading(true); setError(''); setMode('generating');
    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate tests');
      setTestCode(data.testCode);
      setMode('generated');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runTests() {
    setLoading(true); setError(''); setMode('running');
    try {
      const response = await fetch(`${API_BASE}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, testCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to run tests');
      setResult(data);
      if (!testCode) setTestCode(data.generatedTestCode);
      setMode('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyTests() {
    navigator.clipboard.writeText(testCode || '');
  }

  function downloadTests() {
    const blob = new Blob([testCode || ''], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.test.mjs';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <div className="pill"><Sparkles size={16} /> Agentic JavaScript Testing Assistant</div>
          <h1>TestMate AI</h1>
          <p>Paste code, generate tests, run them, and understand bugs in one workflow.</p>
        </div>
        <div className="hero-card">
          <Zap size={26} />
          <span>Analyze → Generate → Execute → Explain</span>
        </div>
      </section>

      <section className="grid">
        <div className="panel code-panel">
          <div className="panel-head">
            <div>
              <h2>1. Your JavaScript Code</h2>
              <p>Use named functions for best results.</p>
            </div>
            <button className="ghost" onClick={() => setCode(sampleCode)}>Load sample</button>
          </div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false" />
          <div className="actions">
            <button onClick={generateTests} disabled={loading}><Sparkles size={18}/> Generate Tests</button>
            <button className="primary" onClick={runTests} disabled={loading}><Play size={18}/> Run Tests</button>
          </div>
          {error && <div className="error"><Bug size={18}/>{error}</div>}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>2. Generated Test File</h2>
              <p>Powered by node:test + test-extras.</p>
            </div>
            <div className="mini-actions">
              <button className="icon-btn" onClick={copyTests} disabled={!testCode}><Copy size={16}/></button>
              <button className="icon-btn" onClick={downloadTests} disabled={!testCode}><Download size={16}/></button>
            </div>
          </div>
          <pre className="test-box">{testCode || '// Click Generate Tests to create generated.test.mjs'}</pre>
        </div>
      </section>

      <section className="result-layout">
        <div className="panel stats-panel">
          <h2>3. Result Dashboard</h2>
          <div className="stats">
            <Stat label="Tests" value={result?.stats?.tests ?? '-'} />
            <Stat label="Passed" value={result?.stats?.passed ?? '-'} good />
            <Stat label="Failed" value={result?.stats?.failed ?? '-'} bad />
            <Stat label="Score" value={result ? `${healthScore}%` : '-'} />
          </div>
          <div className={`status ${result?.ok ? 'success' : result ? 'fail' : ''}`}>
            {result?.ok ? <CheckCircle2 /> : result ? <XCircle /> : <Sparkles />}
            <span>{result ? (result.ok ? 'All tests passed' : 'Needs fixing') : `Status: ${mode}`}</span>
          </div>
          <div className="explain">
            <h3>AI-style Explanation</h3>
            <p>{result?.explanation || 'Run tests to get a simple explanation and fix direction.'}</p>
          </div>
        </div>

        <div className="panel output-panel">
          <div className="panel-head">
            <div>
              <h2>4. Test Runner Output</h2>
              <p>Raw terminal output from Node.js.</p>
            </div>
          </div>
          <pre className="output">{result?.output || 'No output yet.'}</pre>
        </div>
      </section>

      <footer>
        <span>Built for Gappy AI Hackathon</span>
        <span><Github size={16}/> Make your GitHub repo public before submission.</span>
      </footer>
    </main>
  );
}

function Stat({ label, value, good, bad }) {
  return <div className={`stat ${good ? 'good' : ''} ${bad ? 'bad' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

createRoot(document.getElementById('root')).render(<App />);
