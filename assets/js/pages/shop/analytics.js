// Shop Analytics - Advanced Analytics Page
console.log('🎨 Shop Analytics initializing...');

// Use API_URL from config.js
const API_BASE_URL = (typeof API_URL !== 'undefined' ? API_URL : 'https://api.leema.kz') + '/api/v1';

let revenueChart, ordersChart, categoryChart;
let analyticsData = {};
let currentPeriod = 7;
let currentRevenueView = 'daily';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Analytics page loaded');
    
    // Check authentication and account type
    const token = getToken();
    const accountType = localStorage.getItem('accountType');
    const userRole = localStorage.getItem('userRole');
    
    console.log('🔐 Auth check:', { token: !!token, accountType, userRole });
    
    if (!token) {
        console.log('❌ Not authenticated, redirecting...');
        window.location.href = '/';
        return;
    }
    
    // Check if account type is shop (either accountType or userRole)
    const isShop = accountType === 'shop' || userRole === 'shop';
    
    if (!isShop) {
        console.log('❌ Wrong account type, redirecting...');
        if (accountType === 'admin' || userRole === 'admin') {
            window.location.href = '/admin/index.html';
        } else if (accountType === 'user' || userRole === 'user') {
            window.location.href = '/user/dashboard.html';
        } else {
            window.location.href = '/';
        }
        return;
    }
    
    console.log('✅ Authorization successful, loading analytics...');

    // Initialize
    await loadShopInfo();
    await loadAnalytics();
});

// Load shop information
async function loadShopInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/shops/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to load shop info');

        const shop = await response.json();
        
        // Update UI
        document.getElementById('shopName').textContent = shop.name || 'Мой магазин';
        
        const avatar = document.getElementById('shopAvatar');
        if (avatar) {
            avatar.textContent = (shop.name || 'М').charAt(0).toUpperCase();
        }
        
        console.log('✅ Shop info loaded:', shop.name);
    } catch (error) {
        console.error('❌ Failed to load shop info:', error);
    }
}

// Load analytics data
async function loadAnalytics() {
    showLoading();
    
    try {
        // Calculate date range
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - currentPeriod);

        console.log(`📊 Loading analytics for ${currentPeriod} days`);

        // Load data in parallel
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

        // Calculate metrics
        calculateMetrics();
        
        // Render charts
        renderCharts();
        
        // Update UI
        updateUI();
        
        console.log('✅ Analytics loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load analytics:', error);
        showAlert('Ошибка загрузки аналитики', 'error');
    } finally {
        hideLoading();
    }
}

// Fetch orders
async function fetchOrders(dateFrom, dateTo) {
    try {
        const url = new URL(`${API_BASE_URL}/shops/me/orders`);
        url.searchParams.set('page', '1');
        url.searchParams.set('limit', '1000');
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        
        // Filter by date range
        const filtered = (data.orders || data.data || []).filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= dateFrom && orderDate <= dateTo;
        });

        console.log(`📦 Loaded ${filtered.length} orders`);
        return filtered;
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return [];
    }
}

// Fetch products
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/shops/me/products?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        const products = data.products || data.data || [];
        
        console.log(`📦 Loaded ${products.length} products`);
        return products;
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

// Fetch customers
async function fetchCustomers() {
    try {
        // Get unique customers from orders
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
        console.log(`👥 Processed ${customersArray.length} customers`);
        return customersArray;
    } catch (error) {
        console.error('Failed to process customers:', error);
        return [];
    }
}

// Calculate metrics
function calculateMetrics() {
    const { orders, products, customers } = analyticsData;
    
    // Revenue metrics
    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Customer metrics
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.orders.length === 1).length;
    const returningCustomers = customers.filter(c => c.orders.length > 1).length;
    const customerLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    
    // Product metrics
    const activeProducts = products.filter(p => p.status === 'approved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const totalViews = products.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalTryOns = products.reduce((sum, p) => sum + (p.try_on_count || 0), 0);
    
    // Order status breakdown
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;
    
    // Conversion rate
    const productViews = totalViews || 0;
    const productSales = totalOrders;
    const conversionRate = productViews > 0 ? (productSales / productViews) * 100 : 0;
    
    // Calculate previous period for comparison
    const previousPeriodOrders = []; // Would need to fetch previous period data
    const previousRevenue = 0;
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    // Store calculated metrics
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
    
    console.log('📊 Metrics calculated:', analyticsData.metrics);
}

