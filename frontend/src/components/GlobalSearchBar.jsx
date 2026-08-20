import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { axiosPrivate } from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../hooks/pharmacy/useDebounce';

/**
 * GlobalSearchBar — stub component.
 * Results are scoped by the current user's roles.
 * Future: connect to /api/search?q=&roles= endpoint.
 */
const GlobalSearchBar = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { roles } = useAuthStore();

  const debouncedQuery = useDebounce(query, 300);

  const { data: searchData = [] } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      const res = await axiosPrivate.get('/patients/search', { params: { query: debouncedQuery } });
      return res.data.map(p => ({
        type: 'Patient',
        label: `${p.fullName} (${p.uhid || 'No UHID'})`,
        path: '/patient/dashboard',
        icon: <UserRound size={14} />
      }));
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  useEffect(() => {
    setResults(searchData);
  }, [searchData]);

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-input-bg)', borderRadius: '8px', padding: '6px 12px', width: '220px' }}>
        <Search size={15} color="var(--color-text-muted)" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search..."
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: 'var(--color-text)', width: '100%' }}
        />
        {query && (
          <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--color-surface)', borderRadius: '10px', boxShadow: 'var(--shadow-elevated)',
          border: '1px solid var(--color-border)', overflow: 'hidden', zIndex: 100,
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { navigate(r.path); clear(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-text)',
                borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>{r.icon}</span>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{r.type}</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)' }}>{r.label}</p>
              </div>
            </button>
          ))}
          <div style={{ padding: '8px 14px', background: 'var(--color-surface-alt)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Full search coming soon · Results scoped by your role
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
