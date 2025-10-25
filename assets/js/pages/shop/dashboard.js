if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

let token = localStorage.getItem('token');
let accountType = localStorage.getItem('accountType');

let shopCurrentPage = 1;
const shopItemsPerPage = APP_CONSTANTS.PAGINATION.ITEMS_PER_PAGE;
let shopAllProducts = [];
let shopSearchQuery = '';
let shopSortBy = 'newest';
let shopStatusFilter = 'all';

window.onload = async function () {
    if (typeof Router === 'undefined' || !Router.protectPage) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (typeof Router === 'undefined' || !Router.protectPage) {
            return;
        }
    }
    
    if (!Router.protectPage('shop')) {
        return;
    }
    
    await loadShopDashboard();
};

async function loginWithGoogle(accountType = 'user') {
    try {
        const params = new URLSearchParams({
            account_type: accountType,
            platform: 'web'
        });

        const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.GOOGLE_URL}?${params.toString()}`);
        const data = await response.json();

        localStorage.setItem('requestedAccountType', accountType);
        window.location.href = data.authorization_url;
    } catch (error) {
        alert(MESSAGES.ERROR.AUTHORIZATION_URL + ': ' + error.message);
    }
}

async function loadShopDashboard() {

    if (window.location.pathname.includes('/admin/')) {
        Router.redirectToAuth();
        return;
    }

    const dashboardEl = document.getElementById('shopDashboard');
    if (dashboardEl) {
        dashboardEl.classList.remove('hidden');
    }

    try {
        CommonUtils.initWebSocket('shop', {
            'product.created': loadShopProducts,
            'product.updated': loadShopProducts,
            'product.deleted': loadShopProducts,
            'product.approved': () => { loadShopProducts(); loadShopDashboard(); },
            'product.rejected': loadShopProducts,
            'balance.updated': (data) => {
                const balanceElement = document.getElementById('shopBalance');
                if (balanceElement && data.data && data.data.new_balance !== undefined) {
                    balanceElement.textContent = `₸${data.data.new_balance.toFixed(2)}`;
                }
                loadShopTransactions();
            },
            'transaction.completed': loadShopTransactions,
            'order.completed': loadShopDashboard
        });

        // Load categories for product forms
        loadCategories();

        const shopInfo = await apiRequest(API_ENDPOINTS.SHOPS.ME);
        
        // Check if shop is not approved or is deactivated
        if (shopInfo.is_approved !== true || shopInfo.is_active !== true) {
            window.location.href = '/shop/register.html';
            return;
        }
        
        const analytics = await apiRequest(API_ENDPOINTS.SHOPS.ANALYTICS);

        // Batch all DOM updates together
        CommonUtils.batchDOMUpdates(() => {
            const shopNameEl = document.getElementById('shopName');
            const shopAvatarEl = document.getElementById('shopAvatar');
            if (shopNameEl) shopNameEl.textContent = shopInfo.shop_name;
            if (shopAvatarEl) shopAvatarEl.textContent = shopInfo.shop_name[0].toUpperCase();

            const profileShopNameEl = document.getElementById('profileShopName');
            const profileEmailEl = document.getElementById('profileEmail');
            const profileDescriptionEl = document.getElementById('profileDescription');
            if (profileShopNameEl) profileShopNameEl.value = shopInfo.shop_name;
            if (profileEmailEl) profileEmailEl.value = shopInfo.email;
            if (profileDescriptionEl) profileDescriptionEl.value = shopInfo.description || '';

            const totalProductsEl = document.getElementById('totalProducts');
            const activeProductsEl = document.getElementById('activeProducts');
            const totalViewsEl = document.getElementById('totalViews');
            const totalTryOnsEl = document.getElementById('totalTryOns');
            if (totalProductsEl) totalProductsEl.textContent = analytics.total_products;
            if (activeProductsEl) activeProductsEl.textContent = analytics.active_products;
            if (totalViewsEl) totalViewsEl.textContent = analytics.total_views;
            if (totalTryOnsEl) totalTryOnsEl.textContent = analytics.total_try_ons;

            const shopBalanceEl = document.getElementById('shopBalance');
            const shopTotalEarningsEl = document.getElementById('shopTotalEarnings');
            if (shopBalanceEl) shopBalanceEl.textContent = `₸${shopInfo.balance.toFixed(2)}`;
            if (shopTotalEarningsEl) shopTotalEarningsEl.textContent = `₸${analytics.total_revenue || 0}`;
        });

        await loadShopTransactions();

        await loadActiveRents();

        await loadShopProducts();
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
    }
}

async function loadShopProducts() {

    const container = document.getElementById('productsList');
    if (!container) {
        return;
    }

    try {
        const products = await apiRequest(API_ENDPOINTS.SHOPS.PRODUCTS);
        
        if (!Array.isArray(products)) {
            shopAllProducts = [];
        } else {
            shopAllProducts = products;
        }

        if (shopAllProducts.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${MESSAGES.INFO.NO_PRODUCTS}</p></div>`;
            const paginationContainer = document.getElementById('shopPaginationContainer');
            if (paginationContainer) {
                paginationContainer.classList.add('hidden');
            }
            return;
        }

        renderShopProductsPage();
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_PRODUCTS + ': ' + error.message, 'error');
    }
}

