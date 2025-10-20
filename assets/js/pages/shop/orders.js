// Shop Orders Page JavaScript
let currentPage = 1;
const ordersPerPage = 50;
let allOrders = [];
let filteredOrders = [];
let currentShop = null;

// Notification sound
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eeeTRAMUKfj8LZjHAY4ktfyzHksBSR3yPDekEAKFF606+uoVRQKRp/g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0edHv/CUl0bfpzw8LZjHAY4ktfyzHksBSR3yPDekEAKFF606+uoVRQKRp/g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg=');

// Page initialization
window.onload = async function() {
    const token = localStorage.getItem('token');
    const accountType = localStorage.getItem('accountType');

    if (!token || accountType !== 'shop') {
        window.location.href = '/';
        return;
    }

    try {
        // Load shop info
        currentShop = await loadShopInfo();
        
        // Initialize WebSocket with event handlers
        initializeWebSocket();
        
        // Load orders
        await loadOrders();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Ошибка загрузки данных', 'error');
    }
};

// Load shop information
async function loadShopInfo() {
    try {
        const shop = await apiRequest('/api/v1/shops/me', 'GET');
        document.getElementById('shopName').textContent = shop.name;
        
        // Set avatar
        const avatar = document.getElementById('shopAvatar');
        if (shop.logo_url) {
            avatar.innerHTML = `<img src="${shop.logo_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatar.textContent = shop.name.charAt(0).toUpperCase();
        }
        
        return shop;
    } catch (error) {
        console.error('Error loading shop info:', error);
        throw error;
    }
}

// Initialize WebSocket
function initializeWebSocket() {
    if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
        CommonUtils.initWebSocket('shop', {
            'order.created': onNewOrder,
            'order.completed': onOrderCompleted,
            'order.cancelled': onOrderCancelled,
            'order.refunded': onOrderRefunded,
        });
    } else {
        console.warn('WebSocket utilities not available');
    }
}

// WebSocket event handlers
function onNewOrder(data) {
    console.log('[WebSocket] New order:', data);
    
    if (data.data && data.data.shop_id === currentShop?.id) {
        // Play notification sound
        playNotificationSound();
        
        // Show notification
        if (typeof notificationManager !== 'undefined') {
            notificationManager.showToast(
                `🛍️ Новый заказ #${data.data.order_number || ''} на $${data.data.shop_amount || data.data.amount || '0'}`,
                'success',
                0 // Don't auto-dismiss
            );
        }
        
        // Desktop notification
        showDesktopNotification('Новый заказ!', `Заказ #${data.data.order_number || ''} на $${data.data.shop_amount || data.data.amount || '0'}`);
        
        // Reload orders
        loadOrders();
    }
}

function onOrderCompleted(data) {
    console.log('[WebSocket] Order completed:', data);
    
    if (typeof notificationManager !== 'undefined') {
        notificationManager.showToast('✅ Заказ выполнен!', 'success');
    }
    
    // Reload orders
    loadOrders();
}

function onOrderCancelled(data) {
    console.log('[WebSocket] Order cancelled:', data);
    
    if (typeof notificationManager !== 'undefined') {
        notificationManager.showToast('❌ Заказ отменён', 'warning');
    }
    
    // Reload orders
    loadOrders();
}

function onOrderRefunded(data) {
    console.log('[WebSocket] Order refunded:', data);
    
    if (typeof notificationManager !== 'undefined') {
        notificationManager.showToast('💰 Заказ возвращён', 'info');
    }
    
    // Reload orders
    loadOrders();
}

// Play notification sound
function playNotificationSound() {
    try {
        notificationSound.play().catch(e => console.log('Sound play failed:', e));
    } catch (error) {
        console.log('Sound not available:', error);
    }
}

// Show desktop notification
function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/assets/images/logo.png',
            badge: '/assets/images/logo.png'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body: body });
            }
        });
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await apiRequest('/api/v1/shops/me/orders', 'GET', {
            skip: 0,
            limit: 1000 // Load all for now, we'll paginate on client side
        });
        
        allOrders = Array.isArray(response) ? response : (response.items || []);
        
        // Calculate statistics
        calculateStatistics(allOrders);
        
        // Apply filters and render
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Ошибка загрузки заказов', 'error');
        
        // Show empty state
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('ordersTableContainer').style.display = 'none';
    }
}

// Calculate statistics
function calculateStatistics(orders) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let todayCount = 0, todayRevenue = 0;
    let weekCount = 0, weekRevenue = 0;
    let monthCount = 0, monthRevenue = 0;
    let totalCount = orders.length;
    let totalRevenue = 0;
    
    orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const shopAmount = calculateShopAmount(order);
        
        totalRevenue += shopAmount;
        
        if (orderDate >= todayStart) {
            todayCount++;
            todayRevenue += shopAmount;
        }
        
        if (orderDate >= weekStart) {
            weekCount++;
            weekRevenue += shopAmount;
        }
        
        if (orderDate >= monthStart) {
            monthCount++;
            monthRevenue += shopAmount;
        }
    });
    
    // Update UI
    document.getElementById('todayOrders').textContent = todayCount;
    document.getElementById('todayRevenue').textContent = '$' + todayRevenue.toFixed(2);
    
    document.getElementById('weekOrders').textContent = weekCount;
    document.getElementById('weekRevenue').textContent = '$' + weekRevenue.toFixed(2);
    
    document.getElementById('monthOrders').textContent = monthCount;
    document.getElementById('monthRevenue').textContent = '$' + monthRevenue.toFixed(2);
    
    document.getElementById('totalOrders').textContent = totalCount;
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
}

