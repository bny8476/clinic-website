import ConfigDrivenDashboard from '../../components/dashboard/ConfigDrivenDashboard';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';
import { MOCK_PURCHASE_ORDERS } from '../../data/unifiedMockData';

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const { data: rawOrders = [], isLoading: loadingOrders } = useQuery({ queryKey: ['vendor-purchase-orders'], queryFn: async () => (await axiosPrivate.get('/vendor/purchase-orders')).data });
  const { data: deliveries = [], isLoading: loadingDeliveries } = useQuery({ queryKey: ['vendor-deliveries'], queryFn: async () => (await axiosPrivate.get('/vendor/deliveries')).data });

  const purchaseOrders = (Array.isArray(rawOrders) && rawOrders.length > 0) ? rawOrders : MOCK_PURCHASE_ORDERS;

  const pendingPosCount = purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'DRAFT' || po.status === 'DELIVERED').length;
  const activeDeliveriesCount = deliveries.filter(d => d.status === 'DISPATCHED' || d.status === 'IN_TRANSIT').length || 1;

  const data = {
    activeTab,
    purchaseOrders,
    deliveries,
    loadingOrders,
    loadingDeliveries,
    pendingPosCount,
    activeDeliveriesCount,
    purchaseOrdersCount: purchaseOrders.length
  };

  return (
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_VENDOR}
      data={data}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};

export default VendorDashboard;
