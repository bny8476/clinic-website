import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const BarcodeScanner = lazy(() => import('./BarcodeScanner'));
const BillingDashboard = lazy(() => import('./BillingDashboard'));
const ConsolidatedBills = lazy(() => import('./ConsolidatedBills'));
const DirectMedicineReturns = lazy(() => import('./DirectMedicineReturns'));
const DirectPharmacySales = lazy(() => import('./DirectPharmacySales'));
const DispenseWorklists = lazy(() => import('./DispenseWorklists'));
const Doctors = lazy(() => import('./Doctors'));
const DrugInteractions = lazy(() => import('./DrugInteractions'));
const ExpiryTracker = lazy(() => import('./ExpiryTracker'));
const ForceChangePasswordPage = lazy(() => import('./ForceChangePasswordPage'));
const GRNEntry = lazy(() => import('./GRNEntry'));
const InsuranceClaims = lazy(() => import('./InsuranceClaims'));
const InvoiceMatching = lazy(() => import('./InvoiceMatching'));
const LowStockAlerts = lazy(() => import('./LowStockAlerts'));
const MedicalDashboard = lazy(() => import('./MedicalDashboard'));
const MedicineCreditBills = lazy(() => import('./MedicineCreditBills'));
const MedicineCreditReturns = lazy(() => import('./MedicineCreditReturns'));
const MedicineMaster = lazy(() => import('./MedicineMaster'));
const MedicineReturns = lazy(() => import('./MedicineReturns'));
const MedicineStock = lazy(() => import('./MedicineStock'));
const Narcotics = lazy(() => import('./Narcotics'));
const Patients = lazy(() => import('./Patients'));
const PendingIndentPrescriptions = lazy(() => import('./PendingIndentPrescriptions'));
const PendingPharmacyReplacement = lazy(() => import('./PendingPharmacyReplacement'));
const PendingPrescriptions = lazy(() => import('./PendingPrescriptions'));
const PendingReplacementReturns = lazy(() => import('./PendingReplacementReturns'));
const PharmacyAdvances = lazy(() => import('./PharmacyAdvances'));
const PharmacyClearance = lazy(() => import('./PharmacyClearance'));
const PharmacyDashboard = lazy(() => import('./PharmacyDashboard'));
const PharmacySales = lazy(() => import('./PharmacySales'));
const ProductSalesPerformance = lazy(() => import('./ProductSalesPerformance'));
const ProfileSettings = lazy(() => import('./ProfileSettings'));
const PurchaseOrderDetail = lazy(() => import('./PurchaseOrderDetail'));
const PurchaseOrders = lazy(() => import('./PurchaseOrders'));
const Reports = lazy(() => import('./Reports'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const ReturnWorklists = lazy(() => import('./ReturnWorklists'));
const RoleDashboard = lazy(() => import('./RoleDashboard'));
const RoleManagementPanel = lazy(() => import('./RoleManagementPanel'));
const StorekeeperDashboard = lazy(() => import('./StorekeeperDashboard'));
const SupervisorDashboard = lazy(() => import('./SupervisorDashboard'));
const SupplierReturns = lazy(() => import('./SupplierReturns'));
const Suppliers = lazy(() => import('./Suppliers'));
const TemperatureLogs = lazy(() => import('./TemperatureLogs'));
const UserManagement = lazy(() => import('./UserManagement'));
const ReportCard = lazy(() => import('./reports/ReportCard'));
const ReportPreviewPanel = lazy(() => import('./reports/ReportPreviewPanel'));
const ScheduleDrawer = lazy(() => import('./reports/ScheduleDrawer'));
const SchedulesTab = lazy(() => import('./reports/SchedulesTab'));
const ABCAnalysis = lazy(() => import('./analytics/ABCAnalysis'));
const AnalyticsDashboard = lazy(() => import('./analytics/AnalyticsDashboard'));
const MonthOverMonth = lazy(() => import('./analytics/MonthOverMonth'));
const SupplierAnalytics = lazy(() => import('./analytics/SupplierAnalytics'));

const LoadingFallback = () => <div className="p-8 text-center">Loading Pharmacy System...</div>;

export const PharmacyRoutes = [
  <Route key="AdminDashboard" path="admin-dashboard" element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />,
  <Route key="BarcodeScanner" path="barcode-scanner" element={<Suspense fallback={<LoadingFallback />}><BarcodeScanner /></Suspense>} />,
  <Route key="BillingDashboard" path="billing-dashboard" element={<Suspense fallback={<LoadingFallback />}><BillingDashboard /></Suspense>} />,
  <Route key="ConsolidatedBills" path="consolidated-bills" element={<Suspense fallback={<LoadingFallback />}><ConsolidatedBills /></Suspense>} />,
  <Route key="DirectMedicineReturns" path="direct-medicine-returns" element={<Suspense fallback={<LoadingFallback />}><DirectMedicineReturns /></Suspense>} />,
  <Route key="DirectPharmacySales" path="direct-pharmacy-sales" element={<Suspense fallback={<LoadingFallback />}><DirectPharmacySales /></Suspense>} />,
  <Route key="DispenseWorklists" path="dispense-worklists" element={<Suspense fallback={<LoadingFallback />}><DispenseWorklists /></Suspense>} />,
  <Route key="Doctors" path="doctors" element={<Suspense fallback={<LoadingFallback />}><Doctors /></Suspense>} />,
  <Route key="DrugInteractions" path="drug-interactions" element={<Suspense fallback={<LoadingFallback />}><DrugInteractions /></Suspense>} />,
  <Route key="ExpiryTracker" path="expiry-tracker" element={<Suspense fallback={<LoadingFallback />}><ExpiryTracker /></Suspense>} />,
  <Route key="ForceChangePasswordPage" path="force-change-password-page" element={<Suspense fallback={<LoadingFallback />}><ForceChangePasswordPage /></Suspense>} />,
  <Route key="GRNEntry" path="grnentry" element={<Suspense fallback={<LoadingFallback />}><GRNEntry /></Suspense>} />,
  <Route key="InsuranceClaims" path="insurance-claims" element={<Suspense fallback={<LoadingFallback />}><InsuranceClaims /></Suspense>} />,
  <Route key="InvoiceMatching" path="invoice-matching" element={<Suspense fallback={<LoadingFallback />}><InvoiceMatching /></Suspense>} />,
  <Route key="LowStockAlerts" path="low-stock-alerts" element={<Suspense fallback={<LoadingFallback />}><LowStockAlerts /></Suspense>} />,
  <Route key="MedicalDashboard" path="medical-dashboard" element={<Suspense fallback={<LoadingFallback />}><MedicalDashboard /></Suspense>} />,
  <Route key="MedicineCreditBills" path="medicine-credit-bills" element={<Suspense fallback={<LoadingFallback />}><MedicineCreditBills /></Suspense>} />,
  <Route key="MedicineCreditReturns" path="medicine-credit-returns" element={<Suspense fallback={<LoadingFallback />}><MedicineCreditReturns /></Suspense>} />,
  <Route key="MedicineMaster" path="medicine-master" element={<Suspense fallback={<LoadingFallback />}><MedicineMaster /></Suspense>} />,
  <Route key="MedicineReturns" path="medicine-returns" element={<Suspense fallback={<LoadingFallback />}><MedicineReturns /></Suspense>} />,
  <Route key="MedicineStock" path="medicine-stock" element={<Suspense fallback={<LoadingFallback />}><MedicineStock /></Suspense>} />,
  <Route key="Narcotics" path="narcotics" element={<Suspense fallback={<LoadingFallback />}><Narcotics /></Suspense>} />,
  <Route key="Patients" path="patients" element={<Suspense fallback={<LoadingFallback />}><Patients /></Suspense>} />,
  <Route key="PendingIndentPrescriptions" path="pending-indent-prescriptions" element={<Suspense fallback={<LoadingFallback />}><PendingIndentPrescriptions /></Suspense>} />,
  <Route key="PendingPharmacyReplacement" path="pending-pharmacy-replacement" element={<Suspense fallback={<LoadingFallback />}><PendingPharmacyReplacement /></Suspense>} />,
  <Route key="PendingPrescriptions" path="pending-prescriptions" element={<Suspense fallback={<LoadingFallback />}><PendingPrescriptions /></Suspense>} />,
  <Route key="PendingReplacementReturns" path="pending-replacement-returns" element={<Suspense fallback={<LoadingFallback />}><PendingReplacementReturns /></Suspense>} />,
  <Route key="PharmacyAdvances" path="pharmacy-advances" element={<Suspense fallback={<LoadingFallback />}><PharmacyAdvances /></Suspense>} />,
  <Route key="PharmacyClearance" path="pharmacy-clearance" element={<Suspense fallback={<LoadingFallback />}><PharmacyClearance /></Suspense>} />,
  <Route key="PharmacyDashboard" index element={<Suspense fallback={<LoadingFallback />}><PharmacyDashboard /></Suspense>} />,
  <Route key="PharmacyDashboard-dashboard" path="dashboard" element={<Suspense fallback={<LoadingFallback />}><PharmacyDashboard /></Suspense>} />,
  <Route key="PharmacySales" path="pharmacy-sales" element={<Suspense fallback={<LoadingFallback />}><PharmacySales /></Suspense>} />,
  <Route key="ProductSalesPerformance" path="product-sales-performance" element={<Suspense fallback={<LoadingFallback />}><ProductSalesPerformance /></Suspense>} />,
  <Route key="ProfileSettings" path="profile-settings" element={<Suspense fallback={<LoadingFallback />}><ProfileSettings /></Suspense>} />,
  <Route key="PurchaseOrderDetail" path="purchase-order-detail" element={<Suspense fallback={<LoadingFallback />}><PurchaseOrderDetail /></Suspense>} />,
  <Route key="PurchaseOrders" path="purchase-orders" element={<Suspense fallback={<LoadingFallback />}><PurchaseOrders /></Suspense>} />,
  <Route key="Reports" path="reports" element={<Suspense fallback={<LoadingFallback />}><Reports /></Suspense>} />,
  <Route key="ResetPassword" path="reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />,
  <Route key="ReturnWorklists" path="return-worklists" element={<Suspense fallback={<LoadingFallback />}><ReturnWorklists /></Suspense>} />,
  <Route key="RoleDashboard" path="role-dashboard" element={<Suspense fallback={<LoadingFallback />}><RoleDashboard /></Suspense>} />,
  <Route key="RoleManagementPanel" path="role-management-panel" element={<Suspense fallback={<LoadingFallback />}><RoleManagementPanel /></Suspense>} />,
  <Route key="StorekeeperDashboard" path="storekeeper-dashboard" element={<Suspense fallback={<LoadingFallback />}><StorekeeperDashboard /></Suspense>} />,
  <Route key="SupervisorDashboard" path="supervisor-dashboard" element={<Suspense fallback={<LoadingFallback />}><SupervisorDashboard /></Suspense>} />,
  <Route key="SupplierReturns" path="supplier-returns" element={<Suspense fallback={<LoadingFallback />}><SupplierReturns /></Suspense>} />,
  <Route key="Suppliers" path="suppliers" element={<Suspense fallback={<LoadingFallback />}><Suppliers /></Suspense>} />,
  <Route key="TemperatureLogs" path="temperature-logs" element={<Suspense fallback={<LoadingFallback />}><TemperatureLogs /></Suspense>} />,
  <Route key="UserManagement" path="user-management" element={<Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>} />,
  <Route key="ReportCard" path="reports/report-card" element={<Suspense fallback={<LoadingFallback />}><ReportCard /></Suspense>} />,
  <Route key="ReportPreviewPanel" path="reports/report-preview-panel" element={<Suspense fallback={<LoadingFallback />}><ReportPreviewPanel /></Suspense>} />,
  <Route key="ScheduleDrawer" path="reports/schedule-drawer" element={<Suspense fallback={<LoadingFallback />}><ScheduleDrawer /></Suspense>} />,
  <Route key="SchedulesTab" path="reports/schedules-tab" element={<Suspense fallback={<LoadingFallback />}><SchedulesTab /></Suspense>} />,
  <Route key="ABCAnalysis" path="analytics/abcanalysis" element={<Suspense fallback={<LoadingFallback />}><ABCAnalysis /></Suspense>} />,
  <Route key="AnalyticsDashboard" path="analytics/analytics-dashboard" element={<Suspense fallback={<LoadingFallback />}><AnalyticsDashboard /></Suspense>} />,
  <Route key="MonthOverMonth" path="analytics/month-over-month" element={<Suspense fallback={<LoadingFallback />}><MonthOverMonth /></Suspense>} />,
  <Route key="SupplierAnalytics" path="analytics/supplier-analytics" element={<Suspense fallback={<LoadingFallback />}><SupplierAnalytics /></Suspense>} />,
];
