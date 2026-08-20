import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';

const HomeVisit = () => {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myHomeVisits'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/home-visits/my-requests');
      return res.data;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosPrivate.post('/home-visits/request', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myHomeVisits']);
      setAddress('');
      setNotes('');
      setRequestDate('');
      toast.success('Home visit requested successfully');
    },
    onError: () => {
      toast.error('Failed to request home visit');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Address is required');
      return;
    }
    requestMutation.mutate({
      address,
      notes,
      requestDate: requestDate ? new Date(requestDate).toISOString() : null
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Home Visit Requests</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Request a Visit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder="Enter your full address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Symptoms / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder="Describe your symptoms or reason for visit"
                />
              </div>

              <button
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Request History</h2>
            {isLoading ? (
              <p>Loading your requests...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests?.map((req) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(req.requestDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.address}>
                          {req.address}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.notes}>
                          {req.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!requests || requests.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No home visit requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeVisit;
