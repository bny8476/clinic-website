import { useState, useEffect } from 'react';

export default function TopNav({ toggleSidebar, isSidebarOpen }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 font-sans shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          {!isSidebarOpen && (
            <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div 
            className="max-w-md w-full relative hidden sm:block cursor-text"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              readOnly
              placeholder="Search medicines, invoices, suppliers..." 
              className="w-full bg-slate-50/80 border border-slate-100 rounded-xl pl-9 pr-16 py-2 text-[13px] focus:ring-1 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400 cursor-text pointer-events-none" 
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-200">⌘</span>
              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-200">K</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5 shrink-0">
          <QuickActionDropdown />
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <MessageDropdown />
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          
          <ProfileDropdown />
        </div>
      </header>
      
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
