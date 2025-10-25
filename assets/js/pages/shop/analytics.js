let revenueChart, ordersChart, categoryChart;
let analyticsData = {};
let currentPeriod = 7;
let currentRevenueView = 'daily';

document.addEventListener('DOMContentLoaded', async () => {
    if (!Router.protectPage('shop')) {
        return;
    }

    loadShopInfo();
    await loadAnalytics();
});

async function loadShopInfo() {
    try {
        const shop = await apiRequest(API_ENDPOINTS.SHOPS.ME);
        
        const shopNameEl = document.getElementById('shopName');
        if (shopNameEl) {
            shopNameEl.textContent = shop.name || 'My Shop';
        }
        
        const avatar = document.getElementById('shopAvatar');
        if (avatar) {
            avatar.textContent = (shop.name || 'M').charAt(0).toUpperCase();
        }
        
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_SHOP_INFO + ': ' + error.message, 'error');
    }
}

async function loadAnalytics() {
    showLoading();
    
    try {
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - currentPeriod);

        const [orders, products, customers] = await Promise.all([
            fetchOrders(dateFrom, dateTo),
            fetchProducts(),
            fetchCustomers()
        ]);

        // Process analytics data
        analyticsData = {
            orders: orders || [],
            products: products || [],
            customers: customers || [],
            dateFrom,
            dateTo
        };

        calculateMetrics();
        
        await renderCharts();
        
        updateUI();
        
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_ANALYTICS, 'error');
    } finally {
        hideLoading();
    }
}

async function fetchOrders(dateFrom, dateTo) {
    try {
        const data = await apiRequest(`${API_ENDPOINTS.SHOPS.ORDERS}?page=1&limit=${APP_CONSTANTS.LIMITS.PRODUCTS_QUERY_LIMIT}`);
        
        // Filter by date range
        const filtered = (data.orders || data.data || []).filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= dateFrom && orderDate <= dateTo;
        });

        return filtered;
    } catch (error) {
        return [];
    }
}

async function fetchProducts() {
    try {
        const data = await apiRequest(`${API_ENDPOINTS.SHOPS.PRODUCTS}?limit=${APP_CONSTANTS.LIMITS.PRODUCTS_QUERY_LIMIT}`);
        const products = data.products || data.data || [];
        
        return products;
    } catch (error) {
        return [];
    }
}

async function fetchCustomers() {
    try {
        const customers = new Map();
        
        analyticsData.orders?.forEach(order => {
            if (order.user_id) {
                if (!customers.has(order.user_id)) {
                    customers.set(order.user_id, {
                        id: order.user_id,
                        email: order.user_email || 'Unknown',
                        orders: [],
                        total_spent: 0
                    });
                }
                
                const customer = customers.get(order.user_id);
                customer.orders.push(order);
                customer.total_spent += parseFloat(order.total_amount || 0);
            }
        });
        
        const customersArray = Array.from(customers.values());
        return customersArray;
    } catch (error) {
        return [];
    }
}

function calculateMetrics() {
    const { orders, products, customers } = analyticsData;
    
    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.orders.length === 1).length;
    const returningCustomers = customers.filter(c => c.orders.length > 1).length;
    const customerLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    
    const activeProducts = products.filter(p => p.status === 'approved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const totalViews = products.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalTryOns = products.reduce((sum, p) => sum + (p.try_on_count || 0), 0);
    
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;
    
    const productViews = totalViews || 0;
    const productSales = totalOrders;
    const conversionRate = productViews > 0 ? (productSales / productViews) * 100 : 0;
    
    const previousPeriodOrders = []; // Would need to fetch previous period data
    const previousRevenue = 0;
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    analyticsData.metrics = {
        totalRevenue,
        totalOrders,
        averageOrder,
        totalCustomers,
        newCustomers,
        returningCustomers,
        customerLTV,
        retentionRate,
        activeProducts,
        pendingProducts,
        totalViews,
        totalTryOns,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        refundedOrders,
        productViews,
        productSales,
        conversionRate,
        revenueChange,
        previousRevenue
    };
    
}

