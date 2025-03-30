/**
 * ZOARCH Lab Inventory - Database Management (Simplified)
 */

// Database namespace
const Database = (function() {
    // Constants
    const STORAGE_KEY = 'zoarch_inventory_data';
    const DEMO_DATA_URL = 'data/sample_inventory.json';
    
    // Private variables
    let inventoryData = [];
    
    /**
     * Initialize the database
     */
    function init() {
        return new Promise((resolve, reject) => {
            try {
                // Try to load data from localStorage
                const savedData = localStorage.getItem(STORAGE_KEY);
                
                if (savedData) {
                    try {
                        inventoryData = JSON.parse(savedData);
                        console.log('Data loaded from localStorage:', inventoryData.length, 'records');
                        resolve(inventoryData);
                    } catch (error) {
                        console.error('Error parsing stored data:', error);
                        loadDemoData().then(resolve).catch(reject);
                    }
                } else {
                    // If no data in localStorage, load demo data
                    loadDemoData().then(resolve).catch(reject);
                }
            } catch (error) {
                console.error('Database initialization error:', error);
                resolve([]);
            }
        });
    }
    
    /**
     * Load demo data from JSON file
     */
    function loadDemoData() {
        return new Promise((resolve, reject) => {
            try {
                console.log('No data found in localStorage, checking for demo data...');
                
                fetch(DEMO_DATA_URL)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Demo data not available');
                        }
                        return response.json();
                    })
                    .then(data => {
                        inventoryData = data;
                        saveToLocalStorage();
                        console.log('Demo data loaded:', inventoryData.length, 'records');
                        resolve(inventoryData);
                    })
                    .catch(error => {
                        console.warn('Could not load demo data:', error);
                        // Create empty inventory
                        inventoryData = [];
                        saveToLocalStorage();
                        resolve(inventoryData);
                    });
            } catch (error) {
                console.error('Load demo data error:', error);
                resolve([]);
            }
        });
    }
    
    /**
     * Save current data to localStorage
     */
    function saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryData));
            console.log('Data saved to localStorage:', inventoryData.length, 'records');
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Import data from Excel/CSV file
     */
    function importFromFile(file, append = false) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const data = e.target.result;
                        let importedData = [];
                        
                        if (file.name.endsWith('.csv')) {
                            // Parse CSV
                            const rows = data.split('\n');
                            const headers = rows[0].split(',').map(header => header.trim());
                            
                            for (let i = 1; i < rows.length; i++) {
                                if (rows[i].trim() === '') continue;
                                
                                const values = rows[i].split(',');
                                const entry = {};
                                
                                headers.forEach((header, index) => {
                                    entry[header] = values[index] ? values[index].trim() : '';
                                });
                                
                                importedData.push(entry);
                            }
                        } else {
                            // Parse Excel using SheetJS
                            const workbook = XLSX.read(data, { type: 'binary' });
                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                            importedData = XLSX.utils.sheet_to_json(firstSheet);
                        }
                        
                        if (append) {
                            inventoryData = [...inventoryData, ...importedData];
                        } else {
                            inventoryData = importedData;
                        }
                        
                        saveToLocalStorage();
                        resolve(inventoryData);
                    } catch (error) {
                        console.error('Error importing data:', error);
                        reject(error);
                    }
                };
                
                reader.onerror = function(error) {
                    console.error('Error reading file:', error);
                    reject(error);
                };
                
                if (file.name.endsWith('.csv')) {
                    reader.readAsText(file);
                } else {
                    reader.readAsBinaryString(file);
                }
            } catch (error) {
                console.error('Import file error:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Get all inventory data
     */
    function getAllData() {
        return inventoryData;
    }
    
    /**
     * Get a specific inventory item by catalog number
     */
    function getItemByCatalog(catalogNumber) {
        try {
            const catNum = String(catalogNumber).trim();
            return inventoryData.find(item => 
                String(item['Catalog #']).trim() === catNum
            ) || null;
        } catch (error) {
            console.error('Error getting item by catalog:', error);
            return null;
        }
    }
    
    /**
     * Add a new inventory item
     */
    function addItem(item) {
        try {
            // Check if item with same catalog number already exists
            if (item['Catalog #'] && getItemByCatalog(item['Catalog #'])) {
                console.warn('Item with catalog number', item['Catalog #'], 'already exists');
                return false;
            }
            
            inventoryData.push(item);
            return saveToLocalStorage();
        } catch (error) {
            console.error('Error adding item:', error);
            return false;
        }
    }
    
    /**
     * Update an existing inventory item
     */
    function updateItem(catalogNumber, updatedData) {
        try {
            const index = inventoryData.findIndex(item => 
                String(item['Catalog #']).trim() === String(catalogNumber).trim()
            );
            
            if (index === -1) {
                console.warn('Item with catalog number', catalogNumber, 'not found');
                return false;
            }
            
            inventoryData[index] = { ...inventoryData[index], ...updatedData };
            return saveToLocalStorage();
        } catch (error) {
            console.error('Error updating item:', error);
            return false;
        }
    }
    
    /**
     * Delete an inventory item
     */
    function deleteItem(catalogNumber) {
        try {
            const initialLength = inventoryData.length;
            
            inventoryData = inventoryData.filter(item => 
                String(item['Catalog #']).trim() !== String(catalogNumber).trim()
            );
            
            if (inventoryData.length === initialLength) {
                console.warn('Item with catalog number', catalogNumber, 'not found');
                return false;
            }
            
            return saveToLocalStorage();
        } catch (error) {
            console.error('Error deleting item:', error);
            return false;
        }
    }
    
    /**
     * Get unique values for a field
     */
    function getUniqueValues(field) {
        try {
            const values = inventoryData
                .map(item => item[field])
                .filter(value => value !== undefined && value !== null && value !== '');
                
            return [...new Set(values)].sort();
        } catch (error) {
            console.error('Error getting unique values:', error);
            return [];
        }
    }
    
    /**
     * Get summary statistics about the inventory
     */
    function getSummaryStats() {
        try {
            return {
                totalItems: inventoryData.length,
                totalSpecimens: inventoryData.reduce((sum, item) => sum + (parseInt(item['# of specimens']) || 1), 0),
                uniqueSpecies: getUniqueValues('Species').length,
                uniqueGenera: getUniqueValues('Genus').length,
                uniqueFamilies: getUniqueValues('Family').length,
                uniqueOrders: getUniqueValues('Order').length
            };
        } catch (error) {
            console.error('Error getting summary stats:', error);
            return {
                totalItems: 0,
                totalSpecimens: 0,
                uniqueSpecies: 0,
                uniqueGenera: 0,
                uniqueFamilies: 0,
                uniqueOrders: 0
            };
        }
    }
    
    /**
     * Get data for charts and visualizations
     */
    function getChartData() {
        try {
            // For Orders chart
            const orderCounts = {};
            inventoryData.forEach(item => {
                const order = item.Order || 'Unknown';
                orderCounts[order] = (orderCounts[order] || 0) + 1;
            });
            
            // For Families chart
            const familyCounts = {};
            inventoryData.forEach(item => {
                const family = item.Family || 'Unknown';
                familyCounts[family] = (familyCounts[family] || 0) + 1;
            });
            
            // For Geographic chart
            const countryCounts = {};
            inventoryData.forEach(item => {
                const country = item.Country || 'Unknown';
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            });
            
            // Sort by count and get top 10 families
            const topFamilies = Object.entries(familyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});
            
            return {
                orderData: orderCounts,
                familyData: topFamilies,
                countryData: countryCounts,
                timelineData: {}
            };
        } catch (error) {
            console.error('Error generating chart data:', error);
            return {
                orderData: {},
                familyData: {},
                countryData: {},
                timelineData: {}
            };
        }
    }
    
    // Public API
    return {
        init,
        importFromFile,
        getAllData,
        getItemByCatalog,
        addItem,
        updateItem,
        deleteItem,
        getUniqueValues,
        getSummaryStats,
        getChartData
    };
})();
