// Общий функционал для всех админ страниц
console.log('admin-common.js loaded');

let token = localStorage.getItem('token');
let accountType = localStorage.getItem('accountType');

// Проверка авторизации при загрузке
window.onload = async function () {
    console.log('Loading admin page...');
    console.log('Token:', token);
    console.log('AccountType:', accountType);

    if (!token || accountType !== 'admin') {
        console.log('Not authorized as admin, redirecting to login...');
        window.location.href = 'admin/index.html';
        return;
    }

    // Инициализация WebSocket
    initAdminWebSocket();

    // Вызов специфичной для страницы функции загрузки
    if (typeof loadPageData === 'function') {
        await loadPageData();
    }
};

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
    if (!imageUrl) return null;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
        return `${API_URL}${imageUrl}`;
    }

    return `${API_URL}/${imageUrl}`;
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
    
    // Moderation Events
    window.wsManager.on('moderation.queue_updated', (data) => {
        console.log('Moderation queue updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        if (typeof onModerationUpdate === 'function') {
            onModerationUpdate(data);
        }
    });

    // Product Events
    window.wsManager.on('product.created', (data) => {
        console.log('Product created (admin view):', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        if (typeof onProductUpdate === 'function') {
            onProductUpdate(data);
        }
    });

    // Settings Events
    window.wsManager.on('settings.updated', (data) => {
        console.log('Settings updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        if (typeof onSettingsUpdate === 'function') {
            onSettingsUpdate(data);
        }
    });

    // Balance Events
    window.wsManager.on('balance.updated', (data) => {
        console.log('Balance updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        if (typeof onBalanceUpdate === 'function') {
            onBalanceUpdate(data);
        }
    });

    // Transaction Events
    window.wsManager.on('transaction.completed', (data) => {
        console.log('Transaction completed:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }

        if (typeof onTransactionUpdate === 'function') {
            onTransactionUpdate(data);
        }
    });

    // Connection state change
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

// Disconnect WebSocket on logout
const originalAdminLogout = logout;
logout = function() {
    console.log('Disconnecting WebSocket on logout...');
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalAdminLogout();
};

// Make functions globally accessible
window.logout = logout;
