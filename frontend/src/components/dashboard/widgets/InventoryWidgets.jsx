import { Package, Warehouse, AlertTriangle } from 'lucide-react';

export const InventoryHeaderWidget = () => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
      <Package className="w-7 h-7 text-[var(--color-navy-800)]" />
      Back-Office Inventory Management
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      Central medical supplies stock, warehouse management, and vendor purchase orders.
    </p>
  </div>
);

export const InventoryKPIWidget = ({ stockCount, lowStockCount, warehousesCount, loadingStock, loadingWarehouses }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <KPICard icon={Package} label="Total Catalog Items" value={loadingStock ? '...' : stockCount} colorToken="navy" />
    <KPICard icon={AlertTriangle} label="Low Stock Alerts" value={loadingStock ? '...' : lowStockCount} colorToken="danger" />
    <KPICard icon={Warehouse} label="Active Warehouses" value={loadingWarehouses ? '...' : warehousesCount} colorToken="success" />
  </div>
);

export const InventoryTablesWidget = ({ activeTab, stockItems, warehouses, purchaseOrders, loadingStock, loadingWarehouses, loadingPo }) => {
  const stockColumns = [
    { key: 'itemName', title: 'Item Name', render: (val) => <span className="font-semibold text-sm text-[var(--color-navy-900)]">{val}</span> },
    { key: 'itemType', title: 'Category', render: (val) => <Badge variant={val === 'MEDICINE' ? 'info' : 'neutral'}>{val}</Badge> },
    { key: 'quantity', title: 'Quantity In Stock', render: (val, row) => <span className={`font-bold ${val <= row.reorderLevel ? 'text-[var(--color-danger)]' : 'text-[var(--color-navy-900)]'}`}>{val} {row.unit || 'units'}</span> },
    { key: 'reorderLevel', title: 'Reorder Threshold' },
    { key: 'source', title: 'Location / Source', render: (_, row) => row.medicineBatch ? `Batch #${row.medicineBatch.batchNumber}` : 'Central Warehouse' }
  ];

  const warehouseColumns = [
    { key: 'name', title: 'Warehouse Name', render: (val) => <span className="font-semibold">{val}</span> },
    { key: 'location', title: 'Location', render: (val) => val || 'Main Campus' },
    { key: 'status', title: 'Operational Status', render: () => <Badge variant="success">Active</Badge> }
  ];

  const poColumns = [
    { key: 'id', title: 'PO ID', render: (val) => `#${val}` },
    { key: 'orderDate', title: 'Order Date' },
    { key: 'status', title: 'Status', render: (val) => <Badge variant="info">{val}</Badge> },
    { key: 'totalAmount', title: 'Total Amount', render: (val) => `₹${val || 0}` }
  ];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
      {activeTab === 'stock' && <DataTable columns={stockColumns} data={stockItems} isLoading={loadingStock} searchPlaceholder="Search stock catalog..." emptyTitle="No stock items found" />}
      {activeTab === 'warehouses' && <DataTable columns={warehouseColumns} data={warehouses} isLoading={loadingWarehouses} searchPlaceholder="Search warehouses..." emptyTitle="No warehouses registered" />}
      {activeTab === 'purchase-orders' && <DataTable columns={poColumns} data={purchaseOrders} isLoading={loadingPo} searchPlaceholder="Search purchase orders..." emptyTitle="No purchase orders created" />}
    </div>
  );
};
