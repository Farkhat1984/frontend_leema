console.log('shop.js LOADED');

// API_URL теперь определяется в config.js
let token = localStorage.getItem('token');
let accountType = localStorage.getItem('accountType');

// Переменные для пагинации магазина
let shopCurrentPage = 1;
const shopItemsPerPage = 12;
let shopAllProducts = [];

// Проверка авторизации при загрузке
window.onload = async function () {
    console.log('Loading page...');
    console.log('Token:', token);
    console.log('AccountType:', accountType);

    if (token && accountType) {
        console.log('User is authenticated, loading dashboard...');
        if (accountType === 'shop') {
            console.log('Loading shop dashboard');
            await loadShopDashboard();
        } else if (accountType === 'admin') {
            console.log('Redirecting to admin page...');
            window.location.href = `${window.location.origin}/admin/index.html`;
        } else if (accountType === 'user') {
            console.log('User account type, redirecting to user page...');
            window.location.href = `${window.location.origin}/user/dashboard.html`;
        } else {
            console.log('Unknown account type:', accountType);
            window.location.href = `${window.location.origin}/public/index.html`;
        }
    } else {
        console.log('User not authenticated, redirecting to login');
        window.location.href = `${window.location.origin}/public/index.html`;
    }
};

// Вход через Google
async function loginWithGoogle(accountType = 'user') {
    try {
        // Определяем тип аккаунта для OAuth-запроса
        const params = new URLSearchParams({
            account_type: accountType,
            platform: 'web'
        });

        const response = await fetch(`${API_URL}/api/v1/auth/google/url?${params.toString()}`);
        const data = await response.json();

        // Перенаправляем на Google OAuth
        localStorage.setItem('requestedAccountType', accountType);
        window.location.href = data.authorization_url;
    } catch (error) {
        alert('Ошибка при получении URL авторизации: ' + error.message);
    }
}

// Выход
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('accountType');
    localStorage.removeItem('refresh_token');
    token = null;
    accountType = null;
    window.location.href = `${window.location.origin}/public/index.html`;
}

// API запрос
async function apiRequest(endpoint, method = 'GET', body = null) {
    const currentToken = localStorage.getItem('token');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка запроса');
    }

    return await response.json();
}

// Helper function to format image URL
function formatImageUrl(imageUrl) {
    console.log('🔍 formatImageUrl called with:', imageUrl);

    if (!imageUrl) return null;

    // If it's already a full URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('✅ Image URL is already full URL:', imageUrl);
        return imageUrl;
    }

    // If it starts with /, it's a path from root
    if (imageUrl.startsWith('/')) {
        const fullUrl = `${API_URL}${imageUrl}`;
        console.log('✅ Added API_URL to path:', fullUrl);
        return fullUrl;
    }

    // Otherwise, add both API_URL and /
    const fullUrl = `${API_URL}/${imageUrl}`;
    console.log('✅ Added API_URL and / to filename:', fullUrl);
    return fullUrl;
}

// Показать уведомление
function showAlert(message, type = 'success', container = 'alertContainer') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const alertContainer = document.getElementById(container);
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// === ПАНЕЛЬ МАГАЗИНА ===

