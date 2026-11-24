import { create } from 'zustand';
import pharmacyService from '../utils/pharmacy/pharmacyService';
import { toast } from 'react-hot-toast';

let searchTimer = null;
let abortController = null;
let detailAbortController = null;

export const usePurchaseStore = create((set, get) => ({
  // Purchase Orders State
  poList: [],
  poLoading: false,
  poError: false,
  poPage: 0,
  poTotalElements: 0,
  poTotalPages: 0,
  poSearchTerm: '',
  poStatusFilter: 'ALL',
  poDateRange: { from: null, to: null },

  setPoSearch: (term) => {
    set({ poSearchTerm: term });
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      set({ poPage: 0 });
      get().fetchPurchaseOrders();
    }, 400);
  },

  setPoDateRange: (range) => {
    set({ poDateRange: range, poPage: 0 });
    get().fetchPurchaseOrders();
  },

  setPoStatusFilter: (status) => {
    set({ poStatusFilter: status, poPage: 0 });
    get().fetchPurchaseOrders();
  },

  setPoPage: (page) => {
    set({ poPage: page });
    get().fetchPurchaseOrders();
  },

  fetchPurchaseOrders: async () => {
    const { poPage, poSearchTerm, poDateRange, poStatusFilter } = get();
    if (abortController) abortController.abort();
    const ctrl = new AbortController();
    abortController = ctrl;

    set({ poLoading: true, poError: false });
    try {
      const params = {
        page: poPage,
        size: 20,
        searchTerm: poSearchTerm || '',
        fromDate: poDateRange.from ? poDateRange.from.toISOString() : '',
        toDate: poDateRange.to ? poDateRange.to.toISOString() : '',
        status: poStatusFilter === 'ALL' ? undefined : poStatusFilter
      };
      
      const res = await pharmacyService.api.get('/pharmacy/purchase-orders', { 
        params,
        signal: ctrl.signal
      });
      
      const payload = res.data?.data;
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : []);
      const total = typeof payload?.totalElements === 'number' ? payload.totalElements : list.length;
      const totalPages = typeof payload?.totalPages === 'number' ? payload.totalPages : Math.ceil(total / 20);

      set({ 
        poList: list,
        poTotalElements: total,
        poTotalPages: totalPages,
        poLoading: false 
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      set({ poError: true, poLoading: false });
    }
  },

  // Purchase Order Detail State
  selectedPo: null,
  poDetailLoading: false,
  poDetailError: false,

  fetchPoDetail: async (poId) => {
    if (detailAbortController) detailAbortController.abort();
    const ctrl = new AbortController();
    detailAbortController = ctrl;

    set({ poDetailLoading: true, poDetailError: false });
    try {
      const res = await pharmacyService.api.get(`/pharmacy/purchase-orders/${poId}`, {
        signal: ctrl.signal
      });
      set({ selectedPo: res.data?.data || res.data, poDetailLoading: false });
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      set({ poDetailError: true, poDetailLoading: false });
      toast.error('Failed to load purchase order details');
    }
  },

  clearPoDetail: () => {
    if (detailAbortController) detailAbortController.abort();
    set({ selectedPo: null, poDetailLoading: false, poDetailError: false });
  }

}));
