import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';



const StaffDocuments = () => {
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState('');
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('CONTRACT');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, docId: null });

  const { data: staffList } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/users');
      return res.data;
    }
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['staffDocuments', selectedStaff],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/hr/documents/${selectedStaff}`);
      return res.data;
    },
    enabled: !!selectedStaff
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosPrivate.post(`/hr/documents/${selectedStaff}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffDocuments', selectedStaff]);
      setFile(null);
      setDocumentType('CONTRACT');
      toast.success('Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload document');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId) => {
      await axiosPrivate.delete(`/hr/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffDocuments', selectedStaff]);
      toast.success('Document deleted');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file || !selectedStaff) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    uploadMutation.mutate(formData);
  };

  return (
    
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Staff Document Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Select Staff</h2>
            <select 
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full rounded-md border-gray-300 border p-2"
            >
              <option value="">-- Select Staff --</option>
              {staffList?.map(user => (
                <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
              ))}
            </select>
          </div>

          {selectedStaff && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="mt-1 w-full rounded-md border-gray-300 border p-2"
                  >
                    <option value="CONTRACT">Contract</option>
                    <option value="ID_PROOF">ID Proof</option>
                    <option value="CERTIFICATION">Certification</option>
                    <option value="RESUME">Resume</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">File</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mt-1 w-full"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!file || uploadMutation.isPending}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Staff Documents</h2>
            
            {!selectedStaff ? (
              <p className="text-gray-500 text-center py-8">Select a staff member to view their documents.</p>
            ) : isLoading ? (
              <p>Loading documents...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents?.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.documentType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setConfirmDelete({ isOpen: true, docId: doc.id });
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {documents?.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No documents found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, docId: null })}
        onConfirm={() => {
          if (confirmDelete.docId) {
            deleteMutation.mutate(confirmDelete.docId);
            setConfirmDelete({ isOpen: false, docId: null });
          }
        }}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
    
  );
};

export default StaffDocuments;
