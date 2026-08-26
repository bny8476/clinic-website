import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { Box, Home, ShoppingCart, Search, Filter, AlertTriangle, Inbox, CheckCircle2, Package, Plus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const InventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const { data: stockItems = [], isLoading: loadingStock } = useQuery({ queryKey: ['backoffice-stock'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/stock')).data });
  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery({ queryKey: ['backoffice-warehouses'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/warehouses')).data });
  const { data: purchaseOrders = [], isLoading: loadingPo } = useQuery({ queryKey: ['backoffice-po'], queryFn: async () => (await axiosPrivate.get('/backoffice/inventory/purchase-orders')).data });

  const lowStockCount = stockItems.filter(item => item.quantity <= item.reorderLevel).length;

  const tabs = [
    { id: 'stock', label: 'Stock', icon: Box },
    { id: 'warehouses', label: 'Warehouses', icon: Home },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  ];

  return (
    <div className="p-6 w-full min-h-full bg-[#F8FAFF]">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                isActive
                  ? 'bg-[#2864FF] text-white border-[#2864FF]'
                  : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
          <Box className="w-8 h-8 text-[#2864FF]" strokeWidth={2.5} />
        </div>
        <div className="pt-1">
          <h1 className="text-3xl font-bold text-slate-900">Back-Office Inventory Management</h1>
          <p className="text-gray-500 mt-1 font-medium">Central medical supplies stock, warehouse management, and vendor purchase orders.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-[#F4F7FF] text-[#2864FF] rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Items</p>
                      <p className="text-2xl font-bold text-[#2864FF] leading-none">{stockItems.length}</p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-[#2864FF] rounded-full"></div>
            </div>
            
            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Low Stock</p>
                      <p className="text-2xl font-bold text-red-500 leading-none">{lowStockCount}</p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-red-500 rounded-full"></div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Available</p>
                      <p className="text-2xl font-bold text-green-500 leading-none">
                        {stockItems.length - lowStockCount}
                      </p>
                  </div>
              </div>
              <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            </div>
          </div>

          {/* Illustration Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            {/* Synthetic SVG Illustration */}
            <div className="w-full h-44 mb-6 relative flex items-center justify-center">
                <svg viewBox="0 0 200 120" className="w-full h-full object-contain">
                    <defs>
                        <linearGradient id="box-top" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#608FFF" />
                            <stop offset="100%" stopColor="#4070FF" />
                        </linearGradient>
                        <linearGradient id="box-front" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4070FF" />
                            <stop offset="100%" stopColor="#2864FF" />
                        </linearGradient>
                        <linearGradient id="box-side" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1A4DFF" />
                            <stop offset="100%" stopColor="#103EE6" />
                        </linearGradient>
                    </defs>
                    
                    {/* Shadow */}
                    <ellipse cx="100" cy="110" rx="80" ry="12" fill="#f0f4ff" />
                    
                    {/* Shelf/Background boxes */}
                    <rect x="35" y="30" width="30" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="75" y="30" width="20" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="105" y="30" width="40" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="40" y="55" width="20" height="20" rx="4" fill="#EBF0FF" />
                    <rect x="150" y="75" width="25" height="15" rx="4" fill="#EBF0FF" />
                    
                    <line x1="20" y1="53" x2="160" y2="53" stroke="#EBF0FF" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Main Box */}
                    <g transform="translate(45, 65)">
                        {/* Top Face */}
                        <path d="M25 0 L55 10 L30 20 L0 10 Z" fill="url(#box-top)" />
                        {/* Front Face */}
                        <path d="M0 10 L30 20 L30 45 L0 35 Z" fill="url(#box-front)" />
                        {/* Side Face */}
                        <path d="M30 20 L55 10 L55 35 L30 45 Z" fill="url(#box-side)" />
                        {/* Box Tape */}
                        <path d="M12 4 L42 14 L38 18 L8 8 Z" fill="#D3E0FF" opacity="0.6" />
                        <rect x="10" y="20" width="8" height="15" fill="#D3E0FF" opacity="0.6" />
                    </g>

                    {/* Clipboard */}
                    <g transform="translate(105, 50)">
                        <rect x="0" y="0" width="45" height="60" rx="6" fill="white" stroke="#D3E0FF" strokeWidth="2" />
                        <rect x="12" y="-5" width="20" height="10" rx="3" fill="#608FFF" />
                        <circle cx="22" cy="0" r="2.5" fill="white" />
                        
                        {/* Lines */}
                        <line x1="18" y1="20" x2="35" y2="20" stroke="#D3E0FF" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="18" y1="35" x2="30" y2="35" stroke="#D3E0FF" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="18" y1="50" x2="38" y2="50" stroke="#D3E0FF" strokeWidth="2.5" strokeLinecap="round" />
                        
                        {/* Checkmarks */}
                        <path d="M8 18 L12 22 L16 16" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 33 L12 37 L16 31" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 48 L12 52 L16 46" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    
                    {/* Check badge */}
                    <g transform="translate(145, 38)">
                        <circle cx="10" cy="10" r="14" fill="#22C55E" />
                        <path d="M6 10 L9 13 L15 7" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">Keep inventory in check</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Add stock items, manage quantities, and track low stock alerts.
            </p>
          </div>
        </div>

        {/* Right Column / Main Area */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden min-h-[600px]">
            {/* Top Toolbar */}
            <div className="flex items-center gap-4 mb-16 relative z-10">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search stock catalog..." 
                        className="w-full bg-[#F4F7FF] text-sm text-gray-700 font-medium rounded-xl pl-12 pr-4 py-3.5 outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors bg-white">
                    <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </button>
            </div>

            {/* Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-10">
                <div className="w-32 h-32 bg-[#F4F7FF] rounded-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#EBF0FF] rounded-full animate-ping opacity-20"></div>
                    <Inbox className="w-14 h-14 text-[#2864FF]" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    No stock items found
                </h3>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                    There are no entries to display at this time.
                </p>
                <button className="flex items-center gap-2 bg-[#2864FF] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-500/20">
                    <Plus className="w-5 h-5" /> Add Stock Item
                </button>
            </div>

            {/* Decorative Dot Patterns */}
            <div className="absolute right-0 top-1/3 opacity-20 pointer-events-none">
                <svg width="120" height="240" viewBox="0 0 120 240">
                    <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle fill="#2864FF" cx="2" cy="2" r="1.5"></circle>
                    </pattern>
                    <rect x="0" y="0" width="120" height="240" fill="url(#dots)"></rect>
                </svg>
            </div>
            <div className="absolute left-0 bottom-0 opacity-20 pointer-events-none">
                <svg width="150" height="120" viewBox="0 0 150 120">
                    <pattern id="dots2" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle fill="#2864FF" cx="2" cy="2" r="1.5"></circle>
                    </pattern>
                    <rect x="0" y="0" width="150" height="120" fill="url(#dots2)"></rect>
                </svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
