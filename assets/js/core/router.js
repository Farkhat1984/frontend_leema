// Centralized routing configuration and navigation service
const Router = {
    // Base paths configuration
    paths: {
        // Public section (login, auth, payment)
        public: {
            base: '/public',
            login: '/public',
            authCallback: '/public/auth/callback',
            paymentSuccess: '/public/payment/success',
            paymentCancel: '/public/payment/cancel'
        },
        // Shop owner section
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
        // Admin section
        admin: {
            base: '/admin',
            dashboard: '/admin',
            products: '/admin/products',
            shops: '/admin/shops',
            users: '/admin/users',
            settings: '/admin/settings',
            analytics: '/admin/analytics',
            orders: '/admin/orders',
            logs: '/admin/logs',
            reports: '/admin/reports',
            reviews: '/admin/reviews',
            notifications: '/admin/notifications',
            refunds: '/admin/refunds'
        },
        // User section
        user: {
            base: '/user',
            dashboard: '/user'
        }
    },

    getDefaultDashboard(role) {
        const roleMap = {
            'admin': this.paths.admin.dashboard,
            'shop_owner': this.paths.shop.dashboard,
            'user': this.paths.user.dashboard
        };
        return roleMap[role] || this.paths.public.login;
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
    redirectToDashboard(role) {
        const dashboard = this.getDefaultDashboard(role);
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

    hasAccess(userRole) {
        const section = this.getCurrentSection();
        const accessMap = {
            'public': ['admin', 'shop_owner', 'user', null], // all can access
            'admin': ['admin'],
            'shop': ['shop_owner'],
            'user': ['user']
        };
        return accessMap[section]?.includes(userRole) || false;
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
