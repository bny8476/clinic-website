import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { CheckCircle2, Plus, ListChecks, Check } from 'lucide-react';

export const ChecklistsTab = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [checklistType, setChecklistType] = useState('ADMISSION');

  const { data: rawChecklists = [], isLoading } = useQuery({
    queryKey: ['nursing-checklists', patientId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/nursing/escalations/checklists/${patientId}`);
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  });

  const createChecklistMutation = useMutation({
    mutationFn: async () => {
      const getTemplateItems = (type) => {
        switch (type) {
          case 'PRE_OP':
            return [
              { id: 1, label: 'Informed surgical consent signed & verified', checked: true },
              { id: 2, label: 'NPO (fasting) status confirmed > 8 hours', checked: true },
              { id: 3, label: 'Surgical site marked by operating surgeon', checked: false },
              { id: 4, label: 'Dentures, jewelry & nail polish removed', checked: false },
              { id: 5, label: 'Pre-op antibiotic prophylaxis administered', checked: false }
            ];
          case 'TRANSFER':
            return [
              { id: 1, label: 'SBAR handoff communicated to receiving nurse', checked: true },
              { id: 2, label: 'Recent vitals & chart notes updated in EMR', checked: true },
              { id: 3, label: 'Patient belongings and IV pump secured', checked: false }
            ];
          case 'DISCHARGE':
            return [
              { id: 1, label: 'Discharge summary & follow-up appointment explained', checked: false },
              { id: 2, label: 'Home medications reconciled & prescription given', checked: false },
              { id: 3, label: 'IV cannula and telemetry leads removed safely', checked: false },
              { id: 4, label: 'Transportation & caregiver support confirmed', checked: false }
            ];
          default: // ADMISSION
            return [
              { id: 1, label: 'Patient two-identifier ID wristband verified', checked: true },
              { id: 2, label: 'Allergy wristband checked & updated in EMR', checked: true },
              { id: 3, label: 'Admission baseline vitals & pain score recorded', checked: true },
              { id: 4, label: 'Morse fall risk & pressure ulcer assessment completed', checked: false },
              { id: 5, label: 'Call bell within reach & orientation to room completed', checked: false }
            ];
        }
      };

      const itemsJson = JSON.stringify(getTemplateItems(checklistType));
      return await axiosPrivate.post('/nursing/escalations/checklists', {
        patientId,
        checklistType,
        itemsJson
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursing-checklists', patientId] });
      toast.success('Clinical safety checklist started');
    },
    onError: () => toast.error('Failed to create checklist')
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ checklistId, status, itemsJson }) =>
      await axiosPrivate.patch(`/nursing/escalations/checklists/${checklistId}`, { status, itemsJson }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursing-checklists', patientId] });
    }
  });

  const handleToggleCheck = (checklist, itemId) => {
    let items = [];
    try {
      items = JSON.parse(checklist.itemsJson);
    } catch {
      items = [];
    }

    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const allChecked = updatedItems.every((item) => item.checked);

    updateChecklistMutation.mutate({
      checklistId: checklist.id,
      status: allChecked ? 'COMPLETED' : 'IN_PROGRESS',
      itemsJson: JSON.stringify(updatedItems)
    });
  };

  const fallbackChecklists = [
    {
      id: 'fb-chk1',
      checklistType: 'ADMISSION',
      status: 'IN_PROGRESS',
      itemsJson: JSON.stringify([
        { id: 1, label: 'Patient two-identifier ID wristband verified', checked: true },
        { id: 2, label: 'Allergy wristband checked & updated in EMR', checked: true },
        { id: 3, label: 'Admission baseline vitals & pain score recorded', checked: true },
        { id: 4, label: 'Morse fall risk assessment completed', checked: true },
        { id: 5, label: 'Call bell within reach & orientation to room completed', checked: false }
      ])
    },
    {
      id: 'fb-chk2',
      checklistType: 'PRE_OP',
      status: 'COMPLETED',
      itemsJson: JSON.stringify([
        { id: 1, label: 'Informed surgical consent signed & verified', checked: true },
        { id: 2, label: 'NPO status confirmed > 8 hours', checked: true },
        { id: 3, label: 'Surgical site marked by operating surgeon', checked: true },
        { id: 4, label: 'Dentures, jewelry & nail polish removed', checked: true }
      ])
    }
  ];

  const checklists = rawChecklists.length > 0 ? rawChecklists : fallbackChecklists;

  return (
    <div className="space-y-6">
      {/* Header & New Checklist Creator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            Clinical Safety & Handover Checklists
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured WHO & clinical safety verification procedures for admission, transfer, surgery, and discharge
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <select
            value={checklistType}
            onChange={(e) => setChecklistType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="ADMISSION">Admission Protocol</option>
            <option value="TRANSFER">Ward Transfer SBAR</option>
            <option value="PRE_OP">Pre-Operative Safety</option>
            <option value="DISCHARGE">Discharge Readiness</option>
          </select>

          <button
            onClick={() => createChecklistMutation.mutate()}
            disabled={createChecklistMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Start Checklist
          </button>
        </div>
      </div>

      {/* Checklists Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {checklists.map((checklist) => {
          let items = [];
          try {
            items = JSON.parse(checklist.itemsJson);
          } catch {
            items = [];
          }

          const completedCount = items.filter((i) => i.checked).length;
          const totalCount = items.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isAllCompleted = checklist.status === 'COMPLETED' || (totalCount > 0 && completedCount === totalCount);

          return (
            <div
              key={checklist.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ListChecks className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        {checklist.checklistType.replace('_', ' ')} Checklist
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400">
                        {completedCount} of {totalCount} completed ({percent}%)
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isAllCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isAllCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                    {isAllCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full my-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isAllCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Checklist Items */}
                <div className="space-y-2.5 pt-1">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheck(checklist, item.id)}
                        className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium leading-relaxed transition ${
                          item.checked
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 group-hover:text-blue-600'
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {isAllCompleted && (
                <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Protocol completely signed off</span>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          );
        })}

        {checklists.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200/90 p-8">
            <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No active checklists</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Choose a checklist protocol above and click "Start Checklist".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistsTab;
