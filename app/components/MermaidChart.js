'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Config mermaid once
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#6366f1',
      primaryTextColor: '#fff',
      primaryBorderColor: '#6366f1',
      lineColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      tertiaryColor: '#06b6d4'
    }
  });
}

export default function MermaidChart({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div 
      ref={ref} 
      className="mermaid" 
      style={{ 
        background: 'rgba(255,255,255,0.03)', 
        padding: '20px', 
        borderRadius: '12px',
        overflowX: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      {chart}
    </div>
  );
}
