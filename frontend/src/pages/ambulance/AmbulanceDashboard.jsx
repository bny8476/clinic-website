import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';



const AmbulanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('dispatcher');

  return (
    
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 m-0">Ambulance Command Center</h2>
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center shadow">
          <AlertCircle size={16} className="mr-2" />
          Live Emergency Network Active
        </div>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dispatcher')}
          className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'dispatcher' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Navigation size={18} className="mr-2" /> Dispatcher Console
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'fleet' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Truck size={18} className="mr-2" /> Fleet Management
        </button>
        <button
          onClick={() => setActiveTab('crew')}
          className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'crew' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Activity size={18} className="mr-2" /> Crew Terminal
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ClipboardList size={18} className="mr-2" /> Trip History & Billing
        </button>
      </div>

      <div>
        {activeTab === 'dispatcher' && <DispatcherConsole />}
        {activeTab === 'fleet' && <FleetManagement />}
        {activeTab === 'crew' && <CrewView />}
        {activeTab === 'history' && <TripHistory />}
      </div>
    </div>
    
  );
};

export default AmbulanceDashboard;
