console.log('🎯 Users Management loaded');

// === GLOBAL STATE ===
let currentPage = 1;
let perPage = 20;
let totalPages = 1;
let totalUsers = 0;
let users = [];
let selectedUsers = new Set();
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
        await loadUsers();
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Ошибка инициализации: ' + error.message, 'error');
    }
}

// === LOAD USERS ===
async function loadUsers() {
    try {
        const container = document.getElementById('usersContainer');
        container.innerHTML = '<div class="loading">Загрузка пользователей...</div>';
        
        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            sort_by: sortBy,
            sort_order: sortOrder
        });
        
        // Add filters
        if (currentFilters.role && currentFilters.role !== 'all') {
            params.append('role', currentFilters.role);
        }
        if (currentFilters.min_balance) {
            params.append('min_balance', currentFilters.min_balance);
        }
        if (currentFilters.max_balance) {
            params.append('max_balance', currentFilters.max_balance);
        }
        
        const response = await apiRequest(`/api/v1/admin/users/all?${params.toString()}`);
        
        users = response.users;
        totalUsers = response.total;
        totalPages = response.total_pages;
        
        renderUsers();
        renderPagination();
        updatePaginationInfo();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Ошибка загрузки пользователей: ' + error.message, 'error');
        document.getElementById('usersContainer').innerHTML = `
            <div class="no-users">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// === RENDER USERS ===
function renderUsers() {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="no-users">
                <h3>Пользователи не найдены</h3>
                <p>Попробуйте изменить фильтры</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="users-grid">
            ${users.map(user => renderUserCard(user)).join('')}
        </div>
    `;
}

// === RENDER USER CARD ===
function renderUserCard(user) {
    const avatarUrl = user.profile_picture || 'https://via.placeholder.com/80?text=User';
    
    const roleBadge = user.account_type === 'admin'
        ? '<span class="badge admin">👑 Администратор</span>' 
        : '<span class="badge user">👤 Пользователь</span>';
    
    const isChecked = selectedUsers.has(user.id) ? 'checked' : '';
    
    // Display name or username or email
    const displayName = user.name || user.username || user.email;
    
    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-checkbox">
                <input type="checkbox" ${isChecked} onchange="toggleUserSelection(${user.id})">
            </div>
            <img src="${avatarUrl}" alt="${displayName}" class="user-avatar" onerror="this.src='https://via.placeholder.com/80?text=User'">
            <div class="user-info">
                <div class="user-name">${displayName}</div>
                <div class="user-email">✉️ ${user.email}</div>
                <div class="user-balance">$${(user.balance || 0).toFixed(2)}</div>
                <div class="user-stats">
                    <div class="stat-item">🎨 Генераций: ${user.total_generations || 0}</div>
                    <div class="stat-item">🆓 Бесплатных: ${user.free_generations || 0}</div>
                    <div class="stat-item">👔 Примерок: ${user.free_try_ons || 0}</div>
                </div>
                <div class="user-badges">
                    ${roleBadge}
                </div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                    Зарегистрирован: ${new Date(user.created_at).toLocaleDateString('ru-RU')}
                </div>
            </div>
            <div class="user-actions">
                ${user.account_type !== 'admin' ? `
                    <button class="action-btn role" onclick="changeRole(${user.id}, 'admin')">👑 Сделать админом</button>
                ` : `
                    <button class="action-btn role" onclick="changeRole(${user.id}, 'user')">👤 Убрать админа</button>
                `}
                <button class="action-btn delete" onclick="deleteUser(${user.id})">🗑️ Удалить</button>
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
    const end = Math.min(currentPage * perPage, totalUsers);
    const info = `Показано ${start}-${end} из ${totalUsers}`;
    
    document.getElementById('topPaginationInfo').textContent = info;
}

// === PAGINATION ===
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === SELECTION ===
function toggleUserSelection(userId) {
    if (selectedUsers.has(userId)) {
        selectedUsers.delete(userId);
    } else {
        selectedUsers.add(userId);
    }
    updateSelectedCount();
}

function toggleSelectAll() {
    const checkbox = document.getElementById('selectAll');
    if (checkbox.checked) {
        users.forEach(u => selectedUsers.add(u.id));
    } else {
        selectedUsers.clear();
    }
    updateSelectedCount();
    renderUsers();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `${selectedUsers.size} выбрано`;
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
    const role = document.getElementById('filterRole').value;
    const minBalance = document.getElementById('filterMinBalance').value;
    const maxBalance = document.getElementById('filterMaxBalance').value;
    
    currentFilters = {
        role,
        min_balance: minBalance || null,
        max_balance: maxBalance || null
    };
    
    currentPage = 1;
    loadUsers();
}

function resetFilters() {
    document.getElementById('filterRole').value = 'all';
    document.getElementById('filterMinBalance').value = '';
    document.getElementById('filterMaxBalance').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadUsers();
}

function applyQuickFilter(type) {
    // Remove active from all quick filters
    document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'admins') {
        document.getElementById('filterRole').value = 'admin';
        currentFilters.role = 'admin';
    } else if (type === 'top-balance') {
        sortBy = 'balance';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'balance';
    } else if (type === 'active') {
        // Would need backend support for filtering by activity
        sortBy = 'created_at';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'created_at';
    } else if (type === 'recent') {
        sortBy = 'created_at';
        sortOrder = 'desc';
        document.getElementById('sortBy').value = 'created_at';
    }
    
    // Mark clicked button as active
    event.target.classList.add('active');
    
    currentPage = 1;
    loadUsers();
}

// === SORTING ===
function applySort() {
    sortBy = document.getElementById('sortBy').value;
    loadUsers();
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    document.getElementById('sortOrderBtn').textContent = sortOrder === 'desc' ? '↓' : '↑';
    loadUsers();
}

// === CHANGE ROLE ===
async function changeRole(userId, newRole) {
    const action = newRole === 'admin' ? 'назначить администратором' : 'снять права администратора';
    if (!confirm(`Вы уверены что хотите ${action} этого пользователя?`)) return;
    
    try {
        await apiRequest(`/api/v1/admin/users/${userId}/role`, 'PUT', { role: newRole });
        showAlert(`Роль изменена на ${newRole}`, 'success');
        loadUsers();
    } catch (error) {
        showAlert('Ошибка изменения роли: ' + error.message, 'error');
    }
}

// === DELETE USER ===
async function deleteUser(userId) {
    if (!confirm('Вы уверены что хотите удалить этого пользователя?')) return;
    
    try {
        await apiRequest(`/api/v1/admin/users/${userId}`, 'DELETE');
        showAlert('Пользователь удален', 'success');
        loadUsers();
    } catch (error) {
        showAlert('Ошибка удаления: ' + error.message, 'error');
    }
}

// === BULK ACTIONS ===
async function bulkAction(action) {
    if (selectedUsers.size === 0) {
        showAlert('Выберите пользователей', 'error');
        return;
    }
    
    const userIds = Array.from(selectedUsers);
    
    if (action === 'delete' && !confirm(`Вы уверены что хотите удалить ${userIds.length} пользователей?`)) {
        return;
    }
    
    try {
        // Delete users one by one (if no bulk endpoint exists)
        for (const userId of userIds) {
            await apiRequest(`/api/v1/admin/users/${userId}`, 'DELETE');
        }
        
        showAlert(`Удалено ${userIds.length} пользователей`, 'success');
        selectedUsers.clear();
        updateSelectedCount();
        loadUsers();
    } catch (error) {
        showAlert('Ошибка массового действия: ' + error.message, 'error');
    }
}

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', init);
