// Login page logic
document.addEventListener('DOMContentLoaded', function() {
    // Если уже авторизован, редирект
    if (AuthService.isAuthenticated()) {
        const role = AuthService.getUserRole();
        if (role === 'admin') {
            window.location.href = '/admin/index.html';
        } else if (role === 'shop') {
            window.location.href = '/shop/index.html';
        } else if (role === 'user') {
            window.location.href = '/user/dashboard.html';
        }
        return;
    }
});

// Функция входа через Google
function loginWithGoogle(accountType) {
    // Сохраняем тип аккаунта
    localStorage.setItem('accountType', accountType);
    
    // Генерируем state для безопасности
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('oauth_state', state);
    
    // Редирект на Google OAuth
    const redirectUri = window.location.origin + '/public/auth/callback.html';
    const clientId = config.GOOGLE_CLIENT_ID || '776699022658-svd5a6a8hskotmj9hd6lrhtunekslb4r.apps.googleusercontent.com';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20profile%20email&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;
    
    window.location.href = googleAuthUrl;
}

// Функция выхода
function logout() {
    AuthService.logout();
}
