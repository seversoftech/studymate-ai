'use client';

import { useEffect, useState } from 'react';

const MIN_BOOT_TIME_MS = 700;
const FADE_OUT_MS = 280;

export default function AppBootLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const start = Date.now();

    const finishLoading = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_BOOT_TIME_MS - elapsed, 0);

      window.setTimeout(() => {
        setIsFading(true);
        window.setTimeout(() => setIsVisible(false), FADE_OUT_MS);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finishLoading();
      return undefined;
    }

    window.addEventListener('load', finishLoading, { once: true });
    return () => window.removeEventListener('load', finishLoading);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`app-boot-loader ${isFading ? 'is-fading' : ''}`} aria-hidden="true">
      <div className="app-loading-card">
        <div className="app-loading-logo">🧠</div>
        <div className="app-loading-spinner" />
        <h1 className="app-loading-title">Loading StudyMate AI</h1>
        <p className="app-loading-text">
          Preparing your study workspace and getting everything ready.
        </p>
      </div>
    </div>
  );
}
