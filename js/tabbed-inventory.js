/**
 * ZOARCH Lab Inventory - Tabbed Inventory Display
 * Organizes inventory into taxonomic category tabs
 */

const TabbedInventory = (function() {
    // Configuration - taxonomic groups and their orders
    const taxonomicGroups = {
        'Mammals': ['Artiodactyla', 'Carnivora', 'Cetacea', 'Chiroptera', 'Primates', 'Rodentia', 'Lagomorpha', 'Proboscidea'],
        'Fish/Marine Life': ['Carcharhiniformes', 'Perciformes', 'Tetraodontiformes', 'Siluriformes', 'Cypriniformes', 'Salmoniformes'],
        'Birds': ['Passeriformes', 'Falconiformes', 'Strigiformes', 'Anseriformes', 'Psittaciformes', 'Columbiformes'],
        'Reptiles/Amphibians': ['Squamata', 'Testudines', 'Crocodilia', 'Anura', 'Caudata'],
        'Invertebrates': ['Araneae', 'Coleoptera', 'Lepidoptera', 'Hymenoptera', 'Diptera', 'Decapoda', 'Gastropoda'],
        'Other/Unclassified': [] // This will catch anything not in the above groups
    };
    
    /**
     * Initialize the tabbed inventory display
     */
    function init() {
        console.log('Initializing tabbed inventory...');
        try {
            // Get inventory content container
            const inventoryContent = document.getElementById('inventory-content');
            if (!inventoryContent) {
                console.error('Inventory content container not found');
                return false;
            }
            
            // Create and insert the tabbed interface
            inventoryContent.innerHTML = createTabHTML();
            
            // Setup event listeners
            setupTabEventListeners();
            
            // Load data for the initial active tab
            setTimeout(() => {
                const activeTab = document.querySelector('#taxonomyTabContent .tab-pane.active table');
                if (activeTab) {
                    loadTabData(activeTab.id);
                }
            }, 100);
            
            console.log('Tabbed inventory initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing tabbed inventory:', error);
            return false;
        }
    }
    
    /**
     * Create the HTML for the tabbed interface
     */
    function createTabHTML() {
        let html = '<div class="taxonomy-tabs mt-4">';
        
        // Create tab navigation
        html += '<ul class="nav nav-tabs" id="taxonomyTabs" role="tablist">';
        
        // Add the "All" tab
        html += `
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="all-tab" data-bs-toggle="tab" data-bs-target="#all-content" 
                    type="button" role="tab" aria-controls="all-content" aria-selected="true">All</button>
            </li>
        `;
        
        // Add tabs for each taxonomic group
        Object.keys(taxonomicGroups).forEach(group => {
            const groupId = group.toLowerCase().replace(/\W+/g, '-');
            html += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="${groupId}-tab" data-bs-toggle="tab" data-bs-target="#${groupId}-content" 
                        type="button" role="tab" aria-controls="${groupId}-content" aria-selected="false">${group}</button>
                </li>
            `;
        });
        
        html += '</ul>';
        
        // Create tab content container
        html += '<div class="tab-content border border-top-0 rounded-bottom p-3" id="taxonomyTabContent">';
        
        // Add the "All" tab content
        html += `
            <div class="tab-pane fade show active" id="all-content" role="tabpanel" aria-labelledby="all-tab">
                ${createTableHTML('all-inventory-table')}
            </div>
        `;
        
        // Add content for each taxonomic group
        Object.keys(taxonomicGroups).forEach(group => {
            const groupId = group.toLowerCase().replace(/\W+/g, '-');
            html += `
                <div class="tab-pane fade" id="${groupId}-content" role="tabpanel" aria-labelledby="${groupId}-tab">
                    ${createTableHTML(`${groupId}-inventory-table`)}
                </div>
            `;
        });
        
        html += '</div></div>';
        
        return html;
    }
    
    /**
     * Create HTML for an inventory table
     */
    function createTableHTML(tableId) {
        return `
            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                <table id="${tableId}" class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Owner</th>
                            <th>Catalog #</th>
                            <th>Order</th>
                            <th>Family</th>
                            <th>Genus</th>
                            <th>Species</th>
                            <th>Common Name</th>
                            <th>Location</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="9" class="text-center">Loading items...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    /**
     * Setup event listeners for tab changes
     */
    function setupTabEventListeners() {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('#taxonomyTabs button[data-bs-toggle="tab"]');
        
        // Add listener for tab show event
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', function(event) {
                const targetId = event.target.getAttribute('data-bs-target');
                const targetPane = document.querySelector(targetId);
                if (targetPane) {
                    const tableId = targetPane.querySelector('table').id;
                    loadTabData(tableId);
                }
            });
        });
    }
    
    /**
     * Load inventory data for a specific tab
     */
    function loadTabData(tableId) {
        try {
            console.log(`Loading data for tab: ${tableId}`);
            
            const table = document.getElementById(tableId);
            if (!table) {
                console.error(`Table element not found: ${tableId}`);
                return;
            }
            
            const tableBody = table.querySelector('tbody');
            if (!tableBody) {
                console.error(`Table body not found for: ${tableId}`);
                return;
            }
            
            // Clear existing table content
            tableBody.innerHTML = '';
            
            // Get all data
            const allData = Database.getAllData();
            console.log(`Retrieved ${allData.length} records from database`);
            
            // Filter data based on tab ID
            let filteredData = allData;
            
            // If not the "all" tab, filter by taxonomic group
            if (tableId !== 'all-inventory-table') {
                // Extract group name from the table ID
                const groupName = tableId.replace('-inventory-table', '').replace(/-/g, ' ');
                
                // Find the matching taxonomic group
                const groupKey = Object.keys(taxonomicGroups).find(key => 
                    key.toLowerCase() === groupName
                );
                
                if (groupKey) {
                    const orders = taxonomicGroups[groupKey];
                    
                    if (orders.length > 0) {
                        // Filter by specific orders in this group
                        filteredData = allData.filter(item => orders.includes(item.Order));
                    } else {
                        // For "Other/Unclassified", include items not in any defined group
                        const allDefinedOrders = Object.values(taxonomicGroups).flat();
                        filteredData = allData.filter(item => !allDefinedOrders.includes(item.Order));
                    }
                }
            }
            
            console.log(`Filtered to ${filteredData.length} records for ${tableId}`);
            
            // Update tab count
            updateTabCount(tableId, filteredData.length);
            
            // If no data, show a message
            if (filteredData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No items found in this category</td></tr>';
                return;
            }
            
            // Add rows to the table
            filteredData.forEach(item => {
                const row = document.createElement('tr');
                
                // Highlight incomplete rows
                if (Database.hasIncompleteFields && Database.hasIncompleteFields(item)) {
                    row.classList.add('table-warning');
                }
                
                row.innerHTML = `
                    <td>${item['Owner'] || ''}</td>
                    <td>${item['Catalog #'] || ''}</td>
                    <td>${item['Order'] || ''}</td>
                    <td>${item['Family'] || ''}</td>
                    <td>${item['Genus'] || ''}</td>
                    <td>${item['Species'] || ''}</td>
                    <td>${item['Common Name'] || ''}</td>
                    <td>${item['Location'] || ''}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-details-btn" data-catalog="${item['Catalog #']}">
                            <i class="fas fa-search"></i> Details
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add click handlers for details buttons
            const detailsButtons = tableBody.querySelectorAll('.view-details-btn');
            detailsButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const catalogNum = this.getAttribute('data-catalog');
                    if (typeof window.showItemDetails === 'function') {
                        window.showItemDetails(catalogNum);
                    } else {
                        console.warn('showItemDetails function not found in global scope');
                        alert(`Details for catalog #${catalogNum}`);
                    }
                });
            });
            
            console.log(`Tab ${tableId} data loaded successfully`);
        } catch (error) {
            console.error(`Error loading data for tab ${tableId}:`, error);
            const table = document.getElementById(tableId);
            if (table) {
                const tableBody = table.querySelector('tbody');
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
                }
            }
        }
    }
    
    /**
     * Update the count badge on a tab
     */
    function updateTabCount(tableId, count) {
        try {
            // Get tab ID from table ID
            const tabId = tableId.replace('-inventory-table', '-tab');
            const tab = document.getElementById(tabId);
            
            if (tab) {
                // Remove existing badge if any
                const existingBadge = tab.querySelector('.badge');
                if (existingBadge) {
                    existingBadge.textContent = count;
                } else {
                    // Add new badge
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-secondary ms-2';
                    badge.textContent = count;
                    tab.appendChild(badge);
                }
            }
        } catch (error) {
            console.error(`Error updating tab count for ${tableId}:`, error);
        }
    }
    
    /**
     * Refresh data for all tabs
     */
    function refreshAllTabs() {
        try {
            console.log('Refreshing all taxonomy tabs');
            
            // Get all tab content containers
            const tabPanes = document.querySelectorAll('#taxonomyTabContent .tab-pane');
            
            // For each pane, reload the table data
            tabPanes.forEach(pane => {
                const table = pane.querySelector('table');
                if (table) {
                    loadTabData(table.id);
                }
            });
            
            console.log('All taxonomy tabs refreshed');
        } catch (error) {
            console.error('Error refreshing taxonomy tabs:', error);
        }
    }
    
    // Public API
    return {
        init,
        refreshAllTabs,
        loadTabData
    };
})();
