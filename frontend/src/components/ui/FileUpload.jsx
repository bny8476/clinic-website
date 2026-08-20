import { useState } from 'react';

export default function FileUpload({
  accept = "*",
  maxSize = 10485760, // 10MB
  onFileSelect,
  existingFileUrl = null,
  existingFileName = "Current File",
  label = "Upload a file"
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.size > maxSize) {
      setError(`File is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return;
    }
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>}
      
      {!selectedFile && !existingFileUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={accept}
            onChange={handleChange}
            title=""
          />
          <UploadCloud className={`w-10 h-10 mb-3 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max size {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0">
              <File className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedFile ? selectedFile.name : existingFileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Already uploaded'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {existingFileUrl && !selectedFile && (
              <a 
                href={existingFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1"
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={removeFile}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
