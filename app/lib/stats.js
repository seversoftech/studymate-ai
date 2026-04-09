export const DEFAULT_STATS = {
  summaries: 0,
  explains: 0,
  quizzes: 0,
  questions: 0,
  flashcards: 0,
};

export function getStoredStats() {
  try {
    const raw = JSON.parse(localStorage.getItem('study_stats') || '{}');
    return { ...DEFAULT_STATS, ...raw };
  } catch {
    return { ...DEFAULT_STATS };
  }
}
