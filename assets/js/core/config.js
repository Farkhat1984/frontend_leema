// Конфигурация для разных окружений
const CONFIG = {
    // Автоматическое определение окружения
    get environment() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') ||
                       hostname.endsWith('.local');
        return isLocal ? 'local' : 'production';
    },
    
    // API URLs для разных окружений
    apiUrls: {
        local: 'http://localhost:8000',  // Локальный сервер API для разработки
        production: 'https://api.leema.kz'  // Продакшн API
    },
    
    // WebSocket URLs
    wsUrls: {
        local: 'ws://localhost:8000/ws',
        production: 'wss://api.leema.kz/ws'
    },
    
    // Получить текущий API URL
    getApiUrl() {
        return this.apiUrls[this.environment];
    },
    
    // Получить текущий WebSocket URL
    getWsUrl() {
        return this.wsUrls[this.environment];
    }
};

// Глобальные переменные для использования во всех скриптах
const API_URL = CONFIG.getApiUrl();
const WS_URL = CONFIG.getWsUrl();

console.log(`🌐 Environment: ${CONFIG.environment}`);
console.log(`🔗 API URL: ${API_URL}`);
console.log(`🔌 WebSocket URL: ${WS_URL}`);
