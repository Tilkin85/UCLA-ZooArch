/**
 * ZOARCH Lab Inventory - Charts and Visualizations (Simplified)
 */

// Charts namespace - minimalist and fault-tolerant
const Charts = (function() {
    /**
     * Initialize all charts
     * @param {Object} chartData Data for charts from Database.getChartData()
     */
    function initCharts(chartData) {
        try {
            // First check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js is not loaded, skipping chart initialization');
                return;
            }
            
            // Create basic charts if possible
            tryCreateOrderChart(chartData.orderData);
            tryCreateFamilyChart(chartData.familyData);
            tryCreateGeographicChart(chartData.countryData);
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }
    
    /**
     * Attempt to create the order distribution chart
     */
    function tryCreateOrderChart(orderData) {
        try {
            const ctx = document.getElementById('orderChart');
            if (!ctx) return;
            
            // Get top orders
            const topOrders = Object.entries(orderData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
                
            const labels = topOrders.map(([order]) => order);
            const data = topOrders.map(([, count]) => count);
            
            // Create a simple chart
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Specimens',
                        data: data,
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)',
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(201, 203, 207, 0.8)',
                            'rgba(54, 162, 235, 0.5)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating order chart:', error);
        }
    }
    
    /**
     * Attempt to create the family distribution chart
     */
    function tryCreateFamilyChart(familyData) {
        try {
            const ctx = document.getElementById('familyChart');
            if (!ctx) return;
            
            const labels = Object.keys(familyData);
            const data = Object.values(familyData);
            
            // Create a simple chart
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Specimens',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating family chart:', error);
        }
    }
    
    /**
     * Attempt to create the geographic distribution chart
     */
    function tryCreateGeographicChart(countryData) {
        try {
            const ctx = document.getElementById('geographicChart');
            if (!ctx) return;
            
            // Get top countries
            const topCountries = Object.entries(countryData)
                .filter(([country]) => country !== 'Unknown')
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
                
            const labels = topCountries.map(([country]) => country);
            const data = topCountries.map(([, count]) => count);
            
            // Add Unknown if it exists
            if (countryData['Unknown']) {
                labels.push('Unknown');
                data.push(countryData['Unknown']);
            }
            
            // Create a simple chart
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Specimens',
                        data: data,
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)',
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(201, 203, 207, 0.8)',
                            'rgba(54, 162, 235, 0.5)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating geographic chart:', error);
        }
    }
    
    /**
     * Update all charts with new data
     */
    function updateCharts(chartData) {
        try {
            // Simply reinitialize all charts
            initCharts(chartData);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }
    
    // Public API
    return {
        initCharts,
        updateCharts
    };
})();
