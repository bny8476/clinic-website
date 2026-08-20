import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorMedicalCertificates = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Certificates');

  const certificates = [
    {
      id: 'MC-0001',
      patient: { name: 'Robert Williams', details: '45 Years, Male', id: 1 },
      type: { name: 'Fitness Certificate', sub: 'General Fitness', icon: <FileText size={14} />, iconColor: 'text-purple-600 bg-purple-50' },
      issueDate: '21 May 2024',
      issueTime: '09:30 AM',
      validTill: '20 Jun 2024',
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0002',
      patient: { name: 'Emily Davis', details: '36 Years, Female', id: 2 },
      type: { name: 'Sick Leave Certificate', sub: 'Fever & Cold', icon: <Activity size={14} />, iconColor: 'text-red-500 bg-red-50' },
      issueDate: '20 May 2024',
      issueTime: '08:45 AM',
      validTill: '25 May 2024',
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0003',
      patient: { name: 'Michael Johnson', details: '50 Years, Male', id: 3 },
      type: { name: 'Maternity Leave', sub: 'Family Care', icon: <Briefcase size={14} />, iconColor: 'text-orange-500 bg-orange-50' },
      issueDate: '19 May 2024',
      issueTime: '11:30 AM',
      validTill: '30 Jun 2024',
      status: 'Draft',
      statusColor: 'blue'
    },
    {
      id: 'MC-0004',
      patient: { name: 'Sarah Wilson', details: '34 Years, Female', id: 4 },
      type: { name: 'Travel Certificate', sub: 'International Travel', icon: <Plane size={14} />, iconColor: 'text-green-600 bg-green-50' },
      issueDate: '18 May 2024',
      issueTime: '02:30 PM',
      validTill: '17 Aug 2024',
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0005',
      patient: { name: 'David Brown', details: '47 Years, Male', id: 5 },
      type: { name: 'Medical Fitness', sub: 'Employment Purpose', icon: <FileText size={14} />, iconColor: 'text-blue-500 bg-blue-50' },
      issueDate: '17 May 2024',
      issueTime: '03:15 PM',
      validTill: '16 Nov 2024',
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0006',
      patient: { name: 'Linda Taylor', details: '40 Years, Female', id: 6 },
      type: { name: 'Handicap Certificate', sub: 'Orthopedic Condition', icon: <FileText size={14} />, iconColor: 'text-purple-600 bg-purple-50' },
      issueDate: '16 May 2024',
      issueTime: '10:00 AM',
      validTill: '15 May 2026',
      status: 'Issued',
      statusColor: 'green'
    },
    {
      id: 'MC-0007',
      patient: { name: 'Daniel Martinez', details: '41 Years, Male', id: 7 },
      type: { name: 'Sick Leave Certificate', sub: 'Migraine', icon: <Activity size={14} />, iconColor: 'text-red-500 bg-red-50' },
      issueDate: '15 May 2024',
      issueTime: '01:10 PM',
      validTill: '18 May 2024',
      status: 'Expired',
      statusColor: 'red'
    },
    {
      id: 'MC-0008',
      patient: { name: 'Patricia Harris', details: '38 Years, Female', id: 8 },
      type: { name: 'Fitness Certificate', sub: 'Sports Participation', icon: <FileText size={14} />, iconColor: 'text-orange-500 bg-orange-50' },
      issueDate: '14 May 2024',
      issueTime: '09:05 AM',
      validTill: '13 Aug 2024',
      status: 'Cancelled',
      statusColor: 'gray'
    }
  ];

  const getStatusBadgeClasses = (color) => {
    switch (color) {
      case 'green': return 'bg-[#F0FDF4] text-[#16A34A]';
      case 'blue': return 'bg-[#EFF6FF] text-[#2563EB]';
      case 'red': return 'bg-[#FEF2F2] text-[#DC2626]';
      case 'orange': return 'bg-[#FFF7ED] text-[#EA580C]';
      case 'gray': return 'bg-[#F8FAFC] text-[#64748B]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = ['All Certificates', 'Draft', 'Issued', 'Expired', 'Cancelled'];

  return (
    <div className="p-6 md:p-8 bg-white min-h-full font-sans">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Medical Certificates</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Create, manage and view all patient medical certificates</p>
          </div>
          <button className="flex items-center gap-2 bg-[#5B21B6] hover:bg-indigo-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
            <Plus size={16} strokeWidth={2.5} /> New Certificate
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
                placeholder="Search certificates..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#5B21B6] w-[220px]"
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
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Certificate ID</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Patient</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Certificate Type</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Issue Date</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Valid Till</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-500 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                    <td className="py-4 px-6">
                      <p className="text-[13px] font-bold text-slate-800 leading-tight">{cert.id}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img loading="lazy" 
                          src={`https://i.pravatar.cc/150?u=${cert.patient.id}`} 
                          alt={cert.patient.name}
                          className="w-8 h-8 rounded-full object-cover shadow-sm"
                        />
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{cert.patient.name}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{cert.patient.details}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cert.type.iconColor}`}>
                           {cert.type.icon}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{cert.type.name}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{cert.type.sub}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-[13px] font-bold text-slate-800 leading-tight">{cert.issueDate}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{cert.issueTime}</p>
                    </td>
                    <td className="py-4 px-6 text-[13px] font-bold text-slate-800">
                      {cert.validTill}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClasses(cert.statusColor)}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3 text-[#5B21B6]">
                        {cert.status === 'Draft' ? (
                          <>
                            <button className="w-7 h-7 flex items-center justify-center rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                              <PenTool size={14} strokeWidth={2.5} />
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="w-7 h-7 flex items-center justify-center rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                              <Eye size={14} strokeWidth={2.5} />
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                              <Download size={14} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Footer */}
            <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200">
              <span className="text-[12px] font-medium text-slate-500">Showing 1 to 8 of 24 certificates</span>
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
            
            {/* Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-800">Certificate Summary</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">
                  This Month <ChevronDown size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[24px] font-bold text-[#16A34A] leading-none mb-2">24</span>
                  <span className="text-[11px] font-bold text-slate-800 mb-1">Total Certificates</span>
                  <span className="text-[9px] font-bold text-[#16A34A] flex items-center gap-0.5"><ArrowUp size={10} strokeWidth={3}/> 12% from last month</span>
                </div>
                
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[24px] font-bold text-[#2563EB] leading-none mb-2">18</span>
                  <span className="text-[11px] font-bold text-[#1D4ED8] mb-1">Issued</span>
                  <span className="text-[9px] font-semibold text-slate-500">(75%)</span>
                </div>
                
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[18px] font-bold text-[#EA580C] leading-none mb-2">4</span>
                  <span className="text-[11px] font-bold text-[#C2410C] mb-1">Expired</span>
                  <span className="text-[9px] font-semibold text-slate-500">(16.7%)</span>
                </div>
                
                <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-[18px] font-bold text-[#9333EA] leading-none mb-2">2</span>
                  <span className="text-[11px] font-bold text-[#7E22CE] mb-1">Draft</span>
                  <span className="text-[9px] font-semibold text-slate-500">(8.3%)</span>
                </div>
              </div>
            </div>

            {/* Top Types */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-bold text-slate-800">Certificate Types</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">
                  This Month <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { name: 'Fitness Certificate', icon: <FileText size={14} />, count: '12', pct: '50%', fill: 'w-[50%]', iconColor: 'text-purple-600' },
                  { name: 'Sick Leave', icon: <Activity size={14} />, count: '7', pct: '29.2%', fill: 'w-[29.2%]', iconColor: 'text-red-500' },
                  { name: 'Travel Certificate', icon: <Plane size={14} />, count: '3', pct: '12.5%', fill: 'w-[12.5%]', iconColor: 'text-green-600' },
                  { name: 'Others', icon: <Briefcase size={14} />, count: '2', pct: '8.3%', fill: 'w-[8.3%]', iconColor: 'text-orange-500' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded bg-slate-50 flex items-center justify-center ${item.iconColor}`}>
                           {item.icon}
                        </div>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-slate-500">{item.count} ({item.pct})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 ml-8 max-w-[calc(100%-2rem)]">
                      <div className={`bg-[#5B21B6] h-1.5 rounded-full ${item.fill}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-800">Recent Certificates</h3>
                <button className="text-[11px] font-bold text-[#5B21B6] hover:underline">View All</button>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-green-50 text-green-600 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Robert Williams</p>
                    <p className="text-[10px] font-medium text-slate-500">Fitness Certificate</p>
                    <p className="text-[9px] font-medium text-slate-400">21 May 2024, 09:30 AM</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-md">Issued</span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorMedicalCertificates;
