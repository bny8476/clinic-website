export const queryKeys = {
  analytics: {
    clinical: (filters) => ['analytics-clinical', filters],
    opd: (filters) => ['analytics-opd', filters],
    ipd: (filters) => ['analytics-ipd', filters],
    finance: (filters) => ['analytics-finance', filters],
    lab: (filters) => ['analytics-lab', filters],
    dailyMetrics: () => ['analytics-daily-metrics'],
    pnl: (filters) => ['analytics-pnl', filters]
  },
  vendor: {
    deliveries: () => ['vendor-deliveries']
  },
  // Add other standard keys here over time
};
