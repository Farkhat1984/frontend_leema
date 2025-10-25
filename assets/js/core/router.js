const Router = {
    paths: {
        public: {
            base: '/public',
            login: '/public',
            authCallback: '/public/auth/callback',
            paymentSuccess: '/public/payment/success',
            paymentCancel: '/public/payment/cancel'
        },
        shop: {
            base: '/shop',
            dashboard: '/shop',
            products: '/shop/products',
            orders: '/shop/orders',
            customers: '/shop/customers',
            analytics: '/shop/analytics',
            reports: '/shop/reports',
            billing: '/shop/billing',
            topup: '/shop/billing/topup',
            profile: '/shop/profile',
            reviews: '/shop/reviews',
            notifications: '/shop/notifications',
            register: '/shop/register'
        },
        admin: {
            base: '/admin',
            dashboard: '/admin',
            products: '/admin/products',
            categories: '/admin/categories',
            shops: '/admin/shops',
            users: '/admin/users',
            settings: '/admin/settings',
            analytics: '/admin/analytics',
            orders: '/admin/orders',
            logs: '/admin/logs',
            reports: '/admin/reports',
            reviews: '/admin/reviews',
            notifications: '/admin/notifications',
            refunds: '/admin/refunds',
            wardrobes: '/admin/wardrobes'
        },
        user: {
            base: '/user',
            dashboard: '/user'
        }
    },

    getDefaultDashboard(role, accountType) {
        if (accountType === 'admin' || role === 'admin') {
            return this.paths.admin.dashboard;
        }
        if (accountType === 'shop' || role === 'shop_owner') {
            return this.paths.shop.dashboard;
        }
        if (accountType === 'user' || role === 'user') {
            return this.paths.user.dashboard;
        }
        return this.paths.public.login;
    },

    // Navigate to path
    navigate(path, replace = false) {
        if (replace) {
            window.location.replace(path);
        } else {
            window.location.href = path;
        }
    },

    // Redirect based on authentication state
    redirectToAuth() {
        this.navigate(this.paths.public.login, true);
    },

    // Redirect to appropriate dashboard
    redirectToDashboard(role, accountType) {
        const dashboard = this.getDefaultDashboard(role, accountType);
        this.navigate(dashboard, true);
    },

    // Get current section (public, shop, admin, user)
    getCurrentSection() {
        const path = window.location.pathname;
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/shop')) return 'shop';
        if (path.startsWith('/user')) return 'user';
        if (path.startsWith('/public')) return 'public';
        return 'public'; // default
    },

    hasAccess(userRole, accountType) {
        const section = this.getCurrentSection();
        
        // Для публичных страниц все имеют доступ
        if (section === 'public') return true;
        
        // Для админа - только роль admin
        if (section === 'admin') {
            return userRole === 'admin' || accountType === 'admin';
        }
        
        // Для shop - только shop_owner или accountType shop
        if (section === 'shop') {
            return userRole === 'shop_owner' || accountType === 'shop';
        }
        
        // Для user - только обычные пользователи (не admin, не shop)
        if (section === 'user') {
            return (userRole === 'user' && accountType === 'user') || 
                   (!accountType && userRole === 'user');
        }
        
        return false;
    },
    
    // Проверить доступ и редирект если нет прав
    checkAccess() {
        if (!window.AuthService || !window.AuthService.isAuthenticated()) {
            this.redirectToAuth();
            return false;
        }
        
        const role = window.AuthService.getUserRole();
        const accountType = window.AuthService.getAccountType();
        
        if (!this.hasAccess(role, accountType)) {
            // Редирект на правильную страницу
            this.redirectToDashboard(role, accountType);
            return false;
        }
        
        return true;
    },
    
    // Защита страницы - вызывать в начале каждой защищенной страницы
    // Возвращает true если доступ разрешен, иначе делает редирект
    protectPage(requiredSection) {
        if (!window.AuthService || !window.AuthService.isAuthenticated()) {
            this.redirectToAuth();
            return false;
        }
        
        const role = window.AuthService.getUserRole();
        const accountType = window.AuthService.getAccountType();
        
        // Проверка доступа к конкретной секции
        let hasAccess = false;
        
        if (requiredSection === 'admin') {
            hasAccess = (role === 'admin' || accountType === 'admin');
        } else if (requiredSection === 'shop') {
            hasAccess = (role === 'shop_owner' || accountType === 'shop');
        } else if (requiredSection === 'user') {
            hasAccess = (role === 'user' && accountType === 'user') || 
                       (!accountType && role === 'user');
        }
        
        if (!hasAccess) {
            this.redirectToDashboard(role, accountType);
            return false;
        }
        
        return true;
    },

    getBackPath() {
        const section = this.getCurrentSection();
        const path = window.location.pathname;
        
        // If on subsection, go to section base
        if (path !== this.paths[section]?.base) {
            return this.paths[section]?.base || '/';
        }
        
        // If on section base, stay there or go to appropriate place
        return null; // null means no back navigation
    },

    // Navigate back
    goBack() {
        const backPath = this.getBackPath();
        if (backPath) {
            this.navigate(backPath);
        } else {
            window.history.back();
        }
    }
};

// Export for use in other modules
window.Router = Router;