async function loadShopDashboard() {
    // Redirect to index.html if not already there
    if (window.location.pathname.includes('/admin/')) {
        window.location.href = `${window.location.origin}/public/index.html`;
        return;
    }
    
    // Show dashboard if it exists (optional, may already be visible)
    const dashboardEl = document.getElementById('shopDashboard');
    if (dashboardEl) {
        dashboardEl.style.display = 'block';
    }

    try {
        // Инициализация WebSocket для магазина ПЕРВЫМ ДЕЛОМ
        // Это должно быть до загрузки данных, чтобы сразу начать получать события
        initShopWebSocket();
        
        // Загрузка информации о магазине
        const shopInfo = await apiRequest('/api/v1/shops/me');
        document.getElementById('shopName').textContent = shopInfo.shop_name;
        document.getElementById('shopAvatar').textContent = shopInfo.shop_name[0].toUpperCase();

        // Profile fields - only populate if they exist on the page
        const profileShopNameEl = document.getElementById('profileShopName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profileDescriptionEl = document.getElementById('profileDescription');
        if (profileShopNameEl) profileShopNameEl.value = shopInfo.shop_name;
        if (profileEmailEl) profileEmailEl.value = shopInfo.email;
        if (profileDescriptionEl) profileDescriptionEl.value = shopInfo.description || '';

        // Загрузка аналитики
        const analytics = await apiRequest('/api/v1/shops/me/analytics');
        document.getElementById('totalProducts').textContent = analytics.total_products;
        document.getElementById('activeProducts').textContent = analytics.active_products;
        document.getElementById('totalViews').textContent = analytics.total_views;
        document.getElementById('totalTryOns').textContent = analytics.total_try_ons;

        // Загрузка баланса и биллинга - only if elements exist
        const shopBalanceEl = document.getElementById('shopBalance');
        const shopTotalEarningsEl = document.getElementById('shopTotalEarnings');
        if (shopBalanceEl) shopBalanceEl.textContent = `$${shopInfo.balance.toFixed(2)}`;
        if (shopTotalEarningsEl) shopTotalEarningsEl.textContent = `$${analytics.total_revenue || 0}`;

        // Загрузка транзакций
        await loadShopTransactions();

        // Загрузка активных подписок
        await loadActiveRents();

        // Загрузка товаров
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadShopProducts() {
    console.log('🔄 loadShopProducts() called');

    // Check if we're on a page with products list
    const container = document.getElementById('productsList');
    if (!container) {
        console.log('⚠️ productsList element not found, skipping products load');
        return;
    }

    try {
        const products = await apiRequest('/api/v1/shops/me/products');
        console.log('📦 Products received:', products.length, products);
        shopAllProducts = products;
        console.log('📍 Container element:', container);

        if (products.length === 0) {
            console.log('⚠️ No products, showing empty state');
            container.innerHTML = '<div class="empty-state"><p>У вас пока нет товаров</p></div>';
            const paginationContainer = document.getElementById('shopPaginationContainer');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        renderShopProductsPage();
    } catch (error) {
        console.error('❌ Error in loadShopProducts:', error);
        showAlert('Ошибка загрузки товаров: ' + error.message, 'error');
    }
}

function renderShopProductsPage() {
    const container = document.getElementById('productsList');

    // Check if container exists
    if (!container) {
        console.log('⚠️ productsList element not found in renderShopProductsPage');
        return;
    }

    const startIndex = (shopCurrentPage - 1) * shopItemsPerPage;
    const endIndex = startIndex + shopItemsPerPage;
    const productsToShow = shopAllProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(shopAllProducts.length / shopItemsPerPage);

    console.log('🎨 Rendering', productsToShow.length, 'products to DOM');
    container.innerHTML = productsToShow.map(product => {
        // Format image URL using helper function
        let imageUrl = null;
        if (product.images && product.images.length > 0) {
            imageUrl = formatImageUrl(product.images[0]);
            console.log('Product:', product.name, 'Image URL:', imageUrl, 'Raw:', product.images[0]);
        }
        
        const createdDate = new Date(product.created_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="product-card">
                <!-- Секция 1: Изображение -->
                <div class="product-image">
                    ${imageUrl
                ? `<img src="${imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div style=&quot;color: #999; padding: 40px; text-align: center;&quot;>Ошибка загрузки</div>'">`
                : '<div style="color: #999; padding: 40px; text-align: center;">Нет изображения</div>'}
                </div>
                
                <!-- Секция 2: Информация о товаре -->
                <div class="product-info">
                    <div class="product-detail-row">
                        <span class="product-detail-label">Наименование</span>
                        <div class="product-detail-value product-name">${product.name || 'Без названия'}</div>
                    </div>
                    
                    <div class="product-detail-row">
                        <span class="product-detail-label">Цена</span>
                        <div class="product-detail-value product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="product-details">
                        <div class="product-detail-row">
                            <span class="product-detail-label">Описание</span>
                            <div class="product-detail-value product-description">
                                ${product.description || 'Нет описания'}
                            </div>
                        </div>
                        
                        <div class="product-detail-row">
                            <span class="product-detail-label">Дата добавления</span>
                            <div class="product-detail-value product-date">
                                ${createdDate}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Секция 3: Статус -->
                <div class="product-status-section">
                    <span class="product-status ${product.moderation_status === 'approved' ? 'status-approved' : product.moderation_status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                        ${product.moderation_status === 'pending' ? 'На модерации' :
                product.moderation_status === 'approved' ? 'Одобрен' : 'Отклонен'}
                    </span>
                </div>
                
                <!-- Секция 4: Действия -->
                <div class="product-actions">
                    <button class="btn btn-secondary" onclick="openEditProduct(${product.id})">Изменить</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Удалить</button>
                </div>
            </div>
        `;
    }).join('');

    // Обновляем пагинацию
    const paginationContainer = document.getElementById('shopPaginationContainer');
    if (paginationContainer) {
        if (totalPages > 1) {
            paginationContainer.style.display = 'flex';
            const pageInfo = document.getElementById('shopPageInfo');
            const prevBtn = document.getElementById('shopPrevPageBtn');
            const nextBtn = document.getElementById('shopNextPageBtn');

            if (pageInfo) pageInfo.textContent = `Страница ${shopCurrentPage} из ${totalPages}`;
            if (prevBtn) prevBtn.disabled = shopCurrentPage === 1;
            if (nextBtn) nextBtn.disabled = shopCurrentPage === totalPages;
        } else {
            paginationContainer.style.display = 'none';
        }
    }

    console.log('✅ DOM updated, container.innerHTML length:', container.innerHTML.length);
    console.log('✅ Products rendered successfully');
}

function changeShopPage(direction) {
    shopCurrentPage += direction;
    renderShopProductsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateShopProfile() {
    try {
        const profileShopNameEl = document.getElementById('profileShopName');
        const profileDescriptionEl = document.getElementById('profileDescription');

        if (!profileShopNameEl || !profileDescriptionEl) {
            console.log('⚠️ Profile form elements not found, skipping update');
            return;
        }

        const data = {
            shop_name: profileShopNameEl.value,
            description: profileDescriptionEl.value
        };

        await apiRequest('/api/v1/shops/me', 'PUT', data);
        showAlert('Профиль успешно обновлен', 'success');

        // Reload shop info in header
        const shopInfo = await apiRequest('/api/v1/shops/me');
        document.getElementById('shopName').textContent = shopInfo.shop_name;
        document.getElementById('shopAvatar').textContent = shopInfo.shop_name[0].toUpperCase();
    } catch (error) {
        showAlert('Ошибка обновления профиля: ' + error.message, 'error');
    }
}

function openAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
}

function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('active');
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImages').value = '';
}

async function createProduct() {
    try {
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);

        if (!name || !price) {
            showAlert('Заполните название и цену', 'error');
            return;
        }

        // Upload images first if any
        let imageUrls = null;
        const fileInput = document.getElementById('productImages');
        console.log('Files selected:', fileInput.files.length);

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            for (let file of fileInput.files) {
                console.log('Adding file to FormData:', file.name, file.type, file.size);
                formData.append('files', file);
            }

            console.log('Uploading images to:', `${API_URL}/api/v1/products/upload-images`);
            const uploadResponse = await fetch(`${API_URL}/api/v1/products/upload-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Upload response status:', uploadResponse.status);

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Upload failed:', errorText);
                throw new Error('Ошибка загрузки изображений: ' + errorText);
            }

            const uploadData = await uploadResponse.json();
            console.log('Upload response data:', uploadData);
            imageUrls = uploadData.urls.join(',');
            console.log('Image URLs joined:', imageUrls);
        }

        // Create product with form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        const description = document.getElementById('productDescription').value;
        if (description) {
            formData.append('description', description);
        }
        if (imageUrls) {
            formData.append('image_urls', imageUrls);
            console.log('Adding image_urls to product:', imageUrls);
        }

        console.log('Creating product at:', `${API_URL}/api/v1/products/`);
        console.log('Product data:', { name, price, description, imageUrls });

        const response = await fetch(`${API_URL}/api/v1/products/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Create product response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create product failed:', errorText);
            throw new Error('Ошибка создания товара: ' + errorText);
        }

        const createdProduct = await response.json();
        console.log('Product created successfully:', createdProduct);

        showAlert('Товар успешно создан и отправлен на модерацию', 'success');
        closeAddProductModal();
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка создания товара: ' + error.message, 'error');
    }
}

async function openEditProduct(productId) {
    try {
        const product = await apiRequest(`/api/v1/products/${productId}`);

        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductPrice').value = product.price;

        // Show current images with delete buttons
        window.currentProductImages = product.images || [];
        updateCurrentImagesDisplay();

        document.getElementById('editProductModal').classList.add('active');
    } catch (error) {
        showAlert('Ошибка загрузки товара: ' + error.message, 'error');
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('active');
}

async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;

        // Upload new images if any
        let newImageUrls = [];
        const fileInput = document.getElementById('editProductImages');
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            for (let file of fileInput.files) {
                formData.append('files', file);
            }

            const uploadResponse = await fetch(`${API_URL}/api/v1/products/upload-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Ошибка загрузки изображений');
            }

            const uploadData = await uploadResponse.json();
            newImageUrls = uploadData.urls;
        }

        // Combine old images (not deleted) with new ones
        const allImages = [...(window.currentProductImages || []), ...newImageUrls];

        console.log('Текущие изображения:', window.currentProductImages);
        console.log('Новые изображения:', newImageUrls);
        console.log('Все изображения для отправки:', allImages);

        // Update product
        const data = {
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDescription').value || null,
            price: parseFloat(document.getElementById('editProductPrice').value),
            images: allImages  // Always send array, even if empty
        };

        console.log('Данные для обновления продукта:', data);

        await apiRequest(`/api/v1/products/${productId}`, 'PUT', data);
        showAlert('Товар успешно обновлен', 'success');
        closeEditProductModal();
        await loadShopProducts();
    } catch (error) {
        showAlert('Ошибка обновления товара: ' + error.message, 'error');
    }
}

function removeProductImage(index) {
    if (!window.currentProductImages) {
        console.error('currentProductImages не определен');
        return;
    }

    console.log('Удаление изображения по индексу:', index);
    console.log('Массив до удаления:', [...window.currentProductImages]);

    // Удаляем изображение из массива
    window.currentProductImages.splice(index, 1);

    console.log('Массив после удаления:', [...window.currentProductImages]);

    // Принудительно обновляем DOM
    updateCurrentImagesDisplay();

    showAlert('Изображение удалено. Не забудьте нажать "Сохранить"!', 'success');
}

function updateCurrentImagesDisplay() {
    const currentImagesDiv = document.getElementById('currentImages');
    if (!currentImagesDiv) return;

    if (!window.currentProductImages || window.currentProductImages.length === 0) {
        currentImagesDiv.innerHTML = '<p style="color: #999; font-size: 14px;">Изображений нет</p>';
        return;
    }

    // Полностью перерисовываем
    const imagesHTML = window.currentProductImages.map((img, idx) => {
        const imageUrl = formatImageUrl(img);

        return `
            <div style="display: inline-block; position: relative; margin: 5px;">
                <img src="${imageUrl}" style="max-width: 100px; display: block; border: 1px solid #ddd; border-radius: 4px;" onerror="console.error('Failed to load image:', this.src); this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>Ошибка</text></svg>'">
                <button type="button" onclick="removeProductImage(${idx})" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; cursor: pointer; padding: 4px 8px; font-size: 14px; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Удалить это изображение">×</button>
            </div>
        `;
    }).join('');

    currentImagesDiv.innerHTML = '<strong>Текущие изображения:</strong><br>' + imagesHTML;
}

let confirmCallback = null;

window.showConfirmDialog = function(message) {
    console.log('showConfirmDialog called with message:', message);
    return new Promise((resolve) => {
        const messageEl = document.getElementById('confirmMessage');
        const dialogEl = document.getElementById('confirmDialog');
        console.log('confirmMessage element:', messageEl);
        console.log('confirmDialog element:', dialogEl);

        messageEl.textContent = message;
        dialogEl.classList.add('active');
        confirmCallback = resolve;
        console.log('Dialog shown, waiting for user action');
    });
};

window.closeConfirmDialog = function(result) {
    console.log('closeConfirmDialog called with result:', result);
    const dialogEl = document.getElementById('confirmDialog');
    dialogEl.classList.remove('active');
    if (confirmCallback) {
        console.log('Resolving promise with:', result);
        confirmCallback(result);
        confirmCallback = null;
    } else {
        console.warn('No confirmCallback found!');
    }
};

window.deleteProduct = async function(productId) {
    console.log('deleteProduct called with ID:', productId);
    const confirmed = await window.showConfirmDialog('Вы уверены, что хотите удалить этот товар?');
    console.log('User confirmed:', confirmed);

    if (!confirmed) {
        console.log('User cancelled deletion');
        return;
    }

    console.log('Sending DELETE request for product:', productId);
    try {
        await apiRequest(`/api/v1/products/${productId}`, 'DELETE');
        console.log('Product deleted successfully');
        showAlert('Товар успешно удален', 'success');
        await loadShopProducts();
        console.log('Product list reloaded');
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('Ошибка удаления товара: ' + error.message, 'error');
    }
};

async function loadShopTransactions() {
    try {
        const container = document.getElementById('shopTransactions');
        if (!container) {
            console.log('⚠️ shopTransactions element not found, skipping');
            return;
        }

        const transactions = await apiRequest('/api/v1/shops/me/transactions');

        if (transactions.length === 0) {
            container.innerHTML = '<p style="color: #999;">Транзакций пока нет</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #e0e0e0;">
                        <th style="padding: 10px; text-align: left;">Дата</th>
                        <th style="padding: 10px; text-align: left;">Тип</th>
                        <th style="padding: 10px; text-align: right;">Сумма</th>
                        <th style="padding: 10px; text-align: center;">Статус</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
            const typeNames = {
                product_rent: 'Аренда товара',
                product_purchase: 'Продажа товара',
                shop_payout: 'Выплата',
                top_up: 'Пополнение'
            };
            const statusNames = {
                pending: 'Ожидает',
                completed: 'Завершена',
                failed: 'Ошибка',
                refunded: 'Возврат'
            };
            const date = new Date(t.created_at).toLocaleDateString('ru-RU');
            return `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 10px;">${date}</td>
                                <td style="padding: 10px;">${typeNames[t.type] || t.type}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 600; color: ${t.amount > 0 ? '#10b981' : '#ef4444'};">
                                    ${t.amount > 0 ? '+' : ''}$${t.amount.toFixed(2)}
                                </td>
                                <td style="padding: 10px; text-align: center;">
                                    <span style="padding: 4px 12px; background: ${t.status === 'completed' ? '#d1fae5' : '#fee2e2'}; color: ${t.status === 'completed' ? '#065f46' : '#991b1b'}; border-radius: 12px; font-size: 12px;">
                                        ${statusNames[t.status] || t.status}
                                    </span>
                                </td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка загрузки транзакций:', error);
    }
}

async function loadActiveRents() {
    try {
        const container = document.getElementById('activeRents');
        if (!container) {
            console.log('⚠️ activeRents element not found, skipping');
            return;
        }

        const products = await apiRequest('/api/v1/shops/me/products');
        const activeRented = products.filter(p => p.is_active && p.rent_expires_at);

        if (activeRented.length === 0) {
            container.innerHTML = '<p style="color: #999;">Нет активных подписок на товары</p>';
            return;
        }

        container.innerHTML = activeRented.map(product => {
            const expiresAt = new Date(product.rent_expires_at);
            const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft <= 3;

            return `
                <div style="padding: 15px; border: 1px solid ${isExpiringSoon ? '#fbbf24' : '#e0e0e0'}; border-radius: 10px; margin-bottom: 10px; background: ${isExpiringSoon ? '#fffbeb' : 'white'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${product.name}</strong>
                            <div style="color: ${isExpiringSoon ? '#d97706' : '#666'}; font-size: 14px; margin-top: 5px;">
                                ${isExpiringSoon ? '⚠️ ' : ''}Истекает через ${daysLeft} дн. (${expiresAt.toLocaleDateString('ru-RU')})
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="payRent(${product.id})">Продлить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки подписок:', error);
    }
}

async function payRent(productId) {
    try {
        // Get settings to show rent price
        const settings = await apiRequest('/api/v1/admin/settings');
        const rentPrice = settings.find(s => s.key === 'product_rent_price_monthly')?.value || 10;

        const months = prompt(`Оплата аренды товара\n\nСтоимость: $${rentPrice}/месяц\n\nНа сколько месяцев продлить?`, '1');
        if (!months || isNaN(months) || months < 1) return;

        const payment = await apiRequest('/api/v1/payments/shop/rent-product', 'POST', {
            payment_type: 'product_rent',
            amount: rentPrice * parseInt(months),
            extra_data: {
                product_id: productId,
                months: parseInt(months)
            }
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;
            // Redirect to PayPal in same window
        }
    } catch (error) {
        showAlert('Ошибка создания платежа: ' + error.message, 'error');
    }
}

async function topUpShopBalance() {
    try {
        const amount = prompt('Введите сумму пополнения (USD):', '50');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        const payment = await apiRequest('/api/v1/payments/shop/top-up', 'POST', {
            payment_type: 'top_up',
            amount: parseFloat(amount)
        });

        if (payment.approval_url) {
            window.location.href = payment.approval_url;
            // Redirect to PayPal in same window
        }
    } catch (error) {
        showAlert('Ошибка создания платежа: ' + error.message, 'error');
    }
}

// === WEBSOCKET INTEGRATION ===

let wsInitialized = false; // Flag to prevent multiple initializations

function initShopWebSocket() {
    console.log('🔌 Initializing WebSocket for shop...');

    // Prevent multiple initializations
    if (wsInitialized) {
        console.log('⚠️ WebSocket already initialized, skipping...');
        return;
    }

    // Подключаемся к WebSocket
    if (window.wsManager && token) {
        // Disconnect existing connection if any
        if (window.wsManager.ws && window.wsManager.ws.readyState !== WebSocket.CLOSED) {
            console.log('🔄 Disconnecting existing WebSocket connection...');
            window.wsManager.disconnect();
        }

        window.wsManager.connect(token, 'shop');

        // Регистрируем обработчики событий
        setupShopWebSocketHandlers();

        // Добавляем индикатор статуса подключения
        addConnectionStatusIndicator();

        wsInitialized = true;
        console.log('✅ WebSocket initialized successfully');
    } else {
        console.error('❌ WebSocket manager or token not found');
    }
}

function setupShopWebSocketHandlers() {
    console.log('📡 Setting up WebSocket event handlers for shop...');
    
    // Clear existing handlers to prevent duplicates, but preserve internal handlers
    if (window.wsManager.eventHandlers) {
        // Only clear event handlers, not the entire object
        Object.keys(window.wsManager.eventHandlers).forEach(key => {
            window.wsManager.eventHandlers[key] = [];
        });
    } else {
        window.wsManager.eventHandlers = {};
    }
    
    // === Product Events ===
    window.wsManager.on('product.created', (data) => {
        console.log('📦 Product created:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем список товаров
        loadShopProducts();
    });

    window.wsManager.on('product.updated', (data) => {
        console.log('📦 Product updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем список товаров
        loadShopProducts();
    });

    window.wsManager.on('product.deleted', (data) => {
        console.log('🗑️ Product deleted:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем список товаров
        loadShopProducts();
    });

    window.wsManager.on('product.approved', (data) => {
        console.log('✅ Product approved:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем список товаров и баланс
        loadShopProducts();
        loadShopDashboard();
    });

    window.wsManager.on('product.rejected', (data) => {
        console.log('❌ Product rejected:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем список товаров
        loadShopProducts();
    });

    // === Balance Events ===
    window.wsManager.on('balance.updated', (data) => {
        console.log('💰 Balance updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем баланс
        const balanceElement = document.getElementById('shopBalance');
        if (balanceElement && data.data && data.data.new_balance !== undefined) {
            balanceElement.textContent = `$${data.data.new_balance.toFixed(2)}`;
        }
        loadShopTransactions();
    });

    // === Transaction Events ===
    window.wsManager.on('transaction.completed', (data) => {
        console.log('💳 Transaction completed:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем транзакции
        loadShopTransactions();
    });

    window.wsManager.on('transaction.failed', (data) => {
        console.log('❌ Transaction failed:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    // === Order Events ===
    window.wsManager.on('order.created', (data) => {
        console.log('🛍️ Order created:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    window.wsManager.on('order.completed', (data) => {
        console.log('✅ Order completed:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
        // Обновляем аналитику
        loadShopDashboard();
    });

    // === Review Events ===
    window.wsManager.on('review.created', (data) => {
        console.log('⭐ Review created:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    // === Settings Events ===
    window.wsManager.on('settings.updated', (data) => {
        console.log('⚙️ Settings updated:', data);
        if (window.notificationManager) {
            window.notificationManager.handleWebSocketEvent(data);
        }
    });

    // Обработчик изменения состояния подключения
    window.wsManager.onConnectionStateChange((state) => {
        updateConnectionStatus(state);
    });
    
    console.log('✅ WebSocket event handlers registered');
}

function addConnectionStatusIndicator() {
    const header = document.querySelector('.header .user-info');
    if (!header) return;

    // Создаем индикатор статуса подключения
    const indicator = document.createElement('div');
    indicator.id = 'wsConnectionStatus';
    indicator.className = 'ws-status';
    indicator.title = 'WebSocket статус';

    // Добавляем в header
    header.insertBefore(indicator, header.firstChild);

    // Устанавливаем начальный статус
    updateConnectionStatus(window.wsManager.getConnectionState());
}

function updateConnectionStatus(state) {
    const indicator = document.getElementById('wsConnectionStatus');
    if (!indicator) return;

    // Удаляем все классы статуса
    indicator.className = 'ws-status';

    // Добавляем класс в зависимости от статуса
    switch (state) {
        case 'connected':
            indicator.classList.add('ws-status-connected');
            indicator.title = 'WebSocket подключен';
            break;
        case 'connecting':
        case 'reconnecting':
            indicator.classList.add('ws-status-connecting');
            indicator.title = 'WebSocket подключается...';
            break;
        case 'disconnected':
        case 'error':
            indicator.classList.add('ws-status-disconnected');
            indicator.title = 'WebSocket отключен';
            break;
    }
}

// Отключаем WebSocket при выходе
const originalLogout = logout;
logout = function() {
    console.log('🔌 Disconnecting WebSocket on logout...');
    if (window.wsManager) {
        window.wsManager.disconnect();
    }
    originalLogout();
};

// Make functions globally accessible for inline onclick handlers
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
