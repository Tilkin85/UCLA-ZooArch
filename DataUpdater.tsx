import React, { useState } from 'react';
import { DataService } from '../utils/DataService';

interface UpdaterProps {
  onUpdateComplete: () => void;
}

const DataUpdater: React.FC<UpdaterProps> = ({ onUpdateComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [updateMethod, setUpdateMethod] = useState<'excel' | 'csv'>('excel');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (updateMethod === 'excel' && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls')) {
        setMessage({
          text: 'Please select a valid Excel file (.xlsx or .xls)',
          type: 'error'
        });
        return;
      }
      
      if (updateMethod === 'csv' && !selectedFile.name.endsWith('.csv')) {
        setMessage({
          text: 'Please select a valid CSV file (.csv)',
          type: 'error'
        });
        return;
      }
      
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        text: 'Please select a file first',
        type: 'error'
      });
      return;
    }

    setIsUploading(true);
    setMessage({
      text: 'Processing file...',
      type: 'info'
    });

    try {
      let result;
      
      if (updateMethod === 'excel') {
        result = await DataService.processExcelUpdate(file);
      } else {
        // For CSV, we need to read the file content
        const fileContent = await readFileAsText(file);
        result = await DataService.processCSVUpdate(fileContent);
      }

      if (result.success) {
        setMessage({
          text: 'Data updated successfully!',
          type: 'success'
        });
        
        // Notify parent component that update is complete
        onUpdateComplete();
      } else {
        setMessage({
          text: result.message || 'Error updating data',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsUploading(false);
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
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Update Specimen Database</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Upload a new Excel spreadsheet or CSV file to update the specimen database.
          The file should have the same column structure as the original data.
        </p>
        
        <div className="flex space-x-4 mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="updateMethod"
              checked={updateMethod === 'excel'}
              onChange={() => setUpdateMethod('excel')}
            />
            <span className="ml-2">Excel File (.xlsx, .xls)</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="updateMethod"
              checked={updateMethod === 'csv'}
              onChange={() => setUpdateMethod('csv')}
            />
            <span className="ml-2">CSV File (.csv)</span>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select {updateMethod === 'excel' ? 'Excel' : 'CSV'} File
        </label>
        <input
          type="file"
          accept={updateMethod === 'excel' ? ".xlsx,.xls" : ".csv"}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
          disabled={isUploading}
        />
      </div>
      
      {file && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Selected file:</span> {file.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`px-4 py-2 rounded-md ${
            !file || isUploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Processing...' : 'Update Database'}
        </button>
      </div>
    </div>
  );
};

export default DataUpdater;
