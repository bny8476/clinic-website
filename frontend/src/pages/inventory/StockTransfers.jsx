import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';




const EMPTY_FORM = { fromWarehouseId: '', toWarehouseId: '', stockItemId: '', quantity: '', notes: '', status: 'PENDING' };

const StockTransfers = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: transfers = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/transfers')).data,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['backoffice-warehouses'],
    queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/warehouses')).data,
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['backoffice-stock'],
    queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/stock')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => axiosPrivate.post('/backoffice/inventory/transfers', payload),
    onSuccess: () => {
      toast.success('Transfer request created');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to create transfer'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.stockItemId || !form.quantity) {
      toast.error('Stock item and quantity are required');
      return;
    }
    const payload = {
      ...(form.fromWarehouseId ? { fromWarehouse: { id: Number(form.fromWarehouseId) } } : {}),
      ...(form.toWarehouseId ? { toWarehouse: { id: Number(form.toWarehouseId) } } : {}),
      stockItem: { id: Number(form.stockItemId) },
      quantity: Number(form.quantity),
      notes: form.notes || null,
    };
    createMutation.mutate(payload);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const columns = [
    {
      key: 'id',
      title: '#',
      render: (val) => <span className="font-mono text-xs text-[var(--color-text-muted)]">#{val}</span>
    },
    {
      key: 'item',
      title: 'Item',
      render: (_, row) => <span className="font-semibold text-[var(--color-navy-900)]">{row.stockItem?.itemName || '—'}</span>
    },
    {
      key: 'from',
      title: 'From',
      render: (_, row) => <span className="text-[var(--color-text-muted)] whitespace-nowrap">{row.fromWarehouse?.name || '—'}</span>
    },
    {
      key: 'arrow',
      title: '',
      render: () => <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-50" />
    },
    {
      key: 'to',
      title: 'To',
      render: (_, row) => <span className="text-[var(--color-text-muted)] whitespace-nowrap">{row.toWarehouse?.name || '—'}</span>
    },
    {
      key: 'quantity',
      title: 'Qty',
      render: (val) => <span className="font-bold text-[var(--color-warning)]">{val}</span>
    },
    {
      key: 'transferredAt',
      title: 'Date',
      render: (val) => <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDate(val)}</span>
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (val) => <span className="text-xs text-[var(--color-text-muted)] max-w-[180px] truncate block" title={val}>{val || '—'}</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (val) => {
        let variant = 'default';
        if (val === 'COMPLETED') variant = 'success';
        if (val === 'IN_TRANSIT') variant = 'warning';
        return (
          <Badge variant={variant} className="flex items-center w-fit">
            {val === 'COMPLETED' ? <CheckCircle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
            {val || 'PENDING'}
          </Badge>
        );
      }
    }
  ];

  return (
    
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-navy-900)] flex items-center gap-2 m-0">
            <ArrowLeftRight className="w-6 h-6 text-[var(--color-warning)]" /> Stock Transfers
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">Inter-warehouse &amp; inter-branch stock movement</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} isLoading={isRefetching}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)} className="bg-[var(--color-warning)] hover:bg-[var(--color-warning)] hover:brightness-110">
            New Transfer
          </Button>
        </div>
      </div>

      {/* Inline create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0, mb: 0 }} animate={{ opacity: 1, height: 'auto', mb: 24 }} exit={{ opacity: 0, height: 0, mb: 0 }} className="overflow-hidden">
            <Card>
              <Card.Header className="flex justify-between items-center border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <h3 className="font-bold text-[var(--color-navy-900)] m-0">New Transfer Request</h3>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  <X className="w-5 h-5" />
                </button>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label="From Warehouse">
                    <select className="input-field cursor-pointer"
                      value={form.fromWarehouseId} onChange={e => setForm(p => ({ ...p, fromWarehouseId: e.target.value }))}>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </FormField>
                  
                  <FormField label="To Warehouse">
                    <select className="input-field cursor-pointer"
                      value={form.toWarehouseId} onChange={e => setForm(p => ({ ...p, toWarehouseId: e.target.value }))}>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </FormField>
                  
                  <FormField label="Stock Item *" required>
                    <select required className="input-field cursor-pointer"
                      value={form.stockItemId} onChange={e => setForm(p => ({ ...p, stockItemId: e.target.value }))}>
                      <option value="">Select item</option>
                      {stockItems.map(s => <option key={s.id} value={s.id}>{s.itemName} ({s.quantity} available)</option>)}
                    </select>
                  </FormField>
                  
                  <FormField label="Quantity *" required>
                    <input required type="number" min="1"
                      className="input-field"
                      value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                  </FormField>
                  
                  <div className="md:col-span-2">
                    <FormField label="Notes">
                      <input type="text"
                        className="input-field"
                        value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Optional notes..." />
                    </FormField>
                  </div>
                  
                  <div className="lg:col-span-3 flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={createMutation.isPending} className="bg-[var(--color-warning)] hover:bg-[var(--color-warning)] hover:brightness-110">
                      Create Transfer
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <Card.Body className="p-0">
          <DataTable 
             columns={columns}
             data={transfers}
             isLoading={isLoading}
             emptyTitle="No Transfers Found"
             emptyDescription="You haven't made any stock transfers yet."
             emptyIcon={ArrowLeftRight}
          />
        </Card.Body>
      </Card>

    </div>
    
  );
};

export default StockTransfers;
