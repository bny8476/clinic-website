import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);

    const errorMessage = error?.message || String(error);
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module/i.test(errorMessage) ||
      /Importing a module script failed/i.test(errorMessage) ||
      /Loading chunk/i.test(errorMessage);

    if (isChunkError) {
      const reloadKey = 'eb_chunk_reload_count';
      const count = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(reloadKey, String(count + 1));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Application Updated
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            A new version of the app is available. Please reload the page to continue.
          </p>
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
