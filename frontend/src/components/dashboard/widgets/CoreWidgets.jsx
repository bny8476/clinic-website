
export const PatientQueueWidget = ({ appointments, navigate }) => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[#101830] dark:text-white">OP Patients</h3>
      <button className="text-xs font-bold text-[#5244F2]">View All</button>
    </div>
    <table className="w-full text-left text-sm mb-4">
      <thead>
        <tr className="text-gray-500 font-medium">
          <th className="pb-3 font-medium">Token</th>
          <th className="pb-3 font-medium">Patient Name</th>
          <th className="pb-3 font-medium">Time</th>
          <th className="pb-3 font-medium text-center">Status</th>
        </tr>
      </thead>
      <tbody className="text-sm font-medium text-[#101830] dark:text-gray-200">
        {appointments && appointments.length > 0 ? appointments.slice(0, 5).map((apt, i) => { 
          const row = { 
              token: `T-${apt.id}`, 
              name: apt.patientFirstName + ' ' + apt.patientLastName, 
              time: new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
              status: apt.status, 
              statusColor: apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600' 
          };
          return (
          <tr key={i} className="border-t border-gray-50 dark:border-[#1A263E]/50">
            <td className="py-2.5 font-bold">{row.token}</td>
            <td className="py-2.5">{row.name}</td>
            <td className="py-2.5 text-gray-500 text-xs">{row.time}</td>
            <td className="py-2.5 text-center">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.statusColor}`}>
                {row.status}
              </span>
            </td>
          </tr>
        )}) : (
          <tr>
            <td colSpan="4" className="text-center py-4 text-gray-500 text-xs">No OP patients</td>
          </tr>
        )}
      </tbody>
    </table>
    <button onClick={() => navigate && navigate('?panel=queue')} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-[#5244F2] border border-gray-100 dark:border-[#1A263E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A263E]">
      Go to Queue <ChevronRight size={16} />
    </button>
  </div>
);

export const NextAppointmentWidget = ({ appointments, navigate }) => {
  return (
    <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#101830] dark:text-white">Next Appointment</h3>
        <button onClick={() => navigate && navigate('?panel=calendar')} className="text-xs font-bold text-[#5244F2]">View Calendar</button>
      </div>
      
        {appointments && appointments.length > 0 ? (() => {
            const next = appointments.find(a => new Date(a.startTime) > new Date()) || appointments[0];
            const date = new Date(next.startTime);
            return (
            <div className="flex gap-4 items-start mb-5">
                <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A263E] rounded-xl px-3 py-2 border border-gray-100 dark:border-[#2A3B5E]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{date.toLocaleString('default', { month: 'short' })}</span>
                <span className="text-2xl font-bold text-[#101830] dark:text-white leading-none my-1">{date.getDate()}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{date.toLocaleString('default', { weekday: 'short' })}</span>
                </div>
                <div>
                <p className="text-xs font-bold text-gray-500 mb-1">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <h4 className="font-bold text-[#101830] dark:text-white text-base">{next.patientFirstName} {next.patientLastName}</h4>
                <p className="text-sm text-gray-500 mb-1">{next.reasonForVisit || 'Consultation'}</p>
                <p className="text-xs text-gray-400">ID: {next.patientId}</p>
                </div>
            </div>
            );
        })() : <div className="text-sm text-gray-500 py-4">No upcoming appointments</div>}
      
      <button onClick={() => navigate && navigate('?panel=queue')} className="w-full py-3 bg-[#5244F2] hover:bg-[#4233D2] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
        <Video size={18} /> Start Consultation
      </button>
    </div>
  );
};

export const CalendarTimelineWidget = ({ appointments }) => (
  <div className="lg:col-span-5 bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={20} /></button>
        <h3 className="font-bold text-lg text-[#101830] dark:text-white">{new Date().toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={20} /></button>
        <button className="text-xs font-bold border rounded px-2 py-1 text-gray-600 border-gray-200">Today</button>
      </div>
      <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#1A263E] p-1 rounded-lg">
        <button className="px-4 py-1 text-xs font-bold bg-white text-[#5244F2] rounded-md shadow-sm">Day</button>
        <button className="px-4 py-1 text-xs font-bold text-gray-500 hover:text-gray-800">Week</button>
        <button className="px-4 py-1 text-xs font-bold text-gray-500 hover:text-gray-800">Month</button>
        <button className="px-2 py-1 text-gray-400">...</button>
      </div>
    </div>
    
    <div className="flex-1 relative border-t border-gray-100 dark:border-[#1A263E] pt-4 overflow-y-auto">
      <div className="flex text-xs font-medium text-gray-400 mb-2 px-12">
        <div className="flex-1">08:00 AM</div>
        <div className="flex-1">09:00 AM</div>
        <div className="flex-1">10:00 AM</div>
        <div className="flex-1">11:00 AM</div>
        <div className="flex-1">12:00 PM</div>
        <div className="flex-1">01:00 PM</div>
        <div className="flex-1">02:00 PM</div>
        <div className="flex-1">03:00 PM</div>
        <div className="flex-1">04:00 PM</div>
        <div className="flex-1">05:00 PM</div>
      </div>
      
      <div className="relative mt-2 min-h-[400px]">
        {/* Timeline hours */}
        {['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map((time, i) => (
          <div key={i} className="flex items-center mb-6 relative">
            <div className="w-16 text-xs text-gray-500 font-medium shrink-0 pt-2 text-right pr-4">
              {time}
            </div>
            <div className="flex-1 border-t border-gray-100 dark:border-[#1A263E]"></div>
          </div>
        ))}
        
        {/* Red current time line */}
        <div className="absolute left-16 right-0 border-t-2 border-red-500 z-10 flex items-center" style={{ top: `${Math.max(0, Math.min(100, (new Date().getHours() - 8) * 10 + (new Date().getMinutes() / 60) * 10))}%` }}>
          <div className="w-2 h-2 rounded-full bg-red-500 -mt-[1px] -ml-1"></div>
        </div>

        {/* Event blocks from real data */}
        {appointments && appointments.map((apt, index) => {
          const d = new Date(apt.startTime);
          const h = d.getHours();
          const m = d.getMinutes();
          if (h < 8 || h > 17) return null; // Outside calendar bounds
          
          const topPercent = ((h - 8) * 10) + ((m / 60) * 10);
          const leftPercent = 16 + (index * 15) % 70; // Stagger horizontally a bit
          const colors = ['bg-emerald-50 border-emerald-100', 'bg-orange-50 border-orange-100', 'bg-blue-50 border-blue-100', 'bg-indigo-50 border-indigo-100', 'bg-pink-50 border-pink-100'];
          const color = colors[index % colors.length];

          return (
            <div key={apt.id} className={`absolute ${color} border rounded p-2 text-xs w-[20%] z-20`} style={{ top: `${topPercent}%`, left: `${leftPercent}%`, height: '60px' }}>
              <p className="font-bold text-[#101830] truncate">{apt.patientFirstName} {apt.patientLastName}</p>
              <p className="text-gray-500 truncate">{apt.reasonForVisit || 'Consultation'}</p>
              <p className="text-gray-400 text-[10px]">{d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const NewAppointmentsWidget = ({ appointments, navigate }) => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[#101830] dark:text-white">New Appointments</h3>
      <button onClick={() => navigate && navigate('?panel=calendar')} className="text-xs font-bold text-[#5244F2]">View Calendar</button>
    </div>
    <table className="w-full text-left text-sm mb-4">
      <thead>
        <tr className="text-gray-500 font-medium">
          <th className="pb-3 font-medium">OP No.</th>
          <th className="pb-3 font-medium">Token</th>
          <th className="pb-3 font-medium">Patient Name</th>
          <th className="pb-3 font-medium">Time</th>
          <th className="pb-3 font-medium text-center">Status</th>
        </tr>
      </thead>
      <tbody className="text-sm font-medium text-[#101830] dark:text-gray-200">
        {appointments && appointments.length > 0 ? appointments.slice(0, 5).map((apt, i) => {
          return (
          <tr key={i} className="border-t border-gray-50 dark:border-[#1A263E]/50">
            <td className="py-2.5 bg-gray-50 text-center rounded-l">{apt.id}</td>
            <td className="py-2.5 pl-2">A-00{i+1}</td>
            <td className="py-2.5 font-bold">{apt.patientFirstName} {apt.patientLastName}</td>
            <td className="py-2.5 text-gray-500 text-xs">{new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td className="py-2.5 text-center">
              <span className={`text-xs font-bold ${apt.status === 'SCHEDULED' ? 'text-emerald-500' : 'text-blue-500'}`}>{apt.status}</span>
            </td>
          </tr>
        )}) : (
          <tr><td colSpan="5" className="text-center py-4 text-xs text-gray-500">No new appointments</td></tr>
        )}
      </tbody>
    </table>
    <button onClick={() => navigate && navigate('?panel=calendar')} className="w-full py-2 flex items-center justify-center gap-1 text-sm font-bold text-[#5244F2]">
      View All Appointments <ChevronRight size={16} />
    </button>
  </div>
);

export const RecentLabReportsWidget = () => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[#101830] dark:text-white">Recent Lab Reports</h3>
      <button className="text-xs font-bold text-[#5244F2]">View All</button>
    </div>
    <div className="space-y-3 mb-4">
      <div className="text-center py-8">
        <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <p className="text-xs text-gray-500 font-medium">No lab reports available for review.</p>
      </div>
    </div>
    <button className="w-full py-2 flex items-center justify-center gap-1 text-sm font-bold text-[#5244F2]">
      View All Lab Reports <ChevronRight size={16} />
    </button>
  </div>
);

export const RecentActivitiesWidget = ({ dashboardStats }) => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm h-full">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[#101830] dark:text-white">Recent Activities</h3>
      <button className="text-xs font-bold text-[#5244F2]">View All</button>
    </div>
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      {dashboardStats?.recentActivity && dashboardStats.recentActivity.length > 0 ? dashboardStats.recentActivity.map((act, i) => (
        <div key={i} className="flex gap-3 min-w-[150px]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100 text-blue-500`}>
            <Activity size={14} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#101830] dark:text-white leading-tight">{act.type}<br/>{act.description}</p>
            <p className="text-[9px] text-gray-400">{act.date} {act.time}</p>
          </div>
        </div>
      )) : (
         <p className="text-xs text-gray-500 py-4 w-full text-center">No recent activities</p>
      )}
    </div>
  </div>
);

export const AIAssistantWidget = () => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-bold text-[#101830] dark:text-white flex items-center gap-2">
        <span className="text-[#5244F2]">✦</span> AI Assistant
      </h3>
    </div>
    <div className="flex items-center justify-center h-full py-4 text-center">
      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 w-full border border-gray-100 border-dashed">
        AI Assistant suggestions are currently unavailable. Backend integration required.
      </p>
    </div>
  </div>
);

export const QuickSearchWidget = () => (
  <div className="bg-white dark:bg-[#101830] rounded-2xl p-5 border border-gray-100 dark:border-[#1A263E] shadow-sm h-full">
    <h3 className="font-bold text-[#101830] dark:text-white mb-3">Quick Patient Search</h3>
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search by name, MRN, phone..."
        className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-[#1A263E] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5244F2]"
      />
    </div>
    <div className="flex items-center justify-center py-3">
       <p className="text-xs text-gray-400">Type to search patients...</p>
    </div>
  </div>
);
