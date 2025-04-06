/**
 * ZOARCH Lab Inventory - Main Application (Enhanced)
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

/**
 * Initialize the application
 */
async async function initApp() {
    // Show loading indicator
    console.log('Loading...');
    
    try {
        // Make sure required modules are defined
        if (typeof Database === 'undefined') {
            throw new Error('Database module not loaded properly');
        }
        
        // Check for GitHub configuration
        const useGitHub = localStorage.getItem('zoarch_use_github') === 'true';
        const config = {
            useGitHub: useGitHub,
            github: {}
        };
        
        // Initialize the database
        await Database.init(config);
        
        // Setup UI elements
        setupNavigation();
        setupEventListeners();
        
        // Load and display initial data
        loadDashboardData();
        
        // Initialize the tabbed inventory display (if available)
        try {
            if (typeof TabbedInventory !== 'undefined' && 
                TabbedInventory && 
                typeof TabbedInventory.init === 'function') {
                const tabInit = TabbedInventory.init();
                if (tabInit) {
                    console.log('Tabbed inventory initialized');
                    // Load data for the active tab
                    const activeTab = document.querySelector('#taxonomyTabContent .tab-pane.active table');
                    if (activeTab) {
                        TabbedInventory.loadTabData(activeTab.id);
                    }
                } else {
                    // Fall back to normal inventory loading
                    loadInventoryTable();
                }
            } else {
                // Fall back to normal inventory loading
                loadInventoryTable();
            }
        } catch (tabError) {
            console.warn("Error initializing tabbed inventory, falling back to standard view:", tabError);
            loadInventoryTable();
        }
        
        // Initialize incomplete records if available
        try {
            if (typeof IncompleteRecords !== 'undefined' && 
                IncompleteRecords && 
                typeof IncompleteRecords.init === 'function') {
                IncompleteRecords.init();
            }
        } catch (incompleteError) {
            console.warn("Error initializing incomplete records:", incompleteError);
        }
        
        // Initialize tabbed incomplete records if available
        try {
            if (typeof TabbedIncompleteRecords !== 'undefined' && 
                TabbedIncompleteRecords && 
                typeof TabbedIncompleteRecords.init === 'function') {
                const tabInit = TabbedIncompleteRecords.init();
                if (tabInit) {
                    console.log('Tabbed incomplete records initialized');
                    // Load data for the active tab
                    const activeTab = document.querySelector('#incompleteTaxonomyTabContent .tab-pane.active table');
                    if (activeTab) {
                        TabbedIncompleteRecords.loadTabData(activeTab.id);
                    }
                } else {
                    // Fall back to normal loading
                    if (typeof IncompleteRecords !== 'undefined' && 
                        IncompleteRecords && 
                        typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                        IncompleteRecords.loadIncompleteRecords();
                    }
                }
            } else {
                // Fall back to normal loading
                if (typeof IncompleteRecords !== 'undefined' && 
                    IncompleteRecords && 
                    typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                    IncompleteRecords.loadIncompleteRecords();
                }
            }
        } catch (tabIncompleteError) {
            console.warn("Error initializing tabbed incomplete records, falling back to standard view:", tabIncompleteError);
            if (typeof IncompleteRecords !== 'undefined' && 
                IncompleteRecords && 
                typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                IncompleteRecords.loadIncompleteRecords();
            }
        }
        
        // Initialize charts if available
        try {
            if (typeof Charts !== 'undefined' && Charts && typeof Charts.initCharts === 'function') {
                Charts.initCharts(Database.getChartData());
            } else {
                console.warn("Charts module not available, skipping chart initialization");
            }
        } catch (chartError) {
            console.warn("Error initializing charts, continuing without visualizations:", chartError);
        }
        
        console.log('Loading complete');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('There was an error initializing the application. Please check the console for details.');
        console.log('Loading complete');
    }
}
        
        // Check for GitHub configuration
        const useGitHub = localStorage.getItem('zoarch_use_github') === 'true';
        const config = {
            useGitHub: useGitHub,
            github: {}
        };
        
        // Initialize the database
        await Database.init(config);
        
        // Setup UI elements
        setupNavigation();
        setupEventListeners();
        
        // Load and display initial data
        loadDashboardData();
        loadInventoryTable();
        
        // Initialize incomplete records if available
        try {
            if (typeof IncompleteRecords !== 'undefined' && IncompleteRecords && typeof IncompleteRecords.init === 'function') {
                IncompleteRecords.init();
                // Immediately load incomplete records so they're ready when the tab is clicked
                IncompleteRecords.loadIncompleteRecords();
            } else {
                console.warn("IncompleteRecords module not available");
            }
        } catch (incompleteError) {
            console.warn("Error initializing incomplete records:", incompleteError);
        }
        
        // Initialize charts if available
        try {
            if (typeof Charts !== 'undefined' && Charts && typeof Charts.initCharts === 'function') {
                Charts.initCharts(Database.getChartData());
            } else {
                console.warn("Charts module not available, skipping chart initialization");
            }
        } catch (chartError) {
            console.warn("Error initializing charts, continuing without visualizations:", chartError);
        }
        
        console.log('Loading complete');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('There was an error initializing the application. Please check the console for details.');
        console.log('Loading complete');
    }
}

