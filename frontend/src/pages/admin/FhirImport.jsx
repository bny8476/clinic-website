import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { toast } from 'react-hot-toast';



const FhirImport = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosPrivate.post('/integration/fhir/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('FHIR Data imported successfully');
      setResult(data);
      setFile(null);
    },
    onError: () => {
      toast.error('Failed to import FHIR data');
    }
  });

  const handleImport = (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
  };

  return (
    
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">FHIR Data Import</h1>
      
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Import Patient Records</h2>
        <p className="text-sm text-gray-600 mb-4">Upload a FHIR Bundle (JSON format) containing Patient, Observation, or Condition resources.</p>
        
        <form onSubmit={handleImport} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={!file || importMutation.isPending}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing...' : 'Start Import'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-green-50 p-6 rounded-xl shadow border border-green-200">
          <h2 className="text-lg font-bold text-green-800 mb-4">Import Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-500">Total Resources</p>
              <p className="text-2xl font-bold text-gray-900">{result.resourcesImported}</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-500">Patients Created</p>
              <p className="text-2xl font-bold text-gray-900">{result.patients}</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-500">Observations</p>
              <p className="text-2xl font-bold text-gray-900">{result.observations}</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <p className="text-sm text-gray-500">Conditions</p>
              <p className="text-2xl font-bold text-gray-900">{result.conditions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default FhirImport;