function renderShopProductsPage() {
    const container = document.getElementById('productsList');

    if (!container) {
        return;
    }

    let filteredProducts = [...shopAllProducts];

    if (shopStatusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
            const status = p.moderation_status || p.status || 'pending';
            return status === shopStatusFilter;
        });
    }

    if (shopSearchQuery.trim()) {
        const query = shopSearchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }

    filteredProducts = [...filteredProducts].sort((a, b) => {
        switch(shopSortBy) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'price_low':
                return (a.price || 0) - (b.price || 0);
            case 'price_high':
                return (b.price || 0) - (a.price || 0);
            case 'name_az':
                return (a.name || '').localeCompare(b.name || '');
            case 'name_za':
                return (b.name || '').localeCompare(a.name || '');
            default:
                return 0;
        }
    });

    const startIndex = (shopCurrentPage - 1) * shopItemsPerPage;
    const endIndex = startIndex + shopItemsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProducts.length / shopItemsPerPage);

    if (productsToShow.length === 0) {
        const message = shopSearchQuery.trim() 
            ? `No products found for "${shopSearchQuery}"` 
            : MESSAGES.INFO.NO_PRODUCTS;
        container.innerHTML = `<div class="col-span-full text-center py-12"><p class="text-gray-500 text-lg">${message}</p></div>`;
        const paginationContainer = document.getElementById('shopPaginationContainer');
        if (paginationContainer) paginationContainer.classList.add('hidden');
        return;
    }

    // Build product cards array for DocumentFragment
    const productCards = productsToShow.map(product => {
        let imageUrl = null;
        if (product.images && product.images.length > 0) {
            imageUrl = formatImageUrl(product.images[0]);
        }
        
        const statusClass = product.moderation_status === APP_CONSTANTS.PRODUCT.STATUS.APPROVED ? 'product-status-approved' : 
                           product.moderation_status === APP_CONSTANTS.PRODUCT.STATUS.REJECTED ? 'product-status-rejected' : 
                           'product-status-pending';
        const statusText = MESSAGES.PRODUCT.STATUS[product.moderation_status?.toUpperCase()] || MESSAGES.PRODUCT.STATUS.PENDING;

        return `
            <div class="product-card">
                <div class="product-image-container">
                    ${product.moderation_status ? `<div class="product-status ${statusClass}">${statusText}</div>` : ''}
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;><i class=&quot;fas fa-image&quot;></i></div>'">` : 
                        '<div class="product-image-placeholder"><i class="fas fa-image"></i></div>'
                    }
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.name || 'Untitled'}</h3>
                    <p class="product-description">${product.description || 'No description'}</p>
                    <div class="mt-auto">
                        <div class="product-price">₸${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="product-action-btn product-action-btn-secondary" onclick="openEditProduct(${product.id})">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button class="product-action-btn product-action-btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        `;
    });

    // Use DocumentFragment if available for better performance
    if (CommonUtils && CommonUtils.createDocumentFragment) {
        container.innerHTML = '';
        container.appendChild(CommonUtils.createDocumentFragment(productCards));
    } else {
        container.innerHTML = productCards.join('');
    }

    if (typeof window.lazyLoader !== 'undefined') {
        setTimeout(() => window.lazyLoader.observeAll('img[data-src]'), 0);
    }

    // Batch pagination updates
    const paginationContainer = document.getElementById('shopPaginationContainer');
    if (paginationContainer) {
        if (totalPages > 1) {
            const pageInfo = document.getElementById('shopPageInfo');
            const prevBtn = document.getElementById('shopPrevPageBtn');
            const nextBtn = document.getElementById('shopNextPageBtn');

            CommonUtils.batchDOMUpdates(() => {
                paginationContainer.classList.remove('hidden');
                if (pageInfo) pageInfo.textContent = `Page ${shopCurrentPage} of ${totalPages} (${filteredProducts.length} products)`;
                if (prevBtn) prevBtn.disabled = shopCurrentPage === 1;
                if (nextBtn) nextBtn.disabled = shopCurrentPage === totalPages;
            });
        } else {
            paginationContainer.classList.add('hidden');
        }
    }
}

