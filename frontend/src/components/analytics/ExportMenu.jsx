import { useState } from 'react';

const ExportMenu = ({ onExport, isExporting = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex justify-center items-center w-full rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-slate-700 rounded-full"></div>
        ) : (
          <Download className="mr-2 h-4 w-4 text-slate-500" />
        )}
        Export
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <FileText className="mr-3 h-4 w-4 text-slate-400" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <FileIcon className="mr-3 h-4 w-4 text-slate-400" />
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <FileSpreadsheet className="mr-3 h-4 w-4 text-slate-400" />
              Export as Excel (XLSX)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
