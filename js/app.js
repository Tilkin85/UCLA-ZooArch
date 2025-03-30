/**
 * ZOARCH Lab Inventory - Main Application (Simplified)
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
    console.log('Loading...');
    
    try {
        // Make sure Database is defined
        if (typeof Database === 'undefined') {
            throw new Error('Database module not loaded properly');
        }
        
        // Initialize the database
        await Database.init();
        
        // Setup UI elements
        setupNavigation();
        setupEventListeners();
        
        // Load and display initial data
        loadDashboardData();
        loadInventoryTable();
        
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
                    
                    // Reset form
                    addEntryForm.reset();
                } else {
                    alert('Failed to add entry. An item with this Catalog # may already exist.');
                }
            });
        }
        
        // Setup other listeners as needed (simplified for core functionality)
    } catch (error) {
        console.error('Error setting up event listeners:', error);
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
        
        // Initialize basic table functionality
        // Simplified - no DataTables for reliability
    } catch (error) {
        console.error('Error loading inventory table:', error);
    }
}
