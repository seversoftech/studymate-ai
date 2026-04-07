'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Link from 'next/link';

export default function PrivacyPage() {
  const [theme, setTheme] = useState('dark');

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

  return (
    <div className="app-wrapper">
      <div className="bg-mesh" aria-hidden="true" />
      <div className="container">
        <Header theme={theme} toggleTheme={toggleTheme} />
        
        <main className="info-main">
          <div className="info-card advanced">
            <h1 className="info-title">Privacy Policy</h1>
            <p className="info-subtitle">Your privacy is important to us.</p>
            
            <div className="info-content normal">
              <h2>Information We Collect</h2>
              <p>
                When you use StudyMate AI, we process the notes, texts, and documents you provide solely for the purpose of generating summaries, explanations, and quizzes through our AI engine. We only retain this data temporarily.
              </p>

              <h2>Local Storage Data</h2>
              <p>
                StudyMate AI heavily utilizes your browser's local storage to save your settings, preferences, and study history. This means your historical and customized usage data stays primarily on your device.
              </p>

              <h2>How We Use Information</h2>
              <p>
                The temporary information processed by our servers is used only to securely serve the requested AI capabilities (like generating quizzes, summarizations, etc.). StudyMate AI absolutely does not sell your personal usage data or file submissions to any third parties.
              </p>

              <h2>Changes & Updates</h2>
              <p>
                We may update our Privacy Policy periodically to reflect new services or changes to the legal landscape. Continued use of StudyMate AI signifies your acceptance of these updates.
              </p>
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
        .info-content.normal h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        .info-content.normal p { font-size: 16px; line-height: 1.8; color: var(--text-secondary); margin-bottom: 16px; opacity: 0.9; }
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
        }
      `}</style>
    </div>
  );
}
