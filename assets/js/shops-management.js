console.log('🎯 Shops Management loaded');

// === GLOBAL STATE ===
let currentPage = 1;
let perPage = 20;
let totalPages = 1;
let totalShops = 0;
let shops = [];
let selectedShops = new Set();
let sortBy = 'created_at';
let sortOrder = 'desc';
let currentFilters = {};

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
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Ошибка инициализации: ' + error.message, 'error');
    }
}

// === LOAD SHOPS ===
async function loadShops() {
    try {
        const container = document.getElementById('shopsContainer');
        container.innerHTML = '<div class="loading">Загрузка магазинов...</div>';
        
        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            sort_by: sortBy,
            sort_order: sortOrder
        });
        
        // Add filters
        if (currentFilters.is_approved !== undefined && currentFilters.is_approved !== 'all') {
            params.append('is_approved', currentFilters.is_approved);
        }
        if (currentFilters.min_balance) {
            params.append('min_balance', currentFilters.min_balance);
        }
        if (currentFilters.max_balance) {
            params.append('max_balance', currentFilters.max_balance);
        }
        
        const response = await apiRequest(`/api/v1/admin/shops/all?${params.toString()}`);
        
        shops = response.shops;
        totalShops = response.total;
        totalPages = response.total_pages;
        
        renderShops();
        renderPagination();
        updatePaginationInfo();
        
    } catch (error) {
        console.error('Error loading shops:', error);
        showAlert('Ошибка загрузки магазинов: ' + error.message, 'error');
        document.getElementById('shopsContainer').innerHTML = `
            <div class="no-shops">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// === RENDER SHOPS ===
function renderShops() {
    const container = document.getElementById('shopsContainer');
    
    if (shops.length === 0) {
        container.innerHTML = `
            <div class="no-shops">
                <h3>Магазины не найдены</h3>
                <p>Попробуйте изменить фильтры</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="shops-grid">
            ${shops.map(shop => renderShopCard(shop)).join('')}
        </div>
    `;
}

// === RENDER SHOP CARD ===
function renderShopCard(shop) {
    const avatarUrl = shop.avatar_url || 'https://via.placeholder.com/80?text=Shop';
    
    const approvedBadge = shop.is_approved 
        ? '<span class="badge approved">✅ Одобрен</span>' 
        : '<span class="badge pending">⏳ Не одобрен</span>';
    
    const isChecked = selectedShops.has(shop.id) ? 'checked' : '';
    
    // Calculate total, active, pending products
    const totalProducts = shop.total_products || 0;
    const activeProducts = shop.active_products || 0;
    const pendingProducts = shop.pending_products || 0;
    
    return `
        <div class="shop-card" data-shop-id="${shop.id}">
            <div class="shop-checkbox">
                <input type="checkbox" ${isChecked} onchange="toggleShopSelection(${shop.id})">
            </div>
            <img src="${avatarUrl}" alt="${shop.shop_name}" class="shop-avatar" onerror="this.src='https://via.placeholder.com/80?text=Shop'">
            <div class="shop-info">
                <div class="shop-name">${shop.shop_name}</div>
                <div class="shop-owner">👤 ${shop.owner_name || 'Владелец'} • ${shop.owner_email || 'email'}</div>
                <div class="shop-balance">$${(shop.balance || 0).toFixed(2)}</div>
                <div class="shop-stats">
                    <div class="stat-item">📦 Всего: ${totalProducts}</div>
                    <div class="stat-item">✓ Активных: ${activeProducts}</div>
                    <div class="stat-item">⏳ На модерации: ${pendingProducts}</div>
                </div>
                <div class="shop-badges">
                    ${approvedBadge}
                </div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                    Зарегистрирован: ${new Date(shop.created_at).toLocaleDateString('ru-RU')}
                </div>
            </div>
            <div class="shop-actions">
                ${!shop.is_approved ? `
                    <button class="action-btn approve" onclick="approveShop(${shop.id})">✅ Одобрить</button>
                ` : `
                    <button class="action-btn block" onclick="blockShop(${shop.id})">🚫 Заблокировать</button>
                `}
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
    const end = Math.min(currentPage * perPage, totalShops);
    const info = `Показано ${start}-${end} из ${totalShops}`;
    
    document.getElementById('topPaginationInfo').textContent = info;
}

