/**
 * ZOARCH Lab Inventory - Charts and Visualizations (Cleaned)
 */

const Charts = (function() {
    const chartInstances = {};
    
    /**
     * Initialize all charts
     * @param {Object} chartData Data for charts from Database.getChartData()
     */
    function initCharts(chartData) {
        try {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js is not loaded, skipping chart initialization');
                return;
            }
            
            createOrderChart(chartData.orderData);
            createFamilyChart(chartData.familyData);
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }
    
    /**
     * Create the order distribution chart
     */
    function createOrderChart(orderData) {
        try {
            const ctx = document.getElementById('orderChart');
            if (!ctx) return;
            
            // Destroy existing chart if it exists
            if (chartInstances.orderChart) {
                chartInstances.orderChart.destroy();
                chartInstances.orderChart = null;
            }
            
            // Get top orders
            const topOrders = Object.entries(orderData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
                
            const labels = topOrders.map(([order]) => order);
            const data = topOrders.map(([, count]) => count);
            
            // Create chart
            chartInstances.orderChart = new Chart(ctx, {
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
                    maintainAspectRatio: false,
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
     * Create the family distribution chart
     */
    function createFamilyChart(familyData) {
        try {
            const ctx = document.getElementById('familyChart');
            if (!ctx) return;
            
            // Destroy existing chart if it exists
            if (chartInstances.familyChart) {
                chartInstances.familyChart.destroy();
                chartInstances.familyChart = null;
            }
            
            const labels = Object.keys(familyData);
            const data = Object.values(familyData);
            
            // Create chart
            chartInstances.familyChart = new Chart(ctx, {
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
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating family chart:', error);
        }
    }
    
    /**
     * Update all charts with new data
     */
    function updateCharts(chartData) {
        try {
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
