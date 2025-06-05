/**
 * ZOARCH Lab Inventory - Incomplete Records Management
 */

const IncompleteRecords = (function() {
    // Store references to DOM elements
    const elements = {};
    
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
            // Get DOM elements
            elements.tableContainer = document.getElementById('incomplete-table-container');
            elements.saveButton = document.getElementById('save-incomplete-btn');
            elements.syncIndicator = document.getElementById('incomplete-sync-indicator');
            elements.summaryElement = document.getElementById('incomplete-summary');
            elements.storageStatus = document.getElementById('storage-status');
            elements.configureGitHubBtn = document.getElementById('configure-github-btn');
            
            if (!elements.tableContainer || !elements.saveButton) {
                console.warn('Required elements for incomplete records not found');
                return false;
            }
            
            // Create table structure
            elements.tableContainer.innerHTML = `
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table id="incomplete-table" class="table table-striped table-hover">
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
                        <tbody id="incomplete-table-body">
                            <tr><td colspan="11" class="text-center">Loading incomplete records...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            
            elements.table = document.getElementById('incomplete-table');
            elements.tableBody = document.getElementById('incomplete-table-body');
            
            // Add event listeners
            elements.saveButton.addEventListener('click', saveAllChanges);
            
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
            // Clear the table and reset cache
            elements.tableBody.innerHTML = '';
            incompleteData = [];
            modifiedRows = new Set();
            
            // Update storage status display
            updateStorageStatus();
            
            // Check that the Database object exists
            if (typeof Database === 'undefined' || typeof Database.getIncompleteRecords !== 'function') {
                console.error('Database API is not available');
                return;
            }
            
            // Get incomplete records from the database
            const records = Database.getIncompleteRecords();
            
            if (!records || !Array.isArray(records)) {
                console.error('Database.getIncompleteRecords() did not return a valid array');
                return;
            }
            
            incompleteData = [...records];
            
            // Update the summary info
            updateSummaryInfo(records);
            
            if (records.length === 0) {
                // Show a message when there are no incomplete records
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="11" class="text-center">No incomplete records found. Great job!</td>`;
                elements.tableBody.appendChild(row);
                elements.saveButton.disabled = true;
                return;
            }
            
            // Enable the save button
            elements.saveButton.disabled = false;
            
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
                    
                    // Highlight empty cells (skip required fields)
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
        }
    }
    
    /**
     * Update the storage status display
     */
    function updateStorageStatus() {
        try {
            if (elements.storageStatus) {
                const mode = Database.getStorageMode ? Database.getStorageMode() : 'local';
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
                const stats = Database.getSummaryStats ? Database.getSummaryStats() : { totalItems: records.length };
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
                const recordIndex = incompleteData.findIndex(r => r['Catalog #'] == catalog);
                if (recordIndex === -1) continue;
                
                const updatedRecord = incompleteData[recordIndex];
                const saveResult = Database.updateItem ? Database.updateItem(catalog, updatedRecord) : false;
                
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
    
    // Public API
    return {
        init,
        loadIncompleteRecords,
        saveAllChanges
    };
})();
                
