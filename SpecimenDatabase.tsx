import React, { useState, useEffect } from 'react';
import { DataService } from '../utils/DataService';

interface Specimen {
  'Collection ID': string;
  'Collector': string;
  'Class': string;
  'Order': string;
  'Family': string;
  'Genus': string;
  'Species': string;
  'Common Name': string;
  'Country': string;
  'State/Province': string;
  'Locality': string;
  'Collection Notes': string;
  [key: string]: any;
}

const SpecimenDatabase: React.FC = () => {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [filteredSpecimens, setFilteredSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(25);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await DataService.getFullDataset();
        setSpecimens(data);
        setFilteredSpecimens(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading specimen data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Filter specimens based on search term and category
    const filtered = specimens.filter(specimen => {
      if (searchTerm === '') return true;
      
      if (filterCategory === 'all') {
        // Search in all fields
        return Object.values(specimen).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        // Search in specific field
        return specimen[filterCategory] && 
               specimen[filterCategory].toString().toLowerCase().includes(searchTerm.toLowerCase());
      }
    });
    
    setFilteredSpecimens(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchTerm, filterCategory, specimens]);

  // Get current specimens for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSpecimens = filteredSpecimens.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSpecimens.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading specimen data...</div>;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Specimen Database</h2>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search specimens..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Fields</option>
            <option value="Collection ID">Collection ID</option>
            <option value="Class">Class</option>
            <option value="Order">Order</option>
            <option value="Family">Family</option>
            <option value="Genus">Genus</option>
            <option value="Species">Species</option>
            <option value="Common Name">Common Name</option>
            <option value="Country">Country</option>
            <option value="State/Province">State/Province</option>
            <option value="Locality">Locality</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSpecimens.length)} of {filteredSpecimens.length} specimens
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left border-b">Collection ID</th>
              <th className="px-4 py-2 text-left border-b">Class</th>
              <th className="px-4 py-2 text-left border-b">Order</th>
              <th className="px-4 py-2 text-left border-b">Family</th>
              <th className="px-4 py-2 text-left border-b">Genus</th>
              <th className="px-4 py-2 text-left border-b">Species</th>
              <th className="px-4 py-2 text-left border-b">Common Name</th>
              <th className="px-4 py-2 text-left border-b">Country</th>
              <th className="px-4 py-2 text-left border-b">State/Province</th>
            </tr>
          </thead>
          <tbody>
            {currentSpecimens.map((specimen, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2 border-b">{specimen['Collection ID']}</td>
                <td className="px-4 py-2 border-b">{specimen['Class']}</td>
                <td className="px-4 py-2 border-b">{specimen['Order']}</td>
                <td className="px-4 py-2 border-b">{specimen['Family']}</td>
                <td className="px-4 py-2 border-b">{specimen['Genus']}</td>
                <td className="px-4 py-2 border-b">{specimen['Species']}</td>
                <td className="px-4 py-2 border-b">{specimen['Common Name']}</td>
                <td className="px-4 py-2 border-b">{specimen['Country']}</td>
                <td className="px-4 py-2 border-b">{specimen['State/Province']}</td>
              </tr>
            ))}
            {currentSpecimens.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                  No specimens found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav>
            <ul className="flex space-x-2">
              <li>
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
              </li>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                // Show pages around current page
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <li key={i}>
                    <button
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SpecimenDatabase;
