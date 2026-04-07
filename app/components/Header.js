'use client';

import Link from 'next/link';

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="header sticky-header">
      <div className="header-inner">
        <Link href="/" className="logo-group" style={{ textDecoration: 'none' }}>
          <div className="logo-icon" aria-hidden="true">🧠</div>
          <span className="logo-text">StudyMate AI</span>
        </Link>
        
        <div className="header-right">
          <nav className="header-nav">
            <Link href="/" className="nav-link">Study</Link>
            <Link href="/history" className="nav-link">History</Link>
          </nav>
          
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background-color: var(--bg-header-glass);
          transition: all 0.3s ease;
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--gradient-hero);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          flex-shrink: 0;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 800;
          background: var(--gradient-hero);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .header-nav {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s;
          opacity: 0.7;
        }

        .nav-link:hover {
          color: var(--accent-1);
          opacity: 1;
        }

        .theme-toggle {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .theme-toggle:hover {
          transform: scale(1.1);
        }

        @media (max-width: 640px) {
          .header-inner {
            padding: 16px;
          }
          .header-right {
            gap: 20px;
          }
          .header-nav {
            gap: 16px;
          }
          .logo-text {
            font-size: 16px;
          }
          .logo-icon {
            width: 32px;
            height: 32px;
            font-size: 16px;
          }
        }
      `}</style>
    </header>
  );
}
