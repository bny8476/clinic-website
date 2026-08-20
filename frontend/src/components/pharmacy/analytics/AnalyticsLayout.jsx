import { useState } from 'react';

export default function AnalyticsLayout() {
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics Engine</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            <Calendar className="w-4 h-4" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium outline-none cursor-pointer"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
              <option>Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 pb-px">
        {[
          { name: 'Dashboard', path: '/analytics' },
          { name: 'ABC Analysis', path: '/analytics/abc' },
          { name: 'Month-over-Month', path: '/analytics/mom' },
          { name: 'Supplier', path: '/analytics/supplier' }
        ].map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            end={tab.path === '/analytics'}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </div>

      <div className="mt-4">
        <Outlet context={{ dateRange }} />
      </div>
    </div>
  );
}