function changeShopPage(direction) {
    shopCurrentPage += direction;
    renderShopProductsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateShopProfile() {
    try {
        const profileShopNameEl = document.getElementById('profileShopName');
        const profileOwnerNameEl = document.getElementById('profileOwnerName');
        const profilePhoneEl = document.getElementById('profilePhone');
        const profileWhatsAppEl = document.getElementById('profileWhatsApp');
        const profileAddressEl = document.getElementById('profileAddress');
        const profileDescriptionEl = document.getElementById('profileDescription');

        if (!profileShopNameEl) {
            return;
        }

        let phoneValue = null;
        let whatsappValue = null;
        
        if (window.phoneIti && profilePhoneEl) {
            const phoneNumber = window.phoneIti.getNumber();
            const countryData = window.phoneIti.getSelectedCountryData();
            const digitsOnly = phoneNumber.replace(/\D/g, '');
            const userDigits = digitsOnly.substring(countryData.dialCode.length);
            
            if (userDigits && userDigits.length > 0) {
                if (window.phoneIti.isValidNumber()) {
                    phoneValue = phoneNumber;
                }
            }
        } else if (profilePhoneEl && profilePhoneEl.value) {
            phoneValue = profilePhoneEl.value;
        }
        
        if (window.whatsappIti && profileWhatsAppEl) {
            const whatsappNumber = window.whatsappIti.getNumber();
            const countryData = window.whatsappIti.getSelectedCountryData();
            const digitsOnly = whatsappNumber.replace(/\D/g, '');
            const userDigits = digitsOnly.substring(countryData.dialCode.length);
            
            if (userDigits && userDigits.length > 0) {
                if (window.whatsappIti.isValidNumber()) {
                    whatsappValue = whatsappNumber;
                }
            }
        } else if (profileWhatsAppEl && profileWhatsAppEl.value) {
            whatsappValue = profileWhatsAppEl.value;
        }

        let avatarUrl = null;
        if (window.currentShopInfo && window.currentShopInfo.avatar_url) {
            avatarUrl = window.currentShopInfo.avatar_url;
        } else {
            const currentAvatarImg = document.querySelector('#avatarPreviewProfile img');
            if (currentAvatarImg) {
                avatarUrl = currentAvatarImg.src;
            }
        }
        
        const avatarFile = document.getElementById('profileAvatar')?.files[0];
        if (avatarFile) {
            const token = localStorage.getItem('token');
            const avatarFormData = new FormData();
            avatarFormData.append('file', avatarFile);

            const avatarResponse = await fetch(`${API_URL}/api/v1/shops/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: avatarFormData
            });

            if (avatarResponse.ok) {
                const avatarData = await avatarResponse.json();
                avatarUrl = avatarData.url;
            }
        }

        const data = {
            shop_name: profileShopNameEl.value,
            owner_name: profileOwnerNameEl?.value || null,
            phone: phoneValue,
            whatsapp_number: whatsappValue,
            address: profileAddressEl?.value || null,
            description: profileDescriptionEl?.value || null,
            avatar_url: avatarUrl
        };

        await apiRequest(API_ENDPOINTS.SHOPS.ME, 'PUT', data);
        showAlert(MESSAGES.SUCCESS.PROFILE_UPDATED, 'success');

        const shopInfo = await apiRequest(API_ENDPOINTS.SHOPS.ME);
        window.currentShopInfo = shopInfo;
        
        const shopNameEl = document.getElementById('shopName');
        const shopAvatarEl = document.getElementById('shopAvatar');
        if (shopNameEl) shopNameEl.textContent = shopInfo.shop_name;
        if (shopAvatarEl) shopAvatarEl.textContent = shopInfo.shop_name[0].toUpperCase();
        
        if (shopInfo.avatar_url) {
            const avatarPreview = document.getElementById('avatarPreviewProfile');
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${shopInfo.avatar_url}" alt="Shop Avatar" class="w-full h-full object-cover rounded-lg">`;
            }
        }
    } catch (error) {
        showAlert(MESSAGES.ERROR.UPDATING_PROFILE + ': ' + error.message, 'error');
    }
}

// Load categories for product forms
async function loadCategories() {
    try {
        const data = await CommonUtils.apiRequest('/api/v1/categories/?is_active=true', 'GET');
        const categories = data.categories || [];

        console.log('Loaded categories:', categories.length, categories);

        // Populate both select elements
        const createSelect = document.getElementById('productCategory');
        const editSelect = document.getElementById('editProductCategory');

        const optionsHTML = '<option value="">Без категории</option>' + 
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

        if (createSelect) createSelect.innerHTML = optionsHTML;
        if (editSelect) editSelect.innerHTML = optionsHTML;
        
        console.log('Categories loaded into selects');
    } catch (error) {
        console.error('Error loading categories:', error);
        // Show user-friendly error
        showAlert('Не удалось загрузить категории. Попробуйте обновить страницу.', 'error');
    }
}

function openAddProductModal() {
    // Clear form before opening
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    
    // Clear file input
    const fileInput = document.getElementById('productImages');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Clear image preview
    const previewDiv = document.getElementById('addProductImagePreview');
    if (previewDiv) {
        previewDiv.innerHTML = '';
    }
    
    const warningsDiv = document.getElementById('addProductImageWarnings');
    if (warningsDiv) {
        warningsDiv.innerHTML = '';
    }
    
    document.getElementById('addProductModal').classList.remove('hidden');
}

function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear all form fields
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    
    // Clear file input completely
    const fileInput = document.getElementById('productImages');
    if (fileInput) {
        fileInput.value = '';
        // Force clear by creating new input element
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
    }
    
    // Clear image preview
    const previewDiv = document.getElementById('addProductImagePreview');
    if (previewDiv) {
        previewDiv.innerHTML = '';
    }
    
    const warningsDiv = document.getElementById('addProductImageWarnings');
    if (warningsDiv) {
        warningsDiv.innerHTML = '';
    }
}

