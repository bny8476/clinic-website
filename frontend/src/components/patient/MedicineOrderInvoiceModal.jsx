import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Pill,
  MapPin,
  Phone,
  Building2,
  FileText,
  Stamp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

// --- AUTHENTIC ROUNDED CIRCLE OFFICIAL PHARMACY SEAL (MATCHING CLINIC SEAL SPEC) ---
const PharmacyOfficialSeal = ({ isSealed, orderNumber, sealedDate }) => {
  if (!isSealed) {
    return (
      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full aspect-square border-2 border-dashed border-amber-400 bg-amber-50/70 p-3 flex flex-col items-center justify-center text-center select-none shadow-xs -rotate-3">
        <Stamp size={22} className="text-amber-500 mb-1" />
        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
          UNSEALED DRAFT
        </span>
        <span className="text-[8.5px] text-amber-700 font-semibold leading-tight mt-0.5 block">
          Round seal stamped on dispensation
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block select-none group">
      {/* Authentic Rounded Circle Rubber Stamp Seal in Rich Blue / Emerald Ink */}
      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full aspect-square -rotate-6 hover:rotate-0 transition-transform duration-300 drop-shadow-sm flex items-center justify-center">
        <svg 
          viewBox="0 0 150 150" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Curved Top Arc Path */}
            <path 
              id="topCircleArcPharmacy" 
              d="M 18,75 A 57,57 0 1,1 132,75" 
              fill="none" 
            />
            {/* Curved Bottom Arc Path */}
            <path 
              id="bottomCircleArcPharmacy" 
              d="M 132,75 A 57,57 0 0,1 18,75" 
              fill="none" 
            />
          </defs>

          {/* Outer Border Circle */}
          <circle cx="75" cy="75" r="71" stroke="#1e40af" strokeWidth="2.8" fill="#eff6ff" fillOpacity="0.45" />
          
          {/* Concentric Dashed Inner Ring */}
          <circle cx="75" cy="75" r="65" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3.5 2.5" fill="none" />
          
          {/* Third Inner Solid Circle */}
          <circle cx="75" cy="75" r="44" stroke="#1e40af" strokeWidth="1.6" fill="#dbeafe" fillOpacity="0.4" />

          {/* Top Curved Text */}
          <text fill="#1e3a8a" fontSize="7.8" fontWeight="900" letterSpacing="1.8">
            <textPath href="#topCircleArcPharmacy" startOffset="50%" textAnchor="middle">
              ★ ELIXIR CENTRAL PHARMACY ★
            </textPath>
          </text>

          {/* Bottom Curved Text */}
          <text fill="#1d4ed8" fontSize="6.8" fontWeight="800" letterSpacing="1.4">
            <textPath href="#bottomCircleArcPharmacy" startOffset="50%" textAnchor="middle">
              ★ DRUG LIC: DL-2026-PH998 ★
            </textPath>
          </text>

          {/* Center Pharmacy Emblem & Inscription */}
          <g transform="translate(75, 68)">
            {/* Pharmacy / Medical Cross Icon */}
            <path 
              d="M -4,-12 H 4 V -4 H 12 V 4 H 4 V 12 H -4 V 4 H -12 V -4 H -4 Z" 
              fill="#1e40af" 
            />
            <text y="21" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900" letterSpacing="0.8">
              OFFICIAL SEAL
            </text>
            <text y="29" textAnchor="middle" fill="#16a34a" fontSize="6.5" fontWeight="800" letterSpacing="0.5">
              VERIFIED & DISPENSED
            </text>
          </g>
        </svg>
      </div>

      <div className="text-center mt-1">
        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
          ✓ Pharmacy Seal Affixed
        </span>
      </div>
    </div>
  );
};

