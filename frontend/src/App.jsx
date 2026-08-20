import { useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import AIAssistantWidget from './components/ui/AIAssistantWidget';
import PageLoadingSkeleton from './components/ui/PageLoadingSkeleton';
import { AuthProvider as PharmacyAuthProvider } from './context/pharmacy/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import MainLayout from './components/pharmacy/layout/MainLayout';

// Route guard
import RoleRoute from './components/auth/RoleRoute';
// Public pages
const Home = lazy(() => import('./pages/public/Home'));
const DoctorList = lazy(() => import('./pages/public/DoctorList'));
const PortalLoginPage = lazy(() => import('./pages/auth/PortalLoginPage'));
const Register = lazy(() => import('./pages/public/Register'));

// Patient pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const PatientProfileEdit = lazy(() => import('./pages/patient/PatientProfileEdit'));
const HealthTimeline = lazy(() => import('./pages/patient/HealthTimeline'));
const Orders = lazy(() => import('./pages/patient/Orders'));
const RadiologyReports = lazy(() => import('./pages/patient/RadiologyReports'));
const Insurance = lazy(() => import('./pages/patient/Insurance'));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const MedicalRecords = lazy(() => import('./pages/patient/MedicalRecords'));
const PatientBilling = lazy(() => import('./pages/patient/PatientBilling'));
const PatientPrescriptions = lazy(() => import('./pages/patient/PatientPrescriptions'));
const OrderMedicine = lazy(() => import('./pages/patient/OrderMedicine'));
const AppointmentHistory = lazy(() => import('./pages/patient/AppointmentHistory'));
const LabReports = lazy(() => import('./pages/patient/LabReports'));
const PatientDependents = lazy(() => import('./pages/patient/PatientDependents'));
const PatientSettings = lazy(() => import('./pages/patient/PatientSettings'));
const PatientConsent = lazy(() => import('./pages/patient/PatientConsent'));
const HomeVisits = lazy(() => import('./pages/patient/HomeVisits'));
const MembershipPlans = lazy(() => import('./pages/patient/MembershipPlans'));
const PatientReminders = lazy(() => import('./pages/patient/PatientReminders'));
const SurveyResponse = lazy(() => import('./pages/patient/SurveyResponse'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const Teleconsultations = lazy(() => import('./pages/patient/Teleconsultations'));
const AiAssistant = lazy(() => import('./pages/patient/AiAssistant'));
const PatientDocuments = lazy(() => import('./pages/patient/PatientDocuments'));

// Shared pages
const TeleconsultationRoom = lazy(() => import('./pages/common/TeleconsultationRoom'));

// Doctor pages
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const AppointmentListToday = lazy(() => import('./pages/doctor/AppointmentListToday'));
const ConsultationQueue = lazy(() => import('./pages/doctor/ConsultationQueue'));
const DoctorCalendar = lazy(() => import('./pages/doctor/DoctorCalendar'));
const PatientList = lazy(() => import('./pages/doctor/PatientList'));
const PatientDetail = lazy(() => import('./pages/doctor/PatientDetail'));
const ClinicalNotes = lazy(() => import('./pages/doctor/ClinicalNotes'));
const NewPrescription = lazy(() => import('./pages/doctor/NewPrescription'));
const LabRequest = lazy(() => import('./pages/doctor/LabRequest'));
const RadiologyRequest = lazy(() => import('./pages/doctor/RadiologyRequest'));
const PrescriptionTemplates = lazy(() => import('./pages/doctor/PrescriptionTemplates'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/DoctorPrescriptions'));
const DoctorLabReports = lazy(() => import('./pages/doctor/DoctorLabReports'));
const UploadLabReport = lazy(() => import('./pages/doctor/UploadLabReport'));
const DoctorMedicalCertificates = lazy(() => import('./pages/doctor/DoctorMedicalCertificates'));
const FollowUps = lazy(() => import('./pages/doctor/FollowUps'));
const DoctorEarnings = lazy(() => import('./pages/doctor/DoctorEarnings'));
const DoctorAnalytics = lazy(() => import('./pages/doctor/DoctorAnalytics'));
const ClinicalDecisionSupport = lazy(() => import('./pages/doctor/ClinicalDecisionSupport'));
const CarePathwayBuilder = lazy(() => import('./pages/doctor/CarePathwayBuilder'));
const PatientCarePathwayView = lazy(() => import('./pages/doctor/PatientCarePathwayView'));
const DoctorScheduleSettings = lazy(() => import('./pages/doctor/DoctorScheduleSettings'));
const ManageMedicines = lazy(() => import('./pages/doctor/ManageMedicines'));
const ClinicalWorkspace = lazy(() => import('./pages/doctor/ClinicalWorkspace'));

// Admin pages (legacy — kept for ROLE_ADMIN / ROLE_BRANCH_ADMIN via old AuthLayout)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Clinical Dashboard pages
const NurseDashboard = lazy(() => import('./pages/nurse/NurseDashboard'));
const NurseAssignedPatients = lazy(() => import('./pages/nurse/NurseAssignedPatients'));
const VitalSignsEntry = lazy(() => import('./pages/nurse/VitalSignsEntry'));
const MedicationAdministration = lazy(() => import('./pages/nurse/MedicationAdministration'));
const NursingNotes = lazy(() => import('./pages/nurse/NursingNotes'));
const PatientMonitoring = lazy(() => import('./pages/nurse/PatientMonitoring'));
const WardManagement = lazy(() => import('./pages/nurse/WardManagement'));
const TaskManagement = lazy(() => import('./pages/nurse/TaskManagement'));
const NurseWorkspace = lazy(() => import('./pages/nurse/NurseWorkspace'));
const ReceptionDashboard = lazy(() => import('./pages/reception/ReceptionDashboard'));
const QueueManagement = lazy(() => import('./pages/reception/QueueManagement'));
const PatientRegistration = lazy(() => import('./pages/reception/PatientRegistration'));
const TokenGeneration = lazy(() => import('./pages/reception/TokenGeneration'));
const WalkInCheckIn = lazy(() => import('./pages/reception/WalkInCheckIn'));
const ReceptionBilling = lazy(() => import('./pages/reception/ReceptionBilling'));
const InsuranceVerificationPage = lazy(() => import('./pages/reception/InsuranceVerificationPage'));
const DocumentScanning = lazy(() => import('./pages/reception/DocumentScanning'));
const CheckInKiosk = lazy(() => import('./pages/reception/CheckInKiosk'));
const PatientSearch = lazy(() => import('./pages/reception/PatientSearch'));
const PharmacistDashboard = lazy(() => import('./pages/pharmacist/PharmacistDashboard'));
const LabDashboard = lazy(() => import('./pages/lab/LabDashboard'));
const LabWorklist = lazy(() => import('./pages/lab/LabWorklist'));
const ReportVerification = lazy(() => import('./pages/lab/ReportVerification'));
const LabCatalogManagement = lazy(() => import('./pages/lab/LabCatalogManagement'));
const LabNotifications = lazy(() => import('./pages/lab/LabNotifications'));
// Lab Reports for patients/doctors (can reuse or specific)
const RadiologistDashboard = lazy(() => import('./pages/radiologist/RadiologistDashboard'));

// Back-office dashboard pages
const HrDashboard = lazy(() => import('./pages/hr/HrDashboard'));
const Employees = lazy(() => import('./pages/hr/Employees'));
const LeaveManagement = lazy(() => import('./pages/hr/LeaveManagement'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const InvoicesList = lazy(() => import('./pages/finance/InvoicesList'));
const PnLStatement = lazy(() => import('./pages/finance/PnLStatement'));
const FinancePayments = lazy(() => import('./pages/finance/FinancePayments'));
const InsuranceClaimsList = lazy(() => import('./pages/finance/InsuranceClaimsList'));
const FinanceRefunds = lazy(() => import('./pages/finance/FinanceRefunds'));
const FinanceDailyCash = lazy(() => import('./pages/finance/FinanceDailyCash'));
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'));
const WarehousesList = lazy(() => import('./pages/inventory/WarehousesList'));
const StockTransfers = lazy(() => import('./pages/inventory/StockTransfers'));
const InventoryPurchaseOrders = lazy(() => import('./pages/pharmacy/PurchaseOrders'));
const InventorySuppliers = lazy(() => import('./pages/pharmacy/Suppliers'));
const InventoryBatches = lazy(() => import('./pages/pharmacy/MedicineStock'));
const InventoryExpiry = lazy(() => import('./pages/pharmacy/ExpiryTracker'));
const InventoryReports = lazy(() => import('./pages/pharmacy/Reports'));
const InventoryBranches = lazy(() => import('./pages/admin/BranchManagement'));

// Phase 4 portal dashboard pages
const MarketingDashboard = lazy(() => import('./pages/marketing/MarketingDashboard'));
const MarketingCampaigns = lazy(() => import('./pages/marketing/MarketingCampaigns'));
const MarketingLeads = lazy(() => import('./pages/marketing/MarketingLeads'));
const MarketingLoyalty = lazy(() => import('./pages/marketing/MarketingLoyalty'));
const MarketingNps = lazy(() => import('./pages/marketing/MarketingNps'));
const MarketingConsent = lazy(() => import('./pages/marketing/MarketingConsent'));
const MarketingAnalytics = lazy(() => import('./pages/marketing/MarketingAnalytics'));
const MarketingCommunications = lazy(() => import('./pages/marketing/MarketingCommunications'));
const EcommerceDashboard = lazy(() => import('./pages/ecommerce/EcommerceDashboard'));
const ProductCatalog = lazy(() => import('./pages/ecommerce/ProductCatalog'));
const ShoppingCart = lazy(() => import('./pages/ecommerce/ShoppingCart'));
const CheckoutPage = lazy(() => import('./pages/ecommerce/CheckoutPage'));
const SupportDashboard = lazy(() => import('./pages/support/SupportDashboard'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const InsuranceDashboard = lazy(() => import('./pages/insurance/InsuranceDashboard'));
const AmbulanceDashboard = lazy(() => import('./pages/ambulance/AmbulanceDashboard'));
const SuperAdminConsole = lazy(() => import('./pages/super-admin/SuperAdminConsole'));
const BranchManagement = lazy(() => import('./pages/admin/BranchManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DicomViewer = lazy(() => import('./pages/radiologist/DicomViewer'));
const RadiologyReporting = lazy(() => import('./pages/radiologist/RadiologyReporting'));
const RadiologyRequests = lazy(() => import('./pages/radiologist/RadiologyRequests'));
const RadiologyUpload = lazy(() => import('./pages/radiologist/RadiologyUpload'));
const RadiologyArchive = lazy(() => import('./pages/radiologist/RadiologyArchive'));

// Inpatient module
const InpatientDashboard = lazy(() => import('./pages/inpatient/InpatientDashboard'));
const BedStatusBoard = lazy(() => import('./pages/inpatient/BedStatusBoard'));
const NursingStationDashboard = lazy(() => import('./pages/inpatient/NursingStationDashboard'));
const AdmissionWorkflow = lazy(() => import('./pages/inpatient/AdmissionWorkflow'));

// Emergency module
const EmergencyQueue = lazy(() => import('./pages/emergency/EmergencyQueue'));

// Surgery module
const OtSchedulingCalendar = lazy(() => import('./pages/surgery/OtSchedulingCalendar'));

// Branch Admin module
const BranchPerformance = lazy(() => import('./pages/branch-admin/BranchPerformance'));
const BranchLocalHR = lazy(() => import('./pages/branch-admin/BranchLocalHR'));
const BranchFacility = lazy(() => import('./pages/branch-admin/BranchFacility'));

// Backoffice module
const SupportTicketing = lazy(() => import('./pages/backoffice/SupportTicketing'));
const EcommerceAdmin = lazy(() => import('./pages/backoffice/EcommerceAdmin'));
const VendorManagement = lazy(() => import('./pages/backoffice/VendorManagement'));

// Support module (SupportDashboard is already imported above)
const AgentDashboard = lazy(() => import('./pages/support/AgentDashboard'));
const TicketDesk = lazy(() => import('./pages/support/TicketDesk'));
const PatientSupport = lazy(() => import('./pages/support/PatientSupport'));

// Pharmacy full module routes
import { PharmacyRoutes } from './pages/pharmacy/PharmacyRoutes';

// HR Module routes
const Attendance = lazy(() => import('./pages/hr/Attendance'));
const PayrollManagement = lazy(() => import('./pages/hr/PayrollManagement'));
const Recruitment = lazy(() => import('./pages/hr/Recruitment'));

// Analytics Module routes
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const FinancialReports = lazy(() => import('./pages/analytics/FinancialReports'));
const ClinicalAnalyticsDashboard = lazy(() => import('./pages/analytics/ClinicalAnalyticsDashboard'));
const FinanceAnalyticsDashboard = lazy(() => import('./pages/analytics/FinanceAnalyticsDashboard'));
const IPDAnalyticsDashboard = lazy(() => import('./pages/analytics/IPDAnalyticsDashboard'));
const LabAnalyticsDashboard = lazy(() => import('./pages/analytics/LabAnalyticsDashboard'));
const OPDAnalyticsDashboard = lazy(() => import('./pages/analytics/OPDAnalyticsDashboard'));

// No placeholders allowed in production


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Helper — wraps a route block in DashboardLayout with role guard.
 * Note: ROLE_ADMIN and ROLE_SUPER_ADMIN bypass allowedRoles by design.
 * See the comment in components/auth/RoleRoute.jsx for rationale and
 * instructions on how to restrict the bypass if ever needed.
 */
const DashboardRoute = ({ path, portalSlug, allowedRoles, defaultRedirect, children }) => (
  <Route
    path={path}
    element={
      <RoleRoute allowedRoles={allowedRoles} portalSlug={portalSlug}>
        <DashboardLayout portalSlug={portalSlug} allowedRoles={allowedRoles} />
      </RoleRoute>
    }
  >
    {defaultRedirect && (
      <Route index element={<Navigate to={defaultRedirect} replace />} />
    )}
    {children}
  </Route>
);

function App() {
  useEffect(() => {
    // Wake up backend (e.g., Render free tier) on app load
    const baseUrl =
      (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:8080/api';
    fetch(`${baseUrl}/health`)
      .then(res => res.json())
      .catch(() => {
        // Silently fail if unavailable
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: 'var(--color-success)',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-danger)',
                secondary: '#fff',
              },
            },
          }}
        />
        <MotionConfig reducedMotion="user">
          <Suspense fallback={<PageLoadingSkeleton />}>
            <AIAssistantWidget />
            <Routes>

          {/* ── Public Routes ───────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/doctors" element={<DoctorList />} />
            <Route path="/register" element={<Register />} />
            <Route path="/:portalSlug/register" element={<Register />} />
          </Route>
          
          <Route path="/login" element={<Navigate to="/patient/login" replace />} />
          <Route path="/:portalSlug/login" element={<PortalLoginPage />} />
          
          <Route 
            path="/teleconsultation/room/:id" 
            element={
              <RoleRoute allowedRoles={['ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_SUPER_ADMIN']}>
                <TeleconsultationRoom />
              </RoleRoute>
            } 
          />

          {/* ── Patient Routes ──────────────────────────────────────────── */}
          <Route
            path="/patient"
            element={
              <RoleRoute allowedRoles={['ROLE_PATIENT', 'ROLE_SUPER_ADMIN']} portalSlug="patient">
                <DashboardLayout portalSlug="patient" allowedRoles={['ROLE_PATIENT', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfileEdit />} />
            <Route path="profile-edit" element={<PatientProfileEdit />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="book/:doctorId" element={<BookAppointment />} />
            <Route path="appointments" element={<AppointmentHistory />} />
            <Route path="records" element={<MedicalRecords />} />
            <Route path="billing" element={<PatientBilling />} />
            <Route path="payments" element={<PatientBilling />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="order-medicine" element={<OrderMedicine />} />
            <Route path="lab-reports" element={<LabReports />} />
            {/* Previously missing patient routes */}
            <Route path="radiology-reports" element={<RadiologyReports />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="timeline" element={<HealthTimeline />} />
            <Route path="orders" element={<Orders />} />
            <Route path="dependents" element={<PatientDependents />} />
            <Route path="settings" element={<PatientSettings />} />
            <Route path="consent" element={<PatientConsent />} />
            <Route path="support" element={<PatientSupport />} />
            <Route path="home-visits" element={<HomeVisits />} />
            <Route path="membership" element={<MembershipPlans />} />
            <Route path="reminders" element={<PatientReminders />} />
            <Route path="survey" element={<SurveyResponse />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="teleconsultations" element={<Teleconsultations />} />
            <Route path="ai-assistant" element={<AiAssistant />} />
            <Route path="documents" element={<PatientDocuments />} />
            
            {/* Patient eCommerce Routes */}
            <Route path="ecommerce">
              <Route path="catalog" element={<ProductCatalog />} />
              <Route path="cart" element={<ShoppingCart />} />
              <Route path="checkout" element={<CheckoutPage />} />
            </Route>
          </Route>

          {/* ── Doctor Routes ───────────────────────────────────────────── */}
          <Route
            path="/doctor"
            element={
              <RoleRoute allowedRoles={['ROLE_DOCTOR', 'ROLE_SUPER_ADMIN']} portalSlug="doctor">
                <DashboardLayout portalSlug="doctor" allowedRoles={['ROLE_DOCTOR', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments/today" element={<AppointmentListToday />} />
            <Route path="queue" element={<ConsultationQueue />} />
            <Route path="consultation/:id" element={<ClinicalWorkspace />} />
            <Route path="calendar" element={<DoctorCalendar />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:patientId" element={<PatientDetail />} />
            <Route path="patients/:patientId/notes" element={<ClinicalNotes />} />
            <Route path="patients/:patientId/prescriptions/new" element={<NewPrescription />} />
            <Route path="patients/:patientId/prescriptions/:prescriptionId/edit" element={<NewPrescription />} />

            <Route path="lab-request" element={<LabRequest />} />
            <Route path="radiology-request" element={<RadiologyRequest />} />
            <Route path="patients/:patientId/lab-request" element={<LabRequest />} />
            <Route path="patients/:patientId/radiology-request" element={<RadiologyRequest />} />
            <Route path="patients/:patientId/care-pathways" element={<PatientCarePathwayView />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="lab-reports" element={<DoctorLabReports />} />
            <Route path="lab-reports/upload" element={<UploadLabReport />} />
            <Route path="medical-certificate" element={<DoctorMedicalCertificates />} />
            <Route path="prescription-templates" element={<PrescriptionTemplates />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="earnings" element={<DoctorEarnings />} />
            <Route path="analytics" element={<DoctorAnalytics />} />
            <Route path="cds" element={<ClinicalDecisionSupport />} />
            <Route path="care-pathways/builder" element={<CarePathwayBuilder />} />
            <Route path="schedule-settings" element={<DoctorScheduleSettings />} />
            <Route path="manage-medicines" element={<ManageMedicines />} />
          </Route>

          {/* ── Nurse Routes ────────────────────────────────────────────── */}
          <Route
            path="/nurse"
            element={
              <RoleRoute allowedRoles={['ROLE_NURSE', 'ROLE_SUPER_ADMIN']} portalSlug="nurse">
                <DashboardLayout portalSlug="nurse" allowedRoles={['ROLE_NURSE', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/nurse/dashboard" replace />} />
            <Route path="dashboard" element={<NurseDashboard />} />
            <Route path="patients" element={<NurseAssignedPatients />} />
            <Route path="vitals" element={<VitalSignsEntry />} />
            <Route path="medication" element={<MedicationAdministration />} />
            <Route path="notes" element={<NursingNotes />} />
            <Route path="monitoring" element={<PatientMonitoring />} />
            <Route path="wards" element={<WardManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="workspace/:patientId" element={<NurseWorkspace />} />
            {/* Previously missing nurse routes */}
          </Route>

          {/* ── Reception Routes ────────────────────────────────────────── */}
          <Route
            path="/reception"
            element={
              <RoleRoute allowedRoles={['ROLE_RECEPTION', 'ROLE_SUPER_ADMIN']} portalSlug="reception">
                <DashboardLayout portalSlug="reception" allowedRoles={['ROLE_RECEPTION', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/reception/dashboard" replace />} />
            <Route path="dashboard" element={<ReceptionDashboard />} />
            <Route path="queue" element={<QueueManagement />} />
            <Route path="register" element={<PatientRegistration />} />
            <Route path="tokens" element={<TokenGeneration />} />
            <Route path="walk-in" element={<WalkInCheckIn />} />
            <Route path="billing" element={<ReceptionBilling />} />
            <Route path="insurance" element={<InsuranceVerificationPage />} />
            <Route path="documents" element={<DocumentScanning />} />
            <Route path="checkin" element={<CheckInKiosk />} />
            <Route path="search" element={<PatientSearch />} />
            {/* Previously missing reception routes */}
            <Route path="book" element={<DoctorList />} />
            <Route path="book/:doctorId" element={<BookAppointment />} />
          </Route>

          {/* ── Pharmacist Routes ───────────────────────────────────────── */}
          <Route
            path="/pharmacist"
            element={
              <RoleRoute allowedRoles={['ROLE_PHARMACIST', 'ROLE_SUPER_ADMIN']} portalSlug="pharmacist">
                <DashboardLayout portalSlug="pharmacist" allowedRoles={['ROLE_PHARMACIST', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/pharmacist/dashboard" replace />} />
            <Route path="dashboard" element={<PharmacistDashboard />} />
          </Route>

          {/* ── Lab Tech Routes (/lab) ───────────────────────────────────── */}
          <Route
            path="/lab"
            element={
              <RoleRoute allowedRoles={['ROLE_LAB_TECH', 'ROLE_PATHOLOGIST', 'ROLE_SUPER_ADMIN']} portalSlug="lab">
                <DashboardLayout portalSlug="lab" allowedRoles={['ROLE_LAB_TECH', 'ROLE_PATHOLOGIST', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/lab/dashboard" replace />} />
            <Route path="dashboard" element={<LabDashboard />} />
            <Route path="worklist" element={<LabWorklist />} />
            <Route path="catalog" element={<LabCatalogManagement />} />
            <Route path="verification" element={<ReportVerification />} />
            <Route path="notifications" element={<LabNotifications />} />
            {/* Previously missing lab routes */}
            <Route path="lab-request" element={<LabRequest />} />
          </Route>
          {/* Redirect legacy /lab-tech → /lab */}
          <Route path="/lab-tech/*" element={<Navigate to="/lab" replace />} />

          {/* ── Radiologist Routes ──────────────────────────────────────── */}
          <Route
            path="/radiologist"
            element={
              <RoleRoute allowedRoles={['ROLE_RADIOLOGIST', 'ROLE_SUPER_ADMIN']} portalSlug="radiologist">
                <DashboardLayout portalSlug="radiologist" allowedRoles={['ROLE_RADIOLOGIST', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/radiologist/dashboard" replace />} />
            <Route path="dashboard" element={<RadiologistDashboard />} />
            <Route path="requests" element={<RadiologyRequests />} />
            <Route path="upload" element={<RadiologyUpload />} />
            <Route path="viewer" element={<DicomViewer />} />
            <Route path="reporting" element={<Navigate to="/radiologist/requests" replace />} />
            <Route path="reporting/:requestId" element={<RadiologyReporting />} />
            <Route path="archive" element={<RadiologyArchive />} />
          </Route>

          {/* ── Accountant → Finance redirect ───────────────────────────── */}
          <Route path="/accountant" element={<Navigate to="/finance" replace />} />
          <Route path="/accountant/*" element={<Navigate to="/finance" replace />} />

          {/* ── Finance / Accountant Routes ─────────────────────────────── */}
          <Route
            path="/finance"
            element={
              <RoleRoute allowedRoles={['ROLE_FINANCE', 'ROLE_ACCOUNTANT', 'ROLE_SUPER_ADMIN']} portalSlug="finance">
                <DashboardLayout portalSlug="finance" allowedRoles={['ROLE_FINANCE', 'ROLE_ACCOUNTANT', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/finance/dashboard" replace />} />
            <Route path="dashboard" element={<FinanceDashboard />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="pnl" element={<PnLStatement />} />
            {/* Previously missing finance routes */}
            <Route path="payments" element={<FinancePayments />} />
            <Route path="insurance-claims" element={<InsuranceClaimsList />} />
            <Route path="refunds" element={<FinanceRefunds />} />
            <Route path="daily-cash" element={<FinanceDailyCash />} />
            <Route path="revenue" element={<PnLStatement />} />
            <Route path="reports" element={<PnLStatement />} />
          </Route>

          {/* ── Inventory Routes ────────────────────────────────────────── */}
          <Route
            path="/inventory"
            element={
              <RoleRoute allowedRoles={['ROLE_INVENTORY_MANAGER', 'ROLE_SUPER_ADMIN']} portalSlug="inventory">
                <DashboardLayout portalSlug="inventory" allowedRoles={['ROLE_INVENTORY_MANAGER', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/inventory/dashboard" replace />} />
            <Route path="dashboard" element={<InventoryDashboard />} />
            <Route path="warehouses" element={<WarehousesList />} />
            <Route path="purchase-orders" element={<InventoryPurchaseOrders />} />
            <Route path="suppliers" element={<InventorySuppliers />} />
            <Route path="transfers" element={<StockTransfers />} />
            <Route path="batches" element={<InventoryBatches />} />
            <Route path="expiry" element={<InventoryExpiry />} />
            <Route path="branches" element={<InventoryBranches />} />
            <Route path="reports" element={<InventoryReports />} />
          </Route>

          {/* ── Marketing / CRM Routes ──────────────────────────────────── */}
          <Route
            path="/marketing"
            element={
              <RoleRoute allowedRoles={['ROLE_MARKETING', 'ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN']} portalSlug="marketing">
                <DashboardLayout portalSlug="marketing" allowedRoles={['ROLE_MARKETING', 'ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/marketing/dashboard" replace />} />
            <Route path="dashboard" element={<MarketingDashboard />} />
            <Route path="campaigns" element={<MarketingCampaigns />} />
            <Route path="leads" element={<MarketingLeads />} />
            <Route path="loyalty" element={<MarketingLoyalty />} />
            <Route path="nps" element={<MarketingNps />} />
            <Route path="consent" element={<MarketingConsent />} />
            <Route path="analytics" element={<MarketingAnalytics />} />
            <Route path="communications" element={<MarketingCommunications />} />
          </Route>

          {/* ── HR Module Routes ────────────────────────────────────────── */}
          <Route
            path="/hr"
            element={
              <RoleRoute allowedRoles={['ROLE_HR', 'ROLE_SUPER_ADMIN']} portalSlug="hr">
                <DashboardLayout portalSlug="hr" allowedRoles={['ROLE_HR', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="dashboard" element={<HrDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="payroll" element={<PayrollManagement />} />
            <Route path="recruitment" element={<Recruitment />} />
          </Route>

          {/* ── Analytics Module Routes ─────────────────────────────────────── */}
          <Route
            path="/analytics"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} portalSlug="analytics">
                <DashboardLayout portalSlug="analytics" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/analytics/dashboard" replace />} />
            <Route path="dashboard" element={<AnalyticsDashboard />} />
            <Route path="financial" element={<FinancialReports />} />
            <Route path="clinical" element={<ClinicalAnalyticsDashboard />} />
            <Route path="finance-reports" element={<FinanceAnalyticsDashboard />} />
            <Route path="ipd" element={<IPDAnalyticsDashboard />} />
            <Route path="lab" element={<LabAnalyticsDashboard />} />
            <Route path="opd" element={<OPDAnalyticsDashboard />} />
          </Route>

          {/* ── Pharmacy Full Module ─────────────────────────────────────── */}
          <Route 
            path="/pharmacy" 
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_PHARMACY_STAFF', 'ROLE_STOREKEEPER', 'ROLE_MEDICAL_STAFF']} portalSlug="pharmacy">
                <PharmacyAuthProvider>
                  <MainLayout />
                </PharmacyAuthProvider>
              </RoleRoute>
            }
          >
            {PharmacyRoutes}
          </Route>
          {/* ── Inpatient Module Routes ──────────────────────────────────── */}
          <Route
            path="/inpatient"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']} portalSlug="inpatient">
                <DashboardLayout portalSlug="inpatient" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/inpatient/dashboard" replace />} />
            <Route path="dashboard" element={<InpatientDashboard />} />
            <Route path="beds" element={<BedStatusBoard />} />
            <Route path="nursing-station" element={<NursingStationDashboard />} />
            <Route path="admission" element={<AdmissionWorkflow />} />
          </Route>

          {/* ── Emergency Module Routes ──────────────────────────────────── */}
          <Route
            path="/emergency"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTION']} portalSlug="emergency">
                <DashboardLayout portalSlug="emergency" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTION']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/emergency/queue" replace />} />
            <Route path="queue" element={<EmergencyQueue />} />
          </Route>

          {/* ── Surgery Module Routes ──────────────────────────────────── */}
          <Route
            path="/surgery"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']} portalSlug="surgery">
                <DashboardLayout portalSlug="surgery" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/surgery/schedule" replace />} />
            <Route path="schedule" element={<OtSchedulingCalendar />} />
          </Route>

          {/* ── Branch Admin Module Routes ──────────────────────────────────── */}
          <Route
            path="/branch-admin"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN']} portalSlug="branch-admin">
                <DashboardLayout portalSlug="branch-admin" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/branch-admin/analytics" replace />} />
            <Route path="analytics" element={<BranchPerformance />} />
            <Route path="staff" element={<BranchLocalHR />} />
            <Route path="facilities" element={<BranchFacility />} />
          </Route>

          {/* ── Back Office Module Routes ──────────────────────────────────── */}
          <Route
            path="/backoffice"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} portalSlug="backoffice">
                <DashboardLayout portalSlug="backoffice" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/backoffice/support" replace />} />
            <Route path="support" element={<SupportTicketing />} />
            <Route path="ecommerce" element={<EcommerceAdmin />} />
            <Route path="vendors" element={<VendorManagement />} />
          </Route>

          {/* ── Support Module Routes ──────────────────────────────────── */}
          <Route
            path="/support"
            element={
              <RoleRoute allowedRoles={['ROLE_SUPPORT', 'ROLE_CUSTOMER_SUPPORT', 'ROLE_SUPER_ADMIN']} portalSlug="support">
                <DashboardLayout portalSlug="support" allowedRoles={['ROLE_SUPPORT', 'ROLE_CUSTOMER_SUPPORT', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/support/dashboard" replace />} />
            <Route path="dashboard" element={<SupportDashboard />} />
            <Route path="agent" element={<AgentDashboard />} />
            <Route path="tickets" element={<TicketDesk />} />
          </Route>

          {/* ── Admin Module Routes ──────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} portalSlug="admin">
                <DashboardLayout portalSlug="admin" allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* ── Fallbacks ───────────────────────────────────────────────── */}
          {/* ── Super Admin ────────────────────────────────────────────── */}
          <Route
            path="/super-admin"
            element={
              <RoleRoute allowedRoles={['ROLE_SUPER_ADMIN']} portalSlug="super-admin">
                <DashboardLayout portalSlug="super-admin" allowedRoles={['ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminConsole />} />
          </Route>

          {/* ── Ambulance ──────────────────────────────────────────────── */}
          <Route
            path="/ambulance"
            element={
              <RoleRoute allowedRoles={['ROLE_AMBULANCE', 'ROLE_SUPER_ADMIN']} portalSlug="ambulance">
                <DashboardLayout portalSlug="ambulance" allowedRoles={['ROLE_AMBULANCE', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/ambulance/dashboard" replace />} />
            <Route path="dashboard" element={<AmbulanceDashboard />} />
          </Route>

          {/* ── Vendor ─────────────────────────────────────────────────── */}
          <Route
            path="/vendor"
            element={
              <RoleRoute allowedRoles={['ROLE_VENDOR', 'ROLE_SUPER_ADMIN']} portalSlug="vendor">
                <DashboardLayout portalSlug="vendor" allowedRoles={['ROLE_VENDOR', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
          </Route>

          {/* ── Insurance Staff ────────────────────────────────────────── */}
          <Route
            path="/insurance"
            element={
              <RoleRoute allowedRoles={['ROLE_INSURANCE', 'ROLE_SUPER_ADMIN']} portalSlug="insurance">
                <DashboardLayout portalSlug="insurance" allowedRoles={['ROLE_INSURANCE', 'ROLE_SUPER_ADMIN']} />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="/insurance/dashboard" replace />} />
            <Route path="dashboard" element={<InsuranceDashboard />} />
          </Route>

          <Route path="/unauthorized" element={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>403</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>You don't have permission to view this page.</p>
              <a href="/" style={{ color: 'var(--color-info)' }}>← Return Home</a>
            </div>
          } />
          <Route path="*" element={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>404</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>Page not found.</p>
              <a href="/" style={{ color: 'var(--color-info)' }}>← Return Home</a>
            </div>
          } />

        </Routes>
          </Suspense>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
