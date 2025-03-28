import React, { useState } from 'react';
import { DataService, Specimen } from '../utils/DataService';

const DataUpdatePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);
  const [processedData, setProcessedData] = useState<Specimen[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        type: 'error',
        text: 'Please select a file first'
      });
      return;
    }

    setIsProcessing(true);
    setMessage({
      type: 'info',
      text: 'Processing file...'
    });

    try {
      let result;
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await DataService.processExcelUpdate(file);
      } else if (file.name.endsWith('.csv')) {
        const fileContent = await readFileAsText(file);
        result = await DataService.processCSVUpdate(fileContent);
      } else {
        throw new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'File processed successfully!'
        });
        setProcessedData(result.data || []);
        setActiveTab('preview');
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (processedData.length === 0) {
      setMessage({
        type: 'error',
        text: 'No data to update. Please process a file first.'
      });
      return;
    }

    setIsProcessing(true);
    setMessage({
      type: 'info',
      text: 'Updating database...'
    });

    try {
      const updateResult = await DataService.updateDataset(processedData);
      
      if (updateResult) {
        setMessage({
          type: 'success',
          text: 'Database updated successfully! The changes will be reflected in the visualizations.'
        });
        // Reset state
        setFile(null);
        setProcessedData([]);
        setActiveTab('upload');
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to update database.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error updating database: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Database</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'upload' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            1. Upload File
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'preview' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            } ${processedData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => processedData.length > 0 && setActiveTab('preview')}
            disabled={processedData.length === 0}
          >
            2. Preview Changes
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'confirm' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            } ${processedData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => processedData.length > 0 && setActiveTab('confirm')}
            disabled={processedData.length === 0}
          >
            3. Confirm Update
          </button>
        </div>
        
        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'error' ? 'bg-red-50 text-red-700' :
              message.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}
          
          {activeTab === 'upload' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Upload Data File</h2>
                <p className="text-gray-600 mb-4">
                  Upload an Excel spreadsheet (.xlsx, .xls) or CSV file (.csv) with updated specimen data.
                  The file should have the same column structure as the original data.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Select File
                  </label>
                  
                  {file && (
                    <div className="mt-4 text-left">
                      <p className="font-medium">Selected file:</p>
                      <p className="text-gray-600">{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!file || isProcessing}
                  className={`px-4 py-2 rounded-md ${
                    !file || isProcessing
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Process File'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'preview' && processedData.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Preview Changes</h2>
              <p className="text-gray-600 mb-4">
                Review the data before updating the database. The table below shows a sample of the processed data.
              </p>
              
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {processedData.length > 0 && Object.keys(processedData[0] || {}).slice(0, 6).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.slice(0, 5).map((item, index: number) => (
                      <tr key={index}>
                        {Object.keys(item).slice(0, 6).map((key) => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <p className="text-gray-600 mb-6">
                Showing {Math.min(5, processedData.length)} of {processedData.length} records.
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('confirm')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'confirm' && processedData.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Confirm Update</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You are about to update the database with {processedData.length} records.
                      This action will replace the existing data. Are you sure you want to continue?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmUpdate}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-md ${
                    isProcessing
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isProcessing ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataUpdatePage;
