import { useState, useRef } from 'react';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';

const DOCUMENT_TYPES = [
  'ID_PROOF',
  'MEDICAL_RECORD',
  'LAB_REPORT',
  'RADIOLOGY',
  'PRESCRIPTION',
  'INSURANCE',
  'CONSENT',
  'DISCHARGE_SUMMARY',
  'CERTIFICATE'
];

const DocumentUploader = ({ ownerType, ownerId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('MEDICAL_RECORD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.split('.')[0]); // Default title to filename without extension
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ownerType', ownerType);
    formData.append('ownerId', ownerId);
    formData.append('documentType', documentType);
    formData.append('title', title || file.name);
    if (description) formData.append('description', description);
    if (expiresAt) formData.append('expiresAt', new Date(expiresAt).toISOString());

    try {
      const response = await axiosPrivate.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      toast.success('Document uploaded successfully!');
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      // Reset form
      clearFile();
      setTitle('');
      setDescription('');
      setExpiresAt('');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Document</h3>
      
      {!file ? (
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Upload size={24} />
          </div>
          <p className="text-slate-700 font-medium">Click to select a file or drag and drop</p>
          <p className="text-slate-400 text-sm mt-1">PDF, JPG, PNG up to 10MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
      ) : (
        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="text-blue-500 flex-shrink-0" size={24} />
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          {!uploading && (
            <button onClick={clearFile} className="text-slate-400 hover:text-red-500 transition-colors p-1">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Document Type *</label>
          <select 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={uploading}
          >
            {DOCUMENT_TYPES.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
          <input 
            type="text" 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title"
            disabled={uploading}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
          <input 
            type="text" 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description or notes"
            disabled={uploading}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Expiration Date (Optional)</label>
          <input 
            type="date" 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={uploading}
          />
          <p className="text-xs text-slate-500 mt-1">Useful for ID proofs or certificates.</p>
        </div>
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={!file || !title || uploading}
          onClick={handleUpload}
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload size={18} /> Upload Document
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUploader;