// --- PHARMACIST DIGITAL SIGNATURE COMPONENT ---
const PharmacistDigitalSignature = ({ pharmacistName, regNo, isSealed, date, time }) => {
  const name = pharmacistName || 'Dr. Sarah Jenkins, R.Ph';
  const registration = regNo || 'PH-884920 / State Pharmacy Council';

  if (!isSealed) {
    return (
      <div className="w-56 p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 text-center select-none ml-auto">
        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">
          SIGNATURE PENDING
        </span>
        <span className="text-[9px] text-amber-600 font-medium block mt-0.5">
          Pharmacist signature affixed upon fulfillment
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-center sm:text-right select-none ml-auto">
      {/* Cursive Handwritten Digital Signature SVG matching Pharmacist */}
      <div className="relative inline-block pr-2">
        <div className="h-12 flex items-center justify-end">
          <svg className="w-44 h-12 text-blue-900 overflow-visible" viewBox="0 0 200 50">
            <path
              d="M 15 35 C 35 15, 45 42, 65 22 C 85 8, 95 38, 120 18 C 145 5, 160 30, 185 20"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 40 45 Q 90 32, 175 38"
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <div className="border-t border-slate-300 pt-1">
        <p className="font-bold text-slate-900 text-xs">{name}</p>
        <p className="text-[10px] font-medium text-slate-500">Authorized Dispensing Pharmacist</p>
        <p className="text-[9px] font-mono text-slate-400">Reg. No: {registration}</p>
        <p className="text-[9px] text-slate-400">Dispensed: {date} {time ? `• ${time}` : ''}</p>
      </div>
    </div>
  );
};

export default function MedicineOrderInvoiceModal({ order, onClose }) {
  const printRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!order || !mounted || typeof document === 'undefined' || !document?.body) return null;

  const orderNumber = order.orderNumber || order.orderId || `ORD-${order.id}`;
  const invoiceNumber = order.invoiceNumber || `INV-2026-${String(order.id || Math.abs(orderNumber.length * 137)).slice(-5).padStart(5, '0')}`;
  const orderDate = order.createdAt 
    ? format(new Date(order.createdAt), 'dd MMMM yyyy, hh:mm a')
    : (order.orderDate || format(new Date(), 'dd MMMM yyyy, hh:mm a'));

  const items = order.items || [];
  const subtotal = Number(order.subtotal || order.total || order.totalAmount || 0);
  const deliveryCharges = Number(order.deliveryCharges || (subtotal > 0 ? 20 : 0));
  const packagingCharges = Number(order.packagingCharges || (subtotal > 0 ? 10 : 0));
  const totalAmount = Number(order.total || order.totalAmount || (subtotal + deliveryCharges + packagingCharges));
  
  const paymentMethod = (order.paymentMethod || 'ONLINE').toUpperCase();
  const isCod = paymentMethod === 'CASH_ON_DELIVERY' || paymentMethod === 'COD';
  const paymentStatus = order.paymentStatus || (isCod ? 'COD_PENDING' : 'PAID');

  const orderStatus = (order.orderStatus || order.status || 'PHARMACY_PROCESSING').toUpperCase();
  const isCancelled = orderStatus === 'CANCELLED';
  const isSealed = Boolean(
    order.pharmacistSeal?.isSealed ||
    orderStatus === 'COMPLETED' ||
    orderStatus === 'DELIVERED'
  );

  const pharmacistName = order.pharmacistSeal?.pharmacistName || (isSealed ? 'Dr. Sarah Jenkins, R.Ph' : '');
  const licenseNo = order.pharmacistSeal?.licenseNo || 'PH-884920 / State Pharmacy Council';
  const sealedDate = order.pharmacistSeal?.verifiedDate || orderDate;
  const sealedTime = order.pharmacistSeal?.verifiedTime || '';

  const cancellationReason = order.cancellationReason || 'Medicine item(s) out of stock in central inventory';
  const refundMessage = order.refundMessage || (
    isCod 
      ? 'Order cancelled before delivery dispatch. No payment was collected.' 
      : 'Refund Initiated: Amount will be reversed to your original payment source (Online / UPI / Netbanking) within 5–7 business days.'
  );
  const refundRefId = order.refundRefId || (isCancelled ? `REF-${String(order.id || 9821).padStart(6, '0')}` : null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    const textContent = `
================================================================================
                    ELIXIR HEALTHCARE PHARMACY
              Central Clinic Dispensary & Medical Store
      124 Health Avenue, Medical Enclave, Sector 4, Mumbai, MH - 400001
      Drug License No.: DL-2026-PH998 / 20B & 21B | GSTIN: 27AABCE1234F1Z8
================================================================================
TAX INVOICE / CASH MEMO
Invoice No:    ${invoiceNumber}
Order Ref:     ${orderNumber}
Date:          ${orderDate}
Patient:       ${order.patientName || order.userName || 'Clinic Patient'}
Phone:         ${order.contactPhone || order.userPhone || 'Registered Mobile'}
Address:       ${order.deliveryAddress || 'Clinic Registered Address'}
Payment Mode:  ${paymentMethod} (${paymentStatus})
Status:        ${orderStatus}
--------------------------------------------------------------------------------
ORDER ITEMS:
${items.map((it, idx) => {
  const p = Number(it.unitPrice || it.price || 0);
  const q = Number(it.quantity || 1);
  const t = Number(it.totalPrice || (p * q));
  return `${idx + 1}. ${(it.medicineName || it.name || 'Prescription Item').padEnd(32)} x${String(q).padEnd(4)} ₹${p.toFixed(2).padStart(8)} = ₹${t.toFixed(2).padStart(8)}`;
}).join('\n')}
--------------------------------------------------------------------------------
Subtotal:          ₹${subtotal.toFixed(2)}
Delivery Charges:  ${deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
Packaging & Taxes: ₹${packagingCharges.toFixed(2)}
GRAND TOTAL:       ₹${totalAmount.toFixed(2)}
================================================================================
${isCancelled ? `
*** ORDER CANCELLED / VOID INVOICE ***
Reason: ${cancellationReason}
${refundMessage}
Refund Reference: ${refundRefId || 'N/A'}
` : `
Authorized Pharmacist Seal:
Dispensed & Quality Inspected by: ${pharmacistName || 'Elixir Central Pharmacy'}
Reg No: ${licenseNo}
Verified On: ${sealedDate} ${sealedTime}
`}
================================================================================
    `;

    const blob = new Blob([textContent.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Fullscreen Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Invoice Modal Window */}
      <div
        className="relative z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:static"
        style={{ position: 'relative', zIndex: 99999 }}
      >
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-xl ${isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-xs`}>
              {isCancelled ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isCancelled ? 'Cancelled Medicine Order — Void Tax Invoice' : 'Official Pharmacy Tax Invoice'}
              </h3>
              <p className="text-[11px] text-slate-500">Invoice #{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReceipt}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Text</span>
            </button>
            <button
              onClick={handlePrint}
              className={`px-3.5 py-1.5 rounded-xl ${isCancelled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 print:p-0 print:overflow-visible">
          
          {/* Out of Stock / Cancellation Banner (If Cancelled) */}
          {isCancelled && (
            <div className="border-2 border-rose-300 bg-rose-50/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-rose-900 text-sm">ORDER CANCELLED & REFUND INITIATED</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-200 text-rose-800 uppercase">
                      Out of Stock
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-semibold mt-1">
                    Cancellation Reason: <span className="font-normal text-rose-700">{cancellationReason}</span>
                  </p>
                  <p className="text-[11px] text-slate-700 font-medium mt-1">
                    {refundMessage}
                  </p>
                  {refundRefId && (
                    <p className="text-[10px] font-mono text-rose-700 font-bold mt-1">
                      Refund Tracking Ref: #{refundRefId}
                    </p>
                  )}
                </div>
              </div>

              <div className="w-32 h-14 border-2 border-rose-600 border-dashed rounded-xl flex items-center justify-center text-rose-700 font-black text-sm tracking-widest uppercase rotate-3 shrink-0 bg-white/60">
                VOID
              </div>
            </div>
          )}

          {/* Pharmacy Header & Clinic Branding */}
          <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    ELIXIR HEALTHCARE PHARMACY
                  </h1>
                  <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Central Clinic Dispensary & Medical Store
                  </p>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 space-y-0.5">
                <p>124 Health Avenue, Medical Enclave, Sector 4, Mumbai, MH - 400001</p>
                <p>Drug License No.: <strong>DL-2026-PH998 / 20B & 21B</strong> | GSTIN: <strong>27AABCE1234F1Z8</strong></p>
                <p>Ph: +91 800-ELIXIR-RX | Email: pharmacy@elixirhealthcare.com</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-extrabold text-white tracking-widest uppercase ${
                isCancelled ? 'bg-rose-700' : 'bg-slate-900'
              }`}>
                {isCancelled ? 'Credit Memo / Void Invoice' : 'Tax Invoice / Cash Memo'}
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 pt-1">
                Invoice No: {invoiceNumber}
              </p>
              <p className="text-xs font-mono text-slate-600">
                Order Ref: {orderNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {orderDate}
              </p>
            </div>
          </div>

          {/* Patient Details & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Billed To (Patient):</p>
              <p className="font-bold text-slate-900 text-sm">
                {order.patientName || order.userName || 'Registered Patient'}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {order.contactPhone || order.userPhone || '+91 98765 43210'}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {order.deliveryAddress || 'Clinic Registered Patient Address, Karnataka, India'}
              </p>
            </div>

            <div className="sm:text-right space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Billing & Delivery Details:</p>
              <p className="text-slate-700">
                Payment Mode: <strong className="font-mono text-slate-900">{paymentMethod}</strong>
              </p>
              <p className="text-slate-700">
                Payment Status: <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : isCod
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isCancelled ? 'REFUND PROCESSING' : paymentStatus}
                </span>
              </p>
              <p className="text-slate-700">
                Fulfillment Status: <strong className="text-slate-900">{orderStatus.replace(/_/g, ' ')}</strong>
              </p>
              {order.prescriptionUrl && (
                <p className="text-emerald-700 font-semibold text-[11px] pt-1">
                  ✓ Doctor Prescription Verified On-File
                </p>
              )}
            </div>
          </div>

          {/* Medicines Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Dosage / Instructions</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-400">
                      Standard Prescription Package
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const price = Number(it.unitPrice || it.price || 0);
                    const qty = Number(it.quantity || 1);
                    const lineTotal = Number(it.totalPrice || (price * qty));

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {it.medicineName || it.name || it.medicineNameSnapshot || `Prescription Drug #${idx + 1}`}
                          {it.strength && <span className="ml-1 text-[11px] text-slate-500">({it.strength})</span>}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 text-[11px]">
                          {it.dosage || it.frequency || 'As directed by physician'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{qty}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{price.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-2">
            <div className="text-xs text-slate-500 space-y-1 max-w-sm">
              <p className="font-bold text-slate-700">Terms & Conditions:</p>
              <p>1. Prescribed medicines dispensed only against valid registration.</p>
              <p>2. Keep in a cool, dry place away from direct sunlight.</p>
              <p>3. This is an official digital tax document certified by central dispensary records.</p>
              {isCancelled && (
                <p className="text-rose-600 font-semibold pt-1">
                  * Note: Order was cancelled due to stock exhaustion. Paid amount reversals complete within 5-7 working days.
                </p>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST (5% Incl.):</span>
                <span className="font-mono">₹{(subtotal * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges:</span>
                <span className="font-mono">{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Packaging & Handling:</span>
                <span className="font-mono">{packagingCharges === 0 ? 'FREE' : `₹${packagingCharges.toFixed(2)}`}</span>
              </div>
              <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span className={`font-mono text-base ${isCancelled ? 'line-through text-slate-400' : 'text-emerald-700'}`}>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              {isCancelled && (
                <div className="flex justify-between font-bold text-rose-700 text-xs pt-1">
                  <span>Refund Initiated:</span>
                  <span className="font-mono">₹{paymentMethod === 'COD' ? '0.00' : totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* SIGNATURE & AUTHENTIC PHARMACY OFFICIAL SEAL AREA */}
          <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            {/* Left: Rounded Circle Rubber Stamp Seal */}
            <div className="flex flex-col items-center sm:items-start">
              {isCancelled ? (
                <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-rose-400 bg-rose-50/80 p-3 flex flex-col items-center justify-center text-center select-none shadow-xs -rotate-3">
                  <RotateCcw size={24} className="text-rose-500 mb-1" />
                  <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                    CANCELLED & REFUNDED
                  </span>
                  <span className="text-[8.5px] text-rose-600 font-semibold leading-tight mt-1 block">
                    Central Dispensary Stock Adjustment
                  </span>
                </div>
              ) : (
                <PharmacyOfficialSeal 
                  isSealed={isSealed} 
                  orderNumber={orderNumber} 
                  sealedDate={sealedDate} 
                />
              )}
            </div>

            {/* Right: Pharmacist Digital Signature */}
            <div className="w-full sm:w-auto">
              {isCancelled ? (
                <div className="space-y-1 text-center sm:text-right select-none ml-auto text-xs">
                  <div className="w-48 border-b border-rose-300 pb-1 ml-auto">
                    <p className="font-bold text-rose-800">Dispensing Pharmacist Desk</p>
                    <p className="text-[10px] text-slate-500">Cancellation Authorization</p>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400">Auth ID: {order.cancelledBy || 'Central Pharmacy Staff'}</p>
                  <p className="text-[9px] text-rose-600 font-medium">Reversal Window: 5–7 Business Days</p>
                </div>
              ) : (
                <PharmacistDigitalSignature 
                  pharmacistName={pharmacistName}
                  regNo={licenseNo}
                  isSealed={isSealed}
                  date={sealedDate}
                  time={sealedTime}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
