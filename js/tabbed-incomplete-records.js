/**
 * ZOARCH Lab Inventory - Tabbed Incomplete Records Display
 * This component organizes incomplete records into taxonomic category tabs
 */

// TabbedIncompleteRecords namespace
const TabbedIncompleteRecords = (function() {
    // Configuration - taxonomic groups and their orders (same as TabbedInventory)
    const taxonomicGroups = {
        'Mammals': ['Artiodactyla', 'Carnivora', 'Cetacea', 'Chiroptera', 'Primates', 'Rodentia', 'Lagomorpha', 'Proboscidea'],
        'Fish/Marine Life': ['Carcharhiniformes', 'Perciformes', 'Tetraodontiformes', 'Siluriformes', 'Cypriniformes', 'Salmoniformes'],
        'Birds': ['Passeriformes', 'Falconiformes', 'Strigiformes', 'Anseriformes', 'Psittaciformes', 'Columbiformes'],
        'Reptiles/Amphibians': ['Squamata', 'Testudines', 'Crocodilia', 'Anura', 'Caudata'],
        'Invertebrates': ['Araneae', 'Coleoptera', 'Lepidoptera', 'Hymenoptera', 'Diptera', 'Decapoda', 'Gastropoda'],
        'Other/Unclassified': [] // This will catch anything not in the above groups
    };
    
    // Store references to DOM elements
    const elements = {
        tabContainer: null,
        saveButton: null,
        syncIndicator: null
    };
    
    // Store any cells currently being edited
    let activeEditCell = null;
    
    // Keep track of modified rows by catalog number
    let modifiedRows = new Set();
    
    /**
     * Initialize the tabbed incomplete records display
     */
    function init() {
        try {
            // Get DOM elements
            const incompleteSection = document.getElementById('incomplete');
            if (!incompleteSection) {
                console.warn('Incomplete records section not found');
                return false;
            }
            
            // Reference the save button and sync indicator
            elements.saveButton = document.getElementById('save-incomplete-btn');
            elements.syncIndicator = document.getElementById('incomplete-sync-indicator');
            
            // Find the card containing the table
            const tableCard = incompleteSection.querySelector('.card:last-child');
            if (!tableCard) {
                console.warn('Incomplete records table card not found');
                return false;
            }
            
            // Create tab structure
            const tabStructure = createTabStructure();
            
            // Replace the existing table-responsive div
            const originalTable = tableCard.querySelector('.table-responsive');
            if (originalTable) {
                // Save the button group
                const buttonGroup = tableCard.querySelector('.d-flex');
                
                // Clear the card body content
                const cardBody = tableCard.querySelector('.card-body');
                if (cardBody) {
                    cardBody.innerHTML = '';
                    
                    // Re-add the button group
                    if (buttonGroup) {
                        cardBody.appendChild(buttonGroup);
                    }
                    
                    // Add the tab structure
                    cardBody.appendChild(tabStructure);
                    elements.tabContainer = tabStructure;
                }
            }
            
            // Setup event listeners for tab navigation
            setupTabEventListeners();
            
            console.log('Tabbed incomplete records initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing tabbed incomplete records:', error);
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
        navTabs.id = 'incompleteTaxonomyTabs';
        navTabs.setAttribute('role', 'tablist');
        
        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content border border-top-0 rounded-bottom p-3';
        tabContent.id = 'incompleteTaxonomyTabContent';
        
        // Add "All" tab
        navTabs.innerHTML += `
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="incomplete-all-tab" data-bs-toggle="tab" data-bs-target="#incomplete-all-content" 
                    type="button" role="tab" aria-controls="incomplete-all-content" aria-selected="true">All</button>
            </li>
        `;
        
        // Create content for "All" tab
        const allContent = document.createElement('div');
        allContent.className = 'tab-pane fade show active';
        allContent.id = 'incomplete-all-content';
        allContent.setAttribute('role', 'tabpanel');
        allContent.setAttribute('aria-labelledby', 'incomplete-all-tab');
        
        // Create table for "All" tab
        allContent.innerHTML = createTableHTML('incomplete-all-table');
        tabContent.appendChild(allContent);
        
        // Add tabs for each taxonomic group
        Object.keys(taxonomicGroups).forEach((group, index) => {
            // Create sanitized ID from the group name
            const groupId = `incomplete-${group.toLowerCase().replace(/\W+/g, '-')}`;
            
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
            groupContent.innerHTML = createTableHTML(`${groupId}-table`);
            tabContent.appendChild(groupContent);
        });
        
        // Add components to container
        container.appendChild(navTabs);
        container.appendChild(tabContent);
        
        return container;
    }
    
    /**
     * Create HTML for an incomplete records table
     */
    function createTableHTML(tableId) {
        return `
            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                <table id="${tableId}" class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Catalog #</th>
                            <th>Owner</th>
                            <th>Order</th>
                            <th>Family</th>
                            <th>Genus</th>
                            <th>Species</th>
                            <th>Common Name</th>
                            <th>Location</th>
                            <th>Country</th>
                            <th>How collected</th>
                            <th>Date collected</th>
                        </tr>
                    </thead>
                    <tbody id="${tableId}-body">
                        <!-- Will be populated dynamically -->
                        <tr>
                            <td colspan="11" class="text-center">Loading items...</td>
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
        const tabButtons = document.querySelectorAll('#incompleteTaxonomyTabs button[data-bs-toggle="tab"]');
        
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
     * Load incomplete records for a specific tab
     */
    function loadTabData(tableId) {
        try {
            const table = document.getElementById(tableId);
            if (!table) return;
            
            const tableBody = document.getElementById(`${tableId}-body`);
            if (!tableBody) return;
            
            // Clear existing table content
            tableBody.innerHTML = '';
            
            // Get incomplete records from the database
            const allIncompleteRecords = Database.getIncompleteRecords();
            
            // Filter records based on tab ID
            let filteredRecords = allIncompleteRecords;
            
            // If not the "all" tab, filter by taxonomic group
            if (tableId !== 'incomplete-all-table') {
                // Extract group name from the table ID
                const groupName = tableId.replace('incomplete-', '').replace('-table', '').replace(/-/g, ' ');
                
                // Find the matching taxonomic group
                const groupKey = Object.keys(taxonomicGroups).find(key => 
                    key.toLowerCase() === groupName
                );
                
                if (groupKey) {
                    const orders = taxonomicGroups[groupKey];
                    
                    if (orders.length > 0) {
                        // Filter by specific orders in this group
                        filteredRecords = allIncompleteRecords.filter(item => orders.includes(item.Order));
                    } else {
                        // For "Other/Unclassified", include items not in any defined group
                        const allDefinedOrders = Object.values(taxonomicGroups).flat();
                        filteredRecords = allIncompleteRecords.filter(item => !allDefinedOrders.includes(item.Order));
                    }
                }
            }
            
            // Update the count indicator
            updateTabCount(tableId, filteredRecords.length);
            
            // If no records, show message
            if (filteredRecords.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="11" class="text-center">No incomplete records found in this category.</td></tr>`;
                return;
            }
            
            // Define the fields we want to display
            const fields = [
                'Catalog #', 'Owner', 'Order', 'Family', 'Genus', 'Species', 
                'Common Name', 'Location', 'Country', 'How collected', 'Date collected'
            ];
            
            // Add records to the table
            filteredRecords.forEach((record, index) => {
                const row = document.createElement('tr');
                row.dataset.index = index;
                row.dataset.catalog = record['Catalog #'];
                
                fields.forEach(field => {
                    const cell = document.createElement('td');
                    const value = record[field] || '';
                    
                    cell.textContent = value;
                    cell.dataset.field = field;
                    
                    // Highlight empty cells
                    if (!value && field !== 'Catalog #' && field !== 'Owner') {
                        cell.classList.add('bg-light', 'text-danger', 'incomplete-cell');
                    }
                    
                    // Make all cells editable except Catalog #
                    if (field !== 'Catalog #') {
                        cell.classList.add('editable');
                        cell.addEventListener('click', function() {
                            startEditing(this, index, field, record);
                        });
                    } else {
                        cell.classList.add('fw-bold');
                    }
                    
                    row.appendChild(cell);
                });
                
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error(`Error loading data for tab ${tableId}:`, error);
        }
    }
    
    /**
     * Update the count badge on a tab
     */
    function updateTabCount(tableId, count) {
        try {
            // Get tab ID from table ID
            const tabId = tableId.replace('-table', '-tab');
            const tab = document.getElementById(tabId);
            
            if (tab) {
                // Remove existing badge if any
                const existingBadge = tab.querySelector('.badge');
                if (existingBadge) {
                    tab.removeChild(existingBadge);
                }
                
                // Add new badge
                const badge = document.createElement('span');
                badge.className = 'badge bg-secondary ms-2';
                badge.textContent = count;
                tab.appendChild(badge);
            }
        } catch (error) {
            console.error(`Error updating tab count for ${tableId}:`, error);
        }
    }
    
    /**
     * Start editing a cell
     * @param {HTMLElement} cell - The cell to edit
     * @param {number} recordIndex - Index of the record
     * @param {string} field - Field name to edit
     * @param {Object} record - The record being edited
     */
    function startEditing(cell, recordIndex, field, record) {
        try {
            // If we're already editing a cell, save it first
            if (activeEditCell) {
                finishEditing();
            }
            
            // Store reference to the current cell
            activeEditCell = {
                element: cell,
                catalog: record['Catalog #'],
                field: field,
                originalValue: cell.textContent
            };
            
            // Create an input element with the current value
            const input = document.createElement('input');
            input.type = field === 'Date collected' ? 'date' : 'text';
            input.value = cell.textContent;
            input.className = 'form-control form-control-sm';
            
            // Clear the cell and add the input
            cell.textContent = '';
            cell.appendChild(input);
            
            // Focus the input
            input.focus();
            
            // Add events to handle editing
            input.addEventListener('blur', finishEditing);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    finishEditing();
                } else if (e.key === 'Escape') {
                    cancelEditing();
                }
            });
        } catch (error) {
            console.error('Error starting cell edit:', error);
        }
    }
    
    /**
     * Finish editing the current cell
     */
    function finishEditing() {
        try {
            // If no active cell, do nothing
            if (!activeEditCell) return;
            
            const cell = activeEditCell.element;
            const input = cell.querySelector('input');
            const newValue = input ? input.value : '';
            
            // Update the cell text
            cell.textContent = newValue;
            
            // Mark row as modified
            if (newValue !== activeEditCell.originalValue) {
                modifiedRows.add(activeEditCell.catalog);
                
                // Enable the save button
                if (elements.saveButton) {
                    elements.saveButton.disabled = false;
                }
            }
            
            // Update highlighting
            if (!newValue) {
                cell.classList.add('bg-light', 'text-danger', 'incomplete-cell');
            } else {
                cell.classList.remove('bg-light', 'text-danger', 'incomplete-cell');
            }
            
            // Clear active cell
            activeEditCell = null;
        } catch (error) {
            console.error('Error finishing cell edit:', error);
            
            // Try to clean up
            if (activeEditCell && activeEditCell.element) {
                activeEditCell.element.textContent = activeEditCell.originalValue;
                activeEditCell = null;
            }
        }
    }
    
    /**
     * Cancel editing the current cell
     */
    function cancelEditing() {
        try {
            // If no active cell, do nothing
            if (!activeEditCell) return;
            
            // Restore original value
            activeEditCell.element.textContent = activeEditCell.originalValue;
            
            // Clear active cell
            activeEditCell = null;
        } catch (error) {
            console.error('Error canceling cell edit:', error);
            
            // Try to clean up
            if (activeEditCell && activeEditCell.element) {
                activeEditCell.element.textContent = activeEditCell.originalValue;
                activeEditCell = null;
            }
        }
    }
    
    /**
     * Save all changes to the database
     */
    function saveAllChanges() {
        try {
            // Make sure editing is finished
            if (activeEditCell) {
                finishEditing();
            }
            
            // If no changes, do nothing
            if (modifiedRows.size === 0) {
                showSyncMessage('No changes to save', 'warning');
                return;
            }
            
            // Show saving indicator
            showSyncMessage('Saving changes...', 'info', true);
            
            // Keep track of success
            let success = true;
            
            // For each catalog number, get all edited fields from all tabs
            for (const catalog of modifiedRows) {
                // Find all edited cells for this catalog across all tabs
                const updatedData = {};
                
                // Loop through all tabs to find rows with this catalog
                document.querySelectorAll('.taxonomy-tabs table tbody tr[data-catalog="' + catalog + '"]').forEach(row => {
                    // Get all cells except catalog #
                    row.querySelectorAll('td').forEach(cell => {
                        const field = cell.dataset.field;
                        if (field && field !== 'Catalog #') {
                            updatedData[field] = cell.textContent;
                        }
                    });
                });
                
                // Update the record in the database
                const saveResult = Database.updateItem(catalog, updatedData);
                
                if (!saveResult) {
                    console.error('Failed to save record:', catalog);
                    success = false;
                }
            }
            
            // Show success or error message
            if (success) {
                showSyncMessage('All changes saved successfully!', 'success');
                
                // Clear modified rows
                modifiedRows.clear();
                
                // Reload all tabs to refresh data
                setTimeout(() => {
                    refreshAllTabs();
                }, 1500);
            } else {
                showSyncMessage('Error saving some changes', 'danger');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            showSyncMessage('Error: ' + error.message, 'danger');
        }
    }
    
    /**
     * Show a sync status message
     * @param {string} message - Message to display
     * @param {string} type - Bootstrap color class (success, danger, etc.)
     * @param {boolean} spinner - Whether to show a spinner
     */
    function showSyncMessage(message, type = 'success', spinner = false) {
        try {
            if (!elements.syncIndicator) return;
            
            elements.syncIndicator.innerHTML = `
                <span class="badge bg-${type} p-2">
                    ${spinner ? '<i class="fas fa-sync sync-spinner me-1"></i>' : ''}
                    ${message}
                </span>
            `;
            
            // Clear message after a delay unless it's a spinner
            if (!spinner) {
                setTimeout(() => {
                    if (elements.syncIndicator) {
                        elements.syncIndicator.innerHTML = '';
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Error showing sync message:', error);
        }
    }
    
    /**
     * Load data for all tabs (called when data changes)
     */
    function refreshAllTabs() {
        try {
            // Get all tab content containers
            const tabPanes = document.querySelectorAll('#incompleteTaxonomyTabContent .tab-pane');
            
            // For each pane, reload the table data
            tabPanes.forEach(pane => {
                const table = pane.querySelector('table');
                if (table) {
                    loadTabData(table.id);
                }
            });
            
            console.log('All incomplete record tabs refreshed');
        } catch (error) {
            console.error('Error refreshing incomplete record tabs:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadTabData,
        refreshAllTabs,
        saveAllChanges
    };
})();
