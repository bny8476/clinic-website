import { useState, useEffect, useRef } from 'react';
import { FileText, User, Calendar, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';

const ICON_MAP = {
  'User': User,
  'Calendar': Calendar,
  'FileText': FileText,
  'Activity': Activity
};

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axiosPrivate.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const debounceTimeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (result) => {
    onClose();
    if (result.type === 'action') {
      // Simulate action
    } else {
      // Simulate navigation
      // navigate(`/patient/${result.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Area */}
        <div className="relative flex items-center border-b border-slate-100 px-4">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full h-16 bg-transparent border-0 border-transparent focus:border-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none text-slate-900 placeholder:text-slate-400 text-lg px-4 outline-none shadow-none focus:shadow-none"
            placeholder="Search patients, appointments, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
             <div className="px-6 py-12 text-center text-slate-500">
               <Activity className="w-8 h-8 mx-auto text-indigo-400 mb-3 animate-spin" />
               <p className="text-sm font-medium text-slate-900">Searching...</p>
             </div>
          ) : results.length === 0 && query !== '' ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-900">No results found</p>
              <p className="text-xs mt-1">We couldn't find anything matching "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {query === '' && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type to search...
                </div>
              )}
              {results.map((result) => {
                const Icon = ICON_MAP[result.icon] || Activity;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center shrink-0 transition-all text-slate-500 group-hover:text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 group-hover:text-indigo-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-[13px] text-slate-500 truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-sans shadow-sm">↑</kbd> <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-sans shadow-sm">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-sans shadow-sm">↵</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-sans shadow-sm">ESC</kbd> to close</span>
          </div>
        </div>

      </div>
    </div>
  );
}
