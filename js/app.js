/**
 * ZOARCH Lab Inventory - Main Application (Cleaned)
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp().then(() => {
        console.log('ZOARCH Lab Inventory initialized successfully');
    }).catch(error => {
        console.error("Error during initialization:", error);
        alert('There was an error initializing the application. Please check the console for details.');
    });
});

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Initializing ZOARCH Lab Inventory...');
    
    try {
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
        setupGitHubConfiguration();
        
        // Load and display initial data
        loadDashboardData();
        
        // Initialize the tabbed inventory display
        if (typeof TabbedInventory !== 'undefined' && TabbedInventory.init) {
            if (TabbedInventory.init()) {
                console.log('Tabbed inventory initialized');
            } else {
                console.warn('Tabbed inventory initialization returned false');
            }
        } else {
            console.warn('TabbedInventory module not available');
        }
        
        // Initialize incomplete records
        if (typeof IncompleteRecords !== 'undefined' && IncompleteRecords.init) {
            if (IncompleteRecords.init()) {
                console.log('Incomplete records initialized');
                // Load initial data
                IncompleteRecords.loadIncompleteRecords();
            } else {
                console.warn('Incomplete records initialization returned false');
            }
        } else {
            console.warn('IncompleteRecords module not available');
        }
        
        // Initialize charts
        if (typeof Charts !== 'undefined' && Charts.initCharts) {
            Charts.initCharts(Database.getChartData());
        } else {
            console.warn('Charts module not available');
        }
        
        // Setup GitHub status indicator
        setupGitHubStatus();
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        throw error;
    }
}

/**
 * Setup navigation between sections
 */
