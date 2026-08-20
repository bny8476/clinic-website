import { useState, useRef, useEffect } from 'react';

export default function QuickActionDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
      >
        <Zap size={16} className="fill-current" />
        Quick Action
        <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-xs font-medium text-slate-700"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Pharmacy Actions
          </div>
          <button onClick={() => { setIsOpen(false); window.location.pathname = '/pharmacy/direct-pharmacy-sales'; }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5">
            <span className="p-1 rounded bg-indigo-50 text-indigo-600"><ShoppingCart size={13} /></span> Direct Sale
          </button>
          <button onClick={() => { setIsOpen(false); window.location.pathname = '/pharmacy/medicine-master'; }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5">
            <span className="p-1 rounded bg-orange-50 text-orange-600"><Package size={13} /></span> Add Medicine
          </button>
          <button onClick={() => { setIsOpen(false); window.location.pathname = '/pharmacy/purchase-orders'; }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5">
            <span className="p-1 rounded bg-blue-50 text-blue-600"><FileText size={13} /></span> Purchase Order
          </button>
          <button onClick={() => { setIsOpen(false); window.location.pathname = '/pharmacy/suppliers'; }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 border-t border-slate-100 mt-1 pt-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600"><Truck size={13} /></span> Manage Suppliers
          </button>
        </div>
      )}
    </div>
  );
}
