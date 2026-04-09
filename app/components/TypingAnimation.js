'use client';

import { useState, useEffect, useRef } from 'react';

const phrases = [
  'AI Superpowers',
  'Instant Summaries',
  'Practice Quizzes',
  'Flashcard Magic',
  'Deep Insights',
];

export default function TypingAnimation() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (subIndex === phrases[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 75 : 150);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  // Cursor blink
  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  return (
    <span className="typing-container">
      <span className="typed-text" style={{ color: '#14213d' }}>
        {phrases[index].substring(0, subIndex)}
      </span>
      <span className={`cursor ${blink ? 'visible' : 'hidden'}`} style={{ color: '#14213d' }}>|</span>
    </span>
  );
}
