/**
 * ZOARCH Lab Inventory - GitHub Storage Module
 * This module handles synchronizing data with a GitHub repository
 */

const GitHubStorage = (function() {
    // Configuration
    let config = {
        owner: '',           // GitHub username/organization
        repo: '',            // Repository name
        branch: 'main',      // Branch to use
        path: 'data/inventory.json', // Path to the data file
        token: '',           // GitHub Personal Access Token (PAT)
        lastSyncTime: null,  // Track last sync time
        fileSha: null        // Store file SHA for updates
    };

    /**
     * Initialize GitHub storage with configuration
     * @param {Object} userConfig Configuration for GitHub storage
     * @returns {Promise<boolean>} Resolves with initialization success status
     */
    function init(userConfig) {
        return new Promise((resolve) => {
            try {
                // Apply user configuration
                config = { ...config, ...userConfig };
                
                // Try to get stored token from sessionStorage if not provided
                if (!config.token) {
                    config.token = sessionStorage.getItem('zoarch_github_token');
                }
                
                // Validate required config
                if (!config.token || !config.owner || !config.repo) {
                    console.warn('GitHub configuration incomplete');
                    resolve(false);
                    return;
                }
                
                // Test connection
                testConnection()
                    .then(() => {
                        console.log('GitHub storage initialized successfully');
                        resolve(true);
                    })
                    .catch(error => {
                        console.warn('GitHub connection test failed:', error);
                        resolve(false);
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
        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
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
        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        })
        .then(response => {
            if (!response.ok) {
                // File might not exist yet
                if (response.status === 404) {
                    return { content: btoa('[]'), sha: null };
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
            
            return parsedData;
        });
    }
    
    /**
     * Save inventory data to GitHub
     * @param {Array} data Inventory data to save
     * @returns {Promise<boolean>} Resolves when save is complete
     */
    function saveInventoryData(data) {
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
        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`, {
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
            return true;
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
