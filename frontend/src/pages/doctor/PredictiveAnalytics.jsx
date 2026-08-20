import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

const PredictiveAnalytics = () => {
  const { data: risks, isLoading: loadingRisks } = useQuery({
    queryKey: ['patientRisks'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/analytics/predictive/patient-risk');
      return res.data;
    }
  });

  const { data: noShows, isLoading: loadingNoShows } = useQuery({
    queryKey: ['noShowPredictions'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/analytics/predictive/no-show');
      return res.data;
    }
  });

  const { data: demand, isLoading: loadingDemand } = useQuery({
    queryKey: ['resourceDemand'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/analytics/predictive/resource-demand');
      return res.data;
    }
  });

  const getRiskColor = (score) => {
    if (score >= 0.8) return 'text-red-600 bg-red-100';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
        <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        Predictive Analytics Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Patient Risk Predictions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Patient Risk Predictions</h2>
          <p className="text-sm text-gray-500 mb-4">AI-driven risk assessment for upcoming clinical events.</p>
          
          {loadingRisks ? <p>Loading...</p> : (
            <div className="space-y-4">
              {risks?.map((risk, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{risk.patientName}</h3>
                      <p className="text-sm text-red-600 font-semibold">{risk.condition}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(risk.riskScore)}`}>
                      {(risk.riskScore * 100).toFixed(0)}% Risk
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2"><strong>Key Factors:</strong> {risk.factors}</p>
                  <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded"><strong>Action:</strong> {risk.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No-Show Predictions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Appointment No-Show Risks</h2>
          <p className="text-sm text-gray-500 mb-4">Predictive model identifying appointments likely to be missed.</p>
          
          {loadingNoShows ? <p>Loading...</p> : (
            <div className="space-y-4">
              {noShows?.map((ns, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-900">{ns.patientName}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(ns.probability)}`}>
                      {(ns.probability * 100).toFixed(0)}% Prob.
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{ns.time}</p>
                  <p className="text-sm text-gray-600 bg-gray-200 p-2 rounded"><strong>Reasoning:</strong> {ns.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Demand Predictions */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Resource Demand Forecast</h2>
        {loadingDemand ? <p>Loading...</p> : demand && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Timeframe: <strong>{demand.timeframe}</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demand.items.map((item, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-1">{item.resource}</h3>
                  <p className={`text-sm font-bold mb-2 ${item.predictedDemand === 'Critical' ? 'text-red-600' : item.predictedDemand === 'High' ? 'text-orange-500' : 'text-blue-600'}`}>
                    Demand: {item.predictedDemand}
                  </p>
                  <p className="text-sm text-gray-600">{item.insights}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PredictiveAnalytics;
