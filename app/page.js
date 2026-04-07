'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import QuizOutput from './components/QuizOutput';
import TypingAnimation from './components/TypingAnimation';
import Header from './components/Header';
import MermaidChart from './components/MermaidChart';
import { LUCKY_TOPICS } from './data/luckyTopics';

const ACTION_META = {
  summary: {
    icon: '📝',
    label: 'Summarize',
    desc: 'Get a clear, concise summary',
    className: 'action-btn-summary',
    badgeLabel: 'Summary',
    title: 'AI Summary',
  },
  explain: {
    icon: '🎓',
    label: 'Explain',
    desc: 'Simple teacher-style explanation',
    className: 'action-btn-explain',
    badgeLabel: 'Explanation',
    title: 'Simple Explanation',
  },
  quiz: {
    icon: '❓',
    label: 'Generate Questions',
    desc: '20 MCQs and 10 Theory questions',
    className: 'action-btn-quiz',
    badgeLabel: 'Quiz',
    title: 'Exam Readiness Test',
  },
  mindmap: {
    icon: '🕸️',
    label: 'Concept Tree',
    desc: 'Visualize structures & links',
    className: 'action-btn-mindmap',
    badgeLabel: 'Mind Map',
    title: 'Visual Concept Tree',
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }) {
  if (mimeType === 'application/pdf') return <span className="file-type-icon pdf">PDF</span>;
  return <span className="file-type-icon img">IMG</span>;
}

