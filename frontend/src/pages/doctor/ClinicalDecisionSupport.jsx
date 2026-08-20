import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

export default function ClinicalDecisionSupport() {
  const queryClient = useQueryClient();

  const { data: rulesRes, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['cds-rules'],
    queryFn: () => axiosPrivate.get('/cds/rules').then(res => res.data.data || [])
  });

  const { data: alertsRes, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['cds-alerts', 'pending'],
    queryFn: () => axiosPrivate.get('/cds/alerts/pending').then(res => res.data.data || [])
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, overrideReason }) => axiosPrivate.post(`/cds/alerts/${id}/acknowledge`, { overrideReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cds-alerts', 'pending']);
    }
  });

  const acknowledgeAlert = (alertId, overrideReason) => {
    acknowledgeMutation.mutate({ id: alertId, overrideReason });
  };

  const loading = rulesLoading || alertsLoading;
  const rules = rulesRes || [];
  const alerts = alertsRes || [];

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'PENDING').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status === 'PENDING').length;
  const activeRulesCount = rules.filter(r => r.isActive).length;

  const ruleColumns = [
    { header: 'Rule Name', accessorKey: 'name' },
    { header: 'Trigger Event', accessorKey: 'triggerEvent' },
    { header: 'Severity', accessorKey: 'severity', cell: info => (
      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
        info.getValue() === 'CRITICAL' ? 'bg-red-100 text-red-800' :
        info.getValue() === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
      }`}>
        {info.getValue()}
      </span>
    )},
    { header: 'Action Type', accessorKey: 'actionType' },
    { header: 'Version', accessorKey: 'version' }
  ];

  if (rulesError || alertsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-md shadow">
          Failed to load CDS data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Decision Support (CDS)</h1>
          <p className="text-sm text-gray-500">Real-time alerts, safety contraindications, and active clinical rule engines.</p>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-blue-600 font-medium">Loading clinical data...</div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Critical Pending Safety Alerts</p>
          <p className="text-3xl font-extrabold text-red-600 mt-2">{criticalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Advisory Warning Alerts</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">{warningCount}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Active CDS Rules Engine Version</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{activeRulesCount}</p>
        </div>
      </div>

      {/* Active Pending Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Clinical Alerts for Review</h2>
        {alerts.length === 0 && !loading ? (
          <p className="text-sm text-gray-500 italic">No active pending CDS safety alerts requiring acknowledgment.</p>
        ) : (
          alerts.map(alert => (
            <CdsAlertBanner key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
          ))
        )}
      </div>

      {/* Active Rule Catalog */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Active Decision Engine Rules</h2>
        <DataTable columns={ruleColumns} data={rules} loading={rulesLoading} hover striped />
      </div>
    </div>
  );
}
