/**
 * ZOARCH Lab Inventory - Simplified Tabbed Inventory Display (Fixed)
 * With proper category counting and display
 */

// TabbedInventory namespace
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
        console.log('Initializing simplified tabbed inventory...');
        try {
            // Get inventory section
            const inventorySection = document.getElementById('inventory');
            if (!inventorySection) {
                console.error('Inventory section not found');
                return false;
            }
            
            // Create the tabbed content div
            const tabbedContent = document.createElement('div');
            tabbedContent.className = 'taxonomy-tabs mt-4';
            tabbedContent.innerHTML = createTabHTML();
            
            // Find a good place to insert it
            const contentDiv = inventorySection.querySelector('.col-12');
            if (!contentDiv) {
                // If no .col-12, just append to the section itself
                inventorySection.appendChild(tabbedContent);
            } else {
                // Clear the content div except for the h2 and p elements
                const header = contentDiv.querySelector('h2');
                const paragraph = contentDiv.querySelector('p');
                
                contentDiv.innerHTML = '';
                
                // Add back the header and paragraph if they existed
                if (header) contentDiv.appendChild(header);
                if (paragraph) contentDiv.appendChild(paragraph);
                
                // Add the tabbed content
                contentDiv.appendChild(tabbedContent);
            }
            
            // Add event listeners for tab changes
            setupTabEventListeners();
            
            // Load data for the initial active tab
            const activeTab = document.querySelector('#taxonomyTabContent .tab-pane.active table');
            if (activeTab) {
                loadTabData(activeTab.id);
            }
            
            console.log('Simplified tabbed inventory initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing simplified tabbed inventory:', error);
            return false;
        }
    }
    
    /**
     * Create the HTML for the tabbed interface
     */
    function createTabHTML() {
        // Start with the tabs
        let html = '<ul class="nav nav-tabs" id="taxonomyTabs" role="tablist">';
        
        // Add the "All" tab
        html += `
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="all-tab" data-bs-toggle="tab" data-bs-target="#all-content" 
                    role="tab" aria-controls="all-content" aria-selected="true">All</a>
            </li>
        `;
        
        // Add tabs for each taxonomic group
        Object.keys(taxonomicGroups).forEach(group => {
            const groupId = group.toLowerCase().replace(/\W+/g, '-');
            html += `
                <li class="nav-item" role="presentation">
                    <a class="nav-link" id="${groupId}-tab" data-bs-toggle="tab" data-bs-target="#${groupId}-content" 
                        role="tab" aria-controls="${groupId}-content" aria-selected="false">${group}</a>
                </li>
            `;
        });
        
        // Close the tabs
        html += '</ul>';
        
        // Start the tab content
        html += '<div class="tab-content border border-top-0 rounded-bottom p-3" id="taxonomyTabContent">';
        
        // Add the "All" tab content
        html += `
            <div class="tab-pane fade show active" id="all-content" role="tabpanel" aria-labelledby="all-tab">
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table id="all-inventory-table" class="table table-striped table-hover">
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
            </div>
        `;
        
        // Add content for each taxonomic group
        Object.keys(taxonomicGroups).forEach(group => {
            const groupId = group.toLowerCase().replace(/\W+/g, '-');
            html += `
                <div class="tab-pane fade" id="${groupId}-content" role="tabpanel" aria-labelledby="${groupId}-tab">
                    <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                        <table id="${groupId}-inventory-table" class="table table-striped table-hover">
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
                </div>
            `;
        });
        
        // Close the tab content
        html += '</div>';
        
        return html;
    }
    
    /**
     * Setup event listeners for tab changes
     */
    function setupTabEventListeners() {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('#taxonomyTabs .nav-link');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Prevent default action
                e.preventDefault();
                
                // Get target tab
                const target = this.getAttribute('data-bs-target');
                
                // Remove active class from all tabs and panes
                document.querySelectorAll('#taxonomyTabs .nav-link').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('#taxonomyTabContent .tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Add active class to clicked tab and corresponding pane
                this.classList.add('active');
                const pane = document.querySelector(target);
                if (pane) {
                    pane.classList.add('show', 'active');
                    
                    // Load data for this tab if needed
                    const tableId = pane.querySelector('table')?.id;
                    if (tableId) {
                        loadTabData(tableId);
                    }
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
                const groupName = tableId.replace('-inventory-table', '');
                
                // Find the matching taxonomic group
                const groupKey = Object.keys(taxonomicGroups).find(key => 
                    key.toLowerCase().replace(/\W+/g, '-') === groupName
                );
                
                if (groupKey) {
                    const orders = taxonomicGroups[groupKey];
                    
                    if (orders.length > 0) {
                        // Filter by specific orders in this group
                        filteredData = allData.filter(item => orders.includes(item.Order));
                    } else {
                        // For "Other/Unclassified", include items not in any defined group
                        const allDefinedOrders = [];
                        Object.keys(taxonomicGroups).forEach(key => {
                            if (key !== 'Other/Unclassified') {
                                taxonomicGroups[key].forEach(order => allDefinedOrders.push(order));
                            }
                        });
                        
                        filteredData = allData.filter(item => 
                            item.Order && !allDefinedOrders.includes(item.Order)
                        );
                    }
                }
            }
            
            console.log(`Filtered to ${filteredData.length} records for ${tableId}`);
            
            // Add count to the tab
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
                if (isIncompleteRecord(item)) {
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
            const tabId = tableId.replace('-inventory-table', '-tab');
            const tab = document.getElementById(tabId);
            
            if (tab) {
                // Remove existing badge if any
                const existingBadge = tab.querySelector('.badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                // Add new badge with count
                const badge = document.createElement('span');
                badge.className = 'badge bg-secondary ms-2';
                badge.textContent = count;
                tab.appendChild(badge);
                
                console.log(`Updated tab count for ${tabId}: ${count}`);
            }
        } catch (error) {
            console.error(`Error updating tab count for ${tableId}:`, error);
        }
    }
    
    /**
     * Check if a record has incomplete fields
     */
    function isIncompleteRecord(item) {
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
     * Load data for all tabs (called when data changes)
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
    
    // Helper function to calculate and pre-populate tab counts
    function calculateAllTabCounts() {
        try {
            console.log('Pre-calculating all tab counts...');
            const allData = Database.getAllData();
            
            // Calculate count for "All" tab
            updateTabCount('all-inventory-table', allData.length);
            
            // Calculate counts for each taxonomic group
            Object.keys(taxonomicGroups).forEach(group => {
                const groupId = group.toLowerCase().replace(/\W+/g, '-');
                const tableId = `${groupId}-inventory-table`;
                
                const orders = taxonomicGroups[group];
                let count = 0;
                
                if (orders.length > 0) {
                    // Count items in this group
                    count = allData.filter(item => orders.includes(item.Order)).length;
                } else {
                    // For "Other/Unclassified", count items not in any defined group
                    const allDefinedOrders = [];
                    Object.keys(taxonomicGroups).forEach(key => {
                        if (key !== 'Other/Unclassified') {
                            taxonomicGroups[key].forEach(order => allDefinedOrders.push(order));
                        }
                    });
                    
                    count = allData.filter(item => 
                        item.Order && !allDefinedOrders.includes(item.Order)
                    ).length;
                }
                
                updateTabCount(tableId, count);
            });
            
            console.log('All tab counts updated');
        } catch (error) {
            console.error('Error calculating tab counts:', error);
        }
    }
    
    // Public API
    return {
        init,
        refreshAllTabs,
        loadTabData,
        calculateAllTabCounts
    };
    // Make sure incomplete records load when needed
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure everything is loaded
    setTimeout(function() {
        // If we're on the incomplete records page, load them
        if (!document.getElementById('incomplete').classList.contains('d-none')) {
            if (typeof IncompleteRecords !== 'undefined' && 
                typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                console.log('Explicitly loading incomplete records...');
                IncompleteRecords.loadIncompleteRecords();
            }
        }
        
        // Update inventory tab counts
        if (typeof TabbedInventory !== 'undefined' && 
            typeof TabbedInventory.calculateAllTabCounts === 'function') {
            console.log('Calculating tab counts...');
            TabbedInventory.calculateAllTabCounts();
        }
    }, 1000);
});
    document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to load the incomplete records
    setTimeout(function() {
        const incompleteSection = document.getElementById('incomplete');
        if (incompleteSection && !incompleteSection.classList.contains('d-none') && 
            typeof IncompleteRecords !== 'undefined' && 
            typeof IncompleteRecords.loadIncompleteRecords === 'function') {
            console.log('Explicitly loading incomplete records...');
            IncompleteRecords.loadIncompleteRecords();
        }
    }, 1000); // Delay to ensure everything is loaded
});
})();
