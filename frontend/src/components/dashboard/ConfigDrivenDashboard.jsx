import DashboardShell, { BottomRow } from '../../components/dashboard/shared/DashboardShell';
import DashboardGrid from '../../components/dashboard/DashboardGrid';
import { WIDGETS } from '../../config/dashboardConfig';
import { useNavigate } from 'react-router-dom';
import { WidgetRegistry } from './WidgetRegistry';

const renderWidget = (widgetName, props) => {
  const WidgetComponent = WidgetRegistry[widgetName] || WidgetRegistry[`${widgetName}Widget`] || WidgetRegistry[
    widgetName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('') + 'Widget'
  ];

  if (WidgetComponent) {
    return <WidgetComponent key={widgetName} {...props} />;
  }

  return (
    <div key={widgetName} className="p-4 bg-gray-50 border rounded text-xs text-gray-500 flex items-center justify-center">
      Widget not implemented: {widgetName}
    </div>
  );
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

export default ConfigDrivenDashboard;
