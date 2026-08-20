import { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import Skeleton from '../../../components/ui/Skeleton';
import pharmacyService from "../../../utils/pharmacy/pharmacyService";
import { fmtDate } from './reportCatalog';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { ToggleRight, ToggleLeft, Trash2, Bell } from 'lucide-react';



const CHANNEL_BADGE  = { EMAIL: '✉️ Email', WHATSAPP: '💬 WhatsApp', BOTH: '✉️+💬 Both' };
const STATUS_BADGE   = {
  SENT:    'bg-blue-100 text-blue-700',
  FAILED:  'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

/**
 * Manages all saved report schedules — list, toggle active/inactive, delete.
 */
export default function SchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getReportSchedules();
      if (res.data?.success) setSchedules(res.data.data);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const toggle = async (id) => {
    try {
      await pharmacyService.toggleReportSchedule(id);
      toast.success('Schedule toggled');
      loadSchedules();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const del = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await pharmacyService.api.delete(`/report-schedules/${confirmDelete.id}`);
      toast.success('Deleted');
      loadSchedules();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton.Table rows={5} />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
        <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-400">No scheduled reports yet</p>
        <p className="text-xs text-slate-300 mt-1">
          Click the <Bell className="inline w-3 h-3" /> icon on any report card to create a schedule
        </p>
      </div>
    );
  }

  return (
    
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Schedule Name','Report','Frequency','Time','Channel','Format','Last Sent','Status','Active',''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map(sc => (
              <tr key={sc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-700">{sc.scheduleName}</td>
                <td className="px-4 py-3 text-slate-500">{sc.reportType?.replace(/-/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {sc.frequency}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">{sc.deliveryTime}</td>
                <td className="px-4 py-3 text-slate-600">{CHANNEL_BADGE[sc.channels] || sc.channels}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {sc.fileFormats}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{sc.lastSentAt ? fmtDate(sc.lastSentAt) : '—'}</td>
                <td className="px-4 py-3">
                  {sc.lastSentStatus ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[sc.lastSentStatus] || 'bg-slate-100 text-slate-600'}`}>
                      {sc.lastSentStatus}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(sc.id)} aria-label="Toggle schedule" className="transition-colors">
                    {sc.active
                      ? <ToggleRight className="w-5 h-5 text-blue-500" />
                      : <ToggleLeft  className="w-5 h-5 text-slate-300" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => del(sc.id)} aria-label="Delete schedule"
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Delete Schedule"
        description="Are you sure you want to delete this report schedule?"
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
    
  );
}
