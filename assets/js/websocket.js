/**
 * WebSocket Manager для Fashion AI Platform
 *
 * Управляет WebSocket соединениями для real-time обновлений
 * Поддерживает 3 типа клиентов: user, shop, admin
 */

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.token = null;
        this.clientType = null;
        this.reconnectDelay = 1000; // Начальная задержка 1 секунда
        this.maxReconnectDelay = 30000; // Максимум 30 секунд
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        this.isConnecting = false;
        this.isManualClose = false;
        this.eventHandlers = {};
        this.connectionStateCallbacks = [];

        // Привязываем методы к контексту
        this.handleOpen = this.handleOpen.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Подключиться к WebSocket
     * @param {string} token - JWT токен
     * @param {string} clientType - Тип клиента: user, shop, admin
     */
    connect(token, clientType) {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            console.log('🔌 WebSocket already connecting or connected');
            return;
        }

        if (!token || !clientType) {
            console.error('❌ Token and clientType are required');
            return;
        }

        this.token = token;
        this.clientType = clientType;
        this.isManualClose = false;
        this.isConnecting = true;

        // Определяем WebSocket URL
        const wsUrl = this.getWebSocketUrl();
        console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

        try {
            this.ws = new WebSocket(`${wsUrl}/${clientType}?token=${token}`);

            this.ws.onopen = this.handleOpen;
            this.ws.onmessage = this.handleMessage;
            this.ws.onclose = this.handleClose;
            this.ws.onerror = this.handleError;
        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    /**
     * Получить WebSocket URL на основе окружения
     */
    getWebSocketUrl() {
        // Используем глобальную переменную WS_URL из config.js
        if (typeof WS_URL !== 'undefined' && WS_URL) {
            return WS_URL;
        }
        
        // Fallback: определяем из API_URL
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:8000';
        
        if (apiUrl.startsWith('https://')) {
            return apiUrl.replace('https://', 'wss://') + '/ws';
        } else if (apiUrl.startsWith('http://')) {
            return apiUrl.replace('http://', 'ws://') + '/ws';
        } else {
            return 'ws://localhost:8000/ws';
        }
    }

    /**
     * Обработчик открытия соединения
     */
    handleOpen() {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectDelay = 1000; // Сбрасываем задержку при успешном подключении

        // Уведомляем об изменении состояния
        this.notifyConnectionState('connected');

        // Запускаем heartbeat
        this.startHeartbeat();
    }

    /**
     * Обработчик входящих сообщений
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            console.log('📊 Current event handlers:', Object.keys(this.eventHandlers));

            // Обработка connection confirmation
            if (data.event === 'connected') {
                console.log('✅ Connection confirmed by server');
                return;
            }

            // Обработка pong ответов
            if (data.type === 'pong') {
                console.log('💓 Pong received');
                return;
            }

            // Обработка подписки/отписки
            if (data.type === 'subscribed' || data.type === 'unsubscribed') {
                console.log(`✅ ${data.type} to room:`, data.room);
                return;
            }

            // Обработка событий
            if (data.event) {
                console.log(`🎯 About to handle event: ${data.event}`);
                this.handleEvent(data);
            } else {
                console.warn('⚠️ Received message without event type:', data);
            }
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error, event.data);
        }
    }

    /**
     * Обработчик закрытия соединения
     */
    handleClose(event) {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;

        // Останавливаем heartbeat
        this.stopHeartbeat();

        // Уведомляем об изменении состояния
        this.notifyConnectionState('disconnected');

        // Переподключаемся, если это не ручное закрытие
        if (!this.isManualClose) {
            this.scheduleReconnect();
        }
    }

    /**
     * Обработчик ошибок
     */
    handleError(error) {
        console.error('❌ WebSocket error:', error);
        this.notifyConnectionState('error');
    }

    /**
     * Запланировать переподключение с exponential backoff
     */
    scheduleReconnect() {
        if (this.isManualClose || this.reconnectTimeout) {
            return;
        }

        console.log(`🔄 Reconnecting in ${this.reconnectDelay}ms...`);
        this.notifyConnectionState('reconnecting');

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect(this.token, this.clientType);

            // Увеличиваем задержку для следующей попытки
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        }, this.reconnectDelay);
    }

    /**
     * Запустить heartbeat (ping/pong)
     */
    startHeartbeat() {
        this.stopHeartbeat(); // Останавливаем предыдущий, если есть

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('💓 Sending ping');
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, 30000); // Каждые 30 секунд
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

    /**
     * Отправить сообщение через WebSocket
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('❌ WebSocket is not connected');
        }
    }

    /**
     * Подписаться на комнату
     */
    subscribeRoom(room) {
        console.log(`🔔 Subscribing to room: ${room}`);
        this.send({
            type: 'subscribe_room',
            room: room
        });
    }

    /**
     * Отписаться от комнаты
     */
    unsubscribeRoom(room) {
        console.log(`🔕 Unsubscribing from room: ${room}`);
        this.send({
            type: 'unsubscribe_room',
            room: room
        });
    }

    /**
     * Зарегистрировать обработчик события
     * @param {string} eventType - Тип события (например, 'product.created')
     * @param {function} handler - Функция-обработчик
     */
    on(eventType, handler) {
        if (!this.eventHandlers[eventType]) {
            this.eventHandlers[eventType] = [];
        }
        this.eventHandlers[eventType].push(handler);
    }

    /**
     * Удалить обработчик события
     */
    off(eventType, handler) {
        if (this.eventHandlers[eventType]) {
            this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler);
        }
    }

    /**
     * Обработать событие
     */
    handleEvent(data) {
        const eventType = data.event;
        console.log(`🎯 Handling event: ${eventType}`, data);
        console.log(`📋 Registered handlers for '${eventType}':`, this.eventHandlers[eventType] ? this.eventHandlers[eventType].length : 0);

        // Вызываем все зарегистрированные обработчики
        if (this.eventHandlers[eventType]) {
            console.log(`✅ Found ${this.eventHandlers[eventType].length} handler(s) for ${eventType}`);
            this.eventHandlers[eventType].forEach((handler, index) => {
                try {
                    console.log(`📞 Calling handler ${index + 1} for ${eventType}`);
                    handler(data);
                    console.log(`✅ Handler ${index + 1} completed for ${eventType}`);
                } catch (error) {
                    console.error(`❌ Error in event handler ${index + 1} for ${eventType}:`, error);
                }
            });
        } else {
            console.warn(`⚠️ No handlers registered for event: ${eventType}`);
        }

        // Вызываем общий обработчик, если есть
        if (this.eventHandlers['*']) {
            console.log(`✅ Calling ${this.eventHandlers['*'].length} wildcard handler(s)`);
            this.eventHandlers['*'].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('❌ Error in wildcard event handler:', error);
                }
            });
        }
    }

    /**
     * Зарегистрировать callback для изменения состояния подключения
     */
    onConnectionStateChange(callback) {
        this.connectionStateCallbacks.push(callback);
    }

    /**
     * Уведомить о изменении состояния подключения
     */
    notifyConnectionState(state) {
        this.connectionStateCallbacks.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('❌ Error in connection state callback:', error);
            }
        });
    }

    /**
     * Получить текущее состояние подключения
     */
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

    /**
     * Закрыть соединение
     */
    disconnect() {
        console.log('🔌 Manually disconnecting WebSocket');
        this.isManualClose = true;

        // Очищаем таймауты
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

    /**
     * Переподключиться (закрыть и открыть новое соединение)
     */
    reconnect() {
        console.log('🔄 Manual reconnect requested');
        this.disconnect();
        this.isManualClose = false;

        // Небольшая задержка перед переподключением
        setTimeout(() => {
            if (this.token && this.clientType) {
                this.connect(this.token, this.clientType);
            }
        }, 1000);
    }
}

// Создаем глобальный экземпляр
window.wsManager = new WebSocketManager();

console.log('✅ WebSocket manager loaded');
