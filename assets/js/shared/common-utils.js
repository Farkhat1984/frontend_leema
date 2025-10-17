const CommonUtils = {
    // Инициализация platform (вызывать перед любыми API запросами)
    ensurePlatform() {
        if (!localStorage.getItem('platform')) {
            const platform = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'web';
            localStorage.setItem('platform', platform);
        }
    },

    logout() {
        if (window.wsManager) {
            window.wsManager.disconnect();
        }
        // Используем AuthService если доступен
        if (window.AuthService) {
            window.AuthService.logout();
        } else {
            localStorage.clear();
            window.location.href = `${window.location.origin}/public/index.html`;
        }
    },

    async apiRequest(endpoint, method = 'GET', body = null, useCache = false, retryOnAuth = true) {
        // Убедиться что platform установлен
        this.ensurePlatform();
        
        if (useCache && method === 'GET' && typeof window.apiCache !== 'undefined') {
            const cacheKey = `${endpoint}`;
            const cached = window.apiCache.get(cacheKey);
            if (cached) return cached;
        }

        const currentToken = localStorage.getItem('token');
        const platform = localStorage.getItem('platform') || 'web';
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                'X-Client-Platform': platform
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        let response = await fetch(`${API_URL}${endpoint}`, options);

        // Если 401 и разрешен retry - пробуем обновить токен
        if (response.status === 401 && retryOnAuth && window.AuthService) {
            try {
                console.log('[API] Token expired, refreshing...');
                await window.AuthService.refreshAccessToken();
                
                // Обновляем токен в headers и повторяем запрос
                const newToken = localStorage.getItem('token');
                options.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(`${API_URL}${endpoint}`, options);
            } catch (error) {
                console.error('[API] Token refresh failed:', error);
                // Logout будет вызван в AuthService.refreshAccessToken()
                throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Ошибка запроса' }));
            throw new Error(error.detail || 'Ошибка запроса');
        }

        const data = await response.json();
        
        if (useCache && method === 'GET' && typeof window.apiCache !== 'undefined') {
            const cacheKey = `${endpoint}`;
            window.apiCache.set(cacheKey, data);
        }

        return data;
    },

    formatImageUrl(imageUrl) {
        if (!imageUrl) return null;

        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }

        if (imageUrl.startsWith('/')) {
            return `${API_URL}${imageUrl}`;
        }

        return `${API_URL}/${imageUrl}`;
    },

    showAlert(message, type = 'success', container = 'alertContainer') {
        const alertContainer = document.getElementById(container);
        if (!alertContainer) {
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
    },

    initWebSocket(accountType, eventHandlers = {}) {
        const token = localStorage.getItem('token');
        if (!window.wsManager || !token) return;

        if (window.wsManager.ws && window.wsManager.ws.readyState !== WebSocket.CLOSED) {
            window.wsManager.disconnect();
        }

        window.wsManager.connect(token, accountType);

        if (window.wsManager.eventHandlers) {
            Object.keys(window.wsManager.eventHandlers).forEach(key => {
                window.wsManager.eventHandlers[key] = [];
            });
        } else {
            window.wsManager.eventHandlers = {};
        }

        Object.keys(eventHandlers).forEach(eventName => {
            window.wsManager.on(eventName, (data) => {
                if (window.notificationManager) {
                    window.notificationManager.handleWebSocketEvent(data);
                }
                if (eventHandlers[eventName]) {
                    eventHandlers[eventName](data);
                }
            });
        });

        window.wsManager.onConnectionStateChange((state) => {
            this.updateConnectionStatus(state);
        });

        this.addConnectionStatusIndicator();
    },

    addConnectionStatusIndicator() {
        const header = document.querySelector('.header .user-info');
        if (!header) return;

        let indicator = document.getElementById('wsConnectionStatus');
        if (indicator) return;

        indicator = document.createElement('div');
        indicator.id = 'wsConnectionStatus';
        indicator.className = 'ws-status';
        indicator.title = 'WebSocket статус';

        header.insertBefore(indicator, header.firstChild);
        this.updateConnectionStatus(window.wsManager.getConnectionState());
    },

    updateConnectionStatus(state) {
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
};

window.CommonUtils = CommonUtils;
window.logout = CommonUtils.logout.bind(CommonUtils);
window.apiRequest = CommonUtils.apiRequest.bind(CommonUtils);
window.formatImageUrl = CommonUtils.formatImageUrl.bind(CommonUtils);
window.showAlert = CommonUtils.showAlert.bind(CommonUtils);
