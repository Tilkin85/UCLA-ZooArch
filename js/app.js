/**
 * ZOARCH Lab Inventory - Main Application
 * This file handles the UI interactions and brings together the database and chart modules
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

/**
 * Initialize the application
 */
async function initApp() {
    // Show loading indicator
    showLoading(true);
    
    try {
        // Initialize the database
        await Database.init();
        
        // Setup UI elements
        setupNavigation();
        setupEventListeners();
        setupFilterControls();
        
        // Load and display initial data
        loadDashboardData();
        loadInventoryTable();
        
        // Initialize charts with data - with error handling
        try {
            if (typeof Charts !== 'undefined' && Charts && typeof Charts.initCharts === 'function') {
                Charts.initCharts(Database.getChartData());
            } else {
                console.warn("Charts module not available, skipping chart initialization");
            }
        } catch (chartError) {
            console.warn("Error initializing charts, continuing without visualizations:", chartError);
        }
        
        // Hide loading indicator
        showLoading(false);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize the application. Please refresh the page and try again.');
        showLoading(false);
    }
}

/**
 * Show or hide loading indicator
 * @param {boolean} show Whether to show or hide the loading indicator
 */
function showLoading(show) {
    // Implement loading indicator logic here
    console.log(show ? 'Loading...' : 'Loading complete');
}

/**
 * Show error message
 * @param {string} message Error message to display
 */
function showError(message) {
    alert(message);
}

/**
 * Setup navigation between sections
 */
function setupNavigation() {
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
            document.getElementById(sectionId).classList.remove('d-none');
        });
    });
}

/**
 * Setup event listeners for various UI interactions
 */
function setupEventListeners() {
    // Import form submission
    const importForm = document.getElementById('import-form');
    if (importForm) {
        importForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('import-file');
            if (!fileInput.files || fileInput.files.length === 0) {
                showError('Please select a file to import.');
                return;
            }
            
            const file = fileInput.files[0];
            const append = confirm('Do you want to append this data to the existing inventory? Click "OK" to append or "Cancel" to replace all data.');
            
            showLoading(true);
            
            Database.importFromFile(file, append)
                .then(data => {
                    alert(`Successfully imported ${data.length} records.`);
                    
                    // Reload data and update UI
                    loadDashboardData();
                    loadInventoryTable();
                    
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
                    
                    showLoading(false);
                })
                .catch(error => {
                    showError(`Error importing data: ${error.message}`);
                    showLoading(false);
                });
        });
    }
    
    // Export buttons
    const exportExcelBtn = document.getElementById('export-excel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            const blob = Database.exportToExcel();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `zoarch_inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        });
    }
    
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function() {
            const blob = Database.exportToCSV();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `zoarch_inventory_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
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
                showError('Catalog # is required.');
                return;
            }
            
            // Add the new entry
            if (Database.addItem(newEntry)) {
                alert('Entry added successfully.');
                
                // Reload data and update UI
                loadDashboardData();
                loadInventoryTable();
                
                // Update charts if available
                try {
                    if (typeof Charts !== 'undefined' && Charts && typeof Charts.updateCharts === 'function') {
                        Charts.updateCharts(Database.getChartData());
                    }
                } catch (chartError) {
                    console.warn("Error updating charts, but entry was added successfully:", chartError);
                }
                
                // Reset form
                addEntryForm.reset();
            } else {
                showError('Failed to add entry. An item with this Catalog # may already exist.');
            }
        });
    }
    
    // Edit search button
    const editSearchBtn = document.getElementById('edit-search-btn');
    if (editSearchBtn) {
        editSearchBtn.addEventListener('click', function() {
            const catalogNumber = document.getElementById('edit-search').value.trim();
            if (!catalogNumber) {
                showError('Please enter a Catalog # to search.');
                return;
            }
            
            const item = Database.getItemByCatalog(catalogNumber);
            if (!item) {
                document.getElementById('edit-results').innerHTML = `<div class="alert alert-warning">No item found with Catalog # ${catalogNumber}</div>`;
                return;
            }
            
            // Display edit form with item data
            displayEditForm(item);
        });
    }
    
    // Details buttons in inventory table
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('view-details-btn')) {
            const catalogNumber = e.target.dataset.catalog;
            const item = Database.getItemByCatalog(catalogNumber);
            
            if (item) {
                displayItemDetails(item);
            }
        }
    });
    
    // Edit button in the details modal
    const editItemBtn = document.getElementById('editItemBtn');
    if (editItemBtn) {
        editItemBtn.addEventListener('click', function() {
            const catalogNumber = this.dataset.catalog;
            const item = Database.getItemByCatalog(catalogNumber);
            
            if (item) {
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
                modal.hide();
                
                // Switch to edit tab
                document.getElementById('update-link').click();
                
                // Display edit form
                setTimeout(() => {
                    document.getElementById('edit-search').value = catalogNumber;
                    document.getElementById('edit-search-btn').click();
                }, 500);
            }
        });
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            // Reset filter dropdowns
            document.getElementById('order-filter').value = '';
            document.getElementById('family-filter').value = '';
            document.getElementById('genus-filter').value = '';
            
            // Reset the DataTable
            if (window.inventoryTable) {
                window.inventoryTable.search('').columns().search('').draw();
            }
        });
    }
}

