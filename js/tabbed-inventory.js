/**
 * ZOARCH Lab Inventory - Tabbed Inventory Display
 * This component organizes inventory data into taxonomic category tabs
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
        try {
            // Get DOM elements
            const inventorySection = document.getElementById('inventory');
            if (!inventorySection) {
                console.warn('Inventory section not found');
                return false;
            }
            
            // Find or create container for tabs
            let tabContainer = inventorySection.querySelector('.taxonomy-tabs');
            if (!tabContainer) {
                // Create tab structure
                const tabStructure = createTabStructure();
                
                // Find where to insert the tabs (after the intro paragraph)
                const introParagraph = inventorySection.querySelector('p');
                if (introParagraph && introParagraph.nextElementSibling) {
                    inventorySection.insertBefore(tabStructure, introParagraph.nextElementSibling);
                } else {
                    // Just append if we can't find the right spot
                    inventorySection.appendChild(tabStructure);
                }
                
                tabContainer = inventorySection.querySelector('.taxonomy-tabs');
            }
            
            // Hide the original table container
            const originalTableContainer = inventorySection.querySelector('.table-responsive');
            if (originalTableContainer) {
                originalTableContainer.style.display = 'none';
            }
            
            // Setup event listeners for tab navigation
            setupTabEventListeners();
            
            console.log('Tabbed inventory initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing tabbed inventory:', error);
            return false;
        }
    }
    
    /**
     * Create the HTML structure for tabs
     */
    function createTabStructure() {
        // Create container
        const container = document.createElement('div');
        container.className = 'taxonomy-tabs mt-4';
        
        // Create tab navigation
        const navTabs = document.createElement('ul');
        navTabs.className = 'nav nav-tabs';
        navTabs.id = 'taxonomyTabs';
        navTabs.setAttribute('role', 'tablist');
        
        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content border border-top-0 rounded-bottom p-3';
        tabContent.id = 'taxonomyTabContent';
        
        // Add "All" tab
        navTabs.innerHTML += `
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="all-tab" data-bs-toggle="tab" data-bs-target="#all-content" 
                    type="button" role="tab" aria-controls="all-content" aria-selected="true">All</button>
            </li>
        `;
        
        // Create content for "All" tab
        const allContent = document.createElement('div');
        allContent.className = 'tab-pane fade show active';
        allContent.id = 'all-content';
        allContent.setAttribute('role', 'tabpanel');
        allContent.setAttribute('aria-labelledby', 'all-tab');
        
        // Create table for "All" tab
        allContent.innerHTML = createTableHTML('all-inventory-table');
        tabContent.appendChild(allContent);
        
        // Add tabs for each taxonomic group
        Object.keys(taxonomicGroups).forEach((group, index) => {
            // Create sanitized ID from the group name
            const groupId = group.toLowerCase().replace(/\W+/g, '-');
            
            // Add tab button
            navTabs.innerHTML += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="${groupId}-tab" data-bs-toggle="tab" data-bs-target="#${groupId}-content" 
                        type="button" role="tab" aria-controls="${groupId}-content" aria-selected="false">${group}</button>
                </li>
            `;
            
            // Create content for this tab
            const groupContent = document.createElement('div');
            groupContent.className = 'tab-pane fade';
            groupContent.id = `${groupId}-content`;
            groupContent.setAttribute('role', 'tabpanel');
            groupContent.setAttribute('aria-labelledby', `${groupId}-tab`);
            
            // Create table for this group
            groupContent.innerHTML = createTableHTML(`${groupId}-inventory-table`);
            tabContent.appendChild(groupContent);
        });
        
        // Add components to container
        container.appendChild(navTabs);
        container.appendChild(tabContent);
        
        return container;
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
                        <!-- Will be populated dynamically -->
                        <tr>
                            <td colspan="9" class="text-center">Loading items...</td>
                        </tr>
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
                const tableId = targetPane.querySelector('table').id;
                
                // Load data for this tab if needed
                loadTabData(tableId);
            });
        });
    }
    
    /**
     * Load inventory data for a specific tab
     */
    function loadTabData(tableId) {
        try {
            const table = document.getElementById(tableId);
            if (!table) return;
            
            const tableBody = table.querySelector('tbody');
            if (!tableBody) return;
            
            // Clear existing table content
            tableBody.innerHTML = '';
            
            // Get all data
            const allData = Database.getAllData();
            
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
            
            // Populate table with filtered data
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
                    showItemDetails(catalogNum);
                });
            });
            
            // Add a count indicator
            const firstRow = tableBody.querySelector('tr');
            if (!firstRow) {
                tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No items found in this category</td></tr>`;
            } else {
                // Add count to the tab if not already added
                const tabId = tableId.replace('-inventory-table', '-tab');
                const tab = document.getElementById(tabId);
                if (tab && !tab.querySelector('.badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-secondary ms-2';
                    badge.textContent = filteredData.length;
                    tab.appendChild(badge);
                }
            }
        } catch (error) {
            console.error(`Error loading data for tab ${tableId}:`, error);
        }
    }
    
    /**
     * Check if a record has incomplete fields
     * (Copy of the function from app.js to avoid dependencies)
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
