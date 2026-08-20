import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../../api/axios';
import { Truck, CheckSquare, Package, Clock } from 'lucide-react';

export const VendorHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
      Supplier & Vendor Dispatch Portal
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Manage incoming purchase orders and fulfill shipments.
    </p>
  </div>
);

export const VendorKPIWidget = ({ pendingPosCount, activeDeliveriesCount, purchaseOrdersCount, loadingOrders, loadingDeliveries }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={Clock} label="Pending POs" value={loadingOrders ? '...' : pendingPosCount} colorToken="warning" />
    <KPICard icon={Truck} label="Active Dispatches" value={loadingDeliveries ? '...' : activeDeliveriesCount} colorToken="info" />
    <KPICard icon={Package} label="Total PO History" value={loadingOrders ? '...' : purchaseOrdersCount} colorToken="success" />
  </div>
);

export const VendorTablesWidget = ({ activeTab, purchaseOrders, deliveries, loadingOrders, loadingDeliveries }) => {
  const queryClient = useQueryClient();
  const [selectedPo, setSelectedPo] = useState(null);
  const [carrier, setCarrier] = useState('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('2026-08-01');
  const [notes, setNotes] = useState('');

  const acknowledgePo = useMutation({
    mutationFn: async (poId) => axiosPrivate.patch(`/vendor/purchase-orders/${poId}/acknowledge`),
    onSuccess: () => queryClient.invalidateQueries(['vendor-purchase-orders']),
  });

  const dispatchDelivery = useMutation({
    mutationFn: async ({ poId, payload }) => axiosPrivate.post(`/vendor/purchase-orders/${poId}/dispatch`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-purchase-orders']);
      queryClient.invalidateQueries(['vendor-deliveries']);
      setSelectedPo(null);
      setTrackingNumber('');
      setNotes('');
    },
  });

  const orderColumns = [
    { key: 'id', title: 'PO #', render: (val) => <span className="font-bold text-[var(--color-info)]">PO-{val}</span> },
    { key: 'orderDate', title: 'Order Date' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant={val === 'SHIPPED' ? 'success' : val === 'ACKNOWLEDGED' ? 'info' : 'warning'}>{val}</Badge> },
    { key: 'totalAmount', title: 'Total Amount', render: (val) => <span className="font-bold">₹{val || 0}</span> },
    {
      key: 'actions', title: 'Actions', align: 'right',
      render: (_, po) => (
        <div className="flex items-center justify-end gap-2">
          {po.status !== 'ACKNOWLEDGED' && po.status !== 'SHIPPED' && <Button variant="info" size="sm" icon={CheckSquare} onClick={() => acknowledgePo.mutate(po.id)}>Acknowledge</Button>}
          {po.status !== 'SHIPPED' && <Button variant="success" size="sm" icon={Truck} onClick={() => setSelectedPo(po)}>Dispatch Delivery</Button>}
        </div>
      )
    }
  ];

  const deliveryColumns = [
    { key: 'id', title: 'Dispatch ID', render: (val) => <span className="font-medium">#{val}</span> },
    { key: 'carrier', title: 'Carrier' },
    { key: 'trackingNumber', title: 'Tracking #', render: (val) => <span className="font-bold text-[var(--color-info)]">{val}</span> },
    { key: 'dispatchDate', title: 'Dispatch Date' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant="success">{val}</Badge> }
  ];

  return (
    <>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'orders' && <DataTable columns={orderColumns} data={purchaseOrders} isLoading={loadingOrders} searchPlaceholder="Search purchase orders..." emptyTitle="No incoming orders" />}
        {activeTab === 'deliveries' && <DataTable columns={deliveryColumns} data={deliveries} isLoading={loadingDeliveries} searchPlaceholder="Search deliveries..." emptyTitle="No active deliveries" />}
      </div>

      <Modal isOpen={!!selectedPo} onClose={() => setSelectedPo(null)} title={`Dispatch Delivery for PO-${selectedPo?.id}`}>
        <div className="space-y-4 mt-4">
          <FormField label="Logistics Carrier">
            <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)} className="input-field" />
          </FormField>
          <FormField label="Shipment Tracking Number">
            <input type="text" placeholder="TRK-9002138" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="input-field" />
          </FormField>
          <FormField label="Estimated Delivery Date">
            <input type="date" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} className="input-field" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setSelectedPo(null)}>Cancel</Button>
            <Button variant="success" isLoading={dispatchDelivery.isPending} onClick={() => dispatchDelivery.mutate({ poId: selectedPo.id, payload: { carrier, trackingNumber, estimatedDelivery, notes } })}>Dispatch Shipment</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
