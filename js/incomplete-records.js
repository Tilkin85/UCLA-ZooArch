/**
 * ZOARCH Lab Inventory - Incomplete Records Management (Fixed)
 */

// IncompleteRecords namespace
const IncompleteRecords = (function() {
    // Store references to DOM elements
    const elements = {
        table: null,
        tableBody: null,
        saveButton: null,
        syncIndicator: null,
        summaryElement: null,
        storageStatus: null,
        configureGitHubBtn: null
    };
    
    // Store any cells currently being edited
    let activeEditCell = null;
    
    // Cache for the incomplete records
    let incompleteData = [];
    // Keep track of modified rows by catalog number
    let modifiedRows = new Set();
    
    /**
     * Initialize the incomplete records functionality
     */
    function init() {
        try {
            console.log('Initializing incomplete records module...');
            
            // Get DOM elements
            elements.table = document.getElementById('incomplete-table');
            elements.tableBody = document.getElementById('incomplete-table-body');
            elements.saveButton = document.getElementById('save-incomplete-btn');
            elements.syncIndicator = document.getElementById('incomplete-sync-indicator');
            elements.summaryElement = document.getElementById('incomplete-summary');
            elements.storageStatus = document.getElementById('storage-status');
            elements.configureGitHubBtn = document.getElementById('configure-github-btn');
            
            if (!elements.table || !elements.tableBody || !elements.saveButton) {
                console.warn('Required DOM elements for incomplete records not found. This is normal if not on incomplete records page.');
                return false;
            }
            
            // Add event listeners
            elements.saveButton.addEventListener('click', saveAllChanges);
            
            // Initialize GitHub config UI if GitHub storage is available
            if (typeof GitHubStorage !== 'undefined') {
                initGitHubConfigUI();
            }
            
            // Load incomplete records on initialization
            loadIncompleteRecords();
            
            console.log('Incomplete records functionality initialized');
            return true;
        } catch (error) {
            console.error('Error initializing incomplete records:', error);
            return false;
        }
    }
    
    /**
     * Load incomplete records into the table
     */
    function loadIncompleteRecords() {
        try {
            console.log('Loading incomplete records...');
            
            // Make sure elements exist before continuing
            if (!elements.tableBody) {
                console.warn('Table body element not found for incomplete records');
                return;
            }
            
            // Clear the table and reset cache
            elements.tableBody.innerHTML = '';
            incompleteData = [];
            modifiedRows = new Set();
            
            // Update storage status display
            updateStorageStatus();
            
            // Get incomplete records from the database
            const records = Database.getIncompleteRecords();
            console.log(`Retrieved ${records.length} incomplete records from database`);
            incompleteData = [...records]; // Copy the array
            
            // Update the summary info
            updateSummaryInfo(records);
            
            if (records.length === 0) {
                // Show a message when there are no incomplete records
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="11" class="text-center">No incomplete records found. Great job!</td>`;
                elements.tableBody.appendChild(row);
                if (elements.saveButton) elements.saveButton.disabled = true;
                return;
            }
            
            // Enable the save button
            if (elements.saveButton) elements.saveButton.disabled = false;
            
            // Define the fields we want to display
            const fields = [
                'Catalog #', 'Owner', 'Order', 'Family', 'Genus', 'Species', 
                'Common Name', 'Location', 'Country', 'How collected', 'Date collected'
            ];
            
            // Add records to the table
            records.forEach((record, index) => {
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
                            startEditing(this, index, field);
                        });
                    } else {
                        cell.classList.add('fw-bold');
                    }
                    
                    row.appendChild(cell);
                });
                
                elements.tableBody.appendChild(row);
            });
            
            console.log(`Loaded ${records.length} incomplete records`);
        } catch (error) {
            console.error('Error loading incomplete records:', error);
            
            // Show error in the table if possible
            if (elements.tableBody) {
                elements.tableBody.innerHTML = `
                    <tr>
                        <td colspan="11" class="text-center text-danger">
                            Error loading incomplete records. Please check the console for details.
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    /**
     * Update the storage status display
     */
    function updateStorageStatus() {
        try {
            if (elements.storageStatus) {
                const mode = Database.getStorageMode();
                if (mode === 'github') {
                    elements.storageStatus.innerHTML = `<span class="text-success">Current: GitHub Storage</span>`;
                    if (elements.configureGitHubBtn) {
                        elements.configureGitHubBtn.textContent = 'Update GitHub Settings';
                    }
                } else {
                    elements.storageStatus.innerHTML = `<span class="text-secondary">Current: Local Storage</span>`;
                    if (elements.configureGitHubBtn) {
                        elements.configureGitHubBtn.textContent = 'Configure GitHub Storage';
                    }
                }
            }
        } catch (error) {
            console.error('Error updating storage status:', error);
        }
    }
    
    /**
     * Update the summary information
     */
    function updateSummaryInfo(records) {
        try {
            if (elements.summaryElement) {
                const stats = Database.getSummaryStats();
                const totalRecords = stats.totalItems;
                const incompleteCount = records.length;
                const completeCount = totalRecords - incompleteCount;
                const percentComplete = totalRecords > 0 ? 
                    Math.round((completeCount / totalRecords) * 100) : 100;
                
                elements.summaryElement.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <p class="mb-0">Total Records: <strong>${totalRecords}</strong></p>
                            <p class="mb-0">Complete Records: <strong>${completeCount}</strong></p>
                            <p class="mb-0">Incomplete Records: <strong class="text-warning">${incompleteCount}</strong></p>
                        </div>
                        <div class="text-center">
                            <h3 class="display-4 mb-0">${percentComplete}%</h3>
                            <p>Complete</p>
                        </div>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${percentComplete}%" 
                            aria-valuenow="${percentComplete}" aria-valuemin="0" aria-valuemax="100">
                            ${percentComplete}%
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating summary info:', error);
        }
    }
    
    /**
     * Start editing a cell
     * @param {HTMLElement} cell - The cell to edit
     * @param {number} recordIndex - Index of the record in incompleteData
     * @param {string} field - Field name to edit
     */
    function startEditing(cell, recordIndex, field) {
        try {
            // If we're already editing a cell, save it first
            if (activeEditCell) {
                finishEditing();
            }
            
            // Store reference to the current cell
            activeEditCell = {
                element: cell,
                index: recordIndex,
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
            const row = cell.parentElement;
            const catalogNum = row.dataset.catalog;
            modifiedRows.add(catalogNum);
            
            // Update data in cache
            incompleteData[activeEditCell.index][activeEditCell.field] = newValue;
            
            // Enable save button
            if (elements.saveButton) elements.saveButton.disabled = false;
            
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
            
            // Save each modified record
            for (const catalog of modifiedRows) {
                const recordIndex = incompleteData.findIndex(r => String(r['Catalog #']) === String(catalog));
                if (recordIndex === -1) continue;
                
                const updatedRecord = incompleteData[recordIndex];
                const saveResult = Database.updateItem(catalog, updatedRecord);
                
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
                
                // Reload the table to refresh data and check for any remaining incomplete records
                setTimeout(() => {
                    loadIncompleteRecords();
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
     * Initialize the GitHub configuration UI
     */
    function initGitHubConfigUI() {
        try {
            console.log('Initializing GitHub config UI...');
            
            // Get GitHub config button and modal elements
            const configBtn = document.getElementById('configure-github-btn');
            const configModal = document.getElementById('github-config-modal');
            const saveConfigBtn = document.getElementById('save-github-config');
            
            if (!configBtn || !configModal || !saveConfigBtn) {
                console.warn('GitHub config UI elements not found');
                return;
            }
            
            // Add click handler for config button
            configBtn.addEventListener('click', function() {
                console.log('Opening GitHub config modal');
                const modal = new bootstrap.Modal(configModal);
                
                // Pre-fill the form with current values if available
                const owner = localStorage.getItem('zoarch_github_owner') || '';
                const repo = localStorage.getItem('zoarch_github_repo') || '';
                const branch = localStorage.getItem('zoarch_github_branch') || 'main';
                const path = localStorage.getItem('zoarch_github_path') || 'data/inventory.json';
                
                document.getElementById('github-owner').value = owner;
                document.getElementById('github-repo').value = repo;
                document.getElementById('github-branch').value = branch;
                document.getElementById('github-path').value = path;
                
                // Clear the token field for security
                document.getElementById('github-token').value = '';
                
                // Show the modal
                modal.show();
            });
            
            // Add click handler for save button
            saveConfigBtn.addEventListener('click', async function() {
                try {
                    console.log('Saving GitHub configuration...');
                    
                    // Show working indicator
                    saveConfigBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    saveConfigBtn.disabled = true;
                    
                    // Get form values
                    const owner = document.getElementById('github-owner').value.trim();
                    const repo = document.getElementById('github-repo').value.trim();
                    const branch = document.getElementById('github-branch').value.trim() || 'main';
                    const path = document.getElementById('github-path').value.trim() || 'data/inventory.json';
                    const token = document.getElementById('github-token').value.trim();
                    
                    // Validate required fields
                    if (!owner || !repo || !token) {
                        alert('Owner, repository, and token are required');
                        saveConfigBtn.innerHTML = 'Save Configuration';
                        saveConfigBtn.disabled = false;
                        return;
                    }
                    
                    // Store config in localStorage (except token, which goes to sessionStorage)
                    localStorage.setItem('zoarch_github_owner', owner);
                    localStorage.setItem('zoarch_github_repo', repo);
                    localStorage.setItem('zoarch_github_branch', branch);
                    localStorage.setItem('zoarch_github_path', path);
                    localStorage.setItem('zoarch_use_github', 'true');
                    
                    // Store token in sessionStorage
                    sessionStorage.setItem('zoarch_github_token', token);
                    
                    // Set storage mode directly in Database
                    if (typeof Database !== 'undefined' && typeof Database.setStorageMode === 'function') {
                        Database.setStorageMode('github');
                    }
                    
                    // Close the modal
                    const bsModal = bootstrap.Modal.getInstance(configModal);
                    if (bsModal) bsModal.hide();
                    
                    // Update storage status display
                    updateStorageStatus();
                    
                    // Show success message
                    alert('GitHub configuration saved successfully! The app will now use GitHub for storage.');
                    
                    // Initialize GitHub storage if available
                    if (typeof GitHubStorage !== 'undefined' && typeof GitHubStorage.init === 'function') {
                        console.log('Initializing GitHub storage with new config...');
                        const config = { owner, repo, branch, path, token };
                        const initialized = await GitHubStorage.init(config);
                        
                        if (initialized) {
                            console.log('GitHub storage initialized successfully');
                            
                            // Set the token securely
                            if (typeof GitHubStorage.setToken === 'function') {
                                GitHubStorage.setToken(token);
                            }
                            
                            // Refresh data if needed
                            const confirmed = confirm('Do you want to reload the page to apply the GitHub settings? Any unsaved changes will be lost.');
                            if (confirmed) {
                                location.reload();
                            }
                        } else {
                            console.warn('GitHub initialization failed');
                            alert('GitHub configuration saved, but connection failed. Please check your settings and try again.');
                        }
                    } else {
                        // If GitHubStorage is not available, just reload the page
                        const confirmed = confirm('Do you want to reload the page to apply the GitHub settings? Any unsaved changes will be lost.');
                        if (confirmed) {
                            location.reload();
                        }
                    }
                } catch (error) {
                    console.error('Error saving GitHub config:', error);
                    alert('Error: ' + error.message);
                } finally {
                    // Reset button
                    saveConfigBtn.innerHTML = 'Save Configuration';
                    saveConfigBtn.disabled = false;
                }
            });
            
            // Add handler for the about page button
            const aboutGitHubBtn = document.getElementById('about-github-setup');
            if (aboutGitHubBtn) {
                aboutGitHubBtn.addEventListener('click', function() {
                    configBtn.click();
                });
            }
            
            console.log('GitHub config UI initialized');
        } catch (error) {
            console.error('Error initializing GitHub config UI:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadIncompleteRecords,
        saveAllChanges
    };
})();