/**
 * Setup navigation between sections
 */
function setupNavigation() {
    try {
        // Get navigation elements
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        const contentSections = document.querySelectorAll('.content-section');
        
        // Add click event to each nav link
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Hide all content sections
                contentSections.forEach(section => section.classList.add('d-none'));
                
                // Show the corresponding section
                const sectionId = this.id.replace('-link', '');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.remove('d-none');
                    
                    // Special handling for inventory tab
                    if (sectionId === 'inventory' && 
                        typeof TabbedInventory !== 'undefined' && 
                        typeof TabbedInventory.refreshAllTabs === 'function') {
                        // Refresh tabs in case data has changed
                        TabbedInventory.refreshAllTabs();
                    }
                    
                    // Special handling for incomplete tab
                    if (sectionId === 'incomplete') {
                        if (typeof TabbedIncompleteRecords !== 'undefined' && 
                            typeof TabbedIncompleteRecords.refreshAllTabs === 'function') {
                            // Use tabbed interface if available
                            TabbedIncompleteRecords.refreshAllTabs();
                        } else if (typeof IncompleteRecords !== 'undefined' && 
                                  typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                            // Fall back to original interface
                            IncompleteRecords.loadIncompleteRecords();
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error setting up navigation:', error);
    }
}
            });
        });
    } catch (error) {
        console.error('Error setting up navigation:', error);
    }
}

/**
 * Setup event listeners for various UI interactions
 */