// Calculate shop amount from order
function calculateShopAmount(order) {
    if (!order.items) return 0;
    
    return order.items.reduce((sum, item) => {
        // Only count items from this shop
        if (item.product && item.product.shop_id === currentShop?.id) {
            return sum + (item.subtotal || (item.price * item.quantity));
        }
        return sum;
    }, 0);
}

// Apply filters and sorting
function applyFiltersAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const sortBy = document.getElementById('sortSelect').value;
    
    // Filter
    filteredOrders = allOrders.filter(order => {
        // Search filter
        if (searchTerm) {
            const matchesSearch = 
                order.order_number?.toLowerCase().includes(searchTerm) ||
                order.user?.full_name?.toLowerCase().includes(searchTerm) ||
                order.user?.email?.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            const orderDate = new Date(order.created_at);
            const now = new Date();
            
            if (dateFilter === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (orderDate < todayStart) return false;
            } else if (dateFilter === 'week') {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                if (orderDate < weekStart) return false;
            } else if (dateFilter === 'month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (orderDate < monthStart) return false;
            }
        }
        
        return true;
    });
    
    // Sort
    filteredOrders.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'amount_high':
                return calculateShopAmount(b) - calculateShopAmount(a);
            case 'amount_low':
                return calculateShopAmount(a) - calculateShopAmount(b);
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Render
    renderOrders();
}

// Render orders
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('ordersTableContainer');
    
    if (filteredOrders.length === 0) {
        emptyState.style.display = 'block';
        tableContainer.style.display = 'none';
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    // Render table rows
    tbody.innerHTML = pageOrders.map(order => {
        const shopAmount = calculateShopAmount(order);
        const shopItems = order.items?.filter(item => item.product?.shop_id === currentShop?.id) || [];
        
        return `
            <tr>
                <td>
                    <span class="order-number" onclick="viewOrderDetail(${order.id})">
                        #${order.order_number || order.id}
                    </span>
                </td>
                <td>${formatDate(order.created_at)}</td>
                <td>${order.user?.full_name || 'Неизвестно'}</td>
                <td>${shopItems.length} ${pluralize(shopItems.length, 'товар', 'товара', 'товаров')}</td>
                <td><strong>$${shopAmount.toFixed(2)}</strong></td>
                <td>${formatPaymentMethod(order.payment_method)}</td>
                <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetail(${order.id})">
                        Подробнее
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update pagination
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderOrders();
        window.scrollTo(0, 0);
    }
}

// View order detail
async function viewOrderDetail(orderId) {
    try {
        const order = await apiRequest(`/api/v1/shops/me/orders/${orderId}`, 'GET');
        
        // Set modal data
        document.getElementById('modalOrderNumber').textContent = `Заказ #${order.order_number || order.id}`;
        document.getElementById('modalStatus').innerHTML = `<span class="status-badge status-${order.status}">${formatStatus(order.status)}</span>`;
        document.getElementById('modalDate').textContent = formatDateTime(order.created_at);
        document.getElementById('modalPayment').textContent = formatPaymentMethod(order.payment_method);
        document.getElementById('modalTotal').innerHTML = `<strong>$${order.total_amount?.toFixed(2) || '0.00'}</strong>`;
        
        // Customer info
        document.getElementById('modalCustomer').innerHTML = `
            <strong>${order.user?.full_name || 'Неизвестно'}</strong><br>
            <span style="color: #666;">${order.user?.email || ''}</span>
        `;
        
        // Render shop items only
        const shopItems = order.items?.filter(item => item.product?.shop_id === currentShop?.id) || [];
        const itemsHtml = shopItems.map(item => `
            <div class="order-item">
                <img src="${item.product?.images?.[0] || '/assets/images/placeholder.png'}" 
                     class="item-image" 
                     alt="${item.product?.name || 'Product'}">
                <div class="item-details">
                    <div class="item-name">${item.product?.name || 'Неизвестный товар'}</div>
                    <div class="item-price">
                        Количество: ${item.quantity} × $${item.price?.toFixed(2) || '0.00'} 
                        = <strong>$${(item.subtotal || item.price * item.quantity)?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('modalItems').innerHTML = itemsHtml || '<p>Нет товаров</p>';
        
        // Calculate shop total
        const shopTotal = calculateShopAmount(order);
        document.getElementById('modalShopTotal').textContent = '$' + shopTotal.toFixed(2);
        
        // Show modal
        document.getElementById('orderDetailModal').classList.add('show');
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showAlert('Ошибка загрузки деталей заказа', 'error');
    }
}

// Close order detail modal
function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.remove('show');
}

// Event handlers
function handleSearch() {
    applyFiltersAndSort();
}

function handleFilter() {
    applyFiltersAndSort();
}

function handleSort() {
    applyFiltersAndSort();
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
               date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'В обработке',
        'completed': 'Выполнен',
        'cancelled': 'Отменен',
        'refunded': 'Возвращен'
    };
    return statusMap[status] || status;
}

function formatPaymentMethod(method) {
    const methodMap = {
        'paypal': 'PayPal',
        'balance': 'Баланс',
        'card': 'Карта'
    };
    return methodMap[method] || method || 'Неизвестно';
}

function pluralize(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) {
        return one;
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return few;
    } else {
        return many;
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}" style="margin-bottom: 20px;">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Request desktop notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
