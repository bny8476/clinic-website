import { useState } from 'react';
import useDebounce from '../../hooks/pharmacy/useDebounce';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';



export default function DrugInteractions() {
  const queryClient = useQueryClient();
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [interactions, setInteractions] = useState([]);

  // Fetch medicines
  const { data: rawMedicines = [] } = useQuery({
    queryKey: ['medicines-list'],
    queryFn: async () => {
      const res = await pharmacyService.getMedicines();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const medicines = rawMedicines;

  // Fetch incident logs
  const { data: rawIncidentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['interaction-logs'],
    queryFn: async () => {
      const res = await pharmacyService.getDrugInteractionIncidentReport();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const incidentLogs = rawIncidentLogs;

  const handleAddMedicine = (med) => {
    if (selectedMedicines.some(m => m.id === med.id)) {
      toast.error('Medicine already added');
      return;
    }
    setSelectedMedicines([...selectedMedicines, med]);
    setSearchTerm('');
  };

  const handleRemoveMedicine = (id) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== id));
  };

  const checkMutation = useMutation({
    mutationFn: (ids) => pharmacyService.checkDrugInteractions(ids),
    onSuccess: (res) => {
      const data = res.data || res;
      const results = Array.isArray(data) ? data : [];
      setInteractions(results);
      if (results.length > 0) {
        toast.error(`Detected ${results.length} drug-drug interaction(s)!`);
      } else {
        toast.success('No drug interactions detected for this combination.');
      }
      queryClient.invalidateQueries(['interaction-logs']);
    },
    onError: () => {
      toast.error('Failed to perform drug interaction check');
    }
  });

  const handleCheck = () => {
    if (selectedMedicines.length < 2) {
      toast.error('Select at least two medicines to perform check');
      return;
    }
    setInteractions([]);
    const ids = selectedMedicines.map(m => m.id);
    checkMutation.mutate(ids);
  };

  const filteredMedicines = searchTerm.trim() === '' ? [] : medicines.filter(m => 
    m.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    m.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const getSeverityColor = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CONTRAINDICATED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SERIOUS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MONITOR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
          <Pill className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Drug Interaction Checker</h2>
          <p className="text-sm text-slate-500 font-medium">Perform multi-drug analysis to detect contraindicated or dangerous clinical combinations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Picker & Checker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Select Drugs for Analysis</h3>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search medicine by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] bg-white transition-colors"
              />
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />

              {filteredMedicines.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {filteredMedicines.map(med => (
                    <button
                      key={med.id}
                      onClick={() => handleAddMedicine(med)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span className="font-semibold text-slate-700">{med.name}</span>
                      <span className="text-slate-400 font-mono text-xs">{med.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Drugs list */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Analysis List</div>
              <div className="flex flex-wrap gap-2">
                {selectedMedicines.map(med => (
                  <div key={med.id} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-full">
                    <span>{med.name}</span>
                    <button onClick={() => handleRemoveMedicine(med.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {selectedMedicines.length === 0 && (
                  <span className="text-sm text-slate-500">No drugs selected yet. Search and add.</span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={checkMutation.isPending || selectedMedicines.length < 2}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#2563eb] disabled:opacity-50 text-white text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Activity className="w-4 h-4" />
              {checkMutation.isPending ? 'Running Screen...' : 'Analyze Inter-Drug Action'}
            </button>
          </div>

          {/* Checker Results */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Analysis Output</h3>
            
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((inter, idx) => (
                  <div key={idx} className="p-5 border border-[#bfdbfe] bg-blue-50/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{inter.drugAName}</span>
                        <span className="text-blue-400 font-bold">&</span>
                        <span className="font-bold text-slate-800">{inter.drugBName}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityColor(inter.severity)}`}>
                        {inter.severity}
                      </span>
                    </div>
                    {inter.description && <p className="text-sm text-slate-600 leading-relaxed">{inter.description}</p>}
                    {inter.mechanism && <div className="text-xs text-slate-500"><span className="font-bold text-slate-700">Mechanism:</span> {inter.mechanism}</div>}
                    {inter.management && <div className="text-xs text-red-600 font-medium"><span className="font-bold">Clinical Action:</span> {inter.management}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-[#bfdbfe] rounded-2xl bg-white">
                <ShieldCheck className="w-14 h-14 text-[#10b981] mx-auto mb-4" strokeWidth={2.5} />
                <h4 className="text-lg font-bold text-slate-800 mb-1">Screen cleared</h4>
                <p className="text-sm text-slate-500">No clinical interaction detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Checker Incident Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Interaction Log</h3>
            <button onClick={() => queryClient.invalidateQueries(['interaction-logs'])} disabled={loadingLogs} 
              className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y divide-slate-50 overflow-auto max-h-[800px] flex-1 flex flex-col">
            {incidentLogs.map(log => (
              <div key={log.id} className="p-5 text-sm space-y-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Audit Log #{log.id}</span>
                  <span className="font-mono text-slate-400 text-xs">{log.checkedAt}</span>
                </div>
                <div className="text-slate-600">Checked {log.itemsCheckedCount} drugs.</div>
                <div className="text-slate-500">
                  Detected Interactions:{' '}
                  <span className={`font-bold ${log.interactionsDetectedCount > 0 ? 'text-red-600' : 'text-[#10b981]'}`}>
                    {log.interactionsDetectedCount}
                  </span>
                </div>
              </div>
            ))}
            {incidentLogs.length === 0 && (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <ClipboardList className="w-16 h-16 text-[#bfdbfe]/40" strokeWidth={1.5} />
                  <div className="absolute -bottom-2 -right-2 p-1 bg-white rounded-full">
                    <div className="w-8 h-8 bg-[#bfdbfe]/40 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* Plus decorative stars */}
                  <div className="absolute -top-2 -left-2 text-[#bfdbfe]/40 text-xl font-bold">+</div>
                  <div className="absolute top-2 -right-4 text-[#bfdbfe]/40 text-lg font-bold">+</div>
                  <div className="absolute bottom-4 -left-4 text-[#bfdbfe]/40 text-sm font-bold">+</div>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">No scan history logs yet.</h4>
                <p className="text-sm text-slate-500 max-w-[200px]">Your recent interaction checks will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
}
