// Страница управления магазинами

// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

let currentFilter = 'all';

async function loadPageData() {
    try {
        // Initialize WebSocket for admin
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'balance.updated': (data) => {
                    console.log('[Admin Shops] Received balance.updated event:', data);
                    // Reload shop stats and list when balance is updated
                    loadShopsStats();
                    loadShopsList();
                },
                'transaction.completed': (data) => {
                    console.log('[Admin Shops] Received transaction.completed event:', data);
                    // Reload when transaction is completed
                    loadShopsStats();
                    loadShopsList();
                }
            });
        }
        
        await loadShopsStats();
        await loadShopsList();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadShopsStats() {
    try {
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        const totalShopsEl = document.getElementById('totalShops');
        const totalShopBalanceEl = document.getElementById('totalShopBalance');
        const activeShopsEl = document.getElementById('activeShops');
        const pendingShopsEl = document.getElementById('pendingShops');
        
        if (totalShopsEl) totalShopsEl.textContent = dashboard.total_shops;
        if (totalShopBalanceEl) totalShopBalanceEl.textContent = `$${dashboard.total_shop_balances.toFixed(2)}`;
        
        // Get actual stats from shops list
        const response = await apiRequest('/api/v1/admin/shops/all');
        const shops = response.shops || [];
        const activeCount = shops.filter(s => s.is_active && s.is_approved).length;
        const pendingCount = shops.filter(s => !s.is_approved).length;
        
        if (activeShopsEl) activeShopsEl.textContent = activeCount;
        if (pendingShopsEl) pendingShopsEl.textContent = pendingCount;
    } catch (error) {
    }
}

function filterShops(filter) {
    currentFilter = filter;
    
    // Update button states
    const buttons = ['filterAll', 'filterPending', 'filterApproved', 'filterActive'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            if ((filter === 'all' && btnId === 'filterAll') ||
                (filter === 'pending' && btnId === 'filterPending') ||
                (filter === 'approved' && btnId === 'filterApproved') ||
                (filter === 'active' && btnId === 'filterActive')) {
                btn.className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white';
            } else {
                btn.className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
            }
        }
    });
    
    loadShopsList();
}

async function loadShopsList() {
    try {
        const response = await apiRequest('/api/v1/admin/shops/all');
        let shops = response.shops || [];
        const container = document.getElementById('shopsList');

        // Apply filter
        if (currentFilter === 'pending') {
            shops = shops.filter(s => !s.is_approved);
        } else if (currentFilter === 'approved') {
            shops = shops.filter(s => s.is_approved);
        } else if (currentFilter === 'active') {
            shops = shops.filter(s => s.is_active && s.is_approved);
        }

        if (shops.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Магазинов нет</p>';
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="border-b-2 border-gray-200 bg-gray-50">
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Название</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Баланс</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Статус одобрения</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Активность</th>
                            <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shops.map(shop => {
            const date = new Date(shop.created_at).toLocaleDateString('ru-RU');
            const approvalStatus = shop.is_approved 
                ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Одобрен</span>'
                : '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Ожидает</span>';
            const activeStatus = shop.is_active
                ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Активен</span>'
                : '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Неактивен</span>';
            
            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3">
                        <div class="font-semibold text-gray-900">${shop.shop_name}</div>
                        <div class="text-xs text-gray-500">${date}</div>
                    </td>
                    <td class="px-4 py-3 text-gray-600">${shop.email}</td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-semibold text-green-600">$${shop.balance.toFixed(2)}</span>
                    </td>
                    <td class="px-4 py-3 text-center">${approvalStatus}</td>
                    <td class="px-4 py-3 text-center">${activeStatus}</td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            ${!shop.is_approved ? `
                                <button onclick="approveShop(${shop.id})" 
                                    class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors">
                                    <i class="fas fa-check mr-1"></i>Одобрить
                                </button>
                                <button onclick="rejectShop(${shop.id})" 
                                    class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors">
                                    <i class="fas fa-times mr-1"></i>Отклонить
                                </button>
                            ` : `
                                <button onclick="toggleShopStatus(${shop.id}, ${shop.is_active})" 
                                    class="px-3 py-1 ${shop.is_active ? 'bg-gray-600' : 'bg-blue-600'} text-white rounded hover:opacity-80 text-sm transition-colors">
                                    <i class="fas fa-${shop.is_active ? 'ban' : 'check'} mr-1"></i>
                                    ${shop.is_active ? 'Деактивировать' : 'Активировать'}
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showAlert('Ошибка загрузки списка магазинов: ' + error.message, 'error');
    }
}

async function approveShop(shopId) {
    if (!confirm('Вы уверены, что хотите одобрить этот магазин?')) {
        return;
    }
    
    try {
        await apiRequest(`/api/v1/admin/shops/${shopId}/approve`, 'POST', 
            JSON.stringify({ notes: 'Одобрено администратором' })
        );
        
        showAlert('Магазин успешно одобрен', 'success');
        await loadShopsStats();
        await loadShopsList();
    } catch (error) {
        showAlert('Ошибка при одобрении магазина: ' + error.message, 'error');
    }
}

async function rejectShop(shopId) {
    const reason = prompt('Укажите причину отклонения (минимум 10 символов):');
    if (!reason || reason.length < 10) {
        showAlert('Причина отклонения должна содержать минимум 10 символов', 'error');
        return;
    }
    
    try {
        await apiRequest(`/api/v1/admin/shops/${shopId}/reject`, 'POST', 
            JSON.stringify({ reason })
        );
        
        showAlert('Магазин отклонен', 'success');
        await loadShopsStats();
        await loadShopsList();
    } catch (error) {
        showAlert('Ошибка при отклонении магазина: ' + error.message, 'error');
    }
}

async function toggleShopStatus(shopId, currentStatus) {
    const action = currentStatus ? 'заблокировать' : 'активировать';
    const actionText = currentStatus ? 'деактивирован' : 'активирован';
    
    if (!confirm(`Вы уверены, что хотите ${action} этот магазин?`)) {
        return;
    }
    
    try {
        // Use bulk action: 'block' to deactivate, 'approve' to activate
        await apiRequest('/api/v1/admin/shops/bulk-action', 'POST',
            JSON.stringify({
                shop_ids: [shopId],
                action: currentStatus ? 'block' : 'approve'
            })
        );
        
        showAlert(`Магазин успешно ${actionText}`, 'success');
        await loadShopsStats();
        await loadShopsList();
    } catch (error) {
        showAlert('Ошибка при изменении статуса магазина: ' + error.message, 'error');
    }
}

// Автоматическая загрузка данных при инициализации страницы
loadPageData();
