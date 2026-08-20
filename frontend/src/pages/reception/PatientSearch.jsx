import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { fadeIn } from '../../components/ui/motion';
import { useDebounce } from 'use-debounce';



const PatientSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['patient-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await axiosPrivate.get(`/patients/search?query=${encodeURIComponent(debouncedQuery)}`);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  return (
    
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/reception" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reception Desk
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <Search className="w-7 h-7 text-[var(--color-navy-800)]" />
            Patient Search
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Search patient records by name, phone, or patient ID.
          </p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by patient name, phone number, or ID (min 2 characters)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-500)] focus:border-transparent transition-all font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-4">
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="text-center text-[var(--color-text-muted)] py-8">Searching...</div>
            )}
            
            {!isLoading && debouncedQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center text-[var(--color-text-muted)] py-8">
                No patients found matching "{debouncedQuery}".
                <div className="mt-4">
                  <Link to="/reception/register" className="text-[var(--color-navy-600)] hover:underline font-medium">
                    Register a new patient instead?
                  </Link>
                </div>
              </div>
            )}

            {!isLoading && searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map(patient => (
                  <div 
                    key={patient.id} 
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                    onClick={() => navigate(`/reception/book?patientId=${patient.patientId}&patientName=${encodeURIComponent((patient.firstName || '') + ' ' + (patient.lastName || ''))}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-navy-100)] flex items-center justify-center text-[var(--color-navy-700)] font-bold text-sm">
                        {(patient.firstName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--color-navy-900)] group-hover:text-[var(--color-navy-700)] transition-colors">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          ID: {patient.opNumber} • {patient.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {debouncedQuery.length < 2 && (
              <div className="text-center text-[var(--color-text-muted)] py-8 text-sm bg-[var(--color-surface-alt)] rounded-xl border border-dashed border-[var(--color-border)]">
                Type at least 2 characters to begin searching
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
    
  );
};

export default PatientSearch;
