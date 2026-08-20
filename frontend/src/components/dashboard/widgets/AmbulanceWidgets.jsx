import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { AlertTriangle, CheckCircle, Truck, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export const AmbulanceHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <AmbulanceIcon className="w-7 h-7 text-[var(--color-danger)]" />
      Ambulance & Emergency Control
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Real-time emergency dispatch queue and GPS fleet monitoring.
    </p>
  </div>
);

export const AmbulanceKPIWidget = ({ activeCount, availableCount, fleetCount, requestsCount, loadingRequests, loadingFleet }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <KPICard icon={AlertTriangle} label="Active Emergencies" value={loadingRequests ? '...' : activeCount} colorToken="danger" />
    <KPICard icon={CheckCircle} label="Available Units" value={loadingFleet ? '...' : availableCount} colorToken="success" />
    <KPICard icon={Truck} label="Total Fleet Units" value={loadingFleet ? '...' : fleetCount} colorToken="navy" />
    <KPICard icon={Radio} label="Total Requests Logged" value={loadingRequests ? '...' : requestsCount} colorToken="info" />
  </div>
);

const getStatusBadge = (status) => {
  switch (status) {
    case 'COMPLETED':
    case 'AVAILABLE': return <Badge variant="success">{status}</Badge>;
    case 'DISPATCHED':
    case 'EN_ROUTE':
    case 'DISPATCHED_FLEET': return <Badge variant="info">{status}</Badge>;
    case 'REQUESTED':
    case 'MAINTENANCE': return <Badge variant="warning">{status}</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
};

export const AmbulanceTablesWidget = ({ activeTab, requests, fleet, loadingRequests, loadingFleet }) => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');

  const availableAmbulances = fleet.filter(a => a.status === 'AVAILABLE');

  const dispatch = useMutation({
    mutationFn: async ({ requestId, ambulanceId }) => axiosPrivate.patch(`/ambulance/requests/${requestId}/dispatch?ambulanceId=${ambulanceId}`),
    onSuccess: () => {
      toast.success('Ambulance unit dispatched!');
      queryClient.invalidateQueries(['ambulance-requests']);
      queryClient.invalidateQueries(['ambulance-fleet']);
      setSelectedRequest(null);
    },
    onError: () => toast.error('Failed to dispatch unit')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => axiosPrivate.patch(`/ambulance/requests/${id}/status?status=${status}`),
    onSuccess: () => {
      toast.success('Emergency request updated');
      queryClient.invalidateQueries(['ambulance-requests']);
      queryClient.invalidateQueries(['ambulance-fleet']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const columns = [
    { key: 'requestNumber', title: 'Request #', render: (val) => <span className="font-bold text-[var(--color-danger)]">{val}</span> },
    { key: 'emergencyType', title: 'Type' },
    {
      key: 'priority', title: 'Priority',
      render: (val) => <Badge variant={val === 'CRITICAL' ? 'danger' : val === 'URGENT' ? 'warning' : 'success'}>{val || 'ROUTINE'}</Badge>
    },
    {
      key: 'pickupAddress', title: 'Pickup Address',
      render: (val) => (
        <span className="flex items-center gap-1 text-xs truncate max-w-xs" title={val}>
          <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />{val}
        </span>
      )
    },
    {
      key: 'assignedAmbulance', title: 'Assigned Unit',
      render: (val) => val?.vehicleNumber ? <span className="font-semibold text-[var(--color-navy-800)] dark:text-[var(--color-navy-600)]">{val.vehicleNumber}</span> : <span className="text-[var(--color-text-muted)]">Unassigned</span>
    },
    { key: 'status', title: 'Status', render: (val) => getStatusBadge(val) },
    {
      key: 'actions', title: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {row.status === 'REQUESTED' && <Button variant="danger" size="sm" onClick={() => { setSelectedRequest(row); setSelectedAmbulanceId(''); }}>Dispatch</Button>}
          {row.status === 'DISPATCHED' && <Button variant="primary" size="sm" onClick={() => updateStatus.mutate({ id: row.id, status: 'EN_ROUTE' })}>En Route</Button>}
          {row.status === 'EN_ROUTE' && <Button variant="secondary" size="sm" onClick={() => updateStatus.mutate({ id: row.id, status: 'COMPLETED' })}>Complete</Button>}
          {!['COMPLETED', 'CANCELLED'].includes(row.status) && <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: row.id, status: 'CANCELLED' })}>Cancel</Button>}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'requests' ? (
          <DataTable columns={columns} data={requests} isLoading={loadingRequests} searchPlaceholder="Search emergency requests or pickup location..." emptyTitle="No active emergency requests" />
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fleet.map((unit) => (
              <Card key={unit.id} hoverable className="border-l-4 border-l-[var(--color-navy-800)]">
                <Card.Header className="p-4 pb-2 border-b-0">
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--color-navy-900)] m-0">{unit.vehicleNumber}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] m-0">{unit.model || 'Ambulance Unit'}</p>
                  </div>
                  {getStatusBadge(unit.status)}
                </Card.Header>
                <Card.Body className="p-4 pt-0 space-y-1 text-xs text-[var(--color-text-muted)]">
                  <p className="m-0"><strong>Driver:</strong> {unit.driverName}</p>
                  <p className="m-0"><strong>Phone:</strong> {unit.driverPhone}</p>
                  {unit.currentLatitude && unit.currentLongitude ? (
                    <p className="m-0 flex items-center gap-1 text-[var(--color-info)] font-semibold pt-1">
                      <Navigation className="w-3.5 h-3.5" />
                      GPS: {Number(unit.currentLatitude).toFixed(4)}, {Number(unit.currentLongitude).toFixed(4)}
                    </p>
                  ) : (
                    <p className="m-0 text-[var(--color-text-muted)] pt-1">GPS Location Offline</p>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={`Dispatch Ambulance — ${selectedRequest?.requestNumber || ''}`}>
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-muted)] m-0 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[var(--color-danger)]" />
            {selectedRequest?.pickupAddress}
          </p>
          <FormField label="Select Available Unit" required id="dispatch-unit">
            <select id="dispatch-unit" value={selectedAmbulanceId} onChange={e => setSelectedAmbulanceId(e.target.value)} className="input-field">
              <option value="">-- Select ambulance unit --</option>
              {availableAmbulances.map(a => <option key={a.id} value={a.id}>{a.vehicleNumber} — {a.driverName}</option>)}
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button variant="danger" icon={Truck} disabled={!selectedAmbulanceId} isLoading={dispatch.isPending} onClick={() => dispatch.mutate({ requestId: selectedRequest.id, ambulanceId: Number(selectedAmbulanceId) })}>Dispatch Unit</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const AmbulanceNewRequestWidget = ({ showNewRequest, setShowNewRequest }) => {
  const queryClient = useQueryClient();
  const [newReq, setNewReq] = useState({ pickupAddress: '', emergencyType: 'CARDIAC', priority: 'CRITICAL' });

  const createRequest = useMutation({
    mutationFn: async (payload) => axiosPrivate.post('/ambulance/requests', payload),
    onSuccess: () => {
      toast.success('New emergency request registered');
      queryClient.invalidateQueries(['ambulance-requests']);
      setShowNewRequest(false);
      setNewReq({ pickupAddress: '', emergencyType: 'CARDIAC', priority: 'CRITICAL' });
    },
    onError: () => toast.error('Failed to create emergency request')
  });

  return (
    <Modal isOpen={showNewRequest} onClose={() => setShowNewRequest(false)} title="🚨 New Emergency Request">
      <div className="space-y-4">
        <FormField label="Pickup Address" required id="pickup-addr">
          <textarea id="pickup-addr" rows={2} value={newReq.pickupAddress} onChange={e => setNewReq({ ...newReq, pickupAddress: e.target.value })} placeholder="e.g. 123 Main Street, Sector 5..." className="input-field" />
        </FormField>
        <FormField label="Emergency Type" id="emer-type">
          <select id="emer-type" value={newReq.emergencyType} onChange={e => setNewReq({ ...newReq, emergencyType: e.target.value })} className="input-field">
            {['CARDIAC', 'TRAUMA', 'STROKE', 'RESPIRATORY', 'OBSTETRIC', 'PEDIATRIC', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Priority Level" id="emer-prio">
          <select id="emer-prio" value={newReq.priority} onChange={e => setNewReq({ ...newReq, priority: e.target.value })} className="input-field">
            {['CRITICAL', 'URGENT', 'ROUTINE'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={() => setShowNewRequest(false)}>Cancel</Button>
          <Button variant="danger" isLoading={createRequest.isPending} onClick={() => createRequest.mutate(newReq)}>Submit Emergency</Button>
        </div>
      </div>
    </Modal>
  );
};
