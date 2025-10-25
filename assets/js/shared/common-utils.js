const CommonUtils = {
    logError(context, error, additionalInfo = {}) {
        // Log errors for debugging (not console.log in production)
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || error,
            stack: error?.stack,
            ...additionalInfo
        };
        
        // In development, log to console
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            console.error(`[${context}]`, error, additionalInfo);
        }
        
        // Could send to error tracking service here
        // Example: window.errorTracker?.logError(errorLog);
        
        return errorLog;
    },

    async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                // Don't retry on auth errors or validation errors
                if (error.message.includes('Session expired') || 
                    error.message.includes('unauthorized') ||
                    error.message.includes('validation') ||
                    error.message.includes('400')) {
                    throw error;
                }
                
                // Last attempt, throw the error
                if (attempt === maxRetries) {
                    this.logError('retryOperation:failed', error, { attempt, maxRetries });
                    throw error;
                }
                
                // Wait before retrying with exponential backoff
                const delay = delayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                this.logError('retryOperation:retry', error, { attempt, maxRetries, nextDelay: delay * 2 });
            }
        }
        
        throw lastError;
    },

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
        if (window.AuthService) {
            window.AuthService.logout();
        } else {
            localStorage.clear();
            window.location.href = `${window.location.origin}/public`;
        }
    },

    async apiRequest(endpoint, method = 'GET', body = null, useCache = false, retryOnAuth = true) {
        this.ensurePlatform();
        
        // Validate endpoint
        if (!endpoint || typeof endpoint !== 'string') {
            throw new Error('Invalid endpoint');
        }
        
        // Security: Validate HTTP method
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        if (!validMethods.includes(method.toUpperCase())) {
            throw new Error('Invalid HTTP method');
        }
        
        if (useCache && method === 'GET' && typeof window.apiCache !== 'undefined') {
            const cacheKey = `${endpoint}`;
            const cached = window.apiCache.get(cacheKey);
            if (cached) return cached;
        }

        const currentToken = localStorage.getItem('token');
        const platform = localStorage.getItem('platform') || 'web';
        
        // Security: Validate token format if exists
        if (currentToken && !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(currentToken)) {
            this.logError('apiRequest:invalidToken', new Error('Invalid token format'));
            localStorage.removeItem('token');
            throw new Error('Invalid authentication token');
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                'X-Client-Platform': platform
            }
        };

        if (body) {
            // Security: Sanitize body data before sending
            const sanitizedBody = this.sanitizeRequestBody(body);
            options.body = JSON.stringify(sanitizedBody);
        }

        let response;
        try {
            response = await fetch(`${API_URL}${endpoint}`, options);
        } catch (error) {
            // Network error - no response from server
            this.logError('apiRequest:network', error, { endpoint, method });
            if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network.');
            }
            throw new Error('Network error. Please try again.');
        }

        if (response.status === 401 && retryOnAuth && window.AuthService) {
            console.log('[apiRequest] Received 401, attempting token refresh...');
            try {
                const newToken = await window.AuthService.refreshAccessToken();
                console.log('[apiRequest] Token refreshed successfully');
                
                options.headers['Authorization'] = `Bearer ${newToken}`;
                
                try {
                    console.log('[apiRequest] Retrying request with new token...');
                    response = await fetch(`${API_URL}${endpoint}`, options);
                    console.log('[apiRequest] Retry response status:', response.status);
                } catch (error) {
                    console.error('[apiRequest] Retry request failed:', error);
                    if (!navigator.onLine) {
                        throw new Error('No internet connection. Please check your network.');
                    }
                    throw new Error('Network error. Please try again.');
                }
            } catch (error) {
                console.error('[apiRequest] Token refresh failed:', error);
                this.logout();
                throw new Error('Session expired. Please login again.');
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request error' }));
            const errorMsg = error.detail || `Server error: ${response.status}`;
            this.logError('apiRequest:http', new Error(errorMsg), { 
                endpoint, 
                method, 
                status: response.status,
                errorDetail: error 
            });
            throw new Error(errorMsg);
        }

        // Handle 204 No Content responses (like DELETE)
        if (response.status === 204) {
            return null;
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
        if (type === 'error' && message && (
            message.includes('Cannot set properties of null') ||
            message.includes('Cannot read properties of null') ||
            message.includes('Cannot read properties of undefined') ||
            message.includes('is null') && message.includes('textContent')
        )) {
            return;
        }

        if (window.notificationManager) {
            window.notificationManager.showToast(message, type);
        }
    },

    initWebSocket(accountType, eventHandlers = {}) {
        const token = localStorage.getItem('token');
        if (!window.wsManager || !token) return;

        const setupHandlers = () => {
            Object.keys(eventHandlers).forEach(eventName => {
                if (window.wsManager.eventHandlers && window.wsManager.eventHandlers[eventName]) {
                    window.wsManager.eventHandlers[eventName] = [];
                }
            });

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
        };

        if (window.wsManager.ws && 
            window.wsManager.ws.readyState === WebSocket.OPEN &&
            window.wsManager.token === token &&
            window.wsManager.clientType === accountType) {
            setupHandlers();
            return;
        }

        if (window.wsManager.ws && window.wsManager.ws.readyState === WebSocket.CONNECTING) {
            const checkConnection = setInterval(() => {
                if (window.wsManager.ws.readyState === WebSocket.OPEN) {
                    clearInterval(checkConnection);
                    setupHandlers();
                } else if (window.wsManager.ws.readyState === WebSocket.CLOSED) {
                    clearInterval(checkConnection);
                    window.wsManager.connect(token, accountType);
                    setupHandlers();
                }
            }, 100);
            return;
        }

        if (window.wsManager.ws && window.wsManager.ws.readyState === WebSocket.OPEN) {
            window.wsManager.disconnect();
            setTimeout(() => {
                window.wsManager.connect(token, accountType);
                setupHandlers();
            }, 300);
            return;
        }

        window.wsManager.connect(token, accountType);
        setupHandlers();
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
                indicator.title = 'WebSocket connected';
                break;
            case 'connecting':
            case 'reconnecting':
                indicator.classList.add('ws-status-connecting');
                indicator.title = 'WebSocket connecting...';
                break;
            case 'disconnected':
            case 'error':
                indicator.classList.add('ws-status-disconnected');
                indicator.title = 'WebSocket disconnected';
                break;
        }
    },

    validateInput(value, rules = {}) {
        const errors = [];
        
        if (rules.required && (!value || value.toString().trim() === '')) {
            errors.push(window.MESSAGES?.VALIDATION.REQUIRED_FIELD || 'This field is required');
            return { valid: false, errors };
        }
        
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(window.MESSAGES?.VALIDATION.MIN_LENGTH?.(rules.minLength) || `Minimum length is ${rules.minLength}`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(window.MESSAGES?.VALIDATION.MAX_LENGTH?.(rules.maxLength) || `Maximum length is ${rules.maxLength}`);
        }
        
        if (rules.min && parseFloat(value) < rules.min) {
            errors.push(window.MESSAGES?.VALIDATION.MIN_AMOUNT?.(rules.min) || `Minimum value is ${rules.min}`);
        }
        
        if (rules.max && parseFloat(value) > rules.max) {
            errors.push(window.MESSAGES?.VALIDATION.MAX_AMOUNT?.(rules.max) || `Maximum value is ${rules.max}`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.patternMessage || 'Invalid format');
        }
        
        if (rules.email) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
                errors.push(window.MESSAGES?.VALIDATION.INVALID_EMAIL || 'Invalid email address');
            }
        }
        
        if (rules.number && isNaN(parseFloat(value))) {
            errors.push(window.MESSAGES?.VALIDATION.INVALID_NUMBER || 'Must be a valid number');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },

    handleError(context, error, showToUser = true) {
        // Log the error
        this.logError(context, error);
        
        // Show user-friendly message if requested
        if (showToUser && window.showAlert) {
            const userMessage = error.message || 'An error occurred';
            window.showAlert(userMessage, 'error');
        }
        
        return error;
    },

    debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates();
        });
    },

    createDocumentFragment(htmlArray) {
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('div');
        temp.innerHTML = htmlArray.join('');
        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }
        return fragment;
    },

    /**
     * Sanitizes request body to prevent XSS and injection attacks
     * @param {Object|Array|any} data - Data to sanitize
     * @returns {Object|Array|any} - Sanitized data
     */
    sanitizeRequestBody(data) {
        if (data === null || data === undefined) {
            return data;
        }
        
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeRequestBody(item));
        }
        
        // Handle objects
        if (typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeRequestBody(value);
            }
            return sanitized;
        }
        
        // Handle strings - check for XSS patterns
        if (typeof data === 'string') {
            // Security: Check for potential XSS patterns
            if (window.SecurityUtils && window.SecurityUtils.containsXss(data)) {
                this.logError('sanitizeRequestBody:xss', new Error('Potential XSS detected'), { data });
                // Return empty string if XSS detected
                return '';
            }
            
            // Trim and return
            return data.trim();
        }
        
        // Numbers, booleans, etc. - return as is
        return data;
    },

    /**
     * Safely parse JSON with error handling
     * @param {string} jsonString - JSON string to parse
     * @param {any} defaultValue - Default value if parsing fails
     * @returns {any} - Parsed JSON or default value
     */
    safeJsonParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            this.logError('safeJsonParse', error, { jsonString: jsonString?.substring(0, 100) });
            return defaultValue;
        }
    },

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    /**
     * Validates phone number format
     * @param {string} phone - Phone to validate
     * @returns {boolean} - True if valid
     */
    isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Validates URL format and safety
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid and safe
     */
    isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        // Block javascript: and data: URLs
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
            return false;
        }
        
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }
};

window.CommonUtils = CommonUtils;
window.logout = CommonUtils.logout.bind(CommonUtils);
window.apiRequest = CommonUtils.apiRequest.bind(CommonUtils);
window.formatImageUrl = CommonUtils.formatImageUrl.bind(CommonUtils);
window.showAlert = CommonUtils.showAlert.bind(CommonUtils);
window.debounce = CommonUtils.debounce.bind(CommonUtils);
window.throttle = CommonUtils.throttle.bind(CommonUtils);