export default function HomePage() {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [content, setContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [theme, setTheme] = useState('dark');

  const recognitionRef = useRef(null);
  const outputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Theme management ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  // ── Lucky logic ─────────────────────────────────────────────────────────────
  const handleLucky = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * LUCKY_TOPICS.length);
    const randomTopic = LUCKY_TOPICS[randomIdx];

    setInputMode('text');
    setContent(randomTopic);
    setError(null);
    setResult(null);

    const textarea = document.getElementById('study-input');
    if (textarea) {
      textarea.focus();
      textarea.classList.add('shuffle-flash');
      setTimeout(() => textarea.classList.remove('shuffle-flash'), 500);
    }
  }, []);

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF, JPEG, PNG, WEBP, or GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }
    setUploadedFile(file);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── History Helper ────────────────────────────────────────────────────────
  const saveToHistory = useCallback((type, input, result) => {
    try {
      const history = JSON.parse(localStorage.getItem('study_history') || '[]');
      const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type,
        input: input.length > 100 ? input.substring(0, 100) + '...' : input,
        fullInput: input,
        result,
        title: ACTION_META[type].title
      };
      localStorage.setItem('study_history', JSON.stringify([newItem, ...history].slice(0, 50)));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, []);

  const updateStats = useCallback((type) => {
    try {
      const stats = JSON.parse(localStorage.getItem('study_stats') || '{"summaries":0,"explains":0,"quizzes":0,"questions":0}');
      if (type === 'summary') stats.summaries++;
      else if (type === 'explain') stats.explains++;
      else if (type === 'quiz') {
        stats.quizzes++;
        stats.questions += 30; // 20 MCQs + 10 Theory questions
      }
      localStorage.setItem('study_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to update stats:', e);
    }
  }, []);

  // ── AI action ───────────────────────────────────────────────────────────────
  const handleAction = useCallback(async (type) => {
    if (inputMode === 'file') {
      if (!uploadedFile) {
        setError('Please upload a file first before generating.');
        return;
      }
    } else {
      if (!content.trim()) {
        setError('Please enter or paste some text first before generating.');
        return;
      }
      if (content.trim().length < 20) {
        setError('Please enter at least 20 characters for a meaningful response.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveType(type);
    window.speechSynthesis.cancel();
    setSpeaking(false);

    try {
      let res;
      if (inputMode === 'file') {
        const fd = new FormData();
        fd.append('type', type);
        fd.append('file', uploadedFile);
        res = await fetch('/api/ai', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, content: content.trim() }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      setResult(data.result);
      saveToHistory(type, inputMode === 'file' ? `File: ${uploadedFile.name}` : content, data.result);
      updateStats(type);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [content, inputMode, uploadedFile, saveToHistory, updateStats]);

  // ── Copy ────────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  // ── Voice ───────────────────────────────────────────────────────────────────
  const handleMic = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    let finalTranscript = content;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }
      setContent(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted') setError('Speech recognition error: ' + e.error);
    };

    recognition.start();
    setListening(true);
  }, [listening, content]);

  // ── Speech Synthesis ────────────────────────────────────────────────────────
  const handleSpeak = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!result) return;

    const cleanText = result.replace(/[*#_~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, result]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async (selector) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const element = typeof selector === 'string' ? document.querySelector(selector) : outputRef.current;
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#151926' : '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, (canvas.height / 2) + 20]
      });
      pdf.addImage(imgData, 'PNG', 0, 10, canvas.width / 2, canvas.height / 2);
      pdf.save(`StudyMate-${activeType || 'Note'}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setError('Could not generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeType, theme]);

  // Stop speech on unmount
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const meta = activeType ? ACTION_META[activeType] : null;

  return (
    <div className="app-wrapper">
      <div className="bg-mesh" aria-hidden="true" />

      <div className="container">
        <Header theme={theme} toggleTheme={toggleTheme} />

        {/* Hero Section - Advanced */}
        <section className="hero-advanced">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-eyebrow modern">
            <span className="pulse-dot" />
            AI-POWERED COGNITIVE ASSISTANT
          </div>
          <h1 id="hero-title" className="hero-title modern">
            Study Smarter with <TypingAnimation />
            <br />
          </h1>
          <p className="hero-subtitle modern">
            The ultimate productivity suite for students. Transform messy notes into
            brilliant summaries, visual mind maps, and interactive quizzes instantly.
          </p>
        </section>

        <main className="main-content-row">
          {/* Left Column - Input Card */}
          <div className="study-card-container">
            <div className="input-card advanced">
              <div className="input-tabs modern">
                <button
                  className={`input-tab modern ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={() => { setInputMode('text'); setError(null); }}
                >
                  <span className="tab-icon">✏️</span> Type Notes
                </button>
                <button
                  className={`input-tab modern ${inputMode === 'file' ? 'active' : ''}`}
                  onClick={() => { setInputMode('file'); setError(null); }}
                >
                  <span className="tab-icon">📎</span> Documents
                </button>
              </div>

              <div className="input-field-wrapper">
                {inputMode === 'text' && (
                  <div className="text-input-area">
                    <textarea
                      id="study-input"
                      className="main-textarea modern"
                      placeholder={`Describe a topic, paste a complex paragraph, or simply spill your thoughts...`}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                    />
                    <div className="textarea-controls">
                      <span className="char-count modern">{content.length.toLocaleString()} chars</span>
                      <div className="control-buttons">
                        <button className="icon-btn" onClick={handleLucky} title="Generate random topic">🎲</button>
                        <button className={`icon-btn mic ${listening ? 'active' : ''}`} onClick={handleMic} title="Voice input">🎤</button>
                      </div>
                    </div>
                  </div>
                )}

                {inputMode === 'file' && (
                  <div
                    className={`upload-zone modern ${isDragOver ? 'drag-over' : ''} ${uploadedFile ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploadedFile && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-input"
                      className="file-input-hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      accept=".pdf,image/*"
                    />
                    {uploadedFile ? (
                      <div className="file-pill">
                        <FileTypeIcon mimeType={uploadedFile.type} />
                        <div className="file-info">
                          <span className="file-name">{uploadedFile.name}</span>
                          <span className="file-size">{formatBytes(uploadedFile.size)}</span>
                        </div>
                        <button className="remove-pill" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>✕</button>
                      </div>
                    ) : (
                      <div className="upload-empty-state">
                        <div className="upload-circle">☁️</div>
                        <p className="upload-p">Drop PDF or Image here</p>
                        <span className="upload-secondary">Max 10MB file size supported</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Suite */}
            <div className="action-suite">
              {Object.entries(ACTION_META).map(([type, m]) => (
                <button
                  key={type}
                  className={`suite-btn ${m.className} ${activeType === type && loading ? 'loading' : ''}`}
                  onClick={() => handleAction(type)}
                  disabled={loading}
                >
                  <div className="suite-icon">{m.icon}</div>
                  <div className="suite-text">
                    <span className="suite-label">{m.label}</span>
                    <span className="suite-desc">{m.desc}</span>
                  </div>
                  {loading && activeType === type && <div className="btn-spinner" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Results / State */}
          <div className="result-container-col">
            {error && (
              <div className="error-card modern">
                <span className="err-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {result && !loading && meta && (
              <div ref={outputRef} className="output-card advanced">
                <div className="output-header advanced">
                  <div className="output-badge-group">
                    <span className={`output-badge ${activeType}`}>{meta.icon} {meta.badgeLabel}</span>
                    <h3 className="output-title">{meta.title}</h3>
                  </div>
                  <div className="output-actions">
                    <button className={`out-action-btn ${speaking ? 'active' : ''}`} onClick={handleSpeak}>
                      {speaking ? '🔊' : '🔈'}
                    </button>
                    <button className="out-action-btn" onClick={() => handleExportPDF()}>📑</button>
                    <button className={`out-action-btn ${copied ? 'active' : ''}`} onClick={handleCopy}>
                      {copied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                <div className="output-body advanced">
                  {activeType === 'quiz'
                    ? <QuizOutput text={result} />
                    : activeType === 'mindmap'
                      ? <MermaidChart chart={result} />
                      : <div className="output-text normal">{result}</div>
                  }
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="empty-state dashboard">
                <div className="dash-steps">
                  <div className="dash-step">
                    <div className="step-num">01</div>
                    <h4>Ingest Content</h4>
                    <p>Input your text or upload documents.</p>
                  </div>
                  <div className="dash-step-divider" />
                  <div className="dash-step">
                    <div className="step-num">02</div>
                    <h4>Choose Action</h4>
                    <p>Select a cognitive tool from the suite.</p>
                  </div>
                  <div className="dash-step-divider" />
                  <div className="dash-step">
                    <div className="step-num">03</div>
                    <h4>Master Topic</h4>
                    <p>Save result to history or export to PDF.</p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-shimmer-card">
                <div className="shimmer-header" />
                <div className="shimmer-line" style={{ width: '80%' }} />
                <div className="shimmer-line" style={{ width: '60%' }} />
                <div className="shimmer-line" style={{ width: '90%' }} />
                <p className="shimmer-text">AI is deep thinking...</p>
              </div>
            )}
          </div>
        </main>

        {/* Feature Highlights - Bottom */}
        <section className="features-highlight-v2">
          <div className="feat-header">
            <h3>Advanced Toolbox</h3>
            <div className="feat-line" />
          </div>
          <div className="feat-grid">
            <div className="feat-item">
              <span className="feat-icon">🚀</span>
              <h4>Turbo Processing</h4>
              <p>Flash for instant results.</p>
            </div>
            <div className="feat-item">
              <span className="feat-icon">🎙️</span>
              <h4>Voice Control</h4>
              <p>Transcribe lectures and hear results.</p>
            </div>
            <div className="feat-item">
              <span className="feat-icon">📊</span>
              <h4>Export Pro</h4>
              <p>One-click professional PDF formatting.</p>
            </div>
          </div>
        </section>

        <footer className="footer-v2">
          <div className="footer-top">
            <div className="logo-group">
              <div className="logo-icon small" aria-hidden="true">🧠</div>
              <span className="logo-text small">StudyMate AI</span>
            </div>
            <div className="footer-links">
              <a href="#">Security</a>
              <a href="#">Privacy</a>
              <a href="#">Status</a>
            </div>
          </div>
          <p className="copyright">© 2026 StudyMate AI.</p>
        </footer>
      </div>

      <style jsx>{`
        .hero-advanced { text-align: center; padding: 100px 0 60px; position: relative; }
        .hero-glow { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 600px; height: 300px; background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%); z-index: -1; }
        .hero-eyebrow.modern { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 2px; font-weight: 800; color: var(--accent-1); background: rgba(99, 102, 241, 0.05); padding: 6px 16px; border-radius: 30px; margin-bottom: 24px; border: 1px solid rgba(99, 102, 241, 0.1); }
        .pulse-dot { width: 6px; height: 6px; background: var(--accent-1); border-radius: 50%; box-shadow: 0 0 10px var(--accent-1); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        
        .hero-title.modern { font-size: clamp(36px, 8vw, 72px); letter-spacing: -2px; line-height: 1; margin-bottom: 24px; }
        .hero-subtitle.modern { font-size: 20px; max-width: 600px; margin: 0 auto; color: var(--text-secondary); opacity: 0.8; }

        .main-content-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; margin-top: 40px; align-items: flex-start; }
        
        .input-card.advanced { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; padding: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); transition: all 0.3s; }
        .input-card.advanced:focus-within { border-color: var(--border-active); box-shadow: var(--shadow-glow); }
        
        .input-tabs.modern { display: flex; gap: 4px; padding: 8px; background: rgba(255, 255, 255, 0.02); border-radius: 18px; margin-bottom: 8px; }
        .input-tab.modern { flex: 1; border: none; background: transparent; color: var(--text-muted); padding: 12px; font-size: 14px; font-weight: 700; border-radius: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .input-tab.modern.active { background: var(--bg-primary); color: var(--text-primary); box-shadow: var(--shadow-sm); }
        .tab-icon { font-size: 16px; }

        .main-textarea.modern { width: 100%; min-height: 320px; background: transparent; border: none; color: var(--text-primary); padding: 24px; font-size: 16px; line-height: 1.6; resize: none; outline: none; }
        .textarea-controls { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-top: 1px solid var(--border); }
        .char-count.modern { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .control-buttons { display: flex; gap: 8px; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { background: var(--bg-card-hover); border-color: var(--border-active); }
        .icon-btn.mic.active { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.12); animation: pulseMic 1.5s infinite; }

        .upload-zone.modern { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; border: 2px dashed var(--border); border-radius: 20px; transition: all 0.2s; cursor: pointer; }
        .upload-zone.modern:hover { background: rgba(99, 102, 241, 0.03); border-color: var(--accent-1); }
        .upload-circle { width: 64px; height: 64px; border-radius: 50%; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 20px; }
        .upload-p { font-weight: 700; font-size: 18px; margin-bottom: 4px; }
        .upload-secondary { font-size: 13px; color: var(--text-muted); }
        
        .file-pill { display: flex; align-items: center; gap: 12px; background: rgba(99,102,241,0.1); border: 1px solid var(--accent-1); padding: 12px 20px; border-radius: 16px; }
        .remove-pill { background: transparent; border: none; color: var(--accent-1); cursor: pointer; font-size: 16px; }

        .action-suite { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .suite-btn { position: relative; display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; cursor: pointer; transition: all 0.2s; text-align: left; }
        .suite-btn:hover { border-color: var(--border-active); box-shadow: var(--shadow-sm); transform: translateY(-2px); background: var(--bg-card-hover); }
        .suite-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .suite-icon { font-size: 24px; width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 255, 255, 0.03); display: flex; align-items: center; justify-content: center; }
        .suite-text { display: flex; flex-direction: column; }
        .suite-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .suite-desc { font-size: 11px; color: var(--text-muted); }

        .output-card.advanced { background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px; overflow: hidden; box-shadow: var(--shadow-md); position: sticky; top: 20px; }
        .output-header.advanced { padding: 24px 32px; background: rgba(255, 255, 255, 0.01); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .output-badge-group { display: flex; flex-direction: column; gap: 6px; }
        .output-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--accent-1); background: rgba(99, 102, 241, 0.1); padding: 4px 12px; border-radius: 20px; width: fit-content; }
        .output-badge.explain { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .output-badge.quiz { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .output-badge.mindmap { color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
        
        .output-title { font-size: 18px; font-weight: 800; font-family: 'Outfit', sans-serif; }
        .output-actions { display: flex; gap: 8px; }
        .out-action-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.2s; color: var(--text-muted); }
        .out-action-btn:hover { border-color: var(--border-active); color: var(--text-primary); transform: translateY(-2px); }
        .out-action-btn.active { color: var(--accent-1); border-color: var(--accent-1); background: rgba(99, 102, 241, 0.1); }

        .output-body.advanced { padding: 32px; }
        .output-text.normal { font-size: 16px; line-height: 1.8; color: var(--text-primary); white-space: pre-wrap; }

        /* Shimmer Loading */
        .loading-shimmer-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px; padding: 40px; display: flex; flex-direction: column; gap: 16px; }
        .shimmer-header { height: 20px; width: 40%; background: var(--border); border-radius: 10px; margin-bottom: 20px; animation: shimmer 2s infinite linear; }
        .shimmer-line { height: 12px; background: var(--border); border-radius: 6px; animation: shimmer 2s infinite linear; }
        .shimmer-text { font-size: 13px; font-weight: 700; color: var(--text-muted); text-align: center; margin-top: 20px; }
        @keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 0.6; } 100% { opacity: 0.3; } }

        .empty-state.dashboard { height: 100%; border: 2px dashed var(--border); border-radius: 28px; padding: 60px; display: flex; align-items: center; justify-content: center; }
        .dash-steps { display: flex; flex-direction: column; gap: 32px; width: 100%; }
        .dash-step { display: flex; flex-direction: column; gap: 8px; }
        .step-num { font-size: 14px; font-weight: 900; opacity: 0.2; letter-spacing: 2px; }
        .dash-step h4 { font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .dash-step p { font-size: 14px; color: var(--text-muted); }
        .dash-step-divider { height: 1px; width: 40px; background: var(--border); }

        .features-highlight-v2 { margin-top: 80px; padding: 60px 0; border-top: 1px solid var(--border); }
        .feat-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .feat-header h3 { font-size: 12px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: var(--text-muted); }
        .feat-line { flex: 1; height: 1px; background: var(--border); }
        .feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; }
        .feat-item { display: flex; flex-direction: column; gap: 12px; }
        .feat-icon { font-size: 28px; }
        .feat-item h4 { font-size: 16px; font-weight: 800; }
        .feat-item p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

        .footer-v2 { padding: 80px 0 40px; border-top: 1px solid var(--border); }
        .copyright { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 40px; }

        @media (max-width: 900px) {
          .main-content-row { grid-template-columns: 1fr; }
          .hero-title.modern { font-size: 42px; }
          .hero-advanced { padding: 60px 0 40px; }
          .output-card.advanced { position: static; }
        }
      `}</style>
    </div>
  );
}
