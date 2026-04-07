'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Link from 'next/link';

export default function StatusPage() {
  const [theme, setTheme] = useState('dark');
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    // Simulate fetching status
    const timer = setTimeout(() => {
      setStatus('operational');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  return (
    <div className="app-wrapper">
      <div className="bg-mesh" aria-hidden="true" />
      <div className="container">
        <Header theme={theme} toggleTheme={toggleTheme} />
        
        <main className="info-main">
          <div className="info-card advanced">
            <h1 className="info-title">System Status</h1>
            <p className="info-subtitle">Check the operational status of StudyMate AI systems.</p>
            
            <div className="status-board">
              <div className="status-header">
                <h2>Current Status</h2>
                {status === 'checking' ? (
                  <span className="status-badge pending">Checking...</span>
                ) : (
                  <span className="status-badge operational">All Systems Operational</span>
                )}
              </div>

              <div className="status-services">
                <div className="service-item">
                  <div className="service-info">
                    <span className="service-name">Frontend Application</span>
                    <span className="service-desc">The web interface you interact with</span>
                  </div>
                  {status === 'checking' ? <div className="pulse-loader"></div> : <span className="status-dot green"></span>}
                </div>

                <div className="service-item">
                  <div className="service-info">
                    <span className="service-name">AI Processing API</span>
                    <span className="service-desc">Summaries, Explanations, Quizzes</span>
                  </div>
                  {status === 'checking' ? <div className="pulse-loader"></div> : <span className="status-dot green"></span>}
                </div>

                <div className="service-item">
                  <div className="service-info">
                    <span className="service-name">File Upload & Vision Services</span>
                    <span className="service-desc">PDF and Image parsing</span>
                  </div>
                  {status === 'checking' ? <div className="pulse-loader"></div> : <span className="status-dot green"></span>}
                </div>
              </div>
            </div>

            <div className="info-actions">
              <Link href="/" className="back-link-premium">
                <svg className="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Back to Home</span>
              </Link>
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
        .info-main { padding: 80px 0; max-width: 800px; margin: 0 auto; }
        .info-card.advanced { background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px; padding: 48px; box-shadow: var(--shadow-md); }
        .info-title { font-size: 40px; font-weight: 800; letter-spacing: -1px; margin-bottom: 12px; }
        .info-subtitle { font-size: 18px; color: var(--text-muted); margin-bottom: 40px; }
        
        .status-board { background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .status-header { padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
        .status-header h2 { font-size: 20px; font-weight: 700; margin: 0; }
        .status-badge { padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .status-badge.operational { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        
        .status-services { padding: 8px 24px; }
        .service-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border); }
        .service-item:last-child { border-bottom: none; }
        .service-info { display: flex; flex-direction: column; gap: 4px; }
        .service-name { font-weight: 700; font-size: 16px; }
        .service-desc { font-size: 13px; color: var(--text-muted); }
        
        .status-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
        .status-dot.green { background: #10b981; }
        
        .pulse-loader { width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

        .info-actions { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--border); display: flex; justify-content: flex-start; }
        :global(.back-link-premium) { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 99px; color: var(--text-primary); font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm); }
        :global(.back-link-premium):hover { background: var(--bg-card-hover); border-color: var(--accent-1); color: var(--accent-1); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15); }
        :global(.back-icon) { width: 18px; height: 18px; transition: transform 0.3s ease; }
        :global(.back-link-premium):hover :global(.back-icon) { transform: translateX(-4px); }

        .footer-v2 { padding: 80px 0 40px; border-top: 1px solid var(--border); margin-top: 40px; }
        .copyright { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 40px; }
        
        @media (max-width: 768px) {
          .info-card.advanced { padding: 32px 24px; }
          .info-title { font-size: 32px; }
          .status-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
