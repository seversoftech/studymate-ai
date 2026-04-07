'use client';

import { useState, useCallback } from 'react';

/**
 * Parses the complex AI quiz text into MCQ and Theory groups.
 */
function parseQuiz(text) {
  const mcqs = [];
  const theory = [];

  // Parse MCQs
  const mcqRegex = /Q(\d+):\s*([\s\S]*?)\s*A\)\s*([\s\S]*?)\s*B\)\s*([\s\S]*?)\s*C\)\s*([\s\S]*?)\s*D\)\s*([\s\S]*?)\s*Correct:\s*([A-D])/gi;
  let match;
  while ((match = mcqRegex.exec(text)) !== null) {
    mcqs.push({
      num: match[1],
      question: match[2].trim(),
      options: [
        { label: 'A', text: match[3].trim() },
        { label: 'B', text: match[4].trim() },
        { label: 'C', text: match[5].trim() },
        { label: 'D', text: match[6].trim() }
      ],
      correct: match[7].trim().toUpperCase()
    });
  }

  // Parse Theory
  const theoryRegex = /T(\d+):\s*([\s\S]*?)\s*Answer:\s*([\s\S]*?)(?=T\d+:|$)/gi;
  while ((match = theoryRegex.exec(text)) !== null) {
    theory.push({
      num: match[1],
      question: match[2].trim(),
      answer: match[3].trim()
    });
  }

  if (mcqs.length === 0 && theory.length === 0) return null;
  return { mcqs, theory };
}

export default function QuizOutput({ text }) {
  const [expanded, setExpanded] = useState({});
  const [revealedMCQ, setRevealedMCQ] = useState({});

  const toggleTheory = useCallback((num) => {
    setExpanded((prev) => ({ ...prev, [num]: !prev[num] }));
  }, []);

  const revealMCQ = useCallback((num) => {
    setRevealedMCQ((prev) => ({ ...prev, [num]: true }));
  }, []);

  const quiz = parseQuiz(text);

  if (!quiz) return <p className="output-text">{text}</p>;

  return (
    <div className="quiz-container">
      {/* MCQs Section */}
      {quiz.mcqs.length > 0 && (
        <div className="quiz-section">
          <div className="section-header">
            <span className="section-badge">🎯 Multiple Choice</span>
            <span className="section-count">{quiz.mcqs.length} Questions</span>
          </div>
          
          <div className="mcq-list">
            {quiz.mcqs.map((q) => (
              <div key={`mcq-${q.num}`} className="mcq-card">
                <div className="mcq-header">
                  <span className="mcq-num">#{q.num}</span>
                  <p className="mcq-text">{q.question}</p>
                </div>
                <div className="mcq-options">
                  {q.options.map((opt) => (
                    <div 
                      key={opt.label} 
                      className={`mcq-option ${revealedMCQ[q.num] && q.correct === opt.label ? 'correct' : ''}`}
                    >
                      <span className="opt-label">{opt.label}</span>
                      <span className="opt-text">{opt.text}</span>
                    </div>
                  ))}
                </div>
                {!revealedMCQ[q.num] ? (
                  <button className="reveal-btn" onClick={() => revealMCQ(q.num)}>
                    Reveal Answer
                  </button>
                ) : (
                  <div className="correct-feedback">
                    ✅ Correct Answer: <strong>{q.correct}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theory Section */}
      {quiz.theory.length > 0 && (
        <div className="quiz-section" style={{ marginTop: '40px' }}>
          <div className="section-header">
            <span className="section-badge theory">🎓 Theory & Analysis</span>
            <span className="section-count">{quiz.theory.length} Questions</span>
          </div>
          
          <div className="theory-list">
            {quiz.theory.map((t) => (
              <div key={`theory-${t.num}`} className="quiz-item" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <button
                  className="quiz-question"
                  onClick={() => toggleTheory(t.num)}
                  style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="quiz-num">T{t.num}</span>
                  <span className="quiz-q-text">{t.question}</span>
                  <span className="quiz-toggle">▼</span>
                </button>
                {expanded[t.num] && (
                  <div className="quiz-answer">
                    <div className="quiz-answer-label">✅ Explanation</div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{t.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .quiz-container { display: flex; flexDirection: column; gap: 20px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
        .section-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letterSpacing: 1px; color: var(--accent-quiz); background: rgba(245,158,11,0.1); padding: 4px 12px; border-radius: 20px; }
        .section-badge.theory { color: var(--accent-explain); background: rgba(16,185,129,0.1); }
        .section-count { font-size: 12px; color: var(--text-muted); }
        .mcq-list { display: flex; flex-direction: column; gap: 16px; }
        .mcq-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
        .mcq-header { display: flex; gap: 12px; margin-bottom: 16px; }
        .mcq-num { font-weight: 800; color: var(--accent-quiz); opacity: 0.8; }
        .mcq-text { font-size: 15px; font-weight: 600; line-height: 1.5; }
        .mcq-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .mcq-option { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); transition: all 0.2s; }
        .mcq-option.correct { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.4); }
        .opt-label { font-weight: 800; color: var(--text-muted); width: 24px; }
        .opt-text { font-size: 14px; }
        .reveal-btn { width: 100%; padding: 10px; border-radius: 8px; border: 1px dashed var(--border); background: transparent; color: var(--accent-quiz); font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .reveal-btn:hover { background: rgba(245,158,11,0.05); border-color: var(--accent-quiz); }
        .correct-feedback { padding: 10px; border-radius: 8px; background: rgba(16,185,129,0.05); color: var(--accent-explain); text-align: center; font-size: 14px; }
        @media (max-width: 600px) { .mcq-options { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
