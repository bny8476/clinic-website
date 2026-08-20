import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { ShoppingBag, Truck, Package } from 'lucide-react';



const EcommerceDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');

  // Form states for new product
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('WELLNESS');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [sku, setSku] = useState('');

  // Shipping update modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingStatus, setShippingStatus] = useState('SHIPPED');
  const [trackingNo, setTrackingNo] = useState('');

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['ecommerce-products'],
    queryFn: async () => (await axiosPrivate.get('/ecommerce/products')).data,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['ecommerce-orders'],
    queryFn: async () => (await axiosPrivate.get('/ecommerce/orders')).data,
  });

  const createProduct = useMutation({
    mutationFn: async (payload) => axiosPrivate.post('/ecommerce/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['ecommerce-products']);
      setTitle('');
      setPrice('');
      setStockQuantity('');
      setSku('');
    },
  });

  const updateShipping = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }) =>
      axiosPrivate.patch(`/ecommerce/orders/${orderId}/shipping?status=${status}&trackingNumber=${trackingNumber || ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['ecommerce-orders']);
      setSelectedOrder(null);
      setTrackingNo('');
    },
  });

  const shippedOrdersCount = orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length;

  const orderColumns = [
    { key: 'id', title: 'Order #', render: (val) => <span className="font-bold text-[var(--color-navy-900)]">#{val}</span> },
    { key: 'userId', title: 'User ID', render: (val) => `User #${val}` },
    { key: 'totalAmount', title: 'Total Amount', render: (val) => <span className="font-bold text-[var(--color-success)]">₹{val}</span> },
    { 
      key: 'status', 
      title: 'Status',
      render: (val) => (
        <Badge variant={val === 'DELIVERED' || val === 'SHIPPED' ? 'success' : 'warning'}>
          {val}
        </Badge>
      )
    },
    { key: 'trackingNumber', title: 'Tracking #', render: (val) => val || '-' },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (_, o) => (
        <Button
          variant="info"
          size="sm"
          onClick={() => setSelectedOrder(o)}
        >
          Fulfill / Ship
        </Button>
      )
    }
  ];

  const productColumns = [
    { key: 'title', title: 'Product', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'category', title: 'Category', render: (val) => <Badge variant="info">{val}</Badge> },
    { key: 'price', title: 'Price', render: (val) => <span className="font-semibold">₹{val}</span> },
    { key: 'stockQuantity', title: 'Stock' },
    { key: 'sku', title: 'SKU', render: (val) => <span className="text-[var(--color-text-muted)]">{val || '-'}</span> }
  ];

  const tabs = [
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' }
  ];

  return (
    
    <DashboardShell
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      quickActions={[]}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
          eCommerce Storefront & Shipping Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
          Manage product catalog, inventory, and order fulfillment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={ShoppingBag}
          label="Total Orders"
          value={loadingOrders ? '...' : orders.length}
          colorToken="info"
        />
        <KPICard
          icon={Truck}
          label="Shipped / Delivered"
          value={loadingOrders ? '...' : shippedOrdersCount}
          colorToken="success"
        />
        <KPICard
          icon={Package}
          label="Catalog Products"
          value={loadingProducts ? '...' : products.length}
          colorToken="warning"
        />
      </div>

      <DashboardGrid
        center={
          <div className="flex flex-col gap-6">
            {activeTab === 'orders' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                <DataTable
                  columns={orderColumns}
                  data={orders}
                  isLoading={loadingOrders}
                  searchPlaceholder="Search orders..."
                  emptyTitle="No orders placed yet"
                />
              </div>
            )}

            {activeTab === 'products' && (
              <>
                <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)]">
                  <h3 className="text-lg font-bold font-display text-[var(--color-navy-900)] m-0 mb-4">Add Storefront Product</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <FormField label="Product Title">
                      <input
                        type="text"
                        placeholder="Product Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="Category">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="input-field"
                      >
                        <option value="WELLNESS">WELLNESS</option>
                        <option value="SUPPLEMENTS">SUPPLEMENTS</option>
                        <option value="OTC_MEDICINE">OTC MEDICINE</option>
                        <option value="DEVICES">DEVICES</option>
                        <option value="PERSONAL_CARE">PERSONAL CARE</option>
                      </select>
                    </FormField>
                    <FormField label="Price (₹)">
                      <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="Stock Quantity">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={stockQuantity}
                        onChange={e => setStockQuantity(e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="SKU">
                      <input
                        type="text"
                        placeholder="SKU"
                        value={sku}
                        onChange={e => setSku(e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                  </div>
                  <Button
                    variant="info"
                    onClick={() => createProduct.mutate({
                      title,
                      category,
                      price: Number(price),
                      stockQuantity: Number(stockQuantity),
                      sku
                    })}
                    isLoading={createProduct.isPending}
                  >
                    Add Product
                  </Button>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                  <DataTable
                    columns={productColumns}
                    data={products}
                    isLoading={loadingProducts}
                    searchPlaceholder="Search products..."
                    emptyTitle="No products found"
                  />
                </div>
              </>
            )}
          </div>
        }
      />

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Update Shipping — Order #${selectedOrder?.id}`}
      >
        <div className="space-y-4 mt-4">
          <FormField label="Shipping Status">
            <select
              value={shippingStatus}
              onChange={e => setShippingStatus(e.target.value)}
              className="input-field"
            >
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </FormField>
          
          <FormField label="Tracking Number">
            <input
              type="text"
              placeholder="Courier tracking ID (e.g. FEDEX-98213)"
              value={trackingNo}
              onChange={e => setTrackingNo(e.target.value)}
              className="input-field"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button
              variant="info"
              isLoading={updateShipping.isPending}
              onClick={() => updateShipping.mutate({ orderId: selectedOrder.id, status: shippingStatus, trackingNumber: trackingNo })}
            >
              Save Shipping Info
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
    
  );
};

export default EcommerceDashboard;
