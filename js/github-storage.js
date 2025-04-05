/**
 * ZOARCH Lab Inventory - GitHub Storage Module
 * This module handles synchronizing data with a GitHub repository
 */

// GitHub Storage namespace
const GitHubStorage = (function() {
    // Configuration (to be set during initialization)
    let config = {
        owner: '',           // GitHub username/organization
        repo: '',            // Repository name
        branch: 'main',      // Branch to use
        path: 'data/inventory.json', // Path to the data file
        token: '',           // GitHub Personal Access Token (PAT) - will be stored securely
        lastSyncTime: null   // Track last sync time
    };

    /**
     * Initialize GitHub storage with configuration
     * @param {Object} userConfig Configuration for GitHub storage
     * @returns {Promise} Resolves when initialization is complete
     */
    function init(userConfig) {
        return new Promise((resolve, reject) => {
            try {
                // Apply user configuration
                config = { ...config, ...userConfig };
                
               // Validate required config - only if trying to test connection
            if (config.token && (config.owner === undefined || config.repo === undefined)) {
                console.warn('GitHub owner and repo are not provided');
                resolve(false); // Don't reject, just return false
                return;
                }
                
                // Try to get stored token from sessionStorage (more secure than localStorage)
                if (!config.token) {
                    config.token = sessionStorage.getItem('zoarch_github_token');
                }
                
                // Check for basic connectivity
                testConnection()
                    .then(() => {
                        console.log('GitHub storage initialized successfully');
                        resolve(true);
                    })
                    .catch(error => {
                        console.warn('GitHub connection test failed:', error);
                        resolve(false); // Resolve with false rather than rejecting
                    });
            } catch (error) {
                console.error('Error initializing GitHub storage:', error);
                resolve(false);
            }
        });
    }
    
    /**
     * Test GitHub API connection
     * @returns {Promise} Resolves if connection succeeds
     */
    function testConnection() {
        return new Promise((resolve, reject) => {
            if (!config.token) {
                reject(new Error('GitHub token not provided'));
                return;
            }
            
            // Make a simple API call to test connection
            fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('GitHub connection successful');
                resolve(true);
            })
            .catch(error => {
                console.error('GitHub connection test failed:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Set the GitHub Personal Access Token (PAT)
     * @param {string} token GitHub Personal Access Token
     */
    function setToken(token) {
        if (!token) {
            throw new Error('Token is required');
        }
        
        config.token = token;
        sessionStorage.setItem('zoarch_github_token', token);
        console.log('GitHub token set successfully');
        return true;
    }
    
    /**
     * Check if we have a valid token
     * @returns {boolean} True if token exists
     */
    function hasToken() {
        return !!config.token;
    }
    
    /**
     * Get the file content from GitHub
     * @returns {Promise<Array>} The inventory data
     */
    function getInventoryData() {
        return new Promise((resolve, reject) => {
            if (!config.token) {
                reject(new Error('GitHub token not provided'));
                return;
            }
            
            fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    // File might not exist yet
                    if (response.status === 404) {
                        return { content: btoa('[]') }; // Base64 encoded empty array
                    }
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Decode base64 content
                const content = atob(data.content.replace(/\n/g, ''));
                const parsedData = JSON.parse(content);
                
                // Store the SHA for later updates
                config.fileSha = data.sha;
                config.lastSyncTime = new Date();
                
                resolve(parsedData);
            })
            .catch(error => {
                console.error('Error fetching inventory data from GitHub:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Save inventory data to GitHub
     * @param {Array} data Inventory data to save
     * @returns {Promise} Resolves when save is complete
     */
    function saveInventoryData(data) {
        return new Promise((resolve, reject) => {
            if (!config.token) {
                reject(new Error('GitHub token not provided'));
                return;
            }
            
            // Convert data to JSON string and base64 encode
            const content = JSON.stringify(data, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Prepare the API request
            const requestBody = {
                message: `Update inventory data [${new Date().toISOString()}]`,
                content: encodedContent,
                branch: config.branch
            };
            
            // If we have a SHA, include it to update the file
            if (config.fileSha) {
                requestBody.sha = config.fileSha;
            }
            
            // Make the API request
            fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Update the SHA for future updates
                config.fileSha = data.content.sha;
                config.lastSyncTime = new Date();
                
                console.log('Inventory data saved to GitHub successfully');
                resolve(true);
            })
            .catch(error => {
                console.error('Error saving inventory data to GitHub:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Get the time of the last successful sync
     * @returns {Date|null} Last sync time or null
     */
    function getLastSyncTime() {
        return config.lastSyncTime;
    }
    
    // Public API
    return {
        init,
        setToken,
        hasToken,
        getInventoryData,
        saveInventoryData,
        getLastSyncTime
    };
})();
