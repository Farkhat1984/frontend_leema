const API_ENDPOINTS = {
    AUTH: {
        GOOGLE_URL: '/api/v1/auth/google/url',
        REFRESH: '/api/v1/auth/refresh',
        LOGOUT: '/api/v1/auth/logout'
    },

    SHOPS: {
        ME: '/api/v1/shops/me',
        ANALYTICS: '/api/v1/shops/me/analytics',
        PRODUCTS: '/api/v1/shops/me/products',
        TRANSACTIONS: '/api/v1/shops/me/transactions',
        ORDERS: '/api/v1/shops/me/orders',
        UPLOAD_AVATAR: '/api/v1/shops/upload-avatar'
    },

    PRODUCTS: {
        BASE: '/api/v1/products/',
        UPLOAD_IMAGES: '/api/v1/products/upload-images',
        BY_ID: (id) => `/api/v1/products/${id}`
    },

    ADMIN: {
        DASHBOARD: '/api/v1/admin/dashboard',
        SETTINGS: '/api/v1/admin/settings',
        PRODUCTS: '/api/v1/admin/products',
        PRODUCTS_ALL: '/api/v1/admin/products/all',
        SHOPS: '/api/v1/admin/shops',
        SHOPS_ALL: '/api/v1/admin/shops/all',
        SHOPS_BULK_ACTION: '/api/v1/admin/shops/bulk-action',
        USERS: '/api/v1/admin/users',
        MODERATION_QUEUE: '/api/v1/admin/moderation/queue',
        APPROVE_PRODUCT: (id) => `/api/v1/admin/products/${id}/approve`,
        REJECT_PRODUCT: (id) => `/api/v1/admin/products/${id}/reject`,
        WARDROBES: '/api/v1/admin/wardrobes',
        WARDROBES_STATS: '/api/v1/admin/wardrobes/stats',
        WARDROBES_USER: (userId) => `/api/v1/admin/wardrobes/user/${userId}`
    },

    PAYMENTS: {
        SHOP_RENT_PRODUCT: '/api/v1/payments/shop/rent-product',
        SHOP_TOP_UP: '/api/v1/payments/shop/top-up',
        USER_TOP_UP: '/api/v1/payments/user/top-up'
    },

    USERS: {
        ME: '/api/v1/users/me',
        BALANCE: '/api/v1/users/me/balance'
    }
};

window.API_ENDPOINTS = API_ENDPOINTS;
