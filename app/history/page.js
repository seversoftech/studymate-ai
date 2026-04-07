'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import QuizOutput from '../components/QuizOutput';
import MermaidChart from '../components/MermaidChart';
import Link from 'next/link';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [speaking, setSpeaking] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stats, setStats] = useState({ summaries: 0, explains: 0, quizzes: 0, questions: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // ── Theme management ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Load history and stats
    const savedHistory = JSON.parse(localStorage.getItem('study_history') || '[]');
    setHistory(savedHistory);
    const savedStats = JSON.parse(localStorage.getItem('study_stats') || '{"summaries":0,"explains":0,"quizzes":0,"questions":0}');
    setStats(savedStats);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your study history and stats? This cannot be undone.')) {
      localStorage.removeItem('study_history');
      localStorage.removeItem('study_stats');
      setHistory([]);
      setStats({ summaries: 0, explains: 0, quizzes: 0, questions: 0 });
    }
  };

  const deleteItem = (id) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('study_history', JSON.stringify(newHistory));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleSpeak = useCallback((text) => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!text) return;

    const cleanText = text.replace(/[*#_~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking]);

  const handleExportPDF = useCallback(async (id) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    const element = document.getElementById(id);
    if (!element) return;
    
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
      pdf.save(`StudyMate-Saved-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  }, [theme]);

  // Stop speech on unmount or item change
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [selectedItem]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.input.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const masteryPercent = Math.min(100, (stats.questions / 100) * 100);

  return (
    <div className="app-wrapper">
      <div className="bg-mesh" aria-hidden="true" />

      <div className="container" style={{ maxWidth: '1000px' }}>
        <Header theme={theme} toggleTheme={toggleTheme} />

        <main className="history-main">
          {/* Header & Stats Dashboard */}
          <section className="dashboard-hero">
            <div className="dashboard-title-area">
              <h1 className="hero-title">Your <span className="gradient-text">Success Hub</span></h1>
              <p className="hero-subtitle">Track your progress and revisit your insights.</p>
            </div>

            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-icon-group">
                  <div className="stat-icon summary">📝</div>
                  <span className="stat-label">Summaries</span>
                </div>
                <div className="stat-value">{stats.summaries}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-group">
                  <div className="stat-icon explain">🎓</div>
                  <span className="stat-label">Explains</span>
                </div>
                <div className="stat-value">{stats.explains}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-group">
                  <div className="stat-icon quiz">📋</div>
                  <span className="stat-label">Quizzes</span>
                </div>
                <div className="stat-value">{stats.quizzes}</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-icon-group">
                  <div className="stat-icon mastery">🧠</div>
                  <span className="stat-label">Questions Solved</span>
                </div>
                <div className="stat-value">{stats.questions}</div>
              </div>
            </div>

            {/* Mastery Progress Bar */}
            <div className="mastery-container">
              <div className="mastery-header">
                <div className="mastery-info">
                  <span className="mastery-title">Subject Mastery</span>
                  <span className="mastery-rank">
                    {masteryPercent < 20 ? '🌱 Beginner' : masteryPercent < 50 ? '🌿 Scholar' : masteryPercent < 80 ? '🌳 Expert' : '🏆 Master'}
                  </span>
                </div>
                <span className="mastery-percent">{masteryPercent.toFixed(0)}%</span>
              </div>
              <div className="mastery-bar-bg">
                <div className="mastery-bar-fill" style={{ width: `${masteryPercent}%` }}>
                  <div className="mastery-bar-glow" />
                </div>
              </div>
              <p className="mastery-footer">Solve 100 questions to reach full Mastery across all study modes.</p>
            </div>
          </section>

          {/* History Explorer */}
          <div className="explorer-layout">
            <div className="explorer-side">
              <div className="explorer-header-row">
                <h2 className="section-title small">Study Records</h2>
                <div className="search-group">
                  <input 
                    type="text" 
                    placeholder="Search records..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>

              <div className="history-scroll">
                {filteredHistory.length === 0 ? (
                  <div className="empty-history-state">
                    <div className="empty-icon">📂</div>
                    <p>{searchQuery ? 'No matching records found' : 'Start studying to build your history!'}</p>
                  </div>
                ) : (
                  filteredHistory.map(item => (
                    <div 
                      key={item.id} 
                      className={`history-item-new ${selectedItem?.id === item.id ? 'active' : ''}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="item-type-tag">
                        <span className={`type-dot ${item.type}`} />
                        {item.title}
                      </div>
                      <h3 className="item-preview-text">{item.input}</h3>
                      <div className="item-meta">
                        <span className="item-date">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className="item-dot">•</span>
                        <span className="item-time">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button 
                        className="item-delete-btn" 
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                        title="Delete record"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {history.length > 0 && (
                <button className="clear-all-btn" onClick={clearHistory}>
                  🗑️ Clear All Progress
                </button>
              )}
            </div>

            {/* Preview Panel */}
            <div className={`explorer-preview ${selectedItem ? 'visible' : ''}`}>
              {!selectedItem ? (
                <div className="preview-placeholder">
                  <div className="placeholder-icon">📖</div>
                  <h3>Select a record to review</h3>
                  <p>Pick any summary or quiz from your history to see the full details here.</p>
                </div>
              ) : (
                <div className="preview-card" id="history-preview-card">
                  <div className="preview-header">
                    <div className="preview-title-group">
                      <span className={`output-type-badge ${selectedItem.type}`}>
                        {selectedItem.type === 'summary' ? '📝' : selectedItem.type === 'explain' ? '🎓' : selectedItem.type === 'quiz' ? '❓' : '🕸️'} {selectedItem.title}
                      </span>
                      <h2>Source Material</h2>
                    </div>
                    <div className="preview-actions">
                      {selectedItem.type !== 'quiz' && selectedItem.type !== 'mindmap' && (
                        <button
                          className={`preview-btn speech ${speaking ? 'active' : ''}`}
                          onClick={() => handleSpeak(selectedItem.result)}
                          title="Listen to response"
                        >
                          {speaking ? '🔊' : '🔈'}
                        </button>
                      )}
                      <button 
                        className="preview-btn" 
                        onClick={() => handleExportPDF('history-preview-card')}
                        title="Export as PDF"
                      >
                        📑
                      </button>
                      <button className="preview-btn close" onClick={() => setSelectedItem(null)}>✕</button>
                    </div>
                  </div>
                  
                  <div className="preview-body">
                    <div className="preview-source-text">
                      {selectedItem.fullInput}
                    </div>
                    
                    <div className="preview-divider" />
                    
                    <div className="preview-result-container">
                      {selectedItem.type === 'quiz' 
                        ? <QuizOutput text={selectedItem.result} />
                        : selectedItem.type === 'mindmap'
                        ? <MermaidChart chart={selectedItem.result} />
                        : <div className="output-text" style={{ padding: 0 }}>{selectedItem.result}</div>
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="footer-v2">
          <div className="footer-top">
            <div className="logo-group">
              <div className="logo-icon small" aria-hidden="true">🧠</div>
              <span className="logo-text small">StudyMate AI</span>
            </div>
            <div className="footer-links">
              <Link href="/security">Security</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/status">Status</Link>
            </div>
          </div>
          <p className="copyright">© 2026 StudyMate AI.</p>
        </footer>
      </div>

      <style jsx>{`
        .history-main { padding: 40px 0 80px; }
        .dashboard-hero { margin-bottom: 60px; }
        .dashboard-title-area { margin-bottom: 32px; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .stat-card:hover { transform: translateY(-4px); border-color: var(--border-active); box-shadow: var(--shadow-glow); }
        .stat-card.highlight { background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05)); border-color: var(--border-active); }
        
        .stat-icon-group { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .stat-icon.summary { background: rgba(99, 102, 241, 0.1); }
        .stat-icon.explain { background: rgba(16, 185, 129, 0.1); }
        .stat-icon.quiz { background: rgba(245, 158, 11, 0.1); }
        .stat-icon.mastery { background: var(--gradient-hero); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .stat-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 32px; font-weight: 800; font-family: 'Outfit', sans-serif; }

        .mastery-container { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; }
        .mastery-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
        .mastery-info { display: flex; flex-direction: column; gap: 4px; }
        .mastery-title { font-size: 14px; font-weight: 700; color: var(--text-secondary); }
        .mastery-rank { font-size: 20px; font-weight: 800; color: var(--text-primary); font-family: 'Outfit', sans-serif; }
        .mastery-percent { font-size: 28px; font-weight: 800; color: var(--accent-1); font-family: 'Outfit', sans-serif; }
        .mastery-bar-bg { height: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 20px; overflow: hidden; margin-bottom: 12px; }
        .mastery-bar-fill { height: 100%; background: var(--gradient-hero); border-radius: 20px; position: relative; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .mastery-bar-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); animation: barGlow 3s infinite; }
        @keyframes barGlow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .mastery-footer { font-size: 12px; color: var(--text-muted); }

        .explorer-layout { display: grid; grid-template-columns: 380px 1fr; gap: 40px; margin-top: 60px; }
        .explorer-header-row { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .search-group { position: relative; }
        .search-input { width: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px 12px 40px; color: var(--text-primary); font-size: 14px; transition: all 0.2s; outline: none; }
        .search-input:focus { border-color: var(--border-active); box-shadow: var(--shadow-sm); }
        .search-icon { position: absolute; left: 14px; top: 12px; font-size: 16px; opacity: 0.5; }

        .history-scroll { display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; padding-right: 12px; }
        .history-scroll::-webkit-scrollbar { width: 4px; }
        .history-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .history-item-new { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; position: relative; border-left: 4px solid transparent; }
        .history-item-new:hover { background: var(--bg-card-hover); transform: translateX(4px); }
        .history-item-new.active { background: var(--bg-card-hover); border-color: var(--border-active); border-left-color: var(--accent-1); box-shadow: var(--shadow-sm); }
        
        .item-type-tag { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .type-dot { width: 8px; height: 8px; border-radius: 50%; }
        .type-dot.summary { background: var(--accent-1); }
        .type-dot.explain { background: #10b981; }
        .type-dot.quiz { background: #f59e0b; }
        .type-dot.mindmap { background: #06b6d4; }
        
        .item-preview-text { font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; }
        .item-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
        .item-delete-btn { position: absolute; top: 12px; right: 12px; width: 24px; height: 24px; border-radius: 6px; background: transparent; border: none; color: var(--text-muted); display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; cursor: pointer; }
        .history-item-new:hover .item-delete-btn { opacity: 1; }
        .item-delete-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .clear-all-btn { margin-top: 24px; background: transparent; border: 1px dashed var(--border); color: var(--text-muted); padding: 12px; border-radius: 12px; cursor: pointer; width: 100%; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .clear-all-btn:hover { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }

        .explorer-preview { position: relative; min-height: 400px; }
        .placeholder-icon { font-size: 48px; margin-bottom: 20px; opacity: 0.3; }
        .preview-placeholder { height: 100%; border: 2px dashed var(--border); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; color: var(--text-muted); }
        .preview-placeholder h3 { font-size: 18px; margin-bottom: 8px; color: var(--text-secondary); }

        .preview-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; animation: fadeIn 0.3s ease; height: fit-content; max-height: 90vh; display: flex; flex-direction: column; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .preview-header { padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
        .preview-title-group h2 { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
        .preview-actions { display: flex; gap: 8px; }
        .preview-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.2s; }
        .preview-btn:hover { border-color: var(--border-active); background: var(--bg-card-hover); transform: translateY(-2px); }
        .preview-btn.speech.active { background: rgba(99, 102, 241, 0.1); color: var(--accent-1); border-color: var(--accent-1); }
        .preview-btn.close { color: var(--text-muted); }
        .preview-btn.close:hover { color: #ef4444; border-color: #ef4444; }

        .preview-body { padding: 24px; overflow-y: auto; flex: 1; }
        .preview-source-text { padding: 16px; background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--border); font-size: 14px; font-style: italic; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
        .preview-divider { height: 1px; background: var(--border); margin: 32px 0; position: relative; }
        .preview-divider::after { content: 'AI Result'; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: var(--bg-card); padding: 0 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); }

        .footer-v2 { border-top: none; padding: 0; margin-top: 0; }
        .copyright { margin-top: 0; }

        @media (max-width: 900px) {
          .explorer-layout { grid-template-columns: 1fr; }
          .explorer-preview.visible { display: block; position: fixed; inset: 0; z-index: 100; background: var(--bg-primary); padding: 20px; overflow-y: auto; }
        }
      `}</style>
    </div>
  );
}
