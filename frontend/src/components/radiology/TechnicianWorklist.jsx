import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function TechnicianWorklist({ requests = [] }) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const pendingRequests = requests.filter(r => r.status === 'SCHEDULED' || r.status === 'ORDERED');
  const completedRequests = requests.filter(r => r.status === 'REPORTING' || r.status === 'RELEASED');

  const uploadMutation = useMutation({
    mutationFn: async ({ requestId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // We assume PacsController takes /api/v1/radiology/pacs/upload/{requestId}
      return axiosPrivate.post(`/v1/radiology/pacs/upload/${requestId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      toast.success('DICOM uploaded successfully');
      
      // Update request status to REPORTING if it was SCHEDULED/ORDERED
      if (selectedRequest && (selectedRequest.status === 'SCHEDULED' || selectedRequest.status === 'ORDERED')) {
        axiosPrivate.patch(`/radiology/requests/${selectedRequest.id}/status?status=REPORTING`)
          .then(() => {
            queryClient.invalidateQueries(['radiology-requests-dashboard']);
          });
      } else {
        queryClient.invalidateQueries(['radiology-requests-dashboard']);
      }
      
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedRequest(null);
    },
    onError: (err) => {
      toast.error('Failed to upload DICOM file');
      console.error(err);
    }
  });

  const handleUploadClick = (request) => {
    setSelectedRequest(request);
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const renderRequestItem = (req) => (
    <div key={req.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{req.patient?.firstName} {req.patient?.lastName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">ID: {req.patient?.patientId}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            req.priority === 'STAT' ? 'bg-red-100 text-red-700' :
            req.priority === 'URGENT' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>{req.priority}</span>
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">{req.procedure?.name}</span> ({req.procedure?.modality})
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(req.scheduledAt || req.requestedAt), 'MMM d, h:mm a')}</span>
          <span>Dr. {req.doctor?.lastName}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {req.status === 'SCHEDULED' || req.status === 'ORDERED' ? (
          <button
            onClick={() => handleUploadClick(req)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <UploadCloud size={16} />
            Upload DICOM
          </button>
        ) : (
          <div className="flex items-center gap-1 text-green-600 text-sm font-medium px-3 py-1.5 bg-green-50 rounded-md">
            <CheckCircle size={16} />
            Uploaded
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-indigo-600" />
          Pending Scans To Perform
        </h3>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No pending scans.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(renderRequestItem)}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-70">
        <h3 className="text-md font-bold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          Recently Completed
        </h3>
        {completedRequests.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No recently completed scans.
          </div>
        ) : (
          <div className="space-y-3">
            {completedRequests.slice(0, 5).map(renderRequestItem)}
          </div>
        )}
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload DICOM Study">
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Uploading DICOM study for <strong>{selectedRequest?.patient?.firstName} {selectedRequest?.patient?.lastName}</strong> ({selectedRequest?.procedure?.name}).
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <UploadCloud size={32} className="mx-auto text-gray-400 mb-3" />
            <input
              type="file"
              accept=".dcm,.zip"
              onChange={handleFileChange}
              className="hidden"
              id="dicom-upload"
            />
            <label
              htmlFor="dicom-upload"
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Select DICOM File
            </label>
            {selectedFile && (
              <p className="mt-3 text-sm font-medium text-indigo-600">{selectedFile.name}</p>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => uploadMutation.mutate({ requestId: selectedRequest.id, file: selectedFile })}
              disabled={!selectedFile || uploadMutation.isPending}
              isLoading={uploadMutation.isPending}
            >
              Upload to PACS
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
