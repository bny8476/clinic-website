import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';



const DoctorLabReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Reports');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: myRequests, isLoading, error } = useQuery({
    queryKey: ['doctorLabRequests'],
    queryFn: async () => {
      const response = await axiosPrivate.get('/lab/doctor/my-requests');
      return response.data;
    }
  });

  const handleDownloadPdf = async (id) => {
    try {
      const response = await axiosPrivate.get(`/lab/requests/${id}/report/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lab_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF', err);
      toast.error('Failed to download PDF report. It may not be ready yet.');
    }
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'RELEASED': return 'bg-[#F0FDF4] text-[#16A34A]';
      case 'VERIFIED': return 'bg-[#EFF6FF] text-[#2563EB]';
      case 'RESULT_ENTERED': return 'bg-[#FFF7ED] text-[#EA580C]';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'SAMPLE_COLLECTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getIconForTest = (testName) => {
    if (!testName) return <Activity size={14} />;
    const name = testName.toLowerCase();
    if (name.includes('blood') || name.includes('cbc') || name.includes('lipid')) return <Droplet size={14} className="text-red-500" />;
    if (name.includes('x-ray') || name.includes('mri') || name.includes('ultrasound')) return <Scan size={14} className="text-blue-500" />;
    if (name.includes('brain')) return <Brain size={14} className="text-purple-500" />;
    return <Activity size={14} className="text-orange-500" />;
  };

  const filteredRequests = myRequests?.filter(req => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return req.patient?.firstName?.toLowerCase().includes(q) || 
             req.patient?.lastName?.toLowerCase().includes(q) ||
             req.testCatalog?.testName?.toLowerCase().includes(q);
    }
    return true;
  }) || [];

  const tabs = ['All Reports', 'Blood Tests', 'Imaging', 'Pathology', 'Microbiology', 'Other Tests'];

  return (
    
    <div className="p-6 md:p-8 bg-white min-h-full font-sans">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lab Reports</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">View and manage all patient lab reports</p>
          </div>
          <button className="flex items-center gap-2 bg-[#5B21B6] hover:bg-indigo-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
            <Upload size={16} strokeWidth={2.5} /> Upload Report
          </button>
        </div>

        {/* Tabs and Filters Row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
                  activeTab === tab ? 'text-[#5B21B6]' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B21B6] rounded-t-md"></div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search lab reports..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#5B21B6] w-[220px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50">
              All Patients <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50">
              All Status <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Table Area */}
          <div className="flex-1 overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200">
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Report ID</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Patient</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Test/Report Name</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Report Date</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Test Date</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Lab/Center</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="8" className="text-center py-8 text-slate-500">Loading reports...</td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-slate-500">No lab reports found.</td></tr>
                ) : (
                  filteredRequests.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">REQ-{report.id}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img loading="lazy" 
                            src={`https://i.pravatar.cc/150?u=${report.patient?.id || 1}`} 
                            alt={report.patient?.firstName}
                            className="w-8 h-8 rounded-full object-cover shadow-sm"
                          />
                          <div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{report.patient?.firstName} {report.patient?.lastName}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{report.patient?.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-50`}>
                             {getIconForTest(report.testCatalog?.testName)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight">{report.testCatalog?.testName || 'Unknown Test'}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{report.testCatalog?.testCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">
                          {report.sampleCollectedAt ? format(new Date(report.sampleCollectedAt), 'dd MMM yyyy') : '-'}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-[13px] font-bold text-slate-800">
                        {report.requestedAt ? format(new Date(report.requestedAt), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">In-house Lab</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClasses(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-3 text-[#5B21B6]">
                          <button className="w-7 h-7 flex items-center justify-center rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                            <Eye size={14} strokeWidth={2.5} />
                          </button>
                          {(report.status === 'VERIFIED' || report.status === 'RELEASED') && (
                            <button 
                              onClick={() => handleDownloadPdf(report.id)}
                              className="w-7 h-7 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Download PDF"
                            >
                              <Download size={14} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Footer */}
            <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200">
              <span className="text-[12px] font-medium text-slate-500">Showing 1 to 8 of 24 reports</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">&lt;</button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-[#5B21B6] text-white font-bold text-[13px]">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50">3</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">&gt;</button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col gap-6">
            
            {/* Lab Reports Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-800">Lab Reports Summary</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">
                  This Month <ChevronDown size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[24px] font-bold text-[#16A34A] leading-none mb-2">{myRequests?.length || 0}</span>
                  <span className="text-[11px] font-bold text-slate-800 mb-1">Total Reports</span>
                </div>
                
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[24px] font-bold text-[#16A34A] leading-none mb-2">{myRequests?.filter(r => r.status === 'RELEASED').length || 0}</span>
                  <span className="text-[11px] font-bold text-[#15803D] mb-1">Released</span>
                </div>
                
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[18px] font-bold text-[#EA580C] leading-none mb-2">{myRequests?.filter(r => r.status === 'VERIFIED').length || 0}</span>
                  <span className="text-[11px] font-bold text-[#C2410C] mb-1">Verified</span>
                </div>
                
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[18px] font-bold text-[#2563EB] leading-none mb-2">{myRequests?.filter(r => !['RELEASED', 'VERIFIED'].includes(r.status)).length || 0}</span>
                  <span className="text-[11px] font-bold text-[#1D4ED8] mb-1">Pending</span>
                </div>
              </div>
            </div>

            {/* Top Test Types */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-bold text-slate-800">Top Test Types</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">
                  This Month <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="text-center py-4 text-sm text-slate-500 font-medium">Data unavailable</div>
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-800">Recent Uploads</h3>
                <button className="text-[11px] font-bold text-[#5B21B6] hover:underline">View All</button>
              </div>

              <div className="p-3 text-center text-sm text-slate-500 font-medium">
                No recent uploads
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
    
  );
};

export default DoctorLabReports;
