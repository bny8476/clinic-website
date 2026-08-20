import { useState } from 'react';
import { useAuth } from '../../../context/pharmacy/AuthContext';
import { NAV_BY_ROLE, getBaseRoleForUI } from '../../../config/pharmacy/roles.config';

export default function MainLayout() {
  const { activeRole, roles } = useAuth();
  const currentRole = activeRole || roles?.[0] || 'SYSTEM_ADMIN';
  const baseRole = getBaseRoleForUI(currentRole);
  
  const dashboardTiles = NAV_BY_ROLE[baseRole] || NAV_BY_ROLE.PHARMACY_STAFF;
  
  // Default open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="h-screen bg-[#F3F6FF] flex font-sans overflow-hidden">
      {dashboardTiles && dashboardTiles.length > 0 && (
        <Sidebar items={dashboardTiles} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
