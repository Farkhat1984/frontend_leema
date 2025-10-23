const token = localStorage.getItem('token');
const accountType = localStorage.getItem('accountType');
let wsInitialized = false;

window.onload = async function () {
    if (token && accountType === 'admin') {
        await loadAdminDashboard();
    } else if (token && accountType === 'shop') {
        Router.navigate(Router.paths.shop.dashboard, true);
    } else if (token && accountType === 'user') {
        Router.navigate(Router.paths.user.dashboard, true);
    } else {
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
    }
};

async function loginWithGoogle() {
    try {

        const params = new URLSearchParams({
            account_type: 'user',
            platform: 'web'
        });
        const response = await fetch(`${API_URL}/api/v1/auth/google/url?${params.toString()}`);
        const data = await response.json();

        localStorage.setItem('requestedAccountType', 'user');
        window.location.href = data.authorization_url;
    } catch (error) {
        alert('Ошибка при получении URL авторизации: ' + error.message);
    }
}

function formatImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    return `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

async function loadAdminDashboard() {
    const loginPage = document.getElementById('loginPage');
    if (loginPage) {
        loginPage.style.display = 'none';
    }
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard) {
        adminDashboard.style.display = 'block';
    }

    try {
        CommonUtils.initWebSocket('admin', {
            'moderation.queue_updated': (data) => { if (typeof onModerationUpdate === 'function') onModerationUpdate(data); },
            'product.created': (data) => { if (typeof onProductUpdate === 'function') onProductUpdate(data); },
            'settings.updated': (data) => { if (typeof onSettingsUpdate === 'function') onSettingsUpdate(data); },
            'balance.updated': (data) => { if (typeof onBalanceUpdate === 'function') onBalanceUpdate(data); },
            'transaction.completed': (data) => { if (typeof onTransactionUpdate === 'function') onTransactionUpdate(data); }
        });
        
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        
        const totalUsers = document.getElementById('adminTotalUsers');
        if (totalUsers) totalUsers.textContent = dashboard.total_users || 0;
        
        const totalShops = document.getElementById('adminTotalShops');
        if (totalShops) totalShops.textContent = dashboard.total_shops || 0;
        
        const totalProducts = document.getElementById('adminTotalProducts');
        if (totalProducts) totalProducts.textContent = dashboard.total_products || 0;
        
        const totalOrders = document.getElementById('adminTotalOrders');
        if (totalOrders) totalOrders.textContent = dashboard.total_orders || 0;
        
        const pendingModeration = document.getElementById('adminPendingModeration');
        if (pendingModeration) pendingModeration.textContent = dashboard.pending_moderation || 0;
        
        const userBalances = document.getElementById('adminUserBalances');
        if (userBalances) userBalances.textContent = `$${(dashboard.total_user_balances || 0).toFixed(2)}`;
        
        const shopBalances = document.getElementById('adminShopBalances');
        if (shopBalances) shopBalances.textContent = `$${(dashboard.total_shop_balances || 0).toFixed(2)}`;
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error', 'adminAlertContainer');
    }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');

    if (tab === 'moderation') loadModerationQueue();
    if (tab === 'refunds') loadRefunds();
    if (tab === 'users') loadUsersList();
    if (tab === 'shops') loadShopsList();
    if (tab === 'settings') loadSettings();
}

async function loadUsersList() {
    try {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        const users = await apiRequest('/api/v1/admin/users');

        if (users.length === 0) {
            container.innerHTML = '<div class="p-4 text-gray-500 text-center">Пользователей нет</div>';
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Баланс</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Генерации</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Примерки</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(user => {
                const date = new Date(user.created_at).toLocaleDateString('ru-RU');
                return `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.name || 'N/A'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                                    $${user.balance.toFixed(2)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">${user.free_generations}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">${user.free_try_ons}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
                            </tr>
                        `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showAlert('Ошибка загрузки пользователей: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function loadShopsList() {
    try {
        const container = document.getElementById('shopsList');
        if (!container) return;
        
        const shops = await apiRequest('/api/v1/admin/shops');

        if (shops.length === 0) {
            container.innerHTML = '<div class="p-4 text-gray-500 text-center">Магазинов нет</div>';
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Баланс</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${shops.map(shop => {
                const date = new Date(shop.created_at).toLocaleDateString('ru-RU');
                return `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${shop.shop_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${shop.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                                    $${shop.balance.toFixed(2)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
                            </tr>
                        `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showAlert('Ошибка загрузки магазинов: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function loadModerationQueue() {
    try {
        const container = document.getElementById('moderationQueue');
        if (!container) return;
        
        const products = await apiRequest('/api/v1/admin/moderation/queue');

        if (products.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">Нет товаров на модерации</div>';
            return;
        }

        container.innerHTML = products.map(product => {
            const imageUrl = product.images && product.images.length > 0 ? formatImageUrl(product.images[0]) : null;
            const createdDate = new Date(product.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div class="aspect-square bg-gray-100">
                        ${imageUrl
                    ? `<img data-src="${imageUrl}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=&quot;flex items-center justify-center h-full text-gray-400&quot;>Ошибка загрузки</div>'">`
                    : '<div class="flex items-center justify-center h-full text-gray-400">Нет изображения</div>'}
                    </div>
                    
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">${product.name || 'Без названия'}</h3>
                        <div class="text-2xl font-bold text-purple-600 mb-4">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                        
                        <div class="space-y-3 mb-4">
                            <div>
                                <span class="text-xs font-medium text-gray-500 uppercase">Описание</span>
                                <p class="text-sm text-gray-700 mt-1 line-clamp-2">${product.description || 'Нет описания'}</p>
                            </div>
                            
                            <div>
                                <span class="text-xs font-medium text-gray-500 uppercase">Магазин</span>
                                <p class="text-sm font-medium text-gray-900 mt-1">${product.shop_name || 'Неизвестно'}</p>
                            </div>
                            
                            <div>
                                <span class="text-xs font-medium text-gray-500 uppercase">Дата добавления</span>
                                <p class="text-sm text-gray-700 mt-1">${createdDate}</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-3">
                            <button onclick="moderateProduct(${product.id}, 'approve')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                Одобрить
                            </button>
                            <button onclick="moderateProduct(${product.id}, 'reject')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                                Отклонить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (typeof window.lazyLoader !== 'undefined') {
            setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
        }
    } catch (error) {
        showAlert('Ошибка загрузки очереди модерации: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function moderateProduct(productId, action) {
    try {
        if (action === 'approve') {
            await apiRequest(`/api/v1/admin/moderation/${productId}/approve`, 'POST', { action: 'approve' });
        } else {
            await apiRequest(`/api/v1/admin/moderation/${productId}/reject`, 'POST', { notes: '' });
        }
        
        // Не показываем уведомление здесь - WebSocket отправит событие product.approved/rejected
        
        await loadModerationQueue();
        await loadAdminDashboard();
    } catch (error) {
        showAlert('Ошибка модерации: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function loadRefunds() {
    try {
        const statusFilter = document.getElementById('refundStatusFilter');
        if (!statusFilter) return;
        
        const status = statusFilter.value;
        const refunds = await apiRequest(`/api/v1/admin/refunds${status ? '?status=' + status : ''}`);
        const container = document.getElementById('refundsList');
        
        if (!container) return;

        if (refunds.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">Нет запросов на возврат</div>';
            return;
        }

        container.innerHTML = refunds.map(refund => `
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div class="space-y-3">
                    <div><span class="font-semibold text-gray-700">ID:</span> <span class="text-gray-900">${refund.id}</span></div>
                    <div><span class="font-semibold text-gray-700">Причина:</span> <span class="text-gray-900">${refund.reason}</span></div>
                    <div><span class="font-semibold text-gray-700">Статус:</span> <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : refund.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${refund.status}</span></div>
                </div>
                ${refund.status === 'pending' ? `
                    <div class="flex gap-3 mt-4">
                        <button onclick="processRefund(${refund.id}, 'approve')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Одобрить</button>
                        <button onclick="processRefund(${refund.id}, 'reject')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Отклонить</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки возвратов: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function processRefund(refundId, action) {
    try {
        await apiRequest(`/api/v1/admin/refunds/${refundId}/process`, 'POST', { action });
        showAlert(`Возврат ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success', 'adminAlertContainer');
        await loadRefunds();
    } catch (error) {
        showAlert('Ошибка обработки возврата: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function loadSettings() {
    try {
        const container = document.getElementById('settingsList');
        if (!container) return;
        
        const settings = await apiRequest('/api/v1/admin/settings');

        container.innerHTML = settings.map(setting => `
            <div class="bg-white border border-gray-200 rounded-lg p-6" id="setting_group_${setting.key}">
                <label class="block text-sm font-medium text-gray-700 mb-2">${setting.description || setting.key}</label>
                <div class="flex gap-3">
                    <input type="text" value="${setting.value}" id="setting_${setting.key}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <button onclick="updateSetting('${setting.key}')" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Сохранить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки настроек: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function updateSetting(key) {
    try {
        const value = document.getElementById(`setting_${key}`).value;
        await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
        // Не показываем уведомление здесь - WebSocket отправит событие settings.updated
    } catch (error) {
        showAlert('Ошибка обновления настройки: ' + error.message, 'error', 'adminAlertContainer');
    }
}

function initAdminWebSocket() {
    if (wsInitialized) return;

    if (window.wsManager && token) {
        if (window.wsManager.ws) {
            const state = window.wsManager.ws.readyState;
            if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
                return;
            }
        }

        window.wsManager.connect(token, 'admin');
        setupAdminWebSocketHandlers();
        addAdminConnectionStatusIndicator();
        wsInitialized = true;
    }
}

function setupAdminWebSocketHandlers() {
    if (window.wsManager.eventHandlers) {
        Object.keys(window.wsManager.eventHandlers).forEach(key => {
            window.wsManager.eventHandlers[key] = [];
        });
    } else {
        window.wsManager.eventHandlers = {};
    }
    
    window.wsManager.on('moderation.queue_updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        const pendingElement = document.getElementById('adminPendingModeration');
        if (pendingElement && data.data && data.data.pending_count !== undefined) {
            pendingElement.textContent = data.data.pending_count;
        }
    });

    window.wsManager.on('product.created', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.on('settings.updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    window.wsManager.on('balance.updated', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.on('transaction.completed', (data) => {
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.onConnectionStateChange((state) => {
        updateAdminConnectionStatus(state);
    });
}

function addAdminConnectionStatusIndicator() {
    const header = document.querySelector('.header .user-info');
    if (!header) return;

    const indicator = document.createElement('div');
    indicator.id = 'wsConnectionStatus';
    indicator.className = 'ws-status';
    indicator.title = 'WebSocket статус';

    header.insertBefore(indicator, header.firstChild);
    updateAdminConnectionStatus(window.wsManager.getConnectionState());
}

function updateAdminConnectionStatus(state) {
    const indicator = document.getElementById('wsConnectionStatus');
    if (!indicator) return;

    indicator.className = 'ws-status';

    switch (state) {
        case 'connected':
            indicator.classList.add('ws-status-connected');
            indicator.title = 'WebSocket подключен';
            break;
        case 'connecting':
        case 'reconnecting':
            indicator.classList.add('ws-status-connecting');
            indicator.title = 'WebSocket подключается...';
            break;
        case 'disconnected':
        case 'error':
            indicator.classList.add('ws-status-disconnected');
            indicator.title = 'WebSocket отключен';
            break;
    }
}

const originalAdminLogout = logout;
logout = function() {
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalAdminLogout();
};

window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.moderateProduct = moderateProduct;
window.processRefund = processRefund;
window.updateSetting = updateSetting;
window.switchAdminTab = switchAdminTab;
