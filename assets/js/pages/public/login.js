// Login page logic
document.addEventListener('DOMContentLoaded', function() {
    // Если уже авторизован, редирект
    if (AuthService.isAuthenticated()) {
        const accountType = localStorage.getItem('accountType');
        const role = AuthService.getUserRole();
        
        if (accountType === 'shop') {
            Router.navigate(Router.paths.shop.dashboard);
        } else if (role === 'admin') {
            Router.navigate(Router.paths.admin.dashboard);
        } else {
            Router.navigate(Router.paths.user.dashboard);
        }
        return;
    }
});

// Функция входа через Google
function loginWithGoogle(accountType) {
    // admin это тоже user, просто с другой ролью
    const apiAccountType = accountType === 'admin' ? 'user' : accountType;
    
    // Сохраняем запрошенный тип для callback
    localStorage.setItem('requestedAccountType', accountType);
    
    // Генерируем state для безопасности
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('oauth_state', state);
    
    // Редирект на Google OAuth
    // Используем фиксированный URI который настроен в Google Console
    const redirectUri = 'https://www.leema.kz/public/auth/callback.html';
    const clientId = CONFIG.GOOGLE_CLIENT_ID;
    
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

