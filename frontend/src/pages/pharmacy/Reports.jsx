import { useState } from 'react';
import { REPORT_CATALOG, CATEGORIES } from './reports/reportCatalog';



/**
 * Reports & Analytics page — orchestrates catalog browsing, OTP-gated access,
 * inline preview, and scheduled delivery management.
 *
 * Business logic lives in sub-components; this file is intentionally thin
 * (~100 lines) to serve only as a layout/state coordinator.
 */
export default function Reports() {
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [searchTerm,      setSearchTerm]      = useState('');
  const [favourites,      setFavourites]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('rpt_favs') || '[]'); } catch { return []; }
  });
  const [openReport,      setOpenReport]      = useState(null);
  const [scheduleReport,  setScheduleReport]  = useState(null);
  const [isOtpOpen,       setIsOtpOpen]       = useState(false);
  const [pendingReport,   setPendingReport]   = useState(null);
  const [verifiedEmail,   setVerifiedEmail]   = useState(false);

  const toggleFav = (id) => {
    setFavourites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('rpt_favs', JSON.stringify(next));
      return next;
    });
  };

  const handleOpenReport = (report) => {
    if (report.isRestricted && !verifiedEmail) {
      setPendingReport(report);
      setIsOtpOpen(true);
    } else {
      setOpenReport(report);
    }
  };

  const filteredReports = REPORT_CATALOG.filter(r => {
    const matchCat    = activeCategory === 'all' || activeCategory === 'schedules' || r.category === activeCategory;
    const matchSearch = !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const favReports = REPORT_CATALOG.filter(r => favourites.includes(r.id));
  const catGroups  = activeCategory === 'all'
    ? CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'schedules')
    : [CATEGORIES.find(c => c.id === activeCategory)].filter(Boolean);

  return (
    <div className="space-y-5">
      {/* OTP gate for restricted compliance reports */}
      <OTPVerificationModal
        isOpen={isOtpOpen}
        onClose={() => { setIsOtpOpen(false); setPendingReport(null); }}
        onVerifySuccess={() => {
          setVerifiedEmail(true);
          setOpenReport(pendingReport);
          setPendingReport(null);
        }}
      />

      {/* Page header */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <h2 className="text-[32px] font-bold text-[#0f172a] tracking-tight">Reports & Analytics</h2>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            {REPORT_CATALOG.length} reports across {CATEGORIES.length - 2} categories — sales, stock, procurement, GST, compliance & clinical
          </p>
        </div>
      </div>

      {/* Global search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search reports — e.g. 'GSTR-1', 'narcotic', 'expiry', 'payables'..."
            className="w-full pl-12 pr-10 py-4 text-[15px] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#2563eb]/10 focus:border-[#2563eb] bg-white transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300">
            {searchTerm ? (
              <button onClick={() => setSearchTerm('')} aria-label="Clear search" className="hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-[#2563eb] hover:bg-slate-50 transition-colors shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filters
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 custom-scrollbar">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
                activeCategory === cat.id
                  ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-md shadow-[#2563eb]/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
              }`}>
              <CatIcon className="w-4 h-4" />
              {cat.label}
              {cat.id !== 'schedules' && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md ml-1 ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.id === 'all' ? REPORT_CATALOG.length : REPORT_CATALOG.filter(r => r.category === cat.id).length}
                </span>
              )}
            </button>
          );
        })}
        {/* Placeholder for the right arrow in the design */}
        <button className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Inline report preview */}
      {openReport && (
        <div className="bg-white rounded-2xl border border-[#bfdbfe] p-6 shadow-sm">
          <ReportPreviewPanel
            report={openReport}
            onClose={() => setOpenReport(null)}
            onSchedule={() => setScheduleReport(openReport)}
          />
        </div>
      )}

      {/* Schedules management tab */}
      {activeCategory === 'schedules' && !openReport && <SchedulesTab />}

      {/* Favourites strip */}
      {activeCategory !== 'schedules' && favReports.length > 0 && !searchTerm && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400" fill="currentColor" />
            <h3 className="text-xl font-bold text-slate-900">Favourites</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favReports.map(r => (
              <ReportCard key={r.id} report={r}
                isFav={favourites.includes(r.id)}
                onToggleFav={toggleFav}
                onOpen={handleOpenReport}
                onSchedule={setScheduleReport}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category groups */}
      {activeCategory !== 'schedules' && catGroups.map(cat => {
        if (!cat) return null;
        const catReports = filteredReports.filter(r => r.category === cat.id);
        if (catReports.length === 0) return null;
        const CatIcon = cat.icon;
        return (
    
          <div key={cat.id} className="space-y-6 mt-4">
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <CatIcon className={`w-6 h-6 text-[#1e1b4b]`} />
                <h3 className="text-[20px] font-bold text-slate-900">{cat.label}</h3>
                <span className="text-[12px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium ml-2">
                  {catReports.length} reports
                </span>
                {cat.id === 'compliance' && (
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-bold border border-blue-200 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Role-restricted
                  </span>
                )}
              </div>
              <button className="flex items-center gap-1.5 text-[14px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
                View All <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 border-b border-slate-100 last:border-0">
              {catReports.map(r => (
                <ReportCard key={r.id} report={r}
                  isFav={favourites.includes(r.id)}
                  onToggleFav={toggleFav}
                  onOpen={handleOpenReport}
                  onSchedule={setScheduleReport}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty search state */}
      {searchTerm && filteredReports.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No reports match &quot;{searchTerm}&quot;</p>
          <p className="text-xs text-slate-300 mt-1">Try 'sales', 'expiry', 'GSTR', 'narcotic', or 'supplier'</p>
        </div>
      )}

      {/* Schedule drawer modal */}
      {scheduleReport && (
        <ScheduleDrawer
          report={scheduleReport}
          onClose={() => setScheduleReport(null)}
          onSaved={() => {}}
        />
      )}
    </div>
    
  );
}
