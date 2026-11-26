import React, { useRef } from 'react';
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
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function MedicineOrderInvoiceModal({ order, onClose }) {
  const printRef = useRef(null);

  if (!order || typeof document === 'undefined') return null;

  const orderNumber = order.orderNumber || order.orderId || `ORD-${order.id}`;
  const invoiceNumber = order.invoiceNumber || `INV-2026-${String(order.id || Math.abs(orderNumber.hashCode ? orderNumber.hashCode() : 9821)).slice(-5).padStart(5, '0')}`;
  const orderDate = order.createdAt 
    ? format(new Date(order.createdAt), 'dd MMMM yyyy, hh:mm a')
    : (order.orderDate || format(new Date(), 'dd MMMM yyyy, hh:mm a'));

  const items = order.items || [];
  const subtotal = Number(order.subtotal || order.total || order.totalAmount || 0);
  const deliveryCharges = Number(order.deliveryCharges || (subtotal > 0 ? 20 : 0));
  const packagingCharges = Number(order.packagingCharges || (subtotal > 0 ? 10 : 0));
  const totalAmount = Number(order.total || order.totalAmount || (subtotal + deliveryCharges + packagingCharges));
  
  const paymentMethod = order.paymentMethod || 'ONLINE';
  const isCod = paymentMethod === 'CASH_ON_DELIVERY' || paymentMethod === 'COD';
  const paymentStatus = order.paymentStatus || (isCod ? 'COD_PENDING' : 'PAID');

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
Invoice No  : ${invoiceNumber}
Order Ref   : ${orderNumber}
Date & Time : ${orderDate}
Payment Mode: ${isCod ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)'}
Status      : ${paymentStatus}

PATIENT DETAILS:
Patient Name : ${order.patientName || order.deliveryForm?.name || 'Registered Patient'}
Contact Phone: ${order.contactPhone || order.deliveryForm?.phone || '+91 98765 43210'}
Delivery Addr: ${order.deliveryAddress || order.deliveryForm?.address || 'Clinic Pharmacy Counter'}, ${order.deliveryCity || order.deliveryForm?.city || ''}

ORDERED MEDICINES & QUANTITIES:
--------------------------------------------------------------------------------
#   Medicine Description                   Qty     Unit Price   Total
--------------------------------------------------------------------------------
${items.map((it, idx) => {
  const name = (it.medicineName || it.name || it.medicineNameSnapshot || `Item #${idx + 1}`).padEnd(36).slice(0, 36);
  const qty = String(it.quantity || 1).padStart(5);
  const unit = `₹${Number(it.unitPrice || it.price || 0).toFixed(2)}`.padStart(12);
  const line = `₹${Number(it.totalPrice || ((it.unitPrice || it.price || 0) * (it.quantity || 1))).toFixed(2)}`.padStart(10);
  return `${String(idx + 1).padEnd(3)} ${name} ${qty} ${unit} ${line}`;
}).join('\n')}
--------------------------------------------------------------------------------
Subtotal            : ₹${subtotal.toFixed(2)}
GST (5% Inclusive)  : ₹${(subtotal * 0.05).toFixed(2)}
Delivery Charges    : ${deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
Packaging & Safety  : ${packagingCharges === 0 ? 'FREE' : `₹${packagingCharges.toFixed(2)}`}
GRAND TOTAL         : ₹${totalAmount.toFixed(2)}
================================================================================
Certified Dispensed & Quality Inspected by Elixir Pharmacy Services
Authorized Pharmacist Seal: Dr. Priya Sharma (Reg. No: PH-884920)
================================================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}_Elixir_Pharmacy.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, backgroundColor: 'rgba(0, 0, 0, 0.72)' }}
    >
      <div
        className="relative z-[99999] bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ position: 'relative', zIndex: 99999 }}
      >
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Official Pharmacy Tax Invoice</h3>
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
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
              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-extrabold bg-slate-900 text-white tracking-widest uppercase">
                Tax Invoice / Cash Memo
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient & Delivery Info</p>
              <p className="font-bold text-slate-900 text-sm">
                {order.patientName || order.deliveryForm?.name || 'Registered Patient'}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{order.contactPhone || order.deliveryForm?.phone || '+91 98765 43210'}</span>
              </p>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {order.deliveryAddress || order.deliveryForm?.address || 'Clinic Pharmacy Counter'}
                  {(order.deliveryCity || order.deliveryForm?.city) && `, ${order.deliveryCity || order.deliveryForm?.city}`}
                  {(order.deliveryPincode || order.deliveryForm?.pincode) && ` - ${order.deliveryPincode || order.deliveryForm?.pincode}`}
                </span>
              </p>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment & Payment</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Payment Mode:</span>
                <span className="font-bold text-slate-900">
                  {isCod ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Payment Status:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {paymentStatus === 'PAID' ? 'PAID CONFIRMED' : 'DUE AT DELIVERY'}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Txn ID: {order.razorpayPaymentId}
                </p>
              )}
              {order.prescriptionUrl && (
                <p className="text-[11px] text-blue-700 font-semibold">
                  Prescription Verified & Dispensed
                </p>
              )}
            </div>
          </div>

          {/* Medicines Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Description</th>
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
              <p>3. This is a computer-generated tax invoice and requires no physical signature.</p>
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
                <span className="font-mono text-base text-emerald-700">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pharmacist Stamp & Seal */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Certified Dispensed & Quality Inspected by Elixir Pharmacy Services</span>
            </div>

            <div className="text-center sm:text-right">
              <div className="w-32 border-b border-dashed border-slate-400 mx-auto sm:ml-auto mb-1"></div>
              <p className="font-bold text-slate-800 text-[11px]">Authorized Pharmacist Seal</p>
              <p className="text-[10px] text-slate-400">Reg. No: PH-884920 / State Pharmacy Council</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
