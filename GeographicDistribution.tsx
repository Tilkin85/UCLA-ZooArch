import React, { useState, useEffect } from 'react';
import { DataService } from '../utils/DataService';

const GeographicDistribution = () => {
  const [countryData, setCountryData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpecimens, setTotalSpecimens] = useState<number>(0);
  const [missingGeoInfo, setMissingGeoInfo] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get geographic summary data
        const geoSummary = await DataService.getGeographicSummary();
        setCountryData(geoSummary.countries);
        
        // Get full dataset to calculate totals
        const fullData = await DataService.getFullDataset();
        setTotalSpecimens(fullData.length);
        
        // Calculate missing geographic info
        const missingGeo = fullData.filter(specimen => 
          (!specimen.Country || specimen.Country === '') && 
          (!specimen['State/Province'] || specimen['State/Province'] === '')
        ).length;
        
        setMissingGeoInfo(missingGeo);
        setLoading(false);
      } catch (error) {
        console.error('Error loading geographic data:', error);
        setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Color scale for the map
  const getColor = (count: number): string => {
    if (!count) return '#f0f0f0';
    if (count < 10) return '#EDF8FB';
    if (count < 50) return '#B3CDE3';
    if (count < 100) return '#8C96C6';
    if (count < 200) return '#8856A7';
    if (count < 500) return '#810F7C';
    return '#4D004B';
  };

  // Sort countries by specimen count in descending order
  const sortedCountries = Object.entries(countryData)
    .sort((a, b) => b[1] - a[1])
    .filter(([country]) => country !== 'Pacific Ocean' && country !== 'Eastern Pacific Ocean' && country !== 'Pacific' && country !== 'IndoPac');

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading specimen data...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Geographic Distribution of Specimens</h2>
      
      <div className="mb-4">
        <p>Total specimens: {totalSpecimens}</p>
        <p>Specimens with missing geographic information: {missingGeoInfo} ({((missingGeoInfo/totalSpecimens)*100).toFixed(1)}%)</p>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold mb-2">Specimen Count by Country</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Country</th>
                  <th className="text-right p-2">Count</th>
                  <th className="text-right p-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map(([country, count]) => (
                  <tr key={country} className="border-b border-gray-200">
                    <td className="p-2">{country}</td>
                    <td className="text-right p-2">{count}</td>
                    <td className="text-right p-2">{((count/totalSpecimens)*100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Color Legend</h4>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#EDF8FB'}}></div>
                  <span className="text-sm">1-9</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#B3CDE3'}}></div>
                  <span className="text-sm">10-49</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#8C96C6'}}></div>
                  <span className="text-sm">50-99</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#8856A7'}}></div>
                  <span className="text-sm">100-199</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#810F7C'}}></div>
                  <span className="text-sm">200-499</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{backgroundColor: '#4D004B'}}></div>
                  <span className="text-sm">500+</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Top 5 Countries</h4>
              <div className="space-y-2">
                {sortedCountries.slice(0, 5).map(([country, count]) => (
                  <div key={country} className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                      <div 
                        className="h-4 rounded-full" 
                        style={{
                          backgroundColor: getColor(count),
                          width: `${Math.min(100, (count / Math.max(...sortedCountries.map(c => c[1]))) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{country}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">World Map of Specimen Distribution</h3>
        <div className="border border-gray-300 rounded p-4">
          <div className="text-center italic text-gray-600">
            Simple world map representation - Countries are colored based on specimen count
          </div>
          <div className="overflow-x-auto mt-2">
            <svg viewBox="0 0 1000 500" className="w-full">
              {/* World map visualization */}
              <rect x="0" y="0" width="1000" height="500" fill="#f0f0f0" />
              
              {/* Simplified continent outlines */}
              {/* North America */}
              <path d="M 150,120 L 250,120 L 300,200 L 250,280 L 150,280 Z" 
                fill={getColor(countryData['USA'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="200" y="200" textAnchor="middle" fontSize="12">USA</text>
              
              {/* Central America */}
              <path d="M 250,280 L 270,300 L 290,330 L 250,360 L 230,340 Z" 
                fill={getColor(countryData['Mexico'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="260" y="320" textAnchor="middle" fontSize="10">Mexico</text>
              
              {/* South America */}
              <path d="M 290,330 L 310,380 L 350,450 L 250,450 L 230,380 Z" 
                fill={getColor(countryData['Peru'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="290" y="410" textAnchor="middle" fontSize="12">Peru</text>
              
              {/* Europe */}
              <path d="M 470,120 L 550,120 L 550,180 L 470,180 Z" 
                fill={getColor(countryData['Poland'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="510" y="150" textAnchor="middle" fontSize="10">Europe</text>
              
              {/* Africa */}
              <path d="M 470,200 L 550,200 L 550,350 L 470,350 Z" 
                fill={getColor(countryData['Egypt'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="510" y="275" textAnchor="middle" fontSize="12">Africa</text>
              
              {/* Asia */}
              <path d="M 600,120 L 750,120 L 750,280 L 600,280 Z" 
                fill={getColor(countryData['Japan'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="675" y="200" textAnchor="middle" fontSize="12">Asia</text>
              
              {/* Australia */}
              <path d="M 750,350 L 850,350 L 850,450 L 750,450 Z" 
                fill={getColor(countryData['Australia'] || 0)} 
                stroke="#fff" 
                strokeWidth="2" />
              <text x="800" y="400" textAnchor="middle" fontSize="12">Australia</text>
              
              {/* Panama - Central America highlight */}
              <circle cx="280" cy="340" r="10" 
                fill={getColor(countryData['Panama'] || 0)} 
                stroke="#fff" 
                strokeWidth="1" />
              <text x="280" y="340" textAnchor="middle" fontSize="8" fill="#fff">Panama</text>
            </svg>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Note: This is a simplified representation. The actual geographic distribution would require a more detailed map.</p>
            <p>Ocean specimens (Pacific, Eastern Pacific, IndoPac) are not shown on this map.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicDistribution;
