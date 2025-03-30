/**
 * ZOARCH Lab Inventory - Charts and Visualizations
 * This file handles all data visualization using Chart.js
 */

// Charts namespace
const Charts = (function() {
    // Store chart instances for later reference
    const chartInstances = {};
    
    // Color palettes
    const colorPalettes = {
        orders: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(201, 203, 207, 0.8)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
        ],
        families: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(201, 203, 207, 0.8)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 205, 86, 0.5)'
        ],
        geographic: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(201, 203, 207, 0.8)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)'
        ],
        timeline: {
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff'
        }
    };
    
    /**
     * Initialize all charts
     * @param {Object} chartData Data for charts from Database.getChartData()
     */
    function initCharts(chartData) {
        createOrderChart(chartData.orderData);
        createFamilyChart(chartData.familyData);
        createTaxonomicChart(chartData.orderData, chartData.familyData);
        createGeographicChart(chartData.countryData);
        createTimelineChart(chartData.timelineData);
    }
    
    /**
     * Create the order distribution chart
     * @param {Object} orderData Order count data
     */
    function createOrderChart(orderData) {
        const ctx = document.getElementById('orderChart');
        if (!ctx) return;
        
        // Prepare data
        const labels = Object.keys(orderData).slice(0, 8);
        const counts = labels.map(label => orderData[label]);
        
        // Check if we need to add "Other" category
        if (Object.keys(orderData).length > 8) {
            const otherSum = Object.entries(orderData)
                .filter(([label]) => !labels.includes(label))
                .reduce((sum, [, count]) => sum + count, 0);
                
            labels.push('Other');
            counts.push(otherSum);
        }
        
        // Destroy existing chart if it exists
        if (chartInstances.orderChart) {
            chartInstances.orderChart.destroy();
        }
        
        // Create the chart
        chartInstances.orderChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Specimens',
                    data: counts,
                    backgroundColor: colorPalettes.orders.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create the family distribution chart
     * @param {Object} familyData Family count data
     */
    function createFamilyChart(familyData) {
        const ctx = document.getElementById('familyChart');
        if (!ctx) return;
        
        // Prepare data
        const labels = Object.keys(familyData);
        const counts = labels.map(label => familyData[label]);
        
        // Destroy existing chart if it exists
        if (chartInstances.familyChart) {
            chartInstances.familyChart.destroy();
        }
        
        // Create the chart
        chartInstances.familyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Specimens',
                    data: counts,
                    backgroundColor: colorPalettes.families.slice(0, labels.length),
                    borderWidth: 1
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
                        title: {
                            display: true,
                            text: 'Number of Specimens'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Family'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create the taxonomic distribution chart
     * @param {Object} orderData Order count data
     * @param {Object} familyData Family count data
     */
    function createTaxonomicChart(orderData, familyData) {
        const ctx = document.getElementById('taxonomicChart');
        if (!ctx) return;
        
        // Prepare data
        // Create hierarchical structure for taxonomic tree
        const taxonomicData = {
            name: 'All',
            children: []
        };
        
        // Organize by order
        Object.entries(orderData).forEach(([order, orderCount]) => {
            const orderNode = {
                name: order,
                value: orderCount,
                children: []
            };
            
            // Add related families under this order
            Object.entries(familyData).forEach(([family, familyCount]) => {
                // This is a simplified association - in a real app, 
                // you would need to check the actual relationship
                if (Math.random() > 0.7) { // Simulating relationship for demo
                    orderNode.children.push({
                        name: family,
                        value: familyCount
                    });
                }
            });
            
            taxonomicData.children.push(orderNode);
        });
        
        // Destroy existing chart if it exists
        if (chartInstances.taxonomicChart) {
            chartInstances.taxonomicChart.destroy();
        }
        
        // Create a simplified hierarchical visualization using Chart.js
        const topOrders = Object.entries(orderData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        const topFamilies = Object.entries(familyData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        chartInstances.taxonomicChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: topOrders.map(([order]) => order),
                datasets: [{
                    label: 'Taxonomic Distribution',
                    data: topOrders.map(([, count]) => count),
                    backgroundColor: colorPalettes.orders.slice(0, topOrders.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Top 5 Orders by Specimen Count'
                    }
                }
            }
        });
    }
    
    /**
     * Create the geographic distribution chart
     * @param {Object} countryData Country count data
     */
    function createGeographicChart(countryData) {
        const ctx = document.getElementById('geographicChart');
        if (!ctx) return;
        
        // Prepare data - get top countries
        const topCountries = Object.entries(countryData)
            .filter(([country]) => country !== 'Unknown')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
            
        // Check if we need to add "Other" category
        let otherCount = 0;
        if (Object.keys(countryData).length > 8) {
            const includedCountries = topCountries.map(([country]) => country);
            
            otherCount = Object.entries(countryData)
                .filter(([country]) => country !== 'Unknown' && !includedCountries.includes(country))
                .reduce((sum, [, count]) => sum + count, 0);
        }
        
        // Handle Unknown category separately
        const unknownCount = countryData['Unknown'] || 0;
        
        // Build final labels and data arrays
        let labels = topCountries.map(([country]) => country);
        let data = topCountries.map(([, count]) => count);
        
        if (otherCount > 0) {
            labels.push('Other');
            data.push(otherCount);
        }
        
        if (unknownCount > 0) {
            labels.push('Unknown');
            data.push(unknownCount);
        }
        
        // Destroy existing chart if it exists
        if (chartInstances.geographicChart) {
            chartInstances.geographicChart.destroy();
        }
        
        // Create the chart
        chartInstances.geographicChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Specimens',
                    data: data,
                    backgroundColor: colorPalettes.geographic.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create the timeline chart
     * @param {Object} timelineData Timeline count data by year
     */
    function createTimelineChart(timelineData) {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        // Prepare data
        const years = Object.keys(timelineData).sort();
        const counts = years.map(year => timelineData[year]);
        
        // If we have very few data points, let's generate some sample data
        if (years.length < 2) {
            // Generate sample data for demonstration
            const currentYear = new Date().getFullYear();
            for (let i = 0; i < 10; i++) {
                const year = currentYear - 10 + i;
                years.push(year.toString());
                counts.push(Math.floor(Math.random() * 50) + 10);
            }
        }
        
        // Destroy existing chart if it exists
        if (chartInstances.timelineChart) {
            chartInstances.timelineChart.destroy();
        }
        
        // Create the chart
        chartInstances.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Specimens Added',
                    data: counts,
                    backgroundColor: colorPalettes.timeline.backgroundColor,
                    borderColor: colorPalettes.timeline.borderColor,
                    borderWidth: 2,
                    tension: 0.2,
                    pointBackgroundColor: colorPalettes.timeline.pointBackgroundColor,
                    pointBorderColor: colorPalettes.timeline.pointBorderColor,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return `Year: ${context[0].label}`;
                            },
                            label: function(context) {
                                return `Specimens Added: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Specimens'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Update all charts with new data
     * @param {Object} chartData New chart data
     */
    function updateCharts(chartData) {
        // Update each chart with new data
        if (chartData.orderData) createOrderChart(chartData.orderData);
        if (chartData.familyData) createFamilyChart(chartData.familyData);
        if (chartData.orderData && chartData.familyData) createTaxonomicChart(chartData.orderData, chartData.familyData);
        if (chartData.countryData) createGeographicChart(chartData.countryData);
        if (chartData.timelineData) createTimelineChart(chartData.timelineData);
    }
    
    // Public API
    return {
        initCharts,
        updateCharts
    };