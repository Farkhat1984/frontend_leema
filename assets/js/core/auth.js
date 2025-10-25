const AuthService = {
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    },

    getUserRole() {
        return localStorage.getItem('userRole');
    },

    getPlatform() {
        return localStorage.getItem('platform') || 'web';
    },

    getAccountType() {
        return localStorage.getItem('accountType') || 'user';
    },

    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    setAuthData(token, refreshToken, userData, userRole, platform = 'web', accountType = 'user') {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('platform', platform);
        localStorage.setItem('accountType', accountType);
    },

    updateTokens(token, refreshToken) {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
    },

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
            this.logout();
            throw error;
        }
    },

    async logout() {
        const refreshToken = this.getRefreshToken();
        
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
            }
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('platform');
        localStorage.removeItem('accountType');
        localStorage.removeItem('user');
        localStorage.removeItem('shop');
        
        if (window.Router) {
            window.Router.redirectToAuth();
        } else {
            window.location.href = '/public';
        }
    }
};

window.AuthService = AuthService;
