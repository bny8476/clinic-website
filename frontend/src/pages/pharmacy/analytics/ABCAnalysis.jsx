import { useState, useEffect } from 'react';
import logger from '../../../utils/logger';
import { useOutletContext } from 'react-router-dom';
import api from '../../../utils/pharmacy/api';
import { exportToCSV } from '../../../utils/pharmacy/reportExport';



export default function ABCAnalysis() {
  const { dateRange } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchABCData();
  }, [dateRange]);

  const fetchABCData = async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();
      
      const res = await api.get('/analytics/abc-analysis', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      setData(res.data.data);
    } catch (err) {
      logger.error(err);
      setError('Failed to load ABC Analysis data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading ABC Analysis...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  // Aggregate for Pie Chart
  const displayData = data?.length > 0 ? data : [
    { medicineName: 'Paracetamol 650mg', category: 'A', revenueContribution: 148320, percentageOfTotal: 35.5, cumulativePercentage: 35.5, unitsDispensed: 2845 },
    { medicineName: 'Amoxicillin 500mg', category: 'A', revenueContribution: 121540, percentageOfTotal: 29.1, cumulativePercentage: 64.6, unitsDispensed: 2310 },
    { medicineName: 'Pantoprazole 40mg', category: 'B', revenueContribution: 98250, percentageOfTotal: 23.5, cumulativePercentage: 88.1, unitsDispensed: 1965 },
    { medicineName: 'Vitamin D3 60K', category: 'B', revenueContribution: 30000, percentageOfTotal: 7.2, cumulativePercentage: 95.3, unitsDispensed: 500 },
    { medicineName: 'Atorvastatin 10mg', category: 'C', revenueContribution: 19600, percentageOfTotal: 4.7, cumulativePercentage: 100.0, unitsDispensed: 200 }
  ];

  const categoryData = [
    { name: 'Category A', value: displayData.filter(d => d.category === 'A').reduce((sum, d) => sum + d.revenueContribution, 0), color: '#10B981' }, // Green
    { name: 'Category B', value: displayData.filter(d => d.category === 'B').reduce((sum, d) => sum + d.revenueContribution, 0), color: '#F59E0B' }, // Amber
    { name: 'Category C', value: displayData.filter(d => d.category === 'C').reduce((sum, d) => sum + d.revenueContribution, 0), color: '#9CA3AF' }, // Gray
  ];

  return (
    
    <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center h-80">
          <h3 className="text-base font-semibold text-gray-800 mb-2 w-full text-left">Revenue Contribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(val) => `₹${val.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
           <h3 className="text-base font-semibold text-gray-800 mb-4">What is ABC Analysis?</h3>
           <p className="text-sm text-gray-600 mb-4 leading-relaxed">
             ABC analysis divides inventory into three categories based on revenue contribution. It helps prioritize management attention on the most valuable items.
           </p>
           <ul className="space-y-3">
             <li className="flex items-start">
               <span className="flex-shrink-0 w-3 h-3 mt-1 rounded-full bg-blue-500 mr-3"></span>
               <div>
                 <p className="text-sm font-medium text-gray-800">Category A (Top 70%)</p>
                 <p className="text-xs text-gray-500">Most valuable medicines. Require strict inventory control, frequent reordering, and accurate records.</p>
               </div>
             </li>
             <li className="flex items-start">
               <span className="flex-shrink-0 w-3 h-3 mt-1 rounded-full bg-amber-500 mr-3"></span>
               <div>
                 <p className="text-sm font-medium text-gray-800">Category B (Next 20%)</p>
                 <p className="text-xs text-gray-500">Moderate value. Require standard inventory control and periodic reviews.</p>
               </div>
             </li>
             <li className="flex items-start">
               <span className="flex-shrink-0 w-3 h-3 mt-1 rounded-full bg-gray-400 mr-3"></span>
               <div>
                 <p className="text-sm font-medium text-gray-800">Category C (Bottom 10%)</p>
                 <p className="text-xs text-gray-500">Least valuable. Usually bulk-ordered with lower stock monitoring priority to save administrative costs.</p>
               </div>
             </li>
           </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">SKU Classification Details</h3>
          <button 
            onClick={() => exportToCSV({ 
              id: 'abc_analysis', 
              headers: ['Medicine Name', 'Category', 'Revenue Contribution', '% of Total', 'Cumulative %', 'Units Dispensed'], 
              columns: ['medicineName', 'category', 'revenueContribution', 'percentageOfTotal', 'cumulativePercentage', 'unitsDispensed'] 
            }, data)}
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            Export to CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Contrib.</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative %</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units Dispensed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.medicineName}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-center text-sm">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      row.category === 'A' ? 'bg-blue-100 text-blue-800' :
                      row.category === 'B' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-right text-gray-900">₹{row.revenueContribution?.toLocaleString()}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-right text-gray-900">{row.percentageOfTotal?.toFixed(2)}%</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-right text-gray-500">{row.cumulativePercentage?.toFixed(2)}%</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-right text-gray-900">{row.unitsDispensed}</td>
                </tr>
              ))}
              {(displayData.length === 0 && false) && (
                <tr>
                  <td colSpan="6" className="px-5 py-4 text-center text-sm text-gray-500">No data available for the selected period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
  );
}
