/**
 * ZOARCH Lab Inventory - Database Management
 * This file handles all data storage, retrieval, and manipulation
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
     * @returns {Promise} Promise that resolves when data is loaded
     */
    function init() {
        return new Promise((resolve, reject) => {
            // Try to load data from localStorage
            const savedData = localStorage.getItem(STORAGE_KEY);
            
            if (savedData) {
                try {
                    inventoryData = JSON.parse(savedData);
                    console.log('Data loaded from localStorage:', inventoryData.length, 'records');
                    resolve(inventoryData);
                } catch (error) {
                    console.error('Error parsing stored data:', error);
                    loadDemoData()
                        .then(resolve)
                        .catch(reject);
                }
            } else {
                // If no data in localStorage, load demo data
                loadDemoData()
                    .then(resolve)
                    .catch(reject);
            }
        });
    }
    
    /**
     * Load demo data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    function loadDemoData() {
        return new Promise((resolve, reject) => {
            // If running locally, fetch demo data
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
     * @param {File} file The file to import
     * @param {boolean} append Whether to append to or replace existing data
     * @returns {Promise} Promise that resolves with the imported data
     */
    function importFromFile(file, append = false) {
        return new Promise((resolve, reject) => {
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
                    
                    // Standardize field names for consistency
                    inventoryData = standardizeFieldNames(inventoryData);
                    
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
        });
    }
    
    /**
     * Standardize field names across imported data
     * @param {Array} data The data array to standardize
     * @returns {Array} Standardized data array
     */
    function standardizeFieldNames(data) {
        const fieldMappings = {
            // Map various possible column names to our standardized names
            'Owner': ['owner', 'owner_id', 'ownerid'],
            'Catalog #': ['catalog', 'catalog_number', 'cat_no', 'catalog_no', 'catalogno'],
            'Order': ['order', 'order_name', 'taxon_order'],
            'Family': ['family', 'family_name', 'taxon_family'],
            'Genus': ['genus', 'genus_name', 'taxon_genus'],
            'Species': ['species', 'species_name', 'taxon_species', 'specific_name'],
            'Common Name': ['common_name', 'commonname', 'common', 'vernacular'],
            '# of specimens': ['specimens', 'specimen_count', 'count', 'number_of_specimens', 'quantity'],
            'Location': ['location', 'locality', 'site', 'collection_site'],
            'Country': ['country', 'nation', 'country_name'],
            'How collected': ['collected', 'collection_method', 'acquisition', 'how_collected'],
            'Date collected': ['date', 'collection_date', 'date_collected']
        };
        
        return data.map(item => {
            const standardItem = {};
            
            // Iterate through each field mapping
            Object.entries(fieldMappings).forEach(([standardField, alternateFields]) => {
                // Check if item contains the standard field name
                if (item[standardField] !== undefined) {
                    standardItem[standardField] = item[standardField];
                } else {
                    // Check for alternate field names
                    for (const altField of alternateFields) {
                        if (item[altField] !== undefined) {
                            standardItem[standardField] = item[altField];
                            break;
                        }
                    }
                }
            });
            
            // Copy any remaining fields
            Object.entries(item).forEach(([key, value]) => {
                if (standardItem[key] === undefined) {
                    standardItem[key] = value;
                }
            });
            
            return standardItem;
        });
    }
    
    /**
     * Export data to Excel
     * @returns {Blob} Excel file blob
     */
    function exportToExcel() {
        const worksheet = XLSX.utils.json_to_sheet(inventoryData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    
    /**
     * Export data to CSV
     * @returns {Blob} CSV file blob
     */
    function exportToCSV() {
        const worksheet = XLSX.utils.json_to_sheet(inventoryData);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        return new Blob([csvOutput], { type: 'text/csv' });
    }
    
    /**
     * Get all inventory data
     * @returns {Array} The inventory data array
     */
    function getAllData() {
        return inventoryData;
    }
    
    /**
     * Get a specific inventory item by catalog number
     * @param {string|number} catalogNumber The catalog number to search for
     * @returns {Object|null} The inventory item or null if not found
     */
    function getItemByCatalog(catalogNumber) {
        const catNum = String(catalogNumber).trim();
        return inventoryData.find(item => 
            String(item['Catalog #']).trim() === catNum
        ) || null;
    }
    
    /**
     * Add a new inventory item
     * @param {Object} item The item to add
     * @returns {boolean} Success indicator
     */
    function addItem(item) {
        // Check if item with same catalog number already exists
        if (item['Catalog #'] && getItemByCatalog(item['Catalog #'])) {
            console.warn('Item with catalog number', item['Catalog #'], 'already exists');
            return false;
        }
        
        inventoryData.push(item);
        return saveToLocalStorage();
    }
    
    /**
     * Update an existing inventory item
     * @param {string|number} catalogNumber The catalog number of the item to update
     * @param {Object} updatedData The updated data
     * @returns {boolean} Success indicator
     */
    function updateItem(catalogNumber, updatedData) {
        const index = inventoryData.findIndex(item => 
            String(item['Catalog #']).trim() === String(catalogNumber).trim()
        );
        
        if (index === -1) {
            console.warn('Item with catalog number', catalogNumber, 'not found');
            return false;
        }
        
        inventoryData[index] = { ...inventoryData[index], ...updatedData };
        return saveToLocalStorage();
    }
    
    /**
     * Delete an inventory item
     * @param {string|number} catalogNumber The catalog number of the item to delete
     * @returns {boolean} Success indicator
     */
    function deleteItem(catalogNumber) {
        const initialLength = inventoryData.length;
        
        inventoryData = inventoryData.filter(item => 
            String(item['Catalog #']).trim() !== String(catalogNumber).trim()
        );
        
        if (inventoryData.length === initialLength) {
            console.warn('Item with catalog number', catalogNumber, 'not found');
            return false;
        }
        
        return saveToLocalStorage();
    }
    
    /**
     * Search for inventory items
     * @param {Object} criteria Search criteria
     * @returns {Array} Matching items
     */
    function searchItems(criteria) {
        return inventoryData.filter(item => {
            for (const [key, value] of Object.entries(criteria)) {
                if (!item[key] || !String(item[key]).toLowerCase().includes(String(value).toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    }
    
    /**
     * Get unique values for a field
     * @param {string} field The field to get unique values for
     * @returns {Array} Array of unique values
     */
    function getUniqueValues(field) {
        const values = inventoryData
            .map(item => item[field])
            .filter(value => value !== undefined && value !== null && value !== '');
            
        return [...new Set(values)].sort();
    }
    
    /**
     * Get summary statistics about the inventory
     * @returns {Object} Summary statistics
     */
    function getSummaryStats() {
        return {
            totalItems: inventoryData.length,
            totalSpecimens: inventoryData.reduce((sum, item) => sum + (parseInt(item['# of specimens']) || 1), 0),
            uniqueSpecies: getUniqueValues('Species').length,
            uniqueGenera: getUniqueValues('Genus').length,
            uniqueFamilies: getUniqueValues('Family').length,
            uniqueOrders: getUniqueValues('Order').length,
            uniqueLocations: getUniqueValues('Location').length,
            uniqueCountries: getUniqueValues('Country').length
        };
    }
    
    /**
     * Get data for charts and visualizations
     * @returns {Object} Chart data
     */
    function getChartData() {
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
        
        // Sort by count and get top 10 families
        const topFamilies = Object.entries(familyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        // For Geographic chart
        const countryCounts = {};
        inventoryData.forEach(item => {
            const country = item.Country || 'Unknown';
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
        
        // For Timeline chart (if date information is available)
        const timelineCounts = {};
        inventoryData.forEach(item => {
            if (item['Date collected']) {
                try {
                    const date = new Date(item['Date collected']);
                    const year = date.getFullYear();
                    timelineCounts[year] = (timelineCounts[year] || 0) + 1;
                } catch (e) {
                    // Skip items with invalid dates
                }
            }
        });
        
        return {
            orderData: orderCounts,
            familyData: topFamilies,
            countryData: countryCounts,
            timelineData: timelineCounts
        };
    }
    
    // Public API
    return {
        init,
        importFromFile,
        exportToExcel,
        exportToCSV,
        getAllData,
        getItemByCatalog,
        addItem,
        updateItem,
        deleteItem,
        searchItems,
        getUniqueValues,
        getSummaryStats,
        getChartData
    };
})();
