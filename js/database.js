/**
 * ZOARCH Lab Inventory - Database Management with GitHub Integration (Fixed)
 */

// Database namespace
const Database = (function() {
    // Constants
    const STORAGE_KEY = 'zoarch_inventory_data';
    const DEMO_DATA_URL = 'data/sample_inventory.json';
    
    // Private variables
    let inventoryData = [];
    let storageMode = 'local'; // 'local' or 'github'
    
    /**
     * Initialize the database
     */
    function init(config = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Initializing database...');
                
                // Check if GitHub is enabled in localStorage
                const useGitHub = localStorage.getItem('zoarch_use_github') === 'true';
                
                // Set the storage mode from config or localStorage
                if (config.useGitHub === true || useGitHub) {
                    storageMode = 'github';
                    console.log('GitHub storage mode is enabled');
                } else {
                    console.log('Using local storage mode');
                }
                
                // Try to initialize GitHub storage if requested
                if (storageMode === 'github' && typeof GitHubStorage !== 'undefined') {
                    console.log('Attempting to initialize GitHub storage...');
                    
                    // Try to load GitHub configuration from localStorage
                    const githubConfig = {
                        owner: localStorage.getItem('zoarch_github_owner'),
                        repo: localStorage.getItem('zoarch_github_repo'),
                        branch: localStorage.getItem('zoarch_github_branch') || 'main',
                        path: localStorage.getItem('zoarch_github_path') || 'data/inventory.json',
                        token: sessionStorage.getItem('zoarch_github_token')
                    };
                    
                    // Combine with any config provided directly
                    const combinedConfig = { ...githubConfig, ...(config.github || {}) };
                    
                    // Initialize GitHub storage
                    const gitHubInitialized = await GitHubStorage.init(combinedConfig);
                    
                    // If GitHub is initialized and has a token, load data from there
                    if (gitHubInitialized && GitHubStorage.hasToken()) {
                        try {
                            console.log('Loading data from GitHub...');
                            const gitHubData = await GitHubStorage.getInventoryData();
                            inventoryData = gitHubData;
                            console.log('Data loaded from GitHub:', inventoryData.length, 'records');
                            
                            // Update local storage as a backup
                            saveToLocalStorage();
                            
                            resolve(inventoryData);
                            return;
                        } catch (gitHubError) {
                            console.warn('Failed to load from GitHub, falling back to local storage:', gitHubError);
                            storageMode = 'local';
                        }
                    } else {
                        console.log('GitHub storage not initialized or missing token, using local storage');
                        storageMode = 'local';
                    }
                }
                
                // If we're here, use local storage
                console.log('Attempting to load data from local storage...');
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
                    console.log('No data in localStorage, loading demo data...');
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
                        saveData();
                        console.log('Demo data loaded:', inventoryData.length, 'records');
                        resolve(inventoryData);
                    })
                    .catch(error => {
                        console.warn('Could not load demo data:', error);
                        // Create empty inventory
                        inventoryData = [];
                        saveData();
                        resolve(inventoryData);
                    });
            } catch (error) {
                console.error('Load demo data error:', error);
                resolve([]);
            }
        });
    }
    
    /**
     * Save current data to the selected storage
     */
    function saveData() {
        // Save to local storage first as a backup
        saveToLocalStorage();
        
        // If using GitHub, save there too
        if (storageMode === 'github' && typeof GitHubStorage !== 'undefined' && GitHubStorage.hasToken()) {
            console.log('Saving data to GitHub...');
            GitHubStorage.saveInventoryData(inventoryData)
                .then(() => {
                    console.log('Data saved to GitHub successfully');
                    
                    // Show sync indicator
                    const syncIndicator = document.getElementById('sync-indicator');
                    if (syncIndicator) {
                        syncIndicator.innerHTML = `<span class="badge bg-success">Synced to GitHub</span>`;
                        setTimeout(() => {
                            syncIndicator.innerHTML = '';
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Error saving to GitHub:', error);
                    
                    // Show error indicator
                    const syncIndicator = document.getElementById('sync-indicator');
                    if (syncIndicator) {
                        syncIndicator.innerHTML = `<span class="badge bg-danger">GitHub Sync Failed</span>`;
                        setTimeout(() => {
                            syncIndicator.innerHTML = '';
                        }, 3000);
                    }
                });
        }
        
        return true;
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
     * Set the storage mode
     * @param {string} mode - 'local' or 'github'
     */
    function setStorageMode(mode) {
        if (mode !== 'local' && mode !== 'github') {
            throw new Error('Invalid storage mode. Must be "local" or "github"');
        }
        
        storageMode = mode;
        console.log(`Storage mode set to: ${mode}`);
        
        // Update localStorage to persist the setting
        if (mode === 'github') {
            localStorage.setItem('zoarch_use_github', 'true');
        } else {
            localStorage.setItem('zoarch_use_github', 'false');
        }
        
        return true;
    }
    
    /**
     * Get the current storage mode
     * @returns {string} The current storage mode
     */
    function getStorageMode() {
        return storageMode;
    }
    
    /**
     * Import data from Excel/CSV file
     */
    function importFromFile(file, append = false) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Importing data from file: ${file.name} (append: ${append})`);
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const data = e.target.result;
                        let importedData = [];
                        
                        if (file.name.endsWith('.csv')) {
                            // Parse CSV
                            console.log('Parsing CSV file...');
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
                            console.log('Parsing Excel file...');
                            const workbook = XLSX.read(data, { type: 'binary' });
                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                            importedData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                        }
                        
                        console.log(`Imported ${importedData.length} records from file`);
                        
                        if (append) {
                            inventoryData = [...inventoryData, ...importedData];
                            console.log(`Appended data, new total: ${inventoryData.length} records`);
                        } else {
                            inventoryData = importedData;
                            console.log(`Replaced data, new total: ${inventoryData.length} records`);
                        }
                        
                        saveData();
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
            return saveData();
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
            return saveData();
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
            
            return saveData();
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
     * Check if a record has any missing/incomplete fields
     * @param {Object} item - The inventory item to check
     * @returns {boolean} True if item has missing fields
     */
    function hasIncompleteFields(item) {
        // Define required fields
        const requiredFields = [
            'Order', 'Family', 'Genus', 'Species', 'Common Name', 
            'Location', 'Country', 'How collected', 'Date collected'
        ];
        
        return requiredFields.some(field => 
            !item[field] || item[field].toString().trim() === ''
        );
    }
    
    /**
     * Get all incomplete records
     * @returns {Array} Array of records with incomplete fields
     */
    function getIncompleteRecords() {
        return inventoryData.filter(item => hasIncompleteFields(item));
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
                uniqueOrders: getUniqueValues('Order').length,
                incompleteItems: getIncompleteRecords().length
            };
        } catch (error) {
            console.error('Error getting summary stats:', error);
            return {
                totalItems: 0,
                totalSpecimens: 0,
                uniqueSpecies: 0,
                uniqueGenera: 0,
                uniqueFamilies: 0,
                uniqueOrders: 0,
                incompleteItems: 0
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
                countryData: countryCounts
            };
        } catch (error) {
            console.error('Error generating chart data:', error);
            return {
                orderData: {},
                familyData: {},
                countryData: {}
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
        getChartData,
        getIncompleteRecords,
        setStorageMode,
        getStorageMode
    };
})();
