// Auth service - авторизация и управление сессией
const AuthService = {
    // Проверка авторизации
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Получить токен
    getToken() {
        return localStorage.getItem('token');
    },

    // Получить refresh token
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },

    // Получить роль пользователя
    getUserRole() {
        return localStorage.getItem('userRole');
    },

    // Получить платформу
    getPlatform() {
        return localStorage.getItem('platform') || 'web';
    },

    // Получить тип аккаунта
    getAccountType() {
        return localStorage.getItem('accountType') || 'user';
    },

    // Получить данные пользователя
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Сохранить данные авторизации (расширенная версия)
    setAuthData(token, refreshToken, userData, userRole, platform = 'web', accountType = 'user') {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('platform', platform);
        localStorage.setItem('accountType', accountType);
    },

    // Обновить только токены
    updateTokens(token, refreshToken) {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
    },

    // Refresh access token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.updateTokens(data.access_token, data.refresh_token);
            return data.access_token;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            this.logout();
            throw error;
        }
    },

    // Выйти
    async logout() {
        const refreshToken = this.getRefreshToken();
        
        // Отправить refresh token на blacklist
        if (refreshToken) {
            try {
                await fetch(`${API_URL}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        refresh_token: refreshToken
                    })
                });
            } catch (error) {
                console.error('Logout error:', error);
                // Продолжаем выход даже если запрос не удался
            }
        }
        
        // Очистить storage
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('platform');
        localStorage.removeItem('accountType');
        localStorage.removeItem('user');
        localStorage.removeItem('shop');
        
        // Use Router if available, otherwise fallback
        if (window.Router) {
            window.Router.redirectToAuth();
        } else {
            window.location.href = '/public';
        }
    }
};

// Экспорт для использования в других модулях
window.AuthService = AuthService;