function setupEventListeners() {
    try {
        // Import form submission
        const importForm = document.getElementById('import-form');
        if (importForm) {
            importForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const fileInput = document.getElementById('import-file');
                if (!fileInput.files || fileInput.files.length === 0) {
                    alert('Please select a file to import.');
                    return;
                }
                
                const file = fileInput.files[0];
                const append = confirm('Do you want to append this data to the existing inventory? Click "OK" to append or "Cancel" to replace all data.');
                
                console.log('Loading...');
                
                Database.importFromFile(file, append)
                    .then(data => {
                        alert(`Successfully imported ${data.length} records.`);
                        
                        // Reload data and update UI
                        loadDashboardData();
                        loadInventoryTable();
                        
                        // Update incomplete records if available
                        if (typeof IncompleteRecords !== 'undefined' && 
                            typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                            IncompleteRecords.loadIncompleteRecords();
                        }
                        
                        // Update charts if available
                        try {
                            if (typeof Charts !== 'undefined' && Charts && typeof Charts.updateCharts === 'function') {
                                Charts.updateCharts(Database.getChartData());
                            }
                        } catch (chartError) {
                            console.warn("Error updating charts, but data was imported successfully:", chartError);
                        }
                        
                        // Reset form
                        importForm.reset();
                        
                        console.log('Loading complete');
                    })
                    .catch(error => {
                        alert(`Error importing data: ${error.message}`);
                        console.log('Loading complete');
                    });
            });
        }
        
        // Add entry form
        const addEntryForm = document.getElementById('add-entry-form');
        if (addEntryForm) {
            addEntryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Collect form data
                const newEntry = {
                    'Owner': document.getElementById('entry-owner').value,
                    'Catalog #': document.getElementById('entry-catalog').value,
                    '# of specimens': document.getElementById('entry-specimens').value,
                    'Order': document.getElementById('entry-order').value,
                    'Family': document.getElementById('entry-family').value,
                    'Genus': document.getElementById('entry-genus').value,
                    'Species': document.getElementById('entry-species').value,
                    'Common Name': document.getElementById('entry-common').value,
                    'Location': document.getElementById('entry-location').value,
                    'Country': document.getElementById('entry-country').value,
                    'How collected': document.getElementById('entry-collected').value,
                    'Date collected': document.getElementById('entry-date').value,
                    'Notes': document.getElementById('entry-notes').value
                };
                
                // Validate required fields
                if (!newEntry['Catalog #']) {
                    alert('Catalog # is required.');
                    return;
                }
                
                // Add the new entry
                if (Database.addItem(newEntry)) {
                    alert('Entry added successfully.');
                    
                    // Reload data and update UI
                    loadDashboardData();
                    loadInventoryTable();
                    
                    // Update incomplete records if available
                    if (typeof IncompleteRecords !== 'undefined' && 
                        typeof IncompleteRecords.loadIncompleteRecords === 'function') {
                        IncompleteRecords.loadIncompleteRecords();
                    }
                    
                    // Reset form
                    addEntryForm.reset();
                } else {
                    alert('Failed to add entry. An item with this Catalog # may already exist.');
                }
            });
        }
        
        // Add export buttons
        setupExportButtons();
        
        // Setup GitHub status indicator
        setupGitHubStatus();
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Setup export buttons
 */