/**
 * Setup filter controls for the inventory table
 */
function setupFilterControls() {
    // Populate filter dropdowns
    populateFilterDropdown('order-filter', 'Order');
    populateFilterDropdown('family-filter', 'Family');
    populateFilterDropdown('genus-filter', 'Genus');
    
    // Add event listeners to filter controls
    document.getElementById('order-filter').addEventListener('change', applyFilters);
    document.getElementById('family-filter').addEventListener('change', applyFilters);
    document.getElementById('genus-filter').addEventListener('change', applyFilters);
}

/**
 * Populate a filter dropdown with unique values
 * @param {string} elementId ID of the select element
 * @param {string} field Field to get values for
 */
function populateFilterDropdown(elementId, field) {
    const select = document.getElementById(elementId);
    if (!select) return;
    
    // Get unique values
    const values = Database.getUniqueValues(field);
    
    // Clear existing options (except the first one)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add options
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

/**
 * Apply filters to the inventory table
 */
function applyFilters() {
    if (!window.inventoryTable) return;
    
    const orderValue = document.getElementById('order-filter').value;
    const familyValue = document.getElementById('family-filter').value;
    const genusValue = document.getElementById('genus-filter').value;
    
    // Clear existing filters
    window.inventoryTable.columns().search('');
    
    // Apply new filters
    if (orderValue) window.inventoryTable.column(2).search(orderValue);
    if (familyValue) window.inventoryTable.column(3).search(familyValue);
    if (genusValue) window.inventoryTable.column(4).search(genusValue);
    
    // Redraw table
    window.inventoryTable.draw();
}

/**
 * Load and display dashboard data
 */
function loadDashboardData() {
    // Get summary statistics
    const stats = Database.getSummaryStats();
    
    // Update dashboard cards
    document.getElementById('total-specimens').textContent = stats.totalSpecimens.toLocaleString();
    document.getElementById('total-species').textContent = stats.uniqueSpecies.toLocaleString();
    document.getElementById('total-families').textContent = stats.uniqueFamilies.toLocaleString();
    
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
}

/**
 * Load and initialize the inventory table
 */
function loadInventoryTable() {
    const tableElement = document.getElementById('inventory-table');
    if (!tableElement) return;
    
    // Get all data
    const data = Database.getAllData();
    
    // Clear existing table
    const tableBody = tableElement.querySelector('tbody');
    tableBody.innerHTML = '';
    
    // Populate table
    data.forEach(item => {
        const row = document.createElement('tr');
        
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
    
    // Initialize DataTable if not already initialized
    if (!window.inventoryTable) {
        try {
            window.inventoryTable = new DataTable(tableElement, {
                responsive: true,
                pageLength: 25,
                language: {
                    search: "Search inventory:",
                    lengthMenu: "Show _MENU_ entries per page",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                },
                columnDefs: [
                    { targets: -1, orderable: false, searchable: false }
                ]
            });
        } catch (error) {
            console.error('Error initializing DataTable:', error);
            // Fallback to basic HTML table if DataTable fails to initialize
        }
    } else {
        // Refresh the DataTable
        try {
            window.inventoryTable.clear().rows.add(tableBody.rows).draw();
        } catch (error) {
            console.error('Error refreshing DataTable:', error);
            // Just leave the HTML table as is if DataTable refresh fails
        }
    }
}

/**
 * Display item details in a modal
 * @param {Object} item The inventory item to display
 */
function displayItemDetails(item) {
    const modal = document.getElementById('itemDetailsModal');
    const modalTitle = document.getElementById('itemDetailsTitle');
    const modalBody = document.getElementById('itemDetailsBody');
    const editBtn = document.getElementById('editItemBtn');
    
    if (!modal || !modalTitle || !modalBody || !editBtn) return;
    
    // Set modal title
    modalTitle.textContent = `${item['Genus'] || ''} ${item['Species'] || ''} (${item['Common Name'] || 'Unknown'})`;
    
    // Set edit button data attribute
    editBtn.dataset.catalog = item['Catalog #'];
    
    // Build details content
    let content = `
        <div class="row">
            <div class="col-md-6">
                <h5>Taxonomic Information</h5>
                <table class="table table-sm">
                    <tr>
                        <th>Order:</th>
                        <td>${item['Order'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Family:</th>
                        <td>${item['Family'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Genus:</th>
                        <td>${item['Genus'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Species:</th>
                        <td>${item['Species'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Common Name:</th>
                        <td>${item['Common Name'] || ''}</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h5>Collection Information</h5>
                <table class="table table-sm">
                    <tr>
                        <th>Owner:</th>
                        <td>${item['Owner'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Catalog #:</th>
                        <td>${item['Catalog #'] || ''}</td>
                    </tr>
                    <tr>
                        <th># of Specimens:</th>
                        <td>${item['# of specimens'] || '1'}</td>
                    </tr>
                    <tr>
                        <th>Location:</th>
                        <td>${item['Location'] || ''}</td>
                    </tr>
                    <tr>
                        <th>Country:</th>
                        <td>${item['Country'] || ''}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;
    
    // Add additional information if available
    if (item['How collected'] || item['Date collected'] || item['Zone'] || 
        item['State'] || item['County'] || item['Town'] || 
        item['Co-ordinates'] || item['Collector'] || item['Preparer']) {
        
        content += `
            <div class="row mt-3">
                <div class="col-12">
                    <h5>Additional Details</h5>
                    <table class="table table-sm">
                        ${item['How collected'] ? `<tr><th>How Collected:</th><td>${item['How collected']}</td></tr>` : ''}
                        ${item['Date collected'] ? `<tr><th>Date Collected:</th><td>${item['Date collected']}</td></tr>` : ''}
                        ${item['Zone'] ? `<tr><th>Zone:</th><td>${item['Zone']}</td></tr>` : ''}
                        ${item['State'] ? `<tr><th>State:</th><td>${item['State']}</td></tr>` : ''}
                        ${item['County'] ? `<tr><th>County:</th><td>${item['County']}</td></tr>` : ''}
                        ${item['Town'] ? `<tr><th>Town:</th><td>${item['Town']}</td></tr>` : ''}
                        ${item['Co-ordinates'] ? `<tr><th>Coordinates:</th><td>${item['Co-ordinates']}</td></tr>` : ''}
                        ${item['Collector'] ? `<tr><th>Collector:</th><td>${item['Collector']}</td></tr>` : ''}
                        ${item['Preparer'] ? `<tr><th>Preparer:</th><td>${item['Preparer']}</td></tr>` : ''}
                    </table>
                </div>
            </div>
        `;
    }
    
    // Set modal content
    modalBody.innerHTML = content;
    
    // Show the modal
    try {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback to basic alert if modal fails
        alert(`Item details for ${item['Catalog #']}: ${item['Genus']} ${item['Species']} (${item['Common Name']})`);
    }
}

/**
 * Display edit form for an inventory item
 * @param {Object} item The inventory item to edit
 */
function displayEditForm(item) {
    const editResults = document.getElementById('edit-results');
    if (!editResults) return;
    
    // Create form HTML
    let formHtml = `
        <form id="edit-item-form" class="mt-3">
            <input type="hidden" id="edit-original-catalog" value="${item['Catalog #']}">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label for="edit-owner" class="form-label">Owner</label>
                    <input type="text" class="form-control" id="edit-owner" value="${item['Owner'] || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="edit-catalog" class="form-label">Catalog #</label>
                    <input type="number" class="form-control" id="edit-catalog" value="${item['Catalog #'] || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="edit-specimens" class="form-label"># of Specimens</label>
                    <input type="number" class="form-control" id="edit-specimens" value="${item['# of specimens'] || '1'}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-3">
                    <label for="edit-order" class="form-label">Order</label>
                    <input type="text" class="form-control" id="edit-order" value="${item['Order'] || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label for="edit-family" class="form-label">Family</label>
                    <input type="text" class="form-control" id="edit-family" value="${item['Family'] || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label for="edit-genus" class="form-label">Genus</label>
                    <input type="text" class="form-control" id="edit-genus" value="${item['Genus'] || ''}">
                </div>
                <div class="col-md-3 mb-3">
                    <label for="edit-species" class="form-label">Species</label>
                    <input type="text" class="form-control" id="edit-species" value="${item['Species'] || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="edit-common" class="form-label">Common Name</label>
                    <input type="text" class="form-control" id="edit-common" value="${item['Common Name'] || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label for="edit-location" class="form-label">Location</label>
                    <input type="text" class="form-control" id="edit-location" value="${item['Location'] || ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label for="edit-country" class="form-label">Country</label>
                    <input type="text" class="form-control" id="edit-country" value="${item['Country'] || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="edit-collected" class="form-label">How Collected</label>
                    <input type="text" class="form-control" id="edit-collected" value="${item['How collected'] || ''}">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="edit-date" class="form-label">Date Collected</label>
                    <input type="date" class="form-control" id="edit-date" value="${item['Date collected'] ? new Date(item['Date collected']).toISOString().split('T')[0] : ''}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-12 mb-3">
                    <label for="edit-notes" class="form-label">Notes</label>
                    <textarea class="form-control" id="edit-notes" rows="3">${item['Notes'] || ''}</textarea>
                </div>
            </div>
            <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-danger" id="delete-item-btn">Delete Item</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;
    
    // Set the form HTML
    editResults.innerHTML = formHtml;
    
    // Add event listener for form submission
    const editForm = document.getElementById('edit-item-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const originalCatalog = document.getElementById('edit-original-catalog').value;
            
            // Collect form data
            const updatedData = {
                'Owner': document.getElementById('edit-owner').value,
                'Catalog #': document.getElementById('edit-catalog').value,
                '# of specimens': document.getElementById('edit-specimens').value,
                'Order': document.getElementById('edit-order').value,
                'Family': document.getElementById('edit-family').value,
                'Genus': document.getElementById('edit-genus').value,
                'Species': document.getElementById('edit-species').value,
                'Common Name': document.getElementById('edit-common').value,
                'Location': document.getElementById('edit-location').value,
                'Country': document.getElementById('edit-country').value,
                'How collected': document.getElementById('edit-collected').value,
                'Date collected': document.getElementById('edit-date').value,
                'Notes': document.getElementById('edit-notes').value
            };
            
            // Update the item
            if (Database.updateItem(originalCatalog, updatedData)) {
                alert('Item updated successfully.');
                
                // Reload data and update UI
                loadDashboardData();
                loadInventoryTable();
                
                // Update charts if available
                try {
                    if (typeof Charts !== 'undefined' && Charts && typeof Charts.updateCharts === 'function') {
                        Charts.updateCharts(Database.getChartData());
                    }
                } catch (chartError) {
                    console.warn("Error updating charts, but item was updated successfully:", chartError);
                }
                
                // Clear edit form
                editResults.innerHTML = `<div class="alert alert-success">Item with Catalog # ${updatedData['Catalog #']} was updated successfully.</div>`;
            } else {
                showError('Failed to update item.');
            }
        });
        
        // Add event listener for delete button
        const deleteBtn = document.getElementById('delete-item-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const originalCatalog = document.getElementById('edit-original-catalog').value;
                
                if (confirm(`Are you sure you want to delete item with Catalog # ${originalCatalog}? This action cannot be undone.`)) {
                    if (Database.deleteItem(originalCatalog)) {
                        alert('Item deleted successfully.');
                        
                        // Reload data and update UI
                        loadDashboardData();
                        loadInventoryTable();
                        
                        // Update charts if available
                        try {
                            if (typeof Charts !== 'undefined' && Charts && typeof Charts.updateCharts === 'function') {
                                Charts.updateCharts(Database.getChartData());
                            }
                        } catch (chartError) {
                            console.warn("Error updating charts, but item was deleted successfully:", chartError);
                        }
                        
                        // Clear edit form
                        editResults.innerHTML = `<div class="alert alert-success">Item with Catalog # ${originalCatalog} was deleted successfully.</div>`;
                    } else {
                        showError('Failed to delete item.');
                    }
                }
            });
        }
    }
}