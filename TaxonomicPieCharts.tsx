import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DataService } from '../utils/DataService';

interface ChartDataItem {
  name: string;
  value: number;
  percentage: string;
}

const TaxonomicPieCharts: React.FC = () => {
  // State for our three datasets
  const [classData, setClassData] = useState<ChartDataItem[]>([]);
  const [orderData, setOrderData] = useState<ChartDataItem[]>([]);
  const [familyData, setFamilyData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Color palette - distinct colors for taxonomy groups
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#83a6ed'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const taxonomicSummary = await DataService.getTaxonomicSummary();
        
        // Process Class data
        const classArray: ChartDataItem[] = Object.entries(taxonomicSummary.classes).map(([name, value]) => ({
          name,
          value,
          percentage: '0' // Will calculate below
        }));
        
        classArray.sort((a, b) => b.value - a.value);
        const classTotal = classArray.reduce((sum, item) => sum + item.value, 0);
        classArray.forEach(item => {
          item.percentage = ((item.value / classTotal) * 100).toFixed(1);
        });
        
        setClassData(classArray);
        
        // Process Order data - get top 10 and group others
        let orderArray: ChartDataItem[] = Object.entries(taxonomicSummary.orders).map(([name, value]) => ({
          name,
          value,
          percentage: '0'
        }));
        
        orderArray.sort((a, b) => b.value - a.value);
        
        // Take top 10 orders and group the rest
        const top10Orders = orderArray.slice(0, 10);
        const otherOrders = orderArray.slice(10);
        const otherOrdersTotal = otherOrders.reduce((sum, item) => sum + item.value, 0);
        
        const finalOrderData: ChartDataItem[] = [
          ...top10Orders,
          { name: "Other Orders", value: otherOrdersTotal, percentage: '0' }
        ];
        
        const orderTotal = finalOrderData.reduce((sum, item) => sum + item.value, 0);
        finalOrderData.forEach(item => {
          item.percentage = ((item.value / orderTotal) * 100).toFixed(1);
        });
        
        setOrderData(finalOrderData);
        
        // Process Family data - similar approach
        let familyArray: ChartDataItem[] = Object.entries(taxonomicSummary.families).map(([name, value]) => ({
          name,
          value,
          percentage: '0'
        }));
        
        familyArray.sort((a, b) => b.value - a.value);
        
        // Take top 10 families and group the rest
        const top10Families = familyArray.slice(0, 10);
        const otherFamilies = familyArray.slice(10);
        const otherFamiliesTotal = otherFamilies.reduce((sum, item) => sum + item.value, 0);
        
        const finalFamilyData: ChartDataItem[] = [
          ...top10Families,
          { name: "Other Families", value: otherFamiliesTotal, percentage: '0' }
        ];
        
        const familyTotal = finalFamilyData.reduce((sum, item) => sum + item.value, 0);
        finalFamilyData.forEach(item => {
          item.percentage = ((item.value / familyTotal) * 100).toFixed(1);
        });
        
        setFamilyData(finalFamilyData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading taxonomic data...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-2xl font-bold mb-8">Taxonomic Distribution of Specimens</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Class Distribution */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Class Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {classData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} specimens (${props.payload.percentage}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Class Summary:</h3>
            <ul className="text-sm">
              {classData.map((item, index) => (
                <li key={index} className="mb-1">
                  <span className="font-medium">{item.name}:</span> {item.value} specimens ({item.percentage}%)
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Order Distribution */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Order Distribution (Top 10)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => {
                    // Only show labels for items with enough percentage to be readable
                    return parseFloat(percentage) > 3 ? `${name}: ${percentage}%` : '';
                  }}
                >
                  {orderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} specimens (${props.payload.percentage}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Top 10 Orders:</h3>
            <ul className="text-sm">
              {orderData.slice(0, 10).map((item, index) => (
                <li key={index} className="mb-1">
                  <span className="font-medium">{item.name}:</span> {item.value} specimens ({item.percentage}%)
                </li>
              ))}
              {orderData.length > 10 && (
                <li className="mb-1">
                  <span className="font-medium">{orderData[10].name}:</span> {orderData[10].value} specimens ({orderData[10].percentage}%)
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Family Distribution */}
        <div className="bg-white p-4 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-center">Family Distribution (Top 10)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => {
                    // Only show labels for items with enough percentage to be readable
                    return parseFloat(percentage) > 2 ? `${name}: ${percentage}%` : '';
                  }}
                >
                  {familyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} specimens (${props.payload.percentage}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Top 10 Families:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 text-sm">
              {familyData.slice(0, 10).map((item, index) => (
                <li key={index} className="mb-1">
                  <span className="font-medium">{item.name}:</span> {item.value} specimens ({item.percentage}%)
                </li>
              ))}
              {familyData.length > 10 && (
                <li className="mb-1 md:col-span-2">
                  <span className="font-medium">{familyData[10].name}:</span> {familyData[10].value} specimens ({familyData[10].percentage}%)
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxonomicPieCharts;
