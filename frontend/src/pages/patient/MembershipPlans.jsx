import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';

const MembershipPlans = () => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/marketing/membership/plans');
      return res.data;
    }
  });

  const { data: myMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/marketing/membership/my-membership');
      return res.data;
    },
    retry: false // Don't retry if 404
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/marketing/membership/subscribe', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myMembership']);
      toast.success('Successfully subscribed to membership plan!');
    },
    onError: () => {
      toast.error('Failed to subscribe. Please try again.');
    }
  });

  const handleSubscribe = (planId, billingCycle) => {
    subscribeMutation.mutate({ planId, billingCycle });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Clinic Membership Plans</h1>
      
      {!membershipLoading && myMembership && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-800">Your Active Plan: {myMembership.plan.name}</h2>
              <p className="text-green-700 mt-1">Valid until: {new Date(myMembership.endDate).toLocaleDateString()}</p>
              <p className="text-green-700 font-semibold mt-1">Discount: {myMembership.plan.discountPercentage}% off all services!</p>
            </div>
            <div>
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full font-semibold">Active</span>
            </div>
          </div>
        </div>
      )}

      {plansLoading ? (
        <p className="text-center text-gray-500">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm h-10 mb-6">{plan.description}</p>
                <div className="flex justify-center items-baseline mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.monthlyFee.toFixed(2)}</span>
                  <span className="text-gray-500 ml-1">/mo</span>
                </div>
                <p className="text-sm text-gray-500">or ${plan.yearlyFee.toFixed(2)} / year</p>
              </div>
              
              <div className="p-8 bg-white">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {plan.discountPercentage}% Discount on Consultations
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Priority Booking
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Free Annual Health Checkup
                  </li>
                </ul>
                
                {!myMembership && (
                  <div className="flex flex-col space-y-3">
                    <button 
                      onClick={() => handleSubscribe(plan.id, 'MONTHLY')}
                      disabled={subscribeMutation.isPending}
                      className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Subscribe Monthly
                    </button>
                    <button 
                      onClick={() => handleSubscribe(plan.id, 'YEARLY')}
                      disabled={subscribeMutation.isPending}
                      className="w-full bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-xl hover:bg-indigo-200 transition-colors disabled:opacity-50"
                    >
                      Subscribe Yearly
                    </button>
                  </div>
                )}
                {myMembership && myMembership.plan.id === plan.id && (
                  <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl cursor-not-allowed">
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembershipPlans;