function updateUI() {
    const { metrics } = analyticsData;
    
    // Batch all DOM updates together for better performance
    CommonUtils.batchDOMUpdates(() => {
        document.getElementById('totalRevenue').textContent = formatCurrency(metrics.totalRevenue);
        document.getElementById('totalOrders').textContent = metrics.totalOrders;
        document.getElementById('averageOrder').textContent = formatCurrency(metrics.averageOrder);
        document.getElementById('totalCustomers').textContent = metrics.totalCustomers;
        
        updateTrend('revenueTrend', metrics.revenueChange);
        updateTrend('ordersTrend', 0);
        updateTrend('avgTrend', 0);
        updateTrend('customersTrend', 0);
        
        document.getElementById('comparisonRevenue').textContent = formatPercent(metrics.revenueChange);
        document.getElementById('currentPeriodRevenue').textContent = formatCurrency(metrics.totalRevenue);
        document.getElementById('previousPeriodRevenue').textContent = formatCurrency(metrics.previousRevenue);
        
        document.getElementById('conversionRate').textContent = formatPercent(metrics.conversionRate);
        document.getElementById('productViews').textContent = metrics.productViews;
        document.getElementById('productSales').textContent = metrics.productSales;
        
        document.getElementById('newCustomers').textContent = metrics.newCustomers;
        document.getElementById('returningCustomers').textContent = metrics.returningCustomers;
        document.getElementById('customerLTV').textContent = formatCurrency(metrics.customerLTV);
        document.getElementById('retentionRate').textContent = formatPercent(metrics.retentionRate);
        
        document.getElementById('activeProducts').textContent = metrics.activeProducts;
        document.getElementById('pendingProducts').textContent = metrics.pendingProducts;
        document.getElementById('totalViews').textContent = metrics.totalViews;
        document.getElementById('totalTryOns').textContent = metrics.totalTryOns;
        
        document.getElementById('completedOrders').textContent = metrics.completedOrders;
        document.getElementById('pendingOrders').textContent = metrics.pendingOrders;
        document.getElementById('cancelledOrders').textContent = metrics.cancelledOrders;
        document.getElementById('refundedOrders').textContent = metrics.refundedOrders;
    });
    
    updateTopProducts();
    
    generateInsights();
}

function updateTrend(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let colorClass = 'opacity-75';
    let arrow = '→';
    
    if (value > 0) {
        colorClass = 'text-green-300';
        arrow = '↑';
    } else if (value < 0) {
        colorClass = 'text-red-300';
        arrow = '↓';
    }
    
    element.className = `inline-flex items-center gap-1 text-sm font-semibold ${colorClass}`;
    element.innerHTML = `<span>${arrow}</span> ${Math.abs(value).toFixed(1)}%`;
}

