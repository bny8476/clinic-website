

































import { WIDGETS } from '../../config/dashboardConfig';
import { useNavigate } from 'react-router-dom';

const renderWidget = (widgetName, props) => {
  switch (widgetName) {
    case WIDGETS.PATIENT_QUEUE:
      return <PatientQueueWidget key={widgetName} {...props} />;
    case WIDGETS.NEXT_APPOINTMENT:
      return <NextAppointmentWidget key={widgetName} {...props} />;
    case WIDGETS.CALENDAR_TIMELINE:
      return <CalendarTimelineWidget key={widgetName} {...props} />;
    case WIDGETS.NEW_APPOINTMENTS:
      return <NewAppointmentsWidget key={widgetName} {...props} />;
    case WIDGETS.RECENT_LAB_REPORTS:
      return <RecentLabReportsWidget key={widgetName} {...props} />;
    case WIDGETS.RECENT_ACTIVITIES:
      return <RecentActivitiesWidget key={widgetName} {...props} />;
    case WIDGETS.AI_ASSISTANT:
      return <AIAssistantWidget key={widgetName} {...props} />;
    case WIDGETS.QUICK_SEARCH:
      return <QuickSearchWidget key={widgetName} {...props} />;
    case WIDGETS.NURSE_ASSIGNED_PATIENTS:
      return <NurseAssignedPatientsWidget key={widgetName} {...props} />;
    case WIDGETS.VITAL_SIGNS_FORM:
      return <VitalSignsFormWidget key={widgetName} {...props} />;
    case WIDGETS.NURSE_RECENT_ACTIVITY:
      return <NurseRecentActivityWidget key={widgetName} {...props} />;
    case WIDGETS.RECEPTION_HEADER:
      return <ReceptionHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.RECEPTION_KPI:
      return <ReceptionKPIWidget key={widgetName} {...props} />;
    case WIDGETS.RECEPTION_WAITING_LIST:
      return <ReceptionWaitingListWidget key={widgetName} {...props} />;
    case WIDGETS.PHARMACY_KPI:
      return <PharmacyKPIWidget key={widgetName} {...props} />;
    case WIDGETS.PHARMACY_SALES_TREND:
      return <PharmacySalesTrendWidget key={widgetName} {...props} />;
    case WIDGETS.PHARMACY_REVENUE_SUMMARY:
      return <PharmacyRevenueSummaryWidget key={widgetName} {...props} />;
    case WIDGETS.PHARMACY_RECENT_BILLS:
      return <PharmacyRecentBillsWidget key={widgetName} {...props} />;
    case WIDGETS.PHARMACY_LOW_STOCK:
      return <PharmacyLowStockWidget key={widgetName} {...props} />;
    case WIDGETS.PATIENT_HEADER:
      return <PatientHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.PATIENT_KPI:
      return <PatientKPIWidget key={widgetName} {...props} />;
    case WIDGETS.PATIENT_PROFILE:
      return <PatientProfileWidget key={widgetName} {...props} />;
    case WIDGETS.PATIENT_APPOINTMENTS:
      return <PatientAppointmentsWidget key={widgetName} {...props} />;
    case WIDGETS.ADMIN_HEADER:
      return <AdminHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.ADMIN_KPI_GRID:
      return <AdminKpiGridWidget key={widgetName} {...props} />;
    case WIDGETS.ADMIN_CHART_AND_ALERTS:
      return <AdminChartAndAlertsWidget key={widgetName} {...props} />;
    case WIDGETS.ADMIN_REVENUE_STRIP:
      return <AdminRevenueStripWidget key={widgetName} {...props} />;
    case WIDGETS.INSURANCE_HEADER:
      return <InsuranceHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.INSURANCE_KPI:
      return <InsuranceKPIWidget key={widgetName} {...props} />;
    case WIDGETS.INSURANCE_ADJUDICATION:
      return <InsuranceAdjudicationWidget key={widgetName} {...props} />;
    case WIDGETS.LAB_HEADER:
      return <LabHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.LAB_KPI:
      return <LabKPIWidget key={widgetName} {...props} />;
    case WIDGETS.LAB_REQUESTS:
      return <LabRequestsWidget key={widgetName} {...props} />;
    case WIDGETS.RAD_HEADER:
      return <RadiologistHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.RAD_KPI:
      return <RadiologistKPIWidget key={widgetName} {...props} />;
    case WIDGETS.RAD_WORKSTATION:
      return <RadiologistWorkstationWidget key={widgetName} {...props} />;
    case WIDGETS.FINANCE_HEADER:
      return <FinanceHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.FINANCE_KPI:
      return <FinanceKPIWidget key={widgetName} {...props} />;
    case WIDGETS.FINANCE_TABLES:
      return <FinanceTablesWidget key={widgetName} {...props} />;
    case WIDGETS.ACCOUNTANT_HEADER:
      return <AccountantHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.ACCOUNTANT_KPI:
      return <AccountantKPIWidget key={widgetName} {...props} />;
    case WIDGETS.ACCOUNTANT_INVOICES:
      return <AccountantInvoicesWidget key={widgetName} {...props} />;
    case WIDGETS.HR_HEADER:
      return <HrHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.HR_KPI:
      return <HrKPIWidget key={widgetName} {...props} />;
    case WIDGETS.HR_TABLES:
      return <HrTablesWidget key={widgetName} {...props} />;
    case WIDGETS.INVENTORY_HEADER:
      return <InventoryHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.INVENTORY_KPI:
      return <InventoryKPIWidget key={widgetName} {...props} />;
    case WIDGETS.INVENTORY_TABLES:
      return <InventoryTablesWidget key={widgetName} {...props} />;
    case WIDGETS.AMBULANCE_HEADER:
      return <AmbulanceHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.AMBULANCE_KPI:
      return <AmbulanceKPIWidget key={widgetName} {...props} />;
    case WIDGETS.AMBULANCE_TABLES:
      return <AmbulanceTablesWidget key={widgetName} {...props} />;
    case WIDGETS.SUPPORT_HEADER:
      return <SupportHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.SUPPORT_KPI:
      return <SupportKPIWidget key={widgetName} {...props} />;
    case WIDGETS.SUPPORT_TICKETS:
      return <SupportTicketsWidget key={widgetName} {...props} />;
    case WIDGETS.VENDOR_HEADER:
      return <VendorHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.VENDOR_KPI:
      return <VendorKPIWidget key={widgetName} {...props} />;
    case WIDGETS.VENDOR_TABLES:
      return <VendorTablesWidget key={widgetName} {...props} />;
    case WIDGETS.MARKETING_HEADER:
      return <MarketingHeaderWidget key={widgetName} {...props} />;
    case WIDGETS.MARKETING_KPI:
      return <MarketingKPIWidget key={widgetName} {...props} />;
    case WIDGETS.MARKETING_TABLES:
      return <MarketingTablesWidget key={widgetName} {...props} />;
    default:
      return <div key={widgetName} className="p-4 bg-gray-50 border rounded text-xs text-gray-500">Widget not implemented: {widgetName}</div>;
  }
};

