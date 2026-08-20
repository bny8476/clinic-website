import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Universal Analytics Filter Bar.
 * Synchronizes selected filters with the URL search parameters to allow deep linking
 * and preserve state during drill-downs.
 */
const AnalyticsFilterBar = ({ 
  showDateRange = true, 
  showBranch = true, 
  showDoctor = false, 
  showDepartment = false,
  onFilterChange
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [branches, setBranches] = useState([]); // In reality, fetch from API

  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    branchId: searchParams.get('branchId') || '',
    doctorId: searchParams.get('doctorId') || '',
    departmentId: searchParams.get('departmentId') || '',
    timeRange: searchParams.get('timeRange') || 'THIS_MONTH', // Default
  });

  // Example: user branch scoping
  const isGlobalAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_SUPER_ADMIN');

  useEffect(() => {
    // Notify parent on load and on change
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-slate-100">
      {showDateRange && (
        <>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Time Range</label>
            <select
              name="timeRange"
              value={filters.timeRange}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
          {filters.timeRange === 'CUSTOM' && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleChange}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleChange}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </>
      )}

      {showBranch && isGlobalAdmin && (
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Branch</label>
          <select
            name="branchId"
            value={filters.branchId}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">All Branches</option>
            {/* Populate dynamically */}
          </select>
        </div>
      )}

      {/* Add similar selects for Department and Doctor if enabled */}
    </div>
  );
};

export default AnalyticsFilterBar;
