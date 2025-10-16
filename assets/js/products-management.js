console.log('🎯 Products Management loaded');

// === GLOBAL STATE ===
let currentPage = 1;
let perPage = 20;
let totalPages = 1;
let totalProducts = 0;
let products = [];
let selectedProducts = new Set();
let sortBy = 'created_at';
let sortOrder = 'desc';
let currentFilters = {};
let allShops = [];

// === AUTH & CONFIG ===
const token = localStorage.getItem('token');
const accountType = localStorage.getItem('accountType');

if (!token || accountType !== 'admin') {
    window.location.href = 'admin.html';
}

// === API REQUEST ===
async function apiRequest(endpoint, method = 'GET', data = null) {
    const API_URL = window.API_CONFIG?.apiUrl || 'https://api.leema.kz';
    const url = `${API_URL}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
    }
    
    return response.json();
}

// === ALERTS ===
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        padding: 15px 20px;
        margin-bottom: 20px;
        border-radius: 8px;
        background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
        color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
    `;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

// === INITIALIZATION ===
async function init() {
    try {
        await loadShops();
        await loadProducts();
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Ошибка инициализации: ' + error.message, 'error');
    }
}

// === LOAD SHOPS FOR FILTER ===
async function loadShops() {
    try {
        const response = await apiRequest('/api/v1/admin/shops');
        allShops = response;
        
        const shopFilter = document.getElementById('filterShop');
        allShops.forEach(shop => {
            const option = document.createElement('option');
            option.value = shop.id;
            option.textContent = shop.shop_name;
            shopFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading shops:', error);
    }
}

// === LOAD PRODUCTS ===
async function loadProducts() {
    try {
        const container = document.getElementById('productsContainer');
        container.innerHTML = '<div class="loading">Загрузка товаров...</div>';
        
        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            sort_by: sortBy,
            sort_order: sortOrder
        });
        
        // Add filters
        if (currentFilters.status && currentFilters.status !== 'all') {
            params.append('status', currentFilters.status);
        }
        if (currentFilters.is_active !== undefined && currentFilters.is_active !== 'all') {
            params.append('is_active', currentFilters.is_active);
        }
        if (currentFilters.shop_id && currentFilters.shop_id !== 'all') {
            params.append('shop_id', currentFilters.shop_id);
        }
        if (currentFilters.min_price) {
            params.append('min_price', currentFilters.min_price);
        }
        if (currentFilters.max_price) {
            params.append('max_price', currentFilters.max_price);
        }
        
        const response = await apiRequest(`/api/v1/admin/products/all?${params.toString()}`);
        
        products = response.products;
        totalProducts = response.total;
        totalPages = response.total_pages;
        
        renderProducts();
        renderPagination();
        updatePaginationInfo();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Ошибка загрузки товаров: ' + error.message, 'error');
        document.getElementById('productsContainer').innerHTML = `
            <div class="no-products">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// === RENDER PRODUCTS ===
function renderProducts() {
    const container = document.getElementById('productsContainer');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить фильтры</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="products-grid">
            ${products.map(product => renderProductCard(product)).join('')}
        </div>
    `;
}

// === RENDER PRODUCT CARD ===
function renderProductCard(product) {
    // Use a simple gray placeholder with data URI instead of external service
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="140" height="180"%3E%3Crect fill="%23f3f4f6" width="140" height="180"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : placeholderImage;
    
    const statusBadge = {
        'approved': '<span class="badge approved">✅ Одобрен</span>',
        'pending': '<span class="badge pending">⏳ Модерация</span>',
        'rejected': '<span class="badge rejected">❌ Отклонен</span>'
    }[product.moderation_status] || '';
    
    const activeBadge = product.is_active 
        ? '<span class="badge active">● Активен</span>' 
        : '<span class="badge inactive">○ Неактивен</span>';
    
    const isChecked = selectedProducts.has(product.id) ? 'checked' : '';
    
    const createdDate = new Date(product.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-card-header">
                <span class="product-id">ID: ${product.id}</span>
                <div class="product-checkbox">
                    <input type="checkbox" ${isChecked} onchange="toggleProductSelection(${product.id})">
                </div>
            </div>
            
            <div class="product-card-body">
                <div class="product-image-wrapper">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='${placeholderImage}'">
                </div>
                
                <div class="product-main-info">
                    <div class="product-title-row">
                        <div>
                            <div class="product-name">${product.name}</div>
                            <div class="product-shop">${product.shop_name}</div>
                        </div>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                    </div>
                    
                    <div class="product-stats">
                        <div class="stat-item">
                            <span class="stat-label">Просмотры:</span>
                            <span class="stat-value">${product.views_count || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Примерки:</span>
                            <span class="stat-value">${product.try_ons_count || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Покупки:</span>
                            <span class="stat-value">${product.purchases_count || 0}</span>
                        </div>
                    </div>
                    
                    <div class="product-badges">
                        ${statusBadge}
                        ${activeBadge}
                    </div>
                    
                    ${product.moderation_notes ? `<div class="product-meta"><span class="meta-item"><strong>Заметка:</strong> ${product.moderation_notes}</span></div>` : ''}
                    
                    <div class="product-meta">
                        <span class="meta-item"><strong>Создан:</strong> ${createdDate}</span>
                    </div>
                </div>
                
                <div class="product-actions">
                    ${product.moderation_status === 'pending' ? `
                        <button class="action-btn approve" onclick="moderateProduct(${product.id}, 'approve')">✅ Одобрить</button>
                        <button class="action-btn reject" onclick="moderateProduct(${product.id}, 'reject')">❌ Отклонить</button>
                    ` : ''}
                    <button class="action-btn delete" onclick="deleteProduct(${product.id})">🗑️ Удалить</button>
                </div>
            </div>
        </div>
    `;
}

// === RENDER PAGINATION ===
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page
    if (!pages.includes(totalPages)) pages.push(totalPages);
    
    const buttons = pages.map((page, index) => {
        const prevPage = pages[index - 1];
        const gap = prevPage && page - prevPage > 1 ? '<span>...</span>' : '';
        const active = page === currentPage ? 'active' : '';
        return `
            ${gap}
            <button class="page-btn ${active}" onclick="goToPage(${page})">${page}</button>
        `;
    }).join('');
    
    container.innerHTML = `
        <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>←</button>
        ${buttons}
        <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>→</button>
    `;
}

// === UPDATE PAGINATION INFO ===
function updatePaginationInfo() {
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalProducts);
    const info = `Показано ${start}-${end} из ${totalProducts}`;
    
    document.getElementById('topPaginationInfo').textContent = info;
}

// === PAGINATION ===
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === SELECTION ===
function toggleProductSelection(productId) {
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
    } else {
        selectedProducts.add(productId);
    }
    updateSelectedCount();
}

function toggleSelectAll() {
    const checkbox = document.getElementById('selectAll');
    if (checkbox.checked) {
        products.forEach(p => selectedProducts.add(p.id));
    } else {
        selectedProducts.clear();
    }
    updateSelectedCount();
    renderProducts();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `${selectedProducts.size} выбрано`;
}

// === FILTERS ===
function toggleFilters() {
    const content = document.getElementById('filtersContent');
    const btn = document.querySelector('.toggle-filters');
    if (content.style.display === 'none') {
        content.style.display = 'grid';
        btn.textContent = 'Свернуть ▼';
    } else {
        content.style.display = 'none';
        btn.textContent = 'Развернуть ▶';
    }
}

function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const isActive = document.getElementById('filterActive').value;
    const shopId = document.getElementById('filterShop').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;
    
    currentFilters = {
        status,
        is_active: isActive,
        shop_id: shopId,
        min_price: minPrice || null,
        max_price: maxPrice || null
    };
    
    currentPage = 1;
    loadProducts();
}

function resetFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterActive').value = 'all';
    document.getElementById('filterShop').value = 'all';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadProducts();
}

function applyQuickFilter(type) {
    // Remove active from all quick filters
    document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'pending') {
        document.getElementById('filterStatus').value = 'pending';
        currentFilters.status = 'pending';
    } else if (type === 'top-views') {
        sortBy = 'views_count';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'views_count';
    } else if (type === 'top-sales') {
        sortBy = 'purchases_count';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'purchases_count';
    } else if (type === 'rejected') {
        document.getElementById('filterStatus').value = 'rejected';
        currentFilters.status = 'rejected';
    }
    
    // Mark clicked button as active
    event.target.classList.add('active');
    
    currentPage = 1;
    loadProducts();
}

// === SORTING ===
function applySort() {
    sortBy = document.getElementById('sortBy').value;
    loadProducts();
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    document.getElementById('sortOrderBtn').textContent = sortOrder === 'desc' ? '↓' : '↑';
    loadProducts();
}

// === MODERATION ===
async function moderateProduct(productId, action) {
    try {
        const notes = action === 'reject' ? prompt('Причина отклонения (опционально):') : null;
        
        await apiRequest(`/api/v1/admin/moderation/${productId}/${action}`, 'POST', { notes });
        
        showAlert(`Товар ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success');
        loadProducts();
    } catch (error) {
        showAlert('Ошибка модерации: ' + error.message, 'error');
    }
}

// === DELETE ===
async function deleteProduct(productId) {
    if (!confirm('Вы уверены что хотите удалить этот товар?')) return;
    
    try {
        await apiRequest(`/api/v1/admin/products/${productId}`, 'DELETE');
        showAlert('Товар удален', 'success');
        loadProducts();
    } catch (error) {
        showAlert('Ошибка удаления: ' + error.message, 'error');
    }
}

// === BULK ACTIONS ===
async function bulkAction(action) {
    if (selectedProducts.size === 0) {
        showAlert('Выберите товары', 'error');
        return;
    }
    
    const productIds = Array.from(selectedProducts);
    let notes = null;
    
    if (action === 'reject') {
        notes = prompt('Причина отклонения (опционально):');
    }
    
    if (action === 'delete' && !confirm(`Вы уверены что хотите удалить ${productIds.length} товаров?`)) {
        return;
    }
    
    try {
        const response = await apiRequest('/api/v1/admin/products/bulk-action', 'POST', {
            product_ids: productIds,
            action,
            notes
        });
        
        showAlert(`Массовое действие выполнено для ${productIds.length} товаров`, 'success');
        selectedProducts.clear();
        updateSelectedCount();
        loadProducts();
    } catch (error) {
        showAlert('Ошибка массового действия: ' + error.message, 'error');
    }
}

// === TAB SWITCHING ===
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Load data for the selected tab
    if (tabName === 'refunds') {
        loadRefunds();
    }
}

// === LOAD REFUNDS ===
async function loadRefunds() {
    try {
        const statusFilter = document.getElementById('refundStatusFilter')?.value || '';
        const params = statusFilter ? `?status=${statusFilter}` : '';
        
        const refunds = await apiRequest(`/api/v1/admin/refunds${params}`);
        renderRefunds(refunds);
    } catch (error) {
        console.error('Error loading refunds:', error);
        showAlert('Ошибка загрузки возвратов: ' + error.message, 'error');
    }
}

// === RENDER REFUNDS ===
function renderRefunds(refunds) {
    const container = document.getElementById('refundsList');
    
    if (!refunds || refunds.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <h3>Запросы на возврат не найдены</h3>
                <p>Нет активных запросов</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = refunds.map(refund => `
        <div class="refund-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">Возврат #${refund.id}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        Товар: ${refund.product_name || 'Неизвестно'} | 
                        Пользователь: ${refund.user_email || 'Неизвестно'}
                    </p>
                </div>
                <span class="badge ${refund.status}">${refund.status === 'pending' ? '⏳ Ожидает' : refund.status === 'approved' ? '✅ Одобрен' : '❌ Отклонен'}</span>
            </div>
            
            <p style="margin: 10px 0; color: #374151;">${refund.reason || 'Причина не указана'}</p>
            
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                ${refund.status === 'pending' ? `
                    <button class="action-btn approve" onclick="handleRefund(${refund.id}, 'approved')">✅ Одобрить</button>
                    <button class="action-btn reject" onclick="handleRefund(${refund.id}, 'rejected')">❌ Отклонить</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// === HANDLE REFUND ===
async function handleRefund(refundId, action) {
    try {
        await apiRequest(`/api/v1/admin/refunds/${refundId}`, 'PUT', { status: action });
        showAlert(`Возврат ${action === 'approved' ? 'одобрен' : 'отклонен'}`, 'success');
        loadRefunds();
    } catch (error) {
        showAlert('Ошибка обработки возврата: ' + error.message, 'error');
    }
}

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', init);
