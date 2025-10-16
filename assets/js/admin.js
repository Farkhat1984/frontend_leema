console.log('admin.js LOADED');

let token = localStorage.getItem('token');
let accountType = localStorage.getItem('accountType');

// Проверка авторизации при загрузке
window.onload = async function () {
    console.log('Loading admin page...');
    console.log('Token:', token);
    console.log('AccountType:', accountType);

    if (token && accountType === 'admin') {
        console.log('Admin is authenticated, loading dashboard...');
        await loadAdminDashboard();
    } else if (token && accountType === 'shop') {
        console.log('Shop account detected, redirecting...');
        window.location.href = `${window.location.origin}/index.html`;
    } else if (token && accountType === 'user') {
        console.log('User account detected, redirecting...');
        window.location.href = `${window.location.origin}/user.html`;
    } else {
        console.log('Not authorized as admin, showing login page...');
        document.getElementById('loginPage').style.display = 'flex';
    }
};

// Вход через Google для админа
async function loginWithGoogle() {
    try {
        // Admin авторизация идет через user account_type
        // Роль admin назначается на бэкенде по email
        const params = new URLSearchParams({
            account_type: 'user',
            platform: 'web'
        });
        const response = await fetch(`${API_URL}/api/v1/auth/google/url?${params.toString()}`);
        const data = await response.json();

        // Перенаправляем на Google OAuth
        localStorage.setItem('requestedAccountType', 'user');
        window.location.href = data.authorization_url;
    } catch (error) {
        alert('Ошибка при получении URL авторизации: ' + error.message);
    }
}

// Выход
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('accountType');
    localStorage.removeItem('refresh_token');
    token = null;
    accountType = null;
    window.location.href = `${window.location.origin}/index.html`;
}

// API запрос
async function apiRequest(endpoint, method = 'GET', body = null) {
    const currentToken = localStorage.getItem('token');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка запроса');
    }

    return await response.json();
}

// Helper function to format image URL
function formatImageUrl(imageUrl) {
    console.log('🔍 formatImageUrl called with:', imageUrl);

    if (!imageUrl) return null;

    // If it's already a full URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('✅ Image URL is already full URL:', imageUrl);
        return imageUrl;
    }

    // If it starts with /, it's a path from root
    if (imageUrl.startsWith('/')) {
        const fullUrl = `${API_URL}${imageUrl}`;
        console.log('✅ Added API_URL to path:', fullUrl);
        return fullUrl;
    }

    // Otherwise, add both API_URL and /
    const fullUrl = `${API_URL}/${imageUrl}`;
    console.log('✅ Added API_URL and / to filename:', fullUrl);
    return fullUrl;
}

