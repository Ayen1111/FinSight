import { useState } from 'react';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';

function App() {
  const [uploaded, setUploaded] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const handleUploadSuccess = (data) => {
    setInitialData(data);
    setUploaded(true);
  };

  const handleReset = () => {
    setUploaded(false);
    setInitialData(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center" style={{ justifyContent: uploaded ? 'space-between' : 'center' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-lg">
              💰
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">FinSight</h1>
              <p className="text-xs text-[var(--color-text-dim)]">AI-Powered Finance Analyzer</p>
            </div>
          </div>
          {uploaded && (
            <button
              onClick={handleReset}
              className="text-sm text-[var(--color-text-muted)] hover:text-white px-4 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
            >
              Upload New File
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {!uploaded ? (
          <UploadSection onSuccess={handleUploadSuccess} />
        ) : (
          <Dashboard initialData={initialData} />
        )}
      </main>
    </div>
  );
}

export default App;
