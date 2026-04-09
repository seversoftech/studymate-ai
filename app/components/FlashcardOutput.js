'use client';

import { useEffect, useMemo, useState } from 'react';

function parseFlashcards(text) {
  const cards = [];
  const cardRegex = /CARD\s+(\d+)\s*[\r\n]+Front:\s*([\s\S]*?)\s*[\r\n]+Back:\s*([\s\S]*?)(?=(?:\r?\n){2}CARD\s+\d+|$)/gi;
  let match;

  while ((match = cardRegex.exec(text)) !== null) {
    cards.push({
      num: match[1].trim(),
      front: match[2].trim(),
      back: match[3].trim(),
    });
  }

  return cards.length > 0 ? cards : null;
}

const DIFFICULTY_META = {
  hard: { label: 'Hard', hint: 'Review again in 1 day' },
  medium: { label: 'Medium', hint: 'Review again in 3 days' },
  easy: { label: 'Easy', hint: 'Review again in 7 days' },
};

function formatReviewDate(daysToAdd) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return nextDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export default function FlashcardOutput({ text, storageKey = null }) {
  const cards = useMemo(() => parseFlashcards(text), [text]);
  const [flippedCards, setFlippedCards] = useState({});
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (!storageKey || !cards) return;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setRatings(saved);
    } catch {
      setRatings({});
    }
  }, [storageKey, cards]);

  const reviewedCount = Object.keys(ratings).length;

  const handleFlip = (num) => {
    setFlippedCards((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const handleRate = (num, level) => {
    const nextRatings = {
      ...ratings,
      [num]: {
        level,
        nextReviewInDays: level === 'hard' ? 1 : level === 'medium' ? 3 : 7,
        updatedAt: new Date().toISOString(),
      },
    };

    setRatings(nextRatings);

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(nextRatings));
    }
  };

  if (!cards) return <p className="output-text">{text}</p>;

  return (
    <div className="flashcards-shell">
      <div className="flashcards-toolbar">
        <span className="flashcards-badge">🃏 Flashcard Deck</span>
        <span className="flashcards-progress">
          {reviewedCount}/{cards.length} rated
        </span>
      </div>

      <div className="flashcards-grid">
        {cards.map((card) => {
          const rating = ratings[card.num];
          const isFlipped = Boolean(flippedCards[card.num]);
          return (
            <article key={card.num} className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
              <button
                className="flashcard-face"
                onClick={() => handleFlip(card.num)}
                aria-pressed={isFlipped}
              >
                <div className="flashcard-scene">
                  <div className="flashcard-rotator">
                    <div className="flashcard-panel flashcard-panel-front">
                      <div className="flashcard-topline">
                        <span className="card-number">Card {card.num}</span>
                        <span className="card-helper">Tap to reveal answer</span>
                      </div>

                      <div className="flashcard-content">
                        <div className="flashcard-label">Front</div>
                        <p>{card.front}</p>
                      </div>
                    </div>

                    <div className="flashcard-panel flashcard-panel-back">
                      <div className="flashcard-topline">
                        <span className="card-number">Card {card.num}</span>
                        <span className="card-helper">Tap to hide answer</span>
                      </div>

                      <div className="flashcard-content">
                        <div className="flashcard-label">Back</div>
                        <p>{card.back}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <div className="rating-row">
                {Object.entries(DIFFICULTY_META).map(([level, meta]) => (
                  <button
                    key={level}
                    className={`rating-btn ${level} ${rating?.level === level ? 'active' : ''}`}
                    onClick={() => handleRate(card.num, level)}
                  >
                    <span>{meta.label}</span>
                    <small>{meta.hint}</small>
                  </button>
                ))}
              </div>

              {rating && (
                <div className="review-note">
                  Next review: {formatReviewDate(rating.nextReviewInDays)}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .flashcards-shell { display: flex; flex-direction: column; gap: 20px; }
        .flashcards-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .flashcards-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ec4899; background: rgba(236, 72, 153, 0.12); padding: 5px 12px; border-radius: 999px; }
        .flashcards-progress { font-size: 12px; color: var(--text-muted); }
        .flashcards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .flashcard { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 18px; border: 1px solid var(--border); background: linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 94%, rgba(236,72,153,0.06)), var(--bg-card)); box-shadow: var(--shadow-sm); }
        .flashcard-face { border: 1px solid rgba(236, 72, 153, 0.18); background: transparent; border-radius: 16px; min-height: 220px; padding: 0; display: block; text-align: left; color: var(--text-primary); cursor: pointer; transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; perspective: 1200px; overflow: hidden; }
        .flashcard-face:hover { transform: translateY(-2px); border-color: rgba(236, 72, 153, 0.32); box-shadow: 0 16px 34px rgba(236, 72, 153, 0.12); }
        .flashcard-scene { position: relative; min-height: 220px; }
        .flashcard-rotator { position: relative; min-height: 220px; transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
        .flashcard.flipped .flashcard-rotator { transform: rotateY(180deg); }
        .flashcard-panel { position: absolute; inset: 0; padding: 18px; display: flex; flex-direction: column; gap: 18px; border-radius: 16px; background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(251,146,60,0.06)); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .flashcard-panel-front { transform: rotateY(0deg); }
        .flashcard-panel-back { transform: rotateY(180deg); background: linear-gradient(135deg, rgba(251,146,60,0.12), rgba(236,72,153,0.12)); }
        .flashcard-topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .card-number { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #f472b6; }
        .card-helper { font-size: 11px; color: var(--text-muted); }
        .flashcard-label { font-size: 12px; font-weight: 700; color: #fb7185; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .flashcard-content { display: flex; flex-direction: column; justify-content: center; flex: 1; }
        .flashcard-content p { font-size: 15px; line-height: 1.65; white-space: pre-wrap; }
        .rating-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .rating-btn { border: 1px solid var(--border); border-radius: 12px; background: rgba(255,255,255,0.02); color: var(--text-primary); padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease; }
        .rating-btn:hover { transform: translateY(-1px); }
        .rating-btn span { font-size: 13px; font-weight: 700; }
        .rating-btn small { font-size: 11px; color: var(--text-muted); }
        .rating-btn.hard.active { border-color: rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.1); }
        .rating-btn.medium.active { border-color: rgba(245, 158, 11, 0.45); background: rgba(245, 158, 11, 0.1); }
        .rating-btn.easy.active { border-color: rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.1); }
        .review-note { font-size: 12px; color: var(--text-secondary); padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.03); }
        @media (max-width: 640px) {
          .flashcards-toolbar { flex-direction: column; align-items: flex-start; }
          .rating-row { grid-template-columns: 1fr; }
          .flashcard-face,
          .flashcard-scene,
          .flashcard-rotator { min-height: 180px; }
        }
      `}</style>
    </div>
  );
}
