import PropTypes from 'prop-types';
import { BarChart2 } from 'lucide-react';
import { CATEGORIES } from './reportCatalog';

import { doExportCSV } from './reportExportUtils';
import { toast } from 'react-hot-toast';
import { fmtDateTime, fmtDateTimeEnd, monthStart, today } from './reportCatalog';



/**
 * Individual report card shown in the catalog grid.
 * Displays the report name, description, category icon, and action buttons.
 */
export default function ReportCard({ report, isFav, onToggleFav, onOpen, onSchedule }) {
  const catIcon = CATEGORIES.find(c => c.id === report.category);
  const CatIcon = catIcon?.icon || BarChart2;

  const handleQuickExport = async (type) => {
    try {
      const res = await report.endpoint(fmtDateTime(monthStart), fmtDateTimeEnd(today), {});
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        if (type === 'csv') doExportCSV(report, data);
        // Note: Image export requires a DOM element, which we don't have here since preview is not open
        // So for Image export on card level, it's not straightforward unless we render it hidden or just alert
        else toast('Image export requires generating the preview first.', { icon: 'ℹ️' });
      } else {
        toast.error('Quick export is not supported for summary reports');
      }
    } catch {
      toast.error(`Failed to export ${type.toUpperCase()}`);
    }
  };

  return (
    
    <div className={`bg-white rounded-2xl border p-6 flex flex-col h-full hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-default ${
      report.isNarcotic ? 'border-blue-200' : 'border-slate-100'
    }`}>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            catIcon?.color === 'text-blue-500' ? 'bg-blue-50 text-blue-600' :
            catIcon?.color === 'text-blue-500' ? 'bg-blue-50 text-blue-600' :
            catIcon?.color === 'text-amber-500' ? 'bg-amber-50 text-amber-600' :
            catIcon?.color === 'text-blue-500' ? 'bg-blue-50 text-blue-600' :
            catIcon?.color === 'text-red-500' ? 'bg-red-50 text-red-600' :
            'bg-[#dbeafe] text-[#2563EB]' // Default to the custom purple
          }`}>
            <CatIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-slate-900 leading-tight pr-4">{report.name}</h3>
          </div>
        </div>
        <button
          onClick={() => onToggleFav(report.id)}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          className={`p-1 shrink-0 rounded transition-colors ${isFav ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
        >
          <Star className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Description */}
      <div className="mb-6 flex-1">
        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">{report.desc}</p>
        {report.isNarcotic && (
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
            NDPS Mandatory
          </span>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={() => onOpen(report)}
          className="flex-[1.5] flex items-center justify-center gap-1.5 py-2 bg-[#2563EB] text-white text-[12px] font-bold rounded-lg hover:bg-[#1e40af] shadow-sm shadow-[#2563EB]/20 transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
          Generate
        </button>
        <button
          onClick={() => handleQuickExport('csv')}
          title="Quick Export CSV"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
          CSV
        </button>
        <button
          onClick={() => onSchedule(report)}
          aria-label="Schedule report"
          className="w-8 h-8 shrink-0 flex items-center justify-center border border-slate-200 text-slate-400 rounded-full hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    
  );
}

ReportCard.propTypes = {
  report:       PropTypes.shape({
    id:          PropTypes.string.isRequired,
    name:        PropTypes.string.isRequired,
    desc:        PropTypes.string.isRequired,
    category:    PropTypes.string.isRequired,
    isNarcotic:  PropTypes.bool,
    isRestricted: PropTypes.bool,
  }).isRequired,
  isFav:        PropTypes.bool.isRequired,
  onToggleFav:  PropTypes.func.isRequired,
  onOpen:       PropTypes.func.isRequired,
  onSchedule:   PropTypes.func.isRequired,
};
