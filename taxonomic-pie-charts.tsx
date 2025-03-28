import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TaxonomicDistributionCharts = () => {
  // State for our three datasets
  const [classData, setClassData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [familyData, setFamilyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Color palette - distinct colors for taxonomy groups
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#83a6ed'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fileContent = await window.fs.readFile('UCLA Comparative Catalog updated locality info.xlsx  Combined colls 5 26 23.csv', { encoding: 'utf8' });
        
        // Parse the CSV
        const Papa = await import('papaparse');
        const parsedData = Papa.default.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        
        // Process taxonomic data
        processData(parsedData.data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processData = (data) => {
    // Process Class data
    const classCounts = {};
    data.forEach(row => {
      let className = row.Class;
      if (className !== null && className !== undefined) {
        className = String(className).trim();
        if (className !== '' && className !== 'Class' && className !== 'Coll. #') {
          // Map numeric class codes to taxonomic names
          const classMapping = {
            '1': 'Chondrichthyes', // Cartilaginous fish
            '2': 'Actinopterygii', // Ray-finned fish
            '3': 'Amphibia',       // Amphibians
            '4': 'Reptilia',       // Reptiles
            '5': 'Aves',           // Birds
            '6': 'Mammalia'        // Mammals
          };
          
          const mappedName = classMapping[className] || className;
          classCounts[mappedName] = (classCounts[mappedName] || 0) + 1;
        }
      }
    });
    
    // Convert to array and sort
    const classArray = Object.entries(classCounts).map(([name, value]) => ({
      name,
      value,
      percentage: 0 // Will calculate below
    }));
    
    classArray.sort((a, b) => b.value - a.value);
    const total = classArray.reduce((sum, item) => sum + item.value, 0);
    classArray.forEach(item => {
      item.percentage = ((item.value / total) * 100).toFixed(1);
    });
    
    setClassData(classArray);
    
    // Process Order data - get top 10 and group others
    const orderCounts = {};
    data.forEach(row => {
      const orderName = row.Order;
      if (orderName && typeof orderName === 'string' && orderName.trim() !== '' && 
          orderName !== 'Order' && !orderName.includes('Spec')) {
        orderCounts[orderName] = (orderCounts[orderName] || 0) + 1;
      }
    });
    
    let orderArray = Object.entries(orderCounts).map(([name, value]) => ({
      name,
      value,
      percentage: 0
    }));
    
    orderArray.sort((a, b) => b.value - a.value);
    
    // Take top 10 orders and group the rest
    const top10Orders = orderArray.slice(0, 10);
    const otherOrders = orderArray.slice(10);
    const otherOrdersTotal = otherOrders.reduce((sum, item) => sum + item.value, 0);
    
    const finalOrderData = [
      ...top10Orders,
      { name: "Other Orders", value: otherOrdersTotal, percentage: 0 }
    ];
    
    const orderTotal = finalOrderData.reduce((sum, item) => sum + item.value, 0);
    finalOrderData.forEach(item => {
      item.percentage = ((item.value / orderTotal) * 100).toFixed(1);
    });
    
    setOrderData(finalOrderData);
    
    // Process Family data - similar approach
    const familyCounts = {};
    data.forEach(row => {
      const familyName = row.Family;
      if (familyName && typeof familyName === 'string' && familyName.trim() !== '' && 
          familyName !== 'Family' && !familyName.includes('Class')) {
        familyCounts[familyName] = (familyCounts[familyName] || 0) + 1;
      }
    });
    
    let familyArray = Object.entries(familyCounts).map(([name, value]) => ({
      name,
      value,
      percentage: 0
    }));
    
    familyArray.sort((a, b) => b.value - a.value);
    
    // Take top 10 families and group the rest
    const top10Families = familyArray.slice(0, 10);
    const otherFamilies = familyArray.slice(10);
    const otherFamiliesTotal = otherFamilies.reduce((sum, item) => sum + item.value, 0);
    
    const finalFamilyData = [
      ...top10Families,
      { name: "Other Families", value: otherFamiliesTotal, percentage: 0 }
    ];
    
    const familyTotal = finalFamilyData.reduce((sum, item) => sum + item.value, 0);
    finalFamilyData.forEach(item => {
      item.percentage = ((item.value / familyTotal) * 100).toFixed(1);
    });
    
    setFamilyData(finalFamilyData);
  };

  const renderCustomizedLabel = (entry) => {
    return `${entry.name}: ${entry.percentage}%`;
  };

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

export default TaxonomicDistributionCharts;