async function createProduct() {
    try {
        const name = document.getElementById('productName').value.trim();
        const priceInput = document.getElementById('productPrice').value;
        const price = parseFloat(priceInput);

        // Validate name
        const nameValidation = CommonUtils.validateInput(name, { 
            required: true, 
            minLength: 3, 
            maxLength: 200 
        });
        if (!nameValidation.valid) {
            showAlert(nameValidation.errors[0], 'error');
            return;
        }

        // Validate price
        if (!priceInput || isNaN(price) || price <= 0) {
            showAlert(MESSAGES.VALIDATION.INVALID_PRICE, 'error');
            return;
        }

        if (price > 1000000) {
            showAlert(MESSAGES.VALIDATION.MAX_AMOUNT(1000000), 'error');
            return;
        }

        let imageUrls = null;
        const fileInput = document.getElementById('productImages');

        if (fileInput.files.length > 0) {
            // Validate file count
            if (fileInput.files.length > APP_CONSTANTS.LIMITS.MAX_IMAGES_PER_PRODUCT) {
                showAlert(MESSAGES.VALIDATION.MAX_FILES(APP_CONSTANTS.LIMITS.MAX_IMAGES_PER_PRODUCT), 'error');
                return;
            }

            // Validate file sizes
            for (let file of fileInput.files) {
                if (file.size > APP_CONSTANTS.LIMITS.MAX_FILE_SIZE) {
                    const maxMB = APP_CONSTANTS.LIMITS.MAX_FILE_SIZE / (1024 * 1024);
                    showAlert(`${file.name}: ${MESSAGES.VALIDATION.MAX_FILE_SIZE(maxMB)}`, 'error');
                    return;
                }
            }

            const formData = new FormData();
            for (let file of fileInput.files) {
                formData.append('files', file);
            }

            const uploadResponse = await fetch(`${API_URL}${API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGES}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Client-Platform': localStorage.getItem('platform') || 'web'
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(MESSAGES.ERROR.UPLOADING_IMAGES + ': ' + errorText);
            }

            const uploadData = await uploadResponse.json();
            imageUrls = uploadData.urls.join(',');
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        const description = document.getElementById('productDescription').value.trim();
        if (description) {
            formData.append('description', description);
        }
        const categoryId = document.getElementById('productCategory').value;
        if (categoryId) {
            formData.append('category_id', categoryId);
        }
        if (imageUrls) {
            formData.append('image_urls', imageUrls);
        }

        const response = await fetch(`${API_URL}/api/v1/products/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Client-Platform': localStorage.getItem('platform') || 'web'
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(MESSAGES.ERROR.CREATING_PRODUCT + ': ' + errorText);
        }

        const createdProduct = await response.json();

        closeAddProductModal();
        await loadShopProducts();
    } catch (error) {
        CommonUtils.handleError('createProduct', error, true);
    }
}

async function openEditProduct(productId) {
    try {
        const product = await apiRequest(`/api/v1/products/${productId}`);

        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.category_id || '';

        window.currentProductImages = product.images || [];
        updateCurrentImagesDisplay();

        document.getElementById('editProductModal').classList.remove('hidden');
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_PRODUCT + ': ' + error.message, 'error');
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.add('hidden');
}

async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;

        let newImageUrls = [];
        const fileInput = document.getElementById('editProductImages');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            for (let file of fileInput.files) {
                formData.append('files', file);
            }

            const uploadResponse = await fetch(`${API_URL}${API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGES}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Client-Platform': localStorage.getItem('platform') || 'web'
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(MESSAGES.ERROR.UPLOADING_IMAGES);
            }

            const uploadData = await uploadResponse.json();
            newImageUrls = uploadData.urls;
        }

        const allImages = [...(window.currentProductImages || []), ...newImageUrls];

        const categoryId = document.getElementById('editProductCategory').value;
        const data = {
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value || null,
            price: parseFloat(document.getElementById('editProductPrice').value),
            category_id: categoryId ? parseInt(categoryId) : null,
            images: allImages
        };

        console.log('Updating product with data:', data);
        console.log('Selected categoryId:', categoryId, 'Parsed:', data.category_id);

        await apiRequest(API_ENDPOINTS.PRODUCTS.BY_ID(productId), 'PUT', data);
        closeEditProductModal();
        await loadShopProducts();
    } catch (error) {
        showAlert(MESSAGES.ERROR.UPDATING_PRODUCT + ': ' + error.message, 'error');
    }
}

function removeProductImage(index) {
    if (!window.currentProductImages) {
        return;
    }

    window.currentProductImages.splice(index, 1);

    updateCurrentImagesDisplay();

    showAlert(MESSAGES.SUCCESS.IMAGE_REMOVED, 'success');
}

function updateCurrentImagesDisplay() {
    const currentImagesDiv = document.getElementById('currentImages');
    if (!currentImagesDiv) return;

    if (!window.currentProductImages || window.currentProductImages.length === 0) {
        currentImagesDiv.innerHTML = '';
        return;
    }

    const imagesHTML = window.currentProductImages.map((img, idx) => {
        const imageUrl = formatImageUrl(img);

        return `
            <div class="image-upload-preview-item">
                <img src="${imageUrl}" alt="Product image ${idx + 1}" onerror="this.src='/assets/images/placeholder.png'">
                <button type="button" onclick="removeProductImage(${idx})" class="image-upload-preview-remove" title="Remove this image">×</button>
            </div>
        `;
    }).join('');

    currentImagesDiv.innerHTML = imagesHTML;
}

let confirmCallback = null;

window.showConfirmDialog = function(message) {
    return new Promise((resolve) => {
        const messageEl = document.getElementById('confirmMessage');
        const dialogEl = document.getElementById('confirmDialog');

        if (messageEl) messageEl.textContent = message;
        if (dialogEl) dialogEl.classList.remove('hidden');
        confirmCallback = resolve;
    });
};

window.closeConfirmDialog = function(result) {
    const dialogEl = document.getElementById('confirmDialog');
    dialogEl.classList.add('hidden');
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
};

window.deleteProduct = async function(productId) {
    const confirmed = await window.showConfirmDialog(MESSAGES.CONFIRMATION.DELETE_PRODUCT);

    if (!confirmed) {
        return;
    }

    try {
        const response = await apiRequest(API_ENDPOINTS.PRODUCTS.BY_ID(productId), 'DELETE');
        await loadShopProducts();
    } catch (error) {
        showAlert(MESSAGES.ERROR.DELETING_PRODUCT + ': ' + error.message, 'error');
    }
};

async function loadShopTransactions() {
    try {
        const container = document.getElementById('shopTransactions');
        if (!container) {
            return;
        }

        const transactions = await apiRequest(API_ENDPOINTS.SHOPS.TRANSACTIONS);

        if (transactions.length === 0) {
            container.innerHTML = `<p style="color: #999;">${MESSAGES.INFO.NO_TRANSACTIONS}</p>`;
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Date</th>
                        <th style="padding: 10px; text-align: left;">Type</th>
                        <th style="padding: 10px; text-align: right;">Amount</th>
                        <th style="padding: 10px; text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('en-US');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px;">${date}</td>
                                <td style="padding: 10px;">${MESSAGES.TRANSACTION.TYPE[t.type.toUpperCase().replace(/_/g, '_')] || t.type}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: ${t.amount > 0 ? '#10b981' : '#ef4444'};">
                                    ${t.amount > 0 ? '+' : ''}₸${t.amount.toFixed(2)}
                                </td>
                                <td style="padding: 10px; text-align: center;">
                                    <span style="padding: 4px 12px; background: ${t.status === 'completed' ? '#d1fae5' : '#fee2e2'}; color: ${t.status === 'completed' ? '#065f46' : '#991b1b'}; border-radius: 12px; font-size: 12px;">
                                        ${MESSAGES.TRANSACTION.STATUS[t.status.toUpperCase()] || t.status}
                                    </span>
                                </td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_TRANSACTIONS + ': ' + error.message, 'error');
    }
}

async function loadActiveRents() {
    try {
        const container = document.getElementById('activeRents');
        if (!container) {
            return;
        }

        const products = await apiRequest(API_ENDPOINTS.SHOPS.PRODUCTS);
        const activeRented = products.filter(p => p.is_active && p.rent_expires_at);

        if (activeRented.length === 0) {
            container.innerHTML = `<p style="color: #999;">${MESSAGES.INFO.NO_ACTIVE_RENTS}</p>`;
            return;
        }

        // Build rent cards array for DocumentFragment
        const rentCards = activeRented.map(product => {
            const expiresAt = new Date(product.rent_expires_at);
            const daysLeft = Math.ceil((expiresAt - new Date()) / APP_CONSTANTS.TIME.MILLISECONDS_PER_DAY);
            const isExpiringSoon = daysLeft <= APP_CONSTANTS.MODERATION.EXPIRING_SOON_DAYS;

            return `
                <div style="padding: 15px; border: 1px solid ${isExpiringSoon ? '#fbbf24' : '#e0e0e0'}; border-radius: 10px; margin-bottom: 10px; background: ${isExpiringSoon ? '#fffbeb' : 'white'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${product.name}</strong>
                            <div style="color: ${isExpiringSoon ? '#d97706' : '#666'}; font-size: 14px; margin-top: 5px;">
                                ${isExpiringSoon ? '⚠️ ' : ''}Expires in ${daysLeft} days (${expiresAt.toLocaleDateString('en-US')})
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="payRent(${product.id})">Extend</button>
                    </div>
                </div>
            `;
        });

        // Use DocumentFragment for better performance
        if (CommonUtils && CommonUtils.createDocumentFragment) {
            container.innerHTML = '';
            container.appendChild(CommonUtils.createDocumentFragment(rentCards));
        } else {
            container.innerHTML = rentCards.join('');
        }
    } catch (error) {
        showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
    }
}

async function payRent(productId) {
    try {
        const settings = await apiRequest(API_ENDPOINTS.ADMIN.SETTINGS);
        const rentPrice = settings.find(s => s.key === 'product_rent_price_monthly')?.value || APP_CONSTANTS.PAYMENT.DEFAULT_RENT_PRICE;

        const months = prompt(MESSAGES.PAYMENT.RENT_PROMPT(rentPrice), String(APP_CONSTANTS.MODERATION.DEFAULT_RENT_MONTHS));
        if (!months || isNaN(months) || months < 1) return;

        const payment = await apiRequest(API_ENDPOINTS.PAYMENTS.SHOP_RENT_PRODUCT, 'POST', {
            payment_type: APP_CONSTANTS.TRANSACTION.TYPE.PRODUCT_RENT,
            amount: rentPrice * parseInt(months),
            extra_data: {
                product_id: productId,
                months: parseInt(months)
            }
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;
        }
    } catch (error) {
        showAlert(MESSAGES.ERROR.CREATING_PAYMENT + ': ' + error.message, 'error');
    }
}

async function topUpShopBalance() {
    try {
        const amount = prompt(MESSAGES.PAYMENT.TOPUP_PROMPT, String(APP_CONSTANTS.PAYMENT.DEFAULT_TOPUP_AMOUNT));
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        const payment = await apiRequest(API_ENDPOINTS.PAYMENTS.SHOP_TOP_UP, 'POST', {
            payment_type: APP_CONSTANTS.TRANSACTION.TYPE.TOP_UP,
            amount: parseFloat(amount)
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;
        }
    } catch (error) {
        showAlert(MESSAGES.ERROR.CREATING_PAYMENT + ': ' + error.message, 'error');
    }
}

let wsInitialized = false;

function initShopWebSocket() {
    if (wsInitialized) {
        return;
    }

    if (window.wsManager && token) {
        if (window.wsManager.ws) {
            const state = window.wsManager.ws.readyState;
            if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
                return;
            }
        }

        window.wsManager.connect(token, 'shop');

        if (typeof CommonUtils !== 'undefined' && CommonUtils.addConnectionStatusIndicator) {
            CommonUtils.addConnectionStatusIndicator();
        }

        window.wsManager.onConnectionStateChange((state) => {
            updateConnectionStatus(state);
        });

        wsInitialized = true;
    }
}

function updateConnectionStatus(state) {
    const indicator = document.getElementById('wsConnectionStatus');
    if (!indicator) return;

    indicator.className = 'ws-status';

    switch (state) {
        case 'connected':
            indicator.classList.add('ws-status-connected');
            indicator.title = 'WebSocket connected';
            break;
        case 'connecting':
        case 'reconnecting':
            indicator.classList.add('ws-status-connecting');
            indicator.title = 'WebSocket connecting...';
            break;
        case 'disconnected':
        case 'error':
            indicator.classList.add('ws-status-disconnected');
            indicator.title = 'WebSocket disconnected';
            break;
    }
}

const originalLogout = logout;
logout = function() {
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalLogout();
};

const debouncedShopSearch = window.debounce ? window.debounce(() => {
    shopCurrentPage = 1;
    renderShopProductsPage();
}, 300) : () => {
    shopCurrentPage = 1;
    renderShopProductsPage();
};

function handleShopSearch() {
    const input = document.getElementById('shopSearchInput');
    if (input) {
        shopSearchQuery = input.value;
        debouncedShopSearch();
    }
}

function handleShopSort() {
    const select = document.getElementById('shopSortSelect');
    if (select) {
        shopSortBy = select.value;
        shopCurrentPage = 1;
        renderShopProductsPage();
    }
}

function handleShopStatusFilter() {
    const select = document.getElementById('shopStatusFilter');
    if (select) {
        shopStatusFilter = select.value;
        shopCurrentPage = 1;
        renderShopProductsPage();
    }
}

window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.createProduct = createProduct;
window.openEditProduct = openEditProduct;
window.closeEditProductModal = closeEditProductModal;
window.updateProduct = updateProduct;
window.removeProductImage = removeProductImage;
window.updateShopProfile = updateShopProfile;
window.payRent = payRent;
window.topUpShopBalance = topUpShopBalance;
window.changeShopPage = changeShopPage;
window.handleShopSearch = handleShopSearch;
window.handleShopSort = handleShopSort;
window.handleShopStatusFilter = handleShopStatusFilter;
