const CONFIG = {
    get environment() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') ||
                       hostname.endsWith('.local');
        return isLocal ? 'local' : 'production';
    },
    
    apiUrls: {
        local: 'http://localhost:8000',
        production: 'https://www.api.leema.kz'
    },
    
    wsUrls: {
        local: 'ws://localhost:8000/ws',
        production: 'wss://www.api.leema.kz/ws'
    },
    
    getApiUrl() {
        return this.apiUrls[this.environment];
    },
    
    getWsUrl() {
        return this.wsUrls[this.environment];
    },
    
    GOOGLE_CLIENT_ID: '222819809615-cb4p93ej04cr6ur9cf5o1jjk9n6dmvuj.apps.googleusercontent.com'
};

const API_URL = CONFIG.getApiUrl();
const WS_URL = CONFIG.getWsUrl();
