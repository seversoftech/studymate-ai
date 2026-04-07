'use client';

import Link from 'next/link';

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="site-header">
      <div className="header-shell">
        <Link href="/" className="logo-group" style={{ textDecoration: 'none' }}>
          <div className="logo-icon" aria-hidden="true">🧠</div>
          <span className="logo-text">StudyMate AI</span>
        </Link>
        
        <div className="header-actions">
          <nav className="header-nav" aria-label="Primary">
            <Link className="nav-link" href="/">Study</Link>
            <Link className="nav-link" href="/history">History</Link>
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
    </header>
  );
}