export const ConfigDrivenDashboard = ({ config, data, activeTab, onTabChange, children }) => {
  const navigate = useNavigate();
  const { appointments, dashboardStats } = data || {};

  const widgetProps = {
    ...data,
    activeTab,
    navigate
  };

  const layout = config.layout || {};
  const isDefaultTab = !activeTab || (config.tabs && config.tabs.length > 0 && activeTab === config.tabs[0]);

  return (
    <DashboardShell
      quickActions={data?.customQuickActions || config.quickActions?.map(qa => ({
        ...qa,
        action: () => navigate(qa.actionPath)
      }))}
      tabs={config.tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {isDefaultTab ? (
        <>
          {layout.top && (
            <div className="mb-6 space-y-6">
              {layout.top.map(w => renderWidget(w, widgetProps))}
            </div>
          )}
          <DashboardGrid
            left={
              layout.left && layout.left.map(w => renderWidget(w, widgetProps))
            }
            center={
              layout.center && layout.center.map(w => renderWidget(w, widgetProps))
            }
            right={
              layout.right && layout.right.map(w => renderWidget(w, widgetProps))
            }
          />
          {layout.bottom && (
            <BottomRow
              recentActivities={layout.bottom.recentActivities && renderWidget(WIDGETS.RECENT_ACTIVITIES, widgetProps)}
              aiAssistant={layout.bottom.aiAssistant && renderWidget(WIDGETS.AI_ASSISTANT, widgetProps)}
              quickSearch={layout.bottom.quickSearch && renderWidget(WIDGETS.QUICK_SEARCH, widgetProps)}
              pharmacyRecentBills={layout.bottom.pharmacyRecentBills && layout.bottom.pharmacyRecentBills.map(w => renderWidget(w, widgetProps))}
              pharmacyLowStock={layout.bottom.pharmacyLowStock && layout.bottom.pharmacyLowStock.map(w => renderWidget(w, widgetProps))}
            />
          )}
        </>
      ) : (
        <div className="mt-4">
          {children || (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
              Content for <span className="font-semibold text-slate-700">{activeTab}</span> is under construction.
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
};
