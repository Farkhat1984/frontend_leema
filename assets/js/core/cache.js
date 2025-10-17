class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.defaultTTL = 300000;
    }
    set(key, value, ttl = this.defaultTTL) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now() + ttl);
    }
    get(key) {
        if (!this.cache.has(key)) return null;
        const timestamp = this.timestamps.get(key);
        if (Date.now() > timestamp) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        return this.cache.get(key);
    }
    has(key) {
        const value = this.get(key);
        return value !== null;
    }
    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }
    clearExpired() {
        const now = Date.now();
        for (const [key, timestamp] of this.timestamps.entries()) {
            if (now > timestamp) {
                this.cache.delete(key);
                this.timestamps.delete(key);
            }
        }
    }
}
const apiCache = new CacheManager();
setInterval(() => apiCache.clearExpired(), 60000);