// Update UI with metrics
function updateUI() {
    const { metrics } = analyticsData;
    
    // Key metrics
    document.getElementById('totalRevenue').textContent = formatCurrency(metrics.totalRevenue);
    document.getElementById('totalOrders').textContent = metrics.totalOrders;
    document.getElementById('averageOrder').textContent = formatCurrency(metrics.averageOrder);
    document.getElementById('totalCustomers').textContent = metrics.totalCustomers;
    
    // Trends
    updateTrend('revenueTrend', metrics.revenueChange);
    updateTrend('ordersTrend', 0); // Would need historical data
    updateTrend('avgTrend', 0);
    updateTrend('customersTrend', 0);
    
    // Comparison section
    document.getElementById('comparisonRevenue').textContent = formatPercent(metrics.revenueChange);
    document.getElementById('currentPeriodRevenue').textContent = formatCurrency(metrics.totalRevenue);
    document.getElementById('previousPeriodRevenue').textContent = formatCurrency(metrics.previousRevenue);
    
    // Conversion
    document.getElementById('conversionRate').textContent = formatPercent(metrics.conversionRate);
    document.getElementById('productViews').textContent = metrics.productViews;
    document.getElementById('productSales').textContent = metrics.productSales;
    
    // Customer metrics
    document.getElementById('newCustomers').textContent = metrics.newCustomers;
    document.getElementById('returningCustomers').textContent = metrics.returningCustomers;
    document.getElementById('customerLTV').textContent = formatCurrency(metrics.customerLTV);
    document.getElementById('retentionRate').textContent = formatPercent(metrics.retentionRate);
    
    // Product metrics
    document.getElementById('activeProducts').textContent = metrics.activeProducts;
    document.getElementById('pendingProducts').textContent = metrics.pendingProducts;
    document.getElementById('totalViews').textContent = metrics.totalViews;
    document.getElementById('totalTryOns').textContent = metrics.totalTryOns;
    
    // Order metrics
    document.getElementById('completedOrders').textContent = metrics.completedOrders;
    document.getElementById('pendingOrders').textContent = metrics.pendingOrders;
    document.getElementById('cancelledOrders').textContent = metrics.cancelledOrders;
    document.getElementById('refundedOrders').textContent = metrics.refundedOrders;
    
    // Update top products
    updateTopProducts();
    
    // Generate insights
    generateInsights();
}

// Update trend indicator
function updateTrend(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let trendClass = 'neutral';
    let arrow = '→';
    
    if (value > 0) {
        trendClass = 'up';
        arrow = '↑';
    } else if (value < 0) {
        trendClass = 'down';
        arrow = '↓';
    }
    
    element.className = `trend ${trendClass}`;
    element.innerHTML = `<span>${arrow}</span> ${Math.abs(value).toFixed(1)}%`;
}

// Update top products table
function updateTopProducts() {
    const { orders, products } = analyticsData;
    
    // Calculate product sales
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
    
    // Sort by revenue
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    // Render table
    const tbody = document.getElementById('topProductsBody');
    
    if (topProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">
                    Нет данных о продажах
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = topProducts.map((product, index) => `
        <tr>
            <td style="font-weight: 600; color: #667eea;">${index + 1}</td>
            <td class="product-name">${escapeHtml(product.name)}</td>
            <td class="product-sales">${product.quantity}</td>
            <td class="product-revenue">${formatCurrency(product.revenue)}</td>
            <td>${formatCurrency(product.revenue / product.quantity)}</td>
        </tr>
    `).join('');
}

// Render charts
function renderCharts() {
    renderRevenueChart();
    renderOrdersChart();
    renderCategoryChart();
}

// Render revenue chart
function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const chartData = prepareRevenueChartData();
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Выручка',
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
                        label: (context) => `Выручка: ${formatCurrency(context.parsed.y)}`
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

// Prepare revenue chart data
function prepareRevenueChartData() {
    const { orders, dateFrom, dateTo } = analyticsData;
    
    // Group by view type
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
    
    // Sort and format
    const sortedKeys = Object.keys(groupedData).sort();
    const labels = sortedKeys.map(key => formatChartLabel(key));
    const data = sortedKeys.map(key => groupedData[key]);
    
    return { labels, data };
}

// Format chart label
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

// Render orders chart
function renderOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (ordersChart) {
        ordersChart.destroy();
    }
    
    const chartData = prepareOrdersChartData();
    
    ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Заказы',
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

// Prepare orders chart data
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

// Render category chart
function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
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

// Prepare category chart data
function prepareCategoryChartData() {
    const { orders, products } = analyticsData;
    
    const categoryRevenue = {};
    
    orders.forEach(order => {
        if (order.status !== 'completed') return;
        
        (order.items || []).forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            const category = product?.category || 'Другое';
            
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

// Generate insights
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
    
    if (insights.length > 0) {
        document.getElementById('insightCard').style.display = 'block';
        document.getElementById('insightText').innerHTML = insights.join('<br>');
    }
}

// Change period
function changePeriod(days) {
    currentPeriod = days;
    
    // Update button states
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period == days) {
            btn.classList.add('active');
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
    
    // Calculate days
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
    
    // Update button states
    document.querySelectorAll('.chart-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
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
    showAlert('Данные экспортированы в CSV', 'success');
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
    showAlert('Данные экспортированы в JSON', 'success');
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
    if (overlay) overlay.style.display = 'flex';
}

// Hide loading
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Show alert
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        padding: 12px 20px;
        margin-bottom: 15px;
        border-radius: 8px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        alert.style.background = '#d1fae5';
        alert.style.color = '#065f46';
    } else if (type === 'error') {
        alert.style.background = '#fee2e2';
        alert.style.color = '#991b1b';
    } else {
        alert.style.background = '#dbeafe';
        alert.style.color = '#1e40af';
    }
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Check authentication
function checkAuth() {
    return !!getToken();
}

// Get token
function getToken() {
    return localStorage.getItem('token');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/';
}

console.log('✅ Shop Analytics initialized');
