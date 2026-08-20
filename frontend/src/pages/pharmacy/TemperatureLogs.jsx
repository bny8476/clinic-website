import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import pharmacyService from '../../utils/pharmacy/pharmacyService';



export default function TemperatureLogs() {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // New storage unit modal state
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', minTemperature: '', maxTemperature: '', location: '' });

  // Log temperature state
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tempReading, setTempReading] = useState('');
  const [loggedBy, setLoggedBy] = useState('');

  // Corrective action state
  const [correctiveActionLogId, setCorrectiveActionLogId] = useState(null);
  const [correctiveActionText, setCorrectiveActionText] = useState('');

  // Queries
  const { data: units = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['storageUnits'],
    queryFn: async () => {
      const res = await pharmacyService.getStorageUnits();
      return res.data || [];
    }
  });

  const { data: breaches = [], isLoading: loadingBreaches } = useQuery({
    queryKey: ['temperatureBreaches'],
    queryFn: async () => {
      const res = await pharmacyService.getTemperatureBreaches();
      return res.data || [];
    }
  });

  const loading = loadingUnits || loadingBreaches;

  const createUnitMutation = useMutation({
    mutationFn: (payload) => pharmacyService.createStorageUnit(payload),
    onSuccess: () => {
      toast.success('Storage unit created successfully');
      queryClient.invalidateQueries(['storageUnits']);
    },
    onError: () => toast.error('Failed to create storage unit')
  });

  const recordTempMutation = useMutation({
    mutationFn: (payload) => pharmacyService.recordTemperature(payload),
    onSuccess: (res) => {
      toast.success('Temperature recorded successfully');
      if (res && res.isBreach) {
        toast.error('WARNING: Thermal breach detected!', { duration: 5000 });
        queryClient.invalidateQueries(['temperatureBreaches']);
      }
    },
    onError: () => toast.error('Failed to record temperature')
  });

  const resolveBreachMutation = useMutation({
    mutationFn: ({ logId, action }) => pharmacyService.resolveBreachAction(logId, action),
    onSuccess: () => {
      toast.success('Corrective action logged');
      queryClient.invalidateQueries(['temperatureBreaches']);
    },
    onError: () => toast.error('Failed to log corrective action')
  });

  const fetchAll = () => {
    queryClient.invalidateQueries(['storageUnits']);
    queryClient.invalidateQueries(['temperatureBreaches']);
  };

  const handleCreateUnit = (e) => {
    e.preventDefault();
    if (!newUnit.name || !newUnit.minTemperature || !newUnit.maxTemperature) {
      toast.error('Please fill required fields');
      return;
    }
    
    createUnitMutation.mutate(
      {
        unitName: newUnit.name,
        unitType: 'refrigerator',
        location: newUnit.location,
        minThreshold: parseFloat(newUnit.minTemperature),
        maxThreshold: parseFloat(newUnit.maxTemperature)
      },
      {
        onSuccess: () => {
          setShowUnitForm(false);
          setNewUnit({ name: '', minTemperature: '', maxTemperature: '', location: '' });
        }
      }
    );
  };

  const handleRecordTemperature = (e) => {
    e.preventDefault();
    if (!selectedUnitId || !tempReading || !loggedBy) {
      toast.error('Please enter all required reading values');
      return;
    }
    
    const selectedUnit = units.find(u => u.unitId === selectedUnitId);
    recordTempMutation.mutate(
      {
        storageUnit: { unitId: selectedUnitId },
        unitName: selectedUnit.unitName,
        unitType: selectedUnit.unitType,
        recordedTemperature: parseFloat(tempReading),
        minThreshold: selectedUnit.minThreshold,
        maxThreshold: selectedUnit.maxThreshold,
        recordedBy: 1
      },
      {
        onSuccess: () => {
          setTempReading('');
          setSelectedUnitId('');
        }
      }
    );
  };

  const handleCorrectiveAction = (e) => {
    e.preventDefault();
    if (!correctiveActionText) {
      toast.error('Please enter the actions taken');
      return;
    }
    
    resolveBreachMutation.mutate(
      { logId: correctiveActionLogId, action: correctiveActionText },
      {
        onSuccess: () => {
          setCorrectiveActionLogId(null);
          setCorrectiveActionText('');
        }
      }
    );
  };

  return (
    
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <Snowflake className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Cold Chain & Temperature Logs</h2>
            <p className="text-sm text-slate-500 font-medium">Track and monitor storage unit conditions, safe thermal bounds, and corrective action histories.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowUnitForm(true)} className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Storage Unit
          </button>
          <button onClick={fetchAll} disabled={loading} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid: Storage Units & Entry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storage Units */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Cold Chain Storage Units</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map(unit => (
                <div key={unit.unitId} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 text-sm">{unit.unitName}</div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{unit.location}</div>
                    <div className="text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full inline-block mt-1">
                      Safe: {unit.minThreshold}°C to {unit.maxThreshold}°C
                    </div>
                  </div>
                  <Thermometer className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-xl" />
                </div>
              ))}
              {units.length === 0 && (
                <div className="md:col-span-2 flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-6">
                    <Refrigerator className="w-16 h-16 text-blue-200" strokeWidth={1.5} />
                    <div className="absolute -bottom-2 -right-2 p-1 bg-white rounded-full">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Snowflake className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
                      </div>
                    </div>
                    {/* Plus decorative stars */}
                    <div className="absolute -top-2 -left-2 text-blue-100 text-xl font-bold">+</div>
                    <div className="absolute top-2 -right-4 text-blue-100 text-lg font-bold">+</div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">No storage units defined.</h4>
                  <p className="text-sm text-slate-500 mb-6">Add a storage unit to start monitoring temperatures.</p>
                  <button onClick={() => setShowUnitForm(true)} className="px-5 py-2.5 border border-[#2563eb]/30 text-[#2563eb] hover:bg-[#2563eb]/5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Storage Unit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Record Reading Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Log Temperature Check</h3>
            <form onSubmit={handleRecordTemperature} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Storage Unit <span className="text-red-500">*</span></label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors"
                  required
                >
                  <option value="">Select storage unit</option>
                  {units.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Reading (°C) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  value={tempReading}
                  onChange={e => setTempReading(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors"
                  placeholder="e.g. 4.2"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Logged By (Staff Name) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={loggedBy}
                  onChange={e => setLoggedBy(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors"
                  placeholder="e.g. Staff Pharmacist"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
                >
                  <CheckCircle className="w-5 h-5" /> Submit Log Check
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Active Breaches / Corrective Actions */}
        <div className="space-y-6">
          {/* Active Breaches list */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={2.5} /> Thermal Breaches
              </h3>
            </div>
            <div className="divide-y divide-slate-50 flex-1 flex flex-col max-h-[600px] overflow-auto">
              {breaches.map((b, index) => (
                <div key={b.logId || index} className="p-5 text-sm space-y-2 bg-red-50/30 hover:bg-red-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{b.storageUnitName || `Unit #${b.storageUnitId}`}</span>
                    <span className="font-mono text-slate-400 text-xs">{b.loggedAt}</span>
                  </div>
                  <div className="text-slate-600">
                    Reading was <span className="font-bold text-red-600">{b.recordedTemperature}°C</span> (Safe: {b.minThreshold} - {b.maxThreshold}°C)
                  </div>
                  {b.correctiveAction ? (
                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs space-y-1">
                      <div className="font-bold">Corrective Action Taken:</div>
                      <div>"{b.correctiveAction}"</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCorrectiveActionLogId(b.id)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 font-bold rounded-lg text-xs transition-colors mt-1 inline-block"
                    >
                      Resolve Breach
                    </button>
                  )}
                </div>
              ))}
              {breaches.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                      <Thermometer className="w-8 h-8 text-red-500" strokeWidth={2.5} />
                    </div>
                    {/* Plus decorative stars */}
                    <div className="absolute -top-1 -left-2 text-red-100 text-xl font-bold">+</div>
                    <div className="absolute top-4 -right-4 text-red-100 text-lg font-bold">+</div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">No active temperature breaches.</h4>
                  <p className="text-sm text-slate-500 mb-6">You'll see alerts here when a breach occurs.</p>
                  <button className="px-5 py-2.5 border border-[#2563eb]/30 text-[#2563eb] hover:bg-[#2563eb]/5 text-sm font-semibold rounded-xl transition-colors">
                    View Breach History
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Corrective Action Form */}
          {correctiveActionLogId && (
            <div className="bg-white rounded-xl border border-red-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-red-800">Log Corrective Action</h3>
                <button onClick={() => setCorrectiveActionLogId(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <form onSubmit={handleCorrectiveAction} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Actions Taken *</label>
                  <textarea
                    rows="4"
                    value={correctiveActionText}
                    onChange={e => setCorrectiveActionText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white resize-none"
                    placeholder="Moved vaccines to Backup Refrigerator B; Adjusted thermostat..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Log Resolution
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Unit Form Modal */}
      <AppModal
        isOpen={showUnitForm}
        onClose={() => setShowUnitForm(false)}
        title={
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-blue-500" />
            <span className="text-base font-bold text-slate-800">Add Safe Storage Unit</span>
          </div>
        }
        maxWidth="sm:max-w-md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <button
              type="button"
              onClick={() => setShowUnitForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateUnit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              Save Storage Unit
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateUnit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Storage Unit Name *</label>
            <input
              type="text"
              placeholder="e.g. Vaccine Refrigerator A"
              value={newUnit.name}
              onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Physical Location</label>
            <input
              type="text"
              placeholder="e.g. Pharmacy Main Room Cabinet 3"
              value={newUnit.location}
              onChange={e => setNewUnit({ ...newUnit, location: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Min Temp Limit (°C) *</label>
              <input
                type="number"
                step="0.5"
                value={newUnit.minTemperature}
                onChange={e => setNewUnit({ ...newUnit, minTemperature: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Temp Limit (°C) *</label>
              <input
                type="number"
                step="0.5"
                value={newUnit.maxTemperature}
                onChange={e => setNewUnit({ ...newUnit, maxTemperature: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                required
              />
            </div>
          </div>
        </form>
      </AppModal>
    </div>
    
  );
}
