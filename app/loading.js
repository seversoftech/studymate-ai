export default function Loading() {
  return (
    <main className="app-loading-screen" aria-busy="true" aria-live="polite">
      <div className="app-loading-card">
        <div className="app-loading-logo" aria-hidden="true">🧠</div>
        <div className="app-loading-spinner" aria-hidden="true" />
        <h1 className="app-loading-title">Loading StudyMate AI</h1>
        <p className="app-loading-text">
          Preparing your study workspace and getting everything ready.
        </p>
      </div>
    </main>
  );
}
