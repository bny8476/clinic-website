import { format } from 'date-fns';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

const DocumentList = ({ documents, onRefresh, readOnly = false }) => {
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, docId: null });
  if (!documents || documents.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <FileText className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="text-slate-500 font-medium">No documents found.</p>
      </div>
    );
  }

  const handleDownload = async (doc) => {
    try {
      const response = await axiosPrivate.get(`/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFilename || `${doc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error('Failed to download document');
      console.error(error);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, docId: id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.docId) return;
    try {
      await axiosPrivate.delete(`/documents/${confirmDelete.docId}`);
      toast.success('Document deleted');
      setConfirmDelete({ isOpen: false, docId: null });
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="text-slate-400" size={24} />;
    if (mimeType.includes('pdf')) return <FileText className="text-red-500" size={24} />;
    if (mimeType.includes('image')) return <ImageIcon className="text-blue-500" size={24} />;
    return <File className="text-slate-400" size={24} />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();
        const isExpiringSoon = !isExpired && doc.expiresAt && (new Date(doc.expiresAt).getTime() - new Date().getTime()) < 30 * 24 * 60 * 60 * 1000;
        
        return (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow group relative">
            
            {/* Status Badges */}
            <div className="absolute top-4 right-4 flex gap-1">
              {doc.versionNumber > 1 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">v{doc.versionNumber}</span>
              )}
              {isExpired && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle size={10} /> Expired
                </span>
              )}
              {isExpiringSoon && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Expiring Soon</span>
              )}
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                {getFileIcon(doc.mimeType)}
              </div>
              <div className="overflow-hidden pr-16">
                <h4 className="font-bold text-slate-800 text-sm truncate" title={doc.title}>{doc.title}</h4>
                <p className="text-xs font-medium text-slate-500 mb-1">{doc.documentType.replace(/_/g, ' ')}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            
            {doc.description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doc.description}</p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                {!readOnly && (
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              <div className="flex gap-1">
                {/* Visual indicators for features we'll build out fully later */}
                {doc.status === 'ACTIVE' && (
                  <div className="p-1.5 text-green-500 bg-green-50 rounded-md flex items-center gap-1 text-xs font-medium" title="Active">
                    <CheckCircle size={14} /> Active
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, docId: null })}
        onConfirm={executeDelete}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default DocumentList;
