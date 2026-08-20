import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { dashboardConfig } from '../../config/dashboardConfig';



const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const { data: stockItems = [], isLoading: loadingStock } = useQuery({ queryKey: ['backoffice-stock'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/stock')).data });
  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery({ queryKey: ['backoffice-warehouses'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/warehouses')).data });
  const { data: purchaseOrders = [], isLoading: loadingPo } = useQuery({ queryKey: ['backoffice-po'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/purchase-orders')).data });

  const lowStockCount = stockItems.filter(item => item.quantity <= item.reorderLevel).length;

  const data = {
    activeTab,
    stockItems,
    warehouses,
    purchaseOrders,
    loadingStock,
    loadingWarehouses,
    loadingPo,
    stockCount: stockItems.length,
    lowStockCount,
    warehousesCount: warehouses.length
  };

  return (
    
    <ConfigDrivenDashboard 
      config={dashboardConfig.ROLE_INVENTORY}
      data={data}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
    
  );
};

export default InventoryDashboard;
