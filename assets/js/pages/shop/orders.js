let currentPage = 1;
let allOrders = [];
let filteredOrders = [];
let currentShop = null;

const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eeeTRAMUKfj8LZjHAY4ktfyzHksBSR3yPDekEAKFF606+uoVRQKRp/g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0edHv/CUl0bfpzw8LZjHAY4ktfyzHksBSR3yPDekEAKFF606+uoVRQKRp/g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg6k9jzzHcrBSV2yPDekEAKFF206+qpVRILR53g8r5sIQYsdMrz3I4+ChhluOvsp1cVDEyn4u+1YhoIOpPY88x3KwUldsjw3pBAChRdtOvqqVUSC0ed4PK+bCEGLHTK89yOPgoYZbjr7KdXFQxMp+LvtWIaCDqT2PPMdysFJXbI8N6QQAoUXbTr6qlVEgtHneDyvmwhBix0yvPcjj4KGGW46+ynVxUMTKfi77ViGgg=');

window.onload = async function() {
    if (!Router.protectPage('shop')) {
        return;
    }

    try {
        currentShop = await loadShopInfo();
        
        initializeWebSocket();
        
        await loadOrders();
        
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_DATA, 'error');
    }
};

async function loadShopInfo() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/shops/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load shop info');
        }
        
        const shop = await response.json();
        
        const shopNameEl = document.getElementById('shopName');
        if (shopNameEl) {
            shopNameEl.textContent = shop.name;
        }
        
        const avatar = document.getElementById('shopAvatar');
        if (avatar) {
            if (shop.logo_url) {
                avatar.innerHTML = `<img src="${shop.logo_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatar.textContent = shop.name.charAt(0).toUpperCase();
            }
        }
        
        return shop;
    } catch (error) {
        throw error;
    }
}

function initializeWebSocket() {
    if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
        CommonUtils.initWebSocket('shop', {
            'order.created': onNewOrder,
            'order.completed': onOrderCompleted,
            'order.cancelled': onOrderCancelled,
            'order.refunded': onOrderRefunded,
        });
    }
}

// WebSocket event handlers
function onNewOrder(data) {
    
    if (data.data && data.data.shop_id === currentShop?.id) {
        playNotificationSound();
        
        showDesktopNotification('New Order!', `Order #${data.data.order_number || ''} for ₸${data.data.shop_amount || data.data.amount || '0'}`);
        
        loadOrders();
    }
}

function onOrderCompleted(data) {
    // Reload orders
    loadOrders();
}

function onOrderCancelled(data) {
    // Reload orders
    loadOrders();
}

function onOrderRefunded(data) {
    // Reload orders
    loadOrders();
}

// Play notification sound
function playNotificationSound() {
    try {
        notificationSound.play().catch(e => {
            // Ignore audio play errors
        });
    } catch (error) {
        // Ignore errors
    }
}