// Показать уведомление
function showAlert(message, type = 'success', container = 'adminAlertContainer') {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) {
        console.warn(`Alert container '${container}' not found. Message: ${message}`);
        return;
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// === ПАНЕЛЬ АДМИНИСТРАТОРА ===

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
        // Инициализация WebSocket для админа
        initAdminWebSocket();
        
        const dashboard = await apiRequest('/api/v1/admin/dashboard');
        
        // Безопасное обновление элементов (проверка на существование)
        const totalUsers = document.getElementById('adminTotalUsers');
        if (totalUsers) totalUsers.textContent = dashboard.total_users;
        
        const totalShops = document.getElementById('adminTotalShops');
        if (totalShops) totalShops.textContent = dashboard.total_shops;
        
        const totalProducts = document.getElementById('adminTotalProducts');
        if (totalProducts) totalProducts.textContent = dashboard.total_products;
        
        const pendingModeration = document.getElementById('adminPendingModeration');
        if (pendingModeration) pendingModeration.textContent = dashboard.pending_moderation;
        
        // Финансы платформы
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
        if (!container) return; // Элемент не существует на этой странице
        
        const users = await apiRequest('/api/v1/admin/users');

        if (users.length === 0) {
            container.innerHTML = '<p style="color: #999;">Пользователей нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Email</th>
                        <th style="padding: 10px; text-align: left;">Имя</th>
                        <th style="padding: 10px; text-align: right;">Баланс</th>
                        <th style="padding: 10px; text-align: center;">Бесплатно генераций</th>
                        <th style="padding: 10px; text-align: center;">Бесплатно примерок</th>
                        <th style="padding: 10px; text-align: left;">Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => {
            const date = new Date(user.created_at).toLocaleDateString('ru-RU');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px;">${user.email}</td>
                                <td style="padding: 10px;">${user.name || 'N/A'}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: #667eea;">
                                    $${user.balance.toFixed(2)}
                                </td>
                                <td style="padding: 10px; text-align: center;">${user.free_generations}</td>
                                <td style="padding: 10px; text-align: center;">${user.free_try_ons}</td>
                                <td style="padding: 10px;">${date}</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

async function loadShopsList() {
    try {
        const container = document.getElementById('shopsList');
        if (!container) return; // Элемент не существует на этой странице
        
        const shops = await apiRequest('/api/v1/admin/shops');

        if (shops.length === 0) {
            container.innerHTML = '<p style="color: #999;">Магазинов нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Название</th>
                        <th style="padding: 10px; text-align: left;">Email</th>
                        <th style="padding: 10px; text-align: right;">Баланс</th>
                        <th style="padding: 10px; text-align: left;">Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    ${shops.map(shop => {
            const date = new Date(shop.created_at).toLocaleDateString('ru-RU');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px; font-weight: 600;">${shop.shop_name}</td>
                                <td style="padding: 10px;">${shop.email}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: #10b981;">
                                    $${shop.balance.toFixed(2)}
                                </td>
                                <td style="padding: 10px;">${date}</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка загрузки магазинов:', error);
    }
}

async function loadModerationQueue() {
    try {
        const container = document.getElementById('moderationQueue');
        if (!container) return; // Элемент не существует на этой странице
        
        const products = await apiRequest('/api/v1/admin/moderation/queue');

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет товаров на модерации</p></div>';
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
                <div class="product-card">
                    <!-- Секция 1: Изображение -->
                    <div class="product-image">
                        ${imageUrl
                    ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div style=&quot;color: #999; padding: 40px; text-align: center;&quot;>Ошибка загрузки</div>'">`
                    : '<div style="color: #999; padding: 40px; text-align: center;">Нет изображения</div>'}
                    </div>
                    
                    <!-- Секция 2: Информация о товаре -->
                    <div class="product-info">
                        <div class="product-header">
                            <div class="product-name">${product.name || 'Без названия'}</div>
                        </div>
                        
                        <div class="product-price-container">
                            <span class="product-price-label">Цена</span>
                            <div class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                        </div>
                        
                        <div class="product-details">
                            <div class="product-detail-row">
                                <span class="product-detail-label">Описание</span>
                                <div class="product-detail-value product-description">
                                    ${product.description || 'Нет описания'}
                                </div>
                            </div>
                            
                            <div class="product-detail-row">
                                <span class="product-detail-label">Магазин</span>
                                <div class="product-detail-value product-shop-name">
                                    ${product.shop_name || 'Неизвестно'}
                                </div>
                            </div>
                            
                            <div class="product-detail-row">
                                <span class="product-detail-label">Дата добавления</span>
                                <div class="product-detail-value product-date">
                                    ${createdDate}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Секция 3: Статус -->
                    <div class="product-status-section">
                        <span class="product-status ${product.status === 'approved' ? 'status-approved' : product.status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                            ${product.status === 'approved' ? 'Одобрен' : product.status === 'rejected' ? 'Отклонен' : 'На рассмотрении'}
                        </span>
                    </div>
                    
                    <!-- Секция 4: Действия -->
                    <div class="product-actions">
                        <button class="btn btn-success" onclick="moderateProduct(${product.id}, 'approve')">
                            Одобрить
                        </button>
                        <button class="btn btn-danger" onclick="moderateProduct(${product.id}, 'reject')">
                            Отклонить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки очереди:', error);
    }
}

async function moderateProduct(productId, action) {
    try {
        let notes = null;

        if (action === 'reject') {
            notes = prompt('Укажите причину отклонения товара:');
            if (!notes || notes.trim().length === 0) {
                showAlert('Необходимо указать причину отклонения', 'error', 'adminAlertContainer');
                return;
            }
        }

        const endpoint = action === 'approve'
            ? `/api/v1/admin/moderation/${productId}/approve`
            : `/api/v1/admin/moderation/${productId}/reject`;

        await apiRequest(endpoint, 'POST', { action, notes });
        showAlert(`Товар успешно ${action === 'approve' ? 'одобрен' : 'отклонен'}`, 'success', 'adminAlertContainer');
        
        // Перезагружаем список товаров
        await loadModerationQueue();
        await loadAdminDashboard();
    } catch (error) {
        showAlert('Ошибка модерации: ' + error.message, 'error', 'adminAlertContainer');
    }
}

async function loadRefunds() {
    try {
        const statusFilter = document.getElementById('refundStatusFilter');
        if (!statusFilter) return; // Элемент не существует на этой странице
        
        const status = statusFilter.value;
        const refunds = await apiRequest(`/api/v1/admin/refunds${status ? '?status=' + status : ''}`);
        const container = document.getElementById('refundsList');
        
        if (!container) return;

        if (refunds.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет запросов на возврат</p></div>';
            return;
        }

        container.innerHTML = refunds.map(refund => `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <p><strong>ID:</strong> ${refund.id}</p>
                <p><strong>Причина:</strong> ${refund.reason}</p>
                <p><strong>Статус:</strong> ${refund.status}</p>
                ${refund.status === 'pending' ? `
                    <div style="margin-top: 10px;">
                        <button class="btn btn-success" onclick="processRefund(${refund.id}, 'approve')">Одобрить</button>
                        <button class="btn btn-danger" onclick="processRefund(${refund.id}, 'reject')">Отклонить</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки возвратов:', error);
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
        if (!container) return; // Элемент не существует на этой странице
        
        const settings = await apiRequest('/api/v1/admin/settings');

        container.innerHTML = settings.map(setting => `
            <div class="form-group" id="setting_group_${setting.key}">
                <label>${setting.description || setting.key}</label>
                <input type="text" value="${setting.value}" id="setting_${setting.key}">
                <button class="btn btn-primary" onclick="updateSetting('${setting.key}')">Сохранить</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

async function updateSetting(key) {
    try {
        const value = document.getElementById(`setting_${key}`).value;
        await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
        showAlert('Настройка обновлена', 'success', 'adminAlertContainer');
    } catch (error) {
        showAlert('Ошибка обновления настройки: ' + error.message, 'error', 'adminAlertContainer');
    }
}


// === WEBSOCKET INTEGRATION ===

let wsInitialized = false;

function initAdminWebSocket() {
    console.log('Initializing WebSocket for admin...');

    if (wsInitialized) {
        console.log('WebSocket already initialized, skipping...');
        return;
    }

    if (window.wsManager && token) {
        if (window.wsManager.ws && window.wsManager.ws.readyState !== WebSocket.CLOSED) {
            console.log('Disconnecting existing WebSocket connection...');
            window.wsManager.disconnect();
        }

        window.wsManager.connect(token, 'admin');
        setupAdminWebSocketHandlers();
        addAdminConnectionStatusIndicator();

        wsInitialized = true;
        console.log('WebSocket initialized successfully');
    } else {
        console.error('WebSocket manager or token not found');
    }
}

function setupAdminWebSocketHandlers() {
    console.log('Setting up WebSocket event handlers for admin...');
    
    if (window.wsManager.eventHandlers) {
        Object.keys(window.wsManager.eventHandlers).forEach(key => {
            window.wsManager.eventHandlers[key] = [];
        });
    } else {
        window.wsManager.eventHandlers = {};
    }
    
    window.wsManager.on('moderation.queue_updated', (data) => {
        console.log('Moderation queue updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        const pendingElement = document.getElementById('adminPendingModeration');
        if (pendingElement && data.data && data.data.pending_count !== undefined) {
            pendingElement.textContent = data.data.pending_count;
        }
    });

    window.wsManager.on('product.created', (data) => {
        console.log('Product created (admin view):', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.on('settings.updated', (data) => {
        console.log('Settings updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    window.wsManager.on('balance.updated', (data) => {
        console.log('Balance updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.on('transaction.completed', (data) => {
        console.log('Transaction completed:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        loadAdminDashboard();
    });

    window.wsManager.onConnectionStateChange((state) => {
        updateAdminConnectionStatus(state);
    });
    
    console.log('WebSocket event handlers registered');
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
    console.log('Disconnecting WebSocket on logout...');
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalAdminLogout();
};

// Make functions globally accessible for inline onclick handlers
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.moderateProduct = moderateProduct;
window.processRefund = processRefund;
window.updateSetting = updateSetting;
window.switchAdminTab = switchAdminTab;
