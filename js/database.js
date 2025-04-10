// ZOARCH Lab Inventory - Database Management with GitHub Integration

const Database = (function() {
    const STORAGE_KEY = 'zoarch_inventory_data';
    const DEMO_DATA_URL = 'data/sample_inventory.json';

    let inventoryData = [];
    let storageMode = 'local';

    function init(config = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (config.useGitHub === true) {
                    storageMode = 'github';
                }

                if (storageMode === 'github' && typeof GitHubStorage !== 'undefined') {
                    const gitHubInitialized = await GitHubStorage.init(config.github || {});
                    if (gitHubInitialized && GitHubStorage.hasToken()) {
                        try {
                            const gitHubData = await GitHubStorage.getInventoryData();
                            inventoryData = gitHubData;
                            saveToLocalStorage();
                            resolve(inventoryData);
                            return;
                        } catch (error) {
                            console.warn('GitHub load failed, falling back to localStorage:', error);
                            storageMode = 'local';
                        }
                    }
                }

                const savedData = localStorage.getItem(STORAGE_KEY);
                if (savedData) {
                    inventoryData = JSON.parse(savedData);
                    resolve(inventoryData);
                } else {
                    loadDemoData().then(resolve).catch(reject);
                }
            } catch (error) {
                console.error('Init error:', error);
                resolve([]);
            }
        });
    }

    function loadDemoData() {
        return fetch(DEMO_DATA_URL)
            .then(response => response.json())
            .then(data => {
                inventoryData = data;
                saveToLocalStorage();
                return inventoryData;
            })
            .catch(error => {
                console.warn('Failed to load demo data:', error);
                inventoryData = [];
                saveToLocalStorage();
                return inventoryData;
            });
    }

    function saveData() {
        saveToLocalStorage();
        return true;
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryData));
            return true;
        } catch (error) {
            console.error('LocalStorage save error:', error);
            return false;
        }
    }

    function setStorageMode(mode) {
        if (mode !== 'local' && mode !== 'github') {
            throw new Error('Invalid storage mode');
        }
        storageMode = mode;
        return true;
    }

    function getStorageMode() {
        return storageMode;
    }

    function importFromFile(file, append = false) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = e.target.result;
                    let importedData = [];

                    if (file.name.endsWith('.csv')) {
                        const rows = data.split('\n');
                        const headers = rows[0].split(',').map(h => h.trim());
                        for (let i = 1; i < rows.length; i++) {
                            if (!rows[i].trim()) continue;
                            const values = rows[i].split(',');
                            const entry = {};
                            headers.forEach((h, index) => {
                                entry[h] = values[index] ? values[index].trim() : '';
                            });
                            importedData.push(entry);
                        }
                    } else {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        importedData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    }

                    inventoryData = append ? [...inventoryData, ...importedData] : importedData;
                    saveData();
                    resolve(inventoryData);
                } catch (error) {
                    reject(error);
                }
            };

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    }

    function getAllData() {
        return inventoryData;
    }

    function getItemByCatalog(catalogNumber) {
        const catNum = String(catalogNumber).trim();
        return inventoryData.find(item => String(item['Catalog #']).trim() === catNum) || null;
    }

    function addItem(item) {
        if (item['Catalog #'] && getItemByCatalog(item['Catalog #'])) {
            console.warn('Duplicate catalog number:', item['Catalog #']);
            return false;
        }
        inventoryData.push(item);
        return saveData();
    }

    function updateItem(catalogNumber, updatedData) {
        const index = inventoryData.findIndex(item =>
            String(item['Catalog #']).trim() === String(catalogNumber).trim()
        );
        if (index === -1) return false;
        inventoryData[index] = { ...inventoryData[index], ...updatedData };
        return saveData();
    }

    function deleteItem(catalogNumber) {
        const initialLength = inventoryData.length;
        inventoryData = inventoryData.filter(item =>
            String(item['Catalog #']).trim() !== String(catalogNumber).trim()
        );
        return inventoryData.length !== initialLength && saveData();
    }

    function getUniqueValues(field) {
        const values = inventoryData
            .map(item => item[field])
            .filter(value => value !== undefined && value !== null && value !== '');
        return [...new Set(values)].sort();
    }

    function hasIncompleteFields(item) {
        const requiredFields = [
            'Order', 'Family', 'Genus', 'Species', 'Common Name',
            'Location', 'Country', 'How collected', 'Date collected'
        ];
        return requiredFields.some(field =>
            !item[field] || item[field].toString().trim() === ''
        );
    }

    function getIncompleteRecords() {
        return inventoryData.filter(item => hasIncompleteFields(item));
    }

    function getSummaryStats() {
        return {
            totalItems: inventoryData.length,
            totalSpecimens: inventoryData.reduce((sum, item) =>
                sum + (parseInt(item['# of specimens']) || 1), 0),
            uniqueSpecies: getUniqueValues('Species').length,
            uniqueGenera: getUniqueValues('Genus').length,
            uniqueFamilies: getUniqueValues('Family').length,
            uniqueOrders: getUniqueValues('Order').length,
            incompleteItems: getIncompleteRecords().length
        };
    }

    function getChartData() {
        const orderCounts = {}, familyCounts = {}, countryCounts = {};
        inventoryData.forEach(item => {
            const order = item.Order || 'Unknown';
            const family = item.Family || 'Unknown';
            const country = item.Country || 'Unknown';
            orderCounts[order] = (orderCounts[order] || 0) + 1;
            familyCounts[family] = (familyCounts[family] || 0) + 1;
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });

        const topFamilies = Object.entries(familyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [key, val]) => (obj[key] = val, obj), {});

        return {
            orderData: orderCounts,
            familyData: topFamilies,
            countryData: countryCounts
        };
    }

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
