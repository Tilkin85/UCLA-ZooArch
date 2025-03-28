import React, { useState } from 'react';
import './App.css';
import TaxonomicPieCharts from './components/TaxonomicPieCharts';
import GeographicDistribution from './components/GeographicDistribution';
import SpecimenDatabase from './components/SpecimenDatabase';
import DataUpdater from './components/DataUpdater';

function App() {
  const [activeTab, setActiveTab] = useState<'taxonomic' | 'geographic' | 'database' | 'update'>('taxonomic');
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);

  const handleUpdateComplete = () => {
    setDataUpdated(true);
    // Reset after a short delay
    setTimeout(() => setDataUpdated(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">UCLA Comparative Catalog Visualization</h1>
          <p className="mt-2">Interactive visualization of specimen data</p>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-8 py-4">
            <li>
              <button 
                className={`px-4 py-2 rounded-md ${activeTab === 'taxonomic' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('taxonomic')}
              >
                Taxonomic Distribution
              </button>
            </li>
            <li>
              <button 
                className={`px-4 py-2 rounded-md ${activeTab === 'geographic' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('geographic')}
              >
                Geographic Distribution
              </button>
            </li>
            <li>
              <button 
                className={`px-4 py-2 rounded-md ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('database')}
              >
                Specimen Database
              </button>
            </li>
            <li>
              <button 
                className={`px-4 py-2 rounded-md ${activeTab === 'update' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('update')}
              >
                Update Data
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {dataUpdated && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 container mx-auto mt-4">
          <p className="font-bold">Success!</p>
          <p>The database has been updated successfully. Visualizations will reflect the new data.</p>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'taxonomic' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <TaxonomicPieCharts />
          </div>
        )}
        
        {activeTab === 'geographic' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <GeographicDistribution />
          </div>
        )}
        
        {activeTab === 'database' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <SpecimenDatabase />
          </div>
        )}

        {activeTab === 'update' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <DataUpdater onUpdateComplete={handleUpdateComplete} />
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} UCLA Comparative Catalog</p>
          <p className="text-sm mt-2">Data can be updated by uploading new Excel spreadsheets through the update mechanism.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
