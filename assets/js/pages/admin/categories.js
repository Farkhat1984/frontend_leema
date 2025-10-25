const AdminCategoriesModule = (function() {
    if (!localStorage.getItem('platform')) {
        localStorage.setItem('platform', 'web');
    }

    let state = {
        categories: [],
        filteredCategories: [],
        searchQuery: '',
        statusFilter: 'all',
        editingCategoryId: null,
        deletingCategoryId: null
    };

    const DOM = {
        get totalCategories() { return document.getElementById('totalCategories'); },
        get activeCategories() { return document.getElementById('activeCategories'); },
        get inactiveCategories() { return document.getElementById('inactiveCategories'); },
        get categoriesTableBody() { return document.getElementById('categoriesTableBody'); },
        get emptyState() { return document.getElementById('emptyState'); },
        get searchInput() { return document.getElementById('searchInput'); },
        get statusFilter() { return document.getElementById('statusFilter'); },
        get categoryModal() { return document.getElementById('categoryModal'); },
        get deleteModal() { return document.getElementById('deleteModal'); },
        get categoryForm() { return document.getElementById('categoryForm'); },
        get modalTitle() { return document.getElementById('modalTitle'); }
    };

    async function loadCategories() {
        try {
            const response = await fetch(`${API_URL}/api/v1/categories/`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load categories');
            }

            const data = await response.json();
            state.categories = data.categories || [];
            applyFilters();
            updateStats();
            renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            showAlert('Ошибка при загрузке категорий', 'error');
        }
    }

    function updateStats() {
        const total = state.categories.length;
        const active = state.categories.filter(c => c.is_active).length;
        const inactive = total - active;

        if (DOM.totalCategories) DOM.totalCategories.textContent = total;
        if (DOM.activeCategories) DOM.activeCategories.textContent = active;
        if (DOM.inactiveCategories) DOM.inactiveCategories.textContent = inactive;
    }

    function applyFilters() {
        let filtered = [...state.categories];

        // Search filter
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(cat => 
                cat.name.toLowerCase().includes(query) ||
                cat.slug.toLowerCase().includes(query) ||
                (cat.description && cat.description.toLowerCase().includes(query))
            );
        }

        // Status filter
        if (state.statusFilter === 'active') {
            filtered = filtered.filter(cat => cat.is_active);
        } else if (state.statusFilter === 'inactive') {
            filtered = filtered.filter(cat => !cat.is_active);
        }

        // Sort by order, then by name
        filtered.sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.name.localeCompare(b.name, 'ru');
        });

        state.filteredCategories = filtered;
    }

    function renderCategories() {
        const tbody = DOM.categoriesTableBody;
        const emptyState = DOM.emptyState;

        if (!tbody) return;

        if (state.filteredCategories.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        tbody.innerHTML = state.filteredCategories.map(category => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        ${category.icon_url ? `
                            <img src="${escapeHtml(category.icon_url)}" 
                                 alt="${escapeHtml(category.name)}"
                                 class="w-8 h-8 mr-3 rounded object-cover"
                                 onerror="this.style.display='none'">
                        ` : `
                            <div class="w-8 h-8 mr-3 bg-purple-100 rounded flex items-center justify-center">
                                <i class="fas fa-tag text-purple-600 text-sm"></i>
                            </div>
                        `}
                        <div>
                            <div class="text-sm font-medium text-gray-900">${escapeHtml(category.name)}</div>
                            <div class="text-xs text-gray-500">${escapeHtml(category.slug)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate" title="${escapeHtml(category.description || '')}">
                        ${escapeHtml(category.description || '—')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center text-sm text-gray-900">
                        <i class="fas fa-box text-purple-600 mr-2"></i>
                        ${category.products_count || 0}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-medium text-gray-900">${category.order}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${category.is_active ? `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i class="fas fa-check-circle mr-1"></i>
                            Активна
                        </span>
                    ` : `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <i class="fas fa-times-circle mr-1"></i>
                            Неактивна
                        </span>
                    `}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editCategory(${category.id})" 
                            class="text-purple-600 hover:text-purple-900 mr-3 transition-colors"
                            title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory(${category.id})" 
                            class="text-red-600 hover:text-red-900 transition-colors"
                            title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function showCreateModal() {
        state.editingCategoryId = null;
        if (DOM.modalTitle) {
            DOM.modalTitle.textContent = 'Создать категорию';
        }
        resetForm();
        showModal();
    }

    function editCategory(categoryId) {
        const category = state.categories.find(c => c.id === categoryId);
        if (!category) return;

        state.editingCategoryId = categoryId;
        
        if (DOM.modalTitle) {
            DOM.modalTitle.textContent = 'Редактировать категорию';
        }

        // Fill form with category data
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categorySlug').value = category.slug;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryIcon').value = category.icon_url || '';
        document.getElementById('categoryOrder').value = category.order;
        document.getElementById('categoryActive').checked = category.is_active;

        showModal();
    }

    function showModal() {
        if (DOM.categoryModal) {
            DOM.categoryModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (DOM.categoryModal) {
            DOM.categoryModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        resetForm();
    }

    function resetForm() {
        if (DOM.categoryForm) {
            DOM.categoryForm.reset();
        }
        document.getElementById('categoryId').value = '';
        state.editingCategoryId = null;
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('categoryName').value.trim(),
            slug: document.getElementById('categorySlug').value.trim(),
            description: document.getElementById('categoryDescription').value.trim() || null,
            icon_url: document.getElementById('categoryIcon').value.trim() || null,
            order: parseInt(document.getElementById('categoryOrder').value) || 0,
            is_active: document.getElementById('categoryActive').checked
        };

        // Validate slug
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            showAlert('Slug должен содержать только латинские буквы, цифры и дефис', 'error');
            return;
        }

        try {
            if (state.editingCategoryId) {
                // Update existing category
                await CommonUtils.apiRequest(`/api/v1/categories/${state.editingCategoryId}`, 'PUT', formData);
            } else {
                // Create new category
                await CommonUtils.apiRequest('/api/v1/categories/', 'POST', formData);
            }

            showAlert(
                state.editingCategoryId ? 'Категория успешно обновлена' : 'Категория успешно создана',
                'success'
            );
            
            closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            showAlert(error.message || 'Ошибка при сохранении категории', 'error');
        }
    }

    function deleteCategory(categoryId) {
        state.deletingCategoryId = categoryId;
        if (DOM.deleteModal) {
            DOM.deleteModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeDeleteModal() {
        if (DOM.deleteModal) {
            DOM.deleteModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        state.deletingCategoryId = null;
    }

    async function confirmDelete() {
        if (!state.deletingCategoryId) return;

        try {
            await CommonUtils.apiRequest(`/api/v1/categories/${state.deletingCategoryId}`, 'DELETE');

            showAlert('Категория успешно удалена', 'success');
            closeDeleteModal();
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showAlert(error.message || 'Ошибка при удалении категории', 'error');
        }
    }

    function handleSearch() {
        state.searchQuery = DOM.searchInput?.value || '';
        applyFilters();
        renderCategories();
    }

    function handleFilterChange() {
        state.statusFilter = DOM.statusFilter?.value || 'all';
        applyFilters();
        renderCategories();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const colors = {
            success: 'bg-green-50 text-green-800 border-green-200',
            error: 'bg-red-50 text-red-800 border-red-200',
            info: 'bg-blue-50 text-blue-800 border-blue-200',
            warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
        };

        const alert = document.createElement('div');
        alert.className = `${colors[type]} border rounded-lg p-4 mb-4 flex items-center justify-between animate-slide-in`;
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icons[type]} mr-3"></i>
                <span>${escapeHtml(message)}</span>
            </div>
            <button onclick="this.parentElement.remove()" class="text-current hover:opacity-70">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Auto-generate slug from name
    function setupSlugGeneration() {
        const nameInput = document.getElementById('categoryName');
        const slugInput = document.getElementById('categorySlug');

        if (nameInput && slugInput) {
            nameInput.addEventListener('input', function() {
                if (!state.editingCategoryId) {
                    const slug = this.value
                        .toLowerCase()
                        .replace(/[^a-z0-9а-яё\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/[а-яё]/g, char => {
                            const translit = {
                                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                                'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
                                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                                'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                                'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
                                'э': 'e', 'ю': 'yu', 'я': 'ya'
                            };
                            return translit[char] || char;
                        })
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    slugInput.value = slug;
                }
            });
        }
    }

    // Initialize
    function init() {
        // Setup event listeners
        if (DOM.categoryForm) {
            DOM.categoryForm.addEventListener('submit', handleFormSubmit);
        }

        setupSlugGeneration();

        // Load initial data
        loadCategories();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global functions
    window.showCreateModal = showCreateModal;
    window.editCategory = editCategory;
    window.deleteCategory = deleteCategory;
    window.closeModal = closeModal;
    window.closeDeleteModal = closeDeleteModal;
    window.confirmDelete = confirmDelete;
    window.handleSearch = handleSearch;
    window.handleFilterChange = handleFilterChange;

    return {
        loadCategories,
        showCreateModal,
        editCategory,
        deleteCategory
    };
})();
