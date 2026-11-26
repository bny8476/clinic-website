import React from 'react';
import PharmacyMedicineOrders from '../../components/pharmacy/PharmacyMedicineOrders';
import { ShoppingBag, ShieldCheck, Zap, Truck, Clock } from 'lucide-react';

export default function PatientMedicineOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <ShoppingBag size={200} />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-black uppercase tracking-wider">
              Live Fulfillment Center
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              Realtime Synced
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Patient Medicine Orders & Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            Manage, verify, dispense, and dispatch orders placed by patients online and recommended by clinic physicians. Inventory is automatically deducted upon fulfillment.
          </p>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-emerald-200" />
            <div>
              <p className="text-[11px] font-bold text-emerald-100">Prescription Check</p>
              <p className="text-xs font-black text-white">SOP-2026 Compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap size={20} className="text-emerald-200" />
            <div>
              <p className="text-[11px] font-bold text-emerald-100">Instant Updates</p>
              <p className="text-xs font-black text-white">Realtime Patient Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Truck size={20} className="text-emerald-200" />
            <div>
              <p className="text-[11px] font-bold text-emerald-100">Doorstep Dispatch</p>
              <p className="text-xs font-black text-white">Express Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock size={20} className="text-emerald-200" />
            <div>
              <p className="text-[11px] font-bold text-emerald-100">Avg. Turnaround</p>
              <p className="text-xs font-black text-white">&lt; 15 Minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dispensing Worklist */}
      <PharmacyMedicineOrders />
    </div>
  );
}
