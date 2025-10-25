const APP_CONSTANTS = {
    PAGINATION: {
        ITEMS_PER_PAGE: 12,
        ORDERS_PER_PAGE: 50,
        MAX_ITEMS_PER_PAGE: 100
    },

    LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024,
        MAX_IMAGES_PER_PRODUCT: 10,
        PRODUCTS_QUERY_LIMIT: 1000
    },

    TIME: {
        MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
        DEBOUNCE_DELAY: 300,
        RECONNECT_DELAY: 3000,
        DEFAULT_TIMEOUT: 30000
    },

    MODERATION: {
        EXPIRING_SOON_DAYS: 3,
        DEFAULT_RENT_MONTHS: 1
    },

    PAYMENT: {
        DEFAULT_TOPUP_AMOUNT: 50,
        MIN_TOPUP_AMOUNT: 10,
        DEFAULT_RENT_PRICE: 10
    },

    UI: {
        AVATAR_INITIALS_LENGTH: 1,
        NOTIFICATION_DURATION: 3000,
        TOAST_DURATION: 5000
    },

    PRODUCT: {
        STATUS: {
            PENDING: 'pending',
            APPROVED: 'approved',
            REJECTED: 'rejected',
            ACTIVE: 'active'
        }
    },

    ORDER: {
        STATUS: {
            PENDING: 'pending',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled',
            REFUNDED: 'refunded'
        }
    },

    TRANSACTION: {
        TYPE: {
            PRODUCT_RENT: 'product_rent',
            PRODUCT_PURCHASE: 'product_purchase',
            SHOP_PAYOUT: 'shop_payout',
            TOP_UP: 'top_up'
        },
        STATUS: {
            PENDING: 'pending',
            COMPLETED: 'completed',
            FAILED: 'failed',
            REFUNDED: 'refunded'
        }
    }
};

window.APP_CONSTANTS = APP_CONSTANTS;
