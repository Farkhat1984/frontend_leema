// Страница настроек платформы

// Инициализировать platform перед любыми запросами
if (!localStorage.getItem('platform')) {
    localStorage.setItem('platform', 'web');
}

async function loadPageData() {
    try {
        // WebSocket для обновления в реальном времени от других администраторов
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'settings.updated': (data) => { onSettingsUpdate(data); }
            });
        }
        
        await loadSettings();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadSettings() {
    try {
        const settings = await apiRequest('/api/v1/admin/settings');
        const container = document.getElementById('settingsList');

        container.innerHTML = settings.map(setting => `
            <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all" id="setting_group_${setting.key}">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    ${setting.description || setting.key}
                </label>
                <div class="flex gap-3">
                    <input 
                        type="text" 
                        value="${setting.value}" 
                        id="setting_${setting.key}"
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                    <button 
                        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md whitespace-nowrap min-w-[140px]" 
                        onclick="updateSetting('${setting.key}')"
                    >
                        <i class="fas fa-save mr-2"></i>Сохранить
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки настроек: ' + error.message, 'error');
    }
}

async function updateSetting(key) {
    const buttonElement = event.target.closest('button');
    const originalButtonHtml = buttonElement.innerHTML;
    
    try {
        // Show loading state
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Сохранение...';
        
        const value = document.getElementById(`setting_${key}`).value;
        await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
        
        // Show success state
        buttonElement.innerHTML = '<i class="fas fa-check mr-2"></i>Сохранено';
        buttonElement.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        buttonElement.classList.add('bg-green-600');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            buttonElement.innerHTML = originalButtonHtml;
            buttonElement.classList.remove('bg-green-600');
            buttonElement.classList.add('bg-purple-600', 'hover:bg-purple-700');
            buttonElement.disabled = false;
        }, 2000);
        
    } catch (error) {
        // Reset button on error
        buttonElement.innerHTML = originalButtonHtml;
        buttonElement.disabled = false;
        showAlert('Ошибка обновления настройки: ' + error.message, 'error');
    }
}

// WebSocket handlers - обновляет поле когда другой админ меняет настройку
function onSettingsUpdate(data) {
    if (data.data && data.data.key) {
        const inputElement = document.getElementById(`setting_${data.data.key}`);
        const groupElement = document.getElementById(`setting_group_${data.data.key}`);
        
        if (inputElement && data.data.new_value !== undefined) {
            // Обновляем значение
            inputElement.value = data.data.new_value;
            
            // Показываем визуальную индикацию обновления
            if (groupElement) {
                groupElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                setTimeout(() => {
                    groupElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                }, 2000);
            }
        }
    }
}

// Make functions globally accessible
window.updateSetting = updateSetting;

// Автоматическая загрузка данных при инициализации страницы
loadPageData();
