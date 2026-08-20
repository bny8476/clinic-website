import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';



const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

const DoctorScheduleSettings = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('weekly');
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 20,
      isActive: idx !== 0 && idx !== 6 // default off on weekends
    }))
  );

  // Overrides form state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    overrideDate: '',
    isUnavailable: true,
    startTime: '',
    endTime: '',
    reason: ''
  });

  // Fetch Working Hours
  const { data: dbWorkingHours, isLoading } = useQuery({
    queryKey: ['doctorWorkingHours', user?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/doctors/${user?.id}/working-hours`);
      return res.data;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (dbWorkingHours && dbWorkingHours.length > 0) {
      const updated = [...workingHours];
      dbWorkingHours.forEach(wh => {
        updated[wh.dayOfWeek] = {
          ...updated[wh.dayOfWeek],
          startTime: wh.startTime.substring(0, 5),
          endTime: wh.endTime.substring(0, 5),
          slotDurationMinutes: wh.slotDurationMinutes,
          isActive: wh.isActive
        };
      });
      setWorkingHours(updated);
    }
  }, [dbWorkingHours]);

  // Mutations
  const saveHoursMutation = useMutation({
    mutationFn: async (data) => {
      await axiosPrivate.put(`/doctors/${user?.id}/working-hours`, data);
      const generateRes = await axiosPrivate.post(`/doctors/${user?.id}/generate-slots`);
      return generateRes.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['doctorWorkingHours']);
      toast.success(`Schedule saved! Generated ${data.slotsGenerated} slots for the next 14 days.`);
    }
  });

  const addOverrideMutation = useMutation({
    mutationFn: async (data) => {
      await axiosPrivate.post(`/doctors/${user?.id}/schedule-overrides`, data);
      const generateRes = await axiosPrivate.post(`/doctors/${user?.id}/generate-slots`);
      return generateRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorWorkingHours']);
      setShowOverrideForm(false);
      toast.success('Override saved successfully.');
    }
  });

  const handleWorkingHourChange = (idx, field, value) => {
    const updated = [...workingHours];
    updated[idx][field] = value;
    setWorkingHours(updated);
  };

  const handleSaveHours = () => {
    const dataToSave = workingHours.map(wh => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime + ":00",
      endTime: wh.endTime + ":00",
      slotDurationMinutes: parseInt(wh.slotDurationMinutes),
      isActive: wh.isActive
    }));
    saveHoursMutation.mutate(dataToSave);
  };

  const handleAddOverride = (e) => {
    e.preventDefault();
    const data = {
      ...overrideForm,
      startTime: overrideForm.isUnavailable ? null : overrideForm.startTime + ":00",
      endTime: overrideForm.isUnavailable ? null : overrideForm.endTime + ":00"
    };
    addOverrideMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Schedule Settings" 
        subtitle="Configure your weekly availability and overrides"
        icon={<Settings className="w-8 h-8 text-primary" />}
      />

      <div className="bg-surface rounded-xl border border-surface-border shadow-sm overflow-hidden flex text-sm">
        <button
          className={`flex-1 p-4 font-medium flex items-center justify-center gap-2 ${activeTab === 'weekly' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'}`}
          onClick={() => setActiveTab('weekly')}
        >
          <Clock className="w-4 h-4" /> Weekly Schedule
        </button>
        <button
          className={`flex-1 p-4 font-medium flex items-center justify-center gap-2 ${activeTab === 'overrides' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'}`}
          onClick={() => setActiveTab('overrides')}
        >
          <CalendarOff className="w-4 h-4" /> Date Overrides
        </button>
      </div>

      {activeTab === 'weekly' && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Standard Weekly Hours</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            {workingHours.map((wh, idx) => (
              <div key={idx} className={`p-4 rounded-lg border flex flex-col md:flex-row items-center gap-4 ${wh.isActive ? 'bg-surface border-surface-border' : 'bg-surface-hover border-transparent opacity-60'}`}>
                <div className="flex items-center gap-4 min-w-[150px]">
                  <input 
                    type="checkbox" 
                    checked={wh.isActive} 
                    onChange={(e) => handleWorkingHourChange(idx, 'isActive', e.target.checked)}
                    className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-text-primary">{DAYS[idx]}</span>
                </div>
                
                <div className="flex-1 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-sm">From</span>
                    <input 
                      type="time" 
                      value={wh.startTime} 
                      onChange={(e) => handleWorkingHourChange(idx, 'startTime', e.target.value)}
                      disabled={!wh.isActive}
                      className="form-input rounded-md border-input bg-surface px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-sm">To</span>
                    <input 
                      type="time" 
                      value={wh.endTime} 
                      onChange={(e) => handleWorkingHourChange(idx, 'endTime', e.target.value)}
                      disabled={!wh.isActive}
                      className="form-input rounded-md border-input bg-surface px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-sm">Duration (min)</span>
                    <select 
                      value={wh.slotDurationMinutes}
                      onChange={(e) => handleWorkingHourChange(idx, 'slotDurationMinutes', e.target.value)}
                      disabled={!wh.isActive}
                      className="form-input rounded-md border-input bg-surface px-3 py-1.5 text-sm"
                    >
                      {SLOT_DURATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveHours} isLoading={saveHoursMutation.isPending}>
                Save & Regenerate Slots
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'overrides' && (
        <Card>
          <Card.Header className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold">Date Overrides</h3>
            <Button variant="outline" onClick={() => setShowOverrideForm(!showOverrideForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Override
            </Button>
          </Card.Header>
          <Card.Body>
            {showOverrideForm && (
              <form onSubmit={handleAddOverride} className="mb-6 p-4 bg-surface-hover rounded-lg border border-surface-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={overrideForm.overrideDate}
                      onChange={e => setOverrideForm({...overrideForm, overrideDate: e.target.value})}
                      className="form-input w-full rounded-md border-input bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select 
                      value={overrideForm.isUnavailable}
                      onChange={e => setOverrideForm({...overrideForm, isUnavailable: e.target.value === 'true'})}
                      className="form-input w-full rounded-md border-input bg-surface"
                    >
                      <option value="true">Unavailable (Day Off)</option>
                      <option value="false">Custom Hours</option>
                    </select>
                  </div>
                </div>
                {!overrideForm.isUnavailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <input 
                        type="time" 
                        required
                        value={overrideForm.startTime}
                        onChange={e => setOverrideForm({...overrideForm, startTime: e.target.value})}
                        className="form-input w-full rounded-md border-input bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <input 
                        type="time" 
                        required
                        value={overrideForm.endTime}
                        onChange={e => setOverrideForm({...overrideForm, endTime: e.target.value})}
                        className="form-input w-full rounded-md border-input bg-surface"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                  <input 
                    type="text" 
                    value={overrideForm.reason}
                    onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})}
                    placeholder="e.g. Conference, Personal Leave"
                    className="form-input w-full rounded-md border-input bg-surface"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowOverrideForm(false)}>Cancel</Button>
                  <Button type="submit" isLoading={addOverrideMutation.isPending}>Save Override</Button>
                </div>
              </form>
            )}
            
            {/* Note: In a full app, we would list overrides from an API endpoint here */}
            <div className="text-center p-8 text-text-secondary bg-surface-hover rounded-lg border border-dashed border-surface-border">
              Add specific dates where your availability differs from your standard weekly hours.
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
    
  );
};

export default DoctorScheduleSettings;
