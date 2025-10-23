/**
 * WebSocket Manager для Fashion AI Platform
 */

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.token = null;
        this.clientType = null;
        this.reconnectDelay = 5000;
        this.maxReconnectDelay = 60000;
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        this.isConnecting = false;
        this.isManualClose = false;
        this.eventHandlers = {};
        this.connectionStateCallbacks = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.handleOpen = this.handleOpen.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * @param {string} token - JWT токен
     * @param {string} clientType - Тип клиента: user, shop, admin
     */
    connect(token, clientType) {
        if (this.isConnecting) {
            return;
        }
        
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        if (!token || !clientType) {
            return;
        }

        this.token = token;
        this.clientType = clientType;
        this.isManualClose = false;
        this.isConnecting = true;

        const wsUrl = this.getWebSocketUrl();
        const platform = localStorage.getItem('platform') || 'web';

        try {
            this.ws = new WebSocket(`${wsUrl}?token=${token}&client_type=${clientType}&platform=${platform}`);

            this.ws.onopen = this.handleOpen;
            this.ws.onmessage = this.handleMessage;
            this.ws.onclose = this.handleClose;
            this.ws.onerror = this.handleError;
        } catch (error) {
            console.error('[WebSocket] Connection failed:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    getWebSocketUrl() {
        if (typeof WS_URL !== 'undefined' && WS_URL) {
            return WS_URL;
        }
        
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:8000';
        
        if (apiUrl.startsWith('https://')) {
            return apiUrl.replace('https://', 'wss://') + '/ws';
        } else if (apiUrl.startsWith('http://')) {
            return apiUrl.replace('http://', 'ws://') + '/ws';
        } else {
            return 'ws://localhost:8000/ws';
        }
    }

    handleOpen() {
        this.isConnecting = false;
        this.reconnectDelay = 5000;
        this.reconnectAttempts = 0;

        this.notifyConnectionState('connected');

        this.startHeartbeat();
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.event === 'connected') {
                return;
            }

            if (data.type === 'pong') {
                return;
            }

            if (data.type === 'subscribed' || data.type === 'unsubscribed') {
                return;
            }

            if (data.event) {
                this.handleEvent(data);
            }
        } catch (error) {
        }
    }

    handleClose(event) {
        this.isConnecting = false;

        this.stopHeartbeat();

        this.notifyConnectionState('disconnected');

        // Не пытаемся переподключиться если:
        // 1. Закрытие вручную
        // 2. Код ошибки указывает на проблему авторизации или конфигурации (1008, 1002, 1003)
        if (!this.isManualClose && ![1008, 1002, 1003].includes(event.code)) {
            this.scheduleReconnect();
        } else if ([1008, 1002, 1003].includes(event.code)) {
        } else if (this.isManualClose) {
        }
    }

    handleError(error) {
        // Suppress console error spam for connection issues
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.warn('[WebSocket] Connection error, will retry');
        }
        this.notifyConnectionState('error');
    }

    scheduleReconnect() {
        if (this.isManualClose || this.reconnectTimeout) {
            return;
        }

        // Stop reconnecting after max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('[WebSocket] Max reconnection attempts reached. Stopping reconnect.');
            this.notifyConnectionState('disconnected');
            return;
        }

        this.reconnectAttempts++;
        this.notifyConnectionState('reconnecting');

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect(this.token, this.clientType);

            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
        }, this.reconnectDelay);
    }

    /**
     * Запустить heartbeat (ping/pong)
     */
    startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, 30000);
    }

    /**
     * Остановить heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    subscribeRoom(room) {
        this.send({
            type: 'subscribe_room',
            room: room
        });
    }

    unsubscribeRoom(room) {
        this.send({
            type: 'unsubscribe_room',
            room: room
        });
    }

    /**
     * @param {string} eventType - Тип события
     * @param {function} handler - Функция-обработчик
     */
    on(eventType, handler) {
        if (!this.eventHandlers[eventType]) {
            this.eventHandlers[eventType] = [];
        }
        this.eventHandlers[eventType].push(handler);
    }

    off(eventType, handler) {
        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler);
        }
    }

    handleEvent(data) {
        const eventType = data.event;

        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                }
            });
        }

        if (this.eventHandlers['*']) {
            this.eventHandlers['*'].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                }
            });
        }
    }

    onConnectionStateChange(callback) {
        this.connectionStateCallbacks.push(callback);
    }

    notifyConnectionState(state) {
        this.connectionStateCallbacks.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
            }
        });
    }

    getConnectionState() {
        if (!this.ws) return 'disconnected';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSING:
                return 'disconnecting';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    disconnect() {
        this.isManualClose = true;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.notifyConnectionState('disconnected');
    }

    reconnect() {
        this.disconnect();
        this.isManualClose = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 5000;

        setTimeout(() => {
            if (this.token && this.clientType) {
                this.connect(this.token, this.clientType);
            }
        }, 1000);
    }
}

window.wsManager = new WebSocketManager();
