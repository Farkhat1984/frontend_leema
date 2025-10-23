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
        production: 'https://api.leema.kz'
    },
    
    wsUrls: {
        local: 'ws://localhost:8000/ws',
        production: 'wss://api.leema.kz/ws'
    },
    
    getApiUrl() {
        return this.apiUrls[this.environment];
    },
    
    getWsUrl() {
        return this.wsUrls[this.environment];
    },
    
    getPlatform() {
        const ua = navigator.userAgent;
        return /Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'web';
    },
    
    GOOGLE_CLIENT_ID: '236011762515-q48adtqtgd72na7lp861339offh3b9k3.apps.googleusercontent.com'
};

const API_URL = CONFIG.getApiUrl();
const WS_URL = CONFIG.getWsUrl();
const PLATFORM = CONFIG.getPlatform();

(function initPlatform() {
    if (!localStorage.getItem('platform')) {
        const platform = CONFIG.getPlatform();
        localStorage.setItem('platform', platform);
    }
})();
