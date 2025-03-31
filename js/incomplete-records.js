/**
 * ZOARCH Lab Inventory - Incomplete Records Management
 */

// IncompleteRecords namespace
const IncompleteRecords = (function() {
    // Store references to DOM elements
    const elements = {
        table: null,
        tableBody: null,
        saveButton: null,
        syncIndicator: null
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
            // Get DOM elements
            elements.table = document.getElementById('incomplete-table');
            elements.tableBody = document.getElementById('incomplete-table-body');
            elements.saveButton = document.getElementById('save-incomplete-btn');
            elements.syncIndicator = document.getElementById('incomplete-sync-indicator');
            
            if (!elements.table || !elements.tableBody || !elements.saveButton) {
                console.warn('Required DOM elements for incomplete records not found');
                return false;
            }
            
            // Add event listeners
            elements.saveButton.addEventListener('click', saveAllChanges);
            
            // Initialize GitHub config UI if GitHub storage is available
            if (typeof GitHubStorage !== 'undefined') {
                initGitHubConfigUI();
            }
            
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
            
            // Get incomplete records from the database
            const records = Database.getIncompleteRecords();
            incompleteData = [...records]; // Copy the array
            
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
