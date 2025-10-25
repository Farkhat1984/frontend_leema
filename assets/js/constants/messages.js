const MESSAGES = {
    ERROR: {
        GENERIC: 'An error occurred. Please try again.',
        LOADING_DATA: 'Error loading data',
        LOADING_SHOP_INFO: 'Error loading shop info',
        LOADING_SHOPS: 'Error loading shops list',
        LOADING_PRODUCTS: 'Error loading products',
        LOADING_ANALYTICS: 'Error loading analytics',
        LOADING_ORDERS: 'Error loading orders',
        LOADING_TRANSACTIONS: 'Error loading transactions',
        LOADING_STATS: 'Error loading stats',
        LOADING_USERS: 'Error loading users',
        LOADING_SETTINGS: 'Error loading settings',
        LOADING_MODERATION_QUEUE: 'Error loading moderation queue',
        LOADING_REFUNDS: 'Error loading refunds',
        LOADING_IMAGE: 'Error loading',
        CREATING_PRODUCT: 'Error creating product',
        UPDATING_PRODUCT: 'Error updating product',
        DELETING_PRODUCT: 'Error deleting product',
        LOADING_PRODUCT: 'Error loading product',
        UPDATING_PROFILE: 'Error updating profile',
        UPDATING_SETTINGS: 'Error updating settings',
        UPLOADING_IMAGES: 'Error uploading images',
        CREATING_PAYMENT: 'Error creating payment',
        PAYMENT_URL_NOT_RECEIVED: 'Error: Payment URL not received',
        AUTHORIZATION_URL: 'Error getting authorization URL',
        SESSION_EXPIRED: 'Session expired. Please login again.',
        REQUEST_FAILED: 'Request error',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'Unauthorized. Please login again.',
        APPROVING_SHOP: 'Error approving shop',
        REJECTING_SHOP: 'Error rejecting shop',
        CHANGING_SHOP_STATUS: 'Error changing shop status',
        MODERATION_ERROR: 'Error during moderation',
        PROCESSING_REFUND: 'Error processing refund',
        INVALID_TOKEN: 'Invalid authentication token',
        INVALID_INPUT: 'Invalid input provided',
        INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid image.',
        FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
        INVALID_EMAIL: 'Please enter a valid email address',
        INVALID_PHONE: 'Please enter a valid phone number',
        INVALID_URL: 'Please enter a valid URL',
        XSS_DETECTED: 'Potentially dangerous content detected',
        RATE_LIMIT: 'Too many attempts. Please try again later.'
    },

    SUCCESS: {
        PROFILE_UPDATED: 'Profile updated successfully',
        PRODUCT_CREATED: 'Product created successfully',
        PRODUCT_UPDATED: 'Product updated successfully',
        PRODUCT_DELETED: 'Product deleted successfully',
        IMAGE_REMOVED: 'Image removed. Don\'t forget to click "Save"!',
        PAYMENT_INITIATED: 'Payment initiated successfully',
        SETTINGS_SAVED: 'Settings saved successfully'
    },

    CONFIRMATION: {
        DELETE_PRODUCT: 'Are you sure you want to delete this product?',
        DELETE_SHOP: 'Are you sure you want to delete this shop?',
        DELETE_USER: 'Are you sure you want to delete this user?',
        REJECT_PRODUCT: 'Are you sure you want to reject this product?',
        APPROVE_SHOP: 'Are you sure you want to approve this shop?',
        REJECT_SHOP: 'Are you sure you want to reject this shop?',
        CHANGE_SHOP_STATUS: (action) => `Are you sure you want to ${action} this shop?`,
        UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?'
    },

    INFO: {
        NO_PRODUCTS: 'You don\'t have any products yet',
        NO_ORDERS: 'No orders yet',
        NO_TRANSACTIONS: 'No transactions yet',
        NO_IMAGES: 'No images',
        NO_ACTIVE_RENTS: 'No active product subscriptions',
        LOADING: 'Loading...',
        PLEASE_WAIT: 'Please wait...'
    },

    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_EMAIL: 'Please enter a valid email address',
        INVALID_PHONE: 'Please enter a valid phone number',
        MIN_AMOUNT: (min) => `Amount must be at least ${min}`,
        MAX_AMOUNT: (max) => `Amount cannot exceed ${max}`,
        FILL_NAME_AND_PRICE: 'Please fill in name and price',
        INVALID_PRICE: 'Price must be a valid number greater than 0',
        INVALID_NUMBER: 'Please enter a valid number',
        MAX_FILE_SIZE: (maxMB) => `File size cannot exceed ${maxMB}MB`,
        MAX_FILES: (max) => `You can upload maximum ${max} files`,
        MIN_LENGTH: (min) => `Minimum length is ${min} characters`,
        MAX_LENGTH: (max) => `Maximum length is ${max} characters`
    },

    PRODUCT: {
        STATUS: {
            PENDING: 'Pending',
            APPROVED: 'Approved',
            REJECTED: 'Rejected'
        }
    },

    TRANSACTION: {
        TYPE: {
            PRODUCT_RENT: 'Product rental',
            PRODUCT_PURCHASE: 'Product sale',
            SHOP_PAYOUT: 'Payout',
            TOP_UP: 'Top-up'
        },
        STATUS: {
            PENDING: 'Pending',
            COMPLETED: 'Completed',
            FAILED: 'Error',
            REFUNDED: 'Refund'
        }
    },

    PAYMENT: {
        RENT_PROMPT: (price) => `Product rental payment\n\nCost: ₸${price}/month\n\nHow many months to extend?`,
        TOPUP_PROMPT: 'Enter top-up amount (KZT):'
    }
};

window.MESSAGES = MESSAGES;