function setupExportButtons() {
    try {
        // Create export buttons container
        const exportContainer = document.createElement('div');
        exportContainer.className = 'row mt-3';
        exportContainer.innerHTML = `
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Export Data</h5>
                        <p>Download your inventory data in Excel or CSV format.</p>
                        <div class="d-flex gap-2">
                            <button id="export-excel-btn" class="btn btn-primary">
                                <i class="fas fa-file-excel"></i> Export to Excel
                            </button>
                            <button id="export-csv-btn" class="btn btn-secondary">
                                <i class="fas fa-file-csv"></i> Export to CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Find update section to append the buttons
        const updateSection = document.getElementById('update');
        if (updateSection) {
            // Find a good place to insert it (after the import section)
            const importSection = updateSection.querySelector('.row').nextElementSibling;
            if (importSection) {
                updateSection.insertBefore(exportContainer, importSection);
                
                // Add event listeners for export buttons
                document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
                document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
            }
        }
    } catch (error) {
        console.error('Error setting up export buttons:', error);
    }
}

/**
 * Export inventory to Excel
 */
function exportToExcel() {
    try {
        // Get all data
        const data = Database.getAllData();
        
        if (data.length === 0) {
            alert('No data to export.');
            return;
        }
        
        // Convert to worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        
        // Generate a filename with date
        const date = new Date().toISOString().slice(0, 10);
        const filename = `zoarch_inventory_${date}.xlsx`;
        
        // Export the file
        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel: ' + error.message);
    }
}

/**
 * Export inventory to CSV
 */
function exportToCSV() {
    try {
        // Get all data
        const data = Database.getAllData();
        
        if (data.length === 0) {
            alert('No data to export.');
            return;
        }
        
        // Convert to worksheet then to CSV
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        // Create a blob and download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Generate a filename with date
        const date = new Date().toISOString().slice(0, 10);
        const filename = `zoarch_inventory_${date}.csv`;
        
        // Create and trigger download link
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Error exporting to CSV: ' + error.message);
    }
}

/**
 * Setup GitHub status indicator
 */
function setupGitHubStatus() {
    try {
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'github-status';
        statusIndicator.className = 'position-fixed bottom-0 end-0 m-3';
        
        // Add to document
        document.body.appendChild(statusIndicator);
        
        // Update status based on storage mode
        updateGitHubStatus();
    } catch (error) {
        console.error('Error setting up GitHub status:', error);
    }
}

/**
 * Update GitHub status indicator
 */
function updateGitHubStatus() {
    try {
        const indicator = document.getElementById('github-status');
        if (!indicator) return;
        
        // Check if using GitHub
        const usingGitHub = Database.getStorageMode() === 'github';
        
        if (usingGitHub) {
            indicator.innerHTML = `
                <div class="badge bg-primary">
                    <i class="fab fa-github"></i> GitHub Sync Enabled
                </div>
            `;
        } else {
            indicator.innerHTML = `
                <div class="badge bg-secondary">
                    <i class="fas fa-database"></i> Local Storage
                </div>
            `;
        }
    } catch (error) {
        console.error('Error updating GitHub status:', error);
    }
}

/**
 * Load and display dashboard data
 */
function loadDashboardData() {
    try {
        // Get summary statistics
        const stats = Database.getSummaryStats();
        
        // Update dashboard cards
        const totalSpecimens = document.getElementById('total-specimens');
        const totalSpecies = document.getElementById('total-species');
        const totalFamilies = document.getElementById('total-families');
        
        if (totalSpecimens) totalSpecimens.textContent = stats.totalSpecimens.toLocaleString();
        if (totalSpecies) totalSpecies.textContent = stats.uniqueSpecies.toLocaleString();
        if (totalFamilies) totalFamilies.textContent = stats.uniqueFamilies.toLocaleString();
        
        // Add Incomplete Items card if it doesn't exist
        addIncompleteCard(stats.incompleteItems);
        
        // Load recent inventory items
        const recentItems = Database.getAllData().slice(-5);
        const tableBody = document.getElementById('recent-inventory-body');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            recentItems.forEach(item => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${item['Catalog #'] || ''}</td>
                    <td>${item['Order'] || ''}</td>
                    <td>${item['Family'] || ''}</td>
                    <td>${item['Genus'] || ''}</td>
                    <td>${item['Species'] || ''}</td>
                    <td>${item['Common Name'] || ''}</td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Add incomplete items card to dashboard
 */
function addIncompleteCard(incompleteCount) {
    try {
        // Check if card already exists
        if (document.getElementById('incomplete-items-card')) return;
        
        // Find the dashboard cards row
        const dashboardRow = document.querySelector('#dashboard .row:nth-child(2)');
        if (!dashboardRow) return;
        
        // Create the card
        const cardColumn = document.createElement('div');
        cardColumn.className = 'col-md-4 mb-3';
        cardColumn.id = 'incomplete-items-card';
        
        cardColumn.innerHTML = `
            <div class="card ${incompleteCount > 0 ? 'border-warning' : 'border-success'}">
                <div class="card-body">
                    <h5 class="card-title">Incomplete Records</h5>
                    <p class="card-text display-4 ${incompleteCount > 0 ? 'text-warning' : 'text-success'}" id="incomplete-count">${incompleteCount}</p>
                    ${incompleteCount > 0 ? `<a href="#" id="view-incomplete-link" class="btn btn-warning btn-sm">View & Edit</a>` : ''}
                </div>
            </div>
        `;
        
        // Add to dashboard
        dashboardRow.appendChild(cardColumn);
        
        // Add click handler for the "View & Edit" link
        const viewLink = document.getElementById('view-incomplete-link');
        if (viewLink) {
            viewLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Trigger click on the incomplete tab
                const incompleteLink = document.getElementById('incomplete-link');
                if (incompleteLink) {
                    incompleteLink.click();
                }
            });
        }
    } catch (error) {
        console.error('Error adding incomplete items card:', error);
    }
}

/**
 * Load and initialize the inventory table
 */
function loadInventoryTable() {
    try {
        const tableElement = document.getElementById('inventory-table');
        if (!tableElement) return;
        
        // Get all data
        const data = Database.getAllData();
        
        // Clear existing table
        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        // Populate table
        data.forEach(item => {
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
        const detailsButtons = document.querySelectorAll('.view-details-btn');
        detailsButtons.forEach(button => {
            button.addEventListener('click', function() {
                const catalogNum = this.getAttribute('data-catalog');
                showItemDetails(catalogNum);
            });
        });
    } catch (error) {
        console.error('Error loading inventory table:', error);
    }
}

/**
 * Show details for a specific item
 */
function showItemDetails(catalogNum) {
    try {
        const item = Database.getItemByCatalog(catalogNum);
        if (!item) {
            alert('Item not found.');
            return;
        }
        
        // Create a modal to show details
        const modalId = 'item-details-modal';
        let modal = document.getElementById(modalId);
        
        // Remove existing modal if it exists
        if (modal) {
            document.body.removeChild(modal);
        }
        
        // Create a new modal
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');
        
        // Collect all item properties
        const fields = Object.keys(item);
        const fieldsHTML = fields.map(field => {
            const value = item[field] || '';
            const isIncomplete = !value && ['Order', 'Family', 'Genus', 'Species', 'Common Name', 
                'Location', 'Country', 'How collected', 'Date collected'].includes(field);
            
            return `
                <div class="row mb-2">
                    <div class="col-md-4 fw-bold">${field}:</div>
                    <div class="col-md-8 ${isIncomplete ? 'text-danger fst-italic' : ''}">${isIncomplete ? 'Missing' : value}</div>
                </div>
            `;
        }).join('');
        
        // Build modal content
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Item Details: ${item['Catalog #']}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${fieldsHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary edit-item-btn" data-catalog="${item['Catalog #']}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the document
        document.body.appendChild(modal);
        
        // Initialize and show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Add event listener for edit button
        modal.querySelector('.edit-item-btn').addEventListener('click', function() {
            const catalog = this.getAttribute('data-catalog');
            
            // Close this modal
            bsModal.hide();
            
            // Check if item is incomplete
            if (isIncompleteRecord(item)) {
                // Navigate to incomplete tab
                const incompleteLink = document.getElementById('incomplete-link');
                if (incompleteLink) {
                    incompleteLink.click();
                    
                    // Flash the row with this catalog
                    setTimeout(() => {
                        const row = document.querySelector(`#incomplete-table tr[data-catalog="${catalog}"]`);
                        if (row) {
                            row.classList.add('bg-info');
                            setTimeout(() => row.classList.remove('bg-info'), 2000);
                            
                            // Scroll to the row
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 500);
                }
            } else {
                // Navigate to update tab
                const updateLink = document.getElementById('update-link');
                if (updateLink) {
                    updateLink.click();
                    
                    // TODO: Add edit form for complete items if needed
                    alert('Edit functionality for complete records is not yet implemented.');
                }
            }
        });
    } catch (error) {
        console.error('Error showing item details:', error);
    }
}

/**
 * Check if a record has incomplete fields
 */
function isIncompleteRecord(item) {
    // Define required fields (same as in Database.hasIncompleteFields)
    const requiredFields = [
        'Order', 'Family', 'Genus', 'Species', 'Common Name', 
        'Location', 'Country', 'How collected', 'Date collected'
    ];
    
    return requiredFields.some(field => 
        !item[field] || item[field].toString().trim() === ''
    );
}