function setupNavigation() {
    try {
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        const contentSections = document.querySelectorAll('.content-section');
        
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
                    
                    // Special handling for different sections
                    if (sectionId === 'inventory') {
                        if (typeof TabbedInventory !== 'undefined' && TabbedInventory.refreshAllTabs) {
                            TabbedInventory.refreshAllTabs();
                        }
                    } else if (sectionId === 'incomplete') {
                        if (typeof IncompleteRecords !== 'undefined' && IncompleteRecords.loadIncompleteRecords) {
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

/**
 * Setup event listeners for various UI interactions
 */
function setupEventListeners() {
    try {
        // Import form submission
        const importForm = document.getElementById('import-form');
        if (importForm) {
            importForm.addEventListener('submit', handleImport);
        }
        
        // Add entry form
        const addEntryForm = document.getElementById('add-entry-form');
        if (addEntryForm) {
            addEntryForm.addEventListener('submit', handleAddEntry);
        }
        
        // Export buttons
        const excelBtn = document.getElementById('export-excel-btn');
        if (excelBtn) {
            excelBtn.addEventListener('click', exportToExcel);
        }
        
        const csvBtn = document.getElementById('export-csv-btn');
        if (csvBtn) {
            csvBtn.addEventListener('click', exportToCSV);
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Setup GitHub configuration handlers
 */
function setupGitHubConfiguration() {
    try {
        const configBtn = document.getElementById('configure-github-btn');
        const aboutBtn = document.getElementById('about-github-setup');
        const modal = document.getElementById('github-config-modal');
        const saveBtn = document.getElementById('save-github-config');
        
        if (configBtn && modal) {
            configBtn.addEventListener('click', showGitHubModal);
        }
        
        if (aboutBtn && modal) {
            aboutBtn.addEventListener('click', showGitHubModal);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', saveGitHubConfig);
        }
    } catch (error) {
        console.error('Error setting up GitHub configuration:', error);
    }
}

/**
 * Show GitHub configuration modal
 */
function showGitHubModal() {
    try {
        const modal = new bootstrap.Modal(document.getElementById('github-config-modal'));
        
        // Pre-fill form with stored values
        document.getElementById('github-owner').value = localStorage.getItem('zoarch_github_owner') || '';
        document.getElementById('github-repo').value = localStorage.getItem('zoarch_github_repo') || '';
        document.getElementById('github-branch').value = localStorage.getItem('zoarch_github_branch') || 'main';
        document.getElementById('github-path').value = localStorage.getItem('zoarch_github_path') || 'data/inventory.json';
        
        modal.show();
    } catch (error) {
        console.error('Error showing GitHub modal:', error);
    }
}

/**
 * Save GitHub configuration
 */
async function saveGitHubConfig() {
    const saveBtn = document.getElementById('save-github-config');
    const statusText = document.getElementById('github-config-status');
    
    try {
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        const owner = document.getElementById('github-owner').value.trim();
        const repo = document.getElementById('github-repo').value.trim();
        const branch = document.getElementById('github-branch').value.trim() || 'main';
        const path = document.getElementById('github-path').value.trim() || 'data/inventory.json';
        const token = document.getElementById('github-token').value.trim();
        
        if (!owner || !repo || !token) {
            statusText.textContent = "Please fill in all required fields.";
            return;
        }
        
        // Store configuration
        localStorage.setItem('zoarch_github_owner', owner);
        localStorage.setItem('zoarch_github_repo', repo);
        localStorage.setItem('zoarch_github_branch', branch);
        localStorage.setItem('zoarch_github_path', path);
        localStorage.setItem('zoarch_use_github', 'true');
        sessionStorage.setItem('zoarch_github_token', token);
        
        // Initialize GitHub storage
        if (typeof GitHubStorage !== 'undefined') {
            const success = await GitHubStorage.init({ owner, repo, branch, path, token });
            
            if (success) {
                if (Database.setStorageMode) {
                    Database.setStorageMode('github');
                }
                statusText.textContent = "✅ Connected to GitHub successfully!";
                
                setTimeout(() => {
                    bootstrap.Modal.getInstance(document.getElementById('github-config-modal')).hide();
                    if (confirm('GitHub configuration saved! Reload the page to apply changes?')) {
                        location.reload();
                    }
                }, 1500);
            } else {
                statusText.textContent = "❌ Failed to connect. Check your settings.";
            }
        } else {
            statusText.textContent = "✅ Configuration saved. Reload to apply changes.";
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('github-config-modal')).hide();
                if (confirm('GitHub configuration saved! Reload the page to apply changes?')) {
                    location.reload();
                }
            }, 1500);
        }
    } catch (error) {
        console.error('Error saving GitHub config:', error);
        statusText.textContent = `Error: ${error.message}`;
    } finally {
        saveBtn.innerHTML = 'Save';
        saveBtn.disabled = false;
    }
}

/**
 * Setup GitHub status indicator
 */
function setupGitHubStatus() {
    try {
        if (!document.getElementById('github-status')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'github-status';
            statusIndicator.className = 'position-fixed bottom-0 end-0 m-3';
            document.body.appendChild(statusIndicator);
        }
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
        
        const usingGitHub = Database.getStorageMode && Database.getStorageMode() === 'github';
        
        indicator.innerHTML = usingGitHub ? 
            '<div class="badge bg-primary"><i class="fab fa-github"></i> GitHub Sync Enabled</div>' :
            '<div class="badge bg-secondary"><i class="fas fa-database"></i> Local Storage</div>';
    } catch (error) {
        console.error('Error updating GitHub status:', error);
    }
}

/**
 * Load and display dashboard data
 */
function loadDashboardData() {
    try {
        const stats = Database.getSummaryStats();
        
        // Update dashboard cards
        const totalSpecimens = document.getElementById('total-specimens');
        const totalSpecies = document.getElementById('total-species');
        const totalFamilies = document.getElementById('total-families');
        
        if (totalSpecimens) totalSpecimens.textContent = stats.totalSpecimens.toLocaleString();
        if (totalSpecies) totalSpecies.textContent = stats.uniqueSpecies.toLocaleString();
        if (totalFamilies) totalFamilies.textContent = stats.uniqueFamilies.toLocaleString();
        
        // Add incomplete card if needed
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
        if (document.getElementById('incomplete-items-card')) return;
        
        const dashboardRow = document.querySelector('#dashboard .row:nth-child(2)');
        if (!dashboardRow) return;
        
        const cardColumn = document.createElement('div');
        cardColumn.className = 'col-md-4 mb-3';
        cardColumn.id = 'incomplete-items-card';
        
        cardColumn.innerHTML = `
            <div class="card ${incompleteCount > 0 ? 'border-warning' : 'border-success'}">
                <div class="card-body">
                    <h5 class="card-title">Incomplete Records</h5>
                    <p class="card-text display-4 ${incompleteCount > 0 ? 'text-warning' : 'text-success'}" id="incomplete-count">${incompleteCount}</p>
                    ${incompleteCount > 0 ? '<a href="#" id="view-incomplete-link" class="btn btn-warning btn-sm">View & Edit</a>' : ''}
                </div>
            </div>
        `;
        
        dashboardRow.appendChild(cardColumn);
        
        const viewLink = document.getElementById('view-incomplete-link');
        if (viewLink) {
            viewLink.addEventListener('click', function(e) {
                e.preventDefault();
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
 * Handle import form submission
 */
function handleImport(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('import-file');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file to import.');
        return;
    }
    
    const file = fileInput.files[0];
    const append = confirm('Do you want to append this data to the existing inventory? Click "OK" to append or "Cancel" to replace all data.');
    
    Database.importFromFile(file, append)
        .then(data => {
            alert(`Successfully imported ${data.length} records.`);
            
            // Reload data and update UI
            loadDashboardData();
            
            if (typeof TabbedInventory !== 'undefined' && TabbedInventory.refreshAllTabs) {
                TabbedInventory.refreshAllTabs();
            }
            
            if (typeof IncompleteRecords !== 'undefined' && IncompleteRecords.loadIncompleteRecords) {
                IncompleteRecords.loadIncompleteRecords();
            }
            
            if (typeof Charts !== 'undefined' && Charts.updateCharts) {
                Charts.updateCharts(Database.getChartData());
            }
            
            // Reset form
            fileInput.value = '';
        })
        .catch(error => {
            alert(`Error importing data: ${error.message}`);
        });
}

/**
 * Handle add entry form submission
 */
function handleAddEntry(e) {
    e.preventDefault();
    
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
    
    if (!newEntry['Catalog #']) {
        alert('Catalog # is required.');
        return;
    }
    
    if (Database.addItem(newEntry)) {
        alert('Entry added successfully.');
        
        // Reload data and update UI
        loadDashboardData();
        
        if (typeof TabbedInventory !== 'undefined' && TabbedInventory.refreshAllTabs) {
            TabbedInventory.refreshAllTabs();
        }
        
        if (typeof IncompleteRecords !== 'undefined' && IncompleteRecords.loadIncompleteRecords) {
            IncompleteRecords.loadIncompleteRecords();
        }
        
        // Reset form
        e.target.reset();
    } else {
        alert('Failed to add entry. An item with this Catalog # may already exist.');
    }
}

/**
 * Export inventory to Excel
 */
function exportToExcel() {
    try {
        const data = Database.getAllData();
        
        if (data.length === 0) {
            alert('No data to export.');
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        
        const date = new Date().toISOString().slice(0, 10);
        const filename = `zoarch_inventory_${date}.xlsx`;
        
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
        const data = Database.getAllData();
        
        if (data.length === 0) {
            alert('No data to export.');
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().slice(0, 10);
        const filename = `zoarch_inventory_${date}.csv`;
        
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
 * Show details for a specific item (global function for use by other modules)
 */
window.showItemDetails = function(catalogNum) {
    try {
        const item = Database.getItemByCatalog(catalogNum);
        if (!item) {
            alert('Item not found.');
            return;
        }
        
        const modalId = 'item-details-modal';
        let modal = document.getElementById(modalId);
        
        if (modal) {
            document.body.removeChild(modal);
        }
        
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');
        
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
        
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.querySelector('.edit-item-btn').addEventListener('click', function() {
            const catalog = this.getAttribute('data-catalog');
            bsModal.hide();
            
            if (Database.hasIncompleteFields && Database.hasIncompleteFields(item)) {
                const incompleteLink = document.getElementById('incomplete-link');
                if (incompleteLink) {
                    incompleteLink.click();
                    
                    setTimeout(() => {
                        const row = document.querySelector(`tr[data-catalog="${catalog}"]`);
                        if (row) {
                            row.classList.add('bg-info');
                            setTimeout(() => row.classList.remove('bg-info'), 2000);
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 500);
                }
            } else {
                const updateLink = document.getElementById('update-link');
                if (updateLink) {
                    updateLink.click();
                }
                alert('Edit functionality for complete records is not yet implemented.');
            }
        });
    } catch (error) {
        console.error('Error showing item details:', error);
    }
};