// Show desktop notification
function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/assets/images/logo.png',
            badge: '/assets/images/logo.png',
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body: body });
            }
        });
    }
}

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_BASE_URL}/shops/me/orders`);
        url.searchParams.set('skip', '0');
        url.searchParams.set('limit', '1000'); // Load all for now, we'll paginate on client side
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        
        const data = await response.json();
        allOrders = data.orders || data.data || data.items || [];
        
        calculateStatistics(allOrders);
        
        // Apply filters and render
        applyFiltersAndSort();
        
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_ORDERS, 'error');
        
        // Show empty state
        const emptyState = document.getElementById('emptyState');
        const ordersContainer = document.getElementById('ordersTableContainer');
        if (emptyState) emptyState.style.display = 'block';
        if (ordersContainer) ordersContainer.style.display = 'none';
    }
}

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
    
    // Batch all DOM updates together
    CommonUtils.batchDOMUpdates(() => {
        document.getElementById('todayOrders').textContent = todayCount;
        document.getElementById('todayRevenue').textContent = '$' + todayRevenue.toFixed(2);
        
        document.getElementById('weekOrders').textContent = weekCount;
        document.getElementById('weekRevenue').textContent = '$' + weekRevenue.toFixed(2);
        
        document.getElementById('monthOrders').textContent = monthCount;
        document.getElementById('monthRevenue').textContent = '$' + monthRevenue.toFixed(2);
        
        document.getElementById('totalOrders').textContent = totalCount;
        document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    });
}

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

function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('ordersTableContainer');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (filteredOrders.length === 0) {
        // Batch style updates
        CommonUtils.batchDOMUpdates(() => {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
            paginationContainer.style.display = 'none';
        });
        return;
    }
    
    CommonUtils.batchDOMUpdates(() => {
        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';
    });
    
    const startIndex = (currentPage - 1) * APP_CONSTANTS.PAGINATION.ORDERS_PER_PAGE;
    const endIndex = startIndex + APP_CONSTANTS.PAGINATION.ORDERS_PER_PAGE;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    // Build rows array for DocumentFragment
    const rowsHTML = pageOrders.map(order => {
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
                <td>${order.user?.full_name || 'Unknown'}</td>
                <td>${shopItems.length} ${pluralize(shopItems.length, 'product', 'productа', 'productов')}</td>
                <td><strong>$${shopAmount.toFixed(2)}</strong></td>
                <td>${formatPaymentMethod(order.payment_method)}</td>
                <td><span class="status-badge status-${order.status}">${formatStatus(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetail(${order.id})">
                        Details
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Use DocumentFragment if available in CommonUtils
    if (CommonUtils.createDocumentFragment) {
        tbody.innerHTML = '';
        tbody.appendChild(CommonUtils.createDocumentFragment(rowsHTML));
    } else {
        tbody.innerHTML = rowsHTML.join('');
    }
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / APP_CONSTANTS.PAGINATION.ORDERS_PER_PAGE);
    const paginationContainer = document.getElementById('paginationContainer');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredOrders.length / APP_CONSTANTS.PAGINATION.ORDERS_PER_PAGE);
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/shops/me/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load order details');
        }
        
        const order = await response.json();
        
        const modalOrderNumber = document.getElementById('modalOrderNumber');
        const modalStatus = document.getElementById('modalStatus');
        const modalDate = document.getElementById('modalDate');
        const modalPayment = document.getElementById('modalPayment');
        const modalTotal = document.getElementById('modalTotal');
        const modalCustomer = document.getElementById('modalCustomer');
        const modalItems = document.getElementById('modalItems');
        const modalShopTotal = document.getElementById('modalShopTotal');
        
        if (modalOrderNumber) modalOrderNumber.textContent = `Order #${order.order_number || order.id}`;
        if (modalStatus) modalStatus.innerHTML = `<span class="status-badge status-${order.status}">${formatStatus(order.status)}</span>`;
        if (modalDate) modalDate.textContent = formatDateTime(order.created_at);
        if (modalPayment) modalPayment.textContent = formatPaymentMethod(order.payment_method);
        if (modalTotal) modalTotal.innerHTML = `<strong>₸${order.total_amount?.toFixed(2) || '0.00'}</strong>`;
        
        // Customer info
        if (modalCustomer) {
            modalCustomer.innerHTML = `
                <strong>${order.user?.full_name || 'Unknown'}</strong><br>
                <span style="color: #666;">${order.user?.email || ''}</span>
            `;
        }
        
        const shopItems = order.items?.filter(item => item.product?.shop_id === currentShop?.id) || [];
        const itemsHtml = shopItems.map(item => `
            <div class="order-item">
                <img src="${item.product?.images?.[0] || '/assets/images/placeholder.png'}" 
                     class="item-image" 
                     alt="${item.product?.name || 'Product'}">
                <div class="item-details">
                    <div class="item-name">${item.product?.name || 'Неofвестный product'}</div>
                    <div class="item-price">
                        Quantity: ${item.quantity} × ₸${item.price?.toFixed(2) || '0.00'} 
                        = <strong>₸${(item.subtotal || item.price * item.quantity)?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (modalItems) modalItems.innerHTML = itemsHtml || '<p>Нет productов</p>';
        
        const shopTotal = calculateShopAmount(order);
        if (modalShopTotal) modalShopTotal.textContent = '$' + shopTotal.toFixed(2);
        
        // Show modal
        const modal = document.getElementById('orderDetailModal');
        if (modal) modal.classList.add('show');
        
    } catch (error) {
        showAlert('Error loading order details', 'error');
    }
}

// Close order detail modal
function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.remove('show');
}

// Event handlers
const debouncedSearch = window.debounce ? window.debounce(applyFiltersAndSort, 300) : applyFiltersAndSort;

function handleSearch() {
    debouncedSearch();
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
        return 'Today ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
        'pending': 'Processing',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'refunded': 'Refunded'
    };
    return statusMap[status] || status;
}

function formatPaymentMethod(method) {
    const methodMap = {
        'paypal': 'PayPal',
        'balance': 'Balance',
        'card': 'Card'
    };
    return methodMap[method] || method || 'Unknown';
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

// Request desktop notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
