import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { FileText, Shield, Search, Filter } from 'lucide-react';
import DocumentUploader from '../../components/common/DocumentUploader';
import DocumentList from '../../components/common/DocumentList';
import { motion } from 'framer-motion';
import { staggerChildren, fadeUp, listStagger } from '../../components/ui/motion';

import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';

const PatientDocuments = () => {
  const { user } = useAuthStore();
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patient-documents', filterType],
    queryFn: async () => {
      let url = `/documents?status=ACTIVE`;
      if (filterType !== 'ALL') {
        url += `&documentType=${filterType}`;
      }
      // Note: Backend forces ownerId to current user for PATIENT role automatically.
      const response = await axiosPrivate.get(url);
      return response.data;
    }
  });

  const documents = data?.content || [];

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            My Documents
          </h1>
          <p className="text-slate-500 mt-1">Manage your medical records, ID proofs, and prescriptions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
          <Shield size={16} />
          <span>Securely stored & encrypted</span>
        </div>
      </motion.div>

      <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Column */}
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <DocumentUploader 
            ownerType="PATIENT" 
            ownerId={user?.id} 
            onUploadComplete={refetch} 
          />
          
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-bold text-blue-900 mb-2">Why upload documents?</h4>
            <ul className="text-sm text-blue-800 space-y-2 list-disc pl-4">
              <li>Keep all your health records in one secure place.</li>
              <li>Easily share past lab reports with your doctor.</li>
              <li>Upload your ID proof to speed up clinic registration.</li>
            </ul>
          </div>
        </motion.div>

        {/* List Column */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="text-slate-400" size={18} />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="MEDICAL_RECORD">Medical Records</option>
                <option value="ID_PROOF">ID Proofs</option>
                <option value="LAB_REPORT">Lab Reports</option>
                <option value="PRESCRIPTION">Prescriptions</option>
              </select>
            </div>
          </div>

          {/* Document Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-slate-400">Loading documents...</div>
          ) : (
            <DocumentList 
              documents={filteredDocs} 
              onRefresh={refetch} 
            />
          )}

        </motion.div>
      </motion.div>
    </div>
    
  );
};

export default PatientDocuments;
