import React from 'react';
import logger from '../../../utils/logger';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    logger.error("ErrorBoundary caught an error", error, errorInfo);

    const errorMessage = error?.message || String(error);
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module/i.test(errorMessage) ||
      /Importing a module script failed/i.test(errorMessage) ||
      /Loading chunk/i.test(errorMessage);

    if (isChunkError) {
      const reloadKey = 'pharmacy_eb_chunk_reload_count';
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-8">
              A new version of the application is available. Please refresh the page.
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left bg-slate-50 p-4 rounded-xl overflow-x-auto text-xs font-mono text-slate-600 border border-slate-200">
                <p className="font-bold text-red-600 mb-2">{this.state.error.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
