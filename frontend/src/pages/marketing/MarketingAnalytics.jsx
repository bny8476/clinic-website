import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { fadeIn } from '../../components/ui/motion';



const MarketingAnalytics = () => {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/marketing/campaigns');
      return res.data;
    }
  });

  const analytics = useMemo(() => {
    let totalReach = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalConverted = 0;

    campaigns.forEach(c => {
      totalReach += c.sentCount || 0;
      if (c.successMetrics) {
        totalOpened += c.successMetrics.opened || 0;
        totalClicked += c.successMetrics.clicked || 0;
        totalConverted += c.successMetrics.converted || 0;
      }
    });

    const avgOpenRate = totalReach > 0 ? (totalOpened / totalReach) * 100 : 0;
    const avgCtr = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    return { totalReach, totalOpened, totalClicked, totalConverted, avgOpenRate, avgCtr };
  }, [campaigns]);

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/marketing" className="inline-flex items-center text-xs font-semibold text-[var(--color-navy-600)] hover:underline mb-2 gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0 flex items-center gap-2">
            <BarChart className="w-7 h-7 text-indigo-600" />
            Campaign Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
            Track engagement, open rates, and conversion metrics across all campaigns.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-indigo-50 border-indigo-100">
              <Card.Body className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-800">Total Reach</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{analytics.totalReach.toLocaleString()}</p>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="bg-emerald-50 border-emerald-100">
              <Card.Body className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <MailOpen size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Avg. Open Rate</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{analytics.avgOpenRate.toFixed(1)}%</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="bg-blue-50 border-blue-100">
              <Card.Body className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <MousePointerClick size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Avg. CTR</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{analytics.avgCtr.toFixed(1)}%</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="bg-purple-50 border-purple-100">
              <Card.Body className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-800">Conversions</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{analytics.totalConverted.toLocaleString()}</p>
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-bold text-[var(--color-navy-900)]">Recent Campaign Performance</h2>
            </Card.Header>
            <Card.Body className="p-0">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No campaigns found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-4 border-b border-slate-200">Campaign Name</th>
                        <th className="p-4 border-b border-slate-200">Status</th>
                        <th className="p-4 border-b border-slate-200 text-right">Sent</th>
                        <th className="p-4 border-b border-slate-200 text-right">Opened</th>
                        <th className="p-4 border-b border-slate-200 text-right">Clicked</th>
                        <th className="p-4 border-b border-slate-200 text-right">Converted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campaigns.map(c => {
                        const opened = c.successMetrics?.opened || 0;
                        const clicked = c.successMetrics?.clicked || 0;
                        const converted = c.successMetrics?.converted || 0;
                        const sent = c.sentCount || 0;
                        
                        const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0;
                        const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : 0;
                        
                        return (
    
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-semibold text-[var(--color-navy-900)]">{c.title}</td>
                            <td className="p-4 text-xs font-medium">
                              <span className={`px-2 py-1 rounded-full ${
                                c.status === 'ACTIVE' || c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                c.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">{sent.toLocaleString()}</td>
                            <td className="p-4 text-right">
                              {opened.toLocaleString()} 
                              <span className="text-[10px] text-slate-400 ml-1">({openRate}%)</span>
                            </td>
                            <td className="p-4 text-right">
                              {clicked.toLocaleString()}
                              <span className="text-[10px] text-slate-400 ml-1">({clickRate}%)</span>
                            </td>
                            <td className="p-4 text-right">{converted.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </motion.div>
    
  );
};

export default MarketingAnalytics;
