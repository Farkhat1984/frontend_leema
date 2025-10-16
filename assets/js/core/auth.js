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

    // Получить роль пользователя
    getUserRole() {
        return localStorage.getItem('userRole');
    },

    // Получить данные пользователя
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Сохранить данные авторизации
    setAuthData(token, userData, userRole) {
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userRole', userRole);
    },

    // Выйти
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        window.location.href = '/public/index.html';
    }
};

// Экспорт для использования в других модулях
window.AuthService = AuthService;