// === PAGINATION ===
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadShops();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === SELECTION ===
function toggleShopSelection(shopId) {
    if (selectedShops.has(shopId)) {
        selectedShops.delete(shopId);
    } else {
        selectedShops.add(shopId);
    }
    updateSelectedCount();
}

function toggleSelectAll() {
    const checkbox = document.getElementById('selectAll');
    if (checkbox.checked) {
        shops.forEach(s => selectedShops.add(s.id));
    } else {
        selectedShops.clear();
    }
    updateSelectedCount();
    renderShops();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `${selectedShops.size} выбрано`;
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
    const isApproved = document.getElementById('filterApproved').value;
    const minBalance = document.getElementById('filterMinBalance').value;
    const maxBalance = document.getElementById('filterMaxBalance').value;
    
    currentFilters = {
        is_approved: isApproved,
        min_balance: minBalance || null,
        max_balance: maxBalance || null
    };
    
    currentPage = 1;
    loadShops();
}

function resetFilters() {
    document.getElementById('filterApproved').value = 'all';
    document.getElementById('filterMinBalance').value = '';
    document.getElementById('filterMaxBalance').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadShops();
}

function applyQuickFilter(type) {
    // Remove active from all quick filters
    document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'pending') {
        document.getElementById('filterApproved').value = 'false';
        currentFilters.is_approved = 'false';
    } else if (type === 'approved') {
        document.getElementById('filterApproved').value = 'true';
        currentFilters.is_approved = 'true';
    } else if (type === 'top-balance') {
        sortBy = 'balance';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'balance';
    } else if (type === 'most-products') {
        // This would need a new sort option in backend
        // For now, just reset to created_at
        sortBy = 'created_at';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'created_at';
    }
    
    // Mark clicked button as active
    event.target.classList.add('active');
    
    currentPage = 1;
    loadShops();
}

// === SORTING ===
function applySort() {
    sortBy = document.getElementById('sortBy').value;
    loadShops();
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    document.getElementById('sortOrderBtn').textContent = sortOrder === 'desc' ? '↓' : '↑';
    loadShops();
}

// === APPROVE SHOP ===
async function approveShop(shopId) {
    try {
        await apiRequest(`/api/v1/admin/shops/${shopId}/approve`, 'POST');
        showAlert('Магазин одобрен', 'success');
        loadShops();
    } catch (error) {
        showAlert('Ошибка одобрения: ' + error.message, 'error');
    }
}

// === BLOCK SHOP ===
async function blockShop(shopId) {
    if (!confirm('Вы уверены что хотите заблокировать этот магазин?')) return;
    
    try {
        await apiRequest(`/api/v1/admin/shops/${shopId}/block`, 'POST');
        showAlert('Магазин заблокирован', 'success');
        loadShops();
    } catch (error) {
        showAlert('Ошибка блокировки: ' + error.message, 'error');
    }
}

// === BULK ACTIONS ===
async function bulkAction(action) {
    if (selectedShops.size === 0) {
        showAlert('Выберите магазины', 'error');
        return;
    }
    
    const shopIds = Array.from(selectedShops);
    
    if (action === 'block' && !confirm(`Вы уверены что хотите заблокировать ${shopIds.length} магазинов?`)) {
        return;
    }
    
    try {
        await apiRequest('/api/v1/admin/shops/bulk-action', 'POST', {
            shop_ids: shopIds,
            action
        });
        
        showAlert(`Массовое действие выполнено для ${shopIds.length} магазинов`, 'success');
        selectedShops.clear();
        updateSelectedCount();
        loadShops();
    } catch (error) {
        showAlert('Ошибка массового действия: ' + error.message, 'error');
    }
}

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', init);