function updateTopProducts() {
    const { orders, products } = analyticsData;
    
    const productSales = {};
    
    orders.forEach(order => {
        (order.items || []).forEach(item => {
            const productId = item.product_id;
            if (!productSales[productId]) {
                productSales[productId] = {
                    product_id: productId,
                    name: item.product_name || 'Unknown Product',
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[productId].quantity += item.quantity || 1;
            productSales[productId].revenue += parseFloat(item.price || 0) * (item.quantity || 1);
        });
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    const tbody = document.getElementById('topProductsBody');
    
    if (topProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-gray-400">
                    No sales data
                </td>
            </tr>
        `;
        return;
    }
    
    // Build table rows for DocumentFragment
    const rows = topProducts.map((product, index) => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4 font-semibold text-purple-600">${index + 1}</td>
            <td class="py-3 px-4 text-gray-900">${escapeHtml(product.name)}</td>
            <td class="py-3 px-4 text-gray-700">${product.quantity}</td>
            <td class="py-3 px-4 font-semibold text-gray-900">${formatCurrency(product.revenue)}</td>
            <td class="py-3 px-4 text-gray-700">${formatCurrency(product.revenue / product.quantity)}</td>
        </tr>
    `);

    // Use DocumentFragment for better performance
    if (CommonUtils && CommonUtils.createDocumentFragment) {
        tbody.innerHTML = '';
        tbody.appendChild(CommonUtils.createDocumentFragment(rows));
    } else {
        tbody.innerHTML = rows.join('');
    }
}

async function renderCharts() {
    if (typeof Chart === 'undefined') {
        await new Promise(resolve => {
            const checkChart = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    resolve();
                }
            }, 50);
        });
    }
    
    renderRevenueChart();
    renderOrdersChart();
    renderCategoryChart();
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const chartData = prepareRevenueChartData();
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue',
                data: chartData.data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: (context) => `Revenue: ${formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function prepareRevenueChartData() {
    const { orders, dateFrom, dateTo } = analyticsData;
    
    const groupedData = {};
    
    orders.forEach(order => {
        if (order.status !== 'completed') return;
        
        const date = new Date(order.created_at);
        let key;
        
        if (currentRevenueView === 'daily') {
            key = date.toISOString().split('T')[0];
        } else if (currentRevenueView === 'weekly') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
        } else { // monthly
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (!groupedData[key]) {
            groupedData[key] = 0;
        }
        groupedData[key] += parseFloat(order.total_amount || 0);
    });
    
    const sortedKeys = Object.keys(groupedData).sort();
    const labels = sortedKeys.map(key => formatChartLabel(key));
    const data = sortedKeys.map(key => groupedData[key]);
    
    return { labels, data };
}

function formatChartLabel(key) {
    if (currentRevenueView === 'daily') {
        const date = new Date(key);
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    } else if (currentRevenueView === 'weekly') {
        const date = new Date(key);
        return `Неделя ${date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}`;
    } else {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
    }
}

function renderOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    if (ordersChart) {
        ordersChart.destroy();
    }
    
    const chartData = prepareOrdersChartData();
    
    ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Orders',
                data: chartData.data,
                backgroundColor: '#10b981',
                borderRadius: 8,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function prepareOrdersChartData() {
    const { orders } = analyticsData;
    
    const groupedData = {};
    
    orders.forEach(order => {
        const date = new Date(order.created_at);
        const key = date.toISOString().split('T')[0];
        
        if (!groupedData[key]) {
            groupedData[key] = 0;
        }
        groupedData[key]++;
    });
    
    const sortedKeys = Object.keys(groupedData).sort();
    const labels = sortedKeys.map(key => {
        const date = new Date(key);
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    });
    const data = sortedKeys.map(key => groupedData[key]);
    
    return { labels, data };
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const chartData = prepareCategoryChartData();
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    '#667eea',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function prepareCategoryChartData() {
    const { orders, products } = analyticsData;
    
    const categoryRevenue = {};
    
    orders.forEach(order => {
        if (order.status !== 'completed') return;
        
        (order.items || []).forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            const category = product?.category || 'Other';
            
            if (!categoryRevenue[category]) {
                categoryRevenue[category] = 0;
            }
            categoryRevenue[category] += parseFloat(item.price || 0) * (item.quantity || 1);
        });
    });
    
    const labels = Object.keys(categoryRevenue);
    const data = Object.values(categoryRevenue);
    
    return { labels, data };
}

function generateInsights() {
    const { metrics } = analyticsData;
    const insights = [];
    
    if (metrics.revenueChange > 10) {
        insights.push(`🎉 Отличная работа! Ваша выручка выросла на ${metrics.revenueChange.toFixed(1)}% по сравнению с предыдущим периодом.`);
    }
    
    if (metrics.retentionRate > 50) {
        insights.push(`👏 Высокий уровень удержания клиентов (${metrics.retentionRate.toFixed(1)}%). Ваши клиенты возвращаются!`);
    }
    
    if (metrics.conversionRate > 5) {
        insights.push(`📈 Отличная конверсия (${metrics.conversionRate.toFixed(2)}%). Ваши товары привлекают покупателей.`);
    }
    
    if (metrics.averageOrder > 100) {
        insights.push(`💰 Высокий средний чек ($${metrics.averageOrder.toFixed(2)}). Рассмотрите возможность upsell стратегий.`);
    }
    
    const insightCard = document.getElementById('insightCard');
    if (insights.length > 0 && insightCard) {
        insightCard.style.display = 'block';
        document.getElementById('insightText').innerHTML = insights.join('<br><br>');
    }
}

function changePeriod(days) {
    currentPeriod = days;
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-purple-600', 'text-white', 'border-purple-600');
        btn.classList.add('bg-white', 'border-gray-200');
        if (btn.dataset.period == days) {
            btn.classList.add('active', 'bg-purple-600', 'text-white', 'border-purple-600');
            btn.classList.remove('bg-white', 'border-gray-200');
        }
    });
    
    // Clear custom date range
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    // Reload analytics
    loadAnalytics();
}

// Apply custom date range
function applyCustomDateRange() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    if (!dateFrom || !dateTo) return;
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    currentPeriod = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    
    // Deactivate all period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reload analytics
    loadAnalytics();
}

// Change revenue view
function changeRevenueView(view) {
    currentRevenueView = view;
    
    // Get parent container and find all buttons
    const container = event.target.closest('.flex');
    if (container) {
        container.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        });
        event.target.classList.remove('bg-gray-100', 'text-gray-700');
        event.target.classList.add('bg-purple-600', 'text-white');
    }
    
    // Re-render chart
    renderRevenueChart();
}

// Export to CSV
function exportToCSV() {
    const { orders, metrics } = analyticsData;
    
    let csv = 'Order ID,Date,Customer,Amount,Status\n';
    
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');
        const customer = order.user_email || 'Unknown';
        const amount = order.total_amount || 0;
        const status = order.status || 'unknown';
        
        csv += `${order.id},${date},${customer},${amount},${status}\n`;
    });
    
    csv += `\nSummary\n`;
    csv += `Total Revenue,${metrics.totalRevenue}\n`;
    csv += `Total Orders,${metrics.totalOrders}\n`;
    csv += `Average Order,${metrics.averageOrder}\n`;
    csv += `Total Customers,${metrics.totalCustomers}\n`;
    
    downloadFile(csv, `analytics-${Date.now()}.csv`, 'text/csv');
    showAlert('Data exported to CSV', 'success');
}

// Export to JSON
function exportToJSON() {
    const exportData = {
        period: currentPeriod,
        dateFrom: analyticsData.dateFrom,
        dateTo: analyticsData.dateTo,
        metrics: analyticsData.metrics,
        orders: analyticsData.orders,
        products: analyticsData.products,
        customers: analyticsData.customers
    };
    
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, `analytics-${Date.now()}.json`, 'application/json');
    showAlert('Data exported to JSON', 'success');
}

// Download file helper
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

// Format percent
function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

// Show loading
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
}

// Hide loading
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